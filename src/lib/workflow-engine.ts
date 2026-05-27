// Server-side workflow execution engine
// This runs INSIDE the webhook handler — no polling, no race conditions, no lost messages.

export interface ServerFlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    description?: string;
    config?: Record<string, any>;
  };
}

export interface ServerFlowEdge {
  id: string;
  source: string;
  target: string;
  port?: string;
}

export interface ServerWorkflow {
  id: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  nodes: ServerFlowNode[];
  edges: ServerFlowEdge[];
}

export interface WorkflowExecutionResult {
  triggered: boolean;
  triggerNodeId?: string;
  actionNodeId?: string;
  actionType?: string;
  responseMessage?: {
    type: 'text' | 'template' | 'button' | 'image' | 'document';
    body: string;
    templateName?: string;
    templateLanguage?: string;
    templateParams?: string[];
    buttons?: string[];
    mediaUrl?: string;
  };
  error?: string;
}

export interface IncomingMessageContext {
  id?: string;
  body: string;
  type: string;
  phoneNumber?: string;
  senderName?: string;
  timestamp?: string;
}

function interpolateVariables(text: string, msg: IncomingMessageContext): string {
  if (!text) return text;
  return text
    .replace(/\{\{msg\.body\}\}/g, msg.body || '')
    .replace(/\{\{msg\.senderName\}\}/g, msg.senderName || '')
    .replace(/\{\{msg\.sender\}\}/g, msg.phoneNumber || '')
    .replace(/\{\{msg\.timestamp\}\}/g, msg.timestamp || '');
}

/**
 * Execute a workflow against an incoming message, entirely server-side.
 * Returns the action to take (what message to send back).
 */
export function executeWorkflow(
  workflow: ServerWorkflow,
  incomingMsg: IncomingMessageContext,
  templates: any[]
): WorkflowExecutionResult {
  const messageBody = incomingMsg.body;
  const messageType = incomingMsg.type;
  if (!workflow || workflow.status !== 'ACTIVE') {
    return { triggered: false, error: 'No active workflow' };
  }

  console.log('[WorkflowEngine] Executing workflow:', workflow.name, 'for message:', messageBody, 'type:', messageType);

  // Step 1: Find the matching trigger node
  const expectedSubType = messageType === 'button' ? 'incoming_button'
    : (messageType === 'image' || messageType === 'document' || messageType === 'voice') ? 'incoming_media'
    : 'incoming_text';

  const triggerNode = workflow.nodes.find(
    n => n.type === 'triggerNode' && n.data.config?.subType === expectedSubType
  ) || workflow.nodes.find(n => n.type === 'triggerNode') || workflow.nodes[0];

  if (!triggerNode) {
    return { triggered: false, error: 'No trigger node found' };
  }

  console.log('[WorkflowEngine] Matched trigger node:', triggerNode.id, triggerNode.data.label, 'expectedSubType:', expectedSubType);

  // Step 2: Follow edges from trigger to find the action/condition node
  let targetActionNode: ServerFlowNode | null = null;
  const outgoingEdges = workflow.edges.filter(e => e.source === triggerNode.id);

  for (const edge of outgoingEdges) {
    const nextNode = workflow.nodes.find(n => n.id === edge.target);
    if (!nextNode) continue;

    if (nextNode.type === 'conditionNode') {
      const keyword = nextNode.data.config?.keyword;
      const subType = nextNode.data.config?.subType || '';

      if (subType === 'if_else') {
        const branches = nextNode.data.config?.branches || [
          { id: 'yes', keyword: keyword || '', label: 'If Yes' }
        ];
        const actionEdges = workflow.edges.filter(e => e.source === nextNode.id);
        let matchedBranchId = 'else';

        for (const branch of branches) {
          const kw = branch.keyword || '';
          if (kw && (messageBody || '').toLowerCase().includes(kw.toLowerCase())) {
            matchedBranchId = branch.id;
            break;
          }
        }

        console.log('[WorkflowEngine] If/Else matched branch:', matchedBranchId);

        const matchingEdge = actionEdges.find((e: any) => e.port === matchedBranchId);
        if (matchingEdge) {
          const actNode = workflow.nodes.find(n => n.id === matchingEdge.target);
          if (actNode) targetActionNode = actNode;
        } else {
          // Fallback
          const fallbackEdge = actionEdges.find((e: any) => e.port === 'else' || e.port === 'no' || !e.port);
          if (fallbackEdge) {
            const actNode = workflow.nodes.find(n => n.id === fallbackEdge.target);
            if (actNode) targetActionNode = actNode;
          }
        }
      } else {
        // Standard keyword match
        if (keyword && (messageBody || '').toLowerCase().includes(keyword.toLowerCase())) {
          const actionEdges = workflow.edges.filter(e => e.source === nextNode.id);
          for (const actionEdge of actionEdges) {
            const actNode = workflow.nodes.find(n => n.id === actionEdge.target && n.type === 'actionNode');
            if (actNode) {
              targetActionNode = actNode;
              break;
            }
          }
        }
      }
    } else if (nextNode.type === 'actionNode') {
      if (!targetActionNode) {
        targetActionNode = nextNode;
      }
    }

    if (targetActionNode && nextNode.type === 'conditionNode') {
      break;
    }
  }

  // Step 3: Absolute fallback — first action node
  if (!targetActionNode) {
    targetActionNode = workflow.nodes.find(n => n.type === 'actionNode') || null;
  }

  if (!targetActionNode) {
    return { triggered: true, triggerNodeId: triggerNode.id, error: 'No action node found' };
  }

  console.log('[WorkflowEngine] Resolved action node:', targetActionNode.id, targetActionNode.data.label);

  // Step 4: Build the response message based on the action node config
  const actionSubType = targetActionNode.data.config?.subType || 'send_text';
  let rawMessageText = targetActionNode.data.config?.messageText || '';
  let interpolatedMessageText = interpolateVariables(rawMessageText, incomingMsg);
  let responseMessage: WorkflowExecutionResult['responseMessage'];

  if (actionSubType === 'send_message') {
    const sendOption = targetActionNode.data.config?.sendOption || 'message';
    const msgFormat = targetActionNode.data.config?.messageFormat || 'text';

    if (sendOption === 'template') {
      let bodyText = '';
      let buttons: string[] = ['Get Started', 'Contact Sales'];
      const templateParam = interpolatedMessageText || 'Customer';
      let templateName = 'welcome_onboarding';
      let templateLanguage = 'en_US';

      let templateParams: string[] = [];
      if (targetActionNode.data.config?.templateId) {
        const tmpl = templates.find((t: any) => t.id === targetActionNode!.data.config!.templateId);
        if (tmpl) {
          bodyText = tmpl.bodyText;
          templateName = tmpl.name;
          templateLanguage = tmpl.language;
          if (tmpl.buttons && tmpl.buttons.length > 0) {
            buttons = tmpl.buttons;
          }
          
          if (tmpl.bodyText.includes('{{')) {
            const matches = tmpl.bodyText.match(/\{\{\d+\}\}/g);
            if (matches) {
              const paramsList = templateParam.split(',').map((s: string) => s.trim());
              matches.forEach((match: string, index: number) => {
                templateParams.push(paramsList[index] || `Value${index + 1}`);
              });
            }
          }
          
          const paramsList = templateParam.split(',').map((s: string) => s.trim());
          paramsList.forEach((val: string, idx: number) => {
            bodyText = bodyText.replace(`{{${idx + 1}}}`, val);
          });
          bodyText = bodyText.replace(/\{\{\d+\}\}/g, '...');
        } else {
          bodyText = `Welcome aboard ${templateParam}! We are excited to support your communication journey.`;
        }
      } else {
        bodyText = `Welcome aboard ${templateParam}! We are excited to support your communication journey.`;
      }

      responseMessage = {
        type: 'template',
        body: bodyText,
        templateName,
        templateLanguage,
        templateParams,
        buttons
      };
    } else {
      if (msgFormat === 'document') {
        responseMessage = {
          type: 'image',
          body: interpolatedMessageText || 'Sending attached media...',
          mediaUrl: targetActionNode.data.config?.mediaUrl || ''
        };
      } else {
        responseMessage = {
          type: 'text',
          body: interpolatedMessageText || 'Hello! This is an automated response from WhatsFlow.'
        };
      }
    }
  } else if (actionSubType === 'send_buttons') {
    const buttonOptions = targetActionNode.data.config?.buttonOptions
      ? targetActionNode.data.config.buttonOptions.split(',').map((b: string) => b.trim())
      : ['Onboarding', 'Documentation'];
    responseMessage = {
      type: 'button',
      body: interpolatedMessageText || 'Please choose an option:',
      buttons: buttonOptions
    };
  } else if (actionSubType === 'send_text') {
    responseMessage = {
      type: 'text',
      body: interpolatedMessageText || 'Hello! This is an automated response.'
    };
  } else if (actionSubType === 'ai_assistant') {
    responseMessage = {
      type: 'text',
      body: `[AI Reply]: "${targetActionNode.data.config?.prompt || 'Support Bot'}". Responding to: "${messageBody}"`
    };
  } else {
    // Default text response for unhandled subtypes
    responseMessage = {
      type: 'text',
      body: interpolatedMessageText || 'Automated response from WhatsFlow.'
    };
  }

  console.log('[WorkflowEngine] Response to send:', responseMessage);

  return {
    triggered: true,
    triggerNodeId: triggerNode.id,
    actionNodeId: targetActionNode.id,
    actionType: actionSubType,
    responseMessage
  };
}

/**
 * Send a message via Meta WhatsApp Cloud API
 */
export async function sendWhatsAppMessage(
  phoneNumberId: string,
  accessToken: string,
  recipientPhone: string,
  result: WorkflowExecutionResult
): Promise<{ success: boolean; error?: string }> {
  if (!result.responseMessage) {
    return { success: false, error: 'No response message to send' };
  }

  const formattedTo = recipientPhone.replace(/\D/g, '');
  const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
  
  let payload: any = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: formattedTo
  };

  const msg = result.responseMessage;

  if (msg.type === 'template' && msg.templateName) {
    payload.type = 'template';
    payload.template = {
      name: msg.templateName,
      language: { code: msg.templateLanguage || 'en_US' }
    };
    if (msg.templateParams && msg.templateParams.length > 0) {
      payload.template.components = [{
        type: 'body',
        parameters: msg.templateParams.map(p => ({ type: 'text', text: p }))
      }];
    }
  } else if (msg.type === 'button' && msg.buttons && msg.buttons.length > 0) {
    payload.type = 'interactive';
    payload.interactive = {
      type: 'button',
      body: { text: msg.body },
      action: {
        buttons: msg.buttons.slice(0, 3).map((btnText: string, idx: number) => ({
          type: 'reply',
          reply: { id: `btn-${idx}`, title: btnText.substring(0, 20) }
        }))
      }
    };
  } else if (msg.type === 'image' && msg.mediaUrl) {
    payload.type = 'image';
    payload.image = { link: msg.mediaUrl, caption: msg.body || '' };
  } else {
    payload.type = 'text';
    payload.text = { body: msg.body };
  }

  console.log('[WorkflowEngine] Sending to Meta API:', JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log('[WorkflowEngine] Meta API response:', data);

    if (!response.ok) {
      return { success: false, error: data.error?.message || 'Meta API error' };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[WorkflowEngine] Send error:', err);
    return { success: false, error: err.message };
  }
}
