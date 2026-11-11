'use strict';
/* ===== Hameau — sons : tout est synthétisé (aucun fichier), doux et discret ===== */
const SFX = (() => {
  let ac = null, master = null, bus = null, noiseW = null, noiseB = null, L = null, muted = false, timer = null, lastAmb = 0, cur = 'village', nextPhrase = 0;
  /* quatre familles de sons, réglables séparément */
  const vol = { music: 0.6, nature: 0.8, village: 0.8, ui: 0.7 };
  const FAM = { note: 'music', tap: 'ui', card: 'ui', go: 'ui', back: 'ui', star: 'ui', fail: 'ui', page: 'ui', drop: 'ui', open: 'ui', flare: 'nature', splash: 'nature', rustle: 'nature', thunder: 'nature' };
  let st = { night: 0, rain: 0, flood: 0, frost: 0, play: 0 }, lastStep = 0, lastHit = 0;
  const PENTA = [0, 2, 4, 7, 9];
  let root = 293.66; // tonique des sons du jeu : elle suit la tonalité du morceau en cours
  const hz = (deg, oct) => root * Math.pow(2, (PENTA[((deg % 5) + 5) % 5] + 12 * (Math.floor(deg / 5) + (oct || 0))) / 12);
  const rnd = (a, b) => a + Math.random() * (b - a);

  function mkNoise(brown) {
    const n = ac.sampleRate * 3, b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0); let v = 0;
    for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; if (brown) { v = (v + 0.02 * w) / 1.02; d[i] = v * 3.5; } else d[i] = w; }
    if (brown) { const e = d[n - 1] - d[0]; for (let i = 0; i < n; i++) d[i] -= e * i / n; } // boucle sans couture
    return b;
  }
  /* une nappe continue : bruit en boucle, filtres, gain piloté par l'ambiance */
  function layer(buf, filters) {
    const s = ac.createBufferSource(); s.buffer = buf; s.loop = true; let n = s; const fl = [];
    for (const f of filters) { const q = ac.createBiquadFilter(); q.type = f[0]; q.frequency.value = f[1]; q.Q.value = f[2] || 0.7; n.connect(q); n = q; fl.push(q); }
    const g = ac.createGain(); g.gain.value = 0; n.connect(g); g.connect(bus.nature); s.start(0, Math.random() * 2);
    return { g, fl };
  }
  function lfo(freq, depth, param) { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = freq; g.gain.value = depth; o.connect(g); g.connect(param); o.start(); }
  function build() {
    master = ac.createGain(); master.gain.value = muted ? 0 : 2;
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.3;
    master.connect(comp); comp.connect(ac.destination);
    bus = {}; for (const k in vol) { bus[k] = ac.createGain(); bus[k].gain.value = vol[k]; bus[k].connect(master); }
    bus.life = ac.createGain(); bus.life.gain.value = 1.7; bus.life.connect(bus.nature); // les voix de la nature, devant les nappes
    bus.rec = ac.createGain(); bus.rec.gain.value = vol.music; bus.rec.connect(master); // les morceaux enregistrés : même réglage que la musique, sans l'écho
    /* la musique passe par un écho long, qui la rend lointaine */
    const dl = ac.createDelay(1.5), fb = ac.createGain(), lp = ac.createBiquadFilter(); dl.delayTime.value = 0.46; fb.gain.value = 0.42; lp.type = 'lowpass'; lp.frequency.value = 1700;
    bus.music.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(master);
    noiseW = mkNoise(false); noiseB = mkNoise(true);
    L = {
      wind: layer(noiseW, [['lowpass', 330, 0.3]]), leaves: layer(noiseW, [['bandpass', 4300, 0.9]]),
      rain: layer(noiseW, [['highpass', 1100, 0.5], ['lowpass', 7200, 0.5]]), fire: layer(noiseB, [['bandpass', 250, 0.5]])
    };
    /* rien ne tient une note : chaque nappe passe par un gain qui monte et retombe lentement */
    const breathe = (l, base, waves) => { const g = ac.createGain(); g.gain.value = base; l.g.disconnect(); l.g.connect(g); g.connect(bus.nature); for (const w of waves) lfo(w[0], w[1], g.gain); return g; };
    lfo(0.07, 110, L.wind.fl[0].frequency);
    /* la rivière : pas de gouttes, un seul courant. Cinq bandes de souffle, du grave à l'aigu ; chacune enfle, retombe et glisse
       à son propre rythme, lent et rapide mêlés : c'est ce chatoiement qui fait l'eau qui court, sans aucune note. */
    const water = ac.createGain(); water.gain.value = 0; const wlp = ac.createBiquadFilter(); wlp.type = 'lowpass'; wlp.frequency.value = 5200; water.connect(wlp); wlp.connect(bus.nature);
    [[380, 1.3, 1.0, 0.11, 0.9], [700, 1.8, 0.95, 0.17, 1.7], [1250, 2.2, 0.8, 0.29, 2.9], [2100, 2.4, 0.5, 0.43, 4.3], [3300, 2.4, 0.26, 0.67, 6.1]].forEach(b => {
      const src = ac.createBufferSource(), q = ac.createBiquadFilter(), g = ac.createGain(); src.buffer = noiseW; src.loop = true; q.type = 'bandpass'; q.frequency.value = b[0]; q.Q.value = b[1]; g.gain.value = b[2] * 0.55;
      src.connect(q); q.connect(g); g.connect(water); src.start(0, Math.random() * 2);
      lfo(b[3], b[2] * 0.2, g.gain); lfo(b[4], b[2] * 0.16, g.gain); lfo(b[4] * 2.37, b[2] * 0.1, g.gain); lfo(b[3] * 0.61, b[0] * 0.14, q.frequency); lfo(b[4] * 0.83, b[0] * 0.05, q.frequency);
    });
    L.river = { g: water, fl: [] };
    const breatheW = ac.createGain(); breatheW.gain.value = 0.7; wlp.disconnect(); wlp.connect(breatheW); breatheW.connect(bus.nature); lfo(0.061, 0.2, breatheW.gain); lfo(0.19, 0.1, breatheW.gain); // et le tout respire, de loin
    breathe(L.fire, 0.7, [[0.61, 0.13], [5.3, 0.09], [1.9, 0.07]]);                       // la flamme vacille
    const gust = breathe(L.wind, 0.5, [[0.045, 0.3], [0.117, 0.14]]);                      // le vent vient par rafales…
    L.leaves.g.disconnect(); L.leaves.g.connect(gust);                                     // …et les feuilles ne bruissent que quand il passe
  }
  const set = (l, v, tc) => l.g.gain.setTargetAtTime(v, ac.currentTime, tc || 0.8);
  function applyAmbient(now) {
    if (!L) return; const tc = now ? 0.01 : 0.8;
    set(L.river, 0.015 + 0.1 * st.flood - 0.007 * st.frost - 0.004 * st.night, tc);
    set(L.wind, 0.022 + 0.01 * st.night + 0.035 * st.rain + 0.03 * st.frost, tc); set(L.leaves, 0.006 + 0.012 * st.rain - 0.004 * st.frost, tc);
    set(L.rain, 0.055 * st.rain, tc);
    set(L.fire, 0.012 + 0.02 * st.night, tc);
  }

  /* ---------- briques sonores ---------- */
  function out(node, pan) {
    const b = bus[cur] || bus.village;
    if (pan && ac.createStereoPanner) { const p = ac.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); node.connect(p); p.connect(b); } else node.connect(b);
  }
  function tone(o) {
    const t0 = ac.currentTime + (o.at || 0), osc = ac.createOscillator(), g = ac.createGain();
    osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(o.f, t0); if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t0 + o.d);
    g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(o.v, t0 + (o.a || 0.006)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.d);
    osc.connect(g); out(g, o.pan); osc.start(t0); osc.stop(t0 + o.d + 0.05);
  }
  function hiss(o) {
    const t0 = ac.currentTime + (o.at || 0), s = ac.createBufferSource(), q = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = o.brown ? noiseB : noiseW; q.type = o.type || 'bandpass'; q.frequency.setValueAtTime(o.f, t0); if (o.f2) q.frequency.exponentialRampToValueAtTime(o.f2, t0 + o.d); q.Q.value = o.q || 1;
    g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(o.v, t0 + (o.a || 0.004)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.d);
    s.connect(q); q.connect(g); out(g, o.pan); s.start(t0, Math.random() * 2, o.d + 0.1);
  }
  /* note boisée, entre kalimba et marimba */
  function pluck(deg, v, o) {
    o = o || {}; const f = hz(deg, o.oct), at = o.at || 0, pan = o.pan;
    tone({ f, d: o.d || 0.7, v: v, at, pan }); tone({ f: f * 2, d: 0.3, v: v * 0.32, at, pan }); tone({ f: f * 4.02, d: 0.1, v: v * 0.12, at, pan });
    hiss({ f: 2400, q: 0.8, d: 0.02, v: v * 0.25, at, pan });
  }

  /* ---------- bruitages nommés ---------- */
  const S = {
    tap: () => tone({ f: 740, f2: 620, d: 0.05, v: 0.05 }),
    card: () => pluck(4, 0.09),
    go: () => { pluck(2, 0.08); pluck(7, 0.08, { at: 0.09 }); },
    back: () => pluck(0, 0.06),
    site: p => { tone({ f: 150, f2: 90, d: 0.16, v: 0.12, pan: p }); hiss({ f: 900, q: 0.6, d: 0.12, v: 0.05, pan: p }); },
    built: p => [0, 2, 4, 7].forEach((d, i) => pluck(d + 5, 0.085, { at: i * 0.085, pan: p })),
    job: p => { pluck(4, 0.07, { pan: p }); pluck(7, 0.07, { at: 0.11, pan: p }); },
    home: p => { pluck(2, 0.06, { pan: p }); pluck(5, 0.06, { at: 0.12, pan: p }); },
    arrive: () => [0, 4, 7, 9].forEach((d, i) => pluck(d, 0.07, { at: i * 0.13 })),
    food: p => { pluck(7, 0.075, { pan: p }); pluck(9, 0.06, { at: 0.07, pan: p }); },
    wood: p => { pluck(2, 0.085, { oct: -1, pan: p }); hiss({ f: 1300, q: 1, d: 0.04, v: 0.04, pan: p }); },
    stone: p => { pluck(0, 0.09, { oct: -1, d: 0.35, pan: p }); tone({ f: 2100, d: 0.05, v: 0.02, type: 'triangle', pan: p }); },
    eat: (p, i) => pluck((i || 0) % 10, 0.05, { pan: p, d: 0.5 }),
    bed: (p, i) => pluck((i || 0) % 5, 0.04, { oct: -1, pan: p, d: 0.9 }),
    lack: p => { tone({ f: 196, f2: 185, d: 0.5, v: 0.07, pan: p }); tone({ f: 147, f2: 139, d: 0.7, v: 0.06, at: 0.22, pan: p }); },
    dead: () => { tone({ f: 147, d: 1.6, v: 0.08 }); tone({ f: 174.6, d: 1.6, v: 0.06, at: 0.05 }); },
    hammer: p => { tone({ f: 250, f2: 170, d: 0.07, v: 0.07, type: 'triangle', pan: p }); hiss({ f: 2100, q: 1.5, d: 0.03, v: 0.045, pan: p }); },
    chop: p => { tone({ f: 150, f2: 92, d: 0.11, v: 0.11, pan: p }); hiss({ f: 1400, q: 0.9, d: 0.05, v: 0.06, pan: p }); },
    mine: p => { tone({ f: 1900, d: 0.09, v: 0.03, type: 'triangle', pan: p }); tone({ f: 2870, d: 0.06, v: 0.018, pan: p }); hiss({ type: 'highpass', f: 3000, d: 0.02, v: 0.03, pan: p }); },
    fall: p => { hiss({ f: 1900, f2: 320, q: 0.7, d: 0.7, v: 0.07, a: 0.08, pan: p }); tone({ f: 82, f2: 50, d: 0.36, v: 0.16, at: 0.5, pan: p }); hiss({ f: 500, q: 0.5, d: 0.25, v: 0.07, at: 0.5, pan: p }); },
    rustle: p => { hiss({ f: 3800, q: 0.6, d: 0.34, v: 0.1, a: 0.05, pan: p }); hiss({ f: 5200, q: 0.8, d: 0.22, v: 0.07, at: 0.1, a: 0.04, pan: p }); },
    splash: p => { hiss({ f: 800, f2: 2600, q: 0.8, d: 0.26, v: 0.09, pan: p }); tone({ f: 520, f2: 240, d: 0.13, v: 0.06, pan: p }); tone({ f: 900, f2: 1500, d: 0.07, v: 0.03, at: 0.12, pan: p }); },
    flare: p => { hiss({ f: 500, f2: 1500, q: 0.5, d: 0.55, v: 0.42, a: 0.06, brown: true, pan: p }); for (let i = 0; i < 8; i++) crackle(p, rnd(0, 0.45), 2.2); },
    knock: p => { S.hammer(p); tone({ f: 230, f2: 160, d: 0.07, v: 0.05, type: 'triangle', at: 0.14, pan: p }); },
    voice: (p, i) => pluck(i || 0, 0.07, { pan: p, d: 0.45 }),
    star: (p, i) => { pluck(5 + 2 * (i || 0), 0.1); tone({ f: hz(5 + 2 * (i || 0)) * 4, d: 0.5, v: 0.015, at: 0.02 }); },
    fail: () => { pluck(4, 0.07, { oct: -1 }); pluck(2, 0.07, { oct: -1, at: 0.2 }); },
    /* une goutte tombe, et son écho descend dans les graves */
    drop: () => {
      tone({ f: 1320, f2: 640, d: 0.1, v: 0.16 }); tone({ f: 2640, f2: 1500, d: 0.05, v: 0.05 });
      for (let i = 1; i <= 7; i++) { const f = 640 * Math.pow(0.74, i); tone({ f, f2: f * 0.62, d: 0.16 + i * 0.07, v: 0.13 * Math.pow(0.72, i), a: 0.012, at: 0.27 * i + i * i * 0.012 }); }
      tone({ f: 73.4, d: 2.6, v: 0.1, a: 0.5, at: 1.5 }); tone({ f: 110, d: 2.2, v: 0.04, a: 0.6, at: 1.6 });
    },
    note: (p, i) => pluck(i == null ? 4 : i, 0.04, { d: 1.2, pan: p }),
    /* le livre s'ouvre : il se pose, la couverture bascule, deux feuilles suivent, et quelques notes montent dans le ton du morceau à venir */
    open: () => {
      if (!M.dead && TRACKS[M.want]) root = TRACKS[M.want][M.idx[M.want] % TRACKS[M.want].length].root;
      cur = 'ui'; hiss({ type: 'lowpass', f: 190, d: 0.55, v: 0.14, a: 0.16, brown: true }); tone({ f: 82, f2: 62, d: 0.5, v: 0.07, a: 0.08 });
      hiss({ f: 380, f2: 1250, q: 1.1, d: 1.0, v: 0.17, a: 0.3, at: 0.95, brown: true }); hiss({ f: 1500, f2: 600, q: 1.2, d: 0.5, v: 0.12, a: 0.1, at: 1.7, brown: true });
      [1.28, 1.44].forEach(t => { hiss({ f: 650, f2: 1500, q: 1.3, d: 0.2, v: 0.11, a: 0.05, at: t, brown: true }); hiss({ type: 'lowpass', f: 360, d: 0.09, v: 0.04, a: 0.015, at: t + 0.22, brown: true }); });
      cur = 'music'; [0, 2, 4, 5, 7, 9].forEach((d, i) => pluck(d, 0.05 + i * 0.008, { at: 1.15 + i * 0.15, d: i === 5 ? 2.6 : 1.3 }));
      [4, 8].forEach((m, i) => tone({ f: hz(4) * m / 2, d: 2.8, v: 0.007, a: 0.9, at: 1.9 + i * 0.2 }));
    },
    page: () => { /* la feuille se soulève, glisse et se pose : un souffle de papier, aucun claquement */
      hiss({ f: 600, f2: 1500, q: 1.2, d: 0.2, v: 0.2, a: 0.07, brown: true }); hiss({ f: 1400, f2: 650, q: 1.1, d: 0.24, v: 0.17, a: 0.05, at: 0.13, brown: true });
      for (let i = 0; i < 4; i++) hiss({ f: rnd(1100, 1900), q: 2, d: 0.03, v: 0.04, a: 0.008, brown: true, at: 0.05 + i * rnd(0.035, 0.06) });
      hiss({ type: 'lowpass', f: 380, d: 0.1, v: 0.045, a: 0.015, at: 0.31, brown: true });
    },
    thunder: () => hiss({ type: 'lowpass', f: 120, d: 3.2, v: 0.5, a: 0.3, brown: true, pan: rnd(-0.5, 0.5) })
  };
  /* le feu : des claquements secs, de petites braises qui éclatent, parfois la sève qui siffle */
  function crackle(p, at, k) {
    const r = Math.random(), m = k || 1;
    if (r < 0.7) hiss({ f: rnd(1700, 3600), q: 1.3, d: rnd(0.008, 0.018), v: rnd(0.012, 0.03) * m, a: 0.001, at, pan: p });
    else if (r < 0.95) { hiss({ f: rnd(800, 1700), q: 1.6, d: rnd(0.02, 0.045), v: rnd(0.016, 0.04) * m, a: 0.002, at, pan: p }); tone({ f: rnd(120, 170), f2: 80, d: 0.05, v: 0.016 * m, a: 0.003, at, pan: p }); }
    else hiss({ f: rnd(4200, 6000), q: 2.5, d: rnd(0.25, 0.6), v: 0.005 * m, a: 0.08, at, pan: p });
  }
  /* oiseaux du jour : une mésange à deux notes, un rouge-gorge qui module, un pic au loin */
  function bird() {
    const p = rnd(-0.8, 0.8), k = Math.random();
    if (k < 0.45) { const f = rnd(3300, 4300), n = 2 + Math.floor(Math.random() * 4), g = rnd(0.13, 0.18); for (let i = 0; i < n; i++) tone({ f: i % 2 ? f * 0.8 : f, f2: (i % 2 ? f * 0.8 : f) * 0.97, d: rnd(0.07, 0.1), v: rnd(0.01, 0.02), a: 0.012, at: i * g, pan: p }); }
    else if (k < 0.9) { let at = 0, f = rnd(2100, 3000); const n = 3 + Math.floor(Math.random() * 5); for (let i = 0; i < n; i++) { const f2 = f * rnd(0.78, 1.32), d = rnd(0.06, 0.15); tone({ f, f2, d, v: rnd(0.009, 0.018), a: 0.015, at, pan: p }); at += d + rnd(0.02, 0.09); f = f2 * rnd(0.9, 1.15); } }
    else { const n = 7 + Math.floor(Math.random() * 6); for (let i = 0; i < n; i++) hiss({ f: 1100, q: 3, d: 0.022, v: 0.007 * (1 - i / n * 0.5), a: 0.002, at: i * 0.045, pan: p }); }
  }
  /* un grillon : trois battements d'ailes, répétés au même rythme tant qu'il chante */
  function chirp(c) { for (let i = 0; i < 3; i++) tone({ f: c.f, f2: c.f * 1.015, d: 0.026, v: c.v, a: 0.007, at: i * 0.037, pan: c.pan }); }
  /* la chouette : « hou… hou-hou, hou », loin, avec un peu de souffle */
  function owl() {
    const p = rnd(-0.7, 0.7), f = rnd(340, 400);
    [[0, 0.42], [0.82, 0.2], [1.06, 0.22], [1.62, 0.5]].forEach(q => { tone({ f, f2: f * 0.955, d: q[1], v: 0.02, a: 0.07, at: q[0], pan: p }); tone({ f: f * 2, f2: f * 1.91, d: q[1], v: 0.0016, a: 0.07, at: q[0], pan: p }); hiss({ f, q: 4, d: q[1], v: 0.005, a: 0.08, at: q[0], pan: p }); });
  }
  /* un fourré qui bouge : une poignée de froissements du même côté, parfois une brindille qui casse */
  function bush() {
    const p = (Math.random() < 0.5 ? -1 : 1) * rnd(0.35, 0.9), n = 5 + Math.floor(Math.random() * 9); let at = 0;
    for (let i = 0; i < n; i++) { hiss({ f: rnd(2300, 5200), q: 1.2, d: rnd(0.025, 0.07), v: rnd(0.01, 0.028), a: 0.008, at, pan: p }); at += rnd(0.04, 0.16); }
    if (Math.random() < 0.3) { hiss({ f: rnd(1400, 2200), q: 2, d: 0.03, v: 0.014, a: 0.002, at: at + 0.1, pan: p }); }
  }
  function drip() { const f = rnd(1300, 2500); tone({ f, f2: f * 0.6, d: 0.05, v: rnd(0.006, 0.014), pan: rnd(-0.8, 0.8) }); }
  /* ce qui vit autour du village : appelé quatre fois par seconde, chaque voix a son heure et ses silences */
  const freshLife = () => ({ crickets: [], owlAt: 0, bushAt: 0, birdAt: 0 });
  let LIFE = freshLife();
  function life() {
    const now = ac.currentTime, P = r => Math.random() < r * 0.25, day = 1 - st.night, calm = (1 - st.rain) * (1 - 0.7 * st.frost);
    for (let i = 0; i < 3; i++) if (P((1.1 + 2.1 * st.night) / 3)) { const at = rnd(0, 0.25); crackle(0, at); if (Math.random() < 0.18) for (let k = 1; k < 4; k++) crackle(0, at + k * rnd(0.02, 0.05)); }
    if (now > LIFE.birdAt && day > 0.5) { if (Math.random() < calm) bird(); LIFE.birdAt = now + rnd(3.5, 11) / Math.max(0.25, day); }
    /* les grillons entrent et sortent un par un */
    LIFE.crickets = LIFE.crickets.filter(c => now < c.until);
    if (st.night > 0.45 && LIFE.crickets.length < 3 && P(0.3 * st.night * calm * (1 - st.frost))) LIFE.crickets.push({ f: rnd(4100, 5100), pan: rnd(-0.85, 0.85), v: rnd(0.005, 0.01), per: rnd(0.52, 0.8), until: now + rnd(6, 19), next: now + rnd(0, 0.5) });
    for (const c of LIFE.crickets) if (now >= c.next) { chirp(c); c.next = now + c.per * rnd(0.97, 1.03); }
    if (st.night > 0.7 && now > LIFE.owlAt) { if (LIFE.owlAt && Math.random() < calm) owl(); LIFE.owlAt = now + rnd(28, 70); }
    if (now > LIFE.bushAt) { if (LIFE.bushAt && Math.random() < 0.8) bush(); LIFE.bushAt = now + rnd(12, 34); }
    for (let i = 0; i < 3; i++) if (P(2.6 * st.rain)) drip();
    if (st.rain > 0.5 && P(0.045)) S.thunder();
  }
  /* ---------- musique enregistrée : les morceaux fournis par l’auteur, deux par saison ----------
     Tonalités mesurées sur les fichiers : la majeur, mi♭ majeur, ré majeur, mi mineur (donc sol majeur pour les cinq notes du jeu). */
  const TRACKS = {
    automne: [{ src: 'music/automne-1.mp3', root: 220.00, g: 1 }, { src: 'music/automne-2.mp3', root: 311.13, g: 1 }],
    hiver: [{ src: 'music/hiver-1.mp3', root: 293.66, g: 0.97 }, { src: 'music/hiver-2.mp3', root: 392.00, g: 1.1 }]
  };
  const M = { want: 'automne', season: null, idx: { automne: Math.floor(Math.random() * 2), hiver: Math.floor(Math.random() * 2) }, el: null, tr: null, g: null, an: null, state: 'idle', nextAt: 0, lvl: 0, to: 0, tOut: 0, t0: 0, plain: false, dead: false, fails: 0, heard: false, ok: false };
  let measuring = false;
  function mSet() { const v = M.lvl * (M.tr ? M.tr.g : 1); if (M.g) M.g.gain.setTargetAtTime(0.25 * v, ac.currentTime, 0.12); else if (M.el) { try { M.el.volume = Math.max(0, Math.min(1, 0.5 * v * vol.music * (muted ? 0 : 1))); } catch (e) { /* volume figé sur certains téléphones */ } } }
  function mStop() { if (M.el) { M.el.onerror = M.el.onended = null; try { M.el.pause(); M.el.removeAttribute('src'); M.el.load(); } catch (e) { /* rien */ } } if (M.g) { try { M.g.disconnect(); } catch (e) { /* rien */ } } M.el = M.g = M.an = null; M.state = 'idle'; M.lvl = M.to = 0; }
  function mPlay() {
    const el = M.el; if (!el) return; let p;
    const ok = () => { if (M.el !== el) return; M.state = 'playing'; M.ok = true; M.t0 = ac.currentTime; root = M.tr.root; };
    try { p = el.play(); } catch (e) { M.state = 'blocked'; return; }
    if (p && p.then) p.then(ok, () => { if (M.el === el) M.state = 'blocked'; }); else ok();
  }
  function mStart() {
    const list = TRACKS[M.want], tr = list[M.idx[M.want] % list.length], el = new Audio(); M.season = M.want; M.tr = tr; M.el = el; M.state = 'loading'; M.lvl = 0; M.to = 1; M.heard = false; el.preload = 'auto';
    el.onerror = () => { mStop(); M.nextAt = ac.currentTime + 6; if (++M.fails >= 2 && !M.ok) M.dead = true; }; // pas de fichier : on revient aux phrases composées par le jeu
    el.onended = () => { M.idx[M.season]++; mStop(); M.nextAt = ac.currentTime + rnd(18, 34); };                 // un silence, puis l'autre morceau de la saison
    el.src = tr.src;
    if (!M.plain) { try { const src = ac.createMediaElementSource(el); M.g = ac.createGain(); M.g.gain.value = 0; M.an = ac.createAnalyser(); M.an.fftSize = 256; src.connect(M.an); src.connect(M.g); M.g.connect(bus.rec); } catch (e) { M.plain = true; M.g = M.an = null; } }
    mSet(); mPlay();
  }
  function mTick() {
    if (M.dead || typeof Audio === 'undefined') return; const now = ac.currentTime;
    if (M.state === 'idle') { if (now >= M.nextAt) mStart(); return; }
    if (M.state !== 'playing') return;
    if (M.want !== M.season && M.to) { M.to = 0; M.tOut = now; }                                    // la saison change : le morceau s'efface
    if (!M.to && M.lvl < 0.02 && now - M.tOut > 1) { mStop(); M.nextAt = now + 2.5; return; }
    /* si le navigateur rend le morceau muet dans le graphe audio, on le rejoue en direct */
    if (M.an && !M.heard) { const d = new Uint8Array(M.an.fftSize); M.an.getByteTimeDomainData(d); for (let i = 0; i < d.length; i++) if (d[i] !== 128) { M.heard = true; break; } if (!M.heard && now - M.t0 > 5 && M.el.currentTime > 4) { M.plain = true; mStop(); M.nextAt = now + 0.5; return; } }
    if (M.lvl !== M.to) { M.lvl = M.to > M.lvl ? Math.min(M.to, M.lvl + 0.035) : Math.max(M.to, M.lvl - 0.08); mSet(); }
  }
  /* petits événements d'ambiance, tirés au hasard quatre fois par seconde */
  function sched() {
    if (!ac || ac.state !== 'running' || measuring) return;
    mTick(); if (muted) return;
    /* musique : de courtes phrases sur cinq notes, espacées de longs silences */
    cur = 'music';
    if (M.dead && ac.currentTime > nextPhrase) {
      const n = 3 + Math.floor(Math.random() * 3), oct = st.night > 0.5 ? -1 : 0; let d = Math.floor(rnd(0, 6)), at = 0.1;
      for (let i = 0; i < n; i++) { pluck(d, 0.075, { oct, at, d: 1.9 }); if (Math.random() < 0.3) pluck(d + 2, 0.04, { oct, at: at + 0.02, d: 1.6 }); d += [-2, -1, 1, 1, 2][Math.floor(Math.random() * 5)]; d = Math.max(-2, Math.min(8, d)); at += [0.46, 0.46, 0.92, 0.69][Math.floor(Math.random() * 4)]; }
      nextPhrase = ac.currentTime + at + rnd(5, 11);
    }
    cur = 'life'; life();
  }

  /* ---------- interface publique ---------- */
  function unlock() {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      try { ac = new AC(); build(); applyAmbient(true); M.nextAt = ac.currentTime + 3.2; timer = setInterval(sched, 250); } catch (e) { ac = null; return; }
    }
    if (ac.state === 'suspended' && !document.hidden) ac.resume().catch(() => { });
    if (M.state === 'blocked') mPlay();
  }
  function play(name, pan, i) { if (!ac || muted || ac.state !== 'running' || !S[name]) return; cur = FAM[name] || 'village'; try { S[name](pan || 0, i); } catch (e) { /* le son ne doit jamais bloquer le jeu */ } }
  /* pas et coups d'outils : limités pour ne jamais devenir un vacarme */
  function step(pan, wood) { if (!ac || muted || ac.state !== 'running') return; const t = ac.currentTime; if (t - lastStep < 0.11) return; lastStep = t; cur = 'village'; hiss({ type: 'lowpass', f: wood ? 900 : 420, d: 0.06, v: wood ? 0.035 : 0.028, pan }); if (wood) tone({ f: 190, f2: 140, d: 0.06, v: 0.03, pan }); }
  function hit(kind, pan) { if (!ac || muted || ac.state !== 'running') return; const t = ac.currentTime; if (t - lastHit < 0.13) return; lastHit = t; cur = 'village'; S[kind](pan); }
  function ambient(s) {
    Object.assign(st, s); if (!ac) return;
    const t = ac.currentTime; if (t - lastAmb < 0.2) return; lastAmb = t; applyAmbient(false);
  }
  function setVol(k, v) { vol[k] = Math.max(0, Math.min(1, v)); if (bus && bus[k]) bus[k].gain.setTargetAtTime(vol[k], ac.currentTime, 0.05); if (k === 'music' && bus && bus.rec) { bus.rec.gain.setTargetAtTime(vol[k], ac.currentTime, 0.05); mSet(); } }
  function setMute(m) { muted = !!m; if (master) master.gain.setTargetAtTime(muted ? 0 : 2, ac.currentTime, 0.08); if (ac) mSet(); }
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { if (!ac) return; if (document.hidden) { ac.suspend(); if (M.el && M.state === 'playing') M.el.pause(); } else { ac.resume().catch(() => { }); if (M.el && M.state === 'playing') M.el.play().catch(() => { M.state = 'blocked'; }); } });

  /* contrôle hors ligne (tests) : rend une scène sonore et mesure son niveau */
  async function measure(sec, scene, names) {
    measuring = true; const live = { ac, master, bus, noiseW, noiseB, L, st }, OC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    ac = new OC(2, 44100 * sec, 44100); st = Object.assign({ night: 0, rain: 0, flood: 0, frost: 0, play: 1 }, scene); build(); applyAmbient(true);
    if (scene.music) { cur = 'music'; for (let k = 0; k < 4; k++) pluck(k * 2, 0.075, { at: 0.3 + k * 0.46, d: 1.9 }); }
    if (scene.ambientOff || scene.only) for (const k in L) if (k !== scene.only) L[k].g.gain.cancelScheduledValues(0), L[k].g.gain.setValueAtTime(0, 0);
    if (scene.life) { const keep = LIFE, o = ac; LIFE = freshLife(); cur = 'life'; for (let T = 0; T < sec - 0.5; T += 0.25) { ac = new Proxy(o, { get: (t, k) => k === 'currentTime' ? T : (typeof t[k] === 'function' ? t[k].bind(t) : t[k]) }); try { life(); } finally { ac = o; } } LIFE = keep; }
    (names || []).forEach((n, i) => { const o = ac; ac = new Proxy(o, { get: (t, k) => k === 'currentTime' ? 0.3 + i * (sec - 0.6) / names.length : (typeof t[k] === 'function' ? t[k].bind(t) : t[k]) }); cur = FAM[n] || 'village'; try { S[n](0, i); } finally { ac = o; } });
    const buf = await ac.startRendering(), d = buf.getChannelData(0); let pk = 0, sq = 0; for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > pk) pk = a; sq += d[i] * d[i]; }
    ({ ac, master, bus, noiseW, noiseB, L, st } = live); measuring = false;
    return { peak: +pk.toFixed(3), rms: +Math.sqrt(sq / d.length).toFixed(4), data: scene.data ? Array.from(d.filter((_, i) => i % 2 === 0), x => Math.round(x * 32767)) : undefined };
  }
  const season = s => { if (TRACKS[s]) M.want = s; }, music = () => ({ state: M.state, season: M.season, want: M.want, src: M.tr && M.tr.src, t: M.el ? M.el.currentTime : 0, lvl: +M.lvl.toFixed(2), plain: M.plain, dead: M.dead, heard: M.heard, root });
  return { unlock, play, step, hit, ambient, season, music, setMute, setVol, vol, measure, get muted() { return muted; }, get ready() { return !!ac && ac.state === 'running'; }, names: () => Object.keys(S) };
})();
