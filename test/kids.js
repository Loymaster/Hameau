/* node test/kids.js : toutes les phrases dites par des enfants sur des parties au hasard des défis à enfants — pour repérer celles qui ne sont pas d'un enfant */
global.SIM = require('../src/sim.js'); const MIND = require('../src/mind.js');
const said = {}; const ids = Object.keys(SIM.CHALLENGES).filter(id => SIM.CHALLENGES[id].villagers.some(v => v.child));
for (const id of ids) for (let g = 0; g < +(process.argv[2] || 60); g++) {
  let st = SIM.newGame(SIM.CHALLENGES[id], 1000 + g * 7919), m = MIND.create(st); const r = SIM.rngOf(g + 11);
  for (;;) { st = SIM.beginDay(st); MIND.join(m, st); const a = MIND.morning(m, st) || []; const o = [null, ...SIM.draw(st)].filter(k => !k || !SIM.blocked(st, k)), p = SIM.planDay(st, o[Math.floor(r() * o.length)]);
    const b = MIND.day(m, p) || [], c = MIND.endDay(m, p) || []; for (const t of [].concat(a, b, Array.isArray(c) ? c : [])) if (t && t.text && st.villagers[t.vid] && st.villagers[t.vid].child) { const k = (t.sit || '?') + ' | ' + t.text; said[k] = (said[k] || 0) + 1; }
    if (p.result) break; st = p.end; } }
const all = Object.keys(said).sort(); console.log(ids.join(','), '|', all.length, 'phrases différentes');
const sus = all.filter(k => /bois|planche|poste|métier|chantier|porte[rz]?\b|bâti[sr]|travaill/i.test(k) && !/ecole|jeu \|/.test(k)); console.log('à regarder (' + sus.length + ') :'); for (const k of sus) console.log('  ', said[k], k);
if (process.env.ALL) for (const k of all) console.log(said[k], k);
