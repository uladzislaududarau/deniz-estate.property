import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { notificationRecipients, channelConfigured, sendNotification } from '../cloudflare/notifications.mjs';
import { policyVersion } from '../showcase/assets/quiz.config.mjs';

const env = { RESEND_API_KEY: 'test-only', LEAD_EMAIL_FROM: 'Deniz Estate <leads@example.com>', LEAD_NOTIFICATION_EMAILS: ' first@example.com,second@example.com ' };
const lead = {
  leadId: 'test-lead', name: 'Тест', savedAt: '2026-11-02T12:00:00.000Z', language: 'ru',
  messenger: 'telegram', contact: '@deniz_test',
  answers: { regions: ['mallorca'], purpose: 'investment', propertyType: 'villa', budgets: ['200k-300k'], timeline: 'soon' },
  consent: { policyVersion, timestamp: '2026-11-02T12:00:00.000Z' }
};

test('Список email очищается от пробелов и дублей, невалидный адрес отклоняет весь список', () => {
  assert.deepEqual(notificationRecipients(' First@example.com,second@example.com,first@example.com '), ['First@example.com', 'second@example.com']);
  for (const raw of [undefined, '', ' ', 'invalid', 'first@example.com,invalid', 'first@example.com,', 'first@example.com\r\nBcc: other@example.com']) {
    assert.throws(() => notificationRecipients(raw));
  }
  assert.throws(() => notificationRecipients(Array.from({ length: 51 }, (_, index) => `person${index}@example.com`).join(',')));
});

test('Один запрос Resend отправляет одну заявку всем настроенным получателям', async () => {
  const calls = [];
  assert.equal(await sendNotification('email', lead, env, async (url, options) => {
    calls.push({ url, options }); return Response.json({ id: 'test-email' });
  }), true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.resend.com/emails');
  const body = JSON.parse(calls[0].options.body);
  assert.deepEqual(body.to, ['first@example.com', 'second@example.com']);
  assert.equal(body.from, env.LEAD_EMAIL_FROM);
  assert.equal(calls[0].options.headers['Idempotency-Key'], 'deniz-lead/test-lead');
  assert.match(body.text, /Тест/);
});

test('Ошибки адресов и отправителя не вызывают внешний API', async () => {
  let calls = 0;
  const fetcher = async () => { calls++; return Response.json({ id: 'unexpected' }); };
  for (const invalid of [
    { ...env, LEAD_NOTIFICATION_EMAILS: 'invalid' },
    { ...env, LEAD_EMAIL_FROM: 'invalid' },
    { ...env, LEAD_EMAIL_FROM: 'Name\r\nBcc: other@example.com <leads@example.com>' }
  ]) {
    assert.equal(channelConfigured('email', invalid), false);
    await assert.rejects(sendNotification('email', lead, invalid, fetcher));
  }
  assert.equal(calls, 0);
});

test('Wrangler сохраняет DB и переменные панели, приём заявок выключен', async () => {
  const raw = await readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8');
  const config = JSON.parse(raw.replace(/^\s*\/\/.*$/gm, ''));
  assert.equal(config.keep_vars, true);
  assert.equal(config.vars.LEADS_ENABLED, 'false');
  assert.equal(config.d1_databases[0].binding, 'DB');
  assert.equal(config.d1_databases[0].database_name, 'deniz-estate-leads');
  assert.match(config.d1_databases[0].database_id, /^[\da-f-]{36}$/);
  assert.equal(config.assets.binding, 'ASSETS');
  for (const secret of ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID', 'RESEND_API_KEY', 'LEAD_NOTIFICATION_EMAILS']) assert.equal(config.vars[secret], undefined);
});
