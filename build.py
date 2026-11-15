#!/usr/bin/env python3
"""
Sankruv Media site builder. Python 3.8+, no other requirements.
Pillow is optional: when installed, each blog article gets its own share image.

    python3 build.py                  build into this folder
    python3 build.py --out DIR        build a complete copy into DIR
    python3 build.py --noindex        add noindex to every page (for previews)

Sources
    content/site.json        contact details, stats, reasons, process, testimonials, FAQ
    content/services.json    the four services and their landing pages
    content/projects.json    projects
    content/blog/*.md        blog articles (files starting with _ are skipped)
    src/layout.html          the page shell (head, header, footer)
    src/pages/*.html         page bodies
Output
    *.html, blog/*.html, blog/feed.xml, sitemap.xml, robots.txt, assets/img/blog/*.png
"""
import datetime, hashlib, html, json, re, shutil, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
args = sys.argv[1:]
OUT = Path(args[args.index('--out') + 1]).resolve() if '--out' in args else ROOT
NOINDEX = '--noindex' in args

SITE = json.loads((ROOT / 'content/site.json').read_text(encoding='utf-8'))
SERVICES = json.loads((ROOT / 'content/services.json').read_text(encoding='utf-8'))
PROJECTS = json.loads((ROOT / 'content/projects.json').read_text(encoding='utf-8'))
SVC = {s['key']: s for s in SERVICES}
BASE = SITE['url']
TODAY = datetime.date.today()
LAYOUT = (ROOT / 'src/layout.html').read_text(encoding='utf-8')

esc = lambda s: html.escape(str(s), quote=True)
def slugify(s): return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')

# ------------------------------------------------------------------ icons
ICON = {
 'experience': '<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/>',
 'idea': '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
 'layers': '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
 'chart': '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
 'support': '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="2.5" y="13" width="4" height="6" rx="1.5"/><rect x="17.5" y="13" width="4" height="6" rx="1.5"/><path d="M19.5 19c0 1.5-2 2.5-5 2.5"/>',
 'clock': '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 'social': '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r=".9" fill="currentColor"/>',
 'web': '<rect x="2.5" y="4" width="19" height="15" rx="2.5"/><path d="M2.5 8.5h19M9.5 13l-2 1.8 2 1.8M14.5 13l2 1.8-2 1.8"/>',
 'branding': '<path d="M12 2.5l9 9-9 9-9-9z"/><path d="M12 7.5l4 4-4 4-4-4z"/>',
 'shoots': '<rect x="2.5" y="7" width="13" height="11" rx="2.5"/><path d="M15.5 11l6-3v9l-6-3z"/>',
 'unsure': '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5V14M12 17.5v.01"/>',
 'arrow': '<path d="M5 12h14M13 6l6 6-6 6"/>',
 'wa': '<path d="M20.5 11.6A8.5 8.5 0 0 1 8 19l-4.5 1.3L4.8 16A8.5 8.5 0 1 1 20.5 11.6z"/><path d="M9 8.6c.3 2.9 2.6 5.3 5.6 5.7l1-1.3-1.8-1-1 .8c-1-.5-1.8-1.3-2.3-2.3l.8-1-1-1.8z"/>',
 'phone': '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
 'mail': '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/>',
 'ig': '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r=".9" fill="currentColor"/>',
 'pin': '<path d="M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
 'link': '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2"/>',
 'in': '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10.5V17M8 7.2v.01M12 17v-3.6c0-1.7 1-2.9 2.5-2.9S17 11.7 17 13.4V17M12 10.5V17"/>',
 'x': '<path d="M4 4l16 16M20 4L4 20"/>',
 'search': '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
 'home': '<path d="M3.5 10.5L12 3.5l8.5 7V19a1.5 1.5 0 0 1-1.5 1.5h-4v-6h-6v6H5A1.5 1.5 0 0 1 3.5 19z"/>',
 'grid': '<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="3.5"/>',
 'doc': '<path d="M6 3.5h8l4 4V20a.5.5 0 0 1-.5.5h-11A1.5 1.5 0 0 1 5 19V4.5A1 1 0 0 1 6 3.5z"/><path d="M9 11h6M9 15h6M9 7.5h3"/>',
 'send': '<path d="M21 3L10 14M21 3l-7 18-4-7-7-4z"/>',
}
def icon(k, cls='ic'):
    return f'<svg class="{cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ICON[k]}</svg>'

ARROW = icon('arrow', 'ar')
def btn(href, text, kind='hot', extra=''):
    return f'<a class="btn {kind}" href="{href}"{extra}><span>{text}</span>{ARROW}</a>'
WA_EXTRA = ' target="_blank" rel="noopener"'

# ------------------------------------------------------------------ mockups (pure CSS 3D)
def mockup(kind):
    if kind == 'cam':
        return ('<div class="mk mk-cam" aria-hidden="true"><div class="mk-scene"><i class="s1"></i><i class="s2"></i><i class="s3"></i><i class="s4"></i></div>'
                '<div class="vf"><b class="c tl"></b><b class="c tr"></b><b class="c bl"></b><b class="c br"></b>'
                '<span class="rec">REC</span><span class="tc">00:12:48</span><span class="fc"></span><span class="mt">4K 25FPS</span></div></div>')
    if kind == 'posts':
        table = ('<svg viewBox="0 0 120 80" aria-hidden="true"><rect x="14" y="30" width="92" height="7" rx="2" fill="currentColor"/>'
                 '<path d="M24 37v30M96 37v30M38 37l-6 30M82 37l6 30" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>'
                 '<circle cx="46" cy="24" r="5" fill="currentColor" opacity=".7"/><rect x="58" y="16" width="8" height="14" rx="2" fill="currentColor" opacity=".55"/>'
                 '<circle cx="78" cy="25" r="4" fill="currentColor" opacity=".7"/></svg>')
        chair = ('<svg viewBox="0 0 120 80" aria-hidden="true"><path d="M40 10v40h40M40 50v22M78 50v22M40 34h38" stroke="currentColor" stroke-width="4" stroke-linecap="round" fill="none"/></svg>')
        return (f'<div class="mk mk-posts" aria-hidden="true"><div class="pst p3">{chair}<i></i></div><div class="pst p2">{chair}<i></i></div>'
                f'<div class="pst p1">{table}<span class="pl">New collection</span><i></i></div></div>')
    if kind == 'card':
        gem = '<svg viewBox="0 0 48 40" aria-hidden="true"><path d="M10 2h28l8 11-22 25L2 13z M2 13h44 M18 2l-4 11 10 25 10-25-4-11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>'
        return (f'<div class="mk mk-card" aria-hidden="true"><div class="env"></div><div class="inv">{gem}<i class="ln w50"></i>'
                '<b>You are invited</b><i class="ln w70"></i><i class="ln w40"></i><span class="seal"></span></div></div>')
    tiles = ''.join(f'<i class="t{n}"></i>' for n in range(9))
    return (f'<div class="mk mk-phone" aria-hidden="true"><div class="scr"><div class="top"><i class="av"></i><span><i class="ln w60"></i><i class="ln w40"></i></span></div>'
            f'<div class="stats3"><i></i><i></i><i></i></div><div class="feed">{tiles}</div></div></div>')

# ------------------------------------------------------------------ shared components
def stats():
    items = ''.join(f'<div class="num rv"><b><span data-count="{n}">{n}</span>+</b><span>{esc(l)}</span></div>' for n, l in SITE['stats'])
    return f'<div class="nums">{items}</div>'

def brands():
    names = ''.join(f'<li>{esc(b)}</li>' for b in SITE['brands'])
    return (f'<div class="brands" aria-label="Brands we have worked with"><p class="wrap brands-k">Brands that have worked with us</p>'
            f'<div class="marq"><ul>{names}</ul><ul aria-hidden="true">{names}</ul></div></div>')

def reasons():
    li = ''.join(f'<li class="rv"><span class="ri">{icon(k)}</span><h3>{esc(t)}</h3><p>{esc(d)}</p></li>' for k, t, d in SITE['reasons'])
    return f'<ul class="reasons">{li}</ul>'

def timeline(steps):
    li = ''.join(f'<li class="tl-step"><span class="tl-dot"></span><div class="tl-body"><span class="tl-n">{i+1:02d}</span><h3>{esc(t)}</h3><p>{esc(d)}</p></div></li>' for i, (t, d) in enumerate(steps))
    return f'<div class="tlw"><div class="tl-line" aria-hidden="true"><i></i></div><ol class="tl">{li}</ol></div>'

def faq(items):
    out = ''.join(f'<details class="rv"><summary><span>{esc(q)}</span><i aria-hidden="true"></i></summary><div class="ans"><p>{esc(a)}</p></div></details>' for q, a in items)
    return f'<div class="faq-list">{out}</div>'

def quotes():
    figs = ''.join(f'<figure class="q{" on" if i == 0 else ""}"{"" if i == 0 else " aria-hidden=\"true\""}><blockquote>{esc(t)}</blockquote>'
                   f'<figcaption><b>{esc(n)}</b><span>{esc(r)}</span></figcaption></figure>' for i, (t, n, r) in enumerate(SITE['testimonials']))
    dots = ''.join(f'<button class="qd{" on" if i == 0 else ""}" aria-label="Show review {i+1}"></button>' for i in range(len(SITE['testimonials'])))
    return f'<div class="quotes" id="quotes"><div class="q-stage">{figs}</div><div class="qnav">{dots}</div></div>'

def picker():
    chips = ''.join(f'<a href="contact.html?service={s["key"]}">{icon(s["key"])}{esc(s["short"])}</a>' for s in SERVICES)
    return f'<div class="pick"><span>I need help with</span>{chips}<a href="contact.html?service=unsure">{icon("unsure")}Not sure yet</a></div>'

def chapters(full):
    rail = ''.join(f'<li><button data-go="{s["key"]}">{esc(s["short"])}</button></li>' for s in SERVICES)
    arts = []
    for s in SERVICES:
        body = f'<p class="lead">{esc(s["overview"][0] if full else s["summary"])}</p>'
        if full: body += f'<p class="mute">{esc(s["overview"][1])}</p>'
        items = ''.join(f'<li>{esc(n)}</li>' for n, _ in s['items'])
        cta = btn(s['file'], 'Explore ' + s['short'].lower() if not full else 'See full details', 'ghost')
        if full: cta += btn(f'contact.html?service={s["key"]}', 'Get a quote')
        arts.append(f'''<article class="chapter" id="{s["key"]}" data-fx="0 0 1 0 0 1 {s["model"]}" data-anchor="#chapAnchor" data-anchor-m=".art-orb">
      <div class="art-orb" aria-hidden="true"></div>
      <p class="label">{icon(s["key"])}{esc(s["short"])}</p>
      <h3 class="d chap-title sw">{esc(s["name"])}</h3>
      {body}
      <ul class="chips">{items}</ul>
      <div class="cta-row">{cta}</div>
    </article>''')
    return f'''<div class="chap">
    <div class="chap-stage" aria-hidden="true"><div class="chap-anchor" id="chapAnchor"></div><ol class="chap-rail">{rail}</ol></div>
    <div class="chap-list">{"".join(arts)}</div>
  </div>'''

def work_reel():
    items = ''.join(f'<a class="hs-item" href="projects.html#{p["key"]}"><div class="hs-vis tilt">{mockup(p["mockup"])}</div>'
                    f'<div class="hs-cap"><h3>{esc(p["name"])}</h3><p>{esc(", ".join(p["labels"]))}</p></div></a>' for p in PROJECTS)
    items += '<a class="hs-item hs-end" href="contact.html"><span class="d">Your brand could be next</span><span class="btn hot"><span>Start your project</span>' + ARROW + '</span></a>'
    return f'<div class="hs-track">{items}</div>'

def ring():
    cards = [('Reels and stories', 'Short-form video and stories for your channels.', 'social'), ('Content calendars', 'A monthly plan where every post has a purpose.', 'social'),
             ('Business websites', 'Responsive sites built around your brand.', 'web'), ('Online stores', 'Shopify, WooCommerce or custom eCommerce.', 'web'),
             ('Logos and identity', 'A mark and a system your brand can grow into.', 'branding'), ('Packaging', 'Packs and print that carry the same story.', 'branding'),
             ('Product shoots', 'Photo and video that make products look premium.', 'shoots'), ('Ad films', 'Promotional videos and reels for campaigns.', 'shoots')]
    out = ''.join(f'<a class="rc" href="{SVC[k]["file"]}" style="--i:{i}" draggable="false"><i>{esc(SVC[k]["short"])}</i><b>{esc(t)}</b><span>{esc(d)}</span></a>' for i, (t, d, k) in enumerate(cards))
    return f'<div class="ringwrap" id="ringwrap"><div class="ring" id="ring">{out}</div></div>'

def cylinder():
    words = SITE['industries']
    spans = ''.join(f'<span style="--i:{i}">{esc(w)}</span>' for i, w in enumerate(words))
    return f'<div class="cyl" aria-hidden="true" style="--n:{len(words)}"><div class="cyl-in">{spans}</div></div>'

def service_rows():
    return '<ul class="svc-rows">' + ''.join(
        f'<li class="rv"><a href="{s["file"]}"><span class="sr-i">{icon(s["key"])}</span><span class="sr-n d">{esc(s["name"])}</span>'
        f'<span class="sr-d">{esc(s["summary"])}</span>{ARROW}</a></li>' for s in SERVICES) + '</ul>'

def projects_full():
    chips = '<button class="on" data-f="all">All work</button>' + ''.join(f'<button data-f="{s["key"]}">{esc(s["short"])}</button>' for s in SERVICES)
    rows = []
    for i, p in enumerate(PROJECTS):
        svc_links = ', '.join(f'<a href="{SVC[t]["file"]}">{esc(SVC[t]["name"])}</a>' for t in p['tags'])
        facts = f'<div><dt>Services</dt><dd>{svc_links}</dd></div>'
        if p['location']: facts += f'<div><dt>Location</dt><dd>{esc(p["location"])}</dd></div>'
        facts += '<div><dt>Delivered</dt><dd>' + ', '.join(esc(d) for d in p['delivered']) + '</dd></div>'
        lead = SVC[p['tags'][0]]
        x = -3 if i % 2 == 0 else 3
        rows.append(f'''<article class="case{" flip" if i % 2 else ""}" id="{p["key"]}" data-tags="{" ".join(p["tags"])}" data-fx="{x} 0 .9 0 0 .45 {lead["model"]}">
      <div class="case-vis tilt">{mockup(p["mockup"])}</div>
      <div class="case-txt">
        <p class="label">{esc(" and ".join(p["labels"]))}</p>
        <h2 class="sw">{esc(p["name"])}</h2>
        <p class="lead">{esc(p["summary"])}</p>
        <dl class="facts">{facts}</dl>
        <a class="link" href="{lead["file"]}">How we deliver {esc(lead["name"].lower())}{ARROW}</a>
      </div>
    </article>''')
    return f'<div class="pfilter" role="group" aria-label="Filter projects by service">{chips}</div><div class="cases">{"".join(rows)}</div>'

def contact_services():
    opts = [(s['key'], s['name'], s['summary']) for s in SERVICES] + [('unsure', 'Not sure yet', 'Tell us your goal and we will recommend the right mix.')]
    return ''.join(f'<label class="opt"><input type="checkbox" name="services" value="{esc(n)}" data-key="{k}"><span class="opt-i">{icon(k)}</span>'
                   f'<span class="opt-t"><b>{esc(n)}</b><span>{esc(d)}</span></span><span class="opt-c" aria-hidden="true"></span></label>' for k, n, d in opts)

# ------------------------------------------------------------------ blog
CAT_MODEL = {'video': 6, 'marketing': 5, 'branding': 3, 'agency': 0, 'social media': 5, 'web': 2}
CAT_SERVICE = {'video': 'shoots', 'marketing': 'social', 'branding': 'branding', 'social media': 'social', 'web': 'web'}

def parse_post(path):
    raw = path.read_text(encoding='utf-8')
    m = re.match(r'---\s*\n(.*?)\n---\s*\n(.*)', raw, re.S)
    meta = dict(re.findall(r'^(\w+):\s*(.*)$', m.group(1), re.M))
    meta['slug'] = path.stem
    meta['body'] = m.group(2)
    meta['date'] = datetime.date.fromisoformat(meta['date'].strip())
    meta['order'] = int(meta.get('order', 0))
    meta['category'] = meta.get('category', 'Marketing').strip()
    meta['words'] = len(re.findall(r'\w+', meta['body']))
    meta['minutes'] = max(1, round(meta['words'] / 200))
    return meta

def inline(s):
    s = esc(s)
    s = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', s)
    s = re.sub(r'(?<![\w*])\*(?!\s)(.+?)\*(?!\w)', r'<em>\1</em>', s)
    s = re.sub(r'`(.+?)`', r'<code>\1</code>', s)
    def link(m):
        href = m.group(2); ext = href.startswith('http')
        return f'<a href="{href}"{WA_EXTRA if ext else ""}>{m.group(1)}</a>'
    return re.sub(r'\[(.+?)\]\((.+?)\)', link, s)

def markdown(text):
    out, toc, para, lst = [], [], [], None
    def flush():
        nonlocal para, lst
        if para: out.append('<p>' + inline(' '.join(para)) + '</p>'); para = []
        if lst: out.append(f'<{lst[0]}>' + ''.join(f'<li>{inline(x)}</li>' for x in lst[1]) + f'</{lst[0]}>'); lst = None
    for line in text.split('\n'):
        st = line.strip()
        if not st: flush(); continue
        if st.startswith('### '): flush(); out.append(f'<h3>{inline(st[4:])}</h3>'); continue
        if st.startswith('## '):
            flush(); t = st[3:]; i = slugify(t); toc.append((i, t)); out.append(f'<h2 id="{i}">{inline(t)}</h2>'); continue
        if st.startswith('> '): flush(); out.append(f'<blockquote><p>{inline(st[2:])}</p></blockquote>'); continue
        m = re.match(r'^(-|\d+\.)\s+(.*)', st)
        if m:
            kind = 'ul' if m.group(1) == '-' else 'ol'
            if para: flush()
            if lst and lst[0] != kind: flush()
            if not lst: lst = (kind, [])
            lst[1].append(m.group(2)); continue
        if lst: flush()
        para.append(st)
    flush()
    return out, toc

def fmt_date(d): return f'{d.day} {d.strftime("%b %Y")}'

def cover(p, big=False):
    h = int(hashlib.md5(p['slug'].encode()).hexdigest()[:6], 16)
    x, y, r = 30 + h % 45, 30 + (h >> 4) % 30, (h >> 8) % 360
    return (f'<div class="cover{" big" if big else ""}" data-c="{slugify(p["category"])}" style="--x:{x}%;--y:{y}%;--r:{r}deg" aria-hidden="true">'
            f'<span class="cv-floor"></span><span class="cv-orb"></span><span class="cv-ring"></span><span class="cv-word">{esc(p["category"])}</span></div>')

def post_row(p, root):
    return (f'<li class="rv" data-cat="{slugify(p["category"])}" data-q="{esc((p["title"] + " " + p["description"]).lower())}">'
            f'<a class="prow" href="{root}blog/{p["slug"]}.html"><span class="pr-thumb">{cover(p)}</span><span class="pr-cat">{esc(p["category"])}</span>'
            f'<span class="pr-main"><span class="pr-t">{esc(p["title"])}</span><span class="pr-d">{esc(p["description"])}</span></span>'
            f'<span class="pr-m"><span>{fmt_date(p["date"])}</span><span>{p["minutes"]} min read</span></span>{ARROW}</a></li>')

# ------------------------------------------------------------------ head data
ORG = {"@type": "ProfessionalService", "@id": BASE + "#org", "name": SITE['name'], "url": BASE, "logo": BASE + "assets/img/logo.png",
       "image": BASE + "assets/img/og.png", "slogan": SITE['tagline'], "description": SITE['description'],
       "telephone": SITE['phone_e164'], "email": SITE['email'],
       "address": {"@type": "PostalAddress", "addressLocality": SITE['city'], "addressRegion": "Maharashtra", "addressCountry": SITE['country']},
       "areaServed": {"@type": "Country", "name": "India"}, "sameAs": [SITE['instagram']],
       "knowsAbout": [s['name'] for s in SERVICES],
       "hasOfferCatalog": {"@type": "OfferCatalog", "name": "Digital marketing services", "itemListElement": [
           {"@type": "Offer", "itemOffered": {"@type": "Service", "name": s['name'], "url": BASE + s['file']}} for s in SERVICES]}}
WEBSITE = {"@type": "WebSite", "@id": BASE + "#site", "url": BASE, "name": SITE['name'], "publisher": {"@id": BASE + "#org"}, "inLanguage": "en-IN"}

def crumbs_ld(trail):
    return {"@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": n, "item": BASE + u} for i, (n, u) in enumerate(trail)]}
def faq_ld(items):
    return {"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in items]}
def crumbs_html(trail, root):
    parts = [f'<a href="{root}{u or "index.html"}">{esc(n)}</a>' for n, u in trail[:-1]]
    return '<nav class="crumb" aria-label="Breadcrumb">' + '<span>/</span>'.join(parts + [f'<b>{esc(trail[-1][0])}</b>']) + '</nav>'

# ------------------------------------------------------------------ shell
NAV_L = [('services', 'services.html', 'Services'), ('work', 'projects.html', 'Work'), ('about', 'about.html', 'About')]
NAV_R = [('blog', 'blog.html', 'Blog'), ('contact', 'contact.html', 'Contact')]

def header(active, root):
    def a(k, f, t): return f'<a href="{root}{f}"{" class=\"on\" aria-current=\"page\"" if k == active else ""}>{t}</a>'
    dd = ''.join(f'<a href="{root}{s["file"]}">{icon(s["key"])}<span><b>{esc(s["name"])}</b><span>{esc(s["summary"].split(",")[0])}</span></span></a>' for s in SERVICES)
    left = f'<div class="dd">{a(*NAV_L[0])}<div class="dd-panel">{dd}</div></div>' + ''.join(a(*x) for x in NAV_L[1:])
    right = ''.join(a(*x) for x in NAV_R)
    MN = [('home', 'index.html', 'Home', 'Start here', 'home'), ('services', 'services.html', 'Services', 'Social, websites, branding, shoots', 'grid'),
          ('work', 'projects.html', 'Work', 'Projects and campaigns', 'layers'), ('about', 'about.html', 'About', 'Who we are and how we work', 'experience'),
          ('blog', 'blog.html', 'Blog', 'Guides on marketing, video and branding', 'doc'), ('contact', 'contact.html', 'Contact', 'Talk to our team', 'send')]
    mob = ''.join(f'<a href="{root}{f}" style="--i:{i}"{" class=\"on\" aria-current=\"page\"" if k == active else ""}><span class="mn-i">{icon(ic)}</span>'
                  f'<span class="mn-t"><b>{t}</b><small>{d}</small></span>{ARROW}</a>' for i, (k, f, t, d, ic) in enumerate(MN))
    mob_s = ''.join(f'<a href="{root}{s["file"]}" style="--i:{i + 6}"><span class="mn-si">{icon(s["key"])}</span><b>{esc(s["short"])}</b><small>{esc(s["name"])}</small></a>' for i, s in enumerate(SERVICES))
    topics = ''.join(f'<a href="{root}blog.html?cat={slugify(c)}">{esc(c)}</a>' for c in BLOG.get('cats', []))
    lp = BLOG.get('latest')
    latest = (f'<a class="mn-post" href="{root}blog/{lp["slug"]}.html"><span class="mn-pt">{cover(lp)}</span><span><small>Latest article</small><b>{esc(lp["title"])}</b></span></a>') if lp else ''
    return f'''<header id="hdr">
  <div class="hdr">
    <a class="hcall" href="tel:{SITE["phone_e164"]}" aria-label="Call Sankruv Media">{icon("phone")}</a>
    <nav class="hl" aria-label="Main">{left}</nav>
    <a class="logo" href="{root}index.html" aria-label="Sankruv Media home"><img src="{root}assets/img/logo.png" alt="Sankruv Media" width="525" height="256"></a>
    <div class="hr"><nav class="hr-links" aria-label="More">{right}</nav>{btn(root + "contact.html", "Free quote", "hot sm")}
      <button id="burger" aria-label="Open menu" aria-expanded="false" aria-controls="mnav"><i></i><i></i></button></div>
  </div>
</header>
<div class="mnav" id="mnav" hidden>
  <div class="mn-in">
    <a class="mn-quote" href="{root}contact.html" style="--i:0"><span><b>Get a free quote</b><small>Tell us what you need in under a minute</small></span>{ARROW}</a>
    <nav class="mn-main" aria-label="Site sections">{mob}</nav>
    <section class="mn-sec" aria-label="Services"><p class="mn-h">Our services</p><div class="mn-svc">{mob_s}</div></section>
    <section class="mn-sec" aria-label="Blog topics"><p class="mn-h">Read by topic</p><div class="mn-topics">{topics}</div>{latest}</section>
    <div class="mn-acts">
      <a href="{SITE["whatsapp_link"]}"{WA_EXTRA}>{icon("wa")}<span>WhatsApp</span></a>
      <a href="tel:{SITE["phone_e164"]}">{icon("phone")}<span>Call</span></a>
      <a href="mailto:{SITE["email"]}">{icon("mail")}<span>Email</span></a>
      <a href="{SITE["instagram"]}"{WA_EXTRA}>{icon("ig")}<span>Instagram</span></a>
    </div>
  </div>
</div>'''

def tabbar(active, root):
    def t(k, f, ic, lab):
        on = ' class="on" aria-current="page"' if k == active else ''
        return f'<a href="{root}{f}"{on}>{icon(ic)}<span>{lab}</span></a>'
    return ('<nav class="tabbar" aria-label="App navigation">' + t('home', 'index.html', 'home', 'Home') + t('services', 'services.html', 'grid', 'Services')
            + f'<a class="fab" href="{SITE["whatsapp_link"]}" target="_blank" rel="noopener"><span class="fab-b">{icon("wa")}</span><span>WhatsApp</span></a>'
            + t('blog', 'blog.html', 'doc', 'Blog') + t('contact', 'contact.html', 'send', 'Quote') + '</nav>')

def footer(root):
    svc = ''.join(f'<li><a href="{root}{s["file"]}">{esc(s["name"])}</a></li>' for s in SERVICES)
    pages = ''.join(f'<li><a href="{root}{f}">{t}</a></li>' for f, t in [('index.html', 'Home'), ('services.html', 'Services'), ('projects.html', 'Work'), ('about.html', 'About'), ('blog.html', 'Blog'), ('contact.html', 'Contact')])
    return f'''<footer>
  <div class="wrap">
    <div class="f-cta">
      <p>Have a project in mind?</p>
      <a class="f-big d" href="{root}contact.html">Let's talk{ARROW}</a>
    </div>
    <div class="f-grid">
      <div class="f-brand"><img src="{root}assets/img/logo.png" alt="Sankruv Media" width="327" height="156" loading="lazy"><p>{esc(SITE["tagline"])}</p>
        <p class="mute">A digital marketing agency in Mumbai for social media, websites, branding and production.</p></div>
      <div><h2 class="f-h">Pages</h2><ul>{pages}</ul></div>
      <div><h2 class="f-h">Services</h2><ul>{svc}</ul></div>
      <div><h2 class="f-h">Contact</h2><ul>
        <li><a href="{SITE["whatsapp_link"]}"{WA_EXTRA}>WhatsApp</a></li>
        <li><a href="tel:{SITE["phone_e164"]}">{SITE["phone"]}</a></li>
        <li><a href="mailto:{SITE["email"]}">{SITE["email"]}</a></li>
        <li><a href="{SITE["instagram"]}"{WA_EXTRA}>Instagram {SITE["instagram_handle"]}</a></li>
        <li>{SITE["city"]}, India</li></ul></div>
    </div>
    <div class="f-bottom"><span>&copy; {TODAY.year} Sankruv Media. All rights reserved.</span><span>Digital marketing agency in Mumbai</span></div>
  </div>
</footer>'''

VERSION = hashlib.sha1((ROOT / 'assets/css/site.css').read_bytes() + (ROOT / 'assets/js/site.js').read_bytes()).hexdigest()[:8]

def render(path, main, *, title, description, nav='', jsonld=(), og_type='website', og_image='assets/img/og.png', extra_head='', body_class='', robots=None):
    depth = path.count('/')
    root = '../' * depth
    url = BASE + ('' if path == 'index.html' else path)
    robots = robots or ('noindex, nofollow' if NOINDEX else 'index, follow, max-image-preview:large, max-snippet:-1')
    graph = {"@context": "https://schema.org", "@graph": [ORG, WEBSITE] + list(jsonld)}
    tokens = {'title': esc(title), 'description': esc(description), 'canonical': url, 'root': root, 'robots': robots, 'og_type': og_type,
              'og_image': BASE + og_image, 'extra_head': extra_head, 'body_class': body_class, 'v': VERSION,
              'jsonld': json.dumps(graph, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/'),
              'header': header(nav, root), 'footer': footer(root), 'tabbar': tabbar(nav or ('home' if path == 'index.html' else ''), root), 'wa': SITE['whatsapp_link'], 'tel': SITE['phone_e164'], 'phone': SITE['phone']}
    page = LAYOUT.replace('{{main}}', main)
    page = re.sub(r'\{\{(\w+)\}\}', lambda m: str(tokens.get(m.group(1), m.group(0))), page)
    dest = OUT / path
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(page, encoding='utf-8')
    SITEMAP.append((url, path))

SITEMAP = []
BLOG = {}

# ------------------------------------------------------------------ page sources
def page_source(name):
    raw = (ROOT / 'src/pages' / name).read_text(encoding='utf-8')
    m = re.match(r'<!--(.*?)-->\s*', raw, re.S)
    meta = dict(re.findall(r'^\s*(\w+):\s*(.*)$', m.group(1), re.M))
    return meta, raw[m.end():]

def fill(body, extra):
    comps = {'stats': stats, 'brands': brands, 'reasons': reasons, 'process': lambda: timeline(SITE['process']), 'quotes': quotes,
             'picker': picker, 'chapters_short': lambda: chapters(False), 'chapters_full': lambda: chapters(True), 'work_reel': work_reel,
             'ring': ring, 'cylinder': cylinder, 'service_rows': service_rows, 'projects_full': projects_full,
             'faq_home': lambda: faq(SITE['faq']), 'contact_services': contact_services, 'arrow': lambda: ARROW,
             'wa': lambda: SITE['whatsapp_link'], 'tel': lambda: SITE['phone_e164'], 'phone': lambda: SITE['phone'], 'email': lambda: SITE['email'],
             'ig': lambda: SITE['instagram'], 'ig_handle': lambda: SITE['instagram_handle'], 'wa_number': lambda: SITE['whatsapp_number'],
             'icon_wa': lambda: icon('wa'), 'icon_phone': lambda: icon('phone'), 'icon_mail': lambda: icon('mail'), 'icon_ig': lambda: icon('ig'),
             'icon_pin': lambda: icon('pin'), 'icon_search': lambda: icon('search')}
    comps.update(extra)
    return re.sub(r'\{\{(\w+)\}\}', lambda m: comps[m.group(1)]() if m.group(1) in comps else m.group(0), body)

# ------------------------------------------------------------------ build
def main():
    if OUT != ROOT:
        shutil.rmtree(OUT, ignore_errors=True); OUT.mkdir(parents=True)
        shutil.copytree(ROOT / 'assets', OUT / 'assets')
        shutil.copytree(ROOT / 'admin', OUT / 'admin', ignore=shutil.ignore_patterns('data', 'config.php', '*.sqlite*', 'setup-code.txt'))

    posts = sorted((parse_post(p) for p in (ROOT / 'content/blog').glob('*.md') if not p.name.startswith('_')),
                   key=lambda p: (p['date'], p['order']), reverse=True)
    cats = []
    for p in posts:
        if p['category'] not in cats: cats.append(p['category'])
    BLOG['cats'] = cats; BLOG['latest'] = posts[0] if posts else None

    latest = lambda: '<ul class="prows">' + ''.join(post_row(p, '') for p in posts[:3]) + '</ul>'
    def featured():
        p = posts[0]
        return (f'<a class="feat" href="blog/{p["slug"]}.html"><div class="feat-vis tilt">{cover(p, True)}</div>'
                f'<div class="feat-txt"><p class="label">Latest article</p><h2 class="feat-t">{esc(p["title"])}</h2><p class="lead">{esc(p["description"])}</p>'
                f'<p class="pr-m">{esc(p["category"])}, {fmt_date(p["date"])}, {p["minutes"]} min read</p><span class="btn hot"><span>Read the article</span>{ARROW}</span></div></a>')
    blog_filters = lambda: '<button class="on" data-c="all">All</button>' + ''.join(f'<button data-c="{slugify(c)}">{esc(c)}</button>' for c in cats)
    blog_rows = lambda: '<ul class="prows" id="prows">' + ''.join(post_row(p, '') for p in posts) + '</ul>'
    extra = {'latest_posts': latest, 'blog_featured': featured, 'blog_filters': blog_filters, 'blog_rows': blog_rows, 'post_count': lambda: str(len(posts))}

    # fixed pages
    for name in ['index.html', 'services.html', 'projects.html', 'about.html', 'blog.html', 'contact.html', '404.html']:
        meta, body = page_source(name)
        ld = []
        for kind in [x.strip() for x in meta.get('schema', '').split(',') if x.strip()]:
            if kind == 'faq_home': ld.append(faq_ld(SITE['faq']))
            elif kind == 'crumb': ld.append(crumbs_ld([('Home', ''), (meta['crumb'], name)]))
            elif kind == 'services':
                ld += [{"@type": "Service", "name": s['name'], "serviceType": s['name'], "description": s['summary'], "url": BASE + s['file'],
                        "provider": {"@id": BASE + "#org"}, "areaServed": {"@type": "City", "name": "Mumbai"}} for s in SERVICES]
            elif kind == 'about': ld.append({"@type": "AboutPage", "url": BASE + name, "name": meta['title'], "about": {"@id": BASE + "#org"}})
            elif kind == 'contact': ld.append({"@type": "ContactPage", "url": BASE + name, "name": meta['title'], "about": {"@id": BASE + "#org"}})
            elif kind == 'projects':
                ld.append({"@type": "CollectionPage", "url": BASE + name, "name": meta['title'], "hasPart": [
                    {"@type": "CreativeWork", "name": p['name'], "description": p['summary'], "creator": {"@id": BASE + "#org"}} for p in PROJECTS]})
            elif kind == 'blog':
                ld.append({"@type": "Blog", "@id": BASE + "blog.html#blog", "url": BASE + name, "name": "Sankruv Media Blog", "publisher": {"@id": BASE + "#org"},
                           "blogPost": [{"@type": "BlogPosting", "headline": p['title'], "url": f'{BASE}blog/{p["slug"]}.html', "datePublished": p['date'].isoformat()} for p in posts]})
        render(name, fill(body, extra), title=meta['title'], description=meta['description'], nav=meta.get('nav', ''), jsonld=ld,
               body_class=meta.get('body', ''), robots='noindex' if name == '404.html' else None)

    # service landing pages
    tpl_meta, tpl = page_source('_service.html')
    for s in SERVICES:
        others = [o for o in SERVICES if o is not s]
        items = ''.join(f'<li class="rv"><span class="it-n">{i+1:02d}</span><h3>{esc(n)}</h3><p>{esc(d)}</p></li>' for i, (n, d) in enumerate(s['items']))
        outcomes = ''.join(f'<li class="rv"><span class="oc-i"></span>{esc(o)}</li>' for o in s['outcomes'])
        rel = '<ul class="svc-rows">' + ''.join(f'<li class="rv"><a href="{o["file"]}"><span class="sr-i">{icon(o["key"])}</span><span class="sr-n d">{esc(o["name"])}</span>'
                                                 f'<span class="sr-d">{esc(o["summary"])}</span>{ARROW}</a></li>' for o in others) + '</ul>'
        ex = dict(extra)
        ex.update({'s_name': lambda s=s: esc(s['name']), 's_h1a': lambda s=s: esc(s['h1'][0]), 's_h1b': lambda s=s: esc(s['h1'][1]),
                   's_key': lambda s=s: s['key'], 's_model': lambda s=s: str(s['model']), 's_icon': lambda s=s: icon(s['key']),
                   's_summary': lambda s=s: esc(s['summary']), 's_o1': lambda s=s: esc(s['overview'][0]), 's_o2': lambda s=s: esc(s['overview'][1]),
                   's_best': lambda s=s: esc(s['best_for']), 's_items': lambda i=items: i, 's_count': lambda s=s: str(len(s['items'])),
                   's_outcomes': lambda o=outcomes: o, 's_process': lambda s=s: timeline(s['process']), 's_faq': lambda s=s: faq(s['faq']),
                   's_related': lambda r=rel: r, 's_short': lambda s=s: esc(s['short'].lower()),
                   's_crumbs': lambda s=s: crumbs_html([('Home', ''), ('Services', 'services.html'), (s['name'], s['file'])], '')})
        ld = [crumbs_ld([('Home', ''), ('Services', 'services.html'), (s['name'], s['file'])]),
              {"@type": "Service", "name": s['name'], "serviceType": s['name'], "description": s['meta'], "url": BASE + s['file'],
               "provider": {"@id": BASE + "#org"}, "areaServed": {"@type": "City", "name": "Mumbai"},
               "hasOfferCatalog": {"@type": "OfferCatalog", "name": s['name'], "itemListElement": [
                   {"@type": "Offer", "itemOffered": {"@type": "Service", "name": n, "description": d}} for n, d in s['items']]}},
              faq_ld(s['faq'])]
        render(s['file'], fill(tpl, ex), title=s['title'], description=s['meta'], nav='services', jsonld=ld)

    # blog articles
    tpl_meta, tpl = page_source('_post.html')
    og_ok = make_og_images(posts)
    for i, p in enumerate(posts):
        root = '../'
        blocks, toc = markdown(p['body'].replace('{{root}}', root))
        svc = SVC.get(CAT_SERVICE.get(p['category'].lower(), ''), None)
        cta_t = f'Need help with {svc["name"].lower()}?' if svc else 'Want this done for your brand?'
        cta_h = f'{root}contact.html?service={svc["key"]}' if svc else f'{root}contact.html'
        callout = (f'<aside class="callout"><p class="d">{esc(cta_t)}</p><p>Sankruv Media plans and delivers this for brands every month. '
                   f'Tell us about yours and get a free quote.</p><div class="cta-row">{btn(cta_h, "Get a free quote")}'
                   f'{btn(SITE["whatsapp_link"], "WhatsApp us", "ghost", WA_EXTRA)}</div></aside>')
        h2s = [k for k, b in enumerate(blocks) if b.startswith('<h2')]
        if len(h2s) >= 3: blocks.insert(h2s[2], callout)
        else: blocks.append(callout)
        related = [q for q in posts if q is not p and q['category'] == p['category']][:2]
        related += [q for q in posts if q is not p and q not in related][:3 - len(related)]
        url = f'{BASE}blog/{p["slug"]}.html'
        share = (f'<a href="https://wa.me/?text={esc(_q(p["title"] + " " + url))}" target="_blank" rel="noopener" aria-label="Share on WhatsApp">{icon("wa")}</a>'
                 f'<a href="https://www.linkedin.com/sharing/share-offsite/?url={esc(_q(url))}" target="_blank" rel="noopener" aria-label="Share on LinkedIn">{icon("in")}</a>'
                 f'<a href="https://twitter.com/intent/tweet?url={esc(_q(url))}&amp;text={esc(_q(p["title"]))}" target="_blank" rel="noopener" aria-label="Share on X">{icon("x")}</a>'
                 f'<button class="copy" data-url="{url}" aria-label="Copy link">{icon("link")}<span>Copy link</span></button>')
        ex = dict(extra)
        ex.update({'p_title': lambda p=p: esc(p['title']), 'p_desc': lambda p=p: esc(p['description']), 'p_cat': lambda p=p: esc(p['category']),
                   'p_catkey': lambda p=p: slugify(p['category']), 'p_date': lambda p=p: fmt_date(p['date']), 'p_iso': lambda p=p: p['date'].isoformat(),
                   'p_min': lambda p=p: str(p['minutes']), 'p_model': lambda p=p: str(CAT_MODEL.get(p['category'].lower(), 0)),
                   'p_cover': lambda p=p: cover(p, True), 'p_body': lambda b=blocks: '\n'.join(b),
                   'p_toc': lambda t=toc: ''.join(f'<li><a href="#{i}">{esc(x)}</a></li>' for i, x in t), 'p_share': lambda s=share: s,
                   'p_related': lambda r=related: '<ul class="prows">' + ''.join(post_row(q, root) for q in r) + '</ul>',
                   'p_crumbs': lambda p=p: crumbs_html([('Home', ''), ('Blog', 'blog.html'), (p['title'], '')], root)})
        body = fill(tpl, ex).replace('href="contact.html', f'href="{root}contact.html').replace('href="blog.html', f'href="{root}blog.html')
        og = f'assets/img/blog/{p["slug"]}.png' if og_ok else 'assets/img/og.png'
        ld = [crumbs_ld([('Home', ''), ('Blog', 'blog.html'), (p['title'], f'blog/{p["slug"]}.html')]),
              {"@type": "BlogPosting", "@id": url + "#article", "mainEntityOfPage": url, "headline": p['title'], "description": p['description'],
               "image": BASE + og, "datePublished": p['date'].isoformat(), "dateModified": p['date'].isoformat(), "wordCount": p['words'],
               "articleSection": p['category'], "inLanguage": "en-IN", "author": {"@type": "Organization", "name": "Sankruv Media Team", "url": BASE},
               "publisher": {"@id": BASE + "#org"}, "isPartOf": {"@id": BASE + "blog.html#blog"}}]
        head = (f'<meta property="article:published_time" content="{p["date"].isoformat()}">\n'
                f'<meta property="article:section" content="{esc(p["category"])}">')
        render(f'blog/{p["slug"]}.html', body, title=f'{p["title"]} | Sankruv Media Blog', description=p['description'], nav='blog',
               jsonld=ld, og_type='article', og_image=og, extra_head=head, body_class='is-post')

    # feeds and search engine files
    items = ''.join(f'<item><title>{esc(p["title"])}</title><link>{BASE}blog/{p["slug"]}.html</link><guid>{BASE}blog/{p["slug"]}.html</guid>'
                    f'<pubDate>{datetime.datetime.combine(p["date"], datetime.time(9, 0)).strftime("%a, %d %b %Y %H:%M:%S +0530")}</pubDate>'
                    f'<category>{esc(p["category"])}</category><description>{esc(p["description"])}</description></item>' for p in posts)
    (OUT / 'blog').mkdir(exist_ok=True)
    (OUT / 'blog/feed.xml').write_text(f'<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>Sankruv Media Blog</title>'
                                       f'<link>{BASE}blog.html</link><description>Insights on social media, websites, branding and video for growing brands.</description>'
                                       f'<language>en-in</language>{items}</channel></rss>\n', encoding='utf-8')
    post_dates = {f'blog/{p["slug"]}.html': p['date'] for p in posts}
    urls = ''.join(f'  <url><loc>{u}</loc><lastmod>{post_dates.get(path, TODAY).isoformat()}</lastmod></url>\n' for u, path in SITEMAP if path != '404.html')
    (OUT / 'sitemap.xml').write_text(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}</urlset>\n', encoding='utf-8')
    (OUT / 'robots.txt').write_text(('User-agent: *\nDisallow: /\n' if NOINDEX else
                                     f'User-agent: *\nAllow: /\nDisallow: /src/\nDisallow: /content/\nDisallow: /admin/\n\nSitemap: {BASE}sitemap.xml\n'), encoding='utf-8')
    print(f'Built {len(SITEMAP)} pages ({len(posts)} articles) into {OUT}')

def _q(s):
    from urllib.parse import quote
    return quote(s, safe='')

def make_og_images(posts):
    """Share image per article. Skipped (site image used instead) when Pillow is not installed."""
    try:
        from PIL import Image, ImageDraw, ImageFilter, ImageFont
    except ImportError:
        return False
    def font(size, bold=True):
        for f in (['/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 'arialbd.ttf', 'Arial Bold.ttf'] if bold
                  else ['/usr/share/fonts/opentype/inter/Inter-Medium.otf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 'arial.ttf', 'Arial.ttf']):
            try: return ImageFont.truetype(f, size)
            except OSError: pass
        return ImageFont.load_default()
    logo = Image.open(ROOT / 'assets/img/logo.png').convert('RGBA')
    logo = logo.resize((int(logo.width * 0.55), int(logo.height * 0.55)))
    dest = OUT / 'assets/img/blog'; dest.mkdir(parents=True, exist_ok=True)
    for p in posts:
        f = dest / f'{p["slug"]}.png'
        key = hashlib.md5((p['title'] + p['category']).encode()).hexdigest()[:10]
        stamp = dest / f'.{p["slug"]}.{key}'
        if f.exists() and stamp.exists(): continue
        W, H = 1200, 630
        im = Image.new('RGB', (W, H))
        d = ImageDraw.Draw(im)
        for y in range(H):
            t = y / H; d.line([(0, y), (W, y)], fill=(int(10 + 18 * t), int(12 + 19 * t), int(21 + 19 * t)))
        glow = Image.new('RGBA', (W, H), (0, 0, 0, 0)); g = ImageDraw.Draw(glow)
        g.ellipse((800, 120, 1160, 480), fill=(72, 190, 192, 255)); g.ellipse((860, 150, 1010, 280), fill=(140, 231, 232, 255))
        glow = glow.filter(ImageFilter.GaussianBlur(26)); im.paste(glow, (0, 0), glow)
        d = ImageDraw.Draw(im)
        d.text((80, 90), p['category'].upper(), font=font(30), fill=(72, 190, 192))
        words, lines, cur, fnt = p['title'].split(), [], '', font(58)
        for w in words:
            test = (cur + ' ' + w).strip()
            if d.textlength(test, font=fnt) > 760 and cur: lines.append(cur); cur = w
            else: cur = test
        lines.append(cur)
        if len(lines) > 5: lines = lines[:5]; lines[-1] += '…'
        y = 150
        for ln in lines: d.text((80, y), ln, font=fnt, fill=(247, 247, 247)); y += 70
        im.paste(logo, (80, H - logo.height - 60), logo)
        im.save(f, optimize=True)
        for old in dest.glob(f'.{p["slug"]}.*'): old.unlink()
        stamp.write_text('')
    return True

if __name__ == '__main__':
    main()
