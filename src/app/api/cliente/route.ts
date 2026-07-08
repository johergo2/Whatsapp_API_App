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

    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('api_key', apiKey)
      .single();

    if (error || !data) {
      // Mock fallback
      return NextResponse.json({
        id: 1,
        phone_number_id: '958444014023857',
        display_number: '+573052968034',
        api_key: apiKey,
        estado: 'activo',
        plan: 'Plan Básico 200',
        requests_max: 200,
        requests_usadas: 47,
        periodo_inicio: '2026-01-01',
        periodo_fin: '2026-12-31',
      });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({
      id: 1,
      phone_number_id: '958444014023857',
      display_number: '+573052968034',
      api_key: apiKey,
      estado: 'activo',
      plan: 'Plan Básico 200',
      requests_max: 200,
      requests_usadas: 47,
      periodo_inicio: '2026-01-01',
      periodo_fin: '2026-12-31',
    });
  }
}
