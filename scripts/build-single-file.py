#!/usr/bin/env python3
"""Build one self-contained HTML file from this site's sources.

    python3 scripts/build-single-file.py [output.html]

Default output: dist/eurest-cafe-teams-agent.html

Every stylesheet, script, image, and font is inlined as a data: URI, and the
Teams frame is embedded with srcdoc, so the result opens offline from any folder
(including file://). Its Content Security Policy is relaxed only enough to allow
those inline assets; the hosted site keeps the stricter policy from the source HTML.
"""
import base64
import html
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
MIME = {'.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml',
        '.woff2': 'font/woff2', '.css': 'text/css'}
SINGLE_CSP = ('<meta http-equiv="Content-Security-Policy" content="'
              "script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; "
              "font-src data:; connect-src 'none'; object-src 'none'; base-uri 'none'; "
              "form-action 'none'\" />")

CSP_META = re.compile(r'<meta http-equiv="Content-Security-Policy"[^>]*/>')
LINK = re.compile(r'<link rel="stylesheet" href="([^"]+)"\s*/>')
SCRIPT = re.compile(r'<script src="([^"]+)"([^>]*)></script>')
REF = re.compile(r"""(["'])((?:\.\./|\./)?assets/[^"']+)\1""")
URL = re.compile(r"url\((['\"]?)([^)'\"]+)\1\)")
IFRAME_SRC = re.compile(r' src="teams/ordering\.html"')


def data_uri(path):
    mime = MIME[path.suffix]
    return f"data:{mime};base64,{base64.b64encode(path.read_bytes()).decode()}"


def inline_refs(text, base):
    """Replace quoted asset paths (relative to `base`) with data: URIs."""
    return REF.sub(lambda m: f"{m.group(1)}{data_uri((base / m.group(2)).resolve())}{m.group(1)}", text)


def inline_css(path):
    css = path.read_text(encoding='utf-8')
    return URL.sub(lambda m: f"url({data_uri((path.parent / m.group(2)).resolve())})", css)


def inline_doc(path):
    """Return the document at `path` with all its assets inlined."""
    base = path.parent
    text = path.read_text(encoding='utf-8')
    text = CSP_META.sub(SINGLE_CSP, text)
    text = LINK.sub(lambda m: f"<style>\n{inline_css((base / m.group(1)).resolve())}\n</style>", text)

    def script(m):
        src = (base / m.group(1)).resolve()
        body = inline_refs(src.read_text(encoding='utf-8'), src.parent).replace('</script', '<\\/script')
        return "<script" + m.group(2) + ">\n" + body + "\n</script>"

    text = SCRIPT.sub(script, text)
    return inline_refs(text, base)


def build(out):
    frame = inline_doc(ROOT / 'teams' / 'ordering.html')
    shell = inline_doc(ROOT / 'index.html')
    shell = IFRAME_SRC.sub(lambda _: ' srcdoc="' + html.escape(frame, quote=True) + '"', shell)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(shell, encoding='utf-8')
    return out


if __name__ == '__main__':
    target = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'dist' / 'eurest-cafe-teams-agent.html'
    result = build(target.resolve())
    print(f"wrote {result} ({result.stat().st_size / 1e6:.1f} MB)")
