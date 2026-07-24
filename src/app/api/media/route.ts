import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const mediaId = req.nextUrl.searchParams.get('media_id');
    const clienteId = req.nextUrl.searchParams.get('cliente_id');

    if (!mediaId || !clienteId) {
      return new NextResponse('Faltan media_id o cliente_id', { status: 400 });
    }

    const supabase = getServerSupabase();

    const { data: metaVar } = await supabase
      .from('variables_whatsapp')
      .select('valor')
      .eq('cliente_id', parseInt(clienteId, 10))
      .eq('variable', 'META_TOKEN')
      .single();

    const metaToken = metaVar?.valor || process.env.META_TOKEN || '';
    if (!metaToken) {
      return new NextResponse('META_TOKEN no configurado', { status: 500 });
    }

    const authHeaders = { Authorization: `Bearer ${metaToken}` };

    const metaRes = await fetch(`https://graph.facebook.com/v18.0/${mediaId}`, {
      headers: authHeaders,
    });

    if (!metaRes.ok) {
      const err = await metaRes.text();
      console.error('META MEDIA INFO ERROR:', err);
      return new NextResponse('Error al obtener información del media', { status: 502 });
    }

    const mediaInfo = await metaRes.json();
    const downloadUrl = mediaInfo.url;
    const mimeType = mediaInfo.mime_type || 'application/octet-stream';

    if (!downloadUrl) {
      return new NextResponse('Meta no devolvió URL de descarga', { status: 502 });
    }

    const fileRes = await fetch(downloadUrl, { headers: authHeaders });
    if (!fileRes.ok) {
      console.error('META MEDIA DOWNLOAD ERROR:', fileRes.status);
      return new NextResponse('Error al descargar el archivo de Meta', { status: 502 });
    }

    const buffer = await fileRes.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (e: any) {
    console.error('MEDIA PROXY ERROR:', e);
    return new NextResponse(e.message, { status: 500 });
  }
}
