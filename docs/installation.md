# Installation

## Ce qu'il vous faut

- **Docker** avec le plugin Compose ([guide officiel](https://docs.docker.com/get-docker/)).
  Vérifiez : `docker compose version` doit répondre.
- **Un dossier de fichiers audio** sur la machine, quelque part.
- **~1 Go d'espace** pour les images Docker, plus les pochettes extraites
  (quelques centaines de Mo pour une grosse bibliothèque). Vos fichiers audio ne
  sont **jamais** copiés : aubi les lit sur place.

aubi tourne aussi bien sur un vieux portable, un Raspberry Pi 4 ou un serveur
loué. Comptez quelques minutes de scan pour 1 000 titres.

---

## 1. Récupérer le projet

```bash
git clone https://github.com/Claquettes/aubi.git && cd aubi
```

## 2. Régler deux valeurs

```bash
cp .env.example .env
```

Ouvrez `.env` dans un éditeur. Deux lignes comptent :

```bash
# Mot de passe de la base de données. Inventez-en un, il reste sur la machine.
AUBI_DB_PASSWORD=un_mot_de_passe_solide

# Le dossier à partir duquel vous pourrez choisir vos bibliothèques.
AUBI_MEDIA_ROOT=/home/vous/Musique
```

**`AUBI_MEDIA_ROOT` mérite une explication.** C'est la *racine explorable* : le
dossier que le serveur a le droit de voir. Vous choisirez ensuite, depuis
l'application, quels sous-dossiers indexer. Voyez large sans excès :

| Votre situation | Bonne valeur |
|---|---|
| Tout est dans un dossier | `/home/vous/Musique` |
| Musique et livres audio dans des dossiers séparés | `/home/vous` (leur parent commun) |
| Plusieurs disques durs | `/mnt` (leur point de montage commun) |

Ce dossier est monté **à l'identique** dans le conteneur : le chemin affiché
dans l'application est le vrai chemin de votre machine. Pas de traduction, pas
de surprise.

Pour le changer plus tard, modifiez `.env` et relancez `docker compose … up -d`.

## 3. Démarrer

```bash
docker compose -f docker-compose.standalone.yml up -d
```

La première fois, Docker construit les images : comptez quelques minutes. Puis
ouvrez **http://localhost:8080** — l'assistant de première configuration vous
attend, et [Premiers pas](premiers-pas.md) prend le relais.

Pour utiliser un autre port que 8080, ajoutez `AUBI_PORT=9000` dans `.env`.

---

## Y accéder depuis le téléphone

Sur le même réseau (Wi-Fi de la maison), remplacez `localhost` par l'adresse IP
locale de la machine : `http://192.168.1.42:8080`. Pour trouver cette adresse :

```bash
hostname -I | awk '{print $1}'
```

Depuis le navigateur du téléphone, le menu propose « Ajouter à l'écran
d'accueil » : aubi s'installe alors comme une application, sans barre
d'adresse.

> **Depuis l'extérieur de chez vous**, ne publiez pas le port 8080 sur Internet :
> aubi n'a pas de page de connexion, quiconque connaît l'adresse entre. Passez
> par un VPN (WireGuard, Tailscale) ou par un reverse proxy avec authentification
> — voir plus bas.

---

## Installation derrière un reverse proxy

Le fichier `docker-compose.yml` (sans `-standalone`) est prévu pour un homelab
déjà équipé de [Traefik](https://traefik.io/) et
[Authelia](https://www.authelia.com/) : certificats Let's Encrypt automatiques,
authentification devant l'application, réseau `homelab_proxy` partagé.

```bash
# .env : DOMAIN en plus des deux autres variables
docker compose -f docker-compose.yml up -d
```

L'application répond alors sur `https://aubi.votre-domaine.fr`.

> Précisez toujours `-f docker-compose.yml`. Sans ce drapeau, Docker Compose
> ajoute automatiquement `docker-compose.override.yml`, qui est le mode
> développement (rechargement à chaud, ports 5173 et 3000).

Avec un autre reverse proxy (Caddy, nginx, NPM), partez du fichier standalone et
faites pointer votre proxy sur le port publié. L'interface et l'API vivent sur
la même origine : une seule règle suffit.

---

## Mettre à jour

```bash
git pull
docker compose -f docker-compose.standalone.yml up -d --build
```

Les migrations de base de données s'appliquent toutes seules au démarrage du
serveur. Vos titres, favoris, playlists et statistiques sont conservés.

## Sauvegarder

Deux volumes Docker portent tout ce qu'aubi a créé :

- `aubi_db` — favoris, playlists, statistiques, réglages, index de la bibliothèque
- `aubi_covers` — pochettes extraites (régénérables par un scan)

Sauvegarder la base :

```bash
docker exec aubi_db pg_dump -U aubi aubi > sauvegarde-aubi.sql
```

Restaurer :

```bash
cat sauvegarde-aubi.sql | docker exec -i aubi_db psql -U aubi -d aubi
```

Vos fichiers audio, eux, sont là où vous les avez toujours rangés — aubi n'y
touche pas, sauf si vous éditez des métadonnées depuis l'application (voir
[Utilisation](utilisation.md#corriger-les-métadonnées)).

## Arrêter, désinstaller

```bash
docker compose -f docker-compose.standalone.yml down          # arrêter
docker compose -f docker-compose.standalone.yml down -v       # + effacer les données d'aubi
```

`down -v` supprime les deux volumes : favoris, playlists et statistiques sont
perdus. Vos fichiers audio ne sont pas concernés.

---

## Réglages avancés

Variables lues par le serveur, à ajouter dans `.env` ou dans le fichier compose :

| Variable | Rôle | Défaut |
|---|---|---|
| `AUBI_MEDIA_ROOT` | Racine explorable depuis l'application | dossier de l'utilisateur |
| `AUBI_DB_PASSWORD` | Mot de passe PostgreSQL | — |
| `AUBI_PORT` | Port de l'interface (standalone) | `8080` |
| `DOMAIN` | Domaine du homelab (compose Traefik) | — |
| `COVERS_PATH` | Où sont écrites les pochettes | `/app/covers` |
| `SCAN_ON_START` | Scan au démarrage si le dernier date de plus d'une heure | `true` |
| `PORT` | Port d'écoute de l'API dans le conteneur | `3000` |

## Développer

Un script lance la pile en mode développement (rechargement à chaud des deux
côtés) :

```bash
./start.sh            # démarrage
./start.sh --build    # après modification d'un Dockerfile
./start.sh --install  # après ajout d'une dépendance npm
./start.sh --migrate  # jouer les migrations en attente
./stop.sh             # arrêt
```

L'interface est alors sur http://localhost:5173 et l'API sur
http://localhost:3000/api/v1.

### Tester une installation neuve

Pour vérifier ce que vit un nouvel utilisateur — images de production, migrations
au démarrage, assistant de première configuration — sans toucher à votre pile de
développement ni à vos données.

La pile de dev réserve les noms `aubi_backend`, `aubi_db` et les volumes du même
nom. On les neutralise pour que le test vive à côté, dans son propre projet :

```bash
sed -e '/container_name:/d' -e '/^    name: aubi_/d' \
    docker-compose.standalone.yml > /tmp/aubi-test.yml
```

Préparez un petit dossier de test (quelques fichiers suffisent : un scan complet
n'apporte rien de plus ici) :

```bash
mkdir -p /tmp/aubi-media/Un\ Artiste/Un\ Album
cp ~/Musique/*.mp3 /tmp/aubi-media/Un\ Artiste/Un\ Album/   # 5 ou 6 fichiers
```

Puis lancez la pile de test, sur son propre port et ses propres volumes :

```bash
AUBI_MEDIA_ROOT=/tmp/aubi-media AUBI_DB_PASSWORD=test AUBI_PORT=8090 \
  docker compose -p aubi-test -f /tmp/aubi-test.yml --project-directory . up -d --build
```

Ouvrez http://localhost:8090 : l'assistant doit apparaître comme au premier
jour. Déroulez-le, puis vérifiez que la bibliothèque s'affiche, qu'une pochette
se charge et qu'un titre se lit.

Tout effacer à la fin (le `-v` supprime les volumes du test, pas ceux de votre
pile de dev) :

```bash
AUBI_MEDIA_ROOT=/tmp/aubi-media AUBI_DB_PASSWORD=test \
  docker compose -p aubi-test -f /tmp/aubi-test.yml --project-directory . down -v
rm -rf /tmp/aubi-media /tmp/aubi-test.yml
```
