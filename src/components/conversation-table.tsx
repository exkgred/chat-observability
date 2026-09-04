import type { ConversationEvent } from '@/lib/types';
import { formatWhen, latencyLabel, snippet, visitorLabel } from '@/lib/format';

interface ConversationTableProps {
  items: ConversationEvent[];
  selectedId?: string | null;
  onSelect: (event: ConversationEvent) => void;
}

export function ConversationTable({ items, selectedId, onSelect }: ConversationTableProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center text-sm text-ink-500">
        Nenhuma conversa neste filtro.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/5">
      <table className="w-full text-left text-sm">
        <thead className="bg-ink-900/80 text-xs uppercase tracking-wide text-ink-500">
          <tr>
            <th className="px-4 py-3 font-medium">Quando</th>
            <th className="px-4 py-3 font-medium">Visitante</th>
            <th className="px-4 py-3 font-medium">Pergunta</th>
            <th className="px-4 py-3 font-medium">Latência</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 bg-ink-800/60">
          {items.map((event) => {
            const selected = event.id === selectedId;
            return (
              <tr
                key={event.id}
                className={`cursor-pointer transition hover:bg-white/5 ${selected ? 'bg-accent-blue/10' : ''}`}
                onClick={() => onSelect(event)}
              >
                <td className="whitespace-nowrap px-4 py-3 text-ink-300">{formatWhen(event.occurredAt)}</td>
                <td className="px-4 py-3 font-medium text-white">{visitorLabel(event)}</td>
                <td className="max-w-md px-4 py-3 text-ink-300">{snippet(event.pergunta)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-300">{latencyLabel(event.latenciaMs)}</td>
                <td className="px-4 py-3">
                  {event.erro ? (
                    <span className="rounded-full bg-rose-500/15 px-2 py-1 text-xs text-rose-300">erro</span>
                  ) : (
                    <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-xs text-emerald-300">ok</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
