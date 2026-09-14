# djaliloh.github.io

Personal research portfolio of **Abdoul Djalil Ousseini Hamza** — Research Engineer in
computer vision, machine learning and digital plant phenotyping at INRAE / IRHS, Angers.

Live at **<https://djaliloh.github.io/>**.

Static site: no build step, no dependencies to install, no framework. GitHub Pages serves the
files exactly as they are in this repository.

---

## Running it locally

ES modules and the service worker both need a real HTTP origin, so opening `index.html`
straight from the filesystem will not work. Any static server will do:

```bash
python -m http.server 8000
# then open http://localhost:8000/
```

The service worker caches aggressively. While developing, tick **Application → Service
Workers → Update on reload** in the browser devtools, or use a private window.

---

## Layout

```
index.html, 404.html, offline.html   Home, not-found, offline fallback
pages/                               Publications, projects, experience, teaching, notes, CV

styles/
  styles.css                         Index — @imports the partials below, in order
  base/       tokens.css             Colours, typography, spacing, light/dark palettes
              reset.css              Reset and base typography
              utilities.css          Skip link, focus rings, scroll reveal, back-to-top
              print.css              Print / PDF rendering
  layout/     container.css          Widths, sections, grids, page header, breadcrumb
              nav.css                Sticky top bar, theme toggle, language switcher
              tabbar.css             Mobile bottom tab bar and its "More" sheet
              footer.css
  components/ buttons.css            Buttons, tags, status badges
              cards.css              Generic cards, project cards, interest tiles
              hero.css               Home hero, key figures, contact call to action
              publications.css       Citations, abstracts, BibTeX blocks
              timeline.css           Experience timeline and skill groups
              teaching.css           Course cards and note placeholders

assets/
  js/app.js                          Entry point — decides module start order only
  js/modules/config.js               Navigation list, site constants, storage helpers
            i18n.js                  Translation engine
            theme.js                 Light / dark
            nav.js                   Active link, mobile tab bar, "More" sheet
            reveal.js                Scroll reveal
            back-to-top.js
            clipboard.js             "Copy BibTeX"
            pwa.js                   Service worker + install prompt
  i18n/fr.json                       French translations (see below)
  icons/                             Favicon, PWA icons
  og/og-cover.png                    1200×630 social sharing card

manifest.webmanifest                 PWA manifest
sw.js                                Service worker
sitemap.xml, robots.txt              Search engine metadata
tools/check-i18n.py                  Translation completeness report
```

Responsive rules live in the file of the component they adjust, not in one shared
breakpoint file, so a component can be changed or removed in one place.

---

## Translations

The site ships in **English** and **French**. English is the source: it is written directly
in the HTML, which is what search engines and visitors without JavaScript get. French is
applied at runtime from `assets/i18n/fr.json`, so an English visitor downloads no
dictionary at all.

Mark up a translatable string with one of:

| Attribute | Effect |
| --- | --- |
| `data-i18n="key"` | replaces the element's text |
| `data-i18n-html="key"` | replaces the element's HTML (for text containing links) |
| `data-i18n-attr="title=key; aria-label=key2"` | replaces attributes |

Then add the key to `assets/i18n/fr.json`. A missing key simply falls back to the English
in the markup — nothing breaks.

Publication titles, author lists, venues and abstracts are **deliberately left in English**
in both languages: a citation is quoted, not localised.

The chosen language is resolved from `?lang=fr` in the URL, then a previous choice in
`localStorage`, then the browser's `Accept-Language`. Switching language rewrites the URL,
so a shared link keeps the language the reader was using.

After adding or renaming a key:

```bash
python tools/check-i18n.py --strict
```

It reports keys that are missing from a translation file, keys no longer referenced, and
empty strings.

---

## Adding a page

1. Copy an existing page in `pages/` — the `<head>`, header and footer are the template.
2. Update `<title>`, the description, `canonical`, the `hreflang` links, `og:url` and the
   JSON-LD `BreadcrumbList`.
3. Add the link to the desktop `.nav-links` block of every page (those stay in the HTML so
   crawlers see them).
4. Add one entry to `NAV` in `assets/js/modules/config.js`. The mobile tab bar, the "More"
   sheet and the active-link highlight all follow from it.
5. Add the URL to `sitemap.xml`, and to `SHELL_ASSETS` in `sw.js` if it should be
   available offline.

---

## Progressive web app

`manifest.webmanifest` plus `sw.js` make the site installable and readable offline.
The service worker uses network-first for pages, so a deployment is picked up on the next
visit, and stale-while-revalidate for styles, scripts and images.

**Bump `VERSION` in `sw.js` whenever cached assets change**, otherwise returning visitors
keep the old files until their cache expires.

On screens narrower than 768px the top navigation is replaced by a bottom tab bar with the
four main sections plus a "More" sheet holding the remaining pages, the theme toggle and
the language switcher.

---

## Search engine metadata

Each page carries a canonical URL, `hreflang` alternates for `en` / `fr` / `x-default`,
Open Graph and Twitter card tags pointing at `assets/og/og-cover.png`, and JSON-LD:

- `Person` and `WebSite` on the home page, referenced by `@id` from every other page
- `BreadcrumbList` on each inner page
- `ScholarlyArticle` / `Report` for each publication
- `SoftwareSourceCode` for the open-source projects
- `Course` for each training course

When editing structured data, validate it with the
[Schema Markup Validator](https://validator.schema.org/).

---

## Accessibility

Skip link, visible focus rings, `aria-current` on the active page, a focus-trapped and
`Escape`-dismissible mobile sheet, touch targets of at least 44px, and `prefers-reduced-motion`
honoured for the scroll reveal and smooth scrolling.

---

## Licence

Site content © Abdoul Djalil Ousseini Hamza. All rights reserved.
