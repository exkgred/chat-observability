import { NextResponse } from 'next/server';
import { ok } from '@/lib/envelope';
import { COOKIE_NAME } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json(ok({ ok: true }));
  response.cookies.set({
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.VERCEL === '1',
    path: '/',
    maxAge: 0,
  });
  return response;
}
