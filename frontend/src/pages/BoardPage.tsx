import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBoard } from '../hooks/useBoard';
import { BoardView } from '../components/Board/BoardView';
import { Spinner } from '../components/common/Spinner';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { updateBoard, deleteBoard } from '../api/boards';

export const BoardSearchContext = React.createContext<string>('');

export default function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const { state, loadBoard } = useBoard();
  const [searchText, setSearchText] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [settingTitle, setSettingTitle] = useState('');
  const [settingDesc, setSettingDesc] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (boardId) loadBoard(boardId);
  }, [boardId, loadBoard]);

  useEffect(() => {
    if (state.board) {
      setSettingTitle(state.board.title);
      setSettingDesc(state.board.description || '');
    }
  }, [state.board]);

  if (state.loading) return <Spinner />;
  if (state.error) return <div style={{ padding: '40px', color: '#de350b' }}>Error: {state.error}</div>;
  if (!state.board) return null;

  const canEdit = state.board.myRole === 'OWNER' || state.board.myRole === 'EDITOR';
  const isOwner = state.board.myRole === 'OWNER';

  const handleSaveSettings = async () => {
    if (!state.board || !settingTitle.trim()) return;
    setSavingSettings(true);
    try {
      await updateBoard(state.board.id, { title: settingTitle.trim(), description: settingDesc.trim() });
      await loadBoard(state.board.id);
      setShowSettings(false);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleArchiveBoard = async () => {
    if (!state.board) return;
    if (!window.confirm(`Archive board "${state.board.title}"? It will be hidden from your dashboard.`)) return;
    await deleteBoard(state.board.id);
    navigate('/dashboard');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#026aa7', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <Button variant="secondary" onClick={() => navigate('/dashboard')} style={{ padding: '4px 12px', fontSize: '13px' }}>← Boards</Button>
        <h2 style={{ margin: 0, color: '#fff', fontSize: '18px', fontWeight: 700, flex: 1 }}>{state.board.title}</h2>

        {/* Search filter */}
        <input
          type="search"
          placeholder="Filter cards…"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{
            padding: '5px 10px', borderRadius: '4px', border: 'none',
            fontSize: '13px', width: '180px', background: 'rgba(255,255,255,0.85)',
          }}
        />

        {/* Settings */}
        {canEdit && (
          <Button variant="secondary" onClick={() => setShowSettings(true)} style={{ padding: '4px 12px', fontSize: '13px' }}>
            ⚙ Settings
          </Button>
        )}
      </div>

      <BoardSearchContext.Provider value={searchText.toLowerCase()}>
        <BoardView />
      </BoardSearchContext.Provider>

      {showSettings && (
        <Modal title="Board Settings" onClose={() => setShowSettings(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#5e6c84', display: 'block', marginBottom: '4px' }}>Title</label>
              <input
                autoFocus
                value={settingTitle}
                onChange={(e) => setSettingTitle(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #dfe1e6', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#5e6c84', display: 'block', marginBottom: '4px' }}>Description</label>
              <textarea
                value={settingDesc}
                onChange={(e) => setSettingDesc(e.target.value)}
                rows={3}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #dfe1e6', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }}
              />
            </div>

            {/* Members list */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#5e6c84', display: 'block', marginBottom: '6px' }}>Members</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {state.board.members.map((m) => (
                  <div key={m.userId} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <span style={{
                      width: '28px', height: '28px', borderRadius: '50%', background: '#0052cc',
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', fontWeight: 600, flexShrink: 0,
                    }}>
                      {m.displayName.charAt(0).toUpperCase()}
                    </span>
                    <span style={{ flex: 1, color: '#172b4d' }}>{m.displayName}</span>
                    <span style={{
                      fontSize: '11px', color: '#5e6c84', background: '#f4f5f7',
                      padding: '1px 6px', borderRadius: '3px', border: '1px solid #dfe1e6',
                    }}>{m.role}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #f4f5f7' }}>
              {isOwner ? (
                <Button variant="danger" onClick={handleArchiveBoard} style={{ fontSize: '13px' }}>Archive board</Button>
              ) : <span />}
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="secondary" onClick={() => setShowSettings(false)}>Cancel</Button>
                <Button onClick={handleSaveSettings} disabled={savingSettings || !settingTitle.trim()}>
                  {savingSettings ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

