/* Sign-in page: password peek, Caps Lock hint, busy state, India time, card tilt and the 3D brand core. */
(function () {
  'use strict';
  var $ = function (i) { return document.getElementById(i); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var p = $('p'), peek = $('peek');
  if (peek) peek.addEventListener('click', function () {
    var s = p.type === 'password'; p.type = s ? 'text' : 'password';
    peek.setAttribute('aria-pressed', s); peek.setAttribute('aria-label', s ? 'Hide password' : 'Show password'); p.focus();
  });
  var caps = function (e) { if (e.getModifierState && $('caps')) $('caps').classList.toggle('on', e.getModifierState('CapsLock')); };
  if (p) { p.addEventListener('keydown', caps); p.addEventListener('keyup', caps); }
  var card = $('card');
  card.addEventListener('submit', function (e) {
    var req = [].slice.call(card.querySelectorAll('input[required]')).filter(function (i) { return !i.value.trim(); });
    if (req.length) { e.preventDefault(); req[0].focus(); return; }
    var g = $('go'); g.classList.add('busy'); setTimeout(function () { g.disabled = true; }, 0);
  });
  var skew = (+document.body.dataset.now || 0) * 1000 - Date.now();
  function clock() { try { if ($('ist')) $('ist').textContent = new Date(Date.now() + skew).toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }); } catch (e) {} }
  clock(); setInterval(clock, 15000);
  var tips = ['Press Ctrl K anywhere to find a client', 'Every deadline shows on your dashboard', 'Website enquiries arrive as new leads', 'Open a client to see their whole history'], ti = 0;
  if ($('tipT') && !reduce) setInterval(function () { var el = $('tip'); el.style.opacity = 0; setTimeout(function () { ti = (ti + 1) % tips.length; $('tipT').textContent = tips[ti]; el.style.opacity = 1; }, 350); }, 4200);
  var mx = 0, my = 0;
  if (!reduce) document.addEventListener('pointermove', function (e) {
    mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5;
    var r = card.getBoundingClientRect(), x = (e.clientX - (r.left + r.width / 2)) / innerWidth, y = (e.clientY - (r.top + r.height / 2)) / innerHeight;
    card.style.setProperty('--ry', (x * 5).toFixed(2) + 'deg'); card.style.setProperty('--rx', (-y * 5).toFixed(2) + 'deg');
  });

  /* 3D brand core (same shape as the website hero) */
  var cv = $('core'), gl = cv && cv.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: false });
  if (!gl) return;
  var fs = ['precision highp float;uniform vec2 R;uniform float T;uniform vec3 C;uniform vec2 M;',
    'const vec3 TD=vec3(.05,.17,.18);const vec3 TM=vec3(.14,.45,.46);const vec3 TL=vec3(.28,.75,.75);',
    'float map(vec3 p){vec3 q=(p-vec3(C.xy,0.))/C.z;float n=sin(q.x*2.1+T*.9)*sin(q.y*2.5+T*1.1)*sin(q.z*1.9+T*.7)+.5*sin(q.x*4.3-T*1.3)*sin(q.y*3.7+T*.6);',
    ' float d=length(q)-1.-n*.17;for(int i=0;i<3;i++){float fi=float(i);float a=T*(.45+fi*.12)+fi*2.1;d=min(d,length(q-vec3(cos(a)*2.1,sin(a*.8+fi)*.7,sin(a)*2.1))-.065-.02*fi);}return d*C.z;}',
    'void main(){vec2 uv=(gl_FragCoord.xy*2.-R)/R.y;vec3 ro=vec3(0.,0.,5.),rd=normalize(vec3(uv,-2.2));float t=2.;float a=0.;vec3 col=vec3(0.);',
    ' for(int i=0;i<72;i++){vec3 p=ro+rd*t;float d=map(p);if(d<.003){vec2 e=vec2(.004,0.);vec3 n=normalize(vec3(map(p+e.xyy)-map(p-e.xyy),map(p+e.yxy)-map(p-e.yxy),map(p+e.yyx)-map(p-e.yyx)));',
    '  vec3 l=normalize(vec3(.5+M.x,.85-M.y,.6));float df=max(dot(n,l),0.);float fr=pow(1.-max(dot(n,-rd),0.),3.);vec3 r=reflect(rd,n);',
    '  col=mix(TD,TM,df);col=mix(col,TL,pow(df,3.)*.55);col+=TL*fr*.5;col+=vec3(.75,.95,.95)*smoothstep(.55,.95,r.y)*.16;col+=pow(max(dot(reflect(-l,n),-rd),0.),60.)*.55;a=1.;break;}',
    '  t+=d*.8;if(t>12.)break;}',
    ' gl_FragColor=vec4(col,a);}'].join('\n');
  function sh(t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : null; }
  var v = sh(gl.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'), f = sh(gl.FRAGMENT_SHADER, fs);
  if (!v || !f) return;
  var pr = gl.createProgram(); gl.attachShader(pr, v); gl.attachShader(pr, f); gl.linkProgram(pr); gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  var uR = gl.getUniformLocation(pr, 'R'), uT = gl.getUniformLocation(pr, 'T'), uC = gl.getUniformLocation(pr, 'C'), uM = gl.getUniformLocation(pr, 'M');
  var q = 0.85, W, H, sx = 0, sy = 0;
  function size() { var s = Math.min(devicePixelRatio || 1, 2) * q; W = Math.round(innerWidth * s); H = Math.round(innerHeight * s); cv.width = W; cv.height = H; gl.viewport(0, 0, W, H); }
  size(); addEventListener('resize', size);
  var last = 0, acc = 0, n = 0;
  function frame(ms) {
    var wide = innerWidth > 1100, asp = innerWidth / innerHeight, K = 5 / 2.2;
    var cx = wide ? (((innerWidth - 480) * 0.64) * 2 - innerWidth) / innerHeight * K : 0, cy = wide ? 0 : 1.2, s = wide ? 1.15 : (asp < 1 ? 0.7 : 0.9);
    if (document.body.classList.contains('setup')) { cx = asp > 1.2 ? -asp * K * 0.62 : 0; cy = asp > 1.2 ? -0.4 : 1.6; s = 0.8; }
    sx += (mx - sx) * .05; sy += (my - sy) * .05;
    gl.uniform2f(uR, W, H); gl.uniform1f(uT, reduce ? 10 : ms / 1000); gl.uniform3f(uC, cx + sx * .25, cy - sy * .2, s); gl.uniform2f(uM, sx, sy);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (last) { acc += ms - last; n++; if (acc > 1500) { if (acc / n > 34 && q > .35) { q *= .7; size(); } acc = 0; n = 0; } }
    last = ms;
    if (!reduce) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
