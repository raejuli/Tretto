import { apiFetch } from './client';
import { BoardSummary, BoardDetail } from '../types';

export async function getBoards(): Promise<BoardSummary[]> {
  const res = await apiFetch('/api/v1/boards');
  if (!res.ok) throw new Error('Failed to fetch boards');
  return res.json();
}

export async function getBoard(boardId: string): Promise<BoardDetail> {
  const res = await apiFetch(`/api/v1/boards/${boardId}`);
  if (!res.ok) throw new Error('Failed to fetch board');
  return res.json();
}

export async function createBoard(title: string, description: string): Promise<BoardSummary> {
  const res = await apiFetch('/api/v1/boards', {
    method: 'POST',
    body: JSON.stringify({ title, description }),
  });
  if (!res.ok) throw new Error('Failed to create board');
  return res.json();
}

export async function updateBoard(boardId: string, data: { title?: string; description?: string }): Promise<BoardSummary> {
  const res = await apiFetch(`/api/v1/boards/${boardId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update board');
  return res.json();
}

export async function deleteBoard(boardId: string): Promise<void> {
  const res = await apiFetch(`/api/v1/boards/${boardId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete board');
}
