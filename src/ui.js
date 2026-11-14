'use strict';
/* ===== Hameau — interface : écran titre, livre, jeu, tutoriel ===== */
const UI = (() => {
  const $ = s => document.querySelector(s), app = $('#app'), cv = $('#cv');
  const hud = $('#hud'), bottom = $('#bottom'), insp = $('#insp'), titleEl = $('#title'), book = $('#book'), pageEl = $('#page'), modal = $('#modal'), coachEl = $('#coach');
  const T = SIM.T;
  /* Les icônes : dessins de l’auteur (ICONS), d'une seule couleur. La classe k-… donne la teinte, choisie par le fond (papier ou image) dans la feuille de style. */
  ICONS['collection'] = { d: ICONS['cartes'].d.split(/(?=M)/).slice(0, 4).join('') }; // les cartes de la planche, sans le pique du milieu
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
    back: P('retour'), menu: P('carnet'), pause: P('pause'), play: P('lecture'), x: P('fermer', '', 24), book: P('livre'), sp1: P('vitesse-1'), sp2: P('vitesse-2'), sp4: P('vitesse-4'), skip: S('<path d="M5 5l7 7-7 7M12 5l7 7-7 7"/><path d="M21 5v14"/>', 'i'),
    ok: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.500l3.200 3.200L13 4.800" fill="none" stroke="currentColor" stroke-width="2.200" stroke-linecap="round" stroke-linejoin="round"/></svg>', no: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="2.200" stroke-linecap="round"/></svg>', snd: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.500h3.500L12 5.500v13l-4.500-4H4z" fill="currentColor"/><path d="M15.500 9a4.200 4.200 0 010 6M18 6.500a8 8 0 010 11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>', mute: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.500h3.500L12 5.500v13l-4.500-4H4z" fill="currentColor"/><path d="M16 9.500l5 5M21 9.500l-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    ppl: P('villageois', 'i k-ppl'), ppl2: P('nouveaux-venus', 'i k-ppl'), soi: P('soi', 'i k-ppl'), autre: P('autre', 'i k-ppl'),
    storm: P('orage', 'i k-storm'), frost: P('gel', 'i k-frost'), fog: P('brume', 'i k-fog'), sun: P('soleil', 'i k-sun'), moon: P('lune', 'i k-moon'),
    chantier: P('chantier', 'i'), work: P('travail', 'i k-work'), repas: P('repas', 'i'), coucher: P('coucher', 'i'), nuit: P('nuit', 'i'),
    faim: P('faim', 'i k-bad'), dehors: P('dehors', 'i k-bad'), dort: P('dort', 'i k-moon'),
    defis: P('defis'), sandbox: P('bac-a-sable'), cards: P('collection'), options: P('options'), music: P('musique'), nature: P('nature'), sonvillage: P('village'), ui: P('interface'),
    leaf: P('feuille'), drop: P('goutte'), hameau: P('hameau'),
    cueilleur: P('cueilleur', 'i k-work'), bucheron: P('bucheron', 'i k-work'), paysan: P('jardinier', 'i k-work'), pecheur: P('pecheur', 'i k-work'), carrier: P('tailleur', 'i k-work'), boulanger: P('boulanger', 'i k-work'), none: P('sans-poste', 'i k-sad'),
    espoir: P('espoir', 'i k-hope'), crainte: P('crainte', 'i k-fear'), content: P('contentement', 'i k-calm'), peine: P('peine', 'i k-sad'), amitie: P('amitie', 'i k-friend'), heart: P('amour', 'i k-love'), amour: P('amour', 'i k-love'), rancoeur: P('rancoeur', 'i k-grudge'),
    grave: P('mort', 'i k-death'), village: P('village', 'i k-roof')
  };
  for (const k in STROKES) I[k] = S('<path d="' + STROKES[k] + '"/>', 'i k-' + (k === 'tornado' ? 'storm' : k === 'town' || k === 'build2' ? 'roof' : k));
  /* ce que l'on dit des événements : leur nom, et en une ligne ce qu'ils empêchent */
  const EV = {
    arrivals: { icon: 'ppl2', ic: e => e.villagers.length > 1 ? I.ppl2 : I.ppl, name: e => { const n = e.villagers.length, k = e.villagers.filter(x => x && x.child).length; return (n > 1 ? n + ' nouveaux venus' : 'Un nouveau venu') + (k === n ? (n > 1 ? ' (des enfants)' : ' (un enfant)') : k ? ', dont ' + (k > 1 ? k + ' enfants' : 'un enfant') : ''); } },
    storm: { icon: 'storm', name: () => 'Orage', tip: 'la rivière ne se passe plus, on ne pêche pas' },
    frost: { icon: 'frost', name: e => e.len ? 'Gel de ' + e.len + ' jours' : 'Gel', tip: 'plus de récoltes, et une nuit dehors tue' },
    heat: { icon: 'sun', name: () => 'Canicule', tip: 'cette nuit, la moitié de la nourriture crue se gâte ; les repas se gardent' },
    tornado: { icon: 'tornado', name: () => 'Tornade', tip: 'ce soir, elle emporte tout ce qui est bâti sans pierre ni brique' },
    sick: { icon: 'malade', name: () => 'Maladie', tip: 'un villageois alité deux jours ; elle passe à qui dort sous le même toit' },
    fire: { icon: 'fire', name: () => 'Incendie', tip: 'un bâtiment de bois brûle ce soir, sauf si un puits l’éteint' },
    wolves: { icon: 'loups', name: () => 'Loups', tip: 'ils emportent qui dort dehors, sinon des vivres ; un braséro les tient loin' },
    drought: { icon: 'sun', name: e => 'Sécheresse' + (e.len > 1 ? ' de ' + e.len + ' jours' : ''), tip: 'plus de pêche, et les potagers à moitié sans puits' },
    wind: { icon: 'vent', name: () => 'Grand vent', tip: 'ce soir, il emporte tentes, abris et constructions légères' },
    flood: { icon: 'storm', name: () => 'Crue', tip: 'ce soir, elle emporte les bâtiments proches de l’eau, sauf s’il y a une digue' },
    rats: { icon: 'rats', name: () => 'Rats', tip: 'ils pillent la réserve cette nuit, sauf garde-manger, cellier ou entrepôt' },
    fog: { icon: 'fog', name: () => 'Brume', tip: 'ni forêt, ni rochers, ni bois mort' }
  };
  /* la définition d'un événement : ce qu'il fait, ce qui l'empêche — dite sans détour. Les listes de bâtiments viennent des règles elles-mêmes. */
  const BLD = f => names(Object.keys(SIM.BT).filter(t => f(SIM.BT[t])).map(t => SIM.BT[t].name.toLowerCase()));
  const EVD = {
    arrivals: () => 'Ils arrivent le matin. Il leur faut une place sous un toit et de quoi manger dès ce soir.',
    storm: () => 'La rivière ne se traverse pas. À l’arrêt : ' + BLD(d => d.storm && d.posts) + '. Une digue annule ces effets. En survie, un orage fort peut aussi foudroyer un bâtiment, sauf s’il y a un puits.',
    frost: () => 'Ne donnent plus rien : ' + BLD(d => d.frost) + '. Une serre protège potagers, ruches et jardins. Qui dort dehors meurt dans la nuit, sauf s’il y a un braséro.',
    fog: () => 'À l’arrêt : ' + BLD(d => d.fog && d.posts) + '. On ne ramasse plus de bois mort. Un fanal annule ces effets.',
    drought: () => 'À l’arrêt : ' + BLD(d => d.dryStop) + '. Les potagers donnent moitié moins, sauf s’il y a un puits.',
    wind: () => 'Le soir, il détruit les constructions légères — toutes dans les défis, quelques-unes en survie : ' + names(SIM.LIGHT.map(t => SIM.BT[t].name.toLowerCase())) + '.',
    flood: () => 'Le soir, elle détruit les bâtiments les plus proches de la rivière. Une digue l’empêche.',
    fire: () => 'Le soir, un bâtiment en bois brûle. Un puits l’empêche.',
    rats: () => 'La nuit, ils mangent une partie de la réserve. Un garde-manger ou un cellier réduit la perte à presque rien ; un entrepôt l’annule.',
    wolves: () => 'La nuit, ils tuent quelqu’un qui dort dehors. Si tout le monde est à l’abri, ils volent de la nourriture. Un braséro les éloigne.',
    heat: () => 'La nuit, la moitié de la nourriture en réserve se gâte. Les repas cuisinés se conservent.',
    tornado: () => 'Le soir, elle emporte tous les bâtiments dont le coût ne compte ni pierre ni brique. Ceux qui y dormaient se retrouvent dehors.',
    sick: (e, c) => c && !c.survival ? (e.n > 1 ? e.n + ' villageois tombent malades' : 'Un villageois tombe malade') + ' ce matin, pour deux jours : on ne sait pas qui. Un malade ne travaille pas. Chaque nuit, sous un toit partagé, il contamine un voisin de chambrée. Un malade qui a faim ou dort dehors meurt.' + (e.grave ? ' <b>Fièvre grave :</b> sans médecin, le malade meurt au second soir.' : '') + ' Avec un médecin à son poste, personne ne meurt de maladie et elle ne se transmet plus.'
      : 'Des villageois sont malades deux jours et ne travaillent pas. La maladie passe à ceux qui dorment sous le même toit ; des bains la freinent. Un malade qui a faim ou dort dehors meurt, et la fièvre peut tuer. Un médecin à son poste empêche l’une et l’autre.'
  };
  const EVG = { arrivals: 'Nouveaux venus', storm: 'Orage', frost: 'Gel', fog: 'Brume', drought: 'Sécheresse', wind: 'Grand vent', flood: 'Crue', fire: 'Incendie', rats: 'Rats', wolves: 'Loups', sick: 'Maladie', tornado: 'Tornade', heat: 'Canicule' };
  const evName = e => e.type === 'arrivals' && !e.gen ? EV.arrivals.name(e) : e.type === 'sick' && e.grave ? 'Fièvre grave' : EVG[e.type];
  const evIcon = e => EV[e.type].ic ? EV[e.type].ic(e) : I[EV[e.type].icon];
  const evDur = (e, c) => e.cont ? 'jour ' + e.cont + (e.len ? ' sur ' + e.len : '') : e.len > 1 ? 'dure ' + e.len + ' jours' : e.type === 'frost' && e.len == null && !c.survival ? 'jusqu’à la fin du défi' : '';
  const evDefs = (ev, c) => ev.map(e => '<div class="evd"><span class="evc">' + evIcon(e) + '</span><div><b>' + evName(e) + '</b>' + (evDur(e, c) ? '<small>' + evDur(e, c) + '</small>' : '') + '<p>' + EVD[e.type](e, c) + '</p></div></div>').join('');
  const pile = ev => '<span class="pile">' + ev.map((e, k) => '<span class="evc" style="z-index:' + (9 - k) + '">' + evIcon(e) + '</span>').join('') + '</span>';
  const INFO = { foyer: 'Quatre places, pour de bon.', longere: 'Trois places en dur, à qui en a besoin.', ferme: 'Trois places, pour de bon, et une nourriture par jour.', ecole: 'Trois enfants y vont chaque jour. Au bout de quatre jours, ils sont adultes.', bibliotheque: 'L’école ne prend plus que trois jours.',
    cantine: 'Trois enfants y mangent chaque soir sans toucher à la réserve.', chevre: 'Un enfant y boit son lait chaque soir, sans toucher à la réserve.', bassecour: 'Chaque enfant qui n’est pas à l’école rapporte un œuf par jour, deux au plus.', jeux: 'Un bonheur par enfant chaque jour, trois au plus.', marionnettes: 'Deux bonheurs chaque soir, tant qu’il reste un enfant.', cabane: 'Deux places, à qui en a besoin.', cabanon: 'Une place, à qui en a besoin.', maison: 'Deux places, pour de bon.', cueillette: 'Baies de l’autre rive.', potager: 'Légumes du village.', bucheron: 'Arbres de la lisière.', pecheur: 'Poisson de la rivière.', carriere: 'Pierre des rochers.', four: 'Pain cuit sur place.', table: 'Si tous mangent, la joie monte.', abri: 'Quatre places, pour deux nuits seulement.', dortoir: 'Quatre places, à qui en a besoin.', poulailler: 'Des œufs, par tous les temps.', champi: 'Peu de chose, sauf dans la brume ou après la pluie.', rucher: 'Du miel, sans personne. Craint le gel.', serre: 'Garde du gel potagers, ruches et fleurs.', fanal: 'Dans la brume, il guide vers la forêt et les rochers.', jardin: 'Un peu de joie chaque jour. Craint le gel.', kiosque: 'De la musique, et de la joie chaque soir.', moulin: 'Chaque four donne deux pains de plus.', cloche: 'On la sonne : dans deux jours, quelqu’un l’aura entendue.',
    grange: 'Six places dans le foin, à qui en a besoin.', chaumiere: 'Trois places, pour de bon.', tente: 'Deux places, pour trois nuits seulement.', auberge: 'Deux places. Chaque nouveau venu y laisse deux provisions.',
    verger: 'Deux fruits par jour, à partir du surlendemain. Craint le gel.', bergerie: 'Du lait et du fromage, par tous les temps.', fumoir: 'Chaque pêcheur rapporte un poisson de plus.', puits: 'Chaque potager donne un légume de plus.',
    etal: 'Chaque jour, deux bois contre deux nourritures.', gardemanger: 'Quand la réserve est vide, il reste un repas.', scierie: 'Trois bois par jour, même dans la brume.', menuiserie: 'Chaque chantier coûte un bois de moins.',
    taillerie: 'Chaque chantier coûte une pierre de moins.', bucher: 'Qui glane rapporte un bois de plus.', digue: 'Sous l’orage, le pont tient et la rivière se laisse approcher.', brasero: 'Une nuit de gel dehors n’est plus mortelle.',
    rubans: 'Un peu de joie chaque jour, même sous le gel.', bains: 'Chaque jour, un bois contre deux joies.', pressoir: 'Du cidre, et de la joie chaque soir.', cellier: 'Une joie par soir, tant que la réserve est pleine.',
    argiliere: 'Deux argiles par jour, par tous les temps.', briqueterie: 'Deux argiles en réserve le matin donnent une brique. Quatre argiles par jour au plus.', charpenterie: 'Deux bois en réserve le matin donnent une planche. Quatre bois par jour au plus.',
    cuisine: 'Deux nourritures donnent un repas : il nourrit une personne et donne un bonheur. Elle ne prend que ce qui dépasse le repas du soir.', lycee: 'Trois cultures par jour, tant qu’un professeur y enseigne.', universite: 'Deux cultures en réserve le matin donnent une ingéniosité. Quatre cultures par jour au plus.',
    theatre: 'Une culture et deux bonheurs par jour.', observatoire: 'Deux cultures par jour.', academie: 'Comme l’université, mais jusqu’à huit cultures par jour.', arts: 'Deux bonheurs donnent un épanouissement. Quatre bonheurs par jour au plus.',
    cabinet: 'Tant que le médecin est à son poste, personne ne meurt de maladie et elle ne se transmet plus.', geologue: 'Tant qu’il est à son poste, une argile suffit pour une brique.', ingenieur: 'Tant qu’il est à son poste, un bois suffit pour une planche.', chef: 'Tant qu’il est à son poste, une nourriture suffit pour un repas.', psy: 'Tant qu’il est à son poste, un bonheur suffit pour un épanouissement.',
    maisonbrique: 'Quatre places. Tient sous la tornade.', demeure: 'Six places. Tient sous la tornade.', entrepot: 'Les rats n’y entrent pas : la réserve ne perd rien.', halle: 'Deux nourritures et un bois par jour, sans personne.', outillerie: 'Un de plus par travailleur aux champs, au bois, à la carrière, à l’argilière — quatre au plus.' };
  INFO.bibliotheque = 'L’école ne prend plus que trois jours. Là où l’on s’en sert, une culture par jour.';
  const RESD = [[I.food, 'Nourriture', 'Chaque villageois en mange 1 chaque soir. Deux soirs de suite sans manger, il meurt.'], [I.wood, 'Bois', 'Sert à payer les bâtiments. Un villageois sans poste en ramasse 1 par jour.'], [I.stone, 'Pierre', 'Sert à payer certains bâtiments. Elle vient de la carrière.'],
    [I.roof, 'Toits', 'Une place par villageois. Deux nuits de suite dehors, il meurt ; par gel, une seule nuit suffit.'], [I.joy, 'Bonheur', 'Ne compte que dans certains défis, où il sert d’objectif. Les bâtiments de la famille « Se réjouir » en donnent.'], [I.ppl, 'Villageois', 'Ils agissent seuls. Un bâtiment à postes ne produit que s’il a quelqu’un pour y travailler.'], [I.ppl2, 'Enfants', 'Ils mangent comme les autres mais ne travaillent pas et ne bâtissent pas. Ils passent avant les adultes pour les lits. Sans lit, un enfant dort dans n’importe quel bâtiment couvert ; s’il n’y en a aucun, il meurt dans la nuit. Quatre jours d’école en font un adulte.'],
    [I.clay, 'Argile', 'Elle vient de l’argilière. La briqueterie en fait des briques.'], [I.brick, 'Briques', 'Deux argiles donnent une brique. Elles paient les bâtiments qui tiennent sous la tornade.'], [I.plank, 'Planches', 'Deux bois donnent une planche, à la charpenterie.'], [I.meal, 'Repas', 'Deux nourritures donnent un repas, à la cuisine. La cuisine ne prend que ce qui dépasse le repas du soir. Le soir, on mange les repas d’abord : un repas nourrit une personne et donne 1 bonheur.'],
    [I.culture, 'Culture', 'Elle vient du lycée, de la bibliothèque, du théâtre, de l’observatoire. L’académie en fait de l’ingéniosité.'], [I.ingen, 'Ingéniosité', 'Deux cultures donnent une ingéniosité. Elle paie les bâtiments des maîtres : médecin, géologue, ingénieur, cuisinier, psychologue.'], [I.bloom, 'Épanouissement', 'Deux bonheurs donnent un épanouissement, à l’atelier des arts. Le bonheur ainsi changé est dépensé.'],
    [I.town, 'Bourg', 'À dix habitants, le village devient un bourg : ses chemins sont pavés, le feu de camp devient une vasque sur une place de pierre, et il peut mener deux chantiers par jour.'], [I.build2, 'Atelier', 'Un atelier ne transforme que ce qui était en réserve le matin, une fois les chantiers payés. Sans personne à son poste, ou sans matière, il reste à l’arrêt.']];
  const RESN = { food: 'Nourriture', wood: 'Bois', stone: 'Pierre', clay: 'Argile', brick: 'Briques', plank: 'Planches', meal: 'Repas', culture: 'Culture', ingen: 'Ingéniosité', bloom: 'Épanouissement', joy: 'Bonheur' }, LACK = { food: 'Nourriture insuffisante', wood: 'Bois insuffisant', stone: 'Pierre insuffisante', clay: 'Argile insuffisante', brick: 'Briques insuffisantes', plank: 'Planches insuffisantes', meal: 'Repas insuffisants', culture: 'Culture insuffisante', ingen: 'Ingéniosité insuffisante', bloom: 'Épanouissement insuffisant' };
  const XRES = ['clay', 'brick', 'plank', 'meal', 'culture', 'ingen', 'bloom']; let xres = [];
  const VOLS = [['music', 'Musique', 'note'], ['nature', 'Nature', 'splash'], ['village', 'Village', 'hammer'], ['ui', 'Interface', 'card']];
  const ORDER = SIM.LEVELS.reduce((a, l) => a.concat(l.ch), []);
  const lvlOf = id => SIM.LEVELS.findIndex(l => l.ch.includes(id));

  let save = { stars: {}, tuto: {}, vol: {}, theme: 'carnet', bub: 'phrases' };
  try { Object.assign(save, JSON.parse(localStorage.getItem('hameau.v2') || '{}')); } catch (e) { /* stockage indisponible */ }
  /* la collection : ce que l'on a rencontré en jouant. Pour qui a déjà des étoiles, on part des défis réussis. */
  if (!save.seen) { save.seen = {}; save.sev = {}; for (const id in save.stars) { const c = SIM.CHALLENGES[id]; if (!c || !save.stars[id]) continue; (c.deck || []).concat(c.start.map(b => b.type)).forEach(t => { save.seen[t] = 1; }); (c.events || []).forEach(e => { save.sev[e.type] = 1; }); } }
  if (!save.sev) save.sev = {};
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
    ['Bâtir', ['bucheron', 'carriere', 'scierie', 'bucher', 'menuiserie', 'taillerie']], ['Se réjouir', ['table', 'jardin', 'rubans', 'kiosque', 'pressoir', 'bains', 'cellier']], ['Tenir tête au ciel', ['serre', 'fanal', 'digue', 'brasero', 'cloche']], ['Vie de famille', ['foyer', 'longere', 'ferme', 'ecole', 'bibliotheque', 'cantine', 'chevre', 'bassecour', 'jeux', 'marionnettes']],
    ['Manufacture', ['argiliere', 'briqueterie', 'charpenterie', 'cuisine', 'maisonbrique', 'demeure', 'entrepot', 'halle', 'outillerie']], ['Savoir', ['lycee', 'universite', 'theatre', 'observatoire', 'academie', 'arts']], ['Maîtres de leur art', ['cabinet', 'geologue', 'ingenieur', 'chef', 'psy']]];
  const BOOSTL = { four: 'par boulanger', pecheur: 'par pêcheur', potager: 'par jardinier', glean: 'par glaneur' }, ANTIL = { frost: ['frost', 'abrite les jardins'], fog: ['fog', 'guide dans la brume'], storm: ['storm', 'retient la rivière'], cold: ['frost', 'le gel ne tue plus'] };
  const CONVOF = {}; for (const t in SIM.BT) if (SIM.BT[t].conv) CONVOF[SIM.BT[t].conv.to] = SIM.BT[t].conv.from;
  const resOf = o => Object.keys(o).map(k => o[k] + I[k]).join(' ');
  /* ce que fait une carte : [valeur, icône, précision] */
  function effect(type, small) {
    const d = SIM.BT[type], jy = SIM.CHALLENGES[chId].joy, bk = d.boost && Object.keys(d.boost)[0], gk = d.give && Object.keys(d.give)[0];
    const m = d.beds ? ['+' + d.beds, I.roof, d.own ? 'à demeure' : d.life ? d.life + ' nuits' : '']
      : d.conv ? [small ? SIM.RATIO + I[d.conv.from] + ' › 1' : '', small ? I[d.conv.to] : '<b class="sw">' + SIM.RATIO + I[d.conv.from] + ' › 1' + I[d.conv.to] + '</b>', d.conv.cap / SIM.RATIO + ' par jour au plus' + (d.conv.from === 'food' ? ', sur le surplus' : '')]
      : d.expert ? [small ? '1' + I[CONVOF[d.expert]] + ' › 1' : '', small ? I[d.expert] : '<b class="sw">1' + I[CONVOF[d.expert]] + ' › 1' + I[d.expert] + '</b>', 'au lieu de ' + SIM.RATIO + ' pour 1']
      : d.medic ? ['', I.malade, 'plus de mort ni de contagion']
      : d.store ? ['', I.rats, 'les rats ne prennent rien']
      : d.tools ? ['+' + d.tools, I.work, 'par travailleur, ' + d.toolCap + ' au plus']
      : d.school ? ['', I.ppl, d.school + ' enfants : adultes en ' + SIM.SCHOOL_DAYS + ' jours']
      : d.fast ? ['−' + d.fast, I.ppl, 'jour d’école' + (d.give && xres.includes('culture') ? ', +' + d.give.culture + ' culture par jour' : '')]
      : d.feedKids ? ['+' + d.feedKids, I.food, d.feedKids > 1 ? 'repas d’enfants offerts' : 'repas d’enfant offert']
      : d.kidFood ? ['+' + d.kidFood, I.food, 'par enfant, ' + d.kidCap + ' au plus']
      : d.kidJoy ? ['+' + d.kidJoy, I.joy, 'par enfant, ' + d.kidCap + ' au plus']
      : d.ifKid ? ['+' + d.ifKid, I.joy, 's’il y a un enfant']
      : d.joy ? ['+' + d.joy, I.joy, 'si tous mangent']
      : d.play ? ['+' + d.play, I.joy, 'par soir']
      : d.give ? [Object.keys(d.give).map(k => '+' + d.give[k] + (small || k !== gk || Object.keys(d.give).length > 1 ? I[k] : '')).join(' '), Object.keys(d.give).length > 1 || small ? '' : I[gk], 'par jour' + (d.wait ? ', après ' + d.wait + ' jours' : '')]
      : d.boost ? ['+' + d.boost[bk], I[bk === 'glean' ? 'wood' : SIM.BT[bk].out], BOOSTL[bk]]
      : d.swap ? [small ? resOf(d.swap.take) + ' › ' : '', small ? resOf(d.swap.give) : '<b class="sw">' + resOf(d.swap.take) + ' › ' + resOf(d.swap.give) + '</b>', 'par jour']
      : d.discount ? ['−' + d.discount[Object.keys(d.discount)[0]], I[Object.keys(d.discount)[0]], 'par chantier']
      : d.plenty ? ['+' + d.plenty, I.joy, 'réserve pleine']
      : d.ration ? ['+' + d.ration, I.food, 'quand tout manque']
      : d.call ? ['+1', I.ppl, 'dans ' + d.call + ' jours']
      : d.anti ? ['', I[ANTIL[d.anti][0]], ANTIL[d.anti][1]]
      : ['+' + d.per * d.posts + (d.wet ? ' à ' + d.wet : ''), I[d.out], 'par jour'];
    if (small) return m[0] + m[1];
    return '<span class="ce">' + (m[0] ? '<b>' + m[0] + '</b>' : '') + m[1] + (m[2] ? '<small>' + m[2] + '</small>' : '') + '</span>' + (d.posts ? '<span class="cw">' + I.ppl + '<span>× ' + d.posts + '</span></span>' : '') + ((SIM.CHALLENGES[chId].events || []).some(e => e.type === 'tornado') && SIM.solid(type) ? '<span class="cw">' + I.tornado + '<span>tient sous la tornade</span></span>' : '') + (d.own && jy ? '<span class="cw">' + I.joy + '<span>+1 par habitant</span></span>' : '') + (d.welcome ? '<span class="cw">' + I.food + '<span>+' + d.welcome + ' par nouveau venu</span></span>' : '') + (d.beds && d.give ? '<span class="cw">' + I.food + '<span>+' + d.give.food + ' par jour</span></span>' : '');
  }
  /* le sommaire : de grandes entrées, un titre et une ligne claire */
  const big = (go, title, desc, ic, soon) => '<button class="tl big' + (soon ? ' soon' : '') + '" data-go="' + go + '"><span class="ti">' + ic + '</span><span class="tb"><b>' + title + '</b><em>' + desc + '</em></span><span class="chev" aria-hidden="true">›</span></button>';
  /* le registre : une ligne par chose connue, un « ? » pour le reste */
  const regRow = (ic, name, def) => '<div class="evd"><span class="evc">' + ic + '</span><div><b>' + name + '</b><p>' + def + '</p></div></div>';
  const LOCK = '<div class="evd lock"><span class="evc">?</span><div><b>À découvrir</b></div></div>';
  const galHtml = list => '<div class="gal">' + list.map(t => save.seen[t] ? '<span class="dk"><canvas data-t="' + t + '" aria-hidden="true"></canvas>' + SIM.BT[t].name + '<small><span>' + Object.keys(SIM.BT[t].cost).map(k => SIM.BT[t].cost[k] + I[k]).join(' ') + '</span><span>→ ' + effect(t, true) + '</span></small></span>' : '<span class="dk lock"><span class="q">?</span>À découvrir</span>').join('') + '</div>';
  const deckHtml = (list, cls) => '<div class="' + cls + '">' + list.map(t => '<span class="dk"><canvas data-t="' + t + '" aria-hidden="true"></canvas>' + SIM.BT[t].name + '<small><span>' + Object.keys(SIM.BT[t].cost).map(k => SIM.BT[t].cost[k] + I[k]).join(' ') + '</span><span>→ ' + effect(t, true) + '</span></small></span>').join('') + '</div>';
  const goalsHtml = (c, ok) => '<ul class="goals">' + c.goals.map((g, i) => '<li class="' + (ok && !ok[i] ? 'ko' : '') + '"><span class="st">' + (ok ? (ok[i] ? I.star : I.star0) : I.star.repeat(i + 1)) + '</span>' + g.t + '</li>').join('') + '</ul>' + (!ok && c.rule ? '<p class="rule"><b>Nouveau.</b> ' + c.rule + '</p>' : '');
  const nextSeed = {}, seedFor = id => nextSeed[id] != null ? nextSeed[id] : (nextSeed[id] = (Math.random() * 4294967296) >>> 0);
  const voiceHtml = (c, by) => '<p class="voice">« ' + c.voice.text + ' »<span>— ' + by + '</span></p>';
  const volsHtml = () => VOLS.map(v => '<div class="opt-row"><label for="v_' + v[0] + '">' + I[v[0] === 'village' ? 'sonvillage' : v[0]] + v[1] + '</label><input type="range" id="v_' + v[0] + '" min="0" max="100" step="5" value="' + Math.round(SFX.vol[v[0]] * 100) + '"></div>').join('');
  function bindVols(root) { for (const v of VOLS) { const e = root.querySelector('#v_' + v[0]); if (!e) continue; e.oninput = () => { save.vol[v[0]] = e.value / 100; SFX.setVol(v[0], e.value / 100); }; e.onchange = () => { persist(); SFX.play(v[2]); }; } }

  /* la frise d'un défi : ses jours, et ce qui y est annoncé. Plusieurs annonces le même jour : des pastilles qui se chevauchent.
     Dessous, les annonces par leur nom ; on touche un jour ou un nom pour lire ce que cela veut dire. */
  /* ce qui dure se rappelle chaque jour : une sécheresse ou un gel de plusieurs jours, et dans les défis un gel sans durée, qui tient jusqu'au bout */
  const contOn = (c, st, d) => (c.survival ? (st && st.ev) || [] : c.events || []).filter(x => d > x.day && (x.len > 1 ? d < x.day + x.len : !c.survival && x.type === 'frost' && x.len == null) && !(x.sudden && st && x.day > st.day));
  const dayEv = (c, st, d) => (c.survival ? SIM.eventsOn(st, d) : (c.events || []).filter(x => x.day === d)).concat(contOn(c, st, d).map(x => Object.assign({}, x, { cont: d - x.day + 1 })));
  let friseEv = {}, friseC = null;
  function frise(c, day) {
    let h = '<div class="frise" role="group" aria-label="Les jours et ce qui est annoncé">', l = ''; friseEv = {}; friseC = c;
    for (let d = c.survival ? day : 1; d <= (c.survival ? day + 2 : c.days); d++) {
      const e = dayEv(c, c.survival ? GAME.st : null, d), nm = e.map(evName).join(', '); friseEv[d] = e;
      h += '<button class="fd' + (d < day ? ' past' : d === day ? ' now' : '') + (e.length ? ' ev' : '') + '" data-d="' + d + '" aria-label="Jour ' + d + (e.length ? ' : ' + nm : '') + '"' + (e.length ? '' : ' disabled') + '>' + (e.length ? pile(e) : d) + '</button>';
      if (e.length && !e.every(x => x.cont)) l += '<button class="evn' + (d < day ? ' past' : '') + '" data-d="' + d + '"><i>Jour ' + d + '</i><span>' + e.filter(x => !x.cont).map(x => evName(x) + (evDur(x, c) ? ' <small>(' + evDur(x, c).replace('dure ', '') + ')</small>' : '')).join(', ') + '</span></button>';
    }
    return h + '</div>' + (l ? '<div class="evl">' + l + '</div>' : '') + '<div class="evbox" aria-live="polite" hidden></div>';
  }
  function bindFrise(root) {
    const box = root.querySelector('.evbox'), ev = friseEv, c = friseC; let cur = null;
    root.querySelectorAll('.fd.ev,.evn').forEach(b => { b.onclick = () => { const d = b.dataset.d; if (cur === d) { cur = null; box.hidden = true; return; } cur = d; box.innerHTML = '<span class="evj">Jour ' + d + '</span>' + evDefs(ev[d], c); box.hidden = false; SFX.play('card'); }; });
  }
  /* le matin : la pile des annonces du jour et leurs noms ; on touche pour lire les définitions */
  const evBtns = st => { const e = dayEv(SIM.CHALLENGES[st.ch], st, st.day); return e.length ? '<button class="evb" aria-label="Annoncé aujourd’hui : ' + e.map(evName).join(', ') + '">' + pile(e) + '<em class="evnm">' + e.map(evName).join(' · ') + '</em></button>' : ''; };
  function openEv(st) { const c = SIM.CHALLENGES[st.ch]; openModal('ev', '<span class="sub">Jour ' + st.day + '</span><h2>Annoncé aujourd’hui</h2><div class="evbox">' + evDefs(dayEv(c, st, st.day), c) + '</div><div class="acts"><span></span><button class="tlink" id="evok" data-snd="1">Fermer</button></div>'); $('#evok').onclick = closeModal; }
  const bindEv = st => bottom.querySelectorAll('.evb').forEach(b => { b.onclick = () => { SFX.play('card'); openEv(st); }; });

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
  const LPER = 5;
  const back = '<button class="pback" data-back="1">' + I.back + 'Retour</button>';
  const PAGES = {
    toc: () => '<button class="pback" data-close="1">' + I.back + 'Fermer le livre</button><h2 class="logo" aria-label="Hameau">Hameau</h2><div class="orn">' + I.leaf + '</div><div class="toc menu">' +
      big('play', 'Jouer', 'Défis, survie, bac à sable', I.village) + big('collection', 'Collection', 'Ce que tu as rencontré : bâtiments, événements, ressources, métiers', I.cards) + big('options', 'Options', 'Son, bulles, progression', I.options) +
      '</div><div class="ham">' + I.hameau + '</div>',
    play: () => back + '<h2>Jouer</h2><div class="toc menu">' +
      big('levels', 'Défis principaux', ORDER.length + ' défis · ' + Object.values(save.stars).reduce((a, b) => a + b, 0) + ' étoiles sur ' + ORDER.length * 3, I.defis) +
      big('survival', 'Survie', kept() ? 'Partie en cours : jour ' + kept().day : save.best4 ? 'Record : ' + jours(save.best4) : 'Tenir le plus de jours possible', I.grave) +
      big('sandbox', 'Bac à sable', 'Bientôt', I.sandbox, true) + '</div>',
    collection: () => { const nb = Object.keys(SIM.BT), ne = Object.keys(EVG); return back + '<h2>Collection</h2><p class="plain">Tout ce que tu as déjà rencontré en jouant.</p><div class="toc menu">' +
      big('cards', 'Bâtiments', nb.filter(t => save.seen[t]).length + ' sur ' + nb.length, I.roof) + big('events', 'Événements', ne.filter(t => save.sev[t]).length + ' sur ' + ne.length, I.storm) +
      big('resources', 'Ressources', 'Ce qui se compte au village', I.food) + big('jobs', 'Métiers', 'Qui fait quoi, et ce qui l’arrête', I.work) + '</div>'; },
    levels: pg => { pg = pg || 0; const per = LPER, N = SIM.LEVELS.length, n = Math.ceil(N / per), from = pg * per, to = Math.min(N, from + per); // cinq niveaux par page ; on tourne les pages dans les deux sens
      const span = (a, b) => a === b ? 'Niveau ' + a : 'Niveaux ' + a + ' à ' + b;
      return back + '<h2>Défis principaux' + (n > 1 ? '<small class="pgn">' + span(from + 1, to) + '</small>' : '') + '</h2>' + (n > 1 ? '<div class="lnav">' + (pg > 0 ? '<button class="tlink prev" data-lpage="' + (pg - 1) + '">‹ ' + span(from - per + 1, from) + '</button>' : '<span></span>') + (pg + 1 < n ? '<button class="tlink more" data-lpage="' + (pg + 1) + '">' + span(to + 1, Math.min(N, to + per)) + ' ›</button>' : '<span></span>') + '</div>' : '') + '<div class="toc">' + SIM.LEVELS.slice(from, to).map((lv, k) => {
        const i = from + k, got = lv.ch.reduce((a, id) => a + (save.stars[id] || 0), 0);
        return '<button class="tl" data-level="' + i + '"><span class="tb"><b>' + lv.name + '</b><em>Niveau ' + (i + 1) + ' · ' + lv.sub + '</em></span><span class="dots"></span><span class="pn">' + I.star + got + '/' + lv.ch.length * 3 + '</span></button>';
      }).join('') + '</div><div class="pfoot">— ' + (pg + 2) + ' —</div>'; },
    level: i => back + '<h2><small>Niveau ' + (i + 1) + '</small>' + SIM.LEVELS[i].name + '</h2><div class="toc">' + SIM.LEVELS[i].ch.map(id => '<button class="tl" data-ch="' + id + '"><b>' + SIM.CHALLENGES[id].title + '</b><span class="dots"></span>' + stars(save.stars[id] || 0) + '</button>').join('') + '</div>',
    fiche: id => {
      const c = SIM.CHALLENGES[id];
      return back + (c.days > 8 || (c.events || []).length > 3 ? '<i class="mk-dense" hidden></i>' : '') + '<h2><small>Niveau ' + (lvlOf(id) + 1) + ' · Défi ' + c.n + '</small>' + c.title + '</h2>' + voiceHtml(c, SIM.cast(window.SEED != null ? window.SEED : seedFor(id), 1)[0].name) + frise(c, 0) +
        '<div class="tabs" role="tablist"><button class="tab" role="tab" aria-selected="true" data-tab="goals">Objectifs</button><button class="tab" role="tab" aria-selected="false" data-tab="cards">Cartes</button></div><div class="tabp" id="tabp">' + goalsHtml(c) + '</div>' +
        '<div class="pact">' + stars(save.stars[id] || 0) + '<button class="tlink" id="bgo" data-snd="1">Commencer</button></div>';
    },
    survival: () => back + '<h2>Survie</h2><p class="voice">« Nous ne savions pas combien de jours. Nous avons compté quand même. »</p>' +
      '<p class="rec">' + ([save.best4 ? 'Record : <b>' + jours(save.best4) + '</b>' : '', kept() ? 'Partie en cours : <b>jour ' + kept().day + '</b>, ' + kept().n + ' villageois.' : ''].filter(Boolean).join('<br>') || 'Aucune partie encore.') + '</p><div class="acts">' + (kept() ? '<button class="tlink quiet" id="bsurv">Nouvelle partie</button><button class="tlink" id="bcont">Reprendre</button>' : '<span></span><button class="tlink" id="bsurv">Commencer</button>') + '</div>',
    sandbox: () => back + '<h2>Bac à sable</h2><p class="voice">Un village sans échéance, pour le seul plaisir de le regarder vivre.</p><p class="note">Bientôt.</p>',
    cards: () => { const inFam = new Set(FAM.flatMap(f => f[1])), rest = Object.keys(SIM.BT).filter(t => !inFam.has(t)), all = Object.keys(SIM.BT);
      return back + '<h2>Bâtiments</h2><p class="plain">' + all.filter(t => save.seen[t]).length + ' rencontrés sur ' + all.length + '. Les autres se découvrent en jouant.</p>' + FAM.concat(rest.length ? [['Et encore', rest]] : []).map(f => '<h3 class="fam">' + f[0] + '</h3>' + galHtml(f[1].filter(t => SIM.BT[t]))).join(''); },
    events: () => back + '<h2>Événements</h2><p class="plain">Ce que le ciel et la forêt peuvent annoncer. Un événement s’ajoute ici quand tu l’as rencontré.</p><div class="evbox reg">' +
      Object.keys(EVG).map(t => save.sev[t] ? evDefs([t === 'arrivals' ? { type: t, villagers: [0, 0], gen: 1 } : { type: t, gen: 1 }], { survival: true }) : LOCK).join('') + '</div>',
    resources: () => back + '<h2>Ressources</h2><div class="evbox reg">' + RESD.map(r => regRow(r[0], r[1], r[2])).join('') + '</div>',
    jobs: () => { const by = {}; for (const t in SIM.BT) { const d = SIM.BT[t]; if (d.job && d.posts) (by[d.job] = by[d.job] || []).push(t); }
      return back + '<h2>Métiers</h2><p class="plain">Un métier s’ajoute ici quand tu as rencontré son bâtiment. Dans les défis, chacun garde son poste ; en survie, tu peux choisir.</p><div class="evbox reg">' + regRow(I.none, 'Sans poste', 'Ramasse 1 bois mort par jour, sauf dans la brume. Prend le premier poste qui se libère.') +
        Object.keys(by).map(j => { const ts = by[j].filter(t => save.seen[t]); if (!ts.length) return LOCK; const n = SIM.JOBNAME[j], cap = x => x[0].toUpperCase() + x.slice(1);
          return regRow(I[j] || I.work, cap(n.m) + (n.f !== n.m ? ' · ' + n.f : ''), ts.map(t => { const d = SIM.BT[t], st = [d.storm && 'l’orage', d.fog && 'la brume', d.frost && 'le gel', d.dryStop && 'la sécheresse'].filter(Boolean);
            return cap(d.name.toLowerCase()) + ' : ' + (d.conv ? 'change ' + SIM.RATIO + ' ' + RESN[d.conv.from].toLowerCase() + ' en 1 ' + RESN[d.conv.to].toLowerCase() + ', ' + d.conv.cap + ' ' + RESN[d.conv.from].toLowerCase() + ' par jour au plus' : d.expert ? 'tant qu’il est à son poste, 1 ' + RESN[CONVOF[d.expert]].toLowerCase() + ' suffit pour 1 ' + RESN[d.expert].toLowerCase() : d.medic ? 'tant qu’il est à son poste, personne ne meurt de maladie et elle ne se transmet plus' : d.out ? d.per + ' ' + RESN[d.out].toLowerCase() + ' par jour et par personne' : d.play ? 'de la joie chaque soir' : 'un poste') + (d.posts > 1 ? ', ' + d.posts + ' postes' : '') + '.' + (st.length ? ' Arrêté par ' + names(st) + '.' : ''); }).join(' ')); }).join('') + '</div>'; },
    options: () => back + '<h2>Options</h2><div class="h3">Son</div>' + volsHtml() +
      '<div class="h3">Bulles des villageois</div><div class="segs">' + BUBS.map(b => '<button class="seg" data-bub="' + b[0] + '" aria-pressed="' + (save.bub === b[0]) + '">' + b[1] + '</button>').join('') + '</div>' +
      '<div class="h3">Progression</div><p class="note">' + Object.values(save.stars).reduce((a, b) => a + b, 0) + ' étoiles sur ' + ORDER.length * 3 + '</p><div class="pfoot">Prototype 0.35</div>'
  };
  function bindPage(name, arg) {
    paint(pageEl);
    pageEl.querySelectorAll('[data-back]').forEach(b => b.onclick = goBack); pageEl.querySelectorAll('[data-close]').forEach(b => b.onclick = closeBook); { const bs = pageEl.querySelector('#bsurv'), bc = pageEl.querySelector('#bcont'); if (bs) twice(bs, 'Effacer la partie en cours ?', () => startChallenge('survie')); if (bc) bc.onclick = () => startChallenge('survie', kept()); }
    pageEl.querySelectorAll('[data-go]').forEach(b => b.onclick = () => go(b.dataset.go));
    pageEl.querySelectorAll('[data-level]').forEach(b => b.onclick = () => go('level', +b.dataset.level));
    pageEl.querySelectorAll('[data-lpage]').forEach(b => b.onclick = () => goPage(+b.dataset.lpage));
    pageEl.querySelectorAll('[data-ch]').forEach(b => b.onclick = () => go('fiche', b.dataset.ch));
    if (name === 'fiche') {
      const c = SIM.CHALLENGES[arg], tp = $('#tabp'); bindFrise(pageEl);
      pageEl.querySelectorAll('.tab').forEach(t => t.onclick = () => {
        pageEl.querySelectorAll('.tab').forEach(o => o.setAttribute('aria-selected', o === t));
        tp.innerHTML = t.dataset.tab === 'cards' ? deckHtml(c.deck, 'deck') : goalsHtml(c); paint(tp);
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
  /* Tourner une page : la feuille ne pivote pas comme une planche, elle se plie. Un pli part du coin d'en bas à droite,
     file vers la reliure en se redressant ; à sa gauche le recto encore à plat, par-dessus le verso rabattu (le même
     papier, en miroir sur le pli), dessous la page suivante avec l'ombre de la feuille. Tout est géométrie plane :
     trois découpes et une symétrie par image, rien à recopier. `dir` < 0 : le même film à l'envers. */
  const FLIP = { out: 820, back: 760, tilt: 0.36 };
  function turn(dir, e) {
    SFX.play('page'); const id = ++turning, calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (calm) return render(e);
    const leaf = document.createElement('div'), flap = document.createElement('div'), back = document.createElement('i'), shade = document.createElement('div'), keep = pageEl.scrollTop;
    leaf.className = 'pleaf flip'; flap.className = 'pflap'; shade.className = 'pshade'; flap.appendChild(back);
    if (dir > 0) { leaf.innerHTML = pageEl.innerHTML; paint(leaf); book.appendChild(leaf); leaf.scrollTop = keep; render(e); }
    else { leaf.innerHTML = PAGES[e[0]](e[1]); paint(leaf); book.appendChild(leaf); }
    book.appendChild(shade); book.appendChild(flap);
    const W = leaf.offsetWidth, H = leaf.offsetHeight, R = [[0, 0], [W, 0], [W, H], [0, H]], dur = (dir > 0 ? FLIP.out : FLIP.back) * (window.HQ_SLOW || 1), t0 = performance.now(); let done = false;
    /* le rectangle de la page coupé par la droite X·n = s : le côté demandé, en polygone CSS */
    const cut = (nx, ny, s, far) => { const o = []; for (let k = 0; k < 4; k++) { const a = R[k], b = R[(k + 1) % 4], da = a[0] * nx + a[1] * ny - s, db = b[0] * nx + b[1] * ny - s, ia = far ? da >= 0 : da <= 0, ib = far ? db >= 0 : db <= 0;
      if (ia) o.push(a); if (ia !== ib) { const u = da / (da - db); o.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]); } }
      return o.length > 2 ? 'polygon(' + o.map(q => q[0].toFixed(1) + 'px ' + q[1].toFixed(1) + 'px').join(',') + ')' : 'polygon(0 0,0 0,0 0)'; };
    const end = () => { if (done) return; done = true; if (dir < 0 && id === turning) render(e); leaf.remove(); flap.remove(); shade.remove(); };
    const frame = now => {
      if (done) return; const u = Math.min(1, (now - t0) / dur), q = dir > 0 ? u : 1 - u;
      /* p : où en est le pli (0 : au coin, 1 : à la reliure) ; il part doucement, file, et se pose */
      const p = q * q * q * (q * (6 * q - 15) + 10), a = FLIP.tilt * Math.pow(1 - p, 1.25), nx = Math.cos(a), ny = Math.sin(a);
      const s = (1 - p) * (W * nx + H * ny), lift = Math.sin(Math.PI * Math.min(1, p * 1.08));
      leaf.style.clipPath = leaf.style.webkitClipPath = cut(nx, ny, s, false);
      const far = cut(nx, ny, s, true); back.style.clipPath = back.style.webkitClipPath = far; shade.style.clipPath = shade.style.webkitClipPath = far;
      /* le verso : la partie pliée, renvoyée de l'autre côté du pli (symétrie d'axe la droite du pli) */
      const dx = ny, dy = -nx, m0 = 2 * dx * dx - 1, m1 = 2 * dx * dy, m3 = 2 * dy * dy - 1, px = nx * s, py = ny * s;
      back.style.transform = 'matrix(' + m0 + ',' + m1 + ',' + m1 + ',' + m3 + ',' + (px - (m0 * px + m1 * py)) + ',' + (py - (m1 * px + m3 * py)) + ')';
      /* les dégradés suivent le pli : l'angle CSS de n, et le point de départ ramené sur le pli */
      const th = Math.atan2(nx, -ny), L = Math.abs(W * Math.sin(th)) + Math.abs(H * Math.cos(th)), g0 = s - (W / 2 * nx + H / 2 * ny) + L / 2, deg = (th * 180 / Math.PI).toFixed(2) + 'deg', wd = Math.max(24, (W * nx + H * ny) - s), at = d => (g0 + d).toFixed(1) + 'px';
      /* une fois posée à gauche, la feuille prend l'ombre de la reliure : exactement celle de la page de gauche, qu'elle devient */
      const rest = Math.pow(p, 6);
      back.style.backgroundImage = 'linear-gradient(' + deg + ',rgba(40,24,8,' + (0.42 * rest).toFixed(3) + ') ' + at(0) + ',rgba(40,24,8,' + (0.14 * rest).toFixed(3) + ') ' + at(9) + ',rgba(40,24,8,0) ' + at(26) + '),linear-gradient(' + deg + ',rgba(52,34,14,' + (0.30 * lift).toFixed(3) + ') ' + at(0) + ',rgba(255,252,240,' + (0.5 * lift).toFixed(3) + ') ' + at(Math.min(26, wd * 0.22)) + ',rgba(255,252,240,0) ' + at(wd * 0.5) + ',rgba(52,34,14,' + (0.16 * lift).toFixed(3) + ') ' + at(wd) + ')';
      shade.style.backgroundImage = 'linear-gradient(' + deg + ',rgba(24,14,4,' + (0.46 * lift).toFixed(3) + ') ' + at(0) + ',rgba(24,14,4,' + (0.16 * lift).toFixed(3) + ') ' + at(22 + 26 * lift) + ',rgba(24,14,4,0) ' + at(70 + 60 * lift) + ')';
      flap.style.filter = 'drop-shadow(' + (-(5 + 9 * lift)).toFixed(1) + 'px ' + (3 * lift).toFixed(1) + 'px ' + (5 + 13 * lift).toFixed(1) + 'px rgba(20,12,4,' + (0.46 * lift).toFixed(3) + '))';
      if (u < 1) requestAnimationFrame(frame); else end();
    };
    frame(t0); setTimeout(end, dur + 400);
  }
  function go(name, arg) { const e = [name, arg]; trail.push(e); turn(1, e); }
  /* tourner les pages des niveaux ne s'empile pas : « Retour » quitte la liste d'un coup, quelle que soit la page */
  function goPage(k) { const cur = trail[trail.length - 1], e = ['levels', k]; if (!cur || cur[0] !== 'levels') return go('levels', k); const dir = k > (cur[1] || 0) ? 1 : -1; trail[trail.length - 1] = e; turn(dir, e); }
  function goBack() {
    if (trail.length < 2) return; trail.pop(); const e = trail[trail.length - 1];
    if (e[0] === 'title') { book.hidden = true; return showTitle(); }
    turn(-1, e);
  }
  function openBook(tr) { trail = tr; closeModal(); closeInspect(); endCoach(); hud.hidden = true; bottom.hidden = true; titleEl.hidden = true; book.hidden = false; render(trail[trail.length - 1]); if (GAME.phase !== 'menu') { GAME.attract(); R.setView('day'); } }
  const trailTo = id => [['toc'], ['play'], ['levels', Math.floor(lvlOf(id) / LPER)], ['level', lvlOf(id)]];

  function closeModal() { modal.hidden = true; modal.innerHTML = ''; modalKind = null; }
  function openModal(kind, html) { modalKind = kind; modal.innerHTML = '<div class="sheet" role="dialog" aria-modal="true">' + html + '</div>'; modal.hidden = false; }
  function startChallenge(id, again) {
    const c = SIM.CHALLENGES[id];
    chId = id; closeModal(); book.hidden = true; titleEl.hidden = true; hud.hidden = false; bottom.hidden = false; cache.clear(); seen = {};
    tuto = !!c.tutorial && !save.tuto[id];
    usesStone = !!c.stone || c.deck.some(t => SIM.BT[t].cost.stone || SIM.BT[t].out === 'stone');
    /* les ressources de la manufacture ne s'affichent que dans les défis qui s'en servent */
    xres = XRES.filter(k => c[k] || c.deck.some(t => { const d = SIM.BT[t]; return d.cost[k] || d.out === k || (d.give && d.give[k]) || (d.conv && (d.conv.to === k || d.conv.from === k)); }));
    const cell = r => '<span class="r" id="' + r[1] + '" title="' + r[2] + '" role="img" aria-label="' + r[2] + '">' + I[r[0]] + '<b>0</b></span>';
    $('#res').innerHTML = '<span class="rrow">' + [['food', 'rFood', 'Nourriture'], ['wood', 'rWood', 'Bois'], usesStone && ['stone', 'rStone', 'Pierre'], c.joy && ['joy', 'rJoy', 'Bonheur'], ['roof', 'rRoof', 'Places pour dormir']].filter(Boolean).map(cell).join('') + '</span>' + (xres.length ? '<span class="rrow x">' + xres.map(k => cell([k, 'rx-' + k, RESN[k]])).join('') + '</span>' : '');
    $('#res').classList.toggle('four', (usesStone ? 1 : 0) + (c.joy ? 1 : 0) > 0); $('#res').classList.toggle('wide', xres.length > 0); vbtn = []; $('#vbar').innerHTML = ''; const sd = nextSeed[id]; delete nextSeed[id];
    if (c.survival && !again) { delete save.surv; persist(); } // une nouvelle survie remplace la partie gardée
    if (again) { try { GAME.resume(again); return; } catch (e) { delete save.surv; persist(); } } // sauvegarde illisible : on repart de zéro
    GAME.start(id, sd);
  }
  const jours = n => n + ' jour' + (n > 1 ? 's' : '');
  const kept = () => save.surv && save.surv.v === 1 && save.surv.st ? save.surv : null;
  /* un bouton qui efface une partie demande d'être touché deux fois */
  const twice = (b, ask, go) => { let armed = false; b.onclick = () => { if (armed || !kept()) return go(); armed = true; b.textContent = ask; b.classList.add('warn'); setTimeout(() => { if (b.isConnected && armed) { armed = false; b.textContent = b.dataset.lab; b.classList.remove('warn'); } }, 4000); }; b.dataset.lab = b.textContent; };
  function buildHud(villagers) {
    const vb = $('#vbar'); vb.classList.toggle('many', villagers.length > 7); vb.classList.toggle('crowd', villagers.length > 8); vb.classList.toggle('throng', villagers.length > 20);
    villagers.forEach((v, i) => {
      if (vbtn[i]) { vbtn[i].b.classList.toggle('kid', !!v.child); vbtn[i].b.setAttribute('aria-label', v.name + (v.child ? ', enfant' : '')); return; } // un enfant devenu adulte retrouve un portrait d'adulte
      const b = document.createElement('button'); b.className = 'vb' + (v.child ? ' kid' : ''); b.dataset.snd = '1'; b.setAttribute('aria-label', v.name + (v.child ? ', enfant' : '')); b.innerHTML = '<canvas aria-hidden="true"></canvas><span class="vn">' + v.name + '</span><span class="bad"></span>';
      b.onclick = () => { SFX.play('voice', 0, i); showVillager(i); }; vb.appendChild(b); vbtn.push({ b, cv: b.querySelector('canvas'), bad: b.querySelector('.bad') });
    });
  }
  function dayTitle(st) {
    const e = $('#daytitle'), ev = dayEv(SIM.CHALLENGES[st.ch], st, st.day).map(evName).join(' · ');
    e.innerHTML = '<b>Jour ' + st.day + '</b><span>' + (ev || (st.day === st.days ? 'le dernier' : '')) + '</span>'; e.hidden = true; void e.offsetWidth; e.hidden = false; e.onanimationend = () => { e.hidden = true; };
  }

  /* ---------- matin : les cartes du jour ---------- */
  const planY = () => Math.max(GAME.map.fire.y + 90, ...GAME.st.buildings.map(b => b.y + b.h + 22));
  function renderMorning() {
    const st = GAME.st, n = GAME.cards.length; selCard = null; closeInspect(); buildHud(st.villagers);
    { let nu = false; const mark = (o, k) => { if (!o[k]) { o[k] = 1; nu = true; } }; st.buildings.forEach(b => mark(save.seen, b.type)); GAME.cards.forEach(t => mark(save.seen, t)); dayEv(SIM.CHALLENGES[st.ch], st, st.day).forEach(e => mark(save.sev, e.type)); if (nu) persist(); }
    /* parti de rien : le premier matin, il n'y a rien à bâtir — la journée commence d'elle-même */
    const surv = !!SIM.CHALLENGES[chId].survival, jb = surv ? '<button class="tlink jb" id="bjobs" data-snd="1">Métiers</button>' : '';
    if (!n && surv) { bottom.innerHTML = '<div class="mhead"><h2>Jour ' + st.day + '</h2>' + evBtns(st) + jb + '</div><div class="mfoot"><span class="hint" id="mhint" style="text-align:left">Plus de place pour bâtir.</span><button class="tlink" id="bskip" data-snd="1">Commencer</button></div>'; R.setView('day'); bindEv(st); $('#bjobs').onclick = () => openJobs(); $('#bskip').onclick = () => GAME.choose(null); return; }
    if (!n) { bottom.innerHTML = '<div class="mhead"><h2>Jour ' + st.day + '</h2>' + evBtns(st) + '<em>Plus de place pour bâtir : la journée commence.</em></div>'; R.setView('day'); bindEv(st); setTimeout(() => { if (GAME.phase === 'morning' && GAME.st === st) GAME.choose(null); }, 2300); return; }
    { const c0 = SIM.CHALLENGES[chId]; if (st.day === 1 && !c0.food && !c0.wood && !c0.stone && GAME.cards.every(t => SIM.blocked(st, t))) {
      bottom.innerHTML = '<div class="mhead"><h2>Jour 1</h2><em>Les mains vides : ce matin, on ne bâtit rien.</em></div>'; R.setView('day');
      setTimeout(() => { if (GAME.phase === 'morning' && GAME.st === st) GAME.choose(null); }, 2100); return; } }
    /* le matin où le village devient un bourg : la place et les routes changent, le clairon sonne, et on le dit en toutes lettres */
    const newTown = SIM.maxBuilds(st) > 1 && st.town === st.day;
    if (newTown && seen.town !== st.day) { seen.town = st.day; R.setRoads(st); if (st.day > 1) setTimeout(() => SFX.play('clarion'), 500); }
    let h = '<div class="mhead"><h2>Jour ' + st.day + '</h2>' + evBtns(st) + (surv ? jb : evBtns(st) ? '' : SIM.maxBuilds(st) > 1 ? '' : '<em>Que bâtir aujourd’hui ?</em>') + '</div>' + (SIM.maxBuilds(st) > 1 ? '<div class="two' + (newTown ? ' first' : '') + '" role="status">' + I.build2 + '<span>' + (newTown ? 'Tu peux construire 2 bâtiments maintenant !' : '2 bâtiments par jour') + '</span></div>' : '') + '<div class="fan">';
    GAME.cards.forEach((type, i) => {
      const d = SIM.BT[type], bk = SIM.blocked(st, type), cst = SIM.costOf(st, type), tag = bk === 'cost' ? LACK[SIM.RES.find(r => st[r] < (cst[r] || 0))] : bk === 'room' ? 'Plus de place' : '', o = i - (n - 1) / 2;
      const cost = Object.keys(cst).map(k => '<span class="cc' + (cst[k] < d.cost[k] ? ' less' : '') + '" aria-label="' + cst[k] + ' ' + RESN[k].toLowerCase() + '">' + I[k] + cst[k] + '</span>').join('');
      h += '<button class="card' + (bk ? ' off' : '') + '" style="--r:' + o * 5 + 'deg;--y:' + Math.abs(o) * 8 + 'px;--d:' + (0.15 + i * 0.1) + 's" data-type="' + type + '" data-snd="1" aria-pressed="false"><canvas data-t="' + type + '" aria-hidden="true"></canvas><span class="costs">' + cost + '</span><span class="cn">' + d.name + '</span>' + effect(type) + (tag ? '<span class="tag">' + tag + '</span>' : '') + '</button>';
    });
    h += '</div><div class="mfoot"><button class="tlink quiet" id="bskip">Ne rien bâtir</button><span class="hint" id="mhint"></span><button class="tlink" id="bbuild" data-snd="1" hidden>Bâtir</button></div>';
    bottom.innerHTML = h; paint(bottom);
    /* un village bâtit une carte par jour ; un bourg (dix habitants) peut en bâtir deux */
    const two = SIM.maxBuilds(st) > 1, fan = bottom.querySelector('.fan'); let picks = [];
    const show = () => { bottom.querySelectorAll('.card').forEach(o => { const on = picks.includes(o.dataset.type); o.classList.toggle('sel', on); o.setAttribute('aria-pressed', on); }); fan.classList.toggle('has-sel', picks.length > 0); selCard = picks.length > 1 ? picks.slice() : picks[0] || null; $('#bbuild').hidden = !picks.length; $('#bbuild').textContent = picks.length > 1 ? 'Bâtir les deux' : 'Bâtir'; };
    const clear = () => { picks = []; show(); };
    const say = t => { const e = $('#mhint'); e.textContent = t; e.hidden = false; }, hint = t => { clear(); say(t); };
    bindEv(st);
    bottom.querySelectorAll('.card').forEach(cd => {
      cd.onclick = () => {
        if (cd.classList.contains('off')) { SFX.play('back'); return hint(cd.querySelector('.tag').textContent + '.'); }
        const ty = cd.dataset.type;
        if (picks.includes(ty)) { picks = picks.filter(x => x !== ty); show(); if (two && picks.length) say('Choisis-en un second, ou bâtis celui-ci.'); return; }
        if (two && picks.length === 1 && !SIM.affordBoth(st, picks[0], ty)) { SFX.play('back'); return say('Pas de quoi bâtir les deux. Touche la carte choisie pour la retirer.'); }
        SFX.play('card'); if (!two) picks = []; else if (picks.length > 1) picks.shift(); picks.push(ty); show();
        if (two && picks.length === 1) say('Choisis-en un second, ou bâtis celui-ci.'); else $('#mhint').hidden = true;
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
      '<div class="speed" role="group" aria-label="Vitesse du temps"><button id="sp0" aria-label="Pause">' + I.pause + '</button><button id="sp1" aria-label="Vitesse normale">' + I.sp1 + '</button><button id="sp2" aria-label="Vitesse double">' + I.sp2 + '</button><button id="sp4" aria-label="Vitesse quadruple">' + I.sp4 + '</button><button id="spn" aria-label="Passer à la phase suivante" title="Passer à la phase suivante">' + I.skip + '</button></div></div>' +
      '<div class="track" role="img" aria-label="Déroulement de la journée"><div class="tg"></div>' + J.map((j, i) => '<i class="jal" style="left:' + SEG[i][1] + '%"></i><span class="jl" data-j="' + i + '" style="left:' + SEG[i][1] + '%;width:' + (SEG[i + 1][1] - SEG[i][1]) + '%" title="' + j[1] + '">' + I[JI[i]] + '<em>' + j[1] + '</em></span>').join('') + '<i class="jal" style="left:100%"></i><i id="fmk">' + I.sun + I.moon + '</i></div>' +
      '<div class="msg" id="msg" aria-live="polite"></div></div>';
    $('#sp0').onclick = () => { GAME.paused = !GAME.paused; syncSpeed(); };
    [1, 2, 4].forEach(s => { $('#sp' + s).onclick = () => { GAME.speed = s; GAME.paused = false; syncSpeed(); }; });
    $('#spn').onclick = () => { GAME.skip(); syncSpeed(); };
    bindEv(st);
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
    let h = '<span class="sub">Soir du jour ' + p.sum.day + '</span><h2>' + (p.sum.deaths.length ? 'Le village est en deuil' : !noFood && !noRoof ? (p.end.lost && p.end.lost.length ? 'Des bâtisses en moins' : 'Une journée douce') : noFood && noRoof ? 'Une soirée difficile' : noFood ? 'Des ventres vides' : 'Une nuit dehors') + '</h2><div class="vgrid' + (Object.keys(p.sum.v).length > 12 ? ' dense' : '') + '">';
    S.villagers.forEach(v => {
      const r = p.sum.v[v.id]; if (!r) return;
      h += '<div class="vcell' + (!r.ate || !r.roof ? ' bad' : '') + '"><canvas data-v="' + v.id + '" aria-hidden="true"></canvas><b>' + v.name + '</b><div class="ck"><span class="' + (r.ate ? 'yes' : '') + '" role="img" aria-label="' + (r.ate ? 'A mangé' : 'N’a pas mangé') + '">' + (r.ate ? I.food : I.faim) + '</span><span class="' + (r.roof ? 'yes' : '') + '" role="img" aria-label="' + (r.roof ? 'A dormi sous un toit' : 'A dormi dehors') + '">' + (r.roof ? I.roof : I.dehors) + '</span></div></div>';
    });
    h += '</div><div class="delta">' + ['food', 'wood'].concat(usesStone ? ['stone'] : [], SIM.CHALLENGES[chId].joy ? ['joy'] : [], xres).map(k => '<span>' + I[k] + S[k] + ' <i>→</i> ' + E[k] + '</span>').join('') + '</div>';
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
      SFX.play(rec ? 'star' : 'fail'); $('#eagain').onclick = () => startChallenge('survie'); $('#elist').onclick = () => openBook([['toc'], ['play'], ['survival']]); return;
    }
    if ((save.stars[chId] || 0) < r.stars) save.stars[chId] = r.stars;
    if (c.tutorial) save.tuto[chId] = true; persist(); tuto = false;
    const goNext = r.stars > 0 && nextId;
    openModal('end', '<div class="center"><span class="sub">' + c.title + '</span></div>' + stars(r.stars, true) + '<p class="voice center">' + (c.endMsg || ['Le village s’est tu.', 'Tous en vie, pas sans peine.', 'Personne n’a manqué de rien.', 'Rien n’a manqué, et la réserve est pleine.'])[r.stars] + '</p>' + goalsHtml(c, r.ok) +
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
  /* le carnet se pose au-dessus des cartes ; il ne dépasse jamais l'écran : s'il n'a pas la place, il recouvre les cartes, et son contenu défile sous sa croix */
  function placeInsp() {
    const H = app.clientHeight, top = 8; let bot = bottom.hidden ? 12 : bottom.offsetHeight - 22;
    insp.style.maxHeight = 'none'; if (H - bot - top < Math.min(insp.offsetHeight, 330)) bot = 12;
    insp.style.bottom = bot + 'px'; insp.style.maxHeight = Math.max(120, H - bot - top) + 'px';
  }
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
    const cur = G.plan ? G.plan.end : st, nbs = (G.plan && G.plan.nbs) || [];
    const cap = cur.buildings.reduce((a, b) => a + (nbs.some(nb => nb.id === b.id && t < nb.t1) ? 0 : (SIM.BT[b.type].beds || 0)), 0);
    const bump = id => { const e = $(id); e.classList.remove('bump'); void e.offsetWidth; e.classList.add('bump'); };
    if (set($('#rFood b'), 'food', String(L.food))) bump('#rFood');
    if (set($('#rWood b'), 'wood', String(L.wood))) bump('#rWood');
    if (usesStone && set($('#rStone b'), 'stone', String(L.stone))) bump('#rStone');
    if ($('#rJoy') && set($('#rJoy b'), 'joy', String(L.joy))) bump('#rJoy');
    for (const k of xres) if (set($('#rx-' + k + ' b'), k, String(L[k] || 0))) bump('#rx-' + k);
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
      const v = st.villagers[inspect.v], s = G.last[inspect.v], job = L.jobs[v.id], jn = v.child ? 'enfant' + (v.school ? ' · ' + v.school + (v.school > 1 ? ' jours' : ' jour') + ' d’école' : '') : SIM.JOBNAME[job || 'none'][v.sex], hu = L.hunger[v.id], rf = L.roofless[v.id], home = (G.plan && G.t >= 9.05 ? G.plan.end : st).villagers[v.id].home != null;
      const M = G.mind, log = (M && M.log[v.id]) || [], cl = M ? MIND.close(M, st, v.id) : [], ch = MIND.CHARN[MIND.charOf(v)][v.sex === 'f' ? 1 : 0];
      set(null, 'insp', v.id + '|' + job + '|' + (s ? s.label : '') + '|' + hu + '|' + rf + '|' + home + '|' + log.length + '|' + cl.map(c => c.id + (c.love ? 'L' : '')).join(','), () => {
        portrait(insp.querySelector('canvas'), v, job || 'civil');
        $('#il1').innerHTML = (I[job || 'none'] || I.work) + '<span>' + esc(jn.charAt(0).toUpperCase() + jn.slice(1) + ', ' + ch + (s && s.label ? ' · ' + s.label : '')) + '</span>';
        $('#ineeds').innerHTML = '<span class="need' + (hu ? ' no' : '') + '">' + (hu ? I.faim : I.food) + (hu ? 'N’a pas mangé hier' : 'Nourri' + (v.sex === 'f' ? 'e' : '')) + '</span><span class="need' + (rf ? ' no' : '') + '">' + (rf ? I.dehors : I.roof) + (rf ? 'A dormi dehors' : home ? 'A sa maison' : 'A dormi au chaud') + '</span>';
        const today = log.filter(l => l.day === Math.min(st.day, st.days)), hope = today.filter(l => POSI[l.tone]).pop(), fear = today.filter(l => !POSI[l.tone]).pop();
        $('#icar').innerHTML = '<div class="hf"><div><h4>' + I.espoir + 'J’espère</h4><p>' + (hope ? esc(hope.text) : '—') + '</p></div><div><h4>' + I.crainte + 'Je crains</h4><p>' + (fear ? esc(fear.text) : '—') + '</p></div></div>' +
          (log.length ? '<h4>' + I.soi + 'Mon carnet</h4><ul class="cl">' + log.slice(-3).reverse().map(l => '<li>' + (I[l.tone] || '') + '<i>Jour ' + l.day + ', ' + l.moment + '</i>' + esc(l.text) + '</li>').join('') + '</ul>' : '') +
          (cl.length ? '<p class="pr"><span>Mes proches</span>' + cl.map(c => (c.love ? I.heart : I.amitie) + c.name).join(' · ') + '</p>' : '');
        placeInsp();
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
  function resize() { if (!insp.hidden) setTimeout(placeInsp, 0); R.resize(app.clientWidth, app.clientHeight, Math.min(qCap, window.devicePixelRatio || 1), 122 + safeTop(), 122); if (GAME.phase === 'morning') R.setView('plan', bottom.offsetHeight - 26, planY()); if (inspect) placeInsp(); if (coach) drawCoach(); }
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
