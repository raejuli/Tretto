import { apiFetch } from './client';
import { Card } from '../types';

export async function createCard(boardId: string, columnId: string, title: string): Promise<Card> {
  const res = await apiFetch(`/api/v1/columns/${columnId}/cards`, {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error('Failed to create card');
  return res.json();
}

export async function getCard(cardId: string): Promise<Card> {
  const res = await apiFetch(`/api/v1/cards/${cardId}`);
  if (!res.ok) throw new Error('Failed to fetch card');
  return res.json();
}

export async function updateCard(cardId: string, data: Partial<Pick<Card, 'title' | 'description' | 'dueDate'> & { assigneeId: string | null }>): Promise<Card> {
  const res = await apiFetch(`/api/v1/cards/${cardId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update card');
  return res.json();
}

export async function deleteCard(cardId: string): Promise<void> {
  const res = await apiFetch(`/api/v1/cards/${cardId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete card');
}

export async function moveCard(boardId: string, cardId: string, toColumnId: string, position: number): Promise<Card> {
  const res = await apiFetch(`/api/v1/cards/${cardId}/move`, {
    method: 'PATCH',
    body: JSON.stringify({ columnId: toColumnId, position }),
  });
  if (!res.ok) throw new Error('Failed to move card');
  return res.json();
}

export async function addLabelToCard(cardId: string, labelId: string): Promise<void> {
  const res = await apiFetch(`/api/v1/cards/${cardId}/labels`, {
    method: 'POST',
    body: JSON.stringify({ labelId }),
  });
  if (!res.ok) throw new Error('Failed to add label');
}

export async function removeLabelFromCard(cardId: string, labelId: string): Promise<void> {
  const res = await apiFetch(`/api/v1/cards/${cardId}/labels/${labelId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to remove label');
}
