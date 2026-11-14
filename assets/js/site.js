/* Sankruv Media — shared behaviour for every page.
   1. Scroll reveal, counters, progress bar, mobile menu
   2. Pointer polish: light that follows the cursor on panels, 3D tilt on posters
   3. Services prism (home page)
   4. Contact form (contact page)
   5. WebGL scene: six 3D models that morph into each other as you scroll. No libraries. */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hover = matchMedia('(hover:hover)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

  /* ---------- 1. menu, reveal, counters, progress ---------- */
  var burger = $('#burger'), links = $('#links');
  if (burger) burger.addEventListener('click', function () {
    var open = links.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
    burger.textContent = open ? 'Close' : 'Menu';
  });

  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target; el.classList.add('in'); io.unobserve(el);
      setTimeout(function () { el.style.transitionDelay = '0ms'; }, 1000);
    });
  }, { threshold: 0.1 }) : null;
  $$('.rv').forEach(function (el, i) {
    if (!io || reduce) { el.classList.add('in'); return; }
    el.style.transitionDelay = (i % 3) * 80 + 'ms';
    io.observe(el);
  });

  if (io && !reduce) {
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; cio.unobserve(e.target);
        var el = e.target, end = +el.dataset.count, t0 = performance.now();
        (function tick(t) {
          var k = Math.min(1, (t - t0) / 1500); k = 1 - Math.pow(1 - k, 4);
          el.textContent = Math.round(end * k);
          if (k < 1) requestAnimationFrame(tick);
        })(t0);
      });
    }, { threshold: 0.6 });
    $$('[data-count]').forEach(function (el) { cio.observe(el); });
  }

  var bar = $('#bar');
  function onScroll() {
    var max = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? scrollY / max : 0) + ')';
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- 2. pointer polish ---------- */
  var mx = 0, my = 0;
  if (hover && !reduce) {
    addEventListener('pointermove', function (e) {
      mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5;
      document.documentElement.style.setProperty('--px', mx.toFixed(3));
      document.documentElement.style.setProperty('--py', my.toFixed(3));
    }, { passive: true });
    $$('.panel,.pos,.face').forEach(function (c) {
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect();
        c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        c.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
    $$('.tilt').forEach(function (c) {
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.style.setProperty('--ry', (x - 0.5) * 9 + 'deg'); c.style.setProperty('--rx', (0.5 - y) * 8 + 'deg');
      });
      c.addEventListener('pointerleave', function () { c.style.setProperty('--ry', '0deg'); c.style.setProperty('--rx', '0deg'); });
    });
  }

  /* ---------- 3. services prism ---------- */
  var cube = $('#cube');
  if (cube) {
    var scene = $('#scene'), tabs = $$('.stab'), faces = $$('.face'), idx = 0, ang = 0, auto = null, sx = null;
    var setW = function () { if (cube.offsetWidth) cube.style.setProperty('--w', cube.offsetWidth + 'px'); };
    var go = function (i, user) {
      var n = tabs.length; i = ((i % n) + n) % n;
      var d = i - idx; if (d === 3) d = -1; if (d === -3) d = 1;
      ang -= d * 90; idx = i; cube.style.setProperty('--a', ang + 'deg');
      tabs.forEach(function (t, k) { t.classList.toggle('on', k === idx); t.setAttribute('aria-selected', k === idx); });
      faces.forEach(function (f, k) {
        if (k === idx) { f.removeAttribute('inert'); f.removeAttribute('aria-hidden'); }
        else { f.setAttribute('inert', ''); f.setAttribute('aria-hidden', 'true'); }
      });
      if (user && auto) { clearInterval(auto); auto = null; }
    };
    tabs.forEach(function (t, k) { t.addEventListener('click', function () { go(k, true); }); });
    scene.addEventListener('pointerdown', function (e) { sx = e.clientX; });
    addEventListener('pointerup', function (e) {
      if (sx === null) return; var dx = e.clientX - sx; sx = null;
      if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1), true);
    });
    addEventListener('resize', setW); setW(); go(0, false);
    if (!reduce) auto = setInterval(function () { if (!document.hidden) go(idx + 1, false); }, 4200);
  }

  /* ---------- 4. contact form ----------
     There is no server behind this form yet. It checks the fields, then offers to send the
     message through the visitor's own email app or WhatsApp. */
  var form = $('#lead');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var fn = $('#fn').value.trim(), em = $('#em').value.trim(), ms = $('#ms').value.trim(), err = $('#err');
    if (!fn) { err.textContent = 'Please add your first name.'; $('#fn').focus(); return; }
    if (!/^\S+@\S+\.\S+$/.test(em)) { err.textContent = 'Please enter a valid email address, like name@example.com.'; $('#em').focus(); return; }
    if (!ms) { err.textContent = 'Please write a short message about your project.'; $('#ms').focus(); return; }
    err.textContent = '';
    var sv = $('#sv').value, body = 'Name: ' + fn + ' ' + $('#ln').value.trim() + '\nEmail: ' + em + '\nService: ' + sv + '\n\n' + ms;
    $('#viaMail').href = 'mailto:contact@sankruvmedia.com?subject=' + encodeURIComponent('New enquiry: ' + sv) + '&body=' + encodeURIComponent(body);
    $('#ready').classList.add('show');
  });

  /* ---------- 5. WebGL scene ----------
     Each <section data-fx="x y scale split hue dim model"> describes where the 3D object sits
     while that section is in the middle of the screen, and which model it becomes:
       0 brand core (splits into torus, cube, gem, capsule = the four services)
       1 linked rings   2 stacked screens   3 gem   4 lattice sphere   5 signal rings */
  function scene3d() {
    var cv = $('#gl'); if (!cv) return;
    var gl = cv.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' });
    if (!gl) { cv.style.display = 'none'; return; }
    var vs = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    var fs = [
      'precision highp float;',
      'uniform vec2 R;uniform float T;uniform vec4 B;uniform vec2 M;uniform float D;uniform float Mo;',
      'vec3 C;float S;float SP;float MA;float MB;float MF;',
      'const vec3 TD=vec3(.05,.17,.18);const vec3 TM=vec3(.14,.45,.46);const vec3 TL=vec3(.28,.75,.75);',
      'mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}',
      'float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}',
      'float sdTorus(vec3 p,vec2 t){vec2 q=vec2(length(p.xz)-t.x,p.y);return length(q)-t.y;}',
      'float sdBox(vec3 p,vec3 b,float r){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.)-r;}',
      'float sdOcta(vec3 p,float s){p=abs(p);return (p.x+p.y+p.z-s)*.57735;}',
      'float sdCaps(vec3 p,float h,float r){p.y-=clamp(p.y,-h,h);return length(p)-r;}',
      /* 0: brand core + four service solids */
      'float m0(vec3 q){',
      ' float n=sin(q.x*2.1+T*.9)*sin(q.y*2.5+T*1.1)*sin(q.z*1.9+T*.7)+.5*sin(q.x*4.3-T*1.3)*sin(q.y*3.7+T*.6);',
      ' float d=length(q)-(1.-.45*SP)-n*.17;',
      ' if(SP>.01){float s=.1+.34*SP;float k=mix(.5,.1,SP);float a=T*.4;float rr=SP*1.85;vec3 o;vec3 w;',
      '  o=vec3(cos(a),sin(a*1.3)*.6,sin(a))*rr;w=q-o;w.xy*=rot(T*.7);w.yz*=rot(T*.5);d=smin(d,sdTorus(w,vec2(s*.95,s*.36)),k);',
      '  a+=1.5708;o=vec3(cos(a),sin(a*1.3+2.)*.6,sin(a))*rr;w=q-o;w.xz*=rot(T*.6);w.xy*=rot(T*.4);d=smin(d,sdBox(w,vec3(s*.62),s*.14),k);',
      '  a+=1.5708;o=vec3(cos(a),sin(a*1.3+4.)*.6,sin(a))*rr;w=q-o;w.xz*=rot(T*.8);d=smin(d,sdOcta(w,s*1.25)-.02,k);',
      '  a+=1.5708;o=vec3(cos(a),sin(a*1.3+6.)*.6,sin(a))*rr;w=q-o;w.xy*=rot(T*.5+.6);d=smin(d,sdCaps(w,s*.7,s*.48),k);}',
      ' return d;}',
      /* 1: two linked rings */
      'float m1(vec3 q){q.xz*=rot(T*.35);q.xy*=rot(.5);vec3 a=q-vec3(-.48,0.,0.);vec3 b=q-vec3(.48,0.,0.);b.yz*=rot(1.5708);',
      ' return min(sdTorus(a,vec2(.86,.2)),sdTorus(b,vec2(.86,.2)));}',
      /* 2: three stacked screens */
      'float m2(vec3 q){q.xz*=rot(.55+sin(T*.4)*.35);q.yz*=rot(-.25);',
      ' vec3 a=q-vec3(-.28,.26,-.4);vec3 b=q;vec3 c=q-vec3(.28,-.26,.4);',
      ' float d=sdBox(a,vec3(1.,.62,.03),.06);d=min(d,sdBox(b,vec3(1.,.62,.03),.06));return min(d,sdBox(c,vec3(1.,.62,.03),.06));}',
      /* 3: cut gem */
      'float m3(vec3 q){q.xz*=rot(T*.4);q.xy*=rot(.35);float o=sdOcta(q,1.5);vec3 w=q;w.xz*=rot(.7854);',
      ' return max(max(o,sdOcta(w,1.62)),length(q)-1.28)-.03;}',
      /* 4: lattice sphere */
      'float m4(vec3 q){q.xz*=rot(T*.25);q.xy*=rot(T*.15);vec3 g=q*4.6;',
      ' float gy=abs(dot(sin(g),cos(g.yzx)))/4.6-.05;return max(length(q)-1.2,gy)*.8;}',
      /* 5: signal: core + three rings */
      'float m5(vec3 q){float d=length(q)-.5-.04*sin(T*2.);vec3 w=q;w.xy*=rot(.5);w.yz*=rot(T*.5);d=min(d,sdTorus(w,vec2(.92,.055)));',
      ' w=q;w.xy*=rot(-.7);w.xz*=rot(T*.4);w.yz*=rot(1.1);d=min(d,sdTorus(w,vec2(1.28,.05)));',
      ' w=q;w.yz*=rot(T*.3+.4);d=min(d,sdTorus(w.xzy,vec2(1.62,.045)));return d;}',
      'float model(float id,vec3 q){if(id<.5)return m0(q);if(id<1.5)return m1(q);if(id<2.5)return m2(q);if(id<3.5)return m3(q);if(id<4.5)return m4(q);return m5(q);}',
      'float map(vec3 p){vec3 q=(p-C)/S;float d=model(MA,q);if(MF>.004)d=mix(d,model(MB,q),MF);return d*S;}',
      'void main(){',
      ' vec2 uv=(gl_FragCoord.xy*2.-R)/R.y;',
      ' C=vec3(B.x,B.y,0.);S=B.z;SP=B.w;MA=floor(Mo);MB=MA+1.;MF=smoothstep(0.,1.,fract(Mo));',
      ' vec3 ro=vec3(0.,0.,5.),rd=normalize(vec3(uv,-2.2));',
      ' float gy=gl_FragCoord.y/R.y;vec3 col=mix(vec3(.075,.085,.115),vec3(.022,.027,.05),gy);',
      ' vec2 pc=C.xy*.44;float hd=length(uv-pc)/S;',
      ' col+=TM*.11*exp(-hd*1.8)*D;',
      ' vec3 oc=ro-C;float bR=S*3.4;float b=dot(oc,rd);float h=b*b-(dot(oc,oc)-bR*bR);',
      ' if(h>0.){float sq=sqrt(h);float t=max(-b-sq,0.);float tm=-b+sq;bool hit=false;vec3 p=ro;float md=9.;',
      '  for(int i=0;i<80;i++){p=ro+rd*t;float d=map(p);md=min(md,d);if(d<.0025){hit=true;break;}t+=d*.75;if(t>tm)break;}',
      '  if(hit){vec2 e=vec2(.004,0.);',
      '   vec3 n=normalize(vec3(map(p+e.xyy)-map(p-e.xyy),map(p+e.yxy)-map(p-e.yxy),map(p+e.yyx)-map(p-e.yyx)));',
      '   vec3 v=-rd;float fr=pow(1.-max(dot(n,v),0.),3.);vec3 r=reflect(rd,n);',
      '   vec3 l=normalize(vec3(.5+M.x,.85-M.y,.6));float df=max(dot(n,l),0.);',
      '   float ao=clamp(map(p+n*.18)/.18,0.,1.);',
      '   vec3 c=mix(TD,TM,df);c=mix(c,TL,pow(df,3.)*.55);c*=.55+.45*ao;',
      '   c+=TL*fr*.5;',
      /* the polish: a soft studio light-box reflection plus a tight highlight */
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
    var U = {}; ['R', 'T', 'B', 'M', 'D', 'Mo'].forEach(function (n) { U[n] = gl.getUniformLocation(pr, n); });

    var fx = $$('[data-fx]').map(function (el) { return { el: el, v: el.dataset.fx.split(' ').map(Number) }; });
    var cur = fx.length ? fx[0].v.slice() : [2.3, 0.15, 1.2, 0, 0, 1, 0];
    var q = innerWidth < 760 ? 0.6 : 0.9, W = 0, H = 0, asp = 1, sm = [0, 0], last = 0, slow = 0;
    function size() {
      var s = Math.min(devicePixelRatio || 1, 2) * q;
      W = Math.max(2, Math.round(innerWidth * s)); H = Math.max(2, Math.round(innerHeight * s));
      cv.width = W; cv.height = H; gl.viewport(0, 0, W, H); asp = W / H;
    }
    size(); addEventListener('resize', size);
    function target() {
      var mid = innerHeight / 2, best = null, bd = 1e9;
      for (var i = 0; i < fx.length; i++) {
        var r = fx[i].el.getBoundingClientRect();
        var d = (mid >= r.top && mid <= r.bottom) ? 0 : Math.min(Math.abs(r.top - mid), Math.abs(r.bottom - mid));
        if (d < bd) { bd = d; best = fx[i].v; }
      }
      return best || cur;
    }
    function frame(ms) {
      if (!document.hidden) {
        var dtm = last ? Math.min(100, ms - last) : 16;
        var tg = target(), k = reduce ? 1 : 1 - Math.exp(-dtm * 0.0028), fit = Math.min(1, asp / 1.7), small = asp < 1;
        for (var i = 0; i < 7; i++) cur[i] += ((tg[i] || 0) - cur[i]) * k;
        sm[0] += (mx - sm[0]) * 0.05; sm[1] += (my - sm[1]) * 0.05;
        gl.uniform2f(U.R, W, H); gl.uniform1f(U.T, reduce ? 12.3 : ms / 1000);
        gl.uniform4f(U.B, cur[0] * fit * (small ? 0.55 : 1) + sm[0] * 0.35, cur[1] + (small ? 1.15 : 0) - sm[1] * 0.25, cur[2] * (small ? 0.5 : 0.74), cur[3]);
        gl.uniform2f(U.M, sm[0], sm[1]); gl.uniform1f(U.D, cur[5] * (small ? 0.7 : 1));
        gl.uniform1f(U.Mo, Math.max(0, Math.min(5, cur[6])));
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        /* drop the render resolution once if the device cannot keep up */
        if (last) { var dt = ms - last; if (dt > 45) slow++; else slow = Math.max(0, slow - 1); if (slow > 40 && q > 0.4) { q = 0.4; slow = 0; size(); } }
        last = ms;
      }
      if (!reduce) requestAnimationFrame(frame);
    }
    if (reduce) { frame(0); addEventListener('scroll', function () { frame(0); }, { passive: true }); }
    else requestAnimationFrame(frame);
  }
  try { scene3d(); } catch (e) { console.warn(e); }
})();
