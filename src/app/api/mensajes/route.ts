import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';
import { getClienteId } from '@/lib/auth-utils';

export async function GET(req: NextRequest) {
  const clienteId = getClienteId(req);
  if (!clienteId) {
    return NextResponse.json({ detail: 'Debe enviar el header X-Cliente-Id' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(0, parseInt(searchParams.get('page') || '0', 10));
  const pageSize = Math.min(200, Math.max(1, parseInt(searchParams.get('pageSize') || '200', 10)));
  const direction = searchParams.get('direction');
  const estado = searchParams.get('estado');
  const search = searchParams.get('search');

  const supabase = getServerSupabase();

  let query = supabase
    .from('mensajes_whatsapp')
    .select('*', { count: 'exact' })
    .eq('cliente_id', clienteId);

  if (direction === 'inbound' || direction === 'outbound') {
    query = query.eq('direction', direction);
  }
  if (estado) {
    query = query.ilike('estado', `%${estado}%`);
  }
  if (search) {
    query = query.or(`from_number.ilike.%${search}%,to_number.ilike.%${search}%,mensaje.ilike.%${search}%`);
  }

  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order('fecha_creacion', { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data || [], total: count || 0, page, pageSize });
}
