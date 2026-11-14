# Hameau

Petit jeu de réflexion pour téléphone, à villageois autonomes. Chaque matin, on choisit un seul bâtiment parmi trois cartes ; les villageois font le reste d'eux-mêmes : ils bâtissent, travaillent, mangent, dorment, s'attachent les uns aux autres et disent ce qu'ils pensent.

**Jouer : <https://loymaster.github.io/Hameau/>**

Le jeu tient dans une seule page web. Il est pensé pour un écran de téléphone tenu debout ; sur ordinateur, il se joue à la souris (molette pour zoomer).

## État

Prototype 0.37.

- **Défis** : 40 défis en 13 niveaux, de 4 à 12 jours chacun, avec des événements annoncés (orage, brume, gel, sécheresse, crue, grand vent, rats, maladie, tornade, nouveaux venus) et jusqu'à 3 étoiles. Les défis 21 à 30 partent d'un pré nu ; les enfants et l'école y arrivent au défi 25. Les défis 31 à 40 se jouent sur de grandes cartes : le bourg, le savoir, la manufacture.
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

## Essais

Les essais des règles ne demandent que Node :

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
node test/trace2.js c36 'argiliere+cabane > - > briqueterie+geologue'   # une partie pas à pas ; « a+b » = deux chantiers
node test/mind.test.js             # les pensées des villageois
node test/check.js                 # rien ne manque : phrases de fin, descriptions, dessins, noms en double
```

Les scripts Python de `test/` jouent le jeu dans Chrome sans tête avec Playwright (`/usr/bin/google-chrome`) et écrivent leurs captures dans `out/`.

## Crédits

Conception, icônes et musique : l'auteur du dépôt. Code écrit avec Claude.

Aucune licence n'est choisie pour l'instant.
