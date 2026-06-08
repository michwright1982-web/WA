import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    const appId = process.env.NEXT_PUBLIC_META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;

    if (!appId || !appSecret) {
      return NextResponse.json({ 
        error: 'Meta App credentials are not configured in environment variables. Please add NEXT_PUBLIC_META_APP_ID and META_APP_SECRET.' 
      }, { status: 500 });
    }

    // 1. Exchange code for access token
    const tokenUrl = `https://graph.facebook.com/v20.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=${code}`;
    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      console.error('Error exchanging token:', tokenData.error);
      return NextResponse.json({ error: tokenData.error.message }, { status: 400 });
    }

    const accessToken = tokenData.access_token;

    // Optional 2. Query the Graph API for actual Phone Number IDs
    // using https://graph.facebook.com/v20.0/debug_token?input_token=${accessToken}&access_token=${appId}|${appSecret}
    // and granular scopes. For now, we return a pending credential object for the user to configure.
    
    const credential = {
      name: 'Facebook Connected Line',
      appId: appId,
      appSecret: appSecret, // In production, never return the secret to the client. Here we do it so the local storage mock works.
      accessToken: accessToken,
      phoneNumberId: 'PENDING_SETUP_ID', 
      businessAccountId: 'PENDING_SETUP_ID', 
      webhookVerifyToken: 'whatsflow_verify_token',
      status: 'CONNECTED'
    };

    return NextResponse.json({ success: true, credential });

  } catch (error) {
    console.error('Embedded signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
