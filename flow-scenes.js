/* Local Oct21 moving-ink candidate. Original anonymous UI illustrations.
 * No Three.js, former rigs, assets, audio, or exported/global debug interfaces.
 * A single Canvas2D surface serves all nine clipped viewports.
 * Naturalistic motion: weight, arcs, asymmetric gestures and overlapping wings.
 * Accessible motion: pause/reduced motion always paints complete initial poses.
 */
(() => {
  'use strict';
  const INK = '#274d49', SEPIA = '#796556', SAGE = '#90aa97';
  const CLOTH = '#dce6dc', PAPER = '#fffefa', SKIN = '#d9c7b4';
  const FAINT = 'rgba(66,103,90,.23)', WASH = 'rgba(142,170,145,.13)';
  const GOLD = '#aa8a57', CORAL = '#bd8c7a', TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const phase = (t, period, offset = 0) => ((t / period + offset) % 1 + 1) % 1;
  const smooth = v => v * v * (3 - 2 * v);
  const softer = v => v * v * v * (v * (v * 6 - 15) + 10);
  const point = () => ({x: 0, y: 0});
  const set = (p, x, y) => { p.x = x; p.y = y; };

  function stroke(c, color = INK, width = 1.1) {
    c.strokeStyle = color;
    c.lineWidth = width;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.stroke();
  }
  function line(c, x, y, xx, yy, color = INK, width = 1.1) {
    c.beginPath(); c.moveTo(x, y); c.lineTo(xx, yy); stroke(c, color, width);
  }
  function oval(c, x, y, rx, ry, rotation, fill, outline = INK, width = .9) {
    c.beginPath(); c.ellipse(x, y, rx, ry, rotation, 0, TAU);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (outline) stroke(c, outline, width);
  }
  function bezier(c, x, y, a, b, d, e, xx, yy, color = INK, width = 1) {
    c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(a, b, d, e, xx, yy); stroke(c, color, width);
  }

  // Seven-head adult proportions: 21-unit head, approximately 150-unit height.
  // Every joint and prop endpoint is reused rather than allocated every frame.
  function human(shirt = CLOTH, trousers = '#c2ccc0') {
    return {
      x: 0, y: 0, lean: 0, tilt: 0, facing: 1, shirt, trousers,
      shoulder: [point(), point()], hip: [point(), point()],
      elbow: [point(), point()], hand: [point(), point()],
      knee: [point(), point()], foot: [point(), point()],
      footAngle: [0, 0], head: point(), helmet: false, vest: false,
    };
  }
  function pose(h, x, y, lean = 0, tilt = 0) {
    h.x = x; h.y = y; h.lean = lean; h.tilt = tilt;
    set(h.shoulder[0], x + lean - 10, y - 47 - tilt);
    set(h.shoulder[1], x + lean + 10, y - 47 + tilt);
    set(h.hip[0], x - 5.5, y);
    set(h.hip[1], x + 5.5, y + 1);
    set(h.head, x + lean + 1, y - 68);
    h.footAngle[0] = h.footAngle[1] = 0;
  }
  function solve(a, b, joint, first, second, bend) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const actual = Math.hypot(dx, dy) || .001;
    const d = clamp(actual, .1, first + second - .01);
    const nx = dx / actual, ny = dy / actual;
    const along = (first * first + d * d - second * second) / (2 * d);
    const height = Math.sqrt(Math.max(0, first * first - along * along)) * bend;
    set(joint, a.x + nx * along - ny * height, a.y + ny * along + nx * height);
  }
  function arm(h, i, x, y, bend = i ? -1 : 1) {
    set(h.hand[i], x, y);
    solve(h.shoulder[i], h.hand[i], h.elbow[i], 27, 26, bend);
  }
  function leg(h, i, x, y, bend = -1) {
    set(h.foot[i], x, y);
    solve(h.hip[i], h.foot[i], h.knee[i], 35, 35, bend);
  }
  // A filled, tapered garment contour, with a soft bend at the joint.
  // This is a silhouette with thickness, not a stroked stick skeleton.
  function limb(c, a, k, b, r0, r1, r2, fill) {
    const d0 = Math.hypot(k.x - a.x, k.y - a.y) || 1;
    const d1 = Math.hypot(b.x - k.x, b.y - k.y) || 1;
    const nx0 = -(k.y - a.y) / d0, ny0 = (k.x - a.x) / d0;
    const nx1 = -(b.y - k.y) / d1, ny1 = (b.x - k.x) / d1;
    const nx = (nx0 + nx1) * .5, ny = (ny0 + ny1) * .5;
    c.beginPath();
    c.moveTo(a.x + nx0 * r0, a.y + ny0 * r0);
    c.quadraticCurveTo(k.x + nx * r1, k.y + ny * r1, b.x + nx1 * r2, b.y + ny1 * r2);
    c.lineTo(b.x - nx1 * r2, b.y - ny1 * r2);
    c.quadraticCurveTo(k.x - nx * r1, k.y - ny * r1, a.x - nx0 * r0, a.y - ny0 * r0);
    c.closePath(); c.fillStyle = fill; c.fill(); stroke(c, INK, .95);
  }
  function shoe(c, p, facing, angle, boot = false) {
    c.save(); c.translate(p.x, p.y); c.rotate(angle); c.scale(facing, 1);
    c.beginPath(); c.moveTo(-4, -4); c.lineTo(3, -4);
    c.quadraticCurveTo(4, -1, 12, 1); c.quadraticCurveTo(15, 4, 10, 5);
    c.lineTo(-5, 5); c.closePath(); c.fillStyle = boot ? '#b2a28c' : PAPER;
    c.fill(); stroke(c, SEPIA, 1);
    line(c, -4, 3.5, 11, 3.5, SEPIA, .65);
    if (boot) { line(c, 1, -2, 6, 0, SEPIA, .7); line(c, 0, 0, 5, 2, SEPIA, .7); }
    c.restore();
  }
  function drawHuman(c, h, boots = false) {
    limb(c, h.hip[0], h.knee[0], h.foot[0], 4.4, 3.5, 2.1, h.trousers);
    shoe(c, h.foot[0], h.facing, h.footAngle[0], boots);
    limb(c, h.hip[1], h.knee[1], h.foot[1], 4.8, 3.7, 2.2, h.trousers);
    shoe(c, h.foot[1], h.facing, h.footAngle[1], boots);
    const sx = h.x + h.lean, sy = h.y - 47;
    c.beginPath(); c.moveTo(sx - 9, sy - h.tilt);
    c.quadraticCurveTo(sx - 14, sy + 17, h.x - 10, h.y - 1);
    c.quadraticCurveTo(h.x, h.y + 4, h.x + 11, h.y + 1);
    c.quadraticCurveTo(sx + 10, sy + 18, sx + 10, sy + h.tilt);
    c.quadraticCurveTo(sx + 3, sy - 4, sx - 9, sy - h.tilt);
    c.closePath(); c.fillStyle = h.shirt; c.fill(); stroke(c, INK, 1.1);
    // Side seam, collar and a fold suggest fabric rather than geometric toys.
    bezier(c, sx + 6, sy + 8, sx + 1, sy + 19, h.x + 7, h.y - 10, h.x + 6, h.y - 3, FAINT, .7);
    line(c, h.x - 9, h.y - 3, h.x + 10, h.y - 2, SEPIA, .6);
    line(c, sx - 3, sy - 7, sx - 3, sy - 1, INK, 1);
    line(c, sx + 4, sy - 7, sx + 3, sy, INK, 1);
    line(c, sx - 5, sy, sx, sy + 5, SEPIA, .8);
    line(c, sx + 4, sy, sx, sy + 5, SEPIA, .8);
    if (h.vest) {
      line(c, sx - 6, sy + 5, h.x - 5, h.y - 10, GOLD, 4.5);
      line(c, sx + 6, sy + 5, h.x + 5, h.y - 10, GOLD, 4.5);
      line(c, h.x - 7, h.y - 14, h.x + 7, h.y - 14, INK, 1.2);
    }
    c.save(); c.translate(h.head.x, h.head.y); c.rotate(h.tilt * .016); c.scale(h.facing, 1);
    // Long, small profile: brow/nose/chin, with no cartoon eyes or smiley face.
    c.beginPath(); c.moveTo(-5, -8);
    c.bezierCurveTo(-9, -1, -7, 7, -2, 10); c.lineTo(3, 10);
    c.quadraticCurveTo(7, 8, 6, 3); c.lineTo(9, 1); c.lineTo(6, -2);
    c.bezierCurveTo(7, -10, 0, -13, -5, -8);
    c.closePath(); c.fillStyle = PAPER; c.fill(); stroke(c, INK, .95);
    c.beginPath(); c.moveTo(-6, 1); c.bezierCurveTo(-11, -7, -2, -14, 5, -8);
    c.quadraticCurveTo(6, -4, 2, -4); c.quadraticCurveTo(-1, -6, -6, 1);
    c.fillStyle = SEPIA; c.fill();
    if (h.helmet) {
      c.beginPath(); c.moveTo(-9, -1); c.bezierCurveTo(-11, -16, 9, -17, 9, -2);
      c.quadraticCurveTo(0, -5, -9, -1); c.fillStyle = '#e9e4d3'; c.fill(); stroke(c, INK, 1);
      bezier(c, -7, -1, -5, 13, 4, 14, 7, -1, SEPIA, .7);
    }
    c.restore();
    for (let i = 0; i < 2; i++) {
      limb(c, h.shoulder[i], h.elbow[i], h.hand[i], 3.3, 2.6, 1.5, i ? h.shirt : '#e8ebe2');
      const a = Math.atan2(h.hand[i].y - h.elbow[i].y, h.hand[i].x - h.elbow[i].x);
      oval(c, h.hand[i].x, h.hand[i].y, 3.3, 2, a, SKIN, SEPIA, .7);
      line(c, h.hand[i].x - 1.5, h.hand[i].y + 1, h.hand[i].x + 1.5, h.hand[i].y + 2, SEPIA, .55);
    }
  }

  // Landscape strokes deliberately continue through both edges of each slot.
  function horizon(c, w, t, water = false) {
    const edge = w / 2 + 30;
    c.beginPath(); c.moveTo(-edge, 108);
    c.bezierCurveTo(-w * .27, 85, -w * .12, 116, w * .08, 99);
    c.bezierCurveTo(w * .29, 81, w * .40, 103, edge, 91);
    c.lineTo(edge, 116); c.bezierCurveTo(w * .23, 129, -w * .2, 112, -edge, 129);
    c.closePath(); c.fillStyle = WASH; c.fill();
    bezier(c, -edge, 108, -w * .20, 85, w * .14, 119, edge, 91, FAINT, .85);
    bezier(c, -edge, 127, -w * .10, 112, w * .27, 139, edge, 109, FAINT, .55);
    if (water) {
      for (let i = 0; i < 3; i++) {
        const y = 115 + i * 8, drift = Math.sin(t * .7 + i) * 8;
        bezier(c, -edge, y, -w * .25 + drift, y - 6, w * .24 + drift, y + 4, edge, y - 7, FAINT, .7);
      }
    }
  }
  function leaf(c, x, y, size, angle, color = WASH) {
    c.save(); c.translate(x, y); c.rotate(angle);
    c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-size * .45, -size * .25, -size * .21, -size * .8, 0, -size);
    c.bezierCurveTo(size * .32, -size * .58, size * .35, -size * .14, 0, 0);
    c.fillStyle = color; c.fill(); stroke(c, FAINT, .75);
    bezier(c, 0, 0, 1, -size * .24, -2, -size * .65, 0, -size * .87, FAINT, .6);
    c.restore();
  }
  function branch(c, x, y, scale, t) {
    c.save(); c.translate(x, y); c.scale(scale, scale);
    c.rotate(.045 * Math.sin(t * .8));
    bezier(c, 0, 0, 22, -25, 18, -62, 49, -99, SEPIA, 1.15);
    for (let i = 0; i < 6; i++) {
      const u = i / 5, xx = 5 + 32 * u, yy = -12 - 69 * u;
      const side = i % 2 ? 1 : -1;
      const a = side * (.68 + .07 * Math.sin(t * .9 + i * .35));
      leaf(c, xx, yy, 22 + 5 * Math.sin(i), a, i % 3 ? WASH : 'rgba(170,148,106,.14)');
    }
    c.restore();
  }
  function bird(c, x, y, s, t, bank = 0) {
    c.save(); c.translate(x, y); c.rotate(bank); c.scale(s, s);
    const flap = Math.sin(t * 4.2), follow = Math.sin(t * 4.2 - .38);
    // Narrow body, small head, forked tail, long articulated swallow wings.
    c.beginPath(); c.moveTo(-11, 1); c.bezierCurveTo(-2, -4, 7, -3, 10, 0);
    c.lineTo(16, 1); c.lineTo(10, 3); c.bezierCurveTo(5, 8, -4, 7, -11, 1);
    c.fillStyle = '#d6dfd3'; c.fill(); stroke(c, INK, .95);
    c.beginPath(); c.moveTo(-8, 1); c.lineTo(-28, -3 + follow * 2);
    c.lineTo(-17, 5); c.lineTo(-27, 12 + follow * 2); c.lineTo(-6, 5);
    c.fillStyle = '#e4e7dc'; c.fill(); stroke(c, INK, .8);
    for (let side = -1; side <= 1; side += 2) {
      const tipY = side * (22 + 18 * flap), tipX = -9 + follow * 4;
      c.beginPath(); c.moveTo(0, 2); c.quadraticCurveTo(-4, tipY * .57, tipX, tipY);
      c.quadraticCurveTo(-20, tipY * .53 + side * 4, -7, 5);
      c.fillStyle = side < 0 ? 'rgba(96,130,112,.28)' : '#e8ece2'; c.fill(); stroke(c, INK, .9);
      bezier(c, -3, 4, -9, tipY * .38, -11, tipY * .64, tipX, tipY, FAINT, .6);
    }
    c.restore();
  }
  function groundY(x) { return 104 - 7 * Math.sin(x * .008); }
  function board(c, x, y, length, width, color = CLOTH) {
    c.beginPath(); c.moveTo(x - length * .5, y + 3);
    c.bezierCurveTo(x - length * .38, y - width, x + length * .37, y - width - 3, x + length * .5, y - 5);
    c.quadraticCurveTo(x + length * .41, y + width * .35, x - length * .5, y + 3);
    c.fillStyle = color; c.fill(); stroke(c, INK, 1.1);
    bezier(c, x - length * .43, y + 1, x - 20, y - 2, x + 20, y - 3, x + length * .43, y - 5, FAINT, .7);
  }
  function paddleTool(c, x, y, dx, dy, color = CORAL) {
    line(c, x - 4, y, x + 4, y, SEPIA, 1.6);
    line(c, x, y, x + dx, y + dy, INK, 1.6);
    c.save(); c.translate(x + dx, y + dy); c.rotate(Math.atan2(dy, dx) - Math.PI / 2);
    c.beginPath(); c.moveTo(-2, -13); c.bezierCurveTo(-7, -9, -8, 8, -4, 15);
    c.quadraticCurveTo(0, 18, 5, 14); c.quadraticCurveTo(8, 0, 2, -13);
    c.closePath(); c.fillStyle = color; c.fill(); stroke(c, SEPIA, .9);
    line(c, 0, -10, 0, 12, 'rgba(255,255,255,.6)', .7); c.restore();
  }

  function bungeeDrop(t) {
    // 96-unit drop, broad elastic rebound, smaller settling dip, slow return.
    // Quintic joins have zero velocity and acceleration at each turning point,
    // including the loop seam. The phase offset preserves bodyY=33 at rest.
    const u = phase(t, 8.4, .15);
    if (u < .30) return 96 * softer(u / .30);
    if (u < .53) return 96 - 71 * softer((u - .30) / .23);
    if (u < .70) return 25 + 23 * softer((u - .53) / .17);
    return 48 * (1 - softer((u - .70) / .30));
  }

  function createViews() {
    const hiker = human('#d6e2d4', '#c7cabd');
    const sup = human('#e7eadf', '#becfc6'); sup.vest = true;
    const skier = human('#e3e7dd', '#b8cabe'); skier.vest = true;
    const jumper = human('#d9e4d8', '#bbc8bd'); jumper.helmet = true;
    const skydiver = human('#d9e4d8', '#d6d2c1');
    const dancer = human('#dbe6dc', '#bfcabd');
    const singer = human('#e5e6d9', '#becbc1');
    const rafters = [human('#e7eadf', '#becbbf'), human('#d9e4d8', '#d4cdbb')];
    rafters[0].helmet = rafters[1].helmet = rafters[0].vest = rafters[1].vest = true;
    return {
      nature(c, t, w, diagnostics) {
        horizon(c, w, t);
        branch(c, -w * .37, 108, 1.18, t);
        branch(c, w * .36, 106, .82, t + .4);
        // Each bird crosses the full composition, wrapping beyond the clip.
        for (let i = 0; i < 3; i++) {
          const u = phase(t, 15 + i * 3, .34 + i * .22);
          const x = -w / 2 - 65 + u * (w + 130);
          if (diagnostics) diagnostics.birdX[i] = x;
          const y = -48 + i * 28 + 27 * Math.sin(u * TAU + i * .6);
          const bank = .12 * Math.cos(u * TAU + i * .6);
          bird(c, x, y, 1.03 - i * .18, t + i * .65, bank);
        }
        bezier(c, -w / 2 - 12, 20, -w * .2, -19, w * .18, 73, w / 2 + 12, 25, FAINT, .6);
      },
      hike(c, t, w) {
        horizon(c, w, t);
        c.beginPath(); c.moveTo(-w / 2 - 20, 56);
        c.lineTo(-w * .31, 12); c.lineTo(-w * .24, 29); c.lineTo(-w * .1, -37);
        c.lineTo(w * .04, 27); c.lineTo(w * .15, 2); c.lineTo(w * .35, 61); c.lineTo(w / 2 + 15, 31);
        stroke(c, FAINT, .9);
        bezier(c, -w / 2 - 20, 115, -90, 78, 80, 119, w / 2 + 20, 83, SEPIA, .85);
        branch(c, -w * .40, 118, .47, t);
        branch(c, w * .39, 105, .56, t + 1);
        const span = w + 120, distance = t * 23;
        const x = ((-55 + distance + span / 2) % span + span) % span - span / 2;
        const step = phase(t, 1.65, .10), beat = Math.sin(step * TAU);
        pose(hiker, x, groundY(x) - 64 + 2.5 * Math.cos(step * TAU * 2), 6, beat * 1.1);
        for (let i = 0; i < 2; i++) {
          const u = (step + i * .5) % 1, stance = .62, stride = 23 * 1.65;
          let xx, lift = 0, swing = 0;
          if (u < stance) xx = 12 - stride * u;
          else { swing = (u - stance) / (1 - stance); xx = 12 - stride * stance + stride * stance * smooth(swing); lift = 18 * Math.sin(Math.PI * swing) ** 2; }
          leg(hiker, i, x + xx, groundY(x + xx) - 5 - lift);
          hiker.footAngle[i] = -.16 * Math.sin(TAU * swing);
        }
        // Pole plants for the support phase; its grip follows the same shaft.
        const pu = phase(t, 1.65, .60), recovery = clamp((pu - .62) / .38, 0, 1);
        const lift = 12 * Math.sin(Math.PI * recovery) ** 2;
        const tipX = x + 39 - 23 * 1.65 * Math.min(pu, .62) + 23 * 1.65 * .62 * smooth(recovery);
        const tipY = groundY(tipX) - lift, gripX = tipX - 12, gripY = tipY - 75;
        line(c, tipX, tipY, tipX - 15, tipY - 92, SEPIA, 1.4);
        line(c, gripX - 1.5, gripY - 9, gripX + 1, gripY + 3, INK, 2.7);
        // A fitted canvas backpack and rolled top, without toy-shaped geometry.
        c.beginPath(); c.moveTo(x - 8, hiker.y - 44);
        c.bezierCurveTo(x - 24, hiker.y - 52, x - 27, hiker.y - 30, x - 21, hiker.y - 14);
        c.lineTo(x - 8, hiker.y - 13); c.closePath(); c.fillStyle = '#d2b9a2'; c.fill(); stroke(c, SEPIA, 1);
        bezier(c, x - 22, hiker.y - 32, x - 17, hiker.y - 36, x - 12, hiker.y - 32, x - 9, hiker.y - 31, SEPIA, .65);
        arm(hiker, 0, x - 17, hiker.y - 8 - beat * 3, 1);
        arm(hiker, 1, gripX, gripY, -1);
        drawHuman(c, hiker, true);
        bezier(c, x - 7, hiker.y - 46, x + 11, hiker.y - 49, x + 12, hiker.y - 18, x - 2, hiker.y - 15, SEPIA, .85);
      },
      paddle(c, t, w) {
        horizon(c, w, t, true);
        board(c, 0, 98, 245, 9, '#e7e7d7');
        board(c, -7, 96, 100, 5, '#c8d9cb');
        line(c, 71, 90, 87, 95, SEPIA, .75); line(c, 85, 89, 72, 96, SEPIA, .75);
        const u = phase(t, 3.9), pull = u < .52, r = pull ? 0 : (u - .52) / .48;
        const lift = Math.sin(Math.PI * r) ** 2;
        const a = pull ? -.21 + .43 * smooth(u / .52) : .22 - .43 * smooth(r);
        const topX = 18, topY = -28 - lift * 25;
        const dx = 49 * Math.cos(a) - 135 * Math.sin(a), dy = 49 * Math.sin(a) + 135 * Math.cos(a);
        paddleTool(c, topX, topY, dx, dy, '#c8a38d');
        pose(sup, Math.sin(u * TAU) * 2, 23 + Math.sin(u * TAU) * 1.8, 2 + Math.sin(u * TAU) * 3, -1);
        leg(sup, 0, -12, 88); leg(sup, 1, 12, 87);
        arm(sup, 0, topX, topY, 1);
        arm(sup, 1, topX + dx * .36, topY + dy * .36, -1);
        drawHuman(c, sup);
        if (lift < .3) {
          bezier(c, topX + dx - 15, 108, topX + dx - 5, 102, topX + dx + 12, 103, topX + dx + 20, 107, SEPIA, .85);
          bezier(c, topX + dx - 18, 113, topX + dx, 109, topX + dx + 15, 113, topX + dx + 25, 110, FAINT, .7);
        }
        bezier(c, 13, 91, 30, 103, -50, 104, -88, 99, SEPIA, .65);
      },
      ski(c, t, w) {
        horizon(c, w, t, true);
        const lean = Math.sin(t * 1.35);
        board(c, -4, 98, 191, 3.8, '#d5c7aa');
        board(c, 13, 111, 195, 3.8, '#c5d9c8');
        // Two distinct bindings and heels remain visible above separate skis.
        line(c, -1, 91, 14, 91, INK, 2.3); line(c, 23, 104, 38, 104, INK, 2.3);
        pose(skier, -3 + lean * 4, 43 + Math.sin(t * 2.7) * 3, -5 + lean * 2, lean * 2);
        leg(skier, 0, 4, 91); leg(skier, 1, 27, 104);
        const hx = 26, hy = -9;
        line(c, hx - 8, hy - 2, hx + 10, hy + 3, INK, 2.1);
        line(c, hx - 8, hy - 2, 75, -3, SEPIA, .85);
        line(c, hx + 10, hy + 3, 75, -3, SEPIA, .85);
        bezier(c, 75, -3, 110, 0, w * .36, -8, w / 2 + 25, -19, SEPIA, 1.1);
        arm(skier, 0, hx - 5, hy - 1.17, 1); arm(skier, 1, hx + 6, hy + 1.89, -1);
        drawHuman(c, skier);
        for (let i = 0; i < 3; i++) {
          const shift = Math.sin(t * 1.8 + i * .7) * 8;
          bezier(c, -5, 102 + i * 6, -48, 108 + shift, -100, 109 + i * 10, -w / 2 - 10, 126 + i * 5, FAINT, 1.1 - i * .2);
        }
      },
      raft(c, t, w) {
        horizon(c, w, t, true);
        const rock = Math.sin(t * 1.25) * 2;
        c.save(); c.translate(0, rock);
        // Long, lightly crosshatched inflatable hull with two seated paddlers.
        c.beginPath(); c.moveTo(-127, 90); c.bezierCurveTo(-110, 77, 96, 73, 125, 87);
        c.bezierCurveTo(118, 117, -104, 130, -127, 90);
        c.fillStyle = '#e9e4cc'; c.fill(); stroke(c, SEPIA, 1.25);
        bezier(c, -122, 91, -50, 103, 62, 100, 122, 88, SEPIA, 1.2);
        bezier(c, -117, 96, -70, 122, 70, 117, 113, 94, FAINT, .9);
        for (let i = 0; i < 2; i++) {
          const h = rafters[i], side = i ? 1 : -1;
          const u = phase(t, 3.8, i * .18), sweep = Math.sin(u * TAU);
          pose(h, side * 40, 67, sweep * 4, side * 1.2);
          leg(h, 0, side * 40 + 22, 92, -1); leg(h, 1, side * 40 + 35, 97, -1);
          const xx = side * 59 + sweep * 4, yy = 9 - Math.max(0, -sweep) * 8;
          const dx = side * (30 + sweep * 9), dy = 108;
          paddleTool(c, xx, yy, dx, dy, '#b7cdb8');
          arm(h, 0, xx + dx * .12, yy + dy * .12, side);
          arm(h, 1, xx + dx * .34, yy + dy * .34, -side);
          drawHuman(c, h);
        }
        c.restore();
        bezier(c, -w / 2 - 10, 123, -102, 104, -46, 139, 18, 124, FAINT, 1);
      },
      sky(c, t, w) {
        const x = Math.sin(t * .55) * 15, y = Math.sin(t * .8) * 4;
        bezier(c, -w / 2 - 20, 43, -90, 14, 68, 69, w / 2 + 20, 20, FAINT, .8);
        bezier(c, -w / 2 - 20, -29, -80, -51, 80, 1, w / 2 + 20, -20, FAINT, .55);
        c.save(); c.translate(x, y);
        c.beginPath(); c.moveTo(-107, -73);
        c.bezierCurveTo(-91, -148, 89, -148, 107, -73);
        c.bezierCurveTo(64, -91, -62, -91, -107, -73);
        c.fillStyle = 'rgba(153,176,152,.23)'; c.fill(); stroke(c, INK, 1.15);
        for (let i = -2; i <= 2; i++) {
          const xx = i * 35;
          bezier(c, xx * .64, -125 + Math.abs(i) * 3, xx * .95, -113, xx, -94, xx, -82 + Math.abs(i) * 2, FAINT, .8);
          line(c, xx, -82 + Math.abs(i) * 2, Math.sign(i) * 11, 16, SEPIA, .65);
        }
        // Outer brake lines lead directly to the two hands and harness risers.
        line(c, -70, -78, -28, -5, SEPIA, .8);
        line(c, 70, -78, 27, -5, SEPIA, .8);
        line(c, -28, -5, -8, 13, SEPIA, 1.25);
        line(c, 27, -5, 8, 13, SEPIA, 1.25);
        pose(skydiver, 0, 55, -2, Math.sin(t * .7));
        leg(skydiver, 0, -14, 111, -1); leg(skydiver, 1, 25, 118, -1);
        arm(skydiver, 0, -28, -5, 1); arm(skydiver, 1, 27, -5, -1);
        drawHuman(c, skydiver);
        line(c, -8, 13, -7, 54, SEPIA, 1.7); line(c, 8, 13, 7, 54, SEPIA, 1.7);
        line(c, -7, 47, 7, 47, SEPIA, 1.8);
        c.restore();
      },
      bungee(c, t, w, diagnostics) {
        horizon(c, w, t);
        // Overhead bridge enters from the landscape, with visible rail and anchor.
        line(c, -w / 2 - 20, -111, 112, -111, SEPIA, 2.5);
        line(c, -w / 2 - 20, -118, 112, -118, SEPIA, .9);
        line(c, -w / 2 - 20, -140, 112, -140, SEPIA, .8);
        for (let x = -w / 2; x < 113; x += 29) line(c, x, -140, x, -112, FAINT, .9);
        const drop = bungeeDrop(t), bodyY = -15 + drop;
        const sway = 6 * Math.sin(TAU * phase(t, 8.4));
        const armLag = 9 * Math.tanh((bungeeDrop(t - .14) - drop) / 9);
        const legLag = 12 * Math.tanh((bungeeDrop(t - .23) - drop) / 12);
        // Hands and boots lag the torso through the catch and rebound.
        // All offsets are in the same scene space as the continuously attached cord.
        pose(jumper, 13 + sway, bodyY, -3 + armLag * .36, -2 + sway * .13);
        leg(jumper, 0, -6 + sway - legLag * .20, bodyY + 49 + legLag * .28, -1);
        leg(jumper, 1, 39 + sway + legLag * .12, bodyY + 66 + legLag * .12, -1);
        jumper.footAngle[0] = legLag * .025;
        jumper.footAngle[1] = -legLag * .018;
        arm(jumper, 0, -26 + sway - armLag * .20, bodyY - 29 + armLag * .60, 1);
        arm(jumper, 1, 49 + sway + armLag * .15, bodyY - 40 + armLag * .90, -1);
        if (diagnostics) diagnostics.bodyY = jumper.y;
        drawHuman(c, jumper);
        line(c, jumper.x - 9, jumper.y - 44, jumper.x - 6, jumper.y, SEPIA, 2);
        line(c, jumper.x + 7, jumper.y - 44, jumper.x + 6, jumper.y, SEPIA, 2);
        line(c, jumper.x - 9, jumper.y - 6, jumper.x + 9, jumper.y - 5, SEPIA, 2.2);
        oval(c, jumper.x + 6, jumper.y - 3, 3, 4, -.2, PAPER, GOLD, 1.3);
        const endX = jumper.x + 6, endY = jumper.y - 3, slack = 1 - drop / 96;
        bezier(c, 78, -111,
          78 + (endX - 78) * .33 + 22 * slack, -111 + (endY + 111) * .33,
          78 + (endX - 78) * .72 + 30 * slack, -111 + (endY + 111) * .72,
          endX, endY, GOLD, 1.7);
        oval(c, 78, -113, 3, 4, 0, PAPER, SEPIA, 1);
        // Short leg-loop contours remain attached to the illustrated thighs.
        line(c, jumper.hip[0].x - 4, jumper.hip[0].y + 8, jumper.knee[0].x - 2, jumper.knee[0].y - 17, SEPIA, 1.3);
        line(c, jumper.hip[1].x + 4, jumper.hip[1].y + 8, jumper.knee[1].x + 2, jumper.knee[1].y - 17, SEPIA, 1.3);
      },
      dance(c, t, w) {
        horizon(c, w, t);
        const u = phase(t, 4.6), sway = Math.sin(u * TAU), flow = Math.sin(u * TAU - .38);
        pose(dancer, sway * 7, 34 + Math.sin(u * TAU * 2) * 2, flow * 5, sway * 3);
        leg(dancer, 0, -16, 99, -1);
        leg(dancer, 1, 24 + 6 * sway, 98 - 15 * Math.max(0, sway), -1);
        dancer.footAngle[1] = -.25 * Math.max(0, sway);
        arm(dancer, 0, -40 + flow * 8, -18 + sway * 12, 1);
        arm(dancer, 1, 31 + flow * 5, -47 + sway * 10, -1);
        drawHuman(c, dancer);
        // Quiet fabric/rhythm lines echo the gesture and continue into the horizon.
        bezier(c, -w / 2 - 10, 104, -111, 94, -95, 56 + sway * 6, -62, 35, FAINT, .7);
        bezier(c, 56, 3 + flow * 5, 115, 45, 82, 116, w / 2 + 10, 111, FAINT, .8);
      },
      sing(c, t, w) {
        horizon(c, w, t);
        const gesture = Math.sin(t * 1.15), settle = Math.sin(t * .7);
        pose(singer, settle * 3, 34, settle * 2, -1);
        leg(singer, 0, -13, 99); leg(singer, 1, 15, 99);
        // A real microphone contour, stand and cable; fingers contact its handle.
        line(c, 56, 103, 56, -19, SEPIA, 1.1);
        line(c, 56, -19, 17, -34, SEPIA, 1.1);
        line(c, 43, 105, 68, 105, SEPIA, 1.1);
        line(c, 33, -13, 16, -35, INK, 3.1);
        oval(c, 14.4, -37, 4.5, 6.6, -.65, '#a7baab', INK, .9);
        line(c, 11, -38, 17, -35, FAINT, .6);
        bezier(c, 33, -13, 95, 30, 3, 104, w / 2 + 20, 109, FAINT, .8);
        arm(singer, 0, -34 + gesture * 9, 3 - gesture * 11, 1);
        arm(singer, 1, 27, -20.76, -1);
        drawHuman(c, singer);
        bezier(c, -w / 2 - 10, 112, -103, 121, -91, 61, -64, 47, FAINT, .65);
      },
    };
  }

  function init() {
    if (document.querySelector('canvas.flow-worlds')) return;
    const body = document.body, builders = createViews();
    const elements = document.querySelectorAll('.living-scene[data-scene]');
    const views = [];
    for (const el of elements) {
      const draw = builders[el.dataset.scene];
      if (draw) views.push({el, draw, rect: null, time: 0, diagnosticTime: -Infinity,
        diagnostics: el.dataset.scene === 'nature' ? {birdX: [0, 0, 0]} :
          el.dataset.scene === 'bungee' ? {bodyY: 0} : null,
        seamIn: el.dataset.scene === 'sky' ? 40 : 105,
        seamOut: el.dataset.scene === 'sky' ? 24 : 94});
    }
    if (!views.length) return;
    const canvas = document.createElement('canvas');
    const c = canvas.getContext('2d', {alpha: true});
    if (!c) return;
    canvas.className = 'flow-worlds living-webgl';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:3;';
    canvas.dataset.engine = 'canvas2d-ink';
    canvas.dataset.motion = 'hidden';
    canvas.dataset.activeViews = '0';
    body.append(canvas);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const nav = document.querySelector('.nav');
    let raf = 0, previous = 0, dirty = true, forceStatic = false;
    let width = 0, height = 0, ratio = 1, navBottom = 0;
    const allowed = () => body.classList.contains('entered') && !body.classList.contains('cinema-open') && !document.hidden;
    const stationary = () => forceStatic || reduced.matches || body.classList.contains('paused');

    function measure() {
      const nextWidth = innerWidth, nextHeight = innerHeight;
      const nextRatio = Math.min(devicePixelRatio || 1, 1.7);
      if (width !== nextWidth || height !== nextHeight || ratio !== nextRatio) {
        width = nextWidth; height = nextHeight; ratio = nextRatio;
        canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
      }
      for (const view of views) view.rect = view.el.getBoundingClientRect();
      const nr = nav?.getBoundingClientRect();
      navBottom = nr && nr.top <= 1 && nr.bottom > 0 ? Math.min(height, nr.bottom) : 0;
      dirty = false;
    }
    function clear() {
      c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, canvas.width, canvas.height);
    }
    function connections() {
      // Join neighboring compositions only through their empty horizontal gap.
      // Never draw connectors through stacked captions, text, or the sticky nav.
      c.save(); c.beginPath(); c.rect(0, navBottom, width, Math.max(0, height - navBottom)); c.clip();
      for (const left of views) {
        const a = left.rect;
        if (a.bottom <= navBottom || a.top >= height || a.width <= 0) continue;
        let next = null, nearest = 161;
        for (const right of views) {
          if (left === right) continue;
          const b = right.rect, gap = b.left - a.right;
          if (gap > 0 && gap < nearest && Math.abs(a.top - b.top) < Math.min(a.height, b.height) * .2) {
            nearest = gap; next = right;
          }
        }
        if (!next) continue;
        const b = next.rect;
        const scaleA = Math.min(a.height / 320, a.width / 460, 1.12);
        const scaleB = Math.min(b.height / 320, b.width / 460, 1.12);
        const yA = a.top + a.height / 2 + left.seamOut * scaleA;
        const yB = b.top + b.height / 2 + next.seamIn * scaleB;
        bezier(c, a.right, yA, a.right + nearest * .42, yA - 2,
          b.left - nearest * .42, yB + 2, b.left, yB, FAINT, .7);
      }
      c.restore();
    }
    function paint(dt, still) {
      if (dirty) measure();
      clear();
      c.setTransform(ratio, 0, 0, ratio, 0, 0);
      connections();
      let active = 0;
      for (const view of views) {
        if (still) { view.time = 0; view.diagnosticTime = -Infinity; view.el.dataset.poseProgress = '0.000'; }
        const r = view.rect;
        const left = Math.max(0, r.left), right = Math.min(width, r.right);
        const top = Math.max(navBottom, r.top), bottom = Math.min(height, r.bottom);
        if (right <= left || bottom <= top || r.width <= 0 || r.height <= 0) continue;
        active++;
        if (!still) view.time += dt;
        const scale = Math.min(r.height / 320, r.width / 460, 1.12);
        c.save(); c.beginPath(); c.rect(left, top, right - left, bottom - top); c.clip();
        c.translate(r.left + r.width / 2, r.top + r.height / 2);
        c.scale(scale, scale);
        view.draw(c, still ? 0 : view.time, r.width / scale, view.diagnostics);
        c.restore();
        view.el.dataset.rendered = 'true';
        view.el.dataset.poseProgress = (still ? 0 : view.time).toFixed(3);
        // Factual, DOM-visible samples of coordinates used by this paint.
        // Publish at about 10 Hz while moving, or once for a static paint.
        if (view.diagnostics && view.time + .000001 >= view.diagnosticTime + .1) {
          if (view.diagnostics.birdX) {
            const x = view.diagnostics.birdX;
            view.el.dataset.birdX = `[${x[0].toFixed(2)},${x[1].toFixed(2)},${x[2].toFixed(2)}]`;
          } else view.el.dataset.bodyY = view.diagnostics.bodyY.toFixed(2);
          view.el.dataset.diagnosticsTime = view.time.toFixed(3);
          view.diagnosticTime = view.time;
        }
      }
      canvas.dataset.activeViews = String(active);
      canvas.dataset.motion = still ? 'static' : active ? 'playing' : 'idle';
      return active;
    }
    function stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0; previous = 0;
    }
    function frame(now) {
      raf = 0;
      if (!allowed() || stationary()) { sync(); return; }
      const dt = previous ? clamp((now - previous) / 1000, 0, .05) : 0;
      previous = now;
      if (paint(dt, false)) raf = requestAnimationFrame(frame);
      else previous = 0;
    }
    function sync() {
      if (!allowed()) {
        stop(); canvas.style.visibility = 'hidden';
        canvas.dataset.motion = 'hidden'; canvas.dataset.activeViews = '0'; return;
      }
      canvas.style.visibility = 'visible';
      if (stationary()) { stop(); paint(0, true); }
      else if (!raf) { previous = 0; raf = requestAnimationFrame(frame); }
    }
    function invalidate() { dirty = true; sync(); }
    for (const view of views) {
      view.el.dataset.ready = 'true';
      delete view.el.dataset.rendered;
      view.el.dataset.poseProgress = '0.000';
    }
    new MutationObserver(invalidate).observe(body, {attributes: true, attributeFilter: ['class']});
    const resize = new ResizeObserver(invalidate);
    for (const view of views) resize.observe(view.el);
    if (nav) resize.observe(nav);
    const intersection = new IntersectionObserver(invalidate);
    for (const view of views) intersection.observe(view.el);
    addEventListener('scroll', invalidate, {passive: true});
    addEventListener('resize', invalidate, {passive: true});
    addEventListener('pageshow', invalidate);
    addEventListener('pagehide', stop);
    document.addEventListener('visibilitychange', sync);
    reduced.addEventListener('change', invalidate);
    // Review hook is an ordinary document event, never a private global API.
    // Dispatch without detail to hold time zero; {active:false} restores policy.
    document.addEventListener('vx-flow-static-review', event => {
      forceStatic = event.detail?.active !== false; invalidate();
    });
    if (document.fonts?.ready) document.fonts.ready.then(invalidate);
    sync();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once: true});
  else init();
})();
