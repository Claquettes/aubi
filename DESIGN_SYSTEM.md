# DESIGN SYSTEM — aubi

## Philosophie

Le design d'aubi est **éditorial et typographique**. Il s'inspire des pochettes de disques vinyl et des revues musicales — pas des apps de streaming grand public. L'interface ne crie pas ; elle présente.

Règles fondamentales :
- La typographie porte 80% de l'identité visuelle
- La couleur est utilisée avec parcimonie — une seule couleur d'accent
- Les espacements sont intentionnels et cohérents
- Pas de border-radius excessif (les cartes ne sont pas des pilules)
- Pas d'ombres portées lourdes — la hiérarchie vient du contraste et de la taille

---

## Tokens de design (CSS custom properties)

À définir dans `/frontend/src/styles/tokens.css` et importés globalement.

### Couleurs

```css
:root {
  /* Fond */
  --color-bg-base:       #0C0C0C;   /* noir profond, fond principal */
  --color-bg-elevated:   #141414;   /* cartes, surfaces légèrement surélevées */
  --color-bg-overlay:    #1C1C1C;   /* modals, drawers */
  --color-bg-subtle:     #242424;   /* hover states, séparateurs de fond */

  /* Texte */
  --color-text-primary:  #F0EDE8;   /* blanc cassé chaud, titres et corps */
  --color-text-secondary:#8A8480;   /* métadonnées, labels secondaires */
  --color-text-tertiary: #4A4745;   /* placeholders, désactivé */

  /* Accent — une seule teinte, utilisée avec rigueur */
  --color-accent:        #D4A853;   /* ambre chaud, référence à l'aube */
  --color-accent-dim:    #8A6A30;   /* accent atténué */
  --color-accent-subtle: #1A1408;   /* fond teinté accent (ex: piste active) */

  /* Statut */
  --color-like:          #C0392B;   /* rouge bordeaux pour les likes */
  --color-playing:       var(--color-accent);

  /* Bordures */
  --color-border:        #2A2826;
  --color-border-focus:  #4A4642;
}
```

### Typographie

Deux familles de polices maximum. Importées en local (pas de Google Fonts en prod).

```css
:root {
  /* Titres — police serif condensée, caractère éditorial */
  --font-display:  'Playfair Display', Georgia, serif;

  /* Corps, UI — mono humaniste, lisible en petit, techy sans être froide */
  --font-body:     'DM Mono', 'Courier New', monospace;

  /* Échelle typographique (en rem, base 16px) */
  --text-2xs:  0.625rem;  /* 10px — métadonnées très petites */
  --text-xs:   0.75rem;   /* 12px — labels, timestamps */
  --text-sm:   0.875rem;  /* 14px — corps secondaire */
  --text-base: 1rem;      /* 16px — corps principal */
  --text-lg:   1.25rem;   /* 20px — sous-titres */
  --text-xl:   1.5rem;    /* 24px — titres de section */
  --text-2xl:  2rem;      /* 32px — titres de page */
  --text-3xl:  3rem;      /* 48px — grands titres (album, artiste) */

  /* Graisses */
  --weight-regular: 400;
  --weight-medium:  500;
  --weight-bold:    700;

  /* Hauteur de ligne */
  --leading-tight:  1.2;
  --leading-normal: 1.5;
  --leading-loose:  1.8;

  /* Espacement de lettres */
  --tracking-tight:  -0.02em;
  --tracking-normal:  0em;
  --tracking-wide:    0.08em;   /* pour les labels uppercase */
  --tracking-widest:  0.15em;
}
```

### Espacement

```css
:root {
  --space-1:   4px;
  --space-2:   8px;
  --space-3:   12px;
  --space-4:   16px;
  --space-5:   20px;
  --space-6:   24px;
  --space-8:   32px;
  --space-10:  40px;
  --space-12:  48px;
  --space-16:  64px;
  --space-20:  80px;
}
```

### Rayons de bordure

```css
:root {
  --radius-sm:   2px;   /* badges, tags */
  --radius-base: 4px;   /* inputs, boutons */
  --radius-lg:   8px;   /* cartes */
  --radius-full: 9999px; /* uniquement pour les avatars/images circulaires */
}
```

### Transitions

```css
:root {
  --ease-default:  cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in:       cubic-bezier(0.4, 0, 1, 1);
  --ease-out:      cubic-bezier(0, 0, 0.2, 1);
  --duration-fast: 120ms;
  --duration-base: 200ms;
  --duration-slow: 350ms;
}
```

### Z-index

```css
:root {
  --z-base:    0;
  --z-above:   10;
  --z-player:  100;   /* barre de lecture persistante */
  --z-drawer:  200;   /* navigation mobile */
  --z-modal:   300;
  --z-toast:   400;
}
```

---

## Composants primitifs

### `<Text>`
Composant typographique de base. Props : `size`, `weight`, `color`, `as` (balise HTML), `uppercase`, `truncate`.

### `<Icon>`
Icônes SVG inline. Bibliothèque : **Lucide** (minimaliste, cohérente). Taille via prop `size`. Couleur via `color` ou `currentColor`.

### `<Button>`
Variants : `primary`, `ghost`, `icon`.  
- `primary` : fond accent, texte sombre  
- `ghost` : sans fond, texte secondaire, hover subtil  
- `icon` : bouton carré, juste une icône  
Pas de variant `outline` ou `danger` dans l'app.

### `<Separator>`
Ligne horizontale fine (`1px`, `--color-border`). Variant `subtle` pour les séparations dans les listes.

### `<Badge>`
Tag textuel inline. Variants : `default`, `accent`. Utilisé pour "Cover", "Live", type de fichier audio.

---

## Composants de layout

### `<PageLayout>`
Structure de page mobile : header + zone scrollable + player fixe en bas. Gère le `padding-bottom` pour ne pas masquer le contenu sous le player.

### `<Stack>`
Flexbox vertical ou horizontal avec `gap` typé sur l'échelle d'espacement.

### `<Grid>`
CSS Grid responsive. Colonnes auto-fill pour les grilles d'albums.

### `<ScrollArea>`
Wrapper avec `-webkit-overflow-scrolling: touch` et scrollbar masquée sur mobile.

---

## Composants media

### `<CoverArt>`
Affiche la pochette d'un album/concert/livre. Fallback : initiales sur fond généré (hash du nom → teinte). Props : `size` (xs, sm, md, lg, xl), `square` (default true).

### `<TrackRow>`
Ligne de liste pour un titre musical.
```
[ N° ] [ CoverArt xs ] [ Titre + Artiste ] [ Duration ] [ LikeButton ]
```
État `active` : N° remplacé par une animation de barres sonores, texte en accent.

### `<AlbumCard>`
Carte verticale pour une grille d'albums.
```
[ CoverArt lg ]
[ Titre album ]
[ Artiste · Année ]
```

### `<ConcertCard>`
Similaire à AlbumCard mais avec date et lieu en metadata.

### `<BookCard>`
Pour les livres audio. Inclut une barre de progression de lecture.

---

## Navigation

### Mobile (principal)
Navigation bottom bar fixe avec 3-4 onglets :
- **Bibliothèque** (icône disque vinyl ou similaire)
- **Musique** / **Concerts** / **Livres** — ou un seul onglet "Parcourir" avec sections
- **Stats**
- **Lecture en cours** (mini-player intégré à la bottom bar si lecture active)

La bottom bar se masque lors du scroll vers le bas, réapparaît au scroll vers le haut.

### Desktop (adaptatif)
Sidebar gauche avec la navigation, contenu principal à droite. Le player reste en bas.

---

## Le Player

Élément central de l'application. Trois états :

### Mini (défaut — ancré en bas)
```
[ CoverArt xs ] [ Titre + Artiste ]  [ ← ] [ ▶/⏸ ] [ → ]
─────────────────────────────────────────── [progress bar fine]
```
Hauteur : ~64px. Tap sur la zone texte/cover → ouvre le Full player.

### Full (modal slide-up)
```
        [ ↓ fermer ]

   [ CoverArt xl, centré ]

   Titre du titre
   Artiste · Album

   [ barre de progression interactive ]
   00:00                        03:45

   [ ← ]  [ ⏮ ]  [ ▶/⏸ ]  [ ⏭ ]  [ → ]

   [ ♡ ]                          [ ≡ queue ]
```

### Background artwork
Quand le full player est ouvert, le fond utilise une version très floue et assombrie de la pochette (backdrop-filter blur).

---

## Iconographie

Utiliser **Lucide React** exclusivement.  
Tailles standardisées : `16`, `20`, `24` (correspondant à xs, sm, md).  
Ne pas mixer les tailles dans un même contexte visuel.

Icônes clés de l'app :
- Lecture : `Play`, `Pause`
- Navigation : `ChevronLeft`, `ChevronRight`, `ChevronDown`
- Like : `Heart` (rempli si liké : `Heart` avec fill)
- Queue : `ListMusic`
- Shuffle : `Shuffle`
- Repeat : `Repeat`, `Repeat1`
- Sections : `Music2` (musique), `Mic2` (concerts), `BookOpen` (livres audio)
- Stats : `BarChart2`
- Scan : `RefreshCw`

---

## Animations

Règles :
- Pas d'animation sur les éléments de liste (trop de mouvement)
- Transitions sur les états interactifs uniquement (hover, focus, active)
- Le player full s'ouvre avec un `transform: translateY` slide-up
- Les barres sonores animées (piste en cours) : 3 barres avec `scaleY` keyframe
- Pas d'animations de chargement skeleton complexes — juste un placeholder de même couleur que `--color-bg-elevated`

---

## Règles CSS globales

Fichier `/frontend/src/styles/global.css` :
- Reset basé sur `@layer base` (pas de normalize.css externe)
- `box-sizing: border-box` universel
- `font-family: var(--font-body)` sur `body`
- `color-scheme: dark` pour les scrollbars système
- `-webkit-tap-highlight-color: transparent` pour le mobile
- `overscroll-behavior: none` sur le body (évite le bounce iOS sur les scrolls de l'app)
- Scrollbar custom : fine, couleur `--color-border`
