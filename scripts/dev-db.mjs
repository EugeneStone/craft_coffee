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
  // UTF-8 здесь не задаём: если проект лежит в пути с кириллицей (OneDrive!),
  // initdb падает. Кластер в системной кодировке, а клиент общается в UTF-8 —
  // см. client_encoding в backend/src/db.ts
});

async function main() {
  if (!fs.existsSync(path.join(dataDir, 'PG_VERSION'))) {
    console.log(`[db] инициализирую кластер в ${dataDir} ...`);
    await pg.initialise();
  }
  await pg.start();
  // CREATE DATABASE не умеет IF NOT EXISTS — сперва проверяем, что базы ещё нет,
  // иначе Postgres печатает в лог ERROR при каждом запуске
  const bootClient = pg.getPgClient();
  await bootClient.connect();
  try {
    const exists = await bootClient.query(
      "SELECT 1 FROM pg_database WHERE datname = 'kvarta'",
    );
    if (exists.rowCount === 0) {
      await pg.createDatabase('kvarta');
      console.log('[db] база kvarta создана');
    }
  } finally {
    await bootClient.end();
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
