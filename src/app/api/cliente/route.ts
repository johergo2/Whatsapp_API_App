import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const clienteId = req.headers.get('X-Cliente-Id') || req.nextUrl.searchParams.get('cliente_id');
  if (!clienteId) {
    return NextResponse.json({ detail: 'Debe enviar el header X-Cliente-Id' }, { status: 401 });
  }

  try {
    const supabase = getServerSupabase();

    const { data, error } = await supabase
      .from('clientes_whatsapp')
      .select('*')
      .eq('id', parseInt(clienteId, 10))
      .single();

    if (error || !data) {
      return NextResponse.json({ detail: 'Cliente no encontrado' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}
