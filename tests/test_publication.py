"""Regression checks for conservative publishing and complete Pages artifacts."""
from copy import deepcopy
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path
import json
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = spec_from_file_location('layout', ROOT/'scripts/sync-layout.py')
layout = module_from_spec(spec)
spec.loader.exec_module(layout)

class PublicationTests(unittest.TestCase):
    def setUp(self):
        self.config = layout.load_config()

    def isolated_config(self):
        config = deepcopy(self.config)
        config.update(redirects={}, documents=[], googleVerificationFile='')
        return config

    def test_unverified_information_never_renders(self):
        config = deepcopy(self.config)
        config['fivePerMille']['verified'] = False
        config['legal']['verified'] = False
        for document in config['documents']:
            document['verified'] = False
        for slot in ['five-home','five-support','five-transparency','donation','legal-contact','legal-data','legal-privacy','legal-association','documents']:
            self.assertEqual(layout.verified_content(slot,config),'')

    def test_five_per_mille_requires_source_and_tax_id_but_not_year(self):
        config = self.isolated_config()
        config['fivePerMille'].update(taxId='', source='', year=None)
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root/'config').mkdir()
            with patch.object(layout,'ROOT',root):
                (root/'config/site.json').write_text(json.dumps(config))
                with self.assertRaisesRegex(ValueError,'verification needs'):
                    layout.load_config()
                config['fivePerMille'].update(taxId='02227430663', source='confirmed by representative')
                (root/'config/site.json').write_text(json.dumps(config))
                self.assertTrue(layout.load_config()['fivePerMille']['verified'])

    def test_verified_card_without_fiscal_year_has_no_year_specific_claim(self):
        self.assertTrue(self.config['fivePerMille']['verified'])
        self.assertIsNone(self.config['fivePerMille']['year'])
        for slot in ['five-home', 'five-support']:
            rendered = layout.verified_content(slot, self.config)
            self.assertIn('02227430663', rendered)
            self.assertNotIn('2026', rendered)
        home = layout.verified_content('five-home', self.config)
        self.assertIn('data-copy-tax-id hidden', home)
        self.assertIn('data-tax-copy-status', home)
        self.assertNotIn('five-card', layout.verified_content('five-support', self.config))
        self.assertIn('Accreditamento', layout.verified_content('five-transparency', self.config))

    def test_verified_five_per_mille_slot_is_static_and_correctly_positioned(self):
        config = deepcopy(self.config)
        config['fivePerMille'] = {'verified':True,'year':None,'taxId':'02227430663','source':'test fixture'}
        rendered = layout.verified_content('five-home',config)
        self.assertIn('data-verified="fivePerMille"',rendered)
        self.assertIn('02227430663',rendered)
        source = (ROOT/'index.html').read_text()
        self.assertLess(source.index('service-directory'),source.index('verified:five-home:start'))
        self.assertLess(source.index('verified:five-home:end'),source.index('id="process-title"'))
        self.assertLess(source.index('id="process-title"'),source.index('id="operativita"'))
        self.assertLess(source.index('id="operativita"'),source.index('id="faq-title"'))

    def test_incomplete_donation_does_not_render(self):
        self.config['donation']['iban'] = 'DO NOT PUBLISH'
        self.assertEqual(layout.verified_content('donation',self.config),'')

    def test_verified_legal_content_is_escaped_and_does_not_grant_qualification(self):
        self.config['legal'].update(verified=True,name='<Test>',qualification='',runtsRegistered=False,source='test fixture')
        rendered = layout.verified_content('legal-data',self.config)
        self.assertIn('&lt;Test&gt;',rendered)
        self.assertNotIn('ODV',rendered)
        self.assertNotIn('ETS',rendered)

    def test_public_config_has_only_contact_fields_and_email_matches_approval(self):
        self.assertEqual(self.config['email'],'abruzzoassistenzaodv@gmail.com')
        app = (ROOT/'assets/app.js').read_text()
        self.assertNotIn('02227430663',app)
        self.assertNotIn('fivePerMille',app)
        self.assertNotIn('localStorage',app)

    def test_builder_checks_all_referenced_assets_and_does_not_activate_domain(self):
        result = subprocess.run([sys.executable,str(ROOT/'scripts/build-site.py')],capture_output=True,text=True)
        self.assertEqual(result.returncode,0,result.stdout+result.stderr)
        public = ROOT/'_site'
        self.assertFalse((public/'CNAME').exists())
        for name in ['robots.txt','sitemap.xml','_redirects','_headers','assets/icons.svg','assets/abruzzo-map.svg','assets/mezzi-1440.webp','assets/mezzi-800.webp','assets/favicon.png','assets/social-preview.jpg']:
            self.assertTrue((public/name).is_file(),name)
        self.assertEqual((public/'_headers').read_text(),(ROOT/'_headers').read_text())
        self.assertEqual((public/self.config['googleVerificationFile']).read_bytes(),(ROOT/self.config['googleVerificationFile']).read_bytes())
        self.assertEqual((public/'documents/statuto.pdf').read_bytes(),(ROOT/'documents/statuto.pdf').read_bytes())
        for private in ['config','templates','tests','scripts','README.md','OPERATIONS-PRIVACY.md','documents/README.md','assets/SOURCES.md']:
            self.assertFalse((public/private).exists(),private)

    def test_annual_distribution_requires_separate_evidence(self):
        config = self.isolated_config()
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root/'config').mkdir()
            with patch.object(layout,'ROOT',root):
                config['fivePerMille'].update(year=2026, yearSource='')
                (root/'config/site.json').write_text(json.dumps(config))
                with self.assertRaisesRegex(ValueError,'yearSource'):
                    layout.load_config()
                config['fivePerMille']['yearSource'] = 'annual distribution fixture'
                (root/'config/site.json').write_text(json.dumps(config))
                approved = layout.load_config()
                self.assertIn('Ammissione al riparto 2026 documentata',layout.verified_content('five-support',approved))
                for invalid in [True,'2026',1999,2101]:
                    config['fivePerMille']['year'] = invalid
                    (root/'config/site.json').write_text(json.dumps(config))
                    with self.assertRaisesRegex(ValueError,'invalid documented fiscal year'):
                        layout.load_config()

    def test_tax_id_matches_the_confirmed_legal_entity(self):
        config = self.isolated_config()
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root/'config').mkdir()
            with patch.object(layout,'ROOT',root):
                for tax_id, error in [('02227430664','must match'),('invented','11 digits')]:
                    config['fivePerMille']['taxId'] = tax_id
                    (root/'config/site.json').write_text(json.dumps(config))
                    with self.assertRaisesRegex(ValueError,error):
                        layout.load_config()

    def test_confirmed_institutional_data_and_schema_use_the_same_source(self):
        import re
        legal = self.config['legal']
        self.assertTrue(legal['verified'])
        self.assertEqual(legal['name'],'Abruzzo Assistenza – Organizzazione di Volontariato – Ente del Terzo Settore')
        self.assertEqual(legal['address'],"Via Fonte d'Amore SNC, Sulmona (AQ), Italia")
        self.assertEqual(legal['qualification'],'ODV / ETS')
        self.assertTrue(legal['runtsRegistered'])
        for file in ['contatti.html','associazione.html','privacy.html']:
            text = (ROOT/file).read_text()
            self.assertIn(legal['taxId'],text)
            self.assertNotIn('Via Fonte Romana',text)
        text = (ROOT/'index.html').read_text()
        schema = json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>',text,re.S)[1])
        self.assertEqual(schema['legalName'],legal['name'])
        self.assertEqual(schema['address'],legal['address'])
        self.assertEqual(schema['taxID'],legal['taxId'])

    def test_missing_statute_never_generates_a_public_download(self):
        config = self.isolated_config()
        self.assertEqual(layout.verified_content('documents',config),'')
        config['documents'] = [{'verified':True,'title':'Statuto','source':'fixture approval','path':'documents/statuto.pdf'}]
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root/'config').mkdir()
            (root/'config/site.json').write_text(json.dumps(config))
            with patch.object(layout,'ROOT',root):
                with self.assertRaisesRegex(ValueError,'existing local documents/'):
                    layout.load_config()

    def test_privacy_does_not_invent_retention_or_consent(self):
        privacy = ' '.join((ROOT/'privacy.html').read_text().split())
        self.assertIn('ancora formalizzato una politica di conservazione',privacy)
        self.assertIn('articolo 9',privacy)
        self.assertIn('una persona incaricata alla volta',privacy)
        self.assertIn('presidente',privacy)
        self.assertIn('vicepresidente',privacy)
        for promise in ['cancellati automaticamente dopo','conservati per 30 giorni','consenso implicito','Google Analytics','Meta Pixel']:
            self.assertNotIn(promise,privacy)

    def test_sitemap_excludes_legacy_routes_and_includes_association_and_volunteers(self):
        import xml.etree.ElementTree as ET
        urls = {item.text for item in ET.parse(ROOT/'sitemap.xml').iter() if item.tag.endswith('}loc')}
        self.assertIn(self.config['domain']+'/associazione',urls)
        self.assertIn(self.config['domain']+'/volontari',urls)
        self.assertTrue(all(url.startswith(self.config['domain']+'/') and not url.endswith('.html') for url in urls))
        for legacy in self.config['redirects']:
            self.assertNotIn(self.config['domain']+'/'+legacy,urls)

    def test_redirect_configuration_rejects_external_destinations_and_chains(self):
        for destination in ['https://example.test/', 'sostienici.html', '../contatti.html']:
            config = self.isolated_config()
            config['redirects']['trasparenza.html'] = destination
            with tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                (root/'config').mkdir()
                (root/'config/site.json').write_text(json.dumps(config))
                with patch.object(layout,'ROOT',root):
                    with self.assertRaisesRegex(ValueError,'Redirect'):
                        layout.load_config()

    def test_cloudflare_legacy_redirects_preserve_destination_anchors(self):
        rules = (ROOT/'_redirects').read_text().splitlines()
        self.assertIn('/sostienici.html /associazione#sostegno 301',rules)
        self.assertIn('/sostienici /associazione#sostegno 301',rules)
        self.assertIn('/trasparenza.html /contatti#associazione 301',rules)
        self.assertIn('/trasparenza /contatti#associazione 301',rules)
        self.assertEqual(layout.public_path('index.html'),'/')
        self.assertEqual(layout.public_path('contatti.html#associazione'),'/contatti#associazione')

    def test_search_exclusion_does_not_cover_the_official_domain(self):
        import re
        patterns = [line for line in (ROOT/'_headers').read_text().splitlines() if line.startswith('https://')]
        def excluded(url):
            for pattern in patterns:
                expression = re.escape(pattern).replace(r'\*','.*')
                expression = re.sub(r':[A-Za-z]\w*','[^./]+',expression)
                if re.fullmatch(expression,url): return True
            return False
        for origin in ['https://abruzzo-assistenza.pages.dev','https://preview.abruzzo-assistenza.pages.dev','https://db447800.abruzzo-assistenza.pages.dev']:
            for path in ['/','/servizi','/contatti?servizio=disabili']:
                self.assertTrue(excluded(origin+path),origin+path)
        for path in ['/','/servizi','/contatti','/sitemap.xml']:
            self.assertFalse(excluded(self.config['domain']+path))
        self.assertFalse(excluded('https://unrelated.example/'))

    def test_public_email_anchors_opt_out_of_edge_obfuscation_without_js(self):
        import re
        for path in layout.site_pages(self.config):
            text = path.read_text()
            anchors = re.findall(r'<a\b[^>]*href="mailto:[^"]*"[^>]*>.*?</a>',text,re.S)
            exempted = re.findall(r'<!--email_off-->\s*(<a\b[^>]*href="mailto:[^"]*"[^>]*>.*?</a>)\s*<!--/email_off-->',text,re.S)
            self.assertEqual(anchors,exempted,path.name)
            rendered = layout.sync_page(text,path.name,self.config)
            self.assertEqual(layout.Markup(text).tokens,layout.Markup(rendered).tokens,path.name)

    def test_google_ownership_response_is_exact_and_never_becomes_a_content_page(self):
        filename = self.config['googleVerificationFile']
        self.assertEqual(filename,'googleece696937ad74014.html')
        self.assertEqual((ROOT/filename).read_text().strip(),'google-site-verification: '+filename)
        self.assertNotIn(filename,{page.name for page in layout.site_pages(self.config)})
        self.assertNotIn(filename,(ROOT/'sitemap.xml').read_text())
        self.assertIn('/'+filename+' /'+filename.removesuffix('.html')+' 200',(ROOT/'_redirects').read_text().splitlines())

    def test_google_ownership_rejects_changed_content_or_nonlocal_paths(self):
        config = self.isolated_config()
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root/'config').mkdir()
            with patch.object(layout,'ROOT',root):
                for filename in ['../google123.html','https://example.test/google123.html','index.html']:
                    config['googleVerificationFile'] = filename
                    (root/'config/site.json').write_text(json.dumps(config))
                    with self.assertRaisesRegex(ValueError,'local Google HTML filename'): layout.load_config()
                config['googleVerificationFile'] = 'google123.html'
                (root/'config/site.json').write_text(json.dumps(config))
                (root/'google123.html').write_text('wrong verification content')
                with self.assertRaisesRegex(ValueError,'exact supplied token'): layout.load_config()
                (root/'google123.html').write_text('google-site-verification: google123.html\n')
                self.assertEqual(layout.load_config()['googleVerificationFile'],'google123.html')

    def test_confirmed_location_and_public_statute_are_available_without_javascript(self):
        text = (ROOT/'contatti.html').read_text()
        content = ' '.join(text.split())
        self.assertIn(self.config['legal']['mapsUrl'],text)
        self.assertIn('non è un punto di ricevimento del pubblico',content)
        self.assertEqual(self.config['legal']['address'],"Via Fonte d'Amore SNC, Sulmona (AQ), Italia")
        document = next(item for item in self.config['documents'] if item['path']=='documents/statuto.pdf')
        self.assertTrue(document['verified'] and document['source'])
        self.assertTrue((ROOT/document['path']).read_bytes().startswith(b'%PDF-'))
        self.assertIn('href="documents/statuto.pdf"',text)
        self.assertIn('Firme e nominativi oscurati',content)
        self.assertIn('sede alla data della registrazione',content)

    def test_hosting_disclosure_and_ci_match_cloudflare(self):
        privacy = (ROOT/'privacy.html').read_text()
        self.assertIn('Cloudflare Pages',privacy)
        self.assertIn('https://www.cloudflare.com/privacypolicy/',privacy)
        self.assertNotIn('GitHub Pages',privacy)
        workflow = (ROOT/'.github/workflows/pages.yml').read_text()
        self.assertIn('node tests/browser.test.mjs',workflow)
        self.assertIn('prettier',workflow)
        for obsolete in ['actions/deploy-pages','actions/configure-pages','actions/upload-pages-artifact','pages: write','id-token: write','git push','git commit']:
            self.assertNotIn(obsolete,workflow)

if __name__ == '__main__':
    unittest.main()
