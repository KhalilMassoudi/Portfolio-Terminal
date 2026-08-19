/**
 * TERMINAL COMMANDS — pure logic, decoupled from the DOM.
 * Each command returns either:
 *   - a string / HTML string (printed to the terminal), or
 *   - an action object { type: 'clear' | 'navigate' | 'theme' | ... }
 * The terminal component decides how to render/execute the result.
 *
 * This separation means we can unit-test commands and add new ones
 * without touching rendering code.
 */

import { profile, skillGroups, projects, socials } from './content.js';

const link = (href, text) =>
  `<a href="${href}" target="_blank" rel="noopener noreferrer" class="term-link">${text}</a>`;

const escapeHtml = (str) =>
  str.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function buildCommands({ commandNames, windowManager, apps = [] }) {
  const appIds = apps.map((a) => a.id);
  const commands = {
    help: {
      description: 'List available commands',
      run: () => {
        const rows = Object.entries(commands)
          .map(
            ([name, c]) =>
              `<span class="term-cmd">${name.padEnd(10)}</span><span class="term-dim">${c.description}</span>`
          )
          .join('\n');
        return `Available commands:\n\n${rows}\n\nTip: use <span class="term-cmd">Tab</span> to autocomplete, <span class="term-cmd">↑/↓</span> for history.`;
      },
    },
    about: {
      description: 'Who I am',
      run: () => profile.bio,
    },
    skills: {
      description: 'My technical stack',
      run: () =>
        skillGroups
          .map(
            (g) =>
              `<span class="term-accent">${g.title}</span>\n  ${g.items.join(', ')}`
          )
          .join('\n\n'),
    },
    projects: {
      description: 'Things I have built',
      run: () =>
        projects
          .map(
            (p) =>
              `<span class="term-accent">${p.title}</span> <span class="term-dim">(${p.year})</span>\n  ${p.description}`
          )
          .join('\n\n'),
    },
    contact: {
      description: 'How to reach me',
      run: () =>
        socials.map((s) => `${s.label.padEnd(10)} ${link(s.href, s.value)}`).join('\n'),
    },
    open: {
      description: 'Open an app window (e.g. open projects)',
      run: (args) => {
        const id = (args[0] || '').toLowerCase();
        const app = apps.find((a) => a.id === id);
        if (!app) return `Usage: open &lt;app&gt;\nApps: ${appIds.join(', ')}`;
        if (app.action) {
          app.action(windowManager);
        } else {
          windowManager.open(app.id, app);
        }
        return `<span class="term-dim">Opening ${app.title}…</span>`;
      },
    },
    close: {
      description: 'Close an app window (e.g. close projects)',
      run: (args) => {
        const id = (args[0] || '').toLowerCase();
        if (!id) return 'Usage: close &lt;app&gt;';
        if (!windowManager.isOpen(id)) return `<span class="term-dim">"${escapeHtml(id)}" isn't open.</span>`;
        windowManager.close(id);
        return `<span class="term-dim">Closed ${id}.</span>`;
      },
    },
    windows: {
      description: 'List open app windows',
      run: () => {
        const open = windowManager.list();
        if (!open.length) return '<span class="term-dim">No windows open.</span>';
        return open
          .map((id) => {
            const flag = windowManager.isActive(id)
              ? ' <span class="term-dim">(active)</span>'
              : windowManager.isMinimized(id)
                ? ' <span class="term-dim">(minimized)</span>'
                : '';
            return `<span class="term-cmd">${id}</span>${flag}`;
          })
          .join('\n');
      },
    },
    theme: {
      description: 'Switch accent (amber | cyan | green)',
      run: (args) => {
        const t = (args[0] || '').toLowerCase();
        const valid = ['amber', 'cyan', 'green'];
        if (!valid.includes(t)) return `Usage: theme &lt;${valid.join(' | ')}&gt;`;
        return { type: 'theme', target: t, message: `Theme set to ${t}.` };
      },
    },
    whoami: {
      description: 'Quick identity',
      run: () => `${profile.name} — ${profile.role}. ${profile.status}.`,
    },
    resume: {
      description: 'Download my resume',
      run: () =>
        profile.resumeUrl
          ? { type: 'download', target: profile.resumeUrl, message: 'Opening resume…' }
          : 'Resume coming soon.',
    },
    clear: {
      description: 'Clear the terminal',
      run: () => ({ type: 'clear' }),
    },
  };

  if (commandNames) commandNames.push(...Object.keys(commands));
  return commands;
}
