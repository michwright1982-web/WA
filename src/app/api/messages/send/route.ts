import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { phoneNumberId, accessToken, to, body, type, mediaUrl, buttons, templateId, templateLanguage, templateParams } = await request.json();

    if (!phoneNumberId || !accessToken || !to) {
      return NextResponse.json({ error: 'Missing required credentials or recipient number.' }, { status: 400 });
    }

    // Standardize destination phone number to E.164 format (digits only, e.g. "15550192834")
    const formattedTo = to.replace(/\D/g, '');

    const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
    
    let payload: any = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedTo
    };

    if (type === 'template') {
      payload.type = 'template';
      payload.template = {
        name: templateId,
        language: {
          code: templateLanguage || 'en_US'
        }
      };
      if (templateParams && templateParams.length > 0) {
        payload.template.components = [
          {
            type: 'body',
            parameters: templateParams.map((paramText: string) => ({
              type: 'text',
              text: paramText
            }))
          }
        ];
      }
      if (buttons && buttons.length > 0) {
        payload.template.components = payload.template.components || [];
        buttons.forEach((btn: string, index: number) => {
          payload.template.components.push({
            type: 'button',
            sub_type: 'quick_reply',
            index: index,
            parameters: [
              {
                type: 'payload',
                payload: btn
              }
            ]
          });
        });
      }
    } else if (type === 'image' && mediaUrl) {
      payload.type = 'image';
      payload.image = {
        link: mediaUrl,
        caption: body || ''
      };
    } else if (type === 'document' && mediaUrl) {
      payload.type = 'document';
      payload.document = {
        link: mediaUrl,
        filename: body || 'document.pdf'
      };
    } else if (type === 'voice' && mediaUrl) {
      payload.type = 'audio';
      payload.audio = {
        link: mediaUrl
      };
    } else if (type === 'button' && buttons && buttons.length > 0) {
      payload.type = 'interactive';
      payload.interactive = {
        type: 'button',
        body: {
          text: body || 'Choose an option:'
        },
        action: {
          buttons: buttons.slice(0, 3).map((btnText: string, idx: number) => ({
            type: 'reply',
            reply: {
              id: `btn-${idx}`,
              title: btnText.substring(0, 20) // WhatsApp limit is 20 chars for button titles
            }
          }))
        }
      };
    } else {
      payload.type = 'text';
      payload.text = {
        body: body
      };
    }

    console.log('Sending message to Meta API:', JSON.stringify(payload, null, 2));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseData = await response.json();
    console.log('Meta API Response:', responseData);

    if (!response.ok) {
      return NextResponse.json({ 
        error: responseData.error?.message || 'Meta API error occurred.',
        details: responseData 
      }, { status: response.status });
    }

    return NextResponse.json({ success: true, messageId: responseData.messages?.[0]?.id }, { status: 200 });
  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: error.message || 'Internal server error.' }, { status: 500 });
  }
}
