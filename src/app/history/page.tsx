'use client';

import { useApp } from '@/lib/store';
import { Sidebar } from '@/components/ui/Sidebar';
import { useEffect, useRef } from 'react';
import { fetchMessages } from '@/lib/services';

function formatDate(dateStr: string) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' });
  } catch {
    return dateStr;
  }
}

export default function HistoryPage() {
  const { state, dispatch } = useApp();
  const loaded = useRef(false);

  useEffect(() => {
    if (!state.demoMode && state.cliente?.id && !loaded.current) {
      loaded.current = true;
      fetchMessages(state.cliente.id)
        .then((msgs) => dispatch({ type: 'SET_MESSAGES', payload: msgs }))
        .catch(() => {});
    }
  }, [state.cliente?.id, state.demoMode, dispatch]);

  return (
    <div id="app">
      {state.demoMode && (
        <div id="demo-banner" className="demo-banner">⚡ Modo Demo — Los datos son simulados</div>
      )}
      <div className="layout">
        <Sidebar />
        <main className="main-content">
          <div className="topbar">
            <button className="btn-icon sidebar-toggle" onClick={() => document.getElementById('sidebar')?.classList.toggle('open')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
            </button>
            <span style={{ fontSize: 14, color: '#667781' }}>Historial</span>
            <button className="btn btn-outline btn-sm" style={{ marginLeft: 'auto' }} onClick={() => { window.location.href = '/login'; }}>Salir</button>
          </div>
          <section className="section active">
            <div className="section-header">
              <h2>Historial de mensajes</h2>
              <p>Consulte el estado de los mensajes enviados</p>
            </div>
            <div className="toolbar">
              <span className="toolbar-counter">{state.messages.length} registros</span>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>De</th>
                    <th>Para</th>
                    <th>Dirección</th>
                    <th>Mensaje</th>
                    <th>Estado</th>
                    <th>Wamid</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {state.messages.length === 0 ? (
                    <tr><td colSpan={8} className="empty-state">No hay registros de mensajes</td></tr>
                  ) : (
                    state.messages.map((msg, i) => (
                      <tr key={i}>
                        <td>{msg.id || '-'}</td>
                        <td>{msg.from_number || '-'}</td>
                        <td>{msg.to_number || '-'}</td>
                        <td>{msg.direction || '-'}</td>
                        <td>{msg.mensaje || '-'}</td>
                        <td>{msg.estado || '-'}</td>
                        <td style={{ fontSize: 11 }}>{msg.wamid ? msg.wamid.slice(0, 20) + '…' : '-'}</td>
                        <td>{msg.fecha_creacion ? formatDate(msg.fecha_creacion) : '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
