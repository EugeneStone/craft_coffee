import { Pool } from 'pg';
import { config } from './config.js';

export const pool = new Pool({
  connectionString: config.databaseUrl,
  // локальный кластер на Windows может быть в cp1251 (путь с кириллицей) —
  // договариваемся с сервером об UTF-8 на уровне протокола
  client_encoding: 'utf8',
  // у облачных баз (Neon и т.п.) в строке подключения есть sslmode=require
  ssl: /sslmode=require/.test(config.databaseUrl)
    ? { rejectUnauthorized: false }
    : undefined,
  max: 5,
});

const schema = `
  CREATE TABLE IF NOT EXISTS leads (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name         text NOT NULL,
    phone        text NOT NULL,
    interest     text NOT NULL CHECK (interest IN ('subscription', 'order', 'question')),
    comment      text,
    utm_source   text,
    utm_medium   text,
    utm_campaign text,
    utm_content  text,
    utm_term     text,
    referrer     text,
    page_url     text,
    created_at   timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads (created_at DESC);
`;

export async function initDb(): Promise<void> {
  await pool.query(schema);
}
