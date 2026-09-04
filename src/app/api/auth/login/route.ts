import { NextResponse } from 'next/server';
import { fail, ok } from '@/lib/envelope';
import {
  COOKIE_NAME,
  getDashboardPassword,
  getSessionSecret,
  isDemoMode,
  signSession,
} from '@/lib/auth';

export async function POST(request: Request) {
  if (isDemoMode()) {
    return NextResponse.json(ok({ demo: true }));
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(fail('VALIDATION_ERROR', 'JSON inválido.'), { status: 400 });
  }

  const password =
    body && typeof body === 'object' && 'password' in body
      ? String((body as { password?: unknown }).password || '')
      : '';

  if (password !== getDashboardPassword()) {
    return NextResponse.json(fail('UNAUTHORIZED', 'Senha inválida.'), { status: 401 });
  }

  const token = await signSession(getSessionSecret());
  const response = NextResponse.json(ok({ ok: true }));
  response.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.VERCEL === '1',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
