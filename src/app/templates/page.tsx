"use client";

import React, { useState } from 'react';
import { DashboardShell } from '@/components/dashboard-shell';
import { useWhatsFlow } from '@/lib/whatsflow-store';
import { 
  FileCode, 
  Plus, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  XCircle, 
  X
} from 'lucide-react';

export default function TemplatesPage() {
  const { templates, addTemplate, deleteTemplate, accounts, activeAccountId } = useWhatsFlow();
  const activeAccount = accounts.find(a => a.id === activeAccountId);

  const [showAddModal, setShowAddModal] = useState(false);
  const [tmplName, setTmplName] = useState('');
  const [tmplCategory, setTmplCategory] = useState<'UTILITY' | 'MARKETING' | 'AUTHENTICATION'>('MARKETING');
  const [tmplBody, setTmplBody] = useState('');
  const [tmplButtons, setTmplButtons] = useState<string[]>([]);
  const [newBtnText, setNewBtnText] = useState('');

  const handleAddButton = () => {
    const text = newBtnText.trim();
    if (!text) return;
    if (tmplButtons.length >= 3) return; // WhatsApp max 3 buttons
    setTmplButtons([...tmplButtons, text]);
    setNewBtnText('');
  };

  const handleRemoveButton = (index: number) => {
    setTmplButtons(tmplButtons.filter((_, i) => i !== index));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tmplName || !tmplBody) return;

    addTemplate({
      name: tmplName.toLowerCase().replace(/\s+/g, '_'),
      category: tmplCategory,
      language: 'en_US',
      status: 'APPROVED',
      bodyText: tmplBody,
      buttons: tmplButtons.length > 0 ? tmplButtons : []
    });

    setTmplName('');
    setTmplBody('');
    setTmplButtons([]);
    setNewBtnText('');
    setShowAddModal(false);
  };

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-6xl">
        
        {/* Actions bar header */}
        <div className="flex justify-between items-center bg-zinc-900/60 p-4 border border-zinc-800 rounded-xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300">
              <FileCode className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-200">WhatsApp Message Templates</h2>
              <p className="text-[10px] text-zinc-500 mt-0.5">Approved Meta business templates ready for broadcasting</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={async () => {
                const btn = document.getElementById('sync-meta-btn');
                if (!activeAccount || !activeAccount.businessAccountId || !activeAccount.accessToken) {
                  alert('Please configure a WhatsApp account with a Business Account ID and Access Token to sync real templates from Meta.');
                  return;
                }

                if (btn) btn.innerHTML = '<svg class="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Syncing from Meta...';
                
                try {
                  const response = await fetch(`https://graph.facebook.com/v20.0/${activeAccount.businessAccountId}/message_templates`, {
                    headers: {
                      'Authorization': `Bearer ${activeAccount.accessToken}`
                    }
                  });
                  
                  if (!response.ok) {
                    throw new Error('Failed to fetch from Meta');
                  }
                  
                  const data = await response.json();
                  const metaTemplates = data.data || [];
                  const existingNames = templates.map(t => t.name);
                  
                  metaTemplates.forEach((t: any) => {
                    if (!existingNames.includes(t.name)) {
                      const bodyComponent = t.components?.find((c: any) => c.type === 'BODY');
                      const buttonsComponent = t.components?.find((c: any) => c.type === 'BUTTONS');
                      
                      const bodyText = bodyComponent ? bodyComponent.text : '';
                      const buttons = buttonsComponent ? buttonsComponent.buttons.map((b: any) => b.text) : [];
                      
                      addTemplate({
                        name: t.name,
                        category: t.category,
                        language: t.language,
                        status: t.status,
                        bodyText,
                        buttons
                      });
                    }
                  });
                  
                  if (btn) btn.innerHTML = '<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 2v6h6"></path></svg> Synced!';
                } catch (error) {
                  console.error('Error syncing templates:', error);
                  if (btn) btn.innerHTML = 'Error syncing';
                  alert('Error syncing from Meta API. Please check your credentials and internet connection.');
                }
                
                setTimeout(() => {
                  if (btn) btn.innerHTML = '<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 2v6h6"></path></svg> Sync from Meta';
                }, 2000);
              }}
              id="sync-meta-btn"
              className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 text-zinc-300 hover:text-white transition-all font-medium"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Sync from Meta
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black hover:bg-zinc-200 font-bold transition-all shadow-md"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" /> Create Template
            </button>
          </div>
        </div>

        {/* Template Catalog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {templates.map(tmpl => {
            const statusColors = 
              tmpl.status === 'APPROVED' 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : tmpl.status === 'PENDING' 
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                  : 'bg-red-500/10 text-red-400 border-red-500/20';

            const StatusIcon = 
              tmpl.status === 'APPROVED' 
                ? CheckCircle 
                : tmpl.status === 'PENDING' 
                  ? Clock 
                  : XCircle;

            return (
              <div key={tmpl.id} className="glow-card bg-zinc-900/40 rounded-xl p-5 backdrop-blur-md flex flex-col justify-between min-h-[18rem]">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] bg-zinc-800 border border-zinc-700/80 px-2 py-0.5 rounded text-zinc-400 font-bold uppercase tracking-wider">
                      {tmpl.category}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 border ${statusColors}`}>
                      <StatusIcon className="h-3 w-3" /> {tmpl.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-zinc-100 mt-3 truncate">{tmpl.name}</h3>
                  
                  {/* Body Preview */}
                  <div className="mt-3 bg-zinc-950/50 border border-zinc-800 rounded-lg p-3 max-h-28 overflow-y-auto">
                    <p className="text-[11px] text-zinc-300 leading-relaxed font-mono whitespace-pre-wrap">{tmpl.bodyText}</p>
                  </div>

                  {/* Buttons Preview */}
                  {tmpl.buttons && tmpl.buttons.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {tmpl.buttons.map((btn, i) => (
                        <span key={i} className="text-[10px] px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold flex items-center gap-1">
                          🔘 {btn}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500 font-medium">Lang: {tmpl.language}</span>
                  <div className="flex items-center gap-2">
                    {tmpl.buttons && tmpl.buttons.length > 0 && (
                      <span className="text-[9px] text-zinc-500 font-medium">{tmpl.buttons.length} button{tmpl.buttons.length > 1 ? 's' : ''}</span>
                    )}
                    <button 
                      onClick={() => deleteTemplate(tmpl.id)}
                      className="text-zinc-500 hover:text-red-400 transition-colors p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Create Modal Dialog overlay */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
              
              <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-zinc-200">Draft New Meta WhatsApp Template</h3>
                <button onClick={() => setShowAddModal(false)} className="text-zinc-500 hover:text-zinc-300 text-xs">Close</button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Template Name</label>
                  <input
                    type="text"
                    required
                    placeholder="welcome_retail_user"
                    value={tmplName}
                    onChange={(e) => setTmplName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-white focus:outline-none focus:border-zinc-700"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Category</label>
                  <select
                    value={tmplCategory}
                    onChange={(e) => setTmplCategory(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-white"
                  >
                    <option value="MARKETING">MARKETING</option>
                    <option value="UTILITY">UTILITY</option>
                    <option value="AUTHENTICATION">AUTHENTICATION</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Body Text (Supports {"{{1}}"}, {"{{2}}"} variables)</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Hello {{1}}, welcome! Your order code is {{2}}."
                    value={tmplBody}
                    onChange={(e) => setTmplBody(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-white resize-none"
                  />
                </div>

                {/* Multi-Button Section */}
                <div>
                  <label className="text-xs text-zinc-400 block mb-1.5">
                    Quick Reply Buttons 
                    <span className="text-zinc-600 ml-1">({tmplButtons.length}/3 max)</span>
                  </label>

                  {/* Added buttons list */}
                  {tmplButtons.length > 0 && (
                    <div className="space-y-1.5 mb-2.5">
                      {tmplButtons.map((btn, idx) => (
                        <div 
                          key={idx} 
                          className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 group"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-zinc-500 font-mono font-bold w-4">#{idx + 1}</span>
                            <span className="text-xs text-zinc-200 font-semibold">{btn}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveButton(idx)}
                            className="text-zinc-600 hover:text-red-400 transition-colors p-0.5 opacity-0 group-hover:opacity-100"
                            title="Remove button"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add button input */}
                  {tmplButtons.length < 3 && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={tmplButtons.length === 0 ? "e.g. Get Started" : tmplButtons.length === 1 ? "e.g. Contact Sales" : "e.g. Learn More"}
                        value={newBtnText}
                        onChange={(e) => setNewBtnText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddButton();
                          }
                        }}
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-zinc-700"
                      />
                      <button
                        type="button"
                        onClick={handleAddButton}
                        className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold transition-colors flex items-center gap-1 border border-zinc-700"
                      >
                        <Plus className="h-3 w-3 stroke-[2.5]" /> Add
                      </button>
                    </div>
                  )}

                  {tmplButtons.length >= 3 && (
                    <p className="text-[9px] text-amber-400/80 mt-1">Maximum 3 buttons reached (WhatsApp limit).</p>
                  )}
                  <p className="text-[9px] text-zinc-600 mt-1">WhatsApp supports up to 3 quick reply buttons per template.</p>
                </div>

                {/* Live Preview */}
                {(tmplBody || tmplButtons.length > 0) && (
                  <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-3.5 space-y-2">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Live Preview</span>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
                      {tmplBody && (
                        <p className="text-[11px] text-zinc-300 leading-relaxed whitespace-pre-wrap">{tmplBody}</p>
                      )}
                      {tmplButtons.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2.5 border-t border-zinc-800">
                          {tmplButtons.map((btn, i) => (
                            <span key={i} className="text-[10px] px-3 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 font-semibold">
                              {btn}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
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
                    Submit to Meta Approvals
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

      </div>
    </DashboardShell>
  );
}
