import type { ConversationEvent, StatsSnapshot } from './types';

const TIME_ZONE = 'America/Sao_Paulo';

export function dayKey(iso: string, timeZone = TIME_ZONE): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso));
}

function seriesDays(days: number, now = new Date()): string[] {
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    keys.push(dayKey(d.toISOString()));
  }
  return keys;
}

export function computeStats(events: ConversationEvent[], days: number, now = new Date()): StatsSnapshot {
  const from = now.getTime() - days * 24 * 60 * 60 * 1000;
  const windowEvents = events.filter((event) => Date.parse(event.occurredAt) >= from);
  const today = dayKey(now.toISOString());
  const named = new Set<string>();
  const sessions = new Set<string>();
  const visitorCounts = new Map<string, number>();
  let latencySum = 0;
  let latencyCount = 0;
  let errors = 0;
  let todayCount = 0;

  for (const event of windowEvents) {
    if (dayKey(event.occurredAt) === today) todayCount += 1;
    if (event.erro) errors += 1;
    if (typeof event.latenciaMs === 'number') {
      latencySum += event.latenciaMs;
      latencyCount += 1;
    }
    if (event.visitante) {
      named.add(event.visitante.toLowerCase());
      visitorCounts.set(event.visitante, (visitorCounts.get(event.visitante) || 0) + 1);
    }
    sessions.add(event.sessionId || event.origemHash || event.id);
  }

  const counts = new Map<string, number>();
  for (const event of windowEvents) {
    const key = dayKey(event.occurredAt);
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  const topVisitors = [...visitorCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }));

  return {
    total: windowEvents.length,
    today: todayCount,
    uniqueVisitors: sessions.size,
    namedVisitors: named.size,
    avgLatencyMs: latencyCount ? Math.round(latencySum / latencyCount) : null,
    errors,
    series: seriesDays(days, now).map((date) => ({ date, count: counts.get(date) || 0 })),
    topVisitors,
  };
}

export function applyFilters(
  events: ConversationEvent[],
  filters: { q?: string; visitante?: string; from?: string; to?: string },
): ConversationEvent[] {
  const q = filters.q?.trim().toLowerCase();
  const visitante = filters.visitante?.trim().toLowerCase();
  const from = filters.from ? Date.parse(filters.from) : undefined;
  const to = filters.to ? Date.parse(filters.to) : undefined;

  return events
    .filter((event) => {
      if (q) {
        const blob = `${event.pergunta} ${event.resposta} ${event.visitante || ''}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      if (visitante && (event.visitante || '').toLowerCase() !== visitante) return false;
      const ts = Date.parse(event.occurredAt);
      if (from && !Number.isNaN(from) && ts < from) return false;
      if (to && !Number.isNaN(to) && ts > to) return false;
      return true;
    })
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));
}
