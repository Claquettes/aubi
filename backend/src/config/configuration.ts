import { homedir } from 'os';

export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  databaseUrl: process.env.DATABASE_URL,
  /**
   * Racine proposée par le navigateur de dossiers de l'application. En Docker,
   * elle est montée à l'identique (même chemin dedans et dehors) : ce qu'on
   * choisit dans l'interface est le vrai chemin de la machine.
   */
  mediaRoot: process.env.AUBI_MEDIA_ROOT ?? process.env.MUSIC_PATH ?? homedir(),
  /** Hérité : ne sert plus qu'à créer la première bibliothèque à la migration. */
  musicPath: process.env.MUSIC_PATH ?? null,
  coversPath: process.env.COVERS_PATH ?? './static/covers',
  scanOnStart: process.env.SCAN_ON_START !== 'false',
  nodeEnv: process.env.NODE_ENV ?? 'development',
});
