/**
 * Reveals `.fade-up` blocks as they scroll into view.
 *
 * Anything that hides content behind an animation has to fail open:
 * when motion is reduced or IntersectionObserver is missing, every
 * block is shown immediately rather than staying invisible.
 */

export function init() {
  const items = document.querySelectorAll('.fade-up');
  if (!items.length) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduced || !('IntersectionObserver' in window)) {
    items.forEach((element) => element.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
  );

  items.forEach((element) => observer.observe(element));
}
