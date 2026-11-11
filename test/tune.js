/* node test/tune.js <défi> '<surcharge JS>' <graines> [séquence guidée] : répartition des étoiles sur plusieurs graines */
const SIM = require('../src/sim.js');
const id = process.argv[2], ov = process.argv[3] ? eval('(' + process.argv[3] + ')') : {}, K = +(process.argv[4] || 4), guide = process.argv[5];
const ch = Object.assign({}, SIM.CHALLENGES[id], ov); SIM.CHALLENGES[id] = ch;
for (let k = 0; k < K; k++) {
  const seed = k ? 1000 + k * 7919 : ch.seed, dist = {}, three = []; let dead = 0, n = 0, g = null;
  const rec = (st, seq) => { st = SIM.beginDay(st); for (const pk of [...SIM.draw(st), null]) { if (pk && SIM.blocked(st, pk)) continue; const p = SIM.planDay(st, pk), s2 = seq.concat(pk || '-'); if (p.result) { n++; dist[p.result.stars] = (dist[p.result.stars] || 0) + 1; if (p.result.alive < p.result.total) dead++; if (p.result.stars === 3) three.push(s2.join('>')); if (guide && s2.join(',') === guide) g = p.result.stars + '★ ' + p.result.alive + '/' + p.result.total + ' food ' + p.end.food + ' wood ' + p.end.wood; } else rec(p.end, s2); } };
  rec(SIM.newGame(ch, seed), []);
  console.log('graine', k, '|', n, 'parties', JSON.stringify(dist), '| avec décès', dead, '| 3★', three.length, guide ? '| guidé : ' + g : '', '\n   ', three.slice(0, 3).join(' ; '));
}
