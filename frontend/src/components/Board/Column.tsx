import React, { useState } from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { Column as ColumnType } from '../../types';
import { Card } from './Card';
import { Button } from '../common/Button';
import { useBoard } from '../../hooks/useBoard';

interface ColumnProps {
  column: ColumnType;
  index: number;
}

export function Column({ column, index }: ColumnProps) {
  const { addCard, renameColumn, deleteColumn, state } = useBoard();
  const [addingCard, setAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(column.title);
  const [saving, setSaving] = useState(false);

  const canEdit = state.board?.myRole === 'OWNER' || state.board?.myRole === 'EDITOR';

  const handleAddCard = async () => {
    if (!newCardTitle.trim()) return;
    await addCard(column.id, newCardTitle.trim());
    setNewCardTitle('');
    setAddingCard(false);
  };

  const handleRenameCommit = async () => {
    const trimmed = titleDraft.trim();
    if (!trimmed || trimmed === column.title) {
      setTitleDraft(column.title);
      setEditingTitle(false);
      return;
    }
    setSaving(true);
    try {
      await renameColumn(column.id, trimmed);
    } finally {
      setSaving(false);
      setEditingTitle(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete column "${column.title}" and all its cards? This cannot be undone.`)) return;
    await deleteColumn(column.id);
  };

  const sortedCards = column.cards.slice().sort((a, b) => a.position - b.position);

  return (
    <Draggable draggableId={column.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          style={{
            background: snapshot.isDragging ? '#deebff' : '#f4f5f7',
            borderRadius: '6px',
            padding: collapsed ? '8px 12px' : '12px',
            width: collapsed ? '56px' : '272px',
            minWidth: collapsed ? '56px' : '272px',
            marginRight: '12px',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: collapsed ? 'auto' : 'calc(100vh - 140px)',
            transition: 'width 0.2s, min-width 0.2s',
            overflow: 'hidden',
            ...provided.draggableProps.style,
          }}
        >
          <div
            {...provided.dragHandleProps}
            style={{
              marginBottom: collapsed ? 0 : '12px',
              cursor: 'grab',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              justifyContent: 'space-between',
            }}
          >
            {collapsed ? (
              <button
                onClick={() => setCollapsed(false)}
                title={column.title}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  writingMode: 'vertical-rl', transform: 'rotate(180deg)',
                  color: '#172b4d', fontWeight: 600, fontSize: '13px',
                  padding: '4px 0', maxHeight: '160px', overflow: 'hidden',
                  textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}
              >
                {column.title}
              </button>
            ) : (
              <>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {editingTitle && canEdit ? (
                    <input
                      autoFocus
                      value={titleDraft}
                      onChange={(e) => setTitleDraft(e.target.value)}
                      onBlur={handleRenameCommit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameCommit();
                        if (e.key === 'Escape') { setTitleDraft(column.title); setEditingTitle(false); }
                      }}
                      disabled={saving}
                      style={{
                        fontSize: '14px', fontWeight: 600, color: '#172b4d',
                        border: '1px solid #0052cc', borderRadius: '3px',
                        padding: '2px 6px', width: '100%', boxSizing: 'border-box',
                      }}
                    />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <h3
                        style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#172b4d', cursor: canEdit ? 'pointer' : 'default' }}
                        onClick={() => canEdit && setEditingTitle(true)}
                        title={canEdit ? 'Click to rename' : undefined}
                      >
                        {column.title}
                      </h3>
                      <span style={{
                        fontSize: '11px', color: '#5e6c84', background: '#dfe1e6',
                        borderRadius: '10px', padding: '1px 7px', fontWeight: 600,
                      }}>
                        {column.cards.length}
                      </span>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                  <button
                    onClick={() => setCollapsed(true)}
                    title="Collapse"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: '#5e6c84', fontSize: '13px', borderRadius: '3px' }}
                  >⇤</button>
                  {canEdit && (
                    <button
                      onClick={handleDelete}
                      title="Delete column"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: '#5e6c84', fontSize: '13px', borderRadius: '3px' }}
                    >🗑</button>
                  )}
                </div>
              </>
            )}
          </div>

          {!collapsed && (
            <>
              <Droppable droppableId={column.id} type="CARD">
                {(dropProvided, dropSnapshot) => (
                  <div
                    ref={dropProvided.innerRef}
                    {...dropProvided.droppableProps}
                    style={{
                      flexGrow: 1,
                      overflowY: 'auto',
                      minHeight: '8px',
                      background: dropSnapshot.isDraggingOver ? '#dae8ff' : 'transparent',
                      borderRadius: '4px',
                      transition: 'background 0.15s',
                    }}
                  >
                    {sortedCards.map((card, i) => (
                      <Card key={card.id} card={card} columnId={column.id} index={i} />
                    ))}
                    {dropProvided.placeholder}
                  </div>
                )}
              </Droppable>

              {canEdit && (
                addingCard ? (
                  <div style={{ marginTop: '8px' }}>
                    <textarea
                      autoFocus
                      value={newCardTitle}
                      onChange={(e) => setNewCardTitle(e.target.value)}
                      placeholder="Enter card title…"
                      style={{
                        width: '100%', padding: '8px', borderRadius: '4px',
                        border: '1px solid #dfe1e6', fontSize: '14px', resize: 'none', boxSizing: 'border-box',
                      }}
                      rows={2}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddCard(); } }}
                    />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <Button onClick={handleAddCard}>Add</Button>
                      <Button variant="secondary" onClick={() => { setAddingCard(false); setNewCardTitle(''); }}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="secondary" onClick={() => setAddingCard(true)} style={{ marginTop: '8px', width: '100%' }}>
                    + Add a card
                  </Button>
                )
              )}
            </>
          )}
        </div>
      )}
    </Draggable>
  );
}

