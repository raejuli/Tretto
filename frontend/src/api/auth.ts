import { apiFetch, setAccessToken } from './client';
import { AuthResponse } from '../types';

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await apiFetch('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error((await res.json()).message ?? 'Login failed');
  const data: AuthResponse = await res.json();
  setAccessToken(data.accessToken);
  return data;
}

export async function register(email: string, displayName: string, password: string): Promise<AuthResponse> {
  const res = await apiFetch('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, displayName, password }),
  });
  if (!res.ok) throw new Error((await res.json()).message ?? 'Registration failed');
  const data: AuthResponse = await res.json();
  setAccessToken(data.accessToken);
  return data;
}

export async function logout(): Promise<void> {
  await apiFetch('/api/v1/auth/logout', { method: 'POST' });
  setAccessToken(null);
}

export async function refreshToken(): Promise<AuthResponse> {
  const res = await fetch('/api/v1/auth/refresh', { method: 'POST', credentials: 'include' });
  if (!res.ok) throw new Error('Refresh failed');
  const data: AuthResponse = await res.json();
  setAccessToken(data.accessToken);
  return data;
}
