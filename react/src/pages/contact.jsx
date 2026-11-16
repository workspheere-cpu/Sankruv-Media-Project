export const meta = {"title": "Contact Sankruv Media | Get a Free Quote in Mumbai", "description": "Talk to Sankruv Media about social media, websites, branding or shoots. WhatsApp us, call +91 866-873-8331, email contact@sankruvmedia.com or send a brief for a free quote.", "nav": "contact", "schema": "crumb, contact", "crumb": "Contact", "body": "is-contact"};

export default function PageContact({ t }) {
  return (
    <>
<section className="ph split contact-hero" data-fx="0 0 1 0 0 1 5" data-anchor=".ph-orb">
  <div className="wrap ph-grid">
    <div className="ph-txt">
      <nav className="crumb" aria-label="Breadcrumb"><a href={`${t.root}index.html`}>Home</a><span>/</span><b>Contact</b></nav>
      <h1 className="sw">Let's build <span className="t">your brand</span></h1>
      <p className="lead rv">Tell us what you need in under a minute. We will come back with ideas, a plan and a free quote.</p>
      <div className="cta rv"><a className="btn hot" href="#brief"><span>Start your brief</span>{t.arrow}</a><a className="btn ghost" href={t.wa} target="_blank" rel="noopener"><span>WhatsApp us</span>{t.icon_wa}</a></div>
    </div>
    <div className="ph-orb" aria-hidden="true"></div>
  </div>
</section>

<section className="brief-sec" id="brief" data-fx="0 -2 0.5 0 0 0.3 5">
  <div className="wrap brief-grid">
    <form className="brief" id="brief-form" novalidate data-endpoint="admin/lead.php" data-wa={t.wa_number} data-mail={t.email}>
      <ol className="steps-nav" aria-label="Form progress">
        <li className="on"><span>1</span>Services</li><li><span>2</span>Timeline</li><li><span>3</span>Your details</li>
      </ol>
      <div className="bar2" aria-hidden="true"><i></i></div>

      <fieldset className="step on" data-step="1">
        <legend className="d">What can we help you with?</legend>
        <p className="hint">Choose one or more.</p>
        <div className="opts">{t.contact_services}</div>
      </fieldset>

      <fieldset className="step" data-step="2" hidden>
        <legend className="d">When would you like to start?</legend>
        <div className="opts radios">
          <label className="opt sm"><input type="radio" name="timeline" value="As soon as possible" /><span className="opt-t"><b>As soon as possible</b></span><span className="opt-c" aria-hidden="true"></span></label>
          <label className="opt sm"><input type="radio" name="timeline" value="Within a month" /><span className="opt-t"><b>Within a month</b></span><span className="opt-c" aria-hidden="true"></span></label>
          <label className="opt sm"><input type="radio" name="timeline" value="In the next few months" /><span className="opt-t"><b>In the next few months</b></span><span className="opt-c" aria-hidden="true"></span></label>
          <label className="opt sm"><input type="radio" name="timeline" value="Just exploring" /><span className="opt-t"><b>Just exploring options</b></span><span className="opt-c" aria-hidden="true"></span></label>
        </div>
      </fieldset>

      <fieldset className="step" data-step="3" hidden>
        <legend className="d">How can we reach you?</legend>
        <div className="fields">
          <label htmlFor="f-name">Full name<input id="f-name" name="name" autoComplete="name" required /></label>
          <label htmlFor="f-phone">Phone or WhatsApp<input id="f-phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" /></label>
          <label className="hp" aria-hidden="true">Leave this empty<input id="f-web" name="website" tabIndex="-1" autoComplete="off" /></label>
          <label htmlFor="f-email">Email<input id="f-email" name="email" type="email" autoComplete="email" required /></label>
          <label htmlFor="f-company">Company or brand<input id="f-company" name="company" autoComplete="organization" /></label>
          <label className="full" htmlFor="f-msg">Tell us about your project<textarea id="f-msg" name="message" rows="4" placeholder="Your goals, audience, timeline or anything else we should know"></textarea></label>
        </div>
      </fieldset>

      <p className="ferr" id="ferr" role="alert"></p>
      <div className="fnav">
        <button type="button" className="btn ghost" id="fback" hidden><span>Back</span></button>
        <button type="button" className="btn hot" id="fnext"><span>Continue</span>{t.arrow}</button>
        <button type="submit" className="btn hot" id="fsend" hidden><span>Review and send</span>{t.arrow}</button>
      </div>

      <div className="sent" id="sent" hidden tabIndex="-1">
        <p className="d">Your brief is ready</p>
        <p>Choose how to send it. Both open with your message already written.</p>
        <pre id="sum"></pre>
        <div className="cta">
          <a className="btn hot" id="via-wa" href="#" target="_blank" rel="noopener"><span>Send on WhatsApp</span>{t.icon_wa}</a>
          <a className="btn ghost" id="via-mail" href="#"><span>Send by email</span>{t.icon_mail}</a>
          <button type="button" className="btn ghost" id="via-copy"><span>Copy message</span></button>
        </div>
      </div>
    </form>

    <aside className="channels">
      <h2 className="sw">Prefer to <span className="t">talk?</span></h2>
      <a className="ch rv" href={t.wa} target="_blank" rel="noopener"><span className="ch-i">{t.icon_wa}</span><span><small>WhatsApp, the fastest way</small><b>Chat with us now</b></span>{t.arrow}</a>
      <a className="ch rv" href={`tel:${t.tel}`}><span className="ch-i">{t.icon_phone}</span><span><small>Call us</small><b>{t.phone}</b></span>{t.arrow}</a>
      <a className="ch rv" href={`mailto:${t.email}`}><span className="ch-i">{t.icon_mail}</span><span><small>Email us</small><b>{t.email}</b></span>{t.arrow}</a>
      <a className="ch rv" href={t.ig} target="_blank" rel="noopener"><span className="ch-i">{t.icon_ig}</span><span><small>Instagram</small><b>{t.ig_handle}</b></span>{t.arrow}</a>
      <div className="ch rv"><span className="ch-i">{t.icon_pin}</span><span><small>Based in</small><b>Mumbai, India</b></span></div>
    </aside>
  </div>
</section>

<section className="next" data-fx="3.3 0 0.8 0 0 0.5 4">
  <div className="wrap">
    <div className="sec-head">
      <h2 className="sw">What happens <span className="t">next</span></h2>
    </div>
    <div className="tlw"><div className="tl-line" aria-hidden="true"><i></i></div><ol className="tl">
      <li className="tl-step"><span className="tl-dot"></span><div className="tl-body"><span className="tl-n">01</span><h3>We read your brief</h3><p>Our team reviews your goals and the services you chose.</p></div></li>
      <li className="tl-step"><span className="tl-dot"></span><div className="tl-body"><span className="tl-n">02</span><h3>We get in touch</h3><p>We contact you to understand your brand and answer your questions.</p></div></li>
      <li className="tl-step"><span className="tl-dot"></span><div className="tl-body"><span className="tl-n">03</span><h3>You receive a plan and quote</h3><p>A clear proposal with the scope, timeline and a free quote.</p></div></li>
    </ol></div>
  </div>
</section>

<section className="faq" data-fx="-3.2 0 0.8 0 0 1 6" data-anchor=".sec-orb" data-anchor-m="none">
  <div className="wrap faq-grid">
    <div className="sec-head">
      <h2 className="sw">Before you <span className="t">reach out</span></h2>
      <div className="sec-orb st" aria-hidden="true"></div>
    </div>
    {t.faq_home}
  </div>
</section>
    </>
  );
}
