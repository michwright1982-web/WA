"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { DashboardShell } from '@/components/dashboard-shell';
import { useWhatsFlow } from '@/lib/whatsflow-store';
import { 
  Send, 
  Search, 
  Paperclip, 
  FileCode, 
  Grid, 
  Sparkles, 
  Check, 
  CheckCheck,
  User,
  FileText,
  Mic,
  Play,
  Pause,
  Volume2,
  Download,
  MessageCircle,
  Phone,
  Mail,
  Users,
  MessageSquare,
  CalendarDays,
  Plus,
  X,
  ShieldCheck,
  ShieldX,
  History,
  Trash2
} from 'lucide-react';

export default function ChatPage() {
  const { 
    contacts, 
    messages, 
    templates,
    accounts,
    activeAccountId,
    activeContactId, 
    setActiveContactId,
    sendTextMessage, 
    sendButtonMessage,
    sendTemplateMessage,
    sendDocumentMessage,
    sendVoiceMessage,
    updateContact,
    deleteContact,
    addInteraction,
    clearChat
  } = useWhatsFlow();

  const activeAccount = accounts.find(a => a.id === activeAccountId);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

  // Fetch WhatsApp profile pictures for contacts that don't have one yet
  const [fetchedPicIds, setFetchedPicIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!isMounted || !activeAccount?.accessToken) return;

    const contactsNeedingPic = contacts.filter(
      c => !c.profilePicUrl && c.phoneNumber && !fetchedPicIds.has(c.id)
    );

    if (contactsNeedingPic.length === 0) return;

    // Mark as fetching to avoid duplicate requests
    setFetchedPicIds(prev => {
      const next = new Set(prev);
      contactsNeedingPic.forEach(c => next.add(c.id));
      return next;
    });

    contactsNeedingPic.forEach(async (contact) => {
      try {
        const res = await fetch(
          `/api/profile-pic?phone=${encodeURIComponent(contact.phoneNumber)}&token=${encodeURIComponent(activeAccount.accessToken)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.profilePicUrl) {
            updateContact(contact.id, { profilePicUrl: data.profilePicUrl });
          }
        }
      } catch (err) {
        console.error('Failed to fetch profile pic for', contact.name, err);
      }
    });
  }, [isMounted, contacts, activeAccount?.accessToken]);

  const [searchQuery, setSearchQuery] = useState('');
  const [typedMessage, setTypedMessage] = useState('');
  const [showTmplSelect, setShowTmplSelect] = useState(false);
  const [showBtnModal, setShowBtnModal] = useState(false);
  const [btnText, setBtnText] = useState('');
  const [btnLabels, setBtnLabels] = useState(['Yes, confirm', 'No, cancel']);
  
  // Document sharing state
  const [showDocModal, setShowDocModal] = useState(false);
  const [docName, setDocName] = useState('');

  const [selectedDocFile, setSelectedDocFile] = useState<File | null>(null);

  // Interaction modal state
  const [showInteractionModal, setShowInteractionModal] = useState(false);
  const [intDate, setIntDate] = useState('');
  const [intMedium, setIntMedium] = useState<'phone' | 'whatsapp' | 'email' | 'meeting' | 'sms'>('whatsapp');
  const [intNotes, setIntNotes] = useState('');

  const handleAddInteraction = () => {
    if (!intDate || !intNotes.trim()) return;
    addInteraction(activeContactId, { date: intDate, medium: intMedium, notes: intNotes.trim() });
    setIntDate('');
    setIntMedium('whatsapp');
    setIntNotes('');
  };

  const mediumIcons: Record<string, React.ReactNode> = {
    phone: <Phone className="h-3 w-3" />,
    whatsapp: <MessageCircle className="h-3 w-3" />,
    email: <Mail className="h-3 w-3" />,
    meeting: <Users className="h-3 w-3" />,
    sms: <MessageSquare className="h-3 w-3" />,
  };

  const mediumColors: Record<string, string> = {
    phone: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    whatsapp: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    email: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    meeting: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    sms: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  };

  // Voice mail state
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceDuration, setVoiceDuration] = useState(0);
  const [voiceTimer, setVoiceTimer] = useState<NodeJS.Timeout | null>(null);

  const activeContact = contacts.find(c => c.id === activeContactId) || contacts[0];
  const chatMessages = activeContact ? messages.filter(m => m.contactId === activeContact.id) : [];

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phoneNumber.includes(searchQuery)
  );

  const handleToggleVoiceRecording = () => {
    if (!isRecordingVoice) {
      setIsRecordingVoice(true);
      setVoiceDuration(0);
      const timer = setInterval(() => {
        setVoiceDuration(prev => prev + 1);
      }, 1000);
      setVoiceTimer(timer as any);
    } else {
      if (voiceTimer) {
        clearInterval(voiceTimer);
        setVoiceTimer(null);
      }
      setIsRecordingVoice(false);
      const mins = Math.floor(voiceDuration / 60);
      const secs = voiceDuration % 60;
      const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      sendVoiceMessage(activeContactId, 'https://whatsflow.com/assets/audio/voice-mail.mp3', formatted);
      setVoiceDuration(0);
    }
  };

  const handleCancelVoiceRecording = () => {
    if (voiceTimer) {
      clearInterval(voiceTimer);
      setVoiceTimer(null);
    }
    setIsRecordingVoice(false);
    setVoiceDuration(0);
  };

  const handleSendDocument = () => {
    // If a local file is selected, create an object URL and send
    if (selectedDocFile) {
      const objectUrl = URL.createObjectURL(selectedDocFile);
      const name = docName || selectedDocFile.name;
      sendDocumentMessage(activeContactId, objectUrl, name);
      // Revoke URL after short delay
      setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
    }
    // Reset state and close modal
    setShowDocModal(false);
    setSelectedDocFile(null);
    setDocName('');
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim()) return;
    sendTextMessage(activeContactId, typedMessage.trim());
    setTypedMessage('');
  };

  const handleSendTemplate = (id: string) => {
    sendTemplateMessage(activeContactId, id);
    setShowTmplSelect(false);
  };

  const handleSendButtons = () => {
    if (!btnText) return;
    sendButtonMessage(activeContactId, btnText, btnLabels.filter(b => b.trim() !== ''));
    setBtnText('');
    setShowBtnModal(false);
  };

  return (
    <DashboardShell>
      <div className="h-[calc(100vh-140px)] border border-zinc-800 rounded-2xl overflow-hidden flex bg-zinc-900/20 backdrop-blur-md">
        
        {/* Left Side: Contact List panel */}
        <div className="w-80 border-r border-zinc-800 flex flex-col bg-zinc-950/40">
          
          {/* Search bar */}
          <div className="p-4 border-b border-zinc-800/80">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 pl-9 pr-4 text-xs text-zinc-100 focus:outline-none focus:border-zinc-700 transition-colors"
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-900/60">
            {filteredContacts
              .slice()
              .sort((a, b) => {
                const aLast = messages.filter(m => m.contactId === a.id).pop();
                const bLast = messages.filter(m => m.contactId === b.id).pop();
                const aTime = aLast ? new Date(aLast.timestamp).getTime() : 0;
                const bTime = bLast ? new Date(bLast.timestamp).getTime() : 0;
                return bTime - aTime;
              })
              .map(ct => {
              const isActive = ct.id === activeContactId;
              const contactMsgs = messages.filter(m => m.contactId === ct.id);
              const latestMsg = contactMsgs.length > 0 ? contactMsgs[contactMsgs.length - 1] : null;
              // Count unread: incoming messages that are not yet marked as 'read'
              const unreadCount = isActive ? 0 : contactMsgs.filter(m => m.direction === 'INCOMING' && m.status !== 'read').length;
              const hasUnread = unreadCount > 0;

              const leadColor = ct.leadStatus === 'qualified'
                ? 'bg-emerald-500' : ct.leadStatus === 'not_qualified'
                ? 'bg-rose-500' : 'bg-zinc-600';

              return (
                <button
                  key={ct.id}
                  onClick={() => setActiveContactId(ct.id)}
                  className={`w-full text-left p-4 transition-all flex items-start gap-3 hover:bg-zinc-900/30 ${
                    isActive ? 'bg-zinc-800/40' : hasUnread ? 'bg-indigo-950/15' : ''
                  }`}
                >
                  {/* Avatar with lead status dot */}
                  <div className="relative">
                    <div className={`h-9 w-9 rounded-full bg-zinc-800 border flex items-center justify-center font-bold text-zinc-300 text-xs overflow-hidden ${
                      hasUnread ? 'border-indigo-500/60' : 'border-zinc-700'
                    }`}>
                      {ct.profilePicUrl ? (
                        <img src={ct.profilePicUrl} alt={ct.name} className="h-full w-full object-cover rounded-full" />
                      ) : (
                        <User className="h-4.5 w-4.5" />
                      )}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-zinc-950 ${leadColor}`}
                      title={ct.leadStatus === 'qualified' ? 'Qualified' : ct.leadStatus === 'not_qualified' ? 'Not Qualified' : 'New Lead'}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-xs font-semibold truncate ${hasUnread ? 'text-white' : 'text-zinc-200'}`}>{ct.name}</span>
                      <span className={`text-[9px] ${hasUnread ? 'text-indigo-400 font-bold' : 'text-zinc-500'}`}>
                        {isMounted && latestMsg ? new Date(latestMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <p className={`text-[10px] truncate flex-1 ${hasUnread ? 'text-zinc-200 font-semibold' : 'text-zinc-400'}`}>
                        {latestMsg ? latestMsg.body : 'No conversations yet'}
                      </p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Lead status pill */}
                        {ct.leadStatus && ct.leadStatus !== 'new' && (
                          <span className={`text-[7px] font-bold uppercase px-1 py-0.5 rounded ${
                            ct.leadStatus === 'qualified'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {ct.leadStatus === 'qualified' ? '✓ QL' : '✗ NQ'}
                          </span>
                        )}
                        {/* Unread badge */}
                        {hasUnread && (
                          <span className="h-4.5 min-w-[18px] px-1 rounded-full bg-indigo-500 text-white text-[9px] font-bold flex items-center justify-center shadow-[0_0_8px_rgba(99,102,241,0.5)]">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Conversation Area */}
        <div className="flex-1 flex flex-col justify-between bg-zinc-950/10">
          
          {/* Active Contact Header */}
          <div className="h-14 px-6 border-b border-zinc-800/80 bg-zinc-950/20 flex items-center justify-between">
            {activeContact ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-xs overflow-hidden">
                    {activeContact.profilePicUrl ? (
                      <img src={activeContact.profilePicUrl} alt={activeContact.name} className="h-full w-full object-cover rounded-full" />
                    ) : (
                      activeContact.name?.[0] || '?'
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-zinc-200 block">{activeContact.name}</span>
                    <span className="text-[9px] text-zinc-400 block">{activeContact.phoneNumber}</span>
                  </div>
                </div>

                {/* Automation Toggle & Quick Status Tags */}
                <div className="flex items-center gap-4">
                  
                  {/* Automation Toggle Switch */}
                  <div className="flex items-center gap-2 border border-zinc-800 bg-zinc-950/40 px-3 py-1 rounded-xl">
                    <span className="text-[9px] font-bold text-zinc-450 uppercase tracking-wider select-none">
                      Automation Flow
                    </span>
                    <button
                      onClick={() => {
                        updateContact(activeContact.id, {
                          automationEnabled: activeContact.automationEnabled === false ? true : false
                        });
                      }}
                      className={`relative inline-flex items-center h-4.5 w-8.5 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        activeContact.automationEnabled !== false ? 'bg-emerald-500' : 'bg-zinc-800'
                      }`}
                      role="switch"
                      aria-checked={activeContact.automationEnabled !== false}
                      title="Toggle Chatbot Auto-Response Automation"
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          activeContact.automationEnabled !== false ? 'translate-x-[18px]' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeContact.label && (
                      <span className="text-[9px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold uppercase">
                        {activeContact.label}
                      </span>
                    )}

                    {/* Lead Status Toggle */}
                    <button
                      onClick={() => {
                        const next = activeContact.leadStatus === 'qualified' ? 'not_qualified' : 'qualified';
                        updateContact(activeContact.id, { leadStatus: next });
                      }}
                      className={`text-[9px] px-2 py-0.5 rounded border font-bold uppercase flex items-center gap-1 transition-all cursor-pointer ${
                        activeContact.leadStatus === 'qualified'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                          : activeContact.leadStatus === 'not_qualified'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
                      }`}
                      title="Click to cycle lead status"
                    >
                      {activeContact.leadStatus === 'qualified' ? <ShieldCheck className="h-3 w-3" /> : activeContact.leadStatus === 'not_qualified' ? <ShieldX className="h-3 w-3" /> : <User className="h-3 w-3" />}
                      {activeContact.leadStatus === 'qualified' ? 'Qualified' : activeContact.leadStatus === 'not_qualified' ? 'Not Qualified' : 'New Lead'}
                    </button>

                    {/* Interaction Button */}
                    <button
                      onClick={() => setShowInteractionModal(!showInteractionModal)}
                      className={`text-[9px] px-2 py-0.5 rounded border font-bold uppercase flex items-center gap-1 transition-all cursor-pointer ${
                        showInteractionModal
                          ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                      title="View & add interactions"
                    >
                      <History className="h-3 w-3" /> Interactions
                      {(activeContact.interactions?.length || 0) > 0 && (
                        <span className="ml-0.5 text-[8px] bg-indigo-500/20 text-indigo-300 px-1 rounded-full font-mono">
                          {activeContact.interactions?.length}
                        </span>
                      )}
                    </button>

                    {/* Delete Contact Button */}
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete "${activeContact.name}"? This will remove the contact and all their messages permanently.`)) {
                          const contactId = activeContact.id;
                          clearChat(contactId);
                          deleteContact(contactId);
                          setActiveContactId(contacts.find(c => c.id !== contactId)?.id || '');
                        }
                      }}
                      className="text-[9px] px-2 py-0.5 rounded border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-450 hover:text-rose-400 font-bold uppercase flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                      title="Delete contact and all messages"
                    >
                      <Trash2 className="h-3 w-3 text-rose-400" /> Delete Contact
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <span className="text-xs text-zinc-550 italic">No contact selected</span>
            )}
          </div>

          {/* Interaction Modal Popup */}
          {showInteractionModal && (
            <div className="border-b border-zinc-800 bg-zinc-900/60 backdrop-blur-md">
              <div className="p-4 max-h-[320px] overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-indigo-400" /> Interaction History
                  </h4>
                  <button
                    onClick={() => setShowInteractionModal(false)}
                    className="text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Add New Interaction Form */}
                <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-3 mb-3 space-y-2.5">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Add New Interaction</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[8px] text-zinc-500 uppercase block mb-0.5">Date</label>
                      <input
                        type="date"
                        value={intDate}
                        onChange={(e) => setIntDate(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 text-[10px] text-white focus:outline-none focus:border-zinc-700"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] text-zinc-500 uppercase block mb-0.5">Medium</label>
                      <select
                        value={intMedium}
                        onChange={(e) => setIntMedium(e.target.value as any)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 text-[10px] text-white focus:outline-none focus:border-zinc-700"
                      >
                        <option value="whatsapp">💬 WhatsApp</option>
                        <option value="phone">📞 Phone Call</option>
                        <option value="email">📧 Email</option>
                        <option value="meeting">👥 Meeting</option>
                        <option value="sms">💬 SMS</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[8px] text-zinc-500 uppercase block mb-0.5">Notes</label>
                    <textarea
                      rows={2}
                      value={intNotes}
                      onChange={(e) => setIntNotes(e.target.value)}
                      placeholder="Describe the interaction..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 text-[10px] text-white resize-none focus:outline-none focus:border-zinc-700"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddInteraction}
                    className="text-[10px] px-3 py-1.5 rounded-lg bg-white text-black font-bold hover:bg-zinc-200 transition-all flex items-center gap-1 shadow-sm"
                  >
                    <Plus className="h-3 w-3 stroke-[2.5]" /> Add Interaction
                  </button>
                </div>

                {/* Interaction History List */}
                {(activeContact?.interactions?.length || 0) === 0 ? (
                  <div className="text-[10px] text-zinc-500 italic text-center py-3">
                    No interactions recorded yet. Add your first one above.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {[...(activeContact?.interactions || [])].reverse().map(int => (
                      <div key={int.id} className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-2.5 flex items-start gap-2.5">
                        <div className={`h-7 w-7 rounded-lg border flex items-center justify-center shrink-0 ${mediumColors[int.medium] || 'text-zinc-400 bg-zinc-800 border-zinc-700'}`}>
                          {mediumIcons[int.medium] || <MessageCircle className="h-3 w-3" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border ${mediumColors[int.medium] || 'text-zinc-400 bg-zinc-800 border-zinc-700'}`}>
                              {int.medium}
                            </span>
                            <span className="text-[8px] text-zinc-500 font-mono">{int.date}</span>
                          </div>
                          <p className="text-[10px] text-zinc-300 mt-1 leading-relaxed">{int.notes}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dialog Log Bubble Canvas */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-zinc-950/40">
            {chatMessages.length === 0 ? (
              contacts.length === 0 ? (
                <Link 
                  href="/contacts"
                  className="h-full flex flex-col justify-center items-center text-center space-y-4 select-none hover:bg-zinc-800/10 transition-colors duration-200 cursor-pointer p-6 rounded-2xl border border-transparent hover:border-zinc-800/50"
                >
                  <div className="h-12 w-12 rounded-full bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-center text-indigo-400 shadow-md animate-pulse">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-zinc-300">Empty CRM Database</h3>
                    <p className="text-[10px] text-zinc-400 max-w-[220px] mx-auto leading-normal font-semibold">
                      Add a CRM contact to continue
                    </p>
                  </div>
                </Link>
              ) : (
                <div className="h-full flex flex-col justify-center items-center text-center space-y-4 select-none">
                  <div className="h-12 w-12 rounded-full bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-center text-zinc-550 shadow-md animate-pulse">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-zinc-300">Empty Chat Inbox</h3>
                    <p className="text-[10px] text-zinc-500 max-w-[220px] mx-auto leading-normal">
                      No active chat history found for this contact. Send your first message below or select templates to begin.
                    </p>
                  </div>
                </div>
              )
            ) : (
              chatMessages.map((msg, index) => {
                const isOutgoing = msg.direction === 'OUTGOING';
                return (
                  <div key={`${msg.id}-${index}`} className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'} mb-3`}>
                    <div className={`max-w-[70%] p-3.5 shadow-md border transition-all duration-200 ${
                      isOutgoing 
                        ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-emerald-500/20 rounded-2xl rounded-tr-none' 
                        : 'bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl rounded-tl-none'
                    }`} >
                      
                      {/* Media image render */}
                      {msg.type === 'image' && msg.mediaUrl && (
                        <div className="mb-2.5 rounded-lg overflow-hidden max-w-xs border border-zinc-800 shadow-sm">
                          <img src={msg.mediaUrl} alt="media preview" className="w-full h-auto object-cover" />
                        </div>
                      )}

                      {/* Document Share File rendering */}
                      {msg.type === 'document' && (
                        <div className={`mb-2.5 p-3 rounded-xl border flex items-center justify-between gap-4 ${
                          isOutgoing 
                            ? 'bg-emerald-700/40 border-emerald-500/30 text-white' 
                            : 'bg-zinc-950 border-zinc-850 text-zinc-200'
                        }`}>
                          <div className="flex items-center gap-2.5 truncate">
                            <div className={`p-2 rounded-lg ${isOutgoing ? 'bg-white/10 text-emerald-200' : 'bg-indigo-500/10 text-indigo-400'}`}>
                              <FileText className="h-5 w-5" />
                            </div>
                            <div className="truncate">
                              <span className="text-[11px] font-bold block truncate max-w-[150px]" title={msg.body}>{msg.body}</span>
                              <span className={`text-[8px] block uppercase font-mono font-bold ${isOutgoing ? 'text-emerald-300' : 'text-zinc-500'}`}>PDF Document</span>
                            </div>
                          </div>
                          <a
                            href={msg.mediaUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={`p-1.5 rounded-lg border transition-colors ${
                              isOutgoing 
                                ? 'bg-white/10 hover:bg-white/20 border-white/15 text-white' 
                                : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                            title="Download File"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      )}

                      {/* Voice Mail Player rendering */}
                      {msg.type === 'voice' && (
                        <div className={`mb-2.5 p-3 rounded-xl border flex items-center gap-3 ${
                          isOutgoing 
                            ? 'bg-emerald-700/40 border-emerald-500/30 text-white' 
                            : 'bg-zinc-950 border-zinc-850 text-zinc-200'
                        }`}>
                          <button
                            type="button"
                            className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow transition-all cursor-pointer ${
                              isOutgoing
                                ? 'bg-white text-emerald-800 hover:bg-emerald-50'
                                : 'bg-indigo-650 hover:bg-indigo-550 text-white'
                            }`}
                            title="Play voice mail"
                          >
                            <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                          </button>
                          <div className="flex-1 min-w-0 space-y-1">
                            {/* Waveform graphic simulator */}
                            <div className="flex items-end gap-[2px] h-5 px-1 pt-1.5 select-none">
                              <div className={`h-1.5 flex-1 rounded-sm ${isOutgoing ? 'bg-emerald-300' : 'bg-indigo-500'}`}></div>
                              <div className={`h-3 flex-1 rounded-sm ${isOutgoing ? 'bg-emerald-300' : 'bg-indigo-500'}`}></div>
                              <div className={`h-2 flex-1 rounded-sm ${isOutgoing ? 'bg-emerald-300' : 'bg-indigo-500'}`}></div>
                              <div className={`h-4 flex-1 rounded-sm animate-pulse ${isOutgoing ? 'bg-emerald-200' : 'bg-indigo-400'}`}></div>
                              <div className={`h-1 flex-1 rounded-sm ${isOutgoing ? 'bg-emerald-300' : 'bg-indigo-500'}`}></div>
                              <div className={`h-3 flex-1 rounded-sm ${isOutgoing ? 'bg-emerald-300/60' : 'bg-indigo-500/50'}`}></div>
                              <div className={`h-2 flex-1 rounded-sm ${isOutgoing ? 'bg-emerald-300/40' : 'bg-indigo-500/30'}`}></div>
                              <div className={`h-4 flex-1 rounded-sm ${isOutgoing ? 'bg-emerald-300/30' : 'bg-indigo-500/20'}`}></div>
                              <div className={`h-1.5 flex-1 rounded-sm ${isOutgoing ? 'bg-emerald-300/20' : 'bg-indigo-500/10'}`}></div>
                            </div>
                            <div className={`flex justify-between items-center text-[8px] font-mono font-bold ${isOutgoing ? 'text-emerald-300' : 'text-zinc-500'}`}>
                              <span className="flex items-center gap-1"><Volume2 className="h-2.5 w-2.5" /> VOICE MAIL</span>
                              <span>{msg.body.replace('Voice Mail (', '').replace(')', '')}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {msg.type !== 'document' && msg.type !== 'voice' && (
                        <div className="text-xs leading-relaxed whitespace-pre-wrap font-medium">
                          {msg.type === 'button' && !isOutgoing ? (
                            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
                              <span>🔘 Interactive Click:</span>
                              <span className="text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{msg.body}</span>
                            </span>
                          ) : msg.type === 'flow' ? (
                            <div className="flex flex-col gap-1.5">
                              <span className="inline-flex items-center gap-1.5 text-indigo-400 font-bold uppercase tracking-wide text-[9px]">
                                <span>📱 WhatsApp Flow</span>
                              </span>
                              <span className="text-zinc-200">{msg.body}</span>
                              <div className="mt-2 w-full bg-zinc-800 text-zinc-300 text-center py-1.5 rounded-lg text-[10px] font-bold border border-zinc-700 shadow-sm">Open Flow</div>
                            </div>
                          ) : (
                            msg.body
                          )}
                        </div>
                      )}

                      {/* Interactive Buttons Preview */}
                      {msg.buttons && (
                        <div className="mt-3 flex flex-wrap gap-1.5 font-sans">
                          {msg.buttons.map((b, bidx) => (
                            <span key={bidx} className={`text-[10px] font-bold px-2.5 py-1 rounded border flex items-center gap-1 font-sans ${isOutgoing ? 'bg-white/10 border-white/20 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}>
                              🔘 {b}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Timestamp & Tick Delivery Status */}
                      <div className="mt-2 flex items-center justify-end gap-1 text-[9px]">
                        <span className={`opacity-65 ${isOutgoing ? 'text-emerald-200' : 'text-zinc-400'}`}>
                          {isMounted ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                        {isOutgoing && (
                          msg.status === 'failed' ? <span className="text-rose-500 font-bold ml-1">Error sending message</span> :
                          msg.status === 'read' ? <CheckCheck className="h-3.5 w-3.5 stroke-[2.5] text-sky-300" /> :
                          msg.status === 'delivered' ? <CheckCheck className="h-3.5 w-3.5 stroke-[2.5] text-emerald-100 opacity-80" /> :
                          <Check className="h-3.5 w-3.5 text-emerald-250 opacity-70" />
                        )}
                      </div>

                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Dialog Action bar */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-950/30 flex flex-col gap-3 relative">
            
            {/* Quick Attachment panel shortcuts */}
            <div className="flex gap-2">

              <button 
                onClick={() => {
                  setShowDocModal(!showDocModal);
                  setShowTmplSelect(false);
                  setShowBtnModal(false);
                }}
                disabled={contacts.length === 0}
                className={`text-xs flex items-center gap-1.5 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors ${
                  contacts.length === 0 ? 'opacity-50 cursor-not-allowed hover:border-zinc-800 hover:text-zinc-400' : 'hover:border-zinc-700'
                }`}
              >
                <FileText className="h-3.5 w-3.5 text-indigo-400" /> Share Document
              </button>
              <button 
                type="button"
                onClick={handleToggleVoiceRecording}
                disabled={contacts.length === 0}
                className={`text-xs flex items-center gap-1.5 px-3 py-1 border rounded-lg transition-colors ${
                  contacts.length === 0 
                    ? 'opacity-50 cursor-not-allowed bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:border-zinc-800 hover:text-zinc-400' 
                    : isRecordingVoice 
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-450 hover:bg-rose-500/20' 
                      : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Mic className={`h-3.5 w-3.5 ${isRecordingVoice ? 'text-rose-500 animate-pulse' : 'text-emerald-400'}`} /> 
                {isRecordingVoice ? `Stop & Send (${Math.floor(voiceDuration / 60)}:${(voiceDuration % 60).toString().padStart(2, '0')})` : 'Voice Mail'}
              </button>
              {isRecordingVoice && (
                <button
                  type="button"
                  onClick={handleCancelVoiceRecording}
                  className="text-xs flex items-center gap-1 px-2.5 py-1 bg-zinc-850 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-400 hover:text-zinc-250 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>

            {/* Template Selector dropdown panel */}
            {showTmplSelect && (
              <div className="absolute bottom-16 left-4 bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl p-3 z-50 w-72 max-h-60 overflow-y-auto">
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase mb-2">Select WhatsApp Template</h4>
                <div className="space-y-1.5">
                  {templates.map(tmpl => (
                    <button
                      key={tmpl.id}
                      onClick={() => handleSendTemplate(tmpl.id)}
                      className="w-full text-left p-2 rounded hover:bg-zinc-800 text-xs transition-colors flex justify-between items-center"
                    >
                      <span className="font-semibold text-zinc-200 truncate">{tmpl.name}</span>
                      <span className="text-[8px] bg-emerald-500/10 text-emerald-450 px-1 rounded-sm uppercase">{tmpl.category}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Simple button configurations modal */}
            {showBtnModal && (
              <div className="absolute bottom-16 left-4 bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl p-4 z-50 w-80 space-y-3">
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase">Setup Quick Actions Button Message</h4>
                <input
                  type="text"
                  placeholder="Main message text..."
                  value={btnText}
                  onChange={(e) => setBtnText(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-1.5 text-xs text-white"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Button 1"
                    value={btnLabels[0]}
                    onChange={(e) => setBtnLabels([e.target.value, btnLabels[1]])}
                    className="w-1/2 bg-zinc-950 border border-zinc-800 rounded p-1 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Button 2"
                    value={btnLabels[1]}
                    onChange={(e) => setBtnLabels([btnLabels[0], e.target.value])}
                    className="w-1/2 bg-zinc-950 border border-zinc-800 rounded p-1 text-xs text-white"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button onClick={() => setShowBtnModal(false)} className="text-[10px] text-zinc-450">Cancel</button>
                  <button onClick={handleSendButtons} className="text-[10px] bg-white text-black px-2 py-1 rounded font-bold">Send</button>
                </div>
              </div>
            )}

            {/* Document sharing configuration modal */}
            {showDocModal && (
                <div className="absolute bottom-16 left-4 bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl p-4 z-50 w-80 space-y-3">
                    <h4 className="text-[10px] font-bold text-zinc-500 uppercase">Share Document Attachment</h4>
                    <div>
                        <label className="text-[9px] text-zinc-500 uppercase block mb-0.5">Document File Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Price_List.pdf"
                            value={docName}
                            onChange={(e) => setDocName(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-855 rounded p-1.5 text-xs text-white"
                        />
                    </div>
                    <div>
                        <label className="text-[9px] text-zinc-500 uppercase block mb-0.5">Select File</label>
                        <input
                            type="file"
                            onChange={(e) => {
                                const file = e.target.files?.[0] ?? null;
                                setSelectedDocFile(file);
                                if (file) setDocName(file.name);
                            }}
                            className="w-full bg-zinc-950 border border-zinc-855 rounded p-1.5 text-xs text-white"
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                        <button onClick={() => setShowDocModal(false)} className="text-[10px] text-zinc-450">Cancel</button>
                        <button onClick={handleSendDocument} className="text-[10px] bg-white text-black px-2.5 py-1 rounded font-bold">Send Document</button>
                    </div>
                </div>
            )}

            {/* Keyboard Form Editor */}
            <form onSubmit={handleSendText} className="flex gap-2">
              <input
                type="text"
                placeholder={contacts.length === 0 ? "No contacts in CRM to message..." : "Type your WhatsApp message..."}
                value={typedMessage}
                onChange={(e) => setTypedMessage(e.target.value)}
                disabled={contacts.length === 0}
                className={`flex-1 bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-4 text-xs text-zinc-100 focus:outline-none transition-colors ${
                  contacts.length === 0 ? 'opacity-50 cursor-not-allowed focus:border-zinc-800' : 'focus:border-zinc-700'
                }`}
              />
              <button 
                type="submit"
                disabled={contacts.length === 0}
                className={`h-10 w-10 bg-white text-black rounded-xl flex items-center justify-center transition-all shadow-md ${
                  contacts.length === 0 ? 'opacity-50 cursor-not-allowed bg-zinc-400 text-zinc-650' : 'hover:bg-zinc-200 cursor-pointer'
                }`}
              >
                <Send className="h-4.5 w-4.5 stroke-[2.2]" />
              </button>
            </form>
          </div>

        </div>

      </div>
    </DashboardShell>
  );
}
