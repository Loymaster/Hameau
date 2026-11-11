/* node test/probe.js <défi> '<surcharge>' : parmi les parties sans manque, quel bonheur et quelle réserve atteint-on ? */
const SIM = require('../src/sim.js');
const id = process.argv[2], ov = process.argv[3] ? eval('(' + process.argv[3] + ')') : {};
const ch = Object.assign({}, SIM.CHALLENGES[id], ov); SIM.CHALLENGES[id] = ch;
const joy = {}, food = {}; let n = 0, best = null, dead = 0, nl = 0;
const rec = (st, seq) => { st = SIM.beginDay(st); for (const pk of [...SIM.draw(st), null]) { if (pk && SIM.blocked(st, pk)) continue; const p = SIM.planDay(st, pk), s2 = seq.concat(pk || '-'); if (p.result) { n++; if (p.result.alive < p.result.total) dead++; if (p.result.ok[1]) { nl++; joy[p.end.joy] = (joy[p.end.joy] || 0) + 1; const f = Math.floor(p.end.food / 2) * 2; food[f] = (food[f] || 0) + 1; if (!best || p.end.joy > best.j) best = { j: p.end.joy, s: s2.join('>') }; } } else rec(p.end, s2); } };
rec(SIM.newGame(ch), []);
console.log(id, n, 'parties | avec décès', dead, '| sans manque', nl, '→ bonheur', JSON.stringify(joy), '| réserve', JSON.stringify(food), '| meilleur', best && best.j, best && best.s);
