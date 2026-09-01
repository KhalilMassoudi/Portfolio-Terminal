/**
 * APP REGISTRY — every window the desktop, dock, topbar, and terminal can
 * open. Content apps render straight from `data/content.js`; nothing here
 * duplicates data, only markup.
 */

import { profile, stats, skillGroups, projects, timeline, socials } from '../data/content.js';
import { Terminal } from './terminal.js';
import { typewriter } from './typewriter.js';

const chips = (items) => items.map((i) => `<span class="chip">${i}</span>`).join('');

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
      render: renderContact,
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
  ];

  if (profile.resumeUrl) {
    apps.push({
      id: 'resume',
      title: 'Résumé',
      icon: '&#8595;',
      inMenu: false,
      side: 'right',
      action: () => window.open(profile.resumeUrl, '_blank', 'noopener'),
    });
  }

  return apps;
}
