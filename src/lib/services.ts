'use client';

import { getSupabase } from './supabase';
import type { Plantilla, Prospecto, Mensaje, SendFormValues } from '@/types';

function db() {
  return getSupabase() as any;
}

// ─── Templates ──────────────────────────────────────────────

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

export async function addTemplate(
  clienteId: number,
  tpl: Omit<Plantilla, 'id'>
): Promise<Plantilla> {
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
  const row = data;
  return {
    id: row.id,
    name: row.name,
    template_name: row.template_name,
    language_code: row.language_code,
    num_textos: row.num_textos,
    has_header: row.has_header,
    num_footer: row.num_footer,
    footer_captions: row.footer_captions || [],
    message_example: row.message_example || '',
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
  const { error } = await db()
    .from('plantillas')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ─── Prospects ──────────────────────────────────────────────

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

export async function addProspect(
  clienteId: number,
  p: Omit<Prospecto, 'id'>
): Promise<Prospecto> {
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
  const row = data;
  return {
    id: row.id,
    nombre: row.nombre,
    telefono: row.telefono,
    header_img: row.header_img || '',
    footer_imgs: row.footer_imgs || [],
    captions: row.captions || [],
    estado: row.estado || '',
  };
}

export async function updateProspect(
  p: Prospecto & { id: number }
): Promise<void> {
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
  const { error } = await db()
    .from('prospectos')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ─── Messages ───────────────────────────────────────────────

export async function fetchMessages(clienteId: number): Promise<Mensaje[]> {
  const { data, error } = await db()
    .from('mensajes')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) throw error;
  return (data || []).map((row: any) => ({
    id: row.id,
    to: row.to_number || '',
    tipo: row.tipo || '',
    mensaje: row.mensaje || '',
    estado: row.estado || '',
    error: row.error || '',
    fecha: row.created_at || '',
  }));
}

export async function addMessage(
  clienteId: number,
  msg: {
    prospecto_id?: number;
    plantilla_id?: string;
    to_number: string;
    tipo: string;
    mensaje?: string;
    estado: string;
    error?: string;
    meta_msg_id?: string;
  }
): Promise<void> {
  const { error } = await db()
    .from('mensajes')
    .insert({
      cliente_id: clienteId,
      prospecto_id: msg.prospecto_id || null,
      plantilla_id: msg.plantilla_id || null,
      to_number: msg.to_number,
      tipo: msg.tipo,
      mensaje: msg.mensaje || null,
      estado: msg.estado,
      error: msg.error || null,
      meta_msg_id: msg.meta_msg_id || null,
    });

  if (error) throw error;
}

// ─── Send Form Data ─────────────────────────────────────────

export async function fetchSendFormData(
  clienteId: number,
  plantillaId?: string
): Promise<Record<string, SendFormValues>> {
  const q = db()
    .from('send_form_data')
    .select('*')
    .eq('cliente_id', clienteId);

  if (plantillaId) q.eq('plantilla_id', plantillaId);

  const { data, error } = await q;

  if (error) throw error;
  const result: Record<string, SendFormValues> = {};
  (data || []).forEach((row: any) => {
    if (row.plantilla_id) {
      result[row.plantilla_id] = row.values_json || {};
    }
  });
  return result;
}

export async function upsertSendFormData(
  clienteId: number,
  plantillaId: string,
  values: SendFormValues
): Promise<void> {
  const { error } = await db()
    .from('send_form_data')
    .upsert(
      {
        cliente_id: clienteId,
        plantilla_id: plantillaId,
        values_json: values,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'cliente_id, plantilla_id',
        ignoreDuplicates: false,
      }
    );

  if (error) throw error;
}

// ─── Bulk load after login ──────────────────────────────────

export async function loadAllClientData(clienteId: number) {
  const [templates, prospects, messages, sendFormData] = await Promise.all([
    fetchTemplates(clienteId).catch(() => []),
    fetchProspects(clienteId).catch(() => []),
    fetchMessages(clienteId).catch(() => []),
    fetchSendFormData(clienteId).catch(() => ({})),
  ]);

  return { templates, prospects, messages, sendFormData };
}
