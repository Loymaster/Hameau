/* node test/beam2.js <défi> [largeur] ['<surcharge>'] : recherche en faisceau pour les grands défis (niveaux 10 et suivants).
   La valeur d'une partie en cours suit les objectifs du défi : ce qu'il demande au dernier soir pèse le plus lourd.
   Ce qu'il trouve existe ; ce qu'il ne trouve pas n'est pas prouvé impossible.
   Variables : SEED (graine : sans effet sur un défi, dont le hasard est fixé), TOP (lignes montrées), W='brick:4,ingen:6' (poids en plus), RAND=n (n parties au hasard en plus du faisceau). */
const SIM = require(process.env.SIMJS || '../src/sim.js');
const id = process.argv[2], K = +(process.argv[3] || 120), ov = process.argv[4] ? eval('(' + process.argv[4] + ')') : {};
const ch = Object.assign({}, SIM.CHALLENGES[id], ov); SIM.CHALLENGES[id] = ch; if (ov.draws) ch.deck = Array.from(new Set([].concat.apply([], ch.draws)));
const BT = SIM.BT, need = Object.assign({}, ...ch.goals.map(g => g.need || {})), XW = {}; (process.env.W || '').split(',').filter(Boolean).forEach(s => { const [k, v] = s.split(':'); XW[k] = +v; });
const BASE = { food: 1, wood: 0.6, stone: 0.7, clay: 0.9, brick: 2.2, plank: 1.6, meal: 1.6, culture: 1.2, ingen: 3, bloom: 3, joy: ch.joy ? 2 : 0 };
const CH = +(process.env.CH || 24), NEEDW = +(process.env.NEEDW || 40);
const HARD = [].concat(...ch.goals.map(g => g.parts || [g])).some(g => g.hard); // « chacun dort sous la pierre ou la brique » : les lits qui tiennent comptent
const val = st => {
  const al = st.villagers.filter(v => v.alive); let v = (st.villagers.length - al.length) * -1000 + (st.everLacked ? -(+process.env.LACK || 300) : 0);
  for (const k in BASE) v += (BASE[k] + (XW[k] || 0)) * (st[k] || 0);
  if (HARD) { let sb = 0; for (const b of st.buildings) if (!b.gone && SIM.solid(b.type)) sb += BT[b.type].beds || 0; v += 12 * Math.min(1, sb / al.length); }
  for (const k in need) v += NEEDW * Math.min(1, (st[k] || 0) / need[k]) + (st[k] >= need[k] ? 15 : 0);
  v += Math.min(0, SIM.capacity(st) - al.length) * 5 + Math.min(0, st.food - al.length) * 3;
  for (const b of st.buildings) { if (b.gone) continue; const d = BT[b.type], w = b.workers.filter(i => st.villagers[i].alive).length;
    v += (d.per || 0) * w * 2.5 + (d.conv && w ? 7 : 0) + (d.expert && w ? 9 : 0) + (d.medic && w ? 9 : 0) + (d.store ? 22 : 0) + (d.tools ? 6 : 0) + (SIM.solid(b.type) ? 0.8 : 0);
    if (d.give) for (const k in d.give) v += d.give[k] * 2.5; }
  for (const t of ch.deck) { const d = BT[t]; if (!(d.medic || d.expert)) continue; const b = st.buildings.find(x => x.type === t && !x.gone);
    if (b) v += b.workers.length ? 30 : 8; else { const ks = Object.keys(d.cost); v += 16 * ks.reduce((n, k) => n + Math.min(1, (st[k] || 0) / d.cost[k]), 0) / ks.length + (st.buildings.some(x => !x.gone && BT[x.type].conv && BT[x.type].conv.to === 'ingen' && x.workers.length) ? 10 : 0); } }
  /* une fièvre grave annoncée : sans médecin à son poste le lendemain, on meurt. Ce qui y mène compte dès maintenant. */
  const stf = f => st.buildings.some(b => !b.gone && f(BT[b.type]) && b.workers.some(i => st.villagers[i].alive));
  const gr = (ch.events || []).find(e => e.type === 'sick' && e.grave && st.day <= e.day + 2);
  if (gr && !stf(d => d.medic)) v -= 130 - 35 * Math.min(1, (st.ingen || 0) / 3) - (st.buildings.some(b => !b.gone && BT[b.type].conv && BT[b.type].conv.to === 'ingen') ? 20 : 0) - (stf(d => d.conv && d.conv.to === 'ingen') ? 30 : 0);
  /* ce que le défi demande : la chaîne qui le produit vaut par elle-même */
  for (const k in need) { if (k === 'joy' || k === 'food') continue; if (stf(d => d.conv && d.conv.to === k)) v += CH; else if (st.buildings.some(b => !b.gone && BT[b.type].conv && BT[b.type].conv.to === k)) v += CH / 3; if (k === 'brick' && stf(d => d.out === 'clay')) v += CH / 2; }
  /* une tornade à venir : seuls comptent les lits et les ateliers de pierre ou de brique */
  const tor = (ch.events || []).find(e => e.type === 'tornado' && e.day >= st.day);
  if (tor) { const pop = al.length + ch.events.filter(e => e.type === 'arrivals' && e.day >= st.day && e.day <= tor.day + 1).reduce((n, e) => n + e.villagers.length, 0), sb = st.buildings.reduce((n, b) => n + (!b.gone && SIM.solid(b.type) ? BT[b.type].beds || 0 : 0), 0);
    v += Math.min(0, sb - pop) * 9 * (1 + (st.day / tor.day)); for (const b of st.buildings) if (!b.gone && !SIM.solid(b.type)) v -= ((BT[b.type].per || 0) * b.workers.length * 1.2 + (BT[b.type].conv ? 3 : 0)) * (st.day / tor.day); }
  v += al.filter(x => x.sick > 0).length * -6 + al.filter(x => x.child).reduce((n, x) => n + (x.school || 0) * 2, 0);
  if (ch.goals.some(g => g.grown)) { const kids = al.filter(x => x.child);
    if (process.env.GROW === 'late') { /* l'école peut attendre : seul compte ce qui ne pourra plus être rattrapé (3 places par école et par jour) */
      const need = SIM.SCHOOL_DAYS - (st.buildings.some(b => !b.gone && BT[b.type].fast) ? 1 : 0), R = kids.reduce((n, x) => n + Math.max(0, need - (x.school || 0)), 0), E = st.buildings.filter(b => !b.gone && BT[b.type].school).length;
      let dn = st.day; if (!E) { dn = 0; for (let d = st.day; d <= ch.days; d++) if (ch.draws && ch.draws[d - 1] && ch.draws[d - 1].includes('ecole')) { dn = d; break; } }
      const cap = dn ? 3 * Math.max(E, 1) * (ch.days - dn + 1) : 0; v -= 400 * Math.max(0, R - cap + 3) + (st.day > ch.days ? 2000 * kids.length : 0); }
    else v += kids.reduce((n, x) => n - 26 + (x.school || 0) * 6, 0); }
  return v;
};
const key = st => st.buildings.map(b => (b.gone ? '!' : '') + b.type + b.workers.length).sort().join() + '|' + SIM.RES.map(r => st[r]).join() + '|' + st.joy + '|' + st.everLacked + '|' + st.villagers.map(v => v.alive ? (v.sick || 0) : 'x').join('');
const seed0 = process.env.SEED ? 1000 + (+process.env.SEED) * 7919 : undefined;
let front = [{ st: SIM.newGame(ch, seed0), seq: [] }], finals = [], sims = 0; const t0 = Date.now();
for (let d = 1; d <= ch.days; d++) {
  const next = [];
  for (const f of front) { const st = SIM.beginDay(f.st); for (const pk of SIM.options(st)) { const p = SIM.planDay(st, pk); sims++; const seq = f.seq.concat(pk ? [].concat(pk).join('+') : '-'); if (p.result) finals.push({ r: p.result, st: p.end, seq }); else next.push({ st: p.end, seq, v: val(p.end) }); } }
  const seen = new Set(); front = next.sort((a, b) => b.v - a.v).filter(x => { const k = key(x.st); if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, K);
}
const stars = {}; for (const f of finals) stars[f.r.stars] = (stars[f.r.stars] || 0) + 1;
const show = f => SIM.RES.filter(r => f.st[r]).map(r => r.slice(0, 3) + f.st[r]).join(' ') + (ch.joy ? ' joy' + f.st.joy : '') + ' | ' + f.r.alive + '/' + f.r.total + (f.st.everLacked ? ' manque' : '');
const score = f => f.r.stars * 1e6 + (f.r.alive === f.r.total ? 1e5 : 0) + (f.st.everLacked ? 0 : 5e4) + val(f.st);
finals.sort((a, b) => score(b) - score(a));
console.log(id, ch.title, '| faisceau', K, '|', sims, 'journées,', ((Date.now() - t0) / 1000).toFixed(0) + ' s |', finals.length, 'fins', JSON.stringify(stars), '| sans décès', finals.filter(f => f.r.alive === f.r.total).length, '| sans manque', finals.filter(f => f.r.ok[1]).length);
const clean = finals.filter(f => f.r.ok[1]); for (const k of Object.keys(need).concat(ch.joy && !need.joy ? ['joy'] : [], !Object.keys(need).length ? ['food'] : [])) { const s = clean.map(f => f.st[k] || 0).sort((a, b) => b - a); if (s.length) console.log('  sans manque,', k, ': max', s[0], '| 2 %', s[Math.floor(s.length * 0.02)], '| 10 %', s[Math.floor(s.length * 0.1)], '| médiane', s[Math.floor(s.length * 0.5)]); }
{ const use = {}, three = finals.filter(f => f.r.stars === 3); for (const f of three) for (const b of new Set(f.st.buildings.filter(b => !b.gone).map(b => b.type))) use[b] = (use[b] || 0) + 1; if (three.length && process.env.USE) console.log('  USE= dans les 3★ :', Object.keys(use).sort((a, b) => use[b] - use[a]).map(k => k + ' ' + Math.round(100 * use[k] / three.length) + '%').join(', ')); }
for (const f of finals.slice(0, +(process.env.TOP || 4))) console.log('  ', f.r.stars + '★', show(f), '\n     ', f.seq.join(' > '));
{ const ks = Object.keys(need).concat(ch.joy && !need.joy ? ['joy'] : [], Object.keys(need).length < 2 ? ['food'] : []).filter((k, i, l) => l.indexOf(k) === i); if (ks.length > 1 && process.env.PARETO) { const pts = {}; for (const f of clean) pts[ks.map(k => f.st[k] || 0).join('/')] = ks.map(k => f.st[k] || 0); const P = Object.values(pts).filter(a => !Object.values(pts).some(b => b !== a && b.every((x, i) => x >= a[i]) && b.some((x, i) => x > a[i]))); console.log('  front (' + ks.join('/') + ') :', P.sort((a, b) => b[0] - a[0]).map(a => a.join('/')).join('  ')); } }
if (process.env.RAND) { let r = SIM.rngOf(4242), dist = {}, dead = 0, lack = 0; for (let g = 0; g < +process.env.RAND; g++) { let st = SIM.newGame(ch, seed0), res = null; while (!res) { st = SIM.beginDay(st); const o = SIM.options(st), p = SIM.planDay(st, o[Math.floor(r() * o.length)]); res = p.result; st = p.end; if (res) { dist[res.stars] = (dist[res.stars] || 0) + 1; if (res.alive < res.total) dead++; if (st.everLacked) lack++; } } }
  console.log('  au hasard,', process.env.RAND, 'parties :', JSON.stringify(dist), '| avec décès', dead, '| avec manque', lack); }
