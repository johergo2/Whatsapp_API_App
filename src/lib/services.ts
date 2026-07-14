'use client';

import type { Plantilla, Prospecto, Mensaje, SendFormValues, Cliente } from '@/types';

function clienteId() {
  if (typeof window === 'undefined') return '';
  try {
    const raw = localStorage.getItem('mercurio_user');
    if (!raw) return '';
    const user = JSON.parse(raw);
    return String(user.cliente_id || '');
  } catch { return ''; }
}

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Cliente-Id': clienteId(),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Error en la solicitud');
  }
  return res.json();
}

export async function fetchClient(clienteId: number): Promise<Cliente | null> {
  if (!clienteId) return null;
  return apiFetch(`/api/cliente?cliente_id=${clienteId}`);
}

// ─── Plantillas ───────────────────────────────────

export async function fetchTemplates(): Promise<Plantilla[]> {
  return apiFetch('/api/plantillas');
}

export async function addTemplate(tpl: Omit<Plantilla, 'id'>): Promise<Plantilla> {
  return apiFetch('/api/plantillas', {
    method: 'POST',
    body: JSON.stringify(tpl),
  });
}

export async function updateTemplate(tpl: Plantilla): Promise<void> {
  await apiFetch('/api/plantillas', {
    method: 'PUT',
    body: JSON.stringify(tpl),
  });
}

export async function deleteTemplate(id: number): Promise<void> {
  await apiFetch(`/api/plantillas?id=${id}`, { method: 'DELETE' });
}

// ─── Send Form Data ───────────────────────────────

export async function fetchSendFormData(): Promise<Record<string, SendFormValues>> {
  const rows = await apiFetch('/api/send-form-data');
  const map: Record<string, SendFormValues> = {};
  for (const row of rows as Array<{ plantilla_id: number; values_json: Record<string, string> }>) {
    map[String(row.plantilla_id)] = row.values_json as SendFormValues;
  }
  return map;
}

export async function upsertSendFormData(plantillaId: number, values: Record<string, string | undefined>): Promise<void> {
  await apiFetch('/api/send-form-data', {
    method: 'POST',
    body: JSON.stringify({ plantilla_id: plantillaId, values }),
  });
}

// ─── Prospectos ───────────────────────────────────

export async function fetchProspects(): Promise<Prospecto[]> {
  return apiFetch('/api/prospectos');
}

export async function addProspect(p: Omit<Prospecto, 'id'>): Promise<Prospecto> {
  return apiFetch('/api/prospectos', {
    method: 'POST',
    body: JSON.stringify(p),
  });
}

export async function updateProspect(p: Prospecto & { id: number }): Promise<void> {
  await apiFetch('/api/prospectos', {
    method: 'PUT',
    body: JSON.stringify(p),
  });
}

export async function deleteProspectFromDb(id: number): Promise<void> {
  await apiFetch(`/api/prospectos?id=${id}`, { method: 'DELETE' });
}

export async function replaceAllProspects(prospects: Omit<Prospecto, 'id'>[]): Promise<Prospecto[]> {
  // Delete all existing prospects for this client
  await apiFetch('/api/prospectos', { method: 'DELETE' });

  // Bulk insert all prospects
  const created = await apiFetch('/api/prospectos', {
    method: 'POST',
    body: JSON.stringify(prospects),
  });
  return created;
}

// ─── Mensajes ─────────────────────────────────────

export async function fetchMessages(): Promise<Mensaje[]> {
  return apiFetch('/api/mensajes');
}

// ─── Bulk load after login ────────────────────────
export async function loadAllClientData() {
  const [templates, prospects, messages, sendFormData] = await Promise.all([
    fetchTemplates().catch(() => []),
    fetchProspects().catch(() => []),
    fetchMessages().catch(() => []),
    fetchSendFormData().catch(() => ({})),
  ]);
  return { templates, prospects, messages, sendFormData };
}