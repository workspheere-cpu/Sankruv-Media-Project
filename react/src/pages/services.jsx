/* Generated from src/pages/services.html by tools/html2jsx.py, then maintained here. */
export const meta = {"title": "Digital Marketing Services in Mumbai | Sankruv Media", "description": "Social media management, website design and development, branding and creative design, and corporate and commercial shoots from one Mumbai team. See what each service includes.", "nav": "services", "schema": "crumb, services", "crumb": "Services"};

export default function PageServices({ t }) {
  return (
    <>
<section className="ph split" data-fx="0 0 1 0.85 0 1 0" data-anchor=".ph-orb">
  <div className="wrap ph-grid">
    <div className="ph-txt">
      <nav className="crumb" aria-label="Breadcrumb"><a href={`${t.root}index.html`}>Home</a><span>/</span><b>Services</b></nav>
      <h1 className="sw">Digital marketing services <span className="t">in Mumbai</span></h1>
      <p className="lead rv">Four specialist services from one team: social media, websites, branding and production. Use one, or bring them together and let every channel work as one brand.</p>
      <div className="jump rv">
        <a href="#social">Social media</a><a href="#web">Websites</a><a href="#branding">Branding</a><a href="#shoots">Shoots</a>
      </div>
      <div className="cta rv"><a className="btn hot" href={`${t.root}contact.html`}><span>Get a free quote</span>{t.arrow}</a></div>
    </div>
    <div className="ph-orb" aria-hidden="true"></div>
  </div>
</section>

<section className="svc-sec" data-fx="0 0 1 0 0 1 0">
  <div className="wrap">
    {t.chapters_full}
  </div>
</section>

<section className="why" data-fx="3.2 0.3 0.8 0 0 1 3" data-anchor=".sec-orb">
  <div className="wrap">
    <div className="sec-orb" aria-hidden="true"></div>
    <div className="sec-head">
      <h2 className="sw">Included in every <span className="t">engagement</span></h2>
      <p className="lead rv">Whichever service you choose, you work with the same team, the same standards and the same clear reporting.</p>
    </div>
    {t.reasons}
  </div>
</section>

<section className="process" data-fx="3.3 0 0.8 0 0 0.5 4">
  <div className="wrap">
    <div className="sec-head">
      <h2 className="sw">How we <span className="t">work</span></h2>
      <p className="lead rv">Every project follows the same four steps, adapted to the service you choose.</p>
    </div>
    {t.process}
  </div>
</section>

<section className="faq" data-fx="-3.2 0 0.8 0 0 1 6" data-anchor=".sec-orb" data-anchor-m="none">
  <div className="wrap faq-grid">
    <div className="sec-head">
      <h2 className="sw">Questions about our <span className="t">services</span></h2>
      <p className="lead rv">Do not see your question here? Message us and we will reply directly.</p>
      <div className="sec-orb st" aria-hidden="true"></div>
    </div>
    {t.faq_home}
  </div>
</section>

<section className="climax" data-fx="0 0 1.35 0.15 0 1 0" data-anchor=".climax-orb">
  <div className="wrap">
    <div className="climax-orb" aria-hidden="true"></div>
    <h2 className="sw">Need a custom <span className="t">package?</span></h2>
    <p className="lead rv">Tell us which services you need and we will put together a plan and a free quote.</p>
    {t.picker}
    <div className="cta rv"><a className="btn hot" href={t.wa} target="_blank" rel="noopener"><span>WhatsApp us now</span>{t.icon_wa}</a><a className="btn ghost" href={`${t.root}contact.html`}><span>Send a message</span>{t.arrow}</a></div>
  </div>
</section>
    </>
  );
}
