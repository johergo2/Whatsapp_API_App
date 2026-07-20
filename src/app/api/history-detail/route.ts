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

  const supabase = getServerSupabase();

  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from('mensajes_whatsapp')
    .select('*, estado_mensajes_whatsapp!inner(*)', { count: 'exact' })
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
