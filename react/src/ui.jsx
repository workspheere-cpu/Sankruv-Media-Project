/* Shared building blocks for every page. Content comes from /content (JSON and Markdown). */
import { createContext, useContext, Fragment } from 'react';
import ICONS from './data/icons.json';
import MOCKUPS from './data/mockups.json';
import SITE from '../../content/site.json';
import SERVICES from '../../content/services.json';
import PROJECTS from '../../content/projects.json';

export { SITE, SERVICES, PROJECTS };
export const SVC = Object.fromEntries(SERVICES.map(s => [s.key, s]));
export const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const pad2 = n => String(n).padStart(2, '0');

/* root: '' or '../' so links work from /blog/. posts: light list of articles. nav: active section. */
export const Ctx = createContext({ root: '', posts: [], nav: '' });
export const useSite = () => useContext(Ctx);
const EXT = { target: '_blank', rel: 'noopener' };

export function Icon({ k, cls = 'ic' }) {
  return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICONS[k] }} />;
}
export const Arrow = () => <Icon k="arrow" cls="ar" />;
export function Btn({ href, kind = 'hot', ext, children }) {
  return <a className={`btn ${kind}`} href={href} {...(ext ? EXT : {})}><span>{children}</span><Arrow /></a>;
}
/* pure CSS 3D mockups: spread onto the element that holds one, e.g. <div className="hs-vis tilt" {...mockup('cam')} /> */
export const mockup = kind => ({ dangerouslySetInnerHTML: { __html: MOCKUPS[kind] || MOCKUPS.phone } });

export const Stats = () => (
  <div className="nums">{SITE.stats.map(([n, l]) => <div className="num rv" key={l}><b><span data-count={n}>{n}</span>+</b><span>{l}</span></div>)}</div>
);
export function Brands() {
  const names = SITE.brands.map(b => <li key={b}>{b}</li>);
  return (
    <div className="brands" aria-label="Brands we have worked with"><p className="wrap brands-k">Brands that have worked with us</p>
      <div className="marq"><ul>{names}</ul><ul aria-hidden="true">{names}</ul></div></div>
  );
}
export const Reasons = () => (
  <ul className="reasons">{SITE.reasons.map(([k, t, d]) => <li className="rv" key={t}><span className="ri"><Icon k={k} /></span><h3>{t}</h3><p>{d}</p></li>)}</ul>
);
export const Timeline = ({ steps }) => (
  <div className="tlw"><div className="tl-line" aria-hidden="true"><i></i></div>
    <ol className="tl">{steps.map(([t, d], i) => <li className="tl-step" key={t}><span className="tl-dot"></span><div className="tl-body"><span className="tl-n">{pad2(i + 1)}</span><h3>{t}</h3><p>{d}</p></div></li>)}</ol></div>
);
export const Faq = ({ items }) => (
  <div className="faq-list">{items.map(([q, a]) => <details className="rv" key={q}><summary><span>{q}</span><i aria-hidden="true"></i></summary><div className="ans"><p>{a}</p></div></details>)}</div>
);
export const Quotes = () => (
  <div className="quotes" id="quotes">
    <div className="q-stage">{SITE.testimonials.map(([t, n, r], i) => (
      <figure className={i ? 'q' : 'q on'} aria-hidden={i ? 'true' : undefined} key={n}><blockquote>{t}</blockquote><figcaption><b>{n}</b><span>{r}</span></figcaption></figure>))}</div>
    <div className="qnav">{SITE.testimonials.map((x, i) => <button className={i ? 'qd' : 'qd on'} aria-label={`Show review ${i + 1}`} key={i}></button>)}</div>
  </div>
);
export function Picker() {
  const { root } = useSite();
  return (
    <div className="pick"><span>I need help with</span>
      {SERVICES.map(s => <a href={`${root}contact.html?service=${s.key}`} key={s.key}><Icon k={s.key} />{s.short}</a>)}
      <a href={`${root}contact.html?service=unsure`}><Icon k="unsure" />Not sure yet</a></div>
  );
}
export function Chapters({ full }) {
  return (
    <div className="chap">
      <div className="chap-stage" aria-hidden="true"><div className="chap-anchor" id="chapAnchor"></div>
        <ol className="chap-rail">{SERVICES.map(s => <li key={s.key}><button data-go={s.key}>{s.short}</button></li>)}</ol></div>
      <div className="chap-list">{SERVICES.map(s => (
        <article className="chapter" id={s.key} key={s.key} data-fx={`0 0 1 0 0 1 ${s.model}`} data-anchor="#chapAnchor" data-anchor-m=".art-orb">
          <div className="art-orb" aria-hidden="true"></div>
          <p className="label"><Icon k={s.key} />{s.short}</p>
          <h3 className="d chap-title sw">{s.name}</h3>
          <p className="lead">{full ? s.overview[0] : s.summary}</p>
          {full && <p className="mute">{s.overview[1]}</p>}
          <ul className="chips">{s.items.map(([n]) => <li key={n}>{n}</li>)}</ul>
          <div className="cta-row">
            <Btn href={s.file} kind="ghost">{full ? 'See full details' : 'Explore ' + s.short.toLowerCase()}</Btn>
            {full && <Btn href={`contact.html?service=${s.key}`}>Get a quote</Btn>}
          </div>
        </article>))}</div>
    </div>
  );
}
export const WorkReel = () => (
  <div className="hs-track">
    {PROJECTS.map(p => (
      <a className="hs-item" href={`projects.html#${p.key}`} key={p.key}><div className="hs-vis tilt" {...mockup(p.mockup)} />
        <div className="hs-cap"><h3>{p.name}</h3><p>{p.labels.join(', ')}</p></div></a>))}
    <a className="hs-item hs-end" href="contact.html"><span className="d">Your brand could be next</span><span className="btn hot"><span>Start your project</span><Arrow /></span></a>
  </div>
);
const RING = [['Reels and stories', 'Short-form video and stories for your channels.', 'social'], ['Content calendars', 'A monthly plan where every post has a purpose.', 'social'],
  ['Business websites', 'Responsive sites built around your brand.', 'web'], ['Online stores', 'Shopify, WooCommerce or custom eCommerce.', 'web'],
  ['Logos and identity', 'A mark and a system your brand can grow into.', 'branding'], ['Packaging', 'Packs and print that carry the same story.', 'branding'],
  ['Product shoots', 'Photo and video that make products look premium.', 'shoots'], ['Ad films', 'Promotional videos and reels for campaigns.', 'shoots']];
export const Ring = () => (
  <div className="ringwrap" id="ringwrap"><div className="ring" id="ring">
    {RING.map(([t, d, k], i) => <a className="rc" href={SVC[k].file} style={{ '--i': i }} draggable="false" key={t}><i>{SVC[k].short}</i><b>{t}</b><span>{d}</span></a>)}
  </div></div>
);
export const Cylinder = () => (
  <div className="cyl" aria-hidden="true" style={{ '--n': SITE.industries.length }}><div className="cyl-in">{SITE.industries.map((w, i) => <span style={{ '--i': i }} key={w}>{w}</span>)}</div></div>
);
export const ServiceRows = ({ list = SERVICES }) => (
  <ul className="svc-rows">{list.map(s => (
    <li className="rv" key={s.key}><a href={s.file}><span className="sr-i"><Icon k={s.key} /></span><span className="sr-n d">{s.name}</span><span className="sr-d">{s.summary}</span><Arrow /></a></li>))}</ul>
);
export function ProjectsFull() {
  return (
    <>
      <div className="pfilter" role="group" aria-label="Filter projects by service">
        <button className="on" data-f="all">All work</button>{SERVICES.map(s => <button data-f={s.key} key={s.key}>{s.short}</button>)}</div>
      <div className="cases">{PROJECTS.map((p, i) => {
        const lead = SVC[p.tags[0]];
        return (
          <article className={i % 2 ? 'case flip' : 'case'} id={p.key} key={p.key} data-tags={p.tags.join(' ')} data-fx={`${i % 2 ? 3 : -3} 0 .9 0 0 .45 ${lead.model}`}>
            <div className="case-vis tilt" {...mockup(p.mockup)} />
            <div className="case-txt">
              <p className="label">{p.labels.join(' and ')}</p>
              <h2 className="sw">{p.name}</h2>
              <p className="lead">{p.summary}</p>
              <dl className="facts">
                <div><dt>Services</dt><dd>{p.tags.map((t, k) => <Fragment key={t}>{k ? ', ' : ''}<a href={SVC[t].file}>{SVC[t].name}</a></Fragment>)}</dd></div>
                {p.location && <div><dt>Location</dt><dd>{p.location}</dd></div>}
                <div><dt>Delivered</dt><dd>{p.delivered.join(', ')}</dd></div>
              </dl>
              <a className="link" href={lead.file}>How we deliver {lead.name.toLowerCase()}<Arrow /></a>
            </div>
          </article>);
      })}</div>
    </>
  );
}
export function ContactServices() {
  const opts = [...SERVICES.map(s => [s.key, s.name, s.summary]), ['unsure', 'Not sure yet', 'Tell us your goal and we will recommend the right mix.']];
  return opts.map(([k, n, d]) => (
    <label className="opt" key={k}><input type="checkbox" name="services" value={n} data-key={k} /><span className="opt-i"><Icon k={k} /></span>
      <span className="opt-t"><b>{n}</b><span>{d}</span></span><span className="opt-c" aria-hidden="true"></span></label>));
}

/* ---------- blog ---------- */
export const Cover = ({ p, big }) => (
  <div className={big ? 'cover big' : 'cover'} data-c={slugify(p.category)} style={{ '--x': p.cx + '%', '--y': p.cy + '%', '--r': p.cr + 'deg' }} aria-hidden="true">
    <span className="cv-floor"></span><span className="cv-orb"></span><span className="cv-ring"></span><span className="cv-word">{p.category}</span></div>
);
export function PostRows({ list, id }) {
  const { root } = useSite();
  return (
    <ul className="prows" id={id}>{list.map(p => (
      <li className="rv" data-cat={slugify(p.category)} data-q={(p.title + ' ' + p.description).toLowerCase()} key={p.slug}>
        <a className="prow" href={`${root}blog/${p.slug}.html`}><span className="pr-thumb"><Cover p={p} /></span><span className="pr-cat">{p.category}</span>
          <span className="pr-main"><span className="pr-t">{p.title}</span><span className="pr-d">{p.description}</span></span>
          <span className="pr-m"><span>{p.dateText}</span><span>{p.minutes} min read</span></span><Arrow /></a></li>))}</ul>
  );
}
export const Featured = ({ p }) => (
  <a className="feat" href={`blog/${p.slug}.html`}><div className="feat-vis tilt"><Cover p={p} big /></div>
    <div className="feat-txt"><p className="label">Latest article</p><h2 className="feat-t">{p.title}</h2><p className="lead">{p.description}</p>
      <p className="pr-m">{p.category}, {p.dateText}, {p.minutes} min read</p><span className="btn hot"><span>Read the article</span><Arrow /></span></div></a>
);
export function Crumbs({ trail }) {
  const { root } = useSite();
  return (
    <nav className="crumb" aria-label="Breadcrumb">
      {trail.slice(0, -1).map(([n, u]) => <Fragment key={n}><a href={root + (u || 'index.html')}>{n}</a><span>/</span></Fragment>)}
      <b>{trail[trail.length - 1][0]}</b></nav>
  );
}
export function Share({ title, url }) {
  const q = encodeURIComponent;
  return (
    <>
      <a href={`https://wa.me/?text=${q(title + ' ' + url)}`} {...EXT} aria-label="Share on WhatsApp"><Icon k="wa" /></a>
      <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${q(url)}`} {...EXT} aria-label="Share on LinkedIn"><Icon k="in" /></a>
      <a href={`https://twitter.com/intent/tweet?url=${q(url)}&text=${q(title)}`} {...EXT} aria-label="Share on X"><Icon k="x" /></a>
      <button className="copy" data-url={url} aria-label="Copy link"><Icon k="link" /><span>Copy link</span></button>
    </>
  );
}

/* ---------- shell: header, menu drawer, tab bar, footer ---------- */
const NAV_L = [['services', 'services.html', 'Services'], ['work', 'projects.html', 'Work'], ['about', 'about.html', 'About']];
const NAV_R = [['blog', 'blog.html', 'Blog'], ['contact', 'contact.html', 'Contact']];
const MN = [['home', 'index.html', 'Home', 'Start here', 'home'], ['services', 'services.html', 'Services', 'Social, websites, branding, shoots', 'grid'],
  ['work', 'projects.html', 'Work', 'Films, projects and campaigns', 'layers'], ['about', 'about.html', 'About', 'Who we are and how we work', 'experience'],
  ['blog', 'blog.html', 'Blog', 'Guides on marketing, video and branding', 'doc'], ['contact', 'contact.html', 'Contact', 'Talk to our team', 'send']];
const on = (k, nav) => (k === nav ? { className: 'on', 'aria-current': 'page' } : {});

export function Header() {
  const { root, posts, nav } = useSite();
  const A = ([k, f, t]) => <a href={root + f} {...on(k, nav)} key={k}>{t}</a>;
  const cats = [...new Set(posts.map(p => p.category))];
  const lp = posts[0];
  return (
    <>
      <header id="hdr">
        <div className="hdr">
          <a className="hcall" href={`tel:${SITE.phone_e164}`} aria-label="Call Sankruv Media"><Icon k="phone" /></a>
          <nav className="hl" aria-label="Main">
            <div className="dd">{A(NAV_L[0])}<div className="dd-panel">
              {SERVICES.map(s => <a href={root + s.file} key={s.key}><Icon k={s.key} /><span><b>{s.name}</b><span>{s.summary.split(',')[0]}</span></span></a>)}</div></div>
            {NAV_L.slice(1).map(A)}
          </nav>
          <a className="logo" href={`${root}index.html`} aria-label="Sankruv Media home"><img src={`${root}assets/img/logo.png`} alt="Sankruv Media" width="525" height="256" /></a>
          <div className="hr"><nav className="hr-links" aria-label="More">{NAV_R.map(A)}</nav>
            <a className="btn hot sm" href={`${root}contact.html`}><span>Free quote</span><Arrow /></a>
            <button id="burger" aria-label="Open menu" aria-expanded="false" aria-controls="mnav"><i></i><i></i></button></div>
        </div>
      </header>
      <div className="mnav" id="mnav" hidden>
        <div className="mn-in">
          <a className="mn-quote" href={`${root}contact.html`} style={{ '--i': 0 }}><span><b>Get a free quote</b><small>Tell us what you need in under a minute</small></span><Arrow /></a>
          <nav className="mn-main" aria-label="Site sections">
            {MN.map(([k, f, t, d, ic], i) => <a href={root + f} style={{ '--i': i }} {...on(k, nav)} key={k}><span className="mn-i"><Icon k={ic} /></span><span className="mn-t"><b>{t}</b><small>{d}</small></span><Arrow /></a>)}
          </nav>
          <section className="mn-sec" aria-label="Services"><p className="mn-h">Our services</p><div className="mn-svc">
            {SERVICES.map((s, i) => <a href={root + s.file} style={{ '--i': i + 6 }} key={s.key}><span className="mn-si"><Icon k={s.key} /></span><b>{s.short}</b><small>{s.name}</small></a>)}</div></section>
          <section className="mn-sec" aria-label="Blog topics"><p className="mn-h">Read by topic</p>
            <div className="mn-topics">{cats.map(c => <a href={`${root}blog.html?cat=${slugify(c)}`} key={c}>{c}</a>)}</div>
            {lp && <a className="mn-post" href={`${root}blog/${lp.slug}.html`}><span className="mn-pt"><Cover p={lp} /></span><span><small>Latest article</small><b>{lp.title}</b></span></a>}</section>
          <div className="mn-acts">
            <a href={SITE.whatsapp_link} {...EXT}><Icon k="wa" /><span>WhatsApp</span></a>
            <a href={`tel:${SITE.phone_e164}`}><Icon k="phone" /><span>Call</span></a>
            <a href={`mailto:${SITE.email}`}><Icon k="mail" /><span>Email</span></a>
            <a href={SITE.instagram} {...EXT}><Icon k="ig" /><span>Instagram</span></a>
          </div>
        </div>
      </div>
    </>
  );
}
export function TabBar() {
  const { root, nav } = useSite();
  const T = (k, f, ic, lab) => <a href={root + f} {...on(k, nav)}><Icon k={ic} /><span>{lab}</span></a>;
  return (
    <nav className="tabbar" aria-label="App navigation">
      {T('home', 'index.html', 'home', 'Home')}{T('services', 'services.html', 'grid', 'Services')}
      <a className="fab" href={SITE.whatsapp_link} {...EXT}><span className="fab-b"><Icon k="wa" /></span><span>WhatsApp</span></a>
      {T('blog', 'blog.html', 'doc', 'Blog')}{T('contact', 'contact.html', 'send', 'Quote')}
    </nav>
  );
}
export function Footer({ year }) {
  const { root } = useSite();
  const pages = [['index.html', 'Home'], ['services.html', 'Services'], ['projects.html', 'Work'], ['about.html', 'About'], ['blog.html', 'Blog'], ['contact.html', 'Contact']];
  return (
    <footer>
      <div className="wrap">
        <div className="f-cta"><p>Have a project in mind?</p><a className="f-big d" href={`${root}contact.html`}>Let's talk<Arrow /></a></div>
        <div className="f-grid">
          <div className="f-brand"><img src={`${root}assets/img/logo.png`} alt="Sankruv Media" width="327" height="156" loading="lazy" /><p>{SITE.tagline}</p>
            <p className="mute">A digital marketing agency in Mumbai for social media, websites, branding and production.</p></div>
          <div><h2 className="f-h">Pages</h2><ul>{pages.map(([f, t]) => <li key={f}><a href={root + f}>{t}</a></li>)}</ul></div>
          <div><h2 className="f-h">Services</h2><ul>{SERVICES.map(s => <li key={s.key}><a href={root + s.file}>{s.name}</a></li>)}</ul></div>
          <div><h2 className="f-h">Contact</h2><ul>
            <li><a href={SITE.whatsapp_link} {...EXT}>WhatsApp</a></li>
            <li><a href={`tel:${SITE.phone_e164}`}>{SITE.phone}</a></li>
            <li><a href={`mailto:${SITE.email}`}>{SITE.email}</a></li>
            <li><a href={SITE.instagram} {...EXT}>Instagram {SITE.instagram_handle}</a></li>
            <li>{SITE.city}, India</li></ul></div>
        </div>
        <div className="f-bottom"><span>&copy; {year} Sankruv Media. All rights reserved.</span><span>Digital marketing agency in Mumbai</span></div>
      </div>
    </footer>
  );
}
