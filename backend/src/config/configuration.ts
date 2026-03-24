export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  databaseUrl: process.env.DATABASE_URL,
  musicPath: process.env.MUSIC_PATH ?? '/music',
  coversPath: process.env.COVERS_PATH ?? './static/covers',
  scanOnStart: process.env.SCAN_ON_START !== 'false',
  nodeEnv: process.env.NODE_ENV ?? 'development',
});
