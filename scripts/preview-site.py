#!/usr/bin/env python3
"""Development preview with no-cache responses, optional reload and Pages-like 404s."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import hashlib
from urllib.parse import urlsplit

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--bind',default='127.0.0.1')
parser.add_argument('--port',type=int,default=8080)
parser.add_argument('--directory',type=Path,default=Path(__file__).resolve().parents[1])
parser.add_argument('--watch',action='store_true',help='Inject development-only reload polling')
parser.add_argument('--base-path',default='/',help='Mount the preview at the GitHub Pages URL path')
args = parser.parse_args()
if not args.base_path.startswith('/') or not args.base_path.endswith('/') or '..' in args.base_path:
    parser.error('base-path must be an absolute directory path')
root = args.directory.resolve()

RELOAD = b'''<script>
(async () => {
  let initial;
  const check = async () => {
    try {
      const version = await (await fetch('/__preview_version', {cache:'no-store'})).text();
      if (initial && version !== initial) location.reload();
      initial = version;
    } catch {}
  };
  await check();
  setInterval(check, 1600);
})();
</script>'''
RELOAD = RELOAD.replace(b'/__preview_version', (args.base_path+'__preview_version').encode())

class Preview(SimpleHTTPRequestHandler):
    def translate_path(self,path):
        parsed = urlsplit(path)
        if args.base_path != '/' and parsed.path.startswith(args.base_path):
            path = '/' + parsed.path[len(args.base_path):]
        return super().translate_path(path)

    def end_headers(self):
        self.send_header('Cache-Control','no-store')
        super().end_headers()

    def do_GET(self):
        if self.path == args.base_path+'__preview_version' and args.watch:
            files = sorted(root.glob('*.html')) + sorted((root/'assets').rglob('*'))
            version = hashlib.sha256('|'.join(str(p.stat().st_mtime_ns) for p in files if p.is_file()).encode()).hexdigest().encode()
            self.send_response(200)
            self.send_header('Content-Type','text/plain')
            self.send_header('Content-Length',str(len(version)))
            self.end_headers()
            self.wfile.write(version)
            return
        path = Path(self.translate_path(self.path))
        if path.is_dir() and path == root:
            path = root/'index.html'
        if args.watch and path.is_file() and path.suffix == '.html':
            body = path.read_bytes().replace(b'</body>',RELOAD+b'</body>')
            self.send_response(200)
            self.send_header('Content-Type','text/html; charset=utf-8')
            self.send_header('Content-Length',str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()

    def list_directory(self,path):
        self.send_error(404)

    def send_error(self,code,message=None,explain=None):
        if code == 404 and (root/'404.html').is_file():
            body = (root/'404.html').read_bytes()
            self.send_response(404)
            self.send_header('Content-Type','text/html; charset=utf-8')
            self.send_header('Content-Length',str(len(body)))
            self.end_headers()
            if self.command != 'HEAD': self.wfile.write(body)
        else:
            super().send_error(code,message,explain)

print(f'Preview: http://{args.bind}:{args.port}{args.base_path} | root={root} | reload={args.watch}',flush=True)
ThreadingHTTPServer((args.bind,args.port),partial(Preview,directory=str(root))).serve_forever()
