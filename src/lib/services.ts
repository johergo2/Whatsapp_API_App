'use client';

import { getSupabase } from './supabase';
import type { Plantilla, Prospecto, Mensaje, SendFormValues, Contacto, Variable } from '@/types';

function db() {
  return getSupabase() as any;
}

// ─── Plantillas (UI layer) ───────────────────────────────────

export async function fetchTemplates(clienteId: number): Promise<Plantilla[]> {
  const { data, error } = await db()
    .from('plantillas')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    template_name: row.template_name,
    language_code: row.language_code,
    num_textos: row.num_textos,
    has_header: row.has_header,
    num_footer: row.num_footer,
    footer_captions: row.footer_captions || [],
    message_example: row.message_example || '',
  }));
}

export async function addTemplate(clienteId: number, tpl: Omit<Plantilla, 'id'>): Promise<Plantilla> {
  const { data, error } = await db()
    .from('plantillas')
    .insert({
      cliente_id: clienteId,
      name: tpl.name,
      template_name: tpl.template_name,
      language_code: tpl.language_code,
      num_textos: tpl.num_textos,
      has_header: tpl.has_header,
      num_footer: tpl.num_footer,
      footer_captions: tpl.footer_captions,
      message_example: tpl.message_example,
    })
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    name: data.name,
    template_name: data.template_name,
    language_code: data.language_code,
    num_textos: data.num_textos,
    has_header: data.has_header,
    num_footer: data.num_footer,
    footer_captions: data.footer_captions || [],
    message_example: data.message_example || '',
  };
}

export async function updateTemplate(tpl: Plantilla): Promise<void> {
  const { error } = await db()
    .from('plantillas')
    .update({
      name: tpl.name,
      template_name: tpl.template_name,
      language_code: tpl.language_code,
      num_textos: tpl.num_textos,
      has_header: tpl.has_header,
      num_footer: tpl.num_footer,
      footer_captions: tpl.footer_captions,
      message_example: tpl.message_example,
    })
    .eq('id', tpl.id);

  if (error) throw error;
}

export async function deleteTemplate(id: string): Promise<void> {
  const { error } = await db().from('plantillas').delete().eq('id', id);
  if (error) throw error;
}

// ─── Prospectos (UI layer) ───────────────────────────────────

export async function fetchProspects(clienteId: number): Promise<Prospecto[]> {
  const { data, error } = await db()
    .from('prospectos')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((row: any) => ({
    id: row.id,
    nombre: row.nombre,
    telefono: row.telefono,
    header_img: row.header_img || '',
    footer_imgs: row.footer_imgs || [],
    captions: row.captions || [],
    estado: row.estado || '',
  }));
}

export async function addProspect(clienteId: number, p: Omit<Prospecto, 'id'>): Promise<Prospecto> {
  const { data, error } = await db()
    .from('prospectos')
    .insert({
      cliente_id: clienteId,
      nombre: p.nombre,
      telefono: p.telefono,
      header_img: p.header_img || null,
      footer_imgs: p.footer_imgs || [],
      captions: p.captions || [],
      estado: p.estado || '',
    })
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    nombre: data.nombre,
    telefono: data.telefono,
    header_img: data.header_img || '',
    footer_imgs: data.footer_imgs || [],
    captions: data.captions || [],
    estado: data.estado || '',
  };
}

export async function updateProspect(p: Prospecto & { id: number }): Promise<void> {
  const { error } = await db()
    .from('prospectos')
    .update({
      nombre: p.nombre,
      telefono: p.telefono,
      header_img: p.header_img || null,
      footer_imgs: p.footer_imgs || [],
      captions: p.captions || [],
      estado: p.estado || '',
    })
    .eq('id', p.id);

  if (error) throw error;
}

export async function deleteProspectFromDb(id: number): Promise<void> {
  const { error } = await db().from('prospectos').delete().eq('id', id);
  if (error) throw error;
}

// ─── Send Form Data (UI layer) ───────────────────────────────

export async function fetchSendFormData(clienteId: number): Promise<Record<string, SendFormValues>> {
  const { data, error } = await db()
    .from('send_form_data')
    .select('*')
    .eq('cliente_id', clienteId);

  if (error) throw error;
  const result: Record<string, SendFormValues> = {};
  (data || []).forEach((row: any) => {
    if (row.plantilla_id) result[row.plantilla_id] = row.values_json || {};
  });
  return result;
}

export async function upsertSendFormData(clienteId: number, plantillaId: string, values: SendFormValues): Promise<void> {
  const { error } = await db()
    .from('send_form_data')
    .upsert(
      {
        cliente_id: clienteId,
        plantilla_id: plantillaId,
        values_json: values,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'cliente_id, plantilla_id', ignoreDuplicates: false }
    );

  if (error) throw error;
}

// ─── Clientes (core) ─────────────────────────────────────────

export async function fetchClienteByApiKey(apiKeyHash: string): Promise<any> {
  const { data, error } = await db()
    .from('clientes_whatsapp')
    .select('*')
    .eq('api_key', apiKeyHash)
    .single();

  if (error) throw error;
  return data;
}

export async function incrementRequestsUsadas(clienteId: number): Promise<void> {
  const { error } = await db()
    .rpc('increment_requests_usadas', { p_cliente_id: clienteId });

  if (error) {
    // Fallback direct update if RPC doesn't exist
    const { error: updErr } = await db()
      .from('clientes_whatsapp')
      .update({ requests_usadas: db().raw('COALESCE(requests_usadas, 0) + 1') })
      .eq('id', clienteId);
    if (updErr) throw updErr;
  }
}

// ─── Mensajes (core) ─────────────────────────────────────────

export async function fetchMessages(clienteId: number): Promise<Mensaje[]> {
  const { data, error } = await db()
    .from('mensajes_whatsapp')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('fecha_creacion', { ascending: false })
    .limit(200);

  if (error) throw error;
  return (data || []).map((row: any) => ({
    id: row.id,
    cliente_id: row.cliente_id,
    from_number: row.from_number,
    to_number: row.to_number,
    direction: row.direction,
    mensaje: row.mensaje || '',
    wamid: row.wamid,
    estado: row.estado || '',
    timestamp_wa: row.timestamp_wa,
    raw_payload: row.raw_payload,
    fecha_creacion: row.fecha_creacion,
  }));
}

export async function addMessage(msg: {
  cliente_id: number;
  from_number: string;
  to_number: string;
  direction: 'inbound' | 'outbound';
  mensaje?: string;
  wamid?: string;
  estado?: string;
  timestamp_wa?: string;
  raw_payload?: any;
}): Promise<void> {
  const { error } = await db()
    .from('mensajes_whatsapp')
    .insert({
      cliente_id: msg.cliente_id,
      from_number: msg.from_number,
      to_number: msg.to_number,
      direction: msg.direction,
      mensaje: msg.mensaje || null,
      wamid: msg.wamid || null,
      estado: msg.estado || 'pending',
      timestamp_wa: msg.timestamp_wa || null,
      raw_payload: msg.raw_payload || {},
    });

  if (error) throw error;
}

// ─── Estado Mensajes (core) ──────────────────────────────────

export async function addEstadoMensaje(estado: {
  mensaje_id: number;
  wamid?: string;
  estado: string;
  error_code?: string;
  error_detail?: string;
  timestamp_wa?: string;
  raw_payload?: any;
}): Promise<void> {
  const { error } = await db()
    .from('estado_mensajes_whatsapp')
    .insert({
      mensaje_id: estado.mensaje_id,
      wamid: estado.wamid || null,
      estado: estado.estado,
      error_code: estado.error_code || null,
      error_detail: estado.error_detail || null,
      timestamp_wa: estado.timestamp_wa || null,
      raw_payload: estado.raw_payload || {},
    });

  if (error) throw error;
}

export async function updateMensajeEstado(wamid: string, estado: string): Promise<void> {
  const { error } = await db()
    .from('mensajes_whatsapp')
    .update({ estado })
    .eq('wamid', wamid);

  if (error) throw error;
}

// ─── Contactos (core) ────────────────────────────────────────

export async function findContacto(clienteId: number, telefono: string): Promise<Contacto | null> {
  const { data, error } = await db()
    .from('contactos_whatsapp')
    .select('*')
    .eq('cliente_id', clienteId)
    .eq('telefono', telefono)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return data || null;
}

export async function upsertContacto(contacto: {
  cliente_id: number;
  telefono: string;
  nombre?: string;
  chatwoot_contact_id?: number;
  chatwoot_conversation_id?: number;
}): Promise<void> {
  const existing = await findContacto(contacto.cliente_id, contacto.telefono);

  if (existing) {
    const { error } = await db()
      .from('contactos_whatsapp')
      .update({
        chatwoot_contact_id: contacto.chatwoot_contact_id ?? existing.chatwoot_contact_id,
        chatwoot_conversation_id: contacto.chatwoot_conversation_id ?? existing.chatwoot_conversation_id,
        nombre: contacto.nombre || existing.nombre,
      })
      .eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await db()
      .from('contactos_whatsapp')
      .insert({
        cliente_id: contacto.cliente_id,
        telefono: contacto.telefono,
        nombre: contacto.nombre || null,
        chatwoot_contact_id: contacto.chatwoot_contact_id || null,
        chatwoot_conversation_id: contacto.chatwoot_conversation_id || null,
      });
    if (error) throw error;
  }
}

// ─── Variables (core) ────────────────────────────────────────

export async function fetchVariables(clienteId: number): Promise<Variable[]> {
  const { data, error } = await db()
    .from('variables_whatsapp')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('variable');

  if (error) throw error;
  return data || [];
}

export async function fetchVariablesAsMap(clienteId: number): Promise<Record<string, string>> {
  const vars = await fetchVariables(clienteId);
  const map: Record<string, string> = {};
  vars.forEach((v) => { map[v.variable] = v.valor; });
  return map;
}

// ─── Bulk load after login ───────────────────────────────────

export async function loadAllClientData(clienteId: number) {
  const [templates, prospects, messages] = await Promise.all([
    fetchTemplates(clienteId).catch(() => []),
    fetchProspects(clienteId).catch(() => []),
    fetchMessages(clienteId).catch(() => []),
  ]);
  return { templates, prospects, messages };
}
