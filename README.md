# Hameau

Petit jeu de réflexion pour téléphone, à villageois autonomes. Chaque matin, on choisit un seul bâtiment parmi trois cartes ; les villageois font le reste d'eux-mêmes : ils bâtissent, travaillent, mangent, dorment, s'attachent les uns aux autres et disent ce qu'ils pensent.

**Jouer : <https://loymaster.github.io/Hameau/>**

Le jeu tient dans une seule page web. Il est pensé pour un écran de téléphone tenu debout ; sur ordinateur, il se joue à la souris (molette pour zoomer).

## État

Prototype 0.44.

- **Défis** : 50 défis en 15 niveaux, de 4 à 14 jours chacun, avec des événements annoncés (orage, brume, gel, sécheresse, crue, grand vent, incendie, loups, rats, maladie, canicule, tornade, nouveaux venus) et jusqu'à 3 étoiles. Les défis 21 à 30 partent d'un pré nu ; les enfants et l'école y arrivent au défi 25. Les défis 31 à 40 se jouent sur de grandes cartes : le bourg, le savoir, la manufacture.
- **Survie** : 4 villageois, presque rien au départ, des jours sans fin et un ciel de plus en plus dur. On y choisit qui travaille où, et la partie se garde d'une visite à l'autre.
- **Bac à sable** : pas encore.

La progression et la partie de survie en cours sont gardées dans le navigateur de l'appareil.

## Organisation

| Dossier | Contenu |
|---|---|
| `src/` | Les sources : `sim.js` (règles et défis), `mind.js` (pensées et liens des villageois), `art.js` et `render.js` (dessin), `audio.js` (sons et musique), `game.js` (déroulement), `ui.js` et `style.css` (interface), `icons.js` (icônes), `music/` (huit morceaux) |
| `docs/` | La page publiée par GitHub Pages, produite par `build.py` |
| `icons/svg/` | Les tracés sources des icônes |
| `test/` | Les essais : règles, pensées, équilibre, et parcours joués dans un navigateur sans tête |

## Construire

```
python3 build.py
```

Le script assemble `src/` en une seule page et l'écrit dans `out/` (copie de travail, non suivie) et dans `docs/` (page publiée). Publier une nouvelle version revient à lancer le script puis à pousser `docs/`.

## La manufacture (défis 31 et suivants)

- **Le bourg.** À dix habitants, le village devient un bourg : chemins pavés, coup de clairon, et **deux chantiers par jour** au lieu d'un (jamais obligatoires).
- **Les ateliers.** Un atelier transforme ce qui était en réserve **le matin, une fois les chantiers payés** : 2 argiles → 1 brique, 2 bois → 1 planche, 2 nourritures → 1 repas, 2 cultures → 1 ingéniosité, 2 bonheurs → 1 épanouissement. Chacun a un plafond par jour ; sans personne à son poste, ou sans matière, il reste à l'arrêt. La cuisine ne prend que ce qui dépasse le repas du soir.
- **Les maîtres.** Géologue, ingénieur, cuisinier, psychologue : tant que l'un d'eux est à son poste, son atelier transforme à 1 pour 1. Le médecin, lui, empêche de mourir de maladie et arrête la contagion. Leurs bâtiments se paient en ingéniosité.
- **Les postes.** Dans les défis, chacun garde son poste ; un bâtiment n'a de travailleur que s'il reste un adulte libre. Quand un atelier est détruit, ses gens redeviennent libres.
- **Ce qui tient.** La tornade emporte tout bâtiment dont le coût ne compte ni pierre ni brique. L'entrepôt met la réserve hors d'atteinte des rats. La canicule gâte la moitié de la nourriture crue ; les repas se gardent.
- **Mêmes choix, même partie.** Dans un défi, le hasard du jeu (qui tombe malade, qui prend quel poste, quel lit) est fixé une fois pour toutes ; seuls les visages, les noms et les caractères changent d'une partie à l'autre. La survie, elle, reste tirée au sort.
- **Les saisons.** Le paysage suit ce qui est annoncé : le gel fait l'hiver (neige au sol et sur les toits, arbres nus, glace aux berges), la canicule et la sécheresse font l'été (herbe jaunie, terre fendillée, rivière basse). Entre deux, l'année suit son cours : l'automne après l'été, le printemps après l'hiver (fleurs, cerisiers) ; avant le premier, la saison qui le précède. Deux canicules à quatre jours ou moins font un seul été. Sans gel ni chaleur annoncés, le défi a sa saison à lui, choisie d'après son titre : le printemps pour 16 défis (`season: 'spring'`), l'automne pour 16 autres. En survie, on ne devance rien. On passe d'une saison à l'autre par un fondu, le matin. Rien ne change au jeu : `SIM.season(st)` ne fait que lire les événements.
- **L'ordre des chantiers.** Quand on bâtit deux bâtiments le même jour, le premier choisi est bâti le premier : il reçoit d'abord les adultes libres. Les cartes choisies portent leur numéro.
- **Les troisièmes étoiles.** Elles ne demandent plus toujours une réserve de nourriture : plusieurs choses à la fois (`G.have({ food: 14, stone: 4 })`), peu de chantiers (`G.built(5)` : « Pas plus de 5 chantiers »), et `G.and(…)` pour en réunir plusieurs. `G.solid` (tout le monde sous la pierre ou la brique le dernier soir) existe aussi, sans défi qui s’en serve encore.
- **Les loups et l'incendie** entrent dans les défis (ils n'existaient qu'en survie). Les loups emportent quelqu'un qui dort dehors, sinon ils pillent la réserve ; un braséro les tient loin. L'incendie emporte un bâtiment de bois ; un puits l'éteint.
- **Le cellier** garde la réserve au frais : avec lui, la canicule ne gâte rien.
- **La guinguette et le manège** se bâtissent de planches. La guinguette donne 3 bonheurs par jour (la tornade l'emporte) ; le manège 1 bonheur par enfant et par jour, jusqu'à 4 enfants (il tient).
- **Le tutoriel de la manufacture.** Chaque élément de production est expliqué le premier matin où il se présente, une seule fois : la culture, les ateliers, l'ingéniosité, le médecin, la brique, les maîtres, la planche, l'épanouissement, l'entrepôt, le repas, le cellier.
- **La révision des défis (0.44).** 28 défis retouchés. Bâtiments remis en jeu : atelier de taille (4), fumoir (6, 31), champignonnière (8), auberge (18, 31), chaumière (24, 35, 48), ferme familiale (27, 30), menuiserie et puits (37), puits, académie et observatoire (47), cellier (41, 43, 45, 50), guinguette (43, 45, 48, 50), manège (48, 50). Loups : défis 14, 27, 44, 46, 50. Incendie : défis 17, 30, 37, 47, 50 ; la brique ne brûle pas. La troisième étoile ne demande plus une simple réserve que dans 17 défis sur 50 (26 auparavant). Petits défis (un chantier par jour) : toutes les parties sont comptées par `test/retune.js`, et le nombre de lignes à 3 étoiles ne monte jamais (défi 4 : 27 → 23, défi 6 : 18 → 15, défi 8 : 12 → 10, défi 18 : 4 → 3, etc.). Grands défis : le seuil est recalé sur la meilleure partie trouvée par `test/beam2.js` puis `test/climb.js` (environ 90 % ; ce qui n'est pas trouvé n'est pas prouvé impossible). Les défis 36, 40, 42 et 49 n'ont pas bougé.
- **Le défi 50** est refait : bonheur en jeu, six enfants, une école qui n'a que 3 places par jour. Troisième étoile : tous les enfants ont fini l'école, 14 nourritures, 58 de bonheur et 14 d'ingéniosité. L'aire de jeux, le manège et les marionnettes ne donnent du bonheur que tant qu'il reste des enfants : l'école bâtie le premier jour ne suffit plus. La ligne relevée attend le jour 6 pour la première école et le jour 10 pour la seconde, ne bâtit qu'un chantier les jours 2, 6 et 7, et rien les jours 11, 12 et 14.
- **Les défis 41 à 50.** Le niveau 14 (« La cité ») mêle tous les ateliers et tous les maîtres, cuisinier compris ; le niveau 15 (« Les derniers jours ») ramène les enfants, jusqu'au défi 50 où tout arrive à la fois. L'objectif « Tous les enfants ont fini l'école » y fait son entrée.

## Essais

Les essais des règles ne demandent que Node (`test/retune.js <défi>` compte toutes les parties d'un petit défi pour recaler sa troisième étoile ; `python3 test/tuto.py` vérifie le tutoriel de la manufacture dans un navigateur) :

```
node test/sim.test.js              # toutes les parties possibles de chaque défi
ONLY=c15 node test/sim.test.js     # un seul défi
node test/stars.js c15             # étoiles, parties gagnantes, cartes utilisées
node test/trace.js c15 '->scierie>potager>four>grange>four'   # une partie, jour par jour
node test/beam.js c27 300          # défis longs : recherche des meilleures parties
SAMPLE=1000 ONLY=c27 node test/sim.test.js   # défis longs : parties tirées au hasard
node test/surv.js 40 sage          # 40 parties de survie (sage, hasard ou meneur)
node test/beam2.js c40 120         # grands défis : recherche guidée par les objectifs (W='brick:4' pour peser une ressource)
node test/rand.js c36 100          # grands défis : parties au hasard, étoiles et causes de décès
node test/climb.js c47 'a > b+c > -'   # grands défis : améliore une ligne un jour à la fois (KICK=10 pour la secouer)
node test/trace2.js c36 'argiliere+cabane > - > briqueterie+geologue'   # une partie pas à pas ; « a+b » = deux chantiers
node test/mind.test.js             # les pensées des villageois
node test/check.js                 # rien ne manque : phrases de fin, descriptions, dessins, noms en double
```

Les scripts Python de `test/` jouent le jeu dans Chrome sans tête avec Playwright (`/usr/bin/google-chrome`) et écrivent leurs captures dans `out/`.

## Crédits

Conception, icônes et musique : l'auteur du dépôt. Code écrit avec Claude.

Aucune licence n'est choisie pour l'instant.
