'use client';

import { useApp } from '@/lib/store';
import { Sidebar } from '@/components/ui/Sidebar';
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { addProspect, updateProspect, deleteProspectFromDb, replaceAllProspects, fetchClient } from '@/lib/services';
import type { Plantilla, Prospecto } from '@/types';

function renderStatusCell(estado: string) {
  if (!estado) return '<span class="status-badge pending">Pendiente</span>';
  const esc = (s: string) => s.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"');
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
  const [editTextos, setEditTextos] = useState<string[]>([]);
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
  const [page, setPage] = useState(0);
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(state.prospects.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const paginatedProspects = state.prospects.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    if (!state.user?.cliente_id) return;
    setPage(0);
    refreshProspects().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.prosTemplateId]);
  const [importPct, setImportPct] = useState(0);
  const [importTotal, setImportTotal] = useState(0);
  const [importLogs, setImportLogs] = useState<string[]>([]);

  const tpl = state.prosTemplateId
    ? state.templates.find((t) => t.id === state.prosTemplateId) || null
    : null;

  const defaults = (tpl && state.sendFormData[String(tpl.id)]) || {};

  async function refreshProspects() {
    if (!state.prosTemplateId) {
      dispatch({ type: 'SET_PROSPECTS', payload: [] });
      return;
    }
    const { fetchProspects, fetchClient } = await import('@/lib/services');
    const [prospects, cliente] = await Promise.all([
      fetchProspects(state.prosTemplateId),
      fetchClient(state.cliente?.id || 0)
    ]);
    dispatch({ type: 'SET_PROSPECTS', payload: prospects });
    if (cliente) {
      dispatch({ type: 'SET_CLIENTE', payload: cliente });
    }
  }

  function openNew() {
    setEditIdx(-1);
    setEditName('');
    setEditPhone('');
    setEditAdjunto('');
    setEditFooterImgs([]);
    setEditTextos(tpl ? [1,2,3,4,5,6].map(i => (defaults as any)[`texto${i}`] || '') : []);
    setModalOpen(true);
  }

  function openEdit(i: number) {
    const p = state.prospects[i];
    setEditIdx(i);
    setEditName(p.nombre);
    setEditPhone(p.telefono);
    setEditAdjunto(p.adjunto_cabecera || '');
    setEditFooterImgs([...(p.footer_imgs || [])]);
    setEditTextos([p.texto1, p.texto2, p.texto3, p.texto4, p.texto5, p.texto6].map(s => s || ''));
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
      plantilla_id: state.prosTemplateId ?? undefined,
      texto1: editTextos[0] || undefined,
      texto2: editTextos[1] || undefined,
      texto3: editTextos[2] || undefined,
      texto4: editTextos[3] || undefined,
      texto5: editTextos[4] || undefined,
      texto6: editTextos[5] || undefined,
    };

    if (editIdx >= 0) {
      const updated = { ...data, id: state.prospects[editIdx].id };
      dispatch({ type: 'UPDATE_PROSPECT', payload: { index: editIdx, data: updated } });
      if (!state.demoMode) {
        try {
          await updateProspect(updated as Prospecto & { id: number });
        } catch (e) {
          console.error('Error updating prospect:', e);
        }
      }
    } else {
      if (!state.demoMode) {
        try {
          const added = await addProspect(data);
          dispatch({ type: 'ADD_PROSPECT', payload: added });
        } catch (e) {
          console.error('Error adding prospect:', e);
        }
      } else {
        const newProspect = { ...data, id: Date.now() };
        dispatch({ type: 'ADD_PROSPECT', payload: newProspect });
      }
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
      const commaCount = (lines[0].match(/,/g) || []).length;
      const semicolonCount = (lines[0].match(/;/g) || []).length;
      const delim = semicolonCount > commaCount ? ';' : ',';
      const rawHeaders = hasHeader ? lines[0].split(delim).map(s => s.trim().toLowerCase().replace(/^"|"$/g, '')) : [];
      const adjuntoIdx = rawHeaders.findIndex(h => h.replace(/_/g, ' ').includes('adjunto') || h.replace(/_/g, ' ').includes('cabecera'));
      const imgIndices = [1, 2, 3, 4].map(i => {
        const idx = rawHeaders.indexOf(`imagen_${i}`);
        return idx >= 0 ? idx : rawHeaders.indexOf(`imagen ${i}`);
      });
      const textIndices = [1, 2, 3, 4, 5, 6].map(i => {
        const idx = rawHeaders.indexOf(`texto${i}`);
        return idx >= 0 ? idx : -1;
      });
      const dataLines = hasHeader ? lines.slice(1) : lines;
      const prospects: Omit<Prospecto, 'id'>[] = [];
      const rowErrors: string[] = [];
      const savedDefaults = tpl ? (state.sendFormData[String(tpl.id)] || {}) : {};

      // Open import progress modal
      setImportOpen(true);
      setImportPct(5);
      setImportTotal(dataLines.length);
      setImportLogs(['Iniciando importación...']);

      // Parse data lines with progress
      let processed = 0;
      const batchSize = 50;
      for (let batchStart = 0; batchStart < dataLines.length; batchStart += batchSize) {
        const batchEnd = Math.min(batchStart + batchSize, dataLines.length);
        for (let rowIdx = batchStart; rowIdx < batchEnd; rowIdx++) {
          const line = dataLines[rowIdx];
          const parts = line.split(delim).map((s) => s.trim().replace(/^"|"$/g, ''));
          if (parts.length >= 2 && parts[0] && parts[1]) {
            const footer_imgs: string[] = [];
            for (let i = 0; i < 4; i++) {
              if (imgIndices[i] >= 0) {
                footer_imgs.push(parts[imgIndices[i]] || '');
              }
            }
            const textos = textIndices.map(idx => idx >= 0 ? parts[idx] || '' : '');
            if (tpl && tpl.num_textos > 0) {
              for (let i = 0; i < tpl.num_textos; i++) {
                const csvVal = textos[i] || '';
                const defaultVal = savedDefaults[`texto${i + 1}`] || '';
                if (!csvVal && !defaultVal) {
                  rowErrors.push(`Fila ${rowIdx + 2} (${parts[0]}): texto${i + 1} vacío en CSV y sin valor por defecto en "Enviar mensajes"`);
                }
              }
            }
            if (tpl && tpl.num_footer > 0) {
              let filled = 0;
              for (let i = 0; i < tpl.num_footer; i++) {
                const csvVal = (footer_imgs[i] || '') || '';
                const defaultVal = savedDefaults[`footer_url${i + 1}`] || '';
                if (csvVal || defaultVal) filled++;
              }
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
              plantilla_id: state.prosTemplateId ?? undefined,
              texto1: textos[0] || undefined,
              texto2: textos[1] || undefined,
              texto3: textos[2] || undefined,
              texto4: textos[3] || undefined,
              texto5: textos[4] || undefined,
              texto6: textos[5] || undefined,
            });
          }

          processed++;
          if (processed % 10 === 0 || processed === dataLines.length) {
            const pct = 5 + Math.round((processed / dataLines.length) * 80);
            setImportPct(pct);
            setImportLogs(prev => [...prev, `Procesada fila ${processed}/${dataLines.length}`]);
          }
        }
        await new Promise(r => setTimeout(r, 0));
      }

      if (rowErrors.length > 0) {
        setImportOpen(false);
        alert('Errores de validación en el CSV:\n' + rowErrors.join('\n'));
        return;
      }

      if (prospects.length === 0) {
        setImportOpen(false);
        alert('No se encontraron prospectos válidos en el CSV');
        return;
      }

      const cliente = state.cliente;
      if (cliente) {
        const disponibles = (cliente.requests_max || 0) - (cliente.requests_usadas || 0);
        if (prospects.length > disponibles) {
          setImportOpen(false);
          alert(
            `No hay suficientes mensajes disponibles.\n` +
            `Prospectos en CSV: ${prospects.length}\n` +
            `Mensajes disponibles: ${disponibles} (${cliente.requests_max} máx - ${cliente.requests_usadas} usadas)\n` +
            `Debe reducir la cantidad de prospectos o esperar a que se liberen mensajes.`
          );
          return;
        }
        setImportLogs(prev => [...prev, `Mensajes disponibles: ${disponibles} (${prospects.length} se usarán)`]);
      }

      setImportPct(85);
      setImportLogs(prev => [...prev, `Guardando ${prospects.length} prospectos en BD...`]);

      try {
        const created = await replaceAllProspects(prospects, state.prosTemplateId);
        dispatch({ type: 'SET_PROSPECTS', payload: created });
        setImportLogs(prev => [...prev, `✓ ${created.length} prospectos importados y guardados en BD`]);
        setImportPct(100);
        setTimeout(() => {
          setImportOpen(false);
          alert(`${created.length} prospectos importados y guardados en BD`);
        }, 800);
      } catch (e: any) {
        setImportOpen(false);
        alert('Error al guardar prospectos en BD: ' + (e.message || 'Error desconocido'));
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

    let targets = onlyPending ? prospectsToSend : state.prospects;
    if (targets.length === 0) {
      alert('No hay prospectos pendientes');
      return;
    }

    const errors: string[] = [];
    targets.forEach((p) => {
      if (tpl.header_type !== 'none' && !p.adjunto_cabecera && !saved.adjunto_cabecera) {
        errors.push(`${p.nombre}: falta adjunto de cabecera`);
      }
      if (tpl.num_textos > 0) {
        for (let i = 1; i <= tpl.num_textos; i++) {
          const txt = (p as any)[`texto${i}`] || saved[`texto${i}`];
          if (!txt) {
            errors.push(`${p.nombre}: falta texto${i} (ni en prospecto ni en "Enviar mensajes")`);
          }
        }
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
    setProgressPct(0);
    setProgressTotal(targets.length);
    setLogs(['Iniciando envío...']);
    setProgressOpen(true);

    let sent = 0;
    let newLogs: string[] = [];
    for (let i = 0; i < targets.length; i++) {
      const prospect = targets[i];
      const idx = state.prospects.findIndex(p => p === prospect);
      try {
        const res = await fetch('/api/send-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cliente_id: state.cliente?.id,
            usuario_id: state.user?.id,
            to: prospect.telefono,
            template_name: tpl!.template_name,
            language_code: tpl!.language_code,
            nombre_clie: prospect.nombre,
            nomb_mio: tpl!.nomb_mio || state.cliente?.nombre_comercial || '',
            header_image_url: prospect.adjunto_cabecera || saved.adjunto_cabecera || '',
            texto1: prospect.texto1 || saved.texto1 || '',
            texto2: prospect.texto2 || saved.texto2 || '',
            texto3: prospect.texto3 || saved.texto3 || '',
            texto4: prospect.texto4 || saved.texto4 || '',
            texto5: prospect.texto5 || saved.texto5 || '',
            texto6: prospect.texto6 || saved.texto6 || '',
          }),
        });
        if (!res.ok) throw new Error(await res.text());
        newLogs.push(`✓ ${prospect.nombre}`);
        if (idx >= 0) {
          const updated = { ...state.prospects[idx], estado: '✅ Enviado' };
          dispatch({ type: 'UPDATE_PROSPECT', payload: { index: idx, data: updated } });
          try { await updateProspect(updated as Prospecto & { id: number }); } catch {}
        }
        sent++;
      } catch (e: any) {
        const errMsg = e.message || 'Error desconocido';
        newLogs.push(`✗ ${prospect.nombre}: ${errMsg}`);
        if (idx >= 0) {
          const updated = { ...state.prospects[idx], estado: `❌ Error: ${errMsg}` };
          dispatch({ type: 'UPDATE_PROSPECT', payload: { index: idx, data: updated } });
          try { await updateProspect(updated as Prospecto & { id: number }); } catch {}
        }
      }
      const batch = newLogs;
      newLogs = [];
      setLogs((prev) => [...prev, ...batch]);
      setProgressPct(Math.round(((i + 1) / targets.length) * 100));
      if (i < targets.length - 1) await new Promise((r) => setTimeout(r, 1000));
    }

    setLogs((prev) => [...prev, `=== Envío completado: ${sent} de ${targets.length} ===`]);
    setSending(false);
  }

  const emptyCols = 2 + 1 + 6 + 4 * 2 + 2;

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
              <span style={{ fontSize: 13, color: '#667781' }}>{state.user?.nombre}</span>
              <button className="btn btn-outline btn-sm" style={{ background: '#075E54', color: '#fff', borderColor: '#075E54', fontWeight: 700 }} onClick={() => { if (typeof window !== 'undefined') { localStorage.removeItem('mercurio_user'); dispatch({ type: 'LOGOUT' }); window.location.href = '/'; } }}>Salir</button>
            </span>
          </div>
          {importOpen && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 4, zIndex: 1000, background: 'var(--bg)' }}>
              <div className="progress-bar" style={{ height: '100%' }}>
                <div className="progress-fill" style={{ width: importPct + '%', height: '100%', background: 'linear-gradient(90deg, var(--secondary), var(--accent))', borderRadius: '0', transition: 'width 0.3s' }} />
              </div>
              <div style={{ position: 'absolute', top: -20, right: 16, fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{importPct}%</div>
            </div>
          )}
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
                <button className="btn btn-secondary" onClick={refreshProspects}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6" /><path d="M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 18v6h6" /></svg>
                  Actualizar
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
                <button className="btn btn-danger" onClick={async () => {
                  if (!confirm('¿Eliminar TODOS los prospectos? Esta acción no se puede deshacer.')) return;
                  try {
                    const { deleteAllProspects } = await import('@/lib/services');
                    await deleteAllProspects();
                    await refreshProspects();
                    alert('Todos los prospectos eliminados');
                  } catch (e) {
                    alert('Error al eliminar prospectos');
                    console.error(e);
                  }
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                  Eliminar todos
                </button>
                <input type="file" id="import-csv" accept=".csv" style={{ display: 'none' }} onChange={importCSV} />
                <span className="toolbar-counter">{state.prospects.length} prospectos</span>
              </div>
            </Card>

            <Card>
              <div className="table-container">
                <table className="table">
                  <thead id="prospects-table-head">
                    <tr id="prospects-header-row">
                      <th>Nombre</th>
                      <th>Teléfono</th>
                      <th>Adjunto Cabecera</th>
                      {[1,2,3,4,5,6].map(j => (
                        <th key={`t${j}`} style={{ fontSize: 11, minWidth: 100 }}>Texto{j}</th>
                      ))}
                      {[1,2,3,4].map(j => (
                        <React.Fragment key={j}>
                          <th style={{ minWidth: 120 }}>URL img {j}</th>
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
                      paginatedProspects.map((p, i) => {
                        const fullIdx = page * pageSize + i;
                        return (
                        <tr key={fullIdx} style={{ height: 32 }}>
                          <td><strong>{p.nombre}</strong></td>
                          <td>{p.telefono}</td>
                          <td>
                            <input
                              type="url"
                              className="cell-input"
                              value={p.adjunto_cabecera || (tpl ? defaults.adjunto_cabecera : '') || ''}
                              onChange={(e) => updateField(fullIdx, 'adjunto_cabecera', e.target.value)}
                              placeholder="URL adjunto"
                            />
                          </td>
                          {[1,2,3,4,5,6].map(j => {
                            const key = `texto${j}`;
                            return (
                              <td key={key}>
                                <input
                                  type="text"
                                  className="cell-input"
                                  value={(p as any)[key] || (tpl ? (defaults as any)[key] : '') || ''}
                                  onChange={(e) => {
                                    const updated = { ...p, [key]: e.target.value || undefined };
                                    dispatch({ type: 'UPDATE_PROSPECT', payload: { index: fullIdx, data: updated } });
                                  }}
                                  placeholder={`Texto ${j}`}
                                />
                              </td>
                            );
                          })}
                          {[1,2,3,4].map(j => {
                            const imgIdx = j - 1;
                            return (
                              <React.Fragment key={j}>
                                <td>
                                  <input
                                    type="url"
                                    className="cell-input"
                                    value={(p.footer_imgs && p.footer_imgs[imgIdx]) || (tpl ? defaults[`footer_url${j}`] : '') || ''}
                                    onChange={(e) => {
                                      const imgs = [...(p.footer_imgs || [])];
                                      imgs[imgIdx] = e.target.value;
                                      const updated = { ...p, footer_imgs: imgs };
                                      dispatch({ type: 'UPDATE_PROSPECT', payload: { index: fullIdx, data: updated } });
                                    }}
                                    placeholder={`URL img ${j}`}
                                  />
                                </td>
                                <td className="caption-cell">
                                  <button className="btn-icon" onClick={() => openCaption(fullIdx, imgIdx)} title="Editar texto de imagen">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                  </button>
                                </td>
                              </React.Fragment>
                            );
                          })}
                          <td className="status-cell" dangerouslySetInnerHTML={{ __html: renderStatusCell(p.estado) }} />
                          <td className="actions-cell">
                            <button className="btn btn-icon" onClick={() => openEdit(fullIdx)} title="Editar">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            <button className="btn btn-icon btn-danger" onClick={() => deleteProspect(fullIdx)} title="Eliminar">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              {state.prospects.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <button className="btn btn-outline btn-sm" disabled={safePage === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>Anterior</button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      className={`btn btn-sm ${i === safePage ? 'btn-primary' : 'btn-outline'}`}
                      style={{ minWidth: 32, padding: '4px 8px' }}
                      onClick={() => setPage(i)}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button className="btn btn-outline btn-sm" disabled={safePage >= totalPages - 1} onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}>Siguiente</button>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 12 }}>{state.prospects.length} prospectos</span>
                </div>
              )}
            </Card>

            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16 }}>
              <label><input type="checkbox" checked={onlyPending} onChange={(e) => setOnlyPending(e.target.checked)} /> Solo pendientes</label>
              <div style={{ marginLeft: 'auto' }}>
                <button className="btn btn-primary btn-lg" onClick={startSend} disabled={sending}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                  {sending ? 'Enviando...' : 'Enviar mensajes'}
                </button>
              </div>
            </div>

          {importOpen && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 4, zIndex: 1000, background: 'var(--bg)' }}>
              <div className="progress-bar" style={{ height: '100%' }}>
                <div className="progress-fill" style={{ width: importPct + '%', height: '100%', background: 'linear-gradient(90deg, var(--secondary), var(--accent))', borderRadius: '0', transition: 'width 0.3s' }} />
              </div>
              <div style={{ position: 'absolute', top: -20, right: 16, fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{importPct}%</div>
            </div>
          )}

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

          {importOpen && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 4, zIndex: 1000, background: 'var(--bg)' }}>
              <div className="progress-bar" style={{ height: '100%' }}>
                <div className="progress-fill" style={{ width: importPct + '%', height: '100%', background: 'linear-gradient(90deg, var(--secondary), var(--accent))', borderRadius: '0', transition: 'width 0.3s' }} />
              </div>
              <div style={{ position: 'absolute', top: -20, right: 16, fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{importPct}%</div>
            </div>
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