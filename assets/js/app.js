/**
 * Entry point, loaded once per page with <script type="module">.
 *
 * Each concern lives in its own module under assets/js/modules/; this
 * file only decides the order they start in. Translations come first so
 * every widget built afterwards is created in the right language.
 */

import * as i18n from './modules/i18n.js';
import * as theme from './modules/theme.js';
import * as nav from './modules/nav.js';
import * as reveal from './modules/reveal.js';
import * as backToTop from './modules/back-to-top.js';
import * as clipboard from './modules/clipboard.js';
import * as pwa from './modules/pwa.js';

function stampYear() {
  const year = String(new Date().getFullYear());
  document.querySelectorAll('[data-year]').forEach((element) => {
    element.textContent = year;
  });
}

async function start() {
  stampYear();

  await i18n.init();
  i18n.renderSwitchers(document);

  // Navigation first: it builds the mobile sheet, which contains a second
  // theme toggle that theme.init() has to find in order to label it.
  nav.init();
  theme.init();
  reveal.init();
  backToTop.init();
  clipboard.init();
  pwa.init();
}

// Module scripts are deferred, but guard anyway so the entry point is
// safe to load from anywhere.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}
