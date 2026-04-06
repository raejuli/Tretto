import React from 'react';
import { Button } from './Button';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        background: '#fff', borderRadius: '8px', padding: '24px',
        minWidth: '360px', maxWidth: '600px', width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>{title}</h2>
          <Button variant="secondary" onClick={onClose} style={{ padding: '4px 8px' }}>✕</Button>
        </div>
        {children}
      </div>
    </div>
  );
}
