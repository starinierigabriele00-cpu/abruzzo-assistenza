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
        "fivePerMille": ["taxId", "source"],
        "donation": ["beneficiary", "source"],
    }.items():
        record = config[section]
        if record["verified"] and any(not record.get(key) for key in required):
            raise ValueError(f"{section}: verification needs complete data and a source")
    five = config["fivePerMille"]
    if five["verified"]:
        if not re.fullmatch(r"\d{11}", five["taxId"]):
            raise ValueError("fivePerMille: tax ID must contain 11 digits")
        if five.get("year") is not None:
            if type(five['year']) is not int or not 2000 <= five['year'] <= 2100:
                raise ValueError("fivePerMille: invalid documented fiscal year")
            if not five.get('yearSource'):
                raise ValueError("fivePerMille: a documented annual distribution needs its own yearSource")
        if config['legal']['verified'] and five['taxId'] != config['legal']['taxId']:
            raise ValueError('fivePerMille: tax ID must match the verified association')
    if config['legal']['verified'] and not re.fullmatch(r'\d{11}', config['legal']['taxId']):
        raise ValueError('legal: tax ID must contain 11 digits')
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
    verifications = config.get('googleVerificationFiles', [])
    if not isinstance(verifications, list):
        raise ValueError('Google verification filenames must be a list')
    for verification in verifications:
        if not isinstance(verification, str) or not re.fullmatch(r'google[a-f0-9]+\.html', verification):
            raise ValueError('Google verification must use a local Google HTML filename')
        file = ROOT / verification
        if not file.is_file() or file.read_text().strip() != 'google-site-verification: ' + verification:
            raise ValueError('Google verification file must contain the exact supplied token')
    if len(verifications) != len(set(verifications)):
        raise ValueError('Google verification filenames must not contain duplicates')
    legal = config['legal']
    if legal.get('mapsUrl'):
        if not legal.get('locationSource') or not re.fullmatch(r'https://maps\.app\.goo\.gl/[A-Za-z0-9]+', legal['mapsUrl']):
            raise ValueError('Map location needs a confirmed Google Maps link and source')
    for source, destination in config.get('redirects', {}).items():
        if not re.fullmatch(r'[a-z0-9-]+\.html', source) or not re.fullmatch(r'[a-z0-9-]+\.html(?:#[a-z0-9-]+)?', destination):
            raise ValueError('Redirects must use local HTML filenames and optional anchors')
        target = destination.split('#')[0]
        if target in config['redirects'] or not (ROOT / target).is_file():
            raise ValueError('Redirect must point to an existing active page, without a chain')
    return config


def site_pages(config):
    """Google ownership files are not content pages or sitemap entries."""
    return [page for page in sorted(ROOT.glob('*.html')) if page.name not in config.get('googleVerificationFiles', [])]


def render(template, page, config):
    text = template.read_text().strip()
    legal = config["legal"]
    values = {**config, "legalFooter": ""}
    if legal["verified"]:
        values["legalFooter"] = f'<div class="footer-legal" data-verified="legal"><p>{escape(legal["name"])}</p><p>Sede legale: {escape(legal["address"])} · C.F. {escape(legal["taxId"])}</p></div>'
    text = re.sub(r"\{\{(\w+)\}\}", lambda m: values[m[1]] if m[1] == "legalFooter" else escape(str(values[m[1]]), quote=True), text)
    if template.stem == "site-header":
        text = text.replace(f'href="{page}"', f'href="{page}" aria-current="page"')
    if page == "404.html":
        text = root_paths(text)
    return "\n".join("    " + line if line else "" for line in text.splitlines())


def root_paths(text):
    return re.sub(r'(href|src)="(?![a-z]+:|/|#)([^"]+)"', r'\1="/\2"', text)


def public_path(filename):
    """Match Cloudflare Pages' extensionless URLs, preserving destination anchors."""
    page, separator, fragment = filename.partition('#')
    path = '/' if page == 'index.html' else '/' + page.removesuffix('.html')
    return path + (separator + fragment if separator else '')


def verified_content(slot, config):
    legal = config["legal"]
    five = config["fivePerMille"]
    donation = config["donation"]
    if slot.startswith("five-") and five["verified"]:
        tax_id = escape(five["taxId"])
        annuality = f'<p>Ammissione al riparto {escape(str(five["year"]))} documentata.</p>' if five.get("year") and five.get('yearSource') else ""
        if slot == "five-transparency":
            return f'<p data-verified="fivePerMille">Accreditamento al 5×1000 confermato. <a class="text-link" href="associazione.html#cinque-per-mille">Come destinare il 5×1000</a>.</p>'
        if slot == 'five-support':
            return f'<section class="section section-ice" id="cinque-per-mille" aria-labelledby="five-support-title" data-verified="fivePerMille"><div class="container support-layout"><div><h2 id="five-support-title">Una firma per le nostre attività.</h2><p class="lead">Puoi destinare il tuo 5×1000 ad Abruzzo Assistenza, accreditata al sostegno degli Enti del Terzo Settore.</p></div><div><p>Nella dichiarazione dei redditi, firma nel riquadro dedicato al sostegno degli Enti del Terzo Settore e indica il codice fiscale <strong>{tax_id}</strong>.</p><p>Il 5×1000 è una destinazione di una quota dell’IRPEF; è distinto dai contributi e dalle donazioni private.</p>{annuality}<a class="text-link" href="contatti.html?servizio=sostegno#richiesta">Parla con un referente</a></div></div></section>'
        card = (
            '<div class="five-card">'
            '<div class="five-card-copy">'
            '<h2 id="five-home-title">Sostieni Abruzzo Assistenza con il tuo 5×1000.</h2>'
            '<p>Firma nel riquadro per il sostegno degli Enti del Terzo Settore nella dichiarazione dei redditi e indica il nostro codice fiscale.</p>'
            '</div>'
            '<div class="five-card-code">'
            '<span class="five-card-label">Codice fiscale</span>'
            f'<strong class="tax-id" data-tax-id tabindex="-1">{tax_id}</strong>'
            '<button class="five-copy-button" type="button" data-copy-tax-id hidden>Copia codice fiscale</button>'
            '<span class="five-copy-status" role="status" aria-live="polite" data-tax-copy-status></span>'
            '<a class="five-card-link" href="associazione.html#cinque-per-mille">Come destinare il 5×1000</a>'
            '</div>'
            '</div>'
        )
        return f'<section class="section verified-promo" aria-labelledby="five-home-title" data-verified="fivePerMille"><div class="container">{card}</div></section>'
    if slot == "donation" and donation["verified"]:
        parts = ['<div class="notice" data-verified="donation">', f'<p>Intestatario: {escape(donation["beneficiary"])}</p>']
        if donation["iban"]:
            parts.append(f'<p>IBAN: <strong>{escape(donation["iban"])}</strong></p>')
        if donation["paymentUrl"]:
            parts.append(f'<a class="text-link" href="{escape(donation["paymentUrl"], quote=True)}" target="_blank" rel="noopener noreferrer">Apri il canale di donazione</a>')
        return ''.join(parts) + '</div>'
    if slot.startswith("legal-") and legal["verified"]:
        map_url = escape(legal.get('mapsUrl') or 'https://www.google.com/maps/search/?api=1&query=' + quote(legal['address']), quote=True)
        access_note = '<p>La sede legale non è un punto di ricevimento del pubblico. I servizi vengono organizzati presso gli utenti e con i mezzi dell’associazione.</p>' if legal.get('receivesVisitors') is False else ''
        if slot == "legal-contact":
            return f'<div data-verified="legal"><p>Sede legale: {escape(legal["address"])}</p><a class="text-link" href="{map_url}" target="_blank" rel="noopener noreferrer">Posizione della sede legale</a>{access_note}</div>'
        if slot == "legal-privacy":
            return f'<p data-verified="legal">Titolare: {escape(legal["name"])}. Sede: {escape(legal["address"])}. Codice fiscale: {escape(legal["taxId"])}.</p>'
        if slot == 'legal-association':
            return f'<div class="institutional-summary" data-verified="legal"><p>{escape(legal["name"])}</p><p>{escape(legal["qualification"])}' + (' · Iscrizione RUNTS confermata.' if legal.get('runtsRegistered') else '.') + '<a class="text-link" href="contatti.html#associazione">Dati istituzionali e documenti</a></p></div>'
        rows = ''.join(f'<div><dt>{label}</dt><dd>{escape(legal[key])}</dd></div>' for key, label in [('name','Denominazione legale'),('address','Sede legale'),('taxId','Codice fiscale'),('qualification','Qualifiche documentate')] if legal.get(key))
        if legal.get('runtsRegistered'):
            rows += '<div><dt>Registro pubblico</dt><dd>Iscrizione RUNTS confermata</dd></div>'
        return f'<div data-verified="legal"><dl class="data-list">{rows}</dl><a class="text-link" href="{map_url}" target="_blank" rel="noopener noreferrer">Posizione della sede legale</a>{access_note}</div>'
    if slot == "documents":
        documents = [d for d in config["documents"] if d.get("verified")]
        return '<ul class="document-list">' + ''.join(f'<li><a class="text-link" href="{escape(d["path"], quote=True)}">{escape(d["title"])}</a>' + (f'<p>{escape(d["note"])}</p>' if d.get('note') else '') + '</li>' for d in documents) + '</ul>' if documents else ''
    return ""


def redirect_page(page, destination, config):
    canonical = config['domain'] + public_path(destination.split('#')[0])
    title = 'Questa pagina è stata spostata | Abruzzo Assistenza — ' + page.removesuffix('.html').capitalize()
    return f'''<!doctype html>
<html lang="it">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
    <meta name="robots" content="noindex,follow" />
    <meta http-equiv="refresh" content="0;url={escape(destination, quote=True)}" />
    <link rel="canonical" href="{escape(canonical, quote=True)}" />
    <title>{escape(title)}</title>
  </head>
  <body>
    <main id="main">
      <h1>Questa pagina è stata spostata.</h1>
      <p><a href="{escape(destination, quote=True)}">Continua alla nuova pagina</a>.</p>
    </main>
  </body>
</html>
'''


def sync_page(text, page, config):
    if page in config.get('redirects', {}):
        return redirect_page(page, config['redirects'][page], config)
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
    # Keep direct email contacts usable without JavaScript on Cloudflare's edge.
    # These documented opt-out markers only exempt public email anchors.
    text = text.replace('<!--email_off-->', '').replace('<!--/email_off-->', '')
    text = re.sub(r'<a\b[^>]*href="mailto:[^"]*"[^>]*>.*?</a>',
                  lambda m: '<!--email_off-->' + m[0] + '<!--/email_off-->', text, flags=re.S)
    canonical = config['domain'] + public_path(page)
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
            data['address'] = config['legal']['address']
        text = re.sub(r'(<script\s+type="application/ld\+json"\s*>).*?(</script>)', lambda m: m[1]+json.dumps(data,ensure_ascii=False).replace('<','\\u003c')+m[2], text, flags=re.S)
    return text


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    config = load_config()
    changed = []
    for page in site_pages(config):
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
        'sitemap.xml': '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + ''.join('<url><loc>' + config['domain'] + public_path(p.name) + '</loc></url>' for p in site_pages(config) if p.name != '404.html' and p.name not in config.get('redirects', {})) + '</urlset>\n',
        '_redirects': '# Generated by scripts/sync-layout.py: legacy redirects and Google verification responses.\n' + ''.join(source + ' ' + public_path(destination) + ' 301\n' for legacy, destination in config.get('redirects', {}).items() for source in ['/' + legacy, public_path(legacy)]) + ''.join('/' + verification + ' ' + public_path(verification) + ' 200\n' for verification in config.get('googleVerificationFiles', [])),
    }
    for name, content in generated.items():
        file = ROOT / name
        if not file.exists() or file.read_text() != content:
            changed.append(name)
            if not args.check: file.write_text(content)
    if args.check and changed: raise SystemExit('Run python3 scripts/sync-layout.py, then format: '+', '.join(changed))
    print(f'{"PASS" if args.check else "Synced"}: {len(site_pages(config))} HTML routes, contacts, configuration and verified publication gates.')


if __name__ == '__main__':
    main()
