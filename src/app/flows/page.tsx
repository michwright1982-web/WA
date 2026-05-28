"use client";

import React, { useState } from 'react';
import { DashboardShell } from '@/components/dashboard-shell';
import { useWhatsFlow } from '@/lib/whatsflow-store';
import { 
  FileText, 
  Plus, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  X, 
  Smartphone, 
  Edit, 
  Copy, 
  Check, 
  Search, 
  ChevronRight,
  Eye,
  Settings,
  ShieldAlert
} from 'lucide-react';

export default function FlowsPage() {
  const { flows, addFlow, deleteFlow, accounts, activeAccountId } = useWhatsFlow();
  const activeAccount = accounts.find(a => a.id === activeAccountId);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editFlowId, setEditFlowId] = useState<string | null>(null);

  // Form states
  const [flowName, setFlowName] = useState('');
  const [flowIdInput, setFlowIdInput] = useState('');
  const [flowCategory, setFlowCategory] = useState('MARKETING');
  const [flowStatus, setFlowStatus] = useState('DRAFT');
  
  // Interactive Simulator layout simulator state
  const [simulatorTitle, setSimulatorTitle] = useState('Interactive Survey');
  const [simulatorBody, setSimulatorBody] = useState('Welcome! Please select your service category below.');
  const [simulatorFields, setSimulatorFields] = useState<string[]>([
    'Full Name',
    'Preferred Contact Time',
    'Requested Services'
  ]);
  const [newFieldName, setNewFieldName] = useState('');

  // UI state
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPreviewFlow, setSelectedPreviewFlow] = useState<any | null>(null);

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddField = () => {
    const text = newFieldName.trim();
    if (!text) return;
    setSimulatorFields([...simulatorFields, text]);
    setNewFieldName('');
  };

  const handleRemoveField = (idx: number) => {
    setSimulatorFields(simulatorFields.filter((_, i) => i !== idx));
  };

  const handleOpenAdd = () => {
    setEditFlowId(null);
    setFlowName('');
    setFlowIdInput('');
    setFlowCategory('MARKETING');
    setFlowStatus('DRAFT');
    setSimulatorTitle('Lead Qualification Flow');
    setSimulatorBody('Tell us more about your business needs so we can customize your package.');
    setSimulatorFields(['Full Name', 'Business Website', 'Monthly Budget']);
    setShowAddModal(true);
  };

  const handleOpenEdit = (flow: any) => {
    setEditFlowId(flow.id);
    setFlowName(flow.name);
    setFlowIdInput(flow.id);
    setFlowCategory(flow.categories?.[0] || 'MARKETING');
    setFlowStatus(flow.status);
    // Preset simulator defaults if edited
    setSimulatorTitle(flow.name);
    setSimulatorBody('Please complete the following details:');
    setSimulatorFields(['Contact Name', 'Preferred Medium', 'Callback Notes']);
    setShowAddModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!flowName || !flowIdInput) return;

    if (editFlowId) {
      deleteFlow(editFlowId);
    }

    addFlow({
      id: flowIdInput.trim(),
      name: flowName.trim(),
      status: flowStatus,
      categories: [flowCategory]
    });

    setShowAddModal(false);
    setEditFlowId(null);
  };

  const handleSyncFromMeta = async () => {
    const btn = document.getElementById('sync-flows-manager-btn');
    if (!activeAccount || !activeAccount.businessAccountId || !activeAccount.accessToken) {
      alert('Please configure a WhatsApp account with a Business Account ID and Access Token to sync real flows from Meta.');
      return;
    }

    if (btn) btn.innerHTML = 'Syncing from Meta...';

    try {
      const response = await fetch(`https://graph.facebook.com/v20.0/${activeAccount.businessAccountId}/flows`, {
        headers: {
          'Authorization': `Bearer ${activeAccount.accessToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch from Meta Graph API');
      }
      
      const data = await response.json();
      const metaFlows = data.data || [];
      
      metaFlows.forEach((f: any) => {
        if (!flows.some(existing => existing.id === f.id)) {
          addFlow({
            id: f.id,
            name: f.name,
            status: f.status,
            categories: f.categories || ['MARKETING']
          });
        }
      });
      
      if (btn) btn.innerHTML = 'Flows Synced!';
    } catch (error) {
      console.error('Error syncing flows:', error);
      if (btn) btn.innerHTML = 'Error';
      alert('Error syncing flows from Meta API. Please check your credentials and connection.');
    } finally {
      setTimeout(() => {
        if (btn) btn.innerHTML = 'Sync from Meta';
      }, 2000);
    }
  };

  const filteredFlows = flows.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.id.includes(searchQuery)
  );

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-6xl">
        
        {/* Actions header panel */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/60 p-4 border border-zinc-800 rounded-xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-200">Meta WhatsApp Flows Manager</h2>
              <p className="text-[10px] text-zinc-500 mt-0.5">Manage, preview, and build interactive WhatsApp forms</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button 
              id="sync-flows-manager-btn"
              onClick={handleSyncFromMeta}
              className="text-xs flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 text-zinc-300 hover:text-white transition-all font-medium flex-1 sm:flex-initial"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Sync from Meta
            </button>
            <button 
              onClick={handleOpenAdd}
              className="text-xs flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black hover:bg-zinc-200 font-bold transition-all shadow-md flex-1 sm:flex-initial"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" /> Create Flow
            </button>
          </div>
        </div>

        {/* Search filter utility bar */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search synced flows by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-900/40 border border-zinc-850 rounded-xl text-xs text-white focus:outline-none focus:border-zinc-700 transition-colors"
          />
        </div>

        {/* Flows list grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredFlows.map(flow => {
            const statusColors = 
              flow.status === 'PUBLISHED' 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : flow.status === 'DRAFT' 
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                  : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';

            const StatusIcon = 
              flow.status === 'PUBLISHED' 
                ? CheckCircle 
                : Clock;

            return (
              <div key={flow.id} className="glow-card bg-zinc-900/40 rounded-xl p-5 backdrop-blur-md flex flex-col justify-between min-h-[14rem]">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] bg-zinc-800 border border-zinc-700/80 px-2 py-0.5 rounded text-zinc-400 font-bold uppercase tracking-wider">
                      {flow.categories?.[0] || 'UTILITY'}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 border ${statusColors}`}>
                      <StatusIcon className="h-3 w-3" /> {flow.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-zinc-100 mt-3 truncate">{flow.name}</h3>
                  <p className="text-[10px] text-zinc-500 font-mono mt-1 flex items-center gap-1">
                    ID: {flow.id}
                    <button 
                      onClick={() => handleCopyId(flow.id)}
                      className="text-zinc-600 hover:text-zinc-300 p-0.5 transition-colors"
                      title="Copy Flow ID"
                    >
                      {copiedId === flow.id ? (
                        <Check className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </p>

                  <div className="mt-4 bg-zinc-950/40 border border-zinc-850 rounded-lg p-2.5 flex items-center gap-2 text-[10px] text-zinc-400">
                    <Smartphone className="h-4 w-4 text-indigo-400" />
                    <span>Includes Form Layout Mockup Screen</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-850 flex items-center justify-between">
                  <button 
                    onClick={() => setSelectedPreviewFlow(flow)}
                    className="text-[10px] bg-zinc-800 hover:bg-zinc-700 border border-zinc-750 px-2.5 py-1 rounded text-zinc-300 hover:text-white font-semibold transition-colors flex items-center gap-1"
                  >
                    <Eye className="h-3 w-3" /> Preview Form
                  </button>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleOpenEdit(flow)}
                      className="text-zinc-500 hover:text-zinc-200 transition-colors p-1"
                      title="Edit Flow Meta details"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      onClick={() => deleteFlow(flow.id)}
                      className="text-zinc-500 hover:text-red-400 transition-colors p-1"
                      title="Delete local flow representation"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Visual Live Interactive Simulator Modal overlay for Form preview */}
        {selectedPreviewFlow && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-850 rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200 relative">
              <button 
                onClick={() => setSelectedPreviewFlow(null)} 
                className="absolute top-4 right-4 text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
                  <Smartphone className="h-4 w-4" /> WhatsApp Native Form Simulator
                </div>
                
                <h3 className="text-sm font-bold text-zinc-200 truncate">{selectedPreviewFlow.name}</h3>

                {/* Mobile Frame Container Mockup */}
                <div className="bg-zinc-950 border-4 border-zinc-800 rounded-3xl p-4 min-h-[300px] flex flex-col justify-between text-left shadow-inner">
                  
                  {/* Status Bar */}
                  <div className="flex justify-between items-center text-[9px] text-zinc-600 font-mono pb-2 border-b border-zinc-900">
                    <span>WhatsFlow</span>
                    <span>10:42 AM</span>
                  </div>

                  {/* Body text content */}
                  <div className="flex-1 py-4 space-y-3">
                    <div className="text-[11px] font-bold text-zinc-300">
                      Welcome to {selectedPreviewFlow.name}!
                    </div>
                    <div className="text-[10px] text-zinc-500 leading-normal">
                      This native WhatsApp Flow form collects customer input directly inside the message window.
                    </div>

                    {/* Mock Input Fields */}
                    <div className="space-y-2.5 pt-2">
                      <div>
                        <span className="text-[9px] text-zinc-500 block mb-1">Full Name</span>
                        <div className="bg-zinc-900 border border-zinc-850 rounded p-1.5 text-[10px] text-zinc-400 font-mono">
                          Jane Doe
                        </div>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-500 block mb-1">Business Email</span>
                        <div className="bg-zinc-900 border border-zinc-850 rounded p-1.5 text-[10px] text-zinc-400 font-mono">
                          jane@example.com
                        </div>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-500 block mb-1">Requested Category</span>
                        <div className="bg-zinc-900 border border-zinc-850 rounded p-1.5 text-[10px] text-zinc-300 font-semibold flex items-center justify-between">
                          <span>{selectedPreviewFlow.categories?.[0] || 'UTILITY'}</span>
                          <ChevronRight className="h-3 w-3 text-zinc-500" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CTA Submit Button */}
                  <button 
                    onClick={() => {
                      alert('Feedback captured successfully! This simulates the Meta WhatsApp Flow POST submission.');
                      setSelectedPreviewFlow(null);
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold py-2 rounded-lg transition-all shadow-md mt-4 text-center cursor-pointer"
                  >
                    Submit Form
                  </button>
                </div>

                <div className="text-[9px] text-zinc-500 leading-normal">
                  WhatsApp Flows render natively on Android and iOS client apps. Submit inputs are POSTed to WhatsFlow webhooks instantly.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create / Edit Modal Dialog overlay */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
              
              <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-zinc-200">
                  {editFlowId ? 'Edit Synced Flow metadata' : 'Draft New Meta WhatsApp Flow'}
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-white text-xs">Close</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                
                {/* Form fields panel */}
                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Flow Friendly Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Welcome survey details"
                      value={flowName}
                      onChange={(e) => setFlowName(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-white focus:outline-none focus:border-zinc-700"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Meta Platform Flow ID</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 775192158724649"
                      value={flowIdInput}
                      onChange={(e) => setFlowIdInput(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-white focus:outline-none focus:border-zinc-700 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-zinc-400 block mb-1">Category</label>
                      <select
                        value={flowCategory}
                        onChange={(e) => setFlowCategory(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-white"
                      >
                        <option value="MARKETING">MARKETING</option>
                        <option value="UTILITY">UTILITY</option>
                        <option value="AUTHENTICATION">AUTHENTICATION</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-zinc-400 block mb-1">Status</label>
                      <select
                        value={flowStatus}
                        onChange={(e) => setFlowStatus(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-white"
                      >
                        <option value="DRAFT">DRAFT (Drafting)</option>
                        <option value="PUBLISHED">PUBLISHED (Live)</option>
                        <option value="DEPRECATED">DEPRECATED</option>
                      </select>
                    </div>
                  </div>

                  {/* Simulator Fields Setup */}
                  <div className="border-t border-zinc-850 pt-4 space-y-3">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Visual Form Layout Fields</span>
                    
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {simulatorFields.map((field, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-zinc-950 border border-zinc-850 rounded px-2.5 py-1.5">
                          <span className="text-xs text-zinc-300 font-semibold">{field}</span>
                          <button 
                            type="button"
                            onClick={() => handleRemoveField(idx)}
                            className="text-zinc-500 hover:text-red-400 p-0.5"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add dynamic form input field..."
                        value={newFieldName}
                        onChange={(e) => setNewFieldName(e.target.value)}
                        className="flex-1 bg-zinc-950 border border-zinc-850 rounded p-2 text-xs text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddField}
                        className="px-3 py-2 rounded bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold border border-zinc-700"
                      >
                        Add Field
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-zinc-850">
                    <button 
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 rounded bg-zinc-800 text-zinc-300 font-semibold text-xs"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="px-4 py-2 rounded bg-white text-black font-bold text-xs shadow-md"
                    >
                      Save Flow Details
                    </button>
                  </div>
                </form>

                {/* Simulator Live preview panel */}
                <div className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-5 flex flex-col items-center justify-center space-y-4">
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Smartphone className="h-4 w-4 text-indigo-400" /> Interactive Mobile Form Simulator
                  </div>

                  {/* Simulated Mobile Device Frame */}
                  <div className="w-full max-w-[270px] bg-zinc-950 border-4 border-zinc-800 rounded-3xl p-4 min-h-[340px] flex flex-col justify-between text-left shadow-2xl relative">
                    {/* Status Bar */}
                    <div className="flex justify-between items-center text-[8px] text-zinc-600 font-mono pb-2 border-b border-zinc-900">
                      <span>WhatsFlow Sim</span>
                      <span>10:45 AM</span>
                    </div>

                    <div className="flex-1 py-4 space-y-3 max-h-56 overflow-y-auto">
                      <div className="text-[10px] font-bold text-zinc-300 uppercase tracking-wide">
                        {flowName || 'New Flow Form'}
                      </div>
                      <div className="text-[9px] text-zinc-500 leading-relaxed">
                        Complete fields within this interactive sandboxed Meta simulation window.
                      </div>

                      {/* Render fields dynamic list */}
                      <div className="space-y-2 pt-2">
                        {simulatorFields.map((field, idx) => (
                          <div key={idx}>
                            <span className="text-[8px] text-zinc-500 block mb-0.5">{field}</span>
                            <input 
                              type="text" 
                              disabled 
                              placeholder={`Enter ${field.toLowerCase()}...`}
                              className="w-full bg-zinc-900/50 border border-zinc-850 rounded p-1 text-[9px] text-zinc-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Submit CTA */}
                    <div className="pt-2 border-t border-zinc-900">
                      <div className="w-full bg-indigo-600 text-white text-[10px] font-bold py-1.5 rounded-lg text-center opacity-70">
                        Submit Flow Response
                      </div>
                    </div>
                  </div>

                  <div className="text-[9px] text-zinc-500 max-w-xs text-center leading-normal">
                    This simulator uses standard JSON schemas to model interactive forms. Changes you make on the left are updated instantly.
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

      </div>
    </DashboardShell>
  );
}
