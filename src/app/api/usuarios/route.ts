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
    .from('usuarios_clientes')
    .select('usuario_id, usuarios!inner(id, nombre, email, rol)')
    .eq('cliente_id', clienteId);

  if (error) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }

  const usuarios = (data || []).map((r: any) => r.usuarios).filter(Boolean);
  return NextResponse.json(usuarios);
}
