/* Sankruv Media Client Hub. All behaviour lives here: the CSP allows no inline script. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const DATA = (() => { try { return JSON.parse($('#sk-data').textContent); } catch (e) { return {}; } })();
  const TONES = { lead: 'lead', active: 'ok', on_hold: 'warn', completed: 'calm', archived: 'mute', planned: 'calm', in_progress: 'lead', review: 'warn', done: 'ok', paused: 'mute', pending: 'warn', paid: 'ok' };
  document.documentElement.classList.add('js');

  /* ---------- toasts ---------- */
  const ICON_OK = '<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
  const ICON_BAD = '<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>';
  function toast(msg, kind = 'ok') {
    const box = $('#toasts'); if (!box || !msg) return;
    const t = document.createElement('div');
    t.className = 'toast ' + (kind === 'bad' ? 'bad' : '');
    t.innerHTML = (kind === 'bad' ? ICON_BAD : ICON_OK) + '<span></span>';
    t.lastChild.textContent = msg;
    box.appendChild(t);
    setTimeout(() => { t.style.transition = 'opacity .3s, transform .3s'; t.style.opacity = '0'; t.style.transform = 'translateY(8px)'; setTimeout(() => t.remove(), 320); }, kind === 'bad' ? 5200 : 3200);
  }
  $$('.toast-init').forEach(el => toast(el.textContent.trim(), el.dataset.kind));
  try { const m = sessionStorage.getItem('sk-toast'); if (m) { sessionStorage.removeItem('sk-toast'); toast(m); } } catch (e) {}
  const later = msg => { try { if (msg) sessionStorage.setItem('sk-toast', msg); } catch (e) {} };

  /* ---------- API ---------- */
  async function api(action, body = {}) {
    let res, out;
    try {
      res = await fetch('api.php', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-CSRF': DATA.csrf || '' }, body: JSON.stringify(Object.assign({ action }, body)) });
      out = await res.json();
    } catch (e) { throw new Error('No connection. Check your internet and try again.'); }
    if (res.status === 401) { location.href = 'login.php?next=' + encodeURIComponent(location.pathname.split('/').pop() + location.search); throw new Error(out.error); }
    if (!out.ok) throw new Error(out.error || 'Something went wrong. Try again.');
    return out;
  }
  const reload = msg => { later(msg); location.reload(); };
  const go = (url, msg) => { later(msg); location.href = url; };

  /* ---------- confirm dialog ---------- */
  function confirmBox(msg, okLabel = 'Delete') {
    const d = $('#dlg-confirm');
    if (!d || !d.showModal) return Promise.resolve(window.confirm(msg));
    $('#confirm-msg').textContent = msg;
    d.querySelector('button[value="yes"]').textContent = okLabel;
    d.returnValue = '';
    d.showModal();
    return new Promise(r => d.addEventListener('close', () => r(d.returnValue === 'yes'), { once: true }));
  }

  /* ---------- menus and dialogs ---------- */
  const closeMenus = except => $$('.menu').forEach(m => { if (m !== except) m.hidden = true; });
  function openDialog(id, opener) {
    const d = document.getElementById(id); if (!d) return;
    closeMenus();
    if (id === 'palette') return openPalette();
    const err = d.querySelector('.dlg-err'); if (err) err.textContent = '';
    /* an opener can prefill fields: data-set='{"template":"payment-received","payment_id":"4"}' */
    let preset = null;
    try { preset = opener && opener.dataset.set ? JSON.parse(opener.dataset.set) : null; } catch (x) {}
    if (preset) Object.keys(preset).forEach(k => { const f = d.querySelector('[name="' + k + '"]'); if (f) f.value = preset[k]; });
    d.dispatchEvent(new CustomEvent('dlg-open'));
    d.showModal();
    const f = d.querySelector('input:not([type=hidden]):not([type=date]):not([type=time]), textarea');
    if (f && matchMedia('(hover:hover)').matches) f.focus();
  }
  document.addEventListener('click', e => {
    const t = e.target;
    const op = t.closest('[data-open]'); if (op) { e.preventDefault(); openDialog(op.dataset.open, op); return; }
    const cl = t.closest('[data-close]'); if (cl) { cl.closest('dialog').close(); return; }
    const mb = t.closest('[data-menu]');
    if (mb) { const m = document.getElementById(mb.dataset.menu); closeMenus(m); m.hidden = !m.hidden; mb.setAttribute('aria-expanded', String(!m.hidden)); return; }
    if (!t.closest('.menu')) closeMenus();
    if (t.tagName === 'DIALOG' && t.open) { const r = t.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) t.close(); }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenus(); });

  /* ---------- forms posting to the API ---------- */
  document.addEventListener('submit', async e => {
    const f = e.target.closest('form[data-action]'); if (!f) return;
    e.preventDefault();
    if (!f.reportValidity()) return;
    const body = {};
    new FormData(f).forEach((v, k) => {
      if (k.endsWith('[]')) { k = k.slice(0, -2); (body[k] = body[k] || []).push(v); } else body[k] = v;
    });
    const btn = f.querySelector('[type=submit]'); const err = f.querySelector('.dlg-err');
    if (btn) btn.disabled = true; if (err) err.textContent = '';
    try {
      const r = await api(f.dataset.action, body);
      if (f.dataset.action === 'client.create' && r.url) return go(r.url, r.message);
      if (r.url) {
        const u = new URL(r.url, location.href);
        if (u.pathname === location.pathname && u.search === location.search && u.hash && u.hash !== location.hash) history.replaceState(null, '', u.hash);
      }
      reload(r.message);
    } catch (x) {
      if (err) err.textContent = x.message; else toast(x.message, 'bad');
      if (btn) btn.disabled = false;
    }
  });

  /* ---------- one-click actions ---------- */
  document.addEventListener('click', async e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    e.preventDefault();
    if (b.dataset.confirm && !(await confirmBox(b.dataset.confirm))) return;
    const act = b.dataset.act, id = +b.dataset.id;
    b.disabled = true;
    try {
      if (act === 'reminder.toggle') {
        const li = b.closest('.rem');
        const r = await api(act, { id });
        li.classList.toggle('done', !!r.done);
        b.setAttribute('aria-pressed', String(!!r.done));
        toast(r.done ? 'Marked as done' : 'Moved back to open');
        if (r.done && !li.closest('.done-box')) setTimeout(() => collapse(li), 700);
        b.disabled = false;
        return;
      }
      const r = await api(act, act === 'reminder.snooze' ? { id, days: +b.dataset.days || 1 } : { id });
      if (r.url) return go(r.url, r.message);
      if (act === 'reminder.snooze' && $('.rem-groups')) return reload(r.message);
      const row = b.closest('.rem, tr, .pcard, .kcard, .timeline li');
      toast(r.message);
      if (row) collapse(row); else reload();
    } catch (x) { toast(x.message, 'bad'); b.disabled = false; }
  });
  function collapse(el) {
    el.style.transition = 'opacity .3s, transform .3s';
    el.style.opacity = '0'; el.style.transform = 'translateX(12px)';
    setTimeout(() => el.remove(), 300);
  }

  /* ---------- autosave fields ---------- */
  const timers = new WeakMap();
  async function save(el) {
    const kind = el.dataset.save, field = el.dataset.field, id = +el.dataset.id;
    const value = el.type === 'checkbox' ? (el.checked ? 1 : 0) : el.value;
    if (el.dataset.last === value) return;
    const state = el.dataset.state ? $(el.dataset.state) : null;
    if (state) state.textContent = 'Saving';
    el.classList.add('saving');
    try {
      const r = await api(kind + '.update', { id, field, value });
      el.dataset.last = value;
      el.classList.remove('saving');
      if (el.hasAttribute('data-reload')) return reload(field === 'status' ? 'Status updated' : 'Saved');
      flashSaved(el.closest('.chip-sel') || el);
      if (state) state.textContent = 'Saved ' + new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
      const chip = el.closest('.chip-sel');
      if (chip && TONES[value]) chip.className = chip.className.replace(/\bt-\w+/, 't-' + TONES[value]);
      if (kind === 'project') afterProject(el, r);
    } catch (x) {
      el.classList.remove('saving');
      if (state) state.textContent = 'Not saved';
      toast(x.message, 'bad');
    }
  }
  function afterProject(el, r) {
    const card = el.closest('.pcard'); if (!card) return;
    card.className = card.className.replace(/\bst-\w+/, 'st-' + r.status);
    const rg = card.querySelector('input[type=range]');
    if (rg && +rg.value !== r.progress) { rg.value = r.progress; paintRange(rg); rg.dataset.last = String(r.progress); }
    const dc = card.querySelector('.due-chip');
    if (dc) { dc.textContent = r.due || ''; dc.className = 'due-chip t-' + (r.tone || 'mute'); }
  }
  function flashSaved(el) { el.classList.remove('saved-flash'); void el.offsetWidth; el.classList.add('saved-flash'); }
  $$('[data-save]').forEach(el => { el.dataset.last = el.type === 'checkbox' ? (el.checked ? 1 : 0) : el.value; });
  document.addEventListener('change', e => { const el = e.target.closest('[data-save]'); if (el) { clearTimeout(timers.get(el)); save(el); } });
  document.addEventListener('input', e => {
    const el = e.target;
    if (el.type === 'range') paintRange(el);
    if (!el.matches('[data-save]') || el.tagName === 'SELECT' || el.type === 'range' || el.type === 'date') return;
    const st = el.dataset.state && $(el.dataset.state); if (st) st.textContent = 'Typing';
    clearTimeout(timers.get(el));
    timers.set(el, setTimeout(() => save(el), 900));
  });
  document.addEventListener('focusout', e => { const el = e.target; if (el.matches && el.matches('input[data-save], textarea[data-save]')) { clearTimeout(timers.get(el)); save(el); } });
  function paintRange(rg) {
    rg.style.setProperty('--v', rg.value + '%');
    const o = rg.parentElement.querySelector('output'); if (o) o.textContent = rg.value + '%';
  }
  $$('input[type=range]').forEach(paintRange);

  /* ---------- inline edit (profile detail rows and name) ---------- */
  let editing = null;
  function startEdit(row) {
    if (editing === row || row.classList.contains('editing')) return;
    if (editing) cancelEdit(editing);
    editing = row;
    row.classList.add('editing');
    const val = row.querySelector('.val'), type = row.dataset.type || 'text';
    row._html = val.innerHTML;
    let input;
    if (type === 'select') {
      input = document.createElement('select');
      input.innerHTML = '<option value="">Not set</option>';
      JSON.parse(row.dataset.options || '[]').forEach(o => { const op = new Option(o, o); input.add(op); });
      input.value = row.dataset.value;
    } else if (type === 'textarea') {
      input = document.createElement('textarea'); input.rows = 2; input.value = row.dataset.value;
    } else {
      input = document.createElement('input');
      input.type = { tel: 'tel', email: 'email', url: 'url', number: 'number' }[type] || 'text';
      if (type === 'number') { input.min = 0; input.inputMode = 'numeric'; }
      if (type === 'url') input.type = 'text';
      input.value = row.dataset.value;
    }
    input.className = 'inl';
    input.setAttribute('aria-label', (row.querySelector('small') || {}).textContent || 'Edit');
    val.innerHTML = ''; val.appendChild(input);
    input.focus();
    if (input.select && type !== 'select') input.select();
    input.addEventListener('keydown', ev => {
      if (ev.key === 'Escape') { ev.preventDefault(); cancelEdit(row); }
      if (ev.key === 'Enter' && type !== 'textarea') { ev.preventDefault(); commitEdit(row, input); }
    });
    input.addEventListener('blur', () => setTimeout(() => { if (editing === row) commitEdit(row, input); }, 120));
    if (type === 'select') input.addEventListener('change', () => commitEdit(row, input));
  }
  function cancelEdit(row) {
    row.classList.remove('editing');
    row.querySelector('.val').innerHTML = row._html;
    if (editing === row) editing = null;
  }
  async function commitEdit(row, input) {
    if (editing !== row) return;
    editing = null;
    const value = input.value.trim();
    if (value === row.dataset.value) return cancelEdit(row);
    input.disabled = true;
    try {
      const r = await api(row.dataset.edit + '.update', { id: +row.dataset.id, field: row.dataset.field, value });
      row.dataset.value = String(r.value);
      const val = row.querySelector('.val');
      row.classList.remove('editing');
      const label = ((row.querySelector('small') || {}).textContent || '').toLowerCase();
      if (r.display) { val.textContent = r.display; } else { val.innerHTML = '<em class="ph"></em>'; val.firstChild.textContent = 'Add ' + label; }
      flashSaved(row);
      if (row.dataset.field === 'name') { document.title = r.display + ' | Client Hub'; }
      toast('Saved');
      if (['phone', 'whatsapp', 'email', 'website', 'instagram'].includes(row.dataset.field)) {
        const off = $('.gact.off[data-focus-field="' + row.dataset.field + '"]');
        if (off && r.display) setTimeout(() => location.reload(), 600);
      }
    } catch (x) {
      toast(x.message, 'bad');
      input.disabled = false;
      editing = row;
      input.focus();
    }
  }
  document.addEventListener('click', e => {
    const row = e.target.closest('[data-edit]');
    if (!row || e.target.closest('a') || e.target.closest('.inl')) return;
    startEdit(row);
  });
  document.addEventListener('keydown', e => {
    const row = e.target.closest && e.target.closest('[data-edit]');
    if (row && e.target === row && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); startEdit(row); }
  });
  $$('.row[data-edit]').forEach(r => { r.tabIndex = 0; r.setAttribute('role', 'button'); });

  /* ---------- star, services, archive ---------- */
  document.addEventListener('click', async e => {
    const st = e.target.closest('[data-star]');
    if (st) {
      const on = !st.classList.contains('on');
      st.classList.toggle('on', on); st.setAttribute('aria-pressed', String(on));
      try { await api('client.update', { id: +st.dataset.star, field: 'starred', value: on ? 1 : 0 }); toast(on ? 'Pinned to the top of your clients' : 'Unpinned'); }
      catch (x) { st.classList.toggle('on', !on); toast(x.message, 'bad'); }
      return;
    }
    const sv = e.target.closest('.svc-tog .tog');
    if (sv) {
      const box = sv.parentElement;
      sv.classList.toggle('on'); sv.setAttribute('aria-pressed', String(sv.classList.contains('on')));
      const value = $$('.tog.on', box).map(b => b.dataset.svc);
      try { await api('client.update', { id: +box.dataset.services, field: 'services', value }); flashSaved(sv); }
      catch (x) { sv.classList.toggle('on'); toast(x.message, 'bad'); }
      return;
    }
    const ss = e.target.closest('[data-set-status]');
    if (ss) {
      const archive = ss.dataset.setStatus === 'archived';
      if (archive && !(await confirmBox('Archive this client? They move out of your active list, and everything stays saved.', 'Archive'))) return;
      try { await api('client.update', { id: +ss.dataset.id, field: 'status', value: ss.dataset.setStatus }); reload(archive ? 'Client archived' : 'Client restored'); }
      catch (x) { toast(x.message, 'bad'); }
    }
  });

  /* ---------- profile tabs ---------- */
  const tabs = $$('[data-tab]');
  function showTab(name, push) {
    if (!tabs.length) return;
    if (!$('[data-panel="' + name + '"]')) name = 'overview';
    tabs.forEach(t => { const on = t.dataset.tab === name; t.classList.toggle('on', on); t.setAttribute('aria-selected', String(on)); });
    $$('[data-panel]').forEach(p => p.classList.toggle('on', p.dataset.panel === name));
    if (push) history.replaceState(null, '', '#' + name);
  }
  if (tabs.length) {
    showTab(location.hash.slice(1) || 'overview');
    tabs.forEach(t => t.addEventListener('click', e => { e.preventDefault(); showTab(t.dataset.tab, true); }));
    window.addEventListener('hashchange', () => showTab(location.hash.slice(1)));
    document.addEventListener('click', e => {
      const g = e.target.closest('[data-tab-go]');
      if (g) {
        e.preventDefault(); showTab(g.dataset.tabGo, true);
        const nav = $('.ptabs'); if (nav) nav.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (g.dataset.focus) setTimeout(() => { const f = $(g.dataset.focus); if (f) f.focus(); }, 350);
        return;
      }
      const ff = e.target.closest('[data-focus-field]');
      if (ff) {
        showTab('overview', true);
        const row = document.getElementById('row-' + ff.dataset.focusField);
        if (row) { row.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => startEdit(row), 380); }
      }
    });
  }

  /* ---------- search palette ---------- */
  const pal = $('#palette'), pq = $('#pal-q'), pres = $('#pal-res');
  let pIdx = 0, pTimer, pSeq = 0;
  function openPalette() {
    if (!pal) return;
    pal.showModal(); pq.value = ''; pres.innerHTML = '<p class="pal-hint">Start typing to find a client or project.</p>';
    setTimeout(() => pq.focus(), 30);
  }
  function paintPal(items) {
    pIdx = 0;
    if (!items.length) { pres.innerHTML = '<p class="pal-hint">No match. Try a name, phone number or email.</p>'; return; }
    pres.innerHTML = '';
    items.forEach((it, i) => {
      const a = document.createElement('a');
      a.className = 'pal-item' + (i === 0 ? ' on' : ''); a.href = it.url; a.setAttribute('role', 'option');
      const av = document.createElement('span');
      if (it.type === 'Client') { av.className = 'av sm'; av.style.setProperty('--h', it.hue); av.textContent = it.init; }
      else { av.className = 'pal-pi'; av.innerHTML = '<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/></svg>'; }
      const tx = document.createElement('span'); const b = document.createElement('b'); b.textContent = it.title; const s = document.createElement('small'); s.textContent = it.sub; tx.append(b, s);
      const ty = document.createElement('span'); ty.className = 'pal-type'; ty.textContent = it.type;
      a.append(av, tx, ty); pres.appendChild(a);
    });
  }
  if (pq) {
    pq.addEventListener('input', () => {
      clearTimeout(pTimer);
      const q = pq.value.trim();
      if (!q) { pres.innerHTML = '<p class="pal-hint">Start typing to find a client or project.</p>'; return; }
      pTimer = setTimeout(async () => {
        const seq = ++pSeq;
        try {
          const r = await fetch('api.php?action=search&q=' + encodeURIComponent(q), { credentials: 'same-origin' }).then(x => x.json());
          if (seq === pSeq) paintPal(r.results || []);
        } catch (e) { pres.innerHTML = '<p class="pal-hint">Search is not available right now.</p>'; }
      }, 140);
    });
    pq.addEventListener('keydown', e => {
      const items = $$('.pal-item', pres); if (!items.length) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        items[pIdx].classList.remove('on');
        pIdx = (pIdx + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        items[pIdx].classList.add('on'); items[pIdx].scrollIntoView({ block: 'nearest' });
      }
      if (e.key === 'Enter') { e.preventDefault(); location.href = items[pIdx].href; }
    });
  }
  document.addEventListener('keydown', e => {
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
    if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !typing)) { e.preventDefault(); openPalette(); }
  });

  /* ---------- clients list filter and sort ---------- */
  const cf = $('#cfilter');
  if (cf) cf.addEventListener('input', () => {
    const q = cf.value.trim().toLowerCase(); let n = 0;
    $$('#clist .ccard').forEach(c => { const hit = !q || c.dataset.q.includes(q); c.hidden = !hit; if (hit) n++; });
    const none = $('#cnone'); if (none) none.hidden = n > 0;
  });
  $$('select[data-nav]').forEach(s => s.addEventListener('change', () => { location.href = s.value; }));

  /* ---------- kanban drag and drop ---------- */
  const board = $('#board');
  if (board) {
    let dragged = null;
    board.addEventListener('dragstart', e => { const c = e.target.closest('.kcard'); if (!c) return; dragged = c; c.classList.add('drag'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', c.dataset.pid); });
    board.addEventListener('dragend', () => { if (dragged) dragged.classList.remove('drag'); $$('.col.over', board).forEach(c => c.classList.remove('over')); dragged = null; });
    board.addEventListener('dragover', e => { const col = e.target.closest('.col'); if (!col || !dragged) return; e.preventDefault(); $$('.col.over', board).forEach(c => c !== col && c.classList.remove('over')); col.classList.add('over'); });
    board.addEventListener('drop', async e => {
      const col = e.target.closest('.col'); if (!col || !dragged) return;
      e.preventDefault(); col.classList.remove('over');
      const card = dragged, from = card.closest('.col');
      if (from === col) return;
      const list = col.querySelector('.col-list');
      list.prepend(card); recount();
      try {
        await api('project.update', { id: +card.dataset.pid, field: 'status', value: col.dataset.status });
        const sel = card.querySelector('select'); if (sel) { sel.value = col.dataset.status; sel.dataset.last = col.dataset.status; }
        toast('Moved to ' + col.querySelector('h2').textContent);
        if (col.dataset.status === 'done') { const bar = card.querySelector('.bar i'); if (bar) bar.style.width = '100%'; const s = card.querySelector('.k-f small'); if (s) s.textContent = '100%'; }
      } catch (x) { from.querySelector('.col-list').prepend(card); recount(); toast(x.message, 'bad'); }
    });
    function recount() {
      $$('.col', board).forEach(c => {
        const n = $$('.kcard', c).length; c.querySelector('header b').textContent = n;
        let em = c.querySelector('.col-empty');
        if (!n && !em) { em = document.createElement('p'); em.className = 'col-empty'; em.textContent = 'Nothing here'; c.querySelector('.col-list').appendChild(em); }
        if (n && em) em.remove();
      });
    }
  }

  /* ---------- KPI count-up ---------- */
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  $$('[data-count]').forEach(el => {
    const end = +el.dataset.count; if (reduce || !end || end > 100000) return;
    const t0 = performance.now(), dur = 700;
    const step = t => { const p = Math.min(1, (t - t0) / dur); el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
    el.textContent = '0'; requestAnimationFrame(step);
  });

  /* ---------- client email dialog: description and preview link follow the choices ---------- */
  const em = $('#dlg-email');
  if (em) {
    const tpl = $('#em-tpl'), prev = $('#em-prev'), about = $('#em-about');
    const sync = () => {
      const o = tpl.options[tpl.selectedIndex];
      about.textContent = o ? o.dataset.about : '';
      const q = new URLSearchParams({ preview: tpl.value, client: prev.dataset.client, project: $('#em-proj').value, payment: $('#em-pay').value });
      prev.href = 'emails.php?' + q.toString();
    };
    em.addEventListener('change', sync);
    em.addEventListener('dlg-open', sync);
    sync();
  }

  /* ---------- dashboard insights tabs (phones) ---------- */
  $$('.dtabs button').forEach(b => b.addEventListener('click', () => {
    $$('.dtabs button').forEach(x => x.classList.toggle('on', x === b));
    $$('.dash .dt').forEach(p => p.classList.toggle('dt-on', p.classList.contains(b.dataset.dt)));
  }));

  /* ---------- hide a card for this browser (getting started) ---------- */
  $$('[data-hide]').forEach(b => {
    const id = b.dataset.hide, el = document.getElementById(id);
    try { if (el && localStorage.getItem('sk-hide-' + id)) el.hidden = true; } catch (x) {}
    b.addEventListener('click', () => { if (el) el.hidden = true; try { localStorage.setItem('sk-hide-' + id, '1'); } catch (x) {} });
  });

  /* ---------- installable app: register the service worker ---------- */
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
  }
})();
