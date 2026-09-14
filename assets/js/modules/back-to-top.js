/**
 * Floating "back to top" control, injected once per page and shown
 * after the visitor has scrolled past roughly one viewport.
 */

import { t } from './i18n.js';

const SHOW_AFTER = 600;

export function init() {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'to-top';
  button.setAttribute('data-i18n-attr', 'aria-label=a11y.backToTop; title=a11y.backToTop');
  button.setAttribute('aria-label', t('a11y.backToTop', 'Back to top'));
  button.setAttribute('title', t('a11y.backToTop', 'Back to top'));
  button.innerHTML = '<i class="fas fa-arrow-up" aria-hidden="true"></i>';

  button.addEventListener('click', () => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    document.querySelector('.nav-logo')?.focus();
  });

  document.body.appendChild(button);

  let ticking = false;
  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        button.classList.toggle('visible', window.scrollY > SHOW_AFTER);
        ticking = false;
      });
    },
    { passive: true }
  );
}
