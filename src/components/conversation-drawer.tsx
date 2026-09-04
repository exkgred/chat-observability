import type { ConversationEvent } from '@/lib/types';
import { formatWhen, latencyLabel, visitorLabel } from '@/lib/format';

interface ConversationDrawerProps {
  event: ConversationEvent | null;
  onClose: () => void;
}

export function ConversationDrawer({ event, onClose }: ConversationDrawerProps) {
  if (!event) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/50" onClick={onClose}>
      <aside
        className="h-full w-full max-w-lg overflow-y-auto border-l border-white/10 bg-ink-900 p-6 shadow-glow"
        onClick={(mouseEvent) => mouseEvent.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-500">Conversa</p>
            <h2 className="mt-1 text-lg font-semibold text-white">{visitorLabel(event)}</h2>
            <p className="text-xs text-ink-500">{formatWhen(event.occurredAt)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 px-3 py-1 text-sm text-ink-300 hover:bg-white/5"
          >
            Fechar
          </button>
        </div>

        <dl className="mb-6 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-ink-800 p-3">
            <dt className="text-xs text-ink-500">Latência</dt>
            <dd className="text-white">{latencyLabel(event.latenciaMs)}</dd>
          </div>
          <div className="rounded-xl bg-ink-800 p-3">
            <dt className="text-xs text-ink-500">Modelo</dt>
            <dd className="truncate text-white">{event.modelo || '—'}</dd>
          </div>
          <div className="rounded-xl bg-ink-800 p-3">
            <dt className="text-xs text-ink-500">Sessão</dt>
            <dd className="truncate text-white">{event.sessionId || '—'}</dd>
          </div>
          <div className="rounded-xl bg-ink-800 p-3">
            <dt className="text-xs text-ink-500">Origem</dt>
            <dd className="truncate text-white">{event.origemHash || '—'}</dd>
          </div>
        </dl>

        {event.erro ? (
          <p className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {event.erro}
          </p>
        ) : null}

        <section className="space-y-4">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Pergunta</h3>
            <p className="whitespace-pre-wrap rounded-2xl bg-ink-800 p-4 text-sm leading-6 text-ink-300">
              {event.pergunta}
            </p>
          </div>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Resposta</h3>
            <p className="whitespace-pre-wrap rounded-2xl bg-gradient-to-br from-accent-blue/10 to-accent-violet/10 p-4 text-sm leading-6 text-white">
              {event.resposta || '—'}
            </p>
          </div>
        </section>
      </aside>
    </div>
  );
}
