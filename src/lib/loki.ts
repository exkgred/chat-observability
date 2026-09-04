import type { ConversationEvent } from './types';

const PUSH_TIMEOUT_MS = 8000;

export type LokiPushResult =
  | { status: 'skipped'; reason: string }
  | { status: 'ok' }
  | { status: 'error'; reason: string; httpStatus?: number };

function env(name: string): string {
  return (process.env[name] || '').trim();
}

export function isLokiConfigured(): boolean {
  return Boolean(env('LOKI_PUSH_URL') && env('LOKI_USER') && env('LOKI_TOKEN'));
}

function nanoseconds(iso: string): string {
  const ms = Date.parse(iso);
  const safe = Number.isNaN(ms) ? Date.now() : ms;
  return `${safe}000000`;
}

export function resolveLokiPushUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (trimmed.endsWith('/loki/api/v1/push')) return trimmed;
  return `${trimmed}/loki/api/v1/push`;
}

function authHeaders(user: string, token: string, mode: 'basic' | 'bearer'): HeadersInit {
  if (mode === 'bearer') {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${user}:${token}`,
    };
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Basic ${Buffer.from(`${user}:${token}`).toString('base64')}`,
  };
}

async function postStreams(
  url: string,
  body: string,
  headers: HeadersInit,
): Promise<{ ok: boolean; status: number; text: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PUSH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
      signal: controller.signal,
    });
    const text = await response.text();
    return { ok: response.ok, status: response.status, text };
  } finally {
    clearTimeout(timer);
  }
}

export async function pushToLoki(event: ConversationEvent): Promise<LokiPushResult> {
  const configuredUrl = env('LOKI_PUSH_URL');
  const user = env('LOKI_USER');
  const token = env('LOKI_TOKEN');
  if (!configuredUrl || !user || !token) {
    return { status: 'skipped', reason: 'loki env ausente' };
  }

  const url = resolveLokiPushUrl(configuredUrl);
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
  const payload = JSON.stringify({
    streams: [
      {
        stream: {
          app: 'joshua-chat',
          env: env('LOKI_ENV') || process.env.VERCEL_ENV || 'local',
          source: event.source,
          has_error: event.erro ? 'true' : 'false',
        },
        values: [[nanoseconds(event.occurredAt), line]],
      },
    ],
  });

  try {
    let result = await postStreams(url, payload, authHeaders(user, token, 'basic'));
    if (!result.ok && (result.status === 401 || result.status === 403)) {
      result = await postStreams(url, payload, authHeaders(user, token, 'bearer'));
    }
    if (!result.ok) {
      const snippet = result.text.slice(0, 300);
      console.error('Loki push failed', result.status, snippet);
      return { status: 'error', reason: snippet || 'loki recusou o push', httpStatus: result.status };
    }
    return { status: 'ok' };
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'loki push error';
    console.error('Loki push error', reason);
    return { status: 'error', reason };
  }
}
