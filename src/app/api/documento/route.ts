import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const archivo = req.nextUrl.searchParams.get('archivo');
    if (!archivo) {
      return NextResponse.json({ error: 'Falta el parámetro archivo' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
    if (!supabaseUrl) {
      return NextResponse.json({ error: 'SUPABASE_URL no configurado' }, { status: 500 });
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/documentos/${encodeURIComponent(archivo)}`;
    const res = await fetch(publicUrl);

    if (!res.ok) {
      console.error('[documento] Error fetching:', res.status, res.statusText);
      return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 });
    }

    const arrayBuffer = await res.arrayBuffer();
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
