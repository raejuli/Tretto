import React, { useContext, useState } from 'react';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import { useBoard } from '../../hooks/useBoard';
import { Column } from './Column';
import { Button } from '../common/Button';
import { BoardSearchContext } from '../../pages/BoardPage';

export function BoardView() {
  const { state, moveCard, moveColumn, addColumn } = useBoard();
  const searchText = useContext(BoardSearchContext);
  const { board } = state;
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');

  if (!board) return null;

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    if (result.type === 'COLUMN') {
      moveColumn(result.draggableId, result.destination.index);
    } else {
      moveCard(
        result.draggableId,
        result.source.droppableId,
        result.destination.droppableId,
        result.destination.index,
      );
    }
  };

  const handleAddColumn = async () => {
    if (!newColumnTitle.trim()) return;
    await addColumn(newColumnTitle.trim());
    setNewColumnTitle('');
    setAddingColumn(false);
  };

  const sortedColumns = board.columns.slice().sort((a, b) => a.position - b.position);

  const filteredColumns = searchText
    ? sortedColumns.map((col) => ({
        ...col,
        cards: col.cards.filter((c) => c.title.toLowerCase().includes(searchText)),
      }))
    : sortedColumns;

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="board" type="COLUMN" direction="horizontal">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{ display: 'flex', alignItems: 'flex-start', padding: '12px', overflowX: 'auto', minHeight: 'calc(100vh - 120px)' }}
          >
            {filteredColumns.map((column, index) => (
              <Column key={column.id} column={column} index={index} />
            ))}
            {provided.placeholder}

            {addingColumn ? (
              <div style={{ background: '#f4f5f7', borderRadius: '6px', padding: '12px', width: '272px', minWidth: '272px' }}>
                <input
                  autoFocus
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  placeholder="Enter list title…"
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #dfe1e6', fontSize: '14px', boxSizing: 'border-box' }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddColumn(); }}
                />
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <Button onClick={handleAddColumn}>Add list</Button>
                  <Button variant="secondary" onClick={() => { setAddingColumn(false); setNewColumnTitle(''); }}>Cancel</Button>
                </div>
              </div>
            ) : (
              <Button
                variant="secondary"
                onClick={() => setAddingColumn(true)}
                style={{ minWidth: '272px', height: '42px', opacity: 0.8 }}
              >
                + Add another list
              </Button>
            )}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

