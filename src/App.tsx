import { useState, useEffect } from 'react';
import { Mail, Trash2, Settings, Copy, Power, RefreshCw, CheckCircle2, AlertCircle, ArrowLeft, UserCircle2, Menu, X, Database } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'inbox' | 'trash' | 'settings'>('inbox');
  const [liveMode, setLiveMode] = useState(false);
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/emails');
      if (!res.ok) throw new Error('Failed to fetch emails');
      const data = await res.json();
      setEmails(data);
      setError(null);
    } catch (err) {
      setError('Failed to connect to the server or database. Please ensure MONGO_URI is set.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
    const interval = setInterval(fetchEmails, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const deleteEmail = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await fetch(`/api/emails/${id}`, { method: 'DELETE' });
      setEmails(emails.filter(email => email._id !== id));
      if (selectedEmail?._id === id) {
        setSelectedEmail(null);
      }
    } catch (err) {
      console.error('Failed to delete email', err);
    }
  };

  const clearAll = async () => {
    try {
      await fetch('/api/emails', { method: 'DELETE' });
      setEmails([]);
      setSelectedEmail(null);
    } catch (err) {
      console.error('Failed to clear emails', err);
    }
  };

  const handleCopy = (text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const latestEmail = emails[0];

  if (liveMode) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white p-4 relative">
        <button
          onClick={() => setLiveMode(false)}
          className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors"
        >
          <Power className="w-4 h-4 text-red-400" />
          <span className="text-sm font-medium">Exit Live Mode</span>
        </button>

        {!latestEmail ? (
          <div className="flex flex-col items-center text-zinc-500">
            <RefreshCw className="w-12 h-12 animate-spin mb-4 opacity-20" />
            <p className="text-xl font-medium">Waiting for incoming emails...</p>
          </div>
        ) : latestEmail.otp ? (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
            <div className="text-zinc-500 mb-4 text-sm uppercase tracking-widest font-semibold flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              Latest OTP Received
            </div>
            <div className="text-[8rem] sm:text-[12rem] font-mono font-bold leading-none tracking-tighter text-white mb-8 drop-shadow-2xl">
              {latestEmail.otp}
            </div>
            
            <div className="flex flex-col items-center gap-6">
              <button
                onClick={() => handleCopy(latestEmail.otp!)}
                className={cn(
                  "flex items-center gap-3 px-8 py-4 rounded-full text-xl font-medium transition-all duration-300",
                  copied 
                    ? "bg-green-500/20 text-green-400 border border-green-500/50" 
                    : "bg-white text-black hover:bg-zinc-200"
                )}
              >
                {copied ? <CheckCircle2 className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                {copied ? "Copied!" : "Copy OTP"}
              </button>
              
              <div className="flex items-center gap-4 text-zinc-400 text-sm">
                <span>For: <span className="text-zinc-300 font-medium">{latestEmail.recipientAlias}</span></span>
                <span>•</span>
                <span>Received {formatDistanceToNow(new Date(latestEmail.timestamp))} ago</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
            <div className="text-zinc-500 mb-4 text-sm uppercase tracking-widest font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              Latest Email Status
            </div>
            <div className="text-4xl sm:text-6xl font-mono font-bold leading-none tracking-tighter text-zinc-400 mb-8 drop-shadow-2xl">
              NO OTP
            </div>
            <div className="flex items-center gap-4 text-zinc-500 text-sm">
              <span>From: <span className="text-zinc-400 font-medium">{getSenderName(latestEmail.from)}</span></span>
              <span>•</span>
              <span>Received {formatDistanceToNow(new Date(latestEmail.timestamp))} ago</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Helper to extract name from "Name <email@domain.com>" format
  const getSenderName = (fromStr?: string) => {
    if (!fromStr) return 'Unknown Sender';
    const match = fromStr.match(/^([^<]+)</);
    return match ? match[1].trim() : fromStr;
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row font-sans text-zinc-800 relative">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed md:static inset-y-0 left-0 z-50 w-64 bg-zinc-50 border-r border-zinc-200 flex flex-col transform transition-transform duration-300 ease-in-out md:transform-none",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-4 border-b border-zinc-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-zinc-900 tracking-tight">Mailbox</h1>
          </div>
          <button 
            className="md:hidden p-1 text-zinc-500 hover:bg-zinc-200 rounded"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="px-4 py-2 border-b border-zinc-200 bg-zinc-100/50 flex items-center gap-2 text-xs font-medium">
          <Database className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-zinc-600">Database:</span>
          {error ? (
            <span className="text-red-600 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Disconnected</span>
          ) : (
            <span className="text-green-600 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Connected</span>
          )}
        </div>
        
        <nav className="flex-1 p-3 space-y-1">
          <button
            onClick={() => { setActiveTab('inbox'); setSelectedEmail(null); setIsSidebarOpen(false); }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              activeTab === 'inbox' ? "bg-blue-100/50 text-blue-700" : "text-zinc-600 hover:bg-zinc-200/50"
            )}
          >
            <Mail className="w-4 h-4" />
            Inbox
            {emails.length > 0 && (
              <span className="ml-auto bg-blue-600 text-white py-0.5 px-2 rounded-full text-xs font-bold">
                {emails.length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => { setActiveTab('trash'); setSelectedEmail(null); setIsSidebarOpen(false); }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              activeTab === 'trash' ? "bg-red-50 text-red-700" : "text-zinc-600 hover:bg-zinc-200/50"
            )}
          >
            <Trash2 className="w-4 h-4" />
            Trash
          </button>
          
          <button
            onClick={() => { setActiveTab('settings'); setSelectedEmail(null); setIsSidebarOpen(false); }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              activeTab === 'settings' ? "bg-zinc-200/50 text-zinc-900" : "text-zinc-600 hover:bg-zinc-200/50"
            )}
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </nav>

        <div className="p-4">
          <button
            onClick={() => setLiveMode(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-md text-sm font-medium transition-colors shadow-sm"
          >
            <Power className="w-4 h-4 text-green-400" />
            Live OTP Mode
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-white w-full">
        {/* Header */}
        <header className="bg-white border-b border-zinc-200 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-1.5 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-md transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            {selectedEmail && (
              <button 
                onClick={() => setSelectedEmail(null)}
                className="p-1.5 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-full transition-colors"
                title="Back to inbox"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-base font-semibold text-zinc-800 capitalize">
              {selectedEmail ? 'Read Email' : activeTab}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={fetchEmails}
              className="p-1.5 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-full transition-colors"
              title="Refresh"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </button>
            {selectedEmail && (
              <button
                onClick={(e) => deleteEmail(selectedEmail._id, e)}
                className="p-1.5 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {error && (
            <div className="m-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-800">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold">Connection Error</h3>
                <p className="text-sm mt-1 opacity-90">{error}</p>
              </div>
            </div>
          )}

          {/* Full Email View */}
          {selectedEmail ? (
            <div className="p-6 max-w-4xl mx-auto animate-in fade-in duration-200">
              <h1 className="text-2xl font-normal text-zinc-900 mb-6">
                {selectedEmail.subject || '(No Subject)'}
              </h1>
              
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold text-lg shrink-0">
                    {getSenderName(selectedEmail.from).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-zinc-900">{getSenderName(selectedEmail.from)}</span>
                      <span className="text-sm text-zinc-500">&lt;{selectedEmail.from}&gt;</span>
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      to {selectedEmail.recipientAlias}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-zinc-500 whitespace-nowrap">
                  {format(new Date(selectedEmail.timestamp), 'MMM d, yyyy, h:mm a')}
                </div>
              </div>

              <div className="prose prose-zinc max-w-none bg-white rounded-lg">
                {selectedEmail.htmlBody || (selectedEmail.fullBody && selectedEmail.fullBody.trim().startsWith('<')) ? (
                  <iframe
                    srcDoc={selectedEmail.htmlBody || selectedEmail.fullBody}
                    className="w-full min-h-[600px] border-0"
                    title="Email Content"
                    sandbox="allow-same-origin allow-popups"
                  />
                ) : (
                  <div className="whitespace-pre-wrap text-sm text-zinc-800 font-sans leading-relaxed">
                    {selectedEmail.fullBody}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* List View */
            <>
              {activeTab === 'inbox' && (
                <div className="divide-y divide-zinc-100">
                  {emails.length === 0 && !loading && !error ? (
                    <div className="text-center py-20">
                      <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-8 h-8 text-zinc-300" />
                      </div>
                      <h3 className="text-lg font-medium text-zinc-900">Your inbox is empty</h3>
                      <p className="text-zinc-500 mt-1 text-sm">Waiting for incoming emails...</p>
                    </div>
                  ) : (
                    emails.map((email) => (
                      <div 
                        key={email._id} 
                        onClick={() => setSelectedEmail(email)}
                        className="group flex items-center gap-4 px-4 py-3 hover:bg-zinc-50 hover:shadow-[inset_1px_0_0_#2563eb] cursor-pointer transition-all bg-white"
                      >
                        <div className="w-48 shrink-0 flex items-center gap-2 truncate">
                          <UserCircle2 className="w-5 h-5 text-zinc-400 shrink-0" />
                          <span className="font-medium text-zinc-900 text-sm truncate">
                            {getSenderName(email.from)}
                          </span>
                        </div>
                        
                        <div className="flex-1 min-w-0 flex items-center gap-2 text-sm">
                          <span className="font-medium text-zinc-900 truncate max-w-[200px]">
                            {email.subject || '(No Subject)'}
                          </span>
                          <span className="text-zinc-400 shrink-0">-</span>
                          <span className="text-zinc-500 truncate">
                            {email.fullBody.replace(/\s+/g, ' ').substring(0, 100)}
                          </span>
                        </div>
                        
                        <div className="w-24 shrink-0 text-right text-xs font-medium text-zinc-500 group-hover:hidden">
                          {formatDistanceToNow(new Date(email.timestamp), { addSuffix: true })}
                        </div>

                        <div className="w-24 shrink-0 flex justify-end gap-2 hidden group-hover:flex">
                          <button
                            onClick={(e) => deleteEmail(email._id, e)}
                            className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'trash' && (
                <div className="p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-zinc-900 font-medium">Deleted Emails</h3>
                    <button 
                      onClick={clearAll}
                      className="text-sm text-red-600 hover:text-red-700 font-medium px-4 py-2 hover:bg-red-50 rounded-md transition-colors"
                    >
                      Empty Trash
                    </button>
                  </div>
                  <div className="text-center py-20 border border-dashed border-zinc-200 rounded-xl bg-zinc-50">
                    <Trash2 className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                    <p className="text-zinc-500 text-sm">Trash is empty</p>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="p-8 max-w-3xl mx-auto space-y-8">
                  <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
                    <h3 className="text-base font-semibold text-zinc-900 mb-2">Webhook Configuration</h3>
                    <p className="text-zinc-500 mb-6 text-sm">
                      Configure your Cloudflare Email Worker to forward emails to this endpoint.
                    </p>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Webhook URL</label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 block p-2.5 bg-zinc-50 border border-zinc-200 rounded-md text-sm text-zinc-800 font-mono">
                            {window.location.origin}/webhook/email
                          </code>
                          <button 
                            onClick={() => handleCopy(`${window.location.origin}/webhook/email`)}
                            className="p-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-md transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
                    <h3 className="text-base font-semibold text-zinc-900 mb-4">Cloudflare Worker Code</h3>
                    <div className="relative">
                      <pre className="p-4 bg-zinc-950 text-zinc-300 rounded-lg text-sm font-mono overflow-x-auto">
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
                        className="absolute top-4 right-4 p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors"
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
      </main>
    </div>
  );
}
