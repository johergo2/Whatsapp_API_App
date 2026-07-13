'use client';

import { useApp } from '@/lib/store';
import { Sidebar } from '@/components/ui/Sidebar';
import { LoginForm } from '@/components/LoginForm';
import { Dashboard } from '@/components/Dashboard';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { state, dispatch } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (state.user && state.user.cliente_id === null && state.user.cliente_ids && state.user.cliente_ids.length > 1 && !state.sessionLoading) {
      router.push('/seleccionar-cliente');
    }
  }, [state.user, state.sessionLoading, router]);

  if (!state.user) {
    return <LoginForm />;
  }

  // Usuario con múltiples clientes sin seleccionar -> pantalla selección
  if (state.user.cliente_id === null && state.user.cliente_ids && state.user.cliente_ids.length > 1) {
    return (
      <div id="login-screen" className="screen active">
        <div className="login-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Cargando sesión...</p>
        </div>
      </div>
    );
  }

  // Usuario con cliente seleccionado pero datos aún no cargados -> loading
  if (state.sessionLoading || (state.user.cliente_id !== null && !state.cliente)) {
    return (
      <div id="login-screen" className="screen active">
        <div className="login-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Cargando datos del cliente...</p>
        </div>
      </div>
    );
  }

  return (
    <div id="app">
      {state.demoMode && (
        <div id="demo-banner" className="demo-banner">
          ⚡ Modo Demo — Los datos son simulados
        </div>
      )}
      <div className="layout">
        <Sidebar />
        <main id="main-content" className="main-content">
          <div className="topbar">
            <button className="btn-icon sidebar-toggle" onClick={() => document.getElementById('sidebar')?.classList.toggle('open')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <span style={{ fontSize: 14, color: '#667781' }}>
              {state.cliente?.plan || 'Sin plan'} — {state.cliente ? state.cliente.requests_max - state.cliente.requests_usadas : 0} disponibles
            </span>
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: '#667781' }}>{state.user.nombre}</span>
              <button className="btn btn-outline btn-sm" style={{ background: '#075E54', color: '#fff', borderColor: '#075E54', fontWeight: 700 }} onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('mercurio_user');
                  dispatch({ type: 'LOGOUT' });
                  window.location.href = '/';
                }
              }}>
                Salir
              </button>
            </span>
          </div>
          <Dashboard />
        </main>
      </div>
    </div>
  );
}
