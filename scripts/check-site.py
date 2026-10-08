#!/usr/bin/env python3
"""Check links, publication gates, SEO and local assets using the standard library."""
import argparse
from collections import Counter
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import sys
from urllib.parse import unquote, urlsplit
import xml.etree.ElementTree as ET

SOURCE = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--root', type=Path, default=SOURCE)
parser.add_argument('--base-path', default='/')
args = parser.parse_args()
ROOT = args.root.resolve()
config = json.loads((SOURCE / 'config/site.json').read_text())

class Page(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.path = path
        self.ids = []
        self.links = []
        self.elements = []
        self.text = path.read_text()
        self.feed(self.text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.elements.append((tag, attrs))
        if 'id' in attrs: self.ids.append(attrs['id'])
        for key in ('href', 'src'):
            if key in attrs: self.links.append(attrs[key])
        for key in ['srcset', 'imagesrcset']:
            if key in attrs:
                self.links.extend(item.strip().split()[0] for item in attrs[key].split(','))

pages = {p.name: Page(p) for p in sorted(ROOT.glob('*.html'))}
errors = []
count = 0
redirects = config.get('redirects', {})
active_pages = {'index.html','servizi.html','volontari.html','associazione.html','contatti.html','privacy.html','pescara.html','404.html'}
if set(pages) != active_pages | set(redirects):
    errors.append('Expected all active pages and legacy redirects')
titles = []
def check_link(url, source):
    global count
    parts = urlsplit(url)
    if parts.scheme or parts.netloc:
        if parts.netloc == urlsplit(config['domain']).netloc:
            path = parts.path.lstrip('/') or 'index.html'
        else:
            return
    else:
        path = unquote(parts.path).lstrip('/') or source.name
        prefix = args.base_path.strip('/')
        if prefix and path.startswith(prefix + '/'):
            path = path[len(prefix) + 1:]
    if url == '#':
        errors.append(f'{source.name}: placeholder link')
        return
    target = ROOT / path
    count += 1
    if source.name in active_pages and target.name in redirects:
        errors.append(f'{source.name}: link directly to {redirects[target.name]} instead of the legacy route')
    if not target.is_file():
        errors.append(f'{source.name}: missing local file {url}')
    elif parts.fragment:
        ids = pages[target.name].ids if target.name in pages else [el.attrib['id'] for el in ET.parse(target).iter() if 'id' in el.attrib] if target.suffix == '.svg' else None
        if ids is not None and unquote(parts.fragment) not in ids:
            errors.append(f'{source.name}: missing fragment {url}')

for name, page in pages.items():
    if name in redirects:
        destination = redirects[name]
        if not any(t == 'meta' and a.get('http-equiv') == 'refresh' and a.get('content') == '0;url=' + destination for t,a in page.elements):
            errors.append(f'{name}: missing immediate legacy redirect')
        if not any(t == 'meta' and a.get('name') == 'robots' and a.get('content') == 'noindex,follow' for t,a in page.elements):
            errors.append(f'{name}: redirect must not be indexed')
        canonical = config['domain'] + '/' + destination.split('#')[0]
        if not any(t == 'link' and a.get('rel') == 'canonical' and a.get('href') == canonical for t,a in page.elements):
            errors.append(f'{name}: redirect canonical must identify the destination')
        check_link(destination, page.path)
        continue
    for id_, n in Counter(page.ids).items():
        if n > 1: errors.append(f'{name}: duplicate id {id_}')
    if sum(tag == 'h1' for tag, _ in page.elements) != 1: errors.append(f'{name}: expected one h1')
    if not any(t == 'html' and a.get('lang') == 'it' for t,a in page.elements): errors.append(f'{name}: missing Italian language')
    if not any(t == 'meta' and a.get('name') == 'viewport' for t,a in page.elements): errors.append(f'{name}: missing viewport')
    if 'main' not in page.ids: errors.append(f'{name}: missing main target')
    if not any(t == 'nav' and a.get('aria-label') == 'Navigazione principale' for t,a in page.elements): errors.append(f'{name}: missing labelled navigation')
    title = re.search(r'<title>(.*?)</title>',page.text,re.S)
    if not title or not title[1].strip(): errors.append(f'{name}: missing title')
    else: titles.append(title[1].strip())
    canonical = config['domain'] + ('/' if name == 'index.html' else '/' + name)
    if not any(t == 'link' and a.get('rel') == 'canonical' and a.get('href') == canonical for t,a in page.elements): errors.append(f'{name}: invalid canonical')
    for key in ['description']:
        if not any(t == 'meta' and a.get('name') == key and a.get('content') for t,a in page.elements): errors.append(f'{name}: missing {key}')
    for key in ['og:title','og:description','og:url','og:image']:
        if not any(t == 'meta' and a.get('property') == key and a.get('content') for t,a in page.elements): errors.append(f'{name}: missing {key}')
    previous_heading = 0
    labels = {a['for'] for t,a in page.elements if t == 'label' and 'for' in a}
    for tag, attrs in page.elements:
        if re.fullmatch(r'h[1-6]',tag):
            level = int(tag[1])
            if previous_heading and level > previous_heading + 1: errors.append(f'{name}: skipped heading level at {attrs.get("id",tag)}')
            previous_heading = level
        if tag == 'img' and not all(k in attrs for k in ['alt','width','height']): errors.append(f'{name}: image lacks alt or dimensions')
        if tag == 'a' and attrs.get('target') == '_blank' and 'noopener' not in attrs.get('rel','').split(): errors.append(f'{name}: external tab without noopener')
        if tag in {'input','select','textarea'} and attrs.get('type') not in {'radio','hidden'} and attrs.get('id') not in labels: errors.append(f'{name}: input without explicit label')
        if tag in {'input','select','textarea'} and 'required' in attrs: errors.append(f'{name}: unnecessary required composer field')
        if 'aria-controls' in attrs and attrs['aria-controls'] not in page.ids: errors.append(f'{name}: missing controlled element')
        if attrs.get('data-verified') and not config[attrs['data-verified']]['verified']: errors.append(f'{name}: unverified {attrs["data-verified"]} is published')
    if re.search(r'\bH24\b|abruzzoassistanzaodv@|abruzzoassistenza@libero', page.text): errors.append(f'{name}: stale contact or unverified H24 claim')
    if '{{' in page.text: errors.append(f'{name}: unresolved template value')
    for url in page.links: check_link(url,page.path)
    for t,a in page.elements:
        if t == 'meta' and a.get('property') == 'og:image': check_link(a['content'],page.path)
if len(titles) != len(set(titles)): errors.append('Page titles must be unique')
for url in re.findall(r'url\(["\']?([^\)"\']+)', (ROOT/'assets/styles.css').read_text()):
    # CSS URLs are relative to the stylesheet.
    check_link('assets/'+url,ROOT/'assets/styles.css')
for file in ['robots.txt','sitemap.xml','assets/icons.svg','assets/abruzzo-map.svg']:
    if not (ROOT/file).is_file(): errors.append('Missing published asset '+file)
if (ROOT/'sitemap.xml').is_file():
    locs = [el.text for el in ET.parse(ROOT/'sitemap.xml').iter() if el.tag.endswith('}loc')]
    expected = {config['domain']+('/' if n=='index.html' else '/'+n) for n in pages if n!='404.html' and n not in redirects}
    if set(locs) != expected: errors.append('Sitemap does not match indexable pages')
    for url in locs: check_link(url,ROOT/'sitemap.xml')
if errors:
    print('\n'.join(errors),file=sys.stderr)
    sys.exit(1)
print(f'PASS: {len(active_pages)} pages, {len(redirects)} redirects, {count} links/assets, headings, SEO and publication gates.')
