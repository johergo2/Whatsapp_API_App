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
    if (!state.demoMode && !loaded.current) {
      loaded.current = true;
      fetchMessages()
        .then((msgs) => dispatch({ type: 'SET_MESSAGES', payload: msgs }))
        .catch(() => {});
    }
  }, [state.demoMode, dispatch]);

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
            <button className="btn btn-outline btn-sm" style={{ marginLeft: 'auto', background: '#075E54', color: '#fff', borderColor: '#075E54' }} onClick={() => { localStorage.removeItem('mercurio_user'); dispatch({ type: 'LOGOUT' }); window.location.href = '/'; }}>Salir</button>
          </div>
          <section className="section active" style={{ position: 'relative', marginTop: -32 }}>
            <img src="/Productosasesorias_transp.png" alt="" style={{ position: 'absolute', top: 24, right: 0, width: 180, height: 'auto', zIndex: 0 }} />
            <div className="section-header">
              <div style={{ textAlign: 'center' }}>
                <svg width="56" height="56" viewBox="0 0 175.216 175.552" style={{ marginBottom: 4 }}>
                  <path fill="#075E54" stroke="#fff" strokeWidth="16" d="M87.184 25.227c-33.733 0-61.166 27.423-61.178 61.13a60.98 60.98 0 0 0 9.349 32.535l1.455 2.312-6.179 22.559 23.146-6.069 2.235 1.324c9.387 5.571 20.15 8.518 31.126 8.524h.023c33.707 0 61.14-27.426 61.153-61.135a60.75 60.75 0 0 0-17.895-43.251 60.75 60.75 0 0 0-43.235-17.929z"/>
                  <path fill="#fff" fillRule="evenodd" d="M68.772 55.603c-1.378-3.061-2.828-3.123-4.137-3.176l-3.524-.043c-1.226 0-3.218.46-4.902 2.3s-6.435 6.287-6.435 15.332 6.588 17.785 7.506 19.013 12.718 20.381 31.405 27.75c15.529 6.124 18.689 4.906 22.061 4.6s10.877-4.447 12.408-8.74 1.532-7.971 1.073-8.74-1.685-1.226-3.525-2.146-10.877-5.367-12.562-5.981-2.91-.919-4.137.921-4.746 5.979-5.819 7.206-2.144 1.381-3.984.462-7.76-2.861-14.784-9.124c-5.465-4.873-9.154-10.891-10.228-12.73s-.114-2.835.808-3.751c.825-.824 1.838-2.147 2.759-3.22s1.224-1.84 1.836-3.065.307-2.301-.153-3.22-4.032-10.011-5.666-13.647"/>
                </svg>
                <div style={{ color: '#075E54', fontSize: 22, fontWeight: 700, marginTop: -12, marginBottom: 2 }}>Mercurio Software</div>
              </div>
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
