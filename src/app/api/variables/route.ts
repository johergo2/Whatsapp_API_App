import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const apiKey = req.headers.get('X-API-Key');
  if (!apiKey) {
    return NextResponse.json({ detail: 'Debe enviar el header X-API-Key' }, { status: 401 });
  }

  return NextResponse.json({
    META_TOKEN: 'EAAmxP99...',
    TEMPLATE_NAME: 'ofrecer_whatsapp2',
    LANGUAGE_CODE: 'es_CO',
    PARAM_IMG_HEAD: 'S',
    ADJ_IMAGEN: 'S',
    MENSAJE_IMG: 'Productos & Asesorías',
    CHATWOOT_ACCOUNT_ID: '152767',
    CHATWOOT_INBOX_ID: '96844',
  });
}
