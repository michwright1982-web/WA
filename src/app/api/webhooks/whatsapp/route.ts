import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

const queuePath = path.join(os.tmpdir(), 'whatsflow_webhook_queue.json');

function addToQueue(message: any) {
  try {
    let queue = [];
    if (fs.existsSync(queuePath)) {
      const data = fs.readFileSync(queuePath, 'utf8');
      if (data) queue = JSON.parse(data);
    }
    queue.push(message);
    fs.writeFileSync(queuePath, JSON.stringify(queue), 'utf8');
    console.log('Successfully added message to local file queue. Current size:', queue.length);
  } catch (err) {
    console.error('Error writing to webhook queue:', err);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && challenge) {
    return new Response(challenge, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }

  return new Response('Verification failed', { status: 403 });
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    console.log('WhatsApp Webhook Event received:', JSON.stringify(payload, null, 2));

    const entries = payload.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const value = change.value;
        if (!value) continue;

        if (value.statuses && value.statuses.length > 0) {
          console.log('Processed message status update:', value.statuses[0]);
        }

        if (value.messages && value.messages.length > 0) {
          for (const msg of value.messages) {
            const contactInfo = value.contacts?.find((c: any) => c.wa_id === msg.from) || value.contacts?.[0];
            
            let messageBody = '[Unrecognized message type]';
            
            if (msg.type === 'text') {
              messageBody = msg.text?.body || '';
            } else if (msg.type === 'button') {
              messageBody = msg.button?.text || '';
            } else if (msg.type === 'interactive') {
              const interactiveType = msg.interactive?.type;
              if (interactiveType === 'button_reply') {
                messageBody = msg.interactive?.button_reply?.title || '';
              } else if (interactiveType === 'list_reply') {
                messageBody = msg.interactive?.list_reply?.title || '';
              } else if (interactiveType === 'nfm_reply') {
                messageBody = '📝 Filled Booking Form Response';
              }
            } else if (msg.type === 'image') {
              messageBody = '🖼️ [Image Attachment]';
            } else if (msg.type === 'document') {
              messageBody = `📄 Document: ${msg.document?.filename || 'Attachment.pdf'}`;
            } else if (msg.type === 'audio' || msg.type === 'voice') {
              messageBody = '🎙️ [Voice Message]';
            } else if (msg.type === 'video') {
              messageBody = '📹 [Video Attachment]';
            } else if (msg.type === 'location') {
              messageBody = '📍 [Shared Location Map]';
            } else if (msg.type === 'contacts') {
              messageBody = '👤 [Shared Contact Card]';
            }

            const incomingMessage = {
              id: msg.id || `m-webhook-${Date.now()}`,
              phoneNumber: msg.from.startsWith('+') ? msg.from : `+${msg.from}`,
              senderName: contactInfo?.profile?.name || `WhatsApp User (+${msg.from})`,
              body: messageBody,
              timestamp: msg.timestamp ? new Date(parseInt(msg.timestamp) * 1000).toISOString() : new Date().toISOString()
            };

            addToQueue(incomingMessage);
            console.log('Successfully queued parsed incoming message:', incomingMessage);
          }
        }
      }
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error) {
    console.error('Error handling WhatsApp webhook:', error);
    return NextResponse.json({ error: 'Failed to process event' }, { status: 400 });
  }
}
