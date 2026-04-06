import { apiFetch } from './client';
import { Column } from '../types';

export async function createColumn(boardId: string, title: string): Promise<Column> {
  const res = await apiFetch(`/api/v1/boards/${boardId}/columns`, {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error('Failed to create column');
  return res.json();
}

export async function updateColumn(boardId: string, columnId: string, data: { title?: string; position?: number }): Promise<Column> {
  const res = await apiFetch(`/api/v1/boards/${boardId}/columns/${columnId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update column');
  return res.json();
}

export async function deleteColumn(boardId: string, columnId: string): Promise<void> {
  const res = await apiFetch(`/api/v1/boards/${boardId}/columns/${columnId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete column');
}

export async function moveColumn(boardId: string, columnId: string, position: number): Promise<Column> {
  const res = await apiFetch(`/api/v1/boards/${boardId}/columns/${columnId}/move`, {
    method: 'POST',
    body: JSON.stringify({ position }),
  });
  if (!res.ok) throw new Error('Failed to move column');
  return res.json();
}
