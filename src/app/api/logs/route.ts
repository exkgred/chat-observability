import { NextResponse } from 'next/server';
import { ok } from '@/lib/envelope';
import { getStore } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function positiveInt(value: string | null, fallback: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = positiveInt(url.searchParams.get('page'), 1, 1000);
  const perPage = positiveInt(url.searchParams.get('perPage'), 20, 100);
  const result = await getStore().list({
    page,
    perPage,
    q: url.searchParams.get('q') || undefined,
    visitante: url.searchParams.get('visitante') || undefined,
    from: url.searchParams.get('from') || undefined,
    to: url.searchParams.get('to') || undefined,
  });

  return NextResponse.json(
    ok(result.items, {
      page,
      perPage,
      total: result.total,
      lastPage: Math.max(1, Math.ceil(result.total / perPage)),
    }),
  );
}
