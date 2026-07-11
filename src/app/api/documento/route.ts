import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const archivo = req.nextUrl.searchParams.get('archivo');
    if (!archivo) {
      return NextResponse.json({ error: 'Falta el parámetro archivo' }, { status: 400 });
    }

    const supabase = getServerSupabase();
    const { data, error } = await supabase.storage
      .from('documentos')
      .download(archivo);

    if (error || !data) {
      console.error('[documento] Error downloading:', error?.message || 'No data');
      return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 });
    }

    const arrayBuffer = await data.arrayBuffer();
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${archivo}"`,
        'Content-Length': String(arrayBuffer.byteLength),
      },
    });
  } catch (e: any) {
    console.error('[documento] Error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
