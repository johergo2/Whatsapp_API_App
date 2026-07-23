import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';
import { getClienteId } from '@/lib/auth-utils';

export async function GET(req: NextRequest) {
  const clienteId = getClienteId(req);
  if (!clienteId) {
    return NextResponse.json({ detail: 'Debe enviar el header X-Cliente-Id' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const all = searchParams.get('all') === 'true';
  const page = Math.max(0, parseInt(searchParams.get('page') || '0', 10));
  const pageSize = all ? 100000 : Math.min(200, Math.max(1, parseInt(searchParams.get('pageSize') || '200', 10)));
  const direction = searchParams.get('direction');
  const estado = searchParams.get('estado');
  const search = searchParams.get('search');
  const clienteNombre = searchParams.get('cliente_nombre');
  const fromNumber = searchParams.get('from_number');
  const toNumber = searchParams.get('to_number');
  const mensaje = searchParams.get('mensaje');
  const fechaDesde = searchParams.get('fecha_desde');
  const fechaHasta = searchParams.get('fecha_hasta');

  const supabase = getServerSupabase();

  let clienteIds: number[] | null = null;
  if (clienteNombre) {
    const { data: clientes } = await supabase
      .from('clientes_whatsapp')
      .select('id')
      .ilike('nombre_comercial', `%${clienteNombre}%`);
    clienteIds = (clientes || []).map((c: any) => c.id);
    if (clienteIds.length === 0) {
      return NextResponse.json({ data: [], total: 0, page, pageSize });
    }
  }

  let query = supabase
    .from('mensajes_whatsapp')
    .select('*, clientes_whatsapp!inner(nombre_comercial)', { count: 'exact' })
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
  if (clienteIds) {
    query = query.in('cliente_id', clienteIds);
  }
  if (fromNumber) {
    query = query.ilike('from_number', `%${fromNumber}%`);
  }
  if (toNumber) {
    query = query.ilike('to_number', `%${toNumber}%`);
  }
  if (mensaje) {
    query = query.ilike('mensaje', `%${mensaje}%`);
  }
  if (fechaDesde) {
    query = query.gte('fecha_creacion', fechaDesde);
  }
  if (fechaHasta) {
    query = query.lte('fecha_creacion', `${fechaHasta}T23:59:59`);
  }

  let q = query.order('fecha_creacion', { ascending: false });
  if (!all) {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    q = q.range(from, to);
  }

  const { data, error, count } = await q;

  if (error) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }

  const result = (data || []).map((m: any) => ({
    ...m,
    cliente_nombre: m.clientes_whatsapp?.nombre_comercial || '-',
    clientes_whatsapp: undefined,
  }));

  return NextResponse.json({ data: result, total: count || 0, page, pageSize });
}
