/* Generated from src/pages/404.html by tools/html2jsx.py, then maintained here. */
export const meta = {"title": "Page Not Found | Sankruv Media", "description": "This page could not be found on the Sankruv Media website."};

export default function PageNotFound({ t }) {
  return (
    <>
<section className="ph nf" data-fx="0 0 1 0.6 0 1 0" data-anchor=".nf-orb">
  <div className="wrap">
    <div className="nf-orb" aria-hidden="true"></div>
    <h1 className="sw">This page <span className="t">wandered off</span></h1>
    <p className="lead rv">The page you are looking for has moved or does not exist. Start again from the home page, or tell us what you were looking for.</p>
    <div className="cta rv"><a className="btn hot" href={`${t.root}index.html`}><span>Go to the home page</span>{t.arrow}</a><a className="btn ghost" href={`${t.root}contact.html`}><span>Contact us</span>{t.arrow}</a></div>
  </div>
</section>
    </>
  );
}
