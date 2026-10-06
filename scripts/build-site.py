#!/usr/bin/env python3
"""Prepare a Pages artifact containing only published HTML and its local assets."""

from pathlib import Path
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "_site"
ASSETS = [
    "styles.css",
    "app.js",
    "logo-associazione-small.jpg",
    "mezzi-associazione.jpg",
    "mezzi-associazione-800.jpg",
]

if OUTPUT.exists():
    shutil.rmtree(OUTPUT)
(OUTPUT / "assets").mkdir(parents=True)
for page in ROOT.glob("*.html"):
    shutil.copy2(page, OUTPUT / page.name)
for asset in ASSETS:
    shutil.copy2(ROOT / "assets" / asset, OUTPUT / "assets" / asset)
shutil.copytree(ROOT / "assets" / "fonts", OUTPUT / "assets" / "fonts")
(OUTPUT / ".nojekyll").touch()
subprocess.run(
    [sys.executable, str(ROOT / "scripts" / "check-site.py"), "--root", str(OUTPUT)],
    check=True,
)
print("Ready: _site contains the verified public Pages artifact.")
