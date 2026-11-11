/* contrôle des pensées sur toutes les parties possibles : rien ne casse, chacun parle, les phrases sont complètes */
global.SIM = require('../src/sim.js'); const MIND = require('../src/mind.js');
let bad = 0, days = 0, th = 0, maxW = 0, longest = '', love = 0, games = 0, withLove = 0, f3 = 0, deaths = 0, warned = 0; const sits = {};
const fail = (...a) => { if (bad++ < 12) console.log('ANOMALIE', ...a); };
for (const sit in MIND.PH) for (const c in MIND.PH[sit].lines) for (const l of MIND.PH[sit].lines[c]) { const n = l.replace(/[.,!?…:]/g, '').split(/\s+/).filter(Boolean).length; if (n > maxW) { maxW = n; longest = l; } }
function check(list, st, when) {
  for (const t of list) {
    th++; sits[t.sit] = (sits[t.sit] || 0) + 1;
    if (!t.text || /\{|undefined|null/.test(t.text)) fail('phrase incomplète', t.sit, t.text);
    if (!st.villagers[t.vid].alive) fail('un mort parle', t.sit);
    if (t.reply && (t.reply.vid === t.vid || !st.villagers[t.reply.vid].alive || !t.reply.text)) fail('réponse invalide', t.sit);
    if (t.t1 <= t.t0) fail('fenêtre vide', t.sit); if (t.force === 3) f3++;
  }
  const per = {}; list.forEach(t => per[t.vid] = (per[t.vid] || 0) + 1);
  if (when === 'matin') for (const v of st.villagers) if (v.alive && !per[v.id]) fail('muet le matin', v.name, 'jour', st.day);
}
for (const id of (process.env.ONLY || 'c1,c2,c3').split(',')) {
  const ch = SIM.CHALLENGES[id];
  const rec = (st, mind) => {
    st = SIM.beginDay(st); MIND.join(mind, st); const mo = MIND.morning(mind, st); check(mo, st, 'matin');
    for (const pk of [null, ...SIM.draw(st)]) {
      if (pk && SIM.blocked(st, pk)) continue;
      const p = SIM.planDay(st, pk), m2 = JSON.parse(JSON.stringify(mind)); days++;
      /* qui va mourir ce soir l'a-t-il dit, le matin ou dans la journée, avec la force 3 ? */
      const dl = MIND.day(m2, p); check(dl, p.start, 'jour');
      for (const x of p.sum.deaths) { deaths++; if (mo.concat(dl).some(t => t.vid === x.id && t.force === 3)) warned++; else fail('mort sans avertissement', x.name, 'jour', st.day, id); }
      MIND.endDay(m2, p);
      if (p.result) { games++; const n = Object.keys(m2.love).length / 2; love += n; if (n) withLove++; } else rec(p.end, m2);
    }
  };
  const st0 = SIM.newGame(ch, +process.env.SEED || undefined); rec(st0, MIND.create(st0));
}
console.log(days, 'journées,', th, 'pensées,', bad, 'anomalies | force 3 :', f3, '| morts annoncées par l’intéressé :', warned + '/' + deaths);
console.log('phrase la plus longue :', maxW, 'mots —', longest);
console.log('parties avec au moins un amour :', withLove + '/' + games, '| situations rencontrées :', Object.keys(sits).length + '/' + Object.keys(MIND.PH).length, '| jamais vues :', Object.keys(MIND.PH).filter(k => !sits[k]).join(', '));
process.exit(bad ? 1 : 0);
