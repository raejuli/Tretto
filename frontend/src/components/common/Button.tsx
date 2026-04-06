import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
}

const styles: Record<string, React.CSSProperties> = {
  base: {
    padding: '8px 16px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '14px',
    transition: 'opacity 0.2s',
  },
  primary: { background: '#0052cc', color: '#fff' },
  secondary: { background: '#f4f5f7', color: '#42526e' },
  danger: { background: '#de350b', color: '#fff' },
};

export function Button({ variant = 'primary', style, children, ...props }: ButtonProps) {
  return (
    <button style={{ ...styles.base, ...styles[variant], ...style }} {...props}>
      {children}
    </button>
  );
}
