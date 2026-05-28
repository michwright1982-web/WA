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
  actionValue?: string;
  responseMessage?: {
    type: 'text' | 'template' | 'button' | 'image' | 'document' | 'flow';
    body: string;
    templateName?: string;
    templateLanguage?: string;
    templateParams?: string[];
    buttons?: string[];
    mediaUrl?: string;
    flowId?: string;
    flowToken?: string;
    flowScreen?: string;
    flowCta?: string;
    flowHeader?: string;
    flowFooter?: string;
    flowPayload?: string;
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
  contactLabel?: string;
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
): WorkflowExecutionResult[] {
  const messageBody = incomingMsg.body;
  const messageType = incomingMsg.type;
  if (!workflow || workflow.status !== 'ACTIVE') {
    return [{ triggered: false, error: 'No active workflow' }];
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
    return [{ triggered: false, error: 'No trigger node found' }];
  }

  console.log('[WorkflowEngine] Matched trigger node:', triggerNode.id, triggerNode.data.label, 'expectedSubType:', expectedSubType);

  // Step 2: Traverse graph to find all action nodes
  const targetActionNodes: ServerFlowNode[] = [];
  const currentNodes: ServerFlowNode[] = [triggerNode];
  const visited = new Set<string>();

  while (currentNodes.length > 0) {
    const node = currentNodes.shift()!;
    if (visited.has(node.id)) continue;
    visited.add(node.id);

    if (node.type === 'actionNode') {
      if (!node.data.config?.isDisabled) {
        targetActionNodes.push(node);
      }
      
      const nextEdges = workflow.edges.filter(e => e.source === node.id);
      for (const edge of nextEdges) {
        const nextNode = workflow.nodes.find(n => n.id === edge.target);
        if (nextNode) currentNodes.push(nextNode);
      }
    } else if (node.type === 'triggerNode') {
      const nextEdges = workflow.edges.filter(e => e.source === node.id);
      for (const edge of nextEdges) {
        const nextNode = workflow.nodes.find(n => n.id === edge.target);
        if (nextNode) currentNodes.push(nextNode);
      }
    } else if (node.type === 'conditionNode') {
      if (node.data.config?.isDisabled) {
        // Pass through to all connected branches
        const actionEdges = workflow.edges.filter(e => e.source === node.id);
        for (const edge of actionEdges) {
          const nextNode = workflow.nodes.find(n => n.id === edge.target);
          if (nextNode) currentNodes.push(nextNode);
        }
        continue;
      }
      const keyword = node.data.config?.keyword;
      const subType = node.data.config?.subType || '';

      if (subType === 'if_else') {
        const branches = node.data.config?.branches || [
          { id: 'yes', keyword: keyword || '', label: 'If Yes' }
        ];
        const actionEdges = workflow.edges.filter(e => e.source === node.id);
        let matchedBranchId = 'else';

        for (const branch of branches) {
          const kw = branch.keyword || '';
          if (kw && (messageBody || '').toLowerCase().includes(kw.toLowerCase())) {
            matchedBranchId = branch.id;
            break;
          }
        }

        const matchingEdge = actionEdges.find((e: any) => e.port === matchedBranchId);
        if (matchingEdge) {
          const nextNode = workflow.nodes.find(n => n.id === matchingEdge.target);
          if (nextNode) currentNodes.push(nextNode);
        } else {
          // Fallback
          const fallbackEdge = actionEdges.find((e: any) => e.port === 'else' || e.port === 'no' || !e.port);
          if (fallbackEdge) {
            const nextNode = workflow.nodes.find(n => n.id === fallbackEdge.target);
            if (nextNode) currentNodes.push(nextNode);
          }
        }
      } else if (subType === 'label_check') {
        const branches = node.data.config?.branches || [];
        const contactLabel = (incomingMsg.contactLabel || 'unlabeled').trim().toLowerCase();
        const actionEdges = workflow.edges.filter(e => e.source === node.id);
        
        const matchedBranch = branches.find((b: any) => (b.keyword || '').trim().toLowerCase() === contactLabel);
        let matchedBranchId = 'else';
        if (matchedBranch) {
          matchedBranchId = matchedBranch.id;
        }

        const matchingEdge = actionEdges.find((e: any) => e.port === matchedBranchId);
        if (matchingEdge) {
          const nextNode = workflow.nodes.find(n => n.id === matchingEdge.target);
          if (nextNode) currentNodes.push(nextNode);
        } else {
          const fallbackEdge = actionEdges.find((e: any) => e.port === 'else' || !e.port);
          if (fallbackEdge) {
            const nextNode = workflow.nodes.find(n => n.id === fallbackEdge.target);
            if (nextNode) currentNodes.push(nextNode);
          }
        }
      } else if (subType === 'switch_logic') {
        const branches = node.data.config?.branches || [];
        const actionEdges = workflow.edges.filter(e => e.source === node.id);
        let matchedBranchId = 'else';

        for (const branch of branches) {
          const kw = branch.keyword || '';
          if (kw && (messageBody || '').toLowerCase().includes(kw.toLowerCase())) {
            matchedBranchId = branch.id;
            break;
          }
        }

        const matchingEdge = actionEdges.find((e: any) => e.port === matchedBranchId);
        if (matchingEdge) {
          const nextNode = workflow.nodes.find(n => n.id === matchingEdge.target);
          if (nextNode) currentNodes.push(nextNode);
        } else {
          const fallbackEdge = actionEdges.find((e: any) => e.port === 'else' || !e.port);
          if (fallbackEdge) {
            const nextNode = workflow.nodes.find(n => n.id === fallbackEdge.target);
            if (nextNode) currentNodes.push(nextNode);
          }
        }
      } else {
        // Standard keyword match
        if (keyword && (messageBody || '').toLowerCase().includes(keyword.toLowerCase())) {
          const actionEdges = workflow.edges.filter(e => e.source === node.id);
          for (const actionEdge of actionEdges) {
            const nextNode = workflow.nodes.find(n => n.id === actionEdge.target);
            if (nextNode) currentNodes.push(nextNode);
          }
        }
      }
    }
  }

  // Step 3: Absolute fallback — first action node
  if (targetActionNodes.length === 0) {
    const fallbackNode = workflow.nodes.find(n => n.type === 'actionNode');
    if (fallbackNode) targetActionNodes.push(fallbackNode);
  }

  if (targetActionNodes.length === 0) {
    return [{ triggered: true, triggerNodeId: triggerNode.id, error: 'No action node found' }];
  }

  const results: WorkflowExecutionResult[] = targetActionNodes.map(targetActionNode => {
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
            if (tmpl.buttons && tmpl.buttons.length > 0) buttons = tmpl.buttons;
            
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
    } else if (actionSubType === 'send_flow') {
      responseMessage = {
        type: 'flow',
        body: targetActionNode.data.config?.flowBody || 'Fill out your details to start!',
        flowHeader: targetActionNode.data.config?.flowHeader || '',
        flowFooter: targetActionNode.data.config?.flowFooter || '',
        flowCta: targetActionNode.data.config?.flowCta || 'Open Flow',
        flowId: targetActionNode.data.config?.flowId || '',
        flowToken: targetActionNode.data.config?.flowToken || '',
        flowScreen: targetActionNode.data.config?.flowScreen || '',
        flowPayload: targetActionNode.data.config?.flowPayload || '{}'
      };
    } else if (actionSubType === 'ai_assistant') {
      responseMessage = {
        type: 'text',
        body: `[AI Reply]: "${targetActionNode.data.config?.prompt || 'Support Bot'}". Responding to: "${messageBody}"`
      };
    } else if (actionSubType === 'change_label') {
      return {
        triggered: true,
        triggerNodeId: triggerNode.id,
        actionNodeId: targetActionNode.id,
        actionType: actionSubType,
        actionValue: targetActionNode.data.config?.newLabel
      };
    } else {
      // Default text response for unhandled subtypes
      responseMessage = {
        type: 'text',
        body: interpolatedMessageText || 'Automated response from WhatsFlow.'
      };
    }

    return {
      triggered: true,
      triggerNodeId: triggerNode.id,
      actionNodeId: targetActionNode.id,
      actionType: actionSubType,
      responseMessage
    };
  });

  return results;
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
  } else if (msg.type === 'flow' && msg.flowId) {
    payload.type = 'interactive';
    
    let parsedData = {};
    try {
      parsedData = msg.flowPayload ? JSON.parse(msg.flowPayload) : {};
    } catch (e) {
      console.warn('[WorkflowEngine] Invalid JSON in flowPayload, ignoring data block.');
    }

    payload.interactive = {
      type: 'flow',
      body: { text: msg.body },
      action: {
        name: 'flow',
        parameters: {
          flow_message_version: '3',
          flow_token: msg.flowToken || `flow-${Date.now()}`,
          flow_id: msg.flowId,
          flow_cta: msg.flowCta || 'Open',
          flow_action: 'navigate',
          flow_action_payload: {
            screen: msg.flowScreen || 'SCREEN_ONE',
            data: parsedData
          }
        }
      }
    };

    if (msg.flowHeader) {
      payload.interactive.header = { type: 'text', text: msg.flowHeader };
    }
    if (msg.flowFooter) {
      payload.interactive.footer = { text: msg.flowFooter };
    }
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
