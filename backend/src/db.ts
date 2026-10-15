import bcrypt from 'bcryptjs';
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
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new';

  CREATE TABLE IF NOT EXISTS products (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name       text NOT NULL UNIQUE,
    roast      text NOT NULL,
    notes      text NOT NULL,
    hint       text NOT NULL DEFAULT '',
    weight     text NOT NULL DEFAULT '250 г',
    price      integer NOT NULL,
    is_active  boolean NOT NULL DEFAULT true,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS subscriptions (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id    uuid REFERENCES leads(id) ON DELETE SET NULL,
    name       text NOT NULL,
    phone      text NOT NULL,
    coffee     text NOT NULL DEFAULT '',
    status     text NOT NULL DEFAULT 'active'
               CHECK (status IN ('active', 'paused', 'cancelled')),
    started_at date NOT NULL DEFAULT CURRENT_DATE,
    created_at timestamptz NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS settings (
    key   text PRIMARY KEY,
    value text NOT NULL
  );

  CREATE TABLE IF NOT EXISTS admin_users (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    login         text NOT NULL UNIQUE,
    password_hash text NOT NULL,
    created_at    timestamptz NOT NULL DEFAULT now()
  );
`;

const seedProducts = [
  {
    name: 'Эфиопия Иргачеффе',
    roast: 'Светлая',
    notes: 'цветочный, бергамот',
    hint: 'Для воронки и чёрного кофе без молока',
    weight: '250 г',
    price: 32,
    sort_order: 1,
  },
  {
    name: 'Колумбия Уила',
    roast: 'Средняя',
    notes: 'карамель, красное яблоко',
    hint: 'Универсальная: и в фильтр, и с молоком',
    weight: '250 г',
    price: 29,
    sort_order: 2,
  },
  {
    name: 'Бразилия Серрадо',
    roast: 'Под эспрессо',
    notes: 'орех, шоколад',
    hint: 'Плотная, для эспрессо и молочных напитков',
    weight: '250 г',
    price: 26,
    sort_order: 3,
  },
  {
    name: 'Дрип-пакеты, ассорти',
    roast: 'Ассорти',
    notes: 'по пакетику каждого сорта',
    hint: 'Кофе в дорогу: кружка, кипяток — и готово',
    weight: '10 штук',
    price: 18,
    sort_order: 4,
  },
];

const seedSettings: Record<string, string> = {
  sub_title: 'Две пачки каждый месяц',
  sub_description:
    '2 пачки по 250 г раз в месяц, доставка бесплатная. Сорт можно менять — перед обжаркой спросим, что вам интереснее. Оплата раз в месяц.',
  sub_price: '54',
};

async function seed(): Promise<void> {
  for (const p of seedProducts) {
    await pool.query(
      `INSERT INTO products (name, roast, notes, hint, weight, price, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (name) DO NOTHING`,
      [p.name, p.roast, p.notes, p.hint, p.weight, p.price, p.sort_order],
    );
  }

  for (const [key, value] of Object.entries(seedSettings)) {
    await pool.query(
      'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING',
      [key, value],
    );
  }

  await pool.query(
    `INSERT INTO admin_users (login, password_hash)
     VALUES ($1, $2)
     ON CONFLICT (login) DO NOTHING`,
    ['admin', bcrypt.hashSync('admin', 10)],
  );
}

export async function initDb(): Promise<void> {
  await pool.query(schema);
  await seed();
}
