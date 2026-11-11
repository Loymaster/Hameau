'use strict';
/* ===== Hameau — rendu de la scène, lumières et particules ===== */
const R = (() => {
  const W = SIM.W, H = SIM.H, X = SIM.EXT, PS = 0.34, PK = 0.34 / 0.3;
  const { circ, ell, rr, al } = ART;
  let cv, ctx, VW = 1, VH = 1, dpr = 1, scale = 1, ox = 0, oy = 0, SS = 2, RS = 1;
  /* zoom du joueur : un facteur et un décalage posés par-dessus la vue calculée ; à 1, on retrouve la vue d'ensemble */
  let zs = 1, zx = 0, zy = 0;
  const clampZ = () => { if (zs <= 1.001) { zs = 1; zx = zy = 0; } else { zx = Math.min(0, Math.max(VW * (1 - zs), zx)); zy = Math.min(0, Math.max(VH * (1 - zs), zy)); } };
  function zoom(f, px, py) { const n = Math.max(1, Math.min(3.2, zs * f)), k = n / zs; zx = px * (1 - k) + zx * k; zy = py * (1 - k) + zy * k; zs = n; clampZ(); }
  function drag(dx, dy) { if (zs <= 1) return; zx += dx; zy += dy; clampZ(); }
  function resetZoom() { zs = 1; zx = zy = 0; }
  let ground = null, gctx, roads, rctx, tmp, tctx, shadow, sctx, light, lctx, vign = null, frostC = null;
  let map = null, F = { x: 0, y: 0 }, spr = new Map(), roadPts = [], fz = 0;
  let smoke = [], sparks = [], leaves = [], flies = [], floats = [], dust = [], lastSmoke = 0, last = 0, rain = [], splash = [];
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
  function sprite(key, w, h, pad, fn) {
    let s = spr.get(key); if (s) return s;
    const c = mk((w + pad * 2) * SS, (h + pad * 2) * SS), g = c.getContext('2d');
    g.scale(SS, SS); g.translate(pad, pad); fn(g);
    s = { c, w, h, pad }; spr.set(key, s); return s;
  }
  const blit = (g, s, x, y) => g.drawImage(s.c, x - s.pad, y - s.pad, s.w + s.pad * 2, s.h + s.pad * 2);

  function init(canvas, m) {
    cv = canvas; ctx = cv.getContext('2d');
    const r = SIM.rngOf(9);
    for (let i = 0; i < 22; i++) leaves.push({ x: X.x + r() * X.w, y: X.y + r() * X.h, vx: 5 + r() * 9, vy: 9 + r() * 10, a: r() * 6, va: 1 + r() * 2, c: ['#D9823A', '#C2502F', '#E3B54A'][i % 3], s: 1.4 + r() });
    for (let i = 0; i < 150; i++) rain.push({ x: r() * 1.3, y: r() * 1.1, v: 1.5 + r() * 0.7, l: 0.7 + r() * 0.6 });
    setMap(m);
  }
  /* change de carte : sol, rivière, lucioles */
  function setMap(m) {
    if (map === m) return;
    map = m; F = m.fire; frostC = null; roadPts = []; smoke = []; sparks = []; dust = []; floats = []; splash = [];
    const r = SIM.rngOf(31 + m.id.length); flies = [];
    for (let i = 0; i < 18; i++) {
      const p = i % 2 ? m.bank(m.at + (r() - 0.5) * 320, 28 + r() * 46) : m.dead[i % m.dead.length];
      flies.push({ ax: p.x + (r() - 0.5) * 30, ay: p.y + (r() - 0.5) * 30, ph: r() * 6.28, sp: 0.4 + r() * 0.6, rad: 8 + r() * 16 });
    }
    for (const k of Array.from(spr.keys())) if (k.startsWith('bridge')) spr.delete(k);
    if (gctx) { redrawGround(); redrawRoads(); setView(mode); resetZoom(); scale = tgt.s; ox = tgt.x; oy = tgt.y; }
  }
  let ins = { top: 130, bot: 104 }, mode = 'day', planBot = 300, planY = 676, tgt = { s: 1, x: 0, y: 0 };
  function fit(top, bot, b) {
    const avail = Math.max(120, VH - top - bot), bh = b[1] - b[0];
    const s = Math.max(Math.min(VW / W, avail / bh), VW / (X.w - 8), VH / (X.h - 8));
    let y = top - b[0] * s + Math.max(0, (avail - bh * s) / 2);
    y = Math.min(-(X.y + 4) * s, Math.max(VH - (X.y + X.h - 4) * s, y));
    return { s, x: VW / 2 - (W / 2) * s, y };
  }
  /* 'day' : toute la zone de jeu ; 'plan' : vue d'ensemble au-dessus des cartes du matin */
  function setView(m, bot, yMax) { mode = m; if (bot != null) planBot = bot; if (yMax != null) planY = yMax; tgt = m === 'plan' ? fit(ins.top, planBot, [map.band[0], Math.max(map.band[0] + 200, planY)]) : fit(ins.top, ins.bot, map.band); }
  function resize(w, h, pr, top, bot) {
    VW = w; VH = h; dpr = Math.min(2, pr || 1); ins = { top: top == null ? 130 : top, bot: bot == null ? 104 : bot };
    cv.width = Math.round(VW * dpr); cv.height = Math.round(VH * dpr);
    const day = fit(ins.top, ins.bot, map.band); setView(mode);
    scale = tgt.s; ox = tgt.x; oy = tgt.y;
    const nss = Math.min(3, Math.max(1, Math.round(day.s * dpr * 4) / 4));
    if (nss !== SS || !ground) {
      SS = nss; RS = Math.min(SS, 1.5); spr.clear();
      ground = mk(X.w * SS, X.h * SS); gctx = ground.getContext('2d'); gctx.scale(SS, SS); gctx.translate(-X.x, -X.y);
      roads = mk(X.w * RS, X.h * RS); rctx = roads.getContext('2d'); tmp = mk(X.w * RS, X.h * RS); tctx = tmp.getContext('2d');
      shadow = mk(X.w * SS / 2, X.h * SS / 2); sctx = shadow.getContext('2d');
      light = mk(X.w / 2, X.h / 2); lctx = light.getContext('2d');
      redrawGround(); redrawRoads();
    }
    vign = mk(VW, VH); const g = vign.getContext('2d');
    const gr = g.createRadialGradient(VW / 2, VH * 0.5, Math.min(VW, VH) * 0.42, VW / 2, VH * 0.5, Math.max(VW, VH) * 0.72);
    gr.addColorStop(0, 'rgba(24,16,8,0)'); gr.addColorStop(1, 'rgba(24,16,8,0.42)'); g.fillStyle = gr; g.fillRect(0, 0, VW, VH);
  }
  function redrawGround() { if (!gctx) return; gctx.clearRect(X.x, X.y, X.w, X.h); ART.drawGround(gctx, map); }

  /* ---------- chemins : un seul tenant, dessiné par couches pour que les jonctions se fondent ---------- */
  function chaikin(p, n) {
    for (let k = 0; k < n && p.length > 2; k++) {
      const o = [p[0]];
      for (let i = 0; i < p.length - 1; i++) { const a = p[i], b = p[i + 1]; o.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); }
      o.push(p[p.length - 1]); p = o;
    }
    return p;
  }
  function setRoads(st) { roadPts = st.roadLines.map(l => chaikin(l, 3)); redrawRoads(); }
  function redrawRoads() {
    if (!rctx) return;
    const S = map.stock, wd = 8.5;
    rctx.setTransform(1, 0, 0, 1, 0, 0); rctx.clearRect(0, 0, roads.width, roads.height);
    const shape = (g, grow) => {
      g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = Math.max(1.5, wd + grow);
      for (const p of roadPts) { g.beginPath(); for (let i = 0; i < p.length; i++) i ? g.lineTo(p[i][0], p[i][1]) : g.moveTo(p[i][0], p[i][1]); g.stroke(); }
      const k = grow < 0 ? grow * 2.4 : grow * 0.5;
      ell(g, F.x - (grow < 0 ? 3 : 0), F.y + 2, 42 + k, 35.5 + k * 0.9); g.fill();
      if (grow >= 0) { rr(g, S.x - 7 - grow * 0.5, S.y - 3 - grow * 0.5, S.w + 13 + grow, S.h + 11 + grow, 9); g.fill(); }
    };
    for (const [grow, col, a] of [[9, '#5E4E2C', 0.26], [3.4, '#967C52', 0.78], [0, '#B79E72', 1], [-4.6, '#D9C69C', 0.5]]) {
      tctx.setTransform(1, 0, 0, 1, 0, 0); tctx.clearRect(0, 0, tmp.width, tmp.height); tctx.setTransform(RS, 0, 0, RS, -X.x * RS, -X.y * RS);
      tctx.strokeStyle = tctx.fillStyle = col; shape(tctx, grow);
      rctx.globalAlpha = a; rctx.drawImage(tmp, 0, 0);
    }
    rctx.globalAlpha = 1; rctx.setTransform(RS, 0, 0, RS, -X.x * RS, -X.y * RS);
    const r = SIM.rngOf(5);
    for (const p of roadPts) for (let i = 1; i < p.length; i++) {
      const a = p[i - 1], b = p[i], n = Math.hypot(b[0] - a[0], b[1] - a[1]) / 8;
      for (let k = 0; k < n; k++) { if (r() > n - k) break; const q = r(); rctx.fillStyle = r() < 0.5 ? 'rgba(120,98,62,.5)' : 'rgba(230,214,176,.6)'; circ(rctx, a[0] + (b[0] - a[0]) * q + (r() - 0.5) * wd, a[1] + (b[1] - a[1]) * q + (r() - 0.5) * wd, 0.6 + r() * 0.7); rctx.fill(); }
    }
    for (let i = 0; i < 90; i++) { const a = r() * 6.28, d = Math.sqrt(r()) * 40; rctx.fillStyle = r() < 0.5 ? 'rgba(120,98,62,.45)' : 'rgba(226,210,172,.6)'; circ(rctx, F.x + Math.cos(a) * d, F.y + 2 + Math.sin(a) * d * 0.84, 0.6 + r() * 0.8); rctx.fill(); }
    for (const s of SIM.SEATS.slice(0, 4)) { // bancs autour du feu
      const x = F.x + s[0] * 1.02, y = F.y + s[1] * 1.02 + 2; rctx.save(); rctx.translate(x, y); rctx.rotate(Math.atan2(s[1], s[0]) + Math.PI / 2);
      rctx.fillStyle = 'rgba(30,22,14,.22)'; rr(rctx, -8, -1.5, 16, 6, 3); rctx.fill(); rr(rctx, -8, -3.5, 16, 6, 3); ART.FS(rctx, '#9C7146', 1.1);
      rctx.strokeStyle = 'rgba(60,40,22,.4)'; rctx.lineWidth = 0.7; rctx.beginPath(); rctx.moveTo(-5, -1.5); rctx.lineTo(5, -1.5); rctx.stroke(); rctx.restore();
    }
  }
  function frostLayer() {
    if (frostC) return frostC;
    const c = mk(X.w, X.h), g = c.getContext('2d'), r = SIM.rngOf(88); g.translate(-X.x, -X.y);
    for (let i = 0; i < 2600; i++) {
      const x = X.x + r() * X.w, y = X.y + r() * X.h; if (map.rdist(x, y) < 17) continue;
      const o = map.open(x, y), q = o ? 7 + r() * 13 : 4 + r() * 6, gr = g.createRadialGradient(x, y, 0, x, y, q);
      gr.addColorStop(0, 'rgba(240,246,255,' + (o ? 0.2 : 0.1) + ')'); gr.addColorStop(1, 'rgba(240,246,255,0)'); g.fillStyle = gr; g.fillRect(x - q, y - q, q * 2, q * 2);
    }
    for (let i = 0; i < 1500; i++) { g.fillStyle = 'rgba(255,255,255,' + (0.3 + r() * 0.5) + ')'; g.fillRect(X.x + r() * X.w, X.y + r() * X.h, 1, 1); }
    return frostC = c;
  }
  const s2w = (px, py) => ({ x: (px - ox) / scale, y: (py - oy) / scale });
  const w2s = (x, y) => ({ x: x * scale + ox, y: y * scale + oy });
  const pan = x => Math.max(-0.7, Math.min(0.7, ((x * scale + ox) / VW * 2 - 1) * 0.7));

  /* ---------- lumière du jour ---------- */
  const KEY = [[6, 255, 208, 166], [7.4, 255, 236, 206], [9.5, 255, 255, 255], [15.5, 255, 255, 255], [17.2, 255, 232, 190], [18.6, 255, 192, 138], [19.6, 226, 148, 132], [20.6, 130, 118, 160], [21.6, 80, 86, 130], [24, 64, 72, 112], [28.6, 64, 72, 112], [29.4, 124, 112, 152], [30, 255, 208, 166]];
  function ambient(h) {
    for (let i = 1; i < KEY.length; i++) if (h <= KEY[i][0]) { const a = KEY[i - 1], b = KEY[i], k = (h - a[0]) / (b[0] - a[0]); return [1, 2, 3].map(j => a[j] + (b[j] - a[j]) * k); }
    return [255, 208, 166];
  }
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));
  const night = h => cl((h - 19) / 2.3, 0, 1) * cl((30 - h) / 1.2, 0, 1);
  function sun(h) {
    const day = cl((h - 5.7) / 1.0, 0, 1) * cl((20.6 - h) / 1.8, 0, 1), nf = night(h);
    if (day > 0.02) { const k = (h - 6) / 14.5; return { dx: (0.5 - k) * 2.7, dy: 0.5, a: 0.34 * day }; }
    return { dx: 0.6, dy: 0.55, a: 0.2 * nf };
  }

  /* ---------- particules ---------- */
  function float(o) { floats.push(Object.assign({ t0: last }, o)); }
  function burst(x, y, kind, c) {
    const n = kind === 'dust' ? 12 : 16;
    for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, sp = 12 + Math.random() * 30; dust.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.7 - (kind === 'dust' ? 8 : 4), life: 0, max: 0.6 + Math.random() * 0.6, kind, c: c || '#D9C7A0', s: kind === 'dust' ? 2 + Math.random() * 3 : 1.6 + Math.random(), a: Math.random() * 6 }); }
  }
  function ripple(x, y) { for (let i = 0; i < 3; i++) splash.push({ x, y, t: last + i * 0.16, big: 1 }); }
  function spark(n) { for (let i = 0; i < n; i++) sparks.push({ x: F.x + (Math.random() - 0.5) * 9, y: F.y - 5, vx: (Math.random() - 0.5) * 26, vy: -24 - Math.random() * 26, life: 0, max: 0.7 + Math.random() * 0.9, force: 1 }); }
  function stepParticles(time, dt, nf) {
    if (time - lastSmoke > 0.22) { lastSmoke = time; smoke.push({ x: F.x + (Math.random() - 0.5) * 4, y: F.y - 8, vx: 5 + Math.random() * 5, vy: -16 - Math.random() * 6, life: 0, max: 3.2 + Math.random(), s: 3 }); if (nf > 0.2 && Math.random() < 0.8) sparks.push({ x: F.x + (Math.random() - 0.5) * 8, y: F.y - 6, vx: (Math.random() - 0.5) * 14, vy: -22 - Math.random() * 18, life: 0, max: 0.8 + Math.random() * 0.8 }); }
    for (const p of smoke) { p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.s += dt * 3.2; }
    for (const p of sparks) { p.life += dt; p.x += p.vx * dt + Math.sin(time * 9 + p.max * 9) * 0.2; p.y += p.vy * dt; }
    for (const p of dust) { p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.94; p.vy = p.vy * 0.94 + (p.kind === 'dust' ? 0 : 30 * dt); p.a += dt * 4; }
    smoke = smoke.filter(p => p.life < p.max); sparks = sparks.filter(p => p.life < p.max); dust = dust.filter(p => p.life < p.max);
    for (const l of leaves) { l.x += (l.vx + Math.sin(time * 1.3 + l.a) * 8) * dt; l.y += l.vy * dt; l.a += l.va * dt; if (l.y > X.y + X.h + 10 || l.x > X.x + X.w + 10) { l.x = X.x + Math.random() * X.w - 40; l.y = X.y - 10 - Math.random() * 80; } }
    floats = floats.filter(f => time - f.t0 < 1.7);
  }

  /* ---------- éléments ---------- */
  function drawFire(time) {
    const x = F.x, y = F.y;
    for (let i = 0; i < 9; i++) { const a = 6.2832 * i / 9; ell(ctx, x + 10.5 * Math.cos(a), y + 8.5 * Math.sin(a) + 1, 3.1, 2.6); ART.FS(ctx, '#98928A', 1); ctx.fillStyle = 'rgba(255,255,255,.25)'; ell(ctx, x + 10.5 * Math.cos(a) - 0.8, y + 8.5 * Math.sin(a), 1.3, 1); ctx.fill(); }
    ctx.fillStyle = '#3A2A20'; ell(ctx, x, y + 1, 7.5, 5.5); ctx.fill();
    ctx.lineCap = 'round'; ctx.strokeStyle = '#5E3F24'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 6, y - 2); ctx.lineTo(x + 6, y + 3); ctx.moveTo(x - 6, y + 3); ctx.lineTo(x + 6, y - 2); ctx.stroke();
    const fl = (s, c, ph) => { const w = Math.sin(time * 11 + ph) * 1.4 * s, hgt = (11 + Math.sin(time * 7.3 + ph * 2) * 2.2) * s; ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x - 4.6 * s, y + 1); ctx.quadraticCurveTo(x - 5.5 * s, y - 5 * s, x + w, y - hgt); ctx.quadraticCurveTo(x + 5.5 * s, y - 5 * s, x + 4.6 * s, y + 1); ctx.quadraticCurveTo(x, y + 3.5 * s, x - 4.6 * s, y + 1); ctx.fill(); };
    fl(1.12, 'rgba(226,96,40,0.9)', 0); fl(0.82, '#F2913A', 1.7); fl(0.52, '#FFD27A', 3.1); fl(0.26, '#FFF3C8', 4.4);
  }
  function tool(kind, side, swing) {
    ctx.save(); ctx.translate(side * 7.5, -15); ctx.rotate(side * (-1.0 + swing * 1.5));
    ctx.fillStyle = '#8D6239'; ctx.fillRect(-0.9, -12, 1.8, 13); ctx.strokeStyle = 'rgba(50,30,16,.6)'; ctx.lineWidth = 0.5; ctx.strokeRect(-0.9, -12, 1.8, 13);
    if (kind === 'axe') { ctx.beginPath(); ctx.moveTo(0.6 * side, -12.5); ctx.quadraticCurveTo(6.5 * side, -13.5, 6.5 * side, -7.5); ctx.quadraticCurveTo(3 * side, -7, 0.6 * side, -8.2); ctx.closePath(); ART.FS(ctx, '#C3C9D1', 0.9); }
    else if (kind === 'pick') { ctx.beginPath(); ctx.moveTo(-6.5, -9.6); ctx.quadraticCurveTo(0, -15.5, 6.5, -9.6); ctx.quadraticCurveTo(0, -12.4, -6.5, -9.6); ctx.closePath(); ART.FS(ctx, '#A9AFB8', 0.9); }
    else { rr(ctx, -3.2, -14.5, 6.4, 4, 1); ART.FS(ctx, '#8A8F98', 0.9); }
    ctx.restore();
  }
  function carry(kind, side) {
    if (kind === 'plank') { ctx.save(); ctx.translate(0, -27); ctx.rotate(-0.12 * side); rr(ctx, -11, -2, 22, 4, 1); ART.FS(ctx, '#D2AE78', 0.9); ctx.restore(); }
    else if (kind === 'log') { ctx.save(); ctx.translate(0, -27.5); ctx.rotate(0.1 * side); rr(ctx, -10, -3, 20, 6, 3); ART.FS(ctx, '#9C7146', 1); circ(ctx, 9.5 * side, 0, 2.6); ART.FS(ctx, '#D2AE78', 0.8); ctx.restore(); }
    else if (kind === 'branch') { ctx.strokeStyle = '#7A5636'; ctx.lineWidth = 1.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(side * 3, -13); ctx.lineTo(side * 12, -19); ctx.moveTo(side * 3, -11); ctx.lineTo(side * 13, -14); ctx.moveTo(side * 8, -16); ctx.lineTo(side * 9, -21); ctx.stroke(); }
    else if (kind === 'basket' || kind === 'bread') { ctx.save(); ctx.translate(side * 8.5, -10); rr(ctx, -4.2, -2.5, 8.4, 6, 2); ART.FS(ctx, '#B5833F', 1); if (kind === 'bread') { for (const q of [[-1.6, -3.4], [1.8, -3.6]]) { ell(ctx, q[0], q[1], 2.5, 1.7, 0.3); ART.FS(ctx, '#E0AC4E', 0.7); } } else { ctx.fillStyle = '#C8384A';[[-2, -3], [0.4, -3.8], [2.4, -3]].forEach(q => { circ(ctx, q[0], q[1], 1.4); ctx.fill(); }); } ctx.restore(); }
    else if (kind === 'fish') { ctx.save(); ctx.translate(side * 9, -13); ctx.strokeStyle = '#7A5636'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(-1.6, -2); ctx.lineTo(-1.6, 1); ctx.moveTo(1.8, -2); ctx.lineTo(1.8, 2); ctx.stroke(); ell(ctx, -1.6, 4, 1.6, 3.4); ART.FS(ctx, '#B9CBD6', 0.7); ell(ctx, 1.8, 5, 1.6, 3.4); ART.FS(ctx, '#A9BFCC', 0.7); ctx.restore(); }
    else if (kind === 'stone') { ctx.save(); ctx.translate(side * 5, -14); rr(ctx, -4.6, -3.4, 9.2, 6.8, 1.2); ART.FS(ctx, '#BDB7AB', 1); ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(-3.8, -2.6, 7.6, 1.4); ctx.restore(); }
  }
  const dirOf = (dx, dy) => Math.abs(dx) > Math.abs(dy) * 1.15 ? (dx < 0 ? 'l' : 'r') : (dy < -0.01 ? 'b' : 'f');
  function drawPawn(p, time) {
    const lying = p.anim === 'sleepout';
    const dir = lying ? 'f' : dirOf(p.dx, p.dy), side = p.dx < 0 ? -1 : 1;
    const s = sprite('p' + p.v.id + '|' + p.v.name + '|' + p.outfit + '|' + dir, 100 * PS, 124 * PS, 2, g => { g.scale(PS, PS); ART.drawPawn(g, p.v, p.outfit, dir); });
    let bob = 0, tilt = 0, sy = 1, sw = -1, tl = null;
    const ph = time * 1 + p.v.id * 1.7;
    switch (p.anim) {
      case 'walk': { const q = p.dist * 0.4; bob = -Math.abs(Math.sin(q)) * 1.8; tilt = Math.sin(q) * 0.075; break; }
      case 'build': { const q = (time * 2.4 + p.v.id * 0.37) % 1; sw = q < 0.7 ? q / 0.7 : 1 - (q - 0.7) / 0.3; sw = sw * sw; tl = 'hammer'; tilt = side * 0.1 * sw; break; }
      case 'chop': case 'mine': { const q = (time * 1.5 + p.v.id * 0.31) % 1; sw = q < 0.75 ? q / 0.75 : 1 - (q - 0.75) / 0.25; sw = sw * sw * sw; tl = p.anim === 'mine' ? 'pick' : 'axe'; tilt = side * 0.16 * sw; break; }
      case 'gather': case 'pick': case 'take': { const q = Math.sin(time * 4.5 + p.v.id) * 0.5 + 0.5; bob = q * 2.4; sy = 1 - q * 0.05; break; }
      case 'play': tilt = Math.sin(time * 3.2 + p.v.id) * 0.07; bob = -Math.abs(Math.sin(time * 3.2 + p.v.id)) * 0.8; break;
      case 'sit': case 'eat': sy = 0.9; bob = 1; break;
      case 'sad': sy = 0.86; bob = 1.5; tilt = Math.sin(time * 1.2 + p.v.id) * 0.02; break;
      default: sy = 1 + Math.sin(ph * 2) * 0.012;
    }
    if (p.anim === 'fish') { /* canne, fil et bouchon */
      const n = Math.hypot(p.dx, p.dy) || 1, ux = p.dx / n, uy = p.dy / n, tx = p.x + ux * 15, ty = p.y - 24 + uy * 5, bx = p.x + ux * 23, by = p.y + uy * 23 + Math.sin(time * 2 + p.v.id) * 0.8;
      ctx.lineCap = 'round'; ctx.strokeStyle = '#7A5636'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(p.x + ux * 4, p.y - 14); ctx.lineTo(tx, ty); ctx.stroke();
      ctx.strokeStyle = 'rgba(244,244,236,.75)'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo((tx + bx) / 2, (ty + by) / 2 + 3, bx, by); ctx.stroke();
      const q = (time * 0.55 + p.v.id * 0.3) % 1; ctx.strokeStyle = 'rgba(232,246,248,' + (1 - q) * 0.6 + ')'; ctx.lineWidth = 0.7; ell(ctx, bx, by, 1.5 + q * 5, 0.8 + q * 2.6); ctx.stroke();
      circ(ctx, bx, by, 1.4); ctx.fillStyle = '#D9483A'; ctx.fill(); ctx.fillStyle = '#FFF'; circ(ctx, bx, by - 0.6, 0.7); ctx.fill();
    }
    if (p.anim === 'play') { ctx.font = '11px Georgia, serif'; ctx.textAlign = 'center'; for (let k = 0; k < 2; k++) { const q = (time * 0.5 + k * 0.5 + p.v.id * 0.3) % 1; ctx.fillStyle = 'rgba(255,250,235,' + (1 - q) * 0.95 + ')'; ctx.fillText(k ? '♪' : '♫', p.x + 9 + k * 7 + Math.sin(time * 2 + k) * 3, p.y - 30 - q * 20); } }
    ctx.save(); ctx.translate(p.x, p.y);
    if (p.sel) { ctx.strokeStyle = 'rgba(255,250,235,' + (0.65 + Math.sin(time * 5) * 0.25) + ')'; ctx.lineWidth = 1.6; ell(ctx, 0, -1, 11, 5.5); ctx.stroke(); }
    if (lying) {
      ctx.translate(0, -5); ctx.rotate(-Math.PI / 2 * 0.92); ctx.scale(1, 1 + Math.sin(time * 1.6 + p.v.id) * 0.02);
      blit(ctx, s, -50 * PS, -72 * PS);
    } else {
      ctx.translate(0, bob); ctx.rotate(tilt); ctx.scale(1, sy);
      blit(ctx, s, -50 * PS, -112 * PS);
      ctx.scale(PK, PK);
      if (tl) tool(tl, side, sw);
      if (p.carry) carry(p.carry, side);
      if (p.anim === 'eat') { const q = Math.sin(time * 5 + p.v.id * 2) * 0.5 + 0.5; ell(ctx, side * 4.5, -15 - q * 4, 3, 2.1); ART.FS(ctx, '#D9A441', 0.9); }
    }
    ctx.restore();
  }
  function hull(pts) {
    pts = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
    for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (const p of pts.slice().reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  function drawBuilding(b, time) {
    const open = SIM.BT[b.type].open;
    const sInt = sprite('int|' + b.type, b.w, b.h, 6, g => ART.drawInterior(g, b.type, b.w, b.h));
    const sExt = sprite('ext|' + b.type, b.w, b.h, 6, g => ART.drawExterior(g, b.type, b.w, b.h));
    if (b.progress < 1) {
      const p = b.progress;
      ctx.fillStyle = 'rgba(150,124,82,0.85)'; rr(ctx, b.x - 3, b.y - 3, b.w + 6, b.h + 6, 4); ctx.fill();
      ctx.strokeStyle = 'rgba(255,250,235,.8)'; ctx.setLineDash([4, 3]); ctx.lineWidth = 1; ctx.strokeRect(b.x, b.y, b.w, b.h); ctx.setLineDash([]);
      const a = Math.min(1, p / 0.45);
      if (a > 0) { ctx.save(); ctx.beginPath(); ctx.rect(b.x - 6, b.y + b.h * (1 - a) - 2, b.w + 12, b.h * a + 8); ctx.clip(); blit(ctx, sInt, b.x, b.y); ctx.restore(); }
      if (p > 0.45) { const q = (p - 0.45) / 0.55; ctx.save(); ctx.beginPath(); ctx.rect(b.x - 6, b.y - 6, b.w + 12, (b.h + 12) * q); ctx.clip(); blit(ctx, sExt, b.x, b.y); ctx.restore(); }
      for (const q of [[b.x - 2, b.y - 2], [b.x + b.w - 1, b.y - 2], [b.x - 2, b.y + b.h - 1], [b.x + b.w - 1, b.y + b.h - 1]]) { ctx.fillStyle = '#D2AE78'; ctx.fillRect(q[0], q[1] - 6, 3, 9); ctx.strokeStyle = 'rgba(60,40,22,.6)'; ctx.lineWidth = 0.7; ctx.strokeRect(q[0], q[1] - 6, 3, 9); }
      return;
    }
    blit(ctx, sInt, b.x, b.y);
    const D = ART.BDEF[b.type], beds = D.beds || [];
    for (const o of b.occ || []) {
      let hx, hy;
      if (o.bed == null) { /* au travail, vu de dessus */
        if (!D.work) continue; hx = b.x + D.work[0] + Math.sin(time * 1.1 + o.v.id) * 2.5; hy = b.y + D.work[1] + Math.sin(time * 3 + o.v.id) * 0.4;
        ell(ctx, hx, hy + 3.4, 5.2, 3.6); ART.FS(ctx, ART.OUT[o.outfit || 'civil'].main, 0.9);
      } else { const bd = beds[o.bed]; if (!bd) continue; hx = b.x + bd[0] + 6; hy = b.y + bd[1] + 5 + Math.sin(time * 1.5 + o.v.id) * 0.25; }
      circ(ctx, hx, hy, 3.5); ART.FS(ctx, ART.SKINS[o.v.skin], 0.9);
      ctx.fillStyle = ART.HAIRC[o.v.hc]; ctx.beginPath(); ctx.arc(hx, hy, 3.6, Math.PI * 1.05, Math.PI * 1.95); ctx.quadraticCurveTo(hx, hy - 1.6, hx - 3.4, hy - 0.4); ctx.fill();
    }
    const pop = b.popT != null ? Math.max(0, 1 - (time - b.popT) / 0.45) : 0;
    ctx.save();
    if (pop > 0) { const k = 1 + Math.sin(pop * 9) * 0.05 * pop; ctx.translate(b.x + b.w / 2, b.y + b.h); ctx.scale(k, k); ctx.translate(-b.x - b.w / 2, -b.y - b.h); }
    ctx.globalAlpha = 1 - b.reveal * 0.9; blit(ctx, sExt, b.x, b.y);
    if (b.type === 'moulin') { ctx.save(); ctx.translate(b.x + b.w / 2, b.y + (b.h - ART.FH) / 2); ART.drawSails(ctx, time * 0.55 * (1 - fz * 0.6)); ctx.restore(); }
    if (fz > 0.02) { ctx.globalAlpha = 1; ctx.fillStyle = 'rgba(238,244,252,' + (open ? 0.24 : 0.34) * fz * (1 - b.reveal) + ')'; if (open) { rr(ctx, b.x, b.y, b.w, b.h, 3); ctx.fill(); } else ctx.fillRect(b.x, b.y, b.w, b.h - ART.FH); }
    ctx.globalAlpha = 1;
    ctx.restore();
    if (b.reveal > 0.05) { ctx.strokeStyle = 'rgba(255,250,235,' + (0.55 * b.reveal) + ')'; ctx.setLineDash([3, 3]); ctx.lineWidth = 0.9; ctx.strokeRect(b.x - 0.5, b.y - 0.5, b.w + 1, b.h - ART.FH + 1); ctx.setLineDash([]); }
  }
  /* ombres arrondies : [demi-largeur, demi-hauteur (en parts du bâtiment), hauteur de l'objet, centre vertical] */
  const RSH = { cloche: [0.4, 0.14, 8, 0.86], rubans: [0.4, 0.36, 9, 0.52], fanal: [0.3, 0.2, 10, 0.72], brasero: [0.34, 0.22, 5, 0.74], puits: [0.38, 0.33, 5, 0.54], kiosque: [0.44, 0.4, 9, 0.52], verger: [0.47, 0.43, 6, 0.5], rucher: [0.42, 0.3, 5, 0.62], gardemanger: [0.4, 0.3, 7, 0.6], bucher: [0.46, 0.34, 6, 0.62], digue: [0.5, 0.42, 3, 0.5], abri: [0.48, 0.4, 5, 0.55], tente: [0.5, 0.46, 8, 0.5] };
  /* les icônes de la planche, dessinées sur l'image : mêmes dessins que dans l'interface */
  const GLY = { food: ['nourriture', '#FFD08A'], joy: ['bonheur', '#FFD0DA'], roof: ['toit', '#FBF3E2'], heart: ['amour', '#FFC2D0'], faim: ['faim', '#A63A2E'], dehors: ['dehors', '#A63A2E'],
    wood: [['M11.8 13a4.3 4.3 0 11-8.6 0a4.3 4.3 0 018.6 0zM8.8 13a1.3 1.3 0 11-2.6 0a1.3 1.3 0 012.6 0zM7.5 8.7h9.2a4.3 4.3 0 010 8.6H7.5M13.2 12h3M12.2 14.6h2.2'], '#F0CFA6'], stone: [['M4.2 17.8l2-7.6 5.6-4 6.6 3 1.6 8.6zM6.2 10.2l5.2 2.8 7-3.8M11.4 13l-.5 4.8'], '#E3E6EA'] }, GP = {};
  function glyph(kind, x, y, size, color) {
    const q = GLY[kind]; if (!q) return false; const stroke = Array.isArray(q[0]), p = GP[kind] || (GP[kind] = new Path2D(stroke ? q[0][0] : ICONS[q[0]].d)), k = size / 24;
    ctx.save(); ctx.translate(x - size / 2, y - size / 2); ctx.scale(k, k);
    if (stroke) { ctx.strokeStyle = color || q[1]; ctx.lineWidth = 1.9; ctx.lineCap = ctx.lineJoin = 'round'; ctx.stroke(p); } else { ctx.fillStyle = color || q[1]; ctx.fill(p, 'evenodd'); }
    ctx.restore(); return true;
  }
  function chip(x, y, kind) {
    circ(ctx, x, y, 7); ctx.fillStyle = '#FFFBF2'; ctx.fill(); ctx.strokeStyle = '#C2452F'; ctx.lineWidth = 1.3; ctx.stroke();
    glyph(kind === 'food' ? 'faim' : 'dehors', x, y, 11.5);
  }
  function drawFloat(f, time) {
    const k = (time - f.t0) / 1.7, y = f.y - 10 - k * 20, a = k < 0.15 ? k / 0.15 : 1 - Math.max(0, (k - 0.6) / 0.4);
    ctx.globalAlpha = Math.max(0, a); ctx.font = '600 9px Barlow, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const tw = f.text ? ctx.measureText(f.text).width : 0, w = tw + (f.icon ? 14 : 6) + 4;
    rr(ctx, f.x - w / 2, y - 7.5, w, 15, 7.5); ctx.fillStyle = f.bad ? '#A63A2E' : 'rgba(59,42,31,0.88)'; ctx.fill();
    const ix = f.x - w / 2 + 8.5;
    if (f.icon === 'zz') { ctx.strokeStyle = '#DCE6FF'; ctx.lineWidth = 1.3; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(ix - 3, y - 2.6); ctx.lineTo(ix + 2, y - 2.6); ctx.lineTo(ix - 3, y + 2.6); ctx.lineTo(ix + 2.4, y + 2.6); ctx.stroke(); }
    else if (f.icon) glyph(f.icon, ix, y, 12.5, f.bad ? '#FFE9E2' : null);
    if (f.text) { ctx.fillStyle = '#FFFBF2'; ctx.fillText(f.text, f.x + (f.icon ? 6 : 0), y + 0.5); }
    ctx.globalAlpha = 1;
  }

  /* ---------- image ---------- */
  function frame(view, hour, time) {
    const dt = Math.min(0.1, Math.max(0, time - last)); last = time;
    { const q = 1 - Math.exp(-dt * (zs > 1 ? 14 : 5)); scale += (tgt.s * zs - scale) * q; ox += (tgt.x * zs + zx - ox) * q; oy += (tgt.y * zs + zy - oy) * q; }
    const nf = night(hour), sn = sun(hour), k = dpr * scale, wz = view.weather || { rain: 0, flood: 0, frost: 0 }, S = map.stock;
    fz += ((wz.frost || 0) - fz) * Math.min(1, dt * 1.4);
    const am = ambient(hour).map((c, i) => Math.round(c * (1 - wz.rain * [0.3, 0.24, 0.15][i]) * (1 - fz * [0.13, 0.06, 0][i]))); sn.a *= (1 - wz.rain * 0.8) * (1 - (wz.fog || 0) * 0.75);
    stepParticles(time, dt, nf);
    ctx.setTransform(k, 0, 0, k, dpr * ox, dpr * oy);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(ground, X.x, X.y, X.w, X.h);
    ctx.drawImage(roads, X.x, X.y, X.w, X.h);
    if (fz > 0.02) { ctx.globalAlpha = fz * 0.95; ctx.drawImage(frostLayer(), X.x, X.y, X.w, X.h); ctx.globalAlpha = 1; }
    /* la nuit, l'eau s'assombrit ; puis reflets animés */
    if (nf > 0.02) { ctx.lineCap = 'butt'; ctx.strokeStyle = 'rgba(14,18,34,' + 0.62 * nf + ')'; ctx.lineWidth = 32; ART.riverPath(ctx, map); ctx.stroke(); }
    if (wz.flood > 0.02) { /* crue : l'eau monte, brune, et déborde sur les berges */
      const f = wz.flood; ctx.lineCap = 'butt';
      ART.riverPath(ctx, map); ctx.strokeStyle = 'rgba(138,130,98,' + 0.85 * f + ')'; ctx.lineWidth = 31 + 21 * f; ctx.stroke();
      ART.riverPath(ctx, map); ctx.strokeStyle = 'rgba(96,126,128,' + 0.92 * f + ')'; ctx.lineWidth = 31 + 14 * f; ctx.stroke();
    }
    if (fz > 0.02) { ctx.lineCap = 'butt'; ctx.strokeStyle = 'rgba(240,248,255,' + 0.55 * fz + ')'; ctx.lineWidth = 3; for (const o of [-14, 14]) { ART.riverPath(ctx, map, o); ctx.stroke(); } }
    ctx.lineCap = 'round';
    for (const [dy, a, dash, sp] of [[-8, 0.5, [5, 19, 2, 26], 15], [-1, 0.42, [8, 30, 3, 22], 21], [7, 0.5, [4, 23, 7, 28], 17]]) { ctx.setLineDash(dash); ctx.lineDashOffset = -time * sp * (1 + wz.flood * 1.6) * (1 - fz * 0.5); ctx.strokeStyle = 'rgba(232,246,248,' + a * (1 - nf * 0.45) + ')'; ctx.lineWidth = 1.3; ART.riverPath(ctx, map, dy + Math.sin(time * 0.7 + dy) * 0.8); ctx.stroke(); }
    ctx.setLineDash([]);
    {
      const B = map.bridge; blit(ctx, sprite('bridge' + map.id, 72, 72, 2, g => { g.translate(36 - B.x, 36 - B.y); ART.drawBridge(g, map); }), B.x - 36, B.y - 36);
      if (wz.flood > 0.25) {
        const f = wz.flood; ctx.save(); ctx.translate(B.x, B.y); if (B.dir === 'h') ctx.rotate(Math.PI / 2);
        ctx.fillStyle = 'rgba(96,126,128,' + 0.78 * f + ')'; ctx.fillRect(-17, -21, 34, 42); ctx.strokeStyle = 'rgba(232,246,248,' + 0.6 * f + ')'; ctx.lineWidth = 1.2; ctx.setLineDash([5, 7]); ctx.lineDashOffset = -time * 40;
        for (const yy of [-13, -3, 8]) { ctx.beginPath(); ctx.moveTo(-18, yy); ctx.lineTo(18, yy + 2); ctx.stroke(); } ctx.setLineDash([]); ctx.restore();
      }
    }

    /* liste triée des éléments */
    const ents = [], vx0 = -ox / scale - 34, vx1 = (VW - ox) / scale + 34, vy0 = -oy / scale - 34, vy1 = (VH - oy) / scale + 34;
    for (const t of map.trees) if (t.x > vx0 && t.x < vx1 && t.y > vy0 && t.y < vy1) ents.push({ y: t.y + t.r * 0.35, k: 'tree', o: t });
    for (const b of map.bushes) ents.push({ y: b.y + 4, k: 'bush', o: b });
    for (const d of map.decor) if (!view.buildings.some(b => d.x > b.x - 10 && d.x < b.x + b.w + 10 && d.y > b.y - 8 && d.y < b.y + b.h + 12)) ents.push({ y: d.y + 3, k: d.k, o: d });
    for (const b of view.buildings) ents.push({ y: b.y + b.h, k: 'bld', o: b });
    for (const p of view.pawns) ents.push({ y: p.y, k: 'pawn', o: p });
    for (const gr of view.graves || []) ents.push({ y: gr.y, k: 'grave', o: gr });
    if (map.rocks) ents.push({ y: map.rocks.y + 12, k: 'outcrop', o: map.rocks });
    ents.push({ y: F.y + 6, k: 'fire' }, { y: S.y + S.h - 6, k: 'stock' });
    ents.sort((a, b) => a.y - b.y);

    /* ombres portées (une seule couche, pour ne pas les additionner) */
    const sk = SS / 2; sctx.setTransform(1, 0, 0, 1, 0, 0); sctx.clearRect(0, 0, shadow.width, shadow.height); sctx.setTransform(sk, 0, 0, sk, -X.x * sk, -X.y * sk); sctx.fillStyle = '#17142A';
    for (const e of ents) {
      const o = e.o;
      if (e.k === 'tree') { const ct = view.cut.get(o.id); if (ct != null && time - ct > 0.5) continue; ell(sctx, o.x + sn.dx * o.r * 0.95, o.y + sn.dy * o.r * 1.0 + o.r * 0.12, o.r * 1.02, o.r * 0.84); sctx.fill(); }
      else if (e.k === 'bush') { ell(sctx, o.x + sn.dx * 4, o.y + 2 + sn.dy * 4, 7.5, 5.5); sctx.fill(); }
      else if (e.k === 'rock') { ell(sctx, o.x + sn.dx * 3, o.y + 1 + sn.dy * 3, o.s, o.s * 0.7); sctx.fill(); }
      else if (e.k === 'outcrop') { ell(sctx, o.x + sn.dx * 7, o.y + 2 + sn.dy * 7, 24, 17); sctx.fill(); }
      else if (e.k === 'pawn') { if (o.anim === 'sleepout') { ell(sctx, o.x - 4 + sn.dx * 2, o.y - 3 + sn.dy * 2, 15, 6); } else ell(sctx, o.x + sn.dx * 8, o.y - 1 + sn.dy * 5, 9.5, 4.6); sctx.fill(); }
      else if (e.k === 'bld' && RSH[o.type]) { const q = RSH[o.type], hgt = q[2] * Math.min(1, o.progress * 1.2); if (hgt < 1) continue; ell(sctx, o.x + o.w / 2 + sn.dx * hgt, o.y + o.h * q[3] + sn.dy * hgt, o.w * q[0], o.h * q[1]); sctx.fill(); } // ce qui n'est pas carré n'a pas d'ombre carrée
      else if (e.k === 'bld') { const hgt = (SIM.BT[o.type].open ? 3 : 15) * Math.min(1, o.progress * 1.2); if (hgt < 2) continue; const P = []; for (const q of [[o.x, o.y], [o.x + o.w, o.y], [o.x, o.y + o.h], [o.x + o.w, o.y + o.h]]) { P.push(q, [q[0] + sn.dx * hgt, q[1] + sn.dy * hgt]); } const hp = hull(P); sctx.beginPath(); hp.forEach((q, i) => i ? sctx.lineTo(q[0], q[1]) : sctx.moveTo(q[0], q[1])); sctx.closePath(); sctx.fill(); }
      else if (e.k === 'stock') sctx.fillRect(S.x + sn.dx * 5, S.y + sn.dy * 5, S.w, S.h);
    }
    ctx.globalAlpha = sn.a; ctx.drawImage(shadow, X.x, X.y, X.w, X.h); ctx.globalAlpha = 1;

    /* éléments */
    for (const e of ents) {
      const o = e.o;
      if (e.k === 'tree') {
        const ct = view.cut.get(o.id), gone = ct != null ? cl((time - ct) / 0.5, 0, 1) : 0;
        if (ct != null) { ctx.save(); ctx.translate(o.x, o.y + o.r * 0.2); ART.drawStump(ctx, 4.5); ctx.restore(); }
        if (gone >= 1) continue;
        const rq = o.r <= 15 ? 14 : o.r <= 19 ? 18 : 22;
        const sp = sprite('t' + o.kind + o.pal + '|' + o.v + '|' + rq, rq * 2, rq * 2, 4, g => { g.translate(rq, rq); ART.drawTree(g, { id: o.pal * 17 + o.v * 5 + rq, r: rq, kind: o.kind, pal: o.pal, ph: o.v * 2.1 }); });
        ctx.save(); ctx.translate(o.x, o.y);
        const shake = view.chopping.has(o.id) ? Math.sin(time * 22) * 0.035 : (o.rus > time ? Math.sin(time * 26) * 0.05 * (o.rus - time) : 0);
        ctx.rotate(Math.sin(time * 0.9 + o.ph) * 0.022 + shake + gone * 0.5); const sc = (1 + Math.sin(time * 1.1 + o.ph * 2) * 0.012 - gone * 0.3) * o.r / rq; ctx.scale(sc, sc);
        let hide = 0; for (const p of view.pawns) if (p.y < o.y + o.r * 0.35 && Math.hypot(p.x - o.x, p.y - 12 - o.y) < o.r + 7) { hide = 1; break; }
        o.fade = (o.fade || 0) + (hide - (o.fade || 0)) * Math.min(1, dt * 8);
        ctx.globalAlpha = (1 - gone) * (1 - o.fade * 0.62); blit(ctx, sp, -rq, -rq);
        if (fz > 0.02) { ctx.globalAlpha = 0.16 * fz * (1 - gone); ctx.fillStyle = '#F0F6FF'; circ(ctx, 0, 0, rq * 0.92); ctx.fill(); }
        ctx.globalAlpha = 1; ctx.restore();
      } else if (e.k === 'bush') { ctx.save(); ctx.translate(o.x, o.y); blit(ctx, sprite('bush' + (o.berries ? 1 : 0), 20, 18, 3, g => { g.translate(10, 9); ART.drawBush(g, o.berries); }), -10, -9); ctx.restore(); }
      else if (e.k === 'rock') { ctx.save(); ctx.translate(o.x, o.y); ART.drawRock(ctx, o.s); ctx.restore(); }
      else if (e.k === 'outcrop') blit(ctx, sprite('outcrop', 60, 52, 2, g => { g.translate(30, 28); ART.drawOutcrop(g); }), o.x - 30, o.y - 28);
      else if (e.k === 'bld') drawBuilding(o, time);
      else if (e.k === 'pawn') drawPawn(o, time);
      else if (e.k === 'fire') drawFire(time);
      else if (e.k === 'stock') blit(ctx, sprite('stock' + Math.min(14, view.wood) + '_' + Math.min(10, view.food) + '_' + Math.min(6, view.stone || 0), S.w + 4, S.h + 18, 3, g => { g.translate(2, 14); ART.drawStock(g, S, view.wood, view.food, view.stone); }), S.x - 2, S.y - 14);
      else if (e.k === 'grave') { ctx.fillStyle = '#8A8F98'; rr(ctx, o.x - 4, o.y - 10, 8, 10, 3); ART.FS(ctx, '#9A9FA8', 1); }
    }
    /* fumée (feu, cheminées), poussière, feuilles */
    for (const b of view.buildings) if (b.smoke && Math.random() < dt * 5) { const c = ART.BDEF[b.type].chimney; smoke.push({ x: b.x + c[0] + (Math.random() - 0.5) * 2, y: b.y + c[1], vx: 5 + Math.random() * 5, vy: -13 - Math.random() * 6, life: 0, max: 2.4 + Math.random(), s: 2 }); }
    for (const p of smoke) { const a = (1 - p.life / p.max) * 0.3; ctx.fillStyle = 'rgba(236,232,224,' + a + ')'; circ(ctx, p.x, p.y, p.s); ctx.fill(); }
    for (const p of dust) { const a = 1 - p.life / p.max; if (p.kind === 'dust') { ctx.fillStyle = al(p.c, a * 0.6); circ(ctx, p.x, p.y, p.s * (1 + p.life)); ctx.fill(); } else { ctx.fillStyle = al(p.c, a); ell(ctx, p.x, p.y, p.s, p.s * 0.5, p.a); ctx.fill(); } }
    for (const l of leaves) { ctx.fillStyle = l.c; ell(ctx, l.x, l.y, l.s, l.s * 0.5 * Math.abs(Math.cos(l.a)) + 0.3, l.a); ctx.fill(); }

    if (wz.rain > 0.02) { const n = wz.rain * dt * 90; for (let i = 0; i < n; i++) if (Math.random() < n - i) splash.push({ x: vx0 + Math.random() * (vx1 - vx0), y: vy0 + Math.random() * (vy1 - vy0), t: time }); }
    ctx.lineWidth = 0.7;
    for (const p of splash) { const life = p.big ? 0.9 : 0.4, q = (time - p.t) / life; if (q < 0) continue; ctx.strokeStyle = 'rgba(226,238,248,' + (1 - q) * (p.big ? 0.8 : 0.5) + ')'; const g0 = p.big ? 3 : 1; ell(ctx, p.x, p.y, g0 + q * (p.big ? 11 : 3.4), g0 * 0.5 + q * (p.big ? 5.5 : 1.7)); ctx.stroke(); }
    splash = splash.filter(p => time - p.t < (p.big ? 0.9 : 0.4));

    /* carte de lumière : couleur ambiante + sources chaudes, multipliée sur la scène */
    lctx.setTransform(1, 0, 0, 1, 0, 0); lctx.globalCompositeOperation = 'source-over'; lctx.fillStyle = 'rgb(' + am.join(',') + ')'; lctx.fillRect(0, 0, light.width, light.height);
    lctx.setTransform(0.5, 0, 0, 0.5, -X.x * 0.5, -X.y * 0.5); lctx.globalCompositeOperation = 'lighter';
    const L = (x, y, r, c, a) => { if (a <= 0.01) return; const gr = lctx.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(' + c + ',' + a + ')'); gr.addColorStop(0.45, 'rgba(' + c + ',' + a * 0.45 + ')'); gr.addColorStop(1, 'rgba(' + c + ',0)'); lctx.fillStyle = gr; lctx.fillRect(x - r, y - r, r * 2, r * 2); };
    const flick = Math.sin(time * 13) * 0.04 + Math.sin(time * 7.1) * 0.04;
    L(F.x, F.y - 2, 128 * (1 + flick), '255,170,88', 0.2 + 0.72 * nf);
    L(F.x, F.y - 2, 46, '255,214,150', 0.5 * nf);
    for (const b of view.buildings) if (b.progress >= 1) {
      if (b.smoke) L(b.x + b.w / 2, b.y + b.h - 4, 34, '255,176,96', 0.3 + 0.2 * flick);
      if (nf <= 0.02) continue;
      const on = b.lit ? 1 : 0.0;
      for (const q of ART.BDEF[b.type].lights) L(b.x + q[0], b.y + q[1] + 6, 26, '255,190,112', 0.6 * nf * on * (1 - b.reveal));
      if (b.reveal > 0.05 && b.lit) L(b.x + b.w / 2, b.y + b.h / 2, Math.max(b.w, b.h) * 0.95, '255,206,150', 0.78 * nf * b.reveal);
    }
    ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(light, X.x, X.y, X.w, X.h); ctx.globalCompositeOperation = 'source-over';

    /* lueurs additives : feu, fenêtres, étincelles, lucioles */
    ctx.globalCompositeOperation = 'lighter';
    let gr = ctx.createRadialGradient(F.x, F.y - 4, 0, F.x, F.y - 4, 38 * (1 + flick)); gr.addColorStop(0, 'rgba(255,170,80,' + (0.2 + 0.3 * nf) + ')'); gr.addColorStop(1, 'rgba(255,120,40,0)'); ctx.fillStyle = gr; ctx.fillRect(F.x - 44, F.y - 48, 88, 88);
    for (const b of view.buildings) if (b.progress >= 1 && b.reveal < 0.9) {
      const a = Math.max(b.lit ? nf : 0, b.smoke ? 0.7 : 0) * (1 - b.reveal); if (a < 0.02) continue;
      for (const wx of ART.BDEF[b.type].win) { const x = b.x + wx, y = b.y + b.h - 10; ctx.fillStyle = 'rgba(255,196,96,' + 0.85 * a + ')'; ctx.fillRect(x, y, 8, 6); gr = ctx.createRadialGradient(x + 4, y + 3, 0, x + 4, y + 3, 15); gr.addColorStop(0, 'rgba(255,180,90,' + 0.4 * a + ')'); gr.addColorStop(1, 'rgba(255,160,70,0)'); ctx.fillStyle = gr; ctx.fillRect(x - 12, y - 12, 32, 32); }
    }
    for (const p of sparks) { const a = (1 - p.life / p.max) * Math.max(nf, p.force || 0); if (a > 0.02) { ctx.fillStyle = 'rgba(255,190,90,' + a + ')'; circ(ctx, p.x, p.y, 0.9); ctx.fill(); } }
    if (nf > 0.02 && fz < 0.5) for (const f of flies) { const x = f.ax + Math.cos(time * f.sp + f.ph) * f.rad, y = f.ay + Math.sin(time * f.sp * 1.3 + f.ph * 2) * f.rad * 0.6, a = nf * (0.45 + 0.55 * Math.sin(time * 2.2 + f.ph * 3)); if (a <= 0) continue; gr = ctx.createRadialGradient(x, y, 0, x, y, 5); gr.addColorStop(0, 'rgba(220,255,150,' + a * 0.9 + ')'); gr.addColorStop(1, 'rgba(180,255,120,0)'); ctx.fillStyle = gr; ctx.fillRect(x - 5, y - 5, 10, 10); }
    ctx.globalCompositeOperation = 'source-over';

    if (wz.rain > 0.02) { /* rideau de pluie, en espace écran */
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = 'rgba(112,128,146,' + 0.12 * wz.rain + ')'; ctx.fillRect(0, 0, VW, VH);
      ctx.strokeStyle = 'rgba(218,230,242,' + 0.36 * wz.rain + ')'; ctx.lineWidth = 1.1; ctx.lineCap = 'round'; ctx.beginPath();
      for (const d of rain) { d.y += d.v * dt; d.x -= d.v * dt * 0.2; if (d.y > 1.05) { d.y -= 1.12; d.x = Math.random() * 1.3; } const x = d.x * VW, y = d.y * VH; ctx.moveTo(x, y); ctx.lineTo(x - 3.4 * d.l, y + 15 * d.l); }
      ctx.stroke(); ctx.setTransform(k, 0, 0, k, dpr * ox, dpr * oy);
    } else if (fz > 0.05) { /* quelques flocons */
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = 'rgba(248,251,255,' + 0.8 * fz + ')';
      for (let i = 0; i < 60; i++) { const d = rain[i]; d.y += d.v * dt * 0.05; d.x += Math.sin(time * 0.8 + d.l * 9) * dt * 0.012; if (d.y > 1.05) { d.y -= 1.12; d.x = Math.random() * 1.1; } circ(ctx, d.x * VW, d.y * VH, 0.9 + d.l * 0.8); ctx.fill(); }
      ctx.setTransform(k, 0, 0, k, dpr * ox, dpr * oy);
    }
    if (wz.fog > 0.02) { /* brume : un voile clair qui dérive */
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = 'rgba(224,228,224,' + 0.3 * wz.fog + ')'; ctx.fillRect(0, 0, VW, VH);
      for (let i = 0; i < 5; i++) { const x = ((i * 0.27 + time * 0.012 * (1 + i * 0.3)) % 1.4 - 0.2) * VW, y = (0.2 + i * 0.16) * VH, r0 = VW * 0.62, gr2 = ctx.createRadialGradient(x, y, 0, x, y, r0); gr2.addColorStop(0, 'rgba(238,242,238,' + 0.36 * wz.fog + ')'); gr2.addColorStop(1, 'rgba(238,242,238,0)'); ctx.fillStyle = gr2; ctx.fillRect(x - r0, y - r0, r0 * 2, r0 * 2); }
      ctx.setTransform(k, 0, 0, k, dpr * ox, dpr * oy);
    }
    /* pastilles de manque et textes flottants : toujours lisibles */
    for (const p of view.pawns) {
      const n = (p.hunger > 0 ? 1 : 0) + (p.roofless > 0 ? 1 : 0); if (!n) continue;
      const y = p.y - (p.anim === 'sleepout' ? 22 : 48) + Math.sin(time * 2.4 + p.v.id) * 0.8; let x = p.x - (n - 1) * 6.8;
      if (p.hunger > 0) { chip(x, y, 'food'); x += 13.6; } if (p.roofless > 0) chip(x, y, 'roof');
    }
    for (const b of view.buildings) for (const o of b.occ || []) if (b.reveal < 0.4 && o.hunger > 0 && o.bed != null) chip(b.x + b.w / 2, b.y - 6, 'food'); /* dormeur affamé : rappel discret sur le toit */
    for (const f of floats) drawFloat(f, time);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.drawImage(vign, 0, 0, VW, VH);
  }
  return { init, setMap, setRoads, resize, setView, frame, s2w, w2s, pan, float, burst, ripple, spark, night, zoom, drag, resetZoom, get zoomed() { return zs > 1.01; }, get scale() { return scale; } };
})();
