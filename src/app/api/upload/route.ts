import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';
import { getClienteId, getUsuarioId } from '@/lib/auth-utils';

export async function POST(req: NextRequest) {
  try {
    const clienteId = getClienteId(req);
    if (!clienteId) {
      return NextResponse.json({ detail: 'Debe enviar el header X-Cliente-Id' }, { status: 401 });
    }
    const usuarioId = getUsuarioId(req);
    if (!usuarioId) {
      return NextResponse.json({ detail: 'Debe enviar el header X-Usuario-Id' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ detail: 'Debe enviar un archivo' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${clienteId}/${usuarioId}/${Date.now()}.${ext}`;

    const supabase = getServerSupabase();
    const { data, error } = await supabase.storage
      .from('chat_uploads')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      return NextResponse.json({ detail: error.message }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage
      .from('chat_uploads')
      .getPublicUrl(fileName);

    return NextResponse.json({ url: publicUrlData.publicUrl });
  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}
