/* node test/rand.js <défi> [n] ['<surcharge>'] : n parties jouées au hasard — étoiles, décès, manques, et où en sont les ressources visées à la fin. */
const SIM = require('../src/sim.js');
const id = process.argv[2], n = +(process.argv[3] || 100), ov = process.argv[4] ? eval('(' + process.argv[4] + ')') : {};
const ch = Object.assign({}, SIM.CHALLENGES[id], ov); SIM.CHALLENGES[id] = ch; if (ov.draws) ch.deck = Array.from(new Set([].concat.apply([], ch.draws)));
const need = Object.assign({}, ...ch.goals.map(g => g.need || {})), keys = Object.keys(need).length ? Object.keys(need) : [ch.joy ? 'joy' : 'food'];
const r = SIM.rngOf(+(process.env.SEED || 4242)), dist = {}, vals = {}, why = {}; let dead = 0, lack = 0;
for (let g = 0; g < n; g++) { let st = SIM.newGame(ch), res = null; while (!res) { st = SIM.beginDay(st); const o = SIM.options(st), p = SIM.planDay(st, o[Math.floor(r() * o.length)]); res = p.result; st = p.end; for (const d of p.sum.deaths || []) why[d.why] = (why[d.why] || 0) + 1; }
  dist[res.stars] = (dist[res.stars] || 0) + 1; if (res.alive < res.total) dead++; if (st.everLacked) lack++; for (const k of keys) (vals[k] = vals[k] || []).push(st[k] || 0); }
console.log(id, ch.title, '| au hasard,', n, 'parties :', JSON.stringify(dist), '| avec décès', dead, '| avec manque', lack, '| morts', JSON.stringify(why));
for (const k of keys) { const s = vals[k].sort((a, b) => b - a); console.log('  ', k, ': max', s[0], '| 10 %', s[Math.floor(n * 0.1)], '| médiane', s[Math.floor(n * 0.5)], '| min', s[n - 1]); }
