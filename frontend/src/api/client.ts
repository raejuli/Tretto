let accessToken: string | null = null;
let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

async function doRefresh(): Promise<string | null> {
  const res = await fetch('/api/v1/auth/refresh', { method: 'POST', credentials: 'include' });
  if (!res.ok) return null;
  const data = await res.json();
  return data.accessToken as string;
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  headers.set('Content-Type', headers.get('Content-Type') ?? 'application/json');

  const response = await fetch(path, { ...options, headers, credentials: 'include' });

  if (response.status !== 401) return response;

  if (isRefreshing) {
    return new Promise((resolve) => {
      refreshQueue.push((newToken) => {
        if (newToken) headers.set('Authorization', `Bearer ${newToken}`);
        else headers.delete('Authorization');
        resolve(fetch(path, { ...options, headers, credentials: 'include' }));
      });
    });
  }

  isRefreshing = true;
  const newToken = await doRefresh().catch(() => null);
  isRefreshing = false;

  if (newToken) {
    setAccessToken(newToken);
    refreshQueue.forEach((cb) => cb(newToken));
  } else {
    setAccessToken(null);
    refreshQueue.forEach((cb) => cb(null));
    refreshQueue = [];
    window.location.href = '/login';
    return response;
  }
  refreshQueue = [];

  headers.set('Authorization', `Bearer ${newToken}`);
  return fetch(path, { ...options, headers, credentials: 'include' });
}
