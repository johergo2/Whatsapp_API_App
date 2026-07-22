import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';
import { getUsuarioId } from '@/lib/auth-utils';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cliente_id, to, image_url, video_url, document_url, mensaje, caption, usuario_id: bodyUsuarioId } = body;

    if (!cliente_id || !to) {
      return NextResponse.json({ detail: 'cliente_id y to son obligatorios' }, { status: 400 });
    }

    if (!mensaje && !image_url && !video_url && !document_url) {
      return NextResponse.json({ detail: 'Debe enviar mensaje, image_url, video_url o document_url' }, { status: 400 });
    }

    const supabase = getServerSupabase();

    // 1. Get client info
    const { data: cliente, error: cliErr } = await supabase
      .from('clientes_whatsapp')
      .select('phone_number_id, display_number')
      .eq('id', cliente_id)
      .single();

    if (cliErr || !cliente) {
      return NextResponse.json({ detail: 'Cliente no encontrado' }, { status: 404 });
    }

    const phoneNumberId = cliente.phone_number_id;
    const displayNumber = cliente.display_number;

    // 2. Get META_TOKEN
    const { data: metaVar } = await supabase
      .from('variables_whatsapp')
      .select('valor')
      .eq('cliente_id', cliente_id)
      .eq('variable', 'META_TOKEN')
      .single();

    const metaToken = metaVar?.valor || process.env.META_TOKEN || '';
    if (!metaToken) {
      return NextResponse.json({ detail: 'META_TOKEN no configurado' }, { status: 500 });
    }

    const supabasePublicUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/\/$/, '');

    const normalizeUrl = (url: string) => {
      let u = url.trim();
      if (!u.startsWith('http://') && !u.startsWith('https://')) {
        return `${supabasePublicUrl}/storage/v1/object/public/documentos/${encodeURIComponent(u)}`;
      }
      return u;
    };

    // 3. Build payload
    let payload: any = { messaging_product: 'whatsapp', to };
    let mensajeGuardar = '';

    if (document_url && String(document_url).trim() !== '') {
      const link = normalizeUrl(String(document_url));
      const filename = String(document_url).trim().split('/').pop() || 'documento';
      payload.type = 'document';
      payload.document = { link, filename };
      if (caption) payload.document.caption = caption;
      mensajeGuardar = `document: ${link}`;
    } else if (video_url && String(video_url).trim() !== '') {
      const link = normalizeUrl(String(video_url));
      payload.type = 'video';
      payload.video = { link };
      if (caption) payload.video.caption = caption;
      mensajeGuardar = `video: ${link}`;
    } else if (image_url && String(image_url).trim() !== '') {
      const link = normalizeUrl(String(image_url));
      payload.type = 'image';
      payload.image = { link };
      if (caption) payload.image.caption = caption;
      mensajeGuardar = `image: ${link}`;
    } else {
      payload.type = 'text';
      payload.text = { body: mensaje };
      mensajeGuardar = mensaje;
    }

    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${metaToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const metaResponse = await res.json();

    if (!res.ok) {
      return NextResponse.json(metaResponse, { status: res.status });
    }

    // 4. Save to mensajes_whatsapp
    const wamid = metaResponse?.messages?.[0]?.id || null;
    const now = new Date().toISOString();
    await supabase.from('mensajes_whatsapp').insert({
      cliente_id,
      from_number: displayNumber,
      to_number: to,
      direction: 'outbound',
      mensaje: mensajeGuardar,
      wamid,
      estado: 'sent',
      timestamp_wa: now,
      raw_payload: metaResponse,
    });

    // 5. Upsert chat_whatsapp
    const usuarioId = bodyUsuarioId || getUsuarioId(req);
    const { data: existingChat } = await supabase
      .from('chat_whatsapp')
      .select('id')
      .eq('cliente_id', cliente_id)
      .eq('telefono', to)
      .maybeSingle();

    if (existingChat) {
      await supabase.from('chat_whatsapp').update({
        usuario_id: usuarioId || undefined,
        ultimo_mensaje: mensajeGuardar,
        ultima_fecha: now,
        fecha_actualizacion: now,
      }).eq('id', existingChat.id);
    } else {
      await supabase.from('chat_whatsapp').insert({
        cliente_id,
        telefono: to,
        nombre: to,
        usuario_id: usuarioId || undefined,
        usuario_creador_id: usuarioId || undefined,
        ultimo_mensaje: mensajeGuardar,
        ultima_fecha: now,
        no_leidos: 0,
        estado: 'activa',
      });
    }

    // 6. Limpiar archivo temporal de Storage
    const urlToClean = image_url || video_url || document_url || '';
    if (urlToClean && urlToClean.includes('/storage/v1/object/public/chat_uploads/')) {
      const filePath = urlToClean.split('/public/chat_uploads/')[1];
      if (filePath) {
        await supabase.storage.from('chat_uploads').remove([filePath]);
      }
    }

    // 7. Increment requests_usadas
    await supabase.rpc('increment_requests_usadas', { p_cliente_id: cliente_id });

    return NextResponse.json(metaResponse);
  } catch (e: any) {
    console.error('SEND MEDIA ERROR:', e);
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}
