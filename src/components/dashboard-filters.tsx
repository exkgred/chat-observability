'use client';

import type { StatusFilter } from '@/lib/types';

export type SourceFilter = '' | 'chatbot' | 'health-probe';
export type StatusFilterValue = '' | StatusFilter;

export interface DashboardFiltersState {
  q: string;
  visitante: string;
  source: SourceFilter;
  status: StatusFilterValue;
  from: string;
  to: string;
}

export const EMPTY_FILTERS: DashboardFiltersState = {
  q: '',
  visitante: '',
  source: '',
  status: '',
  from: '',
  to: '',
};

const fieldClass =
  'w-full rounded-xl border border-white/10 bg-ink-900 px-3 py-2 text-sm text-white outline-none ring-accent-blue placeholder:text-ink-500 focus:ring-2';

type DatePreset = 'all' | 'today' | '7d' | '14d' | '30d';

const PRESETS: { id: DatePreset; label: string }[] = [
  { id: 'all', label: 'Tudo' },
  { id: 'today', label: 'Hoje' },
  { id: '7d', label: '7 dias' },
  { id: '14d', label: '14 dias' },
  { id: '30d', label: '30 dias' },
];

function toDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function rangeForPreset(preset: Exclude<DatePreset, 'all'>): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  if (preset === 'today') {
    return { from: toDateInput(to), to: toDateInput(to) };
  }
  const days = preset === '7d' ? 6 : preset === '14d' ? 13 : 29;
  from.setDate(from.getDate() - days);
  return { from: toDateInput(from), to: toDateInput(to) };
}

function activePreset(filters: DashboardFiltersState): DatePreset | 'custom' {
  if (!filters.from && !filters.to) return 'all';
  for (const preset of ['today', '7d', '14d', '30d'] as const) {
    const range = rangeForPreset(preset);
    if (filters.from === range.from && filters.to === range.to) return preset;
  }
  return 'custom';
}

export function hasActiveFilters(filters: DashboardFiltersState): boolean {
  return Boolean(
    filters.q.trim() ||
      filters.visitante.trim() ||
      filters.source ||
      filters.status ||
      filters.from ||
      filters.to,
  );
}

interface DashboardFiltersProps {
  value: DashboardFiltersState;
  onChange: (next: DashboardFiltersState) => void;
  onClear: () => void;
}

export function DashboardFilters({ value, onChange, onClear }: DashboardFiltersProps) {
  const preset = activePreset(value);

  function patch(partial: Partial<DashboardFiltersState>) {
    onChange({ ...value, ...partial });
  }

  function applyPreset(next: DatePreset) {
    if (next === 'all') {
      patch({ from: '', to: '' });
      return;
    }
    patch(rangeForPreset(next));
  }

  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((item) => {
          const selected = preset === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => applyPreset(item.id)}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                selected
                  ? 'border-accent-blue/40 bg-accent-blue/15 text-white'
                  : 'border-white/10 text-ink-500 hover:bg-white/5 hover:text-ink-300'
              }`}
            >
              {item.label}
            </button>
          );
        })}
        {hasActiveFilters(value) ? (
          <button
            type="button"
            onClick={onClear}
            className="rounded-full border border-white/10 px-3 py-1 text-xs text-ink-500 hover:bg-white/5 hover:text-ink-300"
          >
            Limpar filtros
          </button>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-[11px] uppercase tracking-wide text-ink-500">Busca</span>
          <input
            value={value.q}
            onChange={(event) => patch({ q: event.target.value })}
            placeholder="Nome, pergunta ou resposta"
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] uppercase tracking-wide text-ink-500">Visitante</span>
          <input
            value={value.visitante}
            onChange={(event) => patch({ visitante: event.target.value })}
            placeholder="Nome exato"
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] uppercase tracking-wide text-ink-500">Origem</span>
          <select
            value={value.source}
            onChange={(event) => patch({ source: event.target.value as SourceFilter })}
            className={fieldClass}
          >
            <option value="">Todas</option>
            <option value="chatbot">Chat</option>
            <option value="health-probe">Probe</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] uppercase tracking-wide text-ink-500">Status</span>
          <select
            value={value.status}
            onChange={(event) => patch({ status: event.target.value as StatusFilterValue })}
            className={fieldClass}
          >
            <option value="">Todos</option>
            <option value="ok">Ok</option>
            <option value="erro">Erro</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] uppercase tracking-wide text-ink-500">De</span>
          <input
            type="date"
            value={value.from}
            onChange={(event) => patch({ from: event.target.value })}
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] uppercase tracking-wide text-ink-500">Até</span>
          <input
            type="date"
            value={value.to}
            onChange={(event) => patch({ to: event.target.value })}
            className={fieldClass}
          />
        </label>
      </div>
    </div>
  );
}
