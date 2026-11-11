/* node test/surv.js <parties> <politique> : joue des parties de survie entières et contrôle chaque journée (ressources, pistes, vitesses) */
global.SIM = require('../src/sim.js'); const MIND = require('../src/mind.js');
if (process.env.VAR) require(process.env.VAR)(SIM);
const why = {}, first = []; let peak = 0, pinsSet = 0, print = 7, big = 0;
const CAP = +(process.env.CAP || 150), N = +(process.argv[2] || 20), POL = process.argv[3] || 'sage'; let bad = 0, days = 0, vides = 0; const res = [], kinds = {}, evc = {};
const fail = (k, ...a) => { bad++; kinds[k] = (kinds[k] || 0) + 1; if (kinds[k] < 4) console.log('ANOMALIE', k, ...a); };
for (let g = 0; g < N; g++) {
  const seed = 1000 + g * 7919; let firstSeen = 0, st = SIM.newGame(SIM.CHALLENGES.survie, seed), mind = MIND.create(st), dead = [], r = SIM.rngOf(seed + 1);
  for (let d = 1; d < CAP; d++) {
    if (process.env.ROUND) { const snap = JSON.stringify({ st: JSON.stringify(st), mind: JSON.stringify(mind), dead }); big = Math.max(big, snap.length); const o = JSON.parse(snap); st = JSON.parse(o.st); mind = JSON.parse(o.mind); dead = o.dead; } // comme une partie quittée puis reprise chaque matin
    st = SIM.beginDay(st); MIND.join(mind, st); MIND.morning(mind, st);
    const cards = SIM.draw(st), can = cards.filter(t => !SIM.blocked(st, t));
    if (cards.length < 1) vides++;
    const live = st.villagers.filter(v => v.alive), beds = SIM.capacity(st);
    let pk = null;
    if (POL === 'hasard') pk = can.length && r() < 0.8 ? can[Math.floor(r() * can.length)] : null;
    else if (can.length) { const sc = t => { const b = SIM.BT[t]; return (b.beds && beds < live.length ? 9 : 0) + (b.out === 'food' ? 6 + b.per : 0) + (b.give && b.give.food ? 5 : 0) + (b.out === 'wood' ? (st.wood < 6 ? 6 : 2) : 0) + (b.out === 'stone' ? 3 : 0) + (b.anti ? 4 : 0) + (b.call ? 8 : 0) + (b.beds ? 1 : 0) + (b.ration ? 3 : 0) + (b.swap ? 2 : 0); }; pk = can.slice().sort((a, b) => sc(b) - sc(a))[0]; }
    const mourn = live.filter(v => dead.some(x => MIND.aff(mind, v.id, x) >= 2 || mind.love[v.id] === x)).map(v => v.id);
    /* les vœux du joueur : au hasard, ou menés (assez à manger, puis le bois, la pierre, le bois mort) */
    const posts = st.buildings.filter(b => SIM.BT[b.type].posts && !b.gone);
    if (POL === 'hasard' && r() < 0.5) { st.pins = st.pins || {}; for (const v of live) { const x = r(); if (x < 0.25) delete st.pins[v.id]; else if (x < 0.4) st.pins[v.id] = -1; else if (x < 0.8 && posts.length) st.pins[v.id] = posts[Math.floor(r() * posts.length)].id; } }
    if (POL === 'meneur') {
      const J0 = SIM.survJobs(st, mourn), hands = live.filter(v => !J0.off[v.id]), open = posts.filter(b => !J0.halt[b.id]), pins = {}, used = {}; let fi = 0, wi = 0, k = 0;
      const give = (list, enough) => { for (const b of list) for (let q = used[b.id] || 0; q < SIM.BT[b.type].posts && k < hands.length && !enough(); q++) { pins[hands[k++].id] = b.id; used[b.id] = q + 1; if (SIM.BT[b.type].out === 'food') fi += SIM.BT[b.type].per; if (SIM.BT[b.type].out === 'wood') wi += SIM.BT[b.type].per; } };
      const of = o => open.filter(b => SIM.BT[b.type].out === o).sort((a, c) => SIM.BT[c.type].per - SIM.BT[a.type].per), wantF = live.length + (st.food < live.length * 3 ? 2 : 0);
      give(of('food'), () => fi >= wantF); give(of('wood'), () => wi >= 4 || st.wood >= 12); give(of('stone'), () => st.stone >= 6); give(of('food'), () => false); give(of('wood'), () => false);
      while (k < hands.length) pins[hands[k++].id] = -1; st.pins = pins;
    }
    const J = SIM.survJobs(st, mourn);
    let p; try { p = SIM.planDay(st, pk, mourn); } catch (e) { fail('exception', seed, d, e.message); break; }
    days++; for (const e of SIM.eventsOn(st)) evc[e.type] = (evc[e.type] || 0) + 1;
    const rs = { food: st.food, wood: st.wood, stone: st.stone }; for (const e of p.events) for (const k of SIM.RES) { rs[k] += e[k] || 0; if (rs[k] < 0) fail('ressource négative', k, seed, d, e.type); }
    for (const id in p.tracks) { const s = p.tracks[id].s; if (Math.abs(s[s.length - 1].t1 - SIM.T.END) > 1e-6) fail('fin de piste', seed, d); for (const q of s) if (q.k === 'walk' && q.L / (q.t1 - q.t0) / SIM.SPEED > 1.605) fail('trop rapide', (q.L / (q.t1 - q.t0) / SIM.SPEED).toFixed(2), q.label, seed, d); }
    if (pk && !p.nb) fail('placement impossible', pk, seed, d);
    { /* les vœux sont tenus, et l'aperçu du matin dit vrai (hors bras pris par le bâtiment du jour) */
      const E2 = p.end, cnt = {}, pins = st.pins || {}, newId = p.nb ? p.nb.id : null;
      for (const v of live) { const w = E2.villagers[v.id].work, pn = pins[v.id]; if (pn != null) pinsSet++;
        if (J.off[v.id]) { if (w != null) fail('travaille malgré tout', v.name, J.off[v.id], seed, d); continue; }
        if (pn === -1) { if (w != null) fail('vœu sans poste ignoré', v.name, seed, d); }
        else if (pn != null && posts.some(b => b.id === pn)) { cnt[pn] = (cnt[pn] || 0) + 1; if (cnt[pn] <= SIM.BT[posts.find(b => b.id === pn).type].posts && w !== pn) fail('vœu ignoré', v.name, pn, w, seed, d); }
        if (w !== J.work[v.id] && w !== newId) fail('aperçu faux', v.name, J.work[v.id], w, seed, d); }
      for (const b of E2.buildings) if (b.workers.length > (SIM.BT[b.type].posts || 0)) fail('trop de monde', b.type, seed, d);
    }
    MIND.day(mind, p); MIND.endDay(mind, p); dead = p.sum.deaths.map(x => x.id); for (const x of p.sum.deaths) { why[x.why] = (why[x.why] || 0) + 1; if (!st._fd) { st._fd = 1; } } if (p.sum.deaths.length && !firstSeen) { firstSeen = 1; first.push(d); } peak = Math.max(peak, live.length);
    for (const x of p.sum.deaths) print = (print * 31 + d * 7 + x.id * 13 + x.why.length) % 1000000007; print = (print * 31 + p.end.food * 3 + p.end.wood * 5 + p.end.buildings.length) % 1000000007;
    if (p.result) { res.push(p.result.days); break; } st = p.end;
    if (d === CAP - 1) { res.push(CAP); if (process.env.V) console.log("  graine", seed, "tient", CAP, "j | vivants", st.villagers.filter(v => v.alive).length, "nourr.", st.food, "bois", st.wood, "pierre", st.stone, "bât.", st.buildings.length); }
  }
}
res.sort((a, b) => a - b);
first.sort((a, b) => a - b); console.log('  première mort : médiane j', first[first.length >> 1], 'min', first[0], '| population max', peak, '| causes', JSON.stringify(why), '| vœux suivis', pinsSet, '| empreinte', print, big ? '| sauvegarde la plus lourde ' + Math.round(big / 1024) + ' Ko' : '');
console.log(POL, '|', N, 'parties,', days, 'journées,', bad, 'anomalies', JSON.stringify(kinds), '| jours tenus : min', res[0], 'médiane', res[res.length >> 1], 'max', res[res.length - 1], '| matins sans carte', vides, '| événements', JSON.stringify(evc));
