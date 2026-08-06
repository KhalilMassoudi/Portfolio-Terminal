/**
 * MAIN — application bootstrap.
 * Phase A: renders navigation + section scaffolding from the data layer,
 * wires scroll/active-link/mobile-menu behavior. Rich sections and the
 * interactive terminal are layered on in Phases B–D.
 */

import { nav, profile } from '../data/content.js';

/* ---------- Navigation ---------- */
function renderNav() {
  const linksEl = document.getElementById('nav-links');
  linksEl.innerHTML = nav
    .map((n) => `<a class="nav__link" href="#${n.id}" data-nav="${n.id}">${n.label}</a>`)
    .join('');
}

function wireNavBehavior() {
  const navEl = document.getElementById('site-nav');
  const toggle = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');

  // Elevated nav background after scrolling
  const onScroll = () => navEl.classList.toggle('is-scrolled', window.scrollY > 20);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile menu
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  links.addEventListener('click', (e) => {
    if (e.target.matches('.nav__link')) {
      links.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  // Scroll-spy: highlight the section in view
  const sections = [...document.querySelectorAll('main .section')];
  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          document
            .querySelectorAll('.nav__link')
            .forEach((l) => l.classList.toggle('is-active', l.dataset.nav === entry.target.id));
        }
      });
    },
    { rootMargin: `-40% 0px -55% 0px` }
  );
  sections.forEach((s) => spy.observe(s));
}

/* ---------- Temporary Phase-A section placeholders ---------- */
function renderPlaceholders() {
  const map = {
    home: `<div class="container"><p class="term-dim" style="font-family:var(--font-mono)">&gt; booting portfolio.sh …</p>
      <h1 style="font-size:var(--fs-3xl);margin:.3em 0">${profile.name}</h1>
      <p style="font-size:var(--fs-md);color:var(--c-accent);font-family:var(--font-mono)">${profile.role} · ${profile.taglines[0]}</p>
      <p style="max-width:52ch;color:var(--c-text-muted);margin-top:1rem">Foundation ready. Hero terminal &amp; sections land in the next phases.</p></div>`,
  };
  document.querySelectorAll('main .section').forEach((s) => {
    const id = s.dataset.section;
    s.innerHTML =
      map[id] ||
      `<div class="container"><h2 style="font-size:var(--fs-xl);color:var(--c-text-muted)">${id}</h2><p class="term-dim">Section scaffolded — content arrives in Phase C.</p></div>`;
  });
}

function renderFooter() {
  document.getElementById('site-footer').innerHTML =
    `<div class="container">&gt; built in a terminal · © ${new Date().getFullYear()} ${profile.name}</div>`;
}

/* ---------- Boot ---------- */
function init() {
  renderNav();
  renderPlaceholders();
  renderFooter();
  wireNavBehavior();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
