import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { COOKIE_NAME, getSessionSecret, isDemoMode, verifySession } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  if (isDemoMode()) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const valid = await verifySession(token, getSessionSecret());
  if (valid) {
    return NextResponse.next();
  }

  const loginUrl = new URL('/login', request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|login|api/auth|api/ingest|api/health).*)',
  ],
};
