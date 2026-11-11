/* node test/probe2.js <défi> '<surcharge>' <n° de graine> : parmi les parties sans manque, combien atteignent chaque seuil de réserve et de bonheur ? */
const SIM = require('../src/sim.js');
const id = process.argv[2], ov = process.argv[3] ? eval('(' + process.argv[3] + ')') : {}, k = +(process.argv[4] || 0);
const ch = Object.assign({}, SIM.CHALLENGES[id], ov); SIM.CHALLENGES[id] = ch;
const seed = k ? 1000 + k * 7919 : ch.seed, joy = [], food = []; let n = 0, dead = 0, nl = 0;
const rec = st => { st = SIM.beginDay(st); for (const pk of [...SIM.draw(st), null]) { if (pk && SIM.blocked(st, pk)) continue; const p = SIM.planDay(st, pk); if (p.result) { n++; if (p.result.alive < p.result.total) dead++; if (p.result.ok[1]) { nl++; joy.push(p.end.joy || 0); food.push(p.end.food); } } else rec(p.end); } };
rec(SIM.newGame(ch, seed));
const cum = a => { const o = {}; for (const v of [...new Set(a)].sort((x, y) => y - x).slice(0, 9)) o[v] = a.filter(x => x >= v).length; return JSON.stringify(o); };
console.log(id, ov.tag || JSON.stringify(ov), 'graine', k, '|', n, 'parties | décès', dead, '| sans manque', nl, '| 1 % =', Math.round(n / 100), '| réserve ≥', cum(food), ch.joy ? '| bonheur ≥ ' + cum(joy) : '');
