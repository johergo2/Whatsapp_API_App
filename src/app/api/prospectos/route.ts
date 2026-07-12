import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';
import { getClienteId } from '@/lib/auth-utils';

export async function GET(req: NextRequest) {
  const clienteId = getClienteId(req);
  if (!clienteId) {
    return NextResponse.json({ detail: 'Debe enviar el header X-Cliente-Id' }, { status: 401 });
  }

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('prospectos')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
  const clienteId = getClienteId(req);
  if (!clienteId) {
    return NextResponse.json({ detail: 'Debe enviar el header X-Cliente-Id' }, { status: 401 });
  }

  const body = await req.json();
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('prospectos')
    .insert({
      cliente_id: clienteId,
      nombre: body.nombre,
      telefono: body.telefono,
      adjunto_cabecera: body.adjunto_cabecera || null,
      footer_imgs: body.footer_imgs || [],
      captions: body.captions || [],
      estado: body.estado || '',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const clienteId = getClienteId(req);
  if (!clienteId) {
    return NextResponse.json({ detail: 'Debe enviar el header X-Cliente-Id' }, { status: 401 });
  }

  const body = await req.json();
  if (!body.id) {
    return NextResponse.json({ detail: 'id es obligatorio' }, { status: 400 });
  }

  const supabase = getServerSupabase();
  const { error } = await supabase
    .from('prospectos')
    .update({
      nombre: body.nombre,
      telefono: body.telefono,
      adjunto_cabecera: body.adjunto_cabecera || null,
      footer_imgs: body.footer_imgs || [],
      captions: body.captions || [],
      estado: body.estado || '',
    })
    .eq('id', body.id)
    .eq('cliente_id', clienteId);

  if (error) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const clienteId = getClienteId(req);
  if (!clienteId) {
    return NextResponse.json({ detail: 'Debe enviar el header X-Cliente-Id' }, { status: 401 });
  }

  const supabase = getServerSupabase();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (id) {
    const { error } = await supabase
      .from('prospectos')
      .delete()
      .eq('id', id)
      .eq('cliente_id', clienteId);

    if (error) {
      return NextResponse.json({ detail: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  const { error } = await supabase
    .from('prospectos')
    .delete()
    .eq('cliente_id', clienteId);

  if (error) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
