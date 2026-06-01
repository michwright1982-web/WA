"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { DashboardShell } from '@/components/dashboard-shell';
import { useWhatsFlow, Message } from '@/lib/whatsflow-store';
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
  Trash2,
  Image as ImageIcon
} from 'lucide-react';

const VoicePlayer: React.FC<{ msg: Message; isOutgoing: boolean }> = ({ msg, isOutgoing }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<string>('');
  const [currentTime, setCurrentTime] = useState(0);
  const [percent, setPercent] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Parse duration from msg body if audio isn't loaded yet
  useEffect(() => {
    if (msg.body) {
      const match = msg.body.match(/Voice Mail \(([^)]+)\)/);
      if (match && match[1]) {
        setDuration(match[1]);
      }
    }
  }, [msg.body]);

  useEffect(() => {
    // Cleanup audio on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handlePlayPause = () => {
    if (!msg.mediaUrl) {
      alert("No audio file is available for playback.");
      return;
    }

    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      if (!audioRef.current) {
        audioRef.current = new Audio(msg.mediaUrl);
        
        audioRef.current.addEventListener('timeupdate', () => {
          if (audioRef.current) {
            const current = audioRef.current.currentTime;
            const dur = audioRef.current.duration || 1;
            setCurrentTime(current);
            setPercent(current / dur);
          }
        });

        audioRef.current.addEventListener('ended', () => {
          setIsPlaying(false);
          setCurrentTime(0);
          setPercent(0);
        });

        audioRef.current.addEventListener('loadedmetadata', () => {
          if (audioRef.current) {
            const totalSecs = Math.floor(audioRef.current.duration);
            const mins = Math.floor(totalSecs / 60);
            const secs = totalSecs % 60;
            setDuration(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
          }
        });
      }

      audioRef.current.play().catch(err => {
        console.error("Audio playback failed:", err);
        alert("Failed to play audio. The link might be expired or inaccessible.");
      });
      setIsPlaying(true);
    }
  };

  const waveBars = [6, 12, 8, 16, 4, 10, 8, 14, 6];

  return (
    <div className={`mb-2.5 p-3 rounded-xl border flex items-center gap-3 ${
      isOutgoing 
        ? 'bg-emerald-700/65 border-emerald-550/30 text-white' 
        : 'bg-zinc-100 border-zinc-200 text-black'
    }`}>
      <button
        type="button"
        onClick={handlePlayPause}
        className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow transition-all cursor-pointer ${
          isOutgoing
            ? 'bg-white text-emerald-850 hover:bg-emerald-50'
            : 'bg-indigo-600 hover:bg-indigo-550 text-white'
        }`}
        title={isPlaying ? "Pause voice mail" : "Play voice mail"}
      >
        {isPlaying ? (
          <Pause className="h-3.5 w-3.5 fill-current" />
        ) : (
          <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
        )}
      </button>
      <div className="flex-1 min-w-0 space-y-1">
        {/* Waveform graphic simulator */}
        <div className="flex items-end gap-[2px] h-5 px-1 pt-1.5 select-none">
          {waveBars.map((height, idx) => {
            const isLit = percent > idx / waveBars.length;
            let barColor = '';
            if (isOutgoing) {
              barColor = isLit ? 'bg-white' : 'bg-emerald-400/40';
            } else {
              barColor = isLit ? 'bg-indigo-650' : 'bg-zinc-400/40';
            }

            return (
              <div 
                key={idx} 
                style={{ height: `${height * 1.2}px` }}
                className={`flex-1 rounded-sm transition-all duration-300 ${barColor} ${
                  isPlaying && isLit ? 'animate-pulse' : ''
                }`}
              />
            );
          })}
        </div>
        <div className={`flex justify-between items-center text-[8px] font-mono font-bold ${isOutgoing ? 'text-emerald-250' : 'text-zinc-500'}`}>
          <span className="flex items-center gap-1">
            <Volume2 className="h-2.5 w-2.5" /> 
            {isPlaying ? 'PLAYING' : 'VOICE MAIL'}
          </span>
          <span>
            {isPlaying 
              ? `${Math.floor(currentTime / 60)}:${Math.floor(currentTime % 60).toString().padStart(2, '0')} / ${duration}`
              : duration
            }
          </span>
        </div>
      </div>
    </div>
  );
};

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
    sendMediaMessage,
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

  // Auto-select the active chat if there is only one CRM contact in the list
  useEffect(() => {
    if (isMounted && contacts.length === 1 && activeContactId !== contacts[0].id) {
      setActiveContactId(contacts[0].id);
    }
  }, [isMounted, contacts, activeContactId, setActiveContactId]);

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
  const [selectedFlowResponse, setSelectedFlowResponse] = useState<Message | null>(null);
  const [showTmplSelect, setShowTmplSelect] = useState(false);
  const [showBtnModal, setShowBtnModal] = useState(false);
  const [btnText, setBtnText] = useState('');
  const [btnLabels, setBtnLabels] = useState(['Yes, confirm', 'No, cancel']);
  
  // Document sharing state
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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

  // Real voice recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const voiceDurationRef = useRef<number>(0);

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

  const handleToggleVoiceRecording = async () => {
    if (!isRecordingVoice) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        
        // Find optimal MIME type supported by browser (prioritizing audio/mp4 for universal Meta/iOS compatibility)
        let mimeType = 'audio/webm';
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
          mimeType = 'audio/ogg;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        }
        
        const mediaRecorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        
        mediaRecorder.onstop = async () => {
          setIsUploading(true);
          try {
            const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
            const ext = mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp4') ? 'mp4' : 'webm';
            const audioFile = new File([audioBlob], `voicemail_${Date.now()}.${ext}`, { type: mimeType });
            
            const formData = new FormData();
            formData.append('file', audioFile);
            if (activeAccount) {
              formData.append('phoneNumberId', activeAccount.phoneNumberId);
              formData.append('accessToken', activeAccount.accessToken);
            }
            
            const res = await fetch('/api/media/upload', {
              method: 'POST',
              body: formData
            });
            
            if (!res.ok) {
              const errorData = await res.json().catch(() => ({}));
              throw new Error(errorData.error || 'Failed to upload voice mail.');
            }
            
            const data = await res.json();
            
            // Check if there was a Meta upload error for a live developer token
            if (data.metaError && activeAccount && !activeAccount.accessToken.startsWith('EAAGb...')) {
              console.error('Meta WhatsApp media upload failed:', data.metaError);
              alert(`Meta Cloud API upload failed: ${data.metaError.message || JSON.stringify(data.metaError)}. Your voice note will fall back to local URL delivery.`);
            }
            
            let finalUrl = '';
            if (data.mediaUrl) {
              if (data.mediaUrl.startsWith('data:') || data.mediaUrl.startsWith('http')) {
                finalUrl = data.mediaUrl;
              } else {
                finalUrl = window.location.origin + data.mediaUrl;
              }
            }
            
            const mins = Math.floor(voiceDurationRef.current / 60);
            const secs = voiceDurationRef.current % 60;
            const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            
            sendVoiceMessage(activeContactId, finalUrl, formatted, data.mediaId);
          } catch (err: any) {
            console.error('Error sharing voice recording:', err);
            alert(err.message || 'Error occurred while saving your voice recording.');
          } finally {
            setIsUploading(false);
          }
        };
        
        mediaRecorder.start();
        setIsRecordingVoice(true);
        setVoiceDuration(0);
        voiceDurationRef.current = 0;
        
        const timer = setInterval(() => {
          setVoiceDuration(prev => {
            const next = prev + 1;
            voiceDurationRef.current = next;
            return next;
          });
        }, 1000);
        setVoiceTimer(timer as any);
      } catch (err: any) {
        console.error('Failed to access microphone:', err);
        alert('Could not access your microphone. Please verify permission settings.');
      }
    } else {
      if (voiceTimer) {
        clearInterval(voiceTimer);
        setVoiceTimer(null);
      }
      setIsRecordingVoice(false);
      
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  };

  const handleCancelVoiceRecording = () => {
    if (voiceTimer) {
      clearInterval(voiceTimer);
      setVoiceTimer(null);
    }
    setIsRecordingVoice(false);
    setVoiceDuration(0);
    voiceDurationRef.current = 0;
    
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.onstop = null;
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const handleSendDocument = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (activeAccount) {
        formData.append('phoneNumberId', activeAccount.phoneNumberId);
        formData.append('accessToken', activeAccount.accessToken);
      }

      const res = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to upload document.');
      }

      const data = await res.json();
      const name = file.name;
      let finalUrl = '';
      if (data.mediaUrl) {
        if (data.mediaUrl.startsWith('data:') || data.mediaUrl.startsWith('http')) {
          finalUrl = data.mediaUrl;
        } else {
          finalUrl = window.location.origin + data.mediaUrl;
        }
      }

      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        sendMediaMessage(activeContactId, finalUrl, '', data.mediaId);
      } else {
        sendDocumentMessage(activeContactId, finalUrl, name, data.mediaId);
      }
    } catch (err: any) {
      console.error('Error sharing document:', err);
      alert(err.message || 'Error occurred while sharing document.');
    } finally {
      setIsUploading(false);
      setShowAttachMenu(false);
    }
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
      <div className="h-[calc(100vh-140px)] border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden flex bg-white/50 dark:bg-zinc-900/20 backdrop-blur-md">
        
        {/* Left Side: Contact List panel */}
        <div className="w-80 border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-zinc-50/50 dark:bg-zinc-950/40">
          {/* Search bar */}
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-transparent">
            <div className="flex items-center w-full bg-[#f0f2f5] dark:bg-zinc-900 rounded-lg px-3 h-[30px] transition-colors">
              <Search className="h-4 w-4 text-[#54656f] dark:text-zinc-500 shrink-0" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none focus:outline-none text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-[#54656f] dark:placeholder:text-zinc-500 ml-2 h-full flex-1"
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
                    <div className={`relative max-w-[70%] px-3.5 pt-2 pb-1.5 text-[15px] ${
                      isOutgoing 
                        ? 'bg-[#25D366] text-white rounded-2xl rounded-br-none' 
                        : 'bg-[#E9E9EB] text-black rounded-2xl rounded-bl-none'
                    }`} >
                      
                      {/* Left iOS style tail */}
                      {!isOutgoing && (
                        <svg viewBox="0 0 12 19" width="12" height="19" className="absolute bottom-0 -left-[10px] text-[#E9E9EB] fill-current pointer-events-none block">
                          <path d="M12 19H0C0 19 9 19 12 0V19Z" />
                        </svg>
                      )}
                      
                      {/* Right iOS style tail */}
                      {isOutgoing && (
                        <svg viewBox="0 0 12 19" width="12" height="19" className="absolute bottom-0 -right-[10px] text-[#25D366] fill-current pointer-events-none block">
                          <path d="M0 19H12C12 19 3 19 0 0V19Z" />
                        </svg>
                      )}
                      
                      {/* Media image render */}
                      {msg.type === 'image' && msg.mediaUrl && (
                        <div className="mb-2.5 rounded-lg overflow-hidden max-w-xs border border-zinc-200 shadow-sm">
                          <img src={msg.mediaUrl} alt="media preview" className="w-full h-auto object-cover" />
                        </div>
                      )}

                      {/* Document Share File rendering */}
                      {msg.type === 'document' && (
                        <div className={`mb-2.5 p-3 rounded-xl border flex items-center justify-between gap-4 ${
                          isOutgoing 
                            ? 'bg-emerald-700/65 border-emerald-550/30 text-white' 
                            : 'bg-zinc-100 border-zinc-200 text-black'
                        }`}>
                          <div className="flex items-center gap-2.5 truncate">
                            <div className={`p-2 rounded-lg ${isOutgoing ? 'bg-white/10 text-emerald-250' : 'bg-indigo-500/10 text-indigo-650'}`}>
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
                                ? 'bg-white/15 hover:bg-white/25 border-white/20 text-white' 
                                : 'bg-white hover:bg-zinc-50 border-zinc-300 text-black hover:text-black'
                            }`}
                            title="Download File"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      )}

                      {/* Voice Mail Player rendering */}
                      {msg.type === 'voice' && (
                        <VoicePlayer msg={msg} isOutgoing={isOutgoing} />
                      )}

                      {msg.type !== 'document' && msg.type !== 'voice' && (
                        <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                          {msg.type === 'button' && !isOutgoing ? (
                            msg.body.includes('Filled Booking Form Response') ? (
                              <button 
                                type="button"
                                onClick={() => setSelectedFlowResponse(msg)}
                                className="w-full text-left inline-flex flex-col gap-1.5 p-2.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 hover:border-indigo-500/50 hover:bg-indigo-950/30 transition-all cursor-pointer shadow-inner"
                              >
                                <span className="inline-flex items-center gap-1.5 text-indigo-400 font-bold uppercase tracking-wider text-[9px]">
                                  <span>📝 Filled Booking Form Response</span>
                                </span>
                                <span className="text-[9px] text-indigo-350/80 italic font-mono block">Click message to view form details</span>
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-indigo-650 font-bold">
                                <span>🔘 Interactive Click:</span>
                                <span className="text-indigo-600 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">{msg.body}</span>
                              </span>
                            )
                          ) : msg.type === 'flow' ? (
                            <div className="flex flex-col gap-1.5">
                              <span className="inline-flex items-center gap-1.5 text-indigo-600 font-bold uppercase tracking-wide text-[9px]">
                                <span>📱 WhatsApp Flow</span>
                              </span>
                              <span className="text-black">{msg.body}</span>
                              <div className="mt-2 w-full bg-zinc-100 text-black text-center py-1.5 rounded-lg text-[10px] font-bold border border-zinc-200 shadow-sm">Open Flow</div>
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
                            <span key={bidx} className={`text-[10px] font-bold px-2.5 py-1 rounded border flex items-center gap-1 font-sans ${isOutgoing ? 'bg-white/10 border-white/20 text-white' : 'bg-zinc-100 border-zinc-200 text-black hover:bg-zinc-200'}`}>
                              🔘 {b}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Timestamp & Tick Delivery Status */}
                      <div className="mt-1 flex items-center justify-end gap-1 text-[9px] mb-0.5">
                        <span className={`opacity-70 ${isOutgoing ? 'text-emerald-50' : 'text-zinc-500'}`}>
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
          <div className="p-2.5 px-4 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-950/40 flex items-center gap-2 relative z-50">
            {isRecordingVoice ? (
              // Recording UI state
              <div className="flex-1 flex items-center justify-between bg-white dark:bg-zinc-900/50 rounded-full px-4 py-2 text-emerald-500 animate-pulse border border-emerald-500/20 shadow-sm dark:shadow-none">
                <div className="flex items-center gap-2">
                  <Mic className="h-4.5 w-4.5" />
                  <span className="text-sm font-medium text-emerald-500 dark:text-emerald-400">
                    {Math.floor(voiceDuration / 60)}:{(voiceDuration % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">Recording voice message...</span>
              </div>
            ) : (
              <>
                {/* Attachment Menu Toggle (Plus) */}
                <div className="relative flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAttachMenu(!showAttachMenu);
                      setShowTmplSelect(false);
                      setShowBtnModal(false);
                    }}
                    disabled={contacts.length === 0 || isUploading}
                    className={`p-2 transition-colors shrink-0 flex items-center justify-center ${contacts.length === 0 ? 'opacity-50 cursor-not-allowed text-zinc-400 dark:text-zinc-600' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer'} ${showAttachMenu ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-full' : ''}`}
                    title="Attach"
                  >
                    <Plus className={`h-6 w-6 stroke-[2] transition-transform ${showAttachMenu ? 'rotate-45' : ''} ${isUploading ? 'animate-spin opacity-50' : ''}`} />
                  </button>

                  {/* Attachment Popup Menu */}
                  {showAttachMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowAttachMenu(false)} />
                      <div className="absolute bottom-14 left-0 mb-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl p-3 z-50 flex flex-col gap-3 min-w-[200px] animate-in fade-in slide-in-from-bottom-2">
                      
                      {/* Document Button */}
                      <label className="flex items-center gap-4 cursor-pointer group w-full hover:bg-zinc-50 dark:hover:bg-zinc-800/50 p-2 rounded-xl transition-colors">
                        <div className="h-11 w-11 rounded-full bg-[#7F66FF] flex items-center justify-center group-hover:bg-[#6c53ed] transition-colors shadow-sm shrink-0">
                          <FileText className="h-5 w-5 text-white stroke-[2]" />
                        </div>
                        <span className="text-[15px] text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors font-medium">Document</span>
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleSendDocument(file);
                            e.target.value = '';
                          }}
                        />
                      </label>

                      {/* Photos & Videos Button */}
                      <label className="flex items-center gap-4 cursor-pointer group w-full hover:bg-zinc-50 dark:hover:bg-zinc-800/50 p-2 rounded-xl transition-colors">
                        <div className="h-11 w-11 rounded-full bg-[#007BFF] flex items-center justify-center group-hover:bg-[#0069d9] transition-colors shadow-sm shrink-0">
                          <ImageIcon className="h-5 w-5 text-white stroke-[2]" />
                        </div>
                        <span className="text-[15px] text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors font-medium">Photos & videos</span>
                        <input
                          type="file"
                          accept="image/*,video/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleSendDocument(file);
                            e.target.value = '';
                          }}
                        />
                      </label>
                      
                      </div>
                    </>
                  )}
                </div>
              </>
            )}

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

            {/* Document sharing configuration modal removed for direct upload */}

            {/* Keyboard Form Editor */}
            {!isRecordingVoice && (
              <form onSubmit={handleSendText} className="flex-1">
                <input
                  type="text"
                  placeholder={contacts.length === 0 ? "No contacts in CRM to message..." : "Type a message"}
                  value={typedMessage}
                  onChange={(e) => setTypedMessage(e.target.value)}
                  disabled={contacts.length === 0}
                  className="w-full bg-white dark:bg-zinc-900/50 border border-transparent dark:border-zinc-800/50 focus:border-zinc-300 dark:focus:border-zinc-700 shadow-sm dark:shadow-none rounded-lg py-2.5 px-4 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none transition-colors"
                />
              </form>
            )}

            {/* Right Side Buttons (Cancel/Send/Mic) */}
            {isRecordingVoice ? (
              <div className="flex items-center gap-1.5 shrink-0 ml-1">
                <button
                  type="button"
                  onClick={handleCancelVoiceRecording}
                  className="h-10 w-10 flex items-center justify-center text-rose-400 hover:text-rose-300 rounded-full hover:bg-zinc-800 transition-all shadow-sm"
                  title="Cancel recording"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={handleToggleVoiceRecording}
                  className="h-10 w-10 bg-emerald-500 text-white rounded-full flex items-center justify-center hover:bg-emerald-600 transition-all shadow-sm"
                  title="Send voice mail"
                >
                  <Send className="h-5 w-5 stroke-[2] -ml-0.5" />
                </button>
              </div>
            ) : (
              typedMessage.trim() ? (
                <button 
                  type="button"
                  onClick={handleSendText}
                  disabled={contacts.length === 0}
                  className="h-10 w-10 bg-emerald-500 text-white rounded-full flex items-center justify-center hover:bg-emerald-600 transition-all shadow-md shrink-0 ml-1"
                >
                  <Send className="h-4.5 w-4.5 stroke-[2.2] -ml-0.5" />
                </button>
              ) : (
                <button 
                  type="button"
                  onClick={handleToggleVoiceRecording}
                  disabled={contacts.length === 0}
                  className={`h-10 w-10 flex items-center justify-center rounded-full transition-all shrink-0 ml-1 ${
                    contacts.length === 0 ? 'text-zinc-300 dark:text-zinc-700 cursor-not-allowed' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer'
                  }`}
                  title="Voice message"
                >
                  <Mic className="h-6 w-6 stroke-[2]" />
                </button>
              )
            )}
          </div>

        </div>

      </div>

      {/* Synced Flow Form Submission Details Modal */}
      {selectedFlowResponse && (() => {
        // Parse JSON if available
        let parsedData: Record<string, string> = {};
        let rawJson = '';
        try {
          const bodyStr = selectedFlowResponse.body;
          const jsonStartIdx = bodyStr.indexOf('{');
          if (jsonStartIdx !== -1) {
            rawJson = bodyStr.substring(jsonStartIdx);
            parsedData = JSON.parse(rawJson);
          }
        } catch (e) {
          console.error('Failed to parse form response JSON:', e);
        }

        return (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200 relative space-y-4">
              <button 
                onClick={() => setSelectedFlowResponse(null)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase tracking-wider text-xs border-b border-zinc-850 pb-2.5">
                <FileText className="h-4.5 w-4.5" />
                WhatsApp Flow Form Details
              </div>

              <div className="space-y-3">
                <p className="text-[10px] text-zinc-500 leading-normal">
                  This window parses and displays the native metadata fields submitted by the client via Meta Flows API.
                </p>

                <div className="bg-zinc-950 border border-zinc-850 rounded-xl overflow-hidden divide-y divide-zinc-900 shadow-inner">
                  {Object.keys(parsedData).length > 0 ? (
                    Object.entries(parsedData).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center p-3 text-xs">
                        <span className="font-bold text-zinc-550 capitalize font-mono text-[10px]">{key.replace('_', ' ')}</span>
                        <span className="text-zinc-200 font-semibold">{String(value)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-xs text-zinc-550 italic text-center">
                      No parsed parameter data found in flow response body.
                    </div>
                  )}
                </div>

                {rawJson && (
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Raw Submitted JSON</span>
                    <pre className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-3 text-[10px] text-emerald-400 font-mono overflow-x-auto select-all max-h-36">
                      {JSON.stringify(parsedData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-zinc-800 flex justify-end">
                <button 
                  onClick={() => setSelectedFlowResponse(null)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                >
                  Close Viewer
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </DashboardShell>
  );
}
