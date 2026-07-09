import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cliente_id, to, image_url, video_url, mensaje, caption } = body;

    if (!cliente_id || !to) {
      return NextResponse.json({ detail: 'cliente_id y to son obligatorios' }, { status: 400 });
    }

    if (!mensaje && !image_url && !video_url) {
      return NextResponse.json({ detail: 'Debe enviar mensaje, image_url o video_url' }, { status: 400 });
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );

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

    // 3. Build payload
    let payload: any = { messaging_product: 'whatsapp', to };
    let mensajeGuardar = '';

    if (video_url && String(video_url).trim() !== '') {
      payload.type = 'video';
      payload.video = { link: video_url };
      if (caption) payload.video.caption = caption;
      mensajeGuardar = `video: ${video_url}`;
    } else if (image_url && String(image_url).trim() !== '') {
      payload.type = 'image';
      payload.image = { link: image_url };
      if (caption) payload.image.caption = caption;
      mensajeGuardar = `image: ${image_url}`;
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
    await supabase.from('mensajes_whatsapp').insert({
      cliente_id,
      from_number: displayNumber,
      to_number: to,
      direction: 'outbound',
      mensaje: mensajeGuardar,
      wamid,
      estado: 'sent',
      timestamp_wa: new Date().toISOString(),
      raw_payload: metaResponse,
    });

    // 5. Increment requests_usadas
    await supabase.rpc('increment_requests_usadas', { p_cliente_id: cliente_id });

    return NextResponse.json(metaResponse);
  } catch (e: any) {
    console.error('SEND MEDIA ERROR:', e);
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}
