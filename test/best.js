const SIM = require('../src/sim.js');
for (const id of process.argv.slice(2)) {
  let best = null;
  const rec = (st, seq) => { if (best) return; st = SIM.beginDay(st); for (const pk of [...SIM.draw(st), null]) { if (best) return; if (pk && SIM.blocked(st, pk)) continue; const p = SIM.planDay(st, pk), s2 = seq.concat(pk || '-'); if (p.result) { if (p.result.stars === 3) best = s2; } else rec(p.end, s2); } };
  rec(SIM.newGame(SIM.CHALLENGES[id]), []); console.log(id, best && best.join(','));
}
