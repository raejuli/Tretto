import { apiFetch } from './client';
import { Card } from '../types';

export async function createCard(boardId: string, columnId: string, title: string): Promise<Card> {
  const res = await apiFetch(`/api/v1/boards/${boardId}/columns/${columnId}/cards`, {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error('Failed to create card');
  return res.json();
}

export async function updateCard(boardId: string, columnId: string, cardId: string, data: Partial<Card>): Promise<Card> {
  const res = await apiFetch(`/api/v1/boards/${boardId}/columns/${columnId}/cards/${cardId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update card');
  return res.json();
}

export async function deleteCard(boardId: string, columnId: string, cardId: string): Promise<void> {
  const res = await apiFetch(`/api/v1/boards/${boardId}/columns/${columnId}/cards/${cardId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete card');
}

export async function moveCard(boardId: string, cardId: string, toColumnId: string, position: number): Promise<Card> {
  const res = await apiFetch(`/api/v1/boards/${boardId}/cards/${cardId}/move`, {
    method: 'POST',
    body: JSON.stringify({ columnId: toColumnId, position }),
  });
  if (!res.ok) throw new Error('Failed to move card');
  return res.json();
}
