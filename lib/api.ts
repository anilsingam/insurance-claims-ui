import type { Role } from '@/types';

export async function apiFetch<T>(url: string, options: RequestInit & { role?: Role } = {}): Promise<T> {
  const { role = 'CLAIMS_AGENT', headers, ...rest } = options;
  const response = await fetch(url, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      'x-demo-role': role,
      ...(headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(body.message ?? `Request failed with ${response.status}`);
  }

  return response.json();
}
