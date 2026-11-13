const SIM = require('../src/sim.js');
let fail = 0, maxSp = 0, minAct = 9, days = 0, stormDike = 0, minWhat = '';
const kinds = {};
const bad = (...a) => { fail++; kinds[a[0]] = (kinds[a[0]] || 0) + 1; if (kinds[a[0]] < 6) console.log('ANOMALIE', ...a); };
function check(st, p, pick) {
  days++;
  for (const id in p.tracks) {
    const s = p.tracks[id].s;
    for (let i = 0; i < s.length; i++) {
      if (!(s[i].t1 > s[i].t0)) bad('segment vide', id);
      if (i && Math.abs(s[i].t0 - s[i - 1].t1) > 1e-6) bad('trou', id, i);
      if (s[i].k === 'walk') { const sp = s[i].L / (s[i].t1 - s[i].t0) / SIM.SPEED; maxSp = Math.max(maxSp, sp); if (sp > 1.605) bad('trop rapide', sp.toFixed(2), s[i].label, s[i].t0.toFixed(1), 'jour', st.day, '| avant :', s.slice(Math.max(0, i - 3), i).map(q => (q.label || q.anim) + '@' + q.t0.toFixed(1)).join(' > '), '| métier', st.villagers[id].job, Math.round(s[i].L) + 'px'); }
      if (['gather', 'chop', 'pick', 'build', 'fish', 'mine', 'bake'].includes(s[i].anim)) { if (s[i].t1 - s[i].t0 < minAct) { minAct = s[i].t1 - s[i].t0; minWhat = st.ch + ' jour ' + st.day + ' ' + s[i].anim + ' « ' + s[i].label + ' » à ' + s[i].t0.toFixed(2) + ' h, choix ' + pick; } }
      if (['gather', 'chop', 'fish', 'mine', 'bake'].includes(s[i].anim) && s[i].t1 > SIM.T.MEAL + 0.3) bad('travail tardif', s[i].anim, s[i].t1.toFixed(2));
    }
    if (Math.abs(s[s.length - 1].t1 - SIM.T.END) > 1e-6) bad('fin de piste', id);
    if (pick && p.nb && !st.villagers[id].child && !s.some(sg => sg.anim === 'build')) bad('pas de chantier pour', id); // les enfants regardent
    const eat = p.events.find(e => (e.type === 'eat' || e.type === 'noeat') && e.vid == id);
    if (!eat || eat.t > SIM.T.BED) bad('repas tardif', id, eat && eat.t.toFixed(2));
    const bed = p.events.find(e => (e.type === 'bed' || e.type === 'nobed') && e.vid == id);
    if (!bed || bed.t > SIM.T.NIGHT + 1) bad('coucher tardif', id, bed && bed.t.toFixed(2));
  }
  const r = {}; for (const k of SIM.RES) r[k] = st[k] || 0;
  for (const e of p.events) for (const k of SIM.RES) { r[k] += e[k] || 0; if (r[k] < 0) bad('ressource négative', k, 'jour', st.day, e.type, e.t.toFixed(2)); }
  for (const k of SIM.RES) if (r[k] !== p.end[k]) bad('écart', k, r[k], p.end[k]);
  if (pick && !p.nb) bad('placement impossible', pick, 'jour', st.day);
  /* logements : pas plus de dormeurs que de places par bâtiment ; les lits vont d'abord à ceux qui ont dormi dehors la veille ; une maison garde ses habitants */
  const inB = {}; for (const e of p.events) if (e.type === 'bed') inB[e.bid] = (inB[e.bid] || 0) + 1;
  for (const b of p.end.buildings) { if ((inB[b.id] || 0) > SIM.BT[b.type].beds) bad('trop de dormeurs', b.type); if (b.owners && b.owners.length > SIM.BT[b.type].beds) bad('trop d’habitants', b.type); }
  const slept = new Set(p.events.filter(e => e.type === 'bed').map(e => e.vid)), outN = p.events.filter(e => e.type === 'nobed').map(e => e.vid);
  const wrecked = new Set(p.events.filter(e => e.type === 'fire').map(e => e.bid)), cap = p.end.buildings.reduce((n, b) => n + (wrecked.has(b.id) ? 0 : SIM.BT[b.type].beds), 0), aliveN = Object.keys(p.tracks).length;
  if (outN.length && slept.size < Math.min(cap, aliveN) - p.end.buildings.filter(b => b.owners && !wrecked.has(b.id)).reduce((n, b) => n + SIM.BT[b.type].beds - b.owners.length, 0)) bad('lit libre alors que quelqu’un dort dehors', 'jour', st.day);
  for (const v of st.villagers) if (v.alive && v.home == null && v.roofless > 0 && !slept.has(v.id)) { if (st.villagers.some(o => o.alive && o.home == null && o.roofless === 0 && slept.has(o.id) && !o.child && !v.child)) bad('priorité au toit non respectée', v.name); }
  /* les enfants passent d'abord : aucun adulte sans maison ne dort dans un lit tant qu'un enfant n'en a pas */
  for (const v of st.villagers) if (v.alive && v.child && v.home == null && !slept.has(v.id) && st.villagers.some(o => o.alive && !o.child && o.home == null && slept.has(o.id))) bad('un adulte a pris le lit d’un enfant', v.name);
  for (const v of st.villagers) if (v.alive && v.home != null && p.end.villagers[v.id].alive && p.end.villagers[v.id].home !== v.home && !wrecked.has(v.home)) bad('a perdu sa maison', v.name); // sauf si elle a été détruite
  const map = SIM.getMap(st.map);
  /* orage : personne ne passe la rivière, sauf si une digue la retient */
  if (SIM.weather(st).storm && !st.buildings.concat(p.nb ? [p.nb] : []).some(b => SIM.BT[b.type].anti === 'storm' && !b.gone)) // une digue protège dès le jour où on la bâtit, comme le fanal
    for (const id in p.tracks) for (let t = SIM.T.BUILD; t < SIM.T.END; t += 0.05) { const q = SIM.sample(p.tracks[id], t); if (q && map.rside(q.x, q.y) !== map.home && map.rdist(q.x, q.y) > 8) { bad('traverse sous l’orage', id, 'jour', st.day, t.toFixed(2), q.label); break; } }
  else if (SIM.weather(st).storm) stormDike++;
  for (const b of p.end.buildings) if (!map.clear(b.x + b.w / 2, b.y + b.h / 2)) bad('bâtiment hors clairière', b.type);
}
if (process.env.VAR) require(process.env.VAR);
for (const id of Object.keys(SIM.CHALLENGES).filter(k => !process.env.ONLY || process.env.ONLY.split(',').includes(k))) {
  const ch = SIM.CHALLENGES[id], dist = {}; let n = 0, deaths = 0, three = [];
  const rec = (st, seq) => {
    st = SIM.beginDay(st);
    for (const pk of [null, ...SIM.draw(st)]) {
      if (pk && SIM.blocked(st, pk)) continue;
      const p = SIM.planDay(st, pk); check(st, p, pk); deaths += p.sum.deaths.length;
      const s2 = seq.concat(pk || '-');
      if (p.result) { n++; dist[p.result.stars] = (dist[p.result.stars] || 0) + 1; if (p.result.stars === 3) three.push(s2.join('>')); } else rec(p.end, s2);
    }
  };
  if (process.env.SAMPLE) { /* défis trop longs pour tout parcourir : des parties tirées au hasard */
    const r = SIM.rngOf(4321);
    for (let k = 0; k < +process.env.SAMPLE; k++) { let st = SIM.newGame(ch, +process.env.SEED || undefined); const seq = [];
      for (;;) { st = SIM.beginDay(st); const o = SIM.options(st), pk = o[Math.floor(r() * o.length)], p = SIM.planDay(st, pk); check(st, p, pk); deaths += p.sum.deaths.length; seq.push(pk ? [].concat(pk).join('+') : '-');
        if (p.result) { n++; dist[p.result.stars] = (dist[p.result.stars] || 0) + 1; if (p.result.stars === 3) three.push(seq.join('>')); break; } st = p.end; } }
  } else
  rec(SIM.newGame(ch, +process.env.SEED || undefined), []);
  console.log(id, ch.title, ':', n, 'parties, étoiles', JSON.stringify(dist), ', décès', deaths, ', 3★ :', three.length);
  if (three.length <= 6) console.log('   ', three.join(' ; '));
}
console.log(JSON.stringify(kinds));
console.log(days, 'journées contrôlées,', fail, 'anomalies, vitesse max ×' + maxSp.toFixed(2) + ', action la plus courte', minAct.toFixed(2), 'h', '(' + minWhat + ')');
const mk = () => SIM.planDay(SIM.beginDay(SIM.newGame(SIM.CHALLENGES.c4)), 'carriere');
console.log('déterministe :', JSON.stringify(mk().events) === JSON.stringify(mk().events));
process.exit(fail ? 1 : 0);
