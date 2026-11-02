import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createWorker } from '../cloudflare/worker.mjs';
import { createCloudStore } from '../cloudflare/store.mjs';
import { decrypt, keys } from '../cloudflare/crypto.mjs';
import { policyVersion } from '../showcase/assets/quiz.config.mjs';

// Используется тот же локальный D1-эмулятор, который поставляется с зафиксированным Wrangler.
const { Miniflare, convertV4MiniflareOptions } = createRequire(import.meta.resolve('wrangler/package.json'))('miniflare');
const secret = '1'.repeat(64); // Исключительно тестовый ключ, не используется при публикации.
function payload() {
  return { requestId: crypto.randomUUID(), name: 'Тест', language: 'ru', messenger: 'telegram', contact: '@deniz_test', region: 'unspecified',
    answers: { regions: ['mallorca'], purpose: 'investment', propertyType: 'villa', budgets: ['200k-300k'], timeline: 'soon' },
    consent: { accepted: true, policyVersion }, website: '' };
}
function lead() {
  const savedAt = new Date().toISOString(); const body = payload();
  return { ...body, leadId: crypto.randomUUID(), savedAt, consent: { ...body.consent, timestamp: savedAt } };
}
const readyEnv = { LEADS_ENABLED: 'true', TELEGRAM_BOT_TOKEN: 'test-only', TELEGRAM_CHAT_ID: 'test-chat' };
function request(body, headers = {}) {
  return new Request('https://landing.example/api/lead', { method: 'POST', headers: { Origin: 'https://landing.example', 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
}

test('Worker не подтверждает заявку без настройки или при сбое сохранения', async () => {
  let scheduled = false;
  const ctx = { waitUntil() { scheduled = true; } };
  assert.equal((await createWorker().fetch(request(payload()), {}, ctx)).status, 503);
  const broken = createWorker(async () => ({ rateLimit: async () => true, save: async () => { throw new Error('storage_failed'); } }));
  const response = await broken.fetch(request(payload()), readyEnv, ctx);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, 'storage_unavailable');
  assert.equal(scheduled, false);
});

test('Worker отклоняет чужой Origin, спам, большие тела и невалидные контакты', async () => {
  const worker = createWorker(async () => ({ rateLimit: async () => true, save: async () => { throw new Error('unexpected_save'); } }));
  const ctx = { waitUntil() {} };
  assert.equal((await worker.fetch(request(payload(), { Origin: 'https://other.example' }), readyEnv, ctx)).status, 403);
  assert.equal((await worker.fetch(request({ ...payload(), website: 'spam' }), readyEnv, ctx)).status, 422);
  assert.equal((await worker.fetch(request({ ...payload(), contact: 'bad' }), readyEnv, ctx)).status, 422);
  assert.equal((await worker.fetch(request({ ...payload(), name: 'X'.repeat(9000) }), readyEnv, ctx)).status, 413);
});

test('Worker отвечает успехом только после сохранения и передаёт уведомление в waitUntil', async () => {
  let saved; const background = []; let delivered;
  const worker = createWorker(async () => ({ rateLimit: async () => true,
    save: async value => { saved = value; return { leadId: value.leadId, duplicate: false }; },
    deliver: async id => { delivered = id; } }));
  const response = await worker.fetch(request(payload()), readyEnv, { waitUntil(promise) { background.push(promise); } });
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(result.leadId, saved.leadId);
  assert.equal(result.status, 'saved');
  assert.ok(saved.consent.timestamp);
  assert.equal(saved.website, undefined);
  await Promise.all(background);
  assert.equal(delivered, result.leadId);
});

test('Worker использует страну Cloudflare, а не поддельный заголовок посетителя', async () => {
  const req = new Request('https://landing.example/api/country', { headers: { 'CF-IPCountry': 'NO' } });
  Object.defineProperty(req, 'cf', { value: { country: 'ES' } });
  assert.deepEqual(await (await createWorker().fetch(req, {}, {})).json(), { country: 'ES', source: 'ip' });
});

async function database(t) {
  const mf = new Miniflare(convertV4MiniflareOptions({ modules: true, script: 'export default { fetch() { return new Response("ok"); } };', d1Databases: ['LEADS_DB'] }));
  t.after(() => mf.dispose());
  const db = await mf.getD1Database('LEADS_DB');
  const sql = await readFile(new URL('../migrations/0001_leads.sql', import.meta.url), 'utf8');
  for (const statement of sql.split(';').filter(part => part.trim())) await db.prepare(statement).run();
  return db;
}
test('D1 сохраняет зашифрованный лид, исключает конкурентные дубли и ограничивает частоту', async t => {
  const db = await database(t);
  const store = await createCloudStore({ LEADS_DB: db, LEAD_ENCRYPTION_KEY: secret });
  const value = lead();
  const results = await Promise.all([store.save(value), store.save({ ...value, requestId: crypto.randomUUID(), leadId: crypto.randomUUID() })]);
  assert.equal(results[0].leadId, results[1].leadId);
  assert.equal((await db.prepare('SELECT COUNT(*) AS count FROM leads').first()).count, 1);
  const row = await db.prepare('SELECT * FROM leads').first();
  assert.ok(!row.payload.includes(value.contact));
  assert.equal((await decrypt((await keys(secret)).encryption, row.payload)).name, value.name);
  for (let index = 0; index < 12; index++) assert.equal(await store.rateLimit('192.0.2.1'), true);
  assert.equal(await store.rateLimit('192.0.2.1'), false);
  assert.equal((await db.prepare('SELECT bucket_key FROM lead_rate_limits').first()).bucket_key.includes('192.0.2.1'), false);
});

test('D1 повторяет неудачный Telegram, не отправляя успешный email повторно', async t => {
  const db = await database(t); let telegramFails = true; const sent = [];
  const env = { LEADS_DB: db, LEAD_ENCRYPTION_KEY: secret, ...readyEnv,
    RESEND_API_KEY: 'test-only', LEAD_EMAIL_FROM: 'test@example.com', LEAD_EMAIL_TO: 'receiver@example.com' };
  const store = await createCloudStore(env, async (url, options) => {
    const email = url === 'https://api.resend.com/emails';
    sent.push({ email, options });
    if (!email && telegramFails) return Response.json({ ok: false }, { status: 503 });
    return Response.json(email ? { id: 'test-email' } : { ok: true });
  });
  const value = lead(); await store.save(value); await store.deliver(value.leadId);
  let row = await db.prepare('SELECT * FROM leads').first();
  assert.equal(row.telegram_status, 'pending'); assert.equal(row.email_status, 'sent');
  assert.equal(row.last_error, 'delivery_failed');
  telegramFails = false;
  await db.prepare('UPDATE leads SET next_attempt_at = 0').run();
  await store.deliver(value.leadId);
  row = await db.prepare('SELECT * FROM leads').first();
  assert.equal(row.telegram_status, 'sent');
  assert.equal(sent.filter(item => item.email).length, 1);
  assert.equal(sent.find(item => item.email).options.headers['Idempotency-Key'], `deniz-lead/${value.leadId}`);
  assert.deepEqual(await store.pending(), []);
});
