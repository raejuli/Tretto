import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BoardSummary } from '../types';
import { getBoards, createBoard } from '../api/boards';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Spinner } from '../components/common/Spinner';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

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
          <h2 style={{ margin: 0, color: '#172b4d' }}>Your Boards</h2>
          <Button onClick={() => setShowModal(true)}>+ Create Board</Button>
        </div>
        {loading ? <Spinner /> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {boards.filter((b) => !b.archived).map((board) => (
              <div
                key={board.id}
                onClick={() => navigate(`/boards/${board.id}`)}
                style={{
                  background: '#0052cc', color: '#fff', borderRadius: '6px',
                  padding: '20px', cursor: 'pointer', minHeight: '80px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                  transition: 'transform 0.1s, box-shadow 0.1s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.15)'; }}
              >
                <div style={{ fontWeight: 700, fontSize: '15px' }}>{board.title}</div>
                {board.description && <div style={{ fontSize: '13px', opacity: 0.8, marginTop: '4px' }}>{board.description}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
      {showModal && (
        <Modal title="Create Board" onClose={() => setShowModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              autoFocus type="text" placeholder="Board title" value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              style={{ padding: '10px 12px', border: '1px solid #dfe1e6', borderRadius: '4px', fontSize: '14px' }}
            />
            <input
              type="text" placeholder="Description (optional)" value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              style={{ padding: '10px 12px', border: '1px solid #dfe1e6', borderRadius: '4px', fontSize: '14px' }}
            />
            <Button onClick={handleCreate} disabled={creating}>{creating ? 'Creating\u2026' : 'Create'}</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
