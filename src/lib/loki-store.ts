import { queryLokiEvents } from './loki';
import { applyFilters, computeStats } from './stats';
import type { ConversationStore, ListFilters } from './types';

export function createLokiStore(): ConversationStore {
  return {
    async ingest(event) {
      return event;
    },
    async list(filters: ListFilters) {
      const events = await queryLokiEvents(30);
      const filtered = applyFilters(events, filters);
      const start = (filters.page - 1) * filters.perPage;
      return {
        items: filtered.slice(start, start + filters.perPage),
        total: filtered.length,
      };
    },
    async getById(id) {
      const events = await queryLokiEvents(30);
      return events.find((event) => event.id === id) || null;
    },
    async stats(days) {
      const events = await queryLokiEvents(Math.max(days, 14));
      return computeStats(events, days);
    },
  };
}
