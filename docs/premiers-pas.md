# Premiers pas

Au premier lancement, aubi n'affiche pas la bibliothèque : il ne sait pas encore
où sont vos fichiers. Un assistant en trois écrans règle ça.

---

## L'assistant

**1. Bienvenue** — choisissez la langue de l'interface, français ou anglais. Le
choix est retenu sur cet appareil et se change à tout moment dans les
Paramètres.

**2. Vos bibliothèques** — déclarez les dossiers à indexer. Pour chacun :

- un **dossier**, tapé au clavier ou choisi avec le bouton « Parcourir » qui
  explore le disque du serveur à partir de la racine média ;
- un **nom**, libre (« Ma musique », « Concerts », « Disque externe ») — laissé
  vide, il reprend le nom du dossier ;
- un **type** : Musique, Concerts ou Livres audio. C'est lui qui décide de la
  rubrique où le contenu apparaîtra.

Ajoutez-en autant que vous voulez : trois dossiers sur trois disques différents
ne posent aucun problème. Un seul suffit pour continuer.

**3. Premier scan** — aubi lit les tags de chaque fichier et en extrait les
pochettes. Vous pouvez entrer tout de suite : le scan continue en tâche de fond,
la bibliothèque se remplit au fur et à mesure. Comptez quelques minutes pour un
millier de titres.

Tant que l'assistant n'est pas terminé, toutes les pages ramènent à lui.

---

## Comment ranger vos fichiers

aubi lit les tags de vos fichiers (titre, artiste, album, numéro de piste,
pochette). Quand ils manquent, il se rabat sur la structure des dossiers. Un
rangement clair donne donc une bien plus belle bibliothèque.

### Bibliothèque de type Musique

```
Ma musique/
├── Daft Punk/
│   ├── Discovery (2001)/
│   │   ├── 01 - One More Time.flac
│   │   ├── 02 - Aerodynamic.flac
│   │   └── cover.jpg
│   └── Homework/
└── Jamiroquai/
    └── Emergency On Planet Earth/
```

Un dossier par artiste, un dossier par album, les fichiers dedans. Le nom du
dossier album sert de titre d'album si le tag manque.

Un sous-dossier nommé **`covers`** marque des reprises : ce qu'il contient est
signalé comme reprise plutôt que comme album original de l'artiste.

```
Ma musique/
└── Nirvana/
    └── covers/
        └── The Man Who Sold The World/
```

Un dossier contenant des titres d'origines très diverses (une playlist
téléchargée, par exemple) est automatiquement présenté comme une **collection**
plutôt que comme un album — voir [Utilisation](utilisation.md#collections).

### Bibliothèque de type Concerts

Un dossier par concert. Son nom devient le titre du concert :

```
Concerts/
├── Radiohead - Glastonbury - 1997/
│   ├── 01 - Lucky.flac
│   └── 02 - Bones.flac
└── Fauve - Olympia - 2014/
```

### Bibliothèque de type Livres audio

Un dossier par livre, un fichier par chapitre. Les chapitres sont ordonnés par
numéro de piste, à défaut par ordre de découverte :

```
Livres audio/
├── Stephen King - Shining/
│   ├── 01 - Chapitre 1.mp3
│   └── 02 - Chapitre 2.mp3
└── Bible/
    ├── Ancien Testament/
    │   └── 01 - Genèse/
    │       └── 01 - Chapitre 1.mp3
    └── Nouveau Testament/
```

Un dossier nommé **`Bible`** est reconnu comme tel et reçoit une page dédiée,
organisée par Ancien et Nouveau Testament.

### Vous avez déjà un rangement à l'ancienne ?

Une bibliothèque de type Musique dont la racine contient les trois dossiers
`music/`, `concerts/` et `audiobooks/` est comprise telle quelle : chaque
sous-dossier alimente sa rubrique. Vous n'avez rien à réorganiser.

### Formats lus

MP3, FLAC, OGG, Opus, M4A, AAC, WAV. Tout le reste est ignoré, y compris les
images, les `.txt` et les `.cue` qui traînent — ils ne gênent pas.

---

## Et après ?

Les fichiers ajoutés ou supprimés dans un dossier surveillé sont repérés en
quelques secondes, et un scan se déclenche tout seul. Vous pouvez aussi en
lancer un à la main depuis **Paramètres → Scanner la bibliothèque**.

Pour ajouter un dossier, en déplacer un ou en masquer un, direction
[Bibliothèques](bibliotheques.md).
