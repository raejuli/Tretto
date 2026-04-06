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
  const { addCard } = useBoard();
  const [addingCard, setAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');

  const handleAddCard = async () => {
    if (!newCardTitle.trim()) return;
    await addCard(column.id, newCardTitle.trim());
    setNewCardTitle('');
    setAddingCard(false);
  };

  return (
    <Draggable draggableId={column.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          style={{
            background: snapshot.isDragging ? '#deebff' : '#f4f5f7',
            borderRadius: '6px',
            padding: '12px',
            width: '272px',
            minWidth: '272px',
            marginRight: '12px',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 'calc(100vh - 140px)',
            ...provided.draggableProps.style,
          }}
        >
          <div {...provided.dragHandleProps} style={{ marginBottom: '12px', cursor: 'grab' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#172b4d' }}>
              {column.title}
            </h3>
          </div>

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
                {column.cards
                  .slice()
                  .sort((a, b) => a.position - b.position)
                  .map((card, i) => (
                    <Card key={card.id} card={card} index={i} />
                  ))}
                {dropProvided.placeholder}
              </div>
            )}
          </Droppable>

          {addingCard ? (
            <div style={{ marginTop: '8px' }}>
              <textarea
                autoFocus
                value={newCardTitle}
                onChange={(e) => setNewCardTitle(e.target.value)}
                placeholder="Enter card title\u2026"
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
          )}
        </div>
      )}
    </Draggable>
  );
}
