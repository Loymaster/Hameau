/* node test/retune.js <défi> ['<surcharge>'] : toutes les parties d'un petit défi (un chantier par jour), pour recaler une troisième étoile.
   E='expr1;;expr2' : pour chaque expression sur st, nombre de parties sans décès ni manque qui la vérifient, et cartes qu'elles jouent.
   Exemple : E='st.food>=14&&st.stone>=4;;st.joy>=12'. SHOW=n : montre n lignes. SIMJS=chemin : un autre moteur. */
const SIM = require(process.env.SIMJS || '../src/sim.js');
const id = process.argv[2], ov = process.argv[3] ? eval('(' + process.argv[3] + ')') : {}, ch = Object.assign({}, SIM.CHALLENGES[id], ov); SIM.CHALLENGES[id] = ch;
const ex = (process.env.E || (ch.joy ? 'st.joy>=1' : 'st.food>=1')).split(';;'), F = ex.map(e => new Function('st', 'return ' + e)), hit = ex.map(() => []), used = ex.map(() => ({}));
let n = 0, clean = 0, three = 0; const dist = {}, dump = [];
const rec = (st, seq) => { st = SIM.beginDay(st); for (const pk of [null, ...SIM.draw(st)]) { if (pk && SIM.blocked(st, pk)) continue; const p = SIM.planDay(st, pk), s2 = seq.concat(pk || '-');
  if (!p.result) { rec(p.end, s2); continue; } n++; const r = p.result; dist[r.stars] = (dist[r.stars] || 0) + 1; if (r.stars === 3) three++;
  if (r.alive === r.total && !p.end.everLacked) { clean++; if (process.env.DUMP) { const e = p.end; dump.push({ food: e.food, wood: e.wood, stone: e.stone, joy: e.joy || 0, built: e.buildings.filter(b => b.d).length, left: e.buildings.filter(b => b.d && !b.gone).length, solid: SIM.G.solid.ok(e, true) ? 1 : 0, seq: s2.join('>') }); } F.forEach((f, i) => { if (f(p.end)) { hit[i].push(s2.join('>')); for (const t of new Set(s2)) used[i][t] = (used[i][t] || 0) + 1; } }); } } };
rec(SIM.newGame(ch), []);
console.log(id, ov.tag || '', '|', n, 'parties', JSON.stringify(dist), '| 3★ avec l’objectif inscrit', three, '| sans décès ni manque', clean);
if (process.env.DUMP) require('fs').writeFileSync(process.env.DUMP, JSON.stringify(dump));
ex.forEach((e, i) => console.log('  ' + e + ' : ' + hit[i].length + ' | ' + Object.keys(used[i]).sort((a, b) => used[i][b] - used[i][a]).map(k => k + ' ' + used[i][k]).join(', ') + (process.env.SHOW ? '\n     ' + hit[i].slice(0, +process.env.SHOW).join('\n     ') : '')));
