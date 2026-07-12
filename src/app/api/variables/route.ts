import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';
import { getClienteId } from '@/lib/auth-utils';

export async function GET(req: NextRequest) {
  const clienteId = getClienteId(req);
  if (!clienteId) {
    return NextResponse.json({ detail: 'Debe enviar el header X-Cliente-Id' }, { status: 401 });
  }

  try {
    const supabase = getServerSupabase();

    const { data, error } = await supabase
      .from('variables_whatsapp')
      .select('variable, valor')
      .eq('cliente_id', clienteId)
      .order('variable');

    if (error) throw error;

    const result: Record<string, string> = {};
    (data || []).forEach((row: any) => {
      result[row.variable] = row.valor;
    });

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}
