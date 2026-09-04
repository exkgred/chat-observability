'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ConversationDrawer } from '@/components/conversation-drawer';
import { ConversationTable } from '@/components/conversation-table';
import { KpiCard } from '@/components/kpi-card';
import { VolumeChart } from '@/components/volume-chart';
import { latencyLabel } from '@/lib/format';
import type { ConversationEvent, StatsSnapshot } from '@/lib/types';

interface Envelope<T> {
  success: boolean;
  data: T;
  meta?: {
    page?: number;
    lastPage?: number;
    total?: number;
  };
}

interface DashboardViewProps {
  demo: boolean;
}

export function DashboardView({ demo }: DashboardViewProps) {
  const [stats, setStats] = useState<StatsSnapshot | null>(null);
  const [items, setItems] = useState<ConversationEvent[]>([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<ConversationEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (nextQuery: string, nextPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(nextPage), perPage: '12' });
      if (nextQuery.trim()) params.set('q', nextQuery.trim());
      const [statsRes, logsRes] = await Promise.all([
        fetch('/api/stats?days=14'),
        fetch(`/api/logs?${params.toString()}`),
      ]);
      const statsJson = (await statsRes.json()) as Envelope<StatsSnapshot>;
      const logsJson = (await logsRes.json()) as Envelope<ConversationEvent[]>;
      if (!statsRes.ok || !statsJson.success) throw new Error('Falha ao carregar estatísticas.');
      if (!logsRes.ok || !logsJson.success) throw new Error('Falha ao carregar conversas.');
      setStats(statsJson.data);
      setItems(logsJson.data);
      setLastPage(logsJson.meta?.lastPage || 1);
      setTotal(logsJson.meta?.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      void load(query, page);
    }, 250);
    return () => clearTimeout(handle);
  }, [load, page, query]);

  useEffect(() => {
    const interval = setInterval(() => {
      void load(query, page);
    }, 20000);
    return () => clearInterval(interval);
  }, [load, page, query]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  const namedShare = useMemo(() => {
    if (!stats || stats.uniqueVisitors === 0) return '0%';
    return `${Math.round((stats.namedVisitors / stats.uniqueVisitors) * 100)}%`;
  }, [stats]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(79,142,247,0.16),_transparent_42%),#0b0e14] px-4 py-6 sm:px-8">
      <header className="mx-auto mb-8 flex max-w-6xl flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-blue to-accent-violet text-sm font-bold text-white">
            JS
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">Chat Observability</h1>
            <p className="text-xs text-ink-500">Conversas do portfólio · ingest assíncrono · Grafana Loki</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {demo ? (
            <span className="rounded-full border border-accent-blue/30 bg-accent-blue/10 px-3 py-1 text-xs text-accent-blue">
              modo demo
            </span>
          ) : (
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-full border border-white/10 px-3 py-1 text-xs text-ink-300 hover:bg-white/5"
            >
              Sair
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6">
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard label="Conversas (14d)" value={String(stats?.total ?? '—')} hint={loading ? 'Atualizando…' : `${total} no filtro atual`} />
          <KpiCard label="Hoje" value={String(stats?.today ?? '—')} hint="Fuso America/São Paulo" />
          <KpiCard
            label="Visitantes"
            value={String(stats?.uniqueVisitors ?? '—')}
            hint={`${stats?.namedVisitors ?? 0} com nome · ${namedShare}`}
          />
          <KpiCard
            label="Latência média"
            value={latencyLabel(stats?.avgLatencyMs ?? null)}
            hint={`${stats?.errors ?? 0} erro(s)`}
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <VolumeChart series={stats?.series || []} />
          </div>
          <div className="rounded-2xl border border-white/5 bg-ink-800/80 p-5">
            <h2 className="text-sm font-semibold text-white">Visitantes mais ativos</h2>
            <p className="mb-4 text-xs text-ink-500">Agrupado pelo nome informado no chat</p>
            <ul className="space-y-3">
              {(stats?.topVisitors || []).length === 0 ? (
                <li className="text-sm text-ink-500">Ainda sem nomes nesta janela.</li>
              ) : (
                stats?.topVisitors.map((visitor) => (
                  <li key={visitor.name} className="flex items-center justify-between text-sm">
                    <span className="text-ink-300">{visitor.name}</span>
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-white">{visitor.count}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>

        <section className="rounded-2xl border border-white/5 bg-ink-800/40 p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-white">Conversas recentes</h2>
              <p className="text-xs text-ink-500">Clique numa linha para ver pergunta e resposta</p>
            </div>
            <input
              value={query}
              onChange={(event) => {
                setPage(1);
                setQuery(event.target.value);
              }}
              placeholder="Filtrar por nome, pergunta ou resposta"
              className="w-full max-w-sm rounded-xl border border-white/10 bg-ink-900 px-3 py-2 text-sm text-white outline-none ring-accent-blue placeholder:text-ink-500 focus:ring-2"
            />
          </div>

          {error ? (
            <p className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {error}
            </p>
          ) : null}

          <ConversationTable items={items} selectedId={selected?.id} onSelect={setSelected} />

          <div className="mt-4 flex items-center justify-between text-xs text-ink-500">
            <span>
              Página {page} de {lastPage}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="rounded-lg border border-white/10 px-3 py-1 disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={page >= lastPage}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-lg border border-white/10 px-3 py-1 disabled:opacity-40"
              >
                Próxima
              </button>
            </div>
          </div>
        </section>
      </main>

      <ConversationDrawer event={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
