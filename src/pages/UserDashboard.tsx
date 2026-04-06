import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mail, Trash2, Settings, Copy, Power, RefreshCw, CheckCircle2, AlertCircle, ArrowLeft, UserCircle2, Menu, X, Database, Send } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuthStore } from '../store/auth';
import { useNavigate } from 'react-router-dom';

// Utility for Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Email = {
  _id: string;
  otp: string | null;
  fullBody: string;
  htmlBody?: string;
  recipientAlias: string;
  from?: string;
  subject?: string;
  timestamp: string;
  receivedAt: string;
  assignedTo?: string;
};

type User = {
  _id: string;
  username: string;
  email: string;
};

export default function UserDashboard() {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'inbox' | 'trash' | 'settings'>('inbox');
  const [liveMode, setLiveMode] = useState(false);
  const [emails, setEmails] = useState<Email[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const lastEmailIdRef = useRef<string | null>(null);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const fetchEmails = useCallback(async (isInitial = false) => {
    if (!token) {
      console.log('[FRONTEND EMAIL FETCH] No token found, skipping fetch.');
      return;
    }
    try {
      console.log(`[FRONTEND EMAIL FETCH] Starting fetch. isInitial: ${isInitial}`);
      if (isInitial) setLoading(true);
      
      const endpoint = user?.isAdmin ? '/api/admin/emails' : '/api/my-emails';
      console.log(`[FRONTEND EMAIL FETCH] Calling endpoint: ${endpoint}`);
      
      const res = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log(`[FRONTEND EMAIL FETCH] Response status: ${res.status}`);
      if (!res.ok) throw new Error(`Failed to fetch emails. Status: ${res.status}`);
      
      const data = await res.json();
      console.log(`[FRONTEND EMAIL FETCH] Received ${data.length} emails from server.`);
      
      if (data.length > 0) {
        const latestId = data[0]._id;
        
        // Check for new emails and trigger notifications
        if (lastEmailIdRef.current && lastEmailIdRef.current !== latestId) {
          console.log(`[FRONTEND EMAIL FETCH] New emails detected! Old latest ID: ${lastEmailIdRef.current}, New latest ID: ${latestId}`);
          const newEmails = [];
          for (const email of data) {
            if (email._id === lastEmailIdRef.current) break;
            newEmails.push(email);
          }
          console.log(`[FRONTEND EMAIL FETCH] Found ${newEmails.length} new emails.`);
          
          // Show notification for new emails with OTP
          newEmails.forEach(email => {
            if (email.otp) {
              console.log(`[FRONTEND EMAIL FETCH] New email contains OTP: ${email.otp}. Checking notification permissions...`);
              if ('Notification' in window) {
                if (Notification.permission === 'granted') {
                  console.log(`[FRONTEND EMAIL FETCH] Triggering notification for OTP: ${email.otp}`);
                  new Notification(`OTP: ${email.otp}`, {
                    body: `For: ${email.recipientAlias}`,
                  });
                } else {
                  console.log(`[FRONTEND EMAIL FETCH] Notification permission not granted. Current status: ${Notification.permission}`);
                }
              } else {
                console.log(`[FRONTEND EMAIL FETCH] Notifications not supported in this browser.`);
              }
            }
          });
        }
        
        lastEmailIdRef.current = latestId;
      }

      setEmails(prev => {
        // Only update if data actually changed to prevent unnecessary re-renders
        if (JSON.stringify(prev) === JSON.stringify(data)) {
          console.log(`[FRONTEND EMAIL FETCH] Data unchanged, skipping state update.`);
          return prev;
        }
        console.log(`[FRONTEND EMAIL FETCH] Data changed, updating state.`);
        return data;
      });
      setError(null);
    } catch (err) {
      console.error('[FRONTEND EMAIL FETCH] Error during fetch:', err);
      if (isInitial) {
        setError('Failed to connect to the server or database.');
      }
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [token, user]);

  const fetchUsers = useCallback(async () => {
    if (!token || !user?.isAdmin) return;
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
  }, [token, user]);

  useEffect(() => {
    fetchEmails(true);
    fetchUsers();
    const interval = setInterval(() => fetchEmails(false), 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [fetchEmails, fetchUsers]);

  const deleteEmail = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const previousEmails = [...emails];
    const previousSelected = selectedEmail;
    
    setEmails(emails.filter(email => email._id !== id));
    if (selectedEmail?._id === id) {
      setSelectedEmail(null);
    }

    try {
      const endpoint = user?.isAdmin ? `/api/admin/emails/${id}` : `/api/my-emails/${id}`;
      const res = await fetch(endpoint, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed');
    } catch (err) {
      console.error('Failed to delete email', err);
      setEmails(previousEmails);
      setSelectedEmail(previousSelected);
    }
  };

  const assignEmail = async (emailId: string, userId: string) => {
    const previousEmails = [...emails];
    const previousSelected = selectedEmail;
    
    const emailToUpdate = emails.find(e => e._id === emailId);
    if (emailToUpdate) {
      const updatedEmailOptimistic = { ...emailToUpdate, assignedTo: userId || null };
      setEmails(emails.map(e => e._id === emailId ? updatedEmailOptimistic : e));
      if (selectedEmail?._id === emailId) {
        setSelectedEmail(updatedEmailOptimistic);
      }
    }

    try {
      const res = await fetch(`/api/admin/emails/${emailId}/assign`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ userId })
      });
      if (!res.ok) throw new Error('Failed');
      const updatedEmail = await res.json();
      setEmails(prev => prev.map(e => e._id === emailId ? updatedEmail : e));
      if (selectedEmail?._id === emailId) {
        setSelectedEmail(updatedEmail);
      }
    } catch (err) {
      console.error('Failed to assign email', err);
      setEmails(previousEmails);
      setSelectedEmail(previousSelected);
    }
  };

  const clearAll = async () => {
    const previousEmails = [...emails];
    const previousSelected = selectedEmail;
    
    setEmails([]);
    setSelectedEmail(null);

    try {
      if (user?.isAdmin) {
        const res = await fetch('/api/admin/emails', { 
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed');
      }
    } catch (err) {
      console.error('Failed to clear emails', err);
      setEmails(previousEmails);
      setSelectedEmail(previousSelected);
    }
  };

  const handleCopy = (text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to extract name from "Name <email@domain.com>" format
  const getSenderName = (fromStr?: string) => {
    if (!fromStr) return 'Unknown Sender';
    const match = fromStr.match(/^([^<]+)</);
    return match ? match[1].trim() : fromStr;
  };

  const latestEmail = emails[0];

  if (liveMode) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-zinc-100 p-4 relative antialiased selection:bg-emerald-500/30">
        <button
          onClick={() => setLiveMode(false)}
          className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-full transition-all duration-200 active:scale-95"
        >
          <Power className="w-4 h-4 text-red-500" />
          <span className="text-sm font-medium text-zinc-300">Exit Live Mode</span>
        </button>

        {!latestEmail ? (
          <div className="flex flex-col items-center text-zinc-500">
            <RefreshCw className="w-10 h-10 animate-spin mb-6 opacity-20" />
            <p className="text-lg font-medium tracking-tight">Waiting for incoming emails...</p>
          </div>
        ) : latestEmail.otp ? (
          <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
            <div className="text-emerald-500/80 mb-6 text-xs uppercase tracking-[0.2em] font-bold flex items-center gap-3 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 transform-gpu"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Latest OTP Received
            </div>
            <div className="text-[7rem] sm:text-[11rem] font-mono font-bold leading-none tracking-tighter text-white mb-10">
              {latestEmail.otp}
            </div>
            
            <div className="flex flex-col items-center gap-8">
              <button
                onClick={() => handleCopy(latestEmail.otp!)}
                className={cn(
                  "flex items-center gap-3 px-8 py-4 rounded-full text-lg font-semibold transition-all duration-200 active:scale-95",
                  copied 
                    ? "bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]" 
                    : "bg-white text-black hover:bg-zinc-200"
                )}
              >
                {copied ? <CheckCircle2 className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                {copied ? "Copied to Clipboard" : "Copy OTP"}
              </button>
              
              <div className="flex items-center gap-3 text-zinc-500 text-sm font-medium">
                <span>For: <span className="text-zinc-300">{latestEmail.recipientAlias}</span></span>
                <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                <span>Received {formatDistanceToNow(new Date(latestEmail.receivedAt || latestEmail.timestamp))} ago</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
            <div className="text-amber-500/80 mb-6 text-xs uppercase tracking-[0.2em] font-bold flex items-center gap-3 bg-amber-500/10 px-4 py-2 rounded-full border border-amber-500/20">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Latest Email Status
            </div>
            <div className="text-5xl sm:text-7xl font-mono font-bold leading-none tracking-tighter text-zinc-700 mb-10">
              NO OTP
            </div>
            <div className="flex items-center gap-3 text-zinc-500 text-sm font-medium">
              <span>From: <span className="text-zinc-400">{getSenderName(latestEmail.from)}</span></span>
              <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
              <span>Received {formatDistanceToNow(new Date(latestEmail.receivedAt || latestEmail.timestamp))} ago</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col md:flex-row font-sans text-zinc-900 relative antialiased selection:bg-blue-200">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-[#F4F4F5] border-r border-zinc-200/80 flex flex-col transform transition-transform duration-300 ease-in-out shrink-0 shadow-2xl md:shadow-none",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full",
        "md:translate-x-0 md:static"
      )}>
        <div className="p-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center shrink-0 shadow-sm">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-zinc-900 tracking-tight">Mailbox</h1>
          </div>
          <button 
            className="p-2 text-zinc-500 hover:bg-zinc-200/80 rounded-lg md:hidden transition-colors"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="px-5 py-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
          <Database className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-zinc-500">Database</span>
          {error ? (
            <span className="ml-auto text-red-600 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span> Disconnected</span>
          ) : (
            <span className="ml-auto text-emerald-600 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span> Connected</span>
          )}
        </div>
        
        <nav className="flex-1 p-3 space-y-1.5 mt-2">
          <button
            onClick={() => { setActiveTab('inbox'); setSelectedEmail(null); setIsSidebarOpen(false); }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              activeTab === 'inbox' ? "bg-white text-black shadow-sm border border-zinc-200/60" : "text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-900 border border-transparent"
            )}
          >
            <Mail className="w-4 h-4" />
            Inbox
            {emails.length > 0 && (
              <span className="ml-auto bg-black text-white py-0.5 px-2.5 rounded-full text-xs font-bold shadow-sm">
                {emails.length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => { setActiveTab('trash'); setSelectedEmail(null); setIsSidebarOpen(false); }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              activeTab === 'trash' ? "bg-white text-red-600 shadow-sm border border-zinc-200/60" : "text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-900 border border-transparent"
            )}
          >
            <Trash2 className="w-4 h-4" />
            Trash
          </button>
          
          {user?.isAdmin && (
            <button
              onClick={() => { setActiveTab('settings'); setSelectedEmail(null); setIsSidebarOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                activeTab === 'settings' ? "bg-white text-black shadow-sm border border-zinc-200/60" : "text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-900 border border-transparent"
              )}
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
          )}
        </nav>

        <div className="p-4 space-y-2.5">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-200/50 hover:bg-zinc-200 text-zinc-800 rounded-lg text-sm font-semibold transition-all duration-200 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
          <button
            onClick={() => setLiveMode(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-black hover:bg-zinc-800 text-white rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
          >
            <Power className="w-4 h-4 text-emerald-400" />
            Live OTP Mode
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#FAFAFA] w-full">
        {/* Header */}
        <header className="bg-white border-b border-zinc-200/80 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            {selectedEmail && (
              <button 
                onClick={() => setSelectedEmail(null)}
                className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all active:scale-95"
                title="Back to inbox"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-lg font-bold text-zinc-900 capitalize tracking-tight">
              {selectedEmail ? 'Read Email' : activeTab}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => fetchEmails(true)}
              className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all active:scale-95"
              title="Refresh"
            >
              <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
            </button>
            {selectedEmail && (
              <button
                onClick={(e) => deleteEmail(selectedEmail._id, e)}
                className="p-2 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all active:scale-95"
                title="Delete"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-5xl mx-auto h-full">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-800 shadow-sm animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
                <div>
                  <h3 className="font-bold">Connection Error</h3>
                  <p className="text-sm mt-1 opacity-90">{error}</p>
                </div>
              </div>
            )}

            {/* Full Email View */}
            {selectedEmail ? (
              <div className="bg-white rounded-2xl shadow-sm border border-zinc-200/80 p-6 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 tracking-tight leading-tight">
                    {selectedEmail.subject || '(No Subject)'}
                  </h1>
                  
                  {/* Admin Assignment Controls */}
                  {user?.isAdmin && (
                    <div className="flex items-center gap-3 bg-zinc-50 px-4 py-2.5 rounded-xl border border-zinc-200/80 shrink-0">
                      <span className="text-sm font-semibold text-zinc-600 uppercase tracking-wider">Assign:</span>
                      <select 
                        className="text-sm font-medium bg-white border border-zinc-200 rounded-lg py-1.5 pl-3 pr-8 focus:ring-2 focus:ring-black focus:border-black outline-none transition-all cursor-pointer"
                        value={selectedEmail.assignedTo || ''}
                        onChange={(e) => assignEmail(selectedEmail._id, e.target.value)}
                      >
                        <option value="">Unassigned</option>
                        {users.map(u => (
                          <option key={u._id} value={u._id}>{u.username} ({u.email})</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                
                <div className="flex items-start justify-between mb-10 pb-8 border-b border-zinc-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-zinc-100 text-zinc-600 rounded-full flex items-center justify-center font-bold text-xl shrink-0 border border-zinc-200/80">
                      {getSenderName(selectedEmail.from).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-zinc-900 text-lg">{getSenderName(selectedEmail.from)}</span>
                        <span className="text-sm text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200/50">&lt;{selectedEmail.from}&gt;</span>
                      </div>
                      <div className="text-sm text-zinc-500 mt-1 font-medium">
                        to <span className="text-zinc-700">{selectedEmail.recipientAlias}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-zinc-400 whitespace-nowrap bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-100">
                    {format(new Date(selectedEmail.receivedAt || selectedEmail.timestamp), 'MMM d, yyyy, h:mm a')}
                  </div>
                </div>

                <div className="prose prose-zinc max-w-none">
                  {selectedEmail.htmlBody || (selectedEmail.fullBody && selectedEmail.fullBody.trim().startsWith('<')) ? (
                    <iframe
                      srcDoc={selectedEmail.htmlBody || selectedEmail.fullBody}
                      className="w-full min-h-[600px] border-0 rounded-xl bg-white"
                      title="Email Content"
                      sandbox="allow-same-origin allow-popups"
                    />
                  ) : (
                    <div className="whitespace-pre-wrap text-base text-zinc-800 font-sans leading-relaxed bg-zinc-50/50 p-6 rounded-xl border border-zinc-100">
                      {selectedEmail.fullBody}
                    </div>
                  )}
                </div>
              </div>
          ) : (
            /* List View */
            <>
              {activeTab === 'inbox' && (
                <div className="bg-white rounded-2xl shadow-sm border border-zinc-200/80 overflow-hidden">
                  <div className="divide-y divide-zinc-100">
                    {emails.length === 0 && !loading && !error ? (
                      <div className="text-center py-32">
                        <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-zinc-100">
                          <Mail className="w-10 h-10 text-zinc-300" />
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 tracking-tight">Your inbox is empty</h3>
                        <p className="text-zinc-500 mt-2 font-medium">Waiting for incoming emails...</p>
                      </div>
                    ) : (
                      emails.map((email) => (
                        <div 
                          key={email._id} 
                          onClick={() => setSelectedEmail(email)}
                          className="group flex items-center gap-4 px-6 py-4 hover:bg-[#FAFAFA] cursor-pointer transition-all duration-200 border-l-2 border-transparent hover:border-black"
                        >
                          <div className="w-48 shrink-0 flex items-center gap-3 truncate">
                            <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center shrink-0 border border-zinc-200/80 group-hover:bg-white transition-colors">
                              <span className="text-xs font-bold text-zinc-600">{getSenderName(email.from).charAt(0).toUpperCase()}</span>
                            </div>
                            <span className="font-bold text-zinc-900 text-sm truncate">
                              {getSenderName(email.from)}
                            </span>
                          </div>
                          
                          <div className="flex-1 min-w-0 flex items-center gap-3 text-sm">
                            <span className="font-bold text-zinc-900 truncate max-w-[250px]">
                              {email.subject || '(No Subject)'}
                            </span>
                            <span className="text-zinc-300 shrink-0 font-bold">-</span>
                            <span className="text-zinc-500 truncate font-medium">
                              {email.fullBody.replace(/\s+/g, ' ').substring(0, 120)}
                            </span>
                          </div>
                          
                          {user?.isAdmin && (
                            <div className="w-auto shrink-0 text-xs flex gap-2">
                              {email.status === 'admin' && (
                                <span className="bg-purple-50 text-purple-700 border border-purple-200/60 px-2.5 py-1 rounded-md font-bold tracking-wide">ADMIN</span>
                              )}
                              {email.status === 'pending' && (
                                <span className="bg-zinc-100 text-zinc-600 border border-zinc-200/60 px-2.5 py-1 rounded-md font-bold tracking-wide">PENDING</span>
                              )}
                              {email.status === 'stock' && (
                                <span className="bg-blue-50 text-blue-700 border border-blue-200/60 px-2.5 py-1 rounded-md font-bold tracking-wide">STOCK</span>
                              )}
                              {email.assignedTo ? (
                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2.5 py-1 rounded-md font-bold tracking-wide">Assigned</span>
                              ) : (
                                <span className="bg-amber-50 text-amber-700 border border-amber-200/60 px-2.5 py-1 rounded-md font-bold tracking-wide">Unassigned</span>
                              )}
                            </div>
                          )}
                          
                          <div className="w-28 shrink-0 text-right text-xs font-bold text-zinc-400 group-hover:hidden">
                            {formatDistanceToNow(new Date(email.receivedAt || email.timestamp), { addSuffix: true })}
                          </div>

                          <div className="w-28 shrink-0 flex justify-end gap-2 hidden group-hover:flex">
                            <button
                              onClick={(e) => deleteEmail(email._id, e)}
                              className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors active:scale-95"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'trash' && (
                <div className="bg-white rounded-2xl shadow-sm border border-zinc-200/80 p-8">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-bold text-zinc-900 tracking-tight">Deleted Emails</h3>
                    <button 
                      onClick={clearAll}
                      className="text-sm text-red-600 hover:text-red-700 font-bold px-5 py-2.5 hover:bg-red-50 rounded-lg transition-all active:scale-95 border border-transparent hover:border-red-100"
                    >
                      Empty Trash
                    </button>
                  </div>
                  <div className="text-center py-24 border-2 border-dashed border-zinc-100 rounded-2xl bg-[#FAFAFA]">
                    <Trash2 className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                    <p className="text-zinc-500 font-medium">Trash is empty</p>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && user?.isAdmin && (
                <div className="max-w-3xl mx-auto space-y-6">
                  <div className="bg-white border border-zinc-200/80 rounded-2xl p-8 shadow-sm">
                    <h3 className="text-lg font-bold text-zinc-900 mb-2 tracking-tight">Webhook Configuration</h3>
                    <p className="text-zinc-500 mb-8 text-sm font-medium">
                      Configure your Cloudflare Email Worker to forward emails to this endpoint.
                    </p>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-zinc-700 mb-2">Webhook URL</label>
                        <div className="flex items-center gap-3">
                          <code className="flex-1 block p-3.5 bg-zinc-50 border border-zinc-200/80 rounded-xl text-sm text-zinc-800 font-mono font-medium">
                            {window.location.origin}/webhook/email
                          </code>
                          <button 
                            onClick={() => handleCopy(`${window.location.origin}/webhook/email`)}
                            className="p-3.5 bg-black hover:bg-zinc-800 text-white rounded-xl transition-all active:scale-95 shadow-sm"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-zinc-200/80 rounded-2xl p-8 shadow-sm">
                    <h3 className="text-lg font-bold text-zinc-900 mb-6 tracking-tight">Cloudflare Worker Code</h3>
                    <div className="relative group">
                      <pre className="p-6 bg-[#09090b] text-zinc-300 rounded-xl text-sm font-mono overflow-x-auto border border-zinc-800 shadow-inner">
{`export default {
  async email(message, env, ctx) {
    const rawEmail = await new Response(message.raw).text();
    
    const renderUrl = "${window.location.origin}/webhook/email";

    await fetch(renderUrl, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-api-secret-key": "YOUR_API_SECRET_KEY" // Add your key here
      },
      body: JSON.stringify({
        from: message.from,
        to: message.to,
        subject: message.headers.get("subject"),
        body: rawEmail
      })
    });
  }
}`}
                      </pre>
                      <button 
                        onClick={() => handleCopy(`export default {
  async email(message, env, ctx) {
    const rawEmail = await new Response(message.raw).text();
    
    const renderUrl = "${window.location.origin}/webhook/email";

    await fetch(renderUrl, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-api-secret-key": "YOUR_API_SECRET_KEY" // Add your key here
      },
      body: JSON.stringify({
        from: message.from,
        to: message.to,
        subject: message.headers.get("subject"),
        body: rawEmail
      })
    });
  }
}`)}
                        className="absolute top-4 right-4 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm active:scale-95"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        </div>
      </main>
    </div>
  );
}
