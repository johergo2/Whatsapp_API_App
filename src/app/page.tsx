'use client';

import { useApp } from '@/lib/store';
import { Sidebar } from '@/components/ui/Sidebar';
import { LoginForm } from '@/components/LoginForm';
import { Dashboard } from '@/components/Dashboard';

export default function Home() {
  const { state } = useApp();

  if (!state.cliente) {
    return <LoginForm />;
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
              {state.cliente.plan} — {state.cliente.requests_max - state.cliente.requests_usadas} disponibles
            </span>
            <button className="btn btn-outline btn-sm" style={{ marginLeft: 'auto' }} onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/login';
              }
            }}>
              Salir
            </button>
          </div>
          <Dashboard />
        </main>
      </div>
    </div>
  );
}
