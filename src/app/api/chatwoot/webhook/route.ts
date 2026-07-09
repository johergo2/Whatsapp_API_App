import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const event = payload.event;

    // Only process agent replies
    if (event !== 'message_created' || payload.message_type !== 'outgoing') {
      return NextResponse.json({ status: 'ignored' });
    }

    const content = payload.content;
    const toNumber = payload.conversation?.meta?.sender?.phone_number?.replace('+', '') || '';
    const inboxId = String(payload.inbox?.id || '');
    const chatwootMessageId = payload.id;

    if (!toNumber || !inboxId || !content) {
      return NextResponse.json({ status: 'invalid_data' });
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );

    // Check for duplicates
    const { data: existing } = await supabase
      .from('mensajes_whatsapp')
      .select('id')
      .eq('id', chatwootMessageId)
      .single();

    if (existing) {
      return NextResponse.json({ status: 'already_processed' });
    }

    // Find client by inbox_id
    const { data: varData } = await supabase
      .from('variables_whatsapp')
      .select('cliente_id')
      .eq('variable', 'CHATWOOT_INBOX_ID')
      .eq('valor', inboxId)
      .single();

    if (!varData) {
      return NextResponse.json({ status: 'inbox_no_encontrado' });
    }

    const clienteId = varData.cliente_id;

    // Get client info
    const { data: cliente } = await supabase
      .from('clientes_whatsapp')
      .select('phone_number_id, display_number')
      .eq('id', clienteId)
      .single();

    if (!cliente) {
      return NextResponse.json({ status: 'cliente_no_encontrado' });
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
      return NextResponse.json({ status: 'meta_token_no_configurado' });
    }

    // Send to WhatsApp
    const url = `https://graph.facebook.com/v18.0/${cliente.phone_number_id}/messages`;
    const waPayload = {
      messaging_product: 'whatsapp',
      to: toNumber,
      type: 'text',
      text: { body: content },
    };

    const waRes = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${metaToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(waPayload),
    });

    const metaResponse = await waRes.json();

    if (waRes.ok) {
      const wamid = metaResponse?.messages?.[0]?.id || null;

      // Save outbound message
      await supabase.from('mensajes_whatsapp').insert({
        id: chatwootMessageId,
        cliente_id: clienteId,
        from_number: cliente.display_number,
        to_number: toNumber,
        direction: 'outbound',
        mensaje: content,
        wamid,
        estado: 'sent',
        timestamp_wa: new Date().toISOString(),
        raw_payload: metaResponse,
      });

      // Increment requests
      await supabase.rpc('increment_requests_usadas', { p_cliente_id: clienteId });
    }

    return NextResponse.json({ status: 'ok' });
  } catch (e: any) {
    console.error('CHATWOOT WEBHOOK ERROR:', e);
    return NextResponse.json({ status: 'error' });
  }
}
