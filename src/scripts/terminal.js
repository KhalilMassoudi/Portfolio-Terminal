/**
 * TERMINAL — an accessible, self-contained interactive terminal component.
 *
 * Design decisions (why this is better than the legacy version):
 *  - A single hidden <input> captures keystrokes → native mobile keyboard,
 *    paste, IME/accent support, and no global document-level listeners.
 *  - Fully scoped: multiple instances never leak events into each other.
 *  - Output announced via aria-live for screen readers.
 *  - Command logic is imported (pure) — this file only renders/orchestrates.
 */

import { buildCommands } from '../data/commands.js';
import { profile } from '../data/content.js';
import { applyTheme } from './theme.js';

const PROMPT = `${profile.handle}@${profile.host}:~$`;

export class Terminal {
  constructor(mountEl, { windowManager, onTheme, apps = [] } = {}) {
    this.mount = mountEl;
    this.windowManager = windowManager;
    this.onTheme = onTheme || applyTheme;
    this.history = [];
    this.historyIndex = -1;
    this.commandNames = [];
    this.commands = buildCommands({
      commandNames: this.commandNames,
      windowManager,
      apps,
    });
    this.render();
    this.bind();
  }

  render() {
    this.mount.innerHTML = `
      <div class="terminal" role="group" aria-label="Interactive portfolio terminal">
        <div class="terminal__screen" tabindex="0" role="log" aria-live="polite" aria-label="Terminal output">
          <div class="terminal__output" data-output></div>
          <div class="terminal__line" data-inputline>
            <span class="terminal__prompt">${PROMPT}</span>
            <span class="terminal__typed" data-typed></span>
            <span class="terminal__caret" aria-hidden="true"></span>
            <input class="terminal__capture" data-capture aria-label="Terminal command input"
                   autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" />
          </div>
        </div>
      </div>`;

    this.el = this.mount.querySelector('.terminal');
    this.screen = this.mount.querySelector('.terminal__screen');
    this.output = this.mount.querySelector('[data-output]');
    this.typed = this.mount.querySelector('[data-typed]');
    this.input = this.mount.querySelector('[data-capture]');
    this.line = this.mount.querySelector('[data-inputline]');

    this.printWelcome();
  }

  bind() {
    // Focus the hidden input whenever the terminal area is clicked/tapped.
    this.screen.addEventListener('click', () => this.input.focus());
    this.screen.addEventListener('focus', () => this.input.focus());

    // Mirror input value into the visible typed span.
    this.input.addEventListener('input', () => {
      this.typed.textContent = this.input.value;
    });

    this.input.addEventListener('focus', () => this.el.classList.add('is-focused'));
    this.input.addEventListener('blur', () => this.el.classList.remove('is-focused'));

    this.input.addEventListener('keydown', (e) => this.onKey(e));
  }

  onKey(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.execute(this.input.value);
      this.input.value = '';
      this.typed.textContent = '';
    } else if (e.key === 'Tab') {
      e.preventDefault();
      this.autocomplete();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.recall(-1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.recall(1);
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      this.output.innerHTML = '';
    }
  }

  autocomplete() {
    const val = this.input.value.trim().toLowerCase();
    if (!val) return;
    const matches = this.commandNames.filter((c) => c.startsWith(val));
    if (matches.length === 1) {
      this.input.value = matches[0] + ' ';
      this.typed.textContent = this.input.value;
    } else if (matches.length > 1) {
      this.print(`<span class="term-dim">${matches.join('   ')}</span>`);
    }
  }

  recall(dir) {
    if (!this.history.length) return;
    this.historyIndex = Math.max(0, Math.min(this.history.length, this.historyIndex + dir));
    const cmd = this.history[this.historyIndex] || '';
    this.input.value = cmd;
    this.typed.textContent = cmd;
  }

  execute(raw) {
    const input = raw.trim();
    this.echo(input);
    if (!input) return;

    this.history.push(input);
    this.historyIndex = this.history.length;

    const [name, ...args] = input.split(/\s+/);
    const cmd = this.commands[name.toLowerCase()];

    if (!cmd) {
      this.print(
        `<span class="term-err">command not found: ${escapeHtml(name)}</span>\nType <span class="term-cmd">help</span> for a list.`
      );
      return;
    }

    const result = cmd.run(args);
    this.handleResult(result);
  }

  handleResult(result) {
    if (typeof result === 'string') {
      this.print(result, true);
      return;
    }
    if (!result || typeof result !== 'object') return;

    switch (result.type) {
      case 'clear':
        this.output.innerHTML = '';
        break;
      case 'theme':
        this.onTheme(result.target);
        this.print(`<span class="term-dim">${result.message}</span>`);
        break;
      case 'download':
        if (result.message) this.print(`<span class="term-dim">${result.message}</span>`);
        window.open(result.target, '_blank', 'noopener');
        break;
      default:
        if (result.message) this.print(result.message);
    }
  }

  echo(input) {
    const el = document.createElement('div');
    el.className = 'terminal__entry';
    el.innerHTML = `<span class="terminal__prompt">${PROMPT}</span> ${escapeHtml(input)}`;
    this.output.appendChild(el);
    this.scrollToEnd();
  }

  /** Print output; optionally type it out character-by-line for flavor. */
  print(html, animate = false) {
    const el = document.createElement('div');
    el.className = 'terminal__result';
    this.output.appendChild(el);

    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!animate || reduce) {
      el.innerHTML = html;
      this.scrollToEnd();
      return;
    }
    // Reveal line-by-line (cheap, smooth, avoids per-char reflow on HTML).
    const lines = html.split('\n');
    let i = 0;
    const tick = () => {
      el.innerHTML = lines.slice(0, i + 1).join('\n');
      this.scrollToEnd();
      i++;
      if (i < lines.length) setTimeout(tick, 55);
    };
    tick();
  }

  printWelcome() {
    this.output.innerHTML = `<div class="terminal__result term-dim">Welcome. This is a live shell — try <span class="term-cmd">help</span>, <span class="term-cmd">open projects</span>, or <span class="term-cmd">theme cyan</span>.</div>`;
  }

  scrollToEnd() {
    this.screen.scrollTop = this.screen.scrollHeight;
  }

  focus() {
    this.input.focus();
  }
}

function escapeHtml(str) {
  return str.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );
}
