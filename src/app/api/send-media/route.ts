import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, image_url, video_url, mensaje, caption } = body;

    if (!to) {
      return NextResponse.json({ detail: 'El campo "to" es obligatorio' }, { status: 400 });
    }

    const metaToken = process.env.META_TOKEN || 'EAAmxP99IbJEBQnTZA046SHLwwuIoX87rs9pUDLoCzgjXbNa9PTvjSS9aZBmpwEht1veace0sq8xrgxuprK1LQsKdBg16T5xGDiJNHJRuNWIQDPoKtxlNWNHIHVeJgmFockCoQFobAEQgZCpgR299zcPE7PcK9x1LIgzy5ghKZCXwpjZBccxzn7xlPiT1JFHOayAZDZD';
    const phoneNumberId = '958444014023857';

    let payload: any = {
      messaging_product: 'whatsapp',
      to,
    };

    if (image_url) {
      payload.type = 'image';
      payload.image = { link: image_url };
      if (caption) payload.image.caption = caption;
    } else if (video_url) {
      payload.type = 'video';
      payload.video = { link: video_url };
      if (caption) payload.video.caption = caption;
    } else if (mensaje) {
      payload.type = 'text';
      payload.text = { body: mensaje };
    } else {
      return NextResponse.json({ detail: 'Debe enviar image_url, video_url o mensaje' }, { status: 400 });
    }

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
