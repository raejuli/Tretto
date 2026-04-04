import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../common/Button';

interface LoginFormProps {
  onSuccess: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      onSuccess();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {error && <div style={{ color: '#de350b', fontSize: '14px' }}>{error}</div>}
      <input
        type="email" placeholder="Email" value={email} required
        onChange={(e) => setEmail(e.target.value)}
        style={inputStyle}
      />
      <input
        type="password" placeholder="Password" value={password} required
        onChange={(e) => setPassword(e.target.value)}
        style={inputStyle}
      />
      <Button type="submit" disabled={loading}>{loading ? 'Signing in\u2026' : 'Sign In'}</Button>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '10px 12px', border: '1px solid #dfe1e6', borderRadius: '4px', fontSize: '14px',
};
