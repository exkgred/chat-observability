import { isDemoMode } from './auth';
import { createFileStore } from './file-store';
import { createLokiStore } from './loki-store';
import { isLokiConfigured } from './loki';
import { createMemoryStore } from './memory-store';
import { createPostgresStore } from './postgres-store';
import type { ConversationStore } from './types';

export type StoreKind = 'demo' | 'postgres' | 'loki' | 'file' | 'memory';

export function getStoreKind(): StoreKind {
  if (isDemoMode()) return 'demo';
  if (process.env.DATABASE_URL) return 'postgres';
  if (isLokiConfigured()) return 'loki';
  if (!process.env.VERCEL) return 'file';
  return 'memory';
}

export function getStore(): ConversationStore {
  const kind = getStoreKind();
  if (kind === 'demo') return createMemoryStore(true);
  if (kind === 'postgres') return createPostgresStore();
  if (kind === 'loki') return createLokiStore();
  if (kind === 'file') return createFileStore();
  return createMemoryStore(false);
}
