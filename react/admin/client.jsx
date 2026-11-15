/* Client Hub (React): the client profile. Everything on it edits in place and saves itself. */
import { useState, useRef, useEffect } from 'react';
import { BOOT, TONE, inr, plural, useData, act, api, toast, refresh, remove, confirmBox, openDlg, go, Icon, Avatar, Chip, Loading, Empty, StatusSelect, AutoField, RemRow } from './core.jsx';
import { PayStatus } from './views.jsx';

const KIND_ICON = { note: 'note', call: 'phone', meeting: 'users', email: 'mail', whatsapp: 'wa', system: 'spark', project: 'layers', payment: 'wallet', reminder: 'bell', lead: 'spark' };
const TABS = [['overview', 'Overview'], ['projects', 'Projects'], ['reminders', 'Reminders'], ['payments', 'Payments'], ['activity', 'History']];

/* one detail row: click to edit, Enter or leaving the field saves, Esc cancels */
function Row({ c, field, label, icon, type = 'text', link, editing, setEditing }) {
  const on = editing === field, val = c[field], ref = useRef(null);
  useEffect(() => { if (on && ref.current) { ref.current.focus(); ref.current.select && ref.current.select(); } }, [on]);
  const save = async v => {
    setEditing('');
    if (String(v).trim() === String(val ?? '')) return;
    await act('client.update', { id: c.id, field, value: String(v).trim() }, 'Saved');
  };
  const show = field === 'budget' ? (+val ? inr(val) + ' a month' : '') : val;
  return (
    <div className={'row' + (on ? ' editing' : '')} id={'row-' + field} role="button" tabIndex={0} onClick={() => !on && setEditing(field)} onKeyDown={e => { if (!on && (e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); setEditing(field); } }}>
      <span className="r-i"><Icon k={icon} /></span>
      <span className="r-v"><small>{label}</small><span className="val">
        {on ? (type === 'select'
          ? <select ref={ref} className="inl" defaultValue={val} aria-label={label} onChange={e => save(e.target.value)} onBlur={() => setEditing('')}><option value="">Not set</option>{BOOT.industries.map(o => <option key={o}>{o}</option>)}</select>
          : <input ref={ref} className="inl" defaultValue={val || ''} aria-label={label} type={type === 'number' ? 'number' : type === 'url' ? 'text' : type} min={type === 'number' ? 0 : undefined}
              onKeyDown={e => { if (e.key === 'Enter') save(e.target.value); if (e.key === 'Escape') setEditing(''); }} onBlur={e => save(e.target.value)} />)
          : show || <em className="ph">Add {label.toLowerCase()}</em>}</span></span>
      <span className="r-act">{link && !on ? <a className="icon-btn" href={link} target={/^https?:/.test(link) ? '_blank' : undefined} rel="noopener" aria-label={`Open ${label.toLowerCase()}`} onClick={e => e.stopPropagation()}><Icon k="arrow" /></a> : null}<span className="icon-btn" aria-hidden="true"><Icon k="edit" /></span></span>
    </div>
  );
}

export default function Client({ id, tab }) {
  const { data, error } = useData('client', { id });
  const [editing, setEditing] = useState(''), [kind, setKind] = useState('note'), [aboutState, setAbout] = useState('');
  if (!data) return error ? <><a className="back" href="#/clients"><Icon k="chev" cls="i flip" />All clients</a><Loading error={error} /></> : <Loading />;
  const { c, projects, rems, pays, acts } = data;
  const cur = TABS.some(t => t[0] === tab) ? tab : 'overview';
  const openP = projects.filter(p => p.status !== 'done'), openR = rems.filter(r => !r.done), doneR = rems.filter(r => r.done);
  const billed = pays.reduce((a, p) => a + p.amount, 0), paid = pays.reduce((a, p) => a + (p.status === 'paid' ? p.amount : 0), 0), due = billed - paid;
  const nextDl = openP.find(p => p.due_date), nextRem = openR[0];
  const up = (field, value, msg) => act('client.update', { id: c.id, field, value }, msg);
  const email = preset => openDlg('email', { client: c, projects, pays, ...preset });
  const focusRow = f => { go(`client/${c.id}/overview`); setTimeout(() => { const el = document.getElementById('row-' + f); el && el.scrollIntoView({ behavior: 'smooth', block: 'center' }); setEditing(f); }, 60); };
  const G = ({ href, icon, label, field, onClick }) => href ? <a className="gact" href={href} target={/^https?:/.test(href) ? '_blank' : undefined} rel="noopener"><span><Icon k={icon} /></span>{label}</a>
    : <button className={'gact' + (field ? ' off' : '')} type="button" onClick={onClick || (() => focusRow(field))}><span><Icon k={icon} /></span>{field ? 'Add ' + label.toLowerCase() : label}</button>;
  const rowsDef = [['contact_person', 'Contact person', 'user'], ['designation', 'Designation', 'briefcase'], ['phone', 'Phone', 'phone', 'tel', c.phone && 'tel:' + c.phone], ['whatsapp', 'WhatsApp', 'wa', 'tel', c.wa_url],
    ['email', 'Email', 'mail', 'email', c.email && 'mailto:' + c.email], ['website', 'Website', 'link', 'url', c.web_url], ['instagram', 'Instagram', 'ig', 'text', c.ig_url],
    ['address', 'Address', 'pin', 'text', c.address && 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(c.address + ' ' + c.city)], ['city', 'City', 'building'], ['industry', 'Industry', 'tag', 'select'],
    ['gst', 'GST number', 'note'], ['source', 'Lead source', 'spark'], ['budget', 'Monthly budget', 'wallet', 'number']];
  const upP = (p, field, value) => api('project.update', { id: p.id, field, value }).then(() => { refresh(); return true; }).catch(e => { toast(e.message, true); return false; });
  const addNote = async e => { e.preventDefault(); const f = e.target; if (await act('note.create', { client_id: c.id, kind, body: f.body.value })) f.reset(); };
  const quick = action => async e => { e.preventDefault(); const f = e.target; const body = Object.fromEntries(new FormData(f)); if (await act(action, { client_id: c.id, ...body })) f.reset(); };

  return (
    <>
      <a className="back" href="#/clients"><Icon k="chev" cls="i flip" />All clients</a>
      <section className="prof" style={{ '--h': c.hue }}>
        <div className="cover" aria-hidden="true"><i></i><i></i><i></i></div>
        <div className="prof-body">
          <Avatar p={c} size="xl" />
          <div className="prof-id">
            <h1><NameEdit c={c} /></h1>
            <p className="prof-sub">{[c.company !== c.name && c.company, c.industry, c.city].filter(Boolean).join(', ') || 'Add a company, industry and city below'}</p>
            <div className="prof-chips"><StatusSelect value={c.status} options={BOOT.client_status} label="Client status" onChange={v => up('status', v, 'Status updated')} /><Chip>Client since {c.since}</Chip>{c.source ? <Chip tone="calm">{c.source}</Chip> : null}</div>
          </div>
          <div className="prof-tools"><button className={'icon-btn star-btn' + (c.starred ? ' on' : '')} type="button" aria-pressed={!!c.starred} aria-label="Pin to the top of the client list" onClick={() => up('starred', c.starred ? 0 : 1, c.starred ? 'Unpinned' : 'Pinned to the top of your clients')}><Icon k="star" /></button></div>
        </div>
        <div className="gacts">
          <G href={c.phone && 'tel:' + c.phone} icon="phone" label="Call" field={!c.phone && 'phone'} />
          <G href={c.wa_url} icon="wa" label="WhatsApp" field={!c.wa_url && 'whatsapp'} />
          <G href={c.email && 'mailto:' + c.email} icon="mail" label="Email" field={!c.email && 'email'} />
          <G href={c.web_url} icon="globe" label="Website" field={!c.web_url && 'website'} />
          <G href={c.ig_url} icon="ig" label="Instagram" field={!c.ig_url && 'instagram'} />
          <G icon="bell" label="Reminder" onClick={() => openDlg('reminder', { client_id: c.id })} />
          <G icon="layers" label="Project" onClick={() => openDlg('project', { client_id: c.id })} />
          <G icon="note" label="Note" onClick={() => { go(`client/${c.id}/activity`); setTimeout(() => { const n = document.getElementById('note-body'); n && n.focus(); }, 80); }} />
          <G icon="send" label="Send email" onClick={() => email({})} />
        </div>
        <nav className="ptabs" aria-label="Client sections">{TABS.map(([k, l]) => { const n = { projects: openP.length, reminders: openR.length, payments: pays.filter(p => p.status === 'pending').length }[k]; return (
          <a href={`#/client/${c.id}/${k}`} className={cur === k ? 'on' : ''} aria-current={cur === k ? 'page' : undefined} key={k}>{l}{n ? <b className={k === 'payments' ? 'warn' : ''}>{n}</b> : null}</a>); })}</nav>
      </section>

      {cur === 'overview' && <div className="tabp on ov">
        <div className="ov-l">
          <section className="panel"><header className="ph"><h2><Icon k="user" />Details</h2><span className="hint">Select any line to edit it</span></header>
            <div className="rows">{rowsDef.map(([f, l, i, t, link]) => <Row key={f} c={c} field={f} label={l} icon={i} type={t} link={link} editing={editing} setEditing={setEditing} />)}</div></section>
          <section className="panel"><header className="ph"><h2><Icon k="layers" />Services we provide</h2></header>
            <div className="svc-tog">{BOOT.services.map(s => { const on = c.services_list.includes(s); return <button type="button" className={'tog' + (on ? ' on' : '')} aria-pressed={on} key={s}
              onClick={() => up('services', on ? c.services_list.filter(x => x !== s) : [...c.services_list, s], '')}><Icon k="check" cls="i sm" />{s}</button>; })}</div></section>
          <section className="panel"><header className="ph"><h2><Icon k="note" />About this client</h2><span className="hint" aria-live="polite">{aboutState}</span></header>
            <AutoField as="textarea" className="about" rows={5} value={c.about} delay={900} onState={setAbout} aria-label="About this client" placeholder="Brand voice, preferences, important dates, login notes: anything the team should know."
              save={v => api('client.update', { id: c.id, field: 'about', value: v }).then(() => true).catch(e => { toast(e.message, true); return false; })} /></section>
        </div>
        <div className="ov-r">
          <section className="panel"><header className="ph"><h2><Icon k="trend" />At a glance</h2></header>
            <div className="glance"><div className="g"><small>Open projects</small><b>{openP.length}</b></div><div className="g"><small>Open reminders</small><b>{openR.length}</b></div><div className="g"><small>Total billed</small><b>{inr(billed)}</b></div><div className={'g' + (due ? ' warn' : '')}><small>To collect</small><b>{inr(due)}</b></div></div></section>
          <section className="panel"><header className="ph"><h2><Icon k="flag" />Next up</h2></header>
            {nextDl ? <a className="nu" href={`#/client/${c.id}/projects`}><span className={'nu-i t-' + nextDl.tone}><Icon k="flag" /></span><span><small>Next deadline, {nextDl.rel.toLowerCase()}</small><b>{nextDl.title}</b></span></a> : null}
            {nextRem ? <a className="nu" href={`#/client/${c.id}/reminders`}><span className={'nu-i t-' + nextRem.tone}><Icon k="bell" /></span><span><small>Next reminder, {nextRem.rel.toLowerCase()}</small><b>{nextRem.title}</b></span></a> : null}
            {!nextDl && !nextRem && <Empty icon="check">Nothing scheduled. Add a reminder or a project deadline.</Empty>}</section>
          <section className="panel"><header className="ph"><h2><Icon k="wallet" />Payments</h2></header>
            <div className="ring" style={{ '--p': billed ? Math.round(paid / billed * 100) : 0 }}><span><b>{billed ? Math.round(paid / billed * 100) : 0}%</b><small>paid</small></span></div>
            <dl className="mrow"><div><dt>Received</dt><dd>{inr(paid)}</dd></div><div><dt>Pending</dt><dd>{inr(due)}</dd></div></dl></section>
          <section className="panel"><header className="ph"><h2><Icon k="shield" />Manage</h2></header><div className="danger">
            {c.status === 'archived' ? <button className="btn ghost" type="button" onClick={() => up('status', 'active', 'Client restored')}>Restore this client</button>
              : <button className="btn ghost" type="button" onClick={async () => { if (await confirmBox('Archive this client? They move out of your active list, and everything stays saved.', 'Archive')) up('status', 'archived', 'Client archived'); }}>Archive this client</button>}
            {BOOT.user.owner && <button className="btn danger-t" type="button" onClick={async () => { if (await confirmBox(`Delete ${c.name} with all projects, reminders, payments and history? This cannot be undone.`)) { if (await act('client.delete', { id: c.id })) go('clients'); } }}><Icon k="trash" />Delete this client</button>}
          </div></section>
        </div>
      </div>}

      {cur === 'projects' && <div className="tabp on">
        <div className="tab-h"><h2>Projects</h2><button className="btn pri" type="button" onClick={() => openDlg('project', { client_id: c.id })}><Icon k="plus" />New project</button></div>
        {!projects.length ? <Empty big icon="layers" title="No projects for this client yet">Add the first project with its deadline to start tracking progress.</Empty> :
          <div className="pgrid">{projects.map(p => (
            <article className={'pcard st-' + p.status} key={p.id + p.status}>
              <header><AutoField className="pc-title" value={p.title} aria-label="Project name" save={v => upP(p, 'title', v)} />
                <StatusSelect value={p.status} options={BOOT.project_status} label="Project status" onChange={v => act('project.update', { id: p.id, field: 'status', value: v }, 'Status updated')} /></header>
              <div className="pc-prog"><AutoField type="range" min="0" max="100" step="5" value={p.progress} aria-label="Progress" style={{ '--v': p.progress + '%' }} save={v => upP(p, 'progress', v)} /><output>{p.progress}%</output></div>
              <div className="pc-grid">
                <label>Service<AutoField as="select" value={p.service} save={v => upP(p, 'service', v)}><option value="">Not set</option>{BOOT.services.map(s => <option key={s}>{s}</option>)}</AutoField></label>
                <label>Project value (₹)<AutoField type="number" min="0" value={p.value || ''} save={v => upP(p, 'value', v)} /></label>
                <label>Start date<AutoField type="date" value={p.start_date} save={v => upP(p, 'start_date', v)} /></label>
                <label>Deadline <span className={'due-chip t-' + p.tone}>{p.rel}</span><AutoField type="date" value={p.due_date} save={v => upP(p, 'due_date', v)} /></label>
              </div>
              <AutoField as="textarea" rows={2} value={p.details} delay={900} aria-label="Scope and notes" placeholder="Scope, deliverables and notes" save={v => api('project.update', { id: p.id, field: 'details', value: v }).then(() => true).catch(e => { toast(e.message, true); return false; })} />
              <footer><small>Updated {p.updated}</small><span className="pc-act">
                <button className="icon-btn" type="button" title="Email the client about this project" aria-label="Email the client about this project" onClick={() => email({ template: p.status === 'done' ? 'project-delivered' : 'project-confirmed', project_id: p.id })}><Icon k="send" /></button>
                <button className="icon-btn" type="button" title="Delete project" aria-label="Delete project" onClick={() => remove('project.delete', p.id, `Delete the project "${p.title}"?`)}><Icon k="trash" /></button></span></footer>
            </article>))}</div>}
      </div>}

      {cur === 'reminders' && <div className="tabp on">
        <div className="tab-h"><h2>Reminders</h2></div>
        <form className="quick-add" onSubmit={quick('reminder.create')}>
          <input className="qa-main" name="title" required maxLength={160} placeholder="What needs to happen? For example: send the monthly report" aria-label="Reminder" />
          <input name="date" type="date" required defaultValue={BOOT.today} aria-label="Date" /><input name="time" type="time" defaultValue="10:00" aria-label="Time" />
          <select name="priority" defaultValue="normal" aria-label="Priority">{Object.entries(BOOT.priority).map(([k, v]) => <option value={k} key={k}>{v}</option>)}</select>
          <button className="btn pri" type="submit"><Icon k="plus" />Add</button></form>
        {openR.length ? <div className="panel"><ul className="rem-list">{openR.map(r => <RemRow r={r} showClient={false} key={r.id} />)}</ul></div> : <Empty icon="bell">No open reminders for this client.</Empty>}
        {doneR.length > 0 && <details className="panel done-box"><summary><Icon k="check" />Completed ({doneR.length})</summary><ul className="rem-list">{doneR.map(r => <RemRow r={r} showClient={false} key={r.id} />)}</ul></details>}
      </div>}

      {cur === 'payments' && <div className="tabp on" id="tab-payments">
        <div className="tab-h"><h2>Payments</h2><div className="mini-tot"><span>Billed<b>{inr(billed)}</b></span><span>Received<b>{inr(paid)}</b></span><span>Pending<b className={due ? 't-warn' : ''}>{inr(due)}</b></span></div></div>
        <form className="quick-add" onSubmit={quick('payment.create')}>
          <input className="qa-main" name="label" required maxLength={140} placeholder="Description, for example: 50% advance for the website" aria-label="Description" />
          <input name="amount" type="number" min="1" required placeholder="Amount (₹)" aria-label="Amount in rupees" /><input name="due_date" type="date" aria-label="Due date" />
          <select name="status" defaultValue="pending" aria-label="Status">{Object.entries(BOOT.pay_status).map(([k, v]) => <option value={k} key={k}>{v}</option>)}</select>
          <button className="btn pri" type="submit"><Icon k="plus" />Add</button></form>
        {pays.length ? <div className="panel table-w"><table className="tbl"><thead><tr><th>Description</th><th className="num">Amount</th><th>Due</th><th>Status</th><th><span className="sr">Actions</span></th></tr></thead>
          <tbody>{pays.map(p => <tr className={p.status === 'paid' ? 'paid' : ''} key={p.id}><td>{p.label}{p.paid_date ? <small>Received {p.paid_text}</small> : null}</td><td className="num"><b>{inr(p.amount)}</b></td>
            <td><span className={'t-' + (p.status === 'paid' ? 'mute' : p.tone)}>{p.due_date ? (p.status === 'paid' ? p.due_text : p.rel) : 'No date'}</span></td><td><PayStatus p={p} /></td>
            <td className="act"><button className="icon-btn" type="button" title="Email the client about this payment" aria-label="Email the client about this payment" onClick={() => email({ template: p.status === 'paid' ? 'payment-received' : p.late ? 'payment-reminder' : 'payment-request', payment_id: p.id })}><Icon k="send" /></button>
              <button className="icon-btn" type="button" title="Delete payment" aria-label="Delete payment" onClick={() => remove('payment.delete', p.id, 'Delete this payment?')}><Icon k="trash" /></button></td></tr>)}</tbody></table></div>
          : <Empty icon="wallet">No payments yet. Add an invoice, advance or retainer above.</Empty>}
      </div>}

      {cur === 'activity' && <div className="tabp on">
        <div className="tab-h"><h2>History</h2><button className="btn ghost sm" type="button" onClick={() => email({})}><Icon k="send" />Send email</button></div>
        <form className="log" onSubmit={addNote}>
          <div className="log-kinds" role="radiogroup" aria-label="Type of entry">{Object.entries(BOOT.log_kinds).map(([k, v]) => <label key={k}><input type="radio" name="kind" checked={kind === k} onChange={() => setKind(k)} /><span><Icon k={KIND_ICON[k]} cls="i sm" />{v}</span></label>)}</div>
          <textarea id="note-body" name="body" rows={3} required maxLength={4000} placeholder="What was discussed or decided?" aria-label="Note"></textarea>
          <div className="log-f"><small>Saved to this client's history with your name and the time.</small><button className="btn pri" type="submit"><Icon k="check" />Save to history</button></div></form>
        {acts.length ? <ol className="timeline">{acts.map(a => <li className={'k-' + a.kind} key={a.id}><span className="tl-i"><Icon k={KIND_ICON[a.kind] || 'spark'} cls="i sm" /></span>
          <div className="tl-b"><div className="tl-h"><b>{BOOT.log_kinds[a.kind] || { system: 'Update', project: 'Project', payment: 'Payment', reminder: 'Reminder', lead: 'Website enquiry' }[a.kind] || 'Update'}</b><small title={a.when}>{a.ago}{a.who ? ', ' + a.who : ''}</small>
            {BOOT.log_kinds[a.kind] && <button className="icon-btn" type="button" aria-label="Delete this entry" onClick={() => remove('note.delete', a.id, 'Delete this entry from the history?')}><Icon k="trash" cls="i sm" /></button>}</div><p>{a.body}</p></div></li>)}</ol>
          : <Empty icon="clock">No history yet. Log your first call, meeting or note above.</Empty>}
      </div>}
    </>
  );
}

function NameEdit({ c }) {
  const [on, setOn] = useState(false);
  if (!on) return <>{c.name}<button className="icon-btn edit" type="button" aria-label="Edit name" onClick={() => setOn(true)}><Icon k="edit" /></button></>;
  const save = async v => { setOn(false); if (v.trim() && v.trim() !== c.name) await act('client.update', { id: c.id, field: 'name', value: v.trim() }, 'Saved'); };
  return <input className="inl" autoFocus defaultValue={c.name} aria-label="Client name" maxLength={120} onBlur={e => save(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') save(e.target.value); if (e.key === 'Escape') setOn(false); }} />;
}
