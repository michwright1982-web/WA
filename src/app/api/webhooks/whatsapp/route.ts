import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const QUEUE_FILE_PATH = path.join(process.cwd(), 'src/app/api/webhooks/whatsapp/queue.json');

function initQueue() {
  const dir = path.dirname(QUEUE_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(QUEUE_FILE_PATH)) {
    fs.writeFileSync(QUEUE_FILE_PATH, JSON.stringify([]), 'utf-8');
  }
}

function addToQueue(message: any) {
  initQueue();
  try {
    const data = fs.readFileSync(QUEUE_FILE_PATH, 'utf-8');
    const queue = JSON.parse(data || '[]');
    queue.push(message);
    fs.writeFileSync(QUEUE_FILE_PATH, JSON.stringify(queue, null, 2), 'utf-8');
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

        // Process status updates (delivery ticks, read states) to keep console aligned
        if (value.statuses && value.statuses.length > 0) {
          console.log('Processed message status update:', value.statuses[0]);
        }

        // Process incoming customer messages
        if (value.messages && value.messages.length > 0) {
          for (const msg of value.messages) {
            // Locate contact display profile information matching the sender wa_id
            const contactInfo = value.contacts?.find((c: any) => c.wa_id === msg.from) || value.contacts?.[0];
            
            // Extract the body of the message dynamically based on WhatsApp event type
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
                // Flows response payloads
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
              phoneNumber: msg.from.startsWith('+') ? msg.from : `+${msg.from}`, // Resilient standardized format
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
