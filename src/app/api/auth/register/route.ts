import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServerSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { nombre, email, password, api_key } = await req.json();
    if (!nombre || !password || !api_key) {
      return NextResponse.json({ detail: 'Nombre, contraseña y API Key son requeridos' }, { status: 400 });
    }

    const supabase = getServerSupabase();

    const apiKeyHash = crypto.createHash('sha256').update(api_key).digest('hex');

    const { data: cliente } = await supabase
      .from('clientes_whatsapp')
      .select('id')
      .eq('api_key', apiKeyHash)
      .single();

    if (!cliente) {
      return NextResponse.json({ detail: 'API Key inválida' }, { status: 401 });
    }

    const { data: existing } = await supabase
      .from('usuarios')
      .select('id')
      .eq('nombre', nombre)
      .single();

    if (existing) {
      return NextResponse.json({ detail: 'El nombre de usuario ya existe' }, { status: 409 });
    }

    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

    const { data: user, error: insertErr } = await supabase
      .from('usuarios')
      .insert({
        nombre,
        email: email || null,
        password_hash: passwordHash,
        rol: 'usuario',
      })
      .select()
      .single();

    if (insertErr || !user) {
      return NextResponse.json({ detail: 'Error al crear usuario' }, { status: 500 });
    }

    await supabase.from('usuarios_clientes').insert({
      usuario_id: user.id,
      cliente_id: cliente.id,
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}
