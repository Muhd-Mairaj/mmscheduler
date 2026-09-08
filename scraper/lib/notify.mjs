// Minimal notifier: POSTs JSON to NOTIFY_WEBHOOK_URL (optional). Logs always.
export async function notify(message, { level = 'info', webhookUrl = process.env.NOTIFY_WEBHOOK_URL } = {}) {
  const line = `[${new Date().toISOString()}] [${level}] ${message}`;
  console.log(line);
  if (!webhookUrl) return;
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: line, level }),
    });
  } catch (err) {
    console.error(`notify: failed to send webhook: ${err.message}`);
  }
}
