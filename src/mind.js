'use strict';
/* ===== Hameau — ce que les villageois pensent, espèrent et craignent =====
   Chaque pensée naît d'un fait de la simulation : ils ne disent que des choses vraies. */
const MIND = (() => {
  /* cinq caractères ; ils ne changent aucune règle, seulement les mots */
  const CHAR = { Anne: 'confiant', Marc: 'bougon', Clara: 'genereux', Bastien: 'taiseux', Rose: 'inquiet', Hugo: 'confiant', Odile: 'genereux', 'Gérard': 'bougon' };
  const CHARN = { confiant: ['confiant', 'confiante'], inquiet: ['inquiet', 'inquiète'], taiseux: ['taiseux', 'taiseuse'], genereux: ['généreux', 'généreuse'], bougon: ['bougon', 'bougonne'] };
  const charOf = v => v.char || CHAR[v.name] || ['confiant', 'inquiet', 'taiseux', 'genereux', 'bougon'][v.id % 5];
  const L = (subj, tone, c, i, t, g, b) => ({ subj, tone, lines: { confiant: c, inquiet: i, taiseux: t, genereux: g, bougon: b } });
  /* {o} : le prénom de l'autre ; {M} : le métier. Aucun accord avec celui ou celle qui parle. */
  const PH = {
    debut: L('village', 'espoir', ['Une clairière, un feu. C’est un beau début.'], ['Tout est à faire. Y arriverons-nous ?'], ['On y est.'], ['Tant qu’on reste ensemble, tout ira.'], ['Pas un toit de trop, à ce que je vois.']),
    faim_soir: L('food', 'crainte', ['On trouvera bien de quoi, d’ici ce soir.', 'La réserve est basse. On s’en sortira.'], ['Il n’y en aura pas pour tous, ce soir.', 'La réserve fond. Qui restera sans rien ?'], ['Réserve basse.'], ['S’il manque une part, ce sera la mienne.'], ['Compter les miettes, voilà où on en est.']),
    faim_loin: L('food', 'crainte', [''], ['La réserve ne tiendra pas deux jours.'], [''], [''], ['']),
    faim_hier: L('food', 'crainte', ['Ce soir, je mange. Il le faut.'], ['Encore un soir sans manger, et c’est fini.'], ['Faim.'], ['J’ai faim, mais d’autres aussi.'], ['Le ventre vide, et il faudrait sourire.']),
    dehors_hier: L('roof', 'peine', ['Une nuit dehors. La prochaine sera meilleure.'], ['Une autre nuit dehors, et je n’y survivrai pas.'], ['Froid, cette nuit.'], ['J’ai eu froid. Pourvu que personne d’autre.'], ['La rosée pour drap. Merci bien.']),
    bois_zero: L('wood', 'crainte', ['Plus de bois ? On en ramassera.'], ['Plus une planche. On ne bâtira rien demain.'], ['Plus de bois.'], ['J’irai chercher du bois mort pour tous.'], ['Pas une bûche. Bravo.']),
    orage_demain: L('storm', 'crainte', ['L’orage passera, comme les autres.'], ['Le ciel se charge. Demain, la rivière montera.'], ['Orage demain.'], ['Demain l’orage. Restons près les uns des autres.'], ['Demain la pluie. Il ne manquait plus que ça.']),
    orage_jour: L('storm', 'crainte', ['Ce n’est que de l’eau.'], ['La rivière gronde. Personne ne passera.'], ['Ça tombe.'], ['Que personne ne s’approche de l’eau.'], ['De l’eau jusque dans les bottes.']),
    gel_demain: L('frost', 'crainte', ['Le gel ? On a vu pire.'], ['Le gel arrive. Que restera-t-il à cueillir ?'], ['Gel demain.'], ['Il faudra du pain pour tout le monde.'], ['Le gel, maintenant. Évidemment.']),
    gel_jour: L('frost', 'crainte', ['L’air pique, le feu réchauffe.'], ['Tout est blanc. Plus rien ne pousse.'], ['Ça gèle.'], ['Venez près du feu, tous.'], ['Mes doigts ne répondent plus.']),
    venus_ok: L('ppl', 'espoir', ['Des voyageurs demain ! Le village grandit.'], ['Des voyageurs demain. Aura-t-on assez ?'], ['Du monde, demain.'], ['Des voyageurs demain. On leur fera une place.'], ['Encore des bouches à nourrir.']),
    venus_ko: L('ppl', 'crainte', ['Des voyageurs demain. On se serrera, voilà tout.'], ['Encore du monde. Où dormiront-ils ?'], ['Pas de place pour eux.'], ['Je leur laisserai mon lit, s’il le faut.'], ['Pas assez pour nous, et on en attend d’autres.']),
    arrive: L('village', 'espoir', ['Un feu, des visages. Nous voilà arrivés.'], ['Voudront-ils de nous, ici ?'], ['Arrivés.'], ['Je n’apporte rien, que mes deux mains.'], ['Trois jours de marche pour une clairière.']),
    accueil: L('ppl', 'content', ['Bienvenue ! Il y a du feu pour tous.'], ['Les voilà. Pourvu qu’on ait assez.'], ['Bienvenue.'], ['Asseyez-vous, vous devez avoir faim.'], ['Qu’ils essuient leurs pieds, au moins.']),
    chantier_toit: L('roof', 'espoir', ['Ce toit-là sera le mien, je le sens.'], ['Ce toit sera-t-il pour moi ?'], ['Un toit. Bien.'], ['Un toit de plus. Au plus fatigué de le prendre.'], ['Un toit. Il était temps.']),
    chantier: L('work', 'espoir', ['Ça prend forme. On avance !'], ['Pourvu que ça suffise.'], ['On bâtit.'], ['Chaque planche est pour tous.'], ['Encore des planches à porter.']),
    metier: L('work', 'content', ['{M}. Ça me va très bien.'], ['{M}… Saurai-je faire ?'], ['{M}. Bon.'], ['{M}. Tant mieux si ça sert.'], ['{M}. On ne m’a pas demandé mon avis.']),
    oisif: L('work', 'peine', ['Du bois mort, c’est déjà ça.', 'Pas de poste ? Je me rends utile.'], ['Je ne sers à rien, sans poste.'], ['Rien à faire.'], ['Je ramasse du bois, pour le feu de tous.'], ['Ramasser des branches. Quelle carrière.']),
    pont_coupe: L('storm', 'peine', ['Rien à rapporter aujourd’hui. Demain, double !'], ['Le pont est sous l’eau. Rien à rapporter.'], ['Pont coupé.'], ['Rien à rapporter. Je m’en veux.'], ['Une journée perdue à regarder la pluie.']),
    gel_perdu: L('frost', 'peine', ['Rien ne pousse. Le printemps reviendra.'], ['Tout a gelé. Rien à rapporter.'], ['Tout gelé.'], ['Les mains vides. Je m’en veux.'], ['Gratter la glace. Belle occupation.']),
    repas_enfin: L('food', 'content', ['Je savais bien qu’on mangerait.'], ['Du pain. Enfin.'], ['Mangé.'], ['Mangez, mangez, il y en a.'], ['Pas trop tôt.']),
    rien_mange: L('food', 'peine', ['Demain, il y aura à manger.'], ['Rien. Encore rien.'], ['Rien ce soir.'], ['Que les autres mangent d’abord.'], ['Le ventre vide. Belle journée.']),
    ami_faim: L('ppl', 'crainte', ['{o} mangera demain, j’y veillerai.'], ['{o} n’a rien mangé. Ça me serre le cœur.'], ['{o} a faim.'], ['J’aurais dû donner ma part à {o}.'], ['{o} le ventre vide. Ça ne va pas.']),
    pas_de_lit: L('roof', 'peine', ['Les étoiles pour plafond. Ça ira.'], ['Pas de lit pour moi, ce soir.'], ['Dehors, donc.'], ['Qu’un autre dorme au chaud.'], ['Dehors, comme un chien.']),
    toit_enfin: L('roof', 'content', ['Un vrai lit ! Je le savais.'], ['Un toit, cette nuit. Je respire.'], ['Un lit.'], ['Un lit. Pourvu que chacun ait le sien.'], ['Un lit. Ce n’était pas trop demander.']),
    adieu: L('grave', 'peine', ['J’aurai tenu autant que j’ai pu.'], ['Je crois que je n’irai pas plus loin.'], ['C’est la fin.'], ['Prenez soin les uns des autres.'], ['Tout ça pour finir ici.']),
    rancoeur: L('rancoeur', 'peine', ['{o} a eu sa part. Mon tour viendra.'], ['Pourquoi {o}, et pas moi ?'], ['{o}, oui. Moi, non.'], ['{o} en avait plus besoin, sans doute.'], ['{o} a été servi. Moi, j’attends encore.']),
    deuil: L('deuil', 'peine', ['{o} aurait voulu qu’on continue.'], ['{o} n’est plus là. À qui le tour ?'], ['{o}.'], ['J’aurais dû veiller sur {o}.'], ['{o} n’est plus là, et on n’a rien pu faire.']),
    deuil_aime: L('deuil', 'peine', ['Sans {o}, la clairière est trop grande.'], ['Sans {o}, je ne sais plus.'], ['{o}…'], ['Tout ce que j’avais, c’était pour {o}.'], ['Sans {o}, à quoi bon râler ?']),
    tout_va: L('village', 'content', ['Une journée douce. On s’y ferait.', 'Le soleil, les autres. Que demander ?'], ['Tout va bien. Pourvu que ça dure.'], ['Ça va.'], ['Tout le monde a mangé. Je suis bien.'], ['Rien à redire. Pour une fois.']),
    soir_doux: L('village', 'content', ['Le feu, la soupe, les autres. Rien ne manque.'], ['Une soirée tranquille. J’ose à peine y croire.'], ['Bonne soirée.'], ['Les voir tous manger, c’est mon repas.'], ['On est bien, je l’avoue.']),
    amitie: L('amitie', 'content', ['Avec {o}, la journée passe vite.'], ['Heureusement que {o} est là.'], ['{o} est quelqu’un de bien.'], ['Je garderai une part pour {o}.'], ['{o} ? Supportable.']),
    amour_naissant: L('heart', 'amour', ['Je crois bien que j’aime {o}.'], ['Et si {o} ne m’aimait pas ?'], ['{o}…'], ['Je donnerais tout pour {o}.'], ['{o} me fait sourire. C’est agaçant.']),
    amour: L('heart', 'amour', ['{o} rit, et la journée est gagnée.', 'Ce soir, je m’assieds près de {o}.'], ['Pourvu qu’il n’arrive rien à {o}.', 'Je cherche {o} des yeux, tout le temps.'], ['Près de {o}, je suis bien.'], ['Ce soir, je garde ma place pour {o}.', 'Le meilleur morceau sera pour {o}.'], ['{o} me manque dès qu’on se sépare.', 'J’aime {o}. Qu’on ne me le fasse pas répéter.']),
    brume_demain: L('fog', 'crainte', ['De la brume demain ? On s’y retrouvera.'], ['Demain la brume. On ne verra plus la forêt.'], ['Brume demain.'], ['Demain, que personne ne s’éloigne seul.'], ['De la brume. Et puis quoi encore.']),
    brume_jour: L('fog', 'crainte', ['On n’y voit rien, mais on s’entend.'], ['Je ne vois plus la lisière. Ni personne.'], ['Brume.'], ['Restez à portée de voix.'], ['On ne voit pas le bout de son nez.']),
    brume_perdue: L('fog', 'peine', ['Rien à rapporter. La brume se lèvera.'], ['Impossible de trouver le chemin. Rien à rapporter.'], ['Rien vu, rien rapporté.'], ['Les mains vides. Pardon à tous.'], ['Une journée à tourner en rond.']),
    /* survie : ce que l'on dit quand le pire s'annonce, ou quand il est passé */
    ev_maladie: L('malade', 'crainte', ['Une fièvre, ça passe. On le veillera.'], ['La fièvre est au village. Qui sera le suivant ?'], ['Un malade. Mauvais.'], ['Je porterai sa soupe au malade.'], ['La fièvre, maintenant. Il ne manquait que ça.']),
    malade: L('malade', 'peine', ['Deux jours au lit, et je repars.'], ['Je brûle. Ne me laissez pas dehors.'], ['Fièvre.'], ['Ne vous approchez pas, gardez-vous.'], ['Malade. Et qui fera mon travail ?']),
    ev_feu: L('fire', 'crainte', ['S’il y a le feu, on rebâtira.'], ['Ça sent le roussi. Où est le puits ?'], ['Le feu rôde.'], ['Je veillerai près des toits ce soir.'], ['Du bois sec partout. Ça finira en torche.']),
    ev_rats: L('rats', 'crainte', ['Des rats ? Ils ne mangeront pas tout.'], ['Les rats sont dans la réserve, j’en suis sûr.'], ['Des rats.'], ['Mettons les vivres à l’abri, vite.'], ['On trime, et les rats se servent.']),
    ev_loups: L('loups', 'crainte', ['Les loups craignent le feu. On tiendra.'], ['J’ai entendu hurler. Personne dehors cette nuit.'], ['Des loups.'], ['Que personne ne dorme dehors. Serrons-nous.'], ['Des loups, à présent. Charmant voisinage.']),
    ev_secheresse: L('sun', 'crainte', ['La rivière baisse. Elle reviendra.'], ['Plus d’eau, plus de poisson. Et après ?'], ['Tout sèche.'], ['Je porterai l’eau du puits aux potagers.'], ['Pas une goutte. Les potagers grillent.']),
    ev_vent: L('vent', 'crainte', ['Un coup de vent n’emporte pas un village.'], ['Ce vent arrachera les tentes, je le sens.'], ['Gros vent.'], ['Arrimons ce qui est léger, ensemble.'], ['Tout ce qu’on a monté va s’envoler.']),
    ev_crue: L('storm', 'crainte', ['L’eau monte. Elle redescendra.'], ['La rivière monte vers les maisons.'], ['L’eau monte.'], ['Aidons ceux qui logent près de l’eau.'], ['On a bâti trop près. Je l’avais dit.']),
    ruine: L('dehors', 'peine', ['Ce qui est tombé, on le relèvera.'], ['Hier encore, c’était debout.'], ['Plus rien.'], ['Je donnerai mes bras pour rebâtir.'], ['Tout ce travail, pour des cendres.']),
    gel_dehors: L('frost', 'crainte', ['Il y aura bien un coin au chaud.'], ['Dormir dehors par ce gel, c’est mourir.'], ['Dehors, on gèle.'], ['Que les plus fragiles dorment à l’abri.'], ['Pas de lit, et il gèle. Parfait.']),
    maison_joie: L('roof', 'content', ['Une maison à moi ! Je le savais.'], ['Une maison. Je n’ose pas y croire.'], ['Chez moi.'], ['Une maison. Ma porte restera ouverte.'], ['Une maison. Rien à redire, vraiment.']),
    tablee: L('village', 'content', ['Une seule table, et tout le monde autour.'], ['Tous à table. Que ça dure.'], ['Bonne tablée.'], ['Resservez-vous, il y en a.'], ['On mange mieux assis, je l’admets.']),
    amour_peur: L('heart', 'crainte', ['Je trouverai à manger pour {o}.'], ['{o} a faim, et je ne pense qu’à ça.'], ['{o} d’abord.'], ['Ma part ira à {o}.'], ['Qu’on nourrisse {o}, ou je fais un malheur.'])
  };
  /* réponses, quand deux villageois se parlent */
  const REP = {
    peur: { confiant: 'Tiens bon, ça va s’arranger.', inquiet: 'Moi aussi, j’ai peur.', taiseux: 'Je suis là.', genereux: 'On partagera, je te le promets.', bougon: 'Allons, on n’est pas encore morts.' },
    amour: { confiant: 'Moi aussi.', inquiet: 'Reste près de moi.', taiseux: 'Oui.', genereux: 'Viens près du feu.', bougon: 'Ne le répète à personne.' },
    merci: { confiant: 'Merci. On ne l’oubliera pas.', inquiet: 'Merci. Je n’osais pas l’espérer.', taiseux: 'Merci.', genereux: 'Merci. On vous le rendra.', bougon: 'Merci. Il fait meilleur ici que sur la route.' }
  };
  const key = (a, b) => a < b ? a + '|' + b : b + '|' + a;
  const aff = (m, a, b) => m.aff[key(a, b)] || 0;
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

  function create(st) { const m = { aff: {}, love: {}, log: {}, grief: [], grudge: [], fresh: [], n: 0 }; join(m, st, true); return m; }
  /* les nouveaux venus se connaissent déjà entre eux, pas encore les autres */
  function join(m, st, first) {
    const r = SIM.rngOf(st.seed * 31 + st.villagers.length * 7 + 3), neu = st.villagers.filter(v => !m.log[v.id]);
    for (const v of neu) m.log[v.id] = [];
    for (let i = 0; i < neu.length; i++) for (let j = i + 1; j < neu.length; j++) { const q = r(); m.aff[key(neu[i].id, neu[j].id)] = first ? (q < 0.5 ? 0 : q < 0.8 ? 1 : 2) : 2; }
    if (first && neu.length > 1 && !Object.values(m.aff).some(x => x === 2)) m.aff[key(neu[0].id, neu[1].id)] = 2;
  }
  const lover = (m, st, v) => { const o = m.love[v.id]; return o != null && st.villagers[o] && st.villagers[o].alive ? st.villagers[o] : null; };
  function friend(m, st, v, min) { let b = null, ba = (min || 2) - 1; for (const o of st.villagers) if (o.alive && o.id !== v.id) { const a = aff(m, v.id, o.id); if (a > ba) { ba = a; b = o; } } return b; }
  function mk(m, st, v, sit, force, o, moment, t0, t1) {
    const P = PH[sit], ch = charOf(v), ls = P.lines[ch], raw = ls[(st.day + v.id) % ls.length]; if (!raw) return null;
    const jn = SIM.JOBNAME[v.job || 'none'][v.sex];
    return { id: ++m.n, vid: v.id, sit, subj: P.subj, tone: P.tone, force, text: raw.replace(/\b([dD]e|[qQ]ue) \{o\}/g, (x, w0) => /^[AEIOUYHÉÈÊ]/.test(o ? o.name : '') ? w0.slice(0, -1) + '’' + o.name : w0 + ' ' + (o ? o.name : '')).replace(/\{o\}/g, o ? o.name : '').replace(/\{M\}/g, cap(jn)), other: o && o.id != null ? o.id : null, moment, day: st.day, t0: t0 == null ? 0 : t0, t1: t1 == null ? 99 : t1, reply: null };
  }
  /* qui répond : l'être aimé, sinon un proche, sinon une âme généreuse */
  function answer(m, st, th, kind, who) {
    const v = st.villagers[th.vid], r = who || lover(m, st, v) || friend(m, st, v, 2) || st.villagers.find(o => o.alive && o.id !== v.id && charOf(o) === 'genereux');
    if (r) th.reply = { vid: r.id, text: REP[kind][charOf(r)] };
    return th;
  }
  const push = (out, th) => { if (th) out.push(th); return th; };

  /* ---------- le matin : ce que la nuit et les annonces ont laissé ---------- */
  function morning(m, st) {
    const V = st.villagers.filter(v => v.alive), n = V.length, day = st.day, out = [], cnt = {}, places = SIM.capacity(st);
    const evT = SIM.eventsOn(st, day), evN = SIM.eventsOn(st, day + 1), wz = SIM.weather(st), needBed = V.filter(v => v.roofless > 0 && v.home == null).length;
    const add = (v, sit, force, o) => { const th = push(out, mk(m, st, v, sit, force, o, 'matin')); if (th) cnt[v.id] = (cnt[v.id] || 0) + 1; return th; };
    for (const v of V) {
      if (st.arrived.includes(v.id)) { add(v, 'arrive', 2); continue; }
      const lv = lover(m, st, v);
      if (v.hunger > 0) { const th = add(v, 'faim_hier', st.food < n ? 3 : 2); if (th) answer(m, st, th, 'peur'); }
      if (v.roofless > 0) { const th = add(v, 'dehors_hier', places < needBed ? 3 : 2); if (th && !v.hunger) answer(m, st, th, 'peur'); }
      const g = m.grudge.find(x => x.a === v.id && x.day === day - 1); if (g && st.villagers[g.b].alive) add(v, 'rancoeur', 1, st.villagers[g.b]);
      const d = m.grief.find(x => day - x.day <= 2 && (x.lover === v.id || aff(m, v.id, x.id) >= 1 || day - x.day === 1));
      if (d) add(v, d.lover === v.id ? 'deuil_aime' : 'deuil', d.lover === v.id ? 3 : day - d.day === 1 ? 2 : 1, { name: d.name });
      const nl = m.fresh.find(p => p.day === day - 1 && (p.a === v.id || p.b === v.id));
      if (nl && lv && nl.a === v.id) add(v, 'amour_naissant', 2, lv);
      if (lv && lv.hunger > 0) add(v, 'amour_peur', 2, lv);
    }
    /* ce qui concerne tout le village n'est dit que par un ou deux d'entre eux, à tour de rôle */
    const old = V.filter(v => !st.arrived.includes(v.id));
    const share = (sit, force, k, pref) => {
      const c = old.filter(v => PH[sit].lines[charOf(v)][0]).sort((a, b) => (pref && charOf(b) === pref ? 1 : 0) - (pref && charOf(a) === pref ? 1 : 0) || (cnt[a.id] || 0) - (cnt[b.id] || 0) || ((a.id + day) % n) - ((b.id + day) % n));
      c.slice(0, k).forEach(v => { const th = add(v, sit, force); if (th && th.tone === 'crainte' && force >= 2) answer(m, st, th, 'peur'); });
    };
    if (st.food < n) share('faim_soir', 2, 2, 'inquiet'); else if (st.food < 2 * n) share('faim_loin', 1, 1, 'inquiet');
    if (st.wood === 0) share('bois_zero', 1, 1);
    const SV = { sick: 'ev_maladie', fire: 'ev_feu', rats: 'ev_rats', wolves: 'ev_loups', drought: 'ev_secheresse', wind: 'ev_vent', flood: 'ev_crue' };
    for (const v of st.villagers) if (v.alive && v.sick > 0) add(v, 'malade', 2);
    if (st.lost && st.lost.length) share('ruine', 1, 1);
    for (const e of evT) {
      if (SV[e.type]) share(SV[e.type], 2, 2);
      if (e.type === 'storm') share('orage_jour', 2, 2);
      if (e.type === 'fog') share('brume_jour', 2, 2);
      if (e.type === 'frost') share('gel_jour', 2, 2);
      if (e.type === 'arrivals') { const c = old.slice().sort((a, b) => (cnt[a.id] || 0) - (cnt[b.id] || 0))[0]; if (c) { const th = add(c, 'accueil', 1), nv = st.villagers[st.arrived[0]]; if (th && nv) answer(m, st, th, 'merci', nv); } }
    }
    for (const e of evN) {
      if (SV[e.type]) share(SV[e.type], 1, 1, 'inquiet');
      if (e.type === 'storm') share('orage_demain', 1, 2, 'inquiet');
      if (e.type === 'fog') share('brume_demain', 1, 1, 'inquiet');
      if (e.type === 'frost') share('gel_demain', 1, 2, 'inquiet');
      if (e.type === 'arrivals') { const k = e.villagers.length, ok = places >= n + k && st.food >= 2 * n; share(ok ? 'venus_ok' : 'venus_ko', ok ? 1 : 2, 2); }
    }
    if (wz.frost && places < n) share('gel_dehors', 3, 2, 'inquiet');
    for (const v of old) if (!cnt[v.id]) add(v, day === 1 ? 'debut' : 'tout_va', 1);
    /* deux pensées au plus par personne, les plus fortes */
    const by = {}; out.sort((a, b) => b.force - a.force);
    return out.filter(t => (by[t.vid] = (by[t.vid] || 0) + 1) <= 2);
  }

  /* ---------- la journée : ce qui arrive vraiment ---------- */
  function day(m, plan) {
    const S = plan.start, E = plan.end, st = Object.assign({}, S, { villagers: S.villagers.map(v => Object.assign({}, v, { job: E.villagers[v.id].job })) });
    const V = st.villagers.filter(v => v.alive), n = V.length, d = S.day, out = [], w = SIM.weather(S), ev = plan.events, cnt = {};
    const tOf = (type, vid) => { const e = ev.find(x => x.type === type && x.vid === vid); return e ? e.t : null; };
    const add = (v, sit, force, o, moment, t0, t1) => { const th = push(out, mk(m, st, v, sit, force, o, moment, t0, t1)); if (th) cnt[v.id] = (cnt[v.id] || 0) + 1; return th; };
    const turn = k => V.slice().sort((a, b) => (cnt[a.id] || 0) - (cnt[b.id] || 0) || ((a.id + d) % n) - ((b.id + d) % n)).slice(0, k);
    if (plan.nb) {
      if (SIM.BT[plan.nb.type].beds) { const c = V.filter(v => v.roofless > 0 && v.home == null); (c.length ? c.slice(0, 2) : turn(1)).forEach(v => add(v, 'chantier_toit', c.length ? 2 : 1, null, 'au chantier', 6.8, 8.8)); }
      else turn(2).forEach(v => add(v, 'chantier', 1, null, 'au chantier', 6.9, 8.8));
    }
    for (const e of ev) if (e.type === 'job' && e.job) add(st.villagers[e.vid], 'metier', 1, null, 'au travail', 9.1, 11.6);
    for (const e of ev) if (e.type === 'home') add(st.villagers[e.vid], 'maison_joie', 2, null, 'dans la journée', 9.2, 12.5);
    let idle = 0; const anti = k => E.buildings.some(b => SIM.BT[b.type].anti === k);
    for (const v of V) {
      const b = v.job && E.buildings.find(x => x.workers.includes(v.id)), bt = b && SIM.BT[b.type];
      if (!v.job) { if (idle++ < 2 && !cnt[v.id]) add(v, w.fog && !anti('fog') ? 'brume_perdue' : 'oisif', 1, null, 'dans la journée', 9.8, 16); }
      else if (w.storm && bt && bt.storm && !anti('storm')) add(v, 'pont_coupe', 2, null, 'dans la journée', 9.4, 16);
      else if (w.frost && bt && bt.frost && !(bt.garden && anti('frost'))) add(v, 'gel_perdu', 2, null, 'dans la journée', 9.4, 16);
      else if (w.fog && bt && bt.fog && !anti('fog')) add(v, 'brume_perdue', 2, null, 'dans la journée', 9.4, 16);
      else if (b) { const f = b.workers.map(id => st.villagers[id]).find(o => o.id !== v.id && o.alive && aff(m, v.id, o.id) >= 2 && m.love[v.id] !== o.id); if (f && (v.id + d) % 2 === 0) add(v, 'amitie', 1, f, 'dans la journée', 10.4, 16.5); }
    }
    const seen = {};
    for (const v of V) { /* ceux qui s'aiment : l'un des deux le dit, au repas */
      const lv = lover(m, st, v); if (!lv || seen[key(v.id, lv.id)]) continue; seen[key(v.id, lv.id)] = 1;
      const sp = d % 2 ? v : lv, ot = sp === v ? lv : v; add(sp, 'amour', 1, ot, 'au repas', 17.2, 19);
    }
    const noeat = V.filter(v => tOf('noeat', v.id) != null), nobed = V.filter(v => tOf('nobed', v.id) != null);
    for (const v of V) {
      const te = tOf('eat', v.id), tn = tOf('noeat', v.id), tb = tOf('bed', v.id), to = tOf('nobed', v.id);
      if (te != null && S.villagers[v.id].hunger > 0) add(v, 'repas_enfin', 2, null, 'au repas', te, te + 1.2);
      if (tn != null) { const dying = S.villagers[v.id].hunger > 0, th = add(v, dying ? 'adieu' : 'rien_mange', dying ? 3 : 2, null, 'au repas', tn, tn + 1.4); if (th && !dying) answer(m, st, th, 'peur'); }
      if (tb != null && S.villagers[v.id].roofless > 0 && tn == null) add(v, 'toit_enfin', 2, null, 'au coucher', tb - 0.7, 21.45);
      if (to != null && !(tn != null && S.villagers[v.id].hunger > 0)) { const dying = S.villagers[v.id].roofless > 0 || w.frost; add(v, dying ? 'adieu' : 'pas_de_lit', dying ? 3 : 2, null, 'au coucher', to, 21.45); }
    }
    for (const a of noeat.slice(0, 2)) { /* quelqu'un s'inquiète pour celui qui n'a rien eu */
      const lv = lover(m, st, a), b = lv && !noeat.includes(lv) ? lv : V.find(o => o.id !== a.id && !noeat.includes(o) && (aff(m, a.id, o.id) >= 2 || charOf(o) === 'genereux'));
      if (b) add(b, lv === b ? 'amour_peur' : 'ami_faim', 2, a, 'au repas', tOf('noeat', a.id) + 0.1, 20.4);
    }
    const tb = E.buildings.some(b => SIM.BT[b.type].joy);
    if (!noeat.length && !nobed.length) turn(2).forEach((v, k) => { if ((cnt[v.id] || 0) < 2) add(v, tb && !k ? 'tablee' : 'soir_doux', 1, null, 'au repas', 17.4, 19.3); });
    return out;
  }

  /* ---------- le soir : les liens se font et se défont ---------- */
  function endDay(m, plan) {
    const S = plan.start, E = plan.end, d = S.day, up = {}, V = S.villagers.filter(v => v.alive), ev = plan.events;
    const bump = (a, b) => { const k = key(a, b); if (a === b || up[k]) return; up[k] = 1; m.aff[k] = Math.min(3, (m.aff[k] || 0) + 1); };
    for (const b of E.buildings) for (const a of b.workers) for (const c of b.workers) if (a < c) bump(a, c);
    /* sous un même toit : dans une maison on vit vraiment ensemble ; dans une cabane, on ne fait souvent que dormir */
    const r = SIM.rngOf(S.seed * 7 + d * 101 + 13), roof = {}, own = {}, mates = []; for (const e of ev) if (e.type === 'bed') (roof[e.bid] = roof[e.bid] || []).push(e.vid);
    for (const b of E.buildings) own[b.id] = !!SIM.BT[b.type].own;
    for (const k in roof) for (const a of roof[k]) for (const c of roof[k]) if (a < c) { if (own[k] || r() < 0.4) bump(a, c); mates.push([a, c, own[k]]); }
    /* le hasard a servi l'un et pas l'autre : il en reste une rancœur */
    for (const [no, yes, pr] of [['noeat', 'eat', 'hunger'], ['nobed', 'bed', 'roofless']]) {
      const got = ev.filter(e => e.type === yes).map(e => e.vid);
      for (const e of ev) if (e.type === no) {
        const a = S.villagers[e.vid], b = got.map(id => S.villagers[id]).find(o => o[pr] === a[pr] && (pr !== 'roofless' || o.home == null) && m.love[a.id] !== o.id);
        if (b && !m.grudge.some(x => x.a === a.id && x.day === d)) { m.grudge.push({ a: a.id, b: b.id, day: d }); const k = key(a.id, b.id); m.aff[k] = Math.max(0, (m.aff[k] || 0) - 1); }
      }
    }
    for (const x of plan.sum.deaths) { m.grief.push({ id: x.id, name: x.name, day: d, lover: m.love[x.id] != null ? m.love[x.id] : null }); const o = m.love[x.id]; if (o != null) { delete m.love[o]; delete m.love[x.id]; } }
    /* l'amour naît entre deux proches, libres l'un et l'autre, qui dorment sous le même toit : rarement dans une cabane, souvent dans une maison (un couple au plus par soir) */
    for (const [a, c, o] of mates) {
      const q = r(); if (m.love[a] != null || m.love[c] != null || !E.villagers[a].alive || !E.villagers[c].alive || aff(m, a, c) < 2 || q >= (o ? 0.7 : 0.1)) continue;
      m.love[a] = c; m.love[c] = a; m.fresh.push({ a, b: c, day: d }); break;
    }
  }
  /* inscrit une pensée au carnet de celui qui l'a eue */
  function note(m, th) { if (th.noted) return; th.noted = true; (m.log[th.vid] = m.log[th.vid] || []).push({ day: th.day, moment: th.moment, text: th.text, tone: th.tone, subj: th.subj }); }
  function noteReply(m, th) { if (!th.reply || th.reply.noted) return; th.reply.noted = true; (m.log[th.reply.vid] = m.log[th.reply.vid] || []).push({ day: th.day, moment: th.moment, text: th.reply.text, tone: 'content', subj: 'ppl', to: th.vid }); }
  /* les proches d'un villageois, du plus proche au moins proche */
  function close(m, st, vid) {
    return st.villagers.filter(o => o.alive && o.id !== vid && (aff(m, vid, o.id) >= 2 || m.love[vid] === o.id)).map(o => ({ id: o.id, name: o.name, love: m.love[vid] === o.id, aff: aff(m, vid, o.id) })).sort((a, b) => (b.love ? 9 : b.aff) - (a.love ? 9 : a.aff)).slice(0, 3);
  }
  return { create, join, morning, day, endDay, note, noteReply, close, charOf, CHARN, PH, REP, aff };
})();
if (typeof module !== 'undefined') module.exports = MIND;
