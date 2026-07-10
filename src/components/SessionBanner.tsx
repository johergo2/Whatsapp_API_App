'use client';

import { useApp } from '@/lib/store';

export function SessionBanner() {
  const { state } = useApp();

  if (state.sessionLoading) {
    return (
      <div style={{ padding: '12px 24px', background: '#E3F2FD', color: '#1565C0', textAlign: 'center', fontSize: 14 }}>
        Restaurando sesión…
      </div>
    );
  }

  if (state.sessionExpired) {
    return (
      <div style={{ padding: '12px 24px', background: '#FFEBEE', color: '#C62828', textAlign: 'center', fontSize: 14 }}>
        Sesión caducada o API Key inválida.{' '}
        <button
          className="btn btn-outline btn-sm"
          style={{ marginLeft: 8 }}
          onClick={() => { localStorage.removeItem('mercurio_api_key'); window.location.href = '/login'; }}
        >
          Ir al login
        </button>
      </div>
    );
  }

  return null;
}
