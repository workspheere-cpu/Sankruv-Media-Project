/* The whole site as one React app. build.cjs renders it to HTML for every page (good for SEO and speed),
   and client.jsx hydrates the same tree in the browser. */
import { useEffect } from 'react';
import * as U from './ui.jsx';
import { VideoWall, ShowReel } from './Work.jsx';
import startEffects from './effects.js';
import Index, { meta as mIndex } from './pages/index.jsx';
import Services, { meta as mServices } from './pages/services.jsx';
import Projects, { meta as mProjects } from './pages/projects.jsx';
import About, { meta as mAbout } from './pages/about.jsx';
import Blog, { meta as mBlog } from './pages/blog.jsx';
import Contact, { meta as mContact } from './pages/contact.jsx';
import NotFound, { meta as mNotFound } from './pages/notfound.jsx';
import Service from './pages/service.jsx';
import Post from './pages/post.jsx';

const { SITE, SERVICES, SVC, Icon, Arrow } = U;
export const PAGES = {
  index: [Index, mIndex], services: [Services, mServices], projects: [Projects, mProjects], about: [About, mAbout],
  blog: [Blog, mBlog], contact: [Contact, mContact], notfound: [NotFound, mNotFound], service: [Service, {}], post: [Post, {}],
};
const CAT_MODEL = { video: 6, marketing: 5, branding: 3, agency: 0, 'social media': 5, web: 2 };

/* Everything a page template can place with {t.name} */
function tokens({ root, posts, service, post }) {
  const t = {
    root, arrow: <Arrow />, wa: SITE.whatsapp_link, tel: SITE.phone_e164, phone: SITE.phone, email: SITE.email, ig: SITE.instagram,
    ig_handle: SITE.instagram_handle, wa_number: SITE.whatsapp_number,
    icon_wa: <Icon k="wa" />, icon_phone: <Icon k="phone" />, icon_mail: <Icon k="mail" />, icon_ig: <Icon k="ig" />, icon_pin: <Icon k="pin" />, icon_search: <Icon k="search" />,
    stats: <U.Stats />, brands: <U.Brands />, reasons: <U.Reasons />, process: <U.Timeline steps={SITE.process} />, quotes: <U.Quotes />, picker: <U.Picker />,
    chapters_short: <U.Chapters />, chapters_full: <U.Chapters full />, work_reel: <U.WorkReel />, ring: <U.Ring />, cylinder: <U.Cylinder />,
    service_rows: <U.ServiceRows />, projects_full: <U.ProjectsFull />, faq_home: <U.Faq items={SITE.faq} />, contact_services: <U.ContactServices />,
    video_wall: <VideoWall />, showreel: <ShowReel />,
    latest_posts: <U.PostRows list={posts.slice(0, 3)} />, blog_featured: posts[0] ? <U.Featured p={posts[0]} /> : null,
    blog_filters: <><button className="on" data-c="all">All</button>{[...new Set(posts.map(p => p.category))].map(c => <button data-c={U.slugify(c)} key={c}>{c}</button>)}</>,
    blog_rows: <U.PostRows list={posts} id="prows" />, post_count: String(posts.length),
  };
  if (service) {
    const s = SVC[service];
    Object.assign(t, {
      s_name: s.name, s_h1a: s.h1[0], s_h1b: s.h1[1], s_key: s.key, s_model: s.model, s_icon: <Icon k={s.key} />, s_summary: s.summary,
      s_o1: s.overview[0], s_o2: s.overview[1], s_best: s.best_for, s_count: String(s.items.length), s_short: s.short.toLowerCase(),
      s_items: s.items.map(([n, d], i) => <li className="rv" key={n}><span className="it-n">{U.pad2(i + 1)}</span><h3>{n}</h3><p>{d}</p></li>),
      s_outcomes: s.outcomes.map(o => <li className="rv" key={o}><span className="oc-i"></span>{o}</li>),
      s_process: <U.Timeline steps={s.process} />, s_faq: <U.Faq items={s.faq} />, s_related: <U.ServiceRows list={SERVICES.filter(o => o !== s)} />,
      s_crumbs: <U.Crumbs trail={[['Home', ''], ['Services', 'services.html'], [s.name, s.file]]} />,
    });
  }
  if (post) {
    Object.assign(t, {
      p_title: post.title, p_desc: post.description, p_cat: post.category, p_catkey: U.slugify(post.category), p_date: post.dateText, p_iso: post.date,
      p_min: post.minutes, p_model: CAT_MODEL[post.category.toLowerCase()] || 0, p_cover: <U.Cover p={post} big />, p_body_html: post.html,
      p_toc: post.toc.map(([id, x]) => <li key={id}><a href={`#${id}`}>{x}</a></li>), p_share: <U.Share title={post.title} url={post.url} />,
      p_related: <U.PostRows list={post.related.map(s => posts.find(p => p.slug === s))} />,
      p_crumbs: <U.Crumbs trail={[['Home', ''], ['Blog', 'blog.html'], [post.title, '']]} />,
    });
  }
  return t;
}

export default function App(props) {
  const { page, root, nav, posts, year } = props;
  const Page = PAGES[page][0];
  useEffect(() => { startEffects(); }, []);
  return (
    <U.Ctx.Provider value={{ root, posts, nav }}>
      <a className="skip" href="#content">Skip to content</a>
      <canvas id="gl" aria-hidden="true"></canvas>
      <div id="bar" aria-hidden="true"></div>
      <div id="cursor" aria-hidden="true"></div>
      <U.Header />
      <main id="content"><Page t={tokens(props)} /></main>
      <U.Footer year={year} />
      <a id="wa" href={SITE.whatsapp_link} target="_blank" rel="noopener" aria-label="Chat with Sankruv Media on WhatsApp"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.6 14.2c-.2.7-1.4 1.3-1.9 1.3-.5.1-1.1.2-3.5-.8-3-1.2-4.8-4.2-5-4.4-.1-.2-1.2-1.6-1.2-3s.7-2.1 1-2.4c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.9 2.2c.1.2.1.4 0 .6l-.4.6-.4.5c-.1.1-.3.3-.1.6.2.3.8 1.3 1.8 2.2 1.2 1.1 2.2 1.4 2.5 1.6.3.1.5.1.7-.1l.9-1.1c.2-.3.4-.2.7-.1l2.1 1c.3.1.5.2.6.3.1.2.1.7-.1 1.3z" /></svg><span>WhatsApp</span></a>
      <U.TabBar />
    </U.Ctx.Provider>
  );
}
