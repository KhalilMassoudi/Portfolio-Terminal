/**
 * APP REGISTRY — every window the desktop, dock, topbar, and terminal can
 * open. Content apps render straight from `data/content.js`; nothing here
 * duplicates data, only markup.
 */

import { profile, stats, skillGroups, projects, timeline, socials } from '../data/content.js';
import { Terminal } from './terminal.js';
import { typewriter } from './typewriter.js';

const chips = (items) => items.map((i) => `<span class="chip">${i}</span>`).join('');

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

function renderSkills(container) {
  container.innerHTML = `
    <div class="app app-skills">
      ${skillGroups
        .map(
          (g) => `
        <section class="skill-group">
          <h3 class="term-accent">${g.title}</h3>
          <div class="chip-row">${chips(g.items)}</div>
        </section>`
        )
        .join('')}
    </div>`;
}

function renderProjects(container) {
  container.innerHTML = `
    <div class="app app-projects">
      ${projects
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
        .join('')}
    </div>`;
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

function renderContact(container) {
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
      ${email ? `<a class="btn btn--accent" href="${email.href}">Say hello &rarr;</a>` : ''}
    </div>`;
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
      render: renderAbout,
    },
    {
      id: 'skills',
      title: 'Skills',
      icon: '#',
      width: 520,
      height: 420,
      inMenu: true,
      render: renderSkills,
    },
    {
      id: 'projects',
      title: 'Projects',
      icon: '&#9635;',
      width: 620,
      height: 520,
      inMenu: true,
      render: renderProjects,
    },
    {
      id: 'experience',
      title: 'Experience',
      icon: '&#9636;',
      width: 560,
      height: 480,
      inMenu: true,
      render: renderExperience,
    },
    {
      id: 'contact',
      title: 'Contact',
      icon: '&#9993;',
      width: 460,
      height: 400,
      inMenu: true,
      render: renderContact,
    },
    {
      id: 'terminal',
      title: 'Terminal',
      icon: '&gt;_',
      width: 640,
      height: 440,
      inMenu: false,
      bodyClass: 'window__body--flush',
      render: (container, wm) => new Terminal(container, { windowManager: wm, apps }),
    },
  ];

  if (profile.resumeUrl) {
    apps.push({
      id: 'resume',
      title: 'Résumé',
      icon: '&#8595;',
      inMenu: false,
      action: () => window.open(profile.resumeUrl, '_blank', 'noopener'),
    });
  }

  return apps;
}
