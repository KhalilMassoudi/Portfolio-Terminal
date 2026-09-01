/**
 * APP REGISTRY — every window the desktop, dock, topbar, and terminal can
 * open. Content apps render straight from `data/content.js`; nothing here
 * duplicates data, only markup.
 */

import { profile, stats, skillGroups, projects, timeline, socials, welcomeNote } from '../data/content.js';
import { Terminal } from './terminal.js';
import { typewriter } from './typewriter.js';

const chips = (items) => items.map((i) => `<span class="chip">${i}</span>`).join('');

const escapeHtml = (str) =>
  String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Set right before opening/rerendering the Projects window, consumed once by
// renderProjects — lets the Skills app deep-link into "projects that used
// this category" without Projects needing to know about Skills.
let projectsFilter = null;

function openProjectsForSkill(wm, apps, skillId) {
  const app = apps.find((a) => a.id === 'projects');
  if (!app) return;
  projectsFilter = skillId;
  if (!wm.rerender('projects', app.render)) wm.open('projects', app);
}

function openCvRequest(wm, apps) {
  const app = apps.find((a) => a.id === 'cv-request');
  if (!app) return;
  if (!wm.rerender('cv-request', app.render)) wm.open('cv-request', app);
}

function renderAbout(container) {
  container.innerHTML = `
    <div class="app app-about">
      <p class="app-about__greet">&rarr; Hello, I'm</p>
      <h2 class="app-about__name">${profile.name}</h2>
      <p class="app-about__role">${profile.role} &middot; <span class="tw" data-tw></span></p>
      <p class="app-about__bio">${profile.bio}</p>
      <ul class="app-about__facts">
        <li><span class="term-dim">Location</span><span>${profile.location}</span></li>
        <li><span class="term-dim">Status</span><span>${profile.status}</span></li>
      </ul>
      <div class="stat-row">
        ${stats.map((s) => `<div class="stat"><b>${s.value}${s.suffix}</b><span>${s.label}</span></div>`).join('')}
      </div>
    </div>`;
  typewriter(container.querySelector('[data-tw]'), profile.taglines);
}

function renderWelcome(container, wm, apps) {
  container.innerHTML = `
    <div class="app app-welcome">
      ${welcomeNote.paragraphs.map((p) => `<p>${p}</p>`).join('')}
      <button type="button" class="btn btn--accent btn--sm app-welcome__cta">${welcomeNote.cta} &rarr;</button>
    </div>`;

  container.querySelector('.app-welcome__cta').addEventListener('click', () => openCvRequest(wm, apps));
}

function renderCvRequest(container) {
  let values = { name: '', email: '' };

  const renderForm = ({ pending = false, error = '' } = {}) => {
    container.innerHTML = `
      <div class="app app-cv">
        <p class="app-cv__intro term-dim">Tell me where to send it — real addresses only, no lists, no spam.</p>
        <form class="cv-form" novalidate>
          <label class="cv-form__field">
            <span class="term-dim">Name</span>
            <input type="text" name="name" autocomplete="name" placeholder="Optional" value="${escapeHtml(values.name)}">
          </label>
          <label class="cv-form__field">
            <span class="term-dim">Email</span>
            <input type="email" name="email" autocomplete="email" placeholder="you@example.com" required value="${escapeHtml(values.email)}">
          </label>
          <label class="cv-form__honeypot" aria-hidden="true">
            <span>Company</span>
            <input type="text" name="company" tabindex="-1" autocomplete="off">
          </label>
          ${error ? `<p class="cv-form__error">${escapeHtml(error)}</p>` : ''}
          <button type="submit" class="btn btn--accent btn--sm" ${pending ? 'disabled' : ''}>${pending ? 'Checking…' : 'Request CV'}</button>
        </form>
      </div>`;

    container.querySelector('.cv-form').addEventListener('submit', onSubmit);
  };

  const renderResult = (data) => {
    const note = data.emailed
      ? "Sent — check your inbox in a minute. You can also grab it directly below."
      : 'Here&rsquo;s your download link.';
    container.innerHTML = `
      <div class="app app-cv app-cv--done">
        <p class="term-accent">You&rsquo;re verified.</p>
        <p>${note}</p>
        <a class="btn btn--accent btn--sm" href="${data.downloadUrl}" download="Khalil-Massoudi-CV.pdf">Download CV &rarr;</a>
      </div>`;
  };

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    values = { name: form.name.value, email: form.email.value };
    const company = form.company.value; // honeypot — real visitors never fill this

    renderForm({ pending: true });
    try {
      const res = await fetch('/api/request-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, company }),
      });
      const data = await res.json();
      if (data.ok) renderResult(data);
      else renderForm({ error: data.reason || 'Something went wrong — please try again.' });
    } catch (_) {
      renderForm({ error: 'Network error — please try again in a moment.' });
    }
  }

  renderForm();
}

function renderSkills(container, wm, apps) {
  const showList = () => {
    container.innerHTML = `
      <div class="app app-skills">
        <p class="app-skills__intro term-dim">Pick a category to see what's inside.</p>
        <div class="skill-cats">
          ${skillGroups
            .map(
              (g) => `
            <button type="button" class="skill-cat" data-cat="${g.id}">
              <span class="skill-cat__icon" aria-hidden="true">${g.icon}</span>
              <span class="skill-cat__title">${g.title}</span>
              <span class="skill-cat__blurb term-dim">${g.blurb}</span>
              <span class="skill-cat__count term-dim">${g.items.length} skills &rarr;</span>
            </button>`
            )
            .join('')}
        </div>
      </div>`;

    container.querySelectorAll('[data-cat]').forEach((btn) => {
      btn.addEventListener('click', () => showGroup(btn.dataset.cat));
    });
  };

  const showGroup = (id) => {
    const g = skillGroups.find((s) => s.id === id);
    if (!g) return showList();

    container.innerHTML = `
      <div class="app app-skills app-skills--detail">
        <button type="button" class="skill-back">&larr; All categories</button>
        <section class="skill-group">
          <h3 class="term-accent">${g.title}</h3>
          <p class="term-dim">${g.blurb}</p>
          <div class="chip-row">${chips(g.items)}</div>
          <button type="button" class="btn btn--accent btn--sm skill-group__cta">View related projects &rarr;</button>
        </section>
      </div>`;

    container.querySelector('.skill-back').addEventListener('click', showList);
    container.querySelector('.skill-group__cta').addEventListener('click', () => openProjectsForSkill(wm, apps, g.id));
  };

  showList();
}

function renderProjects(container) {
  const filterId = projectsFilter;
  projectsFilter = null; // one-shot — a normal reopen (icon/dock/menu) always shows everything

  const category = filterId ? skillGroups.find((g) => g.id === filterId) : null;
  const list = category ? projects.filter((p) => p.skills?.includes(filterId)) : projects;

  const showAll = () => renderProjects(container);

  container.innerHTML = `
    <div class="app app-projects">
      ${
        category
          ? `<div class="projects-filter">
              <span class="term-dim">Filtered by</span> <span class="term-accent">${category.title}</span>
              <button type="button" class="skill-back projects-filter__clear">Show all projects</button>
            </div>`
          : ''
      }
      ${
        list.length
          ? list
              .map(
                (p) => `
        <article class="project-card">
          <header class="project-card__head">
            <h3>${p.title}</h3>
            <span class="term-dim">${p.year}</span>
          </header>
          <p class="project-card__tagline term-accent">${p.tagline}</p>
          <p>${p.description}</p>
          <div class="chip-row">${chips(p.tags)}</div>
          ${
            p.links?.demo || p.links?.code
              ? `<div class="project-card__links">
                  ${p.links.demo ? `<a class="term-link" href="${p.links.demo}" target="_blank" rel="noopener">Live &#8599;</a>` : ''}
                  ${p.links.code ? `<a class="term-link" href="${p.links.code}" target="_blank" rel="noopener">Code &#8599;</a>` : ''}
                </div>`
              : ''
          }
        </article>`
              )
              .join('')
          : `<p class="term-dim">No projects tagged with ${category.title} yet — check back soon.</p>`
      }
    </div>`;

  container.querySelector('.projects-filter__clear')?.addEventListener('click', showAll);
}

function renderExperience(container) {
  container.innerHTML = `
    <div class="app app-experience">
      <ol class="timeline">
        ${timeline
          .map(
            (t) => `
          <li class="timeline__item timeline__item--${t.type}">
            <span class="timeline__marker" aria-hidden="true"></span>
            <div class="timeline__content">
              <h3>${t.title}</h3>
              <p class="term-dim">${t.org} &middot; ${t.period}</p>
              <p>${t.description}</p>
              ${t.tags?.length ? `<div class="chip-row">${chips(t.tags)}</div>` : ''}
            </div>
          </li>`
          )
          .join('')}
      </ol>
    </div>`;
}

function renderContact(container, wm, apps) {
  const email = socials.find((s) => s.id === 'email');
  container.innerHTML = `
    <div class="app app-contact">
      <p>Best way to reach me &mdash; I read everything.</p>
      <ul class="contact-list">
        ${socials
          .map(
            (s) => `
          <li>
            <span class="contact-list__label term-dim">${s.label}</span>
            <a class="term-link" href="${s.href}" target="_blank" rel="noopener">${s.value}</a>
          </li>`
          )
          .join('')}
      </ul>
      <div class="contact-ctas">
        ${email ? `<a class="btn btn--accent" href="${email.href}">Say hello &rarr;</a>` : ''}
        <button type="button" class="btn btn--sm contact-cta__cv">Get my CV &rarr;</button>
      </div>
    </div>`;

  container.querySelector('.contact-cta__cv').addEventListener('click', () => openCvRequest(wm, apps));
}

export function buildApps() {
  const apps = [
    {
      id: 'about',
      title: 'About Me',
      icon: '@',
      width: 560,
      height: 480,
      inMenu: true,
      side: 'left',
      render: renderAbout,
    },
    {
      id: 'skills',
      title: 'Skills',
      icon: '#',
      width: 560,
      height: 460,
      inMenu: true,
      side: 'left',
      render: (container, wm) => renderSkills(container, wm, apps),
    },
    {
      id: 'projects',
      title: 'Projects',
      icon: '&#9635;',
      width: 620,
      height: 520,
      inMenu: true,
      side: 'left',
      render: renderProjects,
    },
    {
      id: 'experience',
      title: 'Experience',
      icon: '&#9636;',
      width: 560,
      height: 480,
      inMenu: true,
      side: 'right',
      render: renderExperience,
    },
    {
      id: 'contact',
      title: 'Contact',
      icon: '&#9993;',
      width: 460,
      height: 400,
      inMenu: true,
      side: 'right',
      render: (container, wm) => renderContact(container, wm, apps),
    },
    {
      id: 'terminal',
      title: 'Terminal',
      icon: '&gt;_',
      width: 640,
      height: 440,
      inMenu: false,
      side: 'right',
      bodyClass: 'window__body--flush',
      render: (container, wm) => new Terminal(container, { windowManager: wm, apps }),
    },
    // Not desktop icons or dock entries (see `hidden` in desktop.js) — these
    // two are opened directly: welcome once at boot, cv-request from its CTA.
    {
      id: 'welcome',
      title: 'Welcome',
      icon: '~',
      width: 500,
      height: 480,
      inMenu: false,
      hidden: true,
      render: (container, wm) => renderWelcome(container, wm, apps),
    },
    {
      id: 'cv-request',
      title: 'Get CV',
      icon: '&#8595;',
      width: 420,
      height: 360,
      inMenu: false,
      hidden: true,
      render: renderCvRequest,
    },
  ];

  return apps;
}
