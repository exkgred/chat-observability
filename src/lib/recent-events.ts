import type { ConversationEvent } from './types';

const globalRecent = globalThis as typeof globalThis & {
  __obsRecent?: ConversationEvent[];
};

export function rememberEvent(event: ConversationEvent): void {
  const current = globalRecent.__obsRecent || [];
  globalRecent.__obsRecent = [event, ...current.filter((item) => item.id !== event.id)].slice(0, 200);
}

export function recentEvents(): ConversationEvent[] {
  return globalRecent.__obsRecent || [];
}

export function mergeEvents(...groups: ConversationEvent[][]): ConversationEvent[] {
  const seen = new Set<string>();
  const merged: ConversationEvent[] = [];
  for (const group of groups) {
    for (const event of group) {
      if (seen.has(event.id)) continue;
      seen.add(event.id);
      merged.push(event);
    }
  }
  return merged.sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));
}
