'use client';

import { useApp } from '@/lib/store';
import { Sidebar } from '@/components/ui/Sidebar';
import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { addProspect, updateProspect, deleteProspectFromDb, replaceAllProspects } from '@/lib/services';
import type { Plantilla, Prospecto } from '@/types';

function renderStatusCell(estado: string) {
  if (!estado) return '<span class="status-badge pending">Pendiente</span>';
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const text = esc(estado);
  if (estado.includes('✅')) return `<span class="status-badge success" style="user-select:all">${text}</span>`;
  if (estado.includes('❌') || estado.includes('Error')) return `<span class="status-badge error" style="user-select:all">${text}</span>`;
  return `<span class="status-badge pending" style="user-select:all">${text}</span>`;
}

export default function ProspectsPage() {
  const { state, dispatch } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [editIdx, setEditIdx] = useState(-1);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAdjunto, setEditAdjunto] = useState('');
  const [editFooterImgs, setEditFooterImgs] = useState<string[]>([]);
  const [captionModalOpen, setCaptionModalOpen] = useState(false);
  const [captionProspect, setCaptionProspect] = useState(-1);
  const [captionImgIdx, setCaptionImgIdx] = useState(-1);
  const [captionText, setCaptionText] = useState('');
  const [progressOpen, setProgressOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [onlyPending, setOnlyPending] = useState(true);

  const tpl = state.prosTemplateId
    ? state.templates.find((t) => t.id === state.prosTemplateId) || null
    : null;

  const defaults = (tpl && state.sendFormData[String(tpl.id)]) || {};

function openNew() {
    setEditIdx(-1);
    setEditName('');
    setEditPhone('');
    setEditAdjunto('');
    setEditFooterImgs([]);
    setModalOpen(true);
  }

  function openEdit(i: number) {
    const p = state.prospects[i];
    setEditIdx(i);
    setEditName(p.nombre);
    setEditPhone(p.telefono);
    setEditAdjunto(p.adjunto_cabecera || '');
    setEditFooterImgs([...(p.footer_imgs || [])]);
    setModalOpen(true);
  }

  async function saveProspect() {
    if (!editName || !editPhone) return;
    const data: Prospecto = {
      nombre: editName,
      telefono: editPhone,
      adjunto_cabecera: tpl?.header_type !== 'none' ? editAdjunto : '',
      footer_imgs: tpl?.num_footer ? editFooterImgs : [],
      captions: [],
      estado: '',
    };

    if (editIdx >= 0) {
      const old = state.prospects[editIdx];
      data.estado = old.estado || '';
      data.captions = old.captions || [];

      if (old.id && !state.demoMode) {
        try {
          await updateProspect({ ...data, id: old.id });
        } catch (e) {
          console.error('Error updating prospect:', e);
        }
      }

      dispatch({ type: 'UPDATE_PROSPECT', payload: { index: editIdx, data } });
    } else {
      let created: Prospecto = { ...data };
      if (!state.demoMode) {
        try {
          created = await addProspect(data);
        } catch (e) {
          console.error('Error adding prospect:', e);
        }
      }
      dispatch({ type: 'ADD_PROSPECT', payload: created });
    }
    setModalOpen(false);
  }

  async function deleteProspect(i: number) {
    if (!confirm('¿Eliminar este prospecto?')) return;
    const p = state.prospects[i];
    if (p.id && !state.demoMode) {
      try {
        await deleteProspectFromDb(p.id);
      } catch (e) {
        console.error('Error deleting prospect from Supabase:', e);
      }
    }
    dispatch({ type: 'DELETE_PROSPECT', payload: i });
  }

  function updateField(idx: number, field: string, value: string) {
    dispatch({ type: 'UPDATE_PROSPECT_FIELD', payload: { index: idx, field, value } });
  }

  function openCaption(i: number, imgIdx: number) {
    const p = state.prospects[i];
    const effective =
      (p.captions && p.captions[imgIdx]) ||
      defaults[`caption${imgIdx + 1}`] ||
      (tpl?.footer_captions?.[imgIdx]) ||
      '';
    setCaptionProspect(i);
    setCaptionImgIdx(imgIdx);
    setCaptionText(effective);
    setCaptionModalOpen(true);
  }

  function saveCaption() {
    const p = { ...state.prospects[captionProspect] };
    if (!p.captions) p.captions = [];
    p.captions[captionImgIdx] = captionText;
    dispatch({ type: 'UPDATE_PROSPECT', payload: { index: captionProspect, data: p } });
    setCaptionModalOpen(false);
  }

  function importCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length === 0) return;
      const first = lines[0].toLowerCase();
      const hasHeader = first.includes('nombre') || first.includes('name') || first.includes('nomb');
      const rawHeaders = hasHeader ? lines[0].split(',').map(s => s.trim().toLowerCase().replace(/^"|"$/g, '')) : [];
      const adjuntoIdx = rawHeaders.findIndex(h => h.replace(/_/g, ' ').includes('adjunto') || h.replace(/_/g, ' ').includes('cabecera'));
      const imgIndices = [1, 2, 3, 4].map(i => {
        const idx = rawHeaders.indexOf(`imagen_${i}`);
        return idx >= 0 ? idx : rawHeaders.indexOf(`imagen ${i}`);
      });
      const dataLines = hasHeader ? lines.slice(1) : lines;
      const prospects: Omit<Prospecto, 'id'>[] = [];
      const rowErrors: string[] = [];
      dataLines.forEach((line, rowIdx) => {
        const parts = line.split(',').map((s) => s.trim().replace(/^"|"$/g, ''));
        if (parts.length >= 2 && parts[0] && parts[1]) {
          const footer_imgs: string[] = [];
          for (let i = 0; i < 4; i++) {
            if (imgIndices[i] >= 0 && parts[imgIndices[i]]) {
              footer_imgs.push(parts[imgIndices[i]]);
            } else {
              break;
            }
          }
          if (tpl && tpl.num_footer > 0) {
            const filled = footer_imgs.length;
            if (filled < tpl.num_footer) {
              rowErrors.push(`Fila ${rowIdx + 2} (${parts[0]}): tiene ${filled} imagen(es), la plantilla requiere ${tpl.num_footer}`);
            }
          }
          prospects.push({
            nombre: parts[0],
            telefono: parts[1],
            adjunto_cabecera: adjuntoIdx >= 0 ? parts[adjuntoIdx] || '' : '',
            footer_imgs,
            captions: [],
            estado: '',
          });
        }
      });

      if (rowErrors.length > 0) {
        alert('Errores de validación en el CSV:\n' + rowErrors.join('\n'));
        return;
      }

      if (prospects.length === 0) {
        alert('No se encontraron prospectos válidos en el CSV');
        return;
      }

      try {
        const created = await replaceAllProspects(prospects);
        dispatch({ type: 'SET_PROSPECTS', payload: created });
        alert(`${created.length} prospectos importados y guardados en BD`);
      } catch (e) {
        alert('Error al guardar prospectos en BD');
        console.error(e);
      }
    };
    reader.readAsText(file, 'UTF-8');
  }

  const prospectsToSend = state.prospects.filter((p) => !p.estado);

  async function startSend() {
    if (sending || !tpl) return;
    if (!state.sendFormData[String(tpl.id)]) {
      alert('Configure el mensaje en "Enviar mensajes" primero');
      return;
    }
    const saved = state.sendFormData[String(tpl.id)];

    // Validate text values
    for (let i = 1; i <= tpl.num_textos; i++) {
      const val = saved[`texto${i}`];
      if (!val) {
        alert(`Texto ${i} es obligatorio. Vaya a "Enviar mensajes"`);
        return;
      }
    }

    let targets = onlyPending ? prospectsToSend : state.prospects;
    if (targets.length === 0) {
      alert('No hay prospectos pendientes');
      return;
    }

    // Validate prospects against template
    const errors: string[] = [];
    targets.forEach((p) => {
      if (tpl.header_type !== 'none' && !p.adjunto_cabecera && !saved.adjunto_cabecera) {
        errors.push(`${p.nombre}: falta adjunto de cabecera`);
      }
      if (tpl.num_footer > 0) {
        for (let i = 1; i <= tpl.num_footer; i++) {
          if (!(p.footer_imgs && p.footer_imgs[i - 1]) && !saved[`footer_url${i}`]) {
            errors.push(`${p.nombre}: falta imagen ${i}`);
          }
        }
      }
    });

    if (errors.length > 0) {
      setLogs(['ERRORES DE VALIDACIÓN:', ...errors.map((e) => `✗ ${e}`)]);
      setProgressOpen(true);
      return;
    }

    setSending(true);
    setLogs([]);
    setProgressOpen(true);
    setProgressTotal(targets.length);
    setProgressPct(0);

    let sent = 0;
    for (let i = 0; i < targets.length; i++) {
      const prospect = targets[i];
      const idx = state.prospects.indexOf(prospect);
      const newLogs = [...logs];

      try {
        newLogs.push(`Enviando a ${prospect.nombre} (${prospect.telefono})...`);
        setLogs(newLogs);

        const adjuntoUrl = tpl.header_type !== 'none' ? (prospect.adjunto_cabecera || saved.adjunto_cabecera || '') : '';
        const textValues: Record<string, string> = {};
        for (let j = 1; j <= tpl.num_textos; j++) {
          textValues[`texto${j}`] = saved[`texto${j}`] || '';
        }

        const headerField = tpl.header_type === 'image' ? 'header_image_url'
          : tpl.header_type === 'document' ? 'header_document_url'
          : tpl.header_type === 'video' ? 'header_video_url' : '';

        const templatePayload: Record<string, string | number> = {
          cliente_id: state.cliente?.id || 1,
          to: prospect.telefono,
          template_name: tpl.template_name,
          language_code: tpl.language_code,
          nombre_clie: prospect.nombre,
          nomb_mio: tpl.nomb_mio || state.cliente?.nombre_comercial || '',
          ...textValues,
        };
        if (headerField) {
          templatePayload[headerField] = adjuntoUrl;
        }

        const res1 = await fetch('/api/send-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(templatePayload),
        });
        if (!res1.ok) throw new Error(await res1.text());
        newLogs.push('  ✓ Plantilla enviada');
        setLogs([...newLogs]);

        if (tpl.num_footer > 0) {
          for (let m = 0; m < tpl.num_footer; m++) {
            const imgUrl = (prospect.footer_imgs && prospect.footer_imgs[m]) || saved[`footer_url${m + 1}`] || '';
            if (!imgUrl) continue;
            const imgCaption = (prospect.captions && prospect.captions[m]) || saved[`caption${m + 1}`] || '';
            await new Promise((r) => setTimeout(r, 3000));
            const mediaPayload: Record<string, string | number> = {
              cliente_id: state.cliente?.id || 1,
              to: prospect.telefono,
              image_url: imgUrl,
            };
            if (imgCaption) mediaPayload.caption = imgCaption;
            try {
              const res2 = await fetch('/api/send-media', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mediaPayload),
              });
              if (res2.ok) {
                newLogs.push(`  ✓ Imagen ${m + 1} enviada`);
              } else {
                newLogs.push(`  ✗ Error imagen ${m + 1}: ${res2.statusText}`);
              }
            } catch {
              newLogs.push(`  ✗ Error imagen ${m + 1}`);
            }
            setLogs([...newLogs]);
            await new Promise((r) => setTimeout(r, 500));
          }
        }

        if (idx >= 0) {
          const updated = { ...state.prospects[idx], estado: '✅ Enviado' };
          dispatch({ type: 'UPDATE_PROSPECT', payload: { index: idx, data: updated } });
        }
        sent++;
      } catch (e: any) {
        const errMsg = e.message || 'Error desconocido';
        newLogs.push(`  ✗ Error: ${errMsg}`);
        setLogs([...newLogs]);
        if (idx >= 0) {
          const updated = { ...state.prospects[idx], estado: `❌ Error: ${errMsg}` };
          dispatch({ type: 'UPDATE_PROSPECT', payload: { index: idx, data: updated } });
        }
      }

      setProgressPct(Math.round(((i + 1) / targets.length) * 100));
      if (i < targets.length - 1) await new Promise((r) => setTimeout(r, 1000));
    }

    setLogs((prev) => [...prev, `=== Envío completado: ${sent} de ${targets.length} ===`]);
    setSending(false);
  }

  const emptyCols = 2 + (tpl?.header_type !== 'none' ? 1 : 0) + (tpl?.num_footer || 0) * 2 + 2;

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
            <span style={{ fontSize: 14, color: '#667781' }}>Prospectos</span>
            <button className="btn btn-outline btn-sm" style={{ marginLeft: 'auto' }} onClick={() => { localStorage.removeItem('mercurio_api_key'); dispatch({ type: 'LOGOUT' }); window.location.href = '/login'; }}>Salir</button>
          </div>
          <section className="section active">
            <div className="section-header">
              <h2>Prospectos y Envío</h2>
              <p>Destinatarios, imágenes y envío de mensajes</p>
            </div>

            <Card>
              <div className="toolbar" style={{ gap: 12, flexWrap: 'wrap' }}>
                <div className="form-group" style={{ minWidth: 200, marginBottom: 0 }}>
                  <label style={{ fontSize: 12 }}>Plantilla para enviar</label>
                  <select
                    value={state.prosTemplateId ?? ''}
                    onChange={(e) => dispatch({ type: 'SET_PROS_TEMPLATE_ID', payload: e.target.value ? Number(e.target.value) : null })}
                  >
                    <option value="">-- Seleccione --</option>
                    {state.templates.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ textAlign: 'right', fontSize: 12, color: '#667781', marginLeft: 'auto' }}>
                  <div>Plan: <strong>{state.cliente?.plan || '-'}</strong></div>
                  <div>Disp: <strong>{(state.cliente?.requests_max || 0) - (state.cliente?.requests_usadas || 0)}</strong></div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="toolbar" style={{ marginBottom: 12 }}>
                <button className="btn btn-primary" onClick={openNew}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  Agregar
                </button>
                <button className="btn btn-outline" onClick={() => {
                  if (!state.prosTemplateId) {
                    alert('Primero seleccione una plantilla en el campo "Plantilla para enviar"');
                    return;
                  }
                  document.getElementById('import-csv')?.click();
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                  Importar
                </button>
                <input type="file" id="import-csv" accept=".csv" style={{ display: 'none' }} onChange={importCSV} />
                <span className="toolbar-counter">{state.prospects.length} prospectos</span>
              </div>

              <div className="table-container">
                <table className="table">
                  <thead id="prospects-table-head">
                    <tr id="prospects-header-row">
                      <th>Nombre</th>
                      <th>Teléfono</th>
                      {tpl?.header_type !== 'none' && <th>Adjunto Cabecera</th>}
                      {tpl &&
                        Array.from({ length: tpl.num_footer }).map((_, j) => (
                          <React.Fragment key={j}>
                            <th>URL img {j + 1}</th>
                            <th style={{ width: 44, textAlign: 'center' }}>✏️</th>
                          </React.Fragment>
                        ))}
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.prospects.length === 0 ? (
                      <tr>
                        <td colSpan={emptyCols} className="empty-state">
                          No hay prospectos. Agregue uno o importe CSV.
                        </td>
                      </tr>
                    ) : (
                      state.prospects.map((p, i) => (
                        <tr key={i}>
                          <td><strong>{p.nombre}</strong></td>
                          <td>{p.telefono}</td>
                          {tpl?.header_type !== 'none' && (
                            <td>
                              <input
                                type="url"
                                className="cell-input"
                                value={p.adjunto_cabecera || defaults.adjunto_cabecera || ''}
                                onChange={(e) => updateField(i, 'adjunto_cabecera', e.target.value)}
                                placeholder="URL adjunto"
                              />
                            </td>
                          )}
                          {tpl &&
                            Array.from({ length: tpl.num_footer }).map((_, j) => (
                              <React.Fragment key={j}>
                                <td>
                                  <input
                                    type="url"
                                    className="cell-input"
                                    value={(p.footer_imgs && p.footer_imgs[j]) || defaults[`footer_url${j + 1}`] || ''}
                                    onChange={(e) => {
                                      const updated = { ...p };
                                      if (!updated.footer_imgs) updated.footer_imgs = [];
                                      updated.footer_imgs[j] = e.target.value;
                                      dispatch({ type: 'UPDATE_PROSPECT', payload: { index: i, data: updated } });
                                    }}
                                    placeholder={`URL img ${j + 1}`}
                                  />
                                </td>
                                <td className="caption-cell">
                                  <button className="btn-icon" onClick={() => openCaption(i, j)} title="Editar texto de imagen">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                  </button>
                                </td>
                              </React.Fragment>
                            ))}
                          <td className="status-cell" dangerouslySetInnerHTML={{ __html: renderStatusCell(p.estado) }} />
                          <td className="actions-cell">
                            <button className="btn btn-icon" onClick={() => openEdit(i)} title="Editar">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            <button className="btn btn-icon btn-danger" onClick={() => deleteProspect(i)} title="Eliminar">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16 }}>
                <label><input type="checkbox" checked={onlyPending} onChange={(e) => setOnlyPending(e.target.checked)} /> Solo pendientes</label>
                <div style={{ marginLeft: 'auto' }}>
                  <button className="btn btn-primary btn-lg" onClick={startSend} disabled={sending}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                    {sending ? 'Enviando...' : 'Enviar mensajes'}
                  </button>
                </div>
              </div>
            </Card>

            {progressOpen && (
              <Card>
                <h3>Progreso</h3>
                <div className="progress-container">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: progressPct + '%' }} />
                  </div>
                  <span className="progress-text">{progressPct}%</span>
                </div>
                <div className="log-container" style={{ maxHeight: 300, overflowY: 'auto', marginTop: 12 }}>
                  {logs.map((l, i) => (
                    <div
                      key={i}
                      className={
                        l.includes('✓')
                          ? 'log-success'
                          : l.includes('✗') || l.includes('ERROR')
                          ? 'log-error'
                          : l.includes('===')
                          ? 'log-warning'
                          : 'log-info'
                      }
                      style={{ fontSize: 12, padding: '2px 0' }}
                    >
                      {l}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editIdx >= 0 ? 'Editar prospecto' : 'Nuevo prospecto'}>
              <form onSubmit={(e) => { e.preventDefault(); saveProspect(); }}>
                <div className="form-group">
                  <label>Nombre <span className="req">*</span></label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Teléfono <span className="req">*</span></label>
                  <input type="text" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="573001234567" required />
                </div>
                {tpl?.header_type !== 'none' && (
                  <div className="form-group">
                    <label>URL adjunto cabecera</label>
                    <input type="url" value={editAdjunto} onChange={(e) => setEditAdjunto(e.target.value)} placeholder="https://..." />
                  </div>
                )}
                {tpl &&
                  Array.from({ length: tpl.num_footer }).map((_, i) => (
                    <div className="form-group" key={i}>
                      <label>URL imagen {i + 1}</label>
                      <input
                        type="url"
                        value={editFooterImgs[i] || ''}
                        onChange={(e) => {
                          const imgs = [...editFooterImgs];
                          imgs[i] = e.target.value;
                          setEditFooterImgs(imgs);
                        }}
                        placeholder="https://..."
                      />
                    </div>
                  ))}
                <div className="form-actions">
                  <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">Guardar</button>
                </div>
              </form>
            </Modal>

            <Modal open={captionModalOpen} onClose={() => setCaptionModalOpen(false)} title={`Texto para imagen ${captionImgIdx + 1}`}>
              <form onSubmit={(e) => { e.preventDefault(); saveCaption(); }}>
                <div className="form-group">
                  <label>Texto para la imagen</label>
                  <textarea rows={3} value={captionText} onChange={(e) => setCaptionText(e.target.value)} placeholder="Texto opcional que aparecerá debajo de la imagen" />
                </div>
                <div className="form-actions">
                  <button type="button" className="btn btn-outline" onClick={() => setCaptionModalOpen(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">Guardar</button>
                </div>
              </form>
            </Modal>
          </section>
        </main>
      </div>
    </div>
  );
}
