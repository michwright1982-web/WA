"use client";

import React, { useState, useEffect, useRef } from 'react';
import { DashboardShell } from '@/components/dashboard-shell';
import { useWhatsFlow, FlowNode } from '@/lib/whatsflow-store';
import { 
  Plus, 
  Trash2, 
  Save, 
  Play, 
  Pause, 
  GitFork, 
  Clock, 
  HelpCircle, 
  Bot, 
  MessageSquareCode, 
  Zap, 
  Database,
  ArrowRight,
  Copy,
  Filter,
  GitBranch,
  Repeat,
  GitMerge,
  Hourglass,
  Shuffle,
  FileText,
  Tag,
  Check,
  Search,
  Download,
  Upload
} from 'lucide-react';

// WhatsApp Business API Actions Node Library Registry
const nodeLibrary = {
  triggers: [
    { subType: 'incoming_text', label: '⚡ Text Message Trigger', desc: 'Triggers when a customer sends a text message.', defaultLabel: 'On Incoming Text', defaultDesc: 'Triggers when a text message matches keyword rules' },
    { subType: 'incoming_button', label: '⚡ Interactive Click', desc: 'Triggers on a quick reply button payload.', defaultLabel: 'On Button Click', defaultDesc: 'Triggers when user clicks interactive buttons' },
    { subType: 'incoming_media', label: '⚡ Media Message Received', desc: 'Triggers when a customer uploads attachments.', defaultLabel: 'On Media Received', defaultDesc: 'Triggers when an image, video, or doc is sent' },
    { subType: 'incoming_status', label: '⚡ Message Status Updates', desc: 'Triggers on delivered/read updates from Meta API.', defaultLabel: 'On Status Receipt', defaultDesc: 'Triggers when outbound status changes' },
  ],
  conditions: [
    { subType: 'keyword_check', label: '🔍 Keyword Match', desc: 'Branches conversation based on keywords.', defaultLabel: 'Check Keywords', defaultDesc: 'Branches depending on keywords matched' },
    { subType: 'data_filter', label: '🔮 Data & Tag Filter', desc: 'Filters contacts, messages or tags based on custom rules.', defaultLabel: 'Filter Contacts', defaultDesc: 'Filter data variables or tags' },
    { subType: 'business_hours', label: '🔍 Business Hours Check', desc: 'Branches on open hours vs closed time windows.', defaultLabel: 'Is Business Open?', defaultDesc: 'Verify business hours vs holiday time' },
    { subType: 'if_else', label: '⌥ If-Else Branching', desc: 'Logical router checking criteria to YES or NO path.', defaultLabel: 'If / Else Logic', defaultDesc: 'Check condition to route yes or no path' },
    { subType: 'while_loop', label: '🔄 Loop Operator', desc: 'Loops connected actions repeatedly under limits.', defaultLabel: 'While Loop Control', defaultDesc: 'Execute connected steps in a loop' },
    { subType: 'merge_paths', label: '🔀 Merge Paths', desc: 'Merge multiple parallel branches back into a single path.', defaultLabel: 'Merge Branch Paths', defaultDesc: 'Consolidate branch flows' },
    { subType: 'switch_logic', label: '🎛️ Multi-Switch Router', desc: 'Matches values against multiple custom keyword outcomes.', defaultLabel: 'Switch Logic Case', defaultDesc: 'Route conversation by multiple cases' },
  ],
  actions: [
    { subType: 'send_message', label: '🟢 Send Message', desc: 'Send a regular text, media, or HSM template to recipient.', defaultLabel: 'Send Message', defaultDesc: 'Meta WhatsApp Send API endpoint' },
    { subType: 'send_buttons', label: '🟢 Send Interactive Buttons', desc: 'Sends quick reply buttons (max 3 options).', defaultLabel: 'Send Reply Buttons', defaultDesc: 'Meta Interactive Buttons API' },
    { subType: 'send_list', label: '🟢 Send Interactive List', desc: 'Sends a single-select menu options list.', defaultLabel: 'Send List Menu', defaultDesc: 'Meta Interactive List API' },
    { subType: 'send_flow', label: '🟢 Send Interactive Flow', desc: 'Sends custom Meta WhatsApp Flow dynamic forms.', defaultLabel: 'Send WhatsApp Flow', defaultDesc: 'Meta Interactive Flow Message API' },
    { subType: 'mark_read', label: '🟢 Mark Inbound as Read', desc: 'Marks current customer message thread as read.', defaultLabel: 'Mark Message Read', defaultDesc: 'Meta Message Status PUT endpoint' },
    { subType: 'ai_assistant', label: '🟢 OpenAI Auto-Reply', desc: 'Generates smart answers using OpenAI GPT-4.', defaultLabel: 'AI Auto-Response', defaultDesc: 'OpenAI GPT-4 Completion Integrator' },
    { subType: 'http_call', label: '🟢 External API Hook', desc: 'Makes custom HTTP POST/GET request to endpoints.', defaultLabel: 'HTTP Webhook Call', defaultDesc: 'Trigger third-party integration webhook' },
    { subType: 'change_label', label: '🟢 Change Contact Label', desc: 'Updates the CRM label for the contact.', defaultLabel: 'Change Contact Label', defaultDesc: 'Modify contact label status' },
    { subType: 'wait_time', label: '⏳ Wait / Delay Timer', desc: 'Pauses step execution for a custom time duration.', defaultLabel: 'Wait / Delay Timer', defaultDesc: 'Pause execution before next step' },
  ]
};

// Helper function to return beautiful, premium matching icon for each node type
const getNodeIcon = (subType: string, type: string) => {
  const props = { className: "h-3.5 w-3.5 shrink-0" };
  switch (subType) {
    // Triggers
    case 'incoming_text': return <MessageSquareCode {...props} className="text-yellow-500" />;
    case 'incoming_button': return <Play {...props} className="text-yellow-500" />;
    case 'incoming_media': return <Database {...props} className="text-yellow-500" />;
    case 'incoming_status': return <Zap {...props} className="text-yellow-500" />;
    // Conditions
    case 'keyword_check': return <HelpCircle {...props} className="text-sky-400" />;
    case 'data_filter': return <Filter {...props} className="text-sky-400" />;
    case 'business_hours': return <Clock {...props} className="text-sky-400" />;
    case 'if_else': return <GitBranch {...props} className="text-sky-400" />;
    case 'while_loop': return <Repeat {...props} className="text-sky-400" />;
    case 'merge_paths': return <GitMerge {...props} className="text-sky-400" />;
    case 'switch_logic': return <Shuffle {...props} className="text-sky-400" />;
    // Actions
    case 'send_message': return <MessageSquareCode {...props} className="text-emerald-400" />;
    case 'send_text': return <MessageSquareCode {...props} className="text-emerald-400" />;
    case 'send_template': return <MessageSquareCode {...props} className="text-emerald-400" />;
    case 'send_media': return <Database {...props} className="text-emerald-400" />;
    case 'send_buttons': return <Play {...props} className="text-emerald-400" />;
    case 'send_list': return <ArrowRight {...props} className="text-emerald-400" />;
    case 'send_flow': return <FileText {...props} className="text-emerald-400" />;
    case 'mark_read': return <Check className={props.className} />;
    case 'ai_assistant': return <Bot className={props.className} />;
    case 'http_call': return <Zap className={props.className} />;
    case 'change_label': return <Tag className={props.className} />;
    case 'wait_time': return <Clock className={props.className} />;
    default:
      if (type === 'triggerNode') return <Zap {...props} className="text-yellow-500" />;
      if (type === 'conditionNode') return <HelpCircle {...props} className="text-sky-400" />;
      return <Play {...props} className="text-emerald-400" />;
  }
};

export default function WorkflowsPage() {
  const { workflows, updateWorkflow, toggleWorkflowStatus, templates, addWorkflow } = useWhatsFlow();
  const [selectedFlowId, setSelectedFlowId] = useState(workflows[0]?.id || '');
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLDivElement>(null);

  // Drag & drop state for matching input borders
  const [draggedOverField, setDraggedOverField] = useState<string | null>(null);

  const handleDrop = (e: React.DragEvent, fieldSetter: (val: string) => void, currentVal: string) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain');
    if (data) {
      fieldSetter(currentVal + data);
    }
  };

  // Find all parent nodes recursively connected upstream
  const getPreviousNodes = (nodeId: string): FlowNode[] => {
    if (!activeWorkflow) return [];
    const directParents = activeWorkflow.edges
      .filter(e => e.target === nodeId)
      .map(e => activeWorkflow.nodes.find(n => n.id === e.source))
      .filter((n): n is FlowNode => !!n);
      
    const allParents: FlowNode[] = [...directParents];
    const visited = new Set<string>([nodeId]);
    const queue = [...directParents];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current.id)) continue;
      visited.add(current.id);
      
      const parents = activeWorkflow.edges
        .filter(e => e.target === current.id)
        .map(e => activeWorkflow.nodes.find(n => n.id === e.source))
        .filter((n): n is FlowNode => !!n && !visited.has(n.id));
        
      allParents.push(...parents);
      queue.push(...parents);
    }
    
    return Array.from(new Set(allParents));
  };

  const getNodeOutputs = (node: FlowNode) => {
    const subType = node.data.config?.subType || '';
    
    if (node.type === 'triggerNode') {
      return [
        { key: '{{msg.body}}', label: 'Message Text', val: 'Hello! I need pricing...', desc: 'Text content of the incoming WhatsApp message' },
        { key: '{{msg.sender}}', label: 'Sender Phone', val: '+1234567890', desc: 'WhatsApp phone number of contact' },
        { key: '{{msg.senderName}}', label: 'Sender Name', val: 'John Doe', desc: 'Profile display name of WhatsApp contact' },
        { key: '{{msg.timestamp}}', label: 'Received At', val: '2026-05-26T11:42:15Z', desc: 'ISO timestamp of trigger event' }
      ];
    }
    
    if (subType === 'ai_assistant') {
      return [
        { key: '{{ai.responseText}}', label: 'AI Answer', val: 'Our enterprise tier starts at...', desc: 'Generated reply text from GPT-4 model' },
        { key: '{{ai.tokensUsed}}', label: 'Tokens Used', val: '142', desc: 'Total completion tokens consumed' }
      ];
    }
    
    if (subType === 'http_call') {
      return [
        { key: '{{http.responseBody}}', label: 'Response JSON', val: '{"status":"success","id":992}', desc: 'Full stringified body returned from HTTP' },
        { key: '{{http.statusCode}}', label: 'HTTP Status', val: '200', desc: 'HTTP response status code' }
      ];
    }

    if (node.type === 'conditionNode') {
      return [
        { key: `{{${node.id}.matchedKeyword}}`, label: 'Matched Key', val: node.data.config?.keyword || 'help', desc: 'Keyword matched triggering this path' }
      ];
    }

    return [
      { key: `{{${node.id}.status}}`, label: 'Execution Status', val: 'success', desc: 'Status code of the step operation' }
    ];
  };

  const activeWorkflow = workflows.find(w => w.id === selectedFlowId) || workflows[0];

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportWorkflow = () => {
    if (!activeWorkflow) return;
    const exportData = {
      version: 'whatsflow-v1',
      name: activeWorkflow.name,
      nodes: activeWorkflow.nodes,
      edges: activeWorkflow.edges
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    const fileName = `${activeWorkflow.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-export.json`;
    downloadAnchor.setAttribute("download", fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json.nodes || !Array.isArray(json.nodes)) {
          alert('Invalid workflow file: missing nodes array.');
          return;
        }
        
        const newFlow = addWorkflow({
          name: json.name ? `${json.name} (Imported)` : 'Imported Workflow',
          status: 'INACTIVE',
          nodes: json.nodes,
          edges: json.edges || []
        });

        if (newFlow && newFlow.id) {
          setSelectedFlowId(newFlow.id);
        }
      } catch (err) {
        alert('Failed to parse workflow file: invalid JSON format.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Drag and drop states
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Drag and connect states
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);
  const [connectingMousePos, setConnectingMousePos] = useState<{ x: number; y: number } | null>(null);
  const [connectingPortType, setConnectingPortType] = useState<string>('default');

  const [hasMovedDuringDrag, setHasMovedDuringDrag] = useState(false);

  // Zoom & Pan states
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const stateRef = useRef({ zoom, panOffset, activeNodeId });
  useEffect(() => {
    stateRef.current = { zoom, panOffset, activeNodeId };
  }, [zoom, panOffset, activeNodeId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (e: WheelEvent) => {
      // If the scroll is over the API actions drawer, allow native scrolling
      if ((e.target as HTMLElement).closest('.api-actions-drawer')) {
        return;
      }

      const { zoom: currentZoom, panOffset: currentPan, activeNodeId: currentActiveNodeId } = stateRef.current;
      if (currentActiveNodeId) return; // Block when popup is open

      e.preventDefault(); // This is the crucial part to prevent page scrolling/zooming!

      if (e.ctrlKey || e.metaKey) {
        // Pinch to zoom (trackpad) or Cmd/Ctrl + Scroll
        const zoomSensitivity = 0.01;
        let newZoom = currentZoom - e.deltaY * zoomSensitivity;
        newZoom = Math.max(0.2, Math.min(3, newZoom));

        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const scaleChange = newZoom - currentZoom;
        const newOffsetX = currentPan.x - ((mouseX - currentPan.x) * (scaleChange / currentZoom));
        const newOffsetY = currentPan.y - ((mouseY - currentPan.y) * (scaleChange / currentZoom));

        setZoom(newZoom);
        setPanOffset({ x: newOffsetX, y: newOffsetY });
      } else {
        // Two-finger trackpad drag for panning
        setPanOffset({
          x: currentPan.x - e.deltaX,
          y: currentPan.y - e.deltaY
        });
      }
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, []);

  const handleMouseDown = (e: React.MouseEvent, node: FlowNode) => {
    if (activeNodeId) return; // Block dragging when popup is open
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.connect-handle')) return;
    
    e.preventDefault();
    setDraggedNodeId(node.id);
    setHasMovedDuringDrag(false); // Reset drag state!
    const canvas = document.getElementById('flow-canvas');
    if (canvas) {
      const canvasRect = canvas.getBoundingClientRect();
      const localMouseX = (e.clientX - canvasRect.left - panOffset.x) / zoom;
      const localMouseY = (e.clientY - canvasRect.top - panOffset.y) / zoom;
      setDragStart({
        x: localMouseX - node.position.x,
        y: localMouseY - node.position.y
      });
    }
  };

  const handleConnectStart = (e: React.MouseEvent, sourceId: string, portType: string = 'default') => {
    if (activeNodeId) setActiveNodeId(null); // Close popup when starting a connection
    e.stopPropagation();
    e.preventDefault();
    setConnectingSourceId(sourceId);
    setConnectingPortType(portType);
    const canvas = document.getElementById('flow-canvas');
    if (canvas) {
      const canvasRect = canvas.getBoundingClientRect();
      const localMouseX = (e.clientX - canvasRect.left - panOffset.x) / zoom;
      const localMouseY = (e.clientY - canvasRect.top - panOffset.y) / zoom;
      setConnectingMousePos({
        x: localMouseX,
        y: localMouseY
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = document.getElementById('flow-canvas');
    if (!canvas) return;
    const canvasRect = canvas.getBoundingClientRect();

    if (draggedNodeId && activeWorkflow) {
      setHasMovedDuringDrag(true); // Actual drag-movement is happening!
      const localMouseX = (e.clientX - canvasRect.left - panOffset.x) / zoom;
      const localMouseY = (e.clientY - canvasRect.top - panOffset.y) / zoom;
      let newX = localMouseX - dragStart.x;
      let newY = localMouseY - dragStart.y;
      
      // Clamp values within a reasonably large virtual workspace limit
      newX = Math.max(10, Math.min(4800, newX));
      newY = Math.max(10, Math.min(4800, newY));

      const updatedNodes = activeWorkflow.nodes.map(n => {
        if (n.id === draggedNodeId) {
          return {
            ...n,
            position: { x: newX, y: newY }
          };
        }
        return n;
      });

      updateWorkflow(activeWorkflow.id, updatedNodes, activeWorkflow.edges);
    } else if (connectingSourceId) {
      const localMouseX = (e.clientX - canvasRect.left - panOffset.x) / zoom;
      const localMouseY = (e.clientY - canvasRect.top - panOffset.y) / zoom;
      setConnectingMousePos({
        x: localMouseX,
        y: localMouseY
      });
    } else if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setDraggedNodeId(null);
    setConnectingSourceId(null);
    setConnectingMousePos(null);
    setIsPanning(false);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (activeNodeId) return; // Block canvas panning when popup is open
    if (e.button !== 0) return;
    // Don't pan if we clicked on a card, button, or port dot
    if ((e.target as HTMLElement).closest('.group') || (e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.connect-handle')) {
      return;
    }
    setIsPanning(true);
    setPanStart({
      x: e.clientX - panOffset.x,
      y: e.clientY - panOffset.y
    });
  };

  const handleNodeMouseUp = (e: React.MouseEvent, targetId: string) => {
    if (connectingSourceId && connectingSourceId !== targetId) {
      e.stopPropagation();
      
      // Allow multiple connections but prevent exact duplicate edges
      const isAlreadyConnected = activeWorkflow.edges.some(
        edge => edge.source === connectingSourceId && edge.target === targetId && (edge as any).port === connectingPortType
      );

      if (!isAlreadyConnected) {
        const newEdge = {
          id: `e-${connectingSourceId}-${targetId}-${connectingPortType}`,
          source: connectingSourceId,
          target: targetId,
          port: connectingPortType
        };
        updateWorkflow(activeWorkflow.id, activeWorkflow.nodes, [...activeWorkflow.edges, newEdge]);
      }
    }
    setConnectingSourceId(null);
    setConnectingMousePos(null);
  };

  // Config editor state fields
  const [configNodeLabel, setConfigNodeLabel] = useState('');
  const [configNodeDesc, setConfigNodeDesc] = useState('');
  const [configKeyword, setConfigKeyword] = useState('');
  const [configMessageText, setConfigMessageText] = useState('');
  const [configTemplateId, setConfigTemplateId] = useState('');
  const [configMediaUrl, setConfigMediaUrl] = useState('');
  const [configButtonOptions, setConfigButtonOptions] = useState('');
  const [configHttpMethod, setConfigHttpMethod] = useState('');
  const [configApiUrl, setConfigApiUrl] = useState('');
  const [configPrompt, setConfigPrompt] = useState('');
  const [configBranches, setConfigBranches] = useState<Array<{ id: string; keyword: string; label: string }>>([]);
  const [isApiActionsExpanded, setIsApiActionsExpanded] = useState(false);
  const [configFilterKey, setConfigFilterKey] = useState('');
  const [configFilterValue, setConfigFilterValue] = useState('');
  const [configWaitDuration, setConfigWaitDuration] = useState('60');
  const [configWaitUnit, setConfigWaitUnit] = useState('seconds');
  const [configFlowHeader, setConfigFlowHeader] = useState('');
  const [configFlowBody, setConfigFlowBody] = useState('');
  const [configFlowFooter, setConfigFlowFooter] = useState('');
  const [configFlowId, setConfigFlowId] = useState('');
  const [configFlowCta, setConfigFlowCta] = useState('');
  const [configFlowScreen, setConfigFlowScreen] = useState('');
  const [configFlowToken, setConfigFlowToken] = useState('');
  const [configFlowPayload, setConfigFlowPayload] = useState('');
  const [configNewLabel, setConfigNewLabel] = useState('');
  const [searchNodeLibraryQuery, setSearchNodeLibraryQuery] = useState('');
  
  // Unified send message config state
  const [configSendOption, setConfigSendOption] = useState<'message' | 'template'>('message');
  const [configMessageFormat, setConfigMessageFormat] = useState<'text' | 'document'>('text');

  const handleSelectNode = (node: FlowNode) => {
    setActiveNodeId(node.id);
    setConfigNodeLabel(node.data.label);
    setConfigNodeDesc(node.data.description || '');
    
    // Bind specific sub-configurations
    const c = node.data.config || {};
    setConfigKeyword(c.keyword || '');
    setConfigMessageText(c.messageText || '');
    setConfigTemplateId(c.templateId || 't-1');
    setConfigMediaUrl(c.mediaUrl || '');
    setConfigButtonOptions(c.buttonOptions || '');
    setConfigHttpMethod(c.httpMethod || 'POST');
    setConfigApiUrl(c.apiUrl || '');
    setConfigPrompt(c.prompt || '');
    setConfigFilterKey(c.filterKey || '{{msg.body}}');
    setConfigFilterValue(c.filterValue || 'vip');
    setConfigWaitDuration(c.waitDuration || '60');
    setConfigWaitUnit(c.waitUnit || 'seconds');
    setConfigFlowHeader(c.flowHeader || 'Welcome to Apptimate One');
    setConfigFlowBody(c.flowBody || 'Fill out your details to start! ✨');
    setConfigFlowFooter(c.flowFooter || 'Team Apptimate');
    setConfigFlowId(c.flowId || '775192158724649');
    setConfigFlowCta(c.flowCta || 'Fill Details');
    setConfigFlowScreen(c.flowScreen || 'QUESTION_ONE');
    setConfigFlowToken(c.flowToken || 'AQAAAAACS5FpgQ_cAAAAAD0QI3s.');
    setConfigFlowPayload(c.flowPayload || '{\n  "product_name": "name",\n  "product_description": "description",\n  "product_price": 100\n}');
    setConfigNewLabel(c.newLabel || 'new');
    setConfigSendOption(c.sendOption || 'message');
    setConfigMessageFormat(c.messageFormat || 'text');

    // Bind dynamic branches for If-Else / Switch nodes
    if (c.subType === 'if_else') {
      setConfigBranches(c.branches || [{ id: 'yes', keyword: c.keyword || 'pricing', label: 'If Pricing' }]);
    } else if (c.subType === 'switch_logic') {
      setConfigBranches(c.branches || [
        { id: 'case_1', keyword: 'sales', label: 'Sales Route' },
        { id: 'case_2', keyword: 'support', label: 'Support Route' }
      ]);
    } else {
      setConfigBranches([]);
    }
  };

  const handleSaveNodeConfig = () => {
    if (!activeNodeId || !activeWorkflow) return;
    
    const updatedNodes = activeWorkflow.nodes.map(n => {
      if (n.id === activeNodeId) {
        const isBranching = n.data.config?.subType === 'if_else' || n.data.config?.subType === 'switch_logic';
        return {
          ...n,
          data: {
            ...n.data,
            label: configNodeLabel,
            description: configNodeDesc,
            config: {
              ...n.data.config,
              keyword: isBranching ? (configBranches[0]?.keyword || configKeyword) : configKeyword,
              messageText: configMessageText,
              templateId: configTemplateId,
              mediaUrl: configMediaUrl,
              buttonOptions: configButtonOptions,
              httpMethod: configHttpMethod,
              apiUrl: configApiUrl,
              prompt: configPrompt,
              filterKey: configFilterKey,
              filterValue: configFilterValue,
              waitDuration: configWaitDuration,
              waitUnit: configWaitUnit,
              flowHeader: configFlowHeader,
              flowBody: configFlowBody,
              flowFooter: configFlowFooter,
              flowId: configFlowId,
              flowCta: configFlowCta,
              flowScreen: configFlowScreen,
              flowToken: configFlowToken,
              flowPayload: configFlowPayload,
              newLabel: configNewLabel,
              sendOption: configSendOption,
              messageFormat: configMessageFormat,
              branches: isBranching ? configBranches : undefined
            }
          }
        };
      }
      return n;
    });

    updateWorkflow(activeWorkflow.id, updatedNodes, activeWorkflow.edges);
    setActiveNodeId(null);
  };

  const handleAddNode = (type: 'trigger' | 'action' | 'condition', subType: string, label: string, desc: string) => {
    if (!activeWorkflow) return;

    const count = activeWorkflow.nodes.length + 1;
    let newX = 100;
    let newY = 150;

    if (activeWorkflow.nodes.length > 0) {
      const lastNode = activeWorkflow.nodes[activeWorkflow.nodes.length - 1];
      const nodeWidth = 280; // Standard node width
      
      newX = lastNode.position.x + nodeWidth + 20;
      newY = lastNode.position.y;
    }

    const newNode: FlowNode = {
      id: `node-${count}`,
      type: type === 'trigger' ? 'triggerNode' : type === 'condition' ? 'conditionNode' : 'actionNode',
      position: { x: newX, y: newY },
      data: {
        label: label,
        description: desc,
        config: {
          subType: subType,
          keyword: '',
          messageText: 'Hello! Thanks for reaching out.',
          templateId: 't-1',
          mediaUrl: '',
          buttonOptions: 'Option 1, Option 2',
          httpMethod: 'POST',
          apiUrl: 'https://api.mybusiness.com/callback',
          prompt: 'You are a helpful AI assistant. Summarize customer inquiries.'
        }
      }
    };

    const updatedNodes = [...activeWorkflow.nodes, newNode];
    
    // Auto draw a line to the previous node to make it visuals beautiful!
    const newEdges = [...activeWorkflow.edges];
    if (activeWorkflow.nodes.length > 0) {
      const prevNode = activeWorkflow.nodes[activeWorkflow.nodes.length - 1];
      newEdges.push({
        id: `e-${prevNode.id}-${newNode.id}`,
        source: prevNode.id,
        target: newNode.id
      });
    }

    updateWorkflow(activeWorkflow.id, updatedNodes, newEdges);
    handleSelectNode(newNode);
  };

  const handleDeleteNode = (id: string) => {
    if (!activeWorkflow) return;
    const updatedNodes = activeWorkflow.nodes.filter(n => n.id !== id);
    const updatedEdges = activeWorkflow.edges.filter(e => e.source !== id && e.target !== id);
    updateWorkflow(activeWorkflow.id, updatedNodes, updatedEdges);
    setActiveNodeId(null);
  };

  const handleCopyNode = (node: FlowNode) => {
    if (!activeWorkflow) return;
    
    const copiedNode: FlowNode = {
      id: `node-${Date.now()}`,
      type: node.type,
      position: {
        x: Math.min(node.position.x + 40, 800),
        y: Math.min(node.position.y + 40, 500)
      },
      data: {
        ...node.data,
        label: `${node.data.label} (Copy)`,
        config: {
          ...node.data.config
        }
      }
    };

    const updatedNodes = [...activeWorkflow.nodes, copiedNode];
    updateWorkflow(activeWorkflow.id, updatedNodes, activeWorkflow.edges);
    handleSelectNode(copiedNode);
  };

  return (
    <DashboardShell>
      <input
        type="file"
        ref={fileInputRef}
        accept=".json"
        onChange={handleFileImport}
        className="hidden"
      />
      <div className="space-y-4 w-full h-[calc(100vh-64px)] flex flex-col max-w-none -m-8 p-6 bg-zinc-950/20 relative overflow-hidden">
        
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/60 p-4 border border-zinc-800 rounded-xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300">
              <GitFork className="h-5 w-5" />
            </div>
            <div>
              <select
                value={selectedFlowId}
                onChange={(e) => setSelectedFlowId(e.target.value)}
                className="bg-transparent text-sm font-semibold text-zinc-100 focus:outline-none cursor-pointer"
              >
                {workflows.map(w => (
                  <option key={w.id} value={w.id} className="bg-zinc-900">{w.name}</option>
                ))}
              </select>
              <p className="text-[10px] text-zinc-500 mt-0.5">Drag nodes to position, click to edit properties</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportWorkflow}
              className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-850 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white font-semibold transition-all cursor-pointer"
              title="Download this workflow as a JSON file"
            >
              <Download className="h-3.5 w-3.5 text-indigo-400" /> Download
            </button>

            <button
              onClick={handleImportClick}
              className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-850 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white font-semibold transition-all cursor-pointer"
              title="Import a workflow JSON file"
            >
              <Upload className="h-3.5 w-3.5 text-emerald-450" /> Import
            </button>

            <button
              onClick={() => toggleWorkflowStatus(activeWorkflow.id)}
              className={`text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold transition-all ${
                activeWorkflow?.status === 'ACTIVE'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
              }`}
            >
              {activeWorkflow?.status === 'ACTIVE' ? (
                <>
                  <Pause className="h-3.5 w-3.5 fill-current" /> Active (Running)
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" /> Inactive (Stopped)
                </>
              )}
            </button>

            <button
              onClick={() => handleAddNode('action', 'send_text', 'Send Text Message', 'Meta WhatsApp Text API endpoint')}
              className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black hover:bg-zinc-200 font-bold transition-all shadow-md"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" /> Add Step
            </button>
          </div>
        </div>

        {/* Workspace Canvas with Floating Right-to-Left Drawer */}
        <div className="flex-1 flex gap-6 items-stretch min-h-0 overflow-hidden pb-4 relative">
          
          {/* Node Editor Canvas */}
          <div 
            id="flow-canvas"
            ref={canvasRef}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="flex-1 border border-zinc-800 rounded-2xl bg-zinc-950/60 relative overflow-hidden bg-grid-pattern shadow-inner flex flex-col justify-between cursor-grab active:cursor-grabbing"
          >
            
            {/* Legend / Info widget overlay */}
            <div className="absolute top-4 left-4 z-10 flex gap-2 select-none">
              <div className="text-[10px] bg-zinc-900 border border-zinc-800/80 px-2.5 py-1 rounded text-zinc-400 font-medium">
                🟡 Trigger Node
              </div>
              <div className="text-[10px] bg-zinc-900 border border-zinc-800/80 px-2.5 py-1 rounded text-zinc-400 font-medium">
                🔵 Condition checking
              </div>
              <div className="text-[10px] bg-zinc-900 border border-zinc-800/80 px-2.5 py-1 rounded text-zinc-400 font-medium">
                🟢 Action nodes
              </div>
            </div>

            {/* Zoomable & Pannable Viewport container */}
            <div 
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                transformOrigin: 'top left',
                width: '5000px',
                height: '5000px',
              }}
              className="absolute top-0 left-0 select-none"
            >

            {/* Custom Interactive SVG Connections Canvas */}
            <div className="absolute inset-0 pointer-events-none">
              <svg className="w-full h-full">
                <defs>
                  <linearGradient id="edge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#38bdf8" />
                  </linearGradient>
                </defs>
                {activeWorkflow?.edges.map((edge) => {
                  const srcNode = activeWorkflow.nodes.find(n => n.id === edge.source);
                  const destNode = activeWorkflow.nodes.find(n => n.id === edge.target);
                  if (!srcNode || !destNode) return null;
                  
                  const nodeWidth = 208; // w-52 = 208px
                  
                  // Calculate source node height for vertical center
                  const srcSubType = srcNode.data.config?.subType || '';
                  const isSrcBranching = srcSubType === 'if_else' || srcSubType === 'switch_logic';
                  const srcBranches = srcNode.data.config?.branches || (srcSubType === 'if_else' ? [
                    { id: 'yes', keyword: srcNode.data.config?.keyword || 'pricing', label: 'If Pricing' }
                  ] : srcSubType === 'switch_logic' ? [
                    { id: 'case_1', keyword: 'sales', label: 'Sales Route' },
                    { id: 'case_2', keyword: 'support', label: 'Support Route' }
                  ] : []);
                  const srcHeight = isSrcBranching ? (66 + (srcBranches.length + 1) * 32) : 80;
                  
                  // Connect from RIGHT-CENTER of source node
                  const x1 = srcNode.position.x + nodeWidth;
                  
                  // Determine vertical offset based on port type
                  let y1 = srcNode.position.y + (srcHeight / 2);  // default: exact vertical center
                  if (isSrcBranching) {
                    let portIndex = srcBranches.findIndex((b: any) => b.id === (edge as any).port);
                    if (portIndex === -1 && ((edge as any).port === 'else' || (edge as any).port === 'no')) {
                      portIndex = srcBranches.length; // Else is at the bottom
                    }
                    if (portIndex === -1) portIndex = 0;
                    const rowHeight = 28;
                    const rowGap = 4;
                    const listTop = 60;
                    y1 = srcNode.position.y + listTop + portIndex * (rowHeight + rowGap) + (rowHeight / 2);
                  }
                  
                  // Calculate destination node height for vertical center
                  const isDestBranching = destNode.data.config?.subType === 'if_else' || destNode.data.config?.subType === 'switch_logic';
                  const destBranches = destNode.data.config?.branches || (destNode.data.config?.subType === 'if_else' ? [{ id: 'yes', keyword: destNode.data.config?.keyword || 'pricing', label: 'If Pricing' }] : destNode.data.config?.subType === 'switch_logic' ? [{ id: 'case_1', keyword: 'sales', label: 'Sales Route' }, { id: 'case_2', keyword: 'support', label: 'Support Route' }] : []);
                  const destHeight = isDestBranching 
                    ? (66 + (destBranches.length + 1) * 32) 
                    : 80;
                  
                  // Connect to LEFT-CENTER of target node
                  const x2 = destNode.position.x;
                  const y2 = destNode.position.y + (destHeight / 2);

                  // Define curve path stroke colors based on port type
                  let strokeColor = "url(#edge-gradient)";
                  let glowColor = "rgba(99, 102, 241, 0.12)";
                  if (isSrcBranching) {
                    if (edge.port === 'else' || edge.port === 'no') {
                      strokeColor = "#f43f5e";
                      glowColor = "rgba(244, 63, 94, 0.15)";
                    } else {
                      strokeColor = "#10b981";
                      glowColor = "rgba(16, 185, 129, 0.15)";
                    }
                  }

                  return (
                    <g key={edge.id}>
                      {/* Background Glow path */}
                      <path
                        d={`M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}`}
                        stroke={glowColor}
                        strokeWidth="6"
                        fill="none"
                      />
                      {/* Main connection path */}
                      <path
                        d={`M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}`}
                        stroke={strokeColor}
                        strokeWidth="2"
                        fill="none"
                      />
                      <circle cx={x1} cy={y1} r="3" fill={isSrcBranching ? ((edge.port === 'else' || edge.port === 'no') ? '#f43f5e' : '#10b981') : '#6366f1'} />
                      <circle cx={x2} cy={y2} r="3.5" fill="#38bdf8" />
                    </g>
                  );
                })}

                {/* Live Dragging Connection Curve Preview */}
                {connectingSourceId && connectingMousePos && (() => {
                  const srcNode = activeWorkflow.nodes.find(n => n.id === connectingSourceId);
                  if (!srcNode) return null;
                  const nodeWidth = 208;
                  const x1 = srcNode.position.x + nodeWidth;
                  
                  const srcSubType = srcNode.data.config?.subType || '';
                  const isSrcBranching = srcSubType === 'if_else' || srcSubType === 'switch_logic';
                  const srcBranches = srcNode.data.config?.branches || (srcSubType === 'if_else' ? [
                    { id: 'yes', keyword: srcNode.data.config?.keyword || 'pricing', label: 'If Pricing' }
                  ] : srcSubType === 'switch_logic' ? [
                    { id: 'case_1', keyword: 'sales', label: 'Sales Route' },
                    { id: 'case_2', keyword: 'support', label: 'Support Route' }
                  ] : []);
                  const srcHeight = isSrcBranching ? (66 + (srcBranches.length + 1) * 32) : 80;
                  
                  let y1 = srcNode.position.y + (srcHeight / 2);
                  if (isSrcBranching) {
                    let portIndex = srcBranches.findIndex((b: any) => b.id === connectingPortType);
                    if (portIndex === -1 && (connectingPortType === 'else' || connectingPortType === 'no')) {
                      portIndex = srcBranches.length;
                    }
                    if (portIndex === -1) portIndex = 0;
                    const rowHeight = 28;
                    const rowGap = 4;
                    const listTop = 60;
                    y1 = srcNode.position.y + listTop + portIndex * (rowHeight + rowGap) + (rowHeight / 2);
                  }

                  const x2 = connectingMousePos.x;
                  const y2 = connectingMousePos.y;
                  return (
                    <path
                      d={`M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}`}
                      stroke={connectingPortType === 'else' || connectingPortType === 'no' ? '#f43f5e' : '#10b981'}
                      strokeWidth="2"
                      fill="none"
                    />
                  );
                })()}
              </svg>
            </div>

            {/* Actual Interactive Node Blocks */}
            <div className="absolute inset-0">
              {/* Midpoint interactive connection delete buttons on the bezier curve */}
              {activeWorkflow?.edges.map((edge) => {
                const srcNode = activeWorkflow.nodes.find(n => n.id === edge.source);
                const destNode = activeWorkflow.nodes.find(n => n.id === edge.target);
                if (!srcNode || !destNode) return null;
                
                const nodeWidth = 208;
                const srcSubType = srcNode.data.config?.subType || '';
                const isSrcBranching = srcSubType === 'if_else' || srcSubType === 'switch_logic';
                const srcBranches = srcNode.data.config?.branches || (srcSubType === 'if_else' ? [
                  { id: 'yes', keyword: srcNode.data.config?.keyword || 'pricing', label: 'If Pricing' }
                ] : srcSubType === 'switch_logic' ? [
                  { id: 'case_1', keyword: 'sales', label: 'Sales Route' },
                  { id: 'case_2', keyword: 'support', label: 'Support Route' }
                ] : []);
                const srcHeight = isSrcBranching ? (66 + (srcBranches.length + 1) * 32) : 80;
                
                const x1 = srcNode.position.x + nodeWidth;
                let y1 = srcNode.position.y + (srcHeight / 2);
                if (isSrcBranching) {
                  let portIndex = srcBranches.findIndex((b: any) => b.id === edge.port);
                  if (portIndex === -1 && (edge.port === 'else' || edge.port === 'no')) {
                    portIndex = srcBranches.length;
                  }
                  if (portIndex === -1) portIndex = 0;
                  const rowHeight = 28;
                  const rowGap = 4;
                  const listTop = 60;
                  y1 = srcNode.position.y + listTop + portIndex * (rowHeight + rowGap) + (rowHeight / 2);
                }

                const destBranches = destNode.data.config?.branches || (destNode.data.config?.subType === 'if_else' ? [{ id: 'yes', keyword: destNode.data.config?.keyword || 'pricing', label: 'If Pricing' }] : destNode.data.config?.subType === 'switch_logic' ? [{ id: 'case_1', keyword: 'sales', label: 'Sales Route' }, { id: 'case_2', keyword: 'support', label: 'Support Route' }] : []);
                const isDestBranching = destNode.data.config?.subType === 'if_else' || destNode.data.config?.subType === 'switch_logic';
                const destHeight = isDestBranching 
                  ? (66 + (destBranches.length + 1) * 32) 
                  : 80;
                const x2 = destNode.position.x;
                const y2 = destNode.position.y + (destHeight / 2);
                
                // Calculate actual bezier curve midpoint at t=0.5 for cubic bezier
                const cp1x = (x1 + x2) / 2;
                const cp1y = y1;
                const cp2x = (x1 + x2) / 2;
                const cp2y = y2;
                const t = 0.5;
                const bezMidX = Math.pow(1-t,3)*x1 + 3*Math.pow(1-t,2)*t*cp1x + 3*(1-t)*Math.pow(t,2)*cp2x + Math.pow(t,3)*x2;
                const bezMidY = Math.pow(1-t,3)*y1 + 3*Math.pow(1-t,2)*t*cp1y + 3*(1-t)*Math.pow(t,2)*cp2y + Math.pow(t,3)*y2;

                return (
                  <button
                    key={`del-${edge.id}`}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const updatedEdges = activeWorkflow.edges.filter(e => e.id !== edge.id);
                      updateWorkflow(activeWorkflow.id, activeWorkflow.nodes, updatedEdges);
                    }}
                    style={{ left: `${bezMidX - 9}px`, top: `${bezMidY - 9}px` }}
                    className="absolute h-4.5 w-4.5 bg-zinc-950 hover:bg-red-950/90 border border-zinc-800 hover:border-red-500/80 text-zinc-400 hover:text-red-400 rounded-full flex items-center justify-center font-bold text-[9px] transition-all shadow-[0_2px_10px_rgba(0,0,0,0.9)] cursor-pointer select-none z-30"
                    title="Delete Connection"
                  >
                    ×
                  </button>
                );
              })}

              {activeWorkflow?.nodes.map((node) => {
                const isSelected = node.id === activeNodeId;
                const nodeColors = 
                  node.type === 'triggerNode' 
                    ? 'border-yellow-500/30 bg-yellow-500/5 hover:border-yellow-500/80' 
                    : node.type === 'conditionNode' 
                      ? 'border-sky-500/30 bg-sky-500/5 hover:border-sky-500/80' 
                      : 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/80';

                const isBranching = node.data.config?.subType === 'if_else' || node.data.config?.subType === 'switch_logic';
                const branches = node.data.config?.branches || (node.data.config?.subType === 'if_else' ? [{ id: 'yes', keyword: node.data.config?.keyword || 'pricing', label: 'If Pricing' }] : node.data.config?.subType === 'switch_logic' ? [{ id: 'case_1', keyword: 'sales', label: 'Sales Route' }, { id: 'case_2', keyword: 'support', label: 'Support Route' }] : []);
                const nodeHeight = isBranching 
                  ? (66 + (branches.length + 1) * 32) 
                  : 80;

                return (
                  <div
                    key={node.id}
                    onClick={(e) => {
                      if (!hasMovedDuringDrag) {
                        handleSelectNode(node);
                      }
                    }}
                    onMouseDown={(e) => handleMouseDown(e, node)}
                    onMouseUp={(e) => handleNodeMouseUp(e, node.id)}
                    style={{ 
                      left: `${node.position.x}px`, 
                      top: `${node.position.y}px`,
                      minHeight: isBranching ? `${nodeHeight}px` : undefined 
                    }}
                    className={`group absolute w-52 rounded-xl p-3 border cursor-grab active:cursor-grabbing select-none shadow-[0_4px_20px_rgba(0,0,0,0.6)] ${nodeColors} ${
                     isSelected ? 'ring-2 ring-indigo-500 scale-[1.03] border-glow' : ''
                    } transition-[border-color,background-color,box-shadow,transform] duration-200`}
                  >
                    {/* Left Hand Side Input Port Handle Dot — centered vertically */}
                    <div 
                      style={{ top: `${isBranching ? (nodeHeight / 2) : (80 / 2)}px` }}
                      className="absolute left-[-6px] -translate-y-1/2 h-3 w-3 bg-sky-400 border-2 border-zinc-950 rounded-full shadow-[0_0_8px_rgba(56,189,248,0.6)] z-25 pointer-events-none"
                      title="Incoming connection port"
                    />

                    {/* Drag-and-Connect Right Handle Node Port for non-branching nodes — centered vertically */}
                    {!isBranching && (
                      <div 
                        onMouseDown={(e) => handleConnectStart(e, node.id, 'default')}
                        style={{ top: `${80 / 2}px` }}
                        className="connect-handle absolute right-[-6px] -translate-y-1/2 h-3.5 w-3.5 bg-indigo-500 border-2 border-zinc-950 rounded-full cursor-crosshair hover:bg-white hover:scale-125 transition-all shadow-[0_0_8px_rgba(99,102,241,0.6)] z-25"
                        title="Drag to connect next step"
                      />
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                        {node.type.replace('Node', '')}
                      </span>
                      <div className={`flex items-center gap-1 z-25 transition-opacity duration-150 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyNode(node);
                          }}
                          className="text-zinc-500 hover:text-indigo-400 p-0.5 rounded transition-colors"
                          title="Duplicate Step Node"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNode(node.id);
                          }}
                          className="text-zinc-500 hover:text-red-400 p-0.5 rounded transition-colors"
                          title="Delete Node"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Title with matching Dynamic Icon */}
                    <div className="flex items-center gap-1.5 mt-1">
                      {getNodeIcon(node.data.config?.subType || '', node.type)}
                      <h4 className="text-xs font-bold text-zinc-100 truncate">{node.data.label}</h4>
                    </div>
                    
                    {isBranching ? (
                      <div className="mt-2 space-y-1 select-none">
                        {branches.map((b: any) => (
                          <div key={b.id} className="relative h-7 text-[8px] bg-zinc-900/60 border border-zinc-800/80 rounded px-2 text-zinc-300 flex items-center justify-between gap-1">
                            <span className="font-semibold text-emerald-400 truncate max-w-[70px]">{b.label}</span>
                            <span className="text-[8px] text-zinc-500 font-mono truncate max-w-[65px]">"{b.keyword}"</span>
                            <div 
                              onMouseDown={(e) => handleConnectStart(e, node.id, b.id)}
                              className="connect-handle absolute right-[-18.5px] top-1/2 -translate-y-1/2 h-3.5 w-3.5 bg-emerald-500 border-2 border-zinc-950 rounded-full cursor-crosshair hover:bg-white hover:scale-125 transition-all shadow-[0_0_8px_rgba(16,185,129,0.6)] z-25 flex items-center justify-center"
                              title={`Drag to connect branch: ${b.label}`}
                            />
                          </div>
                        ))}
                        <div className="relative h-7 text-[8px] bg-zinc-900/60 border border-zinc-800/80 border-dashed rounded px-2 text-zinc-400 font-semibold italic flex items-center justify-between">
                          <span>Else / No Match</span>
                          <div 
                            onMouseDown={(e) => handleConnectStart(e, node.id, 'else')}
                            className="connect-handle absolute right-[-18.5px] top-1/2 -translate-y-1/2 h-3.5 w-3.5 bg-rose-500 border-2 border-zinc-950 rounded-full cursor-crosshair hover:bg-white hover:scale-125 transition-all shadow-[0_0_8px_rgba(244,63,94,0.6)] z-25 flex items-center justify-center"
                            title="Drag to connect Else branch"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">{node.data.description}</p>
                        {node.data.config?.keyword && (
                          <div className="mt-2 text-[9px] bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 inline-block text-sky-400 font-mono">
                            Key: {node.data.config.keyword}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            
            </div> {/* Close Zoomable & Pannable Viewport container */}

            {/* Zoom / Pan Toolbar Controls */}
            <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1 bg-zinc-900/90 border border-zinc-800 p-1.5 rounded-xl select-none backdrop-blur-md">
              <button
                onClick={() => setZoom(z => Math.max(0.4, z - 0.1))}
                className="h-7 w-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center font-bold text-sm cursor-pointer select-none transition-colors"
                title="Zoom Out"
              >
                -
              </button>
              <span className="text-[10px] text-zinc-400 font-mono font-bold px-2 min-w-[44px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(z => Math.min(2.0, z + 0.1))}
                className="h-7 w-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center font-bold text-sm cursor-pointer select-none transition-colors"
                title="Zoom In"
              >
                +
              </button>
              <button
                onClick={() => {
                  setZoom(1);
                  setPanOffset({ x: 0, y: 0 });
                }}
                className="text-[9px] font-bold px-2.5 py-1 bg-zinc-800 hover:bg-indigo-600 hover:text-white text-zinc-400 rounded-lg transition-colors cursor-pointer select-none h-7 flex items-center"
                title="Reset Zoom & Pan Viewport"
              >
                Reset View
              </button>
              <div className="text-[8px] text-zinc-500 max-w-[90px] border-l border-zinc-800 pl-2 leading-none">
                Drag empty canvas to Pan
              </div>
            </div>

            {/* Right-to-Left Sliding WhatsApp API Actions Drawer (Confined to Canvas) */}
            <div 
              className={`api-actions-drawer absolute top-0 right-0 h-full border-l border-zinc-800 bg-zinc-900/95 backdrop-blur-md shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-30 transition-all duration-300 flex flex-col ${
                isApiActionsExpanded ? 'w-80' : 'w-12'
              }`}
            >
              {/* Collapse / Expand Toggle Tab */}
              <button
                onClick={() => setIsApiActionsExpanded(!isApiActionsExpanded)}
                className="p-3 bg-zinc-900 border-b border-zinc-800/80 hover:bg-zinc-850 text-indigo-400 hover:text-indigo-300 flex items-center justify-center gap-2 font-bold text-xs transition-all cursor-pointer select-none"
              >
                <Bot className="h-4.5 w-4.5" />
                {isApiActionsExpanded && <span className="truncate text-zinc-100">WhatsApp API Actions</span>}
              </button>

              {isApiActionsExpanded ? (
                <div className="flex-1 flex flex-col p-5 overflow-y-auto space-y-5 min-h-0">
                  {/* Search Bar */}
                  <div className="relative shrink-0">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Search actions..."
                      value={searchNodeLibraryQuery}
                      onChange={(e) => setSearchNodeLibraryQuery(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
                    />
                  </div>

                  {/* Node Templates List - Categorized by type */}
                  <div className="space-y-6 flex-1">
                    {(() => {
                      const q = searchNodeLibraryQuery.toLowerCase();
                      const triggers = nodeLibrary.triggers.filter(t => t.label.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q));
                      const conditions = nodeLibrary.conditions.filter(c => c.label.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q));
                      const actions = nodeLibrary.actions.filter(a => a.label.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q));

                      return (
                        <>
                          {/* Triggers Category */}
                          {triggers.length > 0 && (
                            <div>
                              <span className="text-[9px] font-bold text-yellow-500 uppercase tracking-widest block mb-3">⚡ Trigger Events</span>
                              <div className="space-y-2">
                                {triggers.map(t => (
                                  <button
                                    key={t.subType}
                                    onClick={() => {
                                      handleAddNode('trigger', t.subType, t.defaultLabel, t.defaultDesc);
                                      setIsApiActionsExpanded(false);
                                      setSearchNodeLibraryQuery('');
                                    }}
                                    className="w-full text-left bg-zinc-900/40 hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-yellow-500/40 p-3 rounded-xl transition-all duration-200 cursor-pointer group hover:shadow-[0_4px_20px_rgba(234,179,8,0.1)] flex items-start gap-3"
                                  >
                                    <div className="h-8 w-8 rounded-lg bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-zinc-800 transition-transform duration-300">
                                      {getNodeIcon(t.subType, 'triggerNode')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-[11px] font-bold text-zinc-200 group-hover:text-yellow-400 transition-colors">
                                        {t.label.replace('⚡ ', '')}
                                      </div>
                                      <div className="text-[9px] text-zinc-500 mt-1 line-clamp-2 leading-relaxed">{t.desc}</div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Conditions Category */}
                          {conditions.length > 0 && (
                            <div>
                              <span className="text-[9px] font-bold text-sky-400 uppercase tracking-widest block mb-3">🔍 Logical Conditions</span>
                              <div className="space-y-2">
                                {conditions.map(c => (
                                  <button
                                    key={c.subType}
                                    onClick={() => {
                                      handleAddNode('condition', c.subType, c.defaultLabel, c.defaultDesc);
                                      setIsApiActionsExpanded(false);
                                      setSearchNodeLibraryQuery('');
                                    }}
                                    className="w-full text-left bg-zinc-900/40 hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-sky-500/40 p-3 rounded-xl transition-all duration-200 cursor-pointer group hover:shadow-[0_4px_20px_rgba(56,189,248,0.1)] flex items-start gap-3"
                                  >
                                    <div className="h-8 w-8 rounded-lg bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-zinc-800 transition-transform duration-300">
                                      {getNodeIcon(c.subType, 'conditionNode')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-[11px] font-bold text-zinc-200 group-hover:text-sky-400 transition-colors">
                                        {c.label.replace(/[^\w\s-]/g, '').trim()}
                                      </div>
                                      <div className="text-[9px] text-zinc-500 mt-1 line-clamp-2 leading-relaxed">{c.desc}</div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Actions Category */}
                          {actions.length > 0 && (
                            <div>
                              <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest block mb-3">🟢 Action Operations</span>
                              <div className="space-y-2">
                                {actions.map(a => (
                                  <button
                                    key={a.subType}
                                    onClick={() => {
                                      handleAddNode('action', a.subType, a.defaultLabel, a.defaultDesc);
                                      setIsApiActionsExpanded(false);
                                      setSearchNodeLibraryQuery('');
                                    }}
                                    className="w-full text-left bg-zinc-900/40 hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-emerald-500/40 p-3 rounded-xl transition-all duration-200 cursor-pointer group hover:shadow-[0_4px_20px_rgba(52,211,153,0.1)] flex items-start gap-3"
                                  >
                                    <div className="h-8 w-8 rounded-lg bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-zinc-800 transition-transform duration-300">
                                      {getNodeIcon(a.subType, 'actionNode')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-[11px] font-bold text-zinc-200 group-hover:text-emerald-400 transition-colors">
                                        {a.label.replace('🟢 ', '')}
                                      </div>
                                      <div className="text-[9px] text-zinc-500 mt-1 line-clamp-2 leading-relaxed">{a.desc}</div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {triggers.length === 0 && conditions.length === 0 && actions.length === 0 && (
                            <div className="text-center py-10">
                              <p className="text-[10px] text-zinc-500">No actions found matching "{searchNodeLibraryQuery}"</p>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  <div className="border-t border-zinc-800/80 pt-3 text-center">
                    <p className="text-[9px] text-zinc-500 max-w-[200px] mx-auto leading-normal">
                      Select a card template to instantly append it to your active canvas flow.
                    </p>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => setIsApiActionsExpanded(true)}
                  className="flex-1 flex items-center justify-center [writing-mode:vertical-lr] select-none py-6 cursor-pointer hover:bg-zinc-850/30 transition-colors"
                >
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold rotate-180 flex items-center gap-1.5">
                    Expand API Actions ◀
                  </span>
                </div>
              )}
            </div>

            {/* Dynamic Configure Node Modal Dialog Pop-up (Confined inside Canvas) */}
            {activeNodeId && activeWorkflow && (() => {
              const node = activeWorkflow.nodes.find(n => n.id === activeNodeId);
              if (!node) return null;
              const subType = node.data.config?.subType || '';

              return (
                <div className="absolute inset-0 bg-black/75 backdrop-blur-sm z-40 flex items-center justify-center p-4">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl shadow-[0_10px_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90%]">
                    
                    {/* Modal Header */}
                    <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                      <div className="flex items-center gap-3">
                        <div className="h-8.5 w-8.5 rounded-lg bg-zinc-850 border border-zinc-800 flex items-center justify-center text-zinc-300">
                          {getNodeIcon(node.data.config?.subType || '', node.type)}
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-zinc-100">Configure Node Settings</h3>
                          <p className="text-[9px] text-zinc-500 font-mono mt-0.5">{node.id} ({node.type.replace('Node', '')})</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopyNode(node)}
                          className="text-[9px] flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 hover:text-indigo-400 text-zinc-300 rounded-lg border border-zinc-700 transition-colors font-semibold cursor-pointer"
                          title="Duplicate this node"
                        >
                          <Copy className="h-3 w-3" /> Duplicate
                        </button>
                        <button
                          onClick={() => setActiveNodeId(null)}
                          className="text-zinc-500 hover:text-white px-2 py-0.5 rounded-lg hover:bg-zinc-850 hover:border-zinc-700 transition-all cursor-pointer font-bold text-xs"
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    {/* Modal Body: Split into Upstream Data Explorer (Left) and Configuration Settings (Right) */}
                    <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden bg-zinc-900/40">
                      
                      {/* Left Column: N8N Drag-and-Drop Upstream Data Explorer */}
                      <div className="w-full md:w-80 border-r border-zinc-800 bg-zinc-950/40 p-5 overflow-y-auto min-h-0 flex flex-col space-y-4">
                        <div>
                          <h4 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5 uppercase tracking-wider">
                            <Bot className="h-4 w-4 text-indigo-400 animate-pulse" /> Upstream Flow Data
                          </h4>
                          <p className="text-[9px] text-zinc-500 leading-normal mt-1">
                            Drag any output pills below and drop them directly inside the right settings input fields to reference dynamic data.
                          </p>
                        </div>

                        {(() => {
                          const prevNodes = getPreviousNodes(node.id);
                          if (prevNodes.length === 0) {
                            return (
                              <div className="text-[10px] text-zinc-500 italic p-3 bg-zinc-900/20 rounded-xl border border-zinc-850 text-center leading-normal">
                                ℹ️ No parent nodes connected yet. Link this step to a Trigger or Action to drag output variables!
                              </div>
                            );
                          }

                          return (
                            <div className="space-y-3.5">
                              {prevNodes.map(prevNode => {
                                const outputs = getNodeOutputs(prevNode);
                                return (
                                  <div key={prevNode.id} className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-3 space-y-2">
                                    <div className="flex items-center justify-between border-b border-zinc-800/40 pb-1.5">
                                      <span className="text-[9px] font-bold text-zinc-300 truncate max-w-[130px]" title={prevNode.data.label}>
                                        {prevNode.data.label}
                                      </span>
                                      <span className="text-[8px] font-mono bg-zinc-850 px-1.5 py-0.5 rounded text-zinc-500">
                                        {prevNode.id}
                                      </span>
                                    </div>
                                    <div className="space-y-1.5">
                                      {outputs.map(out => (
                                        <div
                                          key={out.key}
                                          draggable
                                          onDragStart={(e) => {
                                            e.dataTransfer.setData('text/plain', out.key);
                                            e.dataTransfer.effectAllowed = 'copy';
                                          }}
                                          className="group/pill flex items-center justify-between gap-1.5 bg-zinc-950 hover:bg-indigo-950/30 border border-zinc-850 hover:border-indigo-500/40 p-1.5 rounded-lg text-[9px] cursor-grab active:cursor-grabbing transition-all select-none"
                                          title={`${out.desc}\nExample: ${out.val}`}
                                        >
                                          <div className="flex items-center gap-1.5 truncate">
                                            <span className="text-[8px] text-indigo-400 font-mono">⚡</span>
                                            <span className="font-bold text-zinc-300 font-mono truncate">{out.key}</span>
                                          </div>
                                          <span className="text-[8px] text-zinc-500 font-medium group-hover/pill:text-indigo-400 transition-colors">
                                            {out.label}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Right Column: Node Settings form fields */}
                      <div className="flex-1 p-5 overflow-y-auto min-h-0 space-y-3.5">
                        
                        <div>
                          <label className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">Step Label</label>
                          <input
                            type="text"
                            value={configNodeLabel}
                            onChange={(e) => setConfigNodeLabel(e.target.value)}
                            onDragOver={(e) => e.preventDefault()}
                            onDragEnter={() => setDraggedOverField('nodeLabel')}
                            onDragLeave={() => setDraggedOverField(null)}
                            onDrop={(e) => {
                              handleDrop(e, setConfigNodeLabel, configNodeLabel);
                              setDraggedOverField(null);
                            }}
                            className={`w-full bg-zinc-950 border rounded-lg p-2 text-xs text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all ${
                              draggedOverField === 'nodeLabel' ? 'border-indigo-500 ring-2 ring-indigo-500/50 shadow-[0_0_12px_rgba(99,102,241,0.4)]' : 'border-zinc-800'
                            }`}
                          />
                        </div>

                        <div>
                          <label className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">Description</label>
                          <textarea
                            rows={2}
                            value={configNodeDesc}
                            onChange={(e) => setConfigNodeDesc(e.target.value)}
                            onDragOver={(e) => e.preventDefault()}
                            onDragEnter={() => setDraggedOverField('nodeDesc')}
                            onDragLeave={() => setDraggedOverField(null)}
                            onDrop={(e) => {
                              handleDrop(e, setConfigNodeDesc, configNodeDesc);
                              setDraggedOverField(null);
                            }}
                            className={`w-full bg-zinc-950 border rounded-lg p-2 text-xs text-white resize-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all ${
                              draggedOverField === 'nodeDesc' ? 'border-indigo-500 ring-2 ring-indigo-500/50 shadow-[0_0_12px_rgba(99,102,241,0.4)]' : 'border-zinc-800'
                            }`}
                          />
                        </div>

                        {/* Subtype-specific dynamic configuration fields based on WhatsApp API Action type */}
                        {(() => {
                          if (subType === 'incoming_text' || subType === 'keyword_check') {
                            return (
                              <div>
                                <label className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">Keyword Trigger Condition</label>
                                <input
                                  type="text"
                                  value={configKeyword}
                                  onChange={(e) => setConfigKeyword(e.target.value)}
                                  onDragOver={(e) => e.preventDefault()}
                                  onDragEnter={() => setDraggedOverField('keyword')}
                                  onDragLeave={() => setDraggedOverField(null)}
                                  onDrop={(e) => {
                                    handleDrop(e, setConfigKeyword, configKeyword);
                                    setDraggedOverField(null);
                                  }}
                                  placeholder="e.g. pricing, plan, help"
                                  className={`w-full bg-zinc-950 border rounded-lg p-2 text-xs text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all ${
                                    draggedOverField === 'keyword' ? 'border-indigo-500 ring-2 ring-indigo-500/50 shadow-[0_0_12px_rgba(99,102,241,0.4)]' : 'border-zinc-800'
                                  }`}
                                />
                                <p className="text-[8px] text-zinc-500 mt-1">If customer message matches this keyword phrase, take this route.</p>
                              </div>
                            );
                          }

                          if (subType === 'send_message') {
                            const selectedTmpl = templates.find(t => t.id === configTemplateId);
                            return (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3 bg-zinc-900/50 p-2 rounded-xl border border-zinc-800">
                                  <button
                                    type="button"
                                    onClick={() => setConfigSendOption('message')}
                                    className={`py-2 px-3 rounded-lg text-[10px] font-bold transition-all ${configSendOption === 'message' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-zinc-500 hover:text-zinc-300'}`}
                                  >
                                    Send Message
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfigSendOption('template')}
                                    className={`py-2 px-3 rounded-lg text-[10px] font-bold transition-all ${configSendOption === 'template' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-zinc-500 hover:text-zinc-300'}`}
                                  >
                                    Send Template
                                  </button>
                                </div>

                                {configSendOption === 'message' ? (
                                  <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                      <label className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                          type="radio"
                                          checked={configMessageFormat === 'text'}
                                          onChange={() => setConfigMessageFormat('text')}
                                          className="text-indigo-500 bg-zinc-950 border-zinc-800 focus:ring-indigo-500"
                                        />
                                        <span className="text-[10px] font-medium text-zinc-300 group-hover:text-white transition-colors">Text</span>
                                      </label>
                                      <label className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                          type="radio"
                                          checked={configMessageFormat === 'document'}
                                          onChange={() => setConfigMessageFormat('document')}
                                          className="text-indigo-500 bg-zinc-950 border-zinc-800 focus:ring-indigo-500"
                                        />
                                        <span className="text-[10px] font-medium text-zinc-300 group-hover:text-white transition-colors">Document / Media</span>
                                      </label>
                                    </div>

                                    {configMessageFormat === 'document' && (
                                      <div>
                                        <label className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">Media URL (HTTPS)</label>
                                        <input
                                          type="text"
                                          value={configMediaUrl}
                                          onChange={(e) => setConfigMediaUrl(e.target.value)}
                                          onDragOver={(e) => e.preventDefault()}
                                          onDragEnter={() => setDraggedOverField('mediaUrl')}
                                          onDragLeave={() => setDraggedOverField(null)}
                                          onDrop={(e) => {
                                            handleDrop(e, setConfigMediaUrl, configMediaUrl);
                                            setDraggedOverField(null);
                                          }}
                                          placeholder="e.g. https://domain.com/file.pdf"
                                          className={`w-full bg-zinc-950 border rounded-lg p-2 text-xs text-white font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all ${
                                            draggedOverField === 'mediaUrl' ? 'border-indigo-500 ring-2 ring-indigo-500/50 shadow-[0_0_12px_rgba(99,102,241,0.4)]' : 'border-zinc-800'
                                          }`}
                                        />
                                      </div>
                                    )}

                                    <div>
                                      <label className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">Message Text {configMessageFormat === 'document' ? '(Caption)' : ''}</label>
                                      <textarea
                                        rows={3}
                                        value={configMessageText}
                                        onChange={(e) => setConfigMessageText(e.target.value)}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDragEnter={() => setDraggedOverField('messageText')}
                                        onDragLeave={() => setDraggedOverField(null)}
                                        onDrop={(e) => {
                                          handleDrop(e, setConfigMessageText, configMessageText);
                                          setDraggedOverField(null);
                                        }}
                                        placeholder="Type your WhatsApp message..."
                                        className={`w-full bg-zinc-950 border rounded-lg p-2 text-xs text-white resize-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all ${
                                          draggedOverField === 'messageText' ? 'border-indigo-500 ring-2 ring-indigo-500/50 shadow-[0_0_12px_rgba(99,102,241,0.4)]' : 'border-zinc-800'
                                        }`}
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-4">
                                    <div>
                                      <label className="text-[9px] text-zinc-500 uppercase font-bold block mb-1.5">Select Meta HSM Template</label>
                                      <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
                                        {templates.length === 0 && (
                                          <div className="text-[10px] text-zinc-500 italic p-3 bg-zinc-950/50 rounded-xl border border-zinc-850 text-center">
                                            No templates found.
                                          </div>
                                        )}
                                        {templates.map(tmpl => {
                                          const isSelected = tmpl.id === configTemplateId;
                                          return (
                                            <button
                                              key={tmpl.id}
                                              type="button"
                                              onClick={() => setConfigTemplateId(tmpl.id)}
                                              className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                                                isSelected
                                                  ? 'bg-indigo-950/40 border-indigo-500/50 ring-1 ring-indigo-500/30'
                                                  : 'bg-zinc-950 border-zinc-850 hover:bg-zinc-900/60'
                                              }`}
                                            >
                                              <div className="text-[10px] font-bold text-zinc-200 truncate mb-1">{tmpl.name}</div>
                                              <p className="text-[9px] text-zinc-500 line-clamp-1">{tmpl.bodyText}</p>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    {selectedTmpl && (
                                      <div className="bg-zinc-950/60 border border-zinc-850 rounded-xl p-3">
                                        <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Preview</div>
                                        <p className="text-[10px] text-zinc-200 leading-relaxed whitespace-pre-wrap">{selectedTmpl.bodyText}</p>
                                      </div>
                                    )}

                                    <div>
                                      <label className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">Body Parameter Value ({"{{1}}"})</label>
                                      <input
                                        type="text"
                                        value={configMessageText}
                                        onChange={(e) => setConfigMessageText(e.target.value)}
                                        placeholder="e.g. Client Name"
                                        className="w-full bg-zinc-950 border-zinc-800 rounded-lg p-2 text-xs text-white focus:border-indigo-500 focus:outline-none border"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          }

                          if (subType === 'send_flow') {
                            return (
                              <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-3">
                                  <div>
                                    <label className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">Header Text</label>
                                    <input
                                      type="text"
                                      value={configFlowHeader}
                                      onChange={(e) => setConfigFlowHeader(e.target.value)}
                                      placeholder="e.g. Welcome"
                                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">Footer Text</label>
                                    <input
                                      type="text"
                                      value={configFlowFooter}
                                      onChange={(e) => setConfigFlowFooter(e.target.value)}
                                      placeholder="e.g. Team"
                                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">Button CTA Text</label>
                                    <input
                                      type="text"
                                      value={configFlowCta}
                                      onChange={(e) => setConfigFlowCta(e.target.value)}
                                      placeholder="e.g. Fill Details"
                                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">Body Text Content</label>
                                  <textarea
                                    rows={2}
                                    value={configFlowBody}
                                    onChange={(e) => setConfigFlowBody(e.target.value)}
                                    placeholder="Fill out your details to start! ✨"
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-white resize-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                  />
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                  <div>
                                    <label className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">Flow ID (Meta Platform)</label>
                                    <input
                                      type="text"
                                      value={configFlowId}
                                      onChange={(e) => setConfigFlowId(e.target.value)}
                                      placeholder="e.g. 775192158724649"
                                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">Initial Screen ID</label>
                                    <input
                                      type="text"
                                      value={configFlowScreen}
                                      onChange={(e) => setConfigFlowScreen(e.target.value)}
                                      placeholder="e.g. QUESTION_ONE"
                                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">Flow Token</label>
                                    <input
                                      type="text"
                                      value={configFlowToken}
                                      onChange={(e) => setConfigFlowToken(e.target.value)}
                                      placeholder="AQAAAAA..."
                                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">Dynamic Payload JSON</label>
                                  <textarea
                                    rows={3}
                                    value={configFlowPayload}
                                    onChange={(e) => setConfigFlowPayload(e.target.value)}
                                    placeholder='{"product_name": "name"}'
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-white font-mono resize-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                  />
                                </div>

                                <div className="bg-zinc-950/40 p-2.5 rounded border border-zinc-850 text-[9px] text-zinc-400 leading-normal">
                                  💡 **Meta Interactive Flow Message**: Dynamically opens native WhatsApp Forms (Flows) inside the chat window for beautiful booking, signup, or questionnaire collection.
                                </div>
                              </div>
                            );
                          }



                          if (subType === 'send_buttons') {
                            return (
                              <div>
                                <label className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">Reply Buttons (Max 3, comma separated)</label>
                                <input
                                  type="text"
                                  value={configButtonOptions}
                                  onChange={(e) => setConfigButtonOptions(e.target.value)}
                                  onDragOver={(e) => e.preventDefault()}
                                  onDragEnter={() => setDraggedOverField('buttonOptions')}
                                  onDragLeave={() => setDraggedOverField(null)}
                                  onDrop={(e) => {
                                    handleDrop(e, setConfigButtonOptions, configButtonOptions);
                                    setDraggedOverField(null);
                                  }}
                                  placeholder="e.g. Confirm Order, Talk to Rep, Later"
                                  className={`w-full bg-zinc-950 border rounded-lg p-2 text-xs text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all ${
                                    draggedOverField === 'buttonOptions' ? 'border-indigo-500 ring-2 ring-indigo-500/50 shadow-[0_0_12px_rgba(99,102,241,0.4)]' : 'border-zinc-800'
                                  }`}
                                />
                                <p className="text-[8px] text-zinc-500 mt-1">Rendered as interactive click responses in chat apps.</p>
                              </div>
                            );
                          }

                          if (subType === 'http_call') {
                            return (
                              <div className="space-y-3">
                                <div>
                                  <label className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">HTTP Method</label>
                                  <select
                                    value={configHttpMethod}
                                    onChange={(e) => setConfigHttpMethod(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                  >
                                    <option value="POST">POST Endpoint</option>
                                    <option value="GET">GET Endpoint</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">Endpoint Callback URL</label>
                                  <input
                                    type="text"
                                    value={configApiUrl}
                                    onChange={(e) => setConfigApiUrl(e.target.value)}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDragEnter={() => setDraggedOverField('apiUrl')}
                                    onDragLeave={() => setDraggedOverField(null)}
                                    onDrop={(e) => {
                                      handleDrop(e, setConfigApiUrl, configApiUrl);
                                      setDraggedOverField(null);
                                    }}
                                    placeholder="https://api.domain.com/incoming"
                                    className={`w-full bg-zinc-950 border rounded-lg p-2 text-xs text-white font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all ${
                                      draggedOverField === 'apiUrl' ? 'border-indigo-500 ring-2 ring-indigo-500/50 shadow-[0_0_12px_rgba(99,102,241,0.4)]' : 'border-zinc-800'
                                    }`}
                                  />
                                </div>
                              </div>
                            );
                          }

                          if (subType === 'change_label') {
                            return (
                              <div>
                                <label className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">New Assigned Label</label>
                                <select
                                  value={configNewLabel}
                                  onChange={(e) => setConfigNewLabel(e.target.value)}
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                >
                                  <option value="new">new</option>
                                  <option value="language selected">language selected</option>
                                  <option value="flow filled">flow filled</option>
                                </select>
                                <p className="text-[8px] text-zinc-500 mt-1">Select the label to assign to the contact when this step executes.</p>
                              </div>
                            );
                          }

                          if (subType === 'ai_assistant') {
                            return (
                              <div>
                                <label className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">System Instructions Prompt</label>
                                <textarea
                                  rows={3}
                                  value={configPrompt}
                                  onChange={(e) => setConfigPrompt(e.target.value)}
                                  onDragOver={(e) => e.preventDefault()}
                                  onDragEnter={() => setDraggedOverField('aiPrompt')}
                                  onDragLeave={() => setDraggedOverField(null)}
                                  onDrop={(e) => {
                                    handleDrop(e, setConfigPrompt, configPrompt);
                                    setDraggedOverField(null);
                                  }}
                                  placeholder="Instruct the AI helper how to answer..."
                                  className={`w-full bg-zinc-950 border rounded-lg p-2 text-xs text-white resize-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all ${
                                    draggedOverField === 'aiPrompt' ? 'border-indigo-500 ring-2 ring-indigo-500/50 shadow-[0_0_12px_rgba(99,102,241,0.4)]' : 'border-zinc-800'
                                  }`}
                                />
                                <p className="text-[8px] text-zinc-500 mt-1">E.g., You are a support bot representing WhatsFlow platform...</p>
                              </div>
                            );
                          }

                          if (subType === 'if_else' || subType === 'switch_logic') {
                            return (
                              <div className="space-y-4">
                                <div>
                                  <label className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">Condition Router Type</label>
                                  <select className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none">
                                    <option>{subType === 'if_else' ? 'Boolean IF / ELSE Statement' : 'Multi-Case Expression Matcher'}</option>
                                  </select>
                                </div>
                                
                                <div className="space-y-2">
                                  <label className="text-[9px] text-zinc-500 uppercase font-bold flex justify-between items-center">
                                    <span>Outcome Branches / Router cases</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newBranchId = `branch-${Date.now()}`;
                                        const newBranchNum = configBranches.length + 1;
                                        setConfigBranches([
                                          ...configBranches,
                                          { id: newBranchId, keyword: `case${newBranchNum}`, label: `Case ${newBranchNum}` }
                                        ]);
                                      }}
                                      className="text-[8px] bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-0.5 rounded cursor-pointer transition-colors"
                                    >
                                      + Add Outcome Case
                                    </button>
                                  </label>
                                  
                                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                                    {configBranches.map((branch, index) => (
                                      <div key={branch.id} className="bg-zinc-950/80 p-2.5 rounded-lg border border-zinc-850 space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                          <span className="text-[8px] font-mono text-zinc-500 uppercase font-bold">Case Branch #{index + 1}</span>
                                          {configBranches.length > 1 && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setConfigBranches(configBranches.filter(b => b.id !== branch.id));
                                              }}
                                              className="text-[8px] text-red-400 hover:text-red-300 font-semibold cursor-pointer"
                                              title="Remove branch"
                                            >
                                              Remove
                                            </button>
                                          )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                          <div>
                                            <label className="text-[8px] text-zinc-500 uppercase block mb-0.5">Port Label</label>
                                            <input
                                              type="text"
                                              value={branch.label}
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                setConfigBranches(configBranches.map(b => b.id === branch.id ? { ...b, label: val } : b));
                                              }}
                                              placeholder="e.g. Sales"
                                              className="w-full bg-zinc-900 border border-zinc-800 rounded p-1 text-[10px] text-white focus:outline-none"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-[8px] text-zinc-500 uppercase block mb-0.5">Keyword Match</label>
                                            <input
                                              type="text"
                                              value={branch.keyword}
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                setConfigBranches(configBranches.map(b => b.id === branch.id ? { ...b, keyword: val } : b));
                                              }}
                                              placeholder="e.g. pricing, quote"
                                              className="w-full bg-zinc-900 border border-zinc-800 rounded p-1 text-[10px] text-white focus:outline-none"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="bg-zinc-950/40 p-2 rounded border border-zinc-850 text-[8px] text-zinc-400 leading-normal">
                                  💡 **Dynamic Switch Branching**: For each case outcome added above, you get a customized green output port on the canvas node card. Inbound customer messages matching the keyword dynamically route directly to that port. Unmatched messages route to the final red **Else** port.
                                </div>
                              </div>
                            );
                          }

                          if (subType === 'data_filter') {
                            return (
                              <div className="space-y-4">
                                <div>
                                  <label className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">Target Variable to Filter</label>
                                  <input
                                    type="text"
                                    value={configFilterKey}
                                    onChange={(e) => setConfigFilterKey(e.target.value)}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDragEnter={() => setDraggedOverField('filterKey')}
                                    onDragLeave={() => setDraggedOverField(null)}
                                    onDrop={(e) => {
                                      handleDrop(e, setConfigFilterKey, configFilterKey);
                                      setDraggedOverField(null);
                                    }}
                                    placeholder="e.g. {{msg.body}}"
                                    className={`w-full bg-zinc-950 border rounded-lg p-2 text-xs text-white focus:border-indigo-500 focus:outline-none transition-all ${
                                      draggedOverField === 'filterKey' ? 'border-indigo-500 ring-2 ring-indigo-500/50' : 'border-zinc-800'
                                    }`}
                                  />
                                </div>

                                <div>
                                  <label className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">Comparison Operator</label>
                                  <select className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none">
                                    <option>Contains Phrase</option>
                                    <option>Exactly Matches</option>
                                    <option>Starts With</option>
                                    <option>Exists / Is Not Empty</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">Comparison Value / Rule</label>
                                  <input
                                    type="text"
                                    value={configFilterValue}
                                    onChange={(e) => setConfigFilterValue(e.target.value)}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDragEnter={() => setDraggedOverField('filterVal')}
                                    onDragLeave={() => setDraggedOverField(null)}
                                    onDrop={(e) => {
                                      handleDrop(e, setConfigFilterValue, configFilterValue);
                                      setDraggedOverField(null);
                                    }}
                                    placeholder="e.g. VIP"
                                    className={`w-full bg-zinc-950 border rounded-lg p-2 text-xs text-white focus:border-indigo-500 focus:outline-none transition-all ${
                                      draggedOverField === 'filterVal' ? 'border-indigo-500 ring-2 ring-indigo-500/50' : 'border-zinc-800'
                                    }`}
                                  />
                                </div>

                                <div className="bg-zinc-950/40 p-2 rounded border border-zinc-850 text-[8px] text-zinc-400 leading-normal">
                                  🔮 **Filter Operator**: Selectively lets the workflow proceed only when custom variable checks or specific metadata tags are successfully validated.
                                </div>
                              </div>
                            );
                          }

                          if (subType === 'merge_paths') {
                            return (
                              <div className="space-y-3">
                                <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800 space-y-2">
                                  <h5 className="text-[10px] font-bold text-zinc-300">🔀 Path Concurrence Engine</h5>
                                  <p className="text-[9px] text-zinc-500 leading-normal">
                                    This node acts as a collection point. It consolidates multiple dynamic parallel streams, branches, or conditional logical outcomes back into a single unified step.
                                  </p>
                                </div>
                                <div className="bg-zinc-950/40 p-2.5 rounded border border-zinc-850 text-[9px] text-zinc-400 leading-normal">
                                  💡 No custom configurations are required. Connect multiple outputs to its incoming handle dot.
                                </div>
                              </div>
                            );
                          }

                          if (subType === 'wait_time') {
                            return (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">Delay Duration</label>
                                    <input
                                      type="number"
                                      value={configWaitDuration}
                                      onChange={(e) => setConfigWaitDuration(e.target.value)}
                                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">Time Unit</label>
                                    <select
                                      value={configWaitUnit}
                                      onChange={(e) => setConfigWaitUnit(e.target.value)}
                                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none cursor-pointer"
                                    >
                                      <option value="seconds">Seconds</option>
                                      <option value="minutes">Minutes</option>
                                      <option value="hours">Hours</option>
                                      <option value="days">Days</option>
                                    </select>
                                  </div>
                                </div>
                                <div className="bg-zinc-950/40 p-2.5 rounded border border-zinc-850 text-[9px] text-zinc-400 leading-normal">
                                  ⏳ **Timer Operator**: Temporarily pauses step processing before resuming the downstream sequence after duration matches.
                                </div>
                              </div>
                            );
                          }

                          if (subType === 'while_loop') {
                            return (
                              <div className="space-y-3">
                                <div>
                                  <label className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">Max Iterations (Loop Limit)</label>
                                  <input
                                    type="number"
                                    defaultValue={3}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                                  />
                                  <p className="text-[8px] text-zinc-500 mt-1">To protect Meta message budgets, loops are capped at this limit.</p>
                                </div>
                                <div className="bg-zinc-950/40 p-2.5 rounded border border-zinc-850 text-[9px] text-zinc-400 leading-normal">
                                  🔄 **Loop Operator**: Automatically cycles connected steps repeatedly until conditions are broken.
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div className="bg-zinc-950/40 p-3 rounded-lg border border-zinc-850 text-[10px] text-zinc-500 leading-normal">
                              ℹ️ This node uses WhatsApp standard system behaviors. No custom configurations are required.
                            </div>
                          );
                        })()}
                        
                      </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="p-4 bg-zinc-950/40 border-t border-zinc-800 flex justify-end gap-2">
                      <button 
                        onClick={() => setActiveNodeId(null)}
                        className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleSaveNodeConfig}
                        className="px-5 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black font-bold text-xs shadow-md transition-all cursor-pointer"
                      >
                        Save Changes
                      </button>
                    </div>

                  </div>
                </div>
              );
            })()}

          </div>

        </div>

      </div>
    </DashboardShell>
  );
}
