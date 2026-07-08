import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, template_name, language_code, nombre_clie, nomb_mio, header_image_url, ...texts } = body;

    const metaToken = process.env.META_TOKEN || 'EAAmxP99IbJEBQnTZA046SHLwwuIoX87rs9pUDLoCzgjXbNa9PTvjSS9aZBmpwEht1veace0sq8xrgxuprK1LQsKdBg16T5xGDiJNHJRuNWIQDPoKtxlNWNHIHVeJgmFockCoQFobAEQgZCpgR299zcPE7PcK9x1LIgzy5ghKZCXwpjZBccxzn7xlPiT1JFHOayAZDZD';
    const phoneNumberId = '958444014023857';

    const components: any[] = [];

    // Header
    if (header_image_url) {
      components.push({
        type: 'header',
        parameters: [{ type: 'image', image: { link: header_image_url } }],
      });
    }

    // Body
    const bodyParams: any[] = [
      { type: 'text', parameter_name: 'nombre_clie', text: nombre_clie },
      { type: 'text', parameter_name: 'nomb_mio', text: nomb_mio },
    ];
    for (let i = 1; i <= 6; i++) {
      const key = `texto${i}`;
      if (texts[key]) {
        bodyParams.push({ type: 'text', parameter_name: key, text: texts[key] });
      }
    }
    components.push({ type: 'body', parameters: bodyParams });

    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: template_name,
        language: { code: language_code || 'es_CO' },
        components,
      },
    };

    const res = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${metaToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}
