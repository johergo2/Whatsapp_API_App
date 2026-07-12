import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServerSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { nombre, password } = await req.json();
    if (!nombre || !password) {
      return NextResponse.json({ detail: 'Nombre de usuario y contraseña requeridos' }, { status: 400 });
    }

    const supabase = getServerSupabase();
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

    const { data: user } = await supabase
      .from('usuarios')
      .select('*')
      .eq('nombre', nombre)
      .single();

    if (!user || user.password_hash !== passwordHash) {
      return NextResponse.json({ detail: 'Usuario o contraseña inválidos' }, { status: 401 });
    }

    if (!user.activo) {
      return NextResponse.json({ detail: 'Usuario desactivado' }, { status: 403 });
    }

    const { data: rels } = await supabase
      .from('usuarios_clientes')
      .select('cliente_id')
      .eq('usuario_id', user.id);

    const clienteIds = (rels || []).map(r => r.cliente_id);
    if (clienteIds.length === 0) {
      return NextResponse.json({ detail: 'Usuario sin clientes asignados' }, { status: 403 });
    }

    return NextResponse.json({
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      activo: user.activo,
      cliente_id: clienteIds[0],
    });
  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}
