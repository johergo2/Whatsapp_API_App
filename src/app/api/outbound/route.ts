import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    const supabase = getServerSupabase();

    await supabase.from('mensajes_whatsapp').insert({
      cliente_id: data.cliente_id,
      from_number: data.from_number || '',
      to_number: data.to_number,
      direction: 'outbound',
      mensaje: data.mensaje || '',
      wamid: data.wamid || null,
      estado: 'sent',
      timestamp_wa: new Date().toISOString(),
      raw_payload: data.raw_payload || {},
    });

    return NextResponse.json({ status: 'outbound stored' });
  } catch (e: any) {
    console.error('OUTBOUND ERROR:', e);
    return NextResponse.json({ status: 'error', detail: e.message }, { status: 500 });
  }
}
