'use strict';
/* ===== Hameau — dessins (personnages, arbres, bâtiments, sol) ===== */
const ART = (() => {
  const W = SIM.W, H = SIM.H, X = SIM.EXT;
  const hex = h => { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
  const dk = (h, f) => { const c = hex(h); return 'rgb(' + c.map(v => Math.round(v * (1 - f))).join(',') + ')'; };
  const lt = (h, f) => { const c = hex(h); return 'rgb(' + c.map(v => Math.round(v + (255 - v) * f)).join(',') + ')'; };
  const al = (h, a) => { const c = hex(h); return 'rgba(' + c.join(',') + ',' + a + ')'; };
  const line = (g, fill, w) => { g.strokeStyle = dk(fill, 0.5); g.lineWidth = w; g.lineJoin = 'round'; g.lineCap = 'round'; };
  function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  const circ = (g, x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, 6.2832); };
  const ell = (g, x, y, rx, ry, rot) => { g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, 6.2832); };
  const FS = (g, fill, w) => { g.fillStyle = fill; g.fill(); if (w) { line(g, fill, w); g.stroke(); } };

  /* ---------- personnages (piste C : contour teinté, ombrage doux) ---------- */
  const SKINS = ['#F4D6BC', '#E9BE98', '#CC9670', '#A26B4A', '#73472F'];
  const HAIRC = ['#2A211C', '#4E3221', '#7A4E2D', '#A8502A', '#D6B05C', '#A39D94'];
  const OUT = {
    civil: { main: '#B9AE98', sec: '#E9E1CF', low: '#6E5F4E' },
    bucheron: { main: '#A3402F', sec: '#6E2A1F', low: '#4F4A44' },
    cueilleur: { main: '#C8943B', sec: '#EFE4CC', low: '#8E6A2C' },
    paysan: { main: '#6F8F4E', sec: '#D9CBA8', low: '#56703C' },
    pecheur: { main: '#5E8296', sec: '#DCE6E4', low: '#4A4F58' },
    carrier: { main: '#8F8A7E', sec: '#6B4A32', low: '#55504A' },
    boulanger: { main: '#D9BF94', sec: '#FFFDF6', low: '#8A6F52' },
    fermier: { main: '#C28B3A', sec: '#F1E3C0', low: '#7A5A34' },
    champi: { main: '#7C6A4A', sec: '#D9CBA8', low: '#4E4532' },
    musicien: { main: '#7A4E7E', sec: '#EBD9B4', low: '#4A3A50' },
    berger: { main: '#E6DCC4', sec: '#8A6038', low: '#7A6A52' },
    scieur: { main: '#B4532A', sec: '#E9DFC6', low: '#5A4028' },
    cidrier: { main: '#9A3F3F', sec: '#E9C85A', low: '#5A3030' }
  };
  const MORPH = {
    h_mince: { sw: 15, bw: 19, top: 61, bl: 0, fem: 0 }, h_moyen: { sw: 18, bw: 23, top: 60, bl: 1, fem: 0 },
    h_costaud: { sw: 26, bw: 21, top: 58, bl: 0, fem: 0 }, h_fort: { sw: 19, bw: 28, top: 61, bl: 9, fem: 0 },
    f_mince: { sw: 14, bw: 19, top: 62, bl: 0, fem: 1 }, f_moyenne: { sw: 16, bw: 23, top: 61, bl: 1, fem: 1 },
    f_forte: { sw: 19, bw: 27, top: 61, bl: 7, fem: 1 }, f_sablier: { sw: 20, bw: 25, top: 61, bl: 0, fem: 1, wa: 13 }
  };
  function bodyPath(m) {
    const sw = m.sw, T = m.top, bl = m.bl, b = m.bw + (m.fem ? 3 : 0), yA = (T + 110) / 2 + 6;
    if (m.wa) {
      const wa = m.wa, yW = T + (110 - T) * 0.42;
      return `M${50 - b} 110 C${50 - b - 3} 100 ${50 - wa} ${yW + 10} ${50 - wa} ${yW} C${50 - wa} ${yW - 7} ${50 - sw} ${T + 17} ${50 - sw + 5} ${T + 7} Q50 ${T - 3} ${50 + sw - 5} ${T + 7} C${50 + sw} ${T + 17} ${50 + wa} ${yW - 7} ${50 + wa} ${yW} C${50 + wa} ${yW + 10} ${50 + b + 3} 100 ${50 + b} 110 Q50 117 ${50 - b} 110 Z`;
    }
    return `M${50 - b} 110 C${50 - b - bl} ${yA} ${50 - sw} ${T + 20} ${50 - sw + 5} ${T + 7} Q50 ${T - 3} ${50 + sw - 5} ${T + 7} C${50 + sw} ${T + 20} ${50 + b + bl} ${yA} ${50 + b} 110 Q50 117 ${50 - b} 110 Z`;
  }
  const cp = (x, y, r) => `M${x - r} ${y} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 Z `;
  const HAIR_F = {
    curly: cp(35, 28, 6.5) + cp(42, 21, 6.5) + cp(50, 19, 6.5) + cp(58, 21, 6.5) + cp(65, 28, 6.5),
    bun: cp(50, 15, 7.5) + 'M32 36 C31 18 44 18 50 18 C56 18 69 18 68 36 C62 26 38 26 32 36 Z',
    spiky: 'M32 37 L32 22 L38 26 L40 14 L45 22 L50 11 L55 22 L60 14 L62 26 L68 22 L68 37 C62 28 38 28 32 37 Z',
    short: 'M32 36 C31 18 44 15 50 15 C58 15 69 18 68 36 C64 27 57 25 50 26 C43 25 36 27 32 36 Z',
    sidepart: 'M32 41 C30 20 42 15 50 15 C60 15 70 20 68 38 C64 28 60 25 55 25 C48 28 40 31 32 41 Z',
    long: 'M32 42 C30 18 46 15 50 18 C54 15 70 18 68 42 C64 28 56 23 50 24 C44 23 36 28 32 42 Z',
    ponytail: 'M32 37 C31 17 69 17 68 37 C63 26 37 26 32 37 Z',
    braid: 'M32 38 C31 17 69 17 68 38 C64 28 57 24 50 26 C43 24 36 28 32 38 Z',
    braids2: 'M32 40 C30 17 48 15 50 19 C52 15 70 17 68 40 C65 29 57 24 50 25 C43 24 35 29 32 40 Z',
    bob: 'M31 50 C27 16 73 16 69 50 C68 37 62 25 50 25 C38 25 32 37 31 50 Z',
    fringe: 'M32 41 C30 18 44 15 50 15 C56 15 70 18 68 41 L66.5 31.5 C61 34 55 31 50 33 C45 31 39 34 33.5 31.5 Z',
    receding: 'M32 41 C31 29 34 23 40 21 C37 27 36 33 35 41 Z M68 41 C69 29 66 23 60 21 C63 27 64 33 65 41 Z',
    mop: 'M31 43 C27 19 40 12 50 14 C60 12 73 19 69 43 C67 35 63 30 58 28 C55 32 46 32 43 28 C38 30 34 35 31 43 Z',
    tied: 'M32 37 C31 17 44 15 50 15 C56 15 69 17 68 37 C64 27 56 23 50 25 C44 23 36 27 32 37 Z'
  };
  const HAIR_B = { long: 'M30 36 C28 14 72 14 70 36 L72 72 Q50 79 28 72 Z', fringe: 'M30 36 C28 14 72 14 70 36 L71 66 Q50 72 29 66 Z', bob: 'M30 36 C28 14 72 14 70 36 L70.5 54 Q50 60 29.5 54 Z', mop: 'M30 38 C27 14 73 14 70 38 L69 48 Q50 52 31 48 Z', curly: cp(50, 35, 24) };
  const BEARD = {
    full: 'M33 44 C34 60 44 65 50 65 C56 65 66 60 67 44 C62 53 56 55 50 55 C44 55 38 53 33 44 Z',
    goatee: 'M44.5 52 Q50 66 55.5 52 Q50 56 44.5 52 Z M43 50 Q50 46.5 57 50 Q50 51.5 43 50 Z',
    moustache: 'M42.5 50 Q50 45.5 57.5 50 Q50 52.5 42.5 50 Z',
    long: 'M33 44 C33 62 42 73 50 74 C58 73 67 62 67 44 C62 53 56 55 50 55 C44 55 38 53 33 44 Z',
    collier: 'M32.8 41 C33 57 43 63.5 50 63.5 C57 63.5 67 57 67.2 41 C65 53 57 58.5 50 58.5 C43 58.5 35 53 32.8 41 Z',
    favoris: 'M32.6 35 C32 46 35 53 41 55 C38.5 49 37.5 42 37.5 35 Z M67.4 35 C68 46 65 53 59 55 C61.5 49 62.500 42 62.500 35 Z',
    handlebar: 'M41.5 50 Q45.5 46 50 48.5 Q54.5 46 58.5 50 Q61 52 63 48.5 Q62.5 54 57 52.5 Q50 50.5 43 52.5 Q37.5 54 37 48.5 Q39 52 41.5 50 Z',
    stubble: 'M33 44 C34 60 44 65 50 65 C56 65 66 60 67 44 C62 53 56 55 50 55 C44 55 38 53 33 44 Z'
  };
  /* le visage n'est plus un simple ovale : quatre contours */
  const FACE = [
    'M32.5 37 C32.5 24 40 18 50 18 C60 18 67.5 24 67.5 37 C67.5 49 60.500 58 50 58 C39.5 58 32.5 49 32.5 37 Z',
    'M31.5 38 C31.5 25 39.500 18.5 50 18.5 C60.500 18.5 68.5 25 68.5 38 C68.5 49.5 60.500 57 50 57 C39.5 57 31.5 49.5 31.5 38 Z',
    'M32.5 36 C32.5 23 40 18 50 18 C60 18 67.5 23 67.5 36 C67.5 44 66.500 51 61 55.500 C57 58.5 43 58.5 39 55.500 C33.5 51 32.5 44 32.5 36 Z',
    'M32 36 C32 23 40 18 50 18 C60 18 68 23 68 36 C68 45 60 55 54 58.5 Q50 60.500 46 58.5 C40 55 32 45 32 36 Z'
  ];
  /* une natte : des maillons qui se chevauchent et s'amenuisent, noués d'un ruban */
  function braid(g, x0, y0, x1, y1, w, hc) {
    const n = 5, a = Math.atan2(y1 - y0, x1 - x0) - Math.PI / 2;
    for (let i = 0; i < n; i++) { const k = i / (n - 1), r = w * (1 - 0.34 * k); ell(g, x0 + (x1 - x0) * k, y0 + (y1 - y0) * k, r, r * 0.78, a + (i % 2 ? 0.55 : -0.55)); FS(g, hc, 1.9); }
    g.save(); g.translate(x1, y1); g.rotate(a); rr(g, -w * 0.5, 1.5, w, 2.800, 1.2); FS(g, '#B8503B', 1.2); g.beginPath(); g.moveTo(-w * 0.45, 4.5); g.quadraticCurveTo(0, 12, w * 0.45, 4.5); g.closePath(); FS(g, hc, 1.6); g.restore();
  }
  /* quelques mèches : la chevelure cesse d'être un aplat */
  function strands(g, p, hc, back) {
    g.save(); g.clip(p); g.lineCap = 'round'; g.lineWidth = 1.150;
    for (let i = -3; i <= 3; i++) { g.strokeStyle = i === -1 ? lt(hc, 0.24) : dk(hc, 0.26); g.beginPath(); g.moveTo(50 + i * 3.200, back ? 14 : 15); g.quadraticCurveTo(50 + i * 7.5, 22, 50 + i * 10.500, back ? 74 : 40); g.stroke(); }
    g.restore();
  }
  const CAP_B = 'M31.5 44 C29 14 71 14 68.5 44 C64 53 36 53 31.5 44 Z';
  function garments(g, m, outfit, dir) {
    const o = OUT[outfit], T = m.top, fem = m.fem, bw = m.bw;
    const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    const pants = () => { R(0, 101, 100, 20, o.low); g.strokeStyle = dk(o.low, 0.45); g.lineWidth = 1.6; g.beginPath(); g.moveTo(0, 101); g.lineTo(100, 101); g.moveTo(50, 101); g.lineTo(50, 114); g.stroke(); };
    if (outfit === 'bucheron') {
      g.strokeStyle = al(o.sec, 0.6); g.lineWidth = 1.6; g.beginPath();
      for (let x = 20; x < 82; x += 7) { g.moveTo(x, 0); g.lineTo(x, 120); }
      for (let y = T; y < 112; y += 7) { g.moveTo(0, y); g.lineTo(100, y); }
      g.stroke(); R(0, T + 27, 100, 5, '#3A2A20');
      if (fem) R(0, T + 32, 100, 90, o.low); else pants();
    } else if (outfit === 'paysan') {
      if (fem) { R(0, T + 22, 100, 90, o.main); if (dir !== 'b') { rr(g, 41, T + 28, 18, 110 - T - 34, 3); FS(g, '#F3ECDD', 1.4); } }
      else {
        if (dir !== 'b') { g.fillStyle = o.main; g.fillRect(43, T + 9, 14, 20); line(g, o.main, 1.4); g.strokeRect(43, T + 9, 14, 20); }
        R(0, T + 26, 100, 60, o.main);
        g.strokeStyle = o.main; g.lineWidth = 3.2; g.beginPath(); g.moveTo(43, T + 10); g.lineTo(50 - m.sw + 6, T + 5); g.moveTo(57, T + 10); g.lineTo(50 + m.sw - 6, T + 5); g.stroke();
        pants();
      }
    } else if (outfit === 'cueilleur') {
      if (fem) R(0, 103, 100, 20, o.low);
      if (dir !== 'b') { rr(g, 50 - bw * 0.55, T + 21, bw * 1.1, 108 - T - 21, 3); FS(g, o.sec, 1.6); g.strokeStyle = '#8A6A3C'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(50 - bw * 0.55, T + 22); g.quadraticCurveTo(50, T + 26, 50 + bw * 0.55, T + 22); g.stroke(); }
      else { R(0, T + 21, 100, 3.5, o.sec); circ(g, 50, T + 23, 3); FS(g, o.sec, 1.2); }
      if (!fem) pants();
    } else if (outfit === 'pecheur') {
      if (dir !== 'b') R(46.5, T + 4, 7, 110, al(o.sec, 0.6));
      R(0, T + 28, 100, 3.5, '#C9A56A');
      if (fem) R(0, T + 31.5, 100, 90, o.low); else pants();
    } else if (outfit === 'carrier') {
      if (dir !== 'b') { rr(g, 50 - bw * 0.5, T + 14, bw, 110 - T - 20, 3); FS(g, o.sec, 1.6); } else R(0, T + 22, 100, 3.5, o.sec);
      if (fem) R(0, 104, 100, 20, o.low); else pants();
    } else if (outfit === 'boulanger') {
      if (dir !== 'b') { rr(g, 50 - bw * 0.6, T + 19, bw * 1.2, 110 - T - 21, 3); FS(g, o.sec, 1.4); } else R(0, T + 21, 100, 3.5, o.sec);
      if (fem) R(0, 104, 100, 20, o.low); else pants();
    } else {
      if (dir !== 'b') { g.beginPath(); g.moveTo(42, T + 1); g.quadraticCurveTo(50, T + 10, 58, T + 1); g.closePath(); FS(g, o.sec, 1.4); }
      if (fem) { R(0, T + (110 - T) * 0.45, 100, 60, o.low); R(0, 105, 100, 10, al(o.sec, 0.8)); } else pants();
    }
  }
  function drawPawn(g, v, outfit, dir) {
    const m = MORPH[v.morph], o = OUT[outfit], skin = SKINS[v.skin], hc = HAIRC[v.hc], hs = v.hs, side = dir === 'l' || dir === 'r';
    const hat = outfit === 'bucheron' ? 'beanie' : outfit === 'paysan' ? 'straw' : outfit === 'pecheur' ? 'bob' : outfit === 'boulanger' ? 'toque' : outfit === 'carrier' ? 'band' : (outfit === 'cueilleur' && m.fem ? 'scarf' : null), base = outfit === 'paysan' ? o.sec : o.main;
    const bd = new Path2D(bodyPath(m));
    g.save();
    if (side) { g.translate(50, 0); g.scale(0.86, 1); g.translate(-50, 0); }
    const headT = () => { g.translate(50, m.top - 22); g.translate(-50, -38); };
    const TAILF = dir === 'b' ? [50, 50, 50, 84] : dir === 'r' ? [31, 44, 26, 78] : [69, 44, 74, 78];
    const tail = () => {
      g.save(); headT();
      if (hat !== 'scarf') {
        if (hs === 'ponytail') { const q = dir === 'b' ? 'M45 46 C40 60 43 76 50 84 C57 76 60 60 55 46 Z' : dir === 'r' ? 'M36 30 C24 30 19 46 23 62 C25 70 31 72 30 64 C28 52 30 42 37 38 Z' : 'M64 30 C76 30 81 46 77 62 C75 70 69 72 70 64 C72 52 70 42 63 38 Z', p = new Path2D(q); g.fillStyle = hc; g.fill(p); line(g, hc, 2.3); g.stroke(p); g.strokeStyle = dk(hc, 0.26); g.lineWidth = 1.1; g.beginPath(); if (dir === 'b') { g.moveTo(48, 52); g.quadraticCurveTo(46, 66, 50, 80); g.moveTo(52, 52); g.quadraticCurveTo(54, 66, 50, 80); } else { const k = dir === 'r' ? -1 : 1; g.moveTo(50 + k * 18, 36); g.quadraticCurveTo(50 + k * 27, 46, 50 + k * 24, 64); } g.stroke(); rr(g, dir === 'b' ? 45 : dir === 'r' ? 33 : 62, dir === 'b' ? 45 : 31, dir === 'b' ? 10 : 5, dir === 'b' ? 3.200 : 7, 1.4); FS(g, '#B8503B', 1.2); }
        if (hs === 'tied') { const x = dir === 'b' ? 50 : dir === 'r' ? 30 : 70, p = new Path2D(`M${x - 4} 44 Q${x} 62 ${x + 4} 44 Z`); g.fillStyle = hc; g.fill(p); line(g, hc, 2); g.stroke(p); rr(g, x - 4, 42.5, 8, 3, 1.2); FS(g, '#3A2A20', 1); }
        if (hs === 'braid' && dir !== 'f') braid(g, TAILF[0], TAILF[1], TAILF[2], TAILF[3], 5.600, hc);
        if (hs === 'braids2' && dir !== 'f') { if (dir === 'b') { braid(g, 40, 50, 38, 80, 4.800, hc); braid(g, 60, 50, 62, 80, 4.800, hc); } else braid(g, TAILF[0], TAILF[1], TAILF[2], TAILF[3], 4.800, hc); }
        if (HAIR_B[hs]) { const p = new Path2D(HAIR_B[hs]); g.fillStyle = hc; g.fill(p); line(g, hc, 2.4); g.stroke(p); if (dir === 'b') strands(g, p, hc, true); }
      }
      g.restore();
    };
    if (dir !== 'b') tail();
    rr(g, 44.5, m.top - 13, 11, 18, 3); FS(g, dk(skin, 0.12), 0);                    // le cou
    g.fillStyle = base; g.fill(bd);
    g.save(); g.clip(bd); garments(g, m, outfit, dir); g.fillStyle = 'rgba(0,0,0,0.10)'; g.fillRect(50 + m.sw * 0.35, 0, 60, 120); g.restore();
    line(g, base, 2.6); g.stroke(bd);
    /* les bras le long du corps, et les mains */
    { const bb = m.bw + (m.fem ? 3 : 0), yH = 98;
      for (const k of [-1, 1]) {
        const x0 = 50 + k * (m.sw - 6), xm = 50 + k * ((m.wa ? m.wa + 3 : bb) - 6.500), x1 = 50 + k * (bb - 7.500);
        g.save(); g.clip(bd); g.beginPath(); g.moveTo(x0, m.top + 13); g.quadraticCurveTo(xm, (m.top + yH) / 2 + 3, x1, yH); g.lineTo(50 + k * 60, yH); g.lineTo(50 + k * 60, m.top); g.closePath(); g.fillStyle = 'rgba(40,26,14,.13)'; g.fill(); g.restore();   // la manche, un ton plus sombre
        g.strokeStyle = dk(base, 0.36); g.lineWidth = 1.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, m.top + 13); g.quadraticCurveTo(xm, (m.top + yH) / 2 + 3, x1, yH - 1); g.stroke();
        ell(g, 50 + k * (bb - 4.5), yH + 1.5, 3, 3.700, k * 0.25); g.fillStyle = skin; g.fill(); g.strokeStyle = dk(skin, 0.42); g.lineWidth = 1.2; g.stroke();
      } }
    if (dir === 'f' && hat !== 'scarf') { g.save(); headT(); if (hs === 'braid') braid(g, 66.5, 46, 70, 82, 5.600, hc); if (hs === 'braids2') { braid(g, 33.5, 46, 30, 78, 4.800, hc); braid(g, 66.5, 46, 70, 78, 4.800, hc); } g.restore(); }
    if (dir === 'b') tail();
    /* tête */
    g.save(); headT();
    const hp = new Path2D(FACE[(v.face || 0) % 4]);
    if (!side) for (const k of [-1, 1]) { ell(g, 50 + k * 17.800, 40, 3, 4.200); FS(g, dk(skin, 0.05), 2); }                // les oreilles
    g.fillStyle = skin; g.fill(hp);
    g.save(); g.clip(hp); g.fillStyle = 'rgba(0,0,0,0.10)'; ell(g, 66, 44, 13, 24); g.fill(); g.restore();
    line(g, skin, 2.6); g.stroke(hp);
    if (dir === 'b') {
      if (hat === 'scarf') { const p = new Path2D('M30.5 46 C29 14 71 14 69.5 46 C64 56 36 56 30.5 46 Z'); g.fillStyle = '#B8503B'; g.fill(p); line(g, '#B8503B', 2.4); g.stroke(p); g.beginPath(); g.moveTo(46, 54); g.lineTo(42, 64); g.lineTo(50, 58); g.lineTo(58, 64); g.lineTo(54, 54); g.closePath(); FS(g, '#B8503B', 1.8); }
      else if (hs !== 'bald') { const p = new Path2D(hs === 'receding' ? 'M31.5 44 C30.5 30 34 22 42 19 C39 30 38 38 39 50 C35 49 32.5 47 31.5 44 Z M68.5 44 C69.5 30 66 22 58 19 C61 30 62 38 61 50 C65 49 67.500 47 68.5 44 Z M39 50 C38 40 62 40 61 50 C57 52.5 43 52.5 39 50 Z' : CAP_B); g.fillStyle = hc; g.fill(p); line(g, hc, 2.4); g.stroke(p); if (hs !== 'curly' && hs !== 'receding') strands(g, p, hc, true); if (HAIR_B[hs] && hs !== 'curly') { const q = new Path2D(HAIR_B[hs]); g.fillStyle = hc; g.fill(q); line(g, hc, 2.4); g.stroke(q); strands(g, q, hc, true); } if (hs === 'bun') { circ(g, 50, 16, 7.5); FS(g, hc, 2.2); } }
    } else {
      const sh = dir === 'l' ? -5 : dir === 'r' ? 5 : 0;
      const ex = [43.5 + sh, 56.5 + sh], INK = '#1F1A17', et = (v.eyes || 0) % 4, ch = v.char, skd = dk(skin, 0.42);
      if (v.blush) { g.fillStyle = 'rgba(214,92,84,.16)'; for (const x of ex) { ell(g, x + (x < 50 + sh ? -2.5 : 2.5), 47.5, 4.200, 2.800); g.fill(); } }
      ex.forEach((x, i) => {
        const far = side && ((dir === 'r' && i === 0) || (dir === 'l' && i === 1)), k = far ? 0.8 : 1;
        if (et === 1) { ell(g, x, 42, 3.200 * k, 2.300); g.fillStyle = '#FBF6EA'; g.fill(); g.fillStyle = INK; circ(g, x, 42.2, 1.650 * k); g.fill(); g.strokeStyle = INK; g.lineWidth = 1.1; g.beginPath(); g.moveTo(x - 3.400 * k, 41.6); g.quadraticCurveTo(x, 38.8, x + 3.400 * k, 41.6); g.stroke(); }
        else if (et === 2) { g.fillStyle = INK; circ(g, x, 42.4, 1.900 * k); g.fill(); g.strokeStyle = INK; g.lineWidth = 1.3; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - 3.200 * k, 41.2); g.lineTo(x + 3.200 * k, 41.2); g.stroke(); }
        else if (et === 3) { circ(g, x, 42, 2.900 * k); g.fillStyle = '#FBF6EA'; g.fill(); g.strokeStyle = skd; g.lineWidth = 0.800; g.stroke(); g.fillStyle = INK; circ(g, x + 0.3, 42.3, 1.750 * k); g.fill(); g.fillStyle = '#FFFFFF'; circ(g, x - 0.5, 41.5, 0.600); g.fill(); }
        else { g.fillStyle = INK; circ(g, x, 42, 1.900 * k); g.fill(); }
        /* les sourcils disent le caractère */
        const d = i === 0 ? 1 : -1, bw0 = ch === 'bougon' ? 1.9 : ch === 'genereux' ? 1.050 : 1.4, yi = ch === 'inquiet' ? 35.2 : ch === 'bougon' ? 38.4 : 36.6, yo = ch === 'inquiet' ? 37.6 : ch === 'bougon' ? 36.4 : 36.9, ym = ch === 'confiant' || ch === 'genereux' ? 35 : (yi + yo) / 2;
        g.strokeStyle = dk(hc, 0.25); g.lineWidth = bw0; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - d * 3.300 * k, yo); g.quadraticCurveTo(x, ym, x + d * 3 * k, yi); g.stroke();
      });
      const nx = 50 + sh * 1.3; g.strokeStyle = skd; g.lineWidth = 1.150; g.lineCap = 'round'; g.beginPath();
      if ((v.nose || 0) % 3 === 1) { g.moveTo(nx - 1.5, 45.5); g.quadraticCurveTo(nx, 47.4, nx + 1.5, 45.5); } else if ((v.nose || 0) % 3 === 2) { g.moveTo(nx + 0.6, 42.5); g.quadraticCurveTo(nx + 2.300, 46, nx - 0.6, 46.6); } else { g.moveTo(nx - 0.9, 46); g.lineTo(nx + 0.9, 46); }
      g.stroke();
      g.beginPath(); const mx = 50 + sh * 1.1, mq = ch === 'bougon' ? -1.1 : ch === 'taiseux' ? 0 : ch === 'inquiet' ? 0.3 : 1.5; g.moveTo(mx - 3, 51); g.quadraticCurveTo(mx, 51 + mq, mx + 3, 51); g.strokeStyle = dk(skin, 0.5); g.lineWidth = 1.250; g.stroke();
      if (v.beard && BEARD[v.beard]) { g.save(); g.translate(sh * 0.4, 0); const p = new Path2D(BEARD[v.beard]); if (v.beard === 'stubble') { g.fillStyle = al(hc, 0.3); g.fill(p); } else { g.fillStyle = hc; g.fill(p); line(g, hc, 2); g.stroke(p); if (v.beard === 'full' || v.beard === 'long') { g.save(); g.clip(p); g.strokeStyle = dk(hc, 0.24); g.lineWidth = 1; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(50 + i * 5, 54); g.quadraticCurveTo(50 + i * 4.200, 62, 50 + i * 2.800, 73); g.stroke(); } g.restore(); } } g.restore(); }
      if (hat !== 'beanie' && hat !== 'scarf' && HAIR_F[hs]) { const p = new Path2D(HAIR_F[hs]); g.fillStyle = hc; g.fill(p); line(g, hc, 2.4); g.stroke(p); if (hs !== 'curly' && hs !== 'spiky' && hs !== 'receding') strands(g, p, hc, false); }
      if (hat === 'scarf') { const p = new Path2D('M30.5 46 C29 16 71 16 69.5 46 C66 30 58 26.5 50 26.5 C42 26.5 34 30 30.5 46 Z'); g.fillStyle = '#B8503B'; g.fill(p); line(g, '#B8503B', 2.4); g.stroke(p); g.fillStyle = '#F3E3C8';[[40, 22], [52, 19], [62, 24]].forEach(q => { circ(g, q[0], q[1], 1.6); g.fill(); }); }
    }
    if (hat === 'straw') { ell(g, 50, 24, 29, 6.2); FS(g, '#DCC071', 2.4); const p = new Path2D('M37 24 C37 8 63 8 63 24 Z'); g.fillStyle = '#DCC071'; g.fill(p); line(g, '#DCC071', 2.4); g.stroke(p); g.fillStyle = '#9C3D2E'; g.fillRect(37.6, 20, 24.8, 3.6); }
    if (hat === 'bob') { ell(g, 50, 26, 25, 5.6); FS(g, '#4E6E80', 2.4); const p = new Path2D('M36 26 C36 9 64 9 64 26 Z'); g.fillStyle = '#5E8296'; g.fill(p); line(g, '#5E8296', 2.4); g.stroke(p); g.fillStyle = '#E9DFC6'; g.fillRect(36.6, 21.5, 26.8, 2.6); }
    if (hat === 'toque') { const p = new Path2D('M33 27 C24 6 44 6 50 11 C56 6 76 6 67 27 Z'); g.fillStyle = '#FFFDF6'; g.fill(p); line(g, '#D9CDB4', 2.4); g.stroke(p); rr(g, 32, 23.5, 36, 6.5, 3); FS(g, '#FFFDF6', 0); line(g, '#D9CDB4', 2.2); g.stroke(); }
    if (hat === 'band') { rr(g, 31.5, 26.5, 37, 5, 2.4); FS(g, '#B4532A', 2); }
    if (hat === 'beanie') { let p = new Path2D('M31.5 34 C31 13 69 13 68.5 34 Z'); g.fillStyle = '#7E2E22'; g.fill(p); line(g, '#7E2E22', 2.4); g.stroke(p); rr(g, 30.5, 29, 39, 7.5, 3.5); FS(g, '#93392B', 2.2); }
    g.restore();
    g.restore();
  }

  /* ---------- végétation ---------- */
  const TREEPAL = [['#C9733A', '#E7A25C', '#9A5226'], ['#B5452E', '#D4704E', '#873222'], ['#D8A440', '#EECB68', '#A87B28'], ['#6F8F48', '#8DAE5E', '#4E6B33'], ['#A8623A', '#C98856', '#7E4628']];
  function drawTree(g, t) {
    const r = t.r, rng = SIM.rngOf(t.id * 131 + 7);
    if (t.kind === 'pine') {
      const star = (rad, inner, col, rot) => { g.beginPath(); for (let i = 0; i < 18; i++) { const a = 6.2832 * i / 18 + rot, q = i % 2 ? inner : rad; g.lineTo(q * Math.cos(a), q * Math.sin(a)); } g.closePath(); FS(g, col, 1.2); };
      star(r, r * 0.64, '#2F5A44', t.ph); star(r * 0.72, r * 0.46, '#3B6C50', t.ph + 0.25); star(r * 0.45, r * 0.27, '#4F8262', t.ph + 0.1);
      g.fillStyle = 'rgba(255,255,255,0.10)'; circ(g, -r * 0.25, -r * 0.25, r * 0.3); g.fill();
      return;
    }
    const [mid, light, dark] = TREEPAL[t.pal];
    const lobes = [[0, 0, 0.68]];
    const n = 5 + Math.floor(rng() * 2);
    for (let i = 0; i < n; i++) { const a = 6.2832 * i / n + rng() * 0.5, d = 0.42 + rng() * 0.1; lobes.push([Math.cos(a) * d, Math.sin(a) * d * 0.9, 0.5 + rng() * 0.12]); }
    line(g, mid, 2.6); for (const l of lobes) { circ(g, l[0] * r, l[1] * r, l[2] * r); g.stroke(); }
    g.fillStyle = mid; for (const l of lobes) { circ(g, l[0] * r, l[1] * r, l[2] * r); g.fill(); }
    g.fillStyle = al(dark, 0.55); for (const l of lobes) { circ(g, l[0] * r + l[2] * r * 0.22, l[1] * r + l[2] * r * 0.26, l[2] * r * 0.72); g.fill(); }
    g.fillStyle = mid; for (const l of lobes) { circ(g, l[0] * r - l[2] * r * 0.06, l[1] * r - l[2] * r * 0.08, l[2] * r * 0.7); g.fill(); }
    g.fillStyle = al(light, 0.9); for (const l of lobes.slice(0, 4)) { circ(g, l[0] * r - l[2] * r * 0.28, l[1] * r - l[2] * r * 0.3, l[2] * r * 0.36); g.fill(); }
    for (let i = 0; i < r * 1.6; i++) {
      const a = rng() * 6.2832, d = Math.sqrt(rng()) * r * 0.92, x = Math.cos(a) * d, y = Math.sin(a) * d * 0.92;
      g.fillStyle = rng() < 0.5 ? al(light, 0.75) : al(dark, 0.6); ell(g, x, y, 1.5, 0.8, rng() * 3.14); g.fill();
    }
  }
  function drawBush(g, berries) {
    const col = '#5F8742', r = 7;
    const L = [[-0.55, 0.05], [0.5, 0.1], [0, -0.42], [0, 0.25]];
    line(g, col, 2.2); for (const l of L) { circ(g, l[0] * r, l[1] * r, r * 0.62); g.stroke(); }
    g.fillStyle = col; for (const l of L) { circ(g, l[0] * r, l[1] * r, r * 0.62); g.fill(); }
    g.fillStyle = 'rgba(40,60,28,0.4)'; for (const l of L) { circ(g, l[0] * r + 1.2, l[1] * r + 1.4, r * 0.42); g.fill(); }
    g.fillStyle = col; for (const l of L) { circ(g, l[0] * r, l[1] * r, r * 0.4); g.fill(); }
    g.fillStyle = '#86AE5C'; for (const l of L) { circ(g, l[0] * r - 1.3, l[1] * r - 1.4, r * 0.22); g.fill(); }
    if (berries) for (const q of [[-5, -1], [-1.5, -4.5], [3, -2], [5.5, 2], [-3, 3], [1, 2.5]]) { g.fillStyle = '#7E1F2E'; circ(g, q[0] + 0.3, q[1] + 0.4, 1.5); g.fill(); g.fillStyle = '#C8384A'; circ(g, q[0], q[1], 1.3); g.fill(); g.fillStyle = 'rgba(255,255,255,.7)'; circ(g, q[0] - 0.4, q[1] - 0.4, 0.4); g.fill(); }
  }
  function drawRock(g, s) {
    g.beginPath(); g.moveTo(-s, s * 0.3); g.lineTo(-s * 0.6, -s * 0.6); g.lineTo(s * 0.3, -s * 0.8); g.lineTo(s, -s * 0.1); g.lineTo(s * 0.6, s * 0.6); g.lineTo(-s * 0.3, s * 0.7); g.closePath(); FS(g, '#9E998E', 1.3);
    g.beginPath(); g.moveTo(-s * 0.6, -s * 0.5); g.lineTo(s * 0.25, -s * 0.7); g.lineTo(s * 0.3, -s * 0.1); g.lineTo(-s * 0.4, 0); g.closePath(); g.fillStyle = 'rgba(255,255,255,.3)'; g.fill();
  }
  function drawStump(g, r) {
    const c = '#B08456'; ell(g, 0, 1.5, r, r * 0.8); FS(g, '#7A5636', 1.2); ell(g, 0, 0, r, r * 0.8); FS(g, c, 1.2);
    g.strokeStyle = dk(c, 0.22); g.lineWidth = 0.8; ell(g, 0, 0, r * 0.62, r * 0.5); g.stroke(); ell(g, 0, 0, r * 0.28, r * 0.22); g.stroke();
  }

  /* ---------- bâtiments ---------- */
  const FH = 13; // hauteur de façade visible
  function planks(g, x, y, w, h, c, step) {
    g.fillStyle = c; g.fillRect(x, y, w, h);
    g.strokeStyle = dk(c, 0.2); g.lineWidth = 0.7; g.beginPath();
    for (let yy = y + step; yy < y + h - 0.5; yy += step) { g.moveTo(x, yy); g.lineTo(x + w, yy); }
    for (let yy = y, k = 0; yy < y + h; yy += step, k++) for (let xx = x + 9 + (k % 3) * 7; xx < x + w; xx += 21) { g.moveTo(xx, yy); g.lineTo(xx, Math.min(y + h, yy + step)); }
    g.stroke();
  }
  function wallsPlan(g, w, h, c) {
    const t = 4, mx = w / 2, gap = 11;
    g.strokeStyle = dk(c, 0.5); g.lineWidth = t + 1.4; g.lineJoin = 'miter'; g.lineCap = 'butt';
    const p = () => { g.beginPath(); g.moveTo(mx - gap / 2, h - t / 2); g.lineTo(t / 2, h - t / 2); g.lineTo(t / 2, t / 2); g.lineTo(w - t / 2, t / 2); g.lineTo(w - t / 2, h - t / 2); g.lineTo(mx + gap / 2, h - t / 2); };
    p(); g.stroke(); g.strokeStyle = c; g.lineWidth = t; p(); g.stroke();
    g.strokeStyle = lt(c, 0.25); g.lineWidth = 1; g.beginPath(); g.moveTo(1.5, h - 2); g.lineTo(1.5, 1.5); g.lineTo(w - 2, 1.5); g.stroke();
  }
  function bed(g, x, y) {
    rr(g, x, y, 12, 20, 2); FS(g, '#8A6038', 1.2);
    rr(g, x + 1.2, y + 1.2, 9.6, 6.5, 1.5); FS(g, '#F2EBDC', 0.8);
    rr(g, x + 1.2, y + 8, 9.6, 10.8, 1.5); FS(g, '#6F8FB8', 0.8);
    g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x + 1.6, y + 8.4, 8.8, 2);
  }
  function roofTex(g, x, y, w, h, c1, c2, kind) {
    const mid = y + h * 0.46;
    g.fillStyle = c2; g.fillRect(x, y, w, h); g.fillStyle = c1; g.fillRect(x, y, w, mid - y);
    const rng = SIM.rngOf(Math.round(w * 7 + h * 3 + kind.length));
    if (kind === 'thatch') {
      for (let i = 0; i < w * h * 0.22; i++) { const px = x + rng() * w, py = y + rng() * h, top = py < mid; g.strokeStyle = rng() < 0.5 ? al('#F3DDA0', 0.55) : al(top ? '#A8853F' : '#7E6230', 0.5); g.lineWidth = 0.8; g.beginPath(); g.moveTo(px, py); g.lineTo(px + (rng() - 0.5) * 1.2, py + 2.5 + rng() * 2.5); g.stroke(); }
      g.strokeStyle = al('#7E6230', 0.5); g.lineWidth = 1; for (let yy = y + 6; yy < y + h - 2; yy += 7) { g.beginPath(); g.moveTo(x, yy); g.lineTo(x + w, yy); g.stroke(); }
    } else if (kind === 'moss') {
      g.strokeStyle = al('#3F5A2E', 0.45); g.lineWidth = 0.8;
      for (let yy = y + 4, k = 0; yy < y + h - 1; yy += 4.5, k++) { g.beginPath(); g.moveTo(x, yy); g.lineTo(x + w, yy); g.stroke(); for (let xx = x + (k % 2) * 3.5; xx < x + w; xx += 7) { g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx, yy + 4.5); g.stroke(); } }
      for (let i = 0; i < 16; i++) { g.fillStyle = al(rng() < 0.5 ? '#A9C36A' : '#5E7F3C', 0.6); ell(g, x + 3 + rng() * (w - 6), y + 3 + rng() * (h - 6), 2 + rng() * 3.5, 1.5 + rng() * 2, rng() * 3); g.fill(); }
    } else if (kind === 'tile') {
      g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
      for (let i = 0; i < 14; i++) { g.fillStyle = al(rng() < 0.5 ? '#E39468' : '#8A452B', 0.4); g.fillRect(x + Math.floor(rng() * (w / 6)) * 6, y + Math.floor(rng() * (h / 4.5)) * 4.5, 6, 4.5); }
      g.strokeStyle = al('#6E3320', 0.55); g.lineWidth = 0.8;
      for (let yy = y + 4.5, k = 0; yy < y + h + 4; yy += 4.5, k++) { g.beginPath(); for (let xx = x - (k % 2) * 3; xx < x + w; xx += 6) { g.moveTo(xx, yy - 0.6); g.quadraticCurveTo(xx + 3, yy + 2.4, xx + 6, yy - 0.6); } g.stroke(); }
      g.restore();
    } else {
      g.strokeStyle = al('#4A3220', 0.5); g.lineWidth = 0.9;
      for (let xx = x + 6; xx < x + w - 1; xx += 6.5) { g.beginPath(); g.moveTo(xx, y); g.lineTo(xx, y + h); g.stroke(); }
      for (let i = 0; i < 14; i++) { g.fillStyle = al('#4A3220', 0.5); circ(g, x + 3 + Math.floor(rng() * (w / 6.5)) * 6.5, y + 3 + rng() * (h - 6), 0.6); g.fill(); }
    }
    g.strokeStyle = dk(c2, 0.35); g.lineWidth = 2.2; g.beginPath(); g.moveTo(x, mid); g.lineTo(x + w, mid); g.stroke();
    g.strokeStyle = al('#FFFFFF', 0.28); g.lineWidth = 1; g.beginPath(); g.moveTo(x + 1, mid - 1.6); g.lineTo(x + w - 1, mid - 1.6); g.stroke();
  }
  function facade(g, w, h, wall, o) {
    const y = h - FH - 2;
    g.fillStyle = wall; g.fillRect(2, y, w - 4, FH + 2);
    g.strokeStyle = al('#5A4028', 0.35); g.lineWidth = 0.7; g.beginPath(); for (let x = 7; x < w - 4; x += 5.5) { g.moveTo(x, y + 3); g.lineTo(x, h); } g.stroke();
    g.fillStyle = 'rgba(30,20,12,0.34)'; g.fillRect(2, y, w - 4, 4.5);
    line(g, wall, 1.3); g.strokeRect(2, y, w - 4, FH + 2);
    g.fillStyle = '#7A5636'; g.fillRect(2, y, 3, FH + 2); g.fillRect(w - 5, y, 3, FH + 2);
    if (!o.open) {
      const dx = w / 2 - 5; rr(g, dx, h - 11, 10, 11, 2.5); FS(g, '#6B4729', 1.2);
      g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(w / 2, h - 10); g.lineTo(w / 2, h); g.stroke();
      g.fillStyle = '#E3C46B'; circ(g, w / 2 + 2.6, h - 5, 0.9); g.fill();
      for (const wx of o.win || []) { rr(g, wx, h - 10, 8, 6, 1); FS(g, '#3A4854', 1.1); g.strokeStyle = dk(wall, 0.45); g.lineWidth = 0.8; g.beginPath(); g.moveTo(wx + 4, h - 10); g.lineTo(wx + 4, h - 4); g.stroke(); }
    }
  }
  const BDEF = {
    cabane: { beds: [[7, 7], [29, 7]], win: [8], lights: [[12, 37], [24, 40]] },
    foyer: { beds: [[5, 8], [19, 8], [35, 8], [49, 8]], win: [8, 46], lights: [[12, 41], [52, 41], [32, 44]] }, longere: { beds: [[6, 7], [28, 7], [50, 7]], win: [8, 48], lights: [[12, 35], [54, 35], [33, 38]] },
    ferme: { beds: [[5, 8], [21, 8], [37, 8]], win: [8, 46], lights: [[12, 41], [52, 41]] }, ecole: { win: [8, 38], lights: [[12, 39], [44, 39], [28, 42]], seats: [[14, 24], [28, 24], [42, 24]] }, bibliotheque: { win: [6, 32], lights: [[10, 37], [38, 37]] },
    cantine: { win: [8, 36], lights: [[12, 37], [42, 37], [27, 40]] }, chevre: { win: [], lights: [[22, 35]] }, bassecour: { win: [], lights: [[24, 37]] }, marionnettes: { win: [], lights: [[22, 37]], lamp: true }, jeux: { win: [], lights: [] },
    cabanon: { beds: [[5, 6]], win: [4], lights: [[8, 33], [18, 36]] },
    maison: { beds: [[7, 8], [29, 8]], win: [8, 32], lights: [[12, 39], [36, 39], [24, 42]] },
    cueillette: { win: [9, 47], lights: [[13, 41], [51, 41], [32, 44]] },
    bucheron: { win: [], lights: [[32, 40]] },
    potager: { win: [], lights: [] },
    pecheur: { win: [], lights: [[22, 37]] },
    carriere: { win: [], lights: [] },
    table: { win: [], lights: [[29, 16]], lamp: true },
    abri: { beds: [[4, 6], [16, 6], [28, 6], [40, 6]], win: [], lights: [] },
    dortoir: { beds: [[6, 7], [24, 7], [42, 7], [60, 7]], win: [8, 58], lights: [[12, 38], [62, 38], [38, 41]] },
    poulailler: { win: [], lights: [[24, 37]] }, champi: { win: [], lights: [[22, 37]] },
    rucher: { win: [], lights: [] }, serre: { win: [], lights: [] }, jardin: { win: [], lights: [] },
    fanal: { win: [], lights: [[14, 10], [14, 14]], lamp: true }, kiosque: { win: [], lights: [[22, 22]], lamp: true },
    moulin: { win: [6], lights: [[10, 44], [22, 46]] },
    grange: { beds: [[6, 8], [19, 8], [32, 8], [45, 8], [58, 8], [71, 8]], win: [], lights: [[42, 44]] },
    chaumiere: { beds: [[6, 8], [24, 8], [42, 8]], win: [8, 42], lights: [[12, 39], [46, 39], [30, 42]] },
    tente: { beds: [[6, 5], [20, 5]], win: [], lights: [] },
    auberge: { beds: [[7, 8], [25, 8]], win: [8, 46], lights: [[12, 41], [50, 41], [32, 44]], lamp: true },
    verger: { win: [], lights: [] }, puits: { win: [], lights: [] }, etal: { win: [], lights: [] }, gardemanger: { win: [], lights: [] }, taillerie: { win: [], lights: [] }, bucher: { win: [], lights: [] }, digue: { win: [], lights: [] }, rubans: { win: [], lights: [] },
    bergerie: { win: [], lights: [[26, 39]] }, scierie: { win: [], lights: [[30, 41]] }, menuiserie: { win: [8], lights: [[12, 37], [26, 40]] }, pressoir: { win: [8], lights: [[12, 37], [24, 40]] }, cellier: { win: [], lights: [[20, 33]] },
    fumoir: { win: [], lights: [[18, 37]], chimney: [18, 8] }, bains: { win: [30], lights: [[34, 35], [22, 38]], chimney: [12, 8] },
    brasero: { win: [], lights: [[13, 11], [13, 13]], lamp: true }, cloche: { win: [], lights: [] },
    four: { win: [30], lights: [[34, 40], [22, 42]], work: [29, 30], chimney: [32, 9], glow: true }
  };
  /* ---------- dix bâtiments de plus ---------- */
  const OPEN = {
    jeux(g, w, h) {
      rr(g, 0, 0, w, h, 6); g.fillStyle = 'rgba(150,168,96,.55)'; g.fill();
      ell(g, w - 13, h - 10, 10, 6.5); FS(g, '#E8D29A', 1); g.fillStyle = '#C8384A'; circ(g, w - 15, h - 11, 1.8); g.fill(); g.fillStyle = '#4E6E80'; g.fillRect(w - 11, h - 10, 3, 2.4);
      g.strokeStyle = '#7A5636'; g.lineWidth = 1.8; g.lineCap = 'round'; g.beginPath(); g.moveTo(6, h - 5); g.lineTo(11, 7); g.lineTo(27, 7); g.lineTo(32, h - 5); g.stroke();
      g.strokeStyle = '#4A3A2C'; g.lineWidth = 0.8; for (const x of [15, 23]) { g.beginPath(); g.moveTo(x, 7); g.lineTo(x + 1.5, h - 13); g.stroke(); } g.fillStyle = '#D9A441'; g.fillRect(14.5, h - 14, 4, 1.8); g.fillStyle = '#8C3B4A'; g.fillRect(22.5, h - 14, 4, 1.8);
    },
    rucher(g, w, h) {
      rr(g, 0, 0, w, h, 6); g.fillStyle = 'rgba(150,168,96,.55)'; g.fill();
      rr(g, 4, h - 13, w - 8, 5, 2); FS(g, '#9C7146', 1);
      for (const x of [10, 22, 34]) { g.fillStyle = 'rgba(30,22,14,.22)'; ell(g, x + 1.500, h - 13, 6, 3); g.fill(); g.beginPath(); g.moveTo(x - 5.500, h - 12); g.quadraticCurveTo(x - 5.500, h - 27, x, h - 27); g.quadraticCurveTo(x + 5.500, h - 27, x + 5.500, h - 12); g.closePath(); FS(g, '#E0B95C', 1.1); g.strokeStyle = 'rgba(120,84,30,.6)'; g.lineWidth = 0.7; for (const y of [h - 23, h - 19.500, h - 16]) { g.beginPath(); g.moveTo(x - 5, y); g.lineTo(x + 5, y); g.stroke(); } g.fillStyle = '#3A2A20'; ell(g, x, h - 13.500, 1.600, 1.200); g.fill(); }
      const r = SIM.rngOf(17); for (let i = 0; i < 9; i++) { g.fillStyle = i % 2 ? '#F2EEDC' : '#E9C85A'; circ(g, 3 + r() * (w - 6), 2 + r() * 6, 1.200); g.fill(); }
      for (let i = 0; i < 6; i++) { g.fillStyle = '#3A2A20'; circ(g, 5 + r() * (w - 10), 4 + r() * (h - 20), 0.700); g.fill(); }
    },
    serre(g, w, h) {
      rr(g, 0, 0, w, h, 3); FS(g, '#8A6038', 1.2);
      for (let i = 0; i < 3; i++) { rr(g, 4 + i * 14.500, 4, 11, h - 8, 2); g.fillStyle = '#6E5338'; g.fill(); for (let k = 0; k < 5; k++) { g.fillStyle = k % 2 ? '#7FA65A' : '#5E8A46'; circ(g, 9.500 + i * 14.500, 8 + k * 6.200, 3); g.fill(); if ((i + k) % 3 === 0) { g.fillStyle = '#C8384A'; circ(g, 10.500 + i * 14.500, 8 + k * 6.200, 1.100); g.fill(); } } }
      g.fillStyle = 'rgba(206,232,236,.42)'; g.fillRect(1.500, 1.500, w - 3, h - 3);
      g.strokeStyle = 'rgba(250,252,250,.9)'; g.lineWidth = 1.100; g.beginPath(); for (let x = 1.500; x <= w - 1; x += (w - 3) / 4) { g.moveTo(x, 1.500); g.lineTo(x, h - 1.500); } g.moveTo(1.500, h / 2); g.lineTo(w - 1.500, h / 2); g.stroke(); g.strokeRect(1.500, 1.500, w - 3, h - 3);
      g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(4, 3); g.lineTo(14, 3); g.lineTo(6, h * 0.45); g.lineTo(4, h * 0.45); g.closePath(); g.fill();
    },
    fanal(g, w, h) {
      g.fillStyle = 'rgba(30,22,14,.22)'; ell(g, w / 2 + 1.500, h - 6, 9, 5); g.fill();
      ell(g, w / 2, h - 8, 8.500, 5.500); FS(g, '#A39C8F', 1.2); ell(g, w / 2, h - 9, 5.500, 3.500); g.fillStyle = '#B9B1A4'; g.fill();
      g.fillStyle = '#6B4A2E'; g.fillRect(w / 2 - 1.300, 8, 2.600, h - 17); g.strokeStyle = 'rgba(40,26,14,.6)'; g.lineWidth = 0.600; g.strokeRect(w / 2 - 1.300, 8, 2.600, h - 17);
      rr(g, w / 2 - 5, 2, 10, 11, 2); FS(g, '#4A3A2C', 1.1); rr(g, w / 2 - 3.200, 4, 6.400, 7, 1); g.fillStyle = '#FFD87A'; g.fill(); g.fillStyle = '#FFF6D0'; circ(g, w / 2, 7.500, 1.600); g.fill();
      g.beginPath(); g.moveTo(w / 2 - 6, 2.500); g.lineTo(w / 2, -1.500); g.lineTo(w / 2 + 6, 2.500); g.closePath(); FS(g, '#6B4A2E', 1);
    },
    jardin(g, w, h) {
      rr(g, 0, 0, w, h, 6); FS(g, '#8A6A48', 1.2);
      const r = SIM.rngOf(23), C = ['#E46A8A', '#F2C14E', '#F4EEDC', '#B07CC6', '#E8894A', '#D9483A'];
      for (let i = 0; i < 3; i++) { rr(g, 4, 4 + i * 10, w - 8, 7.500, 3); g.fillStyle = '#5E7F3C'; g.fill(); }
      for (let i = 0; i < 46; i++) { const x = 6 + r() * (w - 12), y = 5.500 + Math.floor(r() * 3) * 10 + r() * 4.500; g.fillStyle = C[Math.floor(r() * 6)]; circ(g, x, y, 1.500 + r() * 0.800); g.fill(); g.fillStyle = 'rgba(255,255,255,.5)'; circ(g, x - 0.400, y - 0.400, 0.500); g.fill(); }
      for (let x = 2; x < w; x += 7.300) { rr(g, x - 1, h - 3.500, 2, 5, 0.800); FS(g, '#C9A56A', 0.700); }
    },
    kiosque(g, w, h) {
      const cx = w / 2, cy = h / 2 - 1, R0 = 19, P = k => [cx + R0 * Math.cos(k * Math.PI / 4 + Math.PI / 8), cy + R0 * 0.920 * Math.sin(k * Math.PI / 4 + Math.PI / 8)];
      g.fillStyle = 'rgba(30,22,14,.25)'; g.beginPath(); for (let k = 0; k < 8; k++) { const q = P(k); k ? g.lineTo(q[0] + 2, q[1] + 4) : g.moveTo(q[0] + 2, q[1] + 4); } g.closePath(); g.fill();
      g.beginPath(); for (let k = 0; k < 8; k++) { const q = P(k); k ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); } g.closePath(); FS(g, '#C99A62', 1.3);
      g.strokeStyle = 'rgba(90,60,30,.5)'; g.lineWidth = 0.700; for (let y = cy - 14; y < cy + 16; y += 4.500) { g.beginPath(); g.moveTo(cx - 17, y); g.lineTo(cx + 17, y); g.stroke(); }
      g.beginPath(); for (let k = 0; k < 8; k++) { const q = P(k), x = cx + (q[0] - cx) * 0.720, y = cy - 2 + (q[1] - cy) * 0.720; k ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); FS(g, '#8C5A78', 1.3);
      g.strokeStyle = 'rgba(60,30,50,.5)'; g.lineWidth = 0.800; for (let k = 0; k < 8; k++) { const q = P(k); g.beginPath(); g.moveTo(cx, cy - 2); g.lineTo(cx + (q[0] - cx) * 0.720, cy - 2 + (q[1] - cy) * 0.720); g.stroke(); }
      g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.moveTo(cx, cy - 2); const a0 = P(4), a1 = P(5); g.lineTo(cx + (a0[0] - cx) * 0.720, cy - 2 + (a0[1] - cy) * 0.720); g.lineTo(cx + (a1[0] - cx) * 0.720, cy - 2 + (a1[1] - cy) * 0.720); g.closePath(); g.fill();
      for (let k = 0; k < 8; k++) { const q = P(k); circ(g, q[0], q[1], 1.700); FS(g, '#8A6038', 0.800); }
      circ(g, cx, cy - 2, 2.200); FS(g, '#E9C85A', 0.900);
    }
  };
  /* ---------- vingt de plus ---------- */
  const blk = (g, x, y, bw, bh, c) => { g.fillStyle = 'rgba(30,22,14,.22)'; g.fillRect(x + 1, y + 1.500, bw, bh); rr(g, x, y, bw, bh, 1); FS(g, c, 1); g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(x + 0.800, y + 0.800, bw - 1.600, 1.200); };
  const logs = (g, x, y, n, rows) => { for (let r0 = 0; r0 < rows; r0++) for (let i = 0; i < n - r0; i++) { circ(g, x + i * 5.400 + r0 * 2.700, y - r0 * 4.600, 2.700); FS(g, '#B48858', 0.900); g.fillStyle = '#8A6038'; circ(g, x + i * 5.400 + r0 * 2.700, y - r0 * 4.600, 0.900); g.fill(); } };
  const barrel = (g, x, y, r0) => { circ(g, x, y, r0); FS(g, '#9C7146', 1); circ(g, x, y, r0 * 0.620); g.strokeStyle = 'rgba(60,40,22,.6)'; g.lineWidth = 0.700; g.stroke(); };
  Object.assign(OPEN, {
    verger(g, w, h) {
      rr(g, 0, 0, w, h, 7); g.fillStyle = 'rgba(150,168,96,.6)'; g.fill();
      for (let i = 0; i < 6; i++) { const x = 11 + (i % 3) * 17, y = 12 + Math.floor(i / 3) * 20; g.fillStyle = 'rgba(40,46,24,.25)'; ell(g, x + 2, y + 3, 7.500, 6); g.fill(); circ(g, x, y, 7); FS(g, i % 2 ? '#7FA65A' : '#6E9A4E', 1); g.fillStyle = 'rgba(255,255,255,.14)'; circ(g, x - 2, y - 2, 3.500); g.fill(); for (const q of [[-3, 1], [2, -3], [3, 3], [-1, -1]]) { g.fillStyle = (i + q[0]) % 2 ? '#D9483A' : '#E8894A'; circ(g, x + q[0], y + q[1], 1.300); g.fill(); } }
      for (let x = 3; x < w; x += 8) { rr(g, x - 1, h - 3.500, 2, 5, 0.800); FS(g, '#C9A56A', 0.700); }
    },
    puits(g, w, h) {
      g.fillStyle = 'rgba(30,22,14,.22)'; ell(g, w / 2 + 2, h / 2 + 4, 11, 9); g.fill();
      circ(g, w / 2, h / 2 + 1, 10); FS(g, '#A39C8F', 1.3); circ(g, w / 2, h / 2 + 1, 6.500); g.fillStyle = '#2E4A5E'; g.fill(); g.strokeStyle = 'rgba(210,230,236,.7)'; g.lineWidth = 0.800; g.beginPath(); g.arc(w / 2, h / 2 + 1, 4, 0.6, 2.2); g.stroke();
      g.strokeStyle = 'rgba(70,62,50,.5)'; g.lineWidth = 0.600; for (let k = 0; k < 8; k++) { g.beginPath(); g.moveTo(w / 2 + 6.500 * Math.cos(k * 0.785), h / 2 + 1 + 6.500 * Math.sin(k * 0.785)); g.lineTo(w / 2 + 10 * Math.cos(k * 0.785), h / 2 + 1 + 10 * Math.sin(k * 0.785)); g.stroke(); }
      rr(g, 2, h / 2 - 1, w - 4, 3, 1.200); FS(g, '#8A6038', 1); rr(g, w / 2 + 3, h / 2 - 4, 5, 6, 1.200); FS(g, '#B48858', 0.900);
    },
    etal(g, w, h) {
      g.fillStyle = 'rgba(30,22,14,.22)'; g.fillRect(4, 5, w - 4, h - 4);
      rr(g, 2, 12, w - 4, h - 14, 2); FS(g, '#B48858', 1.1);
      for (const q of [[8, 19, '#D9A441'], [17, 20, '#C8384A'], [26, 19, '#7FA65A'], [35, 20, '#E8894A']]) { rr(g, q[0] - 4, q[1] - 3.500, 8, 7, 1.500); FS(g, '#9C7146', 0.900); for (const o of [[-1.600, -1], [1.500, -0.600], [0, 1.300]]) { g.fillStyle = q[2]; circ(g, q[0] + o[0], q[1] + o[1], 1.400); g.fill(); } }
      for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? '#EFE6D2' : '#B4532A'; g.fillRect(1 + i * (w - 2) / 6, 1, (w - 2) / 6, 11); } g.strokeStyle = '#6B3A22'; g.lineWidth = 1.200; g.strokeRect(1, 1, w - 2, 11);
      g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(1, 1, w - 2, 3);
    },
    gardemanger(g, w, h) {
      g.fillStyle = 'rgba(30,22,14,.22)'; g.fillRect(6, 9, w - 9, h - 10);
      for (const q of [[5, h - 6], [w - 8, h - 6]]) { g.fillStyle = '#6B4A2E'; g.fillRect(q[0], q[1], 3, 6); }
      rr(g, 3, 6, w - 6, h - 12, 2); FS(g, '#C9A56A', 1.2); g.strokeStyle = 'rgba(90,60,30,.5)'; g.lineWidth = 0.700; for (let x = 7; x < w - 4; x += 4) { g.beginPath(); g.moveTo(x, 8); g.lineTo(x, h - 8); g.stroke(); }
      g.beginPath(); g.moveTo(1, 8); g.lineTo(w / 2, 0.500); g.lineTo(w - 1, 8); g.closePath(); FS(g, '#8F4A2C', 1.1); circ(g, w / 2, h / 2 + 1, 2.600); FS(g, '#D9A441', 0.800);
    },
    taillerie(g, w, h) {
      rr(g, 0, 0, w, h, 4); FS(g, '#A99F88', 1.3);
      blk(g, 5, 6, 12, 9, '#C4BEB2'); blk(g, 20, 5, 8, 12, '#B8B2A6'); rr(g, w - 17, 6, 12, 22, 5); FS(g, '#D2CCBF', 1); circ(g, w - 11, 11, 3); g.strokeStyle = 'rgba(70,64,54,.6)'; g.lineWidth = 0.700; g.stroke();
      rr(g, 5, h - 15, 20, 9, 1.500); FS(g, '#8A6038', 1.1); blk(g, 8, h - 13.500, 12, 6, '#DDD8CC');
      for (const q of [[-1, -1], [w + 1, -1], [-1, h + 1], [w + 1, h + 1]]) { rr(g, q[0] - 1.500, q[1] - 4, 3, 6, 1); FS(g, '#B48858', 0.900); }
    },
    bucher(g, w, h) {
      g.fillStyle = 'rgba(30,22,14,.22)'; g.fillRect(3, 6, w - 3, h - 5);
      rr(g, 1, 9, w - 2, h - 10, 2); FS(g, '#8A6A48', 1.1); logs(g, 6, h - 5, 6, 3);
      g.beginPath(); g.moveTo(-1, 10); g.lineTo(w / 2, 1); g.lineTo(w + 1, 10); g.lineTo(w + 1, 12.500); g.lineTo(-1, 12.500); g.closePath(); FS(g, '#A9744C', 1.1);
    },
    digue(g, w, h) {
      rr(g, 0, 3, w, h - 6, 8); FS(g, '#9C8A66', 1.3);
      const r = SIM.rngOf(77); for (let i = 0; i < 16; i++) { g.save(); g.translate(5 + i * (w - 10) / 15, h / 2 + (r() - 0.5) * 6); drawRock(g, 3 + r() * 1.800); g.restore(); }
      for (let x = 6; x < w; x += 13) { rr(g, x - 1.300, 1, 2.600, 7, 1); FS(g, '#8A6038', 0.900); }
    },
    cloche(g, w, h) {
      g.fillStyle = 'rgba(30,22,14,.24)'; ell(g, w / 2 + 2, h - 3, 11, 4); g.fill();
      for (const x of [5, w - 8]) { rr(g, x, 6, 3, h - 8, 1); FS(g, '#8A6038', 1); } rr(g, 2, 3, w - 4, 4, 1.5); FS(g, '#A9744C', 1.1);
      g.strokeStyle = '#5A4028'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(w / 2, 7); g.lineTo(w / 2, 11); g.stroke();
      g.beginPath(); g.moveTo(w / 2 - 6.5, 24); g.quadraticCurveTo(w / 2 - 6, 11, w / 2, 11); g.quadraticCurveTo(w / 2 + 6, 11, w / 2 + 6.5, 24); g.closePath(); FS(g, '#D9A441', 1.3);
      g.fillStyle = 'rgba(255,255,255,.35)'; ell(g, w / 2 - 2.5, 16, 1.4, 4); g.fill(); rr(g, w / 2 - 7.5, 23, 15, 2.6, 1.2); FS(g, '#C48F2E', 1); circ(g, w / 2, 27.5, 1.8); FS(g, '#8A6038', 0.8);
      g.strokeStyle = '#C9B79A'; g.lineWidth = 1; g.beginPath(); g.moveTo(w / 2 + 3, 26); g.quadraticCurveTo(w / 2 + 7, 30, w / 2 + 5, h - 2); g.stroke();
    },
    brasero(g, w, h) {
      g.fillStyle = 'rgba(30,22,14,.25)'; ell(g, w / 2 + 1.500, h - 5, 8.500, 4.500); g.fill();
      for (const a of [-0.5, 0.5]) { g.strokeStyle = '#3A3A40'; g.lineWidth = 1.600; g.beginPath(); g.moveTo(w / 2 + a * 5, 14); g.lineTo(w / 2 + a * 15, h - 3); g.stroke(); }
      rr(g, w / 2 - 7.500, 9, 15, 7, 2); FS(g, '#4A4A52', 1.1); ell(g, w / 2, 9.500, 6.500, 2.600); g.fillStyle = '#2A2019'; g.fill();
      g.fillStyle = '#F2913A'; g.beginPath(); g.moveTo(w / 2 - 4.500, 9.500); g.quadraticCurveTo(w / 2 - 3, 1, w / 2, 3.500); g.quadraticCurveTo(w / 2 + 3, -1, w / 2 + 4.500, 9.500); g.closePath(); g.fill(); g.fillStyle = '#FFD27A'; ell(g, w / 2, 8, 2.400, 3); g.fill();
    },
    rubans(g, w, h) {
      g.fillStyle = 'rgba(40,46,24,.28)'; ell(g, w / 2 + 3, h / 2 + 5, 15, 12); g.fill();
      const C = ['#E46A8A', '#F2C14E', '#F4EEDC', '#6FA3B8', '#B07CC6', '#D9483A'];
      for (let k = 0; k < 9; k++) { const a = k * 0.698, x = w / 2 + Math.cos(a) * 13, y = h / 2 + Math.sin(a) * 12; g.strokeStyle = C[k % 6]; g.lineWidth = 1.500; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 2.500, y + 4, x - 1, y + 8); g.stroke(); }
      circ(g, w / 2, h / 2, 14); FS(g, '#D9823A', 1.3); for (const q of [[-5, -4, 6.500, '#E8A04C'], [5, 3, 6, '#C8662F'], [3, -6, 4.500, '#E8A04C'], [-4, 5, 5, '#C8662F']]) { g.fillStyle = q[3]; circ(g, w / 2 + q[0], h / 2 + q[1], q[2]); g.fill(); }
      for (let k = 0; k < 7; k++) { g.fillStyle = C[(k + 2) % 6]; circ(g, w / 2 + Math.cos(k * 0.9 + 0.4) * 8, h / 2 + Math.sin(k * 0.9 + 0.4) * 8, 1.200); g.fill(); }
    }
  });
  /* une maison ordinaire : murs, toit, puis les détails propres à chacune */
  const HOUSE = {
    foyer: ['#E3D6BC', '#B5553D', '#8A3B2A', 'tile'], longere: ['#D8CDB6', '#8E99A4', '#6C7884', 'planks'], ferme: ['#D9C7A0', '#C9A45C', '#A5823E', 'thatch'], ecole: ['#E9DFC8', '#A8483A', '#7E3228', 'tile'],
    bibliotheque: ['#CFC3AA', '#6F8E86', '#4F6E66', 'planks'], cantine: ['#E2D2AE', '#C77E3A', '#9C5E26', 'tile'], chevre: ['#B9B1A0', '#B9A26A', '#93803E', 'thatch'], bassecour: ['#C9AE86', '#B0623C', '#84442A', 'planks'], marionnettes: ['#E8DCC2', '#C8384A', '#8E2333', 'planks'],
    grange: ['#B98A5E', '#A6583A', '#7E3F28', 'planks'], chaumiere: ['#DDD2BC', '#DDBE7C', '#BF9C58', 'thatch'], auberge: ['#D9C9A8', '#A5553D', '#7E3A2A', 'tile'],
    bergerie: ['#B9B1A0', '#CDB06E', '#A98A4C', 'thatch'], fumoir: ['#5E4A38', '#6B5644', '#4A3A2C', 'planks'], scierie: ['#B48858', '#B79468', '#8A6A48', 'planks'],
    menuiserie: ['#C9AE86', '#9FB068', '#7B8E4C', 'moss'], bains: ['#C4B49A', '#8FA9AE', '#6C8890', 'planks'], pressoir: ['#D6C7A6', '#A5553D', '#7E3A2A', 'tile'], cellier: ['#A39C8F', '#8DA05E', '#6B7E44', 'moss']
  };
  function houseExt(g, type, w, h) {
    const H0 = HOUSE[type], rh = h - FH; if (!H0) return false;
    facade(g, w, h, H0[0], { win: BDEF[type].win });
    roofTex(g, 0, 0, w, rh, H0[1], H0[2], H0[3]); g.fillStyle = dk(H0[2], 0.25); g.fillRect(0, 0, 2.600, rh); g.fillRect(w - 2.600, 0, 2.600, rh); line(g, H0[2], 1.7); g.strokeRect(0, 0, w, rh);
    const chim = (x, y) => { rr(g, x, y, 7, 8, 1.200); FS(g, '#9A948A', 1.1); g.fillStyle = '#2A2420'; g.fillRect(x + 1.800, y + 2, 3.400, 3.400); };
    const tuft = (x, y, c) => { g.fillStyle = c; circ(g, x, y, 1.3); g.fill(); };
    if (type === 'foyer') { chim(10, 5); chim(w - 17, 5); for (const wx of BDEF.foyer.win) { rr(g, wx - 1, h - 4, 10, 3, 1); FS(g, '#8A6038', 0.8); for (let k = 0; k < 3; k++) tuft(wx + 1.5 + k * 2.6, h - 4.6, k % 2 ? '#F2C14E' : '#E46A8A'); } }
    else if (type === 'longere') { chim(w / 2 - 3.5, 4); g.fillStyle = dk(H0[2], 0.2); g.fillRect(w / 3, 0, 1.6, rh); g.fillRect(2 * w / 3, 0, 1.6, rh); }
    else if (type === 'ferme') { chim(w - 16, 5); for (const x of [w / 2 + 10, w / 2 + 17]) { circ(g, x, h - 4.5, 4); FS(g, '#E3C46B', 0.9); } }
    else if (type === 'ecole') { rr(g, w / 2 - 5, 2, 10, 11, 1.5); FS(g, '#E9DFC8', 1.1); g.fillStyle = '#D9A441'; circ(g, w / 2, 8, 2.6); g.fill(); g.fillStyle = '#3A4854'; rr(g, w / 2 + 8, rh + 3, 11, 6, 1); g.fill(); g.strokeStyle = '#F4EEDC'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(w / 2 + 10, rh + 5); g.lineTo(w / 2 + 16, rh + 5); g.moveTo(w / 2 + 10, rh + 7); g.lineTo(w / 2 + 14, rh + 7); g.stroke(); }
    else if (type === 'bibliotheque') { for (let k = 0; k < 5; k++) { g.fillStyle = ['#C8384A', '#D9A441', '#4E6E80', '#7FA65A', '#8C3B4A'][k]; g.fillRect(w - 18 + k * 2.6, h - 9, 2.2, 8); } }
    else if (type === 'cantine') { chim(9, 4); circ(g, w - 11, h - 5, 4.2); FS(g, '#5A5F68', 1); g.fillStyle = 'rgba(244,248,250,.55)'; circ(g, w - 11, h - 11, 2.4); g.fill(); circ(g, w - 8.5, h - 14.5, 1.7); g.fill(); }
    else if (type === 'chevre') { g.strokeStyle = '#7A5636'; g.lineWidth = 1.1; for (let x = 3; x < w - 2; x += 5) { g.beginPath(); g.moveTo(x, h - 7); g.lineTo(x, h); g.stroke(); } g.beginPath(); g.moveTo(2, h - 5); g.lineTo(w - 2, h - 5); g.stroke(); ell(g, w - 13, h - 5, 4.2, 2.8); FS(g, '#F4EEDC', 0.8); circ(g, w - 8.5, h - 7, 1.9); FS(g, '#F4EEDC', 0.6); g.strokeStyle = '#4A3A2C'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(w - 8, h - 9); g.lineTo(w - 7, h - 11); g.stroke(); }
    else if (type === 'bassecour') { for (const q of [[7, h - 3.5], [13, h - 5], [w - 9, h - 4]]) { ell(g, q[0], q[1], 2.6, 2.1); FS(g, q[0] > 20 ? '#F4EEDC' : '#B5703A', 0.6); g.fillStyle = '#C8384A'; circ(g, q[0] + 2.2, q[1] - 1.8, 0.9); g.fill(); } }
    else if (type === 'marionnettes') { for (let x = 0; x < w; x += 8) { g.fillStyle = 'rgba(244,238,220,.85)'; g.fillRect(x, 0, 4, rh); } rr(g, w / 2 - 11, rh + 1.5, 22, FH - 3, 1.5); FS(g, '#3A2A30', 1); g.fillStyle = '#D9A441'; g.fillRect(w / 2 - 11, rh + 1.5, 4, FH - 3); g.fillRect(w / 2 + 7, rh + 1.5, 4, FH - 3); for (const q of [[w / 2 - 3, '#7FA65A'], [w / 2 + 3, '#4E6E80']]) { circ(g, q[0], h - 6, 2); FS(g, '#F0D2B0', 0.5); g.fillStyle = q[1]; g.fillRect(q[0] - 1.6, h - 4, 3.2, 3); } }
    else if (type === 'grange') { g.fillStyle = dk(H0[2], 0.25); g.fillRect(w / 2 - 1.300, 0, 2.600, rh); g.strokeStyle = '#F4EEDC'; g.lineWidth = 1.200; g.strokeRect(w / 2 - 9, rh + 1, 18, FH - 1); g.beginPath(); g.moveTo(w / 2 - 9, rh + 1); g.lineTo(w / 2 + 9, h); g.moveTo(w / 2 + 9, rh + 1); g.lineTo(w / 2 - 9, h); g.stroke(); }
    else if (type === 'chaumiere') { chim(w - 16, 5); for (const wx of BDEF.chaumiere.win) { rr(g, wx - 1, h - 4, 10, 3, 1); FS(g, '#8A6038', 0.800); for (let k = 0; k < 3; k++) { g.fillStyle = k % 2 ? '#F2C14E' : '#E46A8A'; circ(g, wx + 1.500 + k * 2.600, h - 4.600, 1.200); g.fill(); } } }
    else if (type === 'auberge') { chim(10, 5); chim(w - 17, 5); g.fillStyle = '#6B4A2E'; g.fillRect(w / 2 + 9, rh + 2, 9, 1.200); rr(g, w / 2 + 11, rh + 3, 7, 5.500, 1); FS(g, '#E9C85A', 0.900); }
    else if (type === 'bergerie') { for (const q of [[7, h - 4], [14, h - 6], [w - 9, h - 4.500]]) { ell(g, q[0], q[1], 3.600, 2.700); FS(g, '#F4EEDC', 0.800); circ(g, q[0] + 3, q[1] - 1, 1.500); FS(g, '#4A3A2C', 0.500); } }
    else if (type === 'fumoir') { chim(14.500, 4); for (const x of [6, 11, w - 11, w - 6]) { g.strokeStyle = '#7A5636'; g.lineWidth = 0.700; g.beginPath(); g.moveTo(x, rh + 1); g.lineTo(x, rh + 3); g.stroke(); ell(g, x, rh + 6, 1.500, 3.200); FS(g, '#C99A62', 0.700); } }
    else if (type === 'scierie') { logs(g, 6, h - 3, 3, 2); rr(g, w - 20, h - 7, 15, 2.500, 1); FS(g, '#D2AE78', 0.800); rr(g, w - 19, h - 4, 15, 2.500, 1); FS(g, '#D2AE78', 0.800); circ(g, w / 2, rh / 2, 7); FS(g, '#C3C9D1', 1); circ(g, w / 2, rh / 2, 2); g.fillStyle = '#6B4A2E'; g.fill(); }
    else if (type === 'menuiserie') { for (let k = 0; k < 3; k++) { g.save(); g.translate(7 + k * 3.500, h - 1); g.rotate(-0.2); g.fillStyle = '#D2AE78'; g.fillRect(-1.200, -11, 2.400, 11); g.strokeStyle = 'rgba(60,40,22,.5)'; g.lineWidth = 0.500; g.strokeRect(-1.200, -11, 2.400, 11); g.restore(); } }
    else if (type === 'bains') { chim(8.500, 4); for (const q of [[w - 14, 9, 5], [w - 22, 16, 3.500]]) { g.fillStyle = 'rgba(244,248,250,.5)'; circ(g, q[0], q[1], q[2]); g.fill(); } }
    else if (type === 'pressoir') { barrel(g, w - 9, h - 5, 4); barrel(g, w - 18, h - 4.500, 3.500); for (const o of [[5, h - 3], [8, h - 4.500], [10.500, h - 2.800]]) { g.fillStyle = '#D9483A'; circ(g, o[0], o[1], 1.500); g.fill(); } }
    else if (type === 'cellier') { g.fillStyle = 'rgba(244,238,220,.5)'; for (let i = 0; i < 9; i++) circ(g, 5 + (i * 7) % (w - 10), 5 + (i * 5) % (rh - 8), 1.100), g.fill(); }
    return true;
  }
  function houseInt(g, type, w, h) {
    const H0 = HOUSE[type]; if (!H0) return false;
    planks(g, 0, 0, w, h, type === 'cellier' || type === 'bains' ? '#B9B1A0' : type === 'fumoir' ? '#8A7A62' : type === 'grange' || type === 'bergerie' ? '#D8C48E' : '#CDAA7C', 5.5);
    if (BDEF[type].beds) for (const b of BDEF[type].beds) { if (type === 'grange') { rr(g, b[0], b[1], 10, 21, 3); FS(g, '#C9B79A', 0.900); rr(g, b[0] + 1, b[1] + 1, 8, 6, 2); FS(g, '#EFE6D2', 0.700); } else bed(g, b[0], b[1]); }
    if (type === 'ecole') { rr(g, w / 2 - 14, 5, 28, 5, 1); FS(g, '#3A4854', 1); g.strokeStyle = '#F4EEDC'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(w / 2 - 10, 7.5); g.lineTo(w / 2 + 2, 7.5); g.stroke(); for (const q of BDEF.ecole.seats) { rr(g, q[0] - 5.5, q[1] - 8, 11, 5, 1); FS(g, '#A87A4A', 0.9); rr(g, q[0] - 3, q[1] - 7, 6, 3, 0.6); FS(g, '#EFE6D2', 0.5); } }
    else if (type === 'bibliotheque') { for (const y of [7, 16, 25]) { rr(g, 5, y, w - 10, 5, 1); FS(g, '#8A6038', 1); for (let x = 7; x < w - 8; x += 3) { g.fillStyle = ['#C8384A', '#D9A441', '#4E6E80', '#7FA65A', '#8C3B4A'][(x | 0) % 5]; g.fillRect(x, y + 0.6, 2.2, 3.8); } } }
    else if (type === 'grange') { for (const x of [10, w - 16]) { circ(g, x, h - 11, 5.500); FS(g, '#E3C46B', 1); } }
    else if (type === 'chaumiere') { rr(g, 18, h - 16, 24, 9, 3); FS(g, '#4E6E80', 1); rr(g, w - 13, h - 15, 8, 8, 1.500); FS(g, '#8A6038', 1.1); }
    else if (type === 'auberge') { rr(g, w - 22, 8, 15, 22, 2); FS(g, '#A87A4A', 1.1); for (const y of [12, 19, 26]) { circ(g, w - 18, y, 1.800); FS(g, '#EFE6D2', 0.600); circ(g, w - 11, y, 1.800); FS(g, '#EFE6D2', 0.600); } rr(g, 8, h - 15, 14, 8, 2); FS(g, '#8E877B', 1.1); g.fillStyle = '#FF9A3C'; g.fillRect(11, h - 12.500, 8, 3.500); }
    else if (type === 'bergerie') { const r = SIM.rngOf(43); g.strokeStyle = 'rgba(160,130,60,.7)'; g.lineWidth = 0.700; for (let i = 0; i < 44; i++) { const x = 4 + r() * (w - 8), y = 4 + r() * (h - 8); g.beginPath(); g.moveTo(x, y); g.lineTo(x + 3, y + (r() - 0.5) * 3); g.stroke(); } for (const q of [[12, 11], [26, 9], [38, 14], [17, 24], [34, 26]]) { ell(g, q[0], q[1], 4.600, 3.500); FS(g, '#F4EEDC', 0.900); circ(g, q[0] + 4, q[1] - 1, 1.800); FS(g, '#4A3A2C', 0.500); } }
    else if (type === 'fumoir') { for (const y of [8, 15, 22]) { g.strokeStyle = '#4A3A2C'; g.lineWidth = 1; g.beginPath(); g.moveTo(4, y); g.lineTo(w - 4, y); g.stroke(); for (let x = 7; x < w - 5; x += 5) { ell(g, x, y + 2.800, 1.400, 2.800); FS(g, '#C99A62', 0.600); } } circ(g, w / 2, h - 10, 3.800); FS(g, '#3A2A20', 1); g.fillStyle = '#F2913A'; circ(g, w / 2, h - 10, 1.800); g.fill(); }
    else if (type === 'scierie') { rr(g, 8, 10, w - 16, 9, 2); FS(g, '#A87A4A', 1.1); rr(g, 6, 12.500, w - 20, 4, 1); FS(g, '#D2AE78', 0.800); circ(g, w - 15, 14.500, 6); FS(g, '#C3C9D1', 1); circ(g, w - 15, 14.500, 1.700); g.fillStyle = '#6B4A2E'; g.fill(); logs(g, 8, h - 8, 4, 2); for (let k = 0; k < 4; k++) { rr(g, w - 24, h - 9 - k * 3, 17, 2.300, 0.800); FS(g, '#D2AE78', 0.700); } }
    else if (type === 'menuiserie') { rr(g, 6, 7, w - 12, 10, 2); FS(g, '#A87A4A', 1.1); rr(g, 10, 9.500, 12, 3, 1); FS(g, '#D2AE78', 0.700); g.fillStyle = '#8A8F98'; g.fillRect(w - 20, 9, 8, 1.600); g.fillStyle = '#6B4A2E'; g.fillRect(w - 13, 8, 3, 3.600); const r = SIM.rngOf(45); for (let i = 0; i < 12; i++) { g.strokeStyle = '#E3C99A'; g.lineWidth = 0.800; g.beginPath(); const x = 8 + r() * (w - 16), y = 22 + r() * (h - 32); g.arc(x, y, 1.500, 0, 4); g.stroke(); } rr(g, w - 14, h - 15, 8, 8, 1.500); FS(g, '#B48858', 1); }
    else if (type === 'bains') { circ(g, w / 2, h / 2 - 2, 12); FS(g, '#9C7146', 1.4); circ(g, w / 2, h / 2 - 2, 9); g.fillStyle = '#7FB4C4'; g.fill(); g.strokeStyle = 'rgba(240,250,252,.7)'; g.lineWidth = 0.800; g.beginPath(); g.arc(w / 2 - 2, h / 2 - 3, 4, 0.4, 2.4); g.stroke(); for (const q of [[9, h - 10], [w - 9, h - 10]]) { rr(g, q[0] - 3, q[1] - 2, 6, 4, 1); FS(g, '#EFE6D2', 0.700); } }
    else if (type === 'pressoir') { rr(g, w / 2 - 9, 7, 18, 14, 2); FS(g, '#8A6038', 1.3); circ(g, w / 2, 14, 5.500); FS(g, '#C99A62', 1); g.fillStyle = '#4A3A2C'; g.fillRect(w / 2 - 1.200, 5, 2.400, 18); barrel(g, 9, h - 12, 4.600); barrel(g, 19, h - 10, 4); circ(g, w - 11, h - 12, 5); FS(g, '#B5833F', 1); for (const o of [[-1.800, -1], [1.500, 0], [0, 1.800]]) { g.fillStyle = '#D9483A'; circ(g, w - 11 + o[0], h - 12 + o[1], 1.500); g.fill(); } }
    else if (type === 'cellier') { for (const y of [7, 16]) { rr(g, 5, y, w - 10, 5, 1); FS(g, '#8A6038', 1); for (let x = 9; x < w - 6; x += 5.500) { rr(g, x - 1.800, y - 2.500, 3.600, 4.500, 1.200); FS(g, ['#D9A441', '#C8384A', '#7FA65A'][(x | 0) % 3], 0.600); } } barrel(g, 10, h - 10, 4.500); barrel(g, w - 10, h - 10, 4.500); }
    wallsPlan(g, w, h, dk(H0[0], 0.35));
    return true;
  }
  function tent(g, w, h, inside) {
    if (inside) { rr(g, 0, 0, w, h, 5); FS(g, '#B79E72', 1.2); for (const b of BDEF.tente.beds) { rr(g, b[0], b[1], 10, 21, 3); FS(g, '#C9B79A', 0.900); rr(g, b[0] + 1, b[1] + 1, 8, 6, 2); FS(g, '#EFE6D2', 0.700); } g.strokeStyle = '#D9CDB4'; g.lineWidth = 2; g.setLineDash([5, 3]); rr(g, 1.500, 1.500, w - 3, h - 3, 4); g.stroke(); g.setLineDash([]); return; }
    g.fillStyle = 'rgba(30,22,14,.22)'; g.fillRect(3, 4, w - 2, h - 3);
    g.beginPath(); g.moveTo(0, 0); g.lineTo(w, 0); g.lineTo(w, h); g.lineTo(0, h); g.closePath(); FS(g, '#E9DFC6', 1.3);
    g.fillStyle = 'rgba(120,96,60,.18)'; g.fillRect(w / 2, 0, w / 2, h); g.strokeStyle = '#B9A77E'; g.lineWidth = 1.200; g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.stroke();
    g.fillStyle = '#3A2A20'; g.beginPath(); g.moveTo(w / 2 - 5, h); g.lineTo(w / 2, h - 12); g.lineTo(w / 2 + 5, h); g.closePath(); g.fill();
    for (const q of [[0, 0], [w, 0], [0, h], [w, h]]) { circ(g, q[0], q[1], 1.500); FS(g, '#8A6038', 0.700); }
  }
  /* les ailes du moulin, à part : elles tournent */
  function drawSails(g, a) {
    g.save(); g.rotate(a);
    for (let k = 0; k < 4; k++) { g.rotate(Math.PI / 2); g.fillStyle = '#6B4A2E'; g.fillRect(-0.900, -21, 1.800, 21); g.beginPath(); g.rect(1, -20.500, 6.500, 14); g.fillStyle = 'rgba(244,236,214,.92)'; g.fill(); g.strokeStyle = '#6B4A2E'; g.lineWidth = 0.700; g.stroke(); g.beginPath(); for (const y of [-17, -13.500, -10]) { g.moveTo(1, y); g.lineTo(7.500, y); } g.moveTo(4.200, -20.500); g.lineTo(4.200, -6.500); g.stroke(); }
    g.restore(); circ(g, 0, 0, 2.600); FS(g, '#4A3A2C', 1);
  }
  function extraExterior(g, type, w, h) {
    const rh = h - FH;
    if (type === 'abri') {
      rr(g, 0, 0, w, h, 6); FS(g, '#7A6A42', 1.3);
      const r = SIM.rngOf(91); g.lineCap = 'round';
      for (let i = 0; i < 60; i++) { const x = 2 + r() * (w - 4), y = 2 + r() * (h - 9); g.strokeStyle = ['#8E7B4A', '#6B5A34', '#A08C56', '#5E7F3C'][i % 4]; g.lineWidth = 1.300; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 6, y + 4 + r() * 5); g.stroke(); }
      for (let i = 0; i < 14; i++) { g.fillStyle = ['#C2502F', '#E3B54A', '#D9823A'][i % 3]; ell(g, 3 + r() * (w - 6), 3 + r() * (h - 9), 2, 1, r() * 3); g.fill(); }
      g.fillStyle = '#2A2019'; g.beginPath(); g.moveTo(w / 2 - 7, h); g.quadraticCurveTo(w / 2, h - 16, w / 2 + 7, h); g.closePath(); g.fill();
    } else if (type === 'dortoir') {
      facade(g, w, h, '#C4AA84', { win: BDEF.dortoir.win });
      roofTex(g, 0, 0, w, rh, '#CDB06E', '#A98A4C', 'thatch');
      g.fillStyle = '#7A5636'; g.fillRect(0, 0, 2.600, rh); g.fillRect(w - 2.600, 0, 2.600, rh); g.fillRect(w / 2 - 1.300, 0, 2.600, rh);
      line(g, '#A98A4C', 1.7); g.strokeRect(0, 0, w, rh);
      for (const x of [14, w - 20]) { rr(g, x, rh * 0.200, 6, 7, 1); FS(g, '#9A948A', 1.1); g.fillStyle = '#2A2420'; g.fillRect(x + 1.500, rh * 0.200 + 1.500, 3, 3); }
    } else if (type === 'poulailler') {
      facade(g, w, h, '#D9C9A0', { win: [] });
      roofTex(g, 0, 0, w, rh, '#B5653F', '#8F4A2C', 'planks');
      g.fillStyle = '#6B3A22'; g.fillRect(0, 0, 2.600, rh); g.fillRect(w - 2.600, 0, 2.600, rh);
      line(g, '#8F4A2C', 1.7); g.strokeRect(0, 0, w, rh);
      for (const q of [[7, h - 4, '#F4EEDC'], [13, h - 6, '#C98A4A'], [w - 9, h - 4.500, '#F4EEDC'], [w - 15, h - 6.500, '#8A5A3A']]) { ell(g, q[0], q[1], 3, 2.300); FS(g, q[2], 0.700); circ(g, q[0] + 2.400, q[1] - 2, 1.300); FS(g, q[2], 0.600); g.fillStyle = '#D9483A'; circ(g, q[0] + 2.600, q[1] - 3.300, 0.700); g.fill(); }
    } else if (type === 'champi') {
      facade(g, w, h, '#8E7E60', { win: [] });
      roofTex(g, 0, 0, w, rh, '#7F8F56', '#5F6F40', 'moss');
      g.fillStyle = '#5A4028'; g.fillRect(0, 0, 2.600, rh); g.fillRect(w - 2.600, 0, 2.600, rh);
      line(g, '#5F6F40', 1.7); g.strokeRect(0, 0, w, rh);
      for (const q of [[9, 8, 4.500], [w - 11, 14, 5.500], [20, 19, 3.500]]) { g.fillStyle = '#EFE6D2'; g.fillRect(q[0] - 1, q[1], 2, q[2] * 0.800); g.beginPath(); g.arc(q[0], q[1], q[2], Math.PI, 0); g.closePath(); FS(g, '#C8384A', 0.900); g.fillStyle = '#FFF'; circ(g, q[0] - q[2] * 0.400, q[1] - q[2] * 0.400, 0.800); g.fill(); circ(g, q[0] + q[2] * 0.300, q[1] - q[2] * 0.600, 0.700); g.fill(); }
      for (const x of [6, w - 7]) { g.fillStyle = '#EFE6D2'; g.fillRect(x - 0.600, h - 5, 1.200, 4); g.beginPath(); g.arc(x, h - 5, 2.600, Math.PI, 0); g.closePath(); FS(g, '#B5833F', 0.700); }
    } else if (type === 'moulin') {
      facade(g, w, h, '#BDB5A4', { win: BDEF.moulin.win });
      rr(g, 0, 0, w, rh, 4); FS(g, '#A39C8F', 1.4);
      const gr = g.createRadialGradient(w / 2 - 4, rh / 2 - 4, 2, w / 2, rh / 2, 20); gr.addColorStop(0, '#B0704E'); gr.addColorStop(1, '#7E452C'); circ(g, w / 2, rh / 2, 17); g.fillStyle = gr; g.fill(); line(g, '#7E452C', 1.4); g.stroke();
      g.strokeStyle = 'rgba(60,30,18,.45)'; g.lineWidth = 0.700; for (let k = 0; k < 10; k++) { g.beginPath(); g.moveTo(w / 2, rh / 2); g.lineTo(w / 2 + 17 * Math.cos(k * 0.628), rh / 2 + 17 * Math.sin(k * 0.628)); g.stroke(); }
    } else return false;
    return true;
  }
  function extraInterior(g, type, w, h) {
    if (type === 'abri') {
      rr(g, 0, 0, w, h, 6); FS(g, '#B79E72', 1.2);
      for (const b of BDEF.abri.beds) { rr(g, b[0], b[1], 10, 21, 3); FS(g, '#C9B79A', 0.900); rr(g, b[0] + 1, b[1] + 1, 8, 6, 2); FS(g, '#EFE6D2', 0.700); }
      g.strokeStyle = '#6B5A34'; g.lineWidth = 2.200; g.setLineDash([5, 3]); rr(g, 1.500, 1.500, w - 3, h - 3, 5); g.stroke(); g.setLineDash([]);
    } else if (type === 'dortoir') {
      planks(g, 0, 0, w, h, '#C9A674', 5.5);
      rr(g, 20, h - 15, w - 40, 8, 3); FS(g, '#A9503F', 1); g.strokeStyle = '#E3C46B'; g.lineWidth = 0.800; g.strokeRect(23, h - 13, w - 46, 4);
      for (const b of BDEF.dortoir.beds) bed(g, b[0], b[1]);
      rr(g, 5, h - 14, 9, 7, 1.500); FS(g, '#8A6038', 1.1); rr(g, w - 14, h - 14, 9, 7, 1.500); FS(g, '#8A6038', 1.1);
      wallsPlan(g, w, h, '#7A5636');
    } else if (type === 'poulailler') {
      planks(g, 0, 0, w, h, '#D8C48E', 5.5);
      const r = SIM.rngOf(41); g.strokeStyle = 'rgba(160,130,60,.7)'; g.lineWidth = 0.700; for (let i = 0; i < 40; i++) { const x = 4 + r() * (w - 8), y = 4 + r() * (h - 8); g.beginPath(); g.moveTo(x, y); g.lineTo(x + 3, y + (r() - 0.5) * 3); g.stroke(); }
      for (const x of [9, 21, 33]) { circ(g, x, 11, 5); FS(g, '#B5833F', 1); circ(g, x, 11, 3.200); g.fillStyle = '#E3C46B'; g.fill(); g.fillStyle = '#FFFDF6'; ell(g, x - 0.800, 11, 1.300, 1.700); g.fill(); ell(g, x + 1.200, 11.500, 1.300, 1.700); g.fill(); }
      rr(g, 6, h - 15, w - 12, 2.600, 1); FS(g, '#8A6038', 0.800);
      for (const q of [[13, h - 16.500, '#F4EEDC'], [26, h - 16.500, '#C98A4A']]) { ell(g, q[0], q[1], 3.400, 2.600); FS(g, q[2], 0.700); circ(g, q[0] + 2.800, q[1] - 2, 1.400); FS(g, q[2], 0.600); }
      wallsPlan(g, w, h, '#8F4A2C');
    } else if (type === 'champi') {
      planks(g, 0, 0, w, h, '#8E7B5C', 5.5);
      for (const y of [9, 20]) { rr(g, 5, y, w - 10, 6, 3); FS(g, '#6B4A2E', 1); for (let x = 9; x < w - 6; x += 5.500) { g.fillStyle = '#EFE6D2'; g.fillRect(x - 0.500, y - 2.500, 1, 3); g.beginPath(); g.arc(x, y - 2.500, 2, Math.PI, 0); g.closePath(); FS(g, (x | 0) % 2 ? '#C9A56A' : '#C8384A', 0.600); } }
      circ(g, 12, h - 11, 4.200); FS(g, '#B5833F', 1); g.fillStyle = '#C9A56A'; circ(g, 11, h - 12, 1.300); g.fill(); circ(g, 13.500, h - 10.500, 1.300); g.fill();
      wallsPlan(g, w, h, '#5A4028');
    } else if (type === 'moulin') {
      planks(g, 0, 0, w, h, '#C2B79E', 5.5);
      circ(g, w / 2, 17, 11); FS(g, '#A39C8F', 1.4); circ(g, w / 2, 17, 6.500); FS(g, '#B9B1A4', 1); circ(g, w / 2, 17, 1.800); g.fillStyle = '#4A3A2C'; g.fill();
      g.strokeStyle = 'rgba(70,62,50,.5)'; g.lineWidth = 0.700; for (let k = 0; k < 8; k++) { g.beginPath(); g.moveTo(w / 2 + 6.500 * Math.cos(k * 0.785), 17 + 6.500 * Math.sin(k * 0.785)); g.lineTo(w / 2 + 11 * Math.cos(k * 0.785), 17 + 11 * Math.sin(k * 0.785)); g.stroke(); }
      for (const q of [[8, h - 13], [15, h - 10], [w - 9, h - 12]]) { ell(g, q[0], q[1], 4.200, 5); FS(g, '#EFE6D2', 1); }
      wallsPlan(g, w, h, '#8E877B');
    } else return false;
    return true;
  }
  /* la grande table : deux bancs, une nappe, des bols pour tout le monde */
  function drawTable(g, w, h) {
    rr(g, 0, 0, w, h, 7); g.fillStyle = 'rgba(183,158,114,.6)'; g.fill();
    for (const y of [2.500, h - 8]) { g.fillStyle = 'rgba(30,22,14,.22)'; rr(g, 7, y + 2, w - 14, 5, 2); g.fill(); rr(g, 7, y, w - 14, 5, 2); FS(g, '#9C7146', 1); }
    g.fillStyle = 'rgba(30,22,14,.25)'; rr(g, 5, 13.500, w - 10, 11, 2); g.fill();
    planks(g, 5, 11, w - 10, 11, '#C99A62', 5); line(g, '#8A6038', 1.2); g.strokeRect(5, 11, w - 10, 11);
    g.fillStyle = 'rgba(246,238,216,.92)'; g.fillRect(w / 2 - 9, 11.600, 18, 9.800);
    for (let i = 0; i < 5; i++) { const x = 11 + i * (w - 22) / 4; circ(g, x, 14, 1.900); FS(g, '#EFE6D2', 0.7); circ(g, x, 19, 1.900); FS(g, '#EFE6D2', 0.7); }
    ell(g, w / 2 - 3, 16.500, 3.200, 2); FS(g, '#D9A441', 0.7); circ(g, w / 2 + 4.500, 16.500, 1.500); g.fillStyle = '#FFE08A'; g.fill();
  }
  /* carrière : une cour de taille, à ciel ouvert */
  function drawYard(g, w, h) {
    rr(g, 0, 0, w, h, 4); FS(g, '#A99F88', 1.3);
    const rng = SIM.rngOf(57);
    for (let i = 0; i < 60; i++) { g.fillStyle = rng() < 0.5 ? 'rgba(90,82,66,.3)' : 'rgba(236,230,214,.5)'; circ(g, 3 + rng() * (w - 6), 3 + rng() * (h - 6), 0.5 + rng() * 0.8); g.fill(); }
    const block = (x, y, bw, bh, c) => { g.fillStyle = 'rgba(30,22,14,.22)'; g.fillRect(x + 1, y + 1.5, bw, bh); rr(g, x, y, bw, bh, 1); FS(g, c, 1); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(x + 0.8, y + 0.8, bw - 1.6, 1.3); };
    block(5, 6, 11, 8, '#B8B2A6'); block(17, 5, 9, 9, '#A8A296'); block(9, 14.5, 12, 7, '#C4BEB2'); block(w - 20, 6, 13, 9, '#AEA89C');
    rr(g, w - 25, 20, 19, 11, 1.5); FS(g, '#8A6038', 1.1); block(w - 23, 22, 13, 7, '#D2CCBF');
    g.strokeStyle = '#5A5348'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(w - 21, 23.5); g.lineTo(w - 13, 27.5); g.stroke();
    g.save(); g.translate(9, h - 8); g.rotate(-0.6); g.fillStyle = '#8D6239'; g.fillRect(-0.8, -8, 1.6, 9); rr(g, -3, -10.5, 6, 3.6, 1); FS(g, '#8A8F98', 0.8); g.restore();
    for (let i = 0; i < 9; i++) { g.fillStyle = '#DDD8CC'; const x = 20 + rng() * 14, y = h - 13 + rng() * 8; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 2.2, y + 0.6); g.lineTo(x + 0.8, y + 1.9); g.closePath(); g.fill(); }
    const post = (x, y) => { rr(g, x - 1.5, y - 4, 3, 6, 1); FS(g, '#B48858', 0.9); };
    g.strokeStyle = '#C9B48A'; g.lineWidth = 1; g.beginPath(); g.moveTo(-1, -1); g.lineTo(w + 1, -1); g.lineTo(w + 1, h + 1); g.lineTo(w / 2 + 8, h + 1); g.moveTo(w / 2 - 8, h + 1); g.lineTo(-1, h + 1); g.lineTo(-1, -1); g.stroke();
    for (const q of [[-1, -1], [w + 1, -1], [-1, h + 1], [w + 1, h + 1], [w / 2 - 8, h + 1], [w / 2 + 8, h + 1], [w / 2, -1]]) post(q[0], q[1]);
  }
  /* affleurement rocheux où l'on taille la pierre */
  function drawOutcrop(g) {
    for (const q of [[3, -15, 7], [-10, -7, 11], [9, -8, 10], [-14, 6, 8], [14, 5, 8], [0, 4, 12]]) { g.save(); g.translate(q[0], q[1]); g.rotate(q[0] * 0.06); drawRock(g, q[2]); g.restore(); }
    g.strokeStyle = 'rgba(70,64,54,.5)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(-5, 1); g.lineTo(2, 8); g.moveTo(5, -3); g.lineTo(9, 3); g.stroke();
    g.fillStyle = '#E4DFD3'; for (const q of [[-18, 13], [-6, 16], [8, 15], [19, 12]]) { g.beginPath(); g.moveTo(q[0], q[1]); g.lineTo(q[0] + 2.4, q[1] + 0.7); g.lineTo(q[0] + 0.9, q[1] + 2); g.closePath(); g.fill(); }
  }
  function drawPotager(g, w, h, crops) {
    rr(g, 0, 0, w, h, 3); FS(g, '#7E5E3C', 1.3);
    const rng = SIM.rngOf(31);
    for (let y = 7, k = 0; y < h - 4; y += 8.5, k++) {
      g.strokeStyle = '#5E4428'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(5, y); g.lineTo(w - 5, y); g.stroke();
      g.strokeStyle = 'rgba(160,124,84,.6)'; g.lineWidth = 1; g.beginPath(); g.moveTo(5, y - 2.4); g.lineTo(w - 5, y - 2.4); g.stroke();
      if (crops) for (let x = 8 + (k % 2) * 3; x < w - 6; x += 7.5) {
        const kind = (k + Math.floor(rng() * 2)) % 3;
        if (kind === 0) { circ(g, x, y - 1, 2.9); FS(g, '#7FAF55', 0.9); g.fillStyle = '#A9CF78'; circ(g, x - 0.7, y - 1.7, 1.2); g.fill(); }
        else if (kind === 1) { g.strokeStyle = '#4F8A3C'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 1.8, y - 4.5); g.moveTo(x, y); g.lineTo(x, y - 5.2); g.moveTo(x, y); g.lineTo(x + 1.8, y - 4.5); g.stroke(); g.fillStyle = '#E08A3A'; circ(g, x, y, 1.3); g.fill(); }
        else { ell(g, x, y - 0.8, 3, 2.5); FS(g, '#E39A3C', 0.9); g.strokeStyle = '#4F8A3C'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y - 3); g.lineTo(x + 1.5, y - 5); g.stroke(); }
      }
    }
    /* clôture, ouverte en bas au milieu */
    const post = (x, y) => { rr(g, x - 1.6, y - 4, 3.2, 6.5, 1); FS(g, '#B48858', 0.9); };
    g.strokeStyle = '#8A6038'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-1, -1); g.lineTo(w + 1, -1); g.lineTo(w + 1, h + 1); g.lineTo(w / 2 + 7, h + 1); g.moveTo(w / 2 - 7, h + 1); g.lineTo(-1, h + 1); g.lineTo(-1, -1); g.stroke();
    for (let x = -1; x <= w + 1; x += (w + 2) / 4) { post(x, -1); if (Math.abs(x - w / 2) > 4) post(x, h + 1); }
    post(w / 2 - 7, h + 1); post(w / 2 + 7, h + 1); post(-1, h / 2); post(w + 1, h / 2);
  }
  function drawExterior(g, type, w, h) {
    if (type === 'potager') return drawPotager(g, w, h, true);
    if (type === 'carriere') return drawYard(g, w, h);
    if (type === 'table') return drawTable(g, w, h);
    if (OPEN[type]) return OPEN[type](g, w, h);
    if (extraExterior(g, type, w, h) || houseExt(g, type, w, h)) return;
    if (type === 'tente') return tent(g, w, h, false);
    const rh = h - FH;
    if (type === 'maison') {
      facade(g, w, h, '#DDD2BC', { win: BDEF.maison.win });
      roofTex(g, 0, 0, w, rh, '#A5553D', '#7E3A2A', 'tile');
      g.fillStyle = '#6B4A32'; g.fillRect(0, 0, 2.6, rh); g.fillRect(w - 2.6, 0, 2.6, rh);
      line(g, '#7E3A2A', 1.7); g.strokeRect(0, 0, w, rh);
      rr(g, w - 16, 5, 8, 9, 1.5); FS(g, '#A39C8F', 1.2); g.fillStyle = '#2A2420'; g.fillRect(w - 14, 7, 4, 4);
      for (const wx of BDEF.maison.win) { rr(g, wx - 1, h - 4, 10, 3, 1); FS(g, '#8A6038', 0.8); for (let k = 0; k < 3; k++) { g.fillStyle = k % 2 ? '#E9C85A' : '#C8384A'; circ(g, wx + 1.5 + k * 2.6, h - 4.6, 1.2); g.fill(); } }
    } else if (type === 'cabane' || type === 'cabanon') {
      facade(g, w, h, '#C9AE86', { win: BDEF[type].win });
      roofTex(g, 0, 0, w, rh, '#DDBE7C', '#BF9C58', 'thatch');
      g.fillStyle = '#8A6038'; g.fillRect(0, 0, 2.6, rh); g.fillRect(w - 2.6, 0, 2.6, rh);
      line(g, '#BF9C58', 1.7); g.strokeRect(0, 0, w, rh);
      g.fillStyle = '#8A6038'; g.beginPath(); for (let x = 2; x < w - 2; x += 5) { g.moveTo(x, rh); g.lineTo(x + 2.5, rh + 2.6); g.lineTo(x + 5, rh); } g.fillStyle = '#BF9C58'; g.fill();
      if (type === 'cabane') { rr(g, w - 14, rh * 0.18, 6, 7, 1); FS(g, '#9A948A', 1.1); g.fillStyle = '#2A2420'; g.fillRect(w - 12.5, rh * 0.18 + 1.5, 3, 3); }
    } else if (type === 'cueillette') {
      facade(g, w, h, '#D6C7A6', { win: BDEF.cueillette.win });
      roofTex(g, 0, 0, w, rh, '#9FB068', '#7B8E4C', 'moss');
      g.fillStyle = '#7A5636'; g.fillRect(0, 0, 2.6, rh); g.fillRect(w - 2.6, 0, 2.6, rh);
      line(g, '#7B8E4C', 1.7); g.strokeRect(0, 0, w, rh);
      // bouquets suspendus et paniers
      for (const x of [22, 42]) { g.strokeStyle = '#5E7F3C'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x, rh + 1); g.lineTo(x - 1.5, rh + 7); g.moveTo(x, rh + 1); g.lineTo(x + 1.5, rh + 7); g.moveTo(x, rh + 1); g.lineTo(x, rh + 8); g.stroke(); g.fillStyle = '#B07CC6'; circ(g, x, rh + 8, 1.2); g.fill(); }
      for (const x of [w - 9]) { rr(g, x - 5, h - 6, 10, 6, 2); FS(g, '#B5833F', 1.1); g.fillStyle = '#C8384A';[[-2, -6.5], [1.5, -7], [3, -6]].forEach(q => { circ(g, x + q[0], h + q[1], 1.5); g.fill(); }); }
    } else if (type === 'pecheur') {
      facade(g, w, h, '#B9C2B8', { win: [] });
      roofTex(g, 0, 0, w, rh, '#8FA9AE', '#6C8890', 'planks');
      g.fillStyle = '#566B72'; g.fillRect(0, 0, 2.6, rh); g.fillRect(w - 2.6, 0, 2.6, rh);
      line(g, '#6C8890', 1.7); g.strokeRect(0, 0, w, rh);
      g.save(); g.beginPath(); g.rect(6, 4, 18, 12); g.clip(); g.strokeStyle = 'rgba(244,238,220,.8)'; g.lineWidth = 0.6; g.beginPath(); for (let i = -12; i < 30; i += 3.2) { g.moveTo(6 + i, 4); g.lineTo(18 + i, 16); g.moveTo(18 + i, 4); g.lineTo(6 + i, 16); } g.stroke(); g.restore();
      g.strokeStyle = '#E9DFC6'; g.lineWidth = 0.9; g.strokeRect(6, 4, 18, 12);
      for (const x of [w - 14, w - 9.5, w - 5]) { g.strokeStyle = '#7A5636'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(x, rh + 1); g.lineTo(x, rh + 3); g.stroke(); ell(g, x, rh + 6, 1.5, 3.2); FS(g, '#B9CBD6', 0.7); }
      rr(g, 5, h - 9, 8, 9, 2); FS(g, '#9C7146', 1.1); g.strokeStyle = '#5A4028'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(5, h - 6); g.lineTo(13, h - 6); g.moveTo(5, h - 3); g.lineTo(13, h - 3); g.stroke();
    } else if (type === 'four') {
      facade(g, w, h, '#B9B1A0', { win: BDEF.four.win });
      roofTex(g, 0, 0, w, rh, '#C8734A', '#A4573A', 'tile');
      g.fillStyle = '#7E4A30'; g.fillRect(0, 0, 2.6, rh); g.fillRect(w - 2.6, 0, 2.6, rh);
      line(g, '#A4573A', 1.7); g.strokeRect(0, 0, w, rh);
      rr(g, w - 17, 4, 10, 10, 1.5); FS(g, '#A39C8F', 1.2); g.fillStyle = '#2A2019'; g.fillRect(w - 14.5, 6.5, 5, 5); g.fillStyle = 'rgba(255,150,60,.6)'; g.fillRect(w - 13.5, 7.5, 3, 3);
      rr(g, 4, h - 5, 11, 3, 1); FS(g, '#B48858', 0.8); for (const x of [6.5, 9.8, 13]) { ell(g, x, h - 6.3, 1.9, 1.3); FS(g, '#D9A441', 0.7); }
    } else {
      facade(g, w, h, '#4A3A2C', { open: true });
      g.fillStyle = 'rgba(20,14,10,.55)'; g.fillRect(5, h - FH - 2, w - 10, FH + 2);
      for (let i = 0; i < 6; i++) for (let j = 0; j < 2 - (i % 2 ? 0 : 0); j++) { const x = 11 + i * 7 + (j ? 3.5 : 0), y = h - 4 - j * 5.5; if (i > 4 && j) continue; circ(g, x, y, 3.1); FS(g, '#B48858', 0.9); g.fillStyle = '#8A6038'; circ(g, x, y, 1.1); g.fill(); }
      g.fillStyle = '#7A5636'; g.fillRect(w / 2 + 12, h - FH - 2, 3, FH + 2);
      roofTex(g, 0, 0, w, rh, '#B48A5C', '#8F6A44', 'planks');
      line(g, '#8F6A44', 1.7); g.strokeRect(0, 0, w, rh);
      // hache plantée dans un billot
      const bx = w - 13, by = h - 5; ell(g, bx, by, 5, 3.6); FS(g, '#B08456', 1.1);
      g.save(); g.translate(bx, by - 1); g.rotate(-0.5); g.fillStyle = '#8D6239'; g.fillRect(-0.9, -11, 1.8, 11); g.beginPath(); g.moveTo(0.5, -11); g.quadraticCurveTo(6, -11.5, 6, -6.5); g.quadraticCurveTo(3, -6, 0.5, -7); g.closePath(); FS(g, '#C3C9D1', 0.9); g.restore();
    }
    g.fillStyle = 'rgba(255,255,255,.10)'; g.fillRect(0, 0, w, 2);
  }
  function drawInterior(g, type, w, h) {
    if (type === 'potager') return drawPotager(g, w, h, false);
    if (type === 'carriere') return drawYard(g, w, h);
    if (type === 'table') return drawTable(g, w, h);
    if (OPEN[type]) return OPEN[type](g, w, h);
    if (extraInterior(g, type, w, h) || houseInt(g, type, w, h)) return;
    if (type === 'tente') return tent(g, w, h, true);
    planks(g, 0, 0, w, h, type === 'bucheron' ? '#B79468' : type === 'four' ? '#BDB5A4' : type === 'pecheur' ? '#C3B08C' : '#CDAA7C', 5.5);
    if (type === 'cabane') {
      ell(g, w / 2, h * 0.68, 11, 7); FS(g, '#A9503F', 1); ell(g, w / 2, h * 0.68, 7, 4); g.strokeStyle = '#E3C46B'; g.lineWidth = 0.9; g.stroke();
      for (const b of BDEF.cabane.beds) bed(g, b[0], b[1]);
      rr(g, w - 16, h - 16, 10, 7, 1.5); FS(g, '#8A6038', 1.1); g.fillStyle = '#D9B45A'; g.fillRect(w - 12, h - 13.5, 2, 2);
      circ(g, 11, h - 13, 4.2); FS(g, '#A87A4A', 1); g.fillStyle = '#FFD47A'; circ(g, 11, h - 13, 1.3); g.fill();
    } else if (type === 'maison') {
      rr(g, 13, h - 19, 22, 11, 2); FS(g, '#4E6E80', 1); g.strokeStyle = '#DCE6E4'; g.lineWidth = 0.8; g.strokeRect(15.500, h - 16.500, 17, 6);
      for (const b of BDEF.maison.beds) bed(g, b[0], b[1]);
      rr(g, 19, 6, 10, 9, 1.5); FS(g, '#A87A4A', 1.1); circ(g, 24, 10.500, 2); g.fillStyle = '#E9C85A'; g.fill();
      rr(g, w - 13, h - 15, 8, 8, 1.5); FS(g, '#8A6038', 1.1); g.fillStyle = '#D9B45A'; g.fillRect(w - 10, h - 12, 2, 2);
      circ(g, 9, h - 12, 3.6); FS(g, '#A87A4A', 1);
    } else if (type === 'cabanon') {
      ell(g, w / 2 + 2, h - 11, 9, 5); FS(g, '#A9503F', 1); ell(g, w / 2 + 2, h - 11, 5.5, 2.8); g.strokeStyle = '#E3C46B'; g.lineWidth = 0.9; g.stroke();
      for (const b of BDEF.cabanon.beds) bed(g, b[0], b[1]);
      rr(g, w - 15, 6, 10, 7, 1.5); FS(g, '#8A6038', 1.1); g.fillStyle = '#D9B45A'; g.fillRect(w - 11, 8.5, 2, 2);
      circ(g, w - 10.5, 21, 3.8); FS(g, '#A87A4A', 1); g.fillStyle = '#FFD47A'; circ(g, w - 10.5, 21, 1.2); g.fill();
    } else if (type === 'cueillette') {
      rr(g, 8, 8, 22, 10, 2); FS(g, '#A87A4A', 1.1);
      for (const q of [[13, 13], [20, 13], [26, 12.5]]) { circ(g, q[0], q[1], 3); FS(g, '#B5833F', 0.9); g.fillStyle = '#C8384A'; circ(g, q[0] - 0.8, q[1] - 0.6, 1); g.fill(); circ(g, q[0] + 0.9, q[1] + 0.5, 1); g.fill(); }
      g.strokeStyle = '#7A5636'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(36, 9); g.lineTo(w - 7, 9); g.stroke();
      for (let x = 39; x < w - 8; x += 5) { g.strokeStyle = '#5E7F3C'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, 9); g.lineTo(x, 15); g.stroke(); g.fillStyle = x % 2 ? '#B07CC6' : '#D9B44E'; circ(g, x, 15.5, 1.2); g.fill(); }
      for (const q of [[w - 14, h - 13], [w - 21, h - 10]]) { ell(g, q[0], q[1], 4, 4.8); FS(g, '#E2D2A8', 1); }
      rr(g, 9, h - 17, 12, 9, 1.5); FS(g, '#8A6038', 1.1); g.fillStyle = '#7DB36A';[[12, -13], [16, -12], [18, -14]].forEach(q => { circ(g, q[0], h + q[1], 1.6); g.fill(); });
    } else if (type === 'pecheur') {
      rr(g, 6, 7, 20, 9, 2); FS(g, '#A87A4A', 1.1);
      for (const q of [[11, 11.5], [17, 10.5], [22, 12]]) { ell(g, q[0], q[1], 3.4, 1.5, 0.3); FS(g, '#B9CBD6', 0.7); }
      circ(g, w - 12, 12, 5.5); FS(g, '#D9CDA8', 1); g.strokeStyle = 'rgba(120,96,60,.6)'; g.lineWidth = 0.6; circ(g, w - 12, 12, 3.6); g.stroke(); circ(g, w - 12, 12, 1.7); g.stroke();
      g.strokeStyle = '#8D6239'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(w - 7, 22); g.lineTo(w - 7, h - 8); g.moveTo(w - 10, 23); g.lineTo(w - 10, h - 8); g.stroke();
      circ(g, 11, h - 12, 5); FS(g, '#9C7146', 1.1); circ(g, 11, h - 12, 3.2); g.fillStyle = '#6FA3B8'; g.fill();
      circ(g, 22, h - 10, 3); FS(g, '#8A8F98', 0.9);
    } else if (type === 'four') {
      circ(g, w - 15, 14, 10); FS(g, '#A39C8F', 1.4); circ(g, w - 15, 14, 7); g.fillStyle = '#8E877B'; g.fill();
      g.beginPath(); g.arc(w - 15, 18, 4.8, Math.PI, 0); g.lineTo(w - 10.2, 22); g.lineTo(w - 19.8, 22); g.closePath(); g.fillStyle = '#2A2019'; g.fill();
      g.beginPath(); g.arc(w - 15, 20, 3, Math.PI, 0); g.lineTo(w - 12, 22); g.lineTo(w - 18, 22); g.closePath(); g.fillStyle = '#FF9A3C'; g.fill();
      rr(g, 6, 8, 16, 11, 2); FS(g, '#B48858', 1.1); for (const q of [[10, 11.5], [16.5, 11], [13, 15.5]]) { ell(g, q[0], q[1], 2.7, 1.8, 0.3); FS(g, '#D9A441', 0.7); }
      for (const q of [[9, h - 13], [16, h - 10]]) { ell(g, q[0], q[1], 4.2, 5); FS(g, '#EFE6D2', 1); g.strokeStyle = 'rgba(120,100,70,.5)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(q[0] - 2, q[1] - 3.4); g.lineTo(q[0] + 2, q[1] - 3.4); g.stroke(); }
      g.strokeStyle = '#8D6239'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(w - 7, 27); g.lineTo(w - 7, h - 9); g.stroke(); rr(g, w - 10, h - 12, 6, 5, 1.5); FS(g, '#B48858', 0.8);
    } else {
      rr(g, 10, 14, 26, 6, 2); FS(g, '#B48858', 1.1); g.fillStyle = '#8D6239'; g.fillRect(13, 11, 2.5, 12); g.fillRect(31, 11, 2.5, 12);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { rr(g, w - 26, 8 + i * 6 + j * 0, 18, 5, 2.5); FS(g, '#B48858', 0.9); }
      ell(g, 18, h - 13, 5.5, 4.2); FS(g, '#B08456', 1.1); g.fillStyle = '#8D6239'; g.fillRect(17, h - 21, 1.8, 9);
      g.fillStyle = '#E9D9B8'; for (let i = 0; i < 14; i++) { const x = 8 + (i * 37 % (w - 16)), y = 26 + (i * 23 % (h - 34)); ell(g, x, y, 1.6, 0.8, i); g.fill(); }
    }
    wallsPlan(g, w, h, type === 'bucheron' ? '#6B4A2E' : type === 'four' ? '#8E877B' : type === 'pecheur' ? '#6E7F86' : type === 'maison' ? '#9C937F' : '#8A6038');
  }

  /* ---------- sol ---------- */
  function riverPath(g, map, off) {
    const P = map.river, ox = map.axis === 'x' ? 0 : (off || 0), oy = map.axis === 'x' ? (off || 0) : 0;
    g.beginPath(); for (let i = 0; i < P.length; i++) i ? g.lineTo(P[i].x + ox, P[i].y + oy) : g.moveTo(P[i].x + ox, P[i].y + oy);
  }
  function drawGround(g, map) {
    const r = SIM.rngOf(404 + map.id.charCodeAt(0) * 7), F = map.fire, B = map.bridge;
    const RX = () => X.x + r() * X.w, RY = () => X.y + r() * X.h;
    g.fillStyle = '#6C7C47'; g.fillRect(X.x, X.y, X.w, X.h);
    /* la clairière s'éclaircit là où le terrain est dégagé */
    for (let y = X.y; y < X.y + X.h; y += 13) for (let x = X.x; x < X.x + X.w; x += 13) {
      if (!map.open(x, y)) continue;
      const gr = g.createRadialGradient(x, y, 0, x, y, 30); gr.addColorStop(0, 'rgba(182,188,114,0.17)'); gr.addColorStop(1, 'rgba(182,188,114,0)'); g.fillStyle = gr; g.fillRect(x - 30, y - 30, 60, 60);
    }
    let gr = g.createRadialGradient(F.x, F.y, 30, F.x, F.y, 190); gr.addColorStop(0, 'rgba(206,202,124,0.34)'); gr.addColorStop(1, 'rgba(206,202,124,0)'); g.fillStyle = gr; g.fillRect(F.x - 190, F.y - 190, 380, 380);
    for (const [x0, y0, x1, y1] of [[0, X.y, 0, X.y + 110], [0, X.y + X.h, 0, X.y + X.h - 110], [X.x, 0, X.x + 100, 0], [X.x + X.w, 0, X.x + X.w - 100, 0]]) {
      gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, 'rgba(40,50,28,0.62)'); gr.addColorStop(1, 'rgba(40,50,28,0)'); g.fillStyle = gr; g.fillRect(X.x, X.y, X.w, X.h);
    }
    for (let i = 0; i < 70; i++) { const x = RX(), y = RY(), q = 26 + r() * 46, c = r() < 0.5 ? '205,200,120' : '70,86,44'; gr = g.createRadialGradient(x, y, 0, x, y, q); gr.addColorStop(0, 'rgba(' + c + ',0.15)'); gr.addColorStop(1, 'rgba(' + c + ',0)'); g.fillStyle = gr; g.fillRect(x - q, y - q, q * 2, q * 2); }
    for (const t of map.trees) { gr = g.createRadialGradient(t.x, t.y, 0, t.x, t.y, t.r * 1.9); gr.addColorStop(0, 'rgba(52,56,30,0.32)'); gr.addColorStop(1, 'rgba(52,56,30,0)'); g.fillStyle = gr; g.fillRect(t.x - t.r * 2, t.y - t.r * 2, t.r * 4, t.r * 4); }
    for (let i = 0; i < 9000; i++) { g.fillStyle = r() < 0.5 ? 'rgba(40,52,24,0.10)' : 'rgba(232,226,160,0.10)'; g.fillRect(RX(), RY(), 1, 1); }
    for (let i = 0; i < 1100; i++) {
      const x = RX(), y = RY(); if (!map.open(x, y) && r() < 0.65) continue;
      g.strokeStyle = r() < 0.6 ? 'rgba(88,108,54,0.75)' : 'rgba(150,160,88,0.75)'; g.lineWidth = 0.9; g.lineCap = 'round';
      g.beginPath(); g.moveTo(x, y); g.lineTo(x - 1.8, y - 3.6); g.moveTo(x, y); g.lineTo(x, y - 4.6); g.moveTo(x, y); g.lineTo(x + 1.8, y - 3.6); g.stroke();
    }
    const LEAF = ['#D9823A', '#C2502F', '#E3B54A', '#A8623A'];
    for (const t of map.trees) if (t.kind !== 'pine') for (let i = 0; i < 9; i++) { const a = r() * 6.28, d = t.r * (0.7 + r() * 1.2); g.fillStyle = al(LEAF[Math.floor(r() * 4)], 0.85); ell(g, t.x + Math.cos(a) * d, t.y + Math.sin(a) * d, 2, 1, r() * 3.14); g.fill(); }
    for (let i = 0; i < 300; i++) { g.fillStyle = al(LEAF[Math.floor(r() * 4)], 0.7); ell(g, RX(), RY(), 1.8, 0.9, r() * 3.14); g.fill(); }
    for (let i = 0, n = 0; i < 400 && n < 34; i++) { const x = 20 + r() * (W - 40), y = 150 + r() * (H - 200); if (!map.clear(x, y)) continue; n++; g.fillStyle = r() < 0.5 ? '#F2EEDC' : '#E9C85A'; circ(g, x, y, 1.3); g.fill(); g.fillStyle = '#C98F2E'; circ(g, x, y, 0.5); g.fill(); }
    /* rivière */
    g.lineCap = 'butt'; g.lineJoin = 'round';
    for (const [c, w, o] of [['#CDBB8E', 48, 0], ['#A7986E', 39, 0], ['#D5E6E4', 34, 0], ['#5E97AC', 31, 0], ['rgba(62,118,146,0.9)', 19, 0], ['rgba(46,98,128,0.55)', 8, 1]]) { riverPath(g, map, o); g.strokeStyle = c; g.lineWidth = w; g.stroke(); }
    const a0 = map.axis === 'x' ? X.x : X.y, aL = map.axis === 'x' ? X.w : X.h;
    for (let i = 0; i < 7; i++) { const a = a0 + aL * (i + 0.3 + r() * 0.4) / 7; if (Math.abs(a - map.at) < 34) continue; const p = map.bank(a, (i % 2 ? 5 : -5)); g.save(); g.translate(p.x, p.y); g.fillStyle = 'rgba(210,230,232,.55)'; ell(g, 0, 1, 6.5, 4.5); g.fill(); drawRock(g, 4); g.restore(); }
    for (let i = 0; i < 54; i++) {
      const a = a0 + r() * aL, s = r() < 0.5 ? -1 : 1; if (Math.abs(a - map.at) < 22) continue;
      const p = map.bank(a, s * (19 + r() * 3)), x = p.x, y = p.y + 3;
      g.strokeStyle = '#5E8A46'; g.lineWidth = 1.1; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 1.5, y - 6); g.moveTo(x + 2, y); g.lineTo(x + 2.5, y - 7); g.moveTo(x + 4, y); g.lineTo(x + 5.5, y - 5); g.stroke(); g.fillStyle = '#7A5636'; ell(g, x + 2.5, y - 7.5, 0.9, 2); g.fill();
    }
  }
  function drawBridge(g, map) {
    const B = map.bridge, w = 26, h = 54;
    g.save(); g.translate(B.x, B.y); if (B.dir === 'h') g.rotate(Math.PI / 2);
    g.fillStyle = 'rgba(20,30,40,.28)'; g.fillRect(-w / 2 + 3, -h / 2 + 4, w, h);
    planks(g, -w / 2, -h / 2, w, h, '#B48A5C', 5.4);
    g.fillStyle = '#7A5636'; g.fillRect(-w / 2 - 1.5, -h / 2, 3.4, h); g.fillRect(w / 2 - 1.9, -h / 2, 3.4, h);
    g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(-w / 2 - 1.5, -h / 2, 1.2, h); g.fillRect(w / 2 - 1.9, -h / 2, 1.2, h);
    for (const yy of [-h / 2, -2, h / 2 - 4]) for (const xx of [-w / 2 - 2.4, w / 2 - 2.6]) { rr(g, xx, yy, 5, 5, 1.2); FS(g, '#8A6038', 1); }
    g.restore();
  }
  /* la réserve : bois, vivres et pierres s'y empilent (repère : coin haut-gauche) */
  function drawStock(g, S, wood, food, stone) {
    g.fillStyle = 'rgba(30,22,14,.22)'; rr(g, 1, 3, S.w, S.h, 3); g.fill();
    planks(g, 0, 0, S.w, S.h, '#A98458', 6); line(g, '#A98458', 1.3); g.strokeRect(0, 0, S.w, S.h);
    for (let i = 0; i < Math.min(6, stone || 0); i++) { const x = 5 + i * 8.4, y = 2.5 + (i % 2); g.fillStyle = 'rgba(30,22,14,.25)'; g.fillRect(x + 0.8, y + 1.2, 6.6, 5); rr(g, x, y, 6.6, 5, 1); FS(g, i % 2 ? '#B8B2A6' : '#C8C2B6', 0.9); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(x + 0.7, y + 0.7, 5.2, 1.1); }
    const n = Math.min(14, wood);
    for (let i = 0; i < n; i++) { const row = i < 5 ? 0 : i < 9 ? 1 : i < 12 ? 2 : 3, k = i - [0, 5, 9, 12][row], x = 6 + k * 5 + row * 2.5, y = S.h - 6 - row * 4.6; circ(g, x, y, 2.9); FS(g, '#B48858', 0.9); g.fillStyle = '#8A6038'; circ(g, x, y, 1); g.fill(); }
    const m = Math.min(10, food);
    for (let i = 0; i < m; i++) { const col = i % 5, row = Math.floor(i / 5), x = 33 + col * 4.6 + row * 1.5, y = S.h - 7 - row * 9 - (col % 2) * 1.5; rr(g, x - 3.2, y - 2.6, 6.4, 5.6, 1.6); FS(g, '#B5833F', 0.9); g.fillStyle = col % 2 ? '#C8384A' : '#D9A441'; circ(g, x - 1, y - 2.6, 1.3); g.fill(); circ(g, x + 1.2, y - 2.9, 1.3); g.fill(); }
  }

  return { dk, lt, al, rr, circ, ell, FS, line, SKINS, HAIRC, OUT, MORPH, TREEPAL, FH, BDEF, drawPawn, drawTree, drawBush, drawRock, drawStump, drawOutcrop, drawSails, drawExterior, drawInterior, drawGround, riverPath, drawBridge, drawStock, bed, planks };
})();
