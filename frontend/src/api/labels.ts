import { apiFetch } from './client';
import { Label } from '../types';

export async function getLabels(boardId: string): Promise<Label[]> {
  const res = await apiFetch(`/api/v1/boards/${boardId}/labels`);
  if (!res.ok) throw new Error('Failed to fetch labels');
  return res.json();
}

export async function createLabel(boardId: string, name: string, color: string): Promise<Label> {
  const res = await apiFetch(`/api/v1/boards/${boardId}/labels`, {
    method: 'POST',
    body: JSON.stringify({ name, color }),
  });
  if (!res.ok) throw new Error('Failed to create label');
  return res.json();
}

export async function deleteLabel(labelId: string): Promise<void> {
  const res = await apiFetch(`/api/v1/labels/${labelId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete label');
}
