export const meta = {"title": "Digital Marketing Blog: Social Media, Video and Branding Tips | Sankruv Media", "description": "Practical articles from Sankruv Media on social media, video marketing, video editing, websites and brand strategy for growing businesses in India.", "nav": "blog", "schema": "crumb, blog", "crumb": "Blog", "body": "is-blog"};

export default function PageBlog({ t }) {
  return (
    <>
<section className="ph blog-hero" data-fx="3 0.6 0.75 0 0 0.6 5">
  <div className="wrap">
    <nav className="crumb" aria-label="Breadcrumb"><a href={`${t.root}index.html`}>Home</a><span>/</span><b>Blog</b></nav>
    <h1 className="sw">Insights for <span className="t">growing brands</span></h1>
    <p className="lead rv">Practical ideas on social media, video, websites and branding from the Sankruv Media team. New articles are added regularly.</p>
    <div className="bsearch rv">
      <label className="sr-only" htmlFor="q">Search articles</label>
      {t.icon_search}<input id="q" type="search" placeholder="Search articles" autoComplete="off" />
    </div>
  </div>
</section>

<section className="featured" data-fx="-3 0 0.6 0 0 0.3 6">
  <div className="wrap">{t.blog_featured}</div>
</section>

<section className="all-posts" data-fx="3.6 -1.5 0.55 0 0 0.3 5">
  <div className="wrap">
    <div className="sec-head row">
      <h2 className="sw">All <span className="t">articles</span></h2>
      <div className="bfilter" role="group" aria-label="Filter articles by topic">{t.blog_filters}</div>
    </div>
    {t.blog_rows}
    <p className="empty" id="empty" hidden>No articles match your search. Try another word, or <a href={`${t.root}contact.html`}>ask our team directly</a>.</p>
  </div>
  <div className="peek" id="peek" aria-hidden="true"></div>
</section>

<section className="climax" data-fx="0 0 1.35 0.15 0 1 0" data-anchor=".climax-orb">
  <div className="wrap">
    <div className="climax-orb" aria-hidden="true"></div>
    <h2 className="sw">Want this done <span className="t">for your brand?</span></h2>
    <p className="lead rv">Our team puts these ideas to work for brands every month. Tell us what you need.</p>
    {t.picker}
    <div className="cta rv"><a className="btn hot" href={t.wa} target="_blank" rel="noopener"><span>WhatsApp us now</span>{t.icon_wa}</a><a className="btn ghost" href={t.ig} target="_blank" rel="noopener"><span>Follow {t.ig_handle}</span>{t.icon_ig}</a></div>
  </div>
</section>
    </>
  );
}
