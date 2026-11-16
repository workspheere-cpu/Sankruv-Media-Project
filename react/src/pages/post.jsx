export const meta = {"template": "blog article, filled once per file in content/blog"};

export default function Page_Post({ t }) {
  return (
    <>
<article className="article">
  <section className="ph post-hero" data-fx={`3.1 0.7 0.7 0 0 0.5 ${t.p_model}`}>
    <div className="wrap narrow">
      {t.p_crumbs}
      <a className="pcat" href={`${t.root}blog.html?cat=${t.p_catkey}`}>{t.p_cat}</a>
      <h1 className="post-h1 sw">{t.p_title}</h1>
      <p className="lead rv">{t.p_desc}</p>
      <div className="byline rv">
        <span className="avatar" aria-hidden="true">SM</span>
        <span><b>Sankruv Media Team</b><span><time dateTime={t.p_iso}>{t.p_date}</time>, {t.p_min} min read</span></span>
      </div>
    </div>
  </section>

  <div className="wrap"><div className="post-cover tilt rv">{t.p_cover}</div></div>

  <section className="post-body" data-fx={`3.9 0.4 0.6 0 0 0.3 ${t.p_model}`}>
    <div className="wrap post-grid">
      <aside className="toc">
        <p>On this page</p>
        <ol>{t.p_toc}</ol>
        <div className="share"><p>Share this article</p><div>{t.p_share}</div></div>
      </aside>
      <div className="prose" dangerouslySetInnerHTML={{ __html: t.p_body_html }} />
    </div>
  </section>
</article>

<section className="latest" data-fx="3.2 0 0.7 0 0 0.45 5">
  <div className="wrap">
    <div className="sec-head row">
      <h2 className="sw">Keep <span className="t">reading</span></h2>
      <a className="link" href={`${t.root}blog.html`}>All articles{t.arrow}</a>
    </div>
    {t.p_related}
  </div>
</section>

<section className="climax" data-fx="0 0 1.35 0.15 0 1 0" data-anchor=".climax-orb">
  <div className="wrap">
    <div className="climax-orb" aria-hidden="true"></div>
    <h2 className="sw">Turn these ideas into <span className="t">results</span></h2>
    <p className="lead rv">Tell us about your brand and we will send a plan and a free quote.</p>
    {t.picker}
    <div className="cta rv"><a className="btn hot" href={t.wa} target="_blank" rel="noopener"><span>WhatsApp us now</span>{t.icon_wa}</a><a className="btn ghost" href={`${t.root}contact.html`}><span>Send a message</span>{t.arrow}</a></div>
  </div>
</section>
    </>
  );
}
