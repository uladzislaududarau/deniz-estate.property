import { steps } from '../showcase/assets/quiz.config.mjs';
import { z } from 'zod';

const emailAddress = z.string().email();
export function notificationRecipients(raw) {
  if (typeof raw !== 'string' || !raw.trim()) throw new Error('invalid_notification_recipients');
  const values = raw.split(',').map(value => value.trim());
  if (values.some(value => !emailAddress.safeParse(value).success)) throw new Error('invalid_notification_recipients');
  const seen = new Set();
  const recipients = values.filter(value => {
    const normalized = value.toLowerCase();
    if (seen.has(normalized)) return false;
    seen.add(normalized); return true;
  });
  if (recipients.length > 50) throw new Error('too_many_notification_recipients');
  return recipients;
}
function emailSettings(env) {
  if (!env.RESEND_API_KEY || !env.LEAD_EMAIL_FROM || !env.LEAD_NOTIFICATION_EMAILS) return null;
  const from = env.LEAD_EMAIL_FROM.trim();
  const match = from.match(/^(?:[^<>\r\n]+<([^<>\r\n]+)>|([^<>\r\n]+))$/);
  const address = (match?.[1] || match?.[2] || '').trim();
  if (!emailAddress.safeParse(address).success) throw new Error('invalid_notification_sender');
  return { from, to: notificationRecipients(env.LEAD_NOTIFICATION_EMAILS) };
}

export function leadMessage(lead) {
  const answers = steps.map(question => {
    const values = [].concat(lead.answers[question.id]);
    return `${question.title.ru}\n${values.map(value => question.options.find(option => option[0] === value)?.[1] || value).join(', ')}`;
  });
  return [
    'Новая заявка Deniz Estate', `ID: ${lead.leadId}`, `Дата: ${lead.savedAt}`,
    `Язык: ${lead.language.toUpperCase()}`, `Имя: ${lead.name}`,
    `Связь: ${lead.messenger === 'whatsapp' ? 'WhatsApp' : 'Telegram'} — ${lead.contact}`,
    ...answers, `Согласие: ${lead.consent.policyVersion}, ${lead.consent.timestamp}`
  ].join('\n\n');
}
export function channelConfigured(channel, env) {
  if (channel === 'telegram') return Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID);
  try { return Boolean(emailSettings(env)); } catch { return false; }
}
export async function sendNotification(channel, lead, env, fetcher = fetch) {
  const email = channel === 'email' ? emailSettings(env) : null;
  if (channel === 'email' ? !email : !channelConfigured(channel, env)) return false;
  const text = leadMessage(lead);
  const response = channel === 'telegram'
    ? await fetcher(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(8000),
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text, link_preview_options: { is_disabled: true }, protect_content: true })
    })
    : await fetcher('https://api.resend.com/emails', {
      method: 'POST', signal: AbortSignal.timeout(8000),
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `deniz-lead/${lead.leadId}` },
      body: JSON.stringify({ ...email, subject: `Заявка Deniz Estate · ${lead.leadId}`, text })
    });
  const result = await response.json().catch(() => null);
  if (!response.ok || (channel === 'telegram' ? result?.ok !== true : !result?.id)) throw new Error('notification_failed');
  return true;
}
