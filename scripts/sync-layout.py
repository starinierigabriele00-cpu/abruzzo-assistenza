#!/usr/bin/env python3
"""Synchronize shared layout, public configuration and verified-only content."""
import argparse
from html import escape
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]


class Markup(HTMLParser):
    """Compare markup independently of formatter line breaks."""
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.tokens = []
        self.json_script = False
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        self.tokens.append(("start", tag, tuple(sorted(attrs))))
        if tag == "script":
            self.json_script = dict(attrs).get("type") == "application/ld+json"

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)

    def handle_endtag(self, tag):
        self.tokens.append(("end", tag))
        if tag == "script":
            self.json_script = False

    def handle_data(self, text):
        if self.json_script and text.strip():
            self.tokens.append(("json", json.dumps(json.loads(text), sort_keys=True)))
            return
        normalized = " ".join(text.split())
        if normalized:
            self.tokens.append(("text", normalized))

    def handle_comment(self, text):
        self.tokens.append(("comment", text.strip()))


def load_config():
    config = json.loads((ROOT / "config/site.json").read_text())
    if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", config["email"]):
        raise ValueError("Invalid public email")
    if not re.fullmatch(r"\+\d{8,15}", config["phone"]) or config["whatsapp"] != config["phone"][1:]:
        raise ValueError("Phone and WhatsApp must identify the same verified contact")
    if not re.fullmatch(r"https://[a-z0-9.-]+", config["domain"]):
        raise ValueError("Domain must be an HTTPS origin")
    for section, required in {
        "legal": ["name", "address", "taxId", "source"],
        "fivePerMille": ["year", "taxId", "source"],
        "donation": ["beneficiary", "source"],
    }.items():
        record = config[section]
        if record["verified"] and any(not record.get(key) for key in required):
            raise ValueError(f"{section}: verification needs complete data and a source")
    donation = config["donation"]
    if donation["verified"]:
        if not (donation["iban"] or donation["paymentUrl"]):
            raise ValueError("Verified donation has no payment channel")
        if donation["paymentUrl"] and not donation["paymentUrl"].startswith("https://"):
            raise ValueError("Payment links must use HTTPS")
        if donation["iban"]:
            iban = donation["iban"].replace(" ", "").upper()
            if not re.fullmatch(r"[A-Z]{2}\d{2}[A-Z0-9]{11,30}", iban):
                raise ValueError("Invalid IBAN format")
            rotated = iban[4:] + iban[:4]
            number = "".join(str(ord(c) - 55) if c.isalpha() else c for c in rotated)
            if int(number) % 97 != 1:
                raise ValueError("Invalid IBAN checksum")
    for document in config["documents"]:
        if document.get("verified"):
            path = document.get("path", "")
            if not document.get("source") or not document.get("title") or not path.startswith("documents/") or ".." in Path(path).parts or not (ROOT / path).is_file():
                raise ValueError("Document needs a source, title and existing local documents/ file")
    return config


def render(template, page, config):
    text = template.read_text().strip()
    legal = config["legal"]
    values = {**config, "legalFooter": ""}
    if legal["verified"]:
        values["legalFooter"] = f'<p>Sede legale: {escape(legal["address"])}</p><p>Codice fiscale: {escape(legal["taxId"])}</p>'
    text = re.sub(r"\{\{(\w+)\}\}", lambda m: values[m[1]] if m[1] == "legalFooter" else escape(str(values[m[1]]), quote=True), text)
    if template.stem == "site-header":
        text = text.replace(f'href="{page}"', f'href="{page}" aria-current="page"')
        if page in {"volontari.html", "sostienici.html", "trasparenza.html", "pescara.html"}:
            text = text.replace('data-nav-group="association"', 'data-nav-group="association" data-active')
    if page == "404.html":
        text = root_paths(text)
    return "\n".join("    " + line if line else "" for line in text.splitlines())


def root_paths(text):
    return re.sub(r'(href|src)="(?![a-z]+:|/|#)([^"]+)"', r'\1="/\2"', text)


def verified_content(slot, config):
    legal = config["legal"]
    five = config["fivePerMille"]
    donation = config["donation"]
    if slot.startswith("five-") and five["verified"]:
        card = f'<div class="five-card"><div><h2>Il tuo 5×1000 per il territorio.</h2><p>Accreditamento verificato per l’anno {escape(str(five["year"]))}. Firma nel riquadro previsto dall’accreditamento dell’associazione e indica il codice fiscale.</p></div><div><p>Codice fiscale</p><strong class="tax-id">{escape(five["taxId"])}</strong><a class="text-link" href="sostienici.html">Informazioni sul sostegno</a></div></div>'
        return f'<section class="section verified-promo" data-verified="fivePerMille"><div class="container">{card}</div></section>' if slot != "five-transparency" else f'<div data-verified="fivePerMille"><h3>5×1000 — {escape(str(five["year"]))}</h3><p>Accreditamento documentato. Codice fiscale {escape(five["taxId"])}.</p></div>'
    if slot == "donation" and donation["verified"]:
        parts = ['<div class="notice" data-verified="donation">', f'<p>Intestatario: {escape(donation["beneficiary"])}</p>']
        if donation["iban"]:
            parts.append(f'<p>IBAN: <strong>{escape(donation["iban"])}</strong></p>')
        if donation["paymentUrl"]:
            parts.append(f'<a class="text-link" href="{escape(donation["paymentUrl"], quote=True)}" target="_blank" rel="noopener noreferrer">Apri il canale di donazione</a>')
        return ''.join(parts) + '</div>'
    if slot.startswith("legal-") and legal["verified"]:
        if slot == "legal-contact":
            return f'<div data-verified="legal"><p>Sede legale: {escape(legal["address"])}</p><a class="text-link" href="https://www.google.com/maps/search/?api=1&amp;query={quote(legal["address"])}" target="_blank" rel="noopener noreferrer">Indicazioni per la sede legale</a></div>'
        if slot == "legal-privacy":
            return f'<p data-verified="legal">Titolare: {escape(legal["name"])}. Sede: {escape(legal["address"])}. Codice fiscale: {escape(legal["taxId"])}.</p>'
        rows = ''.join(f'<div><dt>{label}</dt><dd>{escape(legal[key])}</dd></div>' for key, label in [('name','Denominazione legale'),('address','Sede legale'),('taxId','Codice fiscale'),('qualification','Qualifiche documentate')] if legal.get(key))
        return f'<dl class="data-list" data-verified="legal">{rows}</dl>'
    if slot == "documents":
        documents = [d for d in config["documents"] if d.get("verified")]
        return '<ul class="document-list">' + ''.join(f'<li><a href="{escape(d["path"], quote=True)}">{escape(d["title"])}</a></li>' for d in documents) + '</ul>' if documents else ''
    return ""


def sync_page(text, page, config):
    for part in ["site-header", "site-footer"]:
        pattern = rf"    <!-- {part}:start -->.*?<!-- {part}:end -->"
        text, count = re.subn(pattern, lambda _: render(ROOT / "templates" / f"{part}.html", page, config), text, count=1, flags=re.S)
        if count != 1:
            raise ValueError(f"Missing {part} in {page}")
    text = re.sub(r'<!-- verified:([\w-]+):start -->.*?<!-- verified:\1:end -->', lambda m: f'<!-- verified:{m[1]}:start -->\n{verified_content(m[1],config)}\n<!-- verified:{m[1]}:end -->', text, flags=re.S)
    def update_contact(match):
        attrs, key, body = match[1], match[2], match[3]
        href = ('mailto:' if key == 'email' else 'tel:' if key == 'phone' else 'https://wa.me/' if key == 'whatsapp' else '') + config[key]
        attrs = re.sub(r'href="[^"]*"', 'href="'+escape(href,quote=True)+'"', attrs)
        if key in {'phone','email'}:
            value = config['phoneDisplay'] if key == 'phone' else config['email']
            if '<small>' in body:
                body = re.sub(r'<small>.*?</small>', '<small>'+escape(value)+'</small>', body, flags=re.S)
            else:
                body = escape(value)
        return '<a'+attrs+'>'+body+'</a>'
    text = re.sub(r'<a(\s[^>]*data-site="(\w+)"[^>]*)>(.*?)</a>', update_contact, text, flags=re.S)
    canonical = config['domain'] + ('/' if page == 'index.html' else '/' + page)
    def metadata(match):
        tag = match[0]
        if 'name="viewport"' in tag:
            return re.sub(r'content="[^"]*"', 'content="width=device-width,initial-scale=1,viewport-fit=cover"', tag)
        if re.search(r'rel="canonical"', tag):
            return re.sub(r'href="[^"]*"', 'href="' + canonical + '"', tag)
        for key, value in [('og:url', canonical), ('og:image', config['domain'] + '/assets/social-preview.jpg')]:
            if f'property="{key}"' in tag:
                return re.sub(r'content="[^"]*"', 'content="' + value + '"', tag)
        return tag
    text = re.sub(r'<(?:link|meta)\b[^>]*>', metadata, text, flags=re.S)
    if page == 'index.html':
        data = {'@context':'https://schema.org','@type':'Organization','name':'Abruzzo Assistenza','url':config['domain']+'/', 'logo':config['domain']+'/assets/logo-associazione-small.jpg','telephone':config['phone'],'email':config['email'],'sameAs':[config['instagram'],config['facebook']]}
        if config['legal']['verified']:
            data['legalName'] = config['legal']['name']
            data['taxID'] = config['legal']['taxId']
        text = re.sub(r'(<script\s+type="application/ld\+json"\s*>).*?(</script>)', lambda m: m[1]+json.dumps(data,ensure_ascii=False).replace('<','\\u003c')+m[2], text, flags=re.S)
    return text


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    config = load_config()
    changed = []
    for page in sorted(ROOT.glob('*.html')):
        before = page.read_text()
        after = sync_page(before, page.name, config)
        if Markup(before).tokens != Markup(after).tokens if args.check else before != after:
            changed.append(page.name)
            if not args.check: page.write_text(after)
    app = ROOT / 'assets/app.js'
    before = app.read_text()
    public = {key:config[key] for key in ['phone','whatsapp','email']}
    after = re.sub(r'/\* config:start \*/.*?/\* config:end \*/', lambda _: '/* config:start */ '+json.dumps(public,ensure_ascii=False)+'; /* config:end */', before, flags=re.S)
    # Prettier removes quotes from identifier keys and may add a trailing comma.
    def normalize(source):
        block = re.search(r'/\* config:start \*/(.*?)/\* config:end \*/', source, re.S)[1]
        block = re.sub(r'(?m)^(\s*)([A-Za-z]\w*)(\s*:)', r'\1"\2"\3', block)
        return json.loads(re.sub(r',\s*}', '}', block).strip().rstrip(';'))
    if normalize(before) != public if args.check else before != after:
        changed.append('assets/app.js')
        if not args.check: app.write_text(after)
    generated = {
        'robots.txt': 'User-agent: *\nAllow: /\nSitemap: ' + config['domain'] + '/sitemap.xml\n',
        'sitemap.xml': '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + ''.join('<url><loc>' + config['domain'] + ('/' if p.name == 'index.html' else '/' + p.name) + '</loc></url>' for p in sorted(ROOT.glob('*.html')) if p.name != '404.html') + '</urlset>\n',
    }
    for name, content in generated.items():
        file = ROOT / name
        if not file.exists() or file.read_text() != content:
            changed.append(name)
            if not args.check: file.write_text(content)
    if args.check and changed: raise SystemExit('Run python3 scripts/sync-layout.py, then format: '+', '.join(changed))
    print(f'{"PASS" if args.check else "Synced"}: 9 layouts, contacts, configuration and verified publication gates.')


if __name__ == '__main__':
    main()
