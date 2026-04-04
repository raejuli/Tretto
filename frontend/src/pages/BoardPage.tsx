import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBoard } from '../hooks/useBoard';
import { BoardView } from '../components/Board/BoardView';
import { Spinner } from '../components/common/Spinner';
import { Button } from '../components/common/Button';

export default function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const { state, loadBoard } = useBoard();

  useEffect(() => {
    if (boardId) loadBoard(boardId);
  }, [boardId, loadBoard]);

  if (state.loading) return <Spinner />;
  if (state.error) return <div style={{ padding: '40px', color: '#de350b' }}>Error: {state.error}</div>;
  if (!state.board) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#026aa7', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Button variant="secondary" onClick={() => navigate('/dashboard')} style={{ padding: '4px 12px', fontSize: '13px' }}>{'\u2190'} Boards</Button>
        <h2 style={{ margin: 0, color: '#fff', fontSize: '18px', fontWeight: 700 }}>{state.board.title}</h2>
      </div>
      <BoardView />
    </div>
  );
}
