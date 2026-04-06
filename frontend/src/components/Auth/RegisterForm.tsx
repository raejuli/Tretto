import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../common/Button';

interface RegisterFormProps {
  onSuccess: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, displayName, password);
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
        type="text" placeholder="Display Name" value={displayName} required
        onChange={(e) => setDisplayName(e.target.value)}
        style={inputStyle}
      />
      <input
        type="password" placeholder="Password" value={password} required minLength={6}
        onChange={(e) => setPassword(e.target.value)}
        style={inputStyle}
      />
      <Button type="submit" disabled={loading}>{loading ? 'Creating account\u2026' : 'Create Account'}</Button>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '10px 12px', border: '1px solid #dfe1e6', borderRadius: '4px', fontSize: '14px',
};
