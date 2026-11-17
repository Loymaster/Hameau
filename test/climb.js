/* node test/climb.js <défi> ['a > b+c > - …' …] : améliore une ligne un jour à la fois (puis deux jours voisins avec PAIR=1).
   Le faisceau (beam2.js) voit mal les chaînes longues : argile, puis briques, puis ce qu'on bâtit avec. Ici on part d'une ligne
   entière, on change le choix d'un seul jour, on rejoue la suite telle quelle, et on garde ce qui améliore la fin.
   Ordre de préférence : personne ne meurt, personne ne manque de rien, puis la mesure (ce que le défi demande, ou W='food:1,joy:2').
   Variables : W (mesure), PAIR=1 (essaie aussi deux jours voisins), KICK=n (n secousses au hasard, puis remontée),
   RANDSTART=n (n parties au hasard, les NSTART meilleures servent de départs), SEED. */
const SIM = require(process.env.SIMJS || '../src/sim.js');
const id = process.argv[2], ch = SIM.CHALLENGES[id], D = ch.days;
const need = Object.assign({}, ...ch.goals.map(g => g.need || {})), XW = {}; (process.env.W || '').split(',').filter(Boolean).forEach(s => { const [k, v] = s.split(':'); XW[k] = +v; });
const PIN = (process.env.PIN || '').split(',').filter(Boolean).map(Number); // PIN=1,6 : ces jours-là ne bougent pas
const LEAN = !!process.env.LEAN; // LEAN=1 : recherche allégée (pas de paires, deux secousses au plus)
const grown = ch.goals.some(g => g.grown);
/* les conditions qui ne se comptent pas (pierre ou brique pour tous, peu de chantiers) valent un palier ; M='expression sur st' remplace la mesure */
const cons = [].concat(...ch.goals.map(g => g.parts || [g])).filter(g => g.hard || g.max), MF = process.env.M ? new Function('st', 'SIM', 'return ' + process.env.M) : null;
const stockN = Math.max(0, ...[].concat(...ch.goals.map(g => g.parts || [g])).map(g => g.stockN || 0));
const metric = st => metric0(st) + cons.reduce((n, g) => n + (g.ok(st, true) ? 40 : 0), 0);
const metric0 = st => {
  if (MF) return MF(st, SIM);
  if (Object.keys(XW).length) return Object.keys(XW).reduce((n, k) => n + XW[k] * (st[k] || 0), 0);
  const ks = Object.keys(need); if (ks.length) return 100 * Math.min(...ks.map(k => (st[k] || 0) / need[k])) + ks.reduce((n, k) => n + Math.min(3, (st[k] || 0) / need[k]), 0);
  return st.food;
};
const keyOf = pk => pk == null ? '-' : [].concat(pk).slice().sort().join('+');
/* l'ordre compte : le premier des deux est bâti le premier, et ses postes sont pourvus d'abord. Une ligne garde donc l'ordre joué. */
const pick = (st, want) => { const ops = SIM.options(st), m = {}; for (const o of ops) m[keyOf(o)] = o; const k = want === '-' ? '-' : want.split('+').sort().join('+');
  if (k in m) return want === '-' ? null : want.includes('+') ? want.split('+') : want;
  if (want.includes('+')) for (const w of want.split('+')) if (w in m) return w; return null; };
const strOf = pk => pk == null ? '-' : [].concat(pk).join('+');
const moves = st => { const out = []; for (const o of SIM.options(st)) { out.push(strOf(o)); if (Array.isArray(o)) out.push(o.slice().reverse().join('+')); } return out; };
let sims = 0;
/* rejoue la ligne à partir du jour d (états connus jusqu'à d-1) */
const play = (states, seq, d) => { let st = states[d - 1], out = states.slice(0, d), real = seq.slice(0, d - 1), res = null;
  for (let k = d; k <= D; k++) { st = SIM.beginDay(st); const pk = pick(st, seq[k - 1]), p = SIM.planDay(st, pk); sims++; real.push(strOf(pk)); st = p.end; out.push(st); res = p.result; }
  const al = st.villagers.filter(v => v.alive).length, kids = st.villagers.filter(v => v.alive && v.child).length;
  const score = (al === st.villagers.length ? 1e9 : -1e7 * (st.villagers.length - al)) + (st.everLacked ? 0 : 1e8) + (grown ? -1e6 * kids : 0) + metric(st) * 1000 + st.food + st.wood * 0.1;
  return { states: out, seq: real, res, score, st }; };
const show = g => g.res.stars + '★ ' + SIM.RES.filter(r => g.st[r]).map(r => r.slice(0, 3) + g.st[r]).join(' ') + (ch.joy ? ' joy' + g.st.joy : '') + (g.st.everLacked ? ' manque' : '') + ' | ' + g.res.alive + '/' + g.res.total + (grown ? ' | enfants ' + g.st.villagers.filter(v => v.alive && v.child).length : '') + '\n      ' + g.seq.join(' > ');
const climb = g => { let better = true, pass = 0;
  while (better) { better = false; pass++;
    for (let d = 1; d <= D; d++) { if (PIN.includes(d)) continue; const st0 = SIM.beginDay(g.states[d - 1]); for (const k of moves(st0)) { if (k === g.seq[d - 1]) continue; const s2 = g.seq.slice(); s2[d - 1] = k; const h = play(g.states, s2, d); if (h.score > g.score + 1e-6) { g = h; better = true; } } }
    if (!better && (process.env.PAIR && !LEAN)) for (let d = 1; d < D && !better; d++) { const st0 = SIM.beginDay(g.states[d - 1]); for (const k of moves(st0)) { if (k === g.seq[d - 1]) continue; const s1 = g.seq.slice(); s1[d - 1] = k; const h1 = play(g.states, s1, d), st1 = SIM.beginDay(h1.states[d]);
      for (const k2 of moves(st1)) { if (k2 === h1.seq[d]) continue; const s2 = h1.seq.slice(); s2[d] = k2; const h = play(h1.states, s2, d + 1); if (h.score > g.score + 1e-6) { g = h; better = true; } } } }
  }
  return g; };
const t0 = Date.now(), base = SIM.newGame(ch), starts = process.argv.slice(3).length ? process.argv.slice(3) : process.env.RANDSTART ? [] : [Array(D).fill('-').join(' > ')];
if (process.env.RANDSTART) { /* des départs tirés au hasard : les meilleurs servent de points de départ, pour sortir des habitudes du faisceau */
  const r = SIM.rngOf(4242 + (+process.env.SEED || 0) * 31), pool = [];
  for (let g = 0; g < +process.env.RANDSTART; g++) { let st = base, seq = []; for (let d = 1; d <= D; d++) { st = SIM.beginDay(st); const ms = moves(st), k = ms[Math.floor(r() * ms.length)]; seq.push(k); st = SIM.planDay(st, pick(st, k)).end; sims++; } pool.push(play([base], seq, 1)); }
  for (const g of pool.sort((a, b) => b.score - a.score).slice(0, +(process.env.NSTART || 3))) starts.push(g.seq.join(' > ')); }
let best = null; const seen = [];
for (const s of starts) { let seq = s.replace(/\s/g, '').split('>'); while (seq.length < D) seq.push('-');
  let g = climb(play([base], seq, 1)); seen.push(g); if (!best || g.score > best.score) best = g; }
if (process.env.KICK) { const r = SIM.rngOf(1000 + (+process.env.SEED || 0) * 7919);
  for (let k = 0; k < Math.min(LEAN ? 2 : 99, +process.env.KICK); k++) { let g = best; const s2 = g.seq.slice(), n = 2 + Math.floor(r() * 2); let dmin = D;
    for (let j = 0; j < n; j++) { const d = 1 + Math.floor(r() * D), ops = moves(SIM.beginDay(g.states[d - 1])); s2[d - 1] = ops[Math.floor(r() * ops.length)]; dmin = Math.min(dmin, d); }
    const h = climb(play(g.states, s2, dmin)); if (h.score > best.score + 1e-6) { best = h; seen.push(h); } } }
console.log(id, ch.title, '|', sims, 'journées,', ((Date.now() - t0) / 1000).toFixed(0) + ' s');
for (const g of seen.sort((a, b) => b.score - a.score).slice(0, +(process.env.TOP || 3))) console.log('  ', show(g));
