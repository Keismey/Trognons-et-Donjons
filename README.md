# Trognons & Donjons

Un rogue-zelda-like mignon pour mobile, de Keismey Studio : descends dans les profondeurs, sauve des créatures (les trognons) et fais-les grandir au refuge. Elles t'aideront à descendre plus loin.

**État : prototype du donjon** (formes provisoires, pas encore d'images ni de musique).

## Jouer au prototype

Ouvrir `index.html` dans un navigateur, ou la page GitHub Pages du dépôt une fois activée.

- Téléphone : joystick à gauche, ⚔ attaque, ↻ roulade, ✦ souffle de Braisou (le compagnon). Près d'une créature assommée, ⚔ devient ♥ pour la sauver.
- Clavier : flèches ou ZQSD, J attaque, K roulade, L souffle.

## Ce que contient le prototype

- Un biome (les Racines), des étages de 7 à 10 salles générés à chaque partie, portes qui s'ouvrent quand la salle est vidée.
- 3 ennemis : le Glouton (bondit), l'Épineux (tire des graines), le Bourdon (prévient puis fonce).
- Les créatures à aura dorée ne meurent pas : elles sont assommées et on peut les sauver.
- Butin : fibres, éclats, cœurs, coffres, œufs. Portail de sortie : rentrer ou descendre plus bas.
- K.O. : la moitié du butin est perdue, jamais les œufs ni les trognons.
- Sons fabriqués par le jeu (WebAudio). Sauvegarde dans le navigateur (`localStorage`, clé `trognons-et-donjons-proto`).

Le concept complet est dans le document de conception du projet.
