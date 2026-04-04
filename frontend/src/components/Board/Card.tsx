import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { Card as CardType } from '../../types';

interface CardProps {
  card: CardType;
  index: number;
}

export function Card({ card, index }: CardProps) {
  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            background: snapshot.isDragging ? '#e6f0ff' : '#fff',
            borderRadius: '4px',
            padding: '10px 12px',
            marginBottom: '8px',
            boxShadow: snapshot.isDragging ? '0 4px 12px rgba(0,0,0,0.15)' : '0 1px 3px rgba(0,0,0,0.1)',
            cursor: 'grab',
            ...provided.draggableProps.style,
          }}
        >
          {card.labels.length > 0 && (
            <div style={{ display: 'flex', gap: '4px', marginBottom: '6px', flexWrap: 'wrap' }}>
              {card.labels.map((label) => (
                <span key={label.id} style={{
                  display: 'inline-block', width: '32px', height: '6px',
                  borderRadius: '3px', background: label.color,
                }} title={label.name} />
              ))}
            </div>
          )}
          <div style={{ fontSize: '14px', color: '#172b4d' }}>{card.title}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
            {card.dueDate && (
              <span style={{ fontSize: '12px', color: '#6b778c' }}>
                {'\uD83D\uDCC5'} {new Date(card.dueDate).toLocaleDateString()}
              </span>
            )}
            {card.assignee && (
              <span style={{
                width: '24px', height: '24px', borderRadius: '50%',
                background: '#0052cc', color: '#fff', fontSize: '11px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 600, marginLeft: 'auto',
              }}>
                {card.assignee.displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
