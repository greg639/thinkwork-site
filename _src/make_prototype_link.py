#!/usr/bin/env python3
"""Put a built mock on thinkwork.info at /p/<slug>/.

    python3 _src/make_prototype_link.py robs-plumbing "Rob's Plumbing"

This used to write a redirect page: a small stub that recorded the scan and
then sent the visitor to highstreet.peerlab.workers.dev/b/<slug>. Greg,
2026-09-25: "the URLs are different. They're a PLAB URL, not ThinkWork URLs."
He was right. The address a prospect ended up on, and the one left in their
history, belonged to a company they have never heard of.

So this copies the built page here instead. thinkwork.info is GitHub Pages and
the build is a single self-contained HTML file, so Pages can serve the real
thing at the same address and nothing ever leaves thinkwork.info.

The Cloudflare Worker keeps the tracked copy and still receives every scan: the
beacon compiled into each page posts to it by absolute address. Tracking is
unaffected; only the address a human sees has changed.

Called by ThinkWork Studio's build job as its "link" step, between the worker
deploy and the commit, so a build started from Studio publishes the mock rather
than a redirect back to the worker.
"""
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = Path("/root/highstreet-eastbourne/spine/dist/sites")


def main() -> int:
    if len(sys.argv) < 2:
        print("usage: make_prototype_link.py <slug> [name]", file=sys.stderr)
        return 2
    slug = sys.argv[1].strip().strip("/")
    if not slug or "/" in slug or slug.startswith("."):
        print(f"refusing a suspicious slug: {slug!r}", file=sys.stderr)
        return 2

    built = DIST / f"{slug}.html"
    if not built.exists():
        # A build that failed a gate is never written to dist/, which is the
        # point: this must not publish yesterday's page as if it were today's,
        # and it must not leave a redirect behind either.
        print(f"no built page at {built}.", file=sys.stderr)
        print("  The build either failed a gate or was never run. Nothing published.", file=sys.stderr)
        return 1

    dest = ROOT / "p" / slug / "index.html"
    dest.parent.mkdir(parents=True, exist_ok=True)
    before = dest.read_text(encoding="utf-8") if dest.exists() else None
    shutil.copyfile(built, dest)

    kb = dest.stat().st_size // 1024
    if before is None:
        what = "published"
    elif "Opening your preview" in before:
        what = "replaced the old redirect stub"
    elif before == dest.read_text(encoding="utf-8"):
        what = "unchanged"
    else:
        what = "updated"
    print(f"{slug}: {what} ({kb}KB) -> https://thinkwork.info/p/{slug}/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
