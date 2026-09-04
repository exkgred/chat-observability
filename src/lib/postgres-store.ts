import { Pool, type QueryResultRow } from 'pg';
import { applyFilters, computeStats } from './stats';
import type { ConversationEvent, ConversationStore, ListFilters } from './types';

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS conversation_logs (
  id TEXT PRIMARY KEY,
  occurred_at TIMESTAMPTZ NOT NULL,
  session_id TEXT,
  visitante TEXT,
  pergunta TEXT NOT NULL,
  resposta TEXT NOT NULL DEFAULT '',
  latencia_ms INTEGER,
  modelo TEXT,
  origem_hash TEXT,
  erro TEXT,
  source TEXT NOT NULL DEFAULT 'chatbot',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

const CREATE_INDEX_SQL = `
CREATE INDEX IF NOT EXISTS conversation_logs_occurred_at_idx
  ON conversation_logs (occurred_at DESC);
`;

const globalPg = globalThis as typeof globalThis & {
  __obsPool?: Pool;
  __obsPgReady?: Promise<void>;
};

function sslConfig() {
  const url = process.env.DATABASE_URL || '';
  if (process.env.DATABASE_SSL === 'false') return undefined;
  if (
    url.includes('neon.tech') ||
    url.includes('sslmode=require') ||
    process.env.DATABASE_SSL === 'true'
  ) {
    return { rejectUnauthorized: false };
  }
  return undefined;
}

function getPool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL ausente');
  }
  if (!globalPg.__obsPool) {
    globalPg.__obsPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 4,
      ssl: sslConfig(),
    });
  }
  return globalPg.__obsPool;
}

async function ensureSchema(): Promise<void> {
  if (!globalPg.__obsPgReady) {
    globalPg.__obsPgReady = (async () => {
      const pool = getPool();
      await pool.query(CREATE_TABLE_SQL);
      await pool.query(CREATE_INDEX_SQL);
    })();
  }
  await globalPg.__obsPgReady;
}

function mapRow(row: QueryResultRow): ConversationEvent {
  return {
    id: String(row.id),
    occurredAt: new Date(row.occurred_at).toISOString(),
    sessionId: row.session_id ? String(row.session_id) : null,
    visitante: row.visitante ? String(row.visitante) : null,
    pergunta: String(row.pergunta),
    resposta: String(row.resposta || ''),
    latenciaMs: row.latencia_ms === null || row.latencia_ms === undefined ? null : Number(row.latencia_ms),
    modelo: row.modelo ? String(row.modelo) : null,
    origemHash: row.origem_hash ? String(row.origem_hash) : null,
    erro: row.erro ? String(row.erro) : null,
    source: String(row.source || 'chatbot'),
  };
}

export function createPostgresStore(): ConversationStore {
  return {
    async ingest(event) {
      await ensureSchema();
      await getPool().query(
        `INSERT INTO conversation_logs (
          id, occurred_at, session_id, visitante, pergunta, resposta,
          latencia_ms, modelo, origem_hash, erro, source
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          event.id,
          event.occurredAt,
          event.sessionId,
          event.visitante,
          event.pergunta,
          event.resposta,
          event.latenciaMs,
          event.modelo,
          event.origemHash,
          event.erro,
          event.source,
        ],
      );
      return event;
    },
    async list(filters: ListFilters) {
      await ensureSchema();
      const result = await getPool().query('SELECT * FROM conversation_logs ORDER BY occurred_at DESC');
      const filtered = applyFilters(result.rows.map(mapRow), filters);
      const start = (filters.page - 1) * filters.perPage;
      return {
        items: filtered.slice(start, start + filters.perPage),
        total: filtered.length,
      };
    },
    async getById(id) {
      await ensureSchema();
      const result = await getPool().query('SELECT * FROM conversation_logs WHERE id = $1', [id]);
      const row = result.rows[0] as QueryResultRow | undefined;
      return row ? mapRow(row) : null;
    },
    async stats(days) {
      await ensureSchema();
      const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const result = await getPool().query(
        'SELECT * FROM conversation_logs WHERE occurred_at >= $1',
        [from],
      );
      return computeStats(result.rows.map(mapRow), days);
    },
  };
}
