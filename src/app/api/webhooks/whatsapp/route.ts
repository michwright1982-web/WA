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
                const responseJson = msg.interactive?.nfm_reply?.response_json || '{}';
                messageBody = `📝 Filled Booking Form Response: ${responseJson}`;
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
                
                const results = executeWorkflow(
                  config.workflow,
                  {
                    ...incomingMessage,
                    contactLabel: contact?.label || 'unlabeled'
                  },
                  config.templates || []
                );

                console.log('[ServerAutomation] Workflow results:', JSON.stringify(results, null, 2));

                for (const result of results) {
                  if (result.triggered) {
                    if (result.actionType === 'change_label') {
                      const sysActionForUI = {
                        id: `m-sys-action-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                        phoneNumber: incomingMessage.phoneNumber,
                        senderName: 'System',
                        body: 'CRM Label Update',
                        type: 'system_action',
                        direction: 'OUTGOING',
                        timestamp: new Date().toISOString(),
                        automationResponse: true,
                        actionType: result.actionType,
                        actionValue: result.actionValue
                      };
                      addToQueue(sysActionForUI);
                    } else if (result.responseMessage) {
                      // Perform live AI API invocation if subtype is ai_assistant
                      if (result.actionType === 'ai_assistant') {
                        let aiReplyText = '';
                        const apiKey = result.aiApiKey || process.env.OPENAI_API_KEY;
                        const model = result.aiModel || 'gpt-5-mini';
                        const systemPrompt = result.prompt || 'You are a helpful support assistant.';
                        const userMessage = incomingMessage.body;

                        if (apiKey && apiKey.trim() !== '' && !apiKey.startsWith('sk-••••')) {
                          try {
                            console.log(`[ServerAutomation] Requesting live AI response from OpenAI model: ${model}...`);
                            
                            let messagesForMemory: any[] = [];
                            if (result.aiMemoryEnabled) {
                              const limit = parseInt(result.aiMessageLimit || '10');
                              let queue: any[] = [];
                              if (fs.existsSync(queuePath)) {
                                const data = fs.readFileSync(queuePath, 'utf8');
                                if (data) queue = JSON.parse(data);
                              }
                              const contactMessages = queue
                                .filter((m: any) => m.phoneNumber === incomingMessage.phoneNumber)
                                .slice(-limit);
                                
                              messagesForMemory = contactMessages.map((m: any) => ({
                                role: m.direction === 'INCOMING' ? 'user' : 'assistant',
                                content: m.body
                              }));
                            }

                            const apiEndpoint = model.includes('gemini') 
                              ? `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
                              : model.includes('claude')
                                ? `https://api.anthropic.com/v1/messages`
                                : `https://api.openai.com/v1/chat/completions`;

                            let response;
                            if (model.includes('gemini')) {
                              response = await fetch(apiEndpoint, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  contents: [
                                    { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser Message: ${userMessage}` }] }
                                  ]
                                })
                              });
                              const data = await response.json();
                              aiReplyText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                            } else if (model.includes('claude')) {
                              response = await fetch(apiEndpoint, {
                                method: 'POST',
                                headers: {
                                  'x-api-key': apiKey,
                                  'anthropic-version': '2023-06-01',
                                  'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                  model: model,
                                  max_tokens: 1024,
                                  system: systemPrompt,
                                  messages: [
                                    { role: 'user', content: userMessage }
                                  ]
                                })
                              });
                              const data = await response.json();
                              aiReplyText = data.content?.[0]?.text || '';
                            } else {
                              const openAiModelName = model === 'gpt-5-mini' ? 'gpt-4o-mini' : model;
                              const chatMessages = [
                                { role: 'system', content: systemPrompt },
                                ...messagesForMemory,
                                { role: 'user', content: userMessage }
                              ];

                              response = await fetch(apiEndpoint, {
                                method: 'POST',
                                headers: {
                                  'Authorization': `Bearer ${apiKey}`,
                                  'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                  model: openAiModelName,
                                  messages: chatMessages
                                })
                              });
                              const data = await response.json();
                              aiReplyText = data.choices?.[0]?.message?.content || '';
                            }

                            if (aiReplyText) {
                              console.log('[ServerAutomation] Received dynamic AI reply:', aiReplyText);
                              result.responseMessage.body = aiReplyText;
                            }
                          } catch (apiErr) {
                            console.error('[ServerAutomation] OpenAI completion request error:', apiErr);
                          }
                        }
                      }

                      if (!isMock) {
                        const sendResult = await sendWhatsAppMessage(
                          acc.phoneNumberId,
                          acc.accessToken,
                          msg.from,
                          result
                        );
                        console.log('[ServerAutomation] Send result:', sendResult);
                      } else {
                        console.log('[ServerAutomation] Mock mode — workflow matched but no live API credentials configured.');
                      }

                      const outgoingForUI = {
                        id: `m-auto-server-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                        phoneNumber: incomingMessage.phoneNumber,
                        senderName: 'WhatsFlow Bot',
                        body: result.responseMessage.body,
                        type: result.responseMessage.type || 'text',
                        direction: 'OUTGOING',
                        buttons: result.responseMessage.buttons,
                        timestamp: new Date().toISOString(),
                        automationResponse: true
                      };
                      addToQueue(outgoingForUI);
                    }
                  }
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
