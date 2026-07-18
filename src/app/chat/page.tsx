'use client';

import { useApp } from '@/lib/store';
import { Sidebar } from '@/components/ui/Sidebar';
import { useMemo, useState, useEffect, useRef, useCallback, FormEvent } from 'react';

function timeAgo(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Ahora';
  if (diffMin < 60) return `${diffMin}m`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `${diffDays}d`;
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' });
}

export default function ChatPage() {
  const { state, dispatch } = useApp();
  const [conversations, setConversations] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedTel, setSelectedTel] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [asignando, setAsignando] = useState(false);
  const [mensajeInput, setMensajeInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [showClosed, setShowClosed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [convPage, setConvPage] = useState(0);
  const [convTotal, setConvTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clienteId = state.user?.cliente_id;
  const usuarioId = state.user?.id;

  const loadConversations = useCallback(async (page = 0, append = false) => {
    if (!clienteId || !usuarioId) return;
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (page > 0) { params.set('page', String(page)); params.set('pageSize', '50'); }
      const res = await fetch(`/api/chat?${params}`, {
        headers: { 'X-Cliente-Id': String(clienteId), 'X-Usuario-Id': String(usuarioId) },
      });
      if (!res.ok) return;
      const j = await res.json();
      if (append) {
        setConversations((prev) => [...prev, ...(j.data || [])]);
      } else {
        setConversations(j.data || []);
      }
      setConvTotal(j.total || 0);
      setConvPage(page);
    } catch {}
  }, [clienteId, usuarioId, search]);

  const loadMore = useCallback(async () => {
    if (loadingMore || conversations.length >= convTotal) return;
    setLoadingMore(true);
    await loadConversations(convPage + 1, true);
    setLoadingMore(false);
  }, [loadingMore, conversations.length, convTotal, convPage, loadConversations]);

  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  const loadMessages = useCallback(async (tel: string) => {
    if (!clienteId) return;
    setMsgLoading(true);
    try {
      const res = await fetch(`/api/chat/${encodeURIComponent(tel)}`, {
        headers: { 'X-Cliente-Id': String(clienteId), 'X-Usuario-Id': String(usuarioId || '') },
      });
      if (!res.ok) { setMessages([]); return; }
      const j = await res.json();
      setMessages(j.data || []);
    } catch { setMessages([]); } finally { setMsgLoading(false); }
  }, [clienteId, usuarioId]);

  const pollMessages = useCallback(async (tel: string) => {
    if (!clienteId) return;
    try {
      const res = await fetch(`/api/chat/${encodeURIComponent(tel)}`, {
        headers: { 'X-Cliente-Id': String(clienteId), 'X-Usuario-Id': String(usuarioId || '') },
      });
      if (!res.ok) return;
      const j = await res.json();
      setMessages((prev: any[]) => {
        if (j.data && j.data.length > prev.length && isNearBottomRef.current) {
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 0);
        }
        return j.data || [];
      });
    } catch {}
  }, [clienteId, usuarioId]);

  const loadUsers = useCallback(async () => {
    if (!clienteId) return;
    try {
      const res = await fetch('/api/usuarios', {
        headers: { 'X-Cliente-Id': String(clienteId) },
      });
      if (res.ok) {
        const j = await res.json();
        setUsuarios(j || []);
      }
    } catch {}
  }, [clienteId]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  useEffect(() => { if (selectedTel) loadMessages(selectedTel); }, [selectedTel, loadMessages]);

  useEffect(() => { if (selectedTel) loadUsers(); }, [selectedTel, loadUsers]);

  // Auto-scroll inicial y tras enviar mensaje (solo si está cerca del final)
  useEffect(() => {
    if (isNearBottomRef.current) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Polling cada 10s (sin indicador de carga)
  const pollConversations = useCallback(async () => {
    if (!clienteId || !usuarioId) return;
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const res = await fetch(`/api/chat?${params}`, {
        headers: { 'X-Cliente-Id': String(clienteId), 'X-Usuario-Id': String(usuarioId) },
      });
      if (!res.ok) return;
      const j = await res.json();
      setConversations((prev) => {
        const merged = [...(j.data || [])];
        if (prev.length > merged.length && convPage > 0) {
          const existingIds = new Set(merged.map((c: any) => c.id));
          for (const c of prev) {
            if (!existingIds.has(c.id)) merged.push(c);
          }
        }
        return merged;
      });
      setConvTotal(j.total || 0);
    } catch {}
  }, [clienteId, usuarioId, search, convPage]);

  useEffect(() => {
    const iv = setInterval(() => { pollConversations(); if (selectedTel) pollMessages(selectedTel); }, 10000);
    return () => clearInterval(iv);
  }, [pollConversations, pollMessages, selectedTel]);

  async function handleAsignar(tel: string) {
    if (!clienteId || !usuarioId || asignando) return;
    setAsignando(true);
    try {
      await fetch(`/api/chat/${encodeURIComponent(tel)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-Cliente-Id': String(clienteId), 'X-Usuario-Id': String(usuarioId) },
        body: JSON.stringify({ usuario_id: usuarioId }),
      });
      await loadConversations();
    } catch {} finally { setAsignando(false); }
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!clienteId || !usuarioId || !selectedTel || sending || !mensajeInput.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/chat/${encodeURIComponent(selectedTel)}/responder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Cliente-Id': String(clienteId), 'X-Usuario-Id': String(usuarioId) },
        body: JSON.stringify({ mensaje: mensajeInput.trim() }),
      });
      if (res.ok) {
        setMensajeInput('');
        await loadMessages(selectedTel);
        await loadConversations();
      } else {
        const err = await res.json();
        alert(err.detail || 'Error al enviar mensaje');
      }
    } catch {
      alert('Error de conexión');
    } finally { setSending(false); }
  }

  async function handleReasignar(tel: string, userId: number | null) {
    if (!clienteId || !usuarioId) return;
    try {
      await fetch(`/api/chat/${encodeURIComponent(tel)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-Cliente-Id': String(clienteId), 'X-Usuario-Id': String(usuarioId) },
        body: JSON.stringify({ usuario_id: userId }),
      });
      await loadConversations();
    } catch {}
  }

  async function handleCerrar(tel: string) {
    if (!clienteId || !usuarioId) return;
    try {
      await fetch(`/api/chat/${encodeURIComponent(tel)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-Cliente-Id': String(clienteId), 'X-Usuario-Id': String(usuarioId) },
        body: JSON.stringify({ estado: 'cerrada' }),
      });
      setSelectedTel(null);
      await loadConversations();
    } catch {}
  }

  async function handleReabrir(tel: string) {
    if (!clienteId || !usuarioId) return;
    try {
      await fetch(`/api/chat/${encodeURIComponent(tel)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-Cliente-Id': String(clienteId), 'X-Usuario-Id': String(usuarioId) },
        body: JSON.stringify({ estado: 'activa' }),
      });
      await loadConversations();
    } catch {}
  }

  async function handleUploadMedia(file: File) {
    if (!clienteId || !usuarioId || !selectedTel || uploading) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'X-Cliente-Id': String(clienteId), 'X-Usuario-Id': String(usuarioId) },
        body: formData,
      });
      if (!uploadRes.ok) { alert('Error al subir archivo'); return; }
      const { url } = await uploadRes.json();

      const isImage = file.type.startsWith('image/');
      const res = await fetch('/api/send-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Cliente-Id': String(clienteId), 'X-Usuario-Id': String(usuarioId) },
        body: JSON.stringify({
          cliente_id: clienteId,
          to: selectedTel,
          image_url: isImage ? url : null,
          video_url: isImage ? null : url,
          caption: '',
          usuario_id: usuarioId,
        }),
      });
      if (res.ok) {
        await loadMessages(selectedTel);
        await loadConversations();
      } else {
        const err = await res.json();
        alert(err.detail || 'Error al enviar archivo');
      }
    } catch {
      alert('Error de conexión');
    } finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  }

  function selectConversation(tel: string) {
    setSelectedTel(tel);
    if (typeof window !== 'undefined' && window.innerWidth < 768) setMobileView('chat');
    if (clienteId && usuarioId) {
      fetch(`/api/chat/${encodeURIComponent(tel)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-Cliente-Id': String(clienteId), 'X-Usuario-Id': String(usuarioId) },
        body: JSON.stringify({ ultimo_mensaje_leido_id: true }),
      })
        .then(() => {
          setConversations(prev => prev.map(c =>
            c.telefono === tel ? { ...c, no_leidos: 0 } : c
          ));
        })
        .catch(() => {});
    }
  }

  const selectedConv = conversations.find(c => c.telefono === selectedTel);

  const filtered = useMemo(() => {
    let list = conversations;
    if (!showClosed) list = list.filter(c => c.estado !== 'cerrada');
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(c => (c.nombre || '').toLowerCase().includes(s) || c.telefono.includes(s));
    }
    return list;
  }, [conversations, search, showClosed]);

  return (
    <div id="app">
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
              <button className="btn btn-outline btn-sm" style={{ background: '#075E54', color: '#fff', borderColor: '#075E54', fontWeight: 700 }} onClick={() => { localStorage.removeItem('mercurio_user'); dispatch({ type: 'LOGOUT' }); window.location.href = '/'; }}>Salir</button>
            </span>
          </div>

          <div style={{ display: 'flex', height: 'calc(100vh - 100px)', overflow: 'hidden', position: 'relative' }}>
            {/* Panel izquierdo: lista de conversaciones */}
            <div className={`chat-list ${mobileView === 'list' ? '' : 'mobile-hidden'}`}>
              <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
                <input
                  type="text"
                  placeholder="Buscar conversación..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, background: '#f0f2f5', outline: 'none' }}
                />
              </div>
              <div style={{ padding: '4px 12px 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <label style={{ fontSize: 12, color: '#667781', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                  <input type="checkbox" checked={showClosed} onChange={e => setShowClosed(e.target.checked)} style={{ cursor: 'pointer' }} />
                  Mostrar cerradas
                </label>
              </div>
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {filtered.length === 0 && (
                  <div style={{ padding: 24, textAlign: 'center', color: '#667781', fontSize: 13 }}>No hay conversaciones</div>
                )}
                {filtered.map(conv => (
                  <div
                    key={conv.id}
                    onClick={() => selectConversation(conv.telefono)}
                    className={`chat-list-item ${selectedTel === conv.telefono ? 'active' : ''} ${conv.no_leidos > 0 ? 'chat-unread' : ''}`}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: conv.no_leidos > 0 ? 700 : 500 }}>
                          {conv.no_leidos > 0 && <span style={{ marginRight: 4 }}>↩</span>}
                          {conv.nombre || conv.telefono}
                        </strong>
                        <span style={{ fontSize: 11, color: '#667781', whiteSpace: 'nowrap', marginLeft: 8 }}>
                          {timeAgo(conv.ultima_fecha)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                        <span style={{ fontSize: 13, color: '#667781', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                          {conv.no_leidos > 0 ? <strong style={{ color: '#111b21' }}>{'✉ ' + (conv.ultimo_mensaje || '')}</strong> : (conv.ultimo_mensaje || '')}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
                          {!conv.usuario_id && (
                            <button
                              className="btn btn-outline btn-sm"
                              style={{ fontSize: 10, padding: '2px 6px', color: '#e65100', borderColor: '#e65100' }}
                              onClick={e => { e.stopPropagation(); handleAsignar(conv.telefono); }}
                              disabled={asignando}
                            >Sin asignar</button>
                          )}
                              {conv.estado === 'cerrada' && (
                                <span style={{ fontSize: 10, color: '#9e9e9e' }}>Cerrada</span>
                              )}
                              {conv.no_leidos > 0 && (
                                <span style={{ background: '#25d366', color: '#fff', borderRadius: 12, padding: '2px 8px', fontSize: 11, fontWeight: 700, minWidth: 22, textAlign: 'center', lineHeight: '18px' }}>
                                  {conv.no_leidos}
                                </span>
                              )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {conversations.length < convTotal && (
                  <div style={{ padding: '12px', textAlign: 'center' }}>
                    <button
                      className="btn btn-outline btn-sm"
                      disabled={loadingMore}
                      onClick={loadMore}
                      style={{ fontSize: 12, padding: '6px 20px', cursor: loadingMore ? 'not-allowed' : 'pointer' }}
                    >{loadingMore ? 'Cargando...' : 'Cargar más'}</button>
                  </div>
                )}
              </div>
            </div>

            {/* Panel derecho: conversación */}
            <div className={`chat-conversation ${mobileView === 'chat' ? '' : 'mobile-hidden'}`}>
              {!selectedTel ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#667781', fontSize: 14 }}>
                  Selecciona una conversación
                </div>
              ) : (
                <>
                  <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    {typeof window !== 'undefined' && window.innerWidth < 768 && (
                      <button className="btn btn-outline btn-sm" onClick={() => { setMobileView('list'); setSelectedTel(null); }}>←</button>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ fontSize: 14 }}>{selectedConv?.nombre || selectedTel}</strong>
                      <div style={{ fontSize: 13, color: '#667781' }}>{selectedTel}</div>
                    </div>
                    <select
                      value={selectedConv?.usuario_id || ''}
                      onChange={e => handleReasignar(selectedTel!, parseInt(e.target.value, 10) || null)}
                      style={{ fontSize: 11, padding: '3px 6px', border: '1px solid var(--border)', borderRadius: 4, background: '#fff', maxWidth: 120 }}
                      title="Asignar a"
                    >
                      <option value="">Sin asignar</option>
                      {usuarios.map(u => (
                        <option key={u.id} value={u.id}>{u.nombre}</option>
                      ))}
                    </select>
                    {selectedConv?.estado !== 'cerrada' ? (
                      <button
                        className="btn btn-sm"
                        onClick={() => handleCerrar(selectedTel!)}
                        style={{ fontSize: 12, padding: '5px 14px', background: '#ffcdd2', color: '#000', border: '1px solid #e57373', borderRadius: 6, whiteSpace: 'nowrap', cursor: 'pointer', fontWeight: 600, boxShadow: '0 1px 3px rgba(0,0,0,.2)' }}
                      >Cerrar</button>
                    ) : (
                      <button
                        className="btn btn-sm"
                        onClick={() => handleReabrir(selectedTel!)}
                        style={{ fontSize: 12, padding: '5px 14px', background: '#c8e6c9', color: '#000', border: '1px solid #81c784', borderRadius: 6, whiteSpace: 'nowrap', cursor: 'pointer', fontWeight: 600, boxShadow: '0 1px 3px rgba(0,0,0,.2)' }}
                      >Reabrir</button>
                    )}
                  </div>
                  <div
                    ref={messagesScrollRef}
                    onScroll={() => { const el = messagesScrollRef.current; if (el) isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 150; }}
                    style={{ flex: 1, overflowY: 'auto', padding: 12, background: '#efeae2' }}>
                    {msgLoading ? (
                      <div style={{ textAlign: 'center', color: '#667781', padding: 20 }}>Cargando mensajes...</div>
                    ) : messages.length === 0 ? (
                      <div style={{ textAlign: 'center', color: '#667781', padding: 20 }}>No hay mensajes</div>
                    ) : (
                      [...messages].reverse().map((msg) => (
                        <div key={msg.id} style={{ display: 'flex', justifyContent: msg.direction === 'outbound' ? 'flex-end' : 'flex-start', marginBottom: 6 }}>
                          <div style={{
                            maxWidth: '70%',
                            padding: '7px 10px',
                            borderRadius: 8,
                            background: msg.direction === 'outbound' ? '#dcf8c6' : '#fff',
                            fontSize: 13,
                            wordBreak: 'break-word',
                            boxShadow: '0 1px 1px rgba(0,0,0,.08)',
                          }}>
                            {msg.mensaje?.startsWith('image:') || msg.mensaje?.startsWith('video:') ? (
                              <>
                                <span style={{ fontSize: 12, color: '#667781', display: 'block', marginBottom: 4 }}>
                                  {msg.mensaje?.startsWith('image:') ? '🖼️ Imagen' : '🎬 Video'}
                                </span>
                                {msg.mensaje?.startsWith('image:') && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={msg.mensaje.replace(/^image:\s*/i, '')} alt="" style={{ maxWidth: '100%', borderRadius: 4, marginBottom: 4 }} />
                                )}
                              </>
                            ) : (
                              <span style={{ whiteSpace: 'pre-wrap' }}>{msg.mensaje || '-'}</span>
                            )}
                            <div style={{ fontSize: 10, color: '#667781', textAlign: 'right', marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3 }}>
                              {msg.fecha_creacion ? new Date(msg.fecha_creacion).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : ''}
                              {msg.direction === 'outbound' && (
                                <span style={{ fontSize: 11, lineHeight: 1 }}>
                                  {msg.estado === 'read' ? '✓✓' : msg.estado === 'delivered' ? '✓✓' : msg.estado === 'sent' ? '✓' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  <form onSubmit={handleSend} style={{ display: 'flex', padding: '8px 12px', background: '#f0f2f5', gap: 6, borderTop: '1px solid var(--border)' }}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadMedia(f); }}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                      style={{ background: 'none', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: uploading ? 'not-allowed' : 'pointer', color: '#8696a0', flexShrink: 0 }}
                      title="Adjuntar imagen o video"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    </button>
                    <textarea
                      ref={inputRef as any}
                      value={mensajeInput}
                      onChange={e => setMensajeInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); (e.target as HTMLTextAreaElement).form?.requestSubmit(); } }}
                      placeholder="Escribe un mensaje..."
                      disabled={sending || uploading}
                      rows={1}
                      style={{ flex: 1, padding: '9px 12px', border: 'none', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff', resize: 'none', fontFamily: 'inherit' }}
                    />
                    <button
                      type="submit"
                      disabled={sending || uploading || !mensajeInput.trim()}
                      style={{ background: sending || uploading ? '#8696a0' : '#00a884', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: sending || uploading ? 'not-allowed' : 'pointer', color: '#fff', flexShrink: 0 }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"/></svg>
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </main>
      </div>

      <style>{`
        .chat-list { width: 340px; border-right: 1px solid var(--border); display: flex; flex-direction: column; background: #fff; flex-shrink: 0; }
        .chat-conversation { flex: 1; display: flex; flex-direction: column; min-width: 0; }
        .chat-list-item { display: flex; align-items: flex-start; padding: 10px 12px; cursor: pointer; border-bottom: 1px solid #f0f2f5; transition: background .15s; }
        .chat-list-item:hover { background: #f0f2f5; }
        .chat-list-item.active { background: #e8f5e9; }
        .chat-list-item.chat-unread { background: #f0faf0; border-left: 3px solid #25d366; padding-left: 9px; }
        .chat-list-item.chat-unread:hover { background: #e6f5e6; }
        .chat-list-item.chat-unread.active { background: #d8f0d8; }
        @media (max-width: 767px) {
          .chat-list { width: 100%; }
          .mobile-hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
