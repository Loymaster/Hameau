# Hameau

Petit jeu de réflexion pour téléphone, à villageois autonomes. Chaque matin, on choisit un seul bâtiment parmi trois cartes ; les villageois font le reste d'eux-mêmes : ils bâtissent, travaillent, mangent, dorment, s'attachent les uns aux autres et disent ce qu'ils pensent.

**Jouer : <https://loymaster.github.io/Hameau/>**

Le jeu tient dans une seule page web. Il est pensé pour un écran de téléphone tenu debout ; sur ordinateur, il se joue à la souris (molette pour zoomer).

## État

Prototype 0.22.

- **Défis** : 30 défis en 9 niveaux, de 4 à 10 jours chacun, avec des événements annoncés (orage, brume, gel, sécheresse, crue, grand vent, nouveaux venus) et jusqu'à 3 étoiles. Les défis 21 à 30 partent d'un pré nu ; les enfants et l'école y arrivent au défi 25.
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
node test/mind.test.js             # les pensées des villageois
```

Les scripts Python de `test/` jouent le jeu dans Chrome sans tête avec Playwright (`/usr/bin/google-chrome`) et écrivent leurs captures dans `out/`.

## Crédits

Conception, icônes et musique : l'auteur du dépôt. Code écrit avec Claude.

Aucune licence n'est choisie pour l'instant.
