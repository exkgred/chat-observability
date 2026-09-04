import { NextResponse } from 'next/server';
import { fail, ok } from '@/lib/envelope';
import { getStore } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const event = await getStore().getById(params.id);
  if (!event) {
    return NextResponse.json(fail('RESOURCE_NOT_FOUND', 'Conversa não encontrada.'), { status: 404 });
  }
  return NextResponse.json(ok(event));
}
