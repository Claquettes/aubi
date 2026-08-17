# aubi

Votre bibliothèque audio, chez vous, sur tous vos appareils.

aubi lit les fichiers audio d'un dossier de votre machine et les sert dans une
interface web installable sur téléphone. Musique, concerts et livres audio, avec
pochettes, playlists, favoris, statistiques d'écoute et reprise de lecture — sans
compte, sans abonnement, sans que rien ne quitte votre disque.

---

## Installation en trois commandes

Il faut [Docker](https://docs.docker.com/get-docker/) et un dossier de fichiers
audio. Rien d'autre.

```bash
git clone https://github.com/Claquettes/aubi.git && cd aubi
```

```bash
cp .env.example .env
```

Ouvrez `.env` et renseignez deux valeurs : un mot de passe pour la base de
données, et le dossier qui contient votre musique.

```bash
docker compose -f docker-compose.standalone.yml up -d
```

L'interface répond sur **http://localhost:8080**. Un assistant vous demande la
langue, vos dossiers, puis lance le premier scan.

La [documentation d'installation](docs/installation.md) détaille les variantes :
accès depuis le téléphone, nom de domaine, intégration derrière un reverse proxy.

---

## Documentation

| Guide | Contenu |
|---|---|
| [Installation](docs/installation.md) | Prérequis, `.env`, démarrage, accès distant, mise à jour, sauvegarde |
| [Premiers pas](docs/premiers-pas.md) | L'assistant, comment ranger vos fichiers, le premier scan |
| [Utilisation](docs/utilisation.md) | Lecteur, sections, playlists, favoris, recherche, statistiques |
| [Bibliothèques](docs/bibliotheques.md) | Ajouter, déplacer, désactiver un dossier ; place occupée |
| [Dépannage](docs/depannage.md) | Ce qui coince en général, et quoi regarder |

---

## Ce que c'est, ce que ce n'est pas

aubi lit **vos** fichiers. Il ne télécharge rien, ne propose aucun catalogue, ne
recommande rien. Pas de comptes multiples non plus : c'est un serveur personnel,
pensé pour une personne (ou un foyer qui se fait confiance).

L'interface est mobile d'abord, installable comme une application depuis le
navigateur, et disponible en français et en anglais.

---

## Sous le capot

React + TypeScript côté interface, NestJS + PostgreSQL côté serveur, le tout en
conteneurs Docker. Les formats lus : MP3, FLAC, OGG, Opus, M4A/AAC, WAV.
