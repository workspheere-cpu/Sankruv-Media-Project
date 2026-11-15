/* Client Hub (React): app shell, navigation, dialogs and search. Entry point for assets/hubapp.js. */
import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BOOT, useRoute, useStore, go, load, api, act, toast, refresh, dialog, openDlg, closeDlg, opts, Icon, Modal, Toasts, ConfirmHost } from './core.jsx';
import { Dashboard, Clients, Projects, Reminders, Payments, Emails } from './views.jsx';
import Client from './client.jsx';

const NAV = [['dash', '', 'Dashboard', 'grid'], ['clients', 'clients', 'Clients', 'users'], ['projects', 'projects', 'Projects', 'layers'], ['reminders', 'reminders', 'Reminders', 'bell'], ['payments', 'payments', 'Payments', 'wallet'], ['emails', 'emails', 'Client emails', 'mail']];
const VIEWS = { dash: Dashboard, clients: Clients, projects: Projects, reminders: Reminders, payments: Payments, emails: Emails };
const NEW = [['client', 'user', 'Client'], ['project', 'layers', 'Project'], ['reminder', 'bell', 'Reminder'], ['payment', 'wallet', 'Payment']];

function Logout({ children, className }) {
  return <form method="post" action="logout.php" className={className}><input type="hidden" name="_csrf" value={BOOT.csrf} />{children}</form>;
}
function Menu({ button, children, up }) {
  const [open, setOpen] = useState(false), ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const off = e => { if (!ref.current.contains(e.target) || e.target.closest('a,button:not([data-menu-btn])')) setOpen(false); };
    const key = e => { if (e.key === 'Escape') setOpen(false); };
    setTimeout(() => document.addEventListener('click', off)); document.addEventListener('keydown', key);
    return () => { document.removeEventListener('click', off); document.removeEventListener('keydown', key); };
  }, [open]);
  return <div className="menu-host" ref={ref}>{button({ 'data-menu-btn': true, 'aria-expanded': open, onClick: () => setOpen(o => !o) })}{open && <div className={'menu' + (up ? ' up' : '')}>{children}</div>}</div>;
}
const NewItems = () => NEW.map(([w, i, l]) => <button type="button" key={w} onClick={() => openDlg(w)}><Icon k={i} />{l}</button>);

function Shell() {
  const r = useRoute(), o = useStore(opts), u = BOOT.user;
  const active = r.name === 'client' ? 'clients' : r.name;
  const View = VIEWS[r.name];
  useEffect(() => { document.body.className = 'app js pg-' + active; window.scrollTo(0, 0); }, [active, r.id]);
  useEffect(() => { document.title = ({ dash: 'Dashboard', client: 'Client' }[r.name] || (NAV.find(n => n[0] === r.name) || [0, 0, 'Client Hub'])[2]) + ' | ' + BOOT.app; }, [r.name]);
  useEffect(() => {
    const key = e => { const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName); if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !typing)) { e.preventDefault(); openDlg('search'); } };
    document.addEventListener('keydown', key); return () => document.removeEventListener('keydown', key);
  }, []);
  const badge = k => (k === 'clients' ? o.badges.leads : k === 'reminders' ? o.badges.due : 0);
  return (
    <>
      <aside className="side">
        <a className="brand" href="#/"><img src="assets/icons/icon-192.png" alt="" width="192" height="192" /><span><b>{BOOT.app}</b><small>{BOOT.brand}</small></span></a>
        <button className="new-btn" type="button" onClick={() => openDlg('client')}><Icon k="plus" />New client</button>
        <nav className="side-nav" aria-label="Sections">
          {NAV.map(([k, path, label, icon]) => <a href={'#/' + path} className={active === k ? 'on' : ''} aria-current={active === k ? 'page' : undefined} key={k}><Icon k={icon} />{label}{badge(k) ? <b className="badge">{badge(k)}</b> : null}</a>)}
          {u.owner && <a href="team.php"><Icon k="shield" />Team</a>}
        </nav>
        <div className="side-foot">
          <a className="side-link" href={BOOT.site_url} target="_blank" rel="noopener"><Icon k="globe" />View website</a>
          <div className="me"><span className="av sm" style={{ '--h': u.hue }}>{u.init}</span><span className="me-t"><b>{u.name}</b><small>{u.owner ? 'Owner' : 'Team member'}</small></span>
            <Logout><button className="icon-btn" type="submit" aria-label="Sign out" title="Sign out"><Icon k="logout" /></button></Logout></div>
        </div>
      </aside>
      <div className="main">
        <header className="top">
          <div className="top-l">
            <button className="search" type="button" aria-label="Search clients and projects" onClick={() => openDlg('search')}><Icon k="search" /><span>Search clients, projects, phone numbers</span><kbd>Ctrl K</kbd></button>
            {BOOT.test_mode && <span className="test-chip" title="Short passwords are allowed while testing. Switch test_mode off in config.php before adding real client data.">Test mode</span>}
          </div>
          <a className="top-logo" href="#/" aria-label={`${BOOT.brand} Client Hub, dashboard`}><img className="lg-ink" src="assets/icons/logo-ink.png" alt="" width="525" height="256" /><img className="lg-white" src="../assets/img/logo.png" alt="" width="525" height="256" /></a>
          <div className="top-r">
            <div className="quick"><Menu button={p => <button className="btn pri" type="button" {...p}><Icon k="plus" />New<Icon k="down" cls="i sm" /></button>}><NewItems /></Menu></div>
            <span className="top-date"><Icon k="cal" />{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
            <div className="me-m"><Menu button={p => <button className="me-btn" type="button" aria-label="Account" {...p}><span className="av sm" style={{ '--h': u.hue }}>{u.init}</span></button>}>
              <p className="menu-h"><b>{u.name}</b><small>{u.username}, {u.owner ? 'Owner' : 'Team member'}</small></p>
              <a href="team.php"><Icon k="lock" />{u.owner ? 'Team and password' : 'Change password'}</a>
              <a href="#/payments"><Icon k="wallet" />Payments</a><a href="#/emails"><Icon k="mail" />Client emails</a>
              <a href={BOOT.site_url} target="_blank" rel="noopener"><Icon k="globe" />View website</a>
              <Logout><button type="submit"><Icon k="logout" />Sign out</button></Logout></Menu></div>
          </div>
        </header>
        <main className="content" key={r.name + r.id}>
          {r.name === 'client' ? <Client id={r.id} tab={r.tab} /> : View ? <View /> : <div className="empty big"><h2>Page not found</h2><a className="btn pri" href="#/">Back to the dashboard</a></div>}
        </main>
      </div>
      <nav className="tabs-m" aria-label="App navigation">
        <a href="#/" className={active === 'dash' ? 'on' : ''}><Icon k="grid" />Home</a><a href="#/clients" className={active === 'clients' ? 'on' : ''}><Icon k="users" />Clients</a>
        <Menu up button={p => <button className="fab" type="button" aria-label="Add something new" {...p}><Icon k="plus" /></button>}><NewItems /></Menu>
        <a href="#/reminders" className={active === 'reminders' ? 'on' : ''}><Icon k="bell" />Reminders{o.badges.due ? <i className="tm-dot"></i> : null}</a><a href="#/projects" className={active === 'projects' ? 'on' : ''}><Icon k="layers" />Projects</a>
      </nav>
      <Dialogs /><ConfirmHost /><Toasts />
    </>
  );
}

/* ---------- dialogs ---------- */
const F = ({ label, full, children }) => <label className={'fld' + (full ? ' full' : '')}>{label}{children}</label>;
const ClientPick = ({ value }) => { const list = useStore(opts).clients; return <select name="client_id" required defaultValue={value || ''}><option value="" disabled>Choose a client</option>{list.map(c => <option value={c.id} key={c.id}>{c.name}</option>)}</select>; };
const Opt = ({ map }) => Object.entries(map).map(([k, v]) => <option value={k} key={k}>{v}</option>);

function FormDlg({ icon, title, hint, action, submit, onDone, children, extra }) {
  const [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  const send = async e => {
    e.preventDefault(); const f = e.target; if (!f.reportValidity()) return;
    const body = { ...extra }; new FormData(f).forEach((v, k) => { if (k.endsWith('[]')) (body[k.slice(0, -2)] = body[k.slice(0, -2)] || []).push(v); else body[k] = v; });
    setBusy(true); setErr('');
    try { const r = await api(action, body); toast(r.message); closeDlg(); refresh(); onDone && onDone(r); } catch (x) { setErr(x.message); setBusy(false); }
  };
  return (
    <Modal onClose={closeDlg} label={title}><form className="dlg-f" onSubmit={send} noValidate={false}>
      <header><span className="dlg-i"><Icon k={icon} /></span><div><h2>{title}</h2><p>{hint}</p></div><button type="button" className="icon-btn" aria-label="Close" onClick={closeDlg}><Icon k="x" /></button></header>
      {children}
      <p className="dlg-err" role="alert">{err}</p>
      <footer><button className="btn ghost" type="button" onClick={closeDlg}>Cancel</button>{submit !== null && <button className="btn pri" type="submit" disabled={busy}><Icon k="check" />{submit}</button>}</footer>
    </form></Modal>
  );
}
function EmailDlg({ p }) {
  const [tpl, setTpl] = useState(p.template || BOOT.templates[0].slug), [proj, setProj] = useState(p.project_id || ''), [pay, setPay] = useState(p.payment_id || ''), [note, setNote] = useState('');
  const t = BOOT.templates.find(x => x.slug === tpl) || {};
  const prev = 'emails.php?' + new URLSearchParams({ preview: tpl, client: p.client.id, project: proj, payment: pay, note });
  return (
    <FormDlg icon="send" title="Send an email" hint={`Pick a ready-made email, check the preview, then send it to ${p.client.name}.`} action="email.send" submit={BOOT.mail_on ? 'Send email' : null} extra={{ client_id: p.client.id }}>
      <div className="grid2">
        <F label="Email" full><select name="template" value={tpl} onChange={e => setTpl(e.target.value)}>{BOOT.templates.map(x => <option value={x.slug} key={x.slug}>{x.title}</option>)}</select></F>
        <F label="Send to" full><input name="to" type="email" maxLength={120} defaultValue={p.client.email} placeholder="client@example.com" /></F>
        <F label="Project"><select name="project_id" value={proj} onChange={e => setProj(e.target.value)}><option value="">No project</option>{p.projects.map(x => <option value={x.id} key={x.id}>{x.title}</option>)}</select></F>
        <F label="Payment"><select name="payment_id" value={pay} onChange={e => setPay(e.target.value)}><option value="">No payment</option>{p.pays.map(x => <option value={x.id} key={x.id}>{x.label}, ₹{x.amount.toLocaleString('en-IN')}{x.status === 'paid' ? ', paid' : ''}</option>)}</select></F>
        <F label="Personal note (optional)" full><textarea name="note" rows={3} maxLength={1000} value={note} onChange={e => setNote(e.target.value)} placeholder="Shown in its own box. For a meeting, write the date, time and place or link here."></textarea></F>
      </div>
      <p className="em-about">{t.about}</p>
      {!BOOT.mail_on && <p className="em-off"><Icon k="lock" /><span>Email sending is not switched on yet. You can preview every email now. Your developer turns sending on in <b>config.php</b>.</span></p>}
      <a className="btn ghost em-prev" href={prev} target="_blank" rel="noopener"><Icon k="eye" />Preview this email</a>
    </FormDlg>
  );
}
function Search() {
  const [q, setQ] = useState(''), [items, setItems] = useState(null), [i, setI] = useState(0), seq = useRef(0);
  useEffect(() => {
    const term = q.trim(); if (!term) { setItems(null); return; }
    const mine = ++seq.current, t = setTimeout(() => fetch('api.php?action=search&q=' + encodeURIComponent(term), { credentials: 'same-origin' }).then(r => r.json()).then(r => { if (mine === seq.current) { setItems(r.results || []); setI(0); } }).catch(() => setItems([])), 140);
    return () => clearTimeout(t);
  }, [q]);
  const open = it => { const m = /id=(\d+)(?:#(\w+))?/.exec(it.url); closeDlg(); if (m) go(`client/${m[1]}${m[2] ? '/' + m[2] : ''}`); };
  const key = e => { if (!items || !items.length) return; if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); setI(n => (n + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length); } if (e.key === 'Enter') { e.preventDefault(); open(items[i]); } };
  return (
    <Modal className="dlg pal" onClose={closeDlg} label="Search">
      <div className="pal-in"><Icon k="search" /><input autoFocus type="search" value={q} onChange={e => setQ(e.target.value)} onKeyDown={key} placeholder="Search clients, projects, phone numbers" aria-label="Search" /><kbd>Esc</kbd></div>
      <div className="pal-res" role="listbox">{!items ? <p className="pal-hint">Start typing to find a client or project.</p> : !items.length ? <p className="pal-hint">No match. Try a name, phone number or email.</p>
        : items.map((it, n) => <a className={'pal-item' + (n === i ? ' on' : '')} role="option" aria-selected={n === i} href="#/" key={it.url + it.title} onClick={e => { e.preventDefault(); open(it); }}>
          {it.type === 'Client' ? <span className="av sm" style={{ '--h': it.hue }}>{it.init}</span> : <span className="pal-pi"><Icon k="layers" /></span>}<span><b>{it.title}</b><small>{it.sub}</small></span><span className="pal-type">{it.type}</span></a>)}</div>
    </Modal>
  );
}
function Dialogs() {
  const d = useStore(dialog);
  if (!d) return null;
  const p = d.preset;
  if (d.name === 'search') return <Search />;
  if (d.name === 'email') return <EmailDlg p={p} />;
  if (d.name === 'client') return (
    <FormDlg icon="user" title="New client" hint="Start with the basics. You can add everything else on the profile." action="client.create" submit="Add client" onDone={r => go('client/' + r.id)}>
      <div className="grid2">
        <F label="Client or brand name" full><input name="name" required maxLength={120} autoFocus /></F>
        <F label="Company"><input name="company" maxLength={120} /></F>
        <F label="Industry"><select name="industry" defaultValue=""><option value="">Not set</option>{BOOT.industries.map(x => <option key={x}>{x}</option>)}</select></F>
        <F label="Phone or WhatsApp"><input name="phone" type="tel" maxLength={30} /></F>
        <F label="Email"><input name="email" type="email" maxLength={120} /></F>
        <F label="Status"><select name="status" defaultValue="active"><Opt map={BOOT.client_status} /></select></F>
        <F label="Source"><input name="source" maxLength={60} placeholder="Referral, Instagram, website" /></F>
        <fieldset className="fld full"><legend>Services</legend><div className="ticks">{BOOT.services.map(s => <label className="tick" key={s}><input type="checkbox" name="services[]" value={s} /><span>{s}</span></label>)}</div></fieldset>
      </div></FormDlg>);
  if (d.name === 'project') return (
    <FormDlg icon="layers" title="New project" hint="Set a deadline so it shows on your dashboard." action="project.create" submit="Create project">
      <div className="grid2">
        <F label="Client" full><ClientPick value={p.client_id} /></F>
        <F label="Project name" full><input name="title" required maxLength={140} placeholder="For example: Diwali reels campaign" /></F>
        <F label="Service"><select name="service" defaultValue=""><option value="">Not set</option>{BOOT.services.map(x => <option key={x}>{x}</option>)}</select></F>
        <F label="Status"><select name="status" defaultValue="planned"><Opt map={BOOT.project_status} /></select></F>
        <F label="Start date"><input name="start_date" type="date" defaultValue={BOOT.today} /></F>
        <F label="Deadline"><input name="due_date" type="date" /></F>
        <F label="Project value (₹)"><input name="value" type="number" min="0" inputMode="numeric" /></F>
        <F label="Scope and notes" full><textarea name="details" rows={3} maxLength={4000}></textarea></F>
      </div></FormDlg>);
  if (d.name === 'reminder') return (
    <FormDlg icon="bell" title="New reminder" hint="It appears on your dashboard on the day it is due." action="reminder.create" submit="Save reminder">
      <div className="grid2">
        <F label="What needs to happen?" full><input name="title" required maxLength={160} autoFocus placeholder="For example: follow up on the proposal" /></F>
        <F label="Date"><input name="date" type="date" required defaultValue={BOOT.today} /></F>
        <F label="Time"><input name="time" type="time" defaultValue="10:00" /></F>
        <F label="Client (optional)"><ClientOptional value={p.client_id} /></F>
        <F label="Priority"><select name="priority" defaultValue="normal"><Opt map={BOOT.priority} /></select></F>
      </div></FormDlg>);
  if (d.name === 'payment') return (
    <FormDlg icon="wallet" title="New payment" hint="Track an invoice, advance or monthly retainer." action="payment.create" submit="Save payment">
      <div className="grid2">
        <F label="Client" full><ClientPick value={p.client_id} /></F>
        <F label="Description" full><input name="label" required maxLength={140} placeholder="For example: November retainer" /></F>
        <F label="Amount (₹)"><input name="amount" type="number" min="1" required inputMode="numeric" /></F>
        <F label="Due date"><input name="due_date" type="date" /></F>
        <F label="Status"><select name="status" defaultValue="pending"><Opt map={BOOT.pay_status} /></select></F>
      </div></FormDlg>);
  return null;
}
function ClientOptional({ value }) { const list = useStore(opts).clients; return <select name="client_id" defaultValue={value || ''}><option value="">No client</option>{list.map(c => <option value={c.id} key={c.id}>{c.name}</option>)}</select>; }

/* keep the client list for dialogs and the sidebar badges fresh */
function Keeper() {
  useEffect(() => {
    let live = true; const pull = () => load('opts').then(d => live && opts.set({ clients: d.clients, badges: d.badges })).catch(() => {});
    pull(); const id = setInterval(pull, 120000);
    const onVis = () => { if (!document.hidden) pull(); }; document.addEventListener('visibilitychange', onVis);
    window.__hubPull = pull;
    return () => { live = false; clearInterval(id); document.removeEventListener('visibilitychange', onVis); };
  }, []);
  return null;
}

createRoot(document.getElementById('hub')).render(<><Keeper /><Shell /></>);
if ('serviceWorker' in navigator && location.protocol === 'https:') addEventListener('load', () => { navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {}); });
