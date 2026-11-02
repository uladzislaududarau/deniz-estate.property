import { steps } from '../showcase/assets/quiz.config.mjs';

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
  return channel === 'telegram' ? Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID)
    : Boolean(env.RESEND_API_KEY && env.LEAD_EMAIL_FROM && env.LEAD_EMAIL_TO);
}
export async function sendNotification(channel, lead, env, fetcher = fetch) {
  if (!channelConfigured(channel, env)) return false;
  const text = leadMessage(lead);
  const response = channel === 'telegram'
    ? await fetcher(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(8000),
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text, link_preview_options: { is_disabled: true }, protect_content: true })
    })
    : await fetcher('https://api.resend.com/emails', {
      method: 'POST', signal: AbortSignal.timeout(8000),
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `deniz-lead/${lead.leadId}` },
      body: JSON.stringify({ from: env.LEAD_EMAIL_FROM, to: [env.LEAD_EMAIL_TO], subject: `Заявка Deniz Estate · ${lead.leadId}`, text })
    });
  const result = await response.json().catch(() => null);
  if (!response.ok || (channel === 'telegram' ? result?.ok !== true : !result?.id)) throw new Error('notification_failed');
  return true;
}
