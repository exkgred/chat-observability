export interface ConversationEvent {
  id: string;
  occurredAt: string;
  sessionId: string | null;
  visitante: string | null;
  pergunta: string;
  resposta: string;
  latenciaMs: number | null;
  modelo: string | null;
  origemHash: string | null;
  erro: string | null;
  source: string;
}

export interface IngestPayload {
  timestamp?: string;
  sessionId?: string;
  visitante?: string | null;
  pergunta: string;
  resposta?: string;
  latenciaMs?: number;
  modelo?: string;
  origemHash?: string;
  erro?: string;
  source?: string;
}

export interface ListFilters {
  q?: string;
  visitante?: string;
  from?: string;
  to?: string;
  page: number;
  perPage: number;
}

export interface StatsSnapshot {
  total: number;
  today: number;
  uniqueVisitors: number;
  namedVisitors: number;
  avgLatencyMs: number | null;
  errors: number;
  series: { date: string; count: number }[];
  topVisitors: { name: string; count: number }[];
}

export interface ConversationStore {
  ingest(event: ConversationEvent): Promise<ConversationEvent>;
  list(filters: ListFilters): Promise<{ items: ConversationEvent[]; total: number }>;
  getById(id: string): Promise<ConversationEvent | null>;
  stats(days: number): Promise<StatsSnapshot>;
}
