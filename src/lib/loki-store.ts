import { queryLokiEvents } from './loki';
import { mergeEvents, recentEvents, rememberEvent } from './recent-events';
import { applyFilters, computeStats } from './stats';
import type { ConversationStore, ListFilters } from './types';

async function loadEvents(days: number) {
  try {
    return mergeEvents(recentEvents(), await queryLokiEvents(days));
  } catch (error) {
    console.error('Loki list error', error);
    return recentEvents();
  }
}

export function createLokiStore(): ConversationStore {
  return {
    async ingest(event) {
      rememberEvent(event);
      return event;
    },
    async list(filters: ListFilters) {
      const filtered = applyFilters(await loadEvents(30), filters);
      const start = (filters.page - 1) * filters.perPage;
      return {
        items: filtered.slice(start, start + filters.perPage),
        total: filtered.length,
      };
    },
    async getById(id) {
      return (await loadEvents(30)).find((event) => event.id === id) || null;
    },
    async stats(days) {
      return computeStats(await loadEvents(Math.max(days, 14)), days);
    },
  };
}
