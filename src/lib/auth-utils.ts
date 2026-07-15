import { NextRequest } from 'next/server';

export function getClienteId(req: NextRequest): number | null {
  const header = req.headers.get('X-Cliente-Id');
  if (!header) return null;
  const id = parseInt(header, 10);
  return isNaN(id) ? null : id;
}

export function getUsuarioId(req: NextRequest): number | null {
  const header = req.headers.get('X-Usuario-Id');
  if (!header) return null;
  const id = parseInt(header, 10);
  return isNaN(id) ? null : id;
}
