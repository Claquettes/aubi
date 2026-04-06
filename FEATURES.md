# FEATURES — aubi

Spécifications fonctionnelles détaillées. Chaque section décrit le comportement attendu, les états UI, et les interactions clés.

---

## 1. Player audio global

### État global (Zustand store : `usePlayerStore`)

```typescript
interface PlayerState {
  currentTrack: Track | null
  queue: Track[]
  queueIndex: number
  isPlaying: boolean
  progress: number           // 0–1
  currentTimeMs: number
  volume: number             // 0–1
  isShuffle: boolean
  repeatMode: 'none' | 'one' | 'all'
  source: string             // origine de la lecture
}
```

### Comportements

- **Lecture continue** : à la fin d'un titre, passe automatiquement au suivant dans la queue
- **Shuffle** : mélange la queue à la volée, garde la piste actuelle en première position
- **Repeat one** : rejoue le titre courant indéfiniment
- **Repeat all** : boucle sur la queue entière
- **Seek** : clic/drag sur la barre de progression → seek dans le flux audio
- **Persistent** : l'état du player survit à la navigation entre pages

### Reporting de lecture

- Un événement `POST /api/v1/stats/play` est envoyé quand :
  - Le titre se termine naturellement (`completed: true`)
  - L'utilisateur skip après avoir écouté >30 secondes (`completed: false`)
  - Pas d'événement si skip en moins de 5 secondes (évite le spam)

### Livres audio — comportements spéciaux

- La position est sauvegardée toutes les 10 secondes (`PATCH /api/v1/audiobooks/progress/:trackId`)
- Reprise automatique à la dernière position lors de la lecture d'un chapitre
- Pas de shuffle ni repeat pour les livres audio

---

## 2. Section Musique

### Page d'accueil musique

Sections :
1. **Récemment écouté** — 6 derniers albums/artistes écoutés
2. **Vos favoris** — 4 titres les plus joués ce mois
3. **Albums récents** — classés par date d'ajout en base

### Parcours Artistes

- Liste de tous les artistes (grille avec CoverArt)
- Filtre : tous / originaux uniquement / covers uniquement
- Page artiste :
  - Grands albums originaux
  - Section "Covers" séparée si l'artiste a des covers
  - Tous les titres (avec scroll infini)

### Parcours Albums

- Grille d'albums (2 colonnes mobile, 3-4 desktop)
- Page album :
  - Pochette en header pleine largeur avec gradient → fond
  - Liste des titres avec numéro, titre, durée
  - Bouton "Lire" (lance tout l'album) + "Shuffle"
  - Badge "Cover" sur les albums de covers

### Titres likés

- Liste dédiée, accessible depuis la navigation
- Triée par date de like desc par défaut
- Permet lecture dans l'ordre ou shuffle

---

## 3. Section Concerts

### Page liste des concerts

- Liste verticale (pas grille) — chaque concert est une ligne élargie avec :
  - Pochette (si disponible)
  - Nom de l'artiste
  - Lieu + date
  - Durée totale
  - Nombre de titres

### Page concert

- Header : pochette + titre + métadonnées (lieu, date, notes/setlist)
- Liste des titres numérotés
- Bouton "Lire le concert" — lecture depuis le début

### Comportement lecteur

- Pas de shuffle (un concert se lit dans l'ordre)
- Repeat all fonctionne
- Le titre affiché dans le mini-player indique "[Concert] Titre"

---

## 4. Section Livres audio

### Page liste des livres

- Liste avec couverture, titre, auteur
- Badge "Bible" pour les entrées Bible
- Barre de progression globale (% du livre écouté)

### Page livre

- Header : couverture + titre + auteur + progression
- Liste des chapitres avec :
  - Numéro et titre
  - Durée
  - Indicateur de position si en cours (ex: "En cours — 12:34")
  - Coche si terminé

### Bible — organisation spéciale

- Page Bible séparée
- Deux sections : Ancien Testament / Nouveau Testament
- Chaque section affiche les livres bibliques
- Page livre biblique → liste des chapitres
- Navigation rapide entre chapitres (scroll avec titres flottants)

### Reprise

- Un bandeau "Reprendre : [Titre chapitre] — 12:34" apparaît en haut si une lecture est en cours sur n'importe quel livre

---

## 5. Playlists

### Création

- Bouton "+" dans l'écran playlists ou depuis le menu contextuel d'un titre
- Nom requis, description optionnelle
- Création immédiate, modification possible

### Gestion

- Depuis la liste des playlists : tap long ou swipe → options (renommer, supprimer)
- Depuis la page playlist : mode édition toggle
  - Réordonnancement par drag-and-drop (handle à gauche)
  - Suppression de titre (swipe ou icône poubelle)

### Ajout de titres

- Depuis n'importe quelle vue titre : menu contextuel → "Ajouter à une playlist"
- Modal de sélection de playlist avec option "Nouvelle playlist"
- Feedback toast : "Ajouté à [Playlist Name]"

### Lecture

- Bouton "Lire" lance depuis le début
- Bouton "Shuffle" mélange
- Tap sur un titre → lecture depuis ce titre dans la queue de la playlist

---

## 6. Recherche

- Barre de recherche globale accessible depuis toutes les sections
- Recherche en temps réel (debounce 300ms)
- Résultats groupés : Titres / Albums / Artistes / Concerts / Livres
- Historique de recherche local (localStorage, 10 derniers termes)
- Résultats vides : message adapté avec suggestion de rescan si bibliothèque vide

---

## 7. Statistiques

### Dashboard stats

Accessible depuis la navigation principale.

#### Bloc 1 — Vue d'ensemble
- Temps total d'écoute (toutes périodes)
- Nombre de titres différents écoutés
- Série actuelle (jours consécutifs d'écoute)

#### Bloc 2 — Heatmap calendrier
- 12 mois glissants (style GitHub contribution graph)
- Couleur = intensité d'écoute du jour
- Tap sur un jour → détail du jour

#### Bloc 3 — Top titres
- Sélecteur période : semaine / mois / année / tout
- Top 10 titres les plus joués
- Avec bar chart horizontale relative

#### Bloc 4 — Répartition par section
- Donut chart ou bar chart : % musique / concerts / livres
- Sélecteur période

#### Bloc 5 — Évolution mensuelle
- Ligne chart du nombre d'heures d'écoute par semaine (3 derniers mois)

### Librairie de graphiques
Utiliser **Recharts** (React-native, léger, customisable) ou **Chart.js** avec react-chartjs-2.  
Les graphiques doivent respecter le design system : couleurs `--color-accent`, fonds `--color-bg-elevated`, texte `--color-text-secondary`.

---

## 8. Scanner

### Déclenchement manuel

- Bouton "Synchroniser la bibliothèque" dans les paramètres ou accessible depuis un menu caché
- Indicateur de scan en cours (animation subtile dans la navigation)
- Notification toast à la fin : "Scan terminé — 3241 titres indexés"

### Scan automatique

- Au démarrage du backend, un scan incrémental se déclenche si la dernière sync date de plus de 1 heure
- `chokidar` surveille les changements en temps réel pour les ajouts/suppressions

---

## 9. PWA & Offline

### Manifest

- `name`: "aubi"
- `short_name`: "aubi"
- `theme_color`: `#0C0C0C`
- `background_color`: `#0C0C0C`
- `display`: `standalone`
- `orientation`: `portrait`
- Icônes : 192x192, 512x512 (design minimaliste, lettre "a" stylisée)

### Service Worker (Workbox)

- **Cache shell** (cache-first) : HTML, CSS, JS bundles
- **Cache pochettes** (stale-while-revalidate, max 200 entrées) : `/api/v1/covers/*`
- **Cache API** (network-first, fallback cache) : listes d'albums, artistes (données légères)
- **Pas de cache** : flux audio (trop volumineux)

### Comportement offline

- Navigation dans la bibliothèque possible si données en cache
- Message "Lecture indisponible — connexion requise" si tentative de lecture offline
- Indicateur discret de statut réseau dans le header

---

## 10. Paramètres

Page paramètres minimale :
- **Bibliothèque** : bouton "Rescan", statut dernier scan, nombre de titres
- **Lecture** : volume par défaut, crossfade (optionnel v2)
- **About** : version de l'app
