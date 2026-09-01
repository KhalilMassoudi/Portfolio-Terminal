/**
 * POST /api/request-cv — gate for the "Get my CV" flow.
 *
 * Not a security boundary (the PDF at CV_DOWNLOAD_URL is a public static
 * file like any /resume.pdf); this is a spam/lead-quality filter so the CV
 * isn't just handed to scrapers and throwaway addresses. Checks, in order:
 *   1. honeypot field (bots fill hidden inputs; humans never see it)
 *   2. email syntax
 *   3. disposable/throwaway domain blocklist
 *   4. MX record lookup (the domain must actually be able to receive mail)
 * On success: always returns a download link, and — if RESEND_API_KEY /
 * RESEND_FROM_EMAIL are configured on the Vercel project — also emails a
 * copy to the visitor.
 */
import { createRequire } from 'node:module';
import { resolveMx } from 'node:dns/promises';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(import.meta.url);
const disposableDomains = new Set(require('disposable-email-domains'));

const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const CV_PATH = path.join(process.cwd(), 'public', 'cv', 'khalil-massoudi-cv.pdf');
const CV_DOWNLOAD_URL = '/cv/khalil-massoudi-cv.pdf';
const CV_FILENAME = 'Khalil-Massoudi-CV.pdf';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, reason: 'Method not allowed.' });
    return;
  }

  const { name, email, company } = req.body || {};

  // Honeypot: real visitors never fill this hidden field. Report success
  // without doing anything, so a bot has no signal it was caught.
  if (company) {
    res.status(200).json({ ok: true, downloadUrl: CV_DOWNLOAD_URL, emailed: false });
    return;
  }

  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!cleanEmail || !EMAIL_RE.test(cleanEmail)) {
    res.status(200).json({ ok: false, reason: "That doesn't look like a valid email address." });
    return;
  }

  const domain = cleanEmail.split('@')[1];
  if (disposableDomains.has(domain)) {
    res
      .status(200)
      .json({ ok: false, reason: 'Please use a permanent email address rather than a temporary/disposable one.' });
    return;
  }

  try {
    const records = await resolveMx(domain);
    if (!records.length) throw new Error('no MX records');
  } catch (_) {
    res
      .status(200)
      .json({ ok: false, reason: "That email domain doesn't look like it can receive mail — double-check for a typo." });
    return;
  }

  let emailed = false;
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (apiKey && fromEmail) {
    try {
      const pdf = await readFile(CV_PATH);
      const cleanName = String(name || '').trim().slice(0, 60);
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: fromEmail,
          to: cleanEmail,
          subject: 'Khalil Massoudi — CV',
          text: `Hi${cleanName ? ` ${cleanName}` : ''},\n\nThanks for your interest — my CV is attached.\n\nBest,\nKhalil`,
          attachments: [{ filename: CV_FILENAME, content: pdf.toString('base64') }],
        }),
      });
      emailed = resendRes.ok;
    } catch (_) {
      emailed = false; // the download link below still works even if email delivery fails
    }
  }

  res.status(200).json({ ok: true, downloadUrl: CV_DOWNLOAD_URL, emailed });
}
