import { mkdir, readFile, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { applyFilters, computeStats } from './stats';
import type { ConversationEvent, ConversationStore, ListFilters } from './types';

const FILE_PATH = join(process.cwd(), 'data', 'conversations.json');

async function readAll(): Promise<ConversationEvent[]> {
  try {
    const raw = await readFile(FILE_PATH, 'utf-8');
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ConversationEvent[]) : [];
  } catch {
    return [];
  }
}

async function writeAll(events: ConversationEvent[]): Promise<void> {
  await mkdir(dirname(FILE_PATH), { recursive: true });
  await writeFile(FILE_PATH, JSON.stringify(events, null, 2), 'utf-8');
}

export function createFileStore(): ConversationStore {
  return {
    async ingest(event) {
      const events = await readAll();
      events.unshift(event);
      await writeAll(events);
      return event;
    },
    async list(filters: ListFilters) {
      const filtered = applyFilters(await readAll(), filters);
      const start = (filters.page - 1) * filters.perPage;
      return {
        items: filtered.slice(start, start + filters.perPage),
        total: filtered.length,
      };
    },
    async getById(id) {
      const events = await readAll();
      return events.find((event) => event.id === id) || null;
    },
    async stats(days) {
      return computeStats(await readAll(), days);
    },
  };
}
