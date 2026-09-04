import type { ConversationEvent, IngestPayload } from './types';

const MAX_QUESTION = 8000;
const MAX_ANSWER = 16000;
const MAX_NAME = 80;
const MAX_SESSION = 80;
const MAX_MODEL = 80;
const MAX_SOURCE = 40;
const MAX_ERROR = 500;

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

export function parseIngestPayload(
  body: unknown,
): { ok: true; value: IngestPayload } | { ok: false; message: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, message: 'Body JSON inválido.' };
  }

  const raw = body as Record<string, unknown>;
  const pergunta = asString(raw.pergunta)?.trim();
  if (!pergunta) {
    return { ok: false, message: 'Campo pergunta é obrigatório.' };
  }
  if (pergunta.length > MAX_QUESTION) {
    return { ok: false, message: 'Pergunta excede o tamanho máximo.' };
  }

  const resposta = asString(raw.resposta);
  if (resposta && resposta.length > MAX_ANSWER) {
    return { ok: false, message: 'Resposta excede o tamanho máximo.' };
  }

  const visitante = asString(raw.visitante)?.trim() || undefined;
  if (visitante && visitante.length > MAX_NAME) {
    return { ok: false, message: 'Visitante excede o tamanho máximo.' };
  }

  const sessionId = asString(raw.sessionId)?.trim() || undefined;
  if (sessionId && sessionId.length > MAX_SESSION) {
    return { ok: false, message: 'sessionId inválido.' };
  }

  const modelo = asString(raw.modelo)?.trim() || undefined;
  if (modelo && modelo.length > MAX_MODEL) {
    return { ok: false, message: 'modelo inválido.' };
  }

  const source = asString(raw.source)?.trim() || undefined;
  if (source && source.length > MAX_SOURCE) {
    return { ok: false, message: 'source inválido.' };
  }

  const erro = asString(raw.erro)?.trim() || undefined;
  if (erro && erro.length > MAX_ERROR) {
    return { ok: false, message: 'erro inválido.' };
  }

  const origemHash = asString(raw.origemHash)?.trim() || undefined;
  const timestamp = asString(raw.timestamp);
  const latenciaMs = asNumber(raw.latenciaMs);
  if (latenciaMs !== undefined && (latenciaMs < 0 || latenciaMs > 120_000)) {
    return { ok: false, message: 'latenciaMs fora do intervalo.' };
  }

  return {
    ok: true,
    value: {
      pergunta,
      resposta,
      visitante: visitante ?? null,
      sessionId,
      modelo,
      source,
      erro,
      origemHash,
      timestamp,
      latenciaMs,
    },
  };
}

function resolveOccurredAt(timestamp?: string): string {
  if (!timestamp) return new Date().toISOString();
  const parsed = Date.parse(timestamp);
  if (Number.isNaN(parsed)) return new Date().toISOString();
  return new Date(parsed).toISOString();
}

export function toConversationEvent(payload: IngestPayload): ConversationEvent {
  return {
    id: crypto.randomUUID(),
    occurredAt: resolveOccurredAt(payload.timestamp),
    sessionId: payload.sessionId?.trim() || null,
    visitante: payload.visitante?.trim() || null,
    pergunta: payload.pergunta.trim(),
    resposta: payload.resposta?.trim() || '',
    latenciaMs: payload.latenciaMs ?? null,
    modelo: payload.modelo?.trim() || null,
    origemHash: payload.origemHash?.trim() || null,
    erro: payload.erro?.trim() || null,
    source: payload.source?.trim() || 'chatbot',
  };
}
