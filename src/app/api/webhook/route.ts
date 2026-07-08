import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const hubMode = params['hub.mode'];
  const hubVerifyToken = params['hub.verify_token'];
  const hubChallenge = params['hub.challenge'];

  const verifyToken = process.env.VERIFY_TOKEN || 'johergo21970090516780919';

  if (hubMode === 'subscribe' && hubVerifyToken === verifyToken) {
    return new NextResponse(hubChallenge, { status: 200 });
  }
  return new NextResponse('Error de verificación', { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Webhook received:', JSON.stringify(body, null, 2));

    // Process status updates
    if (body.entry) {
      for (const entry of body.entry) {
        if (entry.changes) {
          for (const change of entry.changes) {
            if (change.value?.statuses) {
              for (const status of change.value.statuses) {
                console.log(`Status update: ${status.id} → ${status.status}`);
                // TODO: Update mensajes table in Supabase
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (e: any) {
    console.error('Webhook error:', e.message);
    return NextResponse.json({ status: 'error', detail: e.message }, { status: 400 });
  }
}
