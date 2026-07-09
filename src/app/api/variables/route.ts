import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const apiKey = req.headers.get('X-API-Key');
  if (!apiKey) {
    return NextResponse.json({ detail: 'Debe enviar el header X-API-Key' }, { status: 401 });
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );

    // Get client by API key
    const crypto = await import('crypto');
    const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    const { data: clientData, error: clientError } = await supabase
      .from('clientes_whatsapp')
      .select('id')
      .eq('api_key', apiKeyHash)
      .single();

    if (clientError || !clientData) {
      return NextResponse.json({ detail: 'API Key inválida' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('variables_whatsapp')
      .select('variable, valor')
      .eq('cliente_id', clientData.id)
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
