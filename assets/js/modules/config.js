/**
 * Site-wide configuration.
 *
 * Adding a page means adding one entry to NAV: the desktop bar is
 * written in each HTML file for crawlers, but the mobile tab bar,
 * the "More" sheet and the active-link logic all read this list.
 */

export const SITE = {
  origin: 'https://djaliloh.github.io',
  defaultLang: 'en',
  languages: [
    { code: 'en', label: 'English', short: 'EN' },
    { code: 'fr', label: 'Français', short: 'FR' }
  ]
};

/**
 * `primary: true` puts the entry in the bottom tab bar; the rest go
 * behind the "More" button. Four primaries plus "More" is the most a
 * 360px screen fits without truncating labels.
 */
export const NAV = [
  { key: 'nav.home', fallback: 'Home', href: '/index.html', icon: 'fa-house', primary: true },
  { key: 'nav.publications', fallback: 'Publications', href: '/pages/publication.html', icon: 'fa-file-lines', primary: true },
  { key: 'nav.projects', fallback: 'Projects', href: '/pages/projects.html', icon: 'fa-diagram-project', primary: true },
  { key: 'nav.experience', fallback: 'Experience', href: '/pages/experience.html', icon: 'fa-briefcase', primary: true },
  { key: 'nav.teaching', fallback: 'Teaching', href: '/pages/teaching.html', icon: 'fa-chalkboard-user' },
  { key: 'nav.notes', fallback: 'Notes', href: '/pages/blog.html', icon: 'fa-pen-nib' },
  { key: 'nav.cv', fallback: 'CV', href: '/pages/curriculumv.html', icon: 'fa-id-card' }
];

export const STORAGE_KEYS = {
  theme: 'theme',
  lang: 'lang'
};

/** Colour of the browser UI, kept in step with the active theme. */
export const THEME_COLOURS = {
  light: '#4f46e5',
  dark: '#0f172a'
};

/**
 * localStorage throws in some privacy modes; every call goes through
 * these helpers so a failure degrades to "preference not remembered"
 * instead of breaking the page.
 */
export const storage = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* ignore */
    }
  }
};

/** "/" and "/index.html" are the same page; trailing slashes are noise. */
export function normalisePath(path) {
  if (!path) return '/index.html';
  const clean = path.split('#')[0].split('?')[0];
  if (clean === '/' || clean === '') return '/index.html';
  return clean.replace(/\/$/, '');
}

export function isCurrentPage(href) {
  return normalisePath(href) === normalisePath(window.location.pathname);
}
