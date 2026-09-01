/**
 * WINDOW MANAGER — owns every open "app" window: creation, focus/z-order,
 * dragging, resizing, minimize/restore, close, and open/close animation.
 *
 * Desktop icons, the dock, the topbar, and the terminal's `open`/`close`
 * commands all call the same instance, so every entry point stays in sync.
 */

const MIN_W = 300;
const MIN_H = 220;

function reduceMotion() {
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function isMobile() {
  return matchMedia('(max-width: 768px)').matches;
}

export class WindowManager {
  constructor(layerEl, { onChange } = {}) {
    this.layer = layerEl;
    this.onChangeCb = onChange || (() => {});
    this.windows = new Map();
    this.zCounter = 20;
    this.activeId = null;
    this._cascade = 0;

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.activeId) this.close(this.activeId);
    });
  }

  list() {
    return [...this.windows.keys()];
  }
  isOpen(id) {
    return this.windows.has(id);
  }
  isMinimized(id) {
    return !!this.windows.get(id)?.minimized;
  }
  isActive(id) {
    return this.activeId === id && !this.isMinimized(id);
  }

  open(id, opts = {}) {
    const existing = this.windows.get(id);
    if (existing) {
      if (existing.minimized) this.restore(id);
      else this.focus(id);
      return existing;
    }

    const { title = id, icon = '◆', render, width = 480, height = 420, bodyClass } = opts;
    const bounds = this.layer.getBoundingClientRect();
    const w = Math.min(width, Math.max(MIN_W, bounds.width - 32));
    const h = Math.min(height, Math.max(MIN_H, bounds.height - 32));
    const cascade = (this._cascade++ % 6) * 26;
    const x = Math.max(12, Math.round((bounds.width - w) / 2 + cascade - 70));
    const y = Math.max(12, Math.round((bounds.height - h) / 2 + cascade - 90));

    const el = document.createElement('section');
    el.className = 'window';
    el.dataset.id = id;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', title);
    el.style.setProperty('--w', w + 'px');
    el.style.setProperty('--h', h + 'px');
    el.style.translate = `${x}px ${y}px`;

    el.innerHTML = `
      <header class="window__bar" data-drag>
        <span class="window__dots">
          <button type="button" class="dot dot--r" data-close aria-label="Close ${title}"></button>
          <button type="button" class="dot dot--y" data-minimize aria-label="Minimize ${title}"></button>
          <span class="dot dot--g" aria-hidden="true"></span>
        </span>
        <button type="button" class="window__back" data-close aria-label="Back to desktop">&larr; Back</button>
        <span class="window__title"><span aria-hidden="true">${icon}</span> ${title}</span>
      </header>
      <div class="window__body" data-body></div>
      <span class="window__resize" data-resize aria-hidden="true"></span>
    `;

    this.layer.appendChild(el);

    const state = { id, el, x, y, w, h, minimized: false };
    this.windows.set(id, state);

    const body = el.querySelector('[data-body]');
    if (bodyClass) body.classList.add(bodyClass);
    if (typeof render === 'function') render(body, this);

    this._wire(state);
    this.focus(id);

    if (reduceMotion()) {
      el.classList.add('is-open');
    } else {
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-open')));
    }

    this._emit();
    return state;
  }

  close(id) {
    const w = this.windows.get(id);
    if (!w) return;
    this.windows.delete(id);
    if (this.activeId === id) this.activeId = null;

    w.el.classList.remove('is-open');
    w.el.classList.add('is-closing');
    const remove = () => w.el.remove();
    if (reduceMotion()) remove();
    else w.el.addEventListener('transitionend', remove, { once: true });

    this._emit();
  }

  rerender(id, render) {
    const w = this.windows.get(id);
    if (!w || typeof render !== 'function') return false;
    const body = w.el.querySelector('[data-body]');
    render(body, this);
    this.focus(id);
    return true;
  }

  focus(id) {
    const w = this.windows.get(id);
    if (!w) return;
    if (w.minimized) {
      this.restore(id);
      return;
    }
    this.activeId = id;
    this.zCounter += 1;
    w.el.style.zIndex = String(this.zCounter);
    this.windows.forEach((other) => other.el.classList.toggle('is-focused', other === w));
    w.el.querySelector('[data-drag]')?.focus?.({ preventScroll: true });
    this._emit();
  }

  toggleMinimize(id) {
    const w = this.windows.get(id);
    if (!w) return;
    if (w.minimized) this.restore(id);
    else this.minimize(id);
  }

  minimize(id) {
    const w = this.windows.get(id);
    if (!w) return;
    w.minimized = true;
    w.el.classList.add('is-minimized');
    if (this.activeId === id) this.activeId = null;
    this._emit();
  }

  restore(id) {
    const w = this.windows.get(id);
    if (!w) return;
    w.minimized = false;
    w.el.classList.remove('is-minimized');
    this.focus(id);
  }

  onChange(cb) {
    this.onChangeCb = cb;
  }

  _emit() {
    this.onChangeCb();
  }

  _wire(state) {
    const { el, id } = state;
    const drag = el.querySelector('[data-drag]');
    const resize = el.querySelector('[data-resize]');

    el.addEventListener('pointerdown', () => this.focus(id));
    el.querySelectorAll('[data-close]').forEach((btn) =>
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.close(id);
      })
    );
    el.querySelector('[data-minimize]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.minimize(id);
    });

    drag.addEventListener('pointerdown', (e) => {
      if (isMobile() || e.target.closest('button')) return;
      e.preventDefault();
      const bounds = this.layer.getBoundingClientRect();
      const startX = e.clientX;
      const startY = e.clientY;
      const originX = state.x;
      const originY = state.y;
      drag.setPointerCapture(e.pointerId);
      el.classList.add('is-dragging');

      const move = (ev) => {
        const maxX = bounds.width - 60;
        const maxY = bounds.height - 40;
        state.x = Math.min(Math.max(-40, originX + (ev.clientX - startX)), maxX);
        state.y = Math.min(Math.max(0, originY + (ev.clientY - startY)), maxY);
        el.style.translate = `${state.x}px ${state.y}px`;
      };
      const up = (ev) => {
        drag.releasePointerCapture(ev.pointerId);
        el.classList.remove('is-dragging');
        drag.removeEventListener('pointermove', move);
        drag.removeEventListener('pointerup', up);
      };
      drag.addEventListener('pointermove', move);
      drag.addEventListener('pointerup', up);
    });

    resize.addEventListener('pointerdown', (e) => {
      if (isMobile()) return;
      e.preventDefault();
      e.stopPropagation();
      const bounds = this.layer.getBoundingClientRect();
      const startX = e.clientX;
      const startY = e.clientY;
      const originW = state.w;
      const originH = state.h;
      resize.setPointerCapture(e.pointerId);
      this.focus(id);

      const move = (ev) => {
        const maxW = bounds.width - state.x - 8;
        const maxH = bounds.height - state.y - 8;
        state.w = Math.min(Math.max(MIN_W, originW + (ev.clientX - startX)), maxW);
        state.h = Math.min(Math.max(MIN_H, originH + (ev.clientY - startY)), maxH);
        el.style.setProperty('--w', state.w + 'px');
        el.style.setProperty('--h', state.h + 'px');
      };
      const up = (ev) => {
        resize.releasePointerCapture(ev.pointerId);
        resize.removeEventListener('pointermove', move);
        resize.removeEventListener('pointerup', up);
      };
      resize.addEventListener('pointermove', move);
      resize.addEventListener('pointerup', up);
    });
  }
}
