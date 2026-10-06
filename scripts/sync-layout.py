#!/usr/bin/env python3
"""Keep the static pages aligned with the shared header and footer templates."""

import argparse
from html import escape
from html.parser import HTMLParser
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


class Markup(HTMLParser):
    """Compare markup independently of formatter line breaks."""

    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.tokens = []
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        self.tokens.append(("start", tag, tuple(sorted(attrs))))

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)

    def handle_endtag(self, tag):
        self.tokens.append(("end", tag))

    def handle_data(self, text):
        normalized = " ".join(text.split())
        if normalized:
            self.tokens.append(("text", normalized))

    def handle_comment(self, text):
        self.tokens.append(("comment", text.strip()))


def render(template, page):
    text = template.read_text().strip()
    if template.stem == "site-header":
        text = text.replace(
            f'href="{escape(page)}"', f'href="{escape(page)}" aria-current="page"'
        )
        group = (
            "services"
            if page == "servizi.html"
            else "association"
            if page in {"volontari.html", "sostienici.html", "trasparenza.html"}
            else None
        )
        if group:
            text = text.replace(f'data-nav-group="{group}"', f'data-nav-group="{group}" data-active')
    return "\n".join("    " + line if line else "" for line in text.splitlines())


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Check shared markup without writing")
    args = parser.parse_args()
    changed = []
    for page in sorted(ROOT.glob("*.html")):
        before = page.read_text()
        after = before
        for part, legacy in [
            ("site-header", r'    <div class="utility-bar">.*?</header>'),
            ("site-footer", r'    <div class="emergency-bar".*?</footer>'),
        ]:
            marked = rf"    <!-- {part}:start -->.*?<!-- {part}:end -->"
            pattern = marked if f"<!-- {part}:start -->" in after else legacy
            after, count = re.subn(
                pattern,
                lambda _: render(ROOT / "templates" / f"{part}.html", page.name),
                after,
                count=1,
                flags=re.S,
            )
            if count != 1:
                raise SystemExit(f"Missing {part} in {page.name}")
        differs = Markup(before).tokens != Markup(after).tokens if args.check else after != before
        if differs:
            changed.append(page.name)
            if not args.check:
                page.write_text(after)
    if args.check and changed:
        raise SystemExit("Shared layout differs: " + ", ".join(changed))
    print(f"{'PASS' if args.check else 'Synced'}: shared header and footer in 9 pages.")


if __name__ == "__main__":
    main()
