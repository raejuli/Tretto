import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LoginForm } from '../components/Auth/LoginForm';

export default function LoginPage() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', background: '#0052cc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '8px', padding: '40px', width: '360px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <h1 style={{ margin: '0 0 24px', textAlign: 'center', color: '#172b4d' }}>Tretto</h1>
        <LoginForm onSuccess={() => navigate('/dashboard')} />
        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px', color: '#6b778c' }}>
          No account? <Link to="/register">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
