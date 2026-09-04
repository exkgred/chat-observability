import { isDemoMode } from './auth';
import { createFileStore } from './file-store';
import { createMemoryStore } from './memory-store';
import { createPostgresStore } from './postgres-store';
import type { ConversationStore } from './types';

export function getStore(): ConversationStore {
  if (isDemoMode()) {
    return createMemoryStore(true);
  }
  if (process.env.DATABASE_URL) {
    return createPostgresStore();
  }
  if (!process.env.VERCEL) {
    return createFileStore();
  }
  return createMemoryStore(true);
}
