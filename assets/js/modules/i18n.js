/**
 * Client-side translation.
 *
 * The HTML ships in English — that is what crawlers and no-JS visitors
 * get, and it doubles as the fallback when a key is missing. A language
 * file is fetched only when it is actually needed, so an English visitor
 * downloads no dictionary at all.
 *
 * Markup contract
 *   data-i18n="key"                     → textContent
 *   data-i18n-html="key"                → innerHTML (for text with links)
 *   data-i18n-attr="title=key; alt=k2"  → arbitrary attributes
 *
 * Scholarly content (paper titles, author lists, venues, abstracts) is
 * deliberately left untranslated: a citation is quoted, not localised.
 */

import { SITE, STORAGE_KEYS, storage } from './config.js';

const SUPPORTED = SITE.languages.map((language) => language.code);
const cache = new Map();

let current = SITE.defaultLang;
let dictionary = {};

/* ── Resolution ───────────────────────────────────────────── */

function fromQuery() {
  const value = new URLSearchParams(window.location.search).get('lang');
  return value && SUPPORTED.includes(value) ? value : null;
}

function fromBrowser() {
  const preferred = navigator.languages || [navigator.language || ''];
  for (const tag of preferred) {
    const code = String(tag).toLowerCase().split('-')[0];
    if (SUPPORTED.includes(code)) return code;
  }
  return null;
}

/** Explicit choice in the URL wins, then a stored choice, then the browser. */
export function resolveLang() {
  const stored = storage.get(STORAGE_KEYS.lang);
  return (
    fromQuery() ||
    (SUPPORTED.includes(stored) ? stored : null) ||
    fromBrowser() ||
    SITE.defaultLang
  );
}

/* ── Dictionary ───────────────────────────────────────────── */

async function loadDictionary(lang) {
  if (lang === SITE.defaultLang) return {};
  if (cache.has(lang)) return cache.get(lang);

  try {
    const response = await fetch(`/assets/i18n/${lang}.json`, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    cache.set(lang, data);
    return data;
  } catch {
    // Network or parse failure: the page simply stays in English.
    return {};
  }
}

export function t(key, fallback = '') {
  const value = dictionary[key];
  return typeof value === 'string' ? value : fallback;
}

export function getLang() {
  return current;
}

/* ── Applying ─────────────────────────────────────────────── */

function rememberSource(element, attribute, value) {
  // The English source lives in the markup, so it is captured once and
  // reused whenever the visitor switches back.
  const store = `data-src-${attribute}`;
  if (!element.hasAttribute(store)) element.setAttribute(store, value);
  return element.getAttribute(store);
}

function translateText(element) {
  const key = element.getAttribute('data-i18n');
  const source = rememberSource(element, 'text', element.textContent);
  element.textContent = t(key, source);
}

function translateHtml(element) {
  const key = element.getAttribute('data-i18n-html');
  const source = rememberSource(element, 'html', element.innerHTML);
  element.innerHTML = t(key, source);
}

function translateAttributes(element) {
  const pairs = element.getAttribute('data-i18n-attr').split(';');
  for (const pair of pairs) {
    const [rawAttr, rawKey] = pair.split('=');
    if (!rawAttr || !rawKey) continue;
    const attribute = rawAttr.trim();
    const source = rememberSource(element, attribute, element.getAttribute(attribute) || '');
    element.setAttribute(attribute, t(rawKey.trim(), source));
  }
}

/** Translates `root` and everything inside it. */
export function translate(root = document) {
  const scope = root === document ? document.documentElement : root;

  const walk = (selector, handler) => {
    if (scope.matches && scope.matches(selector)) handler(scope);
    scope.querySelectorAll(selector).forEach(handler);
  };

  walk('[data-i18n]', translateText);
  walk('[data-i18n-html]', translateHtml);
  walk('[data-i18n-attr]', translateAttributes);
}

/* ── Switching ────────────────────────────────────────────── */

export async function setLang(lang, { persist = true, updateUrl = true } = {}) {
  if (!SUPPORTED.includes(lang)) return;

  dictionary = await loadDictionary(lang);
  current = lang;

  document.documentElement.setAttribute('lang', lang);
  if (persist) storage.set(STORAGE_KEYS.lang, lang);

  if (updateUrl && window.history && window.history.replaceState) {
    // Keeps a shared link in the language the visitor was reading.
    const url = new URL(window.location.href);
    if (lang === SITE.defaultLang) url.searchParams.delete('lang');
    else url.searchParams.set('lang', lang);
    window.history.replaceState({}, '', url);
  }

  translate(document);
  document.dispatchEvent(new CustomEvent('i18n:change', { detail: { lang } }));
}

/* ── Switcher widget ──────────────────────────────────────── */

/** Renders the EN / FR toggle into every `[data-lang-switch]` container. */
export function renderSwitchers(root = document) {
  root.querySelectorAll('[data-lang-switch]').forEach((container) => {
    if (container.dataset.ready === 'true') return;

    const group = document.createElement('div');
    group.className = 'lang-switch';
    group.setAttribute('role', 'group');
    group.setAttribute('data-i18n-attr', 'aria-label=lang.label');
    group.setAttribute('aria-label', 'Language');

    SITE.languages.forEach((language) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = language.short;
      button.lang = language.code;
      button.dataset.lang = language.code;
      button.setAttribute('aria-pressed', String(language.code === current));
      button.title = language.label;
      button.addEventListener('click', () => setLang(language.code));
      group.appendChild(button);
    });

    container.appendChild(group);
    container.dataset.ready = 'true';
    translate(group);
  });

  syncSwitchers();
}

function syncSwitchers() {
  document.querySelectorAll('.lang-switch button[data-lang]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.lang === current));
  });
}

document.addEventListener('i18n:change', syncSwitchers);

/* ── Boot ─────────────────────────────────────────────────── */

export async function init() {
  const lang = resolveLang();
  // Skip the fetch entirely when English is already on screen.
  if (lang === SITE.defaultLang) {
    current = SITE.defaultLang;
    document.documentElement.setAttribute('lang', SITE.defaultLang);
    return current;
  }
  await setLang(lang, { persist: false, updateUrl: false });
  return current;
}
