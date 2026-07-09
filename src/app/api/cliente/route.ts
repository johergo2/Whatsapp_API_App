import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

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

    const apiKeyHash = hashApiKey(apiKey);

    const { data, error } = await supabase
      .from('clientes_whatsapp')
      .select('*')
      .eq('api_key', apiKeyHash)
      .single();

    if (error || !data) {
      return NextResponse.json({ detail: 'API Key inválida' }, { status: 401 });
    }

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}
