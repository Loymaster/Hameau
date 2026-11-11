/* node test/trace.js <défi> '<choix>choix>…' [n° de graine] : déroule une suite de choix et dit, jour après jour, ce qu'il reste et ce qui a manqué ('-' = ne rien bâtir) */
const SIM = require('../src/sim.js');
const id = process.argv[2], seq = (process.argv[3] || '').split('>'), k = +(process.argv[4] || 0), ch = SIM.CHALLENGES[id];
let st = SIM.newGame(ch, k ? 1000 + k * 7919 : ch.seed);
for (let d = 0; ; d++) {
  st = SIM.beginDay(st); const cards = SIM.draw(st), pk = seq[d] && seq[d] !== '-' ? seq[d] : null;
  if (pk && (!cards.includes(pk) || SIM.blocked(st, pk))) { console.log('jour', st.day, ': carte', pk, cards.includes(pk) ? 'impayable' : 'absente', '| cartes', cards.join(','), '| bois', st.wood, 'pierre', st.stone, 'nourriture', st.food); break; }
  const p = SIM.planDay(st, pk), e = p.end, al = e.villagers.filter(v => v.alive);
  console.log('j' + st.day, (pk || '—').padEnd(11), '| gagné', JSON.stringify(p.sum.got).replace(/"/g, ''), '| soir : nourr.', e.food, 'bois', e.wood, 'pierre', e.stone, e.joy != null && ch.joy ? 'bonheur ' + e.joy : '', '| lits', SIM.capacity(e) + '/' + al.length, '| faim', al.filter(v => v.hunger).map(v => v.name + v.hunger).join(',') || '-', '| dehors', al.filter(v => v.roofless).map(v => v.name + v.roofless).join(',') || '-', p.sum.deaths.length ? '| MORTS ' + p.sum.deaths.map(x => x.name + ' ' + x.why).join(', ') : '', (e.lost || []).length ? '| détruit : ' + e.lost.join(', ') : '', '| cartes', cards.map(c => c + (SIM.blocked(st, c) ? '(x)' : '')).join(','));
  if (p.result) { console.log('→', p.result.stars, '★', JSON.stringify(p.result.ok)); break; } st = p.end;
}
