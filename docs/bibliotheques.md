# Bibliothèques

Une **bibliothèque**, c'est un dossier de votre disque qu'aubi indexe, avec un
nom et un type. Tout se règle depuis **Paramètres → Bibliothèques**, sans
toucher à un fichier de configuration ni redémarrer quoi que ce soit.

---

## La carte d'une bibliothèque

Chaque bibliothèque affiche son nom, son type, son chemin, et ce qu'elle pèse :
nombre de titres, place occupée, durée totale, espace libre restant sur le
disque qui l'héberge. En dessous, la date du dernier scan.

Un dossier devenu illisible (disque débranché, chemin renommé hors d'aubi) est
signalé en rouge. Rien n'est perdu pour autant : le scan saute la bibliothèque
au lieu de la vider, et tout revient quand le dossier réapparaît.

---

## Ajouter un dossier

**Ajouter une bibliothèque**, puis le dossier — tapé au clavier, ou choisi avec
« Parcourir » qui explore le disque du serveur. Le navigateur indique au passage
combien de fichiers audio se trouvent dans le dossier affiché, ce qui évite de
se tromper d'étage.

Le nom est libre ; laissé vide, il reprend celui du dossier. Le type (Musique,
Concerts, Livres audio) décide de la rubrique où le contenu apparaîtra, et de la
façon dont les dossiers sont interprétés — voir
[Premiers pas](premiers-pas.md#comment-ranger-vos-fichiers).

Le scan démarre tout seul dès la création.

**Deux dossiers imbriqués sont refusés** : indexer `/musique` et
`/musique/rock` compterait deux fois les mêmes fichiers.

Si le dossier voulu n'apparaît pas dans « Parcourir », c'est qu'il est en dehors
de la racine média : il faut élargir `AUBI_MEDIA_ROOT` dans `.env` et relancer
la pile (voir [Installation](installation.md#2-régler-deux-valeurs)).

---

## Déplacer un dossier

Disque réorganisé, dossier renommé, migration vers un autre montage : modifiez
le chemin depuis le crayon de la carte. aubi **recolle les chemins déjà connus**
au lieu de tout réindexer — vos favoris, vos statistiques, vos éditions
manuelles et vos playlists suivent le déménagement.

---

## Désactiver plutôt que supprimer

L'interrupteur en haut de chaque carte masque la bibliothèque : son contenu
disparaît des listes, de la recherche, du graphe et des statistiques, et sa
rubrique s'efface de la navigation si plus rien ne l'alimente.

Rien n'est effacé pour autant. Favoris, playlists, historique d'écoute,
pochettes et corrections de tags sont conservés, et la carte continue d'afficher
ce qui reviendra. Rebasculez l'interrupteur : tout est là, immédiatement.

C'est le bon geste pour un disque externe qu'on ne branche que le week-end, ou
pour une section qu'on ne veut pas voir en permanence.

## Supprimer

**Supprimer** retire la bibliothèque d'aubi. Les fichiers restent sur le disque,
intacts, et l'historique d'écoute est conservé. Il faut confirmer.

---

## Scanner

Chaque carte a son bouton de scan, pour ne relancer qu'un dossier. Le bouton
**Scanner la bibliothèque** de la section suivante, lui, parcourt tout.

Un scan n'est de toute façon presque jamais nécessaire à la main : les dossiers
actifs sont surveillés en permanence, et un ajout ou une suppression de fichier
déclenche un scan quelques secondes plus tard. Un scan se lance aussi au
démarrage du serveur si le dernier remonte à plus d'une heure.

Pendant un scan, une barre de progression apparaît. Vous pouvez continuer à
écouter.

---

## Place occupée

La section suivante récapitule toute la bibliothèque visible : titres, place sur
le disque, durée totale, albums, artistes, puis la répartition par rubrique et
une jauge de l'espace libre.

Les titres masqués par une bibliothèque désactivée y sont comptés à part — on
voit du même coup ce qu'on récupérerait en la supprimant pour de bon.
