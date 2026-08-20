/**
 * TYPEWRITER — types/erases a rotating list of strings.
 * Respects prefers-reduced-motion (shows first string statically).
 */
export function typewriter(el, strings, opts = {}) {
  const { typeSpeed = 55, eraseSpeed = 28, hold = 1800, startDelay = 400 } = opts;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduce || !strings.length) {
    el.textContent = strings[0] || '';
    return () => {};
  }

  let strIdx = 0;
  let charIdx = 0;
  let erasing = false;
  let timer;

  const step = () => {
    const current = strings[strIdx];
    if (!erasing) {
      charIdx++;
      el.textContent = current.slice(0, charIdx);
      if (charIdx === current.length) {
        erasing = true;
        timer = setTimeout(step, hold);
        return;
      }
      timer = setTimeout(step, typeSpeed);
    } else {
      charIdx--;
      el.textContent = current.slice(0, charIdx);
      if (charIdx === 0) {
        erasing = false;
        strIdx = (strIdx + 1) % strings.length;
        timer = setTimeout(step, typeSpeed * 4);
        return;
      }
      timer = setTimeout(step, eraseSpeed);
    }
  };

  timer = setTimeout(step, startDelay);
  return () => clearTimeout(timer);
}
