import type { ConversationEvent } from '@/lib/types';

export function formatWhen(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(iso));
}

export function formatDay(isoDate: string): string {
  const [, month, day] = isoDate.split('-');
  return `${day}/${month}`;
}

export function latencyLabel(ms: number | null): string {
  if (ms === null) return '—';
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

export function snippet(text: string, length = 90): string {
  const compact = text.replace(/\s+/g, ' ').trim();
  if (compact.length <= length) return compact;
  return `${compact.slice(0, length)}…`;
}

export function visitorLabel(event: Pick<ConversationEvent, 'visitante'>): string {
  return event.visitante || 'Anônimo';
}
