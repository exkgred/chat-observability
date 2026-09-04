import type { ConversationEvent } from './types';

const PUSH_TIMEOUT_MS = 4000;
const QUERY_TIMEOUT_MS = 8000;

export type LokiPushResult =
  | { status: 'skipped'; reason: string }
  | { status: 'ok' }
  | { status: 'error'; reason: string; httpStatus?: number };

type AuthMode = 'basic' | 'bearer-pair' | 'bearer-token';

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

export function resolveLokiBaseUrl(raw: string): string {
  return resolveLokiPushUrl(raw).replace(/\/loki\/api\/v1\/push$/, '');
}

function orgIdFromToken(token: string): string | undefined {
  if (!token.startsWith('glc_')) return undefined;
  try {
    const json = Buffer.from(token.slice(4), 'base64').toString('utf8');
    const parsed = JSON.parse(json) as { o?: string };
    return typeof parsed.o === 'string' ? parsed.o : undefined;
  } catch {
    return undefined;
  }
}

function authHeaders(user: string, token: string, mode: AuthMode, jsonBody: boolean): HeadersInit {
  const headers: Record<string, string> = {};
  if (jsonBody) headers['Content-Type'] = 'application/json';
  if (mode === 'bearer-pair') {
    headers.Authorization = `Bearer ${user}:${token}`;
  } else if (mode === 'bearer-token') {
    headers.Authorization = `Bearer ${token}`;
    const orgId = orgIdFromToken(token);
    if (orgId) headers['X-Scope-OrgID'] = orgId;
  } else {
    headers.Authorization = `Basic ${Buffer.from(`${user}:${token}`).toString('base64')}`;
  }
  return headers;
}

async function requestLoki(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<{ ok: boolean; status: number; text: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const text = await response.text();
    return { ok: response.ok, status: response.status, text };
  } finally {
    clearTimeout(timer);
  }
}

async function withAuthModes(
  user: string,
  token: string,
  jsonBody: boolean,
  run: (headers: HeadersInit) => Promise<{ ok: boolean; status: number; text: string }>,
): Promise<{ ok: boolean; status: number; text: string }> {
  const modes: AuthMode[] = ['basic', 'bearer-pair', 'bearer-token'];
  let last = { ok: false, status: 0, text: '' };
  for (const mode of modes) {
    last = await run(authHeaders(user, token, mode, jsonBody));
    if (last.ok) return last;
    if (last.status !== 401 && last.status !== 403) return last;
  }
  return last;
}

function lokiStreamPayload(event: ConversationEvent): string {
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
    origemHash: event.origemHash,
  });
  return JSON.stringify({
    streams: [
      {
        stream: {
          app: 'joshua-chat',
          env: env('LOKI_ENV') || process.env.VERCEL_ENV || 'local',
          source: event.source || 'chatbot',
          has_error: event.erro ? 'true' : 'false',
        },
        values: [[nanoseconds(event.occurredAt), line]],
      },
    ],
  });
}

export async function pushToLoki(event: ConversationEvent): Promise<LokiPushResult> {
  const configuredUrl = env('LOKI_PUSH_URL');
  const user = env('LOKI_USER');
  const token = env('LOKI_TOKEN');
  if (!configuredUrl || !user || !token) {
    return { status: 'skipped', reason: 'loki env ausente' };
  }

  const url = resolveLokiPushUrl(configuredUrl);
  const payload = lokiStreamPayload(event);

  try {
    const result = await withAuthModes(user, token, true, (headers) =>
      requestLoki(url, { method: 'POST', headers, body: payload }, PUSH_TIMEOUT_MS),
    );
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

function lineToEvent(tsNs: string, line: string): ConversationEvent | null {
  try {
    const parsed = JSON.parse(line) as Record<string, unknown>;
    const pergunta = typeof parsed.pergunta === 'string' ? parsed.pergunta.trim() : '';
    if (!pergunta) return null;
    const ms = Number(tsNs.slice(0, 13));
    const occurredAt = Number.isFinite(ms) ? new Date(ms).toISOString() : new Date().toISOString();
    return {
      id: typeof parsed.id === 'string' && parsed.id ? parsed.id : `loki-${tsNs}`,
      occurredAt,
      sessionId: typeof parsed.sessionId === 'string' ? parsed.sessionId : null,
      visitante: typeof parsed.visitante === 'string' && parsed.visitante ? parsed.visitante : null,
      pergunta,
      resposta: typeof parsed.resposta === 'string' ? parsed.resposta : '',
      latenciaMs: typeof parsed.latenciaMs === 'number' ? parsed.latenciaMs : null,
      modelo: typeof parsed.modelo === 'string' ? parsed.modelo : null,
      origemHash: typeof parsed.origemHash === 'string' ? parsed.origemHash : null,
      erro: typeof parsed.erro === 'string' ? parsed.erro : null,
      source: typeof parsed.source === 'string' && parsed.source ? parsed.source : 'chatbot',
    };
  } catch {
    return null;
  }
}

export async function queryLokiEvents(days = 14): Promise<ConversationEvent[]> {
  const configuredUrl = env('LOKI_PUSH_URL');
  const user = env('LOKI_USER');
  const token = env('LOKI_TOKEN');
  if (!configuredUrl || !user || !token) return [];

  const end = Date.now();
  const start = end - days * 24 * 60 * 60 * 1000;
  const params = new URLSearchParams({
    query: '{app="joshua-chat"}',
    limit: '1000',
    start: `${start}000000`,
    end: `${end}000000`,
    direction: 'backward',
  });
  const url = `${resolveLokiBaseUrl(configuredUrl)}/loki/api/v1/query_range?${params.toString()}`;

  const result = await withAuthModes(user, token, false, (headers) =>
    requestLoki(url, { method: 'GET', headers }, QUERY_TIMEOUT_MS),
  );
  if (!result.ok) {
    console.error('Loki query failed', result.status, result.text.slice(0, 300));
    return [];
  }

  let payload: { data?: { result?: { values?: [string, string][] }[] } };
  try {
    payload = JSON.parse(result.text) as typeof payload;
  } catch {
    console.error('Loki query JSON inválido');
    return [];
  }
  const events: ConversationEvent[] = [];
  const seen = new Set<string>();
  for (const stream of payload.data?.result || []) {
    for (const [ts, line] of stream.values || []) {
      const event = lineToEvent(ts, line);
      if (!event || seen.has(event.id)) continue;
      seen.add(event.id);
      events.push(event);
    }
  }
  return events.sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));
}

export async function probeLoki(): Promise<{
  configured: boolean;
  push: LokiPushResult;
  queried: number;
}> {
  if (!isLokiConfigured()) {
    return { configured: false, push: { status: 'skipped', reason: 'loki env ausente' }, queried: 0 };
  }
  const event: ConversationEvent = {
    id: crypto.randomUUID(),
    occurredAt: new Date().toISOString(),
    sessionId: 'health-probe',
    visitante: 'health',
    pergunta: 'health-probe',
    resposta: 'ok',
    latenciaMs: 1,
    modelo: null,
    origemHash: null,
    erro: null,
    source: 'health-probe',
  };
  const push = await pushToLoki(event);
  const queried = await queryLokiEvents(1);
  return { configured: true, push, queried: queried.length };
}
