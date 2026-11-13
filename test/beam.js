/* node test/beam.js <défi> [largeur] ['<surcharge>'] : pour les défis trop longs à parcourir en entier — on garde chaque jour les meilleures parties (recherche en faisceau).
   Ce qu'il trouve existe ; ce qu'il ne trouve pas n'est pas prouvé impossible. */
const SIM = require('../src/sim.js');
const id = process.argv[2], K = +(process.argv[3] || 500), ov = process.argv[4] ? eval('(' + process.argv[4] + ')') : {};
const ch = Object.assign({}, SIM.CHALLENGES[id], ov); SIM.CHALLENGES[id] = ch;
const val = st => { const al = st.villagers.filter(v => v.alive), prod = st.buildings.reduce((n, b) => n + (b.gone ? 0 : (SIM.BT[b.type].per || 0) * b.workers.length), 0);
  return (al.length < st.villagers.length ? -1000 : 0) + (st.everLacked ? -300 : 0) + (ch.joy ? st.joy * 3 : 0) + st.food + 0.6 * st.wood + 0.6 * st.stone + 2.5 * prod + Math.min(0, SIM.capacity(st) - al.length) * 4 + al.filter(v => v.child).reduce((n, v) => n + (v.school || 0), 0); };
let front = [{ st: SIM.newGame(ch, process.env.SEED ? 1000 + (+process.env.SEED) * 7919 : undefined), seq: [] }], finals = [], sims = 0;
for (let d = 1; d <= ch.days; d++) {
  const next = [];
  for (const f of front) { const st = SIM.beginDay(f.st); for (const pk of SIM.options(st)) { const p = SIM.planDay(st, pk); sims++; const seq = f.seq.concat(pk ? [].concat(pk).join('+') : '-'); if (p.result) finals.push({ r: p.result, st: p.end, seq }); else next.push({ st: p.end, seq, v: val(p.end) }); } }
  const seen = new Set(); front = next.sort((a, b) => b.v - a.v).filter(x => { const k = x.st.buildings.map(b => b.type + b.workers.length).sort().join() + '|' + x.st.food + '|' + x.st.wood + '|' + x.st.stone + '|' + x.st.joy + '|' + x.st.everLacked + '|' + x.st.villagers.map(v => (v.alive ? 1 : 0) + (v.child ? 'e' + v.school : '')).join(''); if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, K);
}
const dist = {}; for (const f of finals) dist[f.r.stars] = (dist[f.r.stars] || 0) + 1;
const ok = finals.filter(f => f.r.ok[1]).sort((a, b) => (ch.joy ? b.st.joy - a.st.joy : 0) || b.st.food - a.st.food);
console.log(id, ch.title, '| faisceau', K, '|', sims, 'journées |', finals.length, 'fins', JSON.stringify(dist), '| sans manque', ok.length);
const q = (a, f) => { const s = a.map(f).sort((x, y) => y - x); return s.length ? [s[0], s[Math.floor(s.length * 0.02)], s[Math.floor(s.length * 0.1)], s[Math.floor(s.length * 0.5)]].join('/') : '-'; };
console.log('  sans manque — max / 2 % / 10 % / médiane : nourriture', q(ok, f => f.st.food), '| bois', q(ok, f => f.st.wood), '| pierre', q(ok, f => f.st.stone), '| bonheur', q(ok, f => f.st.joy));
for (const f of ok.slice(0, +(process.env.TOP || 5))) console.log('  ', 'n' + f.st.food, 'b' + f.st.wood, 'p' + f.st.stone, 'j' + f.st.joy, f.r.stars + '★', f.seq.join('>'));
const used = {}; ok.slice(0, 40).forEach(f => f.seq.forEach(t => used[t] = (used[t] || 0) + 1)); console.log('  cartes des 40 meilleures :', JSON.stringify(used));
