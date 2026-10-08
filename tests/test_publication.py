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

    def test_unverified_information_never_renders(self):
        for slot in ['five-home','five-support','five-transparency','donation','legal-contact','legal-data','legal-privacy','documents']:
            self.assertEqual(layout.verified_content(slot,self.config),'')

    def test_five_per_mille_requires_source_year_and_tax_id(self):
        config = deepcopy(self.config)
        config['fivePerMille']['verified'] = True
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root/'config').mkdir()
            (root/'config/site.json').write_text(json.dumps(config))
            with patch.object(layout,'ROOT',root):
                with self.assertRaisesRegex(ValueError,'verification needs'):
                    layout.load_config()

    def test_verified_five_per_mille_slot_is_static_and_correctly_positioned(self):
        config = deepcopy(self.config)
        config['fivePerMille'] = {'verified':True,'year':2026,'taxId':'TEST-CODE','source':'test fixture'}
        rendered = layout.verified_content('five-home',config)
        self.assertIn('data-verified="fivePerMille"',rendered)
        self.assertIn('TEST-CODE',rendered)
        source = (ROOT/'index.html').read_text()
        self.assertLess(source.index('service-directory'),source.index('verified:five-home:start'))
        self.assertLess(source.index('verified:five-home:end'),source.index('id="process-title"'))
        self.assertLess(source.index('id="process-title"'),source.index('id="operativita"'))
        self.assertLess(source.index('id="operativita"'),source.index('id="faq-title"'))

    def test_incomplete_donation_does_not_render(self):
        self.config['donation']['iban'] = 'DO NOT PUBLISH'
        self.assertEqual(layout.verified_content('donation',self.config),'')

    def test_verified_legal_content_is_escaped_and_does_not_grant_qualification(self):
        self.config['legal'].update(verified=True,name='<Test>',source='test fixture')
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
        for name in ['robots.txt','sitemap.xml','assets/icons.svg','assets/abruzzo-map.svg','assets/mezzi-1440.webp','assets/mezzi-800.webp','assets/favicon.png','assets/social-preview.jpg']:
            self.assertTrue((public/name).is_file(),name)
        for private in ['config','templates','tests','scripts','README.md','assets/SOURCES.md']:
            self.assertFalse((public/private).exists(),private)

    def test_sitemap_excludes_legacy_routes_and_includes_association_and_volunteers(self):
        import xml.etree.ElementTree as ET
        urls = {item.text for item in ET.parse(ROOT/'sitemap.xml').iter() if item.tag.endswith('}loc')}
        self.assertIn(self.config['domain']+'/associazione.html',urls)
        self.assertIn(self.config['domain']+'/volontari.html',urls)
        for legacy in self.config['redirects']:
            self.assertNotIn(self.config['domain']+'/'+legacy,urls)

    def test_redirect_configuration_rejects_external_destinations_and_chains(self):
        for destination in ['https://example.test/', 'sostienici.html', '../contatti.html']:
            config = deepcopy(self.config)
            config['redirects']['trasparenza.html'] = destination
            with tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                (root/'config').mkdir()
                (root/'config/site.json').write_text(json.dumps(config))
                with patch.object(layout,'ROOT',root):
                    with self.assertRaisesRegex(ValueError,'Redirect'):
                        layout.load_config()

if __name__ == '__main__':
    unittest.main()
