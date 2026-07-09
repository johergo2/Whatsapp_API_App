import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServerSupabase } from '@/lib/supabase';

function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

export async function GET(req: NextRequest) {
  const apiKey = req.headers.get('X-API-Key');
  if (!apiKey) {
    return NextResponse.json({ detail: 'Debe enviar el header X-API-Key' }, { status: 401 });
  }

  try {
    const supabase = getServerSupabase();

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
