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
    .from('mensajes_whatsapp')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('fecha_creacion', { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}
