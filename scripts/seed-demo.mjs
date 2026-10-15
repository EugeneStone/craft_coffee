// Наполнение базы демо-заявками — чтобы админка и метрики выглядели живыми:
// ~55 заявок за последний месяц (Instagram / Яндекс / без метки), со статусами
// и комментариями, плюс несколько подписок. Работает против любой базы:
//
//   npm run seed:demo                                  (локальная, :5433)
//   DATABASE_URL='postgres://…' npm run seed:demo      (любая другая, в т.ч. Neon)
//
// Идемпотентен: свои прошлые записи помечает utm_content = 'demo-seed'
// и при повторном запуске заменяет их, не трогая настоящие заявки.
import pg from 'pg';

const url =
  process.env.DATABASE_URL ||
  'postgres://kvarta:kvarta@localhost:5433/kvarta';

const pool = new pg.Pool({
  connectionString: url,
  client_encoding: 'utf8',
  ssl: /sslmode=require/.test(url) ? { rejectUnauthorized: false } : undefined,
  max: 3,
});

// Детерминированный ГПСЧ — повторный запуск даёт те же данные (кроме дат,
// они отсчитываются от «сейчас»).
function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20261015);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const chance = (p) => rand() < p;

const NAMES = [
  'Мария Ж.', 'Артём И.', 'Юлия Н.', 'Иван Т.', 'Лиза З.', 'Андрей Ч.',
  'Виктор Г.', 'Вероника А.', 'Ирина Ш.', 'Максим Ф.', 'Глеб У.', 'Роман Я.',
  'Ольга П.', 'Дмитрий К.', 'Елена С.', 'Марта Е.', 'Настя Л.', 'Алексей Б.',
  'Павел Д.', 'Катерина Р.', 'Полина О.', 'Анна М.', 'Сергей В.', 'Татьяна Б.',
  'Кирилл Н.', 'София Г.', 'Никита Р.', 'Алиса В.', 'Егор Л.', 'Дарья С.',
];

function randomPhone() {
  const code = pick(['25', '29', '33', '44']);
  let rest = '';
  for (let i = 0; i < 7; i++) rest += Math.floor(rand() * 10);
  return `+375${code}${rest}`;
}

const COMMENTS = {
  subscription: [
    'Хочу попробовать подписку — пью в основном фильтр',
    'Подписка на двоих, любим с молоком',
    'Интересует подписка, но сначала хочу взять одну пачку на пробу',
    'Нужно чередование: неделю фильтр, неделю эспрессо',
    'Можно ли начать подписку со следующего месяца?',
    'Пьём много кофе — подписка выглядит выгоднее',
  ],
  order: [
    'Хочу Эфиопию, 2 пачки',
    'Интересует Бразилия под эспрессо, есть в наличии?',
    'Нужны дрип-пакеты в подарок',
    'Возьму пачку Колумбии, можно самовывоз?',
    'Собираю заказ на офис, 5 пачек',
    'Понравилась Колумбия из прошлого заказа, повторите',
  ],
  question: [
    'Как хранить зерно, чтобы не выдыхалось?',
    'Есть ли доставка в Боровляны?',
    'Какой помол под гейзерную кофеварку?',
    'Можно ли оплатить картой при получении?',
    'Когда следующая обжарка?',
    'Дарите ли что-то к подписке?',
  ],
};

const UTM_SETS = {
  instagram: [
    { utm_source: 'instagram', utm_medium: 'social', utm_campaign: 'ig_stories' },
    { utm_source: 'instagram', utm_medium: 'social', utm_campaign: 'ig_reels' },
    { utm_source: 'ig', utm_medium: 'stories', utm_campaign: 'reels_kvarta' },
  ],
  yandex: [
    { utm_source: 'yandex', utm_medium: 'cpc', utm_campaign: 'search_kvarta' },
    { utm_source: 'yandex', utm_medium: 'cpc', utm_campaign: 'brand_kvarta' },
    { utm_source: 'yandex_direct', utm_medium: 'cpc', utm_campaign: 'coffee_minsk' },
  ],
  none: [
    { utm_source: null, utm_medium: null, utm_campaign: null },
    { utm_source: null, utm_medium: null, utm_campaign: null },
    { utm_source: null, utm_medium: null, utm_campaign: null, referrer: 'https://www.google.com/' },
    { utm_source: null, utm_medium: null, utm_campaign: null, referrer: 'https://t.me/' },
  ],
};

const REFERRERS = {
  instagram: 'https://l.instagram.com/',
  yandex: null,
  none: null,
};

const INTEREST_MIX = [
  'subscription', 'subscription', 'subscription', 'subscription',
  'order', 'order', 'order', 'order',
  'question', 'question',
];

const LEAD_COUNT = 55;

const leads = [];
for (let i = 0; i < LEAD_COUNT; i++) {
  // свежих заявок больше: дни «прижимаются» к сегодняшнему
  const daysAgo = Math.floor(30 * Math.pow(rand(), 1.6));
  const at = new Date();
  at.setDate(at.getDate() - daysAgo);
  at.setHours(9 + Math.floor(rand() * 12), Math.floor(rand() * 60), 0, 0);
  if (at > new Date()) {
    // «сегодняшние» не должны оказаться в будущем
    at.setTime(Date.now() - (1 + rand() * 6) * 3600_000);
  }

  const interest = pick(INTEREST_MIX);
  const kind = chance(0.5) ? 'instagram' : chance(0.55) ? 'yandex' : 'none';
  const utm = pick(UTM_SETS[kind]);

  // выполненные — в основном те, что постарше
  const done =
    (daysAgo >= 7 && chance(0.35)) || (daysAgo < 7 && chance(0.05));

  leads.push({
    name: pick(NAMES),
    phone: randomPhone(),
    interest,
    comment: chance(0.6) ? pick(COMMENTS[interest]) : null,
    status: done ? 'done' : 'new',
    source: kind === 'none' ? null : kind,
    utm_source: utm.utm_source ?? null,
    utm_medium: utm.utm_medium ?? null,
    utm_campaign: utm.utm_campaign ?? null,
    utm_content: 'demo-seed',
    utm_term: null,
    referrer: utm.referrer ?? REFERRERS[kind],
    page_url: 'https://kvarta.by/',
    created_at: at,
  });
}

// подписки оформляем по заявкам на подписку — как это делает админка:
// сама заявка при этом переходит в «выполненные»
const SUB_PLAN = [
  { coffee: 'Эфиопия Иргачеффе', status: 'active', startedDaysAgo: 24 },
  { coffee: 'Колумбия Уила', status: 'active', startedDaysAgo: 15 },
  { coffee: 'Бразилия Серрадо', status: 'paused', startedDaysAgo: 9 },
  { coffee: 'Чередуем сорта', status: 'cancelled', startedDaysAgo: 27 },
];

const subLeads = leads.filter((l) => l.interest === 'subscription');
const subscriptions = SUB_PLAN.map((plan, idx) => {
  const lead = subLeads[idx * 2]; // разносим по разным людям
  lead.status = 'done';
  const started = new Date();
  started.setDate(started.getDate() - plan.startedDaysAgo);
  return { lead, coffee: plan.coffee, status: plan.status, started_at: started };
});

// Бывает, что из сети провайдера закрыт порт 5432 наружу — тогда строку
// подключения не используешь. `--sql` печатает те же данные готовым SQL:
// его можно вставить в SQL-редактор Neon и выполнить там.
if (process.argv.includes('--sql')) {
  const q = (v) =>
    v === null || v === undefined ? 'null' : `'${String(v).replace(/'/g, "''")}'`;
  const out = [
    "delete from subscriptions where lead_id in (select id from leads where utm_content = 'demo-seed');",
    "delete from leads where utm_content = 'demo-seed';",
  ];
  for (const l of leads) {
    const values = [
      q(l.name), q(l.phone), q(l.interest), q(l.comment), q(l.status), q(l.source),
      q(l.utm_source), q(l.utm_medium), q(l.utm_campaign), q(l.utm_content), q(l.utm_term),
      q(l.referrer), q(l.page_url), `${q(l.created_at.toISOString())}::timestamptz`,
    ].join(', ');
    out.push(
      `insert into leads (name, phone, interest, comment, status, source, utm_source, utm_medium, utm_campaign, utm_content, utm_term, referrer, page_url, created_at) values (${values});`,
    );
  }
  for (const s of subscriptions) {
    out.push(
      `insert into subscriptions (lead_id, name, phone, coffee, status, started_at) select id, name, phone, ${q(s.coffee)}, ${q(s.status)}, ${q(s.started_at.toISOString().slice(0, 10))}::date from leads where utm_content = 'demo-seed' and phone = ${q(s.lead.phone)};`,
    );
  }
  // отдельными командами — SQL-редакторы обычно выполняют скрипт целиком
  out.push('select count(*) as leads from leads;');
  out.push('select count(*) as subscriptions from subscriptions;');
  console.log(out.join('\n'));
  process.exit(0);
}

const client = await pool.connect();
try {
  await client.query('BEGIN');

  const removedSubs = await client.query(
    `DELETE FROM subscriptions
     WHERE lead_id IN (SELECT id FROM leads WHERE utm_content = 'demo-seed')`,
  );
  const removedLeads = await client.query(
    `DELETE FROM leads WHERE utm_content = 'demo-seed'`,
  );
  if (removedLeads.rowCount) {
    console.log(
      `заменил прошлые демо-данные: ${removedLeads.rowCount} заявок, ${removedSubs.rowCount} подписок`,
    );
  }

  const ids = [];
  for (const l of leads) {
    const res = await client.query(
      `INSERT INTO leads
         (name, phone, interest, comment, status, source,
          utm_source, utm_medium, utm_campaign, utm_content, utm_term,
          referrer, page_url, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING id`,
      [
        l.name, l.phone, l.interest, l.comment, l.status, l.source,
        l.utm_source, l.utm_medium, l.utm_campaign, l.utm_content, l.utm_term,
        l.referrer, l.page_url, l.created_at,
      ],
    );
    ids.push(res.rows[0].id);
  }

  for (const s of subscriptions) {
    await client.query(
      `INSERT INTO subscriptions (lead_id, name, phone, coffee, status, started_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        ids[leads.indexOf(s.lead)], s.lead.name, s.lead.phone,
        s.coffee, s.status, s.started_at,
      ],
    );
  }

  await client.query('COMMIT');
} catch (e) {
  await client.query('ROLLBACK');
  throw e;
} finally {
  client.release();
}

const bySource = { instagram: 0, yandex: 0, none: 0 };
for (const l of leads) bySource[l.source ?? 'none']++;
const byStatus = { new: 0, done: 0 };
for (const l of leads) byStatus[l.status]++;

console.log(
  `добавлено ${leads.length} заявок (Instagram ${bySource.instagram} · Яндекс ${bySource.yandex} · без метки ${bySource.none}; новых ${byStatus.new} · выполненных ${byStatus.done}) и ${subscriptions.length} подписки`,
);
await pool.end();
