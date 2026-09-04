export function ok<T>(data: T, extraMeta: Record<string, unknown> = {}) {
  return {
    success: true as const,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...extraMeta,
    },
  };
}

export function fail(code: string, message: string, details: unknown[] = []) {
  return {
    success: false as const,
    error: { code, message, details },
    meta: { timestamp: new Date().toISOString() },
  };
}
