#!/usr/bin/env python3
"""Build the ThinkWork small-business site (relaunch, 2026-09).

Plain static HTML for GitHub Pages: fast, readable by AI assistants, no build
chain to break. Shared header, footer and head live here once so pages cannot
drift. Run from anywhere:  python3 _src/build.py

The airsoft page is a separate property on purpose (its own look, no links to
or from the main site), so it is built from _src/airsoft.html, not from the
shared layout.
"""
from __future__ import annotations

import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://thinkwork.info"
API = "https://app.peerlab.ai"
CSS_V = "1"

FONTS = ("https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,500..900"
         "&family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap")

NAV = [
    ("/what-we-build/", "What we build"),
    ("/pricing/", "Prices"),
    ("/advisory/", "Advisory"),
    ("/work/", "Work"),
    ("/about/", "About"),
]

# ---------------------------------------------------------------------------
# The ideas board. One source for the home page picker, the What We Build
# page and llms.txt, so the three can never disagree. Plain words only: every
# line should make sense said out loud in a butcher's back room.
# ---------------------------------------------------------------------------
IDEAS = [
    ("butcher", "Butcher, deli or farm shop", [
        ("Sunday roast club", "A box every month, paid up front. Money in the bank before the meat leaves the block."),
        ("Christmas and BBQ pre-orders", "Orders and payment taken weeks ahead, so you buy stock knowing what's sold."),
        ("Click and collect", "Customers order and pay online, then pick up at a time that suits your counter."),
    ]),
    ("bakery", "Bakery or cafe", [
        ("Bread club", "Regulars pay monthly for a weekly loaf. You bake to order and waste less."),
        ("Cake pre-orders", "Celebration cakes ordered and paid for online, with a deposit that stops no-shows."),
        ("Bring a friend", "A free coffee for anyone who brings in a new regular. Tracked for you."),
    ]),
    ("garage", "Garage or MOT centre", [
        ("Service plan", "Customers spread the cost of servicing monthly. You get steady money and they keep coming back."),
        ("Online booking", "MOTs and services booked straight into your diary, day or night."),
        ("Reminders that book", "A nudge when the MOT is due, with a button to book it."),
    ]),
    ("trades", "Trades", [
        ("Annual cover plan", "Boiler service, safety checks or maintenance, paid monthly. Work in the diary before the phone rings."),
        ("Quote requests that qualify", "The job, the postcode and photos, collected before you pick up the phone."),
        ("Bring a neighbour", "A reward for every customer who sends you the house next door."),
    ]),
    ("studio", "Gym, studio or classes", [
        ("Memberships", "Monthly members, taken and renewed automatically. No chasing."),
        ("Class packs", "Ten classes paid up front. Good for people who won't commit to monthly yet."),
        ("Bring a friend", "Members earn a free month for each friend who joins."),
    ]),
    ("clinic", "Clinic or therapist", [
        ("Care plan", "Regular treatments on a monthly plan, so clients keep coming and you know what's booked."),
        ("Online booking with deposits", "Clients book and pay a deposit online. Fewer empty slots."),
        ("Rebooking prompts", "A reminder when it's time for the next visit, with a link to book it."),
    ]),
    ("florist", "Florist or gift shop", [
        ("Flower subscription", "Fresh flowers every week or month, paid in advance."),
        ("Big-day pre-orders", "Valentine's and Mother's Day ordered and paid weeks ahead, so you buy the right stock."),
        ("Gift cards", "Sold online all year, spent in the shop."),
    ]),
    ("venue", "Activity venue", [
        ("Season pass", "Regulars pay once for the season. Money up front before the busy months."),
        ("Pre-booked sessions", "Every slot booked and paid online, with a deposit on group bookings."),
        ("Group and party packages", "Birthdays and stag dos booked as one bundle, paid in full before the day."),
    ]),
]

PLANS = [
    {
        "key": "starter", "name": "Starter", "price": 35,
        "replaces": "Wix, Squarespace or WordPress, and whoever fixes it when it breaks.",
        "includes": ["A website that works on phones and is easy to buy from",
                     "Hosting, security and updates",
                     "Edits when you need them",
                     "Built so AI assistants can read it"],
    },
    {
        "key": "growth", "name": "Growth", "price": 99, "pick": True,
        "replaces": "Starter, plus the booking app, the membership app and the pre-order add-on.",
        "includes": ["Everything in Starter",
                     "Bookings",
                     "Memberships and subscriptions",
                     "Pre-orders",
                     "Rewards for bringing a friend",
                     "Your customer list, in one place",
                     "The money-making idea we pick together, built in"],
    },
    {
        "key": "premium", "name": "Premium", "price": 199,
        "replaces": "Growth, plus the chat tool, the copywriter and the software you'd otherwise have made.",
        "includes": ["Everything in Growth",
                     "Work to get you found by AI assistants",
                     "New articles for your site every month",
                     "An AI assistant that answers questions and takes bookings",
                     "Software built for how your business runs, like check-in or tracking"],
    },
]

SETUP = 650
CUR = ' aria-current="page"'
PICK = ' class="pick"'
ADVISORY = 150


def esc(s: str) -> str:
    return html.escape(s, quote=True)


def jsonld(obj) -> str:
    return ('<script type="application/ld+json">'
            + json.dumps(obj, ensure_ascii=False, separators=(",", ":"))
            + "</script>")


ORG = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": SITE + "/#org",
    "name": "ThinkWork",
    "url": SITE + "/",
    "logo": SITE + "/static/tw/og-thinkwork.png",
    "image": SITE + "/static/tw/og-thinkwork.png",
    "email": "greg@thinkwork.info",
    "description": ("ThinkWork builds local businesses one owned system: website, bookings, "
                    "memberships, subscriptions and pre-orders, picked with the owner to bring "
                    "in more money, for less than the separate apps it replaces."),
    "areaServed": {"@type": "Country", "name": "United Kingdom"},
    "priceRange": "£35 to £199 a month",
    "founder": {"@type": "Person", "name": "Greg McCallum", "url": "https://gregrcmccallum.com/"},
    "knowsAbout": ["Small business websites", "Online booking", "Memberships and subscriptions",
                   "Pre-orders", "AI search visibility", "AI chat assistants"],
}


def head(title: str, desc: str, path: str, extra_ld: list | None = None) -> str:
    url = SITE + path
    blocks = [ORG] + (extra_ld or [])
    return f"""<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="ThinkWork">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE}/static/tw/og-thinkwork.png">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#16150f">
<link rel="icon" type="image/svg+xml" href="/static/tw/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{FONTS}">
<link rel="stylesheet" href="/static/tw/site.css?v={CSS_V}">
{"".join(jsonld(b) for b in blocks)}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
"""


def header(path: str) -> str:
    links = "".join(
        f'<a href="{h}"{CUR if path == h else ""}>{esc(t)}</a>' for h, t in NAV)
    return f"""<header class="site-head"><div class="wrap">
<a class="brand" href="/"><i aria-hidden="true"></i>ThinkWork</a>
<button class="menu-btn" type="button" aria-expanded="false" aria-controls="nav">Menu</button>
<nav class="nav" id="nav" aria-label="Main">{links}<a class="btn hi" href="/book/#quote">Free build quote</a></nav>
</div></header>
<main id="main">
"""


FOOTER = """</main>
<footer class="site-foot"><div class="wrap">
<div class="cols">
<div><a class="brand" href="/"><i aria-hidden="true"></i>ThinkWork</a>
<p style="margin-top:14px;max-width:34ch">Websites and the systems that bring in money, for local businesses. Built for you, owned by you.</p></div>
<div><h4>The offer</h4><a href="/what-we-build/">What we build</a><a href="/pricing/">Prices</a><a href="/advisory/">Advisory</a></div>
<div><h4>Us</h4><a href="/work/">Work</a><a href="/about/">About</a><a href="/book/#quote">Get a free build quote</a><a href="mailto:greg@thinkwork.info">greg@thinkwork.info</a></div>
</div>
<div class="legal">&copy; 2026 ThinkWork. Prices exclude VAT where it applies.</div>
</div></footer>
<script src="/static/tw/site.js?v=2" defer></script>
</body>
</html>
"""


def page(path: str, title: str, desc: str, body: str, extra_ld: list | None = None) -> None:
    out = ROOT / path.strip("/") / "index.html" if path != "/" else ROOT / "index.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(head(title, desc, path, extra_ld) + header(path) + body + FOOTER, encoding="utf-8")


# ---------------------------------------------------------------------------
# shared blocks
# ---------------------------------------------------------------------------

def picker(cta: bool = True) -> str:
    tabs, panels = [], []
    for i, (key, label, ideas) in enumerate(IDEAS):
        sel = i == 0
        tabs.append(f'<button role="tab" id="t-{key}" aria-controls="p-{key}" aria-selected="{"true" if sel else "false"}"'
                    f' tabindex="{0 if sel else -1}">{esc(label)}</button>')
        rows = "".join(
            f'<div class="idea"><span class="tick" aria-hidden="true">&pound;</span><div><b>{esc(n)}</b><p>{esc(d)}</p></div></div>'
            for n, d in ideas)
        foot = (f'<div class="picker-foot"><p>Starting points, not a menu. We pick the one that fits you when we talk it through.</p>'
                f'<a class="btn" href="/book/?type={key}#quote">Talk it through, free</a></div>') if cta else ""
        panels.append(f'<div class="picker-panel" role="tabpanel" id="p-{key}" aria-labelledby="t-{key}"{"" if sel else " hidden"}>'
                      f'<h3>{esc(label)}</h3>{rows}{foot}</div>')
    return (f'<div class="picker" data-picker><div class="picker-list" role="tablist" aria-label="Type of business">'
            f'{"".join(tabs)}</div><div>{"".join(panels)}</div></div>')


def ledger() -> str:
    rows = []
    for p in PLANS:
        inc = "".join(f"<li>{esc(x)}</li>" for x in p["includes"])
        tag = '<span class="tag">Where we\'d start</span>' if p.get("pick") else ""
        rows.append(
            f'<tr{PICK if p.get("pick") else ""} id="{p["key"]}">'
            f'<td><span class="plan-name">{p["name"]}</span>{tag}</td>'
            f'<td data-h="Monthly"><span class="from">From</span><span class="price">&pound;{p["price"]}<small> / month</small></span></td>'
            f'<td data-h="What you get"><ul>{inc}</ul></td>'
            f'<td data-h="Replaces" class="replaces">{esc(p["replaces"])}</td></tr>')
    return ('<table class="ledger"><thead><tr><th>Plan</th><th>Monthly</th><th>What you get</th><th>Replaces</th></tr></thead>'
            f'<tbody>{"".join(rows)}</tbody></table>')


ADDON = f"""<div class="addon">
<div><span class="kicker" style="margin-bottom:8px">Add-on, for any plan</span>
<h3>No-BS Advisory</h3>
<p>An hour a month with Greg on the business itself. Targets, money, staff, and whether the shop lives up to the new website. Only for ThinkWork clients. <a href="/advisory/">What it covers</a></p></div>
<div class="price">+&pound;{ADVISORY}<small style="font:500 15px var(--text);color:var(--mute)"> / month</small></div>
</div>"""

TERMS = f"""<div class="terms">
<div><b>&pound;{SETUP} setup, once</b>Design, build and launch.</div>
<div><b>12-month minimum</b>Then month to month.</div>
<div><b>Pay on launch day</b>Setup and first month are due the day it goes live. Nothing before.</div>
<div><b>Yours to keep</b>Your site, your domain, your customer list.</div>
</div>"""

CTA_BAND = """<section class="dark band"><div class="wrap cta-band">
<span class="kicker">Next step</span>
<h2>Find out what your business could be earning.</h2>
<p>Tell us what you run and what you pay for now. We'll come back with an idea and a price.</p>
<div class="row-btns"><a class="btn hi" href="/book/#quote">Get a free build quote</a></div>
</div></section>"""


def calculator() -> str:
    rows = [
        ("site", "Your website", "Wix, Squarespace, WordPress hosting", "base"),
        ("fix", "Someone to update it", "An agency retainer, or a freelancer", "base"),
        ("booking", "Booking app", "Calendly, Acuity, Eventbrite fees", "extra"),
        ("email", "Email tool", "Mailchimp and the like", "extra"),
        ("members", "Memberships or subscriptions", "A plugin or a separate app", "extra"),
        ("shop", "Online shop or pre-orders", "Shop add-on or plan upgrade", "extra"),
        ("other", "Anything else", "Chat tools, form tools, plugins", "extra"),
    ]
    ins = "".join(
        f'<div class="calc-row"><label for="c-{k}">{esc(t)}<span>{esc(h)}</span></label>'
        f'<div class="money"><input id="c-{k}" type="number" inputmode="decimal" min="0" step="1" placeholder="0" data-cost="{c}" aria-label="{esc(t)} per month, pounds"></div></div>'
        for k, t, h, c in rows)
    ins += ('<div class="calc-row"><label for="c-once">Paid an agency to build it?<span>One-off, this year</span></label>'
            '<div class="money"><input id="c-once" type="number" inputmode="decimal" min="0" step="1" placeholder="0" data-cost="once" aria-label="One-off build cost, pounds"></div></div>')
    return f"""<div class="calc" data-calc>
<div class="calc-in"><p class="small" style="margin-bottom:6px">Monthly costs. Leave anything you don't pay at zero.</p>{ins}</div>
<div class="receipt" aria-live="polite">
<h4>Year one</h4>
<div class="ln"><span>You pay now, monthly</span><span data-out="monthly">&pound;0</span></div>
<div class="ln"><span>One-off build</span><span data-out="oneoff">&pound;0</span></div>
<div class="ln tot"><span>Your year</span><span data-out="year">&pound;0</span></div>
<div class="rule"></div>
<div class="ln"><span>ThinkWork <span data-out="plan">Starter</span></span><span><span data-out="planm">&pound;35</span>/mo</span></div>
<div class="ln"><span>Setup, once</span><span>&pound;{SETUP}</span></div>
<div class="ln tot"><span>Our year</span><span data-out="ouryear">&pound;1,070</span></div>
<div class="rule"></div>
<div class="ln"><span>Year two, you</span><span data-out="year2">&pound;0</span></div>
<div class="ln"><span>Year two, us</span><span data-out="ouryear2">&pound;420</span></div>
<p class="verdict" data-out="verdict">Fill in what you pay now.</p>
<div class="row-btns" style="margin-top:14px"><a class="btn" data-quote-link href="/book/#quote">Get a real quote</a></div>
<div class="foot">Uses Starter if you only pay for a website, Growth if you pay for anything else. Excludes the money a new idea brings in.</div>
</div>
</div>"""


# ---------------------------------------------------------------------------
# pages
# ---------------------------------------------------------------------------

def home() -> None:
    body = f"""
<section class="hero"><div class="wrap hero-grid">
<div class="rv">
<span class="kicker">Websites and money-making systems for local businesses</span>
<h1>Stop renting your website. <span class="mark">Make it earn.</span></h1>
<p class="lead">One system for your business: website, bookings, memberships, pre-orders. Picked with you, built for you, owned by you. For less than the apps you pay for now.</p>
<div class="row-btns"><a class="btn hi" href="/book/#quote">Get a free build quote</a><a class="btn ghost" href="/pricing/">See prices</a></div>
<p class="hero-note">Built by a commercial operator, not a web agency.</p>
</div>
<div class="receipt rv" aria-label="What a typical small business pays for, compared with one ThinkWork plan">
<h4>What you're paying for now</h4>
<div class="ln"><span class="strike">Website builder</span><span class="strike">a bill</span></div>
<div class="ln"><span class="strike">Booking app</span><span class="strike">a bill</span></div>
<div class="ln"><span class="strike">Email tool</span><span class="strike">a bill</span></div>
<div class="ln"><span class="strike">Membership app</span><span class="strike">a bill</span></div>
<div class="ln"><span class="strike">Shop add-on</span><span class="strike">a bill</span></div>
<div class="ln"><span class="strike">Someone to fix it</span><span class="strike">a bill</span></div>
<div class="rule"></div>
<div class="ln tot"><span>One ThinkWork plan</span><span>from &pound;35/mo</span></div>
<div class="foot">Work out yours on the <a href="/pricing/#calculator">prices page</a></div>
</div>
</div></section>

<section class="dark band"><div class="wrap split">
<div><span class="kicker">Sound familiar?</span>
<p class="pull">A website, a booking app, something for emails. None of it talks to each other.</p></div>
<div class="body">
<p>And none of it brings in a penny you weren't getting already. It just sits there, costing you every month.</p>
<p>Big companies do it differently. Memberships. Subscriptions. Pre-orders. Rewards for bringing a friend. Clever ways to earn more from the customers they already have. They pay a fortune for them, and nobody has ever brought them to a business like yours.</p>
<p>That's what ThinkWork does. Greg McCallum went from cold caller to Chief Commercial Officer, and has been a fractional CRO and CCO for tech startups across Europe and the US. The teams he's led have brought in over $1B. Now he brings the same ideas to local businesses, and builds the system that runs them.</p>
</div>
</div></section>

<section><div class="wrap">
<span class="kicker">What could your business earn?</span>
<h2 style="max-width:18ch;margin-bottom:36px">The website gets you in the door. <span class="mark">This is what pays.</span></h2>
{picker()}
</div></section>

<section class="paper-2 band"><div class="wrap">
<span class="kicker">How it works</span>
<h2 style="max-width:16ch;margin-bottom:36px">From a chat to money coming in.</h2>
<div class="docket">
<div class="docket-row"><span class="when">Step one</span><h3>Talk it through</h3><p>We learn how your business makes money now, and pick the idea that fits. Free, and no pressure.</p></div>
<div class="docket-row"><span class="when">Step two</span><h3>We build it</h3><p>Your website and the system behind it, built for you. You check everything before it goes live.</p></div>
<div class="docket-row"><span class="when">Launch day</span><h3>It goes live</h3><p>You pay the setup and first month the same day. Not a penny before.</p></div>
<div class="docket-row"><span class="when">Every month</span><h3>We keep it running</h3><p>Hosting, fixes and edits are covered. You see what's coming in, and we tell you what to try next.</p></div>
</div>
</div></section>

<section class="dark band"><div class="wrap split">
<div><span class="kicker">The AI part, in plain English</span>
<h2 style="max-width:12ch">People ask AI now. Make sure it knows you.</h2></div>
<ul class="list-plain">
<li><div><b>Found by AI.</b> More people ask ChatGPT or Google's AI for a recommendation. Your site is built so those assistants can read it and point people to you.</div></li>
<li><div><b>Answered by AI.</b> A chat assistant on your site answers questions and takes bookings, at 11pm on a Sunday if that's when people ask.</div></li>
<li><div><b>Written with AI.</b> Fresh articles on your site every month to keep you showing up in searches. A person checks every one before it goes up.</div></li>
</ul>
</div></section>

<section><div class="wrap">
<div class="split" style="margin-bottom:36px">
<div><span class="kicker">Prices</span><h2>Clear prices. From &pound;35 a month.</h2></div>
<div class="body"><p>Three plans. Pick the one that matches what you'd like the business to do. Everything is on the page, including the setup fee.</p></div>
</div>
{ledger()}
<div class="row-btns" style="margin-top:24px"><a class="btn" href="/pricing/">Full prices and the savings calculator</a></div>
</div></section>

<section class="paper-2 band"><div class="wrap split">
<div><span class="kicker">Owned, not rented</span><h2 style="max-width:12ch">Yours. Not ours.</h2></div>
<div class="body"><p>Your website, your domain and your customer list belong to you. We host it and keep it running. If you ever leave, they go with you.</p>
<p class="small">The plans have a 12-month minimum, then run month to month.</p></div>
</div></section>
{CTA_BAND}
"""
    faq = {"@context": "https://schema.org", "@type": "ItemList", "name": "ThinkWork plans",
           "itemListElement": [
               {"@type": "Offer", "name": f'{p["name"]} plan', "price": p["price"], "priceCurrency": "GBP",
                "description": "; ".join(p["includes"]), "url": f"{SITE}/pricing/#{p['key']}"}
               for p in PLANS]}
    page("/", "ThinkWork: websites that earn, for local businesses",
         "One owned system for your business: website, bookings, memberships and pre-orders, picked with you to bring in more money. From £35 a month.",
         body, [faq])


def what_we_build() -> None:
    parts = [
        ("The website", "Fast, works on phones, and easy to buy from. Designed around your business, not a template everyone else has.", "All plans"),
        ("Bookings", "Customers book and pay online, straight into your diary.", "Growth and Premium"),
        ("Memberships and subscriptions", "Monthly clubs, plans and boxes, taken and renewed automatically.", "Growth and Premium"),
        ("Pre-orders", "Big days and busy seasons sold weeks ahead, so you buy the right stock.", "Growth and Premium"),
        ("Rewards for bringing a friend", "Customers earn something for every new customer they send you. Tracked for you.", "Growth and Premium"),
        ("Your customer list", "Everyone who books, buys or joins, in one place you own.", "Growth and Premium"),
        ("Found by AI", "Work to make sure AI assistants can read your business and recommend it.", "Premium, and every site is built AI-readable"),
        ("Articles every month", "Written with AI, checked by a person, published for you.", "Premium"),
        ("AI chat assistant", "Answers questions and takes bookings on your site, day and night.", "Premium"),
        ("Software for how you run", "Check-in, tracking, staff tablets. Whatever your business needs that no app does properly.", "Premium"),
    ]
    rows = "".join(
        f'<div class="docket-row"><span class="when">{esc(w)}</span><h3>{esc(t)}</h3><p>{esc(d)}</p></div>'
        for t, d, w in parts)
    body = f"""
<section class="hero"><div class="wrap">
<span class="kicker">What we build</span>
<h1 style="max-width:14ch">Everything your business runs on. <span class="mark">In one place.</span></h1>
<p class="lead">A website and the systems behind it. Built once for you, run by us, owned by you.</p>
</div></section>

<section class="band" style="padding-top:48px"><div class="wrap">
<div class="docket">{rows}</div>
</div></section>

<section class="paper-2 band"><div class="wrap">
<span class="kicker">The ideas</span>
<h2 style="max-width:18ch;margin-bottom:12px">What we'd build for a business like yours.</h2>
<p class="lead" style="margin-bottom:36px">These are starting points. The right one comes out of a conversation about how you make money now.</p>
{picker()}
</div></section>

<section><div class="wrap">
<span class="kicker">Which plan has what</span>
<h2 style="margin-bottom:36px">The plans side by side.</h2>
{ledger()}
</div></section>
{CTA_BAND}
"""
    page("/what-we-build/", "What we build | ThinkWork",
         "Websites, bookings, memberships, subscriptions, pre-orders, AI chat and bespoke software for local businesses. Built for you and owned by you.",
         body)


def pricing() -> None:
    faqs = [
        ("Why is there a setup fee?", f"It covers designing and building your site and systems. It's £{SETUP}, once, and it's due the day your site goes live, not before."),
        ("Why a 12-month minimum?", "Building your system is most of the work, and it happens at the start. The minimum term covers that. After 12 months it runs month to month."),
        ("What does \"from\" mean?", "Most businesses pay the price shown. If you need something bigger, like a lot of custom software on Premium, we'll price it on the call before anything is built."),
        ("Do I own it?", "Yes. Your site, your domain and your customer list are yours. If you leave, they go with you."),
        ("Can I change plans?", "Yes. Most people start on Starter or Growth and move up when they're ready for more."),
        ("Can I just buy the advisory?", "No. Advisory is only for ThinkWork clients, because it works from the real numbers your system shows us."),
        ("Is VAT included?", "Prices exclude VAT where it applies."),
    ]
    faq_html = "".join(f"<details><summary>{esc(q)}</summary><p>{esc(a)}</p></details>" for q, a in faqs)
    faq_ld = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faqs]}
    offers = {"@context": "https://schema.org", "@type": "Service", "name": "ThinkWork plans",
              "provider": {"@id": SITE + "/#org"},
              "offers": [{"@type": "Offer", "name": p["name"], "price": p["price"], "priceCurrency": "GBP",
                          "priceSpecification": {"@type": "UnitPriceSpecification", "price": p["price"],
                                                 "priceCurrency": "GBP", "unitText": "month"},
                          "description": "; ".join(p["includes"])} for p in PLANS]}
    body = f"""
<section class="hero"><div class="wrap">
<span class="kicker">Prices</span>
<h1 style="max-width:13ch">Everything on the page. <span class="mark">Nothing hidden.</span></h1>
<p class="lead">Three plans, one setup fee, and an advisory add-on if you want it.</p>
</div></section>

<section class="band" style="padding-top:48px"><div class="wrap">
{ledger()}
{ADDON}
{TERMS}
</div></section>

<section class="paper-2 band" id="calculator"><div class="wrap">
<span class="kicker">Savings calculator</span>
<h2 style="max-width:16ch;margin-bottom:12px">What you pay now, against us.</h2>
<p class="lead" style="margin-bottom:36px">Put in what you actually pay. It counts our setup fee too, so year one is honest.</p>
{calculator()}
</div></section>

<section><div class="wrap split">
<div><span class="kicker">Questions</span><h2 style="max-width:10ch">The fine print, in plain words.</h2></div>
<div class="faq">{faq_html}</div>
</div></section>
{CTA_BAND}
"""
    page("/pricing/", "Prices | ThinkWork",
         f"Starter from £35, Growth from £99, Premium from £199 a month. £{SETUP} setup, paid on launch day. Optional £{ADVISORY} a month advisory. Savings calculator included.",
         body, [faq_ld, offers])


def advisory() -> None:
    body = f"""
<section class="hero"><div class="wrap hero-grid">
<div>
<span class="kicker">No-BS Advisory</span>
<h1 style="max-width:12ch">Someone in your corner. <span class="mark">Once a month.</span></h1>
<p class="lead">Running a business on your own is lonely. You're working in it all day, and there's no one to work on it with.</p>
</div>
<div class="receipt"><h4>The advisory</h4>
<div class="ln"><span>One hour, every month</span><span>&check;</span></div>
<div class="ln"><span>Your real numbers</span><span>&check;</span></div>
<div class="ln"><span>A plan for next month</span><span>&check;</span></div>
<div class="rule"></div>
<div class="ln tot"><span>Add to any plan</span><span>&pound;{ADVISORY}/mo</span></div>
<div class="foot">For ThinkWork clients only</div></div>
</div></section>

<section class="dark band"><div class="wrap split">
<div><span class="kicker">Why it exists</span><p class="pull">Big companies have a board. You have a kitchen table at 10pm.</p></div>
<div class="body">
<p>Big firms have people whose whole job is asking: are we hitting our numbers, where is the money going, what do we try next. You're expected to work all that out yourself, between serving customers and doing the books.</p>
<p>That's not fair, and it's not your fault. Nobody ever offered you the same thing at a price that makes sense.</p>
</div>
</div></section>

<section><div class="wrap split">
<div><img class="portrait" src="/static/thinkwork/greg-mccallum.jpg" alt="Greg McCallum" width="480" height="600" loading="lazy"></div>
<div class="body">
<span class="kicker">Who you'd be talking to</span>
<h2 style="margin-bottom:24px">Greg McCallum</h2>
<p>15+ years in commercial leadership, from cold caller to Chief Commercial Officer. A fractional CRO and CCO for fast-growing tech startups across Europe and the US, with Head of Sales and VP seats on the way up. The teams he's led have brought in over $1B in revenue.</p>
<p>As fractional CCO at tl;dv he rebuilt the sales team and lifted revenue per deal by 37%. At Booksy he went from Inside Sales Manager to Interim Head of Sales, building the UK business.</p>
<p>What he's good at: finding exactly where a business is losing money, and fixing it. The same thing he did for tech companies, in plain words, for yours.</p>
<p><b>I fix what's capping your revenue.</b></p>
</div>
</div></section>

<section class="paper-2 band"><div class="wrap split">
<div><span class="kicker">What the hour covers</span><h2 style="max-width:11ch">Whatever's keeping you up.</h2></div>
<ul class="list-plain">
<li><div><b>Targets.</b> What you're aiming for this month, and whether you got there last month.</div></li>
<li><div><b>Where the money goes.</b> Basic money in, money out, and what the next few months look like.</div></li>
<li><div><b>The shop matches the site.</b> If the website promises something, the counter has to deliver it.</div></li>
<li><div><b>Your staff.</b> Getting them selling the memberships and pre-orders, not just ringing things through.</div></li>
<li><div><b>What to try next.</b> Using the numbers your ThinkWork system shows, not guesswork.</div></li>
</ul>
</div></section>

<section><div class="wrap split">
<div><span class="kicker">The price</span><h2>&pound;{ADVISORY} a month, on top of any plan.</h2></div>
<div class="body"><p>It's only for ThinkWork clients. That's on purpose: the hour works because Greg can see your real bookings and sales, not just your opinion of them.</p>
<p>Add it when you sign up, or any time after.</p>
<div class="row-btns"><a class="btn hi" href="/book/?advisory=1#quote">Ask about advisory</a><a class="btn ghost" href="/pricing/">See the plans</a></div></div>
</div></section>
"""
    page("/advisory/", "No-BS Advisory | ThinkWork",
         f"An hour a month with Greg McCallum on targets, money, staff and what to try next. £{ADVISORY} a month, added to any ThinkWork plan.",
         body)


def work() -> None:
    body = """
<section class="hero"><div class="wrap">
<span class="kicker">Work</span>
<h1 style="max-width:13ch">Real builds. <span class="mark">Real numbers.</span> Soon.</h1>
<p class="lead">ThinkWork is new. The first builds are under way. Case studies go up here once they've been running long enough to show results, not before.</p>
</div></section>

<section class="band" style="padding-top:48px"><div class="wrap">
<div class="docket">
<div class="docket-row"><span class="when"><span class="status">In build</span></span><h3>Check-in and scoring for an airsoft venue</h3><p>Custom software for how the site runs on a game day: QR check-in and check-out, tablet check-in run by staff, and a log of every player's chrono reading. The kind of thing no off-the-shelf app does properly.</p></div>
</div>
<p class="small" style="margin-top:24px">We won't put a client's name or numbers here without their say-so, and we won't show results we don't have.</p>
</div></section>

<section class="paper-2 band"><div class="wrap split">
<div><span class="kicker">Be one of the first</span><h2 style="max-width:12ch">Want your business here?</h2></div>
<div class="body"><p>The first clients get the most of Greg's time, and help shape what we build next.</p>
<div class="row-btns"><a class="btn hi" href="/book/#quote">Get a free build quote</a></div></div>
</div></section>
"""
    page("/work/", "Work | ThinkWork",
         "ThinkWork's first builds, including custom check-in and scoring software for an airsoft venue. Case studies with real results once they have them.",
         body)


def about() -> None:
    person = {"@context": "https://schema.org", "@type": "Person", "name": "Greg McCallum",
              "jobTitle": "Founder, ThinkWork; fractional CRO and CCO", "worksFor": {"@id": SITE + "/#org"},
              "image": SITE + "/static/thinkwork/greg-mccallum.jpg", "url": "https://gregrcmccallum.com/"}
    body = """
<section class="hero"><div class="wrap">
<span class="kicker">About</span>
<h1 style="max-width:15ch">The big firms' playbook, <span class="mark">brought to the high street.</span></h1>
</div></section>

<section class="band"><div class="wrap split">
<div><img class="portrait" src="/static/tw/greg-headshot.jpg" alt="Greg McCallum, founder of ThinkWork" width="480" height="600" loading="lazy"></div>
<div class="body">
<p>Walk down any high street and you'll find businesses that are brilliant at what they do, and paying through the nose for websites that do nothing for them.</p>
<p>Meanwhile the big tech companies have a whole playbook for earning more from the customers they already have. Memberships. Subscriptions. Pre-orders. Rewards for bringing a friend. They spend fortunes on it. None of it ever reaches the butcher, the garage or the studio round the corner.</p>
<p>I'm Greg McCallum. I've spent 15+ years in commercial leadership, from cold caller to Chief Commercial Officer. I've been a fractional CRO and CCO for fast-growing tech startups across Europe and the US, and the teams I've led have brought in over $1B in revenue. At tl;dv, as fractional CCO, I rebuilt the sales team and lifted revenue per deal by 37%. At Booksy I went from Inside Sales Manager to Interim Head of Sales, building the UK business.</p>
<p>I learned exactly how those companies make money.</p>
<p>ThinkWork exists to hand that playbook to businesses that have never been offered it, and to build the system that runs it, for less than the apps they're paying for now.</p>
<p><b>No jargon. No lock-in. I fix what's capping your revenue.</b></p>
<div class="row-btns" style="margin-top:28px"><a class="btn hi" href="/book/#quote">Talk to Greg</a></div>
</div>
</div></section>
"""
    page("/about/", "About | ThinkWork",
         "Greg McCallum: 15+ years from cold caller to CCO, fractional CRO and CCO for tech startups, over $1B in revenue across the teams he's led. ThinkWork brings that playbook to local businesses.",
         body, [person])


def book() -> None:
    types = "".join(f'<option value="{k}">{esc(l)}</option>' for k, l, _ in IDEAS)
    tools = ["Wix", "Squarespace", "WordPress", "A web agency", "A booking app", "An email tool",
             "A membership app", "An online shop", "Nothing yet"]
    checks = "".join(
        f'<label><input type="checkbox" name="current_tools" value="{esc(t)}"> {esc(t)}</label>' for t in tools)
    body = f"""
<section class="hero"><div class="wrap split">
<div>
<span class="kicker">Get a free build quote</span>
<h1 style="font-size:clamp(40px,6.4vw,80px);max-width:11ch">Tell us about your business.</h1>
<p class="lead" style="margin-top:24px">Two minutes. Greg reads every one and replies himself, with an idea and a price. No pressure, no sales patter.</p>
<ul class="list-plain" style="margin-top:28px">
<li><div>What you pay now tells us what you could save.</div></li>
<li><div>What you'd like more of tells us what to build.</div></li>
<li><div>Prefer email? <a href="mailto:greg@thinkwork.info">greg@thinkwork.info</a></div></li>
</ul>
</div>
<form class="form" id="quote" method="post" action="{API}/api/thinkwork/quote" data-return="/book/thanks/">
<div class="alert" role="alert" hidden>Something was missing. Please check your name, business, email and type of business.</div>
<input type="hidden" name="return_to" value="{SITE}/book/thanks/">
<input type="hidden" name="source" value="main">
<div class="trap" aria-hidden="true"><label for="rt">Leave this empty</label><input id="rt" name="referral_token" tabindex="-1" autocomplete="off"></div>
<div class="grid2">
<div class="field"><label for="f-name">Your name</label><input id="f-name" name="full_name" type="text" autocomplete="name" required maxlength="120"></div>
<div class="field"><label for="f-biz">Business name</label><input id="f-biz" name="business_name" type="text" autocomplete="organization" required maxlength="200"></div>
<div class="field"><label for="f-email">Email</label><input id="f-email" name="email" type="email" autocomplete="email" required maxlength="254"></div>
<div class="field"><label for="f-phone">Phone <span class="hint">(optional)</span></label><input id="f-phone" name="phone" type="tel" autocomplete="tel" maxlength="40"></div>
<div class="field"><label for="f-type">Type of business</label><select id="f-type" name="business_type" required><option value="">Choose one</option>{types}<option value="other">Something else</option></select></div>
<div class="field"><label for="f-town">Town</label><input id="f-town" name="town" type="text" autocomplete="address-level2" maxlength="120"></div>
</div>
<div class="field"><label for="f-site">Current website <span class="hint">(if you have one)</span></label><input id="f-site" name="current_site" type="text" inputmode="url" maxlength="300" placeholder="yourbusiness.co.uk"></div>
<fieldset class="field"><legend>What do you use now?</legend><div class="checks">{checks}</div></fieldset>
<div class="field"><label for="f-spend">Roughly what do you pay for all of it, per month? <span class="hint">(a guess is fine)</span></label><div class="money" style="max-width:200px"><input id="f-spend" name="monthly_spend" type="number" inputmode="decimal" min="0" step="1"></div></div>
<div class="field"><label for="f-more">What would you like more of?</label><textarea id="f-more" name="wants" maxlength="2000" placeholder="More regulars, fewer no-shows, busier weekdays, pre-orders for Christmas..."></textarea></div>
<div class="field"><label><input type="checkbox" name="advisory" value="1" style="width:20px;height:20px;vertical-align:-4px;accent-color:var(--ink)"> I'm interested in the monthly advisory too</label></div>
<button class="btn hi" type="submit">Send it to Greg</button>
</form>
</div></section>
"""
    page("/book/", "Get a free build quote | ThinkWork",
         "Tell ThinkWork about your business and what you pay for now. Greg replies himself with an idea and a price.",
         body)
    thanks = """
<section class="hero"><div class="wrap">
<span class="kicker">Sent</span>
<h1 style="max-width:12ch">Thanks. <span class="mark">Greg's got it.</span></h1>
<p class="lead">He'll read it himself and get back to you with an idea and a price. If it's urgent, email greg@thinkwork.info.</p>
<div class="row-btns"><a class="btn ghost" href="/what-we-build/">See what we build</a></div>
</div></section>
"""
    out = ROOT / "book" / "thanks" / "index.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(head("Thanks | ThinkWork", "Your enquiry has been sent.", "/book/thanks/").replace(
        "<head>", '<head>\n<meta name="robots" content="noindex">', 1) + header("") + thanks + FOOTER,
        encoding="utf-8")


def llms_txt() -> None:
    lines = [
        "# ThinkWork",
        "",
        "> ThinkWork builds local, independent businesses one owned system: a website plus bookings, "
        "memberships, subscriptions and pre-orders, picked with the owner to bring in more money, "
        "for less than the separate apps it replaces. Founded by Greg McCallum. UK.",
        "",
        "## Plans (monthly, 12-month minimum, prices exclude VAT where it applies)",
        "",
    ]
    for p in PLANS:
        lines.append(f"- {p['name']}: from £{p['price']}/month. {'; '.join(p['includes'])}. Replaces: {p['replaces']}")
    lines += [
        f"- Setup: £{SETUP} one-off, due on launch day with the first month. Nothing is paid before launch.",
        f"- No-BS Advisory: £{ADVISORY}/month add-on to any plan. One hour a month with Greg McCallum. Clients only.",
        "- Ownership: the client owns their site, domain and customer list.",
        "",
        "## Ideas by type of business",
        "",
    ]
    for _, label, ideas in IDEAS:
        lines.append(f"- {label}: " + "; ".join(f"{n} ({d})" for n, d in ideas))
    lines += [
        "",
        "## Pages",
        "",
        f"- [What we build]({SITE}/what-we-build/)",
        f"- [Prices and savings calculator]({SITE}/pricing/)",
        f"- [No-BS Advisory]({SITE}/advisory/)",
        f"- [Work]({SITE}/work/)",
        f"- [About Greg McCallum]({SITE}/about/)",
        f"- [Get a free build quote]({SITE}/book/)",
        "",
        "Contact: greg@thinkwork.info",
        "",
    ]
    (ROOT / "llms.txt").write_text("\n".join(lines), encoding="utf-8")


NEW_URLS = [("/", "1.0"), ("/what-we-build/", "0.9"), ("/pricing/", "0.9"), ("/advisory/", "0.8"),
            ("/work/", "0.6"), ("/about/", "0.7"), ("/book/", "0.8"), ("/airsoft/", "0.8")]


def sitemap() -> None:
    """Rewrite the top of the sitemap, keep every other entry as it is.

    The old sitemap also lists the moved-to-peerlab.ai stubs so crawlers keep
    following the move; those lines must survive untouched.
    """
    p = ROOT / "sitemap.xml"
    old = p.read_text(encoding="utf-8").splitlines()
    ours = {SITE + u for u, _ in NEW_URLS}
    kept = [l for l in old if "<loc>" in l or l.strip().startswith("<!--")]
    kept = [l for l in kept if not any(f"<loc>{u}</loc>" in l for u in ours)]
    head_ = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    new = [f"  <url><loc>{SITE}{u}</loc><priority>{pr}</priority></url>" for u, pr in NEW_URLS]
    p.write_text("\n".join(head_ + new + kept + ["</urlset>", ""]), encoding="utf-8")


def airsoft() -> None:
    src = (ROOT / "_src" / "airsoft.html").read_text(encoding="utf-8")
    out = ROOT / "airsoft" / "index.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(src.replace("{{API}}", API).replace("{{SITE}}", SITE), encoding="utf-8")
    t = (ROOT / "_src" / "airsoft_thanks.html").read_text(encoding="utf-8")
    out = ROOT / "airsoft" / "thanks" / "index.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(t, encoding="utf-8")


if __name__ == "__main__":
    home(); what_we_build(); pricing(); advisory(); work(); about(); book()
    airsoft(); llms_txt(); sitemap()
    print("built")
