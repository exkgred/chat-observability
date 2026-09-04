import { NextResponse } from 'next/server';
import { ok } from '@/lib/envelope';
import { getStore } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const daysParam = Number(url.searchParams.get('days') || 14);
  const days = Number.isInteger(daysParam) && daysParam > 0 && daysParam <= 90 ? daysParam : 14;
  const stats = await getStore().stats(days);
  return NextResponse.json(ok(stats));
}
