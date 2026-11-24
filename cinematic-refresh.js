(() => {
  'use strict';
  // V EXPLORES — long-exposure light painting (v12, 2026-11-24: calmer ambient ribbons,
  // petal-arc click light with real drag, spring-follow pointer trail across the page).
  // Technique (after award-level WebGL trail sites): a moving light-head paints into a
  // persistent buffer that fades slowly, so streaks build and decay like a real long
  // exposure instead of being redrawn as lines. Clicks spawn light-painting gestures
  // at the exact click point. Reduced motion / Pause get one settled still frame.
  const body = document.body;
  const canvas = document.getElementById('longExposure');
  if (!body || !canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  // Full-page overlay for click light-painting (portfolio light moments + intro).
  const paint = document.createElement('canvas');
  paint.id = 'lightPaint';
  paint.setAttribute('aria-hidden', 'true');
  document.body.appendChild(paint);
  const pctx = paint.getContext('2d', { alpha: true });

  let width = 1, height = 1, dpr = 1, raf = 0, previous = 0, clock = 0;
  let pw = 1, ph = 1;
  let burstUntil = 0, wasRevealed = false;
  const pointer = { x: .68, y: .49, tx: .68, ty: .49, hx: .68, hy: .49 };   // hx/hy: the V's own centre
  const palette = [
    [17, 111, 82], [181, 128, 38], [20, 112, 132], [184, 82, 54],
    [52, 136, 92], [150, 104, 34], [30, 96, 120], [158, 86, 82]
  ];
  const ribbons = Array.from({ length: 5 }, (_, i) => ({
    t: i / 5,
    lane: (i - 2) / 2,
    slope: (i % 4 - 1.5) * .05,
    width: 1.15 + (i % 4) * .38,
    speed: .13 + (i % 4) * .028,
    color: palette[i % palette.length],
    hist: []
  }));
  const sparks = [];

  const tint = ([r, g, b], k) => [r + (255 - r) * k, g + (255 - g) * k, b + (255 - b) * k].map(Math.round);
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a.toFixed(3)})`;

  // Long exposure without buffer ghosts: every light-head keeps a short history of where it
  // has been; each frame the history is redrawn with exact age-based decay (bands of age,
  // one path per band per layer), so the streak builds and dies like film exposure.
  const EXPO = 3.4, SPARK_EXPO = 1.25, TRAIL_EXPO = .62, BANDS = 10;
  const LAYERS = [[7, .06, 0], [3.2, .18, 0], [1.25, .82, 0], [.42, 1, .74]];

  function drawTrail(cx, hist, color, expo, now, layer) {
    if (hist.length < 2) return;
    const [wk, ak, white] = LAYERS[layer];
    const col = white ? tint(color, white) : color;
    cx.lineCap = 'round'; cx.lineJoin = 'round';
    let i = 0;
    for (let b = 0; b < BANDS; b++) {
      const hi = expo * (1 - b / BANDS), lo = expo * (1 - (b + 1) / BANDS);
      // advance to first point in this band (oldest first)
      while (i < hist.length - 1 && now - hist[i].t > hi) i++;
      const start = Math.max(0, i - 1);
      let j = i, aSum = 0, wSum = 0, n = 0;
      cx.beginPath(); cx.moveTo(hist[start].x, hist[start].y);
      while (j < hist.length && now - hist[j].t >= lo) {
        cx.lineTo(hist[j].x, hist[j].y); aSum += hist[j].a; wSum += hist[j].w; n++; j++;
      }
      if (!n) continue;
      const age = (b + .5) / BANDS;                     // band 0 = oldest; 1 = newest
      const decay = Math.pow(Math.min(1, age / .4), 1.2);   // even exposure, dies only at the tail
      cx.strokeStyle = rgba(col, Math.min(1, ak * (aSum / n) * decay));
      cx.lineWidth = Math.max(.6, (wSum / n) * wk * (.55 + .45 * age));
      cx.stroke();
      i = j;
    }
  }

  function headGlow(cx, p, color, w, a) {
    const g = cx.createRadialGradient(p.x, p.y, 0, p.x, p.y, w * 6);
    g.addColorStop(0, rgba(tint(color, .8), .9 * a));
    g.addColorStop(.25, rgba(color, .35 * a));
    g.addColorStop(1, rgba(color, 0));
    cx.fillStyle = g; cx.beginPath(); cx.arc(p.x, p.y, w * 6, 0, Math.PI * 2); cx.fill();
  }

  function curvePoint(r, index, t) {
    const mobile = width < 720;
    const ax = width * pointer.x, ay = height * pointer.y;
    const reach = width * (mobile ? .4 : .19);
    const drift = Math.sin(clock * .23 + index * .8) * height * .018;
    const baseY = ay + r.lane * height * (mobile ? .065 : .13) + drift;   // phone: keep clear of the heading
    const x1 = ax - reach, x2 = ax + reach;
    const y1 = baseY - r.slope * height, y2 = baseY + r.slope * height;
    const arc = Math.sin(clock * .5 + index * .65) * height * (mobile ? .02 : .035);
    const c1x = ax - reach * .42, c2x = ax + reach * .36;
    const c1y = baseY + arc - height * (mobile ? .03 : .06), c2y = baseY - arc + height * (mobile ? .025 : .05);
    const u = 1 - t;
    return [
      u * u * u * x1 + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * x2,
      u * u * u * y1 + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * y2
    ];
  }

  function stepRibbons(dt, active, emit) {
    const boost = active ? 1.15 : 1;
    ribbons.forEach((r, i) => {
      r.hist = r.hist || [];
      if (emit) {
        r.t += dt * r.speed * boost;
        if (r.t >= 1) { r.t -= 1; r.hist.push({ break: true }); }
        const [x, y] = curvePoint(r, i, r.t);
        const env = Math.sin(Math.PI * r.t);
        r.hist.push({ x, y, t: clock, a: (active ? .82 : .6) * env,
          w: (r.width + (active ? .5 : 0)) * (.85 + .15 * Math.sin(clock * 1.3 + i)) });
      }
      while (r.hist.length && (r.hist[0].break || clock - r.hist[0].t > EXPO)) r.hist.shift();
    });
  }

  let dissolveAt = -1;                               // clock time the letter opened
  function renderRibbons() {
    ctx.clearRect(0, 0, width, height);
    if (dissolveAt >= 0) {
      const k = 1 - (clock - dissolveAt) / .6;
      if (k <= 0) { ribbons.forEach(r => { r.hist = []; }); dissolveAt = -1; return; }
      ctx.globalAlpha = k;
    }
    for (let L = 0; L < LAYERS.length; L++) ribbons.forEach(r => {
      // a wrap marker splits the history into two strokes
      let seg = [];
      for (const p of r.hist || []) { if (p.break) { drawTrail(ctx, seg, r.color, EXPO, clock, L); seg = []; } else seg.push(p); }
      drawTrail(ctx, seg, r.color, EXPO, clock, L);
    });
    ribbons.forEach(r => {
      const h = r.hist && r.hist[r.hist.length - 1];
      if (h && !h.break && h.a > .05) headGlow(ctx, h, r.color, h.w, h.a);
    });
    ctx.globalAlpha = 1;
  }

  function spawn(x, y, strength = 1) {
    strength *= Math.max(.42, Math.min(1, Math.min(innerWidth, innerHeight) / 860));   // phone-sized bursts
    const n = Math.round(4 + Math.min(1, strength));
    const base = Math.random() * Math.PI * 2;
    const dir = Math.random() < .5 ? -1 : 1;               // one shared curl direction: reads as one gesture
    const first = (Math.random() * palette.length) | 0;
    for (let i = 0; i < n; i++) {
      const ang = base + (i / n) * Math.PI * 2 + (Math.random() - .5) * .25;
      const speed = (250 + Math.random() * 110) * strength;
      sparks.push({
        x, y, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed,
        turn: dir * (1.0 + Math.random() * .7),
        life: 1, decay: .95 + Math.random() * .2,
        w: 1.15 + Math.random() * .75,
        color: palette[(first + i * 2) % palette.length],
        hist: [{ x, y, t: clock, a: .25, w: .8 }]
      });
    }
  }

  function stepSparks(dt) {
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      if (s.life > 0) {
        const cos = Math.cos(s.turn * dt), sin = Math.sin(s.turn * dt);
        const vx = s.vx * cos - s.vy * sin, vy = s.vx * sin + s.vy * cos;
        const drag = Math.pow(.11, dt);                    // strong air drag: quick out, soft settle
        s.vx = vx * drag; s.vy = vy * drag;
        s.turn *= Math.pow(.55, dt);                       // the curl relaxes, so arcs open instead of looping
        s.x += s.vx * dt; s.y += s.vy * dt;
        s.life -= s.decay * dt;
        const env = Math.max(0, Math.min(1, s.life * 2.4)) * .78;
        s.hist.push({ x: s.x, y: s.y, t: clock, a: env, w: s.w * (.5 + Math.max(0, s.life) * .6) });
      }
      while (s.hist.length && clock - s.hist[0].t > SPARK_EXPO) s.hist.shift();
      if (s.life <= 0 && !s.hist.length) sparks.splice(i, 1);
    }
  }

  // Pointer light trail (whole page, mouse only): the light-head is pulled toward the pointer by
  // a near-critically-damped spring, so it lags, eases and settles like a real hand-held light.
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const trail = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, live: false, awake: false, glow: 0, hist: [] };
  const SPRING = 120, DAMP = 2 * Math.sqrt(SPRING) * .92;
  function trailAllowed() {
    return fine.matches && !reduced.matches && !body.classList.contains('paused') && !body.classList.contains('cinema-open');
  }
  function stepTrail(dt) {
    while (trail.hist.length && clock - trail.hist[0].t > TRAIL_EXPO) trail.hist.shift();
    if (!trail.live) return;
    const ax = SPRING * (trail.tx - trail.x) - DAMP * trail.vx, ay = SPRING * (trail.ty - trail.y) - DAMP * trail.vy;
    trail.vx += ax * dt; trail.vy += ay * dt;
    trail.x += trail.vx * dt; trail.y += trail.vy * dt;
    const speed = Math.hypot(trail.vx, trail.vy);
    const want = Math.max(0, Math.min(1, (speed - 40) / 620));          // still pointer = no light
    trail.glow += (want - trail.glow) * (1 - Math.exp(-9 * dt));
    if (trail.glow > .02) trail.hist.push({ x: trail.x, y: trail.y, t: clock, a: .7 * trail.glow, w: 1.45 + 1.45 * trail.glow });
    while (trail.hist.length && clock - trail.hist[0].t > TRAIL_EXPO) trail.hist.shift();
    if (speed < 6 && Math.hypot(trail.tx - trail.x, trail.ty - trail.y) < 1 && !trail.hist.length) trail.awake = false;
  }
  function trailColor() {
    const f = (clock * .11) % palette.length, i = Math.floor(f), k = f - i;
    const a = palette[i], b = palette[(i + 1) % palette.length];
    return [0, 1, 2].map(c => Math.round(a[c] + (b[c] - a[c]) * k));
  }
  function wake() { if (!raf && shouldRun()) raf = requestAnimationFrame(frame); }
  addEventListener('pointermove', event => {
    if (event.pointerType && event.pointerType !== 'mouse') return;
    if (!trailAllowed()) return;
    trail.tx = event.clientX; trail.ty = event.clientY;
    if (!trail.live) { trail.live = true; trail.x = trail.tx; trail.y = trail.ty; trail.vx = trail.vy = 0; }
    trail.awake = true;
    wake();
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { trail.live = false; trail.awake = false; });

  function renderSparks() {
    pctx.clearRect(0, 0, pw, ph);
    if (trail.hist.length > 1) {
      const col = trailColor();
      for (let L = 0; L < LAYERS.length; L++) drawTrail(pctx, trail.hist, col, TRAIL_EXPO, clock, L);
      const h = trail.hist[trail.hist.length - 1];
      if (trail.glow > .08) headGlow(pctx, h, col, h.w * .55, h.a);
    }
    for (let L = 0; L < LAYERS.length; L++) sparks.forEach(s => drawTrail(pctx, s.hist, s.color, SPARK_EXPO, clock, L));
    sparks.forEach(s => { const h = s.hist[s.hist.length - 1]; if (h && s.life > 0) headGlow(pctx, h, s.color, h.w, h.a); });
  }

  function ambientAllowed() {
    return !document.hidden && !reduced.matches && !body.classList.contains('paused') &&
      !body.classList.contains('entered') && !body.classList.contains('intro-revealed');
  }
  function shouldRun() {
    if (document.hidden || reduced.matches || body.classList.contains('paused')) return false;
    return ambientAllowed() || hasLight() || (trail.awake && trailAllowed());
  }

  function frame(now) {
    raf = 0;
    if (!shouldRun()) { previous = 0; return; }
    // Real-time clock (capped at 0.25 s) and 1/48 s sub-steps: the exposure keeps its true
    // length and stays continuous even when a phone or a background window drops frames.
    const dtAll = previous ? Math.min((now - previous) / 1000, .25) : 1 / 60;
    previous = now;
    const steps = Math.max(1, Math.ceil(dtAll * 48)), dt = dtAll / steps;
    const ease = 1 - Math.exp(-2.0 * dt);              // eased inside every sub-step: no stair-steps in the streaks
    const active = body.classList.contains('exposure-burst') && now < burstUntil;
    const emit = ambientAllowed();
    for (let k = 0; k < steps; k++) {
      clock += dt;
      pointer.x += (pointer.tx - pointer.x) * ease; pointer.y += (pointer.ty - pointer.y) * ease;
      stepRibbons(dt, active, emit); stepSparks(dt); stepTrail(dt);
    }
    renderRibbons();
    renderSparks();
    raf = requestAnimationFrame(frame);
  }

  function hasLight() { return sparks.length > 0 || trail.hist.length > 0 || ribbons.some(r => r.hist && r.hist.length); }

  // A settled, readable still for Pause / reduced motion: expose ~3 s once, then hold.
  function still() {
    sparks.length = 0; trail.hist.length = 0; trail.awake = false;
    pctx.clearRect(0, 0, pw, ph);
    ribbons.forEach(r => { r.hist = []; });
    if (body.classList.contains('entered') || body.classList.contains('intro-revealed')) { ctx.clearRect(0, 0, width, height); return; }
    for (let k = 0; k < 96; k++) { clock += 1 / 30; stepRibbons(1 / 30, false, true); }
    renderRibbons();
  }

  function sync() {
    cancelAnimationFrame(raf); raf = 0; previous = 0;
    if (shouldRun()) raf = requestAnimationFrame(frame);
    else if (reduced.matches || body.classList.contains('paused')) still();
  }

  function resize() {
    const box = canvas.getBoundingClientRect();
    width = Math.max(1, box.width || innerWidth);
    height = Math.max(1, box.height || innerHeight);
    dpr = Math.min(devicePixelRatio || 1, 1.5, 1600 / width);
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    pw = innerWidth; ph = innerHeight;
    const pd = Math.min(devicePixelRatio || 1, 1.5, 1600 / pw);
    paint.width = Math.round(pw * pd); paint.height = Math.round(ph * pd);
    pctx.setTransform(pd, 0, 0, pd, 0, 0);
    anchorToV();
    sync();
  }

  // The trails are centred on the V itself (its position differs between phone and desktop).
  function anchorToV() {
    if (body.classList.contains('intro-revealed') || body.classList.contains('entered')) return;
    const mark = document.getElementById('logoEnter')?.getBoundingClientRect();
    const box = canvas.getBoundingClientRect();
    if (!mark || !mark.width || !box.width) return;
    pointer.tx = pointer.x = pointer.hx = Math.max(.08, Math.min(.92, (mark.left + mark.width / 2 - box.left) / box.width));
    pointer.ty = pointer.y = pointer.hy = Math.max(.12, Math.min(.88, (mark.top + mark.height / 2 - box.top) / box.height));
  }

  function startBurst() {
    burstUntil = performance.now() + 1500;
    body.classList.add('exposure-burst');
    sync();
    setTimeout(() => {
      if (performance.now() >= burstUntil && body.classList.contains('exposure-burst')) {
        body.classList.remove('exposure-burst');
        sync();
      }
    }, 1530);
  }

  document.querySelector('.portal')?.addEventListener('pointermove', event => {
    if (reduced.matches || body.classList.contains('paused')) return;
    if (!(event.target instanceof Element) || !event.target.closest('#logoEnter')) return;
    const box = canvas.getBoundingClientRect();
    // The ribbons lean toward the pointer (a third of the way) instead of jumping onto it.
    const px = (event.clientX - box.left) / box.width, py = (event.clientY - box.top) / box.height;
    pointer.tx = Math.max(.08, Math.min(.92, pointer.hx + (px - pointer.hx) * .33));
    pointer.ty = Math.max(.15, Math.min(.82, pointer.hy + (py - pointer.hy) * .33));
  }, { passive: true });

  // Click → light painting at the exact point. Never over reading text or form controls.
  const READABLE = 'p,blockquote,h1,h2,h3,li,.letter-scroll,.ink-letter,input,textarea,select,video,audio,nav,.nav';
  document.addEventListener('pointerdown', event => {
    if (reduced.matches || body.classList.contains('paused') || body.classList.contains('cinema-open')) return;
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const lightMoment = target.closest('[data-light] .light-art,.light-art');
    const onIntro = !body.classList.contains('entered') && target.closest('.portal');
    if (!lightMoment && !onIntro) return;
    if (!lightMoment && target.closest(READABLE)) return;
    if (!lightMoment && !target.closest('#logoEnter') && target.closest('button,a')) return;
    if (target.closest('#openHub') || (target.closest('#logoEnter') && body.classList.contains('intro-revealed'))) return;
    const onV = target.closest('#logoEnter');
    spawn(event.clientX, event.clientY, onV ? 1.1 : lightMoment ? .6 : .9);   // smaller on portfolio moments
    sync();
  }, { passive: true });

  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    const road = target?.closest('[data-light="bike"] .light-art,[data-light="car"] .light-art');
    if (road) {
      road.classList.remove('exposure-hit');
      void road.offsetWidth;
      road.classList.add('exposure-hit');
      setTimeout(() => road.classList.remove('exposure-hit'), 1250);
    }
  });

  new MutationObserver(() => {
    const revealed = body.classList.contains('intro-revealed');
    if (revealed && !wasRevealed) {
      dissolveAt = clock;
      startBurst();
      setTimeout(() => {
        if (!body.classList.contains('intro-revealed') || body.classList.contains('entered')) return;
        const mark = document.getElementById('logoEnter');
        const box = mark?.getBoundingClientRect();
        const canvasBox = canvas.getBoundingClientRect();
        if (box && canvasBox.width && canvasBox.height) {
          pointer.tx = Math.max(.08, Math.min(.92, (box.left + box.width / 2 - canvasBox.left) / canvasBox.width));
          pointer.ty = Math.max(.12, Math.min(.82, (box.top + box.height / 2 - canvasBox.top) / canvasBox.height));
          pointer.x = pointer.tx; pointer.y = pointer.ty;
          sync();
        }
      }, 1450);
    }
    if (!revealed && wasRevealed) setTimeout(anchorToV, 500);   // V back in place after replay
    wasRevealed = revealed;
    // Guard: classList.remove() rewrites the class attribute even when the token is absent,
    // which would re-fire this observer forever (the 20 Nov enter freeze).
    if (body.classList.contains('entered') && body.classList.contains('exposure-burst')) body.classList.remove('exposure-burst');
    sync();
  }).observe(body, { attributes: true, attributeFilter: ['class'] });
  reduced.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  addEventListener('resize', resize, { passive: true });
  resize();
})();
