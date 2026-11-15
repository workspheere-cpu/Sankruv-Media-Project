/* Builds the React site into react/dist: one prerendered HTML file per page, one hashed JS bundle, CSS, sitemap, RSS.
   Usage: node build.cjs [--out DIR] [--noindex] [--no-admin]
   Content: ../content/*.json and ../content/blog/*.md. Images and base CSS: ../assets. Client Hub (PHP): ../admin. */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const esbuild = require('esbuild');

const HERE = __dirname, ROOT = path.join(HERE, '..');
const args = process.argv.slice(2);
const OUT = args.includes('--out') ? path.resolve(args[args.indexOf('--out') + 1]) : path.join(HERE, 'dist');
const NOINDEX = args.includes('--noindex');
const nodePaths = (process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean);
const common = { bundle: true, jsx: 'automatic', loader: { '.json': 'json' }, nodePaths, logLevel: 'warning', define: { 'process.env.NODE_ENV': '"production"' } };

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtDate = iso => { const [y, m, d] = iso.split('-').map(Number); return `${d} ${MONTHS[m - 1]} ${y}`; };
const ARROW = '<svg class="ar" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const btn = (href, text, kind = 'hot', extra = '') => `<a class="btn ${kind}" href="${href}"${extra}><span>${text}</span>${ARROW}</a>`;
const EXT = ' target="_blank" rel="noopener"';

/* ---------- Markdown (headings, lists, quotes, bold, italic, code, links) ---------- */
function inline(s) {
  return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/(?<![\w*])\*(?!\s)(.+?)\*(?!\w)/g, '<em>$1</em>').replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, (m, t, href) => `<a href="${href}"${href.startsWith('http') ? EXT : ''}>${t}</a>`);
}
function markdown(text) {
  const out = [], toc = []; let para = [], lst = null;
  const flush = () => {
    if (para.length) { out.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; }
    if (lst) { out.push(`<${lst[0]}>` + lst[1].map(x => `<li>${inline(x)}</li>`).join('') + `</${lst[0]}>`); lst = null; }
  };
  for (const line of text.split('\n')) {
    const st = line.trim();
    if (!st) { flush(); continue; }
    if (st.startsWith('### ')) { flush(); out.push(`<h3>${inline(st.slice(4))}</h3>`); continue; }
    if (st.startsWith('## ')) { flush(); const t = st.slice(3), id = slugify(t); toc.push([id, t]); out.push(`<h2 id="${id}">${inline(t)}</h2>`); continue; }
    if (st.startsWith('> ')) { flush(); out.push(`<blockquote><p>${inline(st.slice(2))}</p></blockquote>`); continue; }
    const m = /^(-|\d+\.)\s+(.*)/.exec(st);
    if (m) {
      const kind = m[1] === '-' ? 'ul' : 'ol';
      if (para.length) flush();
      if (lst && lst[0] !== kind) flush();
      if (!lst) lst = [kind, []];
      lst[1].push(m[2]); continue;
    }
    if (lst) flush();
    para.push(st);
  }
  flush();
  return [out, toc];
}
function readPosts() {
  const dir = path.join(ROOT, 'content/blog');
  return fs.readdirSync(dir).filter(f => f.endsWith('.md') && !f.startsWith('_')).map(f => {
    const m = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/.exec(fs.readFileSync(path.join(dir, f), 'utf8'));
    const meta = {}; m[1].replace(/^(\w+):\s*(.*)$/gm, (x, k, v) => { meta[k] = v.trim(); });
    const slug = f.replace(/\.md$/, ''), body = m[2], words = (body.match(/\w+/g) || []).length;
    const h = parseInt(crypto.createHash('md5').update(slug).digest('hex').slice(0, 6), 16);
    return { slug, title: meta.title, description: meta.description, category: meta.category || 'Marketing', date: meta.date, dateText: fmtDate(meta.date),
      order: +(meta.order || 0), minutes: Math.max(1, Math.round(words / 200)), words, body, cx: 30 + h % 45, cy: 30 + (h >> 4) % 30, cr: (h >> 8) % 360 };
  }).sort((a, b) => (b.date + String(b.order).padStart(4, '0')).localeCompare(a.date + String(a.order).padStart(4, '0')));
}

async function main() {
  fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(path.join(OUT, 'blog'), { recursive: true });
  fs.cpSync(path.join(ROOT, 'assets'), path.join(OUT, 'assets'), { recursive: true });
  fs.rmSync(path.join(OUT, 'assets/js'), { recursive: true, force: true }); fs.mkdirSync(path.join(OUT, 'assets/js'));
  fs.copyFileSync(path.join(HERE, 'src/react.css'), path.join(OUT, 'assets/css/react.css'));
  if (!args.includes('--no-admin') && fs.existsSync(path.join(ROOT, 'admin'))) {
    fs.cpSync(path.join(ROOT, 'admin'), path.join(OUT, 'admin'), { recursive: true, filter: s => !/(^|[\\/])(data|config\.php|setup-code\.txt)$/.test(s) && !/\.sqlite/.test(s) });
  }

  /* 1. bundles: server (to render) and client (to hydrate) */
  const tmp = path.join(HERE, '.cache'); fs.mkdirSync(tmp, { recursive: true });
  await esbuild.build({ ...common, entryPoints: [path.join(HERE, 'src/server.jsx')], outfile: path.join(tmp, 'server.cjs'), platform: 'node', format: 'cjs' });
  const client = await esbuild.build({ ...common, entryPoints: [path.join(HERE, 'src/client.jsx')], write: false, minify: true, format: 'iife', target: 'es2019', legalComments: 'none' });
  const js = client.outputFiles[0].contents;
  const hash = b => crypto.createHash('sha1').update(b).digest('hex').slice(0, 8);
  const jsName = `app.${hash(js)}.js`; fs.writeFileSync(path.join(OUT, 'assets/js', jsName), js);
  const cssV = hash(Buffer.concat([fs.readFileSync(path.join(OUT, 'assets/css/site.css')), fs.readFileSync(path.join(OUT, 'assets/css/react.css'))]));
  delete require.cache[path.join(tmp, 'server.cjs')];
  const S = require(path.join(tmp, 'server.cjs'));
  const { SITE, SERVICES, PROJECTS, VIDEOS } = S, BASE = SITE.url, SVC = Object.fromEntries(SERVICES.map(s => [s.key, s]));
  const TODAY = new Date().toISOString().slice(0, 10), year = +TODAY.slice(0, 4);

  const posts = readPosts();
  const light = posts.map(({ body, words, order, ...p }) => p);

  /* 2. structured data shared by every page */
  const ORG = { '@type': 'ProfessionalService', '@id': BASE + '#org', name: SITE.name, url: BASE, logo: BASE + 'assets/img/logo.png', image: BASE + 'assets/img/og.png', slogan: SITE.tagline,
    description: SITE.description, telephone: SITE.phone_e164, email: SITE.email,
    address: { '@type': 'PostalAddress', addressLocality: SITE.city, addressRegion: 'Maharashtra', addressCountry: SITE.country },
    areaServed: { '@type': 'Country', name: 'India' }, sameAs: [SITE.instagram], knowsAbout: SERVICES.map(s => s.name),
    hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Digital marketing services', itemListElement: SERVICES.map(s => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.name, url: BASE + s.file } })) } };
  const WEBSITE = { '@type': 'WebSite', '@id': BASE + '#site', url: BASE, name: SITE.name, publisher: { '@id': BASE + '#org' }, inLanguage: 'en-IN' };
  const crumbsLd = trail => ({ '@type': 'BreadcrumbList', itemListElement: trail.map(([n, u], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: BASE + u })) });
  const faqLd = items => ({ '@type': 'FAQPage', mainEntity: items.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });

  const sitemap = [];
  function write(file, props, { title, description, jsonld = [], ogType = 'website', ogImage = 'assets/img/og.png', extraHead = '', bodyClass = '', robots }) {
    const root = '../'.repeat(file.split('/').length - 1), url = BASE + (file === 'index.html' ? '' : file);
    const data = { ...props, root, posts: light, year };
    const html = S.render(data);
    const ld = JSON.stringify({ '@context': 'https://schema.org', '@graph': [ORG, WEBSITE, ...jsonld] }).replace(/<\//g, '<\\/');
    const page = `<!DOCTYPE html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="${robots || (NOINDEX ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1')}">
<link rel="canonical" href="${url}">
<meta name="author" content="Sankruv Media">
<meta name="geo.region" content="IN-MH">
<meta name="geo.placename" content="Mumbai">
<meta property="og:locale" content="en_IN">
<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="Sankruv Media">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${BASE + ogImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${BASE + ogImage}">
<meta name="theme-color" content="#0a0c15">
${extraHead}
<link rel="icon" href="${root}assets/img/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="${root}assets/img/logo.png">
<link rel="alternate" type="application/rss+xml" title="Sankruv Media Blog" href="${root}blog/feed.xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anton&amp;family=Figtree:wght@400;500;600;700&amp;display=swap" rel="stylesheet">
<link rel="preload" href="${root}assets/img/logo.png" as="image">
<link rel="stylesheet" href="${root}assets/css/site.css?v=${cssV}">
<link rel="stylesheet" href="${root}assets/css/react.css?v=${cssV}">
<script>document.documentElement.classList.add('js')</script>
<script type="application/ld+json">${ld}</script>
</head>
<body class="${bodyClass}">
<div id="root">${html}</div>
<script id="__DATA__" type="application/json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>
<script src="${root}assets/js/${jsName}" defer></script>
</body>
</html>
`;
    fs.mkdirSync(path.dirname(path.join(OUT, file)), { recursive: true });
    fs.writeFileSync(path.join(OUT, file), page);
    sitemap.push([url, file]);
  }

  /* 3. fixed pages */
  const FIXED = [['index', 'index.html'], ['services', 'services.html'], ['projects', 'projects.html'], ['about', 'about.html'], ['blog', 'blog.html'], ['contact', 'contact.html'], ['notfound', '404.html']];
  for (const [name, file] of FIXED) {
    const meta = S.pageMeta(name), ld = [];
    for (const kind of (meta.schema || '').split(',').map(x => x.trim()).filter(Boolean)) {
      if (kind === 'faq_home') ld.push(faqLd(SITE.faq));
      else if (kind === 'crumb') ld.push(crumbsLd([['Home', ''], [meta.crumb, file]]));
      else if (kind === 'services') ld.push(...SERVICES.map(s => ({ '@type': 'Service', name: s.name, serviceType: s.name, description: s.summary, url: BASE + s.file, provider: { '@id': BASE + '#org' }, areaServed: { '@type': 'City', name: 'Mumbai' } })));
      else if (kind === 'about') ld.push({ '@type': 'AboutPage', url: BASE + file, name: meta.title, about: { '@id': BASE + '#org' } });
      else if (kind === 'contact') ld.push({ '@type': 'ContactPage', url: BASE + file, name: meta.title, about: { '@id': BASE + '#org' } });
      else if (kind === 'projects') ld.push({ '@type': 'CollectionPage', url: BASE + file, name: meta.title, hasPart: [
        ...PROJECTS.map(p => ({ '@type': 'CreativeWork', name: p.name, description: p.summary, creator: { '@id': BASE + '#org' } })),
        ...VIDEOS.map(v => ({ '@type': 'CreativeWork', name: v.title, genre: v.kind, creator: { '@id': BASE + '#org' } }))] });
      else if (kind === 'blog') ld.push({ '@type': 'Blog', '@id': BASE + 'blog.html#blog', url: BASE + file, name: 'Sankruv Media Blog', publisher: { '@id': BASE + '#org' },
        blogPost: posts.map(p => ({ '@type': 'BlogPosting', headline: p.title, url: `${BASE}blog/${p.slug}.html`, datePublished: p.date })) });
    }
    write(file, { page: name, nav: meta.nav || '' }, { title: meta.title, description: meta.description, jsonld: ld, bodyClass: meta.body || '', robots: name === 'notfound' ? 'noindex' : undefined });
  }

  /* 4. service pages */
  for (const s of SERVICES) {
    const trail = [['Home', ''], ['Services', 'services.html'], [s.name, s.file]];
    write(s.file, { page: 'service', nav: 'services', service: s.key }, { title: s.title, description: s.meta, jsonld: [crumbsLd(trail),
      { '@type': 'Service', name: s.name, serviceType: s.name, description: s.meta, url: BASE + s.file, provider: { '@id': BASE + '#org' }, areaServed: { '@type': 'City', name: 'Mumbai' },
        hasOfferCatalog: { '@type': 'OfferCatalog', name: s.name, itemListElement: s.items.map(([n, d]) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: n, description: d } })) } },
      faqLd(s.faq)] });
  }

  /* 5. blog articles */
  const CAT_SERVICE = { video: 'shoots', marketing: 'social', branding: 'branding', 'social media': 'social', web: 'web' };
  const AUTHOR = '<div class="author"><span class="avatar" aria-hidden="true">SM</span><div><b>Written by the Sankruv Media Team</b><p>We are a digital marketing agency in Mumbai for social media, websites, branding and production. <a href="../contact.html">Work with us</a>.</p></div></div>';
  for (const p of posts) {
    const root = '../', [blocks, toc] = markdown(p.body.replace(/\{\{root\}\}/g, root));
    const svc = SVC[CAT_SERVICE[p.category.toLowerCase()]];
    const callout = `<aside class="callout"><p class="d">${esc(svc ? `Need help with ${svc.name.toLowerCase()}?` : 'Want this done for your brand?')}</p><p>Sankruv Media plans and delivers this for brands every month. Tell us about yours and get a free quote.</p>`
      + `<div class="cta-row">${btn(svc ? `${root}contact.html?service=${svc.key}` : `${root}contact.html`, 'Get a free quote')}${btn(SITE.whatsapp_link, 'WhatsApp us', 'ghost', EXT)}</div></aside>`;
    const h2s = blocks.map((b, k) => (b.startsWith('<h2') ? k : -1)).filter(k => k >= 0);
    if (h2s.length >= 3) blocks.splice(h2s[2], 0, callout); else blocks.push(callout);
    let related = posts.filter(q => q !== p && q.category === p.category).slice(0, 2);
    related = related.concat(posts.filter(q => q !== p && !related.includes(q)).slice(0, 3 - related.length));
    const file = `blog/${p.slug}.html`, url = BASE + file;
    const og = fs.existsSync(path.join(ROOT, `assets/img/blog/${p.slug}.png`)) ? `assets/img/blog/${p.slug}.png` : 'assets/img/og.png';
    const { body, words, order, ...lp } = p;
    write(file, { page: 'post', nav: 'blog', post: { ...lp, url, toc, html: blocks.join('\n') + AUTHOR, related: related.map(q => q.slug) } }, {
      title: `${p.title} | Sankruv Media Blog`, description: p.description, ogType: 'article', ogImage: og, bodyClass: 'is-post',
      extraHead: `<meta property="article:published_time" content="${p.date}">\n<meta property="article:section" content="${esc(p.category)}">`,
      jsonld: [crumbsLd([['Home', ''], ['Blog', 'blog.html'], [p.title, file]]),
        { '@type': 'BlogPosting', '@id': url + '#article', mainEntityOfPage: url, headline: p.title, description: p.description, image: BASE + og, datePublished: p.date, dateModified: p.date,
          wordCount: p.words, articleSection: p.category, inLanguage: 'en-IN', author: { '@type': 'Organization', name: 'Sankruv Media Team', url: BASE }, publisher: { '@id': BASE + '#org' }, isPartOf: { '@id': BASE + 'blog.html#blog' } }] });
  }

  /* 6. feed, sitemap, robots */
  const D = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const rfc = iso => { const d = new Date(iso + 'T00:00:00Z'); return `${D[d.getUTCDay()]}, ${String(d.getUTCDate()).padStart(2, '0')} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()} 09:00:00 +0530`; };
  fs.writeFileSync(path.join(OUT, 'blog/feed.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>Sankruv Media Blog</title><link>${BASE}blog.html</link><description>Insights on social media, websites, branding and video for growing brands.</description><language>en-in</language>`
    + posts.map(p => `<item><title>${esc(p.title)}</title><link>${BASE}blog/${p.slug}.html</link><guid>${BASE}blog/${p.slug}.html</guid><pubDate>${rfc(p.date)}</pubDate><category>${esc(p.category)}</category><description>${esc(p.description)}</description></item>`).join('') + '</channel></rss>\n');
  const pd = Object.fromEntries(posts.map(p => [`blog/${p.slug}.html`, p.date]));
  fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`
    + sitemap.filter(([, f]) => f !== '404.html').map(([u, f]) => `  <url><loc>${u}</loc><lastmod>${pd[f] || TODAY}</lastmod></url>\n`).join('') + '</urlset>\n');
  fs.writeFileSync(path.join(OUT, 'robots.txt'), NOINDEX ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${BASE}sitemap.xml\n`);
  console.log(`Built ${sitemap.length} pages (${posts.length} articles, ${VIDEOS.length} films) into ${OUT}. JS ${(js.length / 1024).toFixed(0)} KB.`);
}
main().catch(e => { console.error(e); process.exit(1); });
