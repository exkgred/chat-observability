import { NextResponse } from 'next/server';
import { ok } from '@/lib/envelope';
import { isDemoMode } from '@/lib/auth';
import { isLokiConfigured, probeLoki } from '@/lib/loki';
import { getStoreKind } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const maxDuration = 15;

export async function GET(request: Request) {
  const probe = new URL(request.url).searchParams.get('probe') === '1';
  const data: Record<string, unknown> = {
    status: 'ok',
    demo: isDemoMode(),
    store: getStoreKind(),
    postgres: Boolean(process.env.DATABASE_URL),
    loki: isLokiConfigured(),
  };
  if (probe) {
    data.lokiProbe = await probeLoki();
  }
  return NextResponse.json(ok(data));
}
