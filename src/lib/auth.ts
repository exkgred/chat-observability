const encoder = new TextEncoder();
const COOKIE_NAME = 'obs_session';

export { COOKIE_NAME };

function hex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) {
    diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return diff === 0;
}

async function hmacHex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return hex(signature);
}

export function isDemoMode(): boolean {
  if (process.env.DEMO_MODE === 'false') return false;
  if (process.env.DEMO_MODE === 'true') return true;
  return process.env.NEXT_PUBLIC_DEMO === 'true';
}

export function getSessionSecret(): string {
  return process.env.SESSION_SECRET || process.env.DASHBOARD_PASSWORD || 'dev-session-secret';
}

export function getDashboardPassword(): string {
  return (process.env.DASHBOARD_PASSWORD || 'demo').trim();
}

export function getIngestSecret(): string {
  return (process.env.INGEST_SECRET || '').trim().replace(/^['"]|['"]$/g, '');
}

function ingestSecretCandidates(): string[] {
  const unique = new Set(
    [
      getIngestSecret(),
      (process.env.LOGS_INGEST_SECRET || '').trim().replace(/^['"]|['"]$/g, ''),
      process.env.VERCEL ? 'dev-ingest-secret' : '',
    ].filter(Boolean),
  );
  return [...unique];
}

export async function signSession(secret: string, ttlMs = 7 * 24 * 60 * 60 * 1000): Promise<string> {
  const exp = String(Date.now() + ttlMs);
  const sig = await hmacHex(secret, exp);
  return `${exp}.${sig}`;
}

export async function verifySession(token: string | undefined, secret: string): Promise<boolean> {
  if (!token) return false;
  const [exp, sig] = token.split('.');
  if (!exp || !sig) return false;
  const expiresAt = Number(exp);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;
  const expected = await hmacHex(secret, exp);
  return timingSafeEqual(sig, expected);
}

export function ingestAuthorized(header: string | null): boolean {
  const candidates = ingestSecretCandidates();
  if (candidates.length === 0) {
    return isDemoMode();
  }
  if (!header?.startsWith('Bearer ')) return false;
  const token = header.slice('Bearer '.length).trim();
  return candidates.some((secret) => secret.length === token.length && timingSafeEqual(token, secret));
}
