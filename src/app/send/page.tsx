'use client';

import { useApp } from '@/lib/store';
import { Sidebar } from '@/components/ui/Sidebar';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { upsertSendFormData } from '@/lib/services';
import type { SendFormValues } from '@/types';

export default function SendPage() {
  const { state, dispatch } = useApp();
  const [selectedTplId, setSelectedTplId] = useState<number | null>(null);
  const [form, setForm] = useState<SendFormValues>({});
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const tpl = selectedTplId ? state.templates.find((t) => t.id === selectedTplId) : null;
  const saved = selectedTplId ? state.sendFormData[String(selectedTplId)] || {} : {};

  function onTemplateChange(id: number | null) {
    if (selectedTplId && tpl) {
      dispatch({ type: 'SET_SEND_FORM_DATA', payload: { templateId: selectedTplId, values: form } });
    }
    setSelectedTplId(id);
    if (id && state.sendFormData[String(id)]) {
      setForm({ ...state.sendFormData[String(id)] });
    } else {
      setForm({});
    }
  }

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function saveForm() {
    if (selectedTplId) {
      dispatch({ type: 'SET_SEND_FORM_DATA', payload: { templateId: selectedTplId, values: form } });
      try {
        await upsertSendFormData(selectedTplId, form);
        setToast({ type: 'success', message: 'Valores guardados correctamente' });
      } catch (e) {
        setToast({ type: 'error', message: 'Error al guardar los valores' });
      }
    }
  }

  const c = state.cliente;
  const disponibles = c ? (c.requests_max || 0) - (c.requests_usadas || 0) : 0;
  const pendientes = state.prospects.filter((p) => !p.estado).length;

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
            <span style={{ fontSize: 14, color: '#667781' }}>Enviar mensajes</span>
            <button className="btn btn-outline btn-sm" style={{ marginLeft: 'auto', background: '#075E54', color: '#fff', borderColor: '#075E54' }} onClick={() => { localStorage.removeItem('mercurio_api_key'); dispatch({ type: 'LOGOUT' }); window.location.href = '/login'; }}>Salir</button>
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
              <h2>Enviar Mensajes</h2>
              <p>Seleccione la plantilla, configure los valores y envíe</p>
            </div>

            <Card title="1. Seleccione la plantilla">
              <div className="form-group">
                <select
                  value={selectedTplId ?? ''}
                  onChange={(e) => onTemplateChange(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">-- Seleccione una plantilla --</option>
                  {state.templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.template_name})</option>
                  ))}
                </select>
              </div>
              {tpl && (
                <div className="template-preview" style={{ marginTop: 12 }}>
                  <div className="summary-grid">
                    <div><span className="summary-label">Plantilla Meta</span><span className="summary-value">{tpl.template_name}</span></div>
                    <div><span className="summary-label">Idioma</span><span className="summary-value">{tpl.language_code}</span></div>
                    <div><span className="summary-label">Cabecera</span><span className="summary-value">{tpl.header_type === 'image' ? 'Imagen' : tpl.header_type === 'document' ? 'Documento' : tpl.header_type === 'video' ? 'Video' : 'No'}</span></div>
                    <div><span className="summary-label">Textos</span><span className="summary-value">{tpl.num_textos}</span></div>
                    <div><span className="summary-label">Imágenes final</span><span className="summary-value">{tpl.num_footer > 0 ? `${tpl.num_footer} imágenes` : 'No'}</span></div>
                  </div>
                  {tpl.message_example && (
                    <div style={{ marginTop: 12, padding: 10, background: '#FFF', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, whiteSpace: 'pre-wrap' }}>
                      {tpl.message_example}
                    </div>
                  )}
                </div>
              )}
            </Card>

            {tpl && (
              <Card title="2. Valores del mensaje">
                <div className="dynamic-fields">
                  {tpl.num_textos > 0 && (
                    <div className="dynamic-section field-required">
                      <h4>Variables de texto ({tpl.num_textos})</h4>
                      <div className="form-row" style={{ gridTemplateColumns: 'repeat(2,1fr)' }}>
                        {Array.from({ length: tpl.num_textos }).map((_, i) => (
                          <div className="form-group" key={i}>
                            <label>Texto {i + 1}</label>
                            <input
                              type="text"
                              value={form[`texto${i + 1}`] || saved[`texto${i + 1}`] || ''}
                              onChange={(e) => updateField(`texto${i + 1}`, e.target.value)}
                              placeholder={`Valor para texto${i + 1}`}
                              required
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {tpl.header_type !== 'none' && (
                    <div className="dynamic-section field-required">
                      <h4>{tpl.header_type === 'image' ? 'Imagen' : tpl.header_type === 'document' ? 'Documento (PDF)' : 'Video'} de cabecera</h4>
                      <div className="form-group">
                        <label>URL por defecto</label>
                        <input
                          type="url"
                          value={form.adjunto_cabecera || saved.adjunto_cabecera || ''}
                          onChange={(e) => updateField('adjunto_cabecera', e.target.value)}
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  )}

                  {tpl.num_footer > 0 && (
                    <div className="dynamic-section field-required">
                      <h4>Imágenes al final del mensaje ({tpl.num_footer})</h4>
                      {Array.from({ length: tpl.num_footer }).map((_, i) => (
                        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 12 }} key={i}>
                          <div className="form-group" style={{ flex: 2 }}>
                            <label>URL imagen {i + 1}</label>
                            <input
                              type="url"
                              value={form[`footer_url${i + 1}`] || saved[`footer_url${i + 1}`] || ''}
                              onChange={(e) => updateField(`footer_url${i + 1}`, e.target.value)}
                              placeholder="https://..."
                            />
                          </div>
                          <div className="form-group" style={{ flex: 1 }}>
                            <label>Texto imagen {i + 1} (opcional)</label>
                            <input
                              type="text"
                              value={form[`caption${i + 1}`] || saved[`caption${i + 1}`] || tpl.footer_captions?.[i] || ''}
                              onChange={(e) => updateField(`caption${i + 1}`, e.target.value)}
                              placeholder={`Texto debajo de la imagen ${i + 1}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="form-actions" style={{ border: 'none', paddingTop: 8, marginTop: 0 }}>
                  <button className="btn btn-primary" onClick={saveForm}>Guardar valores</button>
                  {toast && (
                    <span style={{ marginLeft: 12, fontSize: 13, color: toast.type === 'success' ? '#25D366' : '#e74c3c', fontWeight: 500 }}>
                      {toast.message}
                    </span>
                  )}
                </div>
              </Card>
            )}

            {tpl && (
              <Card title="3. Resumen">
                <div className="summary-grid">
                  <div><span className="summary-label">Prospectos pendientes</span><span className="summary-value">{pendientes}</span></div>
                  <div><span className="summary-label">Plan</span><span className="summary-value">{c?.plan || '-'}</span></div>
                  <div><span className="summary-label">Total mensajes</span><span className="summary-value">{c?.requests_max || 0}</span></div>
                  <div><span className="summary-label">Disponibles</span><span className="summary-value">{disponibles}</span></div>
                </div>
                {c?.periodo_fin && (
                  <p style={{ fontSize: 13, color: '#667781', marginTop: 8 }}>Corte: {new Date(c.periodo_fin).toLocaleDateString('es-CO')}</p>
                )}
                <div className="send-actions" style={{ marginTop: 16 }}>
                  <button className="btn btn-outline btn-lg" onClick={() => onTemplateChange(null)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
                    </svg>
                    Limpiar
                  </button>
                </div>
              </Card>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
