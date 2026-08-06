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

export function buildCommands({ commandNames }) {
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
    goto: {
      description: 'Jump to a section (e.g. goto projects)',
      run: (args) => {
        const target = (args[0] || '').toLowerCase();
        const valid = ['home', 'about', 'skills', 'projects', 'experience', 'contact'];
        if (!valid.includes(target)) {
          return `Usage: goto &lt;section&gt;\nSections: ${valid.join(', ')}`;
        }
        return { type: 'navigate', target, message: `Navigating to ${target}…` };
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
