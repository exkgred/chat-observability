import { NextResponse } from 'next/server';
import { ok } from '@/lib/envelope';
import { isDemoMode } from '@/lib/auth';
import { getStoreKind } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    ok({
      status: 'ok',
      demo: isDemoMode(),
      store: getStoreKind(),
      postgres: Boolean(process.env.DATABASE_URL),
      loki: Boolean(process.env.LOKI_PUSH_URL),
    }),
  );
}
