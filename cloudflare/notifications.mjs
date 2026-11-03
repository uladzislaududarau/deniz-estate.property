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

export function leadMessage(lead, timeZone = 'Asia/Nicosia') {
  function dateAndTime(value) {
    const date = new Date(value);
    return [
      'Дата: ' + new Intl.DateTimeFormat('ru-RU', { timeZone, day: '2-digit', month: '2-digit', year: 'numeric' }).format(date),
      'Время: ' + new Intl.DateTimeFormat('ru-RU', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date)
    ].join('\n');
  }
  const labels = { regions: 'Регион Испании', purpose: 'Цель покупки', propertyType: 'Тип объекта', budgets: 'Бюджет', timeline: 'Срок покупки' };
  const answers = steps.map(question => {
    const values = [].concat(lead.answers[question.id]);
    return labels[question.id] + ':\n' + values.map(value => question.options.find(option => option[0] === value)?.[1] || value).join(', ');
  });
  return [
    'Заявка с сайта Deniz Estate Property',
    dateAndTime(lead.savedAt),
    'Имя: ' + lead.name + '\nЯзык: ' + (lead.language === 'ru' ? 'Русский' : 'Английский'),
    'Способ связи: ' + (lead.messenger === 'whatsapp' ? 'WhatsApp' : 'Telegram') + '\nКонтакт: ' + lead.contact,
    'Критерии подбора', ...answers,
    'Согласие на обработку персональных данных: ' + (lead.consent.accepted === true ? 'Получено' : 'Не подтверждено') + '\n' + dateAndTime(lead.consent.timestamp),
    'Часовой пояс: ' + timeZone
  ].join('\n\n');
}
export function channelConfigured(channel, env) {
  if (channel === 'telegram') return Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID);
  try { return Boolean(emailSettings(env)); } catch { return false; }
}
export async function sendNotification(channel, lead, env, fetcher = fetch) {
  const email = channel === 'email' ? emailSettings(env) : null;
  if (channel === 'email' ? !email : !channelConfigured(channel, env)) return false;
  const text = leadMessage(lead, env.LEAD_NOTIFICATION_TIME_ZONE || 'Asia/Nicosia');
  const response = channel === 'telegram'
    ? await fetcher(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(8000),
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text, link_preview_options: { is_disabled: true }, protect_content: true })
    })
    : await fetcher('https://api.resend.com/emails', {
      method: 'POST', signal: AbortSignal.timeout(8000),
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `deniz-lead/${lead.leadId}` },
      body: JSON.stringify({ ...email, subject: 'Заявка с сайта Deniz Estate Property', text })
    });
  const result = await response.json().catch(() => null);
  if (!response.ok || (channel === 'telegram' ? result?.ok !== true : !result?.id)) throw new Error('notification_failed');
  return true;
}
