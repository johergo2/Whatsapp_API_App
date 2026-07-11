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
    .from('plantillas')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('created_at', { ascending: false });

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
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('plantillas')
    .insert({
      cliente_id: clienteId,
      name: body.name,
      template_name: body.template_name,
      language_code: body.language_code || 'es_CO',
      num_textos: body.num_textos || 4,
      header_type: body.header_type || 'none',
      num_footer: body.num_footer || 0,
      footer_captions: body.footer_captions || [],
      message_example: body.message_example || '',
      descripcion: body.descripcion || '',
      nomb_mio: body.nomb_mio || '',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const clienteId = await validateClient(req);
  if (!clienteId) {
    return NextResponse.json({ detail: 'API Key inválida' }, { status: 401 });
  }

  const body = await req.json();
  if (!body.id) {
    return NextResponse.json({ detail: 'id es obligatorio' }, { status: 400 });
  }

  const supabase = getServerSupabase();
  const { error } = await supabase
    .from('plantillas')
    .update({
      name: body.name,
      template_name: body.template_name,
      language_code: body.language_code,
      num_textos: body.num_textos,
      header_type: body.header_type,
      num_footer: body.num_footer,
      footer_captions: body.footer_captions,
      message_example: body.message_example,
      descripcion: body.descripcion,
      nomb_mio: body.nomb_mio,
    })
    .eq('id', parseInt(body.id, 10) || body.id)
    .eq('cliente_id', clienteId);

  if (error) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const clienteId = await validateClient(req);
  if (!clienteId) {
    return NextResponse.json({ detail: 'API Key inválida' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ detail: 'id es obligatorio' }, { status: 400 });
  }

  const supabase = getServerSupabase();
  const { error } = await supabase
    .from('plantillas')
    .delete()
    .eq('id', parseInt(id, 10))
    .eq('cliente_id', clienteId);

  if (error) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
