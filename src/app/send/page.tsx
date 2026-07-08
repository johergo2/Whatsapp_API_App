'use client';

import { useApp } from '@/lib/store';
import { Sidebar } from '@/components/ui/Sidebar';
import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { upsertSendFormData } from '@/lib/services';
import type { SendFormValues } from '@/types';

export default function SendPage() {
  const { state, dispatch } = useApp();
  const [selectedTplId, setSelectedTplId] = useState('');
  const [form, setForm] = useState<SendFormValues>({});

  const tpl = selectedTplId ? state.templates.find((t) => t.id === selectedTplId) : null;
  const saved = selectedTplId ? state.sendFormData[selectedTplId] || {} : {};

  function onTemplateChange(id: string) {
    // Save current
    if (selectedTplId && tpl) {
      dispatch({ type: 'SET_SEND_FORM_DATA', payload: { templateId: selectedTplId, values: form } });
    }
    setSelectedTplId(id);
    if (id && state.sendFormData[id]) {
      setForm({ ...state.sendFormData[id] });
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
      if (!state.demoMode && state.cliente?.id) {
        try {
          await upsertSendFormData(state.cliente.id, selectedTplId, form);
        } catch (e) {
          console.error('Error saving form data to Supabase:', e);
        }
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
            <button className="btn btn-outline btn-sm" style={{ marginLeft: 'auto' }} onClick={() => { window.location.href = '/login'; }}>Salir</button>
          </div>
          <section className="section active">
            <div className="section-header">
              <h2>Enviar Mensajes</h2>
              <p>Seleccione la plantilla, configure los valores y envíe</p>
            </div>

            <Card title="1. Seleccione la plantilla">
              <div className="form-group">
                <select
                  value={selectedTplId}
                  onChange={(e) => onTemplateChange(e.target.value)}
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
                    <div><span className="summary-label">Cabecera</span><span className="summary-value">{tpl.has_header ? 'Sí' : 'No'}</span></div>
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

                  {tpl.has_header && (
                    <div className="dynamic-section field-required">
                      <h4>Imagen de cabecera</h4>
                      <div className="form-group">
                        <label>URL por defecto</label>
                        <input
                          type="url"
                          value={form.header_img || saved.header_img || ''}
                          onChange={(e) => updateField('header_img', e.target.value)}
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
                  <button className="btn btn-outline btn-lg" onClick={() => onTemplateChange('')}>
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
