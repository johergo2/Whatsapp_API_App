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
  const clienteNombre = searchParams.get('cliente_nombre');
  const fromNumber = searchParams.get('from_number');
  const toNumber = searchParams.get('to_number');
  const mensaje = searchParams.get('mensaje');
  const estado = searchParams.get('estado');
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
    .select('*, estado_mensajes_whatsapp(*), clientes_whatsapp!inner(nombre_comercial)', { count: 'exact' });

  if (direction === 'inbound' || direction === 'outbound') {
    query = query.eq('direction', direction);
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
  if (estado) {
    query = query.ilike('estado', `%${estado}%`);
  }
  if (fechaDesde) {
    query = query.gte('fecha_creacion', fechaDesde);
  }
  if (fechaHasta) {
    query = query.lte('fecha_creacion', `${fechaHasta}T23:59:59`);
  }

  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order('id', { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }

  const result = (data || []).map((m: any) => {
    const estados = m.estado_mensajes_whatsapp || [];
    const sorted = [...estados].sort((a: any, b: any) => a.id - b.id);
    return {
      m_id: m.id,
      cliente_id: m.cliente_id,
      cliente_nombre: m.clientes_whatsapp?.nombre_comercial || '-',
      from_number: m.from_number,
      to_number: m.to_number,
      direction: m.direction,
      mensaje: m.mensaje,
      estado: m.estado,
      wamid: m.wamid,
      fecha_creacion: m.fecha_creacion,
      id_detail: sorted.map((e: any) => e.id).join(', '),
      e_estados_detail: sorted.map((e: any) => e.estado).join(', '),
      error_codigo: sorted.map((e: any) => e.error_code || '').filter(Boolean).join(', '),
      error_detalle: sorted.map((e: any) => e.error_detail || '').filter(Boolean).join(', '),
    };
  });

  return NextResponse.json({ data: result, total: count || 0, page, pageSize });
}
