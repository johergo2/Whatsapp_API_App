'use client';

import { useApp } from '@/lib/store';
import { Sidebar } from '@/components/ui/Sidebar';
import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { addTemplate, updateTemplate, deleteTemplate } from '@/lib/services';
import type { Plantilla } from '@/types';

export default function TemplatesPage() {
  const { state, dispatch } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: '',
    template_name: '',
    language_code: 'es_CO',
    num_textos: 4,
    header_type: 'none' as 'none' | 'image' | 'document' | 'video',
    num_footer: 0,
    footer_captions: ['', '', '', ''],
    message_example: '',
    descripcion: '',
    nomb_mio: '',
  });

  function resetForm() {
    setForm({
      name: '',
      template_name: '',
      language_code: 'es_CO',
      num_textos: 4,
      header_type: 'none',
      num_footer: 0,
      footer_captions: ['', '', '', ''],
      message_example: '',
      descripcion: '',
      nomb_mio: '',
    });
  }

  function openNew() {
    resetForm();
    setEditingId(null);
    setModalOpen(true);
  }

  function openEdit(t: Plantilla) {
    setForm({
      name: t.name,
      template_name: t.template_name,
      language_code: t.language_code,
      num_textos: t.num_textos,
      header_type: t.header_type,
      num_footer: t.num_footer,
      footer_captions: [...(t.footer_captions || []), '', '', '', ''].slice(0, 4),
      message_example: t.message_example,
      descripcion: t.descripcion || '',
      nomb_mio: t.nomb_mio || '',
    });
    setEditingId(t.id);
    setModalOpen(true);
  }

  async function save() {
    if (!form.name || !form.template_name) return;
    const tplData = {
      name: form.name,
      template_name: form.template_name,
      language_code: form.language_code,
      num_textos: form.num_textos,
      header_type: form.header_type,
      num_footer: form.num_footer,
      footer_captions: form.footer_captions.slice(0, form.num_footer),
      message_example: form.message_example,
      descripcion: form.descripcion,
      nomb_mio: form.nomb_mio,
    };

    if (editingId) {
      const updated: Plantilla = { id: editingId, ...tplData };
      if (!state.demoMode) {
        try {
          await updateTemplate(updated);
        } catch (e) {
          console.error('Error updating template:', e);
        }
      }
      dispatch({ type: 'UPDATE_TEMPLATE', payload: updated });
    } else {
      let created: Plantilla = { id: 0, ...tplData };
      if (!state.demoMode) {
        try {
          created = await addTemplate(tplData);
        } catch (e) {
          console.error('Error adding template:', e);
        }
      }
      dispatch({ type: 'ADD_TEMPLATE', payload: created });
    }
    setModalOpen(false);
  }

  async function deleteTpl(id: number) {
    if (!confirm('¿Eliminar esta plantilla?')) return;
    if (!state.demoMode) {
      try {
        await deleteTemplate(id);
      } catch (e) {
        console.error('Error deleting template from Supabase:', e);
      }
    }
    dispatch({ type: 'DELETE_TEMPLATE', payload: id });
  }

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
              <h2>Plantillas</h2>
              <p>Administre las plantillas de mensajes</p>
            </div>
            <div className="toolbar">
              <button className="btn btn-primary" onClick={openNew}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                Nueva plantilla
              </button>
              <span className="toolbar-counter">{state.templates.length} plantillas</span>
            </div>
            {state.templates.length === 0 ? (
              <Card>No hay plantillas definidas. Cree una nueva.</Card>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                {state.templates.map((t) => (
                  <div key={t.id} className="template-card">
                    <h4>{t.name}</h4>
                    <div className="tpl-meta">{t.template_name} · {t.language_code}</div>
                    {t.descripcion && <div className="tpl-meta" style={{ marginTop: 4, fontStyle: 'italic', fontSize: 12, color: '#667781' }}>{t.descripcion}</div>}
                    <div className="tpl-features">
                      <span className={`tpl-feature ${t.header_type !== 'none' ? 'active' : 'inactive'}`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                        {t.header_type === 'image' ? 'Imagen' : t.header_type === 'document' ? 'Documento' : t.header_type === 'video' ? 'Video' : 'Sin adjunto'}
                      </span>
                      <span className="tpl-feature active">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        {t.num_textos} textos
                      </span>
                      <span className={`tpl-feature ${t.num_footer > 0 ? 'active' : 'inactive'}`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                        {t.num_footer > 0 ? `${t.num_footer} imág. final` : 'Sin imág. final'}
                      </span>
                    </div>
                    {t.message_example && (
                      <div className="tpl-meta" style={{ marginTop: 8, padding: 8, background: '#F9F9F9', borderRadius: 6, fontStyle: 'italic', fontSize: 12, whiteSpace: 'pre-wrap' }}>
                        {t.message_example}
                      </div>
                    )}
                    <div className="tpl-actions">
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(t)}>Editar</button>
                      <button className="btn btn-outline btn-sm btn-danger" onClick={() => deleteTpl(t.id)}>Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Editar plantilla' : 'Nueva plantilla'}>
            <form id="template-form" onSubmit={(e) => { e.preventDefault(); save(); }}>
              <div className="form-group">
                <label>Nombre interno <span className="req">*</span></label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Nombre en Meta <span className="req">*</span></label>
                <input type="text" value={form.template_name} onChange={(e) => setForm({ ...form, template_name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea rows={3} spellCheck={false} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Describe qué incluye la plantilla: si tiene imagen de cabecera, cuántos textos, imágenes al final, etc." />
              </div>
              <div className="form-group">
                <label>Nombre del remitente (nomb_mio)</label>
                <input type="text" value={form.nomb_mio} onChange={(e) => setForm({ ...form, nomb_mio: e.target.value })} placeholder="Ej: Jorge Hernán Gómez" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Idioma</label>
                  <select value={form.language_code} onChange={(e) => setForm({ ...form, language_code: e.target.value })}>
                    <option value="es_CO">es_CO</option>
                    <option value="es">es</option>
                    <option value="en">en</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Variables de texto</label>
                  <input type="number" min={0} max={10} value={form.num_textos} onChange={(e) => setForm({ ...form, num_textos: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Adjunto en cabecera</label>
                  <select value={form.header_type} onChange={(e) => setForm({ ...form, header_type: e.target.value as 'none' | 'image' | 'document' | 'video' })}>
                    <option value="none">No tiene</option>
                    <option value="image">Imagen</option>
                    <option value="document">PDF / Documento</option>
                    <option value="video">Video</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Imágenes al final</label>
                  <select value={form.num_footer} onChange={(e) => setForm({ ...form, num_footer: parseInt(e.target.value) || 0 })}>
                    <option value={0}>0</option>
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                  </select>
                </div>
              </div>
              {form.num_footer > 0 && (
                <div style={{ marginTop: 12 }}>
                  <p style={{ fontSize: 13, color: '#667781' }}>Los textos para cada imagen se configuran en &ldquo;Configurar plantillas&rdquo;</p>
                </div>
              )}
              <div className="form-group">
                <label>Ejemplo del mensaje</label>
                <textarea rows={3} spellCheck={false} value={form.message_example} onChange={(e) => setForm({ ...form, message_example: e.target.value })} placeholder="Opcional. Escriba un ejemplo de cómo se ve el mensaje completo" />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar</button>
              </div>
            </form>
          </Modal>
        </main>
      </div>
    </div>
  );
}
