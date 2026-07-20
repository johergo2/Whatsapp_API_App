'use client';

import { useApp } from '@/lib/store';
import { Sidebar } from '@/components/ui/Sidebar';
import { Card } from '@/components/ui/Card';
import { useState, useRef } from 'react';
import { getSupabase } from '@/lib/supabase';

const ALLOWED_TYPES = ['image/png', 'application/pdf', 'video/mp4'];
const ALLOWED_EXT = ['png', 'pdf', 'mp4'];
const BUCKET = 'documentos';

interface UploadResult {
  name: string;
  url: string;
  error?: string;
}

export default function UploadPage() {
  const { state, dispatch } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [pct, setPct] = useState(0);
  const [dragging, setDragging] = useState(false);
  const supabase = getSupabase();

  function validateFile(file: File): string | null {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) return `Extensión .${ext} no permitida`;
    if (!ALLOWED_TYPES.includes(file.type)) return `Tipo ${file.type} no permitido`;
    return null;
  }

  function getSelectedFiles(): File[] {
    if (!inputRef.current?.files) return [];
    return Array.from(inputRef.current.files);
  }

  async function uploadFile(file: File): Promise<UploadResult> {
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(file.name, file, { contentType: file.type, upsert: true });
    if (error) return { name: file.name, url: '', error: error.message };
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(file.name);
    return { name: file.name, url: publicUrlData.publicUrl };
  }

  async function handleUpload(files?: File[]) {
    const selected = files || getSelectedFiles();
    if (selected.length === 0) return;

    const errors: string[] = [];
    for (const f of selected) {
      const err = validateFile(f);
      if (err) errors.push(`${f.name}: ${err}`);
    }
    if (errors.length > 0) {
      alert(errors.join('\n'));
      return;
    }

    setUploading(true);
    setPct(0);
    setResults([]);

    const out: UploadResult[] = [];
    for (let i = 0; i < selected.length; i++) {
      out.push(await uploadFile(selected[i]));
      setPct(Math.round(((i + 1) / selected.length) * 100));
    }
    setResults(out);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f => {
      const ext = (f.name.split('.').pop() || '').toLowerCase();
      return ALLOWED_EXT.includes(ext);
    });
    if (files.length > 0) handleUpload(files);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave() {
    setDragging(false);
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url).then(() => {
      alert('URL copiada al portapapeles');
    }).catch(() => {
      alert('No se pudo copiar la URL');
    });
  }

  const successCount = results.filter(r => r.url).length;
  const errorCount = results.filter(r => r.error).length;

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
              <img
                src="/Productosasesorias_transp.png"
                alt=""
                className="header-logo-pya-decorative"
              />
              <div className="header-brand">
                <svg width="56" height="56" viewBox="0 0 175.216 175.552" style={{ marginBottom: 4 }}>
                  <path fill="#075E54" stroke="#fff" strokeWidth="16" d="M87.184 25.227c-33.733 0-61.166 27.423-61.178 61.13a60.98 60.98 0 0 0 9.349 32.535l1.455 2.312-6.179 22.559 23.146-6.069 2.235 1.324c9.387 5.571 20.15 8.518 31.126 8.524h.023c33.707 0 61.14-27.426 61.153-61.135a60.75 60.75 0 0 0-17.895-43.251 60.75 60.75 0 0 0-43.235-17.929z"/>
                  <path fill="#fff" fillRule="evenodd" d="M68.772 55.603c-1.378-3.061-2.828-3.123-4.137-3.176l-3.524-.043c-1.226 0-3.218.46-4.902 2.3s-6.435 6.287-6.435 15.332 6.588 17.785 7.506 19.013 12.718 20.381 31.405 27.75c15.529 6.124 18.689 4.906 22.061 4.6s10.877-4.447 12.408-8.74 1.532-7.971 1.073-8.74-1.685-1.226-3.525-2.146-10.877-5.367-12.562-5.981-2.91-.919-4.137.921-4.746 5.979-5.819 7.206-2.144 1.381-3.984.462-7.76-2.861-14.784-9.124c-5.465-4.873-9.154-10.891-10.228-12.73s-.114-2.835.808-3.751c.825-.824 1.838-2.147 2.759-3.22s1.224-1.84 1.836-3.065.307-2.301-.153-3.22-4.032-10.011-5.666-13.647"/>
                </svg>
                <div className="header-logo-mercurio-text">Mercurio Software</div>
              </div>
            </div>

            <div className="section-header" style={{ position: 'relative', zIndex: 1 }}>
              <h2>Cargue de Archivos</h2>
              <p>Sube archivos PNG, PDF o MP4 para usar como adjunto de cabecera en tus plantillas</p>
            </div>

            <Card>
              <div
                style={{
                  border: `2px dashed ${dragging ? 'var(--secondary)' : 'var(--border)'}`,
                  borderRadius: 12,
                  padding: 40,
                  textAlign: 'center',
                  background: dragging ? '#E8F5E9' : 'var(--bg-card)',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                }}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => inputRef.current?.click()}
              >
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={dragging ? 'var(--secondary)' : 'var(--text-secondary)'} strokeWidth="1.5" style={{ marginBottom: 12 }}>
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
                <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 4 }}>
                  {dragging ? 'Suelta los archivos aquí' : 'Arrastra archivos o haz clic para seleccionar'}
                </p>
                <p style={{ color: '#B0BEC5', fontSize: 12 }}>
                  Solo PNG, PDF y MP4 — Puedes seleccionar varios archivos
                </p>
                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  accept=".png,.pdf,.mp4"
                  style={{ display: 'none' }}
                  onChange={() => handleUpload()}
                />
              </div>
            </Card>

            {uploading && (
              <Card>
                <h3>Subiendo archivos...</h3>
                <div className="progress-container">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: pct + '%' }} />
                  </div>
                  <span className="progress-text">{pct}%</span>
                </div>
              </Card>
            )}

            {results.length > 0 && (
              <Card>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <h3 style={{ margin: 0 }}>Resultados</h3>
                  {successCount > 0 && <span className="status-badge success">{successCount} subidos</span>}
                  {errorCount > 0 && <span className="status-badge error">{errorCount} errores</span>}
                </div>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Archivo</th>
                        <th>Estado</th>
                        <th>URL Pública</th>
                        <th style={{ width: 60 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600 }}>{r.name || '-'}</td>
                          <td>
                            {r.error ? (
                              <span className="status-badge error">{r.error}</span>
                            ) : (
                              <span className="status-badge success">Subido</span>
                            )}
                          </td>
                          <td style={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {r.url ? (
                              <code style={{ fontSize: 11, wordBreak: 'break-all', userSelect: 'all' }}>{r.url}</code>
                            ) : '-'}
                          </td>
                          <td>
                            {r.url && (
                              <button className="btn btn-sm btn-primary" onClick={() => copyUrl(r.url)}>
                                Copiar
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
