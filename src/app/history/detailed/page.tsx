'use client';

import { useApp } from '@/lib/store';
import { Sidebar } from '@/components/ui/Sidebar';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import * as XLSX from 'xlsx';

function formatColombiaDate(dateStr: string) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z');
    if (isNaN(d.getTime())) return dateStr;
    const p = new Intl.DateTimeFormat('es-CO', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(d);
    const get = (t: string) => p.find(x => x.type === t)?.value || '00';
    return `${get('year')}/${get('month')}/${get('day')} ${get('hour')}:${get('minute')}`;
  } catch {
    return dateStr;
  }
}

export default function HistoryDetailedPage() {
  useRoleGuard();
  const { state, dispatch } = useApp();
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const pageSize = 20;

  const [fDe, setFDe] = useState('');
  const [fPara, setFPara] = useState('');
  const [fDir, setFDir] = useState('');
  const [fMsg, setFMsg] = useState('');
  const [fEst, setFEst] = useState('');
  const [fCliente, setFCliente] = useState('');
  const [fFechaDesde, setFFechaDesde] = useState('');
  const [fFechaHasta, setFFechaHasta] = useState('');
  const [total, setTotal] = useState(0);
  const [downloadLoading, setDownloadLoading] = useState(false);

  const buildParams = useCallback((all = false) => {
    const params = new URLSearchParams();
    if (all) params.set('all', 'true');
    if (fDir) params.set('direction', fDir);
    if (fCliente) params.set('cliente_nombre', fCliente);
    if (fDe) params.set('from_number', fDe);
    if (fPara) params.set('to_number', fPara);
    if (fMsg) params.set('mensaje', fMsg);
    if (fEst) params.set('estado', fEst);
    if (fFechaDesde) params.set('fecha_desde', fFechaDesde);
    if (fFechaHasta) params.set('fecha_hasta', fFechaHasta);
    return params;
  }, [fDir, fCliente, fDe, fPara, fMsg, fEst, fFechaDesde, fFechaHasta]);

  const exportExcel = useCallback(async () => {
    const cId = state.user?.cliente_id;
    const uId = state.user?.id;
    if (!cId || !uId) return;
    setDownloadLoading(true);
    try {
      const baseParams = buildParams();
      baseParams.set('pageSize', '200');

      const r0 = await fetch(`/api/history-detailed?${baseParams.toString()}&page=0`, {
        headers: { 'X-Cliente-Id': String(cId), 'X-Usuario-Id': String(uId) },
      });
      if (!r0.ok) return;
      const j0 = await r0.json();
      const total = j0.total || 0;
      let allData = [...(j0.data || [])];
      const totalPages = Math.ceil(total / 200);
      for (let p = 1; p < totalPages; p++) {
        baseParams.set('page', String(p));
        const r = await fetch(`/api/history-detailed?${baseParams.toString()}`, {
          headers: { 'X-Cliente-Id': String(cId), 'X-Usuario-Id': String(uId) },
        });
        if (r.ok) {
          const j = await r.json();
          allData = allData.concat(j.data || []);
        }
      }

      const rows = allData.map((row: any) => ({
        ID: row.id,
        Cliente: row.cliente_nombre,
        De: Number(row.from_number),
        Para: Number(row.to_number),
        Dirección: row.direction,
        Mensaje: row.mensaje,
        Estado: row.estado,
        Wamid: row.wamid,
        Fecha: row.fecha_creacion ? formatColombiaDate(row.fecha_creacion) : '',
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Historial Detallado');
      const cols = ['ID', 'Cliente', 'De', 'Para', 'Dirección', 'Mensaje', 'Estado', 'Wamid', 'Fecha'];
      const wscols = cols.map(() => ({ wch: 20 }));
      ws['!cols'] = wscols;
      XLSX.writeFile(wb, `historial_detallado_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch {
      // ignore
    } finally {
      setDownloadLoading(false);
    }
  }, [state.user?.cliente_id, state.user?.id, buildParams]);

  const fetchData = useCallback(async () => {
    const cId = state.user?.cliente_id;
    const uId = state.user?.id;
    if (!cId || !uId) return;
    setLoading(true);
    try {
      const params = buildParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));

      const r = await fetch(`/api/history-detailed?${params.toString()}`, {
        headers: { 'X-Cliente-Id': String(cId), 'X-Usuario-Id': String(uId) },
      });
      if (r.ok) {
        const j = await r.json();
        setData(j.data || []);
        setTotal(j.total || 0);
      } else {
        setData([]);
        setTotal(0);
      }
    } catch {
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [state.user?.cliente_id, state.user?.id, page, buildParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const hasFilters = !!(fCliente || fDe || fPara || fDir || fMsg || fEst || fFechaDesde || fFechaHasta);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const paginated = data;

  return (
    <div id="app">
      {state.demoMode && (
        <div id="demo-banner" className="demo-banner">Modo Demo — Los datos son simulados</div>
      )}
      <div className="layout">
        <Sidebar />
        <main className="main-content">
          <div className="topbar">
            <button className="btn-icon sidebar-toggle" onClick={() => document.getElementById('sidebar')?.classList.toggle('open')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
            </button>
            <span style={{ fontSize: 14, color: '#667781' }}>
              {state.cliente?.plan || 'Sin plan'} — {state.cliente ? state.cliente.requests_max - state.cliente.requests_usadas : 0} disponibles
            </span>
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.3 }}>
                <span style={{ fontSize: 13, color: '#667781' }}>{state.user?.nombre}</span>
                <span style={{ fontSize: 13, color: '#667781', fontWeight: 700 }}>{state.cliente?.nombre_comercial || ''}</span>
              </div>
              <button className="btn btn-outline btn-sm" style={{ background: '#075E54', color: '#fff', borderColor: '#075E54', fontWeight: 700 }} onClick={() => { if (typeof window !== 'undefined') { localStorage.removeItem('mercurio_user'); dispatch({ type: 'LOGOUT' }); window.location.href = '/'; } }}>Salir</button>
            </span>
          </div>
          <section className="section active" style={{ position: 'relative' }}>

            <div className="header-images">
              <img src="/Productosasesorias_transp.png" alt="" className="header-logo-pya-decorative" />
              <div className="header-brand">
                <svg width="56" height="56" viewBox="0 0 175.216 175.552" style={{ marginBottom: 4 }}>
                  <path fill="#075E54" stroke="#fff" strokeWidth="16" d="M87.184 25.227c-33.733 0-61.166 27.423-61.178 61.13a60.98 60.98 0 0 0 9.349 32.535l1.455 2.312-6.179 22.559 23.146-6.069 2.235 1.324c9.387 5.571 20.15 8.518 31.126 8.524h.023c33.707 0 61.14-27.426 61.153-61.135a60.75 60.75 0 0 0-17.895-43.251 60.75 60.75 0 0 0-43.235-17.929z"/>
                  <path fill="#fff" fillRule="evenodd" d="M68.772 55.603c-1.378-3.061-2.828-3.123-4.137-3.176l-3.524-.043c-1.226 0-3.218.46-4.902 2.3s-6.435 6.287-6.435 15.332 6.588 17.785 7.506 19.013 12.718 20.381 31.405 27.75c15.529 6.124 18.689 4.906 22.061 4.6s10.877-4.447 12.408-8.74 1.532-7.971 1.073-8.74-1.685-1.226-3.525-2.146-10.877-5.367-12.562-5.981-2.91-.919-4.137.921-4.746 5.979-5.819 7.206-2.144 1.381-3.984.462-7.76-2.861-14.784-9.124c-5.465-4.873-9.154-10.891-10.228-12.73s-.114-2.835.808-3.751c.825-.824 1.838-2.147 2.759-3.22s1.224-1.84 1.836-3.065.307-2.301-.153-3.22-4.032-10.011-5.666-13.647"/>
                </svg>
                <div className="header-logo-mercurio-text">Mercurio Software</div>
              </div>
            </div>
            <div className="section-header">
              <h2>Historial Detallado</h2>
              <p>Consulte el estado de los mensajes enviados</p>
            </div>
            <Card>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 10, flexWrap: 'wrap' }}>
                <label style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>Desde <input className="col-filter" type="date" value={fFechaDesde} onChange={e => { setFFechaDesde(e.target.value); setPage(0); }} /></label>
                <label style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>Hasta <input className="col-filter" type="date" value={fFechaHasta} onChange={e => { setFFechaHasta(e.target.value); setPage(0); }} /></label>
                {(fFechaDesde || fFechaHasta) && <button className="btn btn-outline btn-sm" onClick={() => { setFFechaDesde(''); setFFechaHasta(''); setPage(0); }}>Limpiar fechas</button>}
                <span style={{ fontSize: 12, color: '#667781', marginLeft: 'auto' }}>{total} registros{hasFilters ? ' (filtrados)' : ''}</span>
              </div>
              <div className="table-container">
                <div style={{ marginBottom: 2, textAlign: 'left', paddingLeft: '8cm' }}>
                  <button
                    className="btn-link"
                    style={{ fontSize: 13, fontWeight: 600, color: '#075E54', cursor: 'pointer', background: 'none', border: 'none', padding: '2px 0', textDecoration: 'underline' }}
                    onClick={exportExcel}
                    disabled={downloadLoading}
                  >
                    {downloadLoading ? 'Descargando...' : 'Descargar Excel'}
                  </button>
                </div>
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ paddingTop: 38, verticalAlign: 'top' }}>ID</th>
                      <th style={{ paddingTop: 38, verticalAlign: 'top' }}>Cliente<div><input className="col-filter" value={fCliente} onChange={e => { setFCliente(e.target.value); setPage(0); }} placeholder="Filtrar..." /></div></th>
                      <th style={{ paddingTop: 38, verticalAlign: 'top' }}>De<div><input className="col-filter" value={fDe} onChange={e => { setFDe(e.target.value); setPage(0); }} placeholder="Filtrar..." /></div></th>
                      <th style={{ paddingTop: 38, verticalAlign: 'top' }}>Para<div><input className="col-filter" value={fPara} onChange={e => { setFPara(e.target.value); setPage(0); }} placeholder="Filtrar..." /></div></th>
                      <th style={{ paddingTop: 38, verticalAlign: 'top' }}>Dirección<div><select className="col-filter" value={fDir} onChange={e => { setFDir(e.target.value); setPage(0); }}><option value="">Todas</option><option value="outbound">Saliente</option><option value="inbound">Entrante</option></select></div></th>
                      <th style={{ paddingTop: 38, verticalAlign: 'top' }}>Mensaje<div><input className="col-filter" value={fMsg} onChange={e => { setFMsg(e.target.value); setPage(0); }} placeholder="Filtrar..." /></div></th>
                      <th style={{ paddingTop: 38, verticalAlign: 'top' }}>Estado<div><input className="col-filter" value={fEst} onChange={e => { setFEst(e.target.value); setPage(0); }} placeholder="Filtrar..." /></div></th>
                      <th style={{ paddingTop: 38, verticalAlign: 'top' }}>Wamid</th>
                      <th style={{ paddingTop: 38, verticalAlign: 'top' }}>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={9} className="empty-state">Cargando...</td></tr>
                    ) : paginated.length === 0 ? (
                      <tr><td colSpan={9} className="empty-state">No hay registros de mensajes</td></tr>
                    ) : (
                      paginated.map((msg, i) => (
                        <tr key={msg.id || i}>
                          <td>{msg.id || '-'}</td>
                          <td>{msg.cliente_nombre || '-'}</td>
                          <td>{msg.from_number || '-'}</td>
                          <td>{msg.to_number || '-'}</td>
                          <td>{msg.direction || '-'}</td>
                          <td>{msg.mensaje || '-'}</td>
                          <td>{msg.estado || '-'}</td>
                          <td style={{ fontSize: 11 }}>{msg.wamid ? msg.wamid.slice(0, 20) + '...' : '-'}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>{msg.fecha_creacion ? formatColombiaDate(msg.fecha_creacion) : '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {total > pageSize && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                  <button className="btn btn-outline btn-sm" disabled={safePage === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>Anterior</button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button key={i} className={`btn btn-sm ${i === safePage ? 'btn-primary' : 'btn-outline'}`} style={{ minWidth: 28, padding: '3px 6px' }} onClick={() => setPage(i)}>{i + 1}</button>
                  ))}
                  <button className="btn btn-outline btn-sm" disabled={safePage >= totalPages - 1} onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}>Siguiente</button>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 8 }}>{total} registros</span>
                </div>
              )}
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
}
