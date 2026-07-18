import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';
import { getClienteId, getUsuarioId } from '@/lib/auth-utils';

export async function POST(req: NextRequest, { params }: { params: { telefono: string } }) {
  try {
    const clienteId = getClienteId(req);
    if (!clienteId) {
      return NextResponse.json({ detail: 'Debe enviar el header X-Cliente-Id' }, { status: 401 });
    }

    const usuarioId = getUsuarioId(req);
    if (!usuarioId) {
      return NextResponse.json({ detail: 'Debe enviar el header X-Usuario-Id' }, { status: 401 });
    }

    const telefono = params.telefono;
    if (!telefono) {
      return NextResponse.json({ detail: 'Debe especificar el teléfono' }, { status: 400 });
    }

    const body = await req.json();
    const { mensaje } = body;
    if (!mensaje || !mensaje.trim()) {
      return NextResponse.json({ detail: 'El mensaje es obligatorio' }, { status: 400 });
    }

    const supabase = getServerSupabase();

    // Get client phone_number_id
    const { data: cliente } = await supabase
      .from('clientes_whatsapp')
      .select('phone_number_id, display_number')
      .eq('id', clienteId)
      .single();

    if (!cliente) {
      return NextResponse.json({ detail: 'Cliente no encontrado' }, { status: 404 });
    }

    // Get META_TOKEN
    const { data: metaVar } = await supabase
      .from('variables_whatsapp')
      .select('valor')
      .eq('cliente_id', clienteId)
      .eq('variable', 'META_TOKEN')
      .single();

    const metaToken = metaVar?.valor || process.env.META_TOKEN || '';
    if (!metaToken) {
      return NextResponse.json({ detail: 'META_TOKEN no configurado' }, { status: 500 });
    }

    // Send text message via Meta API
    const url = `https://graph.facebook.com/v18.0/${cliente.phone_number_id}/messages`;
    const payload = {
      messaging_product: 'whatsapp',
      to: telefono,
      type: 'text',
      text: { body: mensaje.trim() },
    };

    const metaRes = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${metaToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const metaResponse = await metaRes.json();
    if (!metaRes.ok) {
      return NextResponse.json(metaResponse, { status: metaRes.status });
    }

    const wamid = metaResponse?.messages?.[0]?.id || null;
    const now = new Date().toISOString();

    // Save to mensajes_whatsapp
    await supabase.from('mensajes_whatsapp').insert({
      cliente_id: clienteId,
      from_number: cliente.display_number,
      to_number: telefono,
      direction: 'outbound',
      mensaje: mensaje.trim(),
      wamid,
      estado: 'sent',
      timestamp_wa: now,
      raw_payload: metaResponse,
    });

    // Update chat_whatsapp
    const { data: existingConv } = await supabase
      .from('chat_whatsapp')
      .select('id')
      .eq('cliente_id', clienteId)
      .eq('telefono', telefono)
      .maybeSingle();

    if (existingConv) {
      await supabase.from('chat_whatsapp').update({
        usuario_id: usuarioId,
        ultimo_mensaje: mensaje.trim(),
        ultima_fecha: now,
        no_leidos: 0,
        fecha_actualizacion: now,
      }).eq('id', existingConv.id);
    }

    // Increment requests_usadas
    await supabase.rpc('increment_requests_usadas', { p_cliente_id: clienteId });

    return NextResponse.json({ success: true, wamid });
  } catch (e: any) {
    console.error('RESPONDER ERROR:', e);
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}
