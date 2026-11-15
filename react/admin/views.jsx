/* Client Hub (React): dashboard, clients, projects board, reminders, payments, client emails. */
import { useState, useMemo } from 'react';
import { BOOT, TONE, inr, plural, useData, act, remove, openDlg, Icon, Avatar, Chip, Loading, Empty, StatusSelect, RemRow, Core3D, go, toast, api, refresh } from './core.jsx';

const Head = ({ title, lead, children }) => <section className="page-h"><div><h1>{title}</h1><p className="lead">{lead}</p></div><div className="page-act">{children}</div></section>;
const New = ({ what, label, preset }) => <button className="btn pri" type="button" onClick={() => openDlg(what, preset)}><Icon k="plus" />{label}</button>;

/* ---------------- dashboard ---------------- */
export function Dashboard() {
  const { data: d, error } = useData('dashboard');
  const [tab, setTab] = useState('money6');
  const [hideSetup, setHide] = useState(() => { try { return !!localStorage.getItem('sk-hide-setup'); } catch (e) { return false; } });
  if (!d) return <Loading error={error} />;
  const k = d.k, todo = k.rem_over + k.rem_today, all = todo + k.today_done, pct = all ? Math.round(k.today_done / all * 100) : 100;
  const summary = todo ? `${plural(todo, 'reminder')} to do${k.rem_over ? `, ${k.rem_over} overdue` : ''}.` : 'No reminders due today.';
  const attn = [
    k.overdue_pay_n && ['payments', 'wallet', 'bad', plural(k.overdue_pay_n, 'overdue payment'), inr(k.overdue_pay) + ' to chase'],
    k.late && ['projects', 'flag', 'bad', `${plural(k.late, 'project')} past deadline`, 'Update the dates or the status'],
    k.rem_over && ['reminders', 'bell', 'warn', plural(k.rem_over, 'overdue reminder'), 'Tick them off or move them'],
    k.stale_leads && ['clients', 'spark', 'lead', `${plural(k.stale_leads, 'lead')} waiting over 2 days`, 'Call or WhatsApp them today'],
  ].filter(Boolean);
  const steps = [['Add your first client', k.clients > 0, () => openDlg('client')], ['Create a project with a deadline', d.setup.project, () => openDlg('project')], ['Set a reminder', d.setup.reminder, () => openDlg('reminder')],
    ['Record a payment', d.setup.payment, () => openDlg('payment')], ['Give your team their own sign-in', d.setup.team, () => { location.href = 'team.php'; }], ['Switch on client emails', d.setup.mail, () => go('emails')]];
  const done = steps.filter(s => s[1]).length, mMax = Math.max(1, ...d.months.map(m => m.value)), mNow = d.months[5].value, mPrev = d.months[4].value, mTot = d.months.reduce((a, m) => a + m.value, 0);
  const change = mPrev ? Math.round((mNow - mPrev) / mPrev * 100) : null, pipeTot = Math.max(1, Object.values(d.pipe).reduce((a, b) => a + b, 0)), topMax = Math.max(1, d.top[0] ? d.top[0].billed : 1);
  const KPI = ({ href, icon, tone, n, label, alert, children }) => <a className={'kpi' + (alert ? ' alert' : '')} href={href}><span className={'k-i ' + (tone || '')}><Icon k={icon} /></span><b>{n}</b><span>{label}{children}</span></a>;
  return (
    <>
      <section className="m-hero" aria-label="Today at a glance">
        <div className="mh-top">
          <div><small>{d.date_text}</small><h1>{d.greet}, {BOOT.user.name.split(' ')[0]}</h1><p>{summary}</p></div>
          <div className="mh-orb" role="img" aria-label={`${k.today_done} of ${all} reminders done today`}><div className="mh-ring" style={{ '--p': pct }}></div><Core3D /><span className="mh-lab"><b>{k.today_done}/{all}</b><small>done today</small></span></div>
        </div>
        <div className="mh-stats">
          <a href="#/payments"><small>To collect</small><b>{inr(k.pending)}</b></a>
          <a href="#/payments"><small>This month</small><b>{inr(k.paid_month)}</b></a>
          <a href="#/projects"><small>Live projects</small><b>{k.live}</b></a>
        </div>
        <nav className="mh-act" aria-label="Quick add">
          {[['client', 'user', 'Client'], ['reminder', 'bell', 'Reminder'], ['project', 'layers', 'Project'], ['payment', 'wallet', 'Payment']].map(([w, i, l]) => <button type="button" key={w} onClick={() => openDlg(w)}><span><Icon k={i} /></span>{l}</button>)}
        </nav>
      </section>

      {attn.length ? <nav className="attn" aria-label="Needs attention"><span className="attn-h"><Icon k="flag" />Needs attention</span>
        {attn.map(([to, icon, tone, title, sub]) => <a className={'attn-i t-' + tone} href={'#/' + to} key={title}><span className="ai-i"><Icon k={icon} /></span><span><b>{title}</b><small>{sub}</small></span><Icon k="chev" cls="i sm" /></a>)}</nav>
        : <p className="attn ok"><span className="attn-h"><Icon k="check" />All clear</span><span className="muted">No overdue payments, late projects or waiting leads.</span></p>}

      {done < steps.length && !hideSetup && <section className="setup-card" aria-label="Getting started">
        <div className="sc-h"><div><h2>Set up your Client Hub</h2><p>{done} of {steps.length} done. Finish these to get the most out of it.</p></div>
          <span className="sc-ring" style={{ '--p': Math.round(done / steps.length * 100) }}><b>{Math.round(done / steps.length * 100)}%</b></span>
          <button className="icon-btn" type="button" aria-label="Hide for now" onClick={() => { setHide(true); try { localStorage.setItem('sk-hide-setup', '1'); } catch (e) {} }}><Icon k="x" /></button></div>
        <ol className="sc-steps">{steps.map(([label, ok, run]) => <li className={ok ? 'done' : ''} key={label}>{ok ? <><span className="sc-c"><Icon k="check" cls="i sm" /></span>{label}</> : <button type="button" onClick={run}><span className="sc-c"></span>{label}</button>}</li>)}</ol>
      </section>}

      <section className="kpis" aria-label="Summary">
        <KPI href="#/clients" icon="users" n={k.active} label="Active clients" />
        <KPI href="#/clients" icon="spark" tone="lead" n={k.leads} label="Open leads">{k.leads7 ? <em className="up">+{k.leads7} this week</em> : null}</KPI>
        <KPI href="#/projects" icon="layers" n={k.live} label="Projects running" />
        <KPI href="#/projects" icon="flag" tone="warn" n={k.due7} label="Due in 7 days" alert={k.late > 0}>{k.late ? <em className="down">{k.late} late</em> : null}</KPI>
        <KPI href="#/reminders" icon="bell" tone="bad" n={todo} label="Reminders today" alert={k.rem_over > 0}>{k.rem_over ? <em className="down">{k.rem_over} overdue</em> : null}</KPI>
        <KPI href="#/payments" icon="wallet" tone="ok" n={inr(k.pending)} label="To collect" />
      </section>

      <nav className="week" aria-label="This week">{d.week.map((w, i) => { const n = w.rem + w.dl; return (
        <a className={'wd' + (i ? '' : ' now') + (n ? ' busy' : '')} href="#/reminders" key={i}><small>{w.day}</small><b>{w.num}</b>
          <span className="wd-t">{n ? [w.rem ? plural(w.rem, 'task') : '', w.dl ? w.dl + ' due' : ''].filter(Boolean).join(', ') : 'Free'}</span>
          <span className="wd-dots">{Array.from({ length: Math.min(3, w.rem) }, (x, j) => <i className="r" key={'r' + j}></i>)}{Array.from({ length: Math.min(2, w.dl) }, (x, j) => <i className="d" key={'d' + j}></i>)}</span></a>); })}</nav>

      <div className="dash">
        <nav className="dtabs" aria-label="Insights">{[['money6', 'Collections'], ['pipe', 'Pipeline'], ['topc', 'Top clients']].map(([key, l]) => <button type="button" className={tab === key ? 'on' : ''} key={key} onClick={() => setTab(key)}>{l}</button>)}</nav>
        <section className={'panel money6 dt' + (tab === 'money6' ? ' dt-on' : '')}>
          <header className="ph"><h2><Icon k="trend" />Collections</h2><a className="more" href="#/payments">Payments<Icon k="chev" /></a></header>
          <div className="m-sum"><div><small>Received in {d.month_name}</small><b>{inr(mNow)}</b>{change !== null && <em className={change >= 0 ? 'up' : 'down'}>{change >= 0 ? '+' : ''}{change}% vs last month</em>}</div><div><small>Last 6 months</small><b>{inr(mTot)}</b></div><div><small>Still to collect</small><b className="t-warn">{inr(k.pending)}</b></div></div>
          <div className={'bars' + (mTot ? '' : ' none')} role="img" aria-label="Money received per month for the last six months">{!mTot && <p className="bars-empty">No payments received yet. Mark a payment as paid to see it here.</p>}
            {d.months.map(m => <div className={'bc' + (m.cur ? ' cur' : '')} key={m.label}><span className="bv">{m.value ? inr(m.value) : ''}</span><i style={{ '--h': Math.max(3, Math.round(m.value / mMax * 100)) + '%' }}></i><small>{m.label}</small></div>)}</div>
        </section>
        <section className={'panel topc dt' + (tab === 'topc' ? ' dt-on' : '')}>
          <header className="ph"><h2><Icon k="star" />Top clients</h2><a className="more" href="#/clients">All clients<Icon k="chev" /></a></header>
          {d.top.length ? <ol className="top-list">{d.top.map(c => <li key={c.id}><a href={`#/client/${c.id}/payments`}><Avatar p={c} size="sm" /><span className="tl-n"><b>{c.name}</b><span className="bar"><i style={{ width: Math.round(c.billed / topMax * 100) + '%' }}></i></span></span><span className="tl-v"><b>{inr(c.billed)}</b><small>{c.billed ? Math.round(c.paid / c.billed * 100) : 0}% paid</small></span></a></li>)}</ol>
            : <Empty icon="wallet">Your highest billing clients appear here once you add payments.</Empty>}
        </section>
        <section className="panel today">
          <header className="ph"><h2><Icon k="bell" />Today</h2><a className="more" href="#/reminders">All reminders<Icon k="chev" /></a></header>
          {d.today.length ? <ul className="rem-list">{d.today.map(r => <RemRow r={r} key={r.id} />)}</ul> : <Empty icon="check" title="You are all caught up.">Nothing is due today.</Empty>}
          {d.soon.length > 0 && <><h3 className="sub-h">Coming up this week</h3><ul className="rem-list soft">{d.soon.map(r => <RemRow r={r} key={r.id} />)}</ul></>}
        </section>
        <section className="panel deadlines">
          <header className="ph"><h2><Icon k="flag" />Deadlines</h2><a className="more" href="#/projects">Projects<Icon k="chev" /></a></header>
          {d.deadlines.length ? <ul className="dl-list">{d.deadlines.map(p => { const [dd, mon] = p.due_text.split(' '); return (
            <li key={p.id}><a href={`#/client/${p.client_id}/projects`}><span className={'dl-date t-' + p.tone}><b>{dd}</b><small>{mon}</small></span>
              <span className="dl-main"><b>{p.title}</b><small>{p.client}{p.service ? ', ' + p.service : ''}</small><span className="bar"><i style={{ width: p.progress + '%' }}></i></span></span>
              <span className="dl-side"><Chip tone={p.tone}>{p.rel}</Chip><small>{p.progress}% done</small></span></a></li>); })}</ul>
            : <Empty icon="layers">No project deadlines in the next 30 days.</Empty>}
        </section>
        <section className={'panel pipe dt' + (tab === 'pipe' ? ' dt-on' : '')}>
          <header className="ph"><h2><Icon k="layers" />Project pipeline</h2></header>
          <div className="stack" role="img" aria-label="Projects by stage">{Object.entries(d.pipe).map(([s, n]) => n ? <i className={'s-' + s} style={{ width: n / pipeTot * 100 + '%' }} key={s}></i> : null)}</div>
          <ul className="pipe-list">{Object.entries(d.pipe).map(([s, n]) => <li key={s}><span className={'dot s-' + s}></span>{BOOT.project_status[s]}<b>{n}</b><small>{Math.round(n / pipeTot * 100)}%</small></li>)}</ul>
          <div className="money"><div><small>Received in {d.month_name}</small><b>{inr(k.paid_month)}</b></div><div><small>Overdue</small><b className={k.overdue_pay ? 't-bad' : ''}>{inr(k.overdue_pay)}</b></div></div>
        </section>
        <section className="panel leads">
          <header className="ph"><h2><Icon k="spark" />New leads</h2><a className="more" href="#/clients">All leads<Icon k="chev" /></a></header>
          <div className="conv" title="Last 90 days"><div><b>{d.conv.new}</b><small>New, 90 days</small></div><div><b>{d.conv.new ? Math.round(d.conv.won / d.conv.new * 100) : 0}%</b><small>Became clients</small></div><div><b>{d.conv.web}</b><small>From website</small></div></div>
          {d.leads.length ? <ul className="people">{d.leads.map(c => <li key={c.id}><a href={`#/client/${c.id}`}><Avatar p={c} size="sm" /><span><b>{c.name}</b><small>{c.source || 'Lead'}, {c.updated}</small></span><Icon k="chev" /></a></li>)}</ul>
            : <Empty icon="spark">New website enquiries appear here.</Empty>}
          {d.pays.length > 0 && <><h3 className="sub-h">Payments due this week</h3><ul className="people">{d.pays.map(p => <li key={p.id}><a href={`#/client/${p.client_id}/payments`}><span className="av sm pay"><Icon k="wallet" /></span><span><b>{inr(p.amount)}</b><small>{p.client}, <span className={'t-' + p.tone}>{p.rel}</span></small></span><Icon k="chev" /></a></li>)}</ul></>}
        </section>
        <section className="panel feed">
          <header className="ph"><h2><Icon k="clock" />Recent activity</h2></header>
          {d.acts.length ? <ul className="feed-list">{d.acts.map(a => <li key={a.id}><span className={'f-dot k-' + a.kind}></span><div><p>{a.client ? <><a href={`#/client/${a.client_id}/activity`}>{a.client}</a>: </> : null}{a.body}</p><small>{a.ago}{a.who ? ', ' + a.who : ''}</small></div></li>)}</ul>
            : <Empty icon="clock">Notes, calls and changes show up here.</Empty>}
        </section>
      </div>
    </>
  );
}

/* ---------------- clients ---------------- */
export function Clients() {
  const { data, error } = useData('clients');
  const [status, setStatus] = useState('all'), [sort, setSort] = useState('recent'), [q, setQ] = useState('');
  const rows = data ? data.rows : [];
  const counts = useMemo(() => { const c = { all: 0 }; Object.keys(BOOT.client_status).forEach(s => { c[s] = 0; }); rows.forEach(r => { c[r.status]++; if (r.status !== 'archived') c.all++; }); return c; }, [rows]);
  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    const l = rows.filter(r => (status === 'all' ? r.status !== 'archived' : r.status === status) && (!term || [r.name, r.company, r.phone, r.email, r.city, r.contact_person].join(' ').toLowerCase().includes(term)));
    const by = { name: (a, b) => a.name.localeCompare(b.name), deadline: (a, b) => (a.nd || '9').localeCompare(b.nd || '9'), value: (a, b) => b.billed - a.billed }[sort];
    return (by ? [...l].sort(by) : l).sort((a, b) => b.starred - a.starred);
  }, [rows, status, sort, q]);
  if (!data) return <Loading error={error} />;
  return (
    <>
      <Head title="Clients" lead={`${plural(counts.all, 'client')}${counts.lead ? `, ${plural(counts.lead, 'open lead')}` : ''}. Open any profile to see projects, reminders, payments and history.`}>
        {BOOT.user.owner && <a className="btn ghost" href="export.php"><Icon k="download" />Export CSV</a>}<New what="client" label="New client" /></Head>
      {!rows.length ? <Empty big icon="users" title="Add your first client" action={<New what="client" label="Add a client" />}>Keep every contact, project, deadline and payment in one profile.</Empty> : <>
        <div className="toolbar">
          <nav className="seg" aria-label="Filter clients by status">{[['all', 'All'], ...Object.entries(BOOT.client_status)].map(([s, l]) => <a href="#/clients" className={status === s ? 'on' : ''} key={s} onClick={e => { e.preventDefault(); setStatus(s); }}>{l}<b>{counts[s]}</b></a>)}</nav>
          <div className="tool-r">
            <label className="filter"><Icon k="search" /><span className="sr">Filter this list</span><input type="search" placeholder="Filter this list" value={q} onChange={e => setQ(e.target.value)} /></label>
            <label className="sel"><span className="sr">Sort by</span><select value={sort} onChange={e => setSort(e.target.value)}><option value="recent">Recently updated</option><option value="name">Name</option><option value="deadline">Next deadline</option><option value="value">Highest billing</option></select></label>
          </div>
        </div>
        {list.length ? <ul className="cards">{list.map((c, i) => (
          <li className="ccard" key={c.id} style={{ animationDelay: Math.min(i, 14) * 30 + 'ms' }}>
            <a className="cc-link" href={`#/client/${c.id}`} aria-label={`Open ${c.name}`}></a>
            <div className="cc-top"><Avatar p={c} /><span className="cc-name"><b>{c.name}{c.starred ? <span className="star"><Icon k="star" cls="i sm" /></span> : null}</b><small>{[c.company !== c.name && c.company, c.industry, c.city].filter(Boolean).join(', ') || 'No details yet'}</small></span><Chip tone={TONE[c.status]}>{BOOT.client_status[c.status]}</Chip></div>
            <dl className="cc-facts"><div><dt>Next deadline</dt><dd className={c.nd ? 't-' + c.nd_tone : 't-mute'}>{c.nd_rel || 'None'}</dd></div><div><dt>Open projects</dt><dd>{c.open_p}</dd></div><div><dt>To collect</dt><dd className={c.due ? 't-warn' : ''}>{inr(c.due)}</dd></div></dl>
            <div className="cc-act">
              {c.phone && <a className="icon-btn" href={'tel:' + c.phone} aria-label={`Call ${c.name}`}><Icon k="phone" /></a>}
              {c.wa_url && <a className="icon-btn" href={c.wa_url} target="_blank" rel="noopener" aria-label={`WhatsApp ${c.name}`}><Icon k="wa" /></a>}
              {c.email && <a className="icon-btn" href={'mailto:' + c.email} aria-label={`Email ${c.name}`}><Icon k="mail" /></a>}
              <span className="cc-upd">Updated {c.updated}</span></div>
          </li>))}</ul> : <p className="empty-f">No clients match this filter.</p>}
      </>}
    </>
  );
}

/* ---------------- projects board ---------------- */
export function Projects() {
  const { data, error } = useData('projects');
  const [drag, setDrag] = useState(0), [over, setOver] = useState('');
  if (!data) return <Loading error={error} />;
  const rows = data.rows, today = BOOT.today, live = rows.filter(r => r.status !== 'done');
  const late = live.filter(r => r.due_date && r.due_date < today).length, worth = live.reduce((a, r) => a + r.value, 0);
  const move = (id, status) => act('project.update', { id, field: 'status', value: status }, 'Moved to ' + BOOT.project_status[status]);
  return (
    <>
      <Head title="Projects" lead={<>{live.length} running{late ? <>, <span className="t-bad">{late} past deadline</span></> : null}{worth ? ', worth ' + inr(worth) : ''}. Drag a card to change its stage, or open the client to edit details.</>}><New what="project" label="New project" /></Head>
      {!rows.length ? <Empty big icon="layers" title="No projects yet" action={<New what="project" label="Create a project" />}>Create a project for a client, set a deadline, and track its progress from start to delivery.</Empty> :
        <div className="board">{Object.entries(BOOT.project_status).map(([st, label]) => { const list = rows.filter(r => r.status === st); return (
          <section className={'col' + (over === st ? ' over' : '')} key={st} aria-label={label}
            onDragOver={e => { if (drag) { e.preventDefault(); setOver(st); } }} onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOver(''); }}
            onDrop={e => { e.preventDefault(); setOver(''); const p = rows.find(r => r.id === drag); if (p && p.status !== st) move(p.id, st); setDrag(0); }}>
            <header><span className={'dot s-' + st}></span><h2>{label}</h2><b>{list.length}</b></header>
            <div className="col-list">{list.map(p => (
              <article className={'kcard' + (drag === p.id ? ' drag' : '')} draggable key={p.id} onDragStart={e => { setDrag(p.id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(p.id)); }} onDragEnd={() => { setDrag(0); setOver(''); }}>
                <a className="k-t" href={`#/client/${p.client_id}/projects`}>{p.title}</a>
                <span className="k-c"><Avatar p={p} size="xs" />{p.client}</span>
                {p.service && <span className="k-s">{p.service}</span>}
                <span className="bar"><i style={{ width: p.progress + '%' }}></i></span>
                <span className="k-f">{p.due_date ? <Chip tone={p.tone}>{p.rel}</Chip> : <Chip>No deadline</Chip>}<small>{p.progress}%</small>
                  <label className="k-move"><span className="sr">Move to</span><select value={p.status} onChange={e => move(p.id, e.target.value)}>{Object.entries(BOOT.project_status).map(([k2, v]) => <option value={k2} key={k2}>{v}</option>)}</select></label></span>
              </article>))}{!list.length && <p className="col-empty">Nothing here</p>}</div>
          </section>); })}</div>}
    </>
  );
}

/* ---------------- reminders ---------------- */
export function Reminders() {
  const { data, error } = useData('reminders');
  if (!data) return <Loading error={error} />;
  const groups = ['Overdue', 'Today', 'Tomorrow', 'This week', 'Later'].map(g => [g, data.open.filter(r => r.group === g)]).filter(g => g[1].length);
  const over = data.open.filter(r => r.group === 'Overdue').length;
  return (
    <>
      <Head title="Reminders" lead={<>{data.open.length} open{over ? <>, <span className="t-bad">{over} overdue</span></> : null}. Tick a reminder when it is done, or move it to tomorrow with the clock.</>}><New what="reminder" label="New reminder" /></Head>
      {!data.open.length && !data.done.length ? <Empty big icon="bell" title="No reminders yet" action={<New what="reminder" label="Add a reminder" />}>Add follow-ups, approvals, renewals and payment chasers. Each one appears on your dashboard on the day it is due.</Empty> :
        <div className="rem-groups">
          {groups.map(([g, list]) => <section className={'panel rg g-' + g.toLowerCase().replace(' ', '-')} key={g}><header className="ph"><h2>{g}</h2><b className="cnt">{list.length}</b></header><ul className="rem-list">{list.map(r => <RemRow r={r} key={r.id} />)}</ul></section>)}
          {!data.open.length && <Empty icon="check" title="All done.">No open reminders.</Empty>}
          {data.done.length > 0 && <details className="panel done-box"><summary><Icon k="check" />Recently completed ({data.done.length})</summary><ul className="rem-list">{data.done.map(r => <RemRow r={r} key={r.id} />)}</ul></details>}
        </div>}
    </>
  );
}

/* ---------------- payments ---------------- */
export function Payments() {
  const { data, error } = useData('payments');
  const [f, setF] = useState('open');
  if (!data) return <Loading error={error} />;
  const rows = data.rows, open = rows.filter(p => p.status === 'pending'), late = open.filter(p => p.late), sum = l => l.reduce((a, p) => a + p.amount, 0);
  const list = { open, overdue: late, paid: rows.filter(p => p.status === 'paid').sort((a, b) => b.paid_date.localeCompare(a.paid_date)), all: rows }[f];
  const K = ({ id, icon, tone, n, label, alert }) => <a className={'kpi' + (alert ? ' alert' : '')} href="#/payments" onClick={e => { e.preventDefault(); setF(id); }}><span className={'k-i ' + tone}><Icon k={icon} /></span><b>{inr(n)}</b><span>{label}</span></a>;
  return (
    <>
      <Head title="Payments" lead="Invoices, advances and retainers across every client. Mark a payment as paid when the money arrives."><New what="payment" label="New payment" /></Head>
      <section className="kpis four"><K id="open" icon="wallet" tone="warn" n={sum(open)} label="To collect" /><K id="overdue" icon="flag" tone="bad" n={sum(late)} label="Overdue" alert={late.length > 0} />
        <K id="paid" icon="check" tone="ok" n={data.tot.month} label={`Received in ${data.month_name}`} /><K id="paid" icon="trend" tone="" n={data.tot.year} label={`Received in ${data.year}`} /></section>
      <div className="toolbar"><nav className="seg" aria-label="Filter payments">{[['open', 'To collect'], ['overdue', 'Overdue'], ['paid', 'Received'], ['all', 'All']].map(([k, l]) => <a href="#/payments" className={f === k ? 'on' : ''} key={k} onClick={e => { e.preventDefault(); setF(k); }}>{l}</a>)}</nav></div>
      {!list.length ? <Empty icon="wallet" title="Nothing here.">{f === 'open' ? 'No payments are waiting to be collected.' : 'No payments match this filter.'}</Empty> :
        <div className="panel table-w"><table className="tbl"><thead><tr><th>Client</th><th>Description</th><th className="num">Amount</th><th>Due</th><th>Status</th></tr></thead>
          <tbody>{list.map(p => <tr className={p.status === 'paid' ? 'paid' : ''} key={p.id}>
            <td><a className="tlink" href={`#/client/${p.client_id}/payments`}><Avatar p={p} size="xs" />{p.client}</a></td>
            <td>{p.label}{p.paid_date ? <small>Received {p.paid_text}</small> : null}</td><td className="num"><b>{inr(p.amount)}</b></td>
            <td><span className={'t-' + (p.status === 'paid' ? 'mute' : p.tone)}>{p.due_date ? (p.status === 'paid' ? p.due_text : p.rel) : 'No date'}</span></td>
            <td><PayStatus p={p} /></td></tr>)}</tbody></table></div>}
    </>
  );
}
export const PayStatus = ({ p }) => (
  <label className={'chip-sel t-' + (p.status === 'paid' ? 'ok' : p.late ? 'bad' : 'warn')}><span className="sr">Status</span>
    <select value={p.status} onChange={e => act('payment.update', { id: p.id, field: 'status', value: e.target.value }, e.target.value === 'paid' ? 'Marked as paid' : 'Marked as pending')}>{Object.entries(BOOT.pay_status).map(([k, v]) => <option value={k} key={k}>{v}</option>)}</select><Icon k="down" cls="i sm" /></label>
);

/* ---------------- client emails ---------------- */
const MAIL_ICON = { 'payment-request': 'wallet', 'payment-reminder': 'wallet', 'payment-received': 'check', 'renewal-reminder': 'wallet', 'proposal-sent': 'note', 'meeting-confirmed': 'cal', 'monthly-report': 'trend', 'feedback-request': 'star', welcome: 'star', 'project-confirmed': 'layers', 'project-delivered': 'layers' };
export function Emails() {
  const { data, error } = useData('emails');
  if (!data) return <Loading error={error} />;
  return (
    <>
      <Head title="Client emails" lead="Ready-made emails in your brand: thank you, welcome, proposals, project confirmations, payment requests, reminders and receipts. Send any of them from a client's profile." />
      <div className={'mail-state ' + (data.enabled ? 'on' : 'off')}><span className="ms-i"><Icon k={data.enabled ? 'check' : 'lock'} /></span><div><b>{data.enabled ? 'Sending is on' : 'Sending is not switched on yet'}</b>
        <p>{data.enabled ? `Emails go out from ${data.from}. Replies go to ${data.reply_to}.` : 'Every email below can be previewed now. To send them, your developer adds the mail settings (SMTP) in config.php. The steps are in the README.'}</p></div></div>
      <ul className="mail-grid">{data.templates.map(t => (
        <li className="mcard" key={t.slug}>
          <a className="mc-thumb" href={`emails.php?preview=${t.slug}`} target="_blank" rel="noopener" aria-label={`Open the ${t.title} preview`}><iframe src={`emails.php?preview=${t.slug}`} loading="lazy" tabIndex={-1} title="" aria-hidden="true"></iframe></a>
          <div className="mc-top"><span className="mc-i"><Icon k={MAIL_ICON[t.slug] || 'spark'} /></span>{t.auto ? <Chip tone="ok">Automatic</Chip> : <Chip>Send from profile</Chip>}</div>
          <h2>{t.title}</h2><p className="mc-sub">{t.subject}</p><p className="mc-about">{t.about}</p>
          <a className="btn ghost sm" href={`emails.php?preview=${t.slug}`} target="_blank" rel="noopener"><Icon k="eye" />Preview</a>
        </li>))}</ul>
    </>
  );
}
