#!/usr/bin/env python3
"""Branded prototype links: thinkwork.info/p/<slug> -> the live prototype.

The prototypes are served by the Cloudflare worker (scan tracking, operator
console). thinkwork.info's DNS lives at Wix, so the worker cannot answer a
thinkwork.info address yet. This writes a small page at /p/<slug>/ that:

  1. records the scan on the worker (same beacon the prototype pages use), and
  2. sends the visitor on to the prototype.

So a QR on a business card reads thinkwork.info/p/<slug>, and the scan is still
counted. Once thinkwork.info's DNS moves to Cloudflare, delete these and let the
worker serve the address directly.

    python3 _src/make_prototype_link.py bourne-motors "Bourne Motors"
"""
import html
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WORKER = "https://highstreet.peerlab.workers.dev"

TPL = """<!doctype html>
<html lang="en-GB"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>{name}</title>
<link rel="canonical" href="{worker}/b/{slug}">
<style>
body{{margin:0;min-height:100vh;display:grid;place-items:center;background:#16150f;color:#f4f0e6;
font:400 17px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;padding:24px 16px;text-align:center}}
b{{display:block;font-size:22px;margin-bottom:8px}}
a{{color:#f2b705}}
</style>
</head><body>
<div><b>Opening your preview</b>
<p>One moment. If nothing happens, <a id="go" href="{worker}/b/{slug}">tap here</a>.</p></div>
<script>
(function(){{
  var TO = "{worker}/b/{slug}";
  var v;
  try {{
    v = localStorage.getItem("tw_v");
    if (!v) {{
      v = ([].map.call(crypto.getRandomValues(new Uint8Array(12)), function(x){{
        return "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"[x % 62];
      }})).join("");
      localStorage.setItem("tw_v", v);
    }}
  }} catch (e) {{ v = "cardscan" + Date.now(); }}
  function go() {{ location.replace(TO); }}
  var done = false, t = setTimeout(function(){{ if (!done) {{ done = true; go(); }} }}, 1200);
  try {{
    fetch("{worker}/_s", {{
      method: "POST", headers: {{ "content-type": "application/json" }}, keepalive: true,
      body: JSON.stringify({{ slug: "{slug}", v: v, source: "card" }})
    }}).then(finish, finish);
  }} catch (e) {{ finish(); }}
  function finish() {{ if (!done) {{ done = true; clearTimeout(t); go(); }} }}
}})();
</script>
</body></html>
"""


def main() -> None:
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    slug, name = sys.argv[1].strip().lower(), sys.argv[2].strip()
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]{1,62}", slug):
        sys.exit(f"bad slug: {slug!r}")
    out = ROOT / "p" / slug / "index.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(TPL.format(slug=slug, name=html.escape(name), worker=WORKER), encoding="utf-8")
    print(f"wrote {out.relative_to(ROOT)}  ->  https://thinkwork.info/p/{slug}/")


if __name__ == "__main__":
    main()
