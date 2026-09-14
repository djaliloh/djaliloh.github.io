/**
 * Progressive web app wiring: register the service worker and, when
 * the browser offers it, surface an "install" button in the header.
 *
 * Everything here is an enhancement. A browser without service workers
 * or without beforeinstallprompt gets the plain site and no error.
 */

import { t } from './i18n.js';

let deferredPrompt = null;

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  const register = () =>
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* offline support is optional */
    });

  // Registration waits for load so it never competes with first paint, but
  // this module starts after an awaited translation fetch, so "load" may
  // already be behind us, in which case the listener would never fire.
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
}

function buildInstallButton() {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'theme-toggle';
  button.setAttribute('data-i18n-attr', 'aria-label=pwa.install; title=pwa.install');
  button.setAttribute('aria-label', t('pwa.install', 'Install this site as an app'));
  button.setAttribute('title', t('pwa.install', 'Install this site as an app'));
  button.innerHTML = '<i class="fas fa-circle-down" aria-hidden="true"></i>';

  button.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    // The prompt is single use; drop the button once it has been spent.
    deferredPrompt = null;
    button.remove();
  });

  return button;
}

function watchInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;

    const host = document.querySelector('[data-install-slot]');
    if (!host || host.dataset.ready === 'true') return;
    host.appendChild(buildInstallButton());
    host.dataset.ready = 'true';
  });
}

export function init() {
  registerServiceWorker();
  watchInstallPrompt();
}
