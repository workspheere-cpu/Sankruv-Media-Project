/* Sankruv Media: all behaviour for every page.
   1  header, menu, progress           6  reviews, ring, filters, blog search and preview
   2  word splitting and reveals       7  article contents and copy link
   3  scroll-scrubbed statements       8  contact brief (3 steps)
   4  service chapters, work reel      9  pointer: cursor ring, 3D tilt
   5  timelines, counters             10  WebGL scene: seven 3D models that morph and move into the layout */
(function () {
  'use strict';
  var d = document, html = d.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var narrow = matchMedia('(max-width: 900px)');
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || d).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var scrollFns = [], resizeFns = [];
  var onScroll = function (f) { scrollFns.push(f); };
  var onResize = function (f) { resizeFns.push(f); };

  /* ---------- 1. header, menu, progress ---------- */
  var hdr = $('#hdr'), bar = $('#bar'), lastY = scrollY, menuOpen = false;
  onScroll(function () {
    var y = scrollY, max = html.scrollHeight - innerHeight;
    if (hdr) {
      hdr.classList.toggle('scrolled', y > 30);
      if (!menuOpen) hdr.classList.toggle('hide', y > lastY && y > 400);
    }
    lastY = y;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
  });
  var burger = $('#burger'), mnav = $('#mnav');
  function setMenu(open) {
    menuOpen = open; d.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open); burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) { mnav.hidden = false; hdr.classList.remove('hide'); d.body.style.overflow = 'hidden'; }
    else { mnav.hidden = true; d.body.style.overflow = ''; }
  }
  if (burger) {
    burger.addEventListener('click', function () { setMenu(!menuOpen); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menuOpen) { setMenu(false); burger.focus(); } });
    $$('a', mnav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  }

  /* ---------- 2. word splitting and reveals ---------- */
  function splitWords(el) {
    var n = 0;
    (function walk(node) {
      [].slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var parts = c.textContent.split(/(\s+)/), frag = d.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(d.createTextNode(' ')); return; }
            var o = d.createElement('span'), i = d.createElement('span');
            o.className = 'wd'; i.textContent = p; i.style.setProperty('--i', n++); o.appendChild(i); frag.appendChild(o);
          });
          node.replaceChild(frag, c);
        } else if (c.nodeType === 1 && c.tagName !== 'BR') walk(c);
      });
    })(el);
    el.classList.add('split');
  }
  $$('.sw').forEach(splitWords);
  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target; el.classList.add('in'); io.unobserve(el);
      setTimeout(function () { el.style.transitionDelay = ''; }, 1400);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }) : null;
  $$('.rv,.sw').forEach(function (el) {
    if (!io || reduce) { el.classList.add('in'); return; }
    if (el.classList.contains('rv')) {
      var sib = el.parentElement ? [].indexOf.call(el.parentElement.children, el) : 0;
      el.style.transitionDelay = (sib % 4) * 90 + 'ms';
    }
    io.observe(el);
  });

  /* ---------- 3. scroll-scrubbed statements ---------- */
  $$('.scrub').forEach(function (el) {
    var words = el.textContent.trim().split(/\s+/), keys = /^(Mumbai\.|noticed,|remembered|chosen,|purpose|measuring)$/i;
    el.innerHTML = words.map(function (w) { return '<span class="sc' + (keys.test(w) ? ' k' : '') + '">' + w.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</span>'; }).join(' ');
    var spans = $$('.sc', el);
    onScroll(function () {
      var r = el.getBoundingClientRect(), p = reduce ? 1 : clamp((innerHeight * 0.88 - r.top) / (r.height + innerHeight * 0.3), 0, 1);
      var lit = Math.round(p * spans.length * 1.1);
      for (var i = 0; i < spans.length; i++) spans[i].classList.toggle('on', i < lit);
    });
  });

  /* ---------- 4. service chapters and the work reel ---------- */
  var rail = $$('.chap-rail button'), chaps = $$('.chapter');
  if (chaps.length) {
    rail.forEach(function (b) { b.addEventListener('click', function () { var t = d.getElementById(b.dataset.go); if (t) t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); }); });
    onScroll(function () {
      var mid = innerHeight / 2, act = -1;
      chaps.forEach(function (c, i) { var r = c.getBoundingClientRect(); if (r.top <= mid && r.bottom >= mid) act = i; });
      rail.forEach(function (b, i) { b.classList.toggle('on', i === act); });
    });
  }
  var hs = $('.hs');
  if (hs) {
    var track = $('.hs-track', hs), items = $$('.hs-item', hs), dist = 0;
    var layout = function () {
      if (narrow.matches) { hs.style.height = ''; track.style.transform = ''; return; }
      dist = Math.max(0, track.scrollWidth - innerWidth);
      hs.style.height = (innerHeight + dist) + 'px';
    };
    onResize(layout); layout();
    onScroll(function () {
      if (narrow.matches) return;
      var r = hs.getBoundingClientRect(), p = dist ? clamp(-r.top / dist, 0, 1) : 0;
      track.style.transform = 'translate3d(' + (-p * dist).toFixed(1) + 'px,0,0)';
      items.forEach(function (it) {
        var b = it.getBoundingClientRect(), c = (b.left + b.width / 2 - innerWidth / 2) / innerWidth;
        it.style.setProperty('--ry', (clamp(c, -1, 1) * -32).toFixed(2) + 'deg');
        it.style.setProperty('--tz', (-Math.abs(c) * 220).toFixed(1) + 'px');
      });
    });
  }

  /* ---------- 5. timelines and counters ---------- */
  $$('.tlw').forEach(function (w) {
    var line = $('.tl-line', w), steps = $$('.tl-step', w);
    onScroll(function () {
      var r = w.getBoundingClientRect(), p = reduce ? 1 : clamp((innerHeight * 0.62 - r.top) / r.height, 0, 1);
      line.style.setProperty('--p', p.toFixed(3));
      steps.forEach(function (s) { s.classList.toggle('on', reduce || s.getBoundingClientRect().top < innerHeight * 0.66); });
    });
  });
  if (io && !reduce) {
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; cio.unobserve(e.target);
        var el = e.target, end = +el.dataset.count, t0 = performance.now();
        (function tick(t) { var k = Math.min(1, (t - t0) / 1700); k = 1 - Math.pow(1 - k, 4); el.textContent = Math.round(end * k); if (k < 1) requestAnimationFrame(tick); })(t0);
      });
    }, { threshold: 0.6 });
    $$('[data-count]').forEach(function (el) { el.textContent = '0'; cio.observe(el); });
  }

  /* ---------- 6. reviews, ring, project filter, blog search and preview ---------- */
  var qs = $('#quotes');
  if (qs) {
    var figs = $$('.q', qs), dots = $$('.qd', qs), qi = 0, qt = null;
    var showQ = function (i, user) {
      qi = (i + figs.length) % figs.length;
      figs.forEach(function (f, k) { f.classList.toggle('on', k === qi); if (k === qi) f.removeAttribute('aria-hidden'); else f.setAttribute('aria-hidden', 'true'); });
      dots.forEach(function (b, k) { b.classList.toggle('on', k === qi); b.setAttribute('aria-pressed', k === qi); });
      if (user && qt) { clearInterval(qt); qt = null; }
    };
    dots.forEach(function (b, k) { b.addEventListener('click', function () { showQ(k, true); }); });
    if (!reduce) qt = setInterval(function () { if (!d.hidden) showQ(qi + 1); }, 7000);
  }
  var ring = $('#ring');
  if (ring) {
    var rw = $('#ringwrap'), ra = 0, dragX = null, moved = 0, paused = false, rl = 0;
    var setRa = function () { ring.style.setProperty('--ra', ra.toFixed(2) + 'deg'); };
    rw.addEventListener('pointerdown', function (e) { dragX = e.clientX; moved = 0; });
    addEventListener('pointermove', function (e) { if (dragX === null) return; var dx = e.clientX - dragX; dragX = e.clientX; moved += Math.abs(dx); ra += dx * 0.35; setRa(); }, { passive: true });
    addEventListener('pointerup', function () { dragX = null; });
    addEventListener('pointercancel', function () { dragX = null; });
    rw.addEventListener('click', function (e) { if (moved > 8) e.preventDefault(); }, true);
    rw.addEventListener('mouseenter', function () { paused = true; });
    rw.addEventListener('mouseleave', function () { paused = false; });
    $$('.rc', ring).forEach(function (c, i) { c.addEventListener('focus', function () { ra = -i * 45; setRa(); }); });
    if (!reduce) requestAnimationFrame(function spin(t) {
      var dt = rl ? Math.min(60, t - rl) : 16; rl = t;
      if (dragX === null && !paused && !d.hidden) { ra -= dt * 0.008; setRa(); }
      requestAnimationFrame(spin);
    });
  }
  var pf = $$('.pfilter button');
  pf.forEach(function (b) {
    b.addEventListener('click', function () {
      pf.forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
      $$('.case').forEach(function (c) { c.classList.toggle('off', b.dataset.f !== 'all' && c.dataset.tags.split(' ').indexOf(b.dataset.f) < 0); });
      runScroll();
    });
  });
  var prows = $('#prows');
  if (prows) {
    var q = $('#q'), cat = 'all', empty = $('#empty'), bf = $$('.bfilter button');
    var m = /[?&]cat=([\w-]+)/.exec(location.search); if (m) cat = m[1];
    var apply = function () {
      var term = (q.value || '').trim().toLowerCase(), shown = 0;
      $$('li', prows).forEach(function (li) {
        var ok = (cat === 'all' || li.dataset.cat === cat) && (!term || li.dataset.q.indexOf(term) > -1);
        li.hidden = !ok; if (ok) shown++;
      });
      bf.forEach(function (x) { x.classList.toggle('on', x.dataset.c === cat); x.setAttribute('aria-pressed', x.dataset.c === cat); });
      empty.hidden = shown > 0;
    };
    bf.forEach(function (b) { b.addEventListener('click', function () { cat = b.dataset.c; apply(); }); });
    q.addEventListener('input', apply); apply();
  }
  var peek = $('#peek');
  if (peek && fine && !reduce) {
    var px = 0, py = 0, tx = 0, ty = 0, pv = 0, on = false;
    $$('.prow').forEach(function (a) {
      a.addEventListener('mouseenter', function () { var c = $('.cover', a); if (c) { peek.innerHTML = c.outerHTML; on = true; peek.classList.add('on'); } });
      a.addEventListener('mouseleave', function () { on = false; peek.classList.remove('on'); });
    });
    addEventListener('pointermove', function (e) { tx = e.clientX + 200; ty = e.clientY; }, { passive: true });
    requestAnimationFrame(function loop() {
      var nx = px + (tx - px) * 0.14; pv = clamp((nx - px) * 0.6, -14, 14); px = nx; py += (ty - py) * 0.14;
      if (on || peek.classList.contains('on')) peek.style.transform = 'translate(' + px.toFixed(1) + 'px,' + py.toFixed(1) + 'px) translate(-50%,-50%) rotate(' + pv.toFixed(2) + 'deg)';
      requestAnimationFrame(loop);
    });
  }

  /* ---------- 7. article contents and copy link ---------- */
  var tocLinks = $$('.toc a');
  if (tocLinks.length) {
    var heads = tocLinks.map(function (a) { return d.getElementById(a.getAttribute('href').slice(1)); });
    onScroll(function () {
      var act = 0;
      heads.forEach(function (h, i) { if (h && h.getBoundingClientRect().top < innerHeight * 0.35) act = i; });
      tocLinks.forEach(function (a, i) { a.classList.toggle('on', i === act); });
    });
  }
  $$('.copy').forEach(function (b) {
    b.addEventListener('click', function () {
      var label = $('span', b), done = function () { label.textContent = 'Link copied'; setTimeout(function () { label.textContent = 'Copy link'; }, 2200); };
      if (navigator.clipboard) navigator.clipboard.writeText(b.dataset.url).then(done, function () { label.textContent = 'Copy failed'; });
    });
  });

  /* ---------- 8. contact brief ----------
     Without a server the brief becomes a ready-written WhatsApp message and email.
     When a backend exists, put its URL in the form's data-endpoint and the brief is sent there as JSON. */
  var form = $('#brief-form');
  if (form) {
    var steps = $$('.step', form), navLi = $$('.steps-nav li', form), cur = 0;
    var next = $('#fnext'), back = $('#fback'), send = $('#fsend'), err = $('#ferr'), fill = $('.bar2 i', form);
    var want = /[?&]service=(\w+)/.exec(location.search);
    if (want) { var box = $('input[data-key="' + want[1] + '"]', form); if (box) box.checked = true; }
    var go = function (i, focus) {
      cur = i;
      steps.forEach(function (s, k) { s.hidden = k !== i; s.classList.toggle('on', k === i); });
      navLi.forEach(function (li, k) { li.classList.toggle('on', k === i); li.classList.toggle('done', k < i); });
      fill.style.width = ((i + 1) / steps.length * 100) + '%';
      back.hidden = i === 0; next.hidden = i === steps.length - 1; send.hidden = i !== steps.length - 1;
      err.textContent = '';
      if (focus) { var first = $('input', steps[i]); if (first) first.focus({ preventScroll: true }); }
    };
    var valid = function () {
      if (cur === 0 && !$$('input[name="services"]:checked', form).length) { err.textContent = 'Choose at least one service, or pick "Not sure yet".'; return false; }
      if (cur === 1 && !$('input[name="timeline"]:checked', form)) { err.textContent = 'Choose when you would like to start.'; return false; }
      if (cur === 2) {
        var name = $('#f-name'), email = $('#f-email');
        [name, email].forEach(function (f) { f.removeAttribute('aria-invalid'); });
        if (!name.value.trim()) { name.setAttribute('aria-invalid', 'true'); name.focus(); err.textContent = 'Please enter your name.'; return false; }
        if (!/^\S+@\S+\.\S+$/.test(email.value.trim())) { email.setAttribute('aria-invalid', 'true'); email.focus(); err.textContent = 'Please enter a valid email address, like name@example.com.'; return false; }
      }
      return true;
    };
    next.addEventListener('click', function () { if (valid()) go(cur + 1, true); });
    back.addEventListener('click', function () { go(cur - 1, true); });
    form.addEventListener('submit', function (e) {
      e.preventDefault(); if (!valid()) return;
      var data = {
        services: $$('input[name="services"]:checked', form).map(function (x) { return x.value; }),
        timeline: ($('input[name="timeline"]:checked', form) || {}).value || '',
        name: $('#f-name').value.trim(), phone: $('#f-phone').value.trim(), email: $('#f-email').value.trim(),
        company: $('#f-company').value.trim(), message: $('#f-msg').value.trim(),
        website: ($('#f-web') || {}).value || ''
      };
      var text = 'Hello Sankruv Media, I would like a free quote.\n\nServices: ' + data.services.join(', ') + '\nTimeline: ' + data.timeline +
        '\nName: ' + data.name + (data.company ? '\nCompany: ' + data.company : '') + '\nEmail: ' + data.email + (data.phone ? '\nPhone: ' + data.phone : '') +
        (data.message ? '\n\nAbout the project:\n' + data.message : '');
      var finish = function () {
        $('#sum').textContent = text;
        $('#via-wa').href = 'https://wa.me/' + form.dataset.wa + '?text=' + encodeURIComponent(text);
        $('#via-mail').href = 'mailto:' + form.dataset.mail + '?subject=' + encodeURIComponent('New enquiry: ' + data.services.join(', ')) + '&body=' + encodeURIComponent(text);
        steps.forEach(function (s) { s.hidden = true; }); $('.fnav', form).hidden = true; err.textContent = '';
        var sent = $('#sent'); sent.hidden = false; sent.focus();
      };
      if (form.dataset.endpoint) {
        fetch(form.dataset.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
          .then(function (r) { if (!r.ok) throw r; $('#sent .d').textContent = 'Thank you, your brief is with us'; finish(); })
          .catch(function () { finish(); });
      } else finish();
    });
    $('#via-copy').addEventListener('click', function () {
      var t = $('span', this);
      if (navigator.clipboard) navigator.clipboard.writeText($('#sum').textContent).then(function () { t.textContent = 'Copied'; setTimeout(function () { t.textContent = 'Copy message'; }, 2200); });
    });
    go(0, false);
  }

  /* ---------- 9. pointer: cursor ring and 3D tilt ---------- */
  var mx = 0, my = 0;
  if (fine && !reduce) {
    var ring2 = $('#cursor'), cx = -100, cy = -100, ccx = -100, ccy = -100;
    addEventListener('pointermove', function (e) {
      cx = e.clientX; cy = e.clientY; mx = cx / innerWidth - 0.5; my = cy / innerHeight - 0.5;
      html.style.setProperty('--px', mx.toFixed(3)); html.style.setProperty('--py', my.toFixed(3));
      if (ring2) ring2.classList.toggle('on', e.pointerType === 'mouse');
    }, { passive: true });
    d.addEventListener('pointerover', function (e) { if (ring2) ring2.classList.toggle('big', !!e.target.closest('a,button,label.opt,summary,.ringwrap')); });
    d.documentElement.addEventListener('mouseleave', function () { if (ring2) ring2.classList.remove('on'); });
    if (ring2) requestAnimationFrame(function loop() {
      ccx += (cx - ccx) * 0.2; ccy += (cy - ccy) * 0.2;
      ring2.style.transform = 'translate(' + ccx.toFixed(1) + 'px,' + ccy.toFixed(1) + 'px)';
      requestAnimationFrame(loop);
    });
    $$('.tilt').forEach(function (c) {
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.style.setProperty('--ry', ((x - 0.5) * 22).toFixed(2) + 'deg'); c.style.setProperty('--rx', ((0.5 - y) * 18).toFixed(2) + 'deg');
      });
      c.addEventListener('pointerleave', function () { c.style.setProperty('--ry', '0deg'); c.style.setProperty('--rx', '0deg'); });
    });
  }

  /* ---------- touch feedback: ripple on what you press, a soft glow anywhere else ---------- */
  var RIP = '.btn,.tabbar a,.mn-quote,.mn-main a,.mn-svc a,.mn-acts a,.mn-topics a,.mn-post,.prow,.opt,.ch,.chips li,.pick a,.svc-rows a,.jump a,.pfilter button,.bfilter button,.faq-list summary,.chap-rail button,.rc,.hcall,#burger,.share a,.share button,.feat';
  if (!reduce) d.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse') return;
    var host = e.target.closest && e.target.closest(RIP);
    if (host) {
      if (host.classList.contains('fab')) host = $('.fab-b', host) || host;
      host.classList.add('rip-host');
      var r = host.getBoundingClientRect(), sz = Math.max(r.width, r.height) * 2.2, sp = d.createElement('span');
      sp.className = 'rip';
      sp.style.cssText = 'width:' + sz + 'px;height:' + sz + 'px;left:' + (e.clientX - r.left - sz / 2) + 'px;top:' + (e.clientY - r.top - sz / 2) + 'px';
      host.appendChild(sp); setTimeout(function () { sp.remove(); }, 650);
      if (navigator.vibrate && host.closest('.tabbar,.mnav')) { try { navigator.vibrate(6); } catch (x) {} }
    } else {
      var dot = d.createElement('span'); dot.className = 'tap-dot';
      dot.style.left = e.clientX + 'px'; dot.style.top = e.clientY + 'px';
      d.body.appendChild(dot); setTimeout(function () { dot.remove(); }, 600);
    }
  }, { passive: true });
  if (io && narrow.matches && !reduce) {
    var nio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var el = e.target; if (!e.isIntersecting) return; nio.unobserve(el);
        if (el.scrollWidth - el.clientWidth < 30) return;
        setTimeout(function () { el.scrollTo({ left: 48, behavior: 'smooth' }); setTimeout(function () { el.scrollTo({ left: 0, behavior: 'smooth' }); }, 520); }, 350);
      });
    }, { threshold: 0.9 });
    $$('.chips,.reasons,.jump,.pfilter,.bfilter').forEach(function (el) { nio.observe(el); });
  }

  /* ---------- scroll and resize loop ---------- */
  var ticking = false;
  function runScroll() { for (var i = 0; i < scrollFns.length; i++) scrollFns[i](); }
  addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; runScroll(); }); } }, { passive: true });
  addEventListener('resize', function () { resizeFns.forEach(function (f) { f(); }); runScroll(); });
  addEventListener('load', function () { resizeFns.forEach(function (f) { f(); }); runScroll(); });
  runScroll();

  /* ---------- 10. WebGL scene ----------
     Each element with data-fx="x y scale split hue dim model" describes the 3D object while that
     element is in the middle of the screen. With data-anchor the object moves into that element's
     box (data-anchor-m is used on narrow screens).
     Models: 0 brand core (splits into four service solids)  1 linked rings  2 stacked screens
             3 cut gem  4 lattice sphere  5 signal rings  6 camera lens */
  function scene3d() {
    var cv = $('#gl'); if (!cv) return;
    var gl = cv.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' });
    if (!gl) { cv.style.display = 'none'; return; }
    var vs = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    var fs = [
      'precision highp float;',
      'uniform vec2 R;uniform float T;uniform vec4 B;uniform vec2 M;uniform float D;uniform vec3 Mo;uniform float SY;',
      'vec3 C;float S;float SP;float MA;float MB;float MF;',
      'const vec3 TD=vec3(.05,.17,.18);const vec3 TM=vec3(.14,.45,.46);const vec3 TL=vec3(.28,.75,.75);',
      'mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}',
      'float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}',
      'float sdTorus(vec3 p,vec2 t){vec2 q=vec2(length(p.xz)-t.x,p.y);return length(q)-t.y;}',
      'float sdBox(vec3 p,vec3 b,float r){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.)-r;}',
      'float sdOcta(vec3 p,float s){p=abs(p);return (p.x+p.y+p.z-s)*.57735;}',
      'float sdCaps(vec3 p,float h,float r){p.y-=clamp(p.y,-h,h);return length(p)-r;}',
      'float sdCyl(vec3 p,float r,float h){vec2 d=abs(vec2(length(p.xy),p.z))-vec2(r,h);return min(max(d.x,d.y),0.)+length(max(d,0.));}',
      'float m0(vec3 q){',
      ' float n=sin(q.x*2.1+T*.9)*sin(q.y*2.5+T*1.1)*sin(q.z*1.9+T*.7)+.5*sin(q.x*4.3-T*1.3)*sin(q.y*3.7+T*.6);',
      ' float d=length(q)-(1.-.45*SP)-n*.17;',
      ' if(SP>.01){float s=.1+.34*SP;float k=mix(.5,.1,SP);float a=T*.4;float rr=SP*1.85;vec3 o;vec3 w;',
      '  o=vec3(cos(a),sin(a*1.3)*.6,sin(a))*rr;w=q-o;w.xy*=rot(T*.7);w.yz*=rot(T*.5);d=smin(d,sdTorus(w,vec2(s*.95,s*.36)),k);',
      '  a+=1.5708;o=vec3(cos(a),sin(a*1.3+2.)*.6,sin(a))*rr;w=q-o;w.xz*=rot(T*.6);w.xy*=rot(T*.4);d=smin(d,sdBox(w,vec3(s*.62),s*.14),k);',
      '  a+=1.5708;o=vec3(cos(a),sin(a*1.3+4.)*.6,sin(a))*rr;w=q-o;w.xz*=rot(T*.8);d=smin(d,sdOcta(w,s*1.25)-.02,k);',
      '  a+=1.5708;o=vec3(cos(a),sin(a*1.3+6.)*.6,sin(a))*rr;w=q-o;w.xy*=rot(T*.5+.6);d=smin(d,sdCaps(w,s*.7,s*.48),k);}',
      ' return d;}',
      'float m1(vec3 q){q.xz*=rot(T*.35);q.xy*=rot(.5);vec3 a=q-vec3(-.48,0.,0.);vec3 b=q-vec3(.48,0.,0.);b.yz*=rot(1.5708);',
      ' return min(sdTorus(a,vec2(.86,.2)),sdTorus(b,vec2(.86,.2)));}',
      'float m2(vec3 q){q.xz*=rot(.55+sin(T*.4)*.35);q.yz*=rot(-.25);',
      ' vec3 a=q-vec3(-.28,.26,-.4);vec3 c=q-vec3(.28,-.26,.4);',
      ' float d=sdBox(a,vec3(1.,.62,.03),.06);d=min(d,sdBox(q,vec3(1.,.62,.03),.06));return min(d,sdBox(c,vec3(1.,.62,.03),.06));}',
      'float m3(vec3 q){q.xz*=rot(T*.4);q.xy*=rot(.35);float o=sdOcta(q,1.5);vec3 w=q;w.xz*=rot(.7854);',
      ' return max(max(o,sdOcta(w,1.62)),length(q)-1.28)-.03;}',
      'float m4(vec3 q){q.xz*=rot(T*.25);q.xy*=rot(T*.15);vec3 g=q*4.6;',
      ' float gy=abs(dot(sin(g),cos(g.yzx)))/4.6-.05;return max(length(q)-1.2,gy)*.8;}',
      'float m5(vec3 q){float d=length(q)-.5-.04*sin(T*2.);vec3 w=q;w.xy*=rot(.5);w.yz*=rot(T*.5);d=min(d,sdTorus(w,vec2(.92,.055)));',
      ' w=q;w.xy*=rot(-.7);w.xz*=rot(T*.4);w.yz*=rot(1.1);d=min(d,sdTorus(w,vec2(1.28,.05)));',
      ' w=q;w.yz*=rot(T*.3+.4);d=min(d,sdTorus(w.xzy,vec2(1.62,.045)));return d;}',
      'float m6(vec3 q){q.xz*=rot(.55+sin(T*.45)*.35);q.yz*=rot(-.3+sin(T*.3)*.12);',
      ' float d=sdCyl(q,.92,.5)-.05;d=max(d,-(length(q-vec3(0.,0.,1.25))-.95));',
      ' d=min(d,length(q-vec3(0.,0.,.05))-.64);',
      ' vec3 w=q-vec3(0.,0.,.32);d=min(d,sdTorus(w.xzy,vec2(.96,.07)));',
      ' w=q-vec3(0.,0.,-.18);d=min(d,sdTorus(w.xzy,vec2(.96,.05)));return d;}',
      'float model(float id,vec3 q){if(id<.5)return m0(q);if(id<1.5)return m1(q);if(id<2.5)return m2(q);if(id<3.5)return m3(q);if(id<4.5)return m4(q);if(id<5.5)return m5(q);return m6(q);}',
      'float orb(vec3 q){float d=9.;for(int i=0;i<3;i++){float fi=float(i);float a=T*(.45+fi*.12)+fi*2.1;',
      ' vec3 o=vec3(cos(a)*2.1,sin(a*.8+fi)*.7,sin(a)*2.1);d=min(d,length(q-o)-.065-.02*fi);}return d;}',
      'float map(vec3 p){vec3 q=(p-C)/S;float d=model(MA,q);if(MF>.004)d=mix(d,model(MB,q),MF);return min(d,orb(q))*S;}',
      'float dust(vec2 u,float n,float seed){vec2 sc=u*n;vec2 g=floor(sc);float hs=fract(sin(dot(g+seed,vec2(127.1,311.7)))*43758.5453);',
      ' vec2 so=vec2(fract(hs*13.7),fract(hs*91.3))*.6+.2;return step(.86,hs)*smoothstep(.07,0.,length(fract(sc)-so))*(.45+.55*sin(T*1.3+hs*80.));}',
      'void main(){',
      ' vec2 uv=(gl_FragCoord.xy*2.-R)/R.y;',
      ' C=vec3(B.x,B.y,0.);S=B.z;SP=B.w;MA=Mo.x;MB=Mo.y;MF=Mo.z;',
      ' vec3 ro=vec3(0.,0.,5.),rd=normalize(vec3(uv,-2.2));',
      ' float gy=gl_FragCoord.y/R.y;vec3 col=mix(vec3(.075,.085,.115),vec3(.022,.027,.05),gy);',
      ' vec2 pc=C.xy*.44;float hd=length(uv-pc)/S;',
      ' col+=TM*.11*exp(-hd*1.8)*D;',
      ' col+=TM*.07*smoothstep(.2,1.,sin(uv.x*1.3+uv.y*2.2+T*.12)*.5+.5)*smoothstep(-.2,1.,uv.y)*smoothstep(-1.5,1.5,uv.x);',
      ' col+=TL*dust(uv+vec2(T*.006,SY*.22),9.,1.)*.42+TM*dust(uv+vec2(-T*.004,SY*.1),15.,7.)*.5;',
      ' if(rd.y<-.03){float tf=(-2.45-ro.y)/rd.y;vec3 fp=ro+rd*tf;vec2 gp=vec2(fp.x,fp.z-T*.35-SY*2.5)*.6;',
      '  vec2 gg=abs(fract(gp)-.5);float w=.012+tf*.0016;float ln=smoothstep(.5-w,.5,max(gg.x,gg.y));',
      '  float fade=exp(-tf*.075)*smoothstep(-.03,-.3,rd.y);col+=TM*ln*.5*fade;',
      '  vec2 dm=fp.xz-vec2(C.x,0.);col+=TL*.2*exp(-dot(dm,dm)*.22/(S*S))*fade*D;}',
      ' vec3 oc=ro-C;float bR=S*3.4;float b=dot(oc,rd);float h=b*b-(dot(oc,oc)-bR*bR);',
      ' if(h>0.){float sq=sqrt(h);float t=max(-b-sq,0.);float tm=-b+sq;bool hit=false;vec3 p=ro;float md=9.;',
      '  for(int i=0;i<80;i++){p=ro+rd*t;float d=map(p);md=min(md,d);if(d<.0025){hit=true;break;}t+=d*.75;if(t>tm)break;}',
      '  if(hit){vec2 e=vec2(.004,0.);',
      '   vec3 n=normalize(vec3(map(p+e.xyy)-map(p-e.xyy),map(p+e.yxy)-map(p-e.yxy),map(p+e.yyx)-map(p-e.yyx)));',
      '   vec3 v=-rd;float fr=pow(1.-max(dot(n,v),0.),3.);vec3 r=reflect(rd,n);',
      '   vec3 l=normalize(vec3(.5+M.x,.85-M.y,.6));float df=max(dot(n,l),0.);',
      '   float ao=clamp(map(p+n*.18*S)/(.18*S),0.,1.);',
      '   vec3 c=mix(TD,TM,df);c=mix(c,TL,pow(df,3.)*.55);c*=.55+.45*ao;',
      '   c+=TL*fr*.5;',
      '   c+=vec3(.75,.95,.95)*smoothstep(.55,.95,r.y)*.16*(.4+.6*fr);',
      '   c+=pow(max(dot(reflect(-l,n),v),0.),60.)*.55;',
      '   c+=TL*pow(max(dot(n,normalize(vec3(-.8,-.5,.3))),0.),3.)*.12;',
      '   col=mix(col,c,D*.45+.55);}',
      '  else{col+=TL*exp(-md*42./S)*.22*D;}}',
      ' col=pow(col,vec3(.95));',
      ' gl_FragColor=vec4(col,1.);}'].join('\n');
    function sh(t, s) {
      var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o);
      if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(o)); return null; }
      return o;
    }
    var a = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs);
    if (!a || !f) { cv.style.display = 'none'; return; }
    var pr = gl.createProgram(); gl.attachShader(pr, a); gl.attachShader(pr, f); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { cv.style.display = 'none'; return; }
    gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var U = {}; ['R', 'T', 'B', 'M', 'D', 'Mo', 'SY'].forEach(function (n) { U[n] = gl.getUniformLocation(pr, n); });

    var fx = $$('[data-fx]').map(function (el) { return { el: el, v: el.dataset.fx.split(' ').map(Number), a: el.dataset.anchor, am: el.dataset.anchorM }; });
    var q = innerWidth < 760 ? 0.55 : 0.9, W = 0, H = 0, asp = 1, sm = [0, 0], last = 0, acc = 0, nfr = 0;
    var cur = null, mFrom = 0, mTo = 0, mT = 1;
    function size() {
      var s = Math.min(devicePixelRatio || 1, 2) * q;
      W = Math.max(2, Math.round(innerWidth * s)); H = Math.max(2, Math.round(innerHeight * s));
      cv.width = W; cv.height = H; gl.viewport(0, 0, W, H); asp = W / H;
    }
    size(); addEventListener('resize', size);
    var K = 5 / 2.2; /* world units per unit of height-normalised screen space on the z=0 plane */
    var EXT = [1.15, 1.45, 1.25, 1.3, 1.2, 1.7, 1.05]; /* how far each model reaches from its centre */
    function anchorOf(item) {
      var sel = (narrow.matches && item.am) ? item.am : item.a; if (!sel || sel === 'none') return null;
      var el = item.el.querySelector(sel) || d.querySelector(sel); if (!el) return null;
      var r = el.getBoundingClientRect(); if (!r.width || !r.height) return null;
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      var ext = item.v[6] ? EXT[item.v[6]] : EXT[0] + (item.v[3] || 0) * 1.25;
      return [(2 * cx - innerWidth) / innerHeight * K, (innerHeight - 2 * cy) / innerHeight * K, Math.min(r.width, r.height) / innerHeight * K / ext];
    }
    function target() {
      var mid = innerHeight / 2, best = null, bd = 1e9;
      for (var i = 0; i < fx.length; i++) {
        var r = fx[i].el.getBoundingClientRect();
        if (!r.height) continue;
        var dd = (mid >= r.top && mid <= r.bottom) ? 0 : Math.min(Math.abs(r.top - mid), Math.abs(r.bottom - mid));
        if (dd <= bd) { bd = dd; best = fx[i]; }
      }
      if (!best) return null;
      var v = best.v, an = anchorOf(best), fit = Math.min(1, asp / 1.7), small = asp < 1;
      var pos = an || [v[0] * fit * (small ? 0.55 : 1), v[1] + (small ? 1.15 : 0), v[2] * (small ? 0.5 : 0.74)];
      return { pos: pos, split: v[3] || 0, dim: (v[5] == null ? 1 : v[5]) * (small && !an ? 0.7 : 1), model: v[6] || 0, anchored: !!an };
    }
    function frame(ms) {
      if (!d.hidden) {
        var dt = last ? Math.min(100, ms - last) : 16, tg = target();
        if (tg) {
          if (!cur) { cur = tg.pos.concat([tg.split, tg.dim]); mFrom = mTo = tg.model; }
          var k = reduce ? 1 : 1 - Math.exp(-dt * 0.0028), kp = reduce ? 1 : 1 - Math.exp(-dt * (tg.anchored ? 0.011 : 0.0028));
          for (var i = 0; i < 3; i++) cur[i] += (tg.pos[i] - cur[i]) * kp;
          cur[3] += (tg.split - cur[3]) * k; cur[4] += (tg.dim - cur[4]) * k;
          if (tg.model !== mTo) { mFrom = (mT < 0.5) ? mFrom : mTo; mTo = tg.model; mT = reduce ? 1 : 0; }
          mT = Math.min(1, mT + dt / 900);
        }
        if (cur) {
          sm[0] += (mx - sm[0]) * 0.05; sm[1] += (my - sm[1]) * 0.05;
          var e = mT * mT * (3 - 2 * mT);
          gl.uniform2f(U.R, W, H); gl.uniform1f(U.T, reduce ? 12.3 : ms / 1000);
          gl.uniform4f(U.B, cur[0] + sm[0] * 0.18, cur[1] - sm[1] * 0.14, Math.max(0.05, cur[2]), cur[3]);
          gl.uniform2f(U.M, sm[0], sm[1]); gl.uniform1f(U.D, cur[4]);
          gl.uniform3f(U.Mo, mFrom, mTo, e); gl.uniform1f(U.SY, scrollY / Math.max(1, innerHeight));
          gl.drawArrays(gl.TRIANGLES, 0, 3);
        }
        /* every 1.5 s, lower the render resolution if frames are taking too long (down to 30%) */
        if (last) { acc += dt; nfr++; if (acc > 1500) { if (acc / nfr > 34 && q > 0.31) { q = Math.max(0.3, q * 0.7); size(); } acc = 0; nfr = 0; } }
        last = ms;
      }
      if (!reduce) requestAnimationFrame(frame);
    }
    if (reduce) { frame(0); addEventListener('scroll', function () { frame(0); }, { passive: true }); addEventListener('resize', function () { frame(0); }); }
    else requestAnimationFrame(frame);
  }
  /* ---------- 11. phone extras: why-us cycle, auto-playing work reel, moving service chips ---------- */
  (function () {
  var mob = matchMedia('(max-width: 760px)').matches;
  var inView = function (el, cb) {
    if (!('IntersectionObserver' in window)) { cb(true); return; }
    new IntersectionObserver(function (es) { es.forEach(function (e) { cb(e.isIntersecting); }); }, { threshold: 0.35 }).observe(el);
  };
  if (mob) {
    $$('.reasons').forEach(function (ul) {
      var lis = $$('li', ul); if (!lis.length) return;
      var box = d.createElement('div'); box.className = 'why-detail'; box.setAttribute('aria-live', 'polite');
      box.innerHTML = '<div><p><b></b><span></span></p></div>';
      ul.parentNode.insertBefore(box, ul.nextSibling);
      var i = -1, timer = 0, seen = false, hold = 0;
      var show = function (n) {
        lis.forEach(function (li, k) { li.classList.toggle('on', k === n); });
        box.classList.remove('open');
        setTimeout(function () {
          $('b', box).textContent = $('h3', lis[n]).textContent;
          $('span', box).textContent = $('p', lis[n]).textContent;
          box.classList.add('open');
        }, i < 0 ? 0 : 260);
        i = n;
      };
      var tick = function () { if (seen && Date.now() > hold) show((i + 1) % lis.length); };
      lis.forEach(function (li, k) {
        li.tabIndex = 0;
        li.addEventListener('click', function () { hold = Date.now() + 9000; show(k); });
      });
      inView(ul, function (v) { seen = v; if (v && i < 0) show(0); if (v && !timer && !reduce) timer = setInterval(tick, 2800); });
    });

    var reel = $('.hs-track');
    if (reel) {
      var cards = $$('.hs-item', reel), dots = d.createElement('div'), cur = 0, rHold = 0, rSeen = false;
      dots.className = 'hs-dots'; dots.setAttribute('aria-hidden', 'true');
      dots.innerHTML = cards.map(function () { return '<i></i>'; }).join('');
      reel.parentNode.insertBefore(dots, reel.nextSibling);
      var mark = function (n) {
        cur = n;
        cards.forEach(function (c, k) { c.classList.toggle('cur', k === n); });
        $$('i', dots).forEach(function (t, k) { t.classList.toggle('on', k === n); });
      };
      mark(0);
      reel.addEventListener('scroll', function () {
        var w = cards[0].offsetWidth + 12;
        var n = clamp(Math.round(reel.scrollLeft / w), 0, cards.length - 1);
        if (n !== cur) mark(n);
      }, { passive: true });
      ['touchstart', 'pointerdown', 'wheel'].forEach(function (ev) { reel.addEventListener(ev, function () { rHold = Date.now() + 7000; }, { passive: true }); });
      inView(reel, function (v) { rSeen = v; });
      if (!reduce) setInterval(function () {
        if (!rSeen || Date.now() < rHold || d.hidden) return;
        var n = (cur + 1) % cards.length;
        reel.scrollTo({ left: cards[n].offsetLeft - cards[0].offsetLeft, behavior: 'smooth' });
      }, 3400);
    }

    if (!reduce) $$('.chapter .chips').forEach(function (ul) {
      var orig = $$('li', ul); if (orig.length < 2) return;
      orig.forEach(function (li) { var c = li.cloneNode(true); c.setAttribute('aria-hidden', 'true'); ul.appendChild(c); });
      var w = $$('li', ul)[orig.length].offsetLeft - orig[0].offsetLeft;
      ul.style.setProperty('--w', w + 'px');
      ul.style.setProperty('--dur', Math.max(10, w / 32).toFixed(1) + 's');
      ul.classList.add('marq-on');
    });
  }
  })();

  try { scene3d(); } catch (e) { console.warn(e); }
})();
