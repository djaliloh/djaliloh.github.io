/**
 * "Copy BibTeX" buttons on the publications page.
 *
 * Markup contract
 *   <button data-copy="idOfElement"><span data-copy-label>BibTeX</span></button>
 *
 * The citation itself stays visible in a <pre>, so a failed copy — an
 * insecure context, a denied permission — never hides the content.
 */

import { t } from './i18n.js';

const FEEDBACK_MS = 2000;

function legacyCopy(text) {
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();

  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  document.body.removeChild(area);
  return ok;
}

async function copy(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      /* fall through to the legacy path */
    }
  }
  return legacyCopy(text);
}

function flash(button) {
  const label = button.querySelector('[data-copy-label]');
  button.classList.add('copied');
  if (label) label.textContent = t('common.copied', 'Copied');

  window.setTimeout(() => {
    button.classList.remove('copied');
    if (label) label.textContent = t('common.bibtex', 'BibTeX');
  }, FEEDBACK_MS);
}

export function init() {
  document.querySelectorAll('[data-copy]').forEach((button) => {
    button.addEventListener('click', async () => {
      const source = document.getElementById(button.getAttribute('data-copy'));
      if (!source) return;
      if (await copy(source.textContent.trim())) flash(button);
    });
  });
}
