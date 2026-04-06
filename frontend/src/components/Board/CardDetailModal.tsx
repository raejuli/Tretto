import React, { useEffect, useRef, useState } from 'react';
import { Card, BoardMember, Label } from '../../types';
import { useBoard } from '../../hooks/useBoard';
import { Button } from '../common/Button';
import * as labelsApi from '../../api/labels';

interface CardDetailModalProps {
  card: Card;
  columnId: string;
  boardId: string;
  members: BoardMember[];
  onClose: () => void;
  canEdit: boolean;
}

const LABEL_COLORS = [
  '#61bd4f', '#f2d600', '#ff9f1a', '#eb5a46', '#c377e0',
  '#0079bf', '#00c2e0', '#51e898', '#ff78cb', '#344563',
];

export function CardDetailModal({ card, columnId, boardId, members, onClose, canEdit }: CardDetailModalProps) {
  const { updateCard, deleteCard, addLabelToCard, removeLabelFromCard } = useBoard();
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [dueDate, setDueDate] = useState(card.dueDate ? card.dueDate.slice(0, 10) : '');
  const [assigneeId, setAssigneeId] = useState(card.assignee?.id ?? '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [boardLabels, setBoardLabels] = useState<Label[]>([]);
  const [showLabelForm, setShowLabelForm] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0]);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
    labelsApi.getLabels(boardId).then(setBoardLabels).catch(() => {});
  }, [boardId]);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await updateCard(card.id, columnId, {
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: dueDate || null,
        assigneeId: assigneeId || null,
      } as Parameters<typeof updateCard>[2]);
    } finally {
      setSaving(false);
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this card? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await deleteCard(card.id, columnId);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleLabel = async (label: Label) => {
    const isAttached = card.labels.some((l) => l.id === label.id);
    if (isAttached) {
      await removeLabelFromCard(card.id, columnId, label.id);
    } else {
      await addLabelToCard(card.id, columnId, label);
    }
  };

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) return;
    const created = await labelsApi.createLabel(boardId, newLabelName.trim(), newLabelColor);
    setBoardLabels((prev) => [...prev, created]);
    setNewLabelName('');
    setShowLabelForm(false);
  };

  const handleDeleteLabel = async (labelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await labelsApi.deleteLabel(labelId);
    setBoardLabels((prev) => prev.filter((l) => l.id !== labelId));
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        zIndex: 1000, overflowY: 'auto', padding: '40px 16px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#f4f5f7', borderRadius: '8px', width: '100%', maxWidth: '700px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div style={{ background: '#fff', borderRadius: '8px 8px 0 0', padding: '16px 20px', borderBottom: '1px solid #dfe1e6' }}>
          {canEdit ? (
            <input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%', fontSize: '18px', fontWeight: 700, color: '#172b4d',
                border: 'none', outline: 'none', background: 'transparent', padding: 0,
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
            />
          ) : (
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#172b4d' }}>{card.title}</h2>
          )}
        </div>

        <div style={{ display: 'flex', gap: '16px', padding: '16px 20px' }}>
          {/* Main content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Labels display */}
            {card.labels.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#5e6c84', textTransform: 'uppercase', marginBottom: '6px' }}>Labels</div>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {card.labels.map((l) => (
                    <span key={l.id} style={{
                      background: l.color, color: '#fff', fontSize: '12px', fontWeight: 600,
                      padding: '3px 8px', borderRadius: '3px',
                    }}>{l.name}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#5e6c84', textTransform: 'uppercase', marginBottom: '6px' }}>Description</div>
              {canEdit ? (
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a more detailed description…"
                  rows={4}
                  style={{
                    width: '100%', padding: '8px', borderRadius: '4px',
                    border: '1px solid #dfe1e6', fontSize: '14px', resize: 'vertical',
                    boxSizing: 'border-box', fontFamily: 'inherit',
                  }}
                />
              ) : (
                <p style={{ color: '#172b4d', fontSize: '14px', margin: 0 }}>
                  {card.description || <em style={{ color: '#5e6c84' }}>No description.</em>}
                </p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ width: '180px', flexShrink: 0 }}>
            {/* Assignee */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#5e6c84', textTransform: 'uppercase', marginBottom: '6px' }}>Assignee</div>
              {canEdit ? (
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  style={{
                    width: '100%', padding: '6px 8px', borderRadius: '4px',
                    border: '1px solid #dfe1e6', fontSize: '13px', background: '#fff',
                  }}
                >
                  <option value="">None</option>
                  {members.map((m) => (
                    <option key={m.userId} value={m.userId}>{m.displayName}</option>
                  ))}
                </select>
              ) : (
                <span style={{ fontSize: '13px', color: '#172b4d' }}>
                  {card.assignee?.displayName ?? 'None'}
                </span>
              )}
            </div>

            {/* Due date */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#5e6c84', textTransform: 'uppercase', marginBottom: '6px' }}>Due date</div>
              {canEdit ? (
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  style={{
                    width: '100%', padding: '6px 8px', borderRadius: '4px',
                    border: '1px solid #dfe1e6', fontSize: '13px', boxSizing: 'border-box',
                  }}
                />
              ) : (
                <span style={{ fontSize: '13px', color: '#172b4d' }}>
                  {card.dueDate ? new Date(card.dueDate).toLocaleDateString() : 'None'}
                </span>
              )}
            </div>

            {/* Labels */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#5e6c84', textTransform: 'uppercase', marginBottom: '6px' }}>Labels</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {boardLabels.map((label) => {
                  const attached = card.labels.some((l) => l.id === label.id);
                  return (
                    <div
                      key={label.id}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '4px 8px', borderRadius: '4px', cursor: canEdit ? 'pointer' : 'default',
                        background: attached ? label.color : '#f4f5f7',
                        color: attached ? '#fff' : '#172b4d',
                        fontSize: '12px', fontWeight: 600,
                        border: `1px solid ${attached ? label.color : '#dfe1e6'}`,
                      }}
                      onClick={() => canEdit && handleToggleLabel(label)}
                    >
                      <span>{label.name}</span>
                      {canEdit && (
                        <button
                          onClick={(e) => handleDeleteLabel(label.id, e)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 0 4px', fontSize: '12px', color: 'inherit', opacity: 0.7 }}
                          title="Delete label"
                        >✕</button>
                      )}
                    </div>
                  );
                })}
              </div>
              {canEdit && (
                <div style={{ marginTop: '8px' }}>
                  {showLabelForm ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <input
                        autoFocus
                        value={newLabelName}
                        onChange={(e) => setNewLabelName(e.target.value)}
                        placeholder="Label name"
                        style={{ padding: '4px 6px', borderRadius: '4px', border: '1px solid #dfe1e6', fontSize: '12px' }}
                      />
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {LABEL_COLORS.map((c) => (
                          <div
                            key={c}
                            onClick={() => setNewLabelColor(c)}
                            style={{
                              width: '20px', height: '20px', borderRadius: '4px', background: c, cursor: 'pointer',
                              outline: newLabelColor === c ? '2px solid #172b4d' : 'none', outlineOffset: '1px',
                            }}
                          />
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <Button onClick={handleCreateLabel} style={{ fontSize: '12px', padding: '4px 8px' }}>Add</Button>
                        <Button variant="secondary" onClick={() => setShowLabelForm(false)} style={{ fontSize: '12px', padding: '4px 8px' }}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowLabelForm(true)}
                      style={{
                        width: '100%', padding: '4px 8px', borderRadius: '4px',
                        border: '1px dashed #dfe1e6', background: 'none', cursor: 'pointer',
                        fontSize: '12px', color: '#5e6c84',
                      }}
                    >
                      + Create label
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px', background: '#fff', borderTop: '1px solid #dfe1e6',
          borderRadius: '0 0 8px 8px', display: 'flex', justifyContent: 'space-between',
        }}>
          {canEdit ? (
            <Button variant="danger" onClick={handleDelete} disabled={deleting} style={{ fontSize: '13px', padding: '6px 12px' }}>
              {deleting ? 'Deleting…' : 'Delete card'}
            </Button>
          ) : <span />}
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary" onClick={onClose} style={{ fontSize: '13px', padding: '6px 12px' }}>
              {canEdit ? 'Cancel' : 'Close'}
            </Button>
            {canEdit && (
              <Button onClick={handleSave} disabled={saving || !title.trim()} style={{ fontSize: '13px', padding: '6px 12px' }}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
