/* node test/trace2.js <défi> 'a > b+c > - …' : une partie pas à pas — réserve de chaque soir, postes, manques, morts. */
const SIM = require('../src/sim.js');
const ch = SIM.CHALLENGES[process.argv[2]], seq = process.argv[3].replace(/\s/g, '').split('>'); let st = SIM.newGame(ch);
for (const c of seq) { st = SIM.beginDay(st); const pk = c === '-' ? null : c.includes('+') ? c.split('+') : c, p = SIM.planDay(st, pk), e = p.end, al = e.villagers.filter(v => v.alive);
  const posted = e.buildings.reduce((n, b) => n + (b.gone ? 0 : b.workers.length), 0), empty = e.buildings.filter(b => !b.gone && SIM.BT[b.type].posts > b.workers.length).map(b => b.type);
  console.log('j' + st.day, (c + '                         ').slice(0, 26), SIM.RES.filter(r => e[r]).map(r => r.slice(0, 3) + e[r]).join(' ') + (ch.joy ? ' joy' + e.joy : ''), '| hab', al.length, 'lits', SIM.capacity(e), 'postés', posted, empty.length ? 'vides:' + empty.join(',') : '', '| faim', al.filter(v => v.hunger > 0).length, 'dehors', al.filter(v => v.roofless > 0).length, 'malades', al.filter(v => v.sick > 0).length, (p.sum.deaths || []).length ? '| MORTS ' + p.sum.deaths.map(d => d.name + ' ' + d.why).join(', ') : '');
  if (process.env.LOG) for (const l of p.log || p.sum.log || []) console.log('     ·', l.text);
  st = e; if (p.result) console.log('→', p.result.stars + '★', JSON.stringify(p.result.ok)); }
