import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

function getVerifyToken(): string {
  return process.env.VERIFY_TOKEN || 'johergo21970090516780919';
}

async function getDb() {
  return getServerSupabase();
}

// GET: Meta webhook verification
export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const hubMode = params['hub.mode'];
  const hubVerifyToken = params['hub.verify_token'];
  const hubChallenge = params['hub.challenge'];

  if (hubMode === 'subscribe' && hubVerifyToken === getVerifyToken()) {
    return new NextResponse(hubChallenge, { status: 200 });
  }
  return new NextResponse('Error de verificación', { status: 403 });
}

// POST: Receive webhook events from Meta
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const supabase = await getDb();

    const entry = payload?.entry?.[0];
    const change = entry?.changes?.[0]?.value;

    if (!change) {
      return NextResponse.json({ status: 'ignored' });
    }

    const metadata = change.metadata;
    const phoneNumberId = metadata?.phone_number_id;

    // ─── 1. STATUS UPDATES ─────────────────────────────
    if (change.statuses) {
      for (const statusData of change.statuses) {
        const wamid = statusData.id;
        const estado = statusData.status;

        const errorCode = statusData.errors?.[0]?.code ? String(statusData.errors[0].code) : null;
        const errorDetail = statusData.errors?.[0]?.error_data?.details || statusData.errors?.[0]?.message || null;
        const timestampWa = statusData.timestamp
          ? new Date(parseInt(statusData.timestamp) * 1000).toISOString()
          : null;

        // Update mensajes_whatsapp.estado
        await supabase
          .from('mensajes_whatsapp')
          .update({ estado })
          .eq('wamid', wamid);

        // Get mensaje_id for estado_mensajes_whatsapp
        const { data: msg } = await supabase
          .from('mensajes_whatsapp')
          .select('id')
          .eq('wamid', wamid)
          .single();

        if (msg) {
          await supabase.from('estado_mensajes_whatsapp').insert({
            mensaje_id: msg.id,
            wamid,
            estado,
            error_code: errorCode,
            error_detail: errorDetail,
            timestamp_wa: timestampWa,
            raw_payload: payload,
          });
        }
      }
      return NextResponse.json({ status: 'status updated' });
    }

    // ─── 2. INBOUND MESSAGES ────────────────────────────
    if (change.messages) {
      const chatwootBaseUrl = process.env.CHATWOOT_BASE_URL || 'https://app.chatwoot.com';
      const chatwootApiToken = process.env.CHATWOOT_API_TOKEN || '';

      for (const message of change.messages) {
        const fromNumber = message.from;
        const wamid = message.id;
        const timestampWa = message.timestamp
          ? new Date(parseInt(message.timestamp) * 1000).toISOString()
          : null;

        let mensajeText: string | null = null;
        if (message.text?.body) mensajeText = message.text.body;
        else if (message.button?.text) mensajeText = message.button.text;
        else if (message.interactive) mensajeText = JSON.stringify(message.interactive);
        else if (message.image) mensajeText = '[imagen recibida]';
        else if (message.document) mensajeText = '[documento recibido]';
        else mensajeText = '[mensaje no soportado]';

        // Find client by phone_number_id
        const { data: clientes } = await supabase
          .from('clientes_whatsapp')
          .select('id, display_number')
          .eq('phone_number_id', phoneNumberId);

        if (!clientes || clientes.length === 0) {
          console.log('CLIENTE NO CONFIGURADO para phone_number_id:', phoneNumberId);
          continue;
        }

        const cliente = clientes[0];
        const clienteId = cliente.id;
        const displayNumber = cliente.display_number;

        // Get Chatwoot config from variables_whatsapp
        const { data: vars } = await supabase
          .from('variables_whatsapp')
          .select('variable, valor')
          .in('variable', ['CHATWOOT_ACCOUNT_ID', 'CHATWOOT_INBOX_ID'])
          .eq('cliente_id', clienteId);

        const varMap: Record<string, string> = {};
        (vars || []).forEach((v: any) => { varMap[v.variable] = v.valor; });

        const chatwootAccountId = varMap['CHATWOOT_ACCOUNT_ID'];
        const inboxId = varMap['CHATWOOT_INBOX_ID'];

        // Save inbound message
        await supabase.from('mensajes_whatsapp').insert({
          cliente_id: clienteId,
          from_number: fromNumber,
          to_number: displayNumber,
          direction: 'inbound',
          mensaje: mensajeText,
          wamid,
          timestamp_wa: timestampWa,
          raw_payload: payload,
        });

        // Sync to Chatwoot if configured
        if (chatwootAccountId && inboxId && chatwootApiToken) {
          try {
            const telefono = fromNumber.replace('+', '');
            const contactId = await obtenerOCrearContacto(
              supabase, clienteId, telefono,
              parseInt(chatwootAccountId), chatwootBaseUrl, chatwootApiToken
            );
            const conversationId = await obtenerOCrearConversacion(
              supabase, clienteId, telefono, contactId,
              parseInt(inboxId), chatwootAccountId, chatwootBaseUrl, chatwootApiToken
            );
            await enviarMensajeChatwoot(
              conversationId, mensajeText || '',
              parseInt(chatwootAccountId), chatwootBaseUrl, chatwootApiToken
            );
          } catch (chatErr) {
            console.error('CHATWOOT SYNC ERROR:', chatErr);
          }
        }
      }
      return NextResponse.json({ status: 'message stored' });
    }

    return NextResponse.json({ status: 'ignored' });
  } catch (e: any) {
    console.error('WEBHOOK ERROR:', e);
    return NextResponse.json({ status: 'error' });
  }
}

// ─── Helper: Chatwoot Contact ────────────────────────────────

async function obtenerOCrearContacto(
  supabase: any, clienteId: number, telefono: string,
  accountId: number, chatwootBaseUrl: string, chatwootApiToken: string
): Promise<number> {
  // Search in DB
  const { data: existing } = await supabase
    .from('contactos_whatsapp')
    .select('*')
    .eq('cliente_id', clienteId)
    .eq('telefono', telefono)
    .single();

  if (existing?.chatwoot_contact_id) return existing.chatwoot_contact_id;

  // Create in Chatwoot
  const headers = {
    'api_access_token': chatwootApiToken,
    'Content-Type': 'application/json',
  };

  let chatwootContactId: number | null = null;

  // Try create
  const createRes = await fetch(
    `${chatwootBaseUrl}/api/v1/accounts/${accountId}/contacts`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: telefono,
        phone_number: `+${telefono}`,
        identifier: `${clienteId}_${telefono}`,
      }),
    }
  );

  if (createRes.ok) {
    const createData = await createRes.json();
    chatwootContactId = createData?.payload?.contact?.id;
  } else if (createRes.status === 422) {
    // Already exists, search
    const searchRes = await fetch(
      `${chatwootBaseUrl}/api/v1/accounts/${accountId}/contacts/search?q=${telefono}`,
      { headers }
    );
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      chatwootContactId = searchData?.payload?.[0]?.id;
    }
  }

  if (!chatwootContactId) throw new Error('No se pudo crear/encontrar contacto en Chatwoot');

  // Save to DB
  if (existing) {
    await supabase
      .from('contactos_whatsapp')
      .update({ chatwoot_contact_id: chatwootContactId })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('contactos_whatsapp')
      .insert({
        cliente_id: clienteId,
        telefono,
        chatwoot_contact_id: chatwootContactId,
      });
  }

  return chatwootContactId;
}

// ─── Helper: Chatwoot Conversation ───────────────────────────

async function obtenerOCrearConversacion(
  supabase: any, clienteId: number, telefono: string,
  contactId: number, inboxId: number,
  accountIdStr: string, chatwootBaseUrl: string, chatwootApiToken: string
): Promise<number> {
  // Check DB
  const { data: existing } = await supabase
    .from('contactos_whatsapp')
    .select('chatwoot_conversation_id')
    .eq('cliente_id', clienteId)
    .eq('telefono', telefono)
    .single();

  if (existing?.chatwoot_conversation_id) return existing.chatwoot_conversation_id;

  // Create in Chatwoot
  const headers = {
    'api_access_token': chatwootApiToken,
    'Content-Type': 'application/json',
  };

  const convRes = await fetch(
    `${chatwootBaseUrl}/api/v1/accounts/${accountIdStr}/conversations`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        source_id: telefono,
        inbox_id: inboxId,
        contact_id: contactId,
        status: 'open',
      }),
    }
  );

  if (!convRes.ok) throw new Error('Error creando conversación en Chatwoot');
  const convData = await convRes.json();
  const conversationId = convData.id;

  // Save to DB
  await supabase
    .from('contactos_whatsapp')
    .update({ chatwoot_conversation_id: conversationId })
    .eq('cliente_id', clienteId)
    .eq('telefono', telefono);

  return conversationId;
}

// ─── Helper: Send message to Chatwoot ────────────────────────

async function enviarMensajeChatwoot(
  conversationId: number, mensaje: string,
  accountId: number, chatwootBaseUrl: string, chatwootApiToken: string
): Promise<void> {
  const headers = {
    'api_access_token': chatwootApiToken,
    'Content-Type': 'application/json',
  };

  await fetch(
    `${chatwootBaseUrl}/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        content: mensaje,
        message_type: 'incoming',
      }),
    }
  );
}
