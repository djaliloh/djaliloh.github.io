/**
 * Navigation.
 *
 * Two jobs:
 *   1. mark the current page in the desktop bar, so the seven HTML
 *      files no longer hard-code `class="active"`;
 *   2. build the mobile tab bar and its "More" sheet from NAV.
 *
 * The tab bar is secondary navigation: the same links already exist
 * in the header and footer markup, so generating it costs nothing in
 * crawlability and keeps every page in sync.
 */

import { NAV, isCurrentPage } from './config.js';
import { renderSwitchers, translate } from './i18n.js';

let sheet = null;
let backdrop = null;
let lastFocused = null;

/* ── Desktop ──────────────────────────────────────────────── */

function markDesktopNav() {
  document.querySelectorAll('.nav-links a').forEach((link) => {
    const active = isCurrentPage(link.getAttribute('href'));
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

/* ── Sheet ────────────────────────────────────────────────── */

function setTriggersExpanded(expanded) {
  document.querySelectorAll('[data-sheet-trigger]').forEach((button) => {
    button.setAttribute('aria-expanded', String(expanded));
  });
}

export function closeSheet() {
  if (!sheet || !sheet.classList.contains('open')) return;
  sheet.classList.remove('open');
  backdrop.classList.remove('open');
  sheet.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('no-scroll');
  setTriggersExpanded(false);
  if (lastFocused && lastFocused.focus) lastFocused.focus();
}

export function openSheet() {
  if (!sheet) return;
  lastFocused = document.activeElement;
  sheet.classList.add('open');
  backdrop.classList.add('open');
  sheet.setAttribute('aria-hidden', 'false');
  document.body.classList.add('no-scroll');
  setTriggersExpanded(true);
  focusFirstItem();
}

/**
 * Moves focus into the sheet.
 *
 * This works only because .nav-sheet flips `visibility` with a zero-duration
 * transition on the way in: a hidden element cannot take focus, so animating
 * visibility would silently drop this call.
 */
function focusFirstItem() {
  const first = sheet.querySelector('a, button');
  if (first) first.focus();
}

/** Keeps Tab inside the sheet while it is open. */
function trapFocus(event) {
  if (event.key !== 'Tab' || !sheet || !sheet.classList.contains('open')) return;
  const focusable = sheet.querySelectorAll('a[href], button:not([disabled])');
  if (!focusable.length) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

/* ── Mobile ───────────────────────────────────────────────── */

function buildTabItem(item) {
  const link = document.createElement('a');
  link.className = 'tabbar-item';
  link.href = item.href;
  if (isCurrentPage(item.href)) {
    link.classList.add('active');
    link.setAttribute('aria-current', 'page');
  }
  link.innerHTML =
    `<i class="fas ${item.icon}" aria-hidden="true"></i>` +
    `<span class="tabbar-label" data-i18n="${item.key}">${item.fallback}</span>`;
  return link;
}

function buildMoreButton(secondary) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'tabbar-item';
  button.dataset.sheetTrigger = '';
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', 'navSheet');
  button.setAttribute('data-i18n-attr', 'aria-label=nav.more');
  button.setAttribute('aria-label', 'More');
  if (secondary.some((item) => isCurrentPage(item.href))) button.classList.add('active');

  button.innerHTML =
    '<i class="fas fa-ellipsis" aria-hidden="true"></i>' +
    '<span class="tabbar-label" data-i18n="nav.more">More</span>';

  button.addEventListener('click', () => {
    if (sheet.classList.contains('open')) closeSheet();
    else openSheet();
  });

  return button;
}

function buildSheet(secondary) {
  backdrop = document.createElement('div');
  backdrop.className = 'sheet-backdrop';
  backdrop.addEventListener('click', closeSheet);

  sheet = document.createElement('div');
  sheet.className = 'nav-sheet';
  sheet.id = 'navSheet';
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-modal', 'true');
  sheet.setAttribute('aria-hidden', 'true');
  sheet.setAttribute('data-i18n-attr', 'aria-label=nav.more');
  sheet.setAttribute('aria-label', 'More');

  const links = secondary
    .map((item) => {
      const active = isCurrentPage(item.href);
      return (
        `<a class="sheet-link${active ? ' active' : ''}" href="${item.href}"` +
        `${active ? ' aria-current="page"' : ''}>` +
        `<i class="fas ${item.icon}" aria-hidden="true"></i>` +
        `<span data-i18n="${item.key}">${item.fallback}</span></a>`
      );
    })
    .join('');

  sheet.innerHTML =
    '<div class="sheet-handle" aria-hidden="true"></div>' +
    `<div class="sheet-links">${links}</div>` +
    '<div class="sheet-actions">' +
    '<button type="button" class="sheet-link" data-theme-toggle>' +
    '<i class="fas fa-moon" data-theme-icon aria-hidden="true"></i>' +
    '<span data-theme-label>Dark mode</span></button>' +
    '<div class="sheet-langs" data-lang-switch></div>' +
    '</div>';

  // Any navigation closes the sheet; the theme button stays put.
  sheet.addEventListener('click', (event) => {
    if (event.target.closest('a.sheet-link')) closeSheet();
  });

  return sheet;
}

function buildMobileNav() {
  const primary = NAV.filter((item) => item.primary);
  const secondary = NAV.filter((item) => !item.primary);

  const bar = document.createElement('nav');
  bar.className = 'tabbar';
  bar.setAttribute('data-i18n-attr', 'aria-label=a11y.mobileNav');
  bar.setAttribute('aria-label', 'Mobile navigation');

  primary.forEach((item) => bar.appendChild(buildTabItem(item)));
  bar.appendChild(buildMoreButton(secondary));

  // buildSheet() assigns both `backdrop` and `sheet`, so call it first.
  const sheetElement = buildSheet(secondary);
  document.body.appendChild(backdrop);
  document.body.appendChild(sheetElement);
  document.body.appendChild(bar);

  renderSwitchers(sheet);
  translate(bar);
  translate(sheet);
}

export function init() {
  markDesktopNav();
  buildMobileNav();

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeSheet();
    trapFocus(event);
  });

  // A wide viewport has no sheet; leaving it open would lock scrolling.
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) closeSheet();
  });

  document.addEventListener('i18n:change', () => {
    const bar = document.querySelector('.tabbar');
    if (bar) translate(bar);
    if (sheet) translate(sheet);
  });
}
