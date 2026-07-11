import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      cliente_id, to, template_name, language_code,
      nombre_clie, nomb_mio, header_image_url, header_document_url, header_video_url,
      ...texts
    } = body;

    if (!cliente_id || !to || !template_name) {
      return NextResponse.json({ detail: 'cliente_id, to y template_name son obligatorios' }, { status: 400 });
    }

    const supabase = getServerSupabase();

    // 1. Get client phone_number_id
    const { data: cliente, error: cliErr } = await supabase
      .from('clientes_whatsapp')
      .select('phone_number_id, display_number')
      .eq('id', cliente_id)
      .single();

    if (cliErr || !cliente) {
      return NextResponse.json({ detail: 'Cliente no encontrado' }, { status: 404 });
    }

    const phoneNumberId = cliente.phone_number_id;
    const fromNumber = cliente.display_number;

    // 2. Get META_TOKEN from variables
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

    // 3. Build template components
    const bodyParams: any[] = [
      { type: 'text', parameter_name: 'nombre_clie', text: nombre_clie },
      { type: 'text', parameter_name: 'nomb_mio', text: nomb_mio },
    ];

    for (let i = 1; i <= 6; i++) {
      const val = texts[`texto${i}`];
      if (val && String(val).trim() !== '') {
        bodyParams.push({ type: 'text', parameter_name: `texto${i}`, text: String(val) });
      }
    }

    const components: any[] = [];

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${process.env.VERCEL_URL || 'whatsapp-api-app-silk.vercel.app'}`;

    const normalizeUrl = (url: string) => {
      let u = url.trim();
      if (!u.startsWith('http://') && !u.startsWith('https://')) {
        return `${appUrl}/api/documento?archivo=${encodeURIComponent(u)}`;
      }
      return u;
    };

    if (header_video_url && String(header_video_url).trim() !== '') {
      const link = normalizeUrl(String(header_video_url));
      components.push({ type: 'header', parameters: [{ type: 'video', video: { link } }] });
    } else if (header_image_url && String(header_image_url).trim() !== '') {
      const link = normalizeUrl(String(header_image_url));
      components.push({ type: 'header', parameters: [{ type: 'image', image: { link } }] });
    } else if (header_document_url && String(header_document_url).trim() !== '') {
      const link = normalizeUrl(String(header_document_url));
      components.push({ type: 'header', parameters: [{ type: 'document', document: { link, filename: `Cuenta_cobro_${to}.pdf` } }] });
    }

    components.push({ type: 'body', parameters: bodyParams });

    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: template_name,
        language: { code: language_code || 'es_CO' },
        components,
      },
    };

    // 4. Send to Meta
    console.log('[send-message] payload:', JSON.stringify(payload, null, 2));
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

    // 5. Save to mensajes_whatsapp
    const wamid = metaResponse?.messages?.[0]?.id || null;
    const insertPayload = {
      cliente_id,
      from_number: fromNumber,
      to_number: to,
      direction: 'outbound' as const,
      mensaje: `template: ${template_name}`,
      wamid,
      estado: 'sent',
      timestamp_wa: new Date().toISOString(),
      raw_payload: metaResponse,
    };

    await supabase.from('mensajes_whatsapp').insert(insertPayload);

    // 6. Increment requests_usadas
    await supabase.rpc('increment_requests_usadas', { p_cliente_id: cliente_id });

    return NextResponse.json(metaResponse);
  } catch (e: any) {
    console.error('SEND ERROR:', e);
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}
