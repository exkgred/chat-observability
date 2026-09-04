import { NextResponse } from 'next/server';
import { fail, ok } from '@/lib/envelope';
import { ingestAuthorized } from '@/lib/auth';
import { pushToLoki } from '@/lib/loki';
import { getStore } from '@/lib/store';
import { parseIngestPayload, toConversationEvent } from '@/lib/validate-ingest';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!ingestAuthorized(request.headers.get('authorization'))) {
    return NextResponse.json(fail('UNAUTHORIZED', 'Ingest secret inválido.'), { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(fail('VALIDATION_ERROR', 'JSON inválido.'), { status: 400 });
  }

  const parsed = parseIngestPayload(body);
  if (!parsed.ok) {
    return NextResponse.json(fail('VALIDATION_ERROR', parsed.message), { status: 400 });
  }

  const event = toConversationEvent(parsed.value);
  const saved = await getStore().ingest(event);
  void pushToLoki(saved);

  return NextResponse.json(ok({ id: saved.id }), { status: 201 });
}
