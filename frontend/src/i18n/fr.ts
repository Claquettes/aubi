/**
 * Dictionnaire français — source de vérité des clés. `en.ts` doit couvrir
 * exactement les mêmes (TypeScript le vérifie).
 *
 * Pluriel : « singulier|pluriel », choisi avec la variable `count`.
 * Interpolation : `{nom}`.
 */
export const fr = {
  // ─── Navigation ───
  'nav.aria': 'Navigation principale',
  'nav.tagline': 'bibliothèque personnelle',
  'nav.searchLink': 'Rechercher…',
  'nav.section.library': 'Bibliothèque',
  'nav.section.mine': 'Ma sélection',
  'nav.section.explore': 'Explorer',
  'nav.music': 'Musique',
  'nav.concerts': 'Concerts',
  'nav.audiobooks': 'Livres audio',
  'nav.books': 'Livres',
  'nav.playlists': 'Playlists',
  'nav.likes': 'Favoris',
  'nav.stats': 'Statistiques',
  'nav.statsShort': 'Stats',
  'nav.graph': 'Graphe',
  'nav.settings': 'Paramètres',
  'nav.search': 'Recherche',

  // ─── Vocabulaire partagé ───
  'common.album': 'Album',
  'common.albums': 'Albums',
  'common.artist': 'Artiste',
  'common.artists': 'Artistes',
  'common.tracks': 'Titres',
  'common.playlist': 'Playlist',
  'common.collection': 'Collection',
  'common.concert': 'Concert',
  'common.close': 'Fermer',
  'common.back': 'Retour',
  'common.backTitle': 'Retour (Échap)',
  'common.seeAll': 'Tout voir',
  'common.save': 'Enregistrer',
  'common.saving': 'Enregistrement…',
  'common.variousArtists': 'Artistes variés',
  'common.quote': '« {text} »',

  // ─── Décomptes ───
  'count.tracks': '{count} titre|{count} titres',
  'count.albums': '{count} album|{count} albums',
  'count.artists': '{count} artiste|{count} artistes',
  'count.plays': '{count} lecture|{count} lectures',
  'count.listens': '{count} écoute|{count} écoutes',
  'count.launches': '{count} lancement|{count} lancements',
  'count.chapters': '{count} chapitre|{count} chapitres',
  'count.collaborators': '{count} collaborateur|{count} collaborateurs',
  'count.results': '{count} résultat|{count} résultats',
  'count.commonTracks': '{count} titre en commun|{count} titres en commun',

  // ─── Sections de la bibliothèque ───
  'section.music': 'Musique',
  'section.concert': 'Concerts',
  'section.audiobook': 'Livres audio',

  // ─── Accueil musique ───
  'music.filterAlbums': 'Filtrer les albums…',
  'music.filterArtists': 'Filtrer les artistes…',
  'music.sortBy': 'Trier par',
  'music.sort.plays': 'Lectures',
  'music.sort.title': 'Titre',
  'music.sort.year': 'Année',
  'music.sort.recent': 'Récent',
  'music.sort.name': 'Nom',
  'music.order.ascAria': 'Ordre croissant',
  'music.order.descAria': 'Ordre décroissant',
  'music.order.asc': 'Croissant',
  'music.order.desc': 'Décroissant',
  'music.likedOnly': 'Favoris uniquement',

  // ─── Grilles ───
  'grid.noLikedAlbum': 'Aucun album en favori.',
  'grid.noAlbumFor': 'Aucun album pour « {query} ».',
  'grid.noAlbum':
    'Aucun album. Lance un scan de ta bibliothèque dans Paramètres.',
  'grid.noLikedArtist': 'Aucun artiste en favori.',
  'grid.noArtistFor': 'Aucun artiste pour « {query} ».',
  'grid.noArtist': 'Aucun artiste pour le moment.',
  'grid.noCollection':
    'Aucune collection détectée. Les dossiers contenant plusieurs albums (playlists téléchargées) apparaîtront ici automatiquement.',
  'grid.variousArtists': 'Artistes divers',
  'grid.variousArtistsSub': '{count} artiste · 1 titre|{count} artistes · 1 titre',
  'grid.variousArtistsSearch': 'Rechercher un artiste…',
  'grid.variousArtistsEmpty': 'Aucun artiste.',

  // ─── Page album ───
  'album.notFound': 'Album introuvable.',
  'album.editAria': "Modifier l'album",
  'album.toAlbumsAria': 'Remettre dans les albums',
  'album.toPlaylistsAria': 'Déplacer dans les playlists',
  'album.isAlbumTitle': 'C’est un album, pas une playlist',
  'album.isPlaylistTitle': 'C’est une playlist, pas un album',
  'album.listensOfTracks': '{listens} de titres',
  'album.menuAria': 'Options de {title}',
  'album.menuIsAlbum': 'C’est un album',
  'album.menuIsPlaylist': 'C’est une playlist',
  'album.menuSelect': 'Sélectionner',

  // ─── Page artiste ───
  'artist.notFound': 'Artiste introuvable.',
  'artist.empty': 'Aucun contenu pour cet artiste.',

  // ─── Collections ───
  'collection.notFound': 'Collection introuvable.',

  // ─── Recherche ───
  'search.placeholder': 'Rechercher un titre, un album, un artiste…',
  'search.noResult': 'Aucun résultat pour « {query} ».',
  'search.tooShort': 'Tape au moins 2 caractères pour rechercher.',

  // ─── Favoris ───
  'likes.empty': 'Aucun titre liké. Touche le cœur sur un titre.',
  'likes.add': 'Ajouter aux favoris',
  'likes.remove': 'Retirer des favoris',

  // ─── Playlists ───
  'playlist.new': 'Nouvelle',
  'playlist.empty': 'Aucune playlist. Crée-en une avec « Nouvelle ».',
  'playlist.notFound': 'Playlist introuvable.',
  'playlist.deleteAria': 'Supprimer la playlist',
  'playlist.deleteConfirm': 'Supprimer la playlist « {name} » ?',
  'playlist.tracksEmpty':
    "Playlist vide. Ajoute des titres via le bouton + d'un morceau.",
  'playlist.createTitle': 'Nouvelle playlist',
  'playlist.namePlaceholder': 'Nom de la playlist',
  'playlist.descPlaceholder': 'Description (optionnel)',
  'playlist.creating': 'Création…',
  'playlist.create': 'Créer',
  'playlist.addTo': 'Ajouter à une playlist',
  'playlist.addNew': 'Nouvelle playlist',
  'playlist.addEmpty': 'Crée ta première playlist.',
  'playlist.removeTrackAria': 'Retirer de la playlist',

  // ─── Livres audio ───
  'book.bible': 'Bible',
  'book.audiobook': 'Livre audio',
  'book.empty': 'Aucun livre audio pour le moment.',
  'book.notFound': 'Livre introuvable.',
  'book.bibleEmpty': 'Aucun livre biblique indexé.',
  'book.listen': 'Écouter',

  // ─── Concerts ───
  'concert.notFound': 'Concert introuvable.',
  'concert.empty':
    'Aucun concert. Ajoute des enregistrements dans le dossier concerts.',

  // ─── Graphe ───
  'graph.error':
    'Impossible de charger le graphe. Vérifie que le serveur répond, puis recharge la page.',
  'graph.empty':
    'Pas encore de collaborations à visualiser. Le graphe relie les artistes qui partagent un titre.',
  'graph.hint':
    '{artists} artistes, {edges} collaborations, {clusters} groupes. Taille du point = nombre de titres, épaisseur du trait = collaborations partagées, teinte = réseau.',
  'graph.searchPlaceholder': 'Rechercher un artiste…',
  'graph.searchAria': 'Rechercher un artiste dans le graphe',
  'graph.clearAria': 'Effacer la recherche',
  'graph.noResult': 'aucun résultat',
  'graph.zoomIn': 'Zoomer',
  'graph.zoomOut': 'Dézoomer',
  'graph.fit': 'Tout afficher',
  'graph.fullscreen': 'Plein écran',
  'graph.exitFullscreen': 'Quitter le plein écran',
  'graph.openArtist': 'Ouvrir la page artiste',
  'graph.legendTouch':
    'Touche un point pour le détail, double-touche pour ouvrir l’artiste · pince pour zoomer.',
  'graph.legendMouse':
    'Clique un point pour le détail, double-clic pour ouvrir l’artiste · glisse pour déplacer, molette pour zoomer.',

  // ─── Lecteur ───
  'player.collapse': 'Réduire',
  'player.nowPlaying': 'Lecture en cours',
  'player.queue': "File d'attente",
  'player.play': 'Lecture',
  'player.pause': 'Pause',
  'player.previous': 'Précédent',
  'player.next': 'Suivant',
  'player.shuffle': 'Lecture aléatoire',
  'player.repeat': 'Répéter',
  'player.mute': 'Couper le son',
  'player.unmute': 'Rétablir le son',
  'player.volume': 'Volume',
  'player.queueRemove': 'Retirer de la file',
  'player.addToQueue': "Ajouter à la file d'attente",
  'player.addedToQueue': "Ajouté à la file d'attente",

  // ─── Titres ───
  'track.cover': 'reprise',
  'track.menuAria': 'Options du titre',
  'track.addToPlaylist': 'Ajouter à une playlist',
  'track.editInfo': 'Modifier les infos',
  'track.selectTracks': 'Sélectionner des titres',

  // ─── Édition ───
  'edit.albumTitle': "Modifier l'album",
  'edit.albumTitleField': "Titre de l'album",
  'edit.year': 'Année',
  'edit.albumNote':
    "Appliqué en base et aux tags de tous les fichiers MP3 de l'album.",
  'edit.albumSaved': 'Album enregistré',
  'edit.trackTitle': 'Modifier le titre',
  'edit.trackTitleField': 'Titre',
  'edit.artistsField': 'Artiste(s) — séparez par une virgule',
  'edit.artistsPlaceholder': 'Artiste A, Artiste B',
  'edit.trackNote': 'Enregistré en base et dans les tags du fichier (MP3).',
  'edit.trackSaved': 'Titre enregistré',

  // ─── Sélection multiple ───
  'bulk.title': 'Modifier {count} titre|Modifier {count} titres',
  'bulk.hint': 'Laisse un champ vide pour ne pas le modifier.',
  'bulk.artists': 'Artiste(s)',
  'bulk.album': 'Album',
  'bulk.genre': 'Genre',
  'bulk.year': 'Année',
  'bulk.keep': 'Ne pas changer',
  'bulk.apply': 'Appliquer',
  'bulk.done': '{count} titre modifié|{count} titres modifiés',
  'select.cancelAria': 'Annuler la sélection',
  'select.albums': '{count} album sélectionné|{count} albums sélectionnés',
  'select.tracks': '{count} titre sélectionné|{count} titres sélectionnés',
  'select.toPlaylists': 'En playlists',
  'select.toAlbums': 'En albums',
  'select.edit': 'Modifier',
  'select.movedToPlaylists': '{count} albums déplacés dans les playlists',
  'select.movedToPlaylistsOne': 'Déplacé dans les playlists',
  'select.movedToAlbums': '{count} playlists remises dans les albums',
  'select.movedToAlbumsOne': 'Remis dans les albums',
  'select.moveError': 'Impossible de reclasser — réessaie',

  // ─── Paramètres ───
  'settings.title': 'Paramètres',
  'settings.libraryCard': 'Bibliothèque audio',
  'settings.indexed': '{count} titre indexé|{count} titres indexés',
  'settings.lastScan': ' · dernier scan le {date}',
  'settings.error': 'Erreur : {message}',
  'settings.scanning': 'Scan en cours…',
  'settings.scan': 'Scanner la bibliothèque',
  'settings.scanStarted': 'Scan de la bibliothèque lancé',
  'settings.languageCard': 'Langue',
  'settings.languageHint':
    "Langue de l'interface. Le choix est retenu sur cet appareil.",
  'settings.language.fr': 'Français',
  'settings.language.en': 'English',
  'settings.aboutCard': 'À propos',
  'settings.about':
    "aubi — streaming audio personnel auto-hébergé. L'accès est protégé par Authelia ; cette interface se concentre sur l'écoute.",

  // ─── Statistiques : onglets et périodes ───
  'stats.tab.overview': "Vue d'ensemble",
  'stats.tab.habits': 'Habitudes',
  'stats.tab.artists': 'Artistes',
  'stats.tab.albums': 'Albums',
  'stats.tab.tracks': 'Titres',
  'stats.tab.library': 'Bibliothèque',
  'stats.periodAria': 'Période',
  'stats.period.week': '7 jours',
  'stats.period.month': '30 jours',
  'stats.period.year': '1 an',
  'stats.period.all': 'Tout',
  'stats.periodLabel.week': 'sur 7 jours',
  'stats.periodLabel.month': 'sur 30 jours',
  'stats.periodLabel.year': 'sur 1 an',
  'stats.periodLabel.all': 'depuis le début',

  // ─── Statistiques : vue d'ensemble ───
  'stats.emptyPeriod':
    'Aucune écoute {period} — lance un titre, tout se remplit ensuite.',
  'stats.tile.hours': "Heures d'écoute",
  'stats.tile.plays': 'Lectures',
  'stats.tile.playsHint': "{percent} jusqu'au bout",
  'stats.tile.distinctTracks': 'Titres différents',
  'stats.tile.distinctTracksHint': '{percent} de la bibliothèque',
  'stats.tile.distinctArtists': 'Artistes différents',
  'stats.tile.distinctArtistsHint': 'sur {count} au catalogue',
  'stats.tile.activeDays': 'Jours actifs',
  'stats.tile.activeDaysHint': '{duration} par jour actif',
  'stats.tile.albumPlays': 'Albums lancés',
  'stats.tile.albumPlaysHint': '{count} albums touchés',
  'stats.tile.streak': 'Série en cours',
  'stats.tile.streakValue': '{count} j',
  'stats.tile.streakHint': 'record {count} j',
  'stats.tile.likedTracks': 'Titres aimés',
  'stats.tile.likedHint': '{albums} · {artists}',
  'stats.block.listening': 'Écoute · {period}',
  'stats.block.listeningCaption': 'Minutes écoutées par jour.',
  'stats.block.noListening': "Pas encore d'écoute enregistrée.",
  'stats.block.bySection': 'Par catégorie',
  'stats.block.currentArtists': 'Artistes du moment',
  'stats.noPlaysPeriod': 'Aucune écoute sur cette période.',
  'stats.block.records': 'Faits marquants',
  'stats.block.activity': 'Activité · 12 mois',
  'stats.block.activityCaption':
    "Une case par jour, teinte selon le temps d'écoute.",
  'stats.block.recent': 'Dernières écoutes',
  'stats.nothingYet': "Rien pour l'instant.",

  // ─── Statistiques : habitudes ───
  'stats.slot.night': 'Nuit',
  'stats.slot.morning': 'Matin',
  'stats.slot.afternoon': 'Après-midi',
  'stats.slot.evening': 'Soir',
  'stats.block.hour': 'Heure de la journée',
  'stats.block.hourCaption': "Pic d'écoute vers {hour}h.",
  'stats.block.weekday': 'Jour de la semaine',
  'stats.block.punchcard': 'Semaine type',
  'stats.block.punchcardCaption':
    'Croisement jour × heure : où se logent réellement les écoutes.',
  'stats.block.monthly': 'Mois par mois',
  'stats.block.monthlyCaption': 'Volume écouté sur 12 mois.',
  'stats.block.discovery': 'Découvertes',
  'stats.block.discoveryCaption':
    'Titres et artistes entendus pour la première fois.',

  // ─── Statistiques : classements ───
  'stats.block.topArtists': 'Top artistes · {period}',
  'stats.block.topArtistsCaption':
    'Les featurings comptent pour les deux artistes.',
  'stats.block.topAlbums': 'Top albums · {period}',
  'stats.block.topAlbumsCaption':
    "La jauge indique la part de l'album réellement parcourue.",
  'stats.block.topTracks': 'Top titres · {period}',
  'stats.topArtistSub': '{duration} · {tracks} sur {total}',
  'stats.albumCoverage': "{percent} de l'album parcouru",

  // ─── Statistiques : bibliothèque ───
  'stats.lib.tracks': 'Titres',
  'stats.lib.totalDuration': 'Durée totale',
  'stats.lib.totalDurationHint': '{count} jours de lecture continue',
  'stats.lib.onDisk': 'Sur le disque',
  'stats.lib.lossless': 'Sans perte',
  'stats.lib.losslessHint': '{count} titres FLAC / WAV',
  'stats.lib.medianDuration': 'Durée médiane',
  'stats.lib.medianDurationHint': 'moyenne {duration}',
  'stats.lib.longestTrack': 'Plus long titre',
  'stats.lib.neverPlayed': 'Jamais écoutés',
  'stats.lib.neverPlayedHint': '{percent} du catalogue',
  'stats.lib.untouchedAlbums': 'Albums intacts',
  'stats.lib.untouchedAlbumsHint': 'aucun titre encore lancé',
  'stats.lib.formats': 'Formats',
  'stats.lib.formatsCaption': 'Répartition des fichiers du catalogue.',
  'stats.lib.bitrate': 'Débit',
  'stats.lib.bitrateCaption':
    'Paliers ordonnés, du plus compressé au sans perte.',
  'stats.lib.decades': 'Par décennie',
  'stats.lib.decadesCaption': 'Année de sortie des albums.',
  'stats.lib.decadesEmpty':
    "Aucun album n'a d'année renseignée — les balises sont vides.",
  'stats.lib.genres': 'Genres',
  'stats.lib.genresEmpty': 'Aucun genre renseigné dans les balises.',
  'stats.lib.noGenre': 'Sans genre',
  'stats.lib.topArtistsByTracks': 'Artistes les mieux fournis',
  'stats.lib.topArtistsByTracksCaption': 'Par nombre de titres possédés.',
  'stats.lib.tracksValue': '{count} titres',
  'stats.footnote':
    '{tracks} titres · {albums} albums · {artists} artistes · {size} · catégorie dominante : {section}.',

  // ─── Statistiques : faits marquants ───
  'stats.record.bestDay': 'Meilleure journée',
  'stats.record.longestSession': 'Plus longue session',
  'stats.record.longestSessionDetail':
    "{date} · {count} titre d'affilée|{date} · {count} titres d'affilée",
  'stats.record.obsession': 'Obsession',
  'stats.record.obsessionTimes': '{count} ×',
  'stats.record.obsessionDetail': 'en une journée, le {date}',
  'stats.record.bestMonth': 'Meilleur mois',
  'stats.record.discoveries': 'Découvertes',
  'stats.record.discoveriesDetail':
    'titre entendu pour la première fois · {artists}|titres entendus pour la première fois · {artists}',
  'stats.record.empty': "Rien à raconter pour l'instant.",

  // ─── Statistiques : graphiques ───
  'stats.chart.albums': 'Albums',
  'stats.chart.tracks': 'Titres',
  'stats.chart.newTracks': 'Nouveaux titres',
  'stats.chart.newArtists': 'Nouveaux artistes',
  'stats.chart.plays': 'Lectures',
  'stats.chart.listening': 'Écoute',
  'stats.chart.playedTracks': 'Titres joués',
  'stats.chart.distinctTracks': 'Titres différents',
  'stats.chart.share': 'Part',
  'stats.chart.hourRange': '{from}h – {to}h',
  'stats.chart.less': 'Moins',
  'stats.chart.more': 'Plus',
  'stats.chart.total': 'au total',
  'stats.chart.noData': 'Pas encore de données.',
  'stats.heat.cell': '{day} — {duration}, {plays}',
  'stats.heat.empty': '{day} — rien',
  'stats.punch.cell': '{day} {hour}h — {plays}',
  'stats.prop.tooltip': '{label} — {count} {unit} ({percent})',
  'stats.prop.unit': 'titres',

  'common.cancel': 'Annuler',

  // ── Bibliothèques ──
  'libraries.addTitle': 'Ajouter une bibliothèque',
  'libraries.editTitle': 'Modifier la bibliothèque',
  'libraries.pathLabel': 'Dossier',
  'libraries.nameLabel': 'Nom',
  'libraries.namePlaceholder': 'Ma musique',
  'libraries.typeLabel': 'Type',
  'libraries.browse': 'Parcourir',
  'libraries.add': 'Ajouter',
  'libraries.save': 'Enregistrer',
  'libraries.saving': 'Enregistrement…',
  'libraries.type.musicHint':
    'Arborescence attendue : Artiste / Album / titres. Un sous-dossier « covers » marque des reprises.',
  'libraries.type.concertHint':
    'Un dossier par concert, par exemple « Artiste - Lieu - Date ».',
  'libraries.type.audiobookHint':
    'Un dossier par livre, un fichier par chapitre. Un dossier « Bible » est reconnu comme tel.',
  'libraries.pickFolder': 'Choisir un dossier',
  'libraries.parentFolder': 'Dossier parent',
  'libraries.noSubfolder': 'Aucun sous-dossier ici.',
  'libraries.audioHere':
    '{count} fichier audio dans ce dossier|{count} fichiers audio dans ce dossier',
  'libraries.pickThis': 'Choisir ce dossier',
  'libraries.tracks': '{count} titre|{count} titres',
  'libraries.diskFree': '{size} libres',
  'libraries.lastScan': 'Scannée le {date}',
  'libraries.neverScanned': 'Jamais scannée',
  'libraries.hidden': 'Masquée — {count} titre conservé|Masquée — {count} titres conservés',
  'libraries.enable': 'Activer',
  'libraries.disable': 'Désactiver',
  'libraries.scan': 'Scanner',
  'libraries.edit': 'Modifier',
  'libraries.remove': 'Supprimer',
  'libraries.confirmRemove': 'Confirmer',
  'libraries.removeHint':
    "La bibliothèque disparaît d'aubi ; les fichiers restent sur le disque.",
  'libraries.unavailable': 'Dossier introuvable ou illisible par le serveur.',
  'libraries.created': 'Bibliothèque ajoutée',
  'libraries.saved': 'Bibliothèque enregistrée',
  'libraries.removed': '« {name} » supprimée',
  'libraries.enabled': 'Bibliothèque activée',
  'libraries.disabled': 'Bibliothèque désactivée',
  'libraries.scanStarted': 'Scan lancé',

  // ── Première configuration ──
  'setup.stepsAria': 'Étapes de la configuration',
  'setup.welcomeTitle': 'Bienvenue',
  'setup.welcomeText':
    'aubi diffuse votre bibliothèque audio depuis votre propre machine. Trois écrans suffisent : la langue, vos dossiers, le premier scan.',
  'setup.start': 'Commencer',
  'setup.librariesTitle': 'Vos bibliothèques',
  'setup.librariesText':
    "Indiquez les dossiers à indexer. Le type d'une bibliothèque décide de la rubrique où son contenu apparaît.",
  'setup.mediaRoot': 'Le serveur explore à partir de {path}.',
  'setup.back': 'Retour',
  'setup.next': 'Continuer',
  'setup.needOne': 'Ajoutez au moins un dossier pour continuer.',
  'setup.scanTitle': 'Premier scan',
  'setup.scanText':
    'aubi lit les tags de chaque fichier et en extrait les pochettes. Le scan continue en tâche de fond : vous pouvez entrer tout de suite.',
  'setup.indexed': '{count} titre indexé|{count} titres indexés',
  'setup.enter': 'Entrer dans aubi',
  'setup.scanBackground':
    'Les bibliothèques se modifient à tout moment depuis les Paramètres.',

  // ── Erreurs renvoyées par l'API ──
  'errors.library.path.absolute': 'Le chemin doit être absolu (commencer par « / »).',
  'errors.library.path.notFound': "Ce dossier n'existe pas sur le serveur.",
  'errors.library.path.notDirectory': "Ce chemin n'est pas un dossier.",
  'errors.library.path.unreadable': "Le serveur n'a pas le droit de lire ce dossier.",
  'errors.library.path.conflict': 'Ce dossier chevauche une bibliothèque existante.',
  'errors.library.notFound': 'Bibliothèque introuvable.',
  'errors.library.disabled': 'Cette bibliothèque est désactivée.',
  'errors.browse.outsideRoot': 'Dossier hors de la racine autorisée.',
  'errors.browse.notFound': 'Dossier introuvable.',
  'errors.browse.unreadable': 'Dossier illisible.',
  'errors.setup.noLibrary': 'Ajoutez au moins une bibliothèque.',

  // ── Paramètres : bibliothèques et stockage ──
  'settings.librariesCard': 'Bibliothèques',
  'settings.librariesHint':
    "Les dossiers scannés par aubi. Une bibliothèque désactivée disparaît de l'application ; ses fichiers, ses likes et ses statistiques restent intacts.",
  'settings.noLibrary': 'Aucune bibliothèque déclarée.',
  'settings.storageCard': 'Place occupée',
  'settings.figure.tracks': 'Titres',
  'settings.figure.size': 'Sur le disque',
  'settings.figure.duration': 'Durée',
  'settings.figure.albums': 'Albums',
  'settings.figure.artists': 'Artistes',
  'settings.hidden':
    '{count} titre masqué ({size}) dans les bibliothèques désactivées.|{count} titres masqués ({size}) dans les bibliothèques désactivées.',
  'settings.disk': '{free} libres sur {total} — {path}',
} as const;
