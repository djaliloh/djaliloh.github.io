#!/usr/bin/env python3
"""Check the translation files against the keys the site actually uses.

The English text lives in the HTML, so there is no en.json to diff against.
This script collects every key referenced by the markup and by the JavaScript
modules, then reports what each translation file is missing or no longer needs.

Usage
    python tools/check-i18n.py          # report
    python tools/check-i18n.py --strict # exit 1 when a key is missing

Run it after adding or renaming a data-i18n key.
"""

from __future__ import annotations

import argparse
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

HTML_GLOBS = ["*.html", "pages/*.html"]
JS_GLOBS = ["assets/js/*.js", "assets/js/modules/*.js"]
LOCALE_GLOB = "assets/i18n/*.json"

# data-i18n="key" / data-i18n-html="key" / data-i18n-attr="attr=key; attr2=key2"
# Both quote styles, because the JavaScript modules build the same attributes.
MARKUP_RE = re.compile(r"""data-i18n(-html|-attr)?=(["'])(.*?)\2""")
# element.setAttribute('data-i18n-attr', 'aria-label=key') — the attribute name
# and its value are separate arguments, so MARKUP_RE cannot see them.
SETATTR_RE = re.compile(
    r"""setAttribute\(\s*(["'])data-i18n(-html|-attr)?\1\s*,\s*(["'])(.*?)\3"""
)
# t('key', 'English fallback')
CALL_RE = re.compile(r"\bt\(\s*'([a-zA-Z0-9_.]+)'")
# A real key is dotted and literal. This filters out template placeholders
# such as ${item.key} and the "key" / "k2" names used in doc comments.
KEY_RE = re.compile(r"^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z0-9_]+)+$")


def read(path: str) -> str:
    with open(path, encoding="utf-8") as handle:
        return handle.read()


def files(patterns: list[str]) -> list[str]:
    found: list[str] = []
    for pattern in patterns:
        found.extend(sorted(glob.glob(os.path.join(ROOT, pattern))))
    return found


def keys_from(source: str) -> set[str]:
    """Every key referenced by data-i18n attributes in `source`."""
    found: set[str] = set()

    def take(kind: str, value: str) -> None:
        if kind == "-attr":
            for pair in value.split(";"):
                if "=" in pair:
                    found.add(pair.split("=", 1)[1].strip())
        elif value:
            found.add(value)

    for kind, _quote, value in MARKUP_RE.findall(source):
        take(kind, value)
    for _q1, kind, _q2, value in SETATTR_RE.findall(source):
        take(kind, value)

    return {key for key in found if KEY_RE.match(key)}


def collect_used() -> dict[str, set[str]]:
    """Maps each key to the files that reference it."""
    used: dict[str, set[str]] = {}

    def record(key: str, path: str) -> None:
        used.setdefault(key, set()).add(os.path.relpath(path, ROOT).replace("\\", "/"))

    for path in files(HTML_GLOBS):
        for key in keys_from(read(path)):
            record(key, path)

    for path in files(JS_GLOBS):
        source = read(path)
        # Keys can reach the DOM two ways from JavaScript: markup the module
        # builds, and direct t() lookups.
        calls = {key for key in CALL_RE.findall(source) if KEY_RE.match(key)}
        for key in keys_from(source) | calls:
            record(key, path)

    return used


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--strict", action="store_true", help="exit 1 if a key is missing")
    args = parser.parse_args()

    used = collect_used()
    print(f"{len(used)} keys referenced across HTML and JavaScript.\n")

    failed = False
    for locale_path in files([LOCALE_GLOB]):
        name = os.path.basename(locale_path)
        with open(locale_path, encoding="utf-8") as handle:
            translations = json.load(handle)

        # Keys starting with "_" are notes for translators, not translations.
        provided = {key for key in translations if not key.startswith("_")}
        missing = sorted(set(used) - provided)
        obsolete = sorted(provided - set(used))
        empty = sorted(key for key in provided if not str(translations[key]).strip())

        print(f"── {name}: {len(provided)} translations")
        if missing:
            failed = True
            print(f"   missing ({len(missing)}) — these fall back to English:")
            for key in missing:
                print(f"     - {key}  [{', '.join(sorted(used[key]))}]")
        if obsolete:
            print(f"   obsolete ({len(obsolete)}) — no longer referenced:")
            for key in obsolete:
                print(f"     - {key}")
        if empty:
            failed = True
            print(f"   empty ({len(empty)}):")
            for key in empty:
                print(f"     - {key}")
        if not (missing or obsolete or empty):
            print("   complete.")
        print()

    return 1 if (failed and args.strict) else 0


if __name__ == "__main__":
    sys.exit(main())
