#!/usr/bin/env python3
"""Prepare an explicitly selected, checked GitHub Pages artifact."""
import argparse
from pathlib import Path
import shutil
import subprocess
import sys
from importlib.util import module_from_spec, spec_from_file_location

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--custom-domain', action='store_true', help='Opt-in CNAME after domain/Pages approval')
parser.add_argument('--base-path', default='/', help='404 root path before custom-domain setup, e.g. /abruzzo-assistenza/')
args = parser.parse_args()
if not args.base_path.startswith('/') or not args.base_path.endswith('/') or '..' in args.base_path:
    parser.error('base-path must be an absolute directory path')
spec = spec_from_file_location('layout', ROOT/'scripts/sync-layout.py')
layout = module_from_spec(spec)
spec.loader.exec_module(layout)
config = layout.load_config()
subprocess.run([sys.executable,str(ROOT/'scripts/sync-layout.py'),'--check'],check=True)
OUTPUT = ROOT/'_site'
ASSETS = [
    'styles.css', 'app.js', 'logo-associazione-small.jpg', 'logo-associazione-96.webp',
    'mezzi-associazione.jpg', 'mezzi-800.webp', 'mezzi-1440.webp',
    'favicon.png', 'social-preview.jpg', 'icons.svg', 'abruzzo-map.svg',
]
if OUTPUT.exists(): shutil.rmtree(OUTPUT)
(OUTPUT/'assets').mkdir(parents=True)
for page in ROOT.glob('*.html'):
    shutil.copy2(page, OUTPUT/page.name)
for asset in ASSETS: shutil.copy2(ROOT/'assets'/asset,OUTPUT/'assets'/asset)
shutil.copytree(ROOT/'assets/fonts',OUTPUT/'assets/fonts')
for file in ['robots.txt','sitemap.xml']: shutil.copy2(ROOT/file,OUTPUT/file)
for document in config['documents']:
    if document.get('verified'):
        target = OUTPUT/document['path']
        target.parent.mkdir(parents=True,exist_ok=True)
        shutil.copy2(ROOT/document['path'],target)
(OUTPUT/'.nojekyll').touch()
if args.base_path != '/':
    import re
    page = OUTPUT/'404.html'
    page.write_text(re.sub(r'(href|src)="/(?!/)',lambda m:m[1]+'="'+args.base_path,page.read_text()))
subprocess.run([sys.executable,str(ROOT/'scripts/check-site.py'),'--root',str(OUTPUT),'--base-path',args.base_path],check=True)
if args.custom_domain:
    (OUTPUT/'CNAME').write_text(config['domain'].removeprefix('https://')+'\n')
print('Ready: _site contains the checked public Pages artifact; domain activation is opt-in.')
