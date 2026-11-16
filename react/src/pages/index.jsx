export const meta = {"title": "Sankruv Media | Digital Marketing Agency in Mumbai", "description": "Sankruv Media is a digital marketing agency in Mumbai for social media management, website design and development, branding and corporate and commercial shoots. 50+ clients, 700+ campaigns.", "nav": "home", "schema": "faq_home", "body": "is-home"};

export default function PageIndex({ t }) {
  return (
    <>
<section className="hero" data-fx="0 0 1 0 0 1 0" data-anchor=".orb">
  <div className="wrap hero-in">
    <h1 className="kicker rv"><i></i>Digital marketing agency in Mumbai</h1>
    <p className="d metal sw hero-h">You dream it.<br /><span className="t">We design it.</span></p>
    <div className="orb" aria-hidden="true">
      <span className="tag" style={{"--x": "-8%", "--y": "14%", "--d": "0s"}}>Social media</span>
      <span className="tag" style={{"--x": "92%", "--y": "22%", "--d": "-2s"}}>Websites</span>
      <span className="tag" style={{"--x": "-4%", "--y": "78%", "--d": "-4s"}}>Branding</span>
      <span className="tag" style={{"--x": "90%", "--y": "84%", "--d": "-1s"}}>Shoots</span>
    </div>
    <div className="hero-foot rv">
      <p className="lead">We build digital identities for lifestyle, fashion, retail, corporate and real estate brands. Social media, websites, branding and production, handled end to end by one team.</p>
      <div className="cta">
        <a className="btn hot" href={`${t.root}contact.html`}><span>Start your project</span>{t.arrow}</a>
        <a className="btn ghost" href={t.wa} target="_blank" rel="noopener"><span>WhatsApp us</span>{t.icon_wa}</a>
      </div>
    </div>
    <a className="cue" href="#intro"><span>Scroll to explore</span><i></i></a>
  </div>
</section>

{t.brands}

<section className="intro" id="intro" data-fx="3.2 0.4 0.75 0 0 0.45 4">
  <div className="wrap">
    <p className="scrub">Sankruv Media is a digital marketing agency in Mumbai. For more than five years we have helped brands get noticed, remembered and chosen, through social media, websites, branding and production, all under one roof.</p>
    {t.stats}
  </div>
</section>

<section className="svc-sec" data-fx="0 0 1 0 0 1 0" data-anchor="#chapAnchor" data-anchor-m=".art-orb">
  <div className="wrap">
    <div className="sec-head">
      <h2 className="sw">Four services.<br /><span className="t">One team.</span></h2>
      <p className="lead rv">Everything your brand needs to grow online, planned together and delivered by the same people, so it all looks and sounds like you.</p>
    </div>
    {t.chapters_short}
  </div>
</section>

<section className="why" data-fx="3.2 0.3 0.8 0 0 1 3" data-anchor=".sec-orb">
  <div className="wrap">
    <div className="sec-orb" aria-hidden="true"></div>
    <div className="sec-head">
      <h2 className="sw">Why brands choose <span className="t">Sankruv</span></h2>
      <p className="lead rv">Strategy, creativity and delivery you can rely on, from the first idea to the monthly report.</p>
    </div>
    {t.reasons}
  </div>
</section>

{t.showreel}

<section className="hs" data-fx="0 -2.1 0.45 0 0 0.3 2">
  <div className="hs-pin">
    <div className="wrap hs-head">
      <h2 className="sw">Work that gets <span className="t">noticed</span></h2>
      <a className="link" href={`${t.root}projects.html`}>See all projects{t.arrow}</a>
    </div>
    {t.work_reel}
  </div>
</section>

<section className="process" data-fx="3.3 0 0.8 0 0 0.5 4">
  <div className="wrap">
    <div className="sec-head">
      <h2 className="sw">From first call to <span className="t">live campaign</span></h2>
      <p className="lead rv">A clear four-step process, so you always know what happens next and why.</p>
    </div>
    {t.process}
    <p className="nudge rv"><a className="link" href={`${t.root}contact.html`}>Book a free discovery call{t.arrow}</a></p>
  </div>
</section>

<section className="voices" data-fx="3.4 0.2 0.7 0 0 0.55 1">
  <div className="wrap">
    <h2 className="sw">Clients say it <span className="t">better</span></h2>
    {t.quotes}
  </div>
</section>

<section className="latest" data-fx="3.5 -1.4 0.6 0 0 0.3 5">
  <div className="wrap">
    <div className="sec-head row">
      <h2 className="sw">Fresh from the <span className="t">blog</span></h2>
      <a className="link" href={`${t.root}blog.html`}>Read all articles{t.arrow}</a>
    </div>
    {t.latest_posts}
  </div>
</section>

<section className="faq" data-fx="-3.2 0 0.8 0 0 1 6" data-anchor=".sec-orb" data-anchor-m="none">
  <div className="wrap faq-grid">
    <div className="sec-head">
      <h2 className="sw">Questions, <span className="t">answered</span></h2>
      <p className="lead rv">Anything else on your mind? Our team replies on WhatsApp, by phone or by email.</p>
      <div className="cta rv"><a className="btn ghost" href={`${t.root}contact.html`}><span>Ask us a question</span>{t.arrow}</a></div>
      <div className="sec-orb st" aria-hidden="true"></div>
    </div>
    {t.faq_home}
  </div>
</section>

<section className="climax" data-fx="0 0 1.35 0.15 0 1 0" data-anchor=".climax-orb">
  <div className="wrap">
    <div className="climax-orb" aria-hidden="true"></div>
    <h2 className="sw">Ready to grow<br /><span className="t">your brand?</span></h2>
    <p className="lead rv">Tell us what you are dreaming of. We will come back with ideas, a plan and a free quote.</p>
    {t.picker}
    <div className="cta rv">
      <a className="btn hot" href={t.wa} target="_blank" rel="noopener"><span>WhatsApp us now</span>{t.icon_wa}</a>
      <a className="btn ghost" href={`tel:${t.tel}`}><span>Call {t.phone}</span>{t.icon_phone}</a>
    </div>
  </div>
</section>
    </>
  );
}
