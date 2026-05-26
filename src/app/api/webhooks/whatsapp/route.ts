import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const QUEUE_FILE_PATH = path.join(process.cwd(), 'src/app/api/webhooks/whatsapp/queue.json');

// Ensure queue file exists
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

    // Extract message, phone, and name from standard Meta webhook format
    const entry = payload.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    
    if (value && value.messages && value.messages.length > 0) {
      const msg = value.messages[0];
      const contactInfo = value.contacts?.[0];
      
      const incomingMessage = {
        id: msg.id || `m-webhook-${Date.now()}`,
        phoneNumber: msg.from, // e.g. "+15550192834" or "15550192834"
        senderName: contactInfo?.profile?.name || 'WhatsApp Contact',
        body: msg.text?.body || '[Media/Attachment received]',
        timestamp: new Date(parseInt(msg.timestamp) * 1000).toISOString() || new Date().toISOString()
      };

      addToQueue(incomingMessage);
      console.log('Successfully queued incoming message:', incomingMessage);
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error) {
    console.error('Error handling WhatsApp webhook:', error);
    return NextResponse.json({ error: 'Failed to process event' }, { status: 400 });
  }
}
