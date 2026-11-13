'use strict';
/* ===== Hameau — moteur de simulation (déterministe, sans affichage) ===== */
const SIM = (() => {
  /* le monde : 384 × 832 pour un hameau ; les bourgs des niveaux 10 et suivants ont une carte plus grande (MAPDEF.size). world(id) cale la grille sur la carte en cours. */
  const CELL = 16; let W = 384, H = 832, GW = W / CELL, GH = H / CELL, N = GW * GH, EXT = { x: -112, y: -48, w: 608, h: 976 };
  function world(id) { const z = (MAPDEF[id] && MAPDEF[id].size) || [384, 832]; if (z[0] === W && z[1] === H) return; W = z[0]; H = z[1]; GW = W / CELL; GH = H / CELL; N = GW * GH; EXT = { x: -112, y: -48, w: W + 224, h: H + 144 }; }
  const T = { BUILD: 6, WORK: 9, MEAL: 17, BED: 19.5, NIGHT: 21.5, END: 30 };
  const SPEED = 160; // px par heure de jeu
  const SEATS = [[-27, -8], [27, -8], [-22, 19], [22, 19], [0, -29], [0, 30], [-34, 6], [34, 6]];
  /* les ressources : trois matières brutes, l'argile, puis ce que la manufacture en tire (deux pour un), et ce qui ne pèse rien : culture, ingéniosité, épanouissement.
     Le bonheur (joy) se compte à part, comme avant. */
  const RES = ['food', 'wood', 'stone', 'clay', 'brick', 'plank', 'meal', 'culture', 'ingen', 'bloom'];
  const RNAME = { food: 'nourriture', wood: 'bois', stone: 'pierre', clay: 'argile', brick: 'brique', plank: 'planche', meal: 'repas', culture: 'culture', ingen: 'ingéniosité', bloom: 'épanouissement', joy: 'bonheur' };
  const RATIO = 2; // deux pour un, un pour un avec le spécialiste du domaine
  function rngOf(seed) {
    let a = seed >>> 0;
    return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  const hyp = Math.hypot, pw = (v, e) => Math.pow(Math.abs(v), e);
  const names = l => l.length === 0 ? '' : l.length === 1 ? l[0] : l.slice(0, -1).join(', ') + ' et ' + l[l.length - 1];
  const rectHit = (x, y, r, m) => x >= r.x - m && x <= r.x + r.w + m && y >= r.y - m && y <= r.y + r.h + m;
  const cx = i => (i % GW) * CELL + 8, cy = i => Math.floor(i / GW) * CELL + 8;

  /* ---------- bâtiments ---------- */
  const BT = {
    /* trois façons d'avoir un toit : la cabane (2 places, à qui en a besoin), le cabanon (1 place, pareil), la maison (2 places, à ses habitants pour de bon) */
    cabane: { name: 'Cabane', w: 48, h: 44, cost: { wood: 4 }, beds: 2, posts: 0 },
    cabanon: { name: 'Cabanon', w: 36, h: 40, cost: { wood: 2 }, beds: 1, posts: 0 },
    maison: { name: 'Maison', w: 48, h: 46, cost: { wood: 3, stone: 2 }, beds: 2, posts: 0, own: true },
    cueillette: { name: 'Hutte de cueillette', w: 64, h: 48, cost: { wood: 2 }, posts: 2, job: 'cueilleur', out: 'food', per: 2, storm: true, frost: true },
    potager: { name: 'Potager', w: 48, h: 40, cost: { wood: 3 }, posts: 1, job: 'paysan', out: 'food', per: 2, open: true, frost: true, garden: true },
    bucheron: { name: 'Camp de bûcheron', w: 64, h: 48, cost: { wood: 2 }, posts: 2, job: 'bucheron', out: 'wood', per: 2, fog: true },
    pecheur: { name: 'Cabane de pêche', w: 44, h: 40, cost: { wood: 3 }, posts: 1, job: 'pecheur', out: 'food', per: 3, storm: true, dryStop: true },
    carriere: { name: 'Carrière', w: 56, h: 40, cost: { wood: 2 }, posts: 1, job: 'carrier', out: 'stone', per: 2, open: true, fog: true },
    four: { name: 'Four à pain', w: 44, h: 44, cost: { wood: 2, stone: 3 }, posts: 1, job: 'boulanger', out: 'food', per: 4, burn: 0 },
    /* dix bâtiments de plus : deux abris, trois façons de se nourrir, deux parades au mauvais temps, deux joies, un moulin */
    abri: { name: 'Abri de branchages', w: 52, h: 34, cost: { wood: 1 }, beds: 4, life: 2 },
    dortoir: { name: 'Dortoir', w: 76, h: 44, cost: { wood: 6 }, beds: 4 },
    poulailler: { name: 'Poulailler', w: 48, h: 40, cost: { wood: 2, food: 2 }, posts: 1, job: 'fermier', out: 'food', per: 2, site: true },
    champi: { name: 'Champignonnière', w: 44, h: 40, cost: { wood: 2 }, posts: 1, job: 'champi', out: 'food', per: 1, wet: 4, site: true, frost: true },
    rucher: { name: 'Rucher', w: 44, h: 34, cost: { wood: 3 }, open: true, give: { food: 1 }, frost: true, garden: true },
    serre: { name: 'Serre', w: 48, h: 40, cost: { wood: 2, stone: 2 }, open: true, anti: 'frost' },
    fanal: { name: 'Fanal', w: 28, h: 30, cost: { wood: 3 }, open: true, anti: 'fog' },
    jardin: { name: 'Jardin de fleurs', w: 48, h: 36, cost: { wood: 2 }, open: true, give: { joy: 1 }, frost: true, garden: true },
    kiosque: { name: 'Kiosque', w: 44, h: 44, cost: { wood: 3, stone: 1 }, posts: 1, job: 'musicien', open: true, play: 3, music: true, site: true },
    moulin: { name: 'Moulin', w: 44, h: 48, cost: { wood: 3, stone: 3 }, boost: { four: 2 } },
    /* … et vingt autres, pour les défis à venir */
    grange: { name: 'Grange', w: 84, h: 48, cost: { wood: 5, stone: 2 }, beds: 6 },
    chaumiere: { name: 'Chaumière', w: 60, h: 46, cost: { wood: 4, stone: 3 }, beds: 3, own: true },
    tente: { name: 'Tente', w: 36, h: 32, cost: { wood: 1 }, beds: 2, life: 3 },
    auberge: { name: 'Auberge', w: 64, h: 48, cost: { wood: 4, stone: 1 }, beds: 2, welcome: 2 },
    verger: { name: 'Verger', w: 56, h: 44, cost: { wood: 2 }, open: true, give: { food: 2 }, wait: 2, frost: true, garden: true },
    bergerie: { name: 'Bergerie', w: 52, h: 42, cost: { wood: 3, food: 3 }, posts: 1, job: 'berger', out: 'food', per: 3, site: true },
    fumoir: { name: 'Fumoir', w: 36, h: 40, cost: { wood: 2, stone: 1 }, boost: { pecheur: 1 }, fume: true },
    puits: { name: 'Puits', w: 28, h: 28, cost: { stone: 3 }, open: true, boost: { potager: 1 } },
    etal: { name: 'Étal de troc', w: 48, h: 32, cost: { wood: 2 }, open: true, swap: { take: { wood: 2 }, give: { food: 2 } } },
    gardemanger: { name: 'Garde-manger', w: 30, h: 30, cost: { wood: 2 }, open: true, ration: 1 },
    scierie: { name: 'Scierie', w: 60, h: 44, cost: { wood: 2, stone: 2 }, posts: 1, job: 'scieur', out: 'wood', per: 3, site: true },
    menuiserie: { name: 'Menuiserie', w: 52, h: 42, cost: { wood: 4 }, discount: { wood: 1 } },
    taillerie: { name: 'Atelier de taille', w: 44, h: 36, cost: { wood: 2, stone: 2 }, open: true, discount: { stone: 1 } },
    bucher: { name: 'Bûcher', w: 40, h: 28, cost: { wood: 1 }, open: true, boost: { glean: 1 } },
    digue: { name: 'Digue', w: 64, h: 24, cost: { stone: 4 }, open: true, anti: 'storm' },
    brasero: { name: 'Braséro', w: 26, h: 26, cost: { wood: 2, stone: 1 }, open: true, anti: 'cold' },
    rubans: { name: 'Arbre aux rubans', w: 36, h: 36, cost: { wood: 1, food: 1 }, open: true, give: { joy: 1 } },
    bains: { name: 'Bains', w: 44, h: 40, cost: { wood: 3, stone: 2 }, swap: { take: { wood: 1 }, give: { joy: 2 } }, fume: true },
    pressoir: { name: 'Pressoir', w: 48, h: 42, cost: { wood: 3 }, posts: 1, job: 'cidrier', play: 2, site: true },
    cellier: { name: 'Cellier', w: 40, h: 36, cost: { wood: 3, stone: 1 }, plenty: 1 },
    /* la grande table : personne n'y travaille ; si tout le monde mange, le soir y est heureux */
    /* la vie de famille : des maisons en dur, et ce qui tourne autour des enfants (ils mangent, ne travaillent pas, et l'école en fait des adultes) */
    foyer: { name: 'Maison de famille', w: 64, h: 48, cost: { wood: 5, stone: 3 }, beds: 4, own: true },
    longere: { name: 'Longère', w: 66, h: 42, cost: { wood: 4, stone: 1 }, beds: 3 },
    ferme: { name: 'Ferme familiale', w: 64, h: 48, cost: { wood: 5, stone: 2 }, beds: 3, own: true, give: { food: 1 } },
    ecole: { name: 'École', w: 56, h: 46, cost: { wood: 4, stone: 2 }, school: 3 },
    bibliotheque: { name: 'Bibliothèque', w: 48, h: 44, cost: { wood: 3, stone: 2 }, fast: 1 },
    cantine: { name: 'Cantine', w: 54, h: 44, cost: { wood: 3, stone: 1 }, feedKids: 3 },
    chevre: { name: 'Enclos à chèvre', w: 44, h: 40, cost: { wood: 2 }, feedKids: 1 },
    bassecour: { name: 'Basse-cour', w: 48, h: 42, cost: { wood: 3 }, kidFood: 1, kidCap: 2 },
    jeux: { name: 'Aire de jeux', w: 50, h: 40, cost: { wood: 2 }, open: true, kidJoy: 1, kidCap: 3 },
    marionnettes: { name: 'Théâtre de marionnettes', w: 44, h: 42, cost: { wood: 3, stone: 1 }, ifKid: 2 },
    /* la manufacture et le savoir (niveaux 10 et suivants) */
    argiliere: { name: 'Argilière', w: 52, h: 40, cost: { wood: 2 }, posts: 1, job: 'argilier', out: 'clay', per: 2, indoor: true, verb: 'Tire de l’argile' },
    briqueterie: { name: 'Briqueterie', w: 54, h: 44, cost: { wood: 3, stone: 2 }, posts: 1, job: 'briquetier', conv: { from: 'clay', to: 'brick', cap: 4 }, verb: 'Cuit des briques' },
    charpenterie: { name: 'Charpenterie', w: 56, h: 44, cost: { wood: 4 }, posts: 1, job: 'charpentier', conv: { from: 'wood', to: 'plank', cap: 4 }, verb: 'Débite des planches' },
    cuisine: { name: 'Cuisine', w: 50, h: 44, cost: { wood: 3, stone: 1 }, posts: 1, job: 'commis', conv: { from: 'food', to: 'meal', cap: 6 }, verb: 'Prépare les repas' },
    lycee: { name: 'Lycée', w: 62, h: 48, cost: { wood: 4, stone: 3 }, posts: 1, job: 'professeur', out: 'culture', per: 3, indoor: true, verb: 'Fait la classe' },
    theatre: { name: 'Théâtre', w: 60, h: 48, cost: { plank: 3, brick: 1 }, give: { culture: 1, joy: 2 } },
    observatoire: { name: 'Observatoire', w: 46, h: 46, cost: { brick: 3, plank: 1 }, give: { culture: 2 } },
    academie: { name: 'Académie', w: 60, h: 48, cost: { plank: 2, brick: 2 }, posts: 1, job: 'savant', conv: { from: 'culture', to: 'ingen', cap: 4 }, verb: 'Cherche' },
    arts: { name: 'Atelier des arts', w: 54, h: 44, cost: { plank: 2, stone: 1 }, posts: 1, job: 'artiste', conv: { from: 'joy', to: 'bloom', cap: 4 }, verb: 'Crée' },
    cabinet: { name: 'Cabinet du médecin', w: 48, h: 44, cost: { ingen: 3, plank: 1 }, posts: 1, job: 'medecin', medic: true, indoor: true, verb: 'Soigne' },
    geologue: { name: 'Bureau du géologue', w: 46, h: 42, cost: { ingen: 2, wood: 2 }, posts: 1, job: 'geologue', expert: 'brick', indoor: true, verb: 'Étudie les terres' },
    ingenieur: { name: 'Bureau de l’ingénieur', w: 46, h: 42, cost: { ingen: 2, wood: 2 }, posts: 1, job: 'ingenieur', expert: 'plank', indoor: true, verb: 'Trace des plans' },
    chef: { name: 'Fourneau du cuisinier', w: 46, h: 42, cost: { ingen: 2, stone: 1 }, posts: 1, job: 'cuisinier', expert: 'meal', indoor: true, verb: 'Invente des plats' },
    psy: { name: 'Cabinet du psychologue', w: 48, h: 44, cost: { ingen: 3, plank: 1 }, posts: 1, job: 'psychologue', expert: 'bloom', indoor: true, verb: 'Écoute' },
    maisonbrique: { name: 'Maison de brique', w: 60, h: 46, cost: { brick: 3, plank: 1 }, beds: 4 },
    demeure: { name: 'Grande demeure', w: 70, h: 52, cost: { brick: 4, plank: 3 }, beds: 6 },
    entrepot: { name: 'Entrepôt', w: 62, h: 46, cost: { plank: 3, brick: 1 }, store: true },
    halle: { name: 'Halle du marché', w: 64, h: 48, cost: { brick: 2, plank: 2 }, give: { food: 2, wood: 1 } },
    cloche: { name: 'Cloche', w: 30, h: 36, cost: { wood: 3, stone: 2 }, open: true, call: 2 },
    table: { name: 'Grande table', w: 58, h: 34, cost: { wood: 3 }, open: true, joy: 2 },
  };
  for (const k in BT) { BT[k].beds = BT[k].beds || 0; BT[k].posts = BT[k].posts || 0; }
  const SCHOOL_DAYS = 4; // jours d'école pour qu'un enfant devienne adulte (trois avec une bibliothèque)
  const JOBNAME = {
    none: { m: 'sans poste', f: 'sans poste' }, argilier: { m: 'argilier', f: 'argilière' }, briquetier: { m: 'briquetier', f: 'briquetière' }, charpentier: { m: 'charpentier', f: 'charpentière' }, commis: { m: 'commis de cuisine', f: 'commise de cuisine' },
    professeur: { m: 'professeur', f: 'professeure' }, savant: { m: 'savant', f: 'savante' }, artiste: { m: 'artiste', f: 'artiste' }, medecin: { m: 'médecin', f: 'médecin' }, geologue: { m: 'géologue', f: 'géologue' }, ingenieur: { m: 'ingénieur', f: 'ingénieure' },
    cuisinier: { m: 'cuisinier', f: 'cuisinière' }, psychologue: { m: 'psychologue', f: 'psychologue' }, cueilleur: { m: 'cueilleur', f: 'cueilleuse' }, paysan: { m: 'jardinier', f: 'jardinière' },
    bucheron: { m: 'bûcheron', f: 'bûcheronne' }, pecheur: { m: 'pêcheur', f: 'pêcheuse' }, carrier: { m: 'tailleur de pierre', f: 'tailleuse de pierre' }, fermier: { m: 'fermier', f: 'fermière' }, champi: { m: 'champignonniste', f: 'champignonniste' }, musicien: { m: 'musicien', f: 'musicienne' }, berger: { m: 'berger', f: 'bergère' }, scieur: { m: 'scieur', f: 'scieuse' }, cidrier: { m: 'cidrier', f: 'cidrière' }, boulanger: { m: 'boulanger', f: 'boulangère' }
  };
  function costOf(st, type) {
    const c = Object.assign({}, BT[type].cost);
    for (const b of st.buildings) { const d = BT[b.type].discount; if (d && !b.gone) for (const r in d) if (c[r] > 1) c[r] = Math.max(1, c[r] - d[r]); }
    return c;
  }
  const afford = (st, type) => { const c = costOf(st, type); return RES.every(r => st[r] >= (c[r] || 0)); };
  /* pourquoi une carte ne peut pas être jouée : 'cost' (ressources), 'room' (plus de place), sinon null */
  const blocked = (st, type) => !afford(st, type) ? 'cost' : !placeBuilding(st, type, () => 0) ? 'room' : null;
  /* à partir de dix habitants, le village est un bourg : deux chantiers par jour */
  const maxBuilds = st => st.town ? 2 : 1;
  const affordBoth = (st, a, b) => { const ca = costOf(st, a), cb = costOf(st, b); return RES.every(r => st[r] >= (ca[r] || 0) + (cb[r] || 0)); };
  /* tout ce que le joueur peut décider ce matin : rien, une carte, ou deux quand le village est un bourg */
  function options(st) {
    const c = draw(st).filter(t => !blocked(st, t)), o = [null].concat(c);
    if (maxBuilds(st) > 1) for (let i = 0; i < c.length; i++) for (let j = i + 1; j < c.length; j++) if (affordBoth(st, c[i], c[j])) o.push([c[i], c[j]]);
    return o;
  }
  const solid = type => { const c = BT[type].cost; return (c.stone || 0) + (c.brick || 0) > 0; }; // bâti avec de la pierre ou de la brique : tient sous la tornade

  /* ---------- cartes ---------- */
  const MAPDEF = {
    pont: {
      name: 'La clairière du pont', seed: 77, band: [134, 772], c: [192, 478],
      river: { axis: 'x', f: x => 214 + 13 * Math.sin(x / 58 + 0.6) + 5 * Math.sin(x / 23 + 1) }, bridge: 232,
      fire: { x: 192, y: 436 }, stock: { x: 226, y: 470, ax: 213, ay: 488 },
      clear: (x, y) => pw((x - 192) / 168, 4) + pw((y - 478) / 216, 4) < 1
    },
    rive: {
      name: 'La rive aux saules', seed: 91, band: [134, 772], c: [152, 452],
      river: { axis: 'y', f: y => 298 + 13 * Math.sin(y / 61 + 1) + 5 * Math.sin(y / 25) }, bridge: 328,
      fire: { x: 136, y: 318 }, stock: { x: 78, y: 352, ax: 149, ay: 370 },
      clear: (x, y) => pw((x - 152) / 112, 4) + pw((y - 452) / 302, 4) < 1
    },
    vallon: {
      name: 'Le vallon', seed: 53, band: [226, 772], c: [196, 452],
      river: { axis: 'x', f: x => 668 + 11 * Math.sin(x / 52 + 2) + 4 * Math.sin(x / 21) }, bridge: 152,
      fire: { x: 250, y: 424 }, stock: { x: 166, y: 458, ax: 237, ay: 476 }, rocks: { x: 62, y: 430 },
      clear: (x, y) => pw((x - 196) / 158, 2.6) + pw((y - 452) / 178, 2.6) < 1
    }
  };
  /* les bourgs : des cartes une fois et demie plus grandes, pour des villages de vingt à quarante bâtiments */
  MAPDEF.bourg = {
    name: 'Le bourg du gué', seed: 83, size: [544, 1168], band: [170, 1100], c: [272, 660],
    river: { axis: 'x', f: x => 236 + 14 * Math.sin(x / 70 + 1.2) + 5 * Math.sin(x / 24) }, bridge: 300,
    fire: { x: 280, y: 640 }, stock: { x: 314, y: 674, ax: 301, ay: 692 }, rocks: { x: 470, y: 900 },
    clear: (x, y) => pw((x - 272) / 244, 3.4) + pw((y - 660) / 396, 3.4) < 1
  };
  MAPDEF.plaine = {
    name: 'La grande plaine', seed: 91, size: [544, 1168], band: [150, 1100], c: [316, 610],
    river: { axis: 'y', f: y => 96 + 13 * Math.sin(y / 66) + 5 * Math.sin(y / 23 + 2) }, bridge: 700,
    fire: { x: 320, y: 560 }, stock: { x: 354, y: 594, ax: 341, ay: 612 }, rocks: { x: 468, y: 930 },
    clear: (x, y) => pw((x - 316) / 204, 4) + pw((y - 610) / 448, 4) < 1
  };
  MAPDEF.confluent = {
    name: 'Les deux rives', seed: 97, size: [544, 1168], band: [150, 1100], c: [272, 560],
    river: { axis: 'x', f: x => 968 + 13 * Math.sin(x / 62 + 0.4) + 5 * Math.sin(x / 22 + 1) }, bridge: 212,
    fire: { x: 262, y: 580 }, stock: { x: 296, y: 614, ax: 283, ay: 632 }, rocks: { x: 82, y: 560 },
    clear: (x, y) => pw((x - 272) / 240, 3) + pw((y - 560) / 372, 3) < 1
  };
  MAPDEF.pre = {
    name: 'Le grand pré', seed: 61, band: [134, 772], c: [192, 470],
    river: { axis: 'x', f: x => 178 + 12 * Math.sin(x / 64 + 2) + 4 * Math.sin(x / 20) }, bridge: 112,
    fire: { x: 204, y: 462 }, stock: { x: 238, y: 496, ax: 225, ay: 514 }, rocks: { x: 322, y: 618 },
    clear: (x, y) => pw((x - 192) / 172, 3) + pw((y - 470) / 252, 3) < 1
  };
  MAPDEF.coude = {
    name: 'Le coude', seed: 37, band: [134, 772], c: [232, 450],
    river: { axis: 'y', f: y => 84 + 12 * Math.sin(y / 57) + 5 * Math.sin(y / 22 + 1) }, bridge: 604,
    fire: { x: 236, y: 368 }, stock: { x: 270, y: 402, ax: 257, ay: 420 }, rocks: { x: 318, y: 640 },
    clear: (x, y) => pw((x - 236) / 126, 4) + pw((y - 452) / 292, 4) < 1
  };
  const MAPS = {};
  function getMap(id) { world(id); return MAPS[id] || (MAPS[id] = makeMap(id)); }
  function makeMap(id) {
    const D = MAPDEF[id], r = rngOf(D.seed), ax = D.river.axis, f = D.river.f, at = D.bridge;
    const rdist = (x, y) => ax === 'x' ? Math.abs(y - f(x)) : Math.abs(x - f(y));
    const rside = (x, y) => ax === 'x' ? Math.sign(y - f(x)) : Math.sign(x - f(y));
    const along = (x, y) => ax === 'x' ? x : y;
    const fire = D.fire, home = rside(fire.x, fire.y);
    const B = ax === 'x' ? { x: at, y: f(at), dir: 'v' } : { x: f(at), y: at, dir: 'h' };
    const far = ax === 'x' ? { x: 0, y: -home } : { x: -home, y: 0 }, perp = { x: far.y, y: far.x };
    const bank = (a, d) => ax === 'x' ? { x: a, y: f(a) + home * d } : { x: f(a) + home * d, y: a }; // d > 0 : côté village
    const onBridge = (x, y) => B.dir === 'v' ? Math.abs(x - B.x) <= 13 : Math.abs(y - B.y) <= 13;
    const clear = (x, y) => x > 14 && x < W - 14 && y > 138 && y < H - 30 && D.clear(x, y) && rdist(x, y) > 40 && rside(x, y) === home;
    const open = (x, y, m) => {
      if (rdist(x, y) < 36 + m * 0.5) return true;
      if (Math.abs(along(x, y) - at) < 26 && rdist(x, y) < 66) return true;
      if (rside(x, y) !== home && rdist(x, y) < 74 && Math.abs(along(x, y) - at) < 150) return true;
      if (D.rocks && hyp(x - D.rocks.x, y - D.rocks.y) < 30) return true;
      for (const o of [[0, 0], [13, 0], [-13, 0], [0, 13], [0, -13]]) if (D.clear(x + o[0], y + o[1]) && rside(x + o[0], y + o[1]) === home && rdist(x + o[0], y + o[1]) > 30) return true;
      return false;
    };
    const trees = [];
    for (let i = 0; i < 3400; i++) {
      const x = EXT.x + r() * EXT.w, y = EXT.y + r() * EXT.h, rad = 13 + r() * 9;
      if (open(x, y, rad)) continue;
      let ok = true; for (const t of trees) if (hyp(t.x - x, t.y - y) < (t.r + rad) * 0.74) { ok = false; break; }
      if (ok) trees.push({ id: trees.length, x: Math.round(x), y: Math.round(y), r: Math.round(rad), kind: r() < 0.2 ? 'pine' : 'oak', pal: Math.floor(r() * 5), ph: r() * 6.28, v: Math.floor(r() * 3) });
    }
    const bushes = [];
    for (const k of [-3, -2, -1, 1, 2, 3]) { const p = bank(at + k * 33 + (r() - 0.5) * 8, -(37 + r() * 8)); if (p.x > 12 && p.x < W - 12 && p.y > 140 && p.y < H - 40) bushes.push({ id: bushes.length, x: Math.round(p.x), y: Math.round(p.y), berries: true }); }
    /* lisière : bois mort à ramasser, arbres à abattre, décor */
    const edge = [];
    for (let k = 0; k < 28; k++) {
      const a = k / 28 * 6.2832, dx = Math.cos(a), dy = Math.sin(a); let d = 20;
      while (d < 420 && clear(D.c[0] + dx * (d + 6), D.c[1] + dy * (d + 6))) d += 6;
      const p = { x: D.c[0] + dx * (d - 12), y: D.c[1] + dy * (d - 12), ox: D.c[0] + dx * (d + 16), oy: D.c[1] + dy * (d + 16) };
      if (clear(p.x, p.y) && rdist(p.x, p.y) > 54 && hyp(p.x - fire.x, p.y - fire.y) > 70) edge.push(p);
    }
    const dead = []; for (const p of edge) if (dead.every(q => hyp(q.x - p.x, q.y - p.y) > 58) && (!D.rocks || hyp(p.x - D.rocks.x, p.y - D.rocks.y) > 44)) dead.push({ x: Math.round(p.x), y: Math.round(p.y) });
    const decor = [];
    edge.forEach((p, k) => { if (k % 3 === 1 && rdist(p.ox, p.oy) > 44) decor.push(k % 2 ? { k: 'bush', x: Math.round(p.x + (r() - 0.5) * 10), y: Math.round(p.y + (r() - 0.5) * 10) } : { k: 'rock', x: Math.round(p.x), y: Math.round(p.y), s: 5 + r() * 4 }); });
    const chop = trees.filter(t => {
      if (t.x < 6 || t.x > W - 6 || t.y < 146 || t.y > H - 50 || rside(t.x, t.y) !== home || rdist(t.x, t.y) < 50) return false;
      for (let k = 0; k < 12; k++) { const a = k / 12 * 6.2832; if (clear(t.x + Math.cos(a) * (t.r + 42), t.y + Math.sin(a) * (t.r + 42))) return true; }
      return false;
    }).map(t => t.id);
    const stock = Object.assign({ w: 58, h: 30 }, D.stock);
    const near = { x: B.x - far.x * 34, y: B.y - far.y * 34 }, meadow = { x: B.x + far.x * 46, y: B.y + far.y * 46 };
    const arrive = { from: { x: B.x + far.x * 150, y: B.y + far.y * 150 }, to: k => ({ x: B.x - far.x * (52 + k * 9) + perp.x * (k % 2 ? 9 : -8), y: B.y - far.y * (52 + k * 9) + perp.y * (k % 2 ? 9 : -8) }) };
    const river = []; for (let a = (ax === 'x' ? EXT.x : EXT.y) - 24; a <= (ax === 'x' ? EXT.x + EXT.w : EXT.y + EXT.h) + 24; a += 8) river.push(bank(a, 0));
    return { id, name: D.name, band: D.band, c: D.c, axis: ax, home, fire, open: (x, y) => open(x, y, 0), stock, bridge: B, far, perp, near, meadow, arrive, rocks: D.rocks || null, river, rdist, rside, bank, along, at, onBridge, clear, trees, bushes, dead, decor, chop, seats: [1, 1.62, 2.2].flatMap((k, ring) => SEATS.map((s, q) => { const a = ring * 0.39, c = Math.cos(a), n = Math.sin(a); return { x: fire.x + (s[0] * c - s[1] * n) * k, y: fire.y + (s[0] * n + s[1] * c) * k }; })) }; // trois cercles autour du feu : vingt-quatre places
  }

  /* ---------- navigation : grille, coûts (les chemins attirent), plus court chemin ---------- */
  function buildNav(st, flood) {
    world(st.map);
    const map = getMap(st.map), g = new Uint8Array(N), c = new Float32Array(N).fill(1), F = map.fire;
    for (let i = 0; i < N; i++) {
      const x = cx(i), y = cy(i); let b = 0;
      if (map.rdist(x, y) < 21 && (flood || !map.onBridge(x, y))) b = 1;
      else if (hyp(x - F.x, y - F.y) < 13 || rectHit(x, y, map.stock, 1)) b = 1;
      else if (map.rocks && hyp(x - map.rocks.x, y - map.rocks.y) < 15) b = 1;
      else for (const bd of st.buildings) if (rectHit(x, y, bd, 1)) { b = 1; break; }
      g[i] = b;
    }
    for (const t of map.trees) if (t.x >= 0 && t.x < W && t.y >= 0 && t.y < H && !st.cut.includes(t.id)) g[Math.floor(t.y / CELL) * GW + Math.floor(t.x / CELL)] = 1;
    for (const i of st.roadCells) c[i] = 0.6;
    return { g, c };
  }
  const cellOf = (x, y) => Math.floor(y / CELL) * GW + Math.floor(x / CELL);
  const blockedAt = (nav, x, y) => x < 0 || y < 0 || x >= W || y >= H || nav.g[cellOf(x, y)] === 1;
  function nearestFree(nav, p) {
    const cx0 = Math.max(0, Math.min(GW - 1, Math.floor(p.x / CELL))), cy0 = Math.max(0, Math.min(GH - 1, Math.floor(p.y / CELL)));
    if (!nav.g[cy0 * GW + cx0]) return cy0 * GW + cx0;
    let best = cy0 * GW + cx0, bd = 1e9;
    for (let y = Math.max(0, cy0 - 6); y <= Math.min(GH - 1, cy0 + 6); y++) for (let x = Math.max(0, cx0 - 6); x <= Math.min(GW - 1, cx0 + 6); x++) {
      if (nav.g[y * GW + x]) continue;
      const d = hyp(x * CELL + 8 - p.x, y * CELL + 8 - p.y);
      if (d < bd) { bd = d; best = y * GW + x; }
    }
    return best;
  }
  /* A* générique : `goal` est une cellule ou une fonction ; `useCost` fait préférer les chemins */
  function astar(nav, s, goal, useCost) {
    const isFn = typeof goal === 'function', ex = isFn ? 0 : goal % GW, ey = isFn ? 0 : Math.floor(goal / GW);
    const cost = new Float32Array(N).fill(1e9), from = new Int32Array(N).fill(-1), closed = new Uint8Array(N), open = [s];
    cost[s] = 0; let end = -1;
    const hf = i => isFn ? 0 : hyp((i % GW) - ex, Math.floor(i / GW) - ey) * (useCost ? 0.6 : 1);
    while (open.length) {
      let bi = 0, bf = 1e9;
      for (let k = 0; k < open.length; k++) { const fv = cost[open[k]] + hf(open[k]); if (fv < bf) { bf = fv; bi = k; } }
      const cur = open.splice(bi, 1)[0];
      if (closed[cur]) continue; closed[cur] = 1;
      if (isFn ? goal(cur) : cur === goal) { end = cur; break; }
      const x0 = cur % GW, y0 = Math.floor(cur / GW);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = x0 + dx, ny = y0 + dy; if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue;
        const ni = ny * GW + nx; if (nav.g[ni] || closed[ni]) continue;
        if (dx && dy && (nav.g[y0 * GW + nx] || nav.g[ny * GW + x0])) continue;
        const c = cost[cur] + (dx && dy ? 1.42 : 1) * (useCost ? (nav.c[ni] + nav.c[cur]) / 2 : 1);
        if (c < cost[ni]) { cost[ni] = c; from[ni] = cur; open.push(ni); }
      }
    }
    if (end < 0) return null;
    const out = []; for (let c = end; c !== -1; c = from[c]) out.push(c); return out.reverse();
  }
  function los(nav, a, b, maxC) {
    const d = hyp(b.x - a.x, b.y - a.y), n = Math.max(1, Math.ceil(d / 4));
    for (let i = 0; i <= n; i++) { const k = i / n, x = a.x + (b.x - a.x) * k, y = a.y + (b.y - a.y) * k; if (blockedAt(nav, x, y) || nav.c[cellOf(x, y)] > maxC + 1e-4) return false; }
    return true;
  }
  /* chemin d'un villageois : il suit les chemins tracés et ne coupe à travers l'herbe que si c'est vraiment plus court */
  function findPath(nav, a, b) {
    const cells = astar(nav, nearestFree(nav, a), nearestFree(nav, b), true);
    const pts = [{ x: a.x, y: a.y, c: 1 }];
    if (cells) for (const i of cells) pts.push({ x: cx(i), y: cy(i), c: nav.c[i] });
    pts.push({ x: b.x, y: b.y, c: 1 });
    const out = [pts[0]]; let i = 0;
    while (i < pts.length - 1) {
      let j = Math.min(pts.length - 1, i + 14);
      for (; j > i + 1; j--) { let m = 0; for (let k = i + 1; k < j; k++) m = Math.max(m, pts[k].c); if (los(nav, pts[i], pts[j], m)) break; }
      out.push(pts[j]); i = j;
    }
    return out;
  }
  function cumLen(pts) { const c = [0]; for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + hyp(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)); return c; }
  const plen = (nav, a, b) => { const c = cumLen(findPath(nav, a, b)); return c[c.length - 1] / SPEED; };

  /* ---------- routes : un nouveau bâtiment se raccorde au chemin le plus proche, pas forcément à la place ---------- */
  function connect(st, p) {
    world(st.map);
    const nav = buildNav(st, false), road = new Uint8Array(N); for (const i of st.roadCells) road[i] = 1;
    const s = nearestFree(nav, p), path = astar(nav, s, i => road[i] === 1, false);
    if (!path) return;
    for (const i of path) if (!road[i]) st.roadCells.push(i);
    const pts = [[p.x, p.y]]; for (const i of path) pts.push([cx(i), cy(i)]);
    if (pts.length > 1) st.roadLines.push(pts);
  }
  function initRoads(st) {
    const map = getMap(st.map), F = map.fire, nav = buildNav(st, false);
    st.roadCells = []; st.roadLines = [];
    for (let i = 0; i < N; i++) if (!nav.g[i] && hyp(cx(i) - F.x, (cy(i) - F.y) * 1.15) < 38) st.roadCells.push(i);
    connect(st, map.near);
    const B = map.bridge, m = map.meadow, line = [[map.near.x, map.near.y], [B.x, B.y], [m.x, m.y]];
    st.roadLines.push(line);
    const side = []; for (const a of [-104, -70, -36, 0, 36, 70, 104]) { const p = map.bank(map.at + a, -47); if (p.x > 8 && p.x < W - 8 && p.y > 140) side.push([p.x, p.y]); }
    if (side.length > 1) st.roadLines.push(side);
    for (const q of line.concat(side)) { const i = cellOf(q[0], q[1]); if (i >= 0 && i < N && !st.roadCells.includes(i)) st.roadCells.push(i); }
    connect(st, { x: map.stock.ax, y: map.stock.ay });
  }
  function door(b) { return { x: b.x + b.w / 2, y: b.y + b.h + 7 }; }

  /* ---------- placement décidé par les villageois ---------- */
  function placeBuilding(st, type, rng) {
    world(st.map);
    const map = getMap(st.map), def = BT[type], F = map.fire, S = map.stock, GX = 12, GY = 18;
    const road = new Uint8Array(N); for (const i of st.roadCells) road[i] = 1;
    /* distance (en cases) au chemin le plus proche */
    const dr = new Int16Array(N).fill(999); let q = st.roadCells.slice(); for (const i of q) dr[i] = 0;
    while (q.length) { const nq = []; for (const i of q) { const x0 = i % GW, y0 = Math.floor(i / GW); for (const o of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x0 + o[0], ny = y0 + o[1]; if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue; const ni = ny * GW + nx; if (dr[ni] > dr[i] + 1) { dr[ni] = dr[i] + 1; nq.push(ni); } } } q = nq; }
    const houses = st.buildings.filter(b => BT[b.type].beds);
    let cxm = 0, cym = 0; const ch = map.chop.map(id => map.trees[id]).filter(t => !st.cut.includes(t.id)); ch.forEach(t => { cxm += t.x / ch.length; cym += t.y / ch.length; });
    let best = null, bs = -1e9;
    for (let y = 140; y + def.h <= H - 40; y += 4) for (let x = 16; x + def.w <= W - 16; x += 4) {
      const mx = x + def.w / 2, my = y + def.h / 2;
      if (!map.clear(x - 3, y - 3) || !map.clear(x + def.w + 3, y - 3) || !map.clear(x - 3, y + def.h + 3) || !map.clear(x + def.w + 3, y + def.h + 3) || !map.clear(mx, y + def.h + 14)) continue;
      let ok = true;
      for (const b of st.buildings) if (x < b.x + b.w + GX && x + def.w + GX > b.x && y < b.y + b.h + GY && y + def.h + GY > b.y) { ok = false; break; }
      if (!ok) continue;
      const nx = Math.max(x, Math.min(F.x, x + def.w)), ny = Math.max(y, Math.min(F.y, y + def.h));
      if (hyp(nx - F.x, (ny - F.y) * 1.15) < 56) continue;
      if (x < S.x + S.w + 14 && x + def.w + 14 > S.x - 14 && y < S.y + S.h + 22 && y + def.h + 18 > S.y) continue;
      if (map.rocks && hyp(Math.max(x, Math.min(map.rocks.x, x + def.w)) - map.rocks.x, Math.max(y, Math.min(map.rocks.y, y + def.h)) - map.rocks.y) < 30) continue;
      for (let yy = Math.floor((y - 4) / CELL); yy <= Math.floor((y + def.h + 4) / CELL) && ok; yy++) for (let xx = Math.floor((x - 4) / CELL); xx <= Math.floor((x + def.w + 4) / CELL); xx++) {
        if (xx < 0 || yy < 0 || xx >= GW || yy >= GH) continue; const px = xx * CELL + 8, py = yy * CELL + 8;
        if (road[yy * GW + xx] && px > x - 4 && px < x + def.w + 4 && py > y - 4 && py < y + def.h + 4) { ok = false; break; }
      }
      if (!ok) continue;
      const d = hyp(mx - F.x, my - F.y), dc = cellOf(mx, Math.min(H - 1, y + def.h + 8)), dRoad = dr[dc] >= 999 ? 12 : dr[dc];
      let s;
      if (def.beds) { s = -Math.abs(dRoad - 0.5) * 9 - d * 0.16; for (const b of houses) if (hyp(b.x + b.w / 2 - mx, b.y + b.h / 2 - my) < 66) { s += 5; break; } }
      else if (type === 'cueillette') s = -hyp(mx - map.near.x, my - map.near.y) - dRoad * 2;
      else if (type === 'pecheur') s = -Math.abs(map.rdist(mx, my) - 66) * 2 - d * 0.12 - (Math.abs(map.along(mx, my) - map.at) < 70 ? 60 : 0);
      else if (type === 'carriere') s = map.rocks ? -hyp(mx - map.rocks.x, my - map.rocks.y) : -d;
      else if (type === 'bucheron') s = -hyp(mx - cxm, my - cym) * 0.5 - Math.abs(d - 150) * 0.4 - dRoad * 2;
      else if (type === 'four') s = -hyp(mx - (S.x + S.w / 2), my - (S.y + S.h / 2)) - dRoad * 3;
      else if (type === 'table' || type === 'brasero') s = -d * 1.2 - dRoad;
      else if (type === 'digue') s = -Math.abs(map.rdist(mx, my) - 54) * 2 - d * 0.1;
      else s = -Math.abs(d - 124) - dRoad * 5;
      for (const b of st.buildings) { if (Math.abs(b.x - x) < 2 && Math.abs(b.y - y) < 140) { s += 4; break; } }
      for (const b of st.buildings) { if (Math.abs(b.y + b.h - y - def.h) < 2 && Math.abs(b.x - x) < 140) { s += 4; break; } }
      s += rng() * (def.beds ? 9 : 20);
      if (s > bs) { bs = s; best = { x, y, w: def.w, h: def.h }; }
    }
    return best;
  }

  /* ---------- pistes d'animation ---------- */
  class Track {
    constructor(p, t) { this.s = []; this.p = { x: p.x, y: p.y }; this.t = t; }
    est(nav, dest) { return plen(nav, this.p, dest); }
    walk(nav, dest, o = {}) {
      const pts = findPath(nav, this.p, dest), cum = cumLen(pts), L = cum[cum.length - 1];
      this.p = { x: dest.x, y: dest.y };
      if (L < 1) return 0;
      const dur = L / (SPEED * (o.f || 1));
      this.s.push({ k: 'walk', t0: this.t, t1: this.t + dur, pts, cum, L, carry: o.carry || null, label: o.label || 'Marche' });
      this.t += dur; return dur;
    }
    act(anim, dur, o = {}) {
      if (dur <= 0.001) return;
      this.s.push({ k: 'act', t0: this.t, t1: this.t + dur, x: this.p.x, y: this.p.y, anim, look: o.look || null, carry: o.carry || null, inside: o.inside == null ? null : o.inside, bed: o.bed == null ? null : o.bed, tree: o.tree == null ? null : o.tree, label: o.label || '' });
      this.t += dur;
    }
    until(t, anim, o) { this.act(anim, t - this.t, o); }
    walkBy(nav, dest, deadline, o = {}) { const d = this.est(nav, dest), left = Math.max(0.12, deadline - this.t); return this.walk(nav, dest, Object.assign({}, o, { f: Math.max(1, d / left) })); }
    /* aller, agir, revenir : tout tient dans le créneau qui finit à `end` */
    trip(nav, at, home, end, minAct, anim, o1, oa, o2) {
      const w1 = this.est(nav, at), w2 = plen(nav, at, home), avail = Math.max(0.3, end - this.t - minAct), f = Math.max(1, (w1 + w2) / avail);
      this.walk(nav, at, Object.assign({}, o1, { f }));
      this.until(Math.max(this.t + minAct, end - w2 / f), anim, oa);
      const tAct = this.t; this.walk(nav, home, Object.assign({}, o2, { f })); return tAct;
    }
  }
  function sample(tr, t) {
    const s = tr.s; if (!s.length) return null;
    let seg = s[s.length - 1];
    if (t <= s[0].t0) seg = s[0]; else for (let i = 0; i < s.length; i++) if (t < s[i].t1) { seg = s[i]; break; }
    if (seg.k === 'walk') {
      const k = Math.max(0, Math.min(1, (t - seg.t0) / (seg.t1 - seg.t0))), d = k * seg.L;
      let i = 1; while (i < seg.cum.length - 1 && seg.cum[i] < d) i++;
      const a = seg.pts[i - 1], b = seg.pts[i], sl = seg.cum[i] - seg.cum[i - 1] || 1, q = (d - seg.cum[i - 1]) / sl;
      return { x: a.x + (b.x - a.x) * q, y: a.y + (b.y - a.y) * q, dx: b.x - a.x, dy: b.y - a.y, moving: true, anim: 'walk', carry: seg.carry, inside: null, bed: null, label: seg.label, dist: d, rem: seg.L - d, tree: null };
    }
    const lx = seg.look ? seg.look.x - seg.x : 0, ly = seg.look ? seg.look.y - seg.y : 1;
    return { x: seg.x, y: seg.y, dx: lx, dy: ly, moving: false, anim: seg.anim, carry: seg.carry, inside: seg.inside, bed: seg.bed, label: seg.label, k: t - seg.t0, tree: seg.tree, look: seg.look };
  }

  /* ---------- les villageois : prénom, allure et caractère tirés au hasard à chaque partie ---------- */
  const NAMES = { f: ['Anne', 'Clara', 'Rose', 'Odile', 'Jeanne', 'Lucie', 'Marthe', 'Élise', 'Louise', 'Adèle', 'Suzanne', 'Colette', 'Agathe', 'Blanche', 'Margot', 'Céleste'], m: ['Marc', 'Bastien', 'Hugo', 'Gérard', 'Léon', 'Émile', 'Jules', 'Félix', 'Gaspard', 'Octave', 'Basile', 'Lucien', 'Armand', 'Noël', 'Théo', 'Anselme'] };
  const LOOKS = { f: { morph: ['f_mince', 'f_moyenne', 'f_forte', 'f_sablier'], hs: ['long', 'ponytail', 'curly', 'bun', 'short', 'braid', 'bob', 'fringe', 'braids2'] }, m: { morph: ['h_mince', 'h_moyen', 'h_costaud', 'h_fort'], hs: ['short', 'sidepart', 'spiky', 'bald', 'curly', 'receding', 'mop', 'tied'] } };
  const CHARS = ['confiant', 'inquiet', 'taiseux', 'genereux', 'bougon'];
  function cast(seed, n) {
    const r = rngOf((seed >>> 0) * 13 + 5), pick = a => a[Math.floor(r() * a.length)], used = {}, out = []; let bal = 0;
    const chars = CHARS.map(c => [r(), c]).sort((a, b) => a[0] - b[0]).map(q => q[1]); // les cinq caractères d'abord, dans un ordre tiré au sort
    for (let i = 0; i < n; i++) {
      const sex = bal > 1 ? 'm' : bal < -1 ? 'f' : r() < 0.5 ? 'f' : 'm'; bal += sex === 'f' ? 1 : -1;
      let name = pick(NAMES[sex]); while (used[name]) name = pick(NAMES[sex]); used[name] = 1;
      const v = { name, sex, morph: pick(LOOKS[sex].morph), skin: Math.floor(r() * 5), hs: pick(LOOKS[sex].hs), hc: Math.floor(r() * 6), char: chars[i % 5] };
      if (sex === 'm' && r() < 0.45) v.beard = pick(['full', 'goatee', 'moustache', 'long', 'collier', 'favoris', 'handlebar', 'stubble']);
      const r2 = rngOf((seed >>> 0) * 29 + i * 101 + 7); v.face = Math.floor(r2() * 4); v.eyes = Math.floor(r2() * 4); v.nose = Math.floor(r2() * 3); v.blush = r2() < 0.3;
      out.push(v);
    }
    return out;
  }
  const popOf = ch => (ch.survival ? 14 : 0) + ch.villagers.length + (ch.events || []).reduce((n, e) => n + (e.type === 'arrivals' ? e.villagers.length : 0), 0);

  /* ---------- état initial, événements ---------- */
  function newGame(ch, seed) {
    seed = seed == null ? ch.seed : seed >>> 0;
    const mapId = ch.survival ? ['pre', 'coude'][seed % 2] : ch.map, map = getMap(mapId), rng = rngOf(seed + 17);
    const st = { ch: ch.id, map: mapId, day: 1, days: ch.days, seed, food: ch.food, wood: ch.wood, stone: ch.stone || 0, clay: ch.clay || 0, brick: ch.brick || 0, plank: ch.plank || 0, meal: ch.meal || 0, culture: ch.culture || 0, ingen: ch.ingen || 0, bloom: 0, joy: 0, nextId: 1, begun: 0, arrived: [], buildings: [], villagers: [], cut: [], roadCells: [], roadLines: [], everLacked: false, lastAllOk: false, lastRoofOk: false, graves: [] };
    initRoads(st);
    if (ch.survival) { st.ev = []; st.evGen = 2; st.cards = null; st.hist = []; st.bell = -99; }
    st.pool = cast(seed, popOf(ch));
    ch.villagers.forEach((_, i) => { const v = st.pool.shift(); st.villagers.push(Object.assign({ id: i, job: null, work: null, hunger: 0, roofless: 0, alive: true, home: null, pos: { x: map.seats[i % map.seats.length].x, y: map.seats[i % map.seats.length].y } }, v, ch.villagers[i].child ? { child: true, young: true, school: 0, beard: null } : {})); });
    let hk = 0; const nearFire = v => { const q = map.seats[v.id % map.seats.length]; return { x: q.x, y: q.y }; };
    for (const s of ch.start) {
      const r = placeBuilding(st, s.type, rng); if (!r) continue;
      const b = { id: st.nextId++, type: s.type, x: r.x, y: r.y, w: r.w, h: r.h, workers: (s.workers || []).slice(), day: 0 };
      st.buildings.push(b); connect(st, { x: door(b).x, y: door(b).y - 3 });
      for (const id of b.workers) { st.villagers[id].job = BT[b.type].job; st.villagers[id].work = b.id; }
      if (BT[b.type].own) { b.owners = []; for (let k = 0; k < BT[b.type].beds && hk < st.villagers.length && !s.empty; k++) { const v = st.villagers[hk++]; b.owners.push(v.id); v.home = b.id; v.pos = door(b); } }
    }
    return st;
  }
  function capacity(st) { return st.buildings.reduce((n, b) => n + (b.gone ? 0 : BT[b.type].beds), 0); }
  function draw(st) { const ch = CHALLENGES[st.ch]; return ch.survival ? (st.cards || []).slice() : ch.draws[(st.day - 1) % ch.draws.length].slice(); }
  /* ---------- survie ---------- */
  const FAM = { toit: ['cabane', 'cabanon', 'dortoir', 'abri', 'tente', 'maison', 'chaumiere', 'grange', 'auberge'], vivres: ['cueillette', 'potager', 'pecheur', 'poulailler', 'champi', 'rucher', 'verger', 'bergerie', 'four', 'etal', 'gardemanger', 'moulin', 'fumoir', 'puits'], bois: ['bucheron', 'scierie', 'bucher', 'menuiserie'], pierre: ['carriere', 'taillerie'] };
  const GUARD = { frost: ['serre', 'brasero'], fog: ['fanal'], storm: ['digue'], flood: ['digue'], fire: ['puits'], drought: ['puits'], rats: ['gardemanger'], wolves: ['brasero'] };
  const LIGHT = ['abri', 'tente', 'etal', 'rucher', 'verger', 'fanal', 'bucher', 'gardemanger', 'cloche', 'potager', 'champi'];   // ce que le vent emporte
  /* le tirage du matin : presque au hasard, jamais injuste.
     1) une carte répond au manque le plus pressant ; 2) une carte au moins est payable ; 3) la troisième est libre ;
     on évite les cartes des deux derniers jours, les doublons, et ce qui ne servirait à rien (un moulin sans four). */
  function survDraw(st) {
    world(st.map);
    const r = rngOf((st.seed >>> 0) * 53 + st.day * 7919 + 3), live = st.villagers.filter(v => v.alive).length, has = t => st.buildings.some(b => b.type === t && !b.gone), recent = [].concat.apply([], st.hist || []);
    const once = ['puits', 'gardemanger', 'menuiserie', 'taillerie', 'bucher', 'serre', 'fanal', 'digue', 'brasero'];
    const useful = t => !(t === 'moulin' && !has('four')) && !(t === 'fumoir' && !has('pecheur')) && !(once.includes(t) && has(t)) && !((BT[t].cost.stone || 0) > st.stone && !has('carriere') && t !== 'carriere');
    const room = {}, fits = t => { const k = BT[t].w + 'x' + BT[t].h; return room[k] != null ? room[k] : (room[k] = !!placeBuilding(st, t, rngOf(1))); }, pay = t => afford(st, t), ok = t => useful(t) && fits(t), picked = [];
    const pick = (list, need) => { let c = list.filter(t => useful(t) && !picked.includes(t) && (!need || pay(t))); const fresh = c.filter(t => !recent.includes(t)); if (fresh.length) c = fresh; while (c.length) { const t = c.splice(Math.floor(r() * c.length), 1)[0]; if (fits(t)) { picked.push(t); return t; } } return null; };
    const all = [].concat(FAM.toit, FAM.vivres, FAM.bois, FAM.pierre, ['serre', 'fanal', 'digue', 'brasero']);
    const beds = capacity(st) - st.buildings.reduce((n, b) => n + (BT[b.type].life && !b.gone && (b.nights || 0) >= BT[b.type].life - 1 ? BT[b.type].beds : 0), 0);
    const foodIn = st.buildings.reduce((n, b) => n + (b.gone || BT[b.type].out !== 'food' ? 0 : BT[b.type].per * BT[b.type].posts), 0);
    const coming = [1, 2].map(k => eventsOn(st, st.day + k)).reduce((a, b) => a.concat(b), []).map(e => e.type).filter(t => GUARD[t] && !GUARD[t].some(has));
    const need = beds < live ? FAM.toit : foodIn < live || st.food < live ? FAM.vivres : st.wood < 3 && !has('bucheron') ? FAM.bois : coming.length ? GUARD[coming[0]] : !has('carriere') && st.day > 3 ? FAM.pierre : null;
    if (need) pick(need, true) || pick(need, false);
    if (!picked.some(pay)) pick(all, true);
    if (st.day % 10 === 0 && live < 8 && ok('cloche')) picked.push('cloche'); // la cloche revient tous les dix jours, tant que le village compte moins de huit personnes
    while (picked.length < 3 && pick(all, false));
    return picked;
  }
  /* qui travaille où ce matin. D'abord les vœux du joueur (st.pins : l'identifiant d'un bâtiment, ou -1 pour « sans poste »), puis les autres se répartissent d'eux-mêmes :
     de quoi manger, puis le bois, la pierre, le reste ; ils évitent ce que le temps empêche et gardent leur poste d'hier quand c'est possible.
     Le bâtiment bâti ce jour (extra) se sert en dernier : il prend les bras libres, sinon ceux d'un poste moins pressant que personne n'a fixé.
     Ne modifie rien : le même calcul sert à l'écran du matin et à la journée. */
  function survJobs(st, mourn, extra) {
    const wz = weather(st), has = k => st.buildings.some(b => BT[b.type].anti === k && !b.gone && b.id !== extra);
    const stopped = d => !!((wz.dry && d.dryStop) || (wz.storm && d.storm && !has('storm')) || (wz.fog && d.fog && !has('fog')) || (wz.frost && d.frost && !(d.garden && has('frost'))));
    const rank = b => { const d = BT[b.type]; return (stopped(d) ? 10 : 0) + (d.out === 'food' ? 0 : d.out === 'wood' ? 1 : d.out === 'stone' ? 2 : 3) - (d.per || 0) / 10; };
    const r = rngOf((st.seed >>> 0) * 389 + st.day * 2741 + 17), alive = st.villagers.filter(v => v.alive), pins = st.pins || {}, off = {}, work = {}, crew = {}, halt = {};
    const B = st.buildings.filter(b => BT[b.type].posts && !b.gone && b.id !== extra), byId = {};
    for (const b of B) { crew[b.id] = []; byId[b.id] = b; if (stopped(BT[b.type])) halt[b.id] = true; }
    const put = (v, b) => { work[v.id] = b.id; crew[b.id].push(v.id); }, free = () => alive.filter(v => work[v.id] === undefined);
    for (const v of alive) {
      off[v.id] = v.sick > 0 ? 'sick' : (mourn || []).includes(v.id) ? 'mourn' : null; const p = pins[v.id];
      if (off[v.id] || p === -1) work[v.id] = null; else if (p != null && byId[p] && crew[p].length < BT[byId[p].type].posts) put(v, byId[p]);
    }
    for (const b of B.slice().sort((a, c) => rank(a) - rank(c))) while (crew[b.id].length < BT[b.type].posts) { const f = free(); if (!f.length) break; put(f.find(x => x.work === b.id) || f[Math.floor(r() * f.length)], b); }
    const nb = extra == null ? null : st.buildings.find(b => b.id === extra);
    if (nb && BT[nb.type].posts && !nb.gone) {
      crew[nb.id] = []; if (stopped(BT[nb.type])) halt[nb.id] = true;
      while (crew[nb.id].length < BT[nb.type].posts) {
        const f = free(); let v = f.length ? f[Math.floor(r() * f.length)] : null;
        if (!v) { const from = B.filter(b => rank(b) > rank(nb) && crew[b.id].some(id => pins[id] == null)).sort((a, c) => rank(c) - rank(a))[0]; if (!from) break; const id = crew[from.id].filter(x => pins[x] == null).pop(); crew[from.id].splice(crew[from.id].indexOf(id), 1); v = st.villagers[id]; }
        put(v, nb);
      }
    }
    for (const v of alive) if (work[v.id] === undefined) work[v.id] = null;
    return { work, off, crew, halt };
  }
  /* les événements : rares et annoncés au début, puis plus fréquents, plus durs, et parfois soudains */
  function genEvents(st, day) {
    const r = rngOf((st.seed >>> 0) * 31 + day * 104729 + 11), pool = [['fog', 3], ['storm', 4], ['wind', 5], ['rats', 6], ['sick', 7], ['wolves', 8], ['frost', 9], ['drought', 10], ['fire', 11], ['flood', 13]].filter(q => day >= q[1]).map(q => q[0]);
    if (!pool.length) return;
    const n = (r() < Math.min(0.9, 0.25 + day * 0.035) ? 1 : 0) + (day >= 12 && r() < Math.min(0.7, (day - 10) * 0.04) ? 1 : 0), seen = {}, lv = 1 + Math.floor(day / 12);
    for (let k = 0; k < n; k++) { const t = pool[Math.floor(r() * pool.length)]; if (seen[t] || (t === 'frost' && weather(st, day).frost) || (t === 'drought' && weather(st, day).dry)) continue; seen[t] = 1; const e = { day, type: t, lv }; if (t === 'frost') e.len = Math.min(5, 1 + lv); if (t === 'drought') e.len = Math.min(4, 1 + lv); if (day >= 20 && r() < 0.35 && t !== 'frost') e.sudden = true; st.ev.push(e); }
  }
  function survMorning(st, map) {
    while (st.evGen < st.day + 2) genEvents(st, ++st.evGen);
    const r = rngOf((st.seed >>> 0) * 17 + st.day * 613 + 29), live = st.villagers.filter(v => v.alive);
    /* la cloche a sonné il y a deux jours : quelqu'un l'a entendue */
    for (const b of st.buildings) if (BT[b.type].call && !b.rung && !b.gone && st.day - b.day >= BT[b.type].call && st.pool.length) { b.rung = true; st.bell = st.day; const id = st.villagers.length, v = st.pool.shift(); st.villagers.push(Object.assign({ id, job: null, work: null, hunger: 0, roofless: 0, alive: true, home: null, pos: map.arrive.to(0) }, v)); st.arrived.push(id); }
    for (const e of eventsOn(st)) if (e.type === 'sick' && !e.who) { e.who = []; for (let k = 0; k < Math.min(3, e.lv || 1, Math.max(1, live.length >> 1)); k++) { const c = live.filter(v => !(v.sick > 0)); if (c.length) { const v = c[Math.floor(r() * c.length)]; v.sick = 2; e.who.push(v.id); } } }
    if (st.pins) for (const k in st.pins) { const v = st.villagers[k]; if (!v || !v.alive || (st.pins[k] !== -1 && !st.buildings.some(b => b.id === st.pins[k] && !b.gone))) delete st.pins[k]; } // un vœu ne survit ni à son villageois ni à son bâtiment
    st.cards = survDraw(st); st.hist = (st.hist || []).concat([st.cards]).slice(-2);
  }
  const evList = st => CHALLENGES[st.ch].survival ? (st.ev || []) : (CHALLENGES[st.ch].events || []);
  function eventsOn(st, day) { const d = day == null ? st.day : day; return evList(st).filter(e => e.day === d && !(e.sudden && d > st.day)); } // un événement soudain ne se voit pas venir
  function weather(st, day) { const d = day == null ? st.day : day, ev = evList(st); return { storm: ev.some(e => e.type === 'storm' && e.day === d), fog: ev.some(e => e.type === 'fog' && e.day === d), frost: ev.some(e => e.type === 'frost' && e.day <= d && (e.len == null || d < e.day + e.len)), dry: ev.some(e => e.type === 'drought' && e.day <= d && d < e.day + (e.len || 1)) }; }
  /* début de journée : les événements du matin s'appliquent avant le choix du joueur */
  function beginDay(S) {
    world(S.map);
    if (S.begun === S.day) return S;
    const st = JSON.parse(JSON.stringify(S)), map = getMap(st.map); st.begun = st.day; st.arrived = [];
    st.buildings = st.buildings.filter(b => !b.gone); // un abri de branchages ne tient que deux nuits
    for (const r of RES) if (st[r] == null) st[r] = 0; // parties gardées avant la manufacture
    for (const e of eventsOn(st)) if (e.type === 'arrivals') e.villagers.forEach((_, k) => {
      const id = st.villagers.length, v = st.pool.shift();
      st.villagers.push(Object.assign({ id, job: null, work: null, hunger: 0, roofless: 0, alive: true, home: null, pos: map.arrive.to(k) }, v, e.villagers[k].child ? { child: true, young: true, school: 0, beard: null } : {})); st.arrived.push(id);
      for (const b of st.buildings) st.food += BT[b.type].welcome || 0;
    });
    if (CHALLENGES[st.ch].survival) survMorning(st, map);
    else for (const e of eventsOn(st)) if (e.type === 'sick') { /* dans les défis, la maladie est annoncée : on sait combien tombent malades, pas qui */
      const r = rngOf((st.seed >>> 0) * 53 + st.day * 7919 + 3), got = [];
      for (let k = 0; k < (e.n || 1); k++) { const c = st.villagers.filter(v => v.alive && !(v.sick > 0)); if (!c.length) break; const v = c[Math.floor(r() * c.length)]; v.sick = 2; v.grave = !!e.grave; got.push(v.id); }
      st.sickNew = got;
    }
    if (!st.town && st.villagers.filter(v => v.alive).length >= 10) st.town = st.day; // dix habitants : le village devient un bourg
    return st;
  }
  /* répartition par priorité : les plus en danger d'abord, puis le hasard */
  function allocate(list, n, key, rng) {
    const arr = list.map(v => ({ v, k: v[key], r: rng() })); arr.sort((a, b) => b.k - a.k || a.r - b.r);
    return arr.slice(0, Math.max(0, n)).map(a => a.v.id);
  }

  /* ---------- plan d'une journée ---------- */
  function planDay(S, choice, mourn) {
    world(S.map);
    const st = JSON.parse(JSON.stringify(S)), map = getMap(st.map), F = map.fire, SK = map.stock, stockPt = { x: SK.ax, y: SK.ay }, stockLook = { x: SK.x + SK.w / 2, y: SK.y + SK.h / 2 };
    const rng = rngOf(st.seed * 977 + st.day * 131 + 5);
    const ev = [], log = [], tracks = {}, alive = st.villagers.filter(v => v.alive);
    const E = (t, type, o) => ev.push(Object.assign({ t, type }, o || {}));
    alive.forEach(v => { tracks[v.id] = new Track(v.pos, T.BUILD); });
    const wz = weather(st), storm = wz.storm, frost = wz.frost, fog = wz.fog, dry = !!wz.dry, joyOn = !!CHALLENGES[st.ch].joy, joyQ = [], worked = {};
    const anti = k => st.buildings.some(b => BT[b.type].anti === k && !b.gone);
    const surv = !!CHALLENGES[st.ch].survival, today = eventsOn(st);
    if (surv) for (const v of alive) v.off = v.sick > 0 ? 'sick' : (mourn || []).includes(v.id) ? 'mourn' : null; // malades et endeuillés ne travaillent pas
    else for (const v of alive) v.off = v.sick > 0 ? 'sick' : v.child ? 'child' : null; // les malades et les enfants ne travaillent pas
    /* l'école : les enfants y vont d'eux-mêmes tant qu'il y a de la place, les plus avancés d'abord */
    const kids = alive.filter(v => v.child), pupils = {}, schools = st.buildings.filter(b => BT[b.type].school && !b.gone);
    kids.slice().sort((a, b) => (b.school || 0) - (a.school || 0) || a.id - b.id).forEach((v, k) => { const sb = schools[Math.floor(k / BT.ecole.school)]; if (sb) pupils[v.id] = sb; });
    const kidsFree = kids.filter(v => !pupils[v.id]);
    { const l = kids.filter(v => pupils[v.id]).map(v => v.name); if (l.length) E(T.WORK + 0.06, 'msg', { msg: names(l) + (l.length > 1 ? ' partent à l’école.' : ' part à l’école.') }); }
    if (st.arrived && st.arrived.length) { const l = st.arrived.map(id => st.villagers[id].name); log.push({ k: 'new', text: names(l) + (l.length > 1 ? ' ont rejoint' : ' a rejoint') + ' le village.' }); }
    const sum = { day: st.day, built: null, builts: [], got: {}, v: {}, deaths: [], jobs: [], homes: [] }; for (const r of RES) sum.got[r] = 0;
    const gain = (t, res, n, x, y) => { E(t, 'res', { [res]: n, x, y }); st[res] += n; sum.got[res] += n; };

    /* 1. chantier */
    /* un chantier par jour ; deux, au choix, quand le village est un bourg. Les bras se partagent entre les deux. */
    const nbs = [];
    for (const pick of (Array.isArray(choice) ? choice : choice ? [choice] : []).slice(0, maxBuilds(st))) {
      if (!(BT[pick] && afford(st, pick))) continue;
      const def = BT[pick], r = placeBuilding(st, pick, rng);
      if (r) {
        const cost = costOf(st, pick), pay = {}; for (const k of RES) if (cost[k]) { st[k] -= cost[k]; pay[k] = -cost[k]; }
        const b = { id: st.nextId++, type: pick, x: r.x, y: r.y, w: def.w, h: def.h, workers: [], day: st.day, t0: 6.5, t1: 8.85 };
        st.buildings.push(b); connect(st, { x: door(b).x, y: door(b).y - 3 }); nbs.push(b);
        E(6.02 + nbs.length * 0.001, 'site', Object.assign({ bid: b.id }, pay));
      }
    }
    const nb = nbs[0] || null; sum.built = nb ? nb.type : null; sum.builts = nbs.map(b => b.type);
    const m0 = {}; for (const r of RES) m0[r] = st[r]; m0.joy = st.joy || 0; // ce qu'il y a en réserve une fois les chantiers payés : c'est cela que les ateliers transforment aujourd'hui
    let nav = buildNav(st, storm && !anti('storm'));
    if (nb) {
      const sites = nbs.map(nb => ({ nb, spots: [{ x: nb.x - 9, y: nb.y + nb.h * 0.55 }, { x: nb.x + nb.w + 9, y: nb.y + nb.h * 0.55 }, { x: nb.x + nb.w * 0.25, y: nb.y + nb.h + 10 }, { x: nb.x + nb.w * 0.75, y: nb.y + nb.h + 10 }, { x: nb.x - 9, y: nb.y + nb.h * 0.2 }, { x: nb.x + nb.w + 9, y: nb.y + nb.h * 0.2 }, { x: nb.x - 10, y: nb.y + nb.h * 0.92 }, { x: nb.x + nb.w + 10, y: nb.y + nb.h * 0.92 }], ctr: { x: nb.x + nb.w / 2, y: nb.y + nb.h / 2 } }));
      alive.forEach((v, i) => {
        const site = sites[i % sites.length], nb = site.nb, spots = site.spots, ctr = site.ctr; i = Math.floor(i / sites.length) + (i % sites.length) * 3;
        const tr = tracks[v.id]; tr.act('idle', 0.04 + i * 0.035, { label: 'Se réveille' });
        if (v.child) { tr.until(nb.t1, 'idle', { look: ctr, label: 'Regarde le chantier' }); return; }
        const sp = { x: SK.ax + (i % 2 ? -7 : 3), y: SK.ay + (i % 4 > 1 ? 8 : 0) }, spot = spots[i % spots.length];
        if (tr.est(nav, sp) + plen(nav, sp, spot) < 1.75) { // assez près : passe prendre des planches
          tr.walkBy(nav, sp, 7.4, { label: 'Va chercher des planches' });
          tr.act('take', 0.1, { look: stockLook, label: 'Prend des planches' });
          tr.walkBy(nav, spot, 8.3, { carry: 'plank', label: 'Porte des planches' });
        } else if (tr.est(nav, spot) / 1.6 > nb.t1 - 0.2 - tr.t) { tr.until(nb.t1, 'idle', { label: 'Trop loin pour rejoindre le chantier' }); return; } // plutôt que de courir, on laisse faire les autres
        else tr.walkBy(nav, spot, Math.min(nb.t1 - 0.2, Math.max(8.3, tr.t + tr.est(nav, spot) / 1.45)), { label: 'Rejoint le chantier' }); // qui a dormi loin arrive un peu plus tard
        tr.until(nb.t1, 'build', { look: ctr, label: 'Bâtit : ' + BT[nb.type].name.toLowerCase() });
      });
      for (const b of nbs) { E(b.t1 + (b === nb ? 0 : 0.012), 'built', { bid: b.id, msg: BT[b.type].name }); log.push({ k: 'build', text: 'Bâti : ' + BT[b.type].name.toLowerCase() + '.' }); }
    } else alive.forEach((v, i) => {
      const tr = tracks[v.id]; tr.act('idle', 0.1 + i * 0.1, { label: 'Se réveille' });
      { const sq = map.seats[i % map.seats.length], seat = i < 8 ? { x: F.x + SEATS[i][0] * 1.5, y: F.y + SEATS[i][1] * 1.5 } : { x: F.x + (sq.x - F.x) * 1.25, y: F.y + (sq.y - F.y) * 1.25 }; tr.walkBy(nav, seat, Math.min(T.WORK - 0.05, Math.max(8.2, tr.t + tr.est(nav, seat) / 1.45)), { label: 'Rejoint le feu' }); } // qui a dormi loin arrive plus tard, sans courir
      tr.until(8.4 + i * 0.06, 'idle', { look: F, label: 'Se réchauffe près du feu' });
    });
    alive.forEach(v => tracks[v.id].until(T.WORK, 'idle', { label: 'Regarde autour' }));

    /* 2. postes : chacun garde le sien, les postes libres vont aux villageois sans poste */
    if (surv) { /* en survie, on redistribue chaque matin : les vœux du joueur d'abord, puis chacun de lui-même (voir survJobs) */
      const J = survJobs(st, mourn, nb ? nb.id : null);
      for (const b of st.buildings) b.workers = (J.crew[b.id] || []).slice();
      for (const v of alive) { const was = v.work, b = J.work[v.id] == null ? null : st.buildings.find(x => x.id === J.work[v.id]); v.work = b ? b.id : null; v.job = b ? BT[b.type].job : null; if (v.work !== was) E(T.WORK + 0.02, 'job', { vid: v.id, job: v.job }); }
    }
    for (const b of st.buildings) {
      const def = BT[b.type]; if (!def.posts) continue;
      b.workers = b.workers.filter(id => st.villagers[id].alive); const got = [];
      while (b.workers.length < def.posts) {
        const free = surv ? [] : alive.filter(v => v.job == null && !v.off); if (!free.length) break; // en survie, tout est déjà réparti : qui reste sans poste l'est par choix
        const v = free[Math.floor(rng() * free.length)];
        v.job = def.job; v.work = b.id; b.workers.push(v.id); got.push(v); E(T.WORK + 0.02, 'job', { vid: v.id, job: def.job });
      }
      if (got.length) {
        const jn = JOBNAME[def.job][got.every(v => v.sex === 'f') ? 'f' : 'm'].replace(/^(\S+)( .*)?$/, (m, a, b2) => got.length > 1 ? a + 's' + (b2 || '') : m);
        const text = names(got.map(v => v.name)) + (got.length > 1 ? ' deviennent ' : ' devient ') + jn + '.';
        E(T.WORK + 0.03, 'msg', { msg: text }); log.push({ k: 'job', text }); sum.jobs.push(text);
      }
    }
    /* 2 bis. maisons : une place libre revient à qui n'a pas de maison, et elle reste la sienne */
    const houses = st.buildings.filter(b => BT[b.type].beds);
    for (const b of houses) if (BT[b.type].own) {
      b.owners = (b.owners || []).filter(id => st.villagers[id].alive);
      const takers = allocate(alive.filter(v => v.home == null), BT[b.type].beds - b.owners.length, 'roofless', rng);
      takers.forEach((id, k) => { b.owners.push(id); st.villagers[id].home = b.id; E(T.WORK + 0.04 + k * 0.004, 'home', { vid: id, bid: b.id }); });
      if (takers.length) { const l = takers.map(id => st.villagers[id].name), text = names(l) + (l.length > 1 ? ' ont leur maison.' : ' a sa maison.'); E(T.WORK + 0.05, 'msg', { msg: text }); log.push({ k: 'home', text }); }
    }

    /* une serre garde les jardins du gel, un fanal guide dans la brume */
    const frostOn = def => frost && def.frost && !(def.garden && anti('frost')), fogOn = def => fog && def.fog && !anti('fog'), stormOn = def => (storm && def.storm && !anti('storm')) || (dry && !!def.dryStop);
    /* 3. travail */
    const usedTrees = []; let idleN = 0;
    const noGlean = fog && !anti('fog'); // dans la brume, on ne trouve pas non plus le bois mort
    const stroll = tr => { let n = 0; while (tr.t < 15.4 && n++ < 8) { const a = rng() * 6.28, d = 44 + rng() * 50, p = { x: F.x + Math.cos(a) * d * 1.25, y: F.y + Math.sin(a) * d }; if (blockedAt(nav, p.x, p.y) || !map.clear(p.x, p.y)) continue; if (tr.t + tr.est(nav, p) > 16.2) { rng(); break; } /* trop tard pour une dernière promenade : on ne ferait plus le chemin du repas (même tirage, pour ne rien changer au hasard du jour) */ tr.walk(nav, p, { label: noGlean ? 'Reste près du feu' : 'Se promène' }); tr.act('idle', 0.5 + rng() * 0.9, { look: F, label: noGlean ? 'Attend que la brume se lève' : 'Flâne' }); } };
    const glean = (v, tr, why) => {
      if (noGlean) { idleN++; tr.act('idle', 0.12 * idleN, { label: why || 'La brume cache le bois mort' }); return stroll(tr); }
      const near = map.dead.slice().sort((p1, p2) => hyp(p1.x - tr.p.x, p1.y - tr.p.y) + hyp(p1.x - SK.ax, p1.y - SK.ay) - hyp(p2.x - tr.p.x, p2.y - tr.p.y) - hyp(p2.x - SK.ax, p2.y - SK.ay));
      const sp = near[(v.id + st.day + idleN) % Math.min(4, near.length)]; idleN++;
      const spot = { x: sp.x + (idleN * 7) % 13 - 6, y: sp.y + (idleN * 5) % 9 - 4 };
      tr.act('idle', 0.12 * idleN, { label: why || 'Cherche quoi faire' });
      tr.trip(nav, spot, stockPt, 12.6 + idleN * 0.4, 0.6, 'pick', { label: 'Va ramasser du bois mort' }, { label: 'Ramasse du bois mort' }, { carry: 'branch', label: 'Rapporte du bois mort' });
      gain(tr.t, 'wood', 1, SK.x + 14, SK.y - 4);
      tr.act('idle', 0.2, { look: stockLook, label: 'Range le bois' });
      stroll(tr);
    };
    for (const v of alive) {
      const tr = tracks[v.id], b = v.work != null ? st.buildings.find(x => x.id === v.work) : null, def = b ? BT[b.type] : null;
      const k = b ? b.workers.indexOf(v.id) : 0, dr = b ? door(b) : null;
      if (v.off === 'child') {
        const sb = pupils[v.id], sd = sb ? door(sb) : null;
        if (sb && isFinite(tr.est(nav, sd))) { tr.walkBy(nav, sd, Math.max(9.5, tr.t + tr.est(nav, sd) / 1.2), { label: 'Va à l’école' }); tr.until(Math.max(tr.t + 0.5, 16), 'idle', { inside: sb.id, label: 'Est à l’école' }); v.school = (v.school || 0) + 1; v.atSchool = true; }
        else { v.atSchool = false; tr.act('idle', 0.3, { label: 'Joue' }); stroll(tr); }
        continue;
      }
      if (v.off) { tr.act('idle', 0.3, { label: v.off === 'sick' ? 'Est malade' : 'Porte le deuil' }); stroll(tr); continue; }
      if (b && !(stormOn(def) || frostOn(def) || fogOn(def))) worked[b.type] = (worked[b.type] || 0) + 1; else if (!noGlean) worked.glean = (worked.glean || 0) + 1;
      if (!b) glean(v, tr);
      else if (stormOn(def) || frostOn(def) || fogOn(def)) glean(v, tr, stormOn(def) ? (dry && def.dryStop && !storm ? 'La rivière est à sec' : v.job === 'pecheur' ? 'La rivière est en crue' : 'Ne peut pas traverser la rivière') : fogOn(def) ? 'La brume cache tout' : 'Tout a gelé');
      else if (def.conv || def.indoor) { /* ateliers et bureaux : on y passe la journée ; ce qui en sort est compté plus bas */
        tr.walkBy(nav, dr, Math.max(9.5, tr.t + tr.est(nav, dr) / 1.25), { label: 'Va travailler : ' + def.name.toLowerCase() });
        tr.until(Math.max(tr.t + 0.5, 16.2), 'idle', { inside: b.id, label: def.verb || 'Travaille' });
      }
      else if (def.site) { /* métiers qui se font sur place : poules, champignons, musique */
        const LAB = { berger: ['Va à la bergerie', 'Soigne les brebis', 'Rapporte du lait', 'Range le lait'], scieur: ['Va à la scierie', 'Scie des planches', 'Rapporte des planches', 'Range les planches'], cidrier: ['Va au pressoir', 'Presse les pommes', 'Goûte le cidre', ''], fermier: ['Va au poulailler', 'Soigne les poules', 'Rapporte des œufs', 'Range les œufs'], champi: ['Va aux champignons', 'Cueille des champignons', 'Rapporte des champignons', 'Range les champignons'], musicien: ['Va au kiosque', 'Joue un air', 'Reprend son souffle', ''] }[v.job];
        const n = def.play ? 0 : def.wet && (fog || storm || weather(st, st.day - 1).storm) ? def.wet : def.per; // les champignons aiment la pluie et la brume
        const at0 = { x: b.x + b.w * 0.3, y: b.y + b.h + 5 }, back = def.play ? dr : stockPt;
        const far = tr.est(nav, at0) + plen(nav, at0, back) > 3.2 || 2 * plen(nav, back, at0) > 2.4; // bâtiment loin de la réserve : un seul aller-retour, tout rapporté d'un coup
        for (let i = 0; i < (far ? 1 : 2); i++) {
          const at = { x: b.x + b.w * (0.3 + 0.4 * i), y: b.y + b.h + 5 };
          tr.trip(nav, at, back, far || i ? 16.6 : 13.2, 0.8, def.music ? 'play' : 'gather', { label: LAB[0] }, { look: def.play ? F : { x: at.x, y: b.y }, label: LAB[1] }, def.play ? { label: LAB[2] } : { carry: def.out === 'wood' ? 'plank' : 'basket', label: LAB[2] });
          if (!def.play) { const q = far ? n : i ? Math.floor(n / 2) : Math.ceil(n / 2); if (q) gain(tr.t, def.out, q, SK.x + (def.out === 'wood' ? 14 : 40), SK.y - 4); tr.act('idle', 0.1, { look: stockLook, label: LAB[3] }); }
          else tr.act('idle', 0.15, { look: F, label: LAB[2] });
        }
        if (def.play) joyQ.push([19.44, def.play, b.x + b.w / 2, b.y + 6]);
      }
      else if (v.job === 'cueilleur') {
        const hi = st.buildings.filter(x => x.type === 'cueillette').indexOf(b), B = map.bridge;
        const bs = map.bushes.slice().sort((a, c) => hyp(a.x - B.x, a.y - B.y) - hyp(c.x - B.x, c.y - B.y)).slice(0, 4);
        const spotOf = i => { const bush = bs[(k + i * 2 + st.day + hi) % bs.length]; return { bush, at: { x: bush.x - map.far.x * 11 + map.perp.x * (k ? 7 : -7), y: bush.y - map.far.y * 11 + map.perp.y * (k ? 7 : -7) } }; };
        const s0 = spotOf(0), s1 = spotOf(1), far = tr.est(nav, s0.at) + plen(nav, s0.at, dr) > 4.6 || 2 * plen(nav, dr, s1.at) > 3.4;
        for (let i = 0; i < (far ? 1 : 2); i++) { // hutte loin du pont : un seul grand aller-retour, panier plein
          const sp = i ? s1 : s0, end = (far || i ? 16.6 : 13.2) + k * 0.08;
          tr.trip(nav, sp.at, dr, end, far ? 1.2 : 0.5, 'gather', { label: 'Va cueillir des baies' }, { look: sp.bush, label: 'Cueille des baies' }, { carry: 'basket', label: 'Rapporte sa cueillette' });
          gain(tr.t, 'food', far ? 2 : 1, dr.x, dr.y - 8); tr.act('idle', 0.1, { look: { x: dr.x, y: dr.y - 20 }, label: 'Dépose sa cueillette' });
        }
      } else if (v.job === 'paysan') {
        const at0 = { x: b.x + b.w * 0.3, y: b.y + b.h + 5 }, far = tr.est(nav, at0) + plen(nav, at0, stockPt) > 3.2 || 2 * plen(nav, stockPt, at0) > 2.4; // potager loin de la réserve : un seul aller-retour, les deux paniers d'un coup
        for (let i = 0; i < (far ? 1 : 2); i++) {
          const at = { x: b.x + b.w * (0.3 + 0.4 * i), y: b.y + b.h + 5 };
          tr.trip(nav, at, stockPt, far || i ? 16.6 : 13.2, 0.8, 'gather', { label: 'Va au potager' }, { look: { x: at.x, y: b.y }, label: 'Jardine' }, { carry: 'basket', label: 'Rapporte des légumes' });
          { const half = dry && !st.buildings.some(x => x.type === 'puits' && !x.gone), q = far ? (half ? 1 : 2) : (half && i ? 0 : 1); if (q) gain(tr.t, 'food', q, SK.x + 40, SK.y - 4); } // sécheresse : demi-récolte sans puits tr.act('idle', 0.1, { look: stockLook, label: 'Range les légumes' });
        }
      } else if (v.job === 'pecheur') {
        const m = { x: b.x + b.w / 2, y: b.y + b.h / 2 }, a0 = map.along(m.x, m.y), spot = map.bank(a0 + 6, 24), water = map.bank(a0 + 6, 4);
        const far = 2 * plen(nav, dr, spot) > 1.7 || tr.est(nav, spot) + plen(nav, spot, dr) > 2.4, ends = far ? [16.6] : [11.5, 14.05, 16.6];
        ends.forEach((end, i) => {
          tr.trip(nav, spot, dr, end, 0.6, 'fish', { label: 'Va pêcher' }, { look: water, label: 'Pêche' }, { carry: 'fish', label: 'Rapporte du poisson' });
          gain(tr.t, 'food', far ? 3 : 1, dr.x, dr.y - 8); if (i < ends.length - 1) tr.act('idle', 0.08, { label: 'Dépose le poisson' });
        });
      } else if (v.job === 'carrier') {
        const R0 = map.rocks || F, at = { x: R0.x + (k ? 20 : 8), y: R0.y + (k ? 14 : 24) };
        const far = 2 * plen(nav, dr, at) > 2.3 || tr.est(nav, at) + plen(nav, at, dr) > 3.1; // carrière loin des rochers : un seul voyage, deux pierres
        for (let i = 0; i < (far ? 1 : 2); i++) { tr.trip(nav, at, dr, (far || i ? 16.6 : 13.2) + k * 0.08, 1.0, 'mine', { label: 'Va tailler la pierre' }, { look: R0, label: 'Taille la pierre' }, { carry: 'stone', label: 'Rapporte une pierre' }); gain(tr.t, 'stone', far ? 2 : 1, dr.x, dr.y - 8); tr.act('idle', 0.1, { label: 'Dépose la pierre' }); }
      } else if (v.job === 'boulanger') {
        if (st.wood < def.burn) glean(v, tr, 'Pas de bois pour le four');
        else {
          if (def.burn) { E(T.WORK + 0.25, 'res', { wood: -def.burn, x: SK.x + 14, y: SK.y - 4 }); st.wood -= def.burn; }
          const far = 2 * plen(nav, dr, stockPt) > 1.9 || tr.est(nav, dr) + plen(nav, dr, stockPt) > 3.0; // four loin de la réserve : une seule fournée, livrée le soir
          for (let i = 0; i < (far ? 1 : 2); i++) {
            tr.trip(nav, dr, stockPt, far || i ? 16.6 : 13.2, 1.0, 'bake', { label: i ? 'Retourne au four' : 'Va au four' }, { look: { x: dr.x, y: b.y }, inside: b.id, label: 'Cuit le pain' }, { carry: 'bread', label: 'Porte le pain' });
            gain(tr.t, 'food', far ? 4 : 2, SK.x + 40, SK.y - 4); tr.act('idle', 0.1, { look: stockLook, label: 'Range le pain' });
          }
        }
      } else if (v.job === 'bucheron') {
        const dd = { x: dr.x + (k ? 12 : -12), y: dr.y };
        const pick = () => { const t = map.chop.map(id => map.trees[id]).filter(q => !st.cut.includes(q.id) && !usedTrees.includes(q.id)).sort((a, c) => hyp(a.x - dd.x, a.y - dd.y) - hyp(c.x - dd.x, c.y - dd.y))[0]; if (t) usedTrees.push(t.id); return t; };
        const spotOf = t => ({ x: t.x + (t.x > dd.x ? -1 : 1) * (t.r * 0.8 + 6), y: t.y - t.r * 0.25 });
        const t1 = pick(), t2 = t1 ? pick() : null;
        if (!t1) glean(v, tr, 'Plus d’arbre à abattre');
        else {
          /* arbres lointains : un seul voyage dans la journée, deux bûches d'un coup */
          const far = !t2 || tr.est(nav, spotOf(t1)) + plen(nav, spotOf(t1), dd) > 3.2 || 2 * plen(nav, dd, spotOf(t2)) > 2.4;
          if (far && t2) usedTrees.pop();
          (far ? [t1] : [t1, t2]).forEach((tree, i) => {
            const tc = tr.trip(nav, spotOf(tree), dd, (far || i ? 16.6 : 13.2) + k * 0.08, far ? 1.4 : 0.8, 'chop', { label: 'Va abattre un arbre' }, { look: tree, tree: tree.id, label: 'Abat un arbre' }, { carry: 'log', label: 'Rapporte un tronc' });
            E(tc, 'cut', { tree: tree.id }); gain(tr.t, 'wood', far ? 2 : 1, dd.x, dd.y - 8); tr.act('idle', 0.1, { label: 'Dépose le tronc' });
          });
        }
      } else glean(v, tr);
    }
    for (const id of usedTrees) if (!st.cut.includes(id)) st.cut.push(id);
    nav = buildNav(st, storm && !anti('storm'));

    const staffed = f => st.buildings.some(b => !b.gone && f(BT[b.type]) && b.workers.some(id => st.villagers[id].alive && !st.villagers[id].off));
    const expert = k => staffed(d => d.expert === k), medic = staffed(d => d.medic), made = {}, idleShops = [];
    /* ce qui agit sans personne : ruches, fleurs, verger (après quelques jours), troc, et ce qui améliore le travail des autres */
    for (const b of st.buildings) {
      const def = BT[b.type], x = b.x + b.w / 2, y = b.y + 6; if (b.gone) continue;
      if (def.give && !frostOn(def) && st.day - b.day >= (def.wait || 0)) { for (const r of RES) if (def.give[r]) gain(16.5, r, def.give[r], x, y); if (def.give.joy) joyQ.push([16.52, def.give.joy, x, y]); }
      const crewN = b.workers.filter(id => st.villagers[id].alive && !st.villagers[id].off).length;
      if (def.indoor && def.out && crewN) gain(16.4, def.out, def.per * crewN, x, y);
      if (def.conv && crewN) { /* l'atelier ne transforme que ce qui était en réserve ce matin : deux pour un, un pour un si le spécialiste du domaine est à son poste */
        const c = def.conv, ratio = expert(c.to) ? 1 : RATIO, have = c.from === 'joy' ? Math.min(m0.joy, st.joy) : Math.min(m0[c.from], st[c.from]), n = Math.floor(Math.min(have, c.cap) / ratio);
        if (n > 0) { if (c.from === 'joy') { joyQ.push([16.42, -n * ratio, x - 8, y]); m0.joy -= n * ratio; } else { gain(16.42, c.from, -n * ratio, x - 8, y); m0[c.from] -= n * ratio; } gain(16.44, c.to, n, x + 8, y); made[c.to] = (made[c.to] || 0) + n; }
        else idleShops.push(def.name.toLowerCase());
      }
      if (def.kidFood && kidsFree.length) gain(16.6, 'food', def.kidFood * Math.min(kidsFree.length, def.kidCap), x, y); // les enfants qui ne sont pas à l'école ramassent les œufs
      if (def.kidJoy && kids.length) joyQ.push([16.62, def.kidJoy * Math.min(kids.length, def.kidCap), x, y]);
      if (def.ifKid && kids.length) joyQ.push([19.44, def.ifKid, x, y]);
      if (def.boost) for (const k in def.boost) if (worked[k]) gain(16.8, k === 'glean' ? 'wood' : BT[k].out, def.boost[k] * worked[k], x, y);
      if (def.swap && RES.every(r => st[r] >= (def.swap.take[r] || 0))) { for (const r of RES) { if (def.swap.take[r]) gain(16.9, r, -def.swap.take[r], x - 8, y); if (def.swap.give[r]) gain(16.92, r, def.swap.give[r], x + 8, y); } if (def.swap.give.joy) joyQ.push([16.94, def.swap.give.joy, x, y]); } // après toutes les récoltes du jour, pour ne jamais donner ce qui n'est pas encore rentré
    }
    /* 4. repas */
    const rations = st.buildings.reduce((n, b) => n + (b.gone ? 0 : BT[b.type].ration || 0), 0), kidCap = st.buildings.reduce((n, b) => n + (b.gone ? 0 : BT[b.type].feedKids || 0), 0);
    let mealJoy = 0; const fedFree = allocate(kids, kidCap, 'hunger', rng), eaters = fedFree.concat(allocate(alive.filter(v => !fedFree.includes(v.id)), st.food + st.meal + rations, 'hunger', rng));
    /* le soir, les bâtiments servent : la moitié du village au plus dîne à la grande table, et deux par maison de bains y filent sitôt mangé. Rien n'est tiré au sort : on tourne chaque jour. */
    const tablesB = st.buildings.filter(b => b.type === 'table' && !b.gone), bathsB = st.buildings.filter(b => b.type === 'bains' && !b.gone), atTable = new Map(), bather = new Map();
    for (let k = 0, nT = Math.min(6 * tablesB.length, Math.ceil(alive.length / 2)); k < nT; k++) { const v = alive[(k + st.day) % alive.length], b = tablesB[Math.floor(k / 6)], q = k % 6; atTable.set(v.id, { x: b.x + b.w * (0.2 + 0.3 * (q % 3)), y: q < 3 ? b.y - 5 : b.y + b.h + 6, c: { x: b.x + b.w / 2, y: b.y + b.h / 2 } }); }
    for (let k = 0, nB = Math.min(2 * bathsB.length, Math.floor(alive.length / 3)); k < nB; k++) bather.set(alive[(alive.length - 1 - k + st.day * 2) % alive.length].id, bathsB[Math.floor(k / 2)]);
    alive.forEach((v, i) => {
      const tr = tracks[v.id], tb = atTable.get(v.id), seat = tb || map.seats[i % map.seats.length], look = tb ? tb.c : F;
      tr.until(Math.max(tr.t, T.MEAL - 0.3 + i * 0.04), 'idle', { label: 'Termine sa journée' });
      tr.walkBy(nav, seat, Math.max(18.95, Math.min(19.38, tr.t + tr.est(nav, seat) / 1.5)), { label: 'Rentre pour le repas' }); // qui travaille très loin arrive un peu après les autres, sans courir
      const te = Math.max(18 + i * Math.min(0.16, 1.28 / alive.length), tr.t + 0.1), ate = eaters.includes(v.id);
      tr.until(te, 'sit', { look, label: tb ? 'S’assoit à la grande table' : 'S’assoit près du feu' });
      if (ate) { if (fedFree.includes(v.id)) E(te, 'eat', { vid: v.id, ration: true }); else if (st.meal > 0) { E(te, 'eat', { vid: v.id, meal: -1 }); st.meal--; mealJoy++; } else if (st.food > 0) { E(te, 'eat', { vid: v.id, food: -1 }); st.food--; } else E(te, 'eat', { vid: v.id, ration: true }); v.hunger = 0; } else { E(te, 'noeat', { vid: v.id }); v.hunger++; }
      const bh = ate ? bather.get(v.id) : null, bd = bh ? door(bh) : null;
      if (bh && plen(nav, tr.p, bd) < 1.3) { tr.until(te + 0.4, 'eat', { look, label: 'Mange sur le pouce' }); tr.walkBy(nav, bd, te + 0.4 + Math.max(0.5, plen(nav, tr.p, bd) / 1.2), { label: 'File aux bains' }); tr.until(Math.max(tr.t + 0.5, T.BED + 0.7), 'idle', { inside: bh.id, label: 'Prend un bain' }); }
      else tr.until(T.BED + (tb ? i % 3 : i) * 0.08, ate ? 'eat' : 'sad', { look, label: ate ? (tb ? 'Mange à la grande table' : 'Mange') : 'N’a rien à manger' }); // de la table, le lit peut être loin : on se lève plus tôt
      sum.v[v.id] = { ate, roof: false };
    });
    const hungry = alive.filter(v => !eaters.includes(v.id));
    const got = RES.filter(r => sum.got[r]).map(r => '+' + sum.got[r] + ' ' + { food: 'nourriture', wood: 'bois', stone: 'pierre' }[r]);
    if (got.length) log.push({ k: 'res', text: 'Rapporté : ' + got.join(', ') + '.' });
    if (hungry.length) log.push({ k: 'bad', text: names(hungry.map(v => v.name)) + (hungry.length > 1 ? ' n’ont rien mangé.' : ' n’a rien mangé.') });
    /* le bonheur (défis qui le comptent) : une tablée où personne ne manque, une nuit dans sa propre maison ; un manque l'entame */
    let joy = 0; const J = (t, n, x, y) => { if (joyOn && n) { E(t, 'joy', { n, x, y }); joy += n; } };
    joyQ.forEach(q => J(q[0], q[1], q[2], q[3]));
    if (mealJoy) J(18.7, mealJoy, F.x, F.y - 34); // un repas nourrit, et réjouit
    for (const b of st.buildings) if (BT[b.type].plenty && !b.gone && st.food >= 2 * alive.length) J(19.48, BT[b.type].plenty, b.x + b.w / 2, b.y + 6); // un cellier plein rassure
    if (!hungry.length) for (const b of st.buildings) if (BT[b.type].joy) J(19.42, BT[b.type].joy, b.x + b.w / 2, b.y + 4);
    hungry.forEach((v, k) => J(19.46 + k * 0.01, -1, F.x, F.y - 14));

    /* en survie : le feu prend le soir, les rats viennent à la nuit */
    const wreck = (b, txt) => { b.gone = true; lost.push(BT[b.type].name.toLowerCase()); E(19.9, 'fire', { bid: b.id, x: b.x + b.w / 2, y: b.y + b.h / 2 }); for (const v of alive) if (v.home === b.id) v.home = null; log.push({ k: 'bad', text: txt + BT[b.type].name.toLowerCase() + '.' }); }, lost = [], well = () => st.buildings.some(x => x.type === 'puits' && !x.gone), lvOf = e => e.lv || 1;
    for (const e of today) { // foudre, vent, crue, feu, rats : en survie, et dans les défis qui les annoncent
      if (e.type === 'tornado') { /* la tornade emporte tout ce qui est bâti sans pierre ni brique */
        const c = st.buildings.filter(b => !b.gone && !solid(b.type));
        for (const b of c) { b.gone = true; lost.push(BT[b.type].name.toLowerCase()); E(19.9 + (b.id % 7) * 0.004, 'fire', { bid: b.id, x: b.x + b.w / 2, y: b.y + b.h / 2 }); for (const v of alive) if (v.home === b.id) v.home = null; }
        log.push(c.length ? { k: 'bad', text: 'La tornade a emporté ' + (c.length > 1 ? c.length + ' bâtiments' : 'un bâtiment') + ' : ' + names(c.slice(0, 6).map(b => BT[b.type].name.toLowerCase())) + (c.length > 6 ? '…' : '') + '. Ce qui était de pierre ou de brique a tenu.' } : { k: 'new', text: 'La tornade est passée. Tout était de pierre ou de brique : rien n’a bougé.' });
      }
      if (e.type === 'storm' && lvOf(e) >= 2) { const c = st.buildings.filter(b => !b.gone && !BT[b.type].open); if (c.length) { const b = c[Math.floor(rng() * c.length)]; if (well()) log.push({ k: 'new', text: 'La foudre est tombée, le puits a sauvé : ' + BT[b.type].name.toLowerCase() + '.' }); else wreck(b, 'La foudre a brûlé : '); } }
      if (e.type === 'wind') for (let k = 0; k < lvOf(e) + 1; k++) { const c = st.buildings.filter(b => !b.gone && LIGHT.includes(b.type)); if (!c.length) break; wreck(c[Math.floor(rng() * c.length)], 'Le vent a emporté : '); }
      if (e.type === 'flood') { if (anti('storm')) log.push({ k: 'new', text: 'La rivière est montée. La digue a tenu.' }); else { const c = st.buildings.filter(b => !b.gone && map.rdist(b.x + b.w / 2, b.y + b.h / 2) < 150).sort((a, b) => map.rdist(a.x + a.w / 2, a.y + a.h / 2) - map.rdist(b.x + b.w / 2, b.y + b.h / 2)); c.slice(0, lvOf(e)).forEach(b => wreck(b, 'La crue a emporté : ')); } }
      if (e.type === 'fire') for (let k = 0; k < Math.min(3, e.lv || 1); k++) { const c = st.buildings.filter(b => !b.gone && !BT[b.type].open && !(BT[b.type].cost.stone > 1)); if (c.length) { const b = c[Math.floor(rng() * c.length)]; if (well()) log.push({ k: 'new', text: 'Le feu a pris, le puits l’a éteint : ' + BT[b.type].name.toLowerCase() + ' sauvé.' }); else wreck(b, 'Le feu a emporté : '); } }
      if (e.type === 'rats') { const kept = st.buildings.some(b => (b.type === 'gardemanger' || b.type === 'cellier') && !b.gone), sealed = st.buildings.some(b => BT[b.type].store && !b.gone), loss = sealed ? 0 : Math.min(st.food, kept ? Math.ceil(st.food * 0.05) : Math.max(2, Math.ceil(st.food * Math.min(0.8, 0.25 + 0.1 * (e.lv || 1))))); if (loss > 0) { gain(19.95, 'food', -loss, SK.x + 40, SK.y - 4); log.push({ k: 'bad', text: 'Les rats ont mangé ' + loss + ' nourriture' + (loss > 1 ? 's' : '') + '.' }); } }
    }
    if (surv) { /* la réserve ne se garde pas : au-delà de deux jours de vivres (quatre avec un garde-manger ou un cellier), près d'un tiers du surplus se gâte chaque nuit */
      const keep = alive.length * (st.buildings.some(b => (b.type === 'gardemanger' || b.type === 'cellier') && !b.gone) ? 4 : 2), rot = Math.ceil(Math.max(0, st.food - keep) * 0.3);
      if (rot > 0) { gain(19.97, 'food', -rot, SK.x + 40, SK.y - 4); log.push({ k: 'new', text: rot + ' nourriture' + (rot > 1 ? 's se sont gâtées.' : ' s’est gâtée.') }); }
    }
    /* 5. coucher : chacun chez soi s'il a une maison ; les autres se partagent cabanes et cabanons, d'abord ceux qui ont dormi dehors la veille, puis au hasard */
    const beds = []; for (const b of houses) if (!BT[b.type].own && !b.gone) for (let k = 0; k < BT[b.type].beds; k++) beds.push({ b, k, free: true });
    /* les enfants d'abord. Un enfant sans lit se réfugie dans n'importe quel bâtiment : il a manqué d'un lit, mais il ne risque rien. S'il n'y a aucun bâtiment, il ne passe pas la nuit. */
    const homeless = alive.filter(v => v.home == null), luckyK = allocate(homeless.filter(v => v.child), beds.length, 'roofless', rng);
    const lucky = luckyK.concat(allocate(homeless.filter(v => !v.child), beds.length - luckyK.length, 'roofless', rng)), out = [], squeezed = [], standing = st.buildings.filter(b => !b.gone && !BT[b.type].open);
    alive.forEach((v, i) => {
      const tr = tracks[v.id]; let b = null, k = 0;
      if (v.home != null) { b = st.buildings.find(x => x.id === v.home); k = b.owners.indexOf(v.id); }
      else if (lucky.includes(v.id)) { let best = null, bd = 1e9; for (const q of beds) if (q.free) { const d0 = door(q.b), d = hyp(d0.x - tr.p.x, d0.y - tr.p.y); if (d < bd) { bd = d; best = q; } } best.free = false; b = best.b; k = best.k; }
      if (b) {
        const dr = door(b);
        tr.walkBy(nav, dr, Math.max(Math.min(22, Math.max(21.2, tr.t + plen(nav, tr.p, dr) / 1.4)), tr.t + plen(nav, tr.p, dr) / 1.5), { label: 'Rentre se coucher' }); /* qui sort des bains loin de son lit rentre plus tard, sans courir */ E(tr.t, 'bed', { vid: v.id, bid: b.id });
        tr.until(T.END, 'sleep', { inside: b.id, bed: k, label: 'Dort au chaud' });
        v.roofless = 0; v.pos = dr; sum.v[v.id].roof = true; if (v.home != null) J(tr.t, 1, dr.x, dr.y - 22);
      } else if (v.child && standing.length) {
        let sh = standing[0], bd = 1e9; for (const q of standing) { const d0 = door(q), d = hyp(d0.x - tr.p.x, d0.y - tr.p.y); if (d < bd) { bd = d; sh = q; } }
        const dr = door(sh); squeezed.push(v);
        tr.walkBy(nav, dr, Math.min(22, Math.max(21.2, tr.t + plen(nav, tr.p, dr) / 1.4)), { label: 'Cherche un abri' }); E(tr.t, 'nobed', { vid: v.id });
        tr.until(T.END, 'sleep', { inside: sh.id, bed: 0, label: 'Dort à l’abri, sans lit' });
        v.roofless = 0; v.pos = dr; J(21.3, -1, dr.x, dr.y - 20);
      } else {
        out.push(v);
        tr.until(20.4 + i * 0.1, 'sit', { look: F, label: 'Reste près du feu' }); E(tr.t, 'nobed', { vid: v.id });
        tr.until(T.END, 'sleepout', { look: F, label: 'Dort dehors' });
        v.roofless++; v.pos = { x: tr.p.x, y: tr.p.y }; J(21.3, -1, tr.p.x, tr.p.y - 20);
      }
    });
    if (out.length) log.push({ k: 'bad', text: names(out.map(v => v.name)) + (out.length > 1 ? ' ont dormi dehors.' : ' a dormi dehors.') });
    if (squeezed.length) log.push({ k: 'bad', text: names(squeezed.map(v => v.name)) + (squeezed.length > 1 ? ' ont dormi à l’abri, mais sans lit.' : ' a dormi à l’abri, mais sans lit.') });

    /* 6. bilan : décès, alertes */
    if (hungry.length || out.length || squeezed.length) st.everLacked = true;
    st.lastAllOk = !hungry.length && !out.length && !squeezed.length; st.lastRoofOk = !out.length && !squeezed.length;
    if (joyOn) { st.joy = Math.max(0, st.joy + joy); sum.joy = joy; }
    /* un abri de branchages ne tient que deux nuits : il disparaîtra au matin */
    { let n = 0; for (const b of st.buildings) if (BT[b.type].life && !b.gone) { b.nights = (b.nights || 0) + 1; if (b.nights >= BT[b.type].life) { b.gone = true; n++; } } if (n) log.push({ k: 'bad', text: n > 1 ? 'Les abris de branchages ne tiendront pas une nuit de plus.' : 'L’abri de branchages ne tiendra pas une nuit de plus.' }); }
    /* deux soirs sans manger, deux nuits dehors… ou une seule nuit dehors quand il gèle */
    /* les loups : ils emportent quelqu'un qui dort dehors ; sinon ils pillent la réserve. Un braséro les tient à distance. */
    let prey = null;
    if (surv && today.some(e => e.type === 'wolves')) { if (anti('cold')) log.push({ k: 'new', text: 'Les loups ont rôdé. Le braséro les a tenus loin.' }); else if (out.length) prey = out[Math.floor(rng() * out.length)]; else { const loss = Math.min(st.food, 2 + lvOf(today.find(e => e.type === 'wolves'))); if (loss > 0) { gain(21.9, 'food', -loss, SK.x + 40, SK.y - 4); log.push({ k: 'bad', text: 'Les loups ont pillé ' + loss + ' nourriture' + (loss > 1 ? 's' : '') + '.' }); } } }
    st.lost = lost;
    for (const v of alive) if (v === prey || v.hunger >= 2 || v.roofless >= 2 || (v.child && out.includes(v)) || (frost && out.includes(v) && !anti('cold')) || (v.sick > 0 && !medic && (v.hunger >= 1 || out.includes(v) || (!surv && v.grave && v.sick === 1)))) {
      v.alive = false; const why = v === prey ? 'sous les crocs des loups' : v.hunger >= 2 ? 'de faim' : v.sick > 0 && !(frost && out.includes(v)) && v.roofless < 2 ? 'de maladie' : 'de froid';
      sum.deaths.push({ id: v.id, name: v.name, why }); st.graves.push({ x: v.pos.x, y: v.pos.y, name: v.name });
      log.push({ k: 'dead', text: v.name + ' est ' + (v.sex === 'f' ? 'morte ' : 'mort ') + why + '.' });
      for (const b of st.buildings) { b.workers = b.workers.filter(id => id !== v.id); if (b.owners) b.owners = b.owners.filter(id => id !== v.id); }
    }
    { const need = SCHOOL_DAYS - (st.buildings.some(b => BT[b.type].fast && !b.gone) ? 1 : 0), grown = st.villagers.filter(v => v.alive && v.child && (v.school || 0) >= need);
      for (const v of grown) { v.child = false; v.off = null; delete v.atSchool; }
      if (grown.length) { sum.grown = grown.map(v => v.id); log.push({ k: 'new', text: names(grown.map(v => v.name)) + (grown.length > 1 ? ' ont fini l’école : dès demain, ils travaillent.' : ' a fini l’école : dès demain, ' + (grown[0].sex === 'f' ? 'elle' : 'il') + ' travaille.') }); } }
    if (st.town === st.day) { E(6.3, 'town', {}); log.push({ k: 'new', text: 'Dix habitants : le village devient un bourg. Deux chantiers par jour, et des routes de pierre.' }); }
    if (st.sickNew && st.sickNew.length) { const l = st.sickNew.map(id => st.villagers[id]), gr = l.some(v => v.grave); log.push({ k: 'bad', text: names(l.map(v => v.name)) + (l.length > 1 ? ' sont tombés malades' : ' est tombé' + (l[0].sex === 'f' ? 'e' : '') + ' malade') + ' : deux jours sans travailler' + (gr ? ', et la fièvre est grave.' : '.') }); }
    delete st.sickNew;
    if (idleShops.length) log.push({ k: 'bad', text: 'Rien à transformer ce matin : ' + names([...new Set(idleShops)]) + '.' });
    const warn = [], live = st.villagers.filter(v => v.alive), wh = live.filter(v => v.hunger === 1).map(v => v.name), wr = live.filter(v => v.roofless === 1).map(v => v.name);
    if (wh.length) warn.push(names(wh) + (wh.length > 1 ? ' doivent' : ' doit') + ' manger demain.');
    if (wr.length) warn.push(names(wr) + (wr.length > 1 ? ' doivent' : ' doit') + ' avoir un toit demain.');
    if (weather(st, st.day + 1).frost && capacity(st) < live.length + eventsOn(st, st.day + 1).filter(e => e.type === 'arrivals').reduce((n, e) => n + e.villagers.length, 0)) warn.push('Sous le gel, une nuit dehors est mortelle.');
    ev.sort((a, b) => a.t - b.t);
    if (!surv && st.villagers.some(v => v.alive && v.sick > 0)) { /* défis : sans médecin, chaque nuit, un malade contamine un voisin de toit partagé ; puis la maladie recule d'un jour */
      const by = {}, fresh = []; for (const e of ev) if (e.type === 'bed') (by[e.bid] = by[e.bid] || []).push(st.villagers[e.vid]);
      if (!medic) for (const bid in by) { const b = st.buildings.find(x => x.id === +bid), src = by[bid].find(v => v.alive && v.sick > 0); if (b && !BT[b.type].own && src) { const c = by[bid].filter(v => v.alive && !(v.sick > 0)).sort((a, q) => a.id - q.id)[0]; if (c) { c.grave = src.grave; fresh.push(c); } } }
      for (const v of st.villagers) if (v.sick > 0) { v.sick--; if (!v.sick) delete v.grave; }
      for (const v of fresh) { v.sick = 2; log.push({ k: 'bad', text: v.name + ' est tombé' + (v.sex === 'f' ? 'e' : '') + ' malade à son tour.' }); }
    }
    if (surv) { /* la maladie passe d'un dormeur à l'autre sous un toit partagé, puis recule d'un jour */
      const by = {}; for (const e of ev) if (e.type === 'bed') (by[e.bid] = by[e.bid] || []).push(st.villagers[e.vid]);
      const fresh = []; for (const bid in by) { const b = st.buildings.find(x => x.id === +bid); if (b && !BT[b.type].own && !medic && by[bid].some(v => v.sick > 0)) for (const v of by[bid]) if (!(v.sick > 0) && v.alive && rng() < (st.buildings.some(x => x.type === 'bains' && !x.gone) ? 0.15 : 0.4)) fresh.push(v); }
      /* la fièvre : au sortir de la maladie, elle emporte parfois — de plus en plus souvent avec les semaines, moitié moins s'il y a des bains */
      { const lv = 1 + Math.floor(st.day / 12), q = Math.min(0.6, 0.08 * lv) * (st.buildings.some(x => x.type === 'bains' && !x.gone) ? 0.5 : 1);
        for (const v of st.villagers) if (v.alive && v.sick === 1 && !medic && rng() < q) { v.alive = false; sum.deaths.push({ id: v.id, name: v.name, why: 'de maladie' }); st.graves.push({ x: v.pos.x, y: v.pos.y, name: v.name }); log.push({ k: 'dead', text: v.name + ' est ' + (v.sex === 'f' ? 'morte' : 'mort') + ' de maladie.' }); for (const b of st.buildings) { b.workers = b.workers.filter(id => id !== v.id); if (b.owners) b.owners = b.owners.filter(id => id !== v.id); } } }
      for (const v of st.villagers) if (v.sick > 0) v.sick--; for (const v of fresh) { v.sick = 2; log.push({ k: 'bad', text: v.name + ' est tombé' + (v.sex === 'f' ? 'e' : '') + ' malade.' }); }
      for (const e of today) if (e.type === 'sick' && e.who && e.who.length) log.push({ k: 'bad', text: names(e.who.map(id => st.villagers[id].name)) + (e.who.length > 1 ? ' sont malades' : ' est malade') + ' : deux jours sans travailler, et ni faim ni nuit dehors.' });
    }
    const last = surv ? st.villagers.filter(v => v.alive).length <= 1 : st.day >= st.days; st.day++;
    let result = null;
    if (surv ? last : (last || !live.length)) {
      const allAlive = st.villagers.every(v => v.alive), ok = CHALLENGES[st.ch].goals.map(q => !!q.ok(st, allAlive));
      let stars = 0; while (stars < ok.length && ok[stars]) stars++;
      result = { alive: st.villagers.filter(v => v.alive).length, total: st.villagers.length, ok, stars, days: st.day - 1 };
    }
    return { start: S, end: st, tracks, events: ev, log, warn, sum, nb, nbs, result };
  }

  /* ---------- villageois, défis, niveaux ---------- */
  const P = {
    anne: { name: 'Anne', sex: 'f', morph: 'f_mince', skin: 1, hs: 'ponytail', hc: 3 },
    marc: { name: 'Marc', sex: 'm', morph: 'h_moyen', skin: 2, hs: 'sidepart', hc: 0, beard: 'full' },
    clara: { name: 'Clara', sex: 'f', morph: 'f_sablier', skin: 3, hs: 'long', hc: 1 },
    bastien: { name: 'Bastien', sex: 'm', morph: 'h_costaud', skin: 0, hs: 'short', hc: 2, beard: 'goatee' },
    rose: { name: 'Rose', sex: 'f', morph: 'f_moyenne', skin: 4, hs: 'curly', hc: 0 },
    hugo: { name: 'Hugo', sex: 'm', morph: 'h_mince', skin: 0, hs: 'spiky', hc: 1 },
    odile: { name: 'Odile', sex: 'f', morph: 'f_forte', skin: 0, hs: 'bun', hc: 5 },
    gerard: { name: 'Gérard', sex: 'm', morph: 'h_fort', skin: 1, hs: 'bald', hc: 5, beard: 'moustache' }
  };
  const NV = k => Array.from({ length: k }, () => ({}));
  const cab = (n, t) => Array.from({ length: n }, () => ({ type: t || 'cabane' }));
  const G = { alive: n => ({ t: 'Tous en vie au soir du jour ' + n, ok: (st, a) => a }), roof: { t: 'Le dernier soir, un toit pour chacun', ok: (st, a) => a && st.lastRoofOk }, never: { t: 'Personne n’a manqué de rien', ok: (st, a) => a && !st.everLacked }, stockOf: n => ({ t: n + ' nourritures en réserve', ok: (st, a) => a && !st.everLacked && st.food >= n }), joyOf: n => ({ t: n + ' de bonheur', ok: (st, a) => a && !st.everLacked && st.joy >= n }) };
  /* « 6 briques, 4 planches et 10 de bonheur au dernier soir » */
  G.have = o => { const l = Object.keys(o).map(k => k === 'joy' ? o[k] + ' de bonheur' : k === 'bloom' ? o[k] + ' d’épanouissement' : k === 'ingen' ? o[k] + ' d’ingéniosité' : k === 'culture' ? o[k] + ' de culture' : k === 'meal' ? o[k] + ' repas' : k === 'wood' ? o[k] + ' bois' : o[k] + ' ' + RNAME[k] + (o[k] > 1 ? 's' : ''));
    return { t: names(l) + ' au dernier soir', need: o, ok: (st, a) => a && !st.everLacked && Object.keys(o).every(k => (st[k] || 0) >= o[k]) }; };
  G.all = (f, w, s, j) => ({ t: [f + ' nourritures', w + ' bois', s + ' pierres'].join(', ') + (j ? ' et ' + j + ' de bonheur' : '') + ' au dernier soir', ok: (st, a) => a && !st.everLacked && st.food >= f && st.wood >= w && st.stone >= s && (!j || st.joy >= j) });
  const KID = { child: true }, NK = k => Array.from({ length: k }, () => ({ child: true }));
  const ALL3 = d => [d];
  const CHALLENGES = {
    c1: {
      id: 'c1', n: 1, map: 'pont', title: 'Premiers pas', days: 4, seed: 20261110, food: 12, wood: 2, tutorial: true,
      voice: { text: 'Cette nouvelle vie, je la voulais. Et je ne regrette rien.', by: 'Anne' },
      start: cab(2), villagers: [P.anne, P.marc, P.clara, P.bastien], deck: ['bucheron', 'cabane', 'cueillette'],
      draws: ALL3(['bucheron', 'cabane', 'cueillette']),
      events: [{ day: 3, type: 'arrivals', villagers: [P.rose, P.hugo] }],
      goals: [G.alive(4), G.roof, G.never],
      endMsg: ['Le feu s’est éteint sur un village trop petit.', 'Tous en vie. Mais il a manqué un toit.', 'Un toit pour chacun. Il a manqué un repas.', 'Un toit et un repas pour chacun.']
    },
    c2: {
      id: 'c2', n: 2, map: 'pont', title: 'Avant l’orage', days: 5, seed: 20261111, food: 5, wood: 4, tutorial: true,
      voice: { text: 'Le ciel s’est fait lourd au-dessus du pont. Nous avons serré les rangs, sans rien dire.', by: 'Bastien' },
      start: cab(3).concat([{ type: 'cueillette', workers: [0, 1] }]), villagers: [P.anne, P.marc, P.clara, P.bastien, P.rose, P.hugo], deck: ['cabane', 'cabanon', 'cueillette', 'potager', 'bucheron'],
      draws: [['cueillette', 'potager', 'cabanon'], ['cabane', 'cueillette', 'bucheron'], ['potager', 'cabanon', 'bucheron'], ['cabane', 'cueillette', 'potager'], ['cabanon', 'cueillette', 'potager']],
      events: [{ day: 3, type: 'storm' }, { day: 4, type: 'arrivals', villagers: [P.odile, P.gerard] }],
      goals: [G.alive(5), G.never, G.stockOf(12)],
      endMsg: ['L’orage a été le plus fort.', 'Tous en vie, pas sans peine.', 'Personne n’a manqué de rien.', 'Les réserves sont pleines. L’orage est passé.']
    },
    c3: {
      id: 'c3', n: 3, map: 'rive', title: 'La rive aux saules', days: 5, seed: 20261112, food: 10, wood: 6,
      voice: { text: 'La rivière ne m’a rien promis. Elle a seulement continué de couler, et cela m’a suffi.', by: 'Clara' },
      start: cab(2).concat(cab(1, 'cabanon')), villagers: [P.clara, P.hugo, P.anne, P.gerard, P.rose], deck: ['cabane', 'cabanon', 'pecheur', 'cueillette', 'bucheron'],
      draws: [['pecheur', 'cueillette', 'cabanon'], ['cabane', 'poulailler', 'bucheron'], ['pecheur', 'cabanon', 'poulailler'], ['cabane', 'cueillette', 'pecheur'], ['pecheur', 'cabanon', 'bucheron']],
      events: [{ day: 3, type: 'storm' }, { day: 5, type: 'arrivals', villagers: [P.marc, P.odile] }],
      goals: [G.alive(5), G.never, G.stockOf(10)],
      endMsg: ['La rivière a tout emporté, même l’espoir.', 'Tous en vie, pas sans peine.', 'Personne n’a manqué de rien.', 'Du poisson pour l’hiver, et le chant de l’eau.']
    },
    c4: {
      id: 'c4', n: 4, map: 'vallon', title: 'Le vallon de pierre', days: 6, seed: 20261113, food: 12, wood: 6, stone: 0,
      voice: { text: 'Nous avons appris la pierre comme on apprend une langue : lentement, et sans rien brusquer.', by: 'Odile' },
      start: cab(2).concat(cab(1, 'cabanon'), [{ type: 'cueillette', workers: [0, 1] }]), villagers: [P.bastien, P.odile, P.marc, P.rose, P.hugo], deck: ['maison', 'cabanon', 'carriere', 'four', 'potager', 'bucheron'],
      draws: [['carriere', 'potager', 'cabanon'], ['cabanon', 'rucher', 'potager'], ['four', 'maison', 'potager'], ['four', 'cabanon', 'carriere'], ['four', 'rucher', 'maison'], ['four', 'cabanon', 'potager']],
      events: [{ day: 4, type: 'arrivals', villagers: [P.anne, P.clara] }, { day: 6, type: 'frost' }],
      goals: [G.alive(6), G.never, G.stockOf(14)],
      endMsg: ['Le gel a eu raison du vallon.', 'Tous en vie, pas sans peine.', 'Personne n’a manqué de rien.', 'Le pain est chaud, le gel peut venir.']
    },
    c5: {
      id: 'c5', n: 5, map: 'pont', title: 'Les grandes eaux', days: 6, seed: 20261114, food: 16, wood: 6,
      voice: { text: 'Deux fois l’eau est montée. Deux fois nous avons compté les nôtres, à voix basse.', by: 'Hugo' },
      start: cab(3), villagers: [P.hugo, P.rose, P.gerard, P.clara, P.marc, P.odile], deck: ['cabane', 'cabanon', 'potager', 'pecheur', 'cueillette', 'bucheron'],
      draws: [['cueillette', 'potager', 'bucheron'], ['champi', 'cabanon', 'potager'], ['cabane', 'cueillette', 'bucheron'], ['potager', 'champi', 'cabanon'], ['cabane', 'cueillette', 'pecheur'], ['potager', 'cabanon', 'cueillette']],
      events: [{ day: 2, type: 'storm' }, { day: 4, type: 'arrivals', villagers: [P.anne, P.bastien] }, { day: 5, type: 'storm' }],
      goals: [G.alive(6), G.never, G.stockOf(16)],
      endMsg: ['L’eau a repris ce qu’elle avait prêté.', 'Tous en vie, pas sans peine.', 'Personne n’a manqué de rien.', 'Le pont a tenu. Le village aussi.']
    },
    c6: {
      id: 'c6', n: 6, map: 'rive', title: 'Avant le gel', days: 6, seed: 20261115, food: 12, wood: 6, stone: 0,
      voice: { text: 'L’automne nous a tout donné, puis il a repris ses feuilles. Il fallait avoir fait provision de pain, et d’amitié.', by: 'Rose' },
      start: cab(3).concat([{ type: 'cueillette', workers: [0, 1] }]), villagers: [P.rose, P.gerard, P.anne, P.hugo, P.clara, P.bastien], deck: ['maison', 'cabanon', 'carriere', 'four', 'pecheur', 'potager', 'bucheron'],
      draws: [['carriere', 'pecheur', 'bucheron'], ['pecheur', 'cabanon', 'potager'], ['four', 'maison', 'carriere'], ['serre', 'pecheur', 'cabanon'], ['maison', 'four', 'bucheron'], ['four', 'pecheur', 'cabanon']],
      events: [{ day: 3, type: 'arrivals', villagers: [P.marc, P.odile] }, { day: 5, type: 'frost' }],
      goals: [G.alive(6), G.never, G.stockOf(10)],
      endMsg: ['L’hiver est entré sans frapper.', 'Tous en vie, pas sans peine.', 'Personne n’a manqué de rien.', 'Le four ronfle. Que vienne le gel.']
    }
    ,c7: {
      id: 'c7', n: 7, map: 'pre', title: 'Le grand pré', days: 6, seed: 20261116, food: 12, wood: 7,
      voice: { text: 'La brume a tout avalé, sauf nos voix. Nous nous sommes comptés à l’oreille.', by: 'Gérard' },
      start: cab(2).concat(cab(1, 'cabanon')), villagers: NV(5), deck: ['cabane', 'cabanon', 'cueillette', 'potager', 'pecheur', 'bucheron'],
      draws: [['bucheron', 'cueillette', 'potager'], ['cueillette', 'fanal', 'cabanon'], ['potager', 'cabane', 'champi'], ['pecheur', 'cabanon', 'cueillette'], ['cabane', 'fanal', 'pecheur'], ['cueillette', 'cabanon', 'champi']],
      events: [{ day: 3, type: 'fog' }, { day: 4, type: 'arrivals', villagers: NV(3) }, { day: 6, type: 'fog' }],
      goals: [G.alive(6), G.never, G.stockOf(12)],
      endMsg: ['La brume s’est refermée sur le pré.', 'Tous en vie, pas sans peine.', 'Personne n’a manqué de rien.', 'La brume s’est levée sur un village plein.']
    },
    c8: {
      id: 'c8', n: 8, map: 'coude', title: 'Le coude de la rivière', days: 6, seed: 20261117, food: 6, wood: 5, stone: 0,
      voice: { text: 'Je me plaignais de tout. La rivière, elle, ne se plaignait de rien, et elle avançait.', by: 'Marc' },
      start: cab(3).concat([{ type: 'cueillette', workers: [0, 1] }]), villagers: [P.marc, P.rose, P.clara, P.hugo, P.gerard, P.odile], deck: ['cabane', 'cabanon', 'carriere', 'four', 'pecheur', 'potager', 'bucheron'],
      draws: [['carriere', 'pecheur', 'bucheron'], ['potager', 'cabanon', 'poulailler'], ['four', 'carriere', 'cabane'], ['four', 'moulin', 'cabanon'], ['cabane', 'moulin', 'pecheur'], ['four', 'cabanon', 'poulailler']],
      events: [{ day: 2, type: 'storm' }, { day: 4, type: 'fog' }, { day: 3, type: 'arrivals', villagers: NV(1) }, { day: 5, type: 'arrivals', villagers: NV(1) }],
      goals: [G.alive(6), G.never, G.stockOf(12)],
      endMsg: ['La rivière a tourné sans nous.', 'Tous en vie, pas sans peine.', 'Personne n’a manqué de rien.', 'Le pain, le poisson, et la rivière pour témoin.']
    },
    c9: {
      id: 'c9', n: 9, map: 'pre', title: 'La grande table', days: 6, seed: 20261118, food: 15, wood: 8, stone: 0, joy: true,
      voice: { text: 'Nous n’avions plus faim. C’est alors que nous avons eu envie d’être heureux.', by: 'Clara' },
      start: cab(2).concat(cab(1, 'cabanon'), [{ type: 'cueillette', workers: [0, 1] }]), villagers: NV(5), deck: ['maison', 'cabanon', 'table', 'carriere', 'potager', 'bucheron'],
      draws: [['carriere', 'table', 'potager'], ['jardin', 'bucheron', 'cabanon'], ['maison', 'potager', 'kiosque'], ['maison', 'table', 'cabanon'], ['maison', 'jardin', 'bucheron'], ['maison', 'kiosque', 'cabanon']],
      events: [{ day: 4, type: 'arrivals', villagers: NV(3) }, { day: 5, type: 'fog' }],
      goals: [G.alive(6), G.never, G.joyOf(22)],
      endMsg: ['On ne s’assied pas à une table vide.', 'Tous en vie, pas sans peine.', 'Personne n’a manqué de rien.', 'Une seule table, et tout le monde autour.']
    },
    c10: {
      id: 'c10', n: 10, map: 'coude', title: 'Le premier hiver', days: 6, seed: 20261119, food: 16, wood: 8, stone: 0, joy: true,
      voice: { text: 'Le froid est venu comme une question. Nos maisons ont répondu.', by: 'Anne' },
      start: cab(3).concat([{ type: 'cueillette', workers: [0, 1] }]), villagers: [P.anne, P.gerard, P.clara, P.marc, P.rose, P.hugo], deck: ['maison', 'cabane', 'cabanon', 'table', 'carriere', 'four', 'pecheur', 'bucheron'],
      draws: [['carriere', 'pecheur', 'table'], ['cabanon', 'four', 'abri'], ['maison', 'dortoir', 'potager'], ['maison', 'abri', 'pecheur'], ['four', 'maison', 'serre'], ['maison', 'four', 'table']],
      events: [{ day: 2, type: 'arrivals', villagers: NV(1) }, { day: 4, type: 'arrivals', villagers: NV(1) }, { day: 4, type: 'frost' }, { day: 5, type: 'fog' }],
      goals: [G.alive(6), G.never, G.joyOf(8)],
      endMsg: ['Le premier hiver a été le dernier.', 'Tous en vie, pas sans peine.', 'Personne n’a manqué de rien.', 'Le gel dehors, la joie dedans.']
    },
    /* niveau 4 : on repart de rien. Aucune réserve au départ : seuls les bras déjà au travail nourrissent le premier soir. */
    c11: {
      id: 'c11', n: 11, map: 'pont', title: 'Partis de rien', days: 5, seed: 20261120, food: 0, wood: 0,
      voice: { text: 'Nous n’avions rien. C’est léger, rien, quand on le porte à plusieurs.', by: '' },
      start: cab(2).concat([{ type: 'cueillette', workers: [0, 1] }]), villagers: NV(4),
      draws: [['bucher', 'tente', 'cabanon'], ['tente', 'bucher', 'cueillette'], ['cueillette', 'cabanon', 'gardemanger'], ['etal', 'verger', 'bucher'], ['cabane', 'cabanon', 'tente']],
      events: [{ day: 3, type: 'arrivals', villagers: NV(2) }],
      goals: [G.alive(5), G.never, G.stockOf(10)],
      endMsg: ['Rien dans les mains, et rien au bout.', 'Tous en vie, pas sans peine.', 'Personne n’a manqué de rien.', 'Partis de rien, et la réserve est pleine.']
    },
    c12: {
      id: 'c12', n: 12, map: 'rive', title: 'Le troc', days: 6, seed: 20261121, food: 0, wood: 0,
      voice: { text: 'J’ai donné deux bûches, on m’a rendu du pain. Personne n’y a perdu.', by: '' },
      start: cab(2).concat(cab(1, 'cabanon'), [{ type: 'bucheron', workers: [0, 1] }, { type: 'pecheur', workers: [2] }, { type: 'cueillette', workers: [3, 4] }]), villagers: NV(5),
      draws: [['etal', 'bucher', 'potager'], ['etal', 'potager', 'menuiserie'], ['gardemanger', 'bergerie', 'cabanon'], ['dortoir', 'cabane', 'potager'], ['bergerie', 'verger', 'fanal'], ['etal', 'potager', 'cabanon']],
      events: [{ day: 3, type: 'storm' }, { day: 4, type: 'arrivals', villagers: NV(3) }, { day: 5, type: 'fog' }],
      goals: [G.alive(6), G.never, G.stockOf(12)],
      endMsg: ['Plus rien à échanger.', 'Tous en vie, pas sans peine.', 'Personne n’a manqué de rien.', 'Du bois contre du pain, et il en reste.']
    },
    c13: {
      id: 'c13', n: 13, map: 'vallon', title: 'Avant la porte', days: 6, seed: 20261122, food: 0, wood: 0, stone: 0,
      voice: { text: 'Ils sont arrivés avant la porte. Nous l’avons bâtie autour d’eux.', by: '' },
      start: cab(2).concat(cab(1, 'cabanon'), [{ type: 'cueillette', workers: [0, 1] }, { type: 'bucheron', workers: [2, 3] }, { type: 'potager', workers: [4] }]), villagers: NV(5),
      draws: [['carriere', 'tente', 'potager'], ['carriere', 'potager', 'tente'], ['tente', 'carriere', 'cabanon'], ['auberge', 'potager', 'menuiserie'], ['grange', 'cabane', 'pecheur'], ['chaumiere', 'potager', 'verger']],
      events: [{ day: 3, type: 'arrivals', villagers: NV(1) }, { day: 5, type: 'arrivals', villagers: NV(2) }],
      goals: [G.alive(6), G.never, G.stockOf(8)],
      endMsg: ['La porte est restée ouverte sur le vide.', 'Tous en vie, pas sans peine.', 'Personne n’a manqué de rien.', 'Une porte, un toit, et une place pour chacun.']
    },
    c14: {
      id: 'c14', n: 14, map: 'coude', title: 'La veillée', days: 6, seed: 20261123, food: 0, wood: 0, stone: 0, joy: true,
      voice: { text: 'Le ventre à peine plein, nous avons chanté. Le reste est venu ensuite.', by: '' },
      start: cab(3).concat([{ type: 'cueillette', workers: [0, 1] }, { type: 'pecheur', workers: [2] }]), villagers: NV(6),
      draws: [['rubans', 'pressoir', 'table'], ['pressoir', 'table', 'carriere'], ['bergerie', 'pecheur', 'rubans'], ['bains', 'poulailler', 'table'], ['cellier', 'tente', 'brasero'], ['rubans', 'bains', 'table']],
      events: [{ day: 4, type: 'frost' }, { day: 5, type: 'arrivals', villagers: NV(2) }],
      goals: [G.alive(6), G.never, G.joyOf(12)],
      endMsg: ['La veillée s’est éteinte avant le feu.', 'Tous en vie, pas sans peine.', 'Personne n’a manqué de rien.', 'Partis de rien, et l’on chante encore.']
    },
    c15: {
      id: 'c15', n: 15, map: 'pre', title: 'La scie', days: 6, seed: 20261124, food: 0, wood: 0, stone: 0,
      voice: { text: 'La première planche est sortie droite. Nous l’avons regardée longtemps.', by: '' },
      start: cab(3).concat([{ type: 'cueillette', workers: [0, 1] }, { type: 'potager', workers: [2] }, { type: 'carriere', workers: [3] }]), villagers: NV(6),
      draws: [['scierie', 'tente', 'cabanon'], ['scierie', 'tente', 'cabanon'], ['taillerie', 'four', 'potager'], ['four', 'potager', 'cabanon'], ['grange', 'dortoir', 'cabane'], ['four', 'maison', 'potager']],
      events: [{ day: 5, type: 'arrivals', villagers: NV(3) }],
      goals: [G.alive(6), G.never, G.stockOf(12)],
      endMsg: ['La scie s’est tue.', 'Tous en vie, pas sans peine.', 'Personne n’a manqué de rien.', 'Des planches, un grand toit, et du pain d’avance.']
    },
    c16: {
      id: 'c16', n: 16, map: 'rive', title: 'La fumée', days: 6, seed: 20261125, food: 0, wood: 0, stone: 0,
      voice: { text: 'Le poisson d’hier nourrit aujourd’hui. C’est la fumée qui garde.', by: '' },
      start: cab(3).concat([{ type: 'pecheur', workers: [0] }, { type: 'pecheur', workers: [1] }, { type: 'cueillette', workers: [2, 3] }, { type: 'carriere', workers: [4] }, { type: 'bucheron', workers: [5] }]), villagers: NV(6),
      draws: [['fumoir', 'cabanon', 'gardemanger'], ['fumoir', 'cabanon', 'gardemanger'], ['cabanon', 'gardemanger', 'tente'], ['cabanon', 'pecheur', 'cabane'], ['cabane', 'potager', 'gardemanger'], ['pecheur', 'cabanon', 'potager']],
      events: [{ day: 3, type: 'storm' }, { day: 4, type: 'arrivals', villagers: NV(2) }, { day: 5, type: 'storm' }],
      goals: [G.alive(6), G.never, G.stockOf(12)],
      endMsg: ['La rivière n’a rien rendu.', 'Tous en vie, pas sans peine.', 'Personne n’a manqué de rien.', 'Deux orages, et la réserve sent bon la fumée.']
    },
    c17: {
      id: 'c17', n: 17, map: 'vallon', title: 'La soif', days: 6, seed: 20261126, food: 0, wood: 0, stone: 0,
      voice: { text: 'La rivière a montré ses pierres. Nous avons creusé plus bas qu’elle.', by: '' },
      start: cab(3).concat([{ type: 'potager', workers: [0] }, { type: 'potager', workers: [1] }, { type: 'pecheur', workers: [2] }, { type: 'carriere', workers: [3] }]), villagers: NV(6),
      draws: [['cueillette', 'bucheron', 'tente'], ['cueillette', 'bucheron', 'tente'], ['puits', 'tente', 'cabanon'], ['potager', 'cabane', 'tente'], ['potager', 'cabane', 'verger'], ['cueillette', 'potager', 'cabanon']],
      events: [{ day: 3, type: 'drought', len: 3 }, { day: 4, type: 'arrivals', villagers: NV(2) }],
      goals: [G.alive(6), G.never, G.stockOf(22)],
      endMsg: ['La terre a bu ce qui restait.', 'Tous en vie, pas sans peine.', 'Personne n’a manqué de rien.', 'Trois jours sans pluie, et les potagers ont tenu.']
    },
    c18: {
      id: 'c18', n: 18, map: 'coude', title: 'La crue', days: 6, seed: 20261127, food: 0, wood: 0, stone: 0,
      voice: { text: 'L’eau est montée sans bruit. Au matin, elle avait choisi.', by: '' },
      start: cab(3).concat([{ type: 'cueillette', workers: [0, 1] }, { type: 'pecheur', workers: [2] }, { type: 'carriere', workers: [3] }, { type: 'bucheron', workers: [4, 5] }]), villagers: NV(6),
      draws: [['carriere', 'tente', 'cabanon'], ['potager', 'carriere', 'pecheur'], ['digue', 'potager', 'cabanon'], ['digue', 'four', 'cabane'], ['cabane', 'four', 'potager'], ['maison', 'four', 'potager']],
      events: [{ day: 3, type: 'storm' }, { day: 4, type: 'flood', lv: 2 }, { day: 5, type: 'arrivals', villagers: NV(2) }],
      goals: [G.alive(6), G.never, G.stockOf(16)],
      endMsg: ['L’eau a tout repris.', 'Tous en vie, pas sans peine.', 'Personne n’a manqué de rien.', 'La rivière est montée. Le village n’a pas bougé.']
    },
    c19: {
      id: 'c19', n: 19, map: 'pont', title: 'Le grand vent', days: 6, seed: 20261128, food: 0, wood: 0, stone: 0,
      voice: { text: 'Le vent a pris ce qui ne pesait rien. Il nous a laissé le reste.', by: '' },
      start: cab(3).concat([{ type: 'potager', workers: [0] }, { type: 'potager', workers: [1] }, { type: 'potager', workers: [2] }, { type: 'bucheron', workers: [3] }]), villagers: NV(6),
      draws: [['cueillette', 'etal', 'tente'], ['cueillette', 'etal', 'tente'], ['pecheur', 'potager', 'verger'], ['cabane', 'tente', 'potager'], ['potager', 'cueillette', 'cabanon'], ['potager', 'cabanon', 'gardemanger']],
      events: [{ day: 4, type: 'wind', lv: 9 }, { day: 5, type: 'arrivals', villagers: NV(2) }], // un vent qui emporte tout ce qui est léger : rien n'est laissé au hasard
      goals: [G.alive(6), G.never, G.stockOf(10)],
      endMsg: ['Le vent a tout dispersé.', 'Tous en vie, pas sans peine.', 'Personne n’a manqué de rien.', 'Le vent est passé. Rien ne manque.']
    },
    c20: {
      id: 'c20', n: 20, map: 'rive', title: 'Ce qui reste', days: 7, seed: 20261129, food: 0, wood: 0, stone: 0, joy: true,
      voice: { text: 'Nous avons compté ce qui restait. Il restait nous.', by: '' },
      start: cab(3).concat([{ type: 'cueillette', workers: [0, 1] }, { type: 'pecheur', workers: [2] }, { type: 'carriere', workers: [3] }, { type: 'bucheron', workers: [4, 5] }]), villagers: NV(6),
      draws: [['etal', 'table', 'rubans'], ['etal', 'table', 'rubans'], ['gardemanger', 'rubans', 'table'], ['table', 'cabane', 'rubans'], ['cabane', 'bergerie', 'bains'], ['bergerie', 'table', 'brasero'], ['rubans', 'bains', 'cellier']],
      events: [{ day: 3, type: 'drought', len: 2 }, { day: 5, type: 'wind', lv: 9 }, { day: 5, type: 'arrivals', villagers: NV(2) }, { day: 7, type: 'frost' }],
      goals: [G.alive(7), G.never, G.joyOf(17)],
      endMsg: ['Il n’est rien resté.', 'Tous en vie, pas sans peine.', 'Personne n’a manqué de rien.', 'Partis de rien, sous un ciel dur, et l’on chante.']
    },
    /* niveaux 7 à 9 : aucun bâtiment au départ, mais de quoi commencer */
    c21: {
      id: 'c21', n: 21, map: 'pre', title: 'Table rase', days: 5, seed: 20261201, food: 14, wood: 8, stone: 0,
      voice: { text: 'Il n’y avait qu’un pré, et nos sacs posés dans l’herbe.', by: '' },
      start: [], villagers: NV(4),
      draws: [['abri', 'dortoir', 'cueillette'], ['cueillette', 'cabane', 'bucheron'], ['cabane', 'potager', 'cabanon'], ['cabane', 'pecheur', 'potager'], ['potager', 'cabanon', 'bucher']],
      events: [],
      goals: [G.alive(5), G.never, G.stockOf(16)],
      endMsg: ['Le pré est resté un pré.', 'Tous en vie, pas sans peine.', 'Personne n’a manqué de rien.', 'Un pré, cinq jours, et déjà un village.']
    },
    c22: {
      id: 'c22', n: 22, map: 'rive', title: 'L’autre rive', days: 6, seed: 20261202, food: 18, wood: 10, stone: 2,
      voice: { text: 'Nous avons choisi la rive où le soleil se lève. Le reste a suivi.', by: '' },
      start: [], villagers: NV(5),
      draws: [['abri', 'grange', 'dortoir'], ['pecheur', 'cueillette', 'bucheron'], ['cabane', 'pecheur', 'cabanon'], ['cabane', 'cueillette', 'potager'], ['cabane', 'cabanon', 'gardemanger'], ['pecheur', 'potager', 'cabanon']],
      events: [{ day: 4, type: 'storm' }, { day: 5, type: 'arrivals', villagers: NV(2) }],
      goals: [G.alive(6), G.never, G.stockOf(16)],
      endMsg: ['La rive est restée vide.', 'Tous en vie, pas sans peine.', 'Personne n’a manqué de rien.', 'Une rive nue, un orage, et sept couverts le soir.']
    },
    c23: {
      id: 'c23', n: 23, map: 'vallon', title: 'La première fête', days: 7, seed: 20261203, food: 18, wood: 10, stone: 2, joy: true,
      voice: { text: 'Avant même les murs, quelqu’un a parlé de danser.', by: '' },
      start: [], villagers: NV(5),
      draws: [['abri', 'grange', 'rubans'], ['cueillette', 'bucheron', 'rubans'], ['pecheur', 'potager', 'table'], ['carriere', 'table', 'potager'], ['maison', 'cabane', 'bains'], ['table', 'bains', 'cabanon'], ['rubans', 'jardin', 'cellier']],
      events: [{ day: 5, type: 'fog' }],
      goals: [G.alive(7), G.never, G.joyOf(20)],
      endMsg: ['Personne n’a dansé.', 'Tous en vie, pas sans peine.', 'Personne n’a manqué de rien.', 'Des murs, du pain, et l’on a dansé.']
    },
    c24: {
      id: 'c24', n: 24, map: 'coude', title: 'Les jours heureux', days: 8, seed: 20261204, food: 20, wood: 10, stone: 3, joy: true,
      voice: { text: 'Nous voulions plus que tenir. Nous voulions que ce soit bon.', by: '' },
      start: [], villagers: NV(6),
      draws: [['grange', 'abri', 'dortoir'], ['cueillette', 'pecheur', 'bucheron'], ['dortoir', 'cabane', 'table'], ['carriere', 'potager', 'rubans'], ['maison', 'table', 'cabane'], ['bains', 'maison', 'kiosque'], ['cabane', 'jardin', 'pressoir'], ['rubans', 'cellier', 'bains']],
      events: [{ day: 3, type: 'fog' }, { day: 5, type: 'storm' }, { day: 6, type: 'arrivals', villagers: NV(2) }],
      goals: [G.alive(8), G.never, G.joyOf(14)],
      endMsg: ['Les jours heureux ne sont pas venus.', 'Tous en vie, pas sans peine.', 'Personne n’a manqué de rien.', 'Huit jours, et le village sait déjà rire.']
    },
    c25: {
      id: 'c25', n: 25, map: 'pont', title: 'Les petits', days: 6, seed: 20261205, food: 16, wood: 10, stone: 2,
      voice: { text: 'Ils ne portaient rien, et c’est pour eux que nous portions tout.', by: '' },
      start: [], villagers: NV(3).concat(NK(2)),
      draws: [['abri', 'grange', 'chevre'], ['cueillette', 'cabane', 'chevre'], ['potager', 'cabane', 'cantine'], ['potager', 'bassecour', 'cabane'], ['cabane', 'cantine', 'pecheur'], ['bassecour', 'potager', 'cabanon']],
      events: [{ day: 4, type: 'arrivals', villagers: [KID] }],
      goals: [G.alive(6), G.never, G.stockOf(15)],
      endMsg: ['Le pré n’a pas gardé les petits.', 'Tous en vie, pas sans peine.', 'Personne n’a manqué de rien.', 'Trois paires de bras, six bouches, et il en reste.']
    },
    c26: {
      id: 'c26', n: 26, map: 'pre', title: 'Le chemin de l’école', days: 8, seed: 20261206, food: 22, wood: 12, stone: 4,
      voice: { text: 'Le quatrième soir, ils sont rentrés plus grands que nous ne les avions envoyés.', by: '' },
      start: [], villagers: NV(2).concat(NK(3)),
      draws: [['grange', 'abri', 'ecole'], ['ecole', 'cueillette', 'cabane'], ['cueillette', 'potager', 'ecole'], ['pecheur', 'potager', 'bucheron'], ['pecheur', 'four', 'cabane'], ['potager', 'pecheur', 'bucheron'], ['cueillette', 'pecheur', 'cabanon'], ['potager', 'cabanon', 'bucher']],
      events: [],
      goals: [G.alive(8), G.never, G.stockOf(15)],
      endMsg: ['Le chemin de l’école s’est refermé.', 'Tous en vie, pas sans peine.', 'Personne n’a manqué de rien.', 'Trois enfants sont partis à l’école. Trois adultes en sont revenus.']
    }
  };
  Object.assign(CHALLENGES, {
    c27: {
      id: 'c27', n: 27, map: 'coude', title: 'Dix jours', days: 10, seed: 20261207, food: 22, wood: 12, stone: 4, joy: true,
      voice: { text: 'Dix jours pour faire d’un pré un endroit où l’on rit. Nous en avons eu besoin de neuf.', by: '' },
      start: [], villagers: NV(4).concat(NK(2)),
      draws: [['grange', 'abri', 'dortoir'], ['cueillette', 'pecheur', 'ecole'], ['ecole', 'potager', 'carriere'], ['bucheron', 'table', 'chevre'], ['cabane', 'longere', 'jeux'], ['table', 'bassecour', 'cantine'], ['four', 'maison', 'marionnettes'], ['serre', 'brasero', 'bains'], ['poulailler', 'bergerie', 'rubans'], ['rubans', 'bains', 'cellier']],
      events: [{ day: 3, type: 'fog' }, { day: 5, type: 'arrivals', villagers: [{}, KID] }, { day: 6, type: 'storm' }, { day: 9, type: 'frost' }],
      goals: [G.alive(10), G.never, G.joyOf(21)],
      endMsg: ['Dix jours n’ont pas suffi.', 'Tous en vie, pas sans peine.', 'Personne n’a manqué de rien.', 'Dix jours, et le gel trouve un village qui chante.']
    },
    c28: {
      id: 'c28', n: 28, map: 'vallon', title: 'Les quatre greniers', days: 7, seed: 20261208, food: 18, wood: 11, stone: 2, joy: true,
      voice: { text: 'Du pain, des planches, des pierres, et de quoi rire : il fallait de tout, et le même soir.', by: '' },
      start: [], villagers: NV(5),
      draws: [['grange', 'abri', 'dortoir'], ['cueillette', 'bucheron', 'carriere'], ['carriere', 'pecheur', 'table'], ['bucheron', 'potager', 'rubans'], ['table', 'scierie', 'cabane'], ['bains', 'four', 'rubans'], ['jardin', 'etal', 'cabanon']],
      events: [{ day: 4, type: 'fog' }],
      goals: [G.alive(7), G.never, G.all(8, 6, 4, 6)],
      endMsg: ['Les greniers sont restés vides.', 'Tous en vie, pas sans peine.', 'Personne n’a manqué de rien.', 'Quatre greniers, et aucun n’est vide.']
    },
    c29: {
      id: 'c29', n: 29, map: 'rive', title: 'La bonne mesure', days: 7, seed: 20261209, food: 20, wood: 12, stone: 3, joy: true,
      voice: { text: 'Trop de bois, pas assez de pain ; puis l’inverse. Il a fallu apprendre la mesure.', by: '' },
      start: [], villagers: NV(4).concat(NK(2)),
      draws: [['grange', 'abri', 'dortoir'], ['pecheur', 'cueillette', 'chevre'], ['carriere', 'bucheron', 'jeux'], ['bassecour', 'carriere', 'table'], ['cantine', 'bucheron', 'marionnettes'], ['table', 'potager', 'jeux'], ['rubans', 'etal', 'cabanon']],
      events: [{ day: 3, type: 'storm' }, { day: 5, type: 'drought', len: 2 }],
      goals: [G.alive(7), G.never, G.all(6, 6, 4, 8)],
      endMsg: ['Rien n’a été à la mesure.', 'Tous en vie, pas sans peine.', 'Personne n’a manqué de rien.', 'De tout, juste assez, et les enfants ont ri.']
    },
    c30: {
      id: 'c30', n: 30, map: 'pont', title: 'Ce que nous leur laissons', days: 10, seed: 20261210, food: 24, wood: 12, stone: 4, joy: true,
      voice: { text: 'Nous n’avons pas bâti pour nous. Nous avons bâti pour qu’ils n’aient pas à recommencer.', by: '' },
      start: [], villagers: NV(4).concat(NK(2)),
      draws: [['grange', 'abri', 'ecole'], ['cueillette', 'pecheur', 'chevre'], ['ecole', 'carriere', 'potager'], ['puits', 'bassecour', 'bucheron'], ['longere', 'cabane', 'tente'], ['foyer', 'table', 'jeux'], ['digue', 'four', 'cantine'], ['brasero', 'bergerie', 'marionnettes'], ['table', 'poulailler', 'bains'], ['rubans', 'cellier', 'bains']],
      events: [{ day: 2, type: 'fog' }, { day: 4, type: 'drought', len: 2 }, { day: 5, type: 'arrivals', villagers: [{}, KID] }, { day: 6, type: 'wind', lv: 9 }, { day: 7, type: 'storm' }, { day: 8, type: 'flood', lv: 2 }, { day: 9, type: 'frost' }],
      goals: [G.alive(10), G.never, G.joyOf(26)],
      endMsg: ['Il ne leur est rien resté.', 'Tous en vie, pas sans peine.', 'Personne n’a manqué de rien.', 'Un pré, dix jours, sept ciels contraires — et un village à leur laisser.']
    }
  });
  CHALLENGES.survie = {
    id: 'survie', n: 0, survival: true, map: 'pre', title: 'Survie', days: 1e9, seed: 20261201, food: 4, wood: 2, stone: 0,
    voice: { text: 'Nous ne savions pas combien de jours. Nous avons compté quand même.', by: '' },
    start: cab(1).concat([{ type: 'cueillette', workers: [0, 1] }]), villagers: NV(4), events: [], goals: [],   // quatre au départ, un seul toit pour deux, de quoi manger un soir
    draws: [[].concat(FAM.toit, FAM.vivres, FAM.bois, FAM.pierre, ['serre', 'fanal', 'digue', 'brasero', 'cloche'])],
    endMsg: ['Le village s’est tu.', '', '', '']
  };
  for (const k in CHALLENGES) CHALLENGES[k].deck = Array.from(new Set([].concat.apply([], CHALLENGES[k].draws)));
  const LEVELS = [
    { id: 'l1', name: 'Tutoriels', sub: 'Apprendre à regarder', ch: ['c1', 'c2'] },
    { id: 'l2', name: 'Les beaux jours', sub: 'L’eau, la pierre et le pain', ch: ['c3', 'c4', 'c5', 'c6'] },
    { id: 'l3', name: 'Les jours gris', sub: 'La brume, le froid et la joie', ch: ['c7', 'c8', 'c9', 'c10'] },
    { id: 'l4', name: 'Les mains vides', sub: 'Repartir de rien', ch: ['c11', 'c12', 'c13', 'c14'] },
    { id: 'l5', name: 'Les outils', sub: 'Scier, fumer, creuser', ch: ['c15', 'c16', 'c17'] },
    { id: 'l6', name: 'Le ciel contre nous', sub: 'La crue, le vent, et ce qui reste', ch: ['c18', 'c19', 'c20'] },
    { id: 'l7', name: 'Sans toit', sub: 'Rien de bâti, mais de quoi commencer', ch: ['c21', 'c22', 'c23', 'c24'] },
    { id: 'l8', name: 'Les enfants', sub: 'Des bouches, puis des bras', ch: ['c25', 'c26', 'c27'] },
    { id: 'l9', name: 'Tout à la fois', sub: 'De tout, et le même soir', ch: ['c28', 'c29', 'c30'] }
  ];

  return { get W() { return W; }, get H() { return H; }, get EXT() { return EXT; }, world, CELL, T, SPEED, RES, RNAME, RATIO, maxBuilds, affordBoth, options, solid, BT, JOBNAME, LIGHT, SCHOOL_DAYS, SEATS, CHALLENGES, LEVELS, MAPDEF, rngOf, getMap, cast, popOf, costOf, newGame, planDay, survDraw, survJobs, sample, draw, capacity, door, buildNav, findPath, eventsOn, weather, beginDay, placeBuilding, afford, blocked };
})();
if (typeof module !== 'undefined') module.exports = SIM;
