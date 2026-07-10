'use client';

import { useState } from 'react';
import { useApp } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { loadAllClientData } from '@/lib/services';

export function LoginForm() {
  const { dispatch } = useApp();
  const router = useRouter();
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showKey, setShowKey] = useState(false);

  async function loadData() {
    try {
      const data = await loadAllClientData();
      dispatch({ type: 'SET_ALL_DATA', payload: data });
    } catch {
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/cliente', {
        headers: { 'X-API-Key': apiKey.trim() },
      });

      if (!res.ok) {
        setError('API Key inválida');
        setLoading(false);
        return;
      }

      const data = await res.json();
      dispatch({ type: 'SET_CLIENTE', payload: data });
      dispatch({ type: 'SET_DEMO_MODE', payload: false });
      localStorage.setItem('mercurio_api_key', apiKey.trim());

      if (data.id) await loadData();

      router.push('/');
    } catch {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div id="login-screen" className="screen active">
      <div className="login-card">
        <div className="login-header">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
          </svg>
          <h1>Mercurio Send</h1>
          <p className="subtitle">Plataforma de envío masivo de mensajes</p>
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="api-key">API Key</label>
            <div className="input-wrapper">
              <input
                type={showKey ? 'text' : 'password'}
                id="api-key"
                placeholder="Ingrese su API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowKey(!showKey)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {showKey ? (
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l23 23" />
                  ) : (
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  )}
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? (
              <span className="btn-loader" style={{ display: 'inline-flex' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeDasharray="31.4 31.4" strokeLinecap="round">
                    <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite" />
                  </circle>
                </svg>
                Validando...
              </span>
            ) : (
              <span className="btn-text">Ingresar</span>
            )}
          </button>
        </form>
        {error && <p className="login-error">{error}</p>}
      </div>
    </div>
  );
}
