#!/usr/bin/env python3
"""Validate the static site using only the Python standard library."""
from collections import Counter
import argparse
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import sys

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
ROOT = parser.parse_args().root.resolve()

class Page(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.path = path
        self.ids = []
        self.links = []
        self.elements = []
        self.feed(path.read_text())

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.elements.append((tag, attrs))
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        for key in ('href', 'src'):
            if key in attrs:
                self.links.append(attrs[key])

pages = {p.name: Page(p) for p in sorted(ROOT.glob('*.html'))}
errors = []
checked_links = 0
for name, page in pages.items():
    for id_, count in Counter(page.ids).items():
        if count > 1:
            errors.append(f'{name}: duplicate id {id_}')
    if sum(tag == 'h1' for tag, _ in page.elements) != 1:
        errors.append(f'{name}: expected one h1')
    if not any(tag == 'html' and attrs.get('lang') == 'it' for tag, attrs in page.elements):
        errors.append(f'{name}: missing Italian language')
    if not any(tag == 'meta' and attrs.get('name') == 'viewport' for tag, attrs in page.elements):
        errors.append(f'{name}: missing viewport')
    for tag, attrs in page.elements:
        if tag == 'img' and 'alt' not in attrs:
            errors.append(f'{name}: image without alt text')
        if tag == 'a' and attrs.get('target') == '_blank' and 'noopener' not in attrs.get('rel', '').split():
            errors.append(f'{name}: external tab without noopener')
    for url in page.links:
        parts = urlsplit(url)
        if parts.scheme or parts.netloc:
            continue
        if url == '#':
            # Configured donation-only links remain hidden until official data exists.
            continue
        path = unquote(parts.path) or name
        target = ROOT / path
        checked_links += 1
        if not target.is_file():
            errors.append(f'{name}: missing local file {url}')
        elif parts.fragment and target.name in pages and unquote(parts.fragment) not in pages[target.name].ids:
            errors.append(f'{name}: missing fragment {url}')
    if name != '404.html':
        if 'main' not in page.ids:
            errors.append(f'{name}: missing main target')
        if not any(tag == 'nav' and attrs.get('aria-label') == 'Navigazione principale' for tag, attrs in page.elements):
            errors.append(f'{name}: missing labelled navigation')
        if 'logo-officiale.png' in page.path.read_text():
            errors.append(f'{name}: uses the incomplete PNG logo')

if errors:
    print('\n'.join(errors), file=sys.stderr)
    sys.exit(1)
print(f'PASS: {len(pages)} pages, {checked_links} local links/assets and fragment targets.')
