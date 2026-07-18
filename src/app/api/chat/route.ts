import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';
import { getClienteId, getUsuarioId } from '@/lib/auth-utils';

export async function GET(req: NextRequest) {
  const clienteId = getClienteId(req);
  if (!clienteId) {
    return NextResponse.json({ detail: 'Debe enviar el header X-Cliente-Id' }, { status: 401 });
  }

  const usuarioId = getUsuarioId(req);

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const page = Math.max(0, parseInt(searchParams.get('page') || '0', 10));
  const pageSize = Math.min(500, Math.max(1, parseInt(searchParams.get('pageSize') || '200', 10)));

  const supabase = getServerSupabase();

  let query = supabase
    .from('chat_whatsapp')
    .select('*', { count: 'exact' })
    .eq('cliente_id', clienteId);

  if (usuarioId) {
    if (search) {
      const s = `%${search}%`;
      query = query.or(`and(usuario_id.eq.${usuarioId},or(nombre.ilike.${s},telefono.ilike.${s})),and(usuario_id.is.null,or(nombre.ilike.${s},telefono.ilike.${s}))`);
    } else {
      query = query.or(`usuario_id.eq.${usuarioId},usuario_id.is.null`);
    }
  } else if (search) {
    query = query.or(`nombre.ilike.%${search}%,telefono.ilike.%${search}%`);
  }

  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order('ultima_fecha', { ascending: false, nullsFirst: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }

  const rows = data || [];
  if (rows.length > 0) {
    const telefonos = new Set(rows.map((r: any) => r.telefono));
    const leidoPorTel: Record<string, number> = {};
    for (const r of rows) {
      if (r.ultimo_mensaje_leido_id) leidoPorTel[r.telefono] = r.ultimo_mensaje_leido_id;
    }

    const { data: ultimos } = await supabase
      .from('mensajes_whatsapp')
      .select('id, from_number, to_number, direction')
      .eq('cliente_id', clienteId)
      .order('id', { ascending: false });

    const ultimoPorTel: Record<string, { direction: string }> = {};
    const noLeidosPorTel: Record<string, number> = {};
    if (ultimos) {
      for (const msg of ultimos) {
        const tel = telefonos.has(msg.from_number) ? msg.from_number
          : telefonos.has(msg.to_number) ? msg.to_number
          : null;
        if (tel) {
          if (!ultimoPorTel[tel]) {
            ultimoPorTel[tel] = { direction: msg.direction };
          }
          if (msg.direction === 'inbound' && (!leidoPorTel[tel] || msg.id > leidoPorTel[tel])) {
            noLeidosPorTel[tel] = (noLeidosPorTel[tel] || 0) + 1;
          }
        }
      }
    }

    for (const row of rows) {
      const ult = ultimoPorTel[row.telefono];
      (row as any).tiene_respuesta = ult ? ult.direction === 'inbound' : false;
      (row as any).no_leidos = noLeidosPorTel[row.telefono] || 0;
    }

    rows.sort((a: any, b: any) => {
      if ((a as any).tiene_respuesta !== (b as any).tiene_respuesta) {
        return (a as any).tiene_respuesta ? -1 : 1;
      }
      const fa = a.ultima_fecha ? new Date(a.ultima_fecha).getTime() : 0;
      const fb = b.ultima_fecha ? new Date(b.ultima_fecha).getTime() : 0;
      return fb - fa;
    });
  }

  return NextResponse.json({ data: rows, total: count || 0, page, pageSize });
}
