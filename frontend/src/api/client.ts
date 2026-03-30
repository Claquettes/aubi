const rawBase = import.meta.env.VITE_API_URL ?? '';

export function apiUrl(path: string): string {
  if (path.startsWith('http')) return path;
  const b = rawBase.replace(/\/$/, '');
  if (!b) return path;
  return `${b}${path.startsWith('/') ? '' : '/'}${path}`;
}

export async function apiJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const r = await fetch(apiUrl(path), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  if (r.status === 204) return undefined as T;
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? r.statusText);
  }
  return r.json() as Promise<T>;
}
