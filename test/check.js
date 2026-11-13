/* node test/check.js : ce que chaque défi et chaque bâtiment doit avoir pour que le jeu ne tombe pas en route
   (fiche, fin de défi, cartes, description). À lancer après tout ajout de défi ou de bâtiment. */
const fs = require('fs'), SIM = require('../src/sim.js'), ui = fs.readFileSync(__dirname + '/../src/ui.js', 'utf8'), art = fs.readFileSync(__dirname + '/../src/art.js', 'utf8');
let bad = 0; const ko = (...a) => { bad++; console.log('MANQUE', ...a); };
const titles = {}, inLevels = new Set([].concat(...SIM.LEVELS.map(l => l.ch)));
for (const id in SIM.CHALLENGES) { const c = SIM.CHALLENGES[id]; if (c.survival) continue;
  if (!Array.isArray(c.endMsg) || c.endMsg.length !== 4 || c.endMsg.some(x => !x)) ko(id, 'endMsg (4 phrases de fin)');
  if (!c.voice || !c.voice.text) ko(id, 'voice'); if (!c.goals || c.goals.length !== 3) ko(id, 'trois objectifs');
  if (titles[c.title]) ko(id, 'titre déjà pris par', titles[c.title]); titles[c.title] = id;
  if (c.draws.length !== 1 && c.draws.length < c.days) ko(id, 'un tirage par jour');
  for (const t of c.deck) if (!SIM.BT[t]) ko(id, 'carte inconnue', t);
  for (const s of c.start) if (!SIM.BT[s.type]) ko(id, 'bâtiment de départ inconnu', s.type);
  for (const e of c.events || []) if (!new RegExp('\\b' + e.type + ': \\{ icon').test(ui) || !new RegExp('\\b' + e.type + ': \\(').test(ui)) ko(id, 'événement sans nom ou sans définition', e.type);
  if (!inLevels.has(id)) ko(id, 'absent des niveaux'); }
const lv = {}; for (const l of SIM.LEVELS) { if (lv[l.name]) ko(l.id, 'nom de niveau en double'); lv[l.name] = 1; if (titles[l.name]) ko(l.id, 'nom de niveau pris par le défi', titles[l.name]); }
const names = {}; for (const t in SIM.BT) { const d = SIM.BT[t]; if (names[d.name]) ko(t, 'nom de bâtiment en double', names[d.name]); names[d.name] = t;
  if (!new RegExp('\\b' + t + ': [\'‘"]').test(ui) && !new RegExp('INFO\\.' + t + ' = ').test(ui)) ko(t, 'description (INFO)');
  if (!new RegExp('\\b' + t + ': \\{').test(art) && !new RegExp('\\b' + t + ': \\[').test(art)) ko(t, 'dessin (BDEF)');
  if (d.job && !SIM.JOBNAME[d.job]) ko(t, 'nom de métier', d.job);
  if (![].concat(...(ui.match(/const FAM = [\s\S]*?\]\]\];/) || [''])).join('').includes("'" + t + "'")) ko(t, 'famille dans la Collection'); }
console.log(Object.keys(SIM.CHALLENGES).length - 1, 'défis,', SIM.LEVELS.length, 'niveaux,', Object.keys(SIM.BT).length, 'bâtiments :', bad ? bad + ' manque(s)' : 'rien ne manque');
process.exit(bad ? 1 : 0);
