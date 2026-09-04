import type { ConversationEvent } from './types';

function nanoseconds(iso: string): string {
  const ms = Date.parse(iso);
  const safe = Number.isNaN(ms) ? Date.now() : ms;
  return `${safe}000000`;
}

export async function pushToLoki(event: ConversationEvent): Promise<void> {
  const url = process.env.LOKI_PUSH_URL;
  const user = process.env.LOKI_USER;
  const token = process.env.LOKI_TOKEN;
  if (!url || !user || !token) return;

  const line = JSON.stringify({
    id: event.id,
    visitante: event.visitante,
    sessionId: event.sessionId,
    pergunta: event.pergunta,
    resposta: event.resposta,
    latenciaMs: event.latenciaMs,
    modelo: event.modelo,
    erro: event.erro,
    source: event.source,
  });

  const body = {
    streams: [
      {
        stream: {
          app: 'joshua-chat',
          env: process.env.LOKI_ENV || process.env.VERCEL_ENV || 'local',
          source: event.source,
          has_error: event.erro ? 'true' : 'false',
        },
        values: [[nanoseconds(event.occurredAt), line]],
      },
    ],
  };

  const credentials = Buffer.from(`${user}:${token}`).toString('base64');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${credentials}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) {
      const text = await response.text();
      console.error('Loki push failed', response.status, text.slice(0, 300));
    }
  } catch (error) {
    console.error('Loki push error', error);
  } finally {
    clearTimeout(timer);
  }
}
