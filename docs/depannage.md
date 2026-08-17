# Dépannage

## Regarder les logs

Presque tout se diagnostique là :

```bash
docker compose -f docker-compose.standalone.yml logs -f aubi-backend
```

Et l'état des conteneurs (les trois doivent être `Up`, le serveur `healthy`) :

```bash
docker compose -f docker-compose.standalone.yml ps
```

---

## L'installation

### « no such file or directory » ou une erreur de volume au démarrage

`AUBI_MEDIA_ROOT` pointe sur un dossier qui n'existe pas, ou la variable est
vide. Le chemin doit être **absolu** (commencer par `/`) et exister sur la
machine qui fait tourner Docker. Corrigez `.env`, puis relancez :

```bash
docker compose -f docker-compose.standalone.yml up -d
```

### La page ne s'ouvre pas sur http://localhost:8080

Un autre programme occupe peut-être le port. Ajoutez `AUBI_PORT=9000` dans
`.env` et relancez. Vérifiez aussi que le conteneur frontend tourne (`ps`
ci-dessus).

### La page s'affiche mais tout est vide, ou « impossible de charger »

Le serveur n'est pas prêt (il attend la base de données) ou il a planté.
Regardez ses logs. Au tout premier démarrage, laissez-lui une minute :
il applique ses migrations avant de répondre.

### `network homelab_proxy declared as external, but could not be found`

Vous avez lancé le fichier compose du homelab au lieu du fichier autonome.
Utilisez `docker compose -f docker-compose.standalone.yml up -d`.

---

## La bibliothèque

### Le navigateur de dossiers ne montre pas mon disque

Il n'explore que la racine média. Élargissez `AUBI_MEDIA_ROOT` dans `.env` (par
exemple `/mnt` ou `/home`), relancez la pile, et le dossier apparaîtra. Un
disque externe doit évidemment être monté **avant** le démarrage des conteneurs.

### « Ce dossier n'existe pas sur le serveur »

Le chemin saisi est celui de votre machine de bureau, pas celui du serveur ; ou
bien le dossier est en dehors de la racine média et n'est donc pas monté dans le
conteneur. Passez par « Parcourir » pour ne pas vous tromper.

### « Le serveur n'a pas le droit de lire ce dossier »

Les permissions Unix du dossier interdisent la lecture au conteneur. Le plus
simple :

```bash
chmod -R a+rX /chemin/du/dossier
```

### « Ce dossier chevauche une bibliothèque existante »

Un dossier déjà indexé contient celui-ci, ou l'inverse. Choisissez un dossier
séparé, ou modifiez la bibliothèque existante.

### Ma bibliothèque est affichée en rouge, « dossier introuvable »

Le disque n'est pas monté, ou le chemin a changé. Rebranchez et relancez la
pile, ou corrigez le chemin depuis le crayon de la carte — vos données suivent.

### Le scan ne trouve aucun titre

Vérifiez que les fichiers sont dans un format lu (MP3, FLAC, OGG, Opus, M4A,
AAC, WAV) et qu'ils sont bien **sous** le dossier déclaré. Les logs du serveur
signalent les fichiers ignorés et pourquoi.

### Certains titres n'ont pas de pochette

aubi cherche d'abord une image dans les tags du fichier, puis une image dans le
dossier de l'album (`cover.jpg`, `folder.jpg`…). Sans l'un ni l'autre, il
affiche les initiales. Ajoutez une image dans le dossier et relancez un scan.

### Un album est éclaté en plusieurs, ou des titres sont mal rangés

C'est presque toujours une histoire de tags. Corrigez-les depuis l'application
(menu « … » → **Modifier**, ou sélection multiple pour un lot), ou rangez les
fichiers comme décrit dans
[Premiers pas](premiers-pas.md#comment-ranger-vos-fichiers).

### Un album apparaît comme collection (ou l'inverse)

aubi devine à partir du nombre d'artistes distincts dans le dossier. Le menu
« … » de l'album permet de trancher : **C'est un album** ou **C'est une
playlist**. Votre choix ne sera plus remis en cause.

### Une rubrique a disparu du menu

Musique, Concerts et Livres audio ne s'affichent que si du contenu les alimente.
Si Concerts s'est évaporé, c'est qu'aucune bibliothèque active ne contient de
concert : vérifiez l'interrupteur de la bibliothèque concernée.

---

## La lecture

### Le son ne démarre pas

Le navigateur d'un téléphone refuse parfois la lecture tant qu'aucun appui n'a
eu lieu sur la page : touchez le bouton de lecture plutôt que de compter sur une
reprise automatique. Sinon, vérifiez que le serveur répond (logs).

### La lecture se coupe sur les longs fichiers, ou en 4G

C'est en général le réseau. Si vous passez par votre propre reverse proxy,
vérifiez qu'il ne coupe pas les connexions longues et qu'il laisse passer les
requêtes `Range` (le fichier autonome fourni est déjà réglé pour).

### L'application ne se met pas à jour sur le téléphone

Elle est installée comme application web : fermez-la complètement puis
rouvrez-la. Elle récupère la nouvelle version au chargement suivant.

---

## Repartir de zéro

Pour refaire la première configuration sans perdre vos fichiers audio :

```bash
docker compose -f docker-compose.standalone.yml down -v
docker compose -f docker-compose.standalone.yml up -d
```

`-v` efface la base et les pochettes : favoris, playlists et statistiques sont
perdus, l'assistant repart au premier écran. Vos fichiers audio ne sont pas
touchés.

---

## Rien de tout ça ?

Ouvrez une [issue](https://github.com/Claquettes/aubi/issues) avec les dernières
lignes des logs du serveur, votre système, et ce que vous tentiez de faire.
