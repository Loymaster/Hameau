'use strict';
/* ===== Hameau — interface : écran titre, livre, jeu, tutoriel ===== */
const UI = (() => {
  const $ = s => document.querySelector(s), app = $('#app'), cv = $('#cv');
  const hud = $('#hud'), bottom = $('#bottom'), insp = $('#insp'), titleEl = $('#title'), book = $('#book'), pageEl = $('#page'), modal = $('#modal'), coachEl = $('#coach');
  const T = SIM.T;
  /* Les icônes : dessins de l’auteur (ICONS), d'une seule couleur. La classe k-… donne la teinte, choisie par le fond (papier ou image) dans la feuille de style. */
  const P = (n, cls, sz) => { const o = ICONS[n]; return '<svg' + (cls ? ' class="' + cls + '"' : '') + ' viewBox="0 0 ' + (o.w || 24) + ' 24"' + (sz ? ' width="' + sz + '" height="' + sz + '"' : '') + ' aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="' + o.d + '"/></svg>'; };
  /* trois icônes manquent à la planche (bois, pierre, deuil) : tracés provisoires, au même trait */
  const S = (body, cls) => '<svg class="' + cls + '" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.650" stroke-linecap="round" stroke-linejoin="round">' + body + '</svg>';
  const I = {
    food: P('nourriture', 'i k-food'), roof: P('toit', 'i k-roof'), joy: P('bonheur', 'i k-joy'),
    wood: S('<circle cx="7.500" cy="13" r="4.300"/><circle cx="7.500" cy="13" r="1.300"/><path d="M7.500 8.700h9.200a4.300 4.300 0 010 8.600H7.500M13.200 12h3M12.200 14.600h2.200"/>', 'i k-wood'),
    stone: S('<path d="M4.200 17.800l2-7.600 5.600-4 6.600 3 1.600 8.600z"/><path d="M6.200 10.200l5.200 2.800 7-3.800M11.400 13l-.5 4.800"/>', 'i k-stone'),
    fire: S('<path d="M12 3.500c.8 3 4.500 4.600 4.500 9a4.500 4.500 0 01-9 0c0-1.800.9-3 2-4 .2 1.500.8 2.200 1.500 2.400.1-2.700.4-5 1-7.400z"/>', 'i k-bad'),
    rats: S('<ellipse cx="11" cy="14.500" rx="6" ry="3.600"/><circle cx="6.200" cy="11.400" r="1.900"/><path d="M17 14.800c2.500.3 3.600-1.200 3.600-3.200M4.800 15h-1.800"/>', 'i k-bad'),
    loups: S('<circle cx="7" cy="9" r="1.800"/><circle cx="11" cy="6.500" r="1.800"/><circle cx="15.500" cy="7.500" r="1.800"/><circle cx="18.500" cy="11.500" r="1.800"/><path d="M8 17.500c0-3 2.200-5.500 4.800-5.500s4.200 2.500 4.200 5c0 1.500-1.200 2.300-2.600 2-1.300-.3-2.200-.3-3.600 0-1.600.4-2.800-.2-2.800-1.500z"/>', 'i k-bad'),
    vent: S('<path d="M3 9h10.500a2.500 2.500 0 10-2.500-2.500M3 13h15a2.500 2.500 0 11-2.500 2.500M3 17h7"/>', 'i k-fog'),
    malade: P('peine', 'i k-bad'),
    bell: S('<path d="M7 16.500V11a5 5 0 0110 0v5.500zM5 16.500h14M12 4v2M10.500 19.500a1.500 1.500 0 003 0"/>', 'i k-sun'),
    deuil: S('<path d="M7 19.500V10a5 5 0 0110 0v9.500M4.500 19.500h15M12 8.600v5M10 10.400h4"/>', 'i k-death'),
    star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + ICONS['etoile-pleine'].d + '" fill="#D99A2B"/><path fill-rule="evenodd" d="' + ICONS['etoile-vide'].d + '" fill="#6E4706"/></svg>',
    star0: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="' + ICONS['etoile-vide'].d + '" fill="currentColor" fill-opacity=".45"/></svg>',
    back: P('retour'), menu: P('carnet'), pause: P('pause'), play: P('lecture'), x: P('fermer', '', 24), book: P('livre'), sp1: P('vitesse-1'), sp2: P('vitesse-2'), sp4: P('vitesse-4'),
    ok: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.500l3.200 3.200L13 4.800" fill="none" stroke="currentColor" stroke-width="2.200" stroke-linecap="round" stroke-linejoin="round"/></svg>', no: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="2.200" stroke-linecap="round"/></svg>', snd: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.500h3.500L12 5.500v13l-4.500-4H4z" fill="currentColor"/><path d="M15.500 9a4.200 4.200 0 010 6M18 6.500a8 8 0 010 11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>', mute: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.500h3.500L12 5.500v13l-4.500-4H4z" fill="currentColor"/><path d="M16 9.500l5 5M21 9.500l-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    ppl: P('villageois', 'i k-ppl'), ppl2: P('nouveaux-venus', 'i k-ppl'), soi: P('soi', 'i k-ppl'), autre: P('autre', 'i k-ppl'),
    storm: P('orage', 'i k-storm'), frost: P('gel', 'i k-frost'), fog: P('brume', 'i k-fog'), sun: P('soleil', 'i k-sun'), moon: P('lune', 'i k-moon'),
    chantier: P('chantier', 'i'), work: P('travail', 'i k-work'), repas: P('repas', 'i'), coucher: P('coucher', 'i'), nuit: P('nuit', 'i'),
    faim: P('faim', 'i k-bad'), dehors: P('dehors', 'i k-bad'), dort: P('dort', 'i k-moon'),
    defis: P('defis'), sandbox: P('bac-a-sable'), cards: P('cartes'), options: P('options'), music: P('musique'), nature: P('nature'), sonvillage: P('village'), ui: P('interface'),
    leaf: P('feuille'), drop: P('goutte'), hameau: P('hameau'),
    cueilleur: P('cueilleur', 'i k-work'), bucheron: P('bucheron', 'i k-work'), paysan: P('jardinier', 'i k-work'), pecheur: P('pecheur', 'i k-work'), carrier: P('tailleur', 'i k-work'), boulanger: P('boulanger', 'i k-work'), none: P('sans-poste', 'i k-sad'),
    espoir: P('espoir', 'i k-hope'), crainte: P('crainte', 'i k-fear'), content: P('contentement', 'i k-calm'), peine: P('peine', 'i k-sad'), amitie: P('amitie', 'i k-friend'), heart: P('amour', 'i k-love'), amour: P('amour', 'i k-love'), rancoeur: P('rancoeur', 'i k-grudge'),
    grave: P('mort', 'i k-death'), village: P('village', 'i k-roof')
  };
  /* ce que l'on dit des événements : leur nom, et en une ligne ce qu'ils empêchent */
  const EV = {
    arrivals: { icon: 'ppl2', ic: e => e.villagers.length > 1 ? I.ppl2 : I.ppl, name: e => e.villagers.length > 1 ? e.villagers.length + ' nouveaux venus' : 'Un nouveau venu' },
    storm: { icon: 'storm', name: () => 'Orage', tip: 'la rivière ne se passe plus, on ne pêche pas' },
    frost: { icon: 'frost', name: e => e.len ? 'Gel de ' + e.len + ' jours' : 'Gel', tip: 'plus de récoltes, et une nuit dehors tue' },
    sick: { icon: 'malade', name: () => 'Maladie', tip: 'un villageois alité deux jours ; elle passe à qui dort sous le même toit' },
    fire: { icon: 'fire', name: () => 'Incendie', tip: 'un bâtiment de bois brûle ce soir, sauf si un puits l’éteint' },
    wolves: { icon: 'loups', name: () => 'Loups', tip: 'ils emportent qui dort dehors, sinon des vivres ; un braséro les tient loin' },
    drought: { icon: 'sun', name: e => 'Sécheresse' + (e.len > 1 ? ' de ' + e.len + ' jours' : ''), tip: 'plus de pêche, et les potagers à moitié sans puits' },
    wind: { icon: 'vent', name: () => 'Grand vent', tip: 'ce soir, il emporte tentes, abris et constructions légères' },
    flood: { icon: 'storm', name: () => 'Crue', tip: 'ce soir, elle emporte les bâtiments proches de l’eau, sauf s’il y a une digue' },
    rats: { icon: 'rats', name: () => 'Rats', tip: 'ils pillent la réserve cette nuit, sauf garde-manger ou cellier' },
    fog: { icon: 'fog', name: () => 'Brume', tip: 'ni forêt, ni rochers, ni bois mort' }
  };
  const evLab = e => e.cont ? EV[e.type].name({}) + ', jour ' + e.cont + ' sur ' + e.len + (EV[e.type].tip ? ' : ' + EV[e.type].tip : '') : EV[e.type].name(e) + (EV[e.type].tip ? ' : ' + EV[e.type].tip : '');
  const INFO = { cabane: 'Deux places, à qui en a besoin.', cabanon: 'Une place, à qui en a besoin.', maison: 'Deux places, pour de bon.', cueillette: 'Baies de l’autre rive.', potager: 'Légumes du village.', bucheron: 'Arbres de la lisière.', pecheur: 'Poisson de la rivière.', carriere: 'Pierre des rochers.', four: 'Pain cuit sur place.', table: 'Si tous mangent, la joie monte.', abri: 'Quatre places, pour deux nuits seulement.', dortoir: 'Quatre places, à qui en a besoin.', poulailler: 'Des œufs, par tous les temps.', champi: 'Peu de chose, sauf dans la brume ou après la pluie.', rucher: 'Du miel, sans personne. Craint le gel.', serre: 'Garde du gel potagers, ruches et fleurs.', fanal: 'Dans la brume, il guide vers la forêt et les rochers.', jardin: 'Un peu de joie chaque jour. Craint le gel.', kiosque: 'De la musique, et de la joie chaque soir.', moulin: 'Chaque four donne deux pains de plus.', cloche: 'On la sonne : dans deux jours, quelqu’un l’aura entendue.',
    grange: 'Six places dans le foin, à qui en a besoin.', chaumiere: 'Trois places, pour de bon.', tente: 'Deux places, pour trois nuits seulement.', auberge: 'Deux places. Chaque nouveau venu y laisse deux provisions.',
    verger: 'Deux fruits par jour, à partir du surlendemain. Craint le gel.', bergerie: 'Du lait et du fromage, par tous les temps.', fumoir: 'Chaque pêcheur rapporte un poisson de plus.', puits: 'Chaque potager donne un légume de plus.',
    etal: 'Chaque jour, deux bois contre deux nourritures.', gardemanger: 'Quand la réserve est vide, il reste un repas.', scierie: 'Trois bois par jour, même dans la brume.', menuiserie: 'Chaque chantier coûte un bois de moins.',
    taillerie: 'Chaque chantier coûte une pierre de moins.', bucher: 'Qui glane rapporte un bois de plus.', digue: 'Sous l’orage, le pont tient et la rivière se laisse approcher.', brasero: 'Une nuit de gel dehors n’est plus mortelle.',
    rubans: 'Un peu de joie chaque jour, même sous le gel.', bains: 'Chaque jour, un bois contre deux joies.', pressoir: 'Du cidre, et de la joie chaque soir.', cellier: 'Une joie par soir, tant que la réserve est pleine.' };
  const RESN = { food: 'Nourriture', wood: 'Bois', stone: 'Pierre' }, LACK = { food: 'Nourriture insuffisante', wood: 'Bois insuffisant', stone: 'Pierre insuffisante' };
  const VOLS = [['music', 'Musique', 'note'], ['nature', 'Nature', 'splash'], ['village', 'Village', 'hammer'], ['ui', 'Interface', 'card']];
  const ORDER = SIM.LEVELS.reduce((a, l) => a.concat(l.ch), []);
  const lvlOf = id => SIM.LEVELS.findIndex(l => l.ch.includes(id));

  let save = { stars: {}, tuto: {}, vol: {}, theme: 'carnet', bub: 'phrases' };
  try { Object.assign(save, JSON.parse(localStorage.getItem('hameau.v2') || '{}')); } catch (e) { /* stockage indisponible */ }
  const persist = () => { try { localStorage.setItem('hameau.v2', JSON.stringify(save)); } catch (e) { /* idem */ } };
  for (const v of VOLS) if (save.vol[v[0]] != null) SFX.setVol(v[0], save.vol[v[0]]);

  let lastT = 0, coach = null, modalKind = null, tuto = false, seen = {}, selCard = null, inspect = null, cache = new Map(), chId = 'c1', vbtn = [], t0menu = 0, usesStone = false, msgN = -1, trail = [], turning = 0;
  const bubEl = new Map(), POSI = { espoir: 1, content: 1, amour: 1 }, BUBS = [['phrases', 'Phrases'], ['icones', 'Icônes seules'], ['aucune', 'Aucune']];
  const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const names = l => l.length <= 1 ? (l[0] || '') : l.slice(0, -1).join(', ') + ' et ' + l[l.length - 1];
  const de = n => (/^[AEIOUYHÉÈ]/i.test(n) ? 'd’' : 'de ') + n;
  function set(el, key, val, fn) { if (cache.get(key) === val) return false; cache.set(key, val); if (fn) fn(val); else el.textContent = val; return true; }
  function portrait(c, v, outfit) {
    const px = 124; c.width = px; c.height = px; const g = c.getContext('2d'), k = px / 62, m = ART.MORPH[v.morph];
    g.scale(k, k); g.translate(31 - 50, 30 - (m.top - 22)); ART.drawPawn(g, v, outfit || 'civil', 'f');
  }
  function illus(c, type) {
    const def = SIM.BT[type], w = c.width = 240, h = c.height = 140, g = c.getContext('2d');
    const gr = g.createRadialGradient(w / 2, h * 0.55, 10, w / 2, h / 2, 150); gr.addColorStop(0, '#B9BE78'); gr.addColorStop(1, '#8C9A5C'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const r = SIM.rngOf(type.length * 13 + 5), LEAF = ['#D9823A', '#C2502F', '#E3B54A'];
    for (let i = 0; i < 16; i++) { g.fillStyle = LEAF[i % 3]; g.globalAlpha = 0.75; g.beginPath(); g.ellipse(r() * w, r() * h, 4, 2, r() * 3, 0, 6.3); g.fill(); } g.globalAlpha = 1;
    const k = Math.min(w * 0.7 / def.w, h * 0.8 / def.h); g.translate(w / 2 - def.w * k / 2, h / 2 - def.h * k / 2 + 2); g.scale(k, k);
    g.fillStyle = 'rgba(23,20,42,.22)'; g.fillRect(5, 6, def.w, def.h); ART.drawExterior(g, type, def.w, def.h);
    if (type === 'moulin') { g.translate(def.w / 2, (def.h - ART.FH) / 2); ART.drawSails(g, 0.5); }
  }
  const paint = root => root.querySelectorAll('canvas[data-t]').forEach(c => illus(c, c.dataset.t));
  const stars = (n, big) => { let s = ''; for (let i = 0; i < 3; i++) s += i < n ? I.star : I.star0; return '<span class="' + (big ? 'bigstars' : 'stars') + '" role="img" aria-label="' + n + ' étoile' + (n > 1 ? 's' : '') + ' sur 3">' + s + '</span>'; };
  /* ce que fait un bâtiment, en un chiffre, une icône et quelques mots */
  const FAM = [['Dormir', ['cabane', 'cabanon', 'maison', 'dortoir', 'chaumiere', 'grange', 'auberge', 'abri', 'tente']], ['Manger', ['cueillette', 'potager', 'pecheur', 'four', 'poulailler', 'bergerie', 'champi', 'rucher', 'verger', 'moulin', 'fumoir', 'puits', 'etal', 'gardemanger']],
    ['Bâtir', ['bucheron', 'carriere', 'scierie', 'bucher', 'menuiserie', 'taillerie']], ['Se réjouir', ['table', 'jardin', 'rubans', 'kiosque', 'pressoir', 'bains', 'cellier']], ['Tenir tête au ciel', ['serre', 'fanal', 'digue', 'brasero', 'cloche']]];
  const BOOSTL = { four: 'par boulanger', pecheur: 'par pêcheur', potager: 'par jardinier', glean: 'par glaneur' }, ANTIL = { frost: ['frost', 'abrite les jardins'], fog: ['fog', 'guide dans la brume'], storm: ['storm', 'retient la rivière'], cold: ['frost', 'le gel ne tue plus'] };
  const resOf = o => Object.keys(o).map(k => o[k] + I[k]).join(' ');
  /* ce que fait une carte : [valeur, icône, précision] */
  function effect(type, small) {
    const d = SIM.BT[type], jy = SIM.CHALLENGES[chId].joy, bk = d.boost && Object.keys(d.boost)[0], gk = d.give && Object.keys(d.give)[0];
    const m = d.beds ? ['+' + d.beds, I.roof, d.own ? 'à demeure' : d.life ? d.life + ' nuits' : '']
      : d.joy ? ['+' + d.joy, I.joy, 'si tous mangent']
      : d.play ? ['+' + d.play, I.joy, 'par soir']
      : d.give ? ['+' + d.give[gk], I[gk], 'par jour' + (d.wait ? ', après ' + d.wait + ' jours' : '')]
      : d.boost ? ['+' + d.boost[bk], I[bk === 'glean' ? 'wood' : SIM.BT[bk].out], BOOSTL[bk]]
      : d.swap ? [small ? resOf(d.swap.take) + ' › ' : '', small ? resOf(d.swap.give) : '<b class="sw">' + resOf(d.swap.take) + ' › ' + resOf(d.swap.give) + '</b>', 'par jour']
      : d.discount ? ['−' + d.discount[Object.keys(d.discount)[0]], I[Object.keys(d.discount)[0]], 'par chantier']
      : d.plenty ? ['+' + d.plenty, I.joy, 'réserve pleine']
      : d.ration ? ['+' + d.ration, I.food, 'quand tout manque']
      : d.call ? ['+1', I.ppl, 'dans ' + d.call + ' jours']
      : d.anti ? ['', I[ANTIL[d.anti][0]], ANTIL[d.anti][1]]
      : ['+' + d.per * d.posts + (d.wet ? ' à ' + d.wet : ''), I[d.out], 'par jour'];
    if (small) return m[0] + m[1];
    return '<span class="ce">' + (m[0] ? '<b>' + m[0] + '</b>' : '') + m[1] + (m[2] ? '<small>' + m[2] + '</small>' : '') + '</span>' + (d.posts ? '<span class="cw">' + I.ppl + '<span>× ' + d.posts + '</span></span>' : '') + (d.own && jy ? '<span class="cw">' + I.joy + '<span>+1 par habitant</span></span>' : '') + (d.welcome ? '<span class="cw">' + I.food + '<span>+' + d.welcome + ' par nouveau venu</span></span>' : '');
  }
  const deckHtml = (list, cls) => '<div class="' + cls + '">' + list.map(t => '<span class="dk"><canvas data-t="' + t + '" aria-hidden="true"></canvas>' + SIM.BT[t].name + '<small><span>' + Object.keys(SIM.BT[t].cost).map(k => SIM.BT[t].cost[k] + I[k]).join(' ') + '</span><span>→ ' + effect(t, true) + '</span></small></span>').join('') + '</div>';
  const goalsHtml = (c, ok) => '<ul class="goals">' + c.goals.map((g, i) => '<li class="' + (ok && !ok[i] ? 'ko' : '') + '"><span class="st">' + (ok ? (ok[i] ? I.star : I.star0) : I.star.repeat(i + 1)) + '</span>' + g.t + '</li>').join('') + '</ul>';
  const nextSeed = {}, seedFor = id => nextSeed[id] != null ? nextSeed[id] : (nextSeed[id] = (Math.random() * 4294967296) >>> 0);
  const voiceHtml = (c, by) => '<p class="voice">« ' + c.voice.text + ' »<span>— ' + by + '</span></p>';
  const volsHtml = () => VOLS.map(v => '<div class="opt-row"><label for="v_' + v[0] + '">' + I[v[0] === 'village' ? 'sonvillage' : v[0]] + v[1] + '</label><input type="range" id="v_' + v[0] + '" min="0" max="100" step="5" value="' + Math.round(SFX.vol[v[0]] * 100) + '"></div>').join('');
  function bindVols(root) { for (const v of VOLS) { const e = root.querySelector('#v_' + v[0]); if (!e) continue; e.oninput = () => { save.vol[v[0]] = e.value / 100; SFX.setVol(v[0], e.value / 100); }; e.onchange = () => { persist(); SFX.play(v[2]); }; } }

  /* la frise d'un défi : ses jours, et ce qui y est annoncé (on touche une pastille pour le lire) */
  function frise(c, day) {
    let h = '<div class="frise" role="group" aria-label="Les ' + c.days + ' jours du défi">';
    for (let d = c.survival ? day : 1; d <= (c.survival ? day + 2 : c.days); d++) {
      const e = (c.survival ? SIM.eventsOn(GAME.st, d) : (c.events || []).filter(x => x.day === d)).concat(contOn(c, c.survival ? GAME.st : null, d).map(x => Object.assign({}, x, { cont: d - x.day + 1 }))), lab = 'Jour ' + d + (e.length ? ' · ' + e.map(evLab).join(' ; ') : '');
      h += '<button class="fd' + (d < day ? ' past' : d === day ? ' now' : '') + (e.length ? ' ev' : '') + '" data-d="' + d + '" data-lab="' + lab + '" aria-label="' + lab + '">' + (e.length ? e.map(x => (EV[x.type].ic ? EV[x.type].ic(x) : I[EV[x.type].icon])).join('') : d) + '</button>';
    }
    return h + '</div><div class="flab" aria-live="polite"></div>';
  }
  function bindFrise(root) { const l = root.querySelector('.flab'); root.querySelectorAll('.fd').forEach(b => { b.onclick = () => { l.textContent = b.dataset.lab; }; }); }
  /* ce qui dure : une sécheresse ou un gel de plusieurs jours se rappelle chaque matin qu'il tient encore */
  const contOn = (c, st, d) => (c.survival ? (st && st.ev) || [] : c.events || []).filter(x => x.len > 1 && d > x.day && d < x.day + x.len && !(x.sudden && st && x.day > st.day));
  const evBtns = st => SIM.eventsOn(st).concat(contOn(SIM.CHALLENGES[st.ch], st, st.day).map(x => Object.assign({}, x, { cont: st.day - x.day + 1 }))).map(e => '<button class="evb" data-lab="' + evLab(e) + '" aria-label="' + evLab(e) + '">' + (EV[e.type].ic ? EV[e.type].ic(e) : I[EV[e.type].icon]) + '</button>').join('');

  /* ---------- écran titre ---------- */
  function showTitle() {
    if (GAME.phase !== 'menu' || !GAME.st) GAME.attract(); /* le village du titre continue de vivre : on ne le remet pas à zéro en refermant le livre */ R.setView('day'); R.resetZoom(); closeModal(); closeInspect(); endCoach(); hud.hidden = true; bottom.hidden = true; book.hidden = true;
    titleEl.hidden = false; titleEl.classList.remove('leaving'); book.classList.remove('opening');
  }
  /* du titre au livre : l'herbier arrive fermé, sa couverture s'ouvre, des feuilles s'en échappent dans une lumière dorée, et le sommaire s'écrit */
  let opening = false;
  const COVER = '<h2 class="logo" aria-hidden="true">Hameau</h2><span class="cs">carnet d’un village</span><span class="co">' + I.leaf + '</span>';
  /* refermer le livre : la couverture se rabat, et l'on retrouve l'écran du titre avec « Commencer » */
  function closeBook() {
    if (opening) return; opening = true; SFX.play('page');
    const cov = document.createElement('div'); cov.className = 'pleaf cover shut'; cov.innerHTML = COVER; book.appendChild(cov);
    setTimeout(() => book.classList.add('closing'), 640);
    setTimeout(() => { cov.remove(); showTitle(); book.classList.remove('closing'); opening = false; }, 1180);
  }
  function begin() {
    if (opening) return; opening = true; SFX.unlock();
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) { opening = false; SFX.play('page'); openBook([['toc']]); return; }
    titleEl.classList.add('leaving'); openBook([['toc']]); titleEl.hidden = false; book.classList.add('opening'); pageEl.classList.add('intro');
    const mk = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html || ''; book.appendChild(d); return d; }, tmp = [];
    tmp.push(mk('glow'));
    [0.36, 0.2].forEach(d => { const sh = mk('pleaf sh'); sh.style.setProperty('--d', (1.05 + d) + 's'); tmp.push(sh); });
    const cov = mk('pleaf cover', COVER); tmp.push(cov);
    const fly = mk('motes'), TINT = ['#C8662F', '#D9A441', '#B5452E', '#8C3B4A', '#E7B85A', '#7E9450']; tmp.push(fly);
    for (let k = 0; k < 22; k++) {
      const m = document.createElement('span'), leafy = k % 3 !== 2, r = Math.random; m.className = leafy ? 'mt lf' : 'mt dot'; if (leafy) m.innerHTML = I.leaf;
      m.style.cssText = 'top:' + (12 + r() * 76) + '%;color:' + TINT[k % 6] + ';--s:' + (leafy ? 14 + r() * 14 : 3 + r() * 4) + 'px;--dx:' + (90 + r() * 300) + 'px;--dy:' + (-170 + r() * 250) + 'px;--r:' + (-260 + r() * 520) + 'deg;--t:' + (1.7 + r() * 1.5) + 's;--d:' + (1.05 + r() * 0.75) + 's';
      fly.appendChild(m);
    }
    SFX.play('open');
    setTimeout(() => { titleEl.hidden = true; }, 850);
    setTimeout(() => cov.classList.add('go'), 950);
    setTimeout(() => book.classList.remove('opening'), 2900);   // le sommaire est lisible : on peut déjà le toucher
    setTimeout(() => { tmp.forEach(n => n.remove()); pageEl.classList.remove('intro'); opening = false; }, 4300);
  }


  /* ---------- le livre : sommaire, défis, niveaux, fiches, options ---------- */
  const back = '<button class="pback" data-back="1">' + I.back + 'Retour</button>';
  const PAGES = {
    toc: () => '<button class="pback" data-close="1">' + I.back + 'Fermer le livre</button><h2 class="logo" aria-label="Hameau">Hameau</h2><div class="orn">' + I.leaf + '</div><div class="toc">' +
      [['levels', 'Défis', ''], ['survival', 'Survie', ''], ['sandbox', 'Bac à sable', 'bientôt'], ['cards', 'Cartes', ''], ['options', 'Options', '']].map((p, i) => '<button class="tl' + (p[2] ? ' soon' : '') + '" data-go="' + p[0] + '"><span class="ti">' + I[p[0] === 'levels' ? 'defis' : p[0] === 'survival' ? 'grave' : p[0]] + '</span><b>' + p[1] + '</b><span class="dots"></span><span class="pn">' + (p[2] || 'p. ' + (i + 2)) + '</span></button>').join('') + '</div><div class="ham">' + I.hameau + '</div><div class="pfoot">— 1 —</div>',
    levels: () => back + '<h2>Défis</h2><div class="toc">' + SIM.LEVELS.map((lv, i) => {
      const got = lv.ch.reduce((a, id) => a + (save.stars[id] || 0), 0);
      return '<button class="tl" data-level="' + i + '"><span class="tb"><b>' + lv.name + '</b><em>Niveau ' + (i + 1) + ' · ' + lv.sub + '</em></span><span class="dots"></span><span class="pn">' + I.star + got + '/' + lv.ch.length * 3 + '</span></button>';
    }).join('') + '</div><div class="pfoot">— 2 —</div>',
    level: i => back + '<h2><small>Niveau ' + (i + 1) + '</small>' + SIM.LEVELS[i].name + '</h2><div class="toc">' + SIM.LEVELS[i].ch.map(id => '<button class="tl" data-ch="' + id + '"><b>' + SIM.CHALLENGES[id].title + '</b><span class="dots"></span>' + stars(save.stars[id] || 0) + '</button>').join('') + '</div>',
    fiche: id => {
      const c = SIM.CHALLENGES[id];
      return back + '<h2><small>Niveau ' + (lvlOf(id) + 1) + ' · Défi ' + c.n + '</small>' + c.title + '</h2>' + voiceHtml(c, SIM.cast(window.SEED != null ? window.SEED : seedFor(id), 1)[0].name) + frise(c, 0) +
        '<div class="tabs" role="tablist"><button class="tab" role="tab" aria-selected="false" data-tab="cards">Cartes</button><button class="tab" role="tab" aria-selected="false" data-tab="goals">Objectifs</button></div><div class="tabp" id="tabp"></div>' +
        '<div class="pact">' + stars(save.stars[id] || 0) + '<button class="tlink" id="bgo" data-snd="1">Commencer</button></div>';
    },
    survival: () => back + '<h2>Survie</h2><p class="voice">« Nous ne savions pas combien de jours. Nous avons compté quand même. »</p>' +
      '<p class="note">Quatre villageois, une cabane pour deux, presque rien en réserve. Des jours sans fin. Les cartes viennent presque au hasard, le ciel se fait plus dur de semaine en semaine. Les métiers se redistribuent chaque matin ; qui perd un proche ne travaille pas le lendemain. Tout s’arrête quand il ne reste qu’une personne.</p>' +
      '<p class="rec">' + ([save.best4 ? 'Record : <b>' + jours(save.best4) + '</b>' : '', kept() ? 'Partie en cours : <b>jour ' + kept().day + '</b>, ' + kept().n + ' villageois.' : ''].filter(Boolean).join('<br>') || 'Aucune partie encore.') + '</p><div class="acts">' + (kept() ? '<button class="tlink quiet" id="bsurv">Nouvelle partie</button><button class="tlink" id="bcont">Reprendre</button>' : '<span></span><button class="tlink" id="bsurv">Commencer</button>') + '</div>',
    sandbox: () => back + '<h2>Bac à sable</h2><p class="voice">Un village sans échéance, pour le seul plaisir de le regarder vivre.</p><p class="note">Bientôt.</p>',
    cards: () => { const seen = new Set(FAM.flatMap(f => f[1])), rest = Object.keys(SIM.BT).filter(t => !seen.has(t)); return back + '<h2>Cartes</h2><p class="note">' + Object.keys(SIM.BT).length + ' bâtiments, pour l’instant.</p>' + FAM.concat(rest.length ? [['Et encore', rest]] : []).map(f => '<h3 class="fam">' + f[0] + '</h3>' + deckHtml(f[1].filter(t => SIM.BT[t]), 'gal')).join(''); },
    options: () => back + '<h2>Options</h2><div class="h3">Son</div>' + volsHtml() +
      '<div class="h3">Bulles des villageois</div><div class="segs">' + BUBS.map(b => '<button class="seg" data-bub="' + b[0] + '" aria-pressed="' + (save.bub === b[0]) + '">' + b[1] + '</button>').join('') + '</div>' +
      '<div class="h3">Progression</div><p class="note">' + Object.values(save.stars).reduce((a, b) => a + b, 0) + ' étoiles sur ' + ORDER.length * 3 + '</p><div class="pfoot">Prototype 0.16</div>'
  };
  function bindPage(name, arg) {
    paint(pageEl);
    pageEl.querySelectorAll('[data-back]').forEach(b => b.onclick = goBack); pageEl.querySelectorAll('[data-close]').forEach(b => b.onclick = closeBook); { const bs = pageEl.querySelector('#bsurv'), bc = pageEl.querySelector('#bcont'); if (bs) twice(bs, 'Effacer la partie en cours ?', () => startChallenge('survie')); if (bc) bc.onclick = () => startChallenge('survie', kept()); }
    pageEl.querySelectorAll('[data-go]').forEach(b => b.onclick = () => go(b.dataset.go));
    pageEl.querySelectorAll('[data-level]').forEach(b => b.onclick = () => go('level', +b.dataset.level));
    pageEl.querySelectorAll('[data-ch]').forEach(b => b.onclick = () => go('fiche', b.dataset.ch));
    if (name === 'fiche') {
      const c = SIM.CHALLENGES[arg], tp = $('#tabp'); bindFrise(pageEl);
      pageEl.querySelectorAll('.tab').forEach(t => t.onclick = () => {
        const on = t.getAttribute('aria-selected') !== 'true'; pageEl.querySelectorAll('.tab').forEach(o => o.setAttribute('aria-selected', o === t && on));
        tp.innerHTML = !on ? '' : t.dataset.tab === 'cards' ? deckHtml(c.deck, 'deck') : goalsHtml(c); paint(tp);
      });
      $('#bgo').onclick = () => { SFX.play('go'); startChallenge(arg); };
    }
    if (name === 'options') {
      bindVols(pageEl);
      pageEl.querySelectorAll('.seg').forEach(b => b.onclick = () => { save.bub = b.dataset.bub; persist(); pageEl.querySelectorAll('.seg').forEach(o => o.setAttribute('aria-pressed', o === b)); });
    }
  }
  function render(e) { pageEl.innerHTML = PAGES[e[0]](e[1]); pageEl.scrollTop = 0; bindPage(e[0], e[1]); }
  /* tourner la page : une feuille pivote autour de la reliure */
  function turn(dir, e) {
    SFX.play('page'); const leaf = document.createElement('div'), id = ++turning; let done = false;
    const end = () => { if (done) return; done = true; if (dir < 0 && id === turning) render(e); leaf.remove(); };
    if (dir > 0) { leaf.className = 'pleaf out'; leaf.innerHTML = pageEl.innerHTML; paint(leaf); book.appendChild(leaf); render(e); }
    else { leaf.className = 'pleaf in'; leaf.innerHTML = PAGES[e[0]](e[1]); paint(leaf); book.appendChild(leaf); }
    leaf.onanimationend = end; setTimeout(end, 760);
  }
  function go(name, arg) { const e = [name, arg]; trail.push(e); turn(1, e); }
  function goBack() {
    if (trail.length < 2) return; trail.pop(); const e = trail[trail.length - 1];
    if (e[0] === 'title') { book.hidden = true; return showTitle(); }
    turn(-1, e);
  }
  function openBook(tr) { trail = tr; closeModal(); closeInspect(); endCoach(); hud.hidden = true; bottom.hidden = true; titleEl.hidden = true; book.hidden = false; render(trail[trail.length - 1]); if (GAME.phase !== 'menu') { GAME.attract(); R.setView('day'); } }
  const trailTo = id => [['toc'], ['levels'], ['level', lvlOf(id)]];

  function closeModal() { modal.hidden = true; modal.innerHTML = ''; modalKind = null; }
  function openModal(kind, html) { modalKind = kind; modal.innerHTML = '<div class="sheet" role="dialog" aria-modal="true">' + html + '</div>'; modal.hidden = false; }
  function startChallenge(id, again) {
    const c = SIM.CHALLENGES[id];
    chId = id; closeModal(); book.hidden = true; titleEl.hidden = true; hud.hidden = false; bottom.hidden = false; cache.clear(); seen = {};
    tuto = !!c.tutorial && !save.tuto[id];
    usesStone = !!c.stone || c.deck.some(t => SIM.BT[t].cost.stone || SIM.BT[t].out === 'stone');
    $('#res').innerHTML = [['food', 'rFood', 'Nourriture'], ['wood', 'rWood', 'Bois'], usesStone && ['stone', 'rStone', 'Pierre'], c.joy && ['joy', 'rJoy', 'Bonheur'], ['roof', 'rRoof', 'Places pour dormir']].filter(Boolean).map(r => '<span class="r" id="' + r[1] + '" title="' + r[2] + '" role="img" aria-label="' + r[2] + '">' + I[r[0]] + '<b>0</b></span>').join('');
    $('#res').classList.toggle('four', (usesStone ? 1 : 0) + (c.joy ? 1 : 0) > 0); vbtn = []; $('#vbar').innerHTML = ''; const sd = nextSeed[id]; delete nextSeed[id];
    if (c.survival && !again) { delete save.surv; persist(); } // une nouvelle survie remplace la partie gardée
    if (again) { try { GAME.resume(again); return; } catch (e) { delete save.surv; persist(); } } // sauvegarde illisible : on repart de zéro
    GAME.start(id, sd);
  }
  const jours = n => n + ' jour' + (n > 1 ? 's' : '');
  const kept = () => save.surv && save.surv.v === 1 && save.surv.st ? save.surv : null;
  /* un bouton qui efface une partie demande d'être touché deux fois */
  const twice = (b, ask, go) => { let armed = false; b.onclick = () => { if (armed || !kept()) return go(); armed = true; b.textContent = ask; b.classList.add('warn'); setTimeout(() => { if (b.isConnected && armed) { armed = false; b.textContent = b.dataset.lab; b.classList.remove('warn'); } }, 4000); }; b.dataset.lab = b.textContent; };
  function buildHud(villagers) {
    const vb = $('#vbar'); vb.classList.toggle('many', villagers.length > 7);
    villagers.forEach((v, i) => {
      if (vbtn[i]) return;
      const b = document.createElement('button'); b.className = 'vb'; b.dataset.snd = '1'; b.setAttribute('aria-label', v.name); b.innerHTML = '<canvas aria-hidden="true"></canvas><span class="vn">' + v.name + '</span><span class="bad"></span>';
      b.onclick = () => { SFX.play('voice', 0, i); showVillager(i); }; vb.appendChild(b); vbtn.push({ b, cv: b.querySelector('canvas'), bad: b.querySelector('.bad') });
    });
  }
  function dayTitle(st) {
    const e = $('#daytitle'), ev = SIM.eventsOn(st).map(x => EV[x.type].name(x)).join(' · ');
    e.innerHTML = '<b>Jour ' + st.day + '</b><span>' + (ev || (st.day === st.days ? 'le dernier' : '')) + '</span>'; e.hidden = true; void e.offsetWidth; e.hidden = false; e.onanimationend = () => { e.hidden = true; };
  }

  /* ---------- matin : les cartes du jour ---------- */
  const planY = () => Math.max(GAME.map.fire.y + 90, ...GAME.st.buildings.map(b => b.y + b.h + 22));
  function renderMorning() {
    const st = GAME.st, n = GAME.cards.length; selCard = null; closeInspect(); buildHud(st.villagers);
    /* parti de rien : le premier matin, il n'y a rien à bâtir — la journée commence d'elle-même */
    const surv = !!SIM.CHALLENGES[chId].survival, jb = surv ? '<button class="tlink jb" id="bjobs" data-snd="1">Métiers</button>' : '';
    if (!n && surv) { bottom.innerHTML = '<div class="mhead"><h2>Jour ' + st.day + '</h2>' + evBtns(st) + jb + '</div><div class="mfoot"><span class="hint" id="mhint" style="text-align:left">Plus de place pour bâtir.</span><button class="tlink" id="bskip" data-snd="1">Commencer</button></div>'; R.setView('day'); bottom.querySelectorAll('.evb').forEach(b => b.onclick = () => { $('#mhint').textContent = b.dataset.lab; }); $('#bjobs').onclick = () => openJobs(); $('#bskip').onclick = () => GAME.choose(null); return; }
    if (!n) { bottom.innerHTML = '<div class="mhead"><h2>Jour ' + st.day + '</h2>' + evBtns(st) + '<em>Plus de place pour bâtir : la journée commence.</em></div>'; R.setView('day'); bottom.querySelectorAll('.evb').forEach(b => b.onclick = () => GAME.say(b.dataset.lab)); setTimeout(() => { if (GAME.phase === 'morning' && GAME.st === st) GAME.choose(null); }, 2300); return; }
    { const c0 = SIM.CHALLENGES[chId]; if (st.day === 1 && !c0.food && !c0.wood && !c0.stone && GAME.cards.every(t => SIM.blocked(st, t))) {
      bottom.innerHTML = '<div class="mhead"><h2>Jour 1</h2><em>Les mains vides : ce matin, on ne bâtit rien.</em></div>'; R.setView('day');
      setTimeout(() => { if (GAME.phase === 'morning' && GAME.st === st) GAME.choose(null); }, 2100); return; } }
    let h = '<div class="mhead"><h2>Jour ' + st.day + '</h2>' + evBtns(st) + (surv ? jb : SIM.eventsOn(st).length > 1 ? '' : '<em>Que bâtir aujourd’hui ?</em>') + '</div><div class="fan">';
    GAME.cards.forEach((type, i) => {
      const d = SIM.BT[type], bk = SIM.blocked(st, type), cst = SIM.costOf(st, type), tag = bk === 'cost' ? LACK[SIM.RES.find(r => st[r] < (cst[r] || 0))] : bk === 'room' ? 'Plus de place' : '', o = i - (n - 1) / 2;
      const cost = Object.keys(cst).map(k => '<span class="cc' + (cst[k] < d.cost[k] ? ' less' : '') + '" aria-label="' + cst[k] + ' ' + RESN[k].toLowerCase() + '">' + I[k] + cst[k] + '</span>').join('');
      h += '<button class="card' + (bk ? ' off' : '') + '" style="--r:' + o * 5 + 'deg;--y:' + Math.abs(o) * 8 + 'px;--d:' + (0.15 + i * 0.1) + 's" data-type="' + type + '" data-snd="1" aria-pressed="false"><canvas data-t="' + type + '" aria-hidden="true"></canvas><span class="costs">' + cost + '</span><span class="cn">' + d.name + '</span>' + effect(type) + (tag ? '<span class="tag">' + tag + '</span>' : '') + '</button>';
    });
    h += '</div><div class="mfoot"><button class="tlink quiet" id="bskip">Ne rien bâtir</button><span class="hint" id="mhint"></span><button class="tlink" id="bbuild" data-snd="1" hidden>Bâtir</button></div>';
    bottom.innerHTML = h; paint(bottom);
    const fan = bottom.querySelector('.fan'), clear = () => { bottom.querySelectorAll('.card').forEach(o => { o.classList.remove('sel'); o.setAttribute('aria-pressed', false); }); fan.classList.remove('has-sel'); selCard = null; $('#bbuild').hidden = true; };
    const hint = t => { clear(); const e = $('#mhint'); e.textContent = t; e.hidden = false; };
    bottom.querySelectorAll('.evb').forEach(b => b.onclick = () => hint(b.dataset.lab));
    bottom.querySelectorAll('.card').forEach(cd => {
      cd.onclick = () => {
        if (cd.classList.contains('off')) { SFX.play('back'); return hint(cd.querySelector('.tag').textContent + '.'); }
        if (cd.classList.contains('sel')) return clear();
        SFX.play('card'); clear(); selCard = cd.dataset.type; cd.classList.add('sel'); cd.setAttribute('aria-pressed', true); fan.classList.add('has-sel'); $('#mhint').hidden = true; $('#bbuild').hidden = false;
      };
    });
    R.setView('plan', bottom.offsetHeight - 26, planY());
    $('#bbuild').onclick = () => { if (selCard) { SFX.play('go'); GAME.choose(selCard); } };
    $('#bskip').onclick = () => GAME.choose(null); if (surv) $('#bjobs').onclick = () => openJobs();
    const steps = tuto && TUTO[chId] && TUTO[chId].morning(st);
    if (steps) runCoach(steps); else dayTitle(st);
  }

  /* ---------- journée : la frise du jour, avec ses jalons ---------- */
  const JI = ['chantier', 'work', 'repas', 'coucher', 'nuit'];
  const SEG = [[T.BUILD, 0], [T.WORK, 16], [T.MEAL, 52], [T.BED, 68], [T.NIGHT, 82], [T.END, 100]];
  const tx = t => { for (let i = 1; i < SEG.length; i++) if (t <= SEG[i][0]) return SEG[i - 1][1] + (t - SEG[i - 1][0]) / (SEG[i][0] - SEG[i - 1][0]) * (SEG[i][1] - SEG[i - 1][1]); return 100; };
  function renderDay() {
    const st = GAME.st, J = [[T.BUILD, GAME.plan.nb ? 'Chantier' : 'Matin'], [T.WORK, 'Travail'], [T.MEAL, 'Repas'], [T.BED, 'Coucher'], [T.NIGHT, 'Nuit']];
    bottom.innerHTML = '<div class="daybar"><div class="dayline"><b class="dj">Jour ' + st.day + '</b>' + evBtns(st) +
      '<div class="speed" role="group" aria-label="Vitesse du temps"><button id="sp0" aria-label="Pause">' + I.pause + '</button><button id="sp1" aria-label="Vitesse normale">' + I.sp1 + '</button><button id="sp2" aria-label="Vitesse double">' + I.sp2 + '</button><button id="sp4" aria-label="Vitesse quadruple">' + I.sp4 + '</button></div></div>' +
      '<div class="track" role="img" aria-label="Déroulement de la journée"><div class="tg"></div>' + J.map((j, i) => '<i class="jal" style="left:' + SEG[i][1] + '%"></i><span class="jl" data-j="' + i + '" style="left:' + SEG[i][1] + '%;width:' + (SEG[i + 1][1] - SEG[i][1]) + '%" title="' + j[1] + '">' + I[JI[i]] + '<em>' + j[1] + '</em></span>').join('') + '<i class="jal" style="left:100%"></i><i id="fmk">' + I.sun + I.moon + '</i></div>' +
      '<div class="msg" id="msg" aria-live="polite"></div></div>';
    $('#sp0').onclick = () => { GAME.paused = !GAME.paused; syncSpeed(); };
    [1, 2, 4].forEach(s => { $('#sp' + s).onclick = () => { GAME.speed = s; GAME.paused = false; syncSpeed(); }; });
    bottom.querySelectorAll('.evb').forEach(b => b.onclick = () => GAME.say(b.dataset.lab));
    cache.delete('jal'); msgN = -1; syncSpeed(); R.setView('day');
  }
  function syncSpeed() {
    if (!$('#sp0')) return;
    $('#sp0').innerHTML = GAME.paused ? I.play : I.pause; $('#sp0').classList.toggle('on', GAME.paused); $('#sp0').setAttribute('aria-label', GAME.paused ? 'Reprendre' : 'Pause');
    [1, 2, 4].forEach(s => $('#sp' + s).classList.toggle('on', !GAME.paused && GAME.speed === s));
  }

  /* ---------- soir : bilan (on ne rejoue pas une journée) ---------- */
  function renderBilan(p) {
    closeInspect();
    const S = p.start, E = p.end, last = !!p.result, noFood = Object.values(p.sum.v).some(r => !r.ate), noRoof = Object.values(p.sum.v).some(r => !r.roof);
    let h = '<span class="sub">Soir du jour ' + p.sum.day + '</span><h2>' + (p.sum.deaths.length ? 'Le village est en deuil' : !noFood && !noRoof ? (p.end.lost && p.end.lost.length ? 'Des bâtisses en moins' : 'Une journée douce') : noFood && noRoof ? 'Une soirée difficile' : noFood ? 'Des ventres vides' : 'Une nuit dehors') + '</h2><div class="vgrid">';
    S.villagers.forEach(v => {
      const r = p.sum.v[v.id]; if (!r) return;
      h += '<div class="vcell' + (!r.ate || !r.roof ? ' bad' : '') + '"><canvas data-v="' + v.id + '" aria-hidden="true"></canvas><b>' + v.name + '</b><div class="ck"><span class="' + (r.ate ? 'yes' : '') + '" role="img" aria-label="' + (r.ate ? 'A mangé' : 'N’a pas mangé') + '">' + (r.ate ? I.food : I.faim) + '</span><span class="' + (r.roof ? 'yes' : '') + '" role="img" aria-label="' + (r.roof ? 'A dormi sous un toit' : 'A dormi dehors') + '">' + (r.roof ? I.roof : I.dehors) + '</span></div></div>';
    });
    h += '</div><div class="delta">' + SIM.RES.filter(k => k !== 'stone' || usesStone).concat(SIM.CHALLENGES[chId].joy ? ['joy'] : []).map(k => '<span>' + I[k] + S[k] + ' <i>→</i> ' + E[k] + '</span>').join('') + '</div>';
    const lines = p.log.filter(l => l.k === 'bad' || l.k === 'dead');
    if (lines.length) h += '<ul class="journal">' + lines.map(l => '<li class="bad">' + esc(l.text) + '</li>').join('') + '</ul>';
    if (!last && p.warn.length) h += '<div class="alert"><span><b>Demain :</b> ' + p.warn.map(esc).join(' ') + '</span></div>';
    if (!last) for (const e of SIM.eventsOn(E)) h += '<div class="alert ev">' + (EV[e.type].ic ? EV[e.type].ic(e) : I[EV[e.type].icon]) + '<span>Demain · <b>' + EV[e.type].name(e) + '</b></span></div>';
    h += '<div class="acts"><span></span><button class="tlink" id="bnext">' + (last ? 'Voir le résultat' : 'Jour suivant') + '</button></div>';
    openModal('bilan', h);
    modal.querySelectorAll('canvas[data-v]').forEach(c => { const v = S.villagers[+c.dataset.v]; portrait(c, v, GAME.live.jobs[v.id]); });
    $('#bnext').onclick = () => { closeModal(); GAME.next(); };
  }
  function renderEnd(r) {
    const c = SIM.CHALLENGES[chId], nextId = ORDER[ORDER.indexOf(chId) + 1];
    if (c.survival) {
      const rec = r.days > (save.best4 || 0); if (rec) save.best4 = r.days; delete save.surv; persist();
      openModal('end', '<div class="center"><span class="sub">Survie</span></div><h2 class="center big">' + jours(r.days) + '</h2><p class="voice center">' + (rec ? 'Jamais le village n’avait tenu si longtemps.' : 'Le village s’est tu. Record : ' + jours(save.best4) + '.') + '</p>' +
        '<p class="note center">' + GAME.st.graves.length + ' tombes au bord de la clairière.</p><div class="acts"><button class="tlink quiet" id="elist">Retour au livre</button><button class="tlink" id="eagain">Rejouer</button></div>');
      SFX.play(rec ? 'star' : 'fail'); $('#eagain').onclick = () => startChallenge('survie'); $('#elist').onclick = () => openBook([['toc'], ['survival']]); return;
    }
    if ((save.stars[chId] || 0) < r.stars) save.stars[chId] = r.stars;
    if (c.tutorial) save.tuto[chId] = true; persist(); tuto = false;
    const goNext = r.stars > 0 && nextId;
    openModal('end', '<div class="center"><span class="sub">' + c.title + '</span></div>' + stars(r.stars, true) + '<p class="voice center">' + c.endMsg[r.stars] + '</p>' + goalsHtml(c, r.ok) +
      '<div class="acts"><button class="tlink quiet" id="eagain">Rejouer</button><button class="tlink" id="elist">' + (goNext ? 'Défi suivant' : 'Retour au livre') + '</button></div>');
    if (r.stars) for (let i = 0; i < r.stars; i++) setTimeout(() => SFX.play('star', 0, i), 180 + i * 250); else SFX.play('fail');
    $('#eagain').onclick = () => startChallenge(chId);
    $('#elist').onclick = () => openBook(goNext ? trailTo(nextId).concat([['fiche', nextId]]) : trailTo(chId));
  }
  /* le carnet du défi : rappel de ce qui est en jeu, et les réglages */
  function openPause() {
    const c = SIM.CHALLENGES[chId];
    openModal('pause', '<span class="sub">' + (c.survival ? 'Jour ' + GAME.st.day + (save.best4 ? ' · record ' + save.best4 : '') : 'Niveau ' + (lvlOf(chId) + 1) + ' · Défi ' + c.n) + '</span><h2>' + c.title + '</h2>' + voiceHtml(c, GAME.st.villagers[0].name) + frise(c, Math.min(GAME.st.day, c.days)) + (c.survival ? '<p class="note">Tenir le plus de jours possible. Les deux prochains jours sont annoncés ci-dessus.</p>' : goalsHtml(c)) +
      '<details><summary>Son</summary><div class="opts">' + volsHtml() + '</div></details>' +
      (c.survival ? '<p class="note">La partie se garde toute seule : tu peux quitter et la reprendre plus tard.</p>' : '') + '<div class="acts"><button class="tlink quiet" id="pquit">Quitter</button><button class="tlink quiet" id="prestart">Recommencer</button><button class="tlink" id="presume">Reprendre</button></div>');
    bindFrise(modal); bindVols(modal); $('#presume').onclick = closeModal; if (c.survival) twice($('#prestart'), 'Effacer cette partie ?', () => startChallenge(chId)); else $('#prestart').onclick = () => startChallenge(chId); $('#pquit').onclick = () => openBook(c.survival ? [['toc'], ['survival']] : trailTo(chId));
  }

  /* ---------- billets : villageois et bâtiments ---------- */
  /* survie : le matin, le joueur peut dire qui travaille où. Un vœu tient jusqu'à ce qu'il le change ; les autres se répartissent d'eux-mêmes. */
  function openJobs(openV) {
    const st = GAME.st, B = SIM.BT, J = SIM.survJobs(st, GAME.mourners()), pins = st.pins || {}, live = st.villagers.filter(v => v.alive), wz = SIM.weather(st);
    const posts = st.buildings.filter(b => B[b.type].posts && !b.gone), nth = {}, count = {};
    posts.forEach(b => { count[b.type] = (count[b.type] || 0) + 1; nth[b.id] = count[b.type]; });
    const bname = b => B[b.type].name + (count[b.type] > 1 ? ' · ' + nth[b.id] : ''), by = id => posts.find(b => b.id === id);
    const why = d => wz.dry && d.dryStop ? 'la sécheresse' : wz.storm && d.storm ? 'l’orage' : wz.fog && d.fog ? 'la brume' : 'le gel';
    const noGlean = wz.fog && !st.buildings.some(b => B[b.type].anti === 'fog' && !b.gone);
    let h = '<span class="sub">Matin du jour ' + st.day + '</span><h2>Qui fait quoi ?</h2><p class="note">Chacun choisit seul, sauf si tu décides pour lui. Ton choix tient jusqu’à ce que tu le changes.</p><div class="jobs">';
    for (const v of live) {
      const off = J.off[v.id], w = J.work[v.id], b = w == null ? null : by(w), pin = pins[v.id], open = openV === v.id && !off;
      const where = off ? (off === 'sick' ? 'Malade' : 'En deuil') : b ? bname(b) : 'Bois mort', how = off ? 'ne travaille pas aujourd’hui' : pin != null ? 'tu l’as décidé' : (v.sex === 'f' ? 'd’elle-même' : 'de lui-même');
      h += '<button class="jrow' + (open ? ' open' : '') + '" data-v="' + v.id + '"' + (off ? ' disabled' : '') + ' aria-expanded="' + open + '"><canvas data-v="' + v.id + '" aria-hidden="true"></canvas><span class="jn"><b>' + v.name + '</b><i>' + how + '</i></span><span class="jw' + (b && J.halt[b.id] ? ' halt' : '') + '">' + where + '</span></button>';
      if (!open) continue;
      const opt = (key, name, more, on, warn) => '<button class="jopt' + (on ? ' on' : '') + '" data-v="' + v.id + '" data-k="' + key + '"><span><b>' + name + '</b>' + (warn ? '<i class="warn">' + warn + '</i>' : '') + '</span><span class="jm">' + more + '</span></button>';
      h += '<div class="jopts">' + opt('auto', 'Laisser choisir', '', pin == null);
      for (const p of posts) { const d = B[p.type], crew = (J.crew[p.id] || []).filter(id => id !== v.id).map(id => st.villagers[id].name); h += opt(p.id, bname(p), (d.out ? I[d.out] + '+' + d.per : '') + ' <em>' + (J.crew[p.id] || []).length + '/' + d.posts + '</em>', pin === p.id, (J.halt[p.id] ? 'à l’arrêt : ' + why(d) : '') + (crew.length ? (J.halt[p.id] ? ' · ' : '') + 'avec ' + names(crew) : '')); }
      h += opt(-1, 'Bois mort', I.wood + '+1', pin === -1, noGlean ? 'introuvable dans la brume' : 'sans poste') + '</div>';
    }
    h += '</div><div class="acts"><button class="tlink quiet" id="jauto"' + (Object.keys(pins).length ? '' : ' disabled') + '>Tout laisser faire</button><button class="tlink" id="jok" data-snd="1">Fermer</button></div>';
    const sc = modalKind === 'jobs' && modal.querySelector('.sheet') ? modal.querySelector('.sheet').scrollTop : 0, again = modalKind === 'jobs';
    openModal('jobs', h); if (again) { const sh = modal.querySelector('.sheet'); sh.style.animation = 'none'; sh.scrollTop = sc; }
    modal.querySelectorAll('canvas[data-v]').forEach(c => { const v = st.villagers[+c.dataset.v], w = J.work[v.id], b = w == null ? null : by(w); portrait(c, v, b ? B[b.type].job : 'civil'); });
    modal.querySelectorAll('.jrow').forEach(r => r.onclick = () => { SFX.play('card'); openJobs(openV === +r.dataset.v ? null : +r.dataset.v); });
    modal.querySelectorAll('.jopt').forEach(o => o.onclick = () => {
      const id = +o.dataset.v, k = o.dataset.k, P = st.pins = st.pins || {};
      if (k === 'auto') delete P[id];
      else { const bid = +k; if (bid !== -1) { const held = live.filter(x => x.id !== id && P[x.id] === bid && !J.off[x.id]); if (held.length >= B[by(bid).type].posts) delete P[held[0].id]; } P[id] = bid; } // poste déjà réservé : le premier qui le tenait retrouve sa liberté
      SFX.play('job'); GAME.keep(); openJobs(null);
    });
    $('#jauto').onclick = () => { st.pins = {}; SFX.play('back'); GAME.keep(); openJobs(null); };
    $('#jok').onclick = closeModal;
  }
  function closeInspect() { inspect = null; GAME.sel = null; insp.hidden = true; vbtn.forEach(o => o.b.classList.remove('sel')); }
  function placeInsp() { insp.style.bottom = (bottom.hidden ? 12 : bottom.offsetHeight - 22) + 'px'; }
  /* toucher un villageois ouvre son carnet : ce qu'il espère, ce qu'il craint, ses dernières pensées, ses proches */
  function showVillager(id) {
    if (inspect && inspect.v === id) return closeInspect();
    const v = GAME.st.villagers[id]; inspect = { v: id }; GAME.sel = id; cache.delete('insp');
    insp.className = 'insp carnet';
    insp.innerHTML = '<div class="chd"><canvas aria-hidden="true"></canvas><div class="tx"><b>' + v.name + '</b><div class="l1" id="il1"></div><div class="needs" id="ineeds"></div></div><button class="x" aria-label="Fermer">' + I.x + '</button></div><div class="cbody" id="icar"></div>';
    insp.hidden = false; insp.querySelector('.x').onclick = closeInspect; vbtn.forEach((o, i) => o.b.classList.toggle('sel', i === id)); placeInsp();
  }
  function showBuilding(b) {
    const d = SIM.BT[b.type], st = GAME.plan ? GAME.plan.end : GAME.st, V = st.villagers; inspect = { b: b.id }; GAME.sel = null; vbtn.forEach(o => o.b.classList.remove('sel'));
    let title = d.name, who = ''; insp.className = 'insp';
    if (d.own) { const l = (b.owners || []).map(id => V[id].name); title = l.length ? 'Maison ' + de(names(l)) : 'Maison libre'; }
    else if (!d.beds) { const l = b.workers.map(id => V[id].name); who = l.length ? names(l) : 'Personne encore'; }
    insp.innerHTML = '<canvas class="sq" aria-hidden="true"></canvas><div class="tx"><b>' + title + '</b><div class="l1">' + INFO[b.type] + '</div>' + (who ? '<div class="l2">' + I.ppl + who + '</div>' : '') + '</div><button class="x" aria-label="Fermer">' + I.x + '</button>';
    illus(insp.querySelector('canvas'), b.type); insp.hidden = false; insp.querySelector('.x').onclick = closeInspect; placeInsp();
  }

  /* ---------- tutoriel ---------- */
  function endCoach() { coach = null; coachEl.hidden = true; coachEl.innerHTML = ''; }
  function runCoach(steps, done) { coach = { steps, i: 0, done }; drawCoach(); }
  function coachRect(s) {
    const A = app.getBoundingClientRect();
    if (s.el) { const e = $(s.el); if (e) { const q = e.getBoundingClientRect(); return { x: q.left - A.left, y: q.top - A.top, w: q.width, h: q.height, H: A.height }; } }
    return null;
  }
  function posCoach() {
    const s = coach.steps[coach.i], r = coachRect(s), pad = 7, sp = coachEl.querySelector('.spot'), bub = coachEl.querySelector('.bub');
    if (!r || !sp || !bub) return;
    sp.style.left = (r.x - pad) + 'px'; sp.style.top = (r.y - pad) + 'px'; sp.style.width = (r.w + pad * 2) + 'px'; sp.style.height = (r.h + pad * 2) + 'px';
    if (r.y + r.h / 2 < r.H * 0.5) { bub.style.top = (r.y + r.h + pad + 14) + 'px'; bub.style.bottom = 'auto'; } else { bub.style.bottom = (r.H - r.y + pad + 14) + 'px'; bub.style.top = 'auto'; }
  }
  function drawCoach() {
    const s = coach.steps[coach.i], r = coachRect(s), n = coach.steps.length, lastStep = coach.i === n - 1;
    coachEl.innerHTML = (r ? '<div class="spot"></div>' : '<div class="dim"></div>') + '<div class="bub" role="dialog" aria-live="polite"' + (r ? '' : ' style="top:50%;transform:translateY(-50%)"') + '><p>' + s.t + '</p><div class="r"><button class="skip" id="cskip">Passer</button>' + (n > 1 ? '<span class="dots">' + coach.steps.map((_, i) => '<i class="' + (i === coach.i ? 'on' : '') + '"></i>').join('') + '</span>' : '') + '<button class="tlink" id="cnext">' + (s.btn || (lastStep ? 'Compris' : 'Suivant')) + '</button></div></div>';
    coachEl.hidden = false; posCoach();
    $('#cnext').onclick = () => { if (coach.i < n - 1) { coach.i++; drawCoach(); } else { const d = coach.done; endCoach(); if (d) d(); } };
    $('#cskip').onclick = () => { tuto = false; endCoach(); };
  }
  const TUTO = {
    c1: {
      morning(st) {
        if (st.day === 1) return [
          { t: '<b>Bienvenue.</b> Quatre voyageurs viennent de s’installer ici. Ils doivent tenir <b>quatre jours</b>.' },
          { el: '#vbar', t: 'Les voici. Ils vivent leur vie : tu ne leur donnes <b>aucun ordre</b>.' },
          { el: '#res', t: 'Leur réserve : la <b>nourriture</b>, le <b>bois</b>, et les <b>places pour dormir</b>.' },
          { t: 'Chaque soir, chacun mange une part et cherche un lit. Deux soirs de suite <b>sans manger</b>, ou deux nuits de suite <b>dehors</b>, et l’on en meurt.' },
          { el: '.fan', t: 'Ton seul geste : choisir <b>un bâtiment par jour</b>. Son prix en bois est écrit sur la carte. Eux décident de l’endroit.' },
          { el: '.fan', t: 'La cabane coûte 4 bois et tu n’en as que 2. Commence par le <b>camp de bûcheron</b>.', btn: 'À moi' }];
        if (st.day === 2) return [{ el: '.fan', t: 'Le bois est rentré. Deux voyageurs arrivent <b>demain</b> : il leur faudra un toit. Une <b>cabane</b> abrite deux personnes.' }];
        if (st.day === 3) return [{ el: '#res', t: 'Six bouches à nourrir, et la réserve baisse.' }, { el: '.fan', t: 'Une <b>hutte de cueillette</b> rapporte 4 nourritures par jour.' }];
        if (st.day === 4) return [{ t: 'Dernier jour. À toi de juger.' }];
        return null;
      },
      tick(t) {
        if (GAME.st.day !== 1) return null;
        if (t >= 6.9 && !seen.a) { seen.a = 1; return [{ el: '.daybar', t: 'La journée suit son cours : chantier, travail, repas, nuit. Tu peux la <b>suspendre</b> ou la <b>presser</b>.' }]; }
        if (t >= 9.4 && !seen.b) { seen.b = 1; return [{ t: 'Ils disent tout haut ce qu’ils <b>espèrent</b> et ce qu’ils <b>craignent</b>. Écoute-les : ils ne mentent jamais.' }, { t: 'Touche un villageois pour lire son <b>carnet</b>. Le feu, l’eau et les arbres répondent aussi.' }]; }
        if (t >= 17.5 && !seen.c) { seen.c = 1; return [{ el: '#res', t: 'Le soir, chacun prend <b>une part</b> dans la réserve.' }]; }
        if (t >= 21.9 && !seen.d) { seen.d = 1; return [{ t: 'La nuit, on se partage les lits. Qui a dormi dehors la veille passe <b>en premier</b>.' }]; }
        return null;
      }
    },
    c2: {
      morning(st) {
        if (st.day === 1) return [{ el: '#btnPause', t: 'Ce qui attend le village est noté dans le <b>carnet</b> : un orage au jour 3, des voyageurs au jour 4.' }, { el: '.fan', t: 'Un <b>cabanon</b> n’abrite qu’une personne, mais il coûte moins de bois.' }];
        if (st.day === 3) return [{ t: 'L’orage est là. La rivière monte.' }];
        return null;
      },
      tick() { return null; }
    }
  };
  function tutoTick() {
    if (!tuto || coach || GAME.phase !== 'day' || !TUTO[chId]) return;
    const steps = TUTO[chId].tick(GAME.t, GAME.plan); if (steps) runCoach(steps);
  }

  /* ---------- mise à jour continue ---------- */
  function updateHud() {
    const G = GAME, st = G.st, L = G.live, t = G.t, n = G.alive().length;
    const cur = G.plan ? G.plan.end : st, nb = G.plan && G.plan.nb;
    const cap = cur.buildings.reduce((a, b) => a + ((nb && nb.id === b.id && t < nb.t1) ? 0 : (SIM.BT[b.type].beds || 0)), 0);
    const bump = id => { const e = $(id); e.classList.remove('bump'); void e.offsetWidth; e.classList.add('bump'); };
    if (set($('#rFood b'), 'food', String(L.food))) bump('#rFood');
    if (set($('#rWood b'), 'wood', String(L.wood))) bump('#rWood');
    if (usesStone && set($('#rStone b'), 'stone', String(L.stone))) bump('#rStone');
    if ($('#rJoy') && set($('#rJoy b'), 'joy', String(L.joy))) bump('#rJoy');
    if (set($('#rRoof b'), 'roof', cap + '/' + n)) bump('#rRoof');
    set(null, 'foodLow', L.food < n && t < 18.9, v => $('#rFood').classList.toggle('low', v));
    set(null, 'roofLow', cap < n, v => $('#rRoof').classList.toggle('low', v));
    st.villagers.forEach((v, i) => {
      const o = vbtn[i]; if (!o) return; const job = L.jobs[i] || 'civil';
      set(null, 'pj' + i, job, () => portrait(o.cv, v, job));
      set(null, 'dead' + i, !v.alive, d => o.b.classList.toggle('dead', d));
      const hu = v.alive && L.hunger[i] > 0, rf = v.alive && L.roofless[i] > 0;
      set(null, 'vw' + i, (hu ? 'f' : '') + (rf ? 'r' : ''), k => { o.b.classList.toggle('warn', !!k); o.bad.innerHTML = (hu ? '<i title="N’a pas mangé">' + I.faim + '</i>' : '') + (rf ? '<i title="A dormi dehors">' + I.dehors + '</i>' : ''); });
    });
    const mk = $('#fmk');
    if (mk) {
      mk.style.left = (G.phase === 'day' ? tx(t) : 100).toFixed(2) + '%';
      const ph = t < T.WORK ? 0 : t < T.MEAL ? 1 : t < T.BED ? 2 : t < T.NIGHT ? 3 : 4;
      set(null, 'jal', ph, v => { bottom.querySelectorAll('.jl').forEach(j => j.classList.toggle('on', +j.dataset.j === v)); mk.classList.toggle('night', v >= 3); });
    }
    if (G.phase === 'day' && msgN !== G.msgN) { msgN = G.msgN; const m = $('#msg'); if (m) { m.textContent = G.msg; m.classList.remove('new'); void m.offsetWidth; m.classList.add('new'); } }
    if (inspect && inspect.v != null) {
      const v = st.villagers[inspect.v], s = G.last[inspect.v], job = L.jobs[v.id], jn = SIM.JOBNAME[job || 'none'][v.sex], hu = L.hunger[v.id], rf = L.roofless[v.id], home = (G.plan && G.t >= 9.05 ? G.plan.end : st).villagers[v.id].home != null;
      const M = G.mind, log = (M && M.log[v.id]) || [], cl = M ? MIND.close(M, st, v.id) : [], ch = MIND.CHARN[MIND.charOf(v)][v.sex === 'f' ? 1 : 0];
      set(null, 'insp', v.id + '|' + job + '|' + (s ? s.label : '') + '|' + hu + '|' + rf + '|' + home + '|' + log.length + '|' + cl.map(c => c.id + (c.love ? 'L' : '')).join(','), () => {
        portrait(insp.querySelector('canvas'), v, job || 'civil');
        $('#il1').innerHTML = (I[job || 'none'] || I.work) + '<span>' + esc(jn.charAt(0).toUpperCase() + jn.slice(1) + ', ' + ch + (s && s.label ? ' · ' + s.label : '')) + '</span>';
        $('#ineeds').innerHTML = '<span class="need' + (hu ? ' no' : '') + '">' + (hu ? I.faim : I.food) + (hu ? 'N’a pas mangé hier' : 'Nourri' + (v.sex === 'f' ? 'e' : '')) + '</span><span class="need' + (rf ? ' no' : '') + '">' + (rf ? I.dehors : I.roof) + (rf ? 'A dormi dehors' : home ? 'A sa maison' : 'A dormi au chaud') + '</span>';
        const today = log.filter(l => l.day === Math.min(st.day, st.days)), hope = today.filter(l => POSI[l.tone]).pop(), fear = today.filter(l => !POSI[l.tone]).pop();
        $('#icar').innerHTML = '<div class="hf"><div><h4>' + I.espoir + 'J’espère</h4><p>' + (hope ? esc(hope.text) : '—') + '</p></div><div><h4>' + I.crainte + 'Je crains</h4><p>' + (fear ? esc(fear.text) : '—') + '</p></div></div>' +
          (log.length ? '<h4>' + I.soi + 'Mon carnet</h4><ul class="cl">' + log.slice(-3).reverse().map(l => '<li>' + (I[l.tone] || '') + '<i>Jour ' + l.day + ', ' + l.moment + '</i>' + esc(l.text) + '</li>').join('') + '</ul>' : '') +
          (cl.length ? '<p class="pr"><span>Mes proches</span>' + cl.map(c => (c.love ? I.heart : I.amitie) + c.name).join(' · ') + '</p>' : '');
      });
    }
  }
  /* les bulles : posées au-dessus de celui qui parle, deux au plus */
  function syncBubbles() {
    const host = $('#bubbles'), act = GAME.phase === 'menu' || save.bub === 'aucune' || coach || modalKind ? [] : GAME.bub.filter(b => b.age >= 0), A = app.clientWidth, keep = new Set(); let prev = null;
    host.classList.toggle('icons', save.bub === 'icones');
    for (const b of act) {
      const p = GAME.anchor(b.vid); if (!p) continue; keep.add(b.id);
      let o = bubEl.get(b.id);
      if (!o) {
        const e = document.createElement('button'); e.className = 'sb t-' + b.tone; e.dataset.snd = '1'; e.innerHTML = (I[b.subj] || I.ppl) + '<span>' + esc(b.text) + '</span>';
        e.setAttribute('aria-label', GAME.st.villagers[b.vid].name + ' : ' + b.text); e.onclick = () => { inspect = null; showVillager(b.vid); };
        host.appendChild(e); o = { e, w: e.offsetWidth, h: e.offsetHeight }; bubEl.set(b.id, o);
      }
      const q = R.w2s(p.x, p.y), x = Math.max(8, Math.min(A - o.w - 8, q.x - o.w / 2)); let y = Math.max(126, q.y - o.h - 9);
      if (prev && Math.abs(prev.x + prev.w / 2 - x - o.w / 2) < (prev.w + o.w) / 2 + 4 && Math.abs(prev.y - y) < o.h + 6) y = prev.y - o.h - 12 >= 126 ? prev.y - o.h - 12 : prev.y + prev.h + 12;
      o.e.style.left = x + 'px'; o.e.style.top = y + 'px'; o.e.style.setProperty('--tx', Math.max(16, Math.min(o.w - 16, q.x - x)) + 'px');
      o.e.classList.toggle('out', b.age > 4.5); prev = { x, y, w: o.w, h: o.h };
    }
    for (const [id, o] of bubEl) if (!keep.has(id)) { o.e.remove(); bubEl.delete(id); }
  }
  let qCap = 2, slow = 0;
  function loop(ts) {
    const time = ts / 1000, dt = Math.min(0.1, Math.max(0, time - lastT)); lastT = time;
    /* qualité adaptative : si l'appareil peine, on réduit la finesse du rendu */
    if (!window.HQ_LOCK && dt > 0.034 && dt < 0.1) { if (++slow > 80 && qCap > 1) { qCap = Math.max(1, qCap - 0.5); slow = 0; resize(); } } else if (slow > 0) slow -= 0.5;
    GAME.hold = !!coach || modalKind === 'pause';
    GAME.tick(dt, time); GAME.mindTick(dt);
    let ho = null; if (GAME.phase === 'menu') { const h = 19 + (time - t0menu) * 0.16; ho = h < 30 ? h : 6 + (h - 30) % 24; } // une première nuit au coin du feu, puis les jours s'enchaînent
    const v = GAME.view(time, dt, ho); R.frame(v.v, v.hour, time);
    if (GAME.phase !== 'menu') { updateHud(); tutoTick(); }
    syncBubbles();
    requestAnimationFrame(loop);
  }
  function resize() { R.resize(app.clientWidth, app.clientHeight, Math.min(qCap, window.devicePixelRatio || 1), 122 + safeTop(), 122); if (GAME.phase === 'morning') R.setView('plan', bottom.offsetHeight - 26, planY()); if (inspect) placeInsp(); if (coach) drawCoach(); }
  function safeTop() { const d = document.createElement('div'); d.style.cssText = 'position:absolute;top:0;height:env(safe-area-inset-top);width:1px'; app.appendChild(d); const h = d.offsetHeight || 0; d.remove(); return h; }
  function boot() {
    R.init(cv, GAME.map); resize(); window.addEventListener('resize', resize);
    $('#btnPause').innerHTML = I.menu; $('#btnPause').onclick = openPause;
    $('#bstart').onclick = begin; $('#bopt').onclick = () => openBook([['title'], ['options']]);
    /* le son ne peut démarrer qu'après un premier geste ; ensuite, chaque bouton a son petit bruit */
    ['pointerdown', 'pointerup', 'click', 'keydown'].forEach(ev => document.addEventListener(ev, () => SFX.unlock(), true));
    app.addEventListener('click', e => { const b = e.target.closest && e.target.closest('button'); if (b && !b.dataset.snd && !b.dataset.go && !b.dataset.level && !b.dataset.ch && !b.dataset.back) SFX.play('tap'); });
    /* zoom : molette à la souris, deux doigts au téléphone ; une fois zoomé, on fait glisser la vue d'un doigt */
    const PT = new Map(); let moved = 0, pinch = null;
    const at = e => { const A = app.getBoundingClientRect(); return { x: e.clientX - A.left, y: e.clientY - A.top }; };
    cv.addEventListener('wheel', e => { e.preventDefault(); const p = at(e); R.zoom(Math.exp(-e.deltaY * (e.deltaMode ? 0.05 : 0.0016)), p.x, p.y); }, { passive: false });
    cv.addEventListener('pointerdown', e => { PT.set(e.pointerId, at(e)); if (PT.size === 1) moved = 0; pinch = null; try { cv.setPointerCapture(e.pointerId); } catch (x) { /* rien */ } });
    cv.addEventListener('pointermove', e => {
      const o = PT.get(e.pointerId); if (!o) return; const p = at(e); PT.set(e.pointerId, p);
      if (PT.size === 1) { moved += Math.abs(p.x - o.x) + Math.abs(p.y - o.y); if (moved > 8) R.drag(p.x - o.x, p.y - o.y); }
      else if (PT.size === 2) { const q = [...PT.values()], d = Math.hypot(q[0].x - q[1].x, q[0].y - q[1].y), m = { x: (q[0].x + q[1].x) / 2, y: (q[0].y + q[1].y) / 2 }; if (pinch) { R.zoom(d / Math.max(1, pinch.d), m.x, m.y); R.drag(m.x - pinch.m.x, m.y - pinch.m.y); } pinch = { d, m }; moved = 99; }
    });
    const lift = e => { PT.delete(e.pointerId); pinch = null; };
    cv.addEventListener('pointercancel', lift); cv.addEventListener('lostpointercapture', lift);
    cv.addEventListener('dblclick', () => R.resetZoom());
    cv.addEventListener('pointerup', e => {
      const drag = moved > 8; lift(e); if (drag) return;   // un glissement n'est pas un toucher
      const A = app.getBoundingClientRect(), hit = GAME.tap(R.s2w(e.clientX - A.left, e.clientY - A.top), lastT);
      if (!hit || hit.fx) return closeInspect();
      if (hit.v) { if (!inspect || inspect.v !== hit.v.id) { inspect = null; showVillager(hit.v.id); } } else showBuilding(hit.b);
    });
    GAME.on = { morning: renderMorning, day: renderDay, bilan: renderBilan, end: renderEnd, save: s => { save.surv = s; persist(); } };
    showTitle(); requestAnimationFrame(loop);
  }
  boot();
  return { showTitle, startChallenge, openBook };
})();
