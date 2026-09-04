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

CREATE INDEX IF NOT EXISTS conversation_logs_occurred_at_idx
  ON conversation_logs (occurred_at DESC);
