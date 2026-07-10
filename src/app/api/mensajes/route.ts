import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServerSupabase } from '@/lib/supabase';

function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

async function validateClient(req: NextRequest) {
  const apiKey = req.headers.get('X-API-Key');
  if (!apiKey) return null;

  const supabase = getServerSupabase();
  const { data } = await supabase
    .from('clientes_whatsapp')
    .select('id')
    .eq('api_key', hashApiKey(apiKey))
    .single();

  return data?.id || null;
}

export async function GET(req: NextRequest) {
  const clienteId = await validateClient(req);
  if (!clienteId) {
    return NextResponse.json({ detail: 'API Key inválida' }, { status: 401 });
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
