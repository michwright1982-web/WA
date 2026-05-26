"use client";

import React, { useState } from 'react';
import { DashboardShell } from '@/components/dashboard-shell';
import { useWhatsFlow } from '@/lib/whatsflow-store';
import { 
  Key, 
  Plus, 
  Trash2, 
  Edit,
  Smartphone, 
  Globe, 
  ShieldCheck, 
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';

export default function CredentialsPage() {
  const { accounts, addAccount, updateAccount, deleteAccount } = useWhatsFlow();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editAccountId, setEditAccountId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [appId, setAppId] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [phoneId, setPhoneId] = useState('');
  const [businessId, setBusinessId] = useState('');
  const [verifyToken, setVerifyToken] = useState('');

  const [copied, setCopied] = useState(false);

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText('https://whatsflow.com/api/webhooks/whatsapp');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenAdd = () => {
    setEditAccountId(null);
    setName('');
    setAppId('');
    setAppSecret('');
    setAccessToken('');
    setPhoneId('');
    setBusinessId('');
    setVerifyToken('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (acc: any) => {
    setEditAccountId(acc.id);
    setName(acc.name);
    setAppId(acc.appId);
    setAppSecret(acc.appSecret);
    setAccessToken(acc.accessToken);
    setPhoneId(acc.phoneNumberId);
    setBusinessId(acc.businessAccountId);
    setVerifyToken(acc.webhookVerifyToken);
    setShowAddModal(true);
  };

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !appId || !accessToken || !phoneId || !businessId) return;

    const payload = {
      name,
      appId,
      appSecret,
      accessToken,
      phoneNumberId: phoneId,
      businessAccountId: businessId,
      webhookVerifyToken: verifyToken || 'whatsflow_verify_token'
    };

    if (editAccountId) {
      updateAccount(editAccountId, payload);
    } else {
      addAccount(payload);
    }

    setName('');
    setAppId('');
    setAppSecret('');
    setAccessToken('');
    setPhoneId('');
    setBusinessId('');
    setVerifyToken('');
    setEditAccountId(null);
    setShowAddModal(false);
  };

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-6xl">
        
        {/* Banner */}
        <div className="flex justify-between items-center bg-zinc-900/60 p-4 border border-zinc-800 rounded-xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-200">Meta WhatsApp Business API Credentials</h2>
              <p className="text-[10px] text-zinc-500 mt-0.5">Securely manage multiple lines and webhook callback URLs</p>
            </div>
          </div>

          <button 
            onClick={handleOpenAdd}
            className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black hover:bg-zinc-200 font-bold transition-all shadow-md"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" /> Connect Line
          </button>
        </div>

        {/* Info Box: Webhook callback address configurations */}
        <div className="bg-gradient-to-r from-zinc-900/40 via-zinc-900/20 to-zinc-950 border border-zinc-800 rounded-2xl p-6 backdrop-blur-md">
          <div className="flex items-start gap-4">
            <div className="h-9 w-9 bg-zinc-800/80 rounded-xl flex items-center justify-center text-zinc-300 shadow">
              <Globe className="h-4.5 w-4.5" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-zinc-200">Global Webhooks Configuration</h3>
              <p className="text-[11px] text-zinc-500 max-w-2xl leading-relaxed">
                To receive incoming customer conversations and message read statuses in real-time, copy the URL below and paste it into the Webhooks section of your Facebook Developer App.
              </p>
              
              <div className="flex items-center gap-3 pt-2">
                <div className="flex items-center bg-zinc-950 border border-zinc-850 rounded-lg overflow-hidden border-glow">
                  <div className="px-3 py-1.5 font-mono text-[10px] text-zinc-400 select-all">
                    https://whatsflow.com/api/webhooks/whatsapp
                  </div>
                  <button 
                    onClick={handleCopyWebhook}
                    className="border-l border-zinc-850 p-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 transition-colors flex items-center justify-center h-full"
                    title="Copy Webhook URL"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
                <span className="text-[9px] bg-zinc-900 text-zinc-500 px-2 py-1 rounded font-bold uppercase tracking-wider">
                  POST Endpoint
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Existing Accounts List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {accounts.map(acc => (
            <div key={acc.id} className="glow-card bg-zinc-900/40 rounded-2xl p-6 backdrop-blur-md flex flex-col justify-between space-y-4">
              
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400">
                    <Smartphone className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-zinc-200">{acc.name}</h3>
                    <p className="text-[10px] text-zinc-500 mt-0.5 font-semibold">Phone Number ID: {acc.phoneNumberId}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] px-2 py-0.5 rounded font-bold uppercase mr-1.5">
                    {acc.status}
                  </span>
                  <button 
                    onClick={() => handleOpenEdit(acc)}
                    className="text-zinc-500 hover:text-zinc-200 p-1 transition-colors"
                    title="Edit Credentials"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button 
                    onClick={() => deleteAccount(acc.id)}
                    className="text-zinc-500 hover:text-red-400 p-1 transition-colors"
                    title="Disconnect Line"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="border-t border-zinc-850 pt-4 grid grid-cols-2 gap-3 text-[10px] font-mono">
                <div>
                  <span className="text-zinc-500 block mb-0.5">Meta App ID</span>
                  <span className="text-zinc-300 font-semibold">{acc.appId}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block mb-0.5">Business Account ID</span>
                  <span className="text-zinc-300 font-semibold">{acc.businessAccountId}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-zinc-500 block mb-0.5">System Access Token</span>
                  <span className="text-zinc-400 truncate block">•••••••••••••••••••••{acc.accessToken.substring(0, 10)}</span>
                </div>
              </div>

            </div>
          ))}
        </div>

        {/* Modal connect dialog */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
              
              <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-zinc-200">
                  {editAccountId ? 'Edit Connected Meta WhatsApp API' : 'Connect Meta WhatsApp API'}
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-zinc-500 hover:text-zinc-300 text-xs">Close</button>
              </div>

              <form onSubmit={handleConnect} className="grid grid-cols-2 gap-4">
                
                <div className="col-span-2">
                  <label className="text-xs text-zinc-400 block mb-1">Friendly Line Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sales Primary Line"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Meta App ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1094857291038"
                    value={appId}
                    onChange={(e) => setAppId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Meta App Secret</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={appSecret}
                    onChange={(e) => setAppSecret(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">WhatsApp Phone ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1092839485"
                    value={phoneId}
                    onChange={(e) => setPhoneId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Business Account ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 93847293847"
                    value={businessId}
                    onChange={(e) => setBusinessId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-white"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-xs text-zinc-400 block mb-1">Permanent Access Token</label>
                  <input
                    type="text"
                    required
                    placeholder="EAAGb..."
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-white"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-xs text-zinc-400 block mb-1">Webhook Verify Token</label>
                  <input
                    type="text"
                    placeholder="Custom verify token passphrase..."
                    value={verifyToken}
                    onChange={(e) => setVerifyToken(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-white"
                  />
                </div>

                <div className="col-span-2 flex justify-end gap-2 pt-2 border-t border-zinc-800">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded bg-zinc-800 text-zinc-300 font-semibold text-xs"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 rounded bg-white text-black font-bold text-xs shadow-md flex items-center gap-1.5"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" /> 
                    {editAccountId ? 'Save Changes' : 'Verify & Authorize Line'}
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
