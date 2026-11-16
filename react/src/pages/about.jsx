export const meta = {"title": "About Sankruv Media | Digital Marketing Agency in Mumbai", "description": "Sankruv Media is a Mumbai digital marketing agency with 5+ years of experience, 50+ satisfied clients, 25+ brands built and 700+ campaigns delivered.", "nav": "about", "schema": "crumb, about", "crumb": "About"};

export default function PageAbout({ t }) {
  return (
    <>
<section className="ph split" data-fx="0 0 1 0 0 1 1" data-anchor=".ph-orb">
  <div className="wrap ph-grid">
    <div className="ph-txt">
      <nav className="crumb" aria-label="Breadcrumb"><a href={`${t.root}index.html`}>Home</a><span>/</span><b>About</b></nav>
      <h1 className="sw">We build brands <span className="t">people remember</span></h1>
      <p className="lead rv">Sankruv Media is a digital marketing agency in Mumbai. We help brands build a strong digital identity and grow online, with creativity, strategy and delivery under one roof.</p>
      <div className="cta rv"><a className="btn hot" href={`${t.root}contact.html`}><span>Work with us</span>{t.arrow}</a><a className="btn ghost" href={`${t.root}services.html`}><span>Our services</span>{t.arrow}</a></div>
    </div>
    <div className="ph-orb" aria-hidden="true"></div>
  </div>
</section>

<section className="intro" data-fx="3.2 0.4 0.75 0 0 0.45 3">
  <div className="wrap">
    <p className="scrub">For more than five years we have worked with brands across lifestyle, fashion, retail, corporate and real estate. Our belief is simple: great marketing comes from understanding the brand first, then creating with purpose and measuring what matters.</p>
    {t.stats}
  </div>
</section>

<section className="story" data-fx="0 -1.9 0.55 0.5 0 0.35 0">
  <div className="wrap story-grid">
    <div className="sec-head">
      <h2 className="sw">Building brands. Creating impact. <span className="t">Driving digital growth.</span></h2>
    </div>
    <div className="story-txt rv">
      <p className="lead">Our name stands for a way of working: building brands with care, creating work that has impact, and driving growth that can be measured.</p>
      <p>We bring social media, websites, branding and production together, so you do not need to brief and manage several agencies. One team learns your brand, plans the work and delivers it, which keeps everything consistent and moving quickly.</p>
      <p>Every engagement is shaped by data and reviewed every month. We keep what works, improve what does not and keep you informed at every step.</p>
    </div>
  </div>
</section>

<section className="why" data-fx="3.2 0.3 0.8 0 0 1 3" data-anchor=".sec-orb">
  <div className="wrap">
    <div className="sec-orb" aria-hidden="true"></div>
    <div className="sec-head">
      <h2 className="sw">What you can <span className="t">count on</span></h2>
      <p className="lead rv">Six commitments behind every project we deliver.</p>
    </div>
    {t.reasons}
  </div>
</section>

<section className="industries" data-fx="-3.4 -1.6 0.55 0 0 0.35 1">
  <div className="wrap ind-grid">
    <div className="sec-head">
      <h2 className="sw">Industries we <span className="t">know</span></h2>
      <p className="lead rv">Experience across lifestyle, fashion, retail, corporate and real estate means we understand how different audiences discover, compare and choose brands.</p>
    </div>
    {t.cylinder}
  </div>
</section>

<section className="capab" data-fx="3.2 0 0.75 0.8 0 1 0" data-anchor=".sec-orb">
  <div className="wrap">
    <div className="sec-orb" aria-hidden="true"></div>
    <div className="sec-head">
      <h2 className="sw">What we <span className="t">do</span></h2>
      <p className="lead rv">Four services, one team. Explore each one in detail.</p>
    </div>
    {t.service_rows}
  </div>
</section>

<section className="process" data-fx="3.3 0 0.8 0 0 0.5 4">
  <div className="wrap">
    <div className="sec-head">
      <h2 className="sw">How we <span className="t">work</span></h2>
    </div>
    {t.process}
  </div>
</section>

<section className="climax" data-fx="0 0 1.35 0.15 0 1 1" data-anchor=".climax-orb">
  <div className="wrap">
    <div className="climax-orb" aria-hidden="true"></div>
    <h2 className="sw">Let's build your <span className="t">brand together</span></h2>
    <p className="lead rv">Tell us where your brand is today and where you want it to go.</p>
    <div className="cta rv"><a className="btn hot" href={`${t.root}contact.html`}><span>Start a conversation</span>{t.arrow}</a><a className="btn ghost" href={t.wa} target="_blank" rel="noopener"><span>WhatsApp us</span>{t.icon_wa}</a></div>
  </div>
</section>
    </>
  );
}
