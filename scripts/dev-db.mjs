// Локальный Postgres без установки: качает бинарники PostgreSQL и держит их в темпе.
// Запуск: npm run db (входит в npm run dev). Продакшн-база задаётся через DATABASE_URL.
import EmbeddedPostgres from 'embedded-postgres';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const port = Number(process.env.PG_PORT || 5433);
// данные — во временном каталоге: вне OneDrive и вне репозитория
const dataDir = path.join(os.tmpdir(), 'kvarta-pg-data');

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: 'kvarta',
  password: 'kvarta',
  port,
  persistent: true,
});

async function main() {
  if (!fs.existsSync(path.join(dataDir, 'PG_VERSION'))) {
    console.log(`[db] инициализирую кластер в ${dataDir} ...`);
    await pg.initialise();
  }
  await pg.start();
  try {
    await pg.createDatabase('kvarta');
    console.log('[db] база kvarta создана');
  } catch {
    // база уже есть — это нормально при повторном запуске
  }
  console.log(`[db] postgres://kvarta:kvarta@localhost:${port}/kvarta`);

  let stopping = false;
  const shutdown = async () => {
    if (stopping) return;
    stopping = true;
    try {
      await pg.stop();
    } finally {
      process.exit(0);
    }
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((e) => {
  console.error('[db] не удалось запустить Postgres:', e.message);
  console.error('[db] если кластер побился — удалите папку', dataDir);
  process.exit(1);
});
