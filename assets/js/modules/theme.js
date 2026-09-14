/**
 * Light / dark theme.
 *
 * The stored preference is applied by a tiny inline script in <head>
 * so the page never paints in the wrong theme. This module only owns
 * what happens afterwards: the toggle, the icon, the labels, and the
 * browser UI colour.
 *
 * Markup contract
 *   [data-theme-toggle] → any button that flips the theme
 *   [data-theme-icon]   → <i> whose class follows the theme
 *   [data-theme-label]  → text describing the theme it switches to
 */

import { STORAGE_KEYS, THEME_COLOURS, storage } from './config.js';
import { t } from './i18n.js';

const root = document.documentElement;

export function getTheme() {
  return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

export function applyTheme(theme, { persist = true } = {}) {
  root.setAttribute('data-theme', theme);
  if (persist) storage.set(STORAGE_KEYS.theme, theme);

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', THEME_COLOURS[theme]);

  syncControls(theme);
}

function syncControls(theme) {
  const dark = theme === 'dark';

  document.querySelectorAll('[data-theme-icon]').forEach((icon) => {
    icon.className = dark ? 'fas fa-sun' : 'fas fa-moon';
  });

  // The control announces the theme it switches *to*, not the current one.
  const label = dark
    ? t('theme.toLight', 'Switch to light mode')
    : t('theme.toDark', 'Switch to dark mode');

  document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
    button.setAttribute('aria-label', label);
    button.setAttribute('title', label);
    button.setAttribute('aria-pressed', String(dark));
  });

  document.querySelectorAll('[data-theme-label]').forEach((element) => {
    element.textContent = dark ? t('theme.light', 'Light mode') : t('theme.dark', 'Dark mode');
  });
}

export function toggleTheme() {
  applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
}

export function init() {
  applyTheme(getTheme(), { persist: false });

  // Delegated so controls created later (the mobile sheet) work too.
  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-theme-toggle]')) toggleTheme();
  });

  document.addEventListener('i18n:change', () => syncControls(getTheme()));

  // Follow the system only while the visitor has made no explicit choice.
  const query = window.matchMedia('(prefers-color-scheme: dark)');
  const onSystemChange = (event) => {
    if (!storage.get(STORAGE_KEYS.theme)) applyTheme(event.matches ? 'dark' : 'light', { persist: false });
  };
  if (query.addEventListener) query.addEventListener('change', onSystemChange);
}
