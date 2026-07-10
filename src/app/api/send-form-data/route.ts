import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServerSupabase } from '@/lib/supabase';

function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

async function validateClient(req: NextRequest) {
  const apiKey = req.headers.get('X-API-Key');
  if (!apiKey) return null;

  const supabase = getServerSupabase();
  const { data } = await supabase
    .from('clientes_whatsapp')
    .select('id')
    .eq('api_key', hashApiKey(apiKey))
    .single();

  return data?.id || null;
}

export async function GET(req: NextRequest) {
  const clienteId = await validateClient(req);
  if (!clienteId) {
    return NextResponse.json({ detail: 'API Key inválida' }, { status: 401 });
  }

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('send_form_data')
    .select('*')
    .eq('cliente_id', clienteId);

  if (error) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
  const clienteId = await validateClient(req);
  if (!clienteId) {
    return NextResponse.json({ detail: 'API Key inválida' }, { status: 401 });
  }

  const body = await req.json();
  if (!body.plantilla_id) {
    return NextResponse.json({ detail: 'plantilla_id es obligatorio' }, { status: 400 });
  }

  const supabase = getServerSupabase();
  const { error } = await supabase
    .from('send_form_data')
    .upsert(
      {
        cliente_id: clienteId,
        plantilla_id: parseInt(body.plantilla_id, 10),
        values_json: body.values || {},
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'cliente_id, plantilla_id', ignoreDuplicates: false }
    );

  if (error) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
