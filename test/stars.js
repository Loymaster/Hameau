/* node test/stars.js <défi> ['<surcharge>'] [n° de graine] : toutes les parties d'un défi — étoiles, décès, suites à 3★, et jusqu'où va la réserve (ou le bonheur) quand rien n'a manqué */
const SIM = require('../src/sim.js');
const id = process.argv[2], ov = process.argv[3] ? eval('(' + process.argv[3] + ')') : {}, k = +(process.argv[4] || 0);
const ch = Object.assign({}, SIM.CHALLENGES[id], ov); SIM.CHALLENGES[id] = ch;
const MIX = process.env.MIX ? process.env.MIX.split(',').map(Number) : null, mix = [];
const dist = {}, three = [], top = [], used = {}, shown = [], usedS = {}; let n = 0, dead = 0;
const rec = (st, seq) => { st = SIM.beginDay(st); for (const pk of [null, ...SIM.draw(st)]) { if (pk && SIM.blocked(st, pk)) continue; const p = SIM.planDay(st, pk), s2 = seq.concat(pk || '-');
  if (p.result) { n++; const r = p.result; dist[r.stars] = (dist[r.stars] || 0) + 1; if (r.alive < r.total) dead++; if (r.stars === 3) { three.push(s2.join('>')); s2.forEach(t => used[t] = (used[t] || 0) + 1); } if (r.ok[1] && MIX) mix.push({ v: [p.end.food, p.end.wood, p.end.stone, p.end.joy || 0], s: s2.join('>') });
  if (r.ok[1]) { const q = ch.joy ? p.end.joy || 0 : p.end.food; top.push(q); if (process.env.SHOW != null && q >= +process.env.SHOW) { shown.push(q + ' : ' + s2.join('>')); s2.forEach(t => usedS[t] = (usedS[t] || 0) + 1); } } } else rec(p.end, s2); } };
rec(SIM.newGame(ch, k ? 1000 + k * 7919 : ch.seed), []);
const cum = a => { const o = {}; for (const v of [...new Set(a)].sort((x, y) => y - x).slice(0, 8)) o[v] = a.filter(x => x >= v).length; return JSON.stringify(o); };
console.log(id, ov.tag || '', 'graine', k, '|', n, 'parties', JSON.stringify(dist), '| avec décès', dead, '| sans manque', top.length, '|', ch.joy ? 'bonheur ≥' : 'réserve ≥', cum(top));
console.log('  3★ (' + three.length + ') :', three.slice(0, 8).join(' ; '), three.length > 8 ? '…' : '', '\n  cartes des 3★ :', JSON.stringify(used));
if (process.env.SHOW != null) console.log('  sans manque, ≥ ' + process.env.SHOW + ' (' + shown.length + ') :', shown.slice(0, 14).join(' ; '), '\n  leurs cartes :', JSON.stringify(usedS));
if (MIX) { const sc = m => Math.min(...m.v.map((x, i) => MIX[i] ? x / MIX[i] : 9)); mix.sort((a, b) => sc(b) - sc(a)); console.log('  équilibre (nourriture, bois, pierre, bonheur) visé ' + MIX.join('/') + ' : atteint par', mix.filter(m => sc(m) >= 1).length, '| ×1,25 :', mix.filter(m => sc(m) >= 1.25).length, '| ×1,5 :', mix.filter(m => sc(m) >= 1.5).length); for (const m of mix.slice(0, 8)) console.log('   ', m.v.join('/'), m.s); }
