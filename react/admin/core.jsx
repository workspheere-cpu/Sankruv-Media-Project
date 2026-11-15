/* Client Hub (React): shared helpers, data loading, small UI parts. */
import { useEffect, useRef, useState, useCallback, useSyncExternalStore } from 'react';
import ICONS from './icons.json';

export const BOOT = JSON.parse(document.getElementById('hub-boot').textContent);
export const TONE = { lead: 'lead', active: 'ok', on_hold: 'warn', completed: 'calm', archived: 'mute', planned: 'calm', in_progress: 'lead', review: 'warn', done: 'ok', paused: 'mute', pending: 'warn', paid: 'ok' };
export const inr = n => '₹' + Math.round(+n || 0).toLocaleString('en-IN');
export const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

/* ---------- tiny stores: data version, toasts, route ---------- */
function store(initial) {
  let v = initial; const subs = new Set();
  return { get: () => v, set: x => { v = typeof x === 'function' ? x(v) : x; subs.forEach(f => f()); }, sub: f => { subs.add(f); return () => subs.delete(f); } };
}
const version = store(0), toasts = store([]), route = store(location.hash);
addEventListener('hashchange', () => route.set(location.hash));
export const refresh = () => { version.set(n => n + 1); if (window.__hubPull) window.__hubPull(); };
export const useStore = s => useSyncExternalStore(s.sub, s.get);
export function toast(msg, bad) {
  if (!msg) return;
  const id = Date.now() + Math.random();
  toasts.set(l => [...l, { id, msg, bad }]);
  setTimeout(() => toasts.set(l => l.filter(t => t.id !== id)), bad ? 5200 : 3000);
}
export const Toasts = () => <div className="toasts" role="status" aria-live="polite">{useStore(toasts).map(t => <div className={'toast' + (t.bad ? ' bad' : '')} key={t.id}><Icon k={t.bad ? 'x' : 'check'} /><span>{t.msg}</span></div>)}</div>;

/* #/clients, #/client/12/projects ... */
export function useRoute() {
  const parts = useStore(route).replace(/^#\/?/, '').split('/').filter(Boolean);
  return { name: parts[0] || 'dash', id: +parts[1] || 0, tab: parts[2] || '' };
}
export const go = path => { location.hash = '#/' + path; };

/* ---------- server ---------- */
async function call(url, init) {
  let res, out;
  try { res = await fetch(url, { credentials: 'same-origin', ...init }); out = await res.json(); }
  catch (e) { throw new Error('No connection. Check your internet and try again.'); }
  if (res.status === 401) { location.href = 'login.php?next=app.php'; throw new Error('Please sign in again.'); }
  if (res.status === 403 && /stronger password/.test(out.error || '')) { location.href = 'team.php'; }
  if (!out.ok) throw new Error(out.error || 'Something went wrong. Try again.');
  return out;
}
export const api = (action, body = {}) => call('api.php', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF': BOOT.csrf }, body: JSON.stringify({ action, ...body }) });
export const load = (view, params = {}) => call('data.php?' + new URLSearchParams({ view, ...params }));
/* run a change, show the result, reload what is on screen */
export async function act(action, body, okMsg) {
  try { const r = await api(action, body); toast(okMsg === undefined ? r.message : okMsg); refresh(); return r; }
  catch (e) { toast(e.message, true); return null; }
}
export function useData(view, params = {}) {
  const v = useStore(version), key = view + JSON.stringify(params);
  const [state, set] = useState({ key: '', data: null, error: '' });
  useEffect(() => {
    let live = true;
    load(view, params).then(d => live && set({ key, data: d, error: '' })).catch(e => live && set(s => ({ ...s, key, error: e.message })));
    return () => { live = false; };
  }, [key, v]);
  return { data: state.key === key ? state.data : null, error: state.error };
}

/* ---------- small parts ---------- */
export const Icon = ({ k, cls = 'i' }) => <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICONS[k] || ICONS.spark }} />;
export const Avatar = ({ p, size = '' }) => <span className={'av ' + size} style={{ '--h': p.hue }}>{p.init}</span>;
export const Chip = ({ tone = 'mute', children }) => <span className={'chip t-' + tone}>{children}</span>;
export const Loading = ({ error }) => error ? <div className="empty"><span className="e-i"><Icon k="x" /></span><p><b>Could not load this.</b> {error}</p><button className="btn ghost" onClick={refresh}>Try again</button></div>
  : <div className="skel" aria-busy="true" aria-label="Loading"><i></i><i></i><i></i></div>;
export const Empty = ({ icon, title, children, action, big }) => (
  <div className={'empty' + (big ? ' big' : '')}><span className="e-i"><Icon k={icon} /></span>{big ? <h2>{title}</h2> : null}<p>{!big && title ? <b>{title} </b> : null}{children}</p>{action}</div>
);
export function Select({ value, options, onChange, label, ...rest }) {
  return <select value={value} aria-label={label} onChange={e => onChange(e.target.value)} {...rest}>{Object.entries(options).map(([k, v]) => <option value={k} key={k}>{v}</option>)}</select>;
}
export const StatusSelect = ({ value, options, onChange, label }) => (
  <label className={'chip-sel t-' + (TONE[value] || 'mute')}><span className="sr">{label}</span><Select value={value} options={options} onChange={onChange} label={label} /><Icon k="down" cls="i sm" /></label>
);

/* a field that saves itself when you leave it (or stop typing, for long text) */
export function AutoField({ as: Tag = 'input', value, save, delay = 0, onState, ...rest }) {
  const last = useRef(String(value ?? '')), timer = useRef(0);
  const commit = async el => {
    clearTimeout(timer.current);
    if (el.value === last.current) return;
    onState && onState('Saving');
    const ok = await save(el.value);
    if (ok) { last.current = el.value; el.classList.remove('saved-flash'); void el.offsetWidth; el.classList.add('saved-flash'); }
    onState && onState(ok ? 'Saved' : 'Not saved');
  };
  return <Tag defaultValue={value ?? ''} onBlur={e => commit(e.target)}
    onChange={e => { const el = e.target; if (Tag === 'select' || rest.type === 'date' || rest.type === 'range') commit(el); else if (delay) { onState && onState('Typing'); clearTimeout(timer.current); timer.current = setTimeout(() => commit(el), delay); } }} {...rest} />;
}

/* native <dialog>, opened while mounted */
export function Modal({ onClose, className = 'dlg', children, label }) {
  const ref = useRef(null);
  useEffect(() => { const d = ref.current; if (!d.open) d.showModal(); }, []);
  return <dialog ref={ref} className={className} aria-label={label} onClose={onClose} onClick={e => { if (e.target === ref.current) onClose(); }}>{children}</dialog>;
}
let askConfirm = () => Promise.resolve(false);
export const confirmBox = (msg, ok = 'Delete') => askConfirm(msg, ok);
export function ConfirmHost() {
  const [q, setQ] = useState(null);
  useEffect(() => { askConfirm = (msg, ok) => new Promise(done => setQ({ msg, ok, done })); }, []);
  if (!q) return null;
  const end = yes => { q.done(yes); setQ(null); };
  return <Modal className="dlg confirm" onClose={() => end(false)} label="Please confirm"><form method="dialog" onSubmit={e => e.preventDefault()}>
    <p className="d-msg">{q.msg}</p><footer><button className="btn ghost" type="button" onClick={() => end(false)}>Cancel</button><button className="btn danger" type="button" onClick={() => end(true)}>{q.ok}</button></footer></form></Modal>;
}
export async function remove(action, id, question) { if (await confirmBox(question)) await act(action, { id }); }

/* one reminder row, used on the dashboard, the reminders page and client profiles */
export function RemRow({ r, showClient = true }) {
  return (
    <li className={`rem${r.done ? ' done' : ''} pr-${r.priority}`}>
      <button className="tickbox" type="button" aria-pressed={!!r.done} aria-label={r.done ? 'Mark as not done' : 'Mark as done'} onClick={() => act('reminder.toggle', { id: r.id }, r.done ? 'Moved back to open' : 'Marked as done')}><Icon k="check" /></button>
      <div className="rem-main"><b>{r.title}</b>
        <small>{showClient && r.client ? <><a href={`#/client/${r.client_id}`}>{r.client}</a>, </> : null}<span className={'t-' + r.tone}>{r.rel}{r.time ? ' at ' + r.time : ''}</span>{r.priority === 'high' ? <span className="t-bad">, high priority</span> : null}</small></div>
      <div className="rem-act">
        {!r.done && <button className="icon-btn" type="button" title="Move to tomorrow" aria-label="Move to tomorrow" onClick={() => act('reminder.snooze', { id: r.id, days: 1 })}><Icon k="clock" /></button>}
        <button className="icon-btn" type="button" title="Delete" aria-label="Delete reminder" onClick={() => remove('reminder.delete', r.id, 'Delete this reminder?')}><Icon k="trash" /></button>
      </div>
    </li>
  );
}

/* the live 3D brand core shown inside the progress ring */
export function Core3D() {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current, gl = cv.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: false });
    if (!gl) return;
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fs = `precision mediump float;uniform vec2 R;uniform float T;uniform vec2 M;
const vec3 TD=vec3(.05,.17,.18);const vec3 TM=vec3(.14,.45,.46);const vec3 TL=vec3(.36,.82,.82);
float map(vec3 q){float n=sin(q.x*2.1+T*.9)*sin(q.y*2.5+T*1.1)*sin(q.z*1.9+T*.7)+.5*sin(q.x*4.3-T*1.3)*sin(q.y*3.7+T*.6);
 float d=length(q)-1.-n*.11;for(int i=0;i<3;i++){float fi=float(i);float a=T*(.6+fi*.15)+fi*2.1;d=min(d,length(q-vec3(cos(a)*1.45,sin(a*.8+fi)*.45,sin(a)*1.45))-.07-.02*fi);}return d;}
void main(){vec2 uv=(gl_FragCoord.xy*2.-R)/R.y;vec3 ro=vec3(0.,0.,3.7),rd=normalize(vec3(uv,-2.));float t=2.;float a=0.;vec3 col=vec3(0.);
 for(int i=0;i<56;i++){vec3 p=ro+rd*t;float d=map(p);if(d<.004){vec2 e=vec2(.005,0.);vec3 n=normalize(vec3(map(p+e.xyy)-map(p-e.xyy),map(p+e.yxy)-map(p-e.yxy),map(p+e.yyx)-map(p-e.yyx)));
  vec3 l=normalize(vec3(.5+M.x,.85-M.y,.6));float df=max(dot(n,l),0.);float fr=pow(1.-max(dot(n,-rd),0.),3.);vec3 r=reflect(rd,n);
  col=mix(TD,TM,df);col=mix(col,TL,pow(df,3.)*.6);col+=TL*fr*.8;col+=vec3(.75,.95,.95)*smoothstep(.55,.95,r.y)*.16;col+=pow(max(dot(reflect(-l,n),-rd),0.),50.)*.6;a=1.;break;}
  t+=d*.85;if(t>9.)break;}
 gl_FragColor=vec4(col*a,a);}`;
    const sh = (t, src) => { const o = gl.createShader(t); gl.shaderSource(o, src); gl.compileShader(o); return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : null; };
    const v = sh(gl.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'), f = sh(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return;
    const pr = gl.createProgram(); gl.attachShader(pr, v); gl.attachShader(pr, f); gl.linkProgram(pr); gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uR = gl.getUniformLocation(pr, 'R'), uT = gl.getUniformLocation(pr, 'T'), uM = gl.getUniformLocation(pr, 'M');
    let W = 0, H = 0, raf = 0, seen = true, alive = true, mx = 0, my = 0, sx = 0, sy = 0;
    const size = () => { const s = Math.min(devicePixelRatio || 1, 2); W = Math.round(cv.clientWidth * s); H = Math.round(cv.clientHeight * s); cv.width = W; cv.height = H; gl.viewport(0, 0, W, H); };
    const move = e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; };
    const draw = ms => { sx += (mx - sx) * .06; sy += (my - sy) * .06; gl.uniform2f(uR, W, H); gl.uniform1f(uT, still ? 8 : ms / 1000); gl.uniform2f(uM, sx, sy); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLES, 0, 3); };
    const loop = ms => { draw(ms); raf = alive && seen && !document.hidden ? requestAnimationFrame(loop) : 0; };
    const kick = () => { if (!raf && alive && seen && !document.hidden && !still) raf = requestAnimationFrame(loop); };
    size(); addEventListener('resize', size); addEventListener('pointermove', move, { passive: true }); document.addEventListener('visibilitychange', kick);
    const io = new IntersectionObserver(es => { seen = es[0].isIntersecting; kick(); }); io.observe(cv);
    still ? draw(0) : kick();
    return () => { alive = false; cancelAnimationFrame(raf); io.disconnect(); removeEventListener('resize', size); removeEventListener('pointermove', move); document.removeEventListener('visibilitychange', kick); };
  }, []);
  return <canvas className="mh-core" ref={ref} aria-hidden="true"></canvas>;
}

/* which dialog is open: { name: 'client' | 'project' | 'reminder' | 'payment' | 'email' | 'search', preset } */
export const dialog = store(null);
export const openDlg = (name, preset = {}) => dialog.set({ name, preset });
export const closeDlg = () => dialog.set(null);
export const opts = store({ clients: [], badges: { leads: 0, due: 0 } });
