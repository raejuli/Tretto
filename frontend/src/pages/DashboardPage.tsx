import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BoardSummary } from '../types';
import { getBoards, createBoard, deleteBoard } from '../api/boards';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Spinner } from '../components/common/Spinner';

const STARRED_KEY = 'tretto_starred_boards';

function getStarred(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(STARRED_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function saveStarred(ids: Set<string>): void {
  localStorage.setItem(STARRED_KEY, JSON.stringify([...ids]));
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [starred, setStarred] = useState<Set<string>>(getStarred);

  useEffect(() => {
    getBoards().then(setBoards).finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    const board = await createBoard(newTitle.trim(), newDesc.trim());
    setBoards((prev) => [...prev, board]);
    setShowModal(false);
    setNewTitle('');
    setNewDesc('');
    setCreating(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleStar = (e: React.MouseEvent, boardId: string) => {
    e.stopPropagation();
    setStarred((prev) => {
      const next = new Set(prev);
      if (next.has(boardId)) {
        next.delete(boardId);
      } else {
        next.add(boardId);
      }
      saveStarred(next);
      return next;
    });
  };

  const ARCHIVE_CONFIRM = 'Archive this board? It will be hidden from your dashboard but can still be viewed in the archived boards section.';

  const handleDelete = async (e: React.MouseEvent, boardId: string) => {
    e.stopPropagation();
    if (!window.confirm(ARCHIVE_CONFIRM)) return;
    await deleteBoard(boardId);
    setBoards((prev) => prev.map((b) => b.id === boardId ? { ...b, archived: true } : b));
  };

  const visible = boards.filter((b) => showArchived ? b.archived : !b.archived);
  const starredFirst = [...visible].sort((a, b) => {
    const as = starred.has(a.id) ? -1 : 1;
    const bs = starred.has(b.id) ? -1 : 1;
    return as - bs;
  });

  return (
    <div style={{ minHeight: '100vh', background: '#f4f5f7' }}>
      <nav style={{ background: '#0052cc', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, color: '#fff', fontSize: '20px' }}>Tretto</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ color: '#fff', fontSize: '14px' }}>{user?.displayName}</span>
          <Button variant="secondary" onClick={handleLogout}>Sign out</Button>
        </div>
      </nav>
      <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h2 style={{ margin: 0, color: '#172b4d' }}>{showArchived ? 'Archived Boards' : 'Your Boards'}</h2>
            <button
              onClick={() => setShowArchived((p) => !p)}
              style={{
                background: 'none', border: '1px solid #dfe1e6', borderRadius: '4px',
                padding: '4px 10px', cursor: 'pointer', fontSize: '13px', color: '#42526e',
              }}
            >
              {showArchived ? '← Active boards' : 'View archived'}
            </button>
          </div>
          {!showArchived && <Button onClick={() => setShowModal(true)}>+ Create Board</Button>}
        </div>
        {loading ? <Spinner /> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {starredFirst.map((board) => (
              <div
                key={board.id}
                onClick={() => !board.archived && navigate(`/boards/${board.id}`)}
                style={{
                  background: '#0052cc', color: '#fff', borderRadius: '6px',
                  padding: '20px', cursor: board.archived ? 'default' : 'pointer',
                  minHeight: '80px', position: 'relative',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                  transition: 'transform 0.1s, box-shadow 0.1s',
                  opacity: board.archived ? 0.6 : 1,
                }}
                onMouseEnter={(e) => { if (!board.archived) { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)'; } }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.15)'; }}
              >
                <div style={{ fontWeight: 700, fontSize: '15px', paddingRight: '32px' }}>{board.title}</div>
                {board.description && <div style={{ fontSize: '13px', opacity: 0.8, marginTop: '4px' }}>{board.description}</div>}

                {/* Star button */}
                {!board.archived && (
                  <button
                    onClick={(e) => toggleStar(e, board.id)}
                    title={starred.has(board.id) ? 'Unstar' : 'Star'}
                    style={{
                      position: 'absolute', top: '8px', right: '8px',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: starred.has(board.id) ? '#f6c90e' : 'rgba(255,255,255,0.6)',
                      fontSize: '16px', padding: '2px',
                    }}
                  >★</button>
                )}

                {/* Archive button */}
                {!board.archived && (
                  <button
                    onClick={(e) => handleDelete(e, board.id)}
                    title="Archive board"
                    style={{
                      position: 'absolute', bottom: '8px', right: '8px',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'rgba(255,255,255,0.5)', fontSize: '13px', padding: '2px',
                    }}
                  >🗄</button>
                )}
              </div>
            ))}
            {starredFirst.length === 0 && (
              <p style={{ color: '#5e6c84', gridColumn: '1 / -1' }}>
                {showArchived ? 'No archived boards.' : 'No boards yet. Create one to get started!'}
              </p>
            )}
          </div>
        )}
      </div>
      {showModal && (
        <Modal title="Create Board" onClose={() => setShowModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              autoFocus type="text" placeholder="Board title" value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
              style={{ padding: '10px 12px', border: '1px solid #dfe1e6', borderRadius: '4px', fontSize: '14px' }}
            />
            <input
              type="text" placeholder="Description (optional)" value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              style={{ padding: '10px 12px', border: '1px solid #dfe1e6', borderRadius: '4px', fontSize: '14px' }}
            />
            <Button onClick={handleCreate} disabled={creating}>{creating ? 'Creating…' : 'Create'}</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

