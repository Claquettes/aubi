# VISION — aubi

## Concept

**aubi** est une application de streaming audio personnelle, auto-hébergée, mobile-first. Elle centralise toute la bibliothèque audio de son propriétaire : musique, concerts intégraux, livres audio. Elle n'est pas conçue pour être partagée ou multi-utilisateur — c'est une interface intime avec sa propre médiathèque.

Le nom vient de *aube* : l'idée d'une écoute calme, personnelle, sans distraction.

---

## Principes directeurs

### 1. Ownership total
L'utilisateur possède ses fichiers. L'application ne fait que les indexer et les exposer. Aucune dépendance à un service externe pour la lecture. Les fichiers audio restent dans leur répertoire d'origine, montés en volume Docker.

### 2. Mobile-first, PWA
L'interface est conçue pour être utilisée sur téléphone en priorité. L'application doit être installable (PWA) avec un service worker gérant le cache de l'interface et la reprise de lecture. Pas d'application native, mais une expérience qui y ressemble.

### 3. UI minimaliste et éditoriale
Pas de composants UI génériques copiés. Un design system fait maison, typographique, à haute densité d'information quand nécessaire, mais épuré. L'interface s'efface derrière le contenu. Inspiration : revues musicales, interfaces d'équipement audio haut de gamme.

### 4. Données de lecture
Chaque lecture est enregistrée. L'application propose des statistiques : titres les plus écoutés, temps d'écoute par catégorie, évolution dans le temps, heatmap d'activité. Ces données appartiennent à l'utilisateur et restent locales.

### 5. Pas de complexité inutile
Pas d'authentification propre (Authelia gère l'accès). Pas de recommandations algorithmiques. Pas de fonctionnalités sociales. Le produit fait une chose et la fait bien : jouer de l'audio depuis une bibliothèque personnelle.

---

## Trois espaces distincts

### Musique
Bibliothèque musicale classique. Organisation par artiste, album, titre. Distinction entre originaux et covers. Playlists personnalisées, titres likés.

### Concerts
Enregistrements de concerts intégraux. Chaque concert est une entité avec ses propres métadonnées (date, lieu, setlist). Interface adaptée à la lecture continue longue durée.

### Livres audio
Livres audio organisés par ouvrage, auteur, chapitre. Inclut la Bible (organisation spécifique : Livre → Chapitre). Mémorisation de la position de lecture par chapitre.

---

## Ce que l'application n'est pas

- Pas un Spotify clone
- Pas un gestionnaire de fichiers audio
- Pas un outil de tag/édition de métadonnées (les tags ID3 des fichiers sont la source de vérité)
- Pas multi-utilisateur
- Pas accessible depuis internet sans VPN/Authelia

---

## Contraintes techniques

- Stack : **React 18 + TypeScript** (frontend), **NestJS + TypeScript** (backend)
- Base de données : **PostgreSQL**
- Audio : lecture directe via l'API backend (streaming HTTP range requests)
- Déploiement : Docker Compose, intégré au homelab existant (Traefik + Authelia)
- Pas de build-time configuration — tout via variables d'environnement
