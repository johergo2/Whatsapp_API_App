import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';
import { getClienteId, getUsuarioId } from '@/lib/auth-utils';

export async function GET(req: NextRequest) {
  const clienteId = getClienteId(req);
  if (!clienteId) {
    return NextResponse.json({ detail: 'Debe enviar el header X-Cliente-Id' }, { status: 401 });
  }
  const usuarioId = getUsuarioId(req);
  if (!usuarioId) {
    return NextResponse.json({ detail: 'Debe enviar el header X-Usuario-Id' }, { status: 401 });
  }
  const supabase = getServerSupabase();
  const { searchParams } = new URL(req.url);
  const plantillaId = searchParams.get('plantilla_id');
  const search = searchParams.get('search');

  let query = supabase
    .from('prospectos')
    .select('*')
    .eq('cliente_id', clienteId)
    .eq('usuario_id', usuarioId);

  if (plantillaId) {
    query = query.eq('plantilla_id', parseInt(plantillaId, 10));
  }

  if (search && search.trim()) {
    const s = `%${search.trim()}%`;
    query = query.or(`nombre.ilike.${s},telefono.ilike.${s}`);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
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
  const usuarioId = getUsuarioId(req);
  if (!usuarioId) {
    return NextResponse.json({ detail: 'Debe enviar el header X-Usuario-Id' }, { status: 401 });
  }
  const body = await req.json();
  const supabase = getServerSupabase();
  if (Array.isArray(body)) {
    const prospects = body.map((p) => ({
      cliente_id: clienteId,
      usuario_id: usuarioId,
      plantilla_id: p.plantilla_id ?? null,
      nombre: p.nombre,
      telefono: p.telefono,
      adjunto_cabecera: p.adjunto_cabecera ?? null,
      footer_imgs: p.footer_imgs ?? [],
      captions: p.captions ?? [],
      estado: p.estado ?? '',
      texto1: p.texto1 ?? null,
      texto2: p.texto2 ?? null,
      texto3: p.texto3 ?? null,
      texto4: p.texto4 ?? null,
      texto5: p.texto5 ?? null,
      texto6: p.texto6 ?? null,
    }));
    const { data, error } = await supabase.from('prospectos').insert(prospects).select();
    if (error) {
      return NextResponse.json({ detail: error.message }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  }
  const { data, error } = await supabase
    .from('prospectos')
    .insert({
      cliente_id: clienteId,
      usuario_id: usuarioId,
      plantilla_id: body.plantilla_id ?? null,
      nombre: body.nombre,
      telefono: body.telefono,
      adjunto_cabecera: body.adjunto_cabecera ?? null,
      footer_imgs: body.footer_imgs ?? [],
      captions: body.captions ?? [],
      estado: body.estado ?? '',
      texto1: body.texto1 ?? null,
      texto2: body.texto2 ?? null,
      texto3: body.texto3 ?? null,
      texto4: body.texto4 ?? null,
      texto5: body.texto5 ?? null,
      texto6: body.texto6 ?? null,
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
  const usuarioId = getUsuarioId(req);
  if (!usuarioId) {
    return NextResponse.json({ detail: 'Debe enviar el header X-Usuario-Id' }, { status: 401 });
  }
  const body = await req.json();
  if (!body.id) {
    return NextResponse.json({ detail: 'id es obligatorio' }, { status: 400 });
  }
  const supabase = getServerSupabase();
  const updates: Record<string, any> = {
    nombre: body.nombre,
    telefono: body.telefono,
    adjunto_cabecera: body.adjunto_cabecera ?? null,
    footer_imgs: body.footer_imgs ?? [],
    captions: body.captions ?? [],
    estado: body.estado ?? '',
    texto1: body.texto1 ?? null,
    texto2: body.texto2 ?? null,
    texto3: body.texto3 ?? null,
    texto4: body.texto4 ?? null,
    texto5: body.texto5 ?? null,
    texto6: body.texto6 ?? null,
  };
  const { error } = await supabase
    .from('prospectos')
    .update(updates)
    .eq('id', body.id)
    .eq('cliente_id', clienteId)
    .eq('usuario_id', usuarioId);
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
  const usuarioId = getUsuarioId(req);
  if (!usuarioId) {
    return NextResponse.json({ detail: 'Debe enviar el header X-Usuario-Id' }, { status: 401 });
  }
  const supabase = getServerSupabase();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (id) {
    const { error } = await supabase
      .from('prospectos')
      .delete()
      .eq('id', id)
      .eq('cliente_id', clienteId)
      .eq('usuario_id', usuarioId);
    if (error) {
      return NextResponse.json({ detail: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }
  const plantillaId = searchParams.get('plantilla_id');
  let delQuery = supabase
    .from('prospectos')
    .delete()
    .eq('cliente_id', clienteId)
    .eq('usuario_id', usuarioId);
  if (plantillaId) {
    delQuery = delQuery.eq('plantilla_id', parseInt(plantillaId, 10));
  }
  const { error } = await delQuery;
  if (error) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}