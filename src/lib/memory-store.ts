import { demoConversations } from './demo-data';
import { applyFilters, computeStats } from './stats';
import type { ConversationEvent, ConversationStore, ListFilters } from './types';

interface MemoryState {
  events: ConversationEvent[];
}

const globalStore = globalThis as typeof globalThis & { __obsMemory?: MemoryState };

function state(seeded: boolean): MemoryState {
  if (!globalStore.__obsMemory) {
    globalStore.__obsMemory = {
      events: seeded ? demoConversations() : [],
    };
  }
  return globalStore.__obsMemory;
}

export function createMemoryStore(seeded = true): ConversationStore {
  return {
    async ingest(event) {
      const current = state(seeded);
      current.events = [event, ...current.events];
      return event;
    },
    async list(filters: ListFilters) {
      const filtered = applyFilters(state(seeded).events, filters);
      const start = (filters.page - 1) * filters.perPage;
      return {
        items: filtered.slice(start, start + filters.perPage),
        total: filtered.length,
      };
    },
    async getById(id) {
      return state(seeded).events.find((event) => event.id === id) || null;
    },
    async stats(days) {
      return computeStats(state(seeded).events, days);
    },
  };
}
