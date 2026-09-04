'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const json = (await response.json()) as { success: boolean; error?: { message: string } };
      if (!response.ok || !json.success) {
        throw new Error(json.error?.message || 'Não foi possível entrar.');
      }
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(124,90,247,0.18),_transparent_45%),#0b0e14] px-4">
      <form
        onSubmit={(event) => void onSubmit(event)}
        className="w-full max-w-sm rounded-3xl border border-white/10 bg-ink-800 p-8 shadow-glow"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-blue to-accent-violet text-sm font-bold text-white">
            JS
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">Chat Observability</h1>
            <p className="text-xs text-ink-500">Acesso ao painel de conversas</p>
          </div>
        </div>
        <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-ink-500">
          Senha
        </label>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mb-4 w-full rounded-xl border border-white/10 bg-ink-900 px-3 py-2 text-sm text-white outline-none ring-accent-blue focus:ring-2"
          autoFocus
        />
        {error ? <p className="mb-4 text-sm text-rose-300">{error}</p> : null}
        <button
          type="submit"
          disabled={loading || !password}
          className="w-full rounded-xl bg-gradient-to-r from-accent-blue to-accent-violet py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}
