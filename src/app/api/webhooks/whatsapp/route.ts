import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { executeWorkflow, sendWhatsAppMessage } from '@/lib/workflow-engine';

const queuePath = path.join(os.tmpdir(), 'whatsflow_webhook_queue.json');
export const dynamic = 'force-dynamic';

// Access the shared global automation config
declare global {
  // eslint-disable-next-line no-var
  var __whatsflow_automation_config: {
    workflow: any | null;
    templates: any[];
    account: any | null;
    contacts: any[];
  } | undefined;
}

function addToQueue(message: any) {
  try {
    let queue: any[] = [];
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

            // Determine the message type for workflow routing
            const msgType = msg.type === 'interactive' || msg.type === 'button' ? 'button' : 
                          msg.type === 'image' || msg.type === 'document' || msg.type === 'audio' || msg.type === 'voice' || msg.type === 'video' ? msg.type : 'text';

            const incomingMessage = {
              id: msg.id || `m-webhook-${Date.now()}`,
              phoneNumber: msg.from.startsWith('+') ? msg.from : `+${msg.from}`,
              senderName: contactInfo?.profile?.name || `WhatsApp User (+${msg.from})`,
              body: messageBody,
              type: msgType,
              timestamp: msg.timestamp ? new Date(parseInt(msg.timestamp) * 1000).toISOString() : new Date().toISOString()
            };

            // 1. Queue the message for the frontend to display in UI
            addToQueue(incomingMessage);
            console.log('Successfully queued parsed incoming message:', incomingMessage);

            // 2. SERVER-SIDE WORKFLOW EXECUTION — runs immediately, no polling delay
            const config = global.__whatsflow_automation_config;
            if (config?.workflow && config?.account) {
              const acc = config.account;
              const isMock = !acc || 
                acc.accessToken === 'EAAGb...' || 
                acc.accessToken.length < 20 ||
                acc.appSecret === '••••••••••••••••';

              // Check if automation is enabled for this contact
              const senderNumber = msg.from.replace(/\D/g, '');
              const contact = config.contacts?.find((c: any) => c.phoneNumber.replace(/\D/g, '') === senderNumber);
              const isAutomationEnabled = !contact || contact.automationEnabled !== false;

              if (isAutomationEnabled) {
                console.log('[ServerAutomation] Running workflow for:', messageBody, 'type:', msgType);
                
                const result = executeWorkflow(
                  config.workflow,
                  incomingMessage,
                  config.templates || []
                );

                console.log('[ServerAutomation] Workflow result:', JSON.stringify(result, null, 2));

                if (result.triggered && result.responseMessage && !isMock) {
                  // Send the response via WhatsApp Cloud API immediately
                  const sendResult = await sendWhatsAppMessage(
                    acc.phoneNumberId,
                    acc.accessToken,
                    msg.from,
                    result
                  );
                  console.log('[ServerAutomation] Send result:', sendResult);

                  // Also queue the outgoing message for UI display
                  const outgoingForUI = {
                    id: `m-auto-server-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    phoneNumber: incomingMessage.phoneNumber,
                    senderName: 'WhatsFlow Bot',
                    body: result.responseMessage.body,
                    type: result.responseMessage.type === 'template' ? 'template' : 'text',
                    direction: 'OUTGOING',
                    buttons: result.responseMessage.buttons,
                    timestamp: new Date().toISOString(),
                    automationResponse: true
                  };
                  addToQueue(outgoingForUI);
                } else if (result.triggered && isMock) {
                  console.log('[ServerAutomation] Mock mode — workflow matched but no live API credentials configured.');
                }
              } else {
                console.log('[ServerAutomation] Automation disabled for contact:', senderNumber);
              }
            } else {
              console.log('[ServerAutomation] No active workflow or account config synced to server.');
            }
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
