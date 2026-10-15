import { createApp } from './app.js';
import { config } from './config.js';
import { initDb, pool } from './db.js';

async function main() {
  await initDb();

  const app = createApp();
  const server = app.listen(config.port, () => {
    console.log(`[api] слушаю http://localhost:${config.port}`);
  });

  let stopping = false;
  const shutdown = async () => {
    if (stopping) return;
    stopping = true;
    server.close();
    await pool.end().catch(() => {});
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown());
  process.on('SIGTERM', () => void shutdown());
}

main().catch((e) => {
  console.error('[api] не удалось запуститься:', e instanceof Error ? e.message : e);
  process.exit(1);
});
