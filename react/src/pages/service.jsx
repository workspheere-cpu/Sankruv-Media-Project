export const meta = {"template": "service landing page, filled once per entry in content/services.json"};

export default function Page_Service({ t }) {
  return (
    <>
<section className="ph split" data-fx={`0 0 1 0 0 1 ${t.s_model}`} data-anchor=".ph-orb">
  <div className="wrap ph-grid">
    <div className="ph-txt">
      {t.s_crumbs}
      <p className="label rv">{t.s_icon}{t.s_name}</p>
      <h1 className="sw">{t.s_h1a} <span className="t">{t.s_h1b}</span></h1>
      <p className="lead rv">{t.s_summary}</p>
      <div className="cta rv">
        <a className="btn hot" href={`${t.root}contact.html?service=${t.s_key}`}><span>Get a free quote</span>{t.arrow}</a>
        <a className="btn ghost" href={t.wa} target="_blank" rel="noopener"><span>WhatsApp us</span>{t.icon_wa}</a>
      </div>
    </div>
    <div className="ph-orb" aria-hidden="true"></div>
  </div>
</section>

<section className="overview" data-fx={`3.7 1.6 0.45 0 0 0.35 ${t.s_model}`}>
  <div className="wrap ov-grid">
    <p className="scrub">{t.s_o1}</p>
    <div className="ov-side rv">
      <p>{t.s_o2}</p>
      <div className="best"><span>Best for</span><p>{t.s_best}</p></div>
    </div>
  </div>
</section>

<section className="incl" data-fx={`3.3 0 0.75 0 0 1 ${t.s_model}`} data-anchor=".sec-orb">
  <div className="wrap">
    <div className="sec-orb" aria-hidden="true"></div>
    <div className="sec-head">
      <h2 className="sw">What is <span className="t">included</span></h2>
      <p className="lead rv">{t.s_count} services, planned together and delivered by one team. Choose the full set or the parts you need.</p>
    </div>
    <ol className="items">{t.s_items}</ol>
  </div>
</section>

<section className="outcomes" data-fx="-3.3 0 0.75 0.6 0 1 0" data-anchor=".sec-orb" data-anchor-m="none">
  <div className="wrap oc-grid">
    <div><h2 className="sw">What you <span className="t">get</span></h2><div className="sec-orb st" aria-hidden="true"></div></div>
    <ul className="oc">{t.s_outcomes}</ul>
  </div>
</section>

<section className="process" data-fx="3.3 0 0.8 0 0 0.5 4">
  <div className="wrap">
    <div className="sec-head">
      <h2 className="sw">How it <span className="t">works</span></h2>
      <p className="lead rv">Four clear steps from brief to results.</p>
    </div>
    {t.s_process}
  </div>
</section>

<section className="faq" data-fx={`-3.2 0 0.8 0 0 1 ${t.s_model}`} data-anchor=".sec-orb" data-anchor-m="none">
  <div className="wrap faq-grid">
    <div className="sec-head">
      <h2 className="sw">Common <span className="t">questions</span></h2>
      <p className="lead rv">Ask us anything else on WhatsApp, by phone or by email.</p>
      <div className="cta rv"><a className="btn ghost" href={`${t.root}contact.html?service=${t.s_key}`}><span>Ask a question</span>{t.arrow}</a></div>
      <div className="sec-orb st" aria-hidden="true"></div>
    </div>
    {t.s_faq}
  </div>
</section>

<section className="related" data-fx="3.2 0 0.7 0.8 0 1 0" data-anchor=".sec-orb">
  <div className="wrap">
    <div className="sec-orb" aria-hidden="true"></div>
    <div className="sec-head"><h2 className="sw">More from <span className="t">the same team</span></h2></div>
    {t.s_related}
  </div>
</section>

<section className="climax" data-fx={`0 0 1.35 0 0 1 ${t.s_model}`} data-anchor=".climax-orb">
  <div className="wrap">
    <div className="climax-orb" aria-hidden="true"></div>
    <h2 className="sw">Let's talk about <span className="t">your brand</span></h2>
    <p className="lead rv">Share a few details about your goals. We will come back with ideas and a free quote for {t.s_short}.</p>
    <div className="cta rv">
      <a className="btn hot" href={`${t.root}contact.html?service=${t.s_key}`}><span>Get a free quote</span>{t.arrow}</a>
      <a className="btn ghost" href={t.wa} target="_blank" rel="noopener"><span>WhatsApp us now</span>{t.icon_wa}</a>
    </div>
  </div>
</section>
    </>
  );
}
