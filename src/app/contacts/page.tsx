"use client";

import React, { useState } from 'react';
import { DashboardShell } from '@/components/dashboard-shell';
import { useWhatsFlow } from '@/lib/whatsflow-store';
import { 
  Users, 
  Plus, 
  Search, 
  Download, 
  Trash2, 
  Mail, 
  Phone,
  Tag,
  Edit
} from 'lucide-react';

export default function ContactsPage() {
  const { contacts, addContact, updateContact, deleteContact } = useWhatsFlow();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editContactId, setEditContactId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  const filtered = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phoneNumber.includes(searchQuery) ||
    c.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenAdd = () => {
    setEditContactId(null);
    setName('');
    setPhone('');
    setEmail('');
    setTagInput('');
    setStatus('active');
    setShowAddModal(true);
  };

  const handleOpenEdit = (ct: any) => {
    setEditContactId(ct.id);
    setName(ct.name);
    setPhone(ct.phoneNumber);
    setEmail(ct.email || '');
    setTagInput(ct.tags.join(', '));
    setStatus(ct.status);
    setShowAddModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    const payload = {
      name,
      phoneNumber: phone,
      email: email || undefined,
      tags: tagInput ? tagInput.split(',').map(t => t.trim()).filter(Boolean) : [],
      status
    };

    if (editContactId) {
      updateContact(editContactId, payload);
    } else {
      addContact(payload);
    }

    setName('');
    setPhone('');
    setEmail('');
    setTagInput('');
    setStatus('active');
    setEditContactId(null);
    setShowAddModal(false);
  };

  const handleExportCSV = () => {
    const headers = 'Name,Phone,Email,Tags,Status\n';
    const rows = contacts.map(c => `"${c.name}","${c.phoneNumber}","${c.email || ''}","${c.tags.join(';')}","${c.status}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'whatsflow_contacts_export.csv';
    link.click();
  };

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-6xl">
        
        {/* Top Control Panel */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/60 p-4 border border-zinc-800 rounded-xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-200">CRM Contacts & Tags</h2>
              <p className="text-[10px] text-zinc-500 mt-0.5">Organize customer details and custom tags for broadcasting</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleExportCSV}
              className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 text-zinc-300 hover:text-white transition-all font-medium"
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </button>
            <button 
              onClick={handleOpenAdd}
              className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black hover:bg-zinc-200 font-bold transition-all shadow-md"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" /> Add Contact
            </button>
          </div>
        </div>

        {/* Directory Listings Table Grid */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden backdrop-blur-md">
          
          {/* Internal search input */}
          <div className="p-4 border-b border-zinc-800/80 bg-zinc-950/20 flex items-center">
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search CRM by name, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 pl-9 pr-4 text-xs text-zinc-100 focus:outline-none focus:border-zinc-700 transition-colors"
              />
            </div>
          </div>

          {/* Table list */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 font-semibold bg-zinc-950/10">
                  <th className="p-4">Customer Name</th>
                  <th className="p-4">WhatsApp Phone</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Assigned Tags</th>
                  <th className="p-4">CRM Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {filtered.map(ct => (
                  <tr key={ct.id} className="hover:bg-zinc-900/10 transition-colors">
                    <td className="p-4 font-semibold text-zinc-200">{ct.name}</td>
                    <td className="p-4 text-zinc-300 font-mono">{ct.phoneNumber}</td>
                    <td className="p-4 text-zinc-400">{ct.email || '—'}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {ct.tags.map(t => (
                          <span key={t} className="text-[9px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-bold uppercase">
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold inline-block ${
                        ct.status === 'active' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}>
                        {ct.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(ct)}
                          className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg transition-colors"
                          title="Edit Customer Info"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => deleteContact(ct.id)}
                          className="p-1.5 bg-zinc-800/60 hover:bg-red-950/40 text-zinc-400 hover:text-red-400 rounded-lg transition-colors border border-transparent hover:border-red-950"
                          title="Delete Contact"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Dialog Form */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
              
              <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-zinc-200">
                  {editContactId ? 'Edit CRM Contact Info' : 'Add New CRM Contact'}
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-zinc-500 hover:text-zinc-300 text-xs">Close</button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-white focus:outline-none focus:border-zinc-700"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Phone Number (with Country Code)</label>
                  <input
                    type="text"
                    required
                    placeholder="+1 (555) 012-3456"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Email Address (Optional)</label>
                  <input
                    type="email"
                    placeholder="jane@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Tags (Comma Separated)</label>
                  <input
                    type="text"
                    placeholder="Lead, VIP, Promo"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">CRM Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-white focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

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
                    Save Changes
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
