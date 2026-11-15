/* Generated from src/pages/projects.html by tools/html2jsx.py, then maintained here. */
export const meta = {"title": "Our Work: Projects and Campaigns | Sankruv Media", "description": "Commercial shoots, social media campaigns and creative design by Sankruv Media for brands including Havmor, Divine Trendz and IIJS Premiere 2021.", "nav": "work", "schema": "crumb, projects", "crumb": "Work"};

export default function PageProjects({ t }) {
  return (
    <>
<section className="ph split" data-fx="0 0 1 0 0 1 2" data-anchor=".ph-orb">
  <div className="wrap ph-grid">
    <div className="ph-txt">
      <nav className="crumb" aria-label="Breadcrumb"><a href={`${t.root}index.html`}>Home</a><span>/</span><b>Work</b></nav>
      <h1 className="sw">Work that <span className="t">gets noticed</span></h1>
      <p className="lead rv">Shoots, campaigns and creative design for brands in food, home, jewellery and more. Each project brings strategy, design and production together.</p>
      <div className="cta rv"><a className="btn hot" href={`${t.root}contact.html`}><span>Start your project</span>{t.arrow}</a></div>
    </div>
    <div className="ph-orb" aria-hidden="true"></div>
  </div>
</section>

{t.video_wall}

<section className="work" data-fx="0 -1.6 0.5 0.4 0 0.3 0">
  <div className="wrap">
    {t.projects_full}
  </div>
</section>

<section className="make" data-fx="3 1.2 0.5 0 0 1 4" data-anchor=".sec-orb">
  <div className="wrap">
    <div className="sec-orb" aria-hidden="true"></div>
    <div className="sec-head">
      <h2 className="sw">What we <span className="t">make</span></h2>
      <p className="lead rv">The work behind every project. Drag to spin, or select a card to see the service.</p>
    </div>
  </div>
  {t.ring}
</section>

<section className="industries" data-fx="-3.4 -1.6 0.55 0 0 0.35 1">
  <div className="wrap ind-grid">
    <div className="sec-head">
      <h2 className="sw">Industries we <span className="t">know</span></h2>
      <p className="lead rv">We create for lifestyle, fashion, retail, corporate and real estate brands, among others. Each industry has its own audience, language and pace, and we plan for it.</p>
    </div>
    {t.cylinder}
  </div>
</section>

<section className="climax" data-fx="0 0 1.35 0.15 0 1 0" data-anchor=".climax-orb">
  <div className="wrap">
    <div className="climax-orb" aria-hidden="true"></div>
    <h2 className="sw">Your brand could be <span className="t">next</span></h2>
    <p className="lead rv">Tell us about your brand and the result you want. We will plan the work and send a free quote.</p>
    {t.picker}
    <div className="cta rv"><a className="btn hot" href={t.wa} target="_blank" rel="noopener"><span>WhatsApp us now</span>{t.icon_wa}</a><a className="btn ghost" href={`${t.root}contact.html`}><span>Send a message</span>{t.arrow}</a></div>
  </div>
</section>
    </>
  );
}
