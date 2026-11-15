/* Films and videos: a filterable 3D wall of the studio's work with an in-page player.
   Items live in content/videos.json. src: youtube | drive (one file) | folder (Drive folder) | link (opens outside). */
import { useEffect, useRef, useState, useCallback } from 'react';
import VIDEOS from '../../content/videos.json';
import { Icon, Arrow, useSite } from './ui.jsx';

const CATS = [['all', 'All films'], ['ads', 'Commercials'], ['brand', 'Fashion and brand'], ['music', 'Music videos'], ['wedding', 'Weddings'], ['corporate', 'Corporate and motion'], ['social', 'Social']];
const HUE = { ads: 186, brand: 300, music: 262, wedding: 24, corporate: 210, social: 150 };

export const thumb = v => v.src === 'youtube' ? `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg` : v.src === 'drive' ? `https://drive.google.com/thumbnail?id=${v.id}&sz=w640` : '';
export const embed = v => v.src === 'youtube' ? `https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0&playsinline=1`
  : v.src === 'drive' ? `https://drive.google.com/file/d/${v.id}/preview` : v.src === 'folder' ? `https://drive.google.com/embeddedfolderview?id=${v.id}#grid` : '';
export const outside = v => v.src === 'youtube' ? `https://youtu.be/${v.id}` : v.src === 'drive' ? `https://drive.google.com/file/d/${v.id}/view`
  : v.src === 'folder' ? `https://drive.google.com/drive/folders/${v.id}` : v.url;

function Card({ v, i, onOpen }) {
  const [noImg, setNoImg] = useState(!thumb(v));
  const ref = useRef(null);
  /* 3D tilt that follows the pointer (fine pointers only) */
  const move = e => {
    if (e.pointerType !== 'mouse') return;
    const el = ref.current, r = el.getBoundingClientRect();
    el.style.setProperty('--rx', ((0.5 - (e.clientY - r.top) / r.height) * 10).toFixed(2) + 'deg');
    el.style.setProperty('--ry', (((e.clientX - r.left) / r.width - 0.5) * 14).toFixed(2) + 'deg');
  };
  const leave = () => { ref.current.style.setProperty('--rx', '0deg'); ref.current.style.setProperty('--ry', '0deg'); };
  const body = (
    <>
      <span className="vc-media">
        {!noImg && <img src={thumb(v)} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setNoImg(true)} />}
        <span className="vc-art" aria-hidden="true"><i></i><i></i><b>{v.kind}</b></span>
        <span className="vc-play" aria-hidden="true">{v.src === 'link' ? <Icon k="ig" /> : v.src === 'folder' ? <Icon k="layers" /> : <svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z" fill="currentColor" /></svg>}</span>
        {v.src === 'folder' && <span className="vc-badge">Collection</span>}
      </span>
      <span className="vc-cap"><b>{v.title}</b><small>{v.kind}</small></span>
    </>
  );
  const common = { ref, className: 'vcard' + (noImg ? ' no-img' : '') + (v.vertical ? ' tall' : ''), style: { '--i': i % 12, '--h': HUE[v.cat] }, onPointerMove: move, onPointerLeave: leave };
  return v.src === 'link'
    ? <a {...common} href={v.url} target="_blank" rel="noopener" aria-label={`${v.title}, ${v.kind}. Opens Instagram`}>{body}</a>
    : <button {...common} type="button" onClick={() => onOpen(v)} aria-label={`Play ${v.title}, ${v.kind}`}>{body}</button>;
}

function Player({ list, v, onClose, onGo }) {
  const box = useRef(null);
  const { root } = useSite();
  const i = list.indexOf(v);
  useEffect(() => {
    const prev = document.activeElement;
    const key = e => { if (e.key === 'Escape') onClose(); if (e.key === 'ArrowRight') onGo(1); if (e.key === 'ArrowLeft') onGo(-1); };
    document.addEventListener('keydown', key);
    document.documentElement.classList.add('vp-open');
    box.current && box.current.focus();
    return () => { document.removeEventListener('keydown', key); document.documentElement.classList.remove('vp-open'); prev && prev.focus && prev.focus(); };
  }, [onClose, onGo]);
  return (
    <div className="vplayer" role="dialog" aria-modal="true" aria-label={v.title} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={'vp-box' + (v.vertical ? ' tall' : '') + (v.src === 'folder' ? ' folder' : '')} ref={box} tabIndex={-1}>
        <div className="vp-frame"><iframe key={v.id} src={embed(v)} title={v.title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" referrerPolicy="strict-origin-when-cross-origin"></iframe></div>
        <div className="vp-bar">
          <span className="vp-t"><b>{v.title}</b><small>{v.kind}, {i + 1} of {list.length}</small></span>
          <a className="btn hot sm vp-cta" href={`${root}contact.html?service=shoots`}><span>Get a film like this</span><Arrow /></a>
          <a className="vp-out" href={outside(v)} target="_blank" rel="noopener">Open{v.src === 'youtube' ? ' on YouTube' : ' in Drive'}<Arrow /></a>
          <button className="vp-nav prev" type="button" onClick={() => onGo(-1)} aria-label="Previous film"><Arrow /></button>
          <button className="vp-nav next" type="button" onClick={() => onGo(1)} aria-label="Next film"><Arrow /></button>
        </div>
        <button className="vp-x" type="button" onClick={onClose} aria-label="Close player"><Icon k="x" /></button>
      </div>
    </div>
  );
}

const slug = v => v.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
function useWall(list, deep) {
  const [open, setOpenRaw] = useState(null);
  const setOpen = useCallback(x => setOpenRaw(prev => {
    const next = typeof x === 'function' ? x(prev) : x;
    if (deep) try { history.replaceState(null, '', next ? '#film=' + slug(next) : location.pathname + location.search + '#films'); } catch (e) {}
    return next;
  }), [deep]);
  useEffect(() => {
    if (!deep) return;
    const m = /#film=([\w-]+)/.exec(location.hash), hit = m && VIDEOS.find(v => slug(v) === m[1] && v.src !== 'link');
    if (hit) setOpenRaw(hit);
  }, [deep]);
  const playable = list.filter(v => v.src !== 'link');
  const close = useCallback(() => setOpen(null), []);
  const go = useCallback(d => setOpen(cur => { const k = playable.indexOf(cur); return playable[(k + d + playable.length) % playable.length]; }), [playable.length, playable[0]]);
  const player = open && <Player list={playable} v={open} onClose={close} onGo={go} />;
  return [setOpen, player];
}

/* Full wall on the Work page */
export function VideoWall() {
  const { root } = useSite();
  const [cat, setCat] = useState('all');
  const list = cat === 'all' ? VIDEOS : VIDEOS.filter(v => v.cat === cat);
  const [open, player] = useWall(list, true);
  return (
    <section className="films" id="films" data-fx="3.6 -0.4 0.5 0 0 0.25 6">
      <div className="wrap">
        <div className="sec-head">
          <h2 className="sw">Films and <span className="t">videos</span></h2>
          <p className="lead rv">Commercials, brand shoots, music videos, weddings and reels shot and edited by our team. Select a film to watch it here.</p>
          <ul className="vfacts rv"><li><b>{VIDEOS.length}</b> films and collections</li><li><b>{CATS.length - 1}</b> kinds of production</li><li><b>1</b> in-house team, script to final edit</li></ul>
        </div>
        <div className="vfilter" role="group" aria-label="Filter films by type">
          {CATS.map(([k, label]) => <button type="button" key={k} className={k === cat ? 'on' : ''} aria-pressed={k === cat} onClick={() => setCat(k)}>{label}<small>{k === 'all' ? VIDEOS.length : VIDEOS.filter(v => v.cat === k).length}</small></button>)}
        </div>
        <div className={'vwall' + (cat === 'all' ? ' lead' : '')} key={cat}>
          {list.map((v, i) => <Card v={v} i={i} onOpen={open} key={v.title} />)}
          <a className="vcta" href={`${root}contact.html?service=shoots`} style={{ '--i': list.length % 12 }}>
            <span className="d">Your film could be next</span><span>Tell us the idea. We plan, shoot and edit it, and send a free quote.</span>
            <span className="btn hot"><span>Plan my shoot</span><Arrow /></span></a>
        </div>
      </div>
      {player}
    </section>
  );
}

/* Short showreel strip on the home page */
export function ShowReel() {
  const { root } = useSite();
  const list = VIDEOS.filter(v => v.featured);
  const [open, player] = useWall(list);
  return (
    <section className="films reel" data-fx="-3.4 0.2 0.55 0 0 0.3 6">
      <div className="wrap">
        <div className="sec-head row">
          <h2 className="sw">Watch our <span className="t">showreel</span></h2>
          <a className="link" href={`${root}projects.html#films`}>See all {VIDEOS.length} films<Arrow /></a>
        </div>
      </div>
      <div className="vstrip">{list.map((v, i) => <Card v={v} i={i} onOpen={open} key={v.title} />)}</div>
      {player}
    </section>
  );
}
export { VIDEOS };
