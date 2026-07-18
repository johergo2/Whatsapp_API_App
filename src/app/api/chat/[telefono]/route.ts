import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';
import { getClienteId, getUsuarioId } from '@/lib/auth-utils';

export async function GET(req: NextRequest, { params }: { params: { telefono: string } }) {
  const clienteId = getClienteId(req);
  if (!clienteId) {
    return NextResponse.json({ detail: 'Debe enviar el header X-Cliente-Id' }, { status: 401 });
  }

  const telefono = params.telefono;
  if (!telefono) {
    return NextResponse.json({ detail: 'Debe especificar el teléfono' }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(0, parseInt(searchParams.get('page') || '0', 10));
  const pageSize = Math.min(200, Math.max(1, parseInt(searchParams.get('pageSize') || '50', 10)));

  const supabase = getServerSupabase();

  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from('mensajes_whatsapp')
    .select('*', { count: 'exact' })
    .eq('cliente_id', clienteId)
    .or(`from_number.eq.${telefono},to_number.eq.${telefono}`)
    .order('fecha_creacion', { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data || [], total: count || 0, page, pageSize });
}

export async function PATCH(req: NextRequest, { params }: { params: { telefono: string } }) {
  const clienteId = getClienteId(req);
  if (!clienteId) {
    return NextResponse.json({ detail: 'Debe enviar el header X-Cliente-Id' }, { status: 401 });
  }

  const telefono = params.telefono;
  if (!telefono) {
    return NextResponse.json({ detail: 'Debe especificar el teléfono' }, { status: 400 });
  }

  const supabase = getServerSupabase();
  const body = await req.json();
  const updates: Record<string, any> = { fecha_actualizacion: new Date().toISOString() };

  if (body.usuario_id !== undefined) updates.usuario_id = body.usuario_id;
  if (body.estado !== undefined) updates.estado = body.estado;
  if (body.ultimo_mensaje_leido_id !== undefined) {
    if (body.ultimo_mensaje_leido_id === true) {
      const { data: lastMsg } = await supabase
        .from('mensajes_whatsapp')
        .select('id')
        .eq('cliente_id', clienteId)
        .or(`from_number.eq.${telefono},to_number.eq.${telefono}`)
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (lastMsg) updates.ultimo_mensaje_leido_id = lastMsg.id;
    } else {
      updates.ultimo_mensaje_leido_id = body.ultimo_mensaje_leido_id;
    }
  }

  const { error } = await supabase
    .from('chat_whatsapp')
    .update(updates)
    .eq('cliente_id', clienteId)
    .eq('telefono', telefono);

  if (error) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
