"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

// Interfaces
export interface WhatsAppAccount {
  id: string;
  name: string;
  appId: string;
  appSecret: string;
  accessToken: string;
  phoneNumberId: string;
  businessAccountId: string;
  webhookVerifyToken: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  createdAt: string;
}

export interface Interaction {
  id: string;
  date: string;
  medium: 'phone' | 'whatsapp' | 'email' | 'meeting' | 'sms';
  notes: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  label?: 'new' | 'language selected' | 'flow filled';
  status: 'active' | 'inactive';
  automationEnabled?: boolean;
  leadStatus?: 'qualified' | 'not_qualified' | 'new';
  interactions?: Interaction[];
  profilePicUrl?: string;
}

export interface Message {
  id: string;
  accountId: string;
  contactId: string;
  type: 'text' | 'image' | 'button' | 'list' | 'template' | 'document' | 'voice';
  body: string;
  direction: 'INCOMING' | 'OUTGOING';
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  mediaUrl?: string;
  buttons?: string[];
}

export interface Template {
  id: string;
  name: string;
  category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';
  language: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  bodyText: string;
  buttons?: string[];
  createdAt: string;
}

export interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    description?: string;
    config?: Record<string, any>;
  };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  port?: string;
}

export interface Workflow {
  id: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  nodes: FlowNode[];
  edges: FlowEdge[];
  createdAt: string;
}

interface WhatsFlowContextType {
  accounts: WhatsAppAccount[];
  contacts: Contact[];
  messages: Message[];
  templates: Template[];
  workflows: Workflow[];
  activeAccountId: string;
  setActiveAccountId: (id: string) => void;
  activeContactId: string;
  setActiveContactId: (id: string) => void;
  addAccount: (account: Omit<WhatsAppAccount, 'id' | 'status' | 'createdAt'>) => void;
  updateAccount: (id: string, account: Omit<WhatsAppAccount, 'id' | 'status' | 'createdAt'>) => void;
  deleteAccount: (id: string) => void;
  sendTextMessage: (contactId: string, body: string) => void;
  sendMediaMessage: (contactId: string, mediaUrl: string, body: string) => void;
  sendDocumentMessage: (contactId: string, mediaUrl: string, fileName: string) => void;
  sendVoiceMessage: (contactId: string, mediaUrl: string, duration: string) => void;
  sendButtonMessage: (contactId: string, body: string, buttons: string[]) => void;
  sendTemplateMessage: (contactId: string, templateId: string) => void;
  addContact: (contact: Omit<Contact, 'id'>) => void;
  updateContact: (id: string, updated: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  addTemplate: (template: Omit<Template, 'id' | 'createdAt'>) => void;
  deleteTemplate: (id: string) => void;
  addWorkflow: (workflow: Omit<Workflow, 'id' | 'createdAt'>) => Workflow;
  updateWorkflow: (id: string, nodes: FlowNode[], edges: FlowEdge[]) => void;
  toggleWorkflowStatus: (id: string) => void;

  addInteraction: (contactId: string, interaction: Omit<Interaction, 'id' | 'createdAt'>) => void;
  clearChat: (contactId: string) => void;
}

const WhatsFlowContext = createContext<WhatsFlowContextType | undefined>(undefined);

// Default seed data — used only as fallback when localStorage is empty (first visit)
const SEED_ACCOUNTS: WhatsAppAccount[] = [
  {
    id: 'acc-1',
    name: 'Main Business Account',
    appId: '984719472948',
    appSecret: '••••••••••••••••',
    accessToken: 'EAAGb...',
    phoneNumberId: '10938472941',
    businessAccountId: '394829348',
    webhookVerifyToken: 'whatsflow_verify_token_123',
    status: 'CONNECTED',
    createdAt: '2026-05-01T08:00:00Z'
  },
  {
    id: 'acc-2',
    name: 'Support Line Beta',
    appId: '827491038472',
    appSecret: '••••••••••••••••',
    accessToken: 'EAAGb...',
    phoneNumberId: '20394829384',
    businessAccountId: '482938492',
    webhookVerifyToken: 'support_verify_token',
    status: 'CONNECTED',
    createdAt: '2026-05-15T12:00:00Z'
  }
];

const SEED_CONTACTS: Contact[] = [
  { id: 'c-1', name: 'Alex Rivera', phoneNumber: '+1 (555) 019-2834', email: 'alex@rivera.com', label: 'new', status: 'active', leadStatus: 'qualified', interactions: [
    { id: 'int-1', date: '2026-05-24', medium: 'whatsapp', notes: 'Discussed pricing tiers and enterprise plan.', createdAt: '2026-05-24T10:30:00Z' },
    { id: 'int-2', date: '2026-05-25', medium: 'phone', notes: 'Follow-up call: confirmed interest in premium tier.', createdAt: '2026-05-25T14:15:00Z' }
  ] },
  { id: 'c-2', name: 'Samantha Chen', phoneNumber: '+1 (555) 024-9481', email: 'sam@chen.design', label: 'language selected', status: 'active', leadStatus: 'new', interactions: [] },
  { id: 'c-3', name: 'Marcus Johnson', phoneNumber: '+1 (555) 038-1294', email: 'marcus.j@enterprise.com', label: 'flow filled', status: 'active', leadStatus: 'qualified', interactions: [] },
  { id: 'c-4', name: 'Clara Oswald', phoneNumber: '+1 (555) 049-3829', email: 'clara@tardis.io', label: 'new', status: 'inactive', leadStatus: 'not_qualified', interactions: [] }
];

const SEED_MESSAGES: Message[] = [
  { id: 'm-1', accountId: 'acc-1', contactId: 'c-1', type: 'text', body: 'Hello! Welcome to WhatsFlow. How can we help you today?', direction: 'OUTGOING', status: 'read', timestamp: '2026-05-26T08:00:00Z' },
  { id: 'm-2', accountId: 'acc-1', contactId: 'c-1', type: 'text', body: 'Hi there! I am interested in connecting my WhatsApp API. Is it simple?', direction: 'INCOMING', status: 'read', timestamp: '2026-05-26T08:02:00Z' },
  { id: 'm-3', accountId: 'acc-1', contactId: 'c-1', type: 'text', body: 'Yes, absolutely. You can set it up in under 5 minutes from our dashboard!', direction: 'OUTGOING', status: 'read', timestamp: '2026-05-26T08:03:00Z' },
  { id: 'm-4', accountId: 'acc-1', contactId: 'c-2', type: 'text', body: 'Can we schedule a call for tomorrow?', direction: 'INCOMING', status: 'read', timestamp: '2026-05-26T08:15:00Z' }
];

const SEED_TEMPLATES: Template[] = [
  { id: 't-1', name: 'welcome_onboarding', category: 'MARKETING', language: 'en_US', status: 'APPROVED', bodyText: 'Hi {{1}}, welcome aboard! We are excited to support your communication journey.', buttons: ['Get Started', 'Contact Sales'], createdAt: '2026-05-20T10:00:00Z' },
  { id: 't-2', name: 'payment_reminder', category: 'UTILITY', language: 'en_US', status: 'APPROVED', bodyText: 'Dear {{1}}, this is a quick reminder that invoice {{2}} is due tomorrow. Total: {{3}}.', createdAt: '2026-05-22T14:30:00Z' },
  { id: 't-3', name: 'verification_otp', category: 'AUTHENTICATION', language: 'en_US', status: 'APPROVED', bodyText: 'Your WhatsFlow verification code is: {{1}}. Do not share this code.', createdAt: '2026-05-25T09:12:00Z' }
];

const SEED_WORKFLOWS: Workflow[] = [
  {
    id: 'w-1',
    name: 'AI Agent Auto-Responder',
    status: 'ACTIVE',
    nodes: [
      { id: '1', type: 'triggerNode', position: { x: 100, y: 150 }, data: { label: 'Incoming Message', description: 'Triggers when a message is received' } },
      { id: '2', type: 'conditionNode', position: { x: 350, y: 150 }, data: { label: 'Keyword Check', description: 'Checks if contains "pricing"', config: { keyword: 'pricing' } } },
      { id: '3', type: 'actionNode', position: { x: 600, y: 80 }, data: { label: 'AI Response', description: 'Generate smart response using AI', config: { prompt: 'Explain enterprise tier' } } },
      { id: '4', type: 'actionNode', position: { x: 600, y: 280 }, data: { label: 'Send Template', description: 'Send Welcome Template', config: { templateId: 't-1' } } }
    ],
    edges: [
      { id: 'e-1-2', source: '1', target: '2' },
      { id: 'e-2-3', source: '2', target: '3' },
      { id: 'e-2-4', source: '2', target: '4' }
    ],
    createdAt: '2026-05-24T15:00:00Z'
  }
];

export const WhatsFlowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {


  // Start with empty state — real data loads from localStorage (or seed fallback) in useEffect
  const [accounts, setAccounts] = useState<WhatsAppAccount[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string>('');
  const [activeContactId, setActiveContactId] = useState<string>('');

  const [hasLoaded, setHasLoaded] = useState(false);

  // Load from localStorage on mount — fall back to seed data on first visit
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedAccounts = localStorage.getItem('whatsflow_accounts');
      try { setAccounts(storedAccounts ? JSON.parse(storedAccounts) : SEED_ACCOUNTS); } catch (e) { setAccounts(SEED_ACCOUNTS); }

      const storedContacts = localStorage.getItem('whatsflow_contacts');
      try { setContacts(storedContacts ? JSON.parse(storedContacts) : SEED_CONTACTS); } catch (e) { setContacts(SEED_CONTACTS); }

      const storedMessages = localStorage.getItem('whatsflow_messages');
      try { setMessages(storedMessages ? JSON.parse(storedMessages) : SEED_MESSAGES); } catch (e) { setMessages(SEED_MESSAGES); }

      const storedTemplates = localStorage.getItem('whatsflow_templates');
      try { setTemplates(storedTemplates ? JSON.parse(storedTemplates) : SEED_TEMPLATES); } catch (e) { setTemplates(SEED_TEMPLATES); }

      const storedWorkflows = localStorage.getItem('whatsflow_workflows');
      try { setWorkflows(storedWorkflows ? JSON.parse(storedWorkflows) : SEED_WORKFLOWS); } catch (e) { setWorkflows(SEED_WORKFLOWS); }

      const storedActiveAccountId = localStorage.getItem('whatsflow_active_account_id');
      setActiveAccountId(storedActiveAccountId || 'acc-1');

      const storedActiveContactId = localStorage.getItem('whatsflow_active_contact_id');
      setActiveContactId(storedActiveContactId || 'c-1');

      setHasLoaded(true);
    }
  }, []);

  // Save to localStorage when state changes (debounced to avoid thread blocking during drag operations)
  useEffect(() => {
    if (hasLoaded) {
      const handler = setTimeout(() => {
        localStorage.setItem('whatsflow_accounts', JSON.stringify(accounts));
      }, 300);
      return () => clearTimeout(handler);
    }
  }, [accounts, hasLoaded]);

  useEffect(() => {
    if (hasLoaded) {
      const handler = setTimeout(() => {
        localStorage.setItem('whatsflow_contacts', JSON.stringify(contacts));
      }, 300);
      return () => clearTimeout(handler);
    }
  }, [contacts, hasLoaded]);

  useEffect(() => {
    if (hasLoaded) {
      const handler = setTimeout(() => {
        localStorage.setItem('whatsflow_messages', JSON.stringify(messages));
      }, 300);
      return () => clearTimeout(handler);
    }
  }, [messages, hasLoaded]);

  useEffect(() => {
    if (hasLoaded) {
      const handler = setTimeout(() => {
        localStorage.setItem('whatsflow_templates', JSON.stringify(templates));
      }, 300);
      return () => clearTimeout(handler);
    }
  }, [templates, hasLoaded]);

  useEffect(() => {
    if (hasLoaded) {
      const handler = setTimeout(() => {
        localStorage.setItem('whatsflow_workflows', JSON.stringify(workflows));
      }, 200); // Ultra-fast debounce for workflows to keep canvas responsive
      return () => clearTimeout(handler);
    }
  }, [workflows, hasLoaded]);

  useEffect(() => {
    if (hasLoaded) {
      localStorage.setItem('whatsflow_active_account_id', activeAccountId);
    }
  }, [activeAccountId, hasLoaded]);

  useEffect(() => {
    if (hasLoaded) {
      localStorage.setItem('whatsflow_active_contact_id', activeContactId);
      
      // Automatically mark incoming messages as read when focusing the chat thread
      setMessages(prev => prev.map(m => 
        (m.contactId === activeContactId && m.direction === 'INCOMING' && m.status !== 'read')
          ? { ...m, status: 'read' }
          : m
      ));
    }
  }, [activeContactId, hasLoaded]);

  // Webhook Inbox Poller Effect (Syncs live incoming WhatsApp messages with CRM Contacts & Chat History)
  useEffect(() => {
    if (!hasLoaded) return;

    let isPolling = true;

    async function checkWebhookQueue() {
      try {
        const response = await fetch('/api/webhooks/incoming-queue');
        if (!response.ok) return;

        const data = await response.json();
        const incoming = data.queue || [];

        if (incoming.length > 0) {
          console.log('Syncing incoming webhook messages:', incoming);

          // Use React functional state updaters to guarantee freshest states and bypass stale closure bugs
          setContacts(prevContacts => {
            let currentContacts = [...prevContacts];

            setMessages(prevMessages => {
              let currentMessages = [...prevMessages];

              for (const item of incoming) {
                // Check if this is a server-side automation response (outgoing)
                if (item.direction === 'OUTGOING' && item.automationResponse) {
                  const standardizedNumber = item.phoneNumber.replace(/\D/g, '');
                  const contact = currentContacts.find(c => c.phoneNumber.replace(/\D/g, '') === standardizedNumber);
                  if (contact) {
                    const outMsg: Message = {
                      id: item.id || `m-server-auto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                      accountId: activeAccountId || 'acc-1',
                      contactId: contact.id,
                      type: item.type || 'text',
                      body: item.body,
                      direction: 'OUTGOING',
                      status: 'sent',
                      timestamp: item.timestamp || new Date().toISOString(),
                      buttons: item.buttons
                    };
                    if (!currentMessages.some(m => m.id === outMsg.id)) {
                      currentMessages.push(outMsg);
                    }
                  }
                  continue;
                }

                const standardizedNumber = item.phoneNumber.replace(/\D/g, '');
                let contact = currentContacts.find(c => c.phoneNumber.replace(/\D/g, '') === standardizedNumber);

                if (!contact) {
                  const newContactId = `c-webhook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                  contact = {
                    id: newContactId,
                    name: item.senderName || `WhatsApp User (+${item.phoneNumber})`,
                    phoneNumber: item.phoneNumber,
                    label: 'new',
                    status: 'active',
                    leadStatus: 'new',
                    automationEnabled: true,
                    interactions: []
                  };
                  currentContacts.push(contact);
                  console.log('Automatically added new contact to CRM:', contact);
                }

                const msgType = item.type || 'text';
                const newMsg: Message = {
                  id: item.id || `m-webhook-${Date.now()}`,
                  accountId: activeAccountId || 'acc-1',
                  contactId: contact.id,
                  type: msgType,
                  body: item.body,
                  direction: 'INCOMING',
                  status: contact.id === activeContactId ? 'read' : 'delivered',
                  timestamp: item.timestamp || new Date().toISOString()
                };

                // Prevent message duplicates safely
                if (!currentMessages.some(m => m.id === newMsg.id)) {
                  currentMessages.push(newMsg);
                }
              }

              return currentMessages;
            });

            return currentContacts;
          });

          // Acknowledge and clear the server queue
          await fetch('/api/webhooks/incoming-queue', { method: 'DELETE' });
        }
      } catch (err) {
        console.error('Error polling webhook queue:', err);
      }
    }

    const interval = setInterval(() => {
      if (isPolling) checkWebhookQueue();
    }, 1000);

    // Initial check
    checkWebhookQueue();

    return () => {
      isPolling = false;
      clearInterval(interval);
    };
  }, [hasLoaded, activeAccountId, activeContactId]);

  // Refs to avoid stale closures in asynchronous webhook polling
  const contactsRef = useRef(contacts);
  const workflowsRef = useRef(workflows);

  useEffect(() => {
    contactsRef.current = contacts;
    workflowsRef.current = workflows;
  }, [contacts, workflows]);

  // Sync active workflow + account + templates + contacts to server for server-side automation
  useEffect(() => {
    if (!hasLoaded) return;

    const activeWorkflow = workflows.find(w => w.status === 'ACTIVE');
    const activeAccount = accounts.find(a => a.id === activeAccountId);

    // Debounce to avoid flooding the server during rapid edits (e.g., dragging nodes)
    const handler = setTimeout(() => {
      fetch('/api/automation/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow: activeWorkflow || null,
          templates: templates,
          account: activeAccount || null,
          contacts: contacts
        })
      }).then(res => {
        if (res.ok) {
          console.log('[SyncToServer] Automation config synced successfully. Workflow:', activeWorkflow?.name || 'none');
        }
      }).catch(err => {
        console.error('[SyncToServer] Failed to sync automation config:', err);
      });
    }, 1000);

    return () => clearTimeout(handler);
  }, [hasLoaded, workflows, templates, accounts, contacts, activeAccountId]);



  const addAccount = (acc: Omit<WhatsAppAccount, 'id' | 'status' | 'createdAt'>) => {
    const newAcc: WhatsAppAccount = {
      ...acc,
      id: `acc-${Date.now()}`,
      status: 'CONNECTED',
      createdAt: new Date().toISOString()
    };
    setAccounts(prev => [...prev, newAcc]);
    setActiveAccountId(newAcc.id);
  };

  const updateAccount = (id: string, updated: Omit<WhatsAppAccount, 'id' | 'status' | 'createdAt'>) => {
    setAccounts(prev => prev.map(acc => acc.id === id ? { ...acc, ...updated } : acc));
  };

  const deleteAccount = (id: string) => {
    setAccounts(prev => prev.filter(acc => acc.id !== id));
  };

  // Generic Meta WhatsApp API Sender bridge
  const sendMessageToMeta = async (message: Message, extraParams: Record<string, any> = {}) => {
    // Locate credentials of the active account
    const acc = accounts.find(a => a.id === message.accountId);
    const targetContact = contacts.find(c => c.id === message.contactId);

    if (!acc || !targetContact) {
      console.warn('Cannot send message: missing account credentials or target contact.');
      return;
    }

    if (acc.accessToken === 'EAAGb...' || acc.accessToken.length < 20 || acc.appSecret === '••••••••••••••••') {
      console.warn('Cannot send message: account has placeholder credentials. Please configure real API credentials in the Credentials page.');
      return;
    }

    try {
      console.log('Attempting live Meta API outgoing dispatch for:', message);
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumberId: acc.phoneNumberId,
          accessToken: acc.accessToken,
          to: targetContact.phoneNumber,
          body: message.body,
          type: message.type,
          mediaUrl: message.mediaUrl,
          buttons: message.buttons,
          ...extraParams
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to dispatch via Meta APIs');
      }

      console.log('Successfully dispatched live WhatsApp message:', data);
      // Mark as sent successfully
      setMessages(prev => prev.map(m => m.id === message.id ? { ...m, status: 'sent' } : m));
      

    } catch (err: any) {
      console.error('Meta Dispatch failed:', err);
      // Flag message as failed in the UI to notify the user
      setMessages(prev => prev.map(m => m.id === message.id ? { 
        ...m, 
        status: 'failed', 
        body: `${m.body}\n⚠️ (Delivery Failed: ${err.message || 'Check credentials / recipient number'})` 
      } : m));
    }
  };

  const sendTextMessage = (cId: string, body: string) => {
    const newMsg: Message = {
      id: `m-send-${Date.now()}`,
      accountId: activeAccountId,
      contactId: cId,
      type: 'text',
      body,
      direction: 'OUTGOING',
      status: 'sent',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, newMsg]);
    sendMessageToMeta(newMsg);
  };

  const sendMediaMessage = (cId: string, mediaUrl: string, body: string) => {
    const newMsg: Message = {
      id: `m-media-${Date.now()}`,
      accountId: activeAccountId,
      contactId: cId,
      type: 'image',
      body,
      mediaUrl,
      direction: 'OUTGOING',
      status: 'sent',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, newMsg]);
    sendMessageToMeta(newMsg);
  };

  const sendDocumentMessage = (cId: string, mediaUrl: string, fileName: string) => {
    const newMsg: Message = {
      id: `m-doc-${Date.now()}`,
      accountId: activeAccountId,
      contactId: cId,
      type: 'document',
      body: fileName,
      mediaUrl,
      direction: 'OUTGOING',
      status: 'sent',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, newMsg]);
    sendMessageToMeta(newMsg);
  };

  const sendVoiceMessage = (cId: string, mediaUrl: string, duration: string) => {
    const newMsg: Message = {
      id: `m-voice-${Date.now()}`,
      accountId: activeAccountId,
      contactId: cId,
      type: 'voice',
      body: `Voice Mail (${duration})`,
      mediaUrl,
      direction: 'OUTGOING',
      status: 'sent',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, newMsg]);
    sendMessageToMeta(newMsg);
  };

  const sendButtonMessage = (cId: string, body: string, buttons: string[]) => {
    const newMsg: Message = {
      id: `m-btn-${Date.now()}`,
      accountId: activeAccountId,
      contactId: cId,
      type: 'button',
      body,
      buttons,
      direction: 'OUTGOING',
      status: 'sent',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, newMsg]);
    sendMessageToMeta(newMsg);
  };

  const sendTemplateMessage = (cId: string, templateId: string) => {
    const tmpl = templates.find(t => t.id === templateId);
    if (!tmpl) return;

    const newMsg: Message = {
      id: `m-tmpl-${Date.now()}`,
      accountId: activeAccountId,
      contactId: cId,
      type: 'template',
      body: tmpl.bodyText.replace('{{1}}', 'Client'),
      buttons: tmpl.buttons,
      direction: 'OUTGOING',
      status: 'sent',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, newMsg]);
    
    let templateParams: string[] = [];
    const matches = tmpl.bodyText.match(/\{\{\d+\}\}/g);
    if (matches) {
      matches.forEach((match, index) => {
        if (index === 0) templateParams.push('Client');
        else templateParams.push(`Value${index + 1}`);
      });
    }

    sendMessageToMeta(newMsg, { templateId: tmpl.name, templateLanguage: tmpl.language, templateParams });
  };

  const addContact = (ct: Omit<Contact, 'id'>) => {
    setContacts(prev => [...prev, { ...ct, id: `c-${Date.now()}` }]);
  };

  const updateContact = (id: string, updated: Partial<Contact>) => {
    setContacts(prev => prev.map(ct => ct.id === id ? { ...ct, ...updated } : ct));
  };

  const deleteContact = (id: string) => {
    setContacts(prev => prev.filter(ct => ct.id !== id));
  };

  const addTemplate = (tmpl: Omit<Template, 'id' | 'createdAt'>) => {
    setTemplates(prev => [...prev, { ...tmpl, id: `t-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, createdAt: new Date().toISOString() }]);
  };

  const deleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  const addWorkflow = (flow: Omit<Workflow, 'id' | 'createdAt'>) => {
    const newWorkflow: Workflow = {
      ...flow,
      id: `w-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setWorkflows(prev => {
      const next = [...prev, newWorkflow];
      localStorage.setItem('whatsflow_workflows', JSON.stringify(next));
      return next;
    });
    return newWorkflow;
  };

  const updateWorkflow = (id: string, nodes: FlowNode[], edges: FlowEdge[]) => {
    setWorkflows(prev => {
      const next = prev.map(w => w.id === id ? { ...w, nodes, edges } : w);
      localStorage.setItem('whatsflow_workflows', JSON.stringify(next));
      return next;
    });
  };

  const toggleWorkflowStatus = (id: string) => {
    setWorkflows(prev => {
      const targetWorkflow = prev.find(w => w.id === id);
      const isBecomingActive = targetWorkflow?.status !== 'ACTIVE';
      const next = prev.map(w => {
        if (w.id === id) {
          return { ...w, status: (isBecomingActive ? 'ACTIVE' : 'INACTIVE') as 'ACTIVE' | 'INACTIVE' };
        }
        if (isBecomingActive && w.status === 'ACTIVE') {
          return { ...w, status: 'INACTIVE' as 'ACTIVE' | 'INACTIVE' };
        }
        return w;
      });
      localStorage.setItem('whatsflow_workflows', JSON.stringify(next));
      return next;
    });
  };

  const addInteraction = (contactId: string, interaction: Omit<Interaction, 'id' | 'createdAt'>) => {
    setContacts(prev => prev.map(c => {
      if (c.id !== contactId) return c;
      const newInteraction: Interaction = {
        ...interaction,
        id: `int-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      return { ...c, interactions: [...(c.interactions || []), newInteraction] };
    }));
  };

  const clearChat = (contactId: string) => {
    setMessages(prev => prev.filter(m => m.contactId !== contactId));
  };

  return (
    <WhatsFlowContext.Provider value={{
      accounts,
      contacts,
      messages,
      templates,
      workflows,
      activeAccountId,
      setActiveAccountId,
      activeContactId,
      setActiveContactId,
      addAccount,
      updateAccount,
      deleteAccount,
      sendTextMessage,
      sendMediaMessage,
      sendDocumentMessage,
      sendVoiceMessage,
      sendButtonMessage,
      sendTemplateMessage,
      addContact,
      updateContact,
      deleteContact,
      addTemplate,
      deleteTemplate,
      addWorkflow,
      updateWorkflow,
      toggleWorkflowStatus,

      addInteraction,
      clearChat
    }}>
      {hasLoaded ? children : null}
    </WhatsFlowContext.Provider>
  );
};

export const useWhatsFlow = () => {
  const context = useContext(WhatsFlowContext);
  if (!context) {
    throw new Error('useWhatsFlow must be used within a WhatsFlowProvider');
  }
  return context;
};
