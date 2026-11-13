'use strict';
/* ===== Hameau — déroulement d'une partie (horloge, événements, vue, sons) ===== */
const GAME = (() => {
  const T = SIM.T;
  const G = {
    map: SIM.getMap('pont'), st: null, plan: null, t: 6, speed: 1, paused: false, hold: false, phase: 'menu', cards: [], live: null, evi: 0,
    on: {}, sel: null, msg: '', msgN: 0, mind: null, th: [], bub: [], gap: 0, heard: {}, tones: [], quiet: {}, reveal: {}, tapUntil: {}, pop: {}, last: {}, arrive: null, off: {}, stepN: {}, eatN: 0, bedN: 0
  };
  const emit = (n, a) => { if (G.on[n]) G.on[n](a); };
  const alive = () => G.st.villagers.filter(v => v.alive);
  const say = text => { G.msg = text; G.msgN++; };

  function liveFrom(st) {
    const l = { joy: st.joy || 0, jobs: {}, hunger: {}, roofless: {}, cut: new Map(), prog: 1 }; for (const r of SIM.RES) l[r] = st[r] || 0;
    st.villagers.forEach(v => { l.jobs[v.id] = v.job; l.hunger[v.id] = v.hunger; l.roofless[v.id] = v.roofless; });
    st.cut.forEach(id => l.cut.set(id, -1e9));
    return l;
  }
  function scene(st) { G.map = SIM.getMap(st.map); R.setMap(G.map); R.setRoads(st); }
  function reset() { G.reveal = {}; G.tapUntil = {}; G.pop = {}; G.sel = null; G.off = {}; G.stepN = {}; G.msg = ''; }
  /* chaque partie tire sa propre graine : le village ne se bâtit jamais deux fois pareil */
  const seed = () => window.SEED != null ? window.SEED : (Math.random() * 4294967296) >>> 0;
  function start(id, sd) { G.st = SIM.newGame(SIM.CHALLENGES[id], window.SEED != null ? window.SEED : sd != null ? sd : seed()); G.mind = MIND.create(G.st); G.dead = []; G.snap = null; reset(); scene(G.st); morning(); }
  /* survie : la partie se garde. On note l'état au passage d'un jour à l'autre (avant le matin), puis ce que le joueur décide ce jour-là.
     Reprendre, c'est rejouer ce matin à l'identique : si la journée était lancée, elle repart avec le même choix. On ne rejoue donc jamais un jour autrement. */
  const keeps = () => !!(G.st && SIM.CHALLENGES[G.st.ch].survival);
  function keep() { if (G.snap && keeps()) { G.snap.pins = G.st.pins || null; emit('save', G.snap); } }
  function resume(s) {
    G.st = JSON.parse(s.st); G.mind = JSON.parse(s.mind); G.dead = s.dead || []; G.plan = null; G.snap = null; reset(); scene(G.st); morning();
    if (s.pins) { G.st.pins = s.pins; G.snap.pins = s.pins; }
    if (s.went) choose(s.pick || null); else keep();
  }
  /* écran du titre : le soir on s'assoit au feu ; le jour chacun va et vient dans la clairière, à son pas */
  function stroller(v0, hour, dt, F) {
    const sq = G.map.seats[v0.id % G.map.seats.length], seat = { x: sq.x, y: sq.y }, night = hour > 18.4 || hour < 6.8;
    const w = G.walk[v0.id] || (G.walk[v0.id] = { x: seat.x, y: seat.y, path: null, i: 0, wait: Math.random() * 6, dx: F.x - seat.x, dy: F.y - seat.y, d: 0, home: true });
    if (!w.path) {
      w.wait -= dt;
      if (night ? !w.home : w.wait <= 0) {
        let to = seat; if (!night) { const a = Math.random() * 6.28, r = 50 + Math.random() * 120; to = { x: F.x + Math.cos(a) * r * 1.2, y: F.y + Math.sin(a) * r }; if (!G.map.clear(to.x, to.y)) to = null; }
        const p = to && SIM.findPath(G.nav || (G.nav = SIM.buildNav(G.st)), { x: w.x, y: w.y }, to);
        if (p && p.length > 1) { w.path = p; w.i = 1; w.home = night; } else w.wait = 1.5;
      }
    }
    if (w.path) {
      let step = 21 * dt;
      while (step > 0 && w.path) { const t = w.path[w.i], dx = t.x - w.x, dy = t.y - w.y, L = Math.hypot(dx, dy); if (L <= step) { w.x = t.x; w.y = t.y; step -= L; w.d += L; if (++w.i >= w.path.length) { w.path = null; w.wait = 2 + Math.random() * 7; } } else { w.x += dx / L * step; w.y += dy / L * step; w.d += step; w.dx = dx; w.dy = dy; step = 0; } }
      if (w.path) return { x: w.x, y: w.y, dx: w.dx, dy: w.dy, moving: true, anim: 'walk', dist: w.d, label: '' };
    }
    if (w.home) return { x: w.x, y: w.y, dx: F.x - seat.x, dy: F.y - seat.y, anim: hour > 21.5 || hour < 6.5 ? 'sit' : night ? 'eat' : 'idle', label: '' };
    return { x: w.x, y: w.y, dx: w.dx, dy: w.dy, anim: 'idle', label: '' };
  }
  function attract(id) { G.walk = {}; G.nav = null; G.st = SIM.newGame(SIM.CHALLENGES[id || 'c2'], seed()); G.plan = null; G.live = liveFrom(G.st); G.phase = 'menu'; G.mind = null; G.th = []; G.bub = []; reset(); scene(G.st); }
  function morning() {
    const fresh = G.st.begun !== G.st.day; if (fresh && keeps()) G.snap = { v: 1, st: JSON.stringify(G.st), mind: JSON.stringify(G.mind), dead: G.dead || [] };
    G.st = SIM.beginDay(G.st);
    G.arrive = fresh && G.st.arrived.length ? { ids: G.st.arrived.slice(), t0: null } : null;
    if (G.arrive) SFX.play('arrive');
    /* pensées du matin : toutes vont au carnet, les bulles en donnent quelques-unes à entendre */
    MIND.join(G.mind, G.st); G.th = MIND.morning(G.mind, G.st); G.th.forEach(t => MIND.note(G.mind, t)); G.bub = []; G.gap = fresh ? 2.6 : 1.2; G.heard = {}; G.tones = []; G.quiet = {};
    G.phase = 'morning'; G.t = T.BUILD; G.plan = null; G.evi = 0; G.live = liveFrom(G.st); G.cards = SIM.draw(G.st); G.msg = ''; if (G.snap && keeps()) { G.snap.day = G.st.day; G.snap.n = alive().length; emit('save', G.snap); } emit('morning');
  }
  function choose(type) {
    if (G.snap && keeps()) { G.snap.went = true; G.snap.pick = type || null; G.snap.pins = G.st.pins || null; emit('save', G.snap); }
    G.arrive = null; G.plan = SIM.planDay(G.st, type, mourners()); G.th = MIND.day(G.mind, G.plan); G.bub = []; G.gap = 1.4; G.live = liveFrom(G.st); G.evi = 0; G.t = T.BUILD; G.phase = 'day'; G.paused = false; G.eatN = 0; G.bedN = 0;
    G.msg = ''; G.t0 = null; emit('day');
  }
  function retryDay() { G.st = G.plan ? G.plan.start : G.st; R.setRoads(G.st); G.pop = {}; morning(); }
  /* en deuil : les proches (affinité forte) et l'être aimé de ceux qui sont morts la veille */
  function mourners() { const d = G.dead || []; if (!d.length || !G.mind) return []; return G.st.villagers.filter(v => v.alive && d.some(x => MIND.aff(G.mind, v.id, x) >= 2 || G.mind.love[v.id] === x)).map(v => v.id); }
  function next() { const p = G.plan; G.dead = p.sum.deaths.map(x => x.id); G.st = p.end; if (p.result) { G.phase = 'end'; emit('end', p.result); } else morning(); }
  const rate = t => t < T.NIGHT ? 1 / 3.5 : (t < 29.2 ? 1.5 : 0.55);
  const vpos = id => { const s = SIM.sample(G.plan.tracks[id], G.t); return s ? { x: s.x, y: s.y, inside: s.inside } : null; };

  function fire(e, time) {
    const L = G.live, V = G.st.villagers, SK = G.map.stock;
    for (const k of SIM.RES) if (e[k]) L[k] += e[k];
    if (e.msg && e.type !== 'built') say(e.msg);
    switch (e.type) {
      case 'site': { let i = 0; for (const k of SIM.RES) if (e[k]) { R.float({ x: SK.x + 16 + i * 22, y: SK.y - i * 2, icon: k, text: String(e[k]).replace('-', '−') }); i++; } R.setRoads(G.plan.end); SFX.play('site', R.pan(G.plan.nb.x)); break; }
      case 'town': { R.setRoads(G.plan.end); say('Dix habitants : le village devient un bourg, le feu a sa place de pierre.'); break; } // le clairon a sonné dès le matin, avec l'annonce des deux chantiers
      case 'fire': { R.burst(e.x, e.y, 'dust'); R.burst(e.x - 8, e.y + 4, 'dust'); R.burst(e.x + 8, e.y - 4, 'dust'); SFX.play('flare', R.pan(e.x)); G.msg = 'Le feu a pris.'; break; }
      case 'built': { const b = (G.plan.nbs || []).find(x => x.id === e.bid) || G.plan.nb; G.pop[b.id] = time; R.burst(b.x + b.w / 2, b.y + b.h - 4, 'dust'); R.burst(b.x + 6, b.y + b.h, 'dust'); R.burst(b.x + b.w - 6, b.y + b.h, 'dust'); SFX.play('built', R.pan(b.x + b.w / 2)); break; }
      case 'job': { L.jobs[e.vid] = e.job; const p = e.job ? vpos(e.vid) : null; if (p) { R.burst(p.x, p.y - 16, 'leaf', ART.OUT[e.job].main); SFX.play('job', R.pan(p.x)); } break; }
      case 'res': { const k = SIM.RES.find(r => e[r]); if (!k) break; R.float({ x: e.x, y: e.y, icon: k, text: (e[k] > 0 ? '+' : '−') + Math.abs(e[k]) }); if (e[k] > 0) SFX.play(k, R.pan(e.x)); break; }
      case 'cut': { L.cut.set(e.tree, time); const t = G.map.trees[e.tree]; R.burst(t.x, t.y, 'leaf', ART.TREEPAL[t.pal][0]); R.burst(t.x, t.y, 'leaf', ART.TREEPAL[t.pal][1]); SFX.play('fall', R.pan(t.x)); break; }
      case 'joy': { L.joy = Math.max(0, L.joy + e.n); R.float({ x: e.x, y: e.y, icon: 'joy', text: (e.n > 0 ? '+' : '−') + Math.abs(e.n) }); if (e.n > 0) SFX.play('home', R.pan(e.x)); break; }
      case 'home': { const b = G.plan.end.buildings.find(x => x.id === e.bid); R.float({ x: b.x + b.w / 2, y: b.y + 4, text: 'Chez ' + V[e.vid].name }); R.burst(b.x + b.w / 2, b.y + b.h, 'dust'); SFX.play('home', R.pan(b.x)); break; }
      case 'eat': { L.hunger[e.vid] = 0; const p = vpos(e.vid); if (p) { R.float({ x: p.x, y: p.y - 30, icon: 'food', text: '−1' }); SFX.play('eat', R.pan(p.x), G.eatN++); } break; }
      case 'noeat': { L.hunger[e.vid]++; const p = vpos(e.vid); if (p) R.float({ x: p.x, y: p.y - 30, text: 'Rien à manger', bad: true }); say(V[e.vid].name + ' n’a rien à manger.'); SFX.play('lack'); break; }
      case 'bed': { L.roofless[e.vid] = 0; const b = G.plan.end.buildings.find(x => x.id === e.bid); R.float({ x: b.x + b.w / 2, y: b.y + 6, icon: 'zz', text: V[e.vid].name }); SFX.play('bed', R.pan(b.x), G.bedN++); break; }
      case 'nobed': { L.roofless[e.vid]++; const p = vpos(e.vid); if (p) R.float({ x: p.x, y: p.y - 30, text: 'Pas de toit', bad: true }); say(V[e.vid].name + ' dort dehors.'); SFX.play('lack'); break; }
    }
    emit('event', e);
  }
  /* passer la phase en cours : du chantier au travail, du travail au repas… jusqu'au bilan. Ce qui devait arriver arrive, sans le spectacle. */
  function skip() {
    if (G.phase !== 'day' || G.hold) return;
    const next = [T.WORK, T.MEAL, T.BED, T.NIGHT, T.END].find(x => x > G.t + 0.02), ev = G.plan.events, f0 = R.float, b0 = R.burst, p0 = SFX.play;
    R.float = R.burst = () => {}; SFX.play = () => {};
    try { while (G.evi < ev.length && ev[G.evi].t <= next) fire(ev[G.evi++], G.now || 0); } finally { R.float = f0; R.burst = b0; SFX.play = p0; }
    G.t = next; G.t0 = next; G.bub = []; G.paused = false; SFX.play('page');
  }
  function tick(dt, time) {
    G.now = time;
    if (G.phase !== 'day' || G.paused || G.hold) return;
    let left = dt * G.speed;
    while (left > 0 && G.t < T.END) { const st = Math.min(left, 0.05); G.t += st * rate(G.t); left -= st; }
    const ev = G.plan.events, t0 = G.t0 == null ? G.t : G.t0; G.t0 = G.t;
    if (t0 < T.MEAL && G.t >= T.MEAL) say('Le soir tombe. On se rassemble.'); else if (t0 < T.NIGHT && G.t >= T.NIGHT) say('La nuit.');
    while (G.evi < ev.length && ev[G.evi].t <= G.t) fire(ev[G.evi++], time);
    if (G.t >= T.END) { G.t = T.END; while (G.evi < ev.length) fire(ev[G.evi++], time); G.phase = 'bilan'; G.th.forEach(t => MIND.note(G.mind, t)); MIND.endDay(G.mind, G.plan); G.bub = []; if (G.plan.sum.deaths.length) SFX.play('dead'); emit('bilan', G.plan); }
  }
  /* ---------- la parole : deux bulles au plus, cinq secondes chacune, le temps réel ne dépend pas de la vitesse ---------- */
  const BUB = 5, POS = { espoir: 1, content: 1, amour: 1 };
  function speak(th, text, vid, delay) {
    G.bub.push({ id: th.id + (vid === th.vid ? 0 : 0.5), vid, text, subj: vid === th.vid ? th.subj : (th.tone === 'amour' ? 'heart' : 'ppl'), tone: vid === th.vid ? th.tone : (th.tone === 'amour' ? 'amour' : 'content'), age: -(delay || 0) });
  }
  function mindTick(dt) {
    if (!G.mind || G.hold || (G.phase !== 'morning' && G.phase !== 'day') || (G.phase === 'day' && G.paused)) return;
    for (const b of G.bub) { const a0 = b.age; b.age += dt; if (a0 < 0 && b.age >= 0 && b.tone === 'amour') { const p = anchor(b.vid); if (p) R.float({ x: p.x, y: p.y + 14, icon: 'heart', text: '' }); } }
    G.bub = G.bub.filter(b => b.age < BUB);
    if (G.phase === 'day') for (const t of G.th) if (!t.noted && t.t0 <= G.t) MIND.note(G.mind, t);
    G.gap -= dt;
    if (G.gap > 0 || G.bub.length || (G.phase === 'day' && G.t >= T.NIGHT)) return;
    const busy = {}; let best = null, bs = -1e9;
    const lastNeg = G.tones.length >= 2 && !POS[G.tones[G.tones.length - 1]] && !POS[G.tones[G.tones.length - 2]];
    for (const t of G.th) {
      if (t.said || busy[t.vid] || (G.phase === 'day' && (t.t0 > G.t || t.t1 < G.t)) || !anchor(t.vid)) continue;
      let sc = t.force * 3 + (G.heard[t.subj] ? 0 : 2) + Math.min(2, (G.quiet[t.vid] == null ? 2 : G.quiet[t.vid]) * 0.7) + (lastNeg && POS[t.tone] ? 3 : 0);
      if (MIND.charOf(G.st.villagers[t.vid]) === 'taiseux' && t.force < 2) sc -= 2;
      if (t.reply) sc += 0.5;
      if (sc > bs) { bs = sc; best = t; }
    }
    if (!best) { G.gap = 0.5; return; }
    best.said = true; G.heard[best.subj] = 1; G.tones.push(best.tone); for (const v of G.st.villagers) G.quiet[v.id] = (G.quiet[v.id] == null ? 2 : G.quiet[v.id]) + 1; G.quiet[best.vid] = 0;
    speak(best, best.text, best.vid); SFX.play('voice', R.pan(anchor(best.vid).x), best.vid);
    if (best.reply && anchor(best.reply.vid)) { speak(best, best.reply.text, best.reply.vid, 1.5); MIND.noteReply(G.mind, best); G.quiet[best.reply.vid] = 0; G.gap = BUB + 3; }
    else G.gap = BUB + 1.5;
  }
  /* où accrocher la bulle : au-dessus de la tête, ou du toit si l'on est à l'intérieur */
  function anchor(vid) {
    const s = G.last[vid]; if (!s) return null;
    if (s.inside == null) return { x: s.x, y: s.y - 47 };
    const b = (G.plan ? G.plan.end : G.st).buildings.find(x => x.id === s.inside); return b ? { x: b.x + b.w / 2, y: b.y - 6 } : null;
  }
  /* météo : l'orage dure la journée et la crue retombe dans la nuit ; le gel, une fois là, reste */
  function weather() {
    if (G.phase === 'menu' || !G.st) return { rain: 0, flood: 0, frost: 0, fog: 0 };
    const w = SIM.weather(G.st), t = G.t, c = v => Math.max(0, Math.min(1, v)), storm = w.storm && G.phase !== 'end', dike = G.st.buildings.some(b => SIM.BT[b.type].anti === 'storm' && !b.gone);
    return { rain: !storm ? 0 : t < 8 ? 0.55 + 0.45 * c((t - 6.3) / 1.7) : c((19.6 - t) / 2.4), flood: !storm || dike ? 0 : t < 8 ? 0.6 + 0.4 * c((t - 6.3) / 1.7) : c((27 - t) / 7), frost: w.frost ? 1 : 0, fog: w.fog && G.phase !== 'end' ? c((20.5 - t) / 3.5) : 0 };
  }
  function phaseName(t) { return t < T.WORK ? (G.plan && G.plan.nb ? 'Chantier' : 'Matin') : t < T.MEAL ? 'Travail' : t < T.BED ? 'Repas' : t < T.NIGHT ? 'Coucher' : 'Nuit'; }

  /* ---------- vue pour le rendu ---------- */
  const HIT = { build: [2.4, 0.37, 0.7, 'hammer'], chop: [1.5, 0.31, 0.75, 'chop'], mine: [1.5, 0.31, 0.75, 'mine'] };
  function view(time, dt, hourOverride) {
    const st = G.plan ? G.plan.end : G.st, L = G.live, t = G.t, nb = G.plan && G.plan.nb, map = G.map, F = map.fire;
    const hour = hourOverride != null ? hourOverride : t;
    const pawns = [], occ = {}, chopping = new Set();
    const live = G.phase === 'day' && !G.paused && !G.hold, steps = !G.hold && (live || G.phase === 'morning');
    G.last = {};
    for (const v0 of G.st.villagers) {
      if (!v0.alive) continue;
      let s;
      if (G.phase === 'menu') s = stroller(v0, hour, dt, F);
      else if (!G.plan) {
        s = { x: v0.pos.x, y: v0.pos.y, dx: 0, dy: 1, anim: 'idle', label: '' };
        const ar = G.arrive, ai = ar ? ar.ids.indexOf(v0.id) : -1;
        if (ai >= 0) { /* les nouveaux venus arrivent par le pont */
          if (ar.t0 == null) ar.t0 = time;
          const a = { x: map.arrive.from.x + map.perp.x * (ai % 2 ? 6 : -6), y: map.arrive.from.y + map.perp.y * (ai % 2 ? 6 : -6) }, len = Math.hypot(v0.pos.x - a.x, v0.pos.y - a.y), q = Math.max(0, Math.min(1, (time - ar.t0 - 0.4 - ai * 0.55) * 46 / len));
          if (q < 1) s = { x: a.x + (v0.pos.x - a.x) * q, y: a.y + (v0.pos.y - a.y) * q, dx: v0.pos.x - a.x, dy: v0.pos.y - a.y, moving: true, anim: 'walk', dist: q * len, rem: (1 - q) * len, label: 'Arrive au village' };
        }
      }
      else s = SIM.sample(G.plan.tracks[v0.id], t);
      if (!s) continue;
      G.last[v0.id] = s;
      if (s.tree != null && s.anim === 'chop') chopping.add(s.tree);
      const hu = L.hunger[v0.id], rf = L.roofless[v0.id], outfit = L.jobs[v0.id] || 'civil';
      if (s.inside != null) { (occ[s.inside] = occ[s.inside] || []).push({ bed: s.bed, v: v0, hunger: hu, outfit }); continue; }
      /* chacun marche un peu de côté, pour ne pas se suivre à la queue leu leu */
      const o = G.off[v0.id] || (G.off[v0.id] = { x: 0, y: 0 }); let tx = 0, ty = 0;
      if (s.moving) { const n = Math.hypot(s.dx, s.dy) || 1, k = ((v0.id % 3) - 1) * 3.2 * Math.min(1, (s.dist || 0) / 12, (s.rem == null ? 12 : s.rem) / 12); tx = -s.dy / n * k; ty = s.dx / n * k; }
      const q = Math.min(1, dt * 7); o.x += (tx - o.x) * q; o.y += (ty - o.y) * q;
      const px = s.x + o.x, py = s.y + o.y;
      if (steps && s.moving) { const n = Math.floor((s.dist || 0) * 0.2 / Math.PI); if (G.stepN[v0.id] !== n) { G.stepN[v0.id] = n; SFX.step(R.pan(px), map.rdist(px, py) < 22); } }
      else if (live && s.anim === 'play') { if (Math.random() < dt * 0.13) SFX.play('note', R.pan(px), Math.floor(Math.random() * 6)); } // quelques notes éparses, pas un récital
      else if (live && HIT[s.anim]) { const h = HIT[s.anim], q1 = (time * h[0] + v0.id * h[1]) % 1, q0 = ((time - dt) * h[0] + v0.id * h[1]) % 1; if (q0 < h[2] && q1 >= h[2]) SFX.hit(h[3], R.pan(px)); }
      pawns.push({ v: v0, outfit, x: px, y: py, dx: s.dx, dy: s.dy, moving: s.moving, anim: s.anim, carry: s.carry, dist: s.dist || 0, hunger: hu, roofless: rf, sel: G.sel === v0.id });
    }
    const nightShow = hour >= 20.9 && G.phase !== 'menu';
    const buildings = st.buildings.map(b => {
      const o = occ[b.id] || [], isNew = !!(G.plan && (G.plan.nbs || []).some(x => x.id === b.id)), asleep = o.some(x => x.bed != null);
      const progress = isNew ? Math.max(0, Math.min(1, (t - 6.5) / (8.85 - 6.5))) : 1;
      const want = !SIM.BT[b.type].open && ((G.tapUntil[b.id] || 0) > time || (nightShow && asleep)) ? 1 : 0;
      const cur = G.reveal[b.id] || 0; G.reveal[b.id] = cur + (want - cur) * Math.min(1, dt * 5);
      return { id: b.id, type: b.type, x: b.x, y: b.y, w: b.w, h: b.h, progress: G.phase === 'morning' && isNew ? 1 : progress, reveal: G.reveal[b.id], occ: o, lit: asleep || !!ART.BDEF[b.type].lamp || (G.phase === 'menu' && b.type === 'cabane'), smoke: (o.some(x => x.bed == null) || !!SIM.BT[b.type].fume) && !!ART.BDEF[b.type].chimney && !isNew, popT: G.pop[b.id] };
    });
    const wz = weather();
    SFX.ambient({ night: R.night(hour), rain: wz.rain, flood: wz.flood, frost: wz.frost });
    SFX.season(wz.frost ? 'hiver' : 'automne', hour >= 19.5 || hour < 6 ? 'nuit' : G.phase === 'morning' || hour < 11 ? 'matin' : 'jour'); // dès que le gel est là, la musique d'hiver prend le relais ; sinon le matin et la nuit ont leurs morceaux
    return { v: { buildings, pawns, cut: L.cut, chopping, wood: L.wood, food: L.food, stone: L.stone, graves: st.graves, weather: wz }, hour };
  }
  /* toucher la scène : un villageois, un bâtiment… ou le feu, l'eau, un arbre, juste pour le plaisir */
  function tap(w, time) {
    if (G.phase === 'menu') return null;
    const map = G.map, F = map.fire, pan = R.pan(w.x);
    let best = null, bd = 21;
    for (const id in G.last) { const s = G.last[id]; if (s.inside != null) continue; const d = Math.hypot(s.x - w.x, (s.y - 18) - w.y); if (d < bd) { bd = d; best = +id; } }
    if (best != null) { SFX.play('voice', pan, best); return { v: G.st.villagers[best] }; }
    const st = G.plan ? G.plan.end : G.st;
    for (const b of st.buildings) if (w.x >= b.x - 2 && w.x <= b.x + b.w + 2 && w.y >= b.y - 2 && w.y <= b.y + b.h + 4) { G.tapUntil[b.id] = (G.tapUntil[b.id] || 0) > time ? 0 : time + 6; SFX.play('knock', pan); return { b }; }
    if (Math.hypot(w.x - F.x, w.y - F.y + 4) < 18) { R.spark(16); SFX.play('flare', pan); return { fx: 1 }; }
    if (map.rdist(w.x, w.y) < 15 && Math.hypot(w.x - map.bridge.x, w.y - map.bridge.y) > 26) { R.ripple(w.x, w.y); SFX.play('splash', pan); return { fx: 1 }; }
    for (const t of map.trees) if (!G.live.cut.has(t.id) && Math.hypot(t.x - w.x, t.y - w.y) < t.r) { t.rus = time + 0.7; if (t.kind !== 'pine') R.burst(t.x, t.y, 'leaf', ART.TREEPAL[t.pal][time * 10 % 2 | 0]); SFX.play('rustle', pan); return { fx: 1 }; }
    return null;
  }
  Object.assign(G, { start, attract, morning, choose, retryDay, next, tick, view, tap, phaseName, alive, rate, weather, say, mindTick, anchor });
  G.skip = skip; G.mourners = mourners; G.resume = resume; G.keep = keep;
  return G;
})();
