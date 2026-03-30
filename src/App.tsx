import { useState, useEffect } from 'react';
import { Mail, Trash2, Settings, Copy, Power, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
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
  recipientAlias: string;
  timestamp: string;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'inbox' | 'trash' | 'settings'>('inbox');
  const [liveMode, setLiveMode] = useState(false);
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

  const deleteEmail = async (id: string) => {
    try {
      await fetch(`/api/emails/${id}`, { method: 'DELETE' });
      setEmails(emails.filter(e => e._id !== id));
    } catch (err) {
      console.error('Failed to delete email', err);
    }
  };

  const clearAll = async () => {
    try {
      await fetch('/api/emails', { method: 'DELETE' });
      setEmails([]);
    } catch (err) {
      console.error('Failed to clear emails', err);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const latestEmailWithOtp = emails.find(e => e.otp);

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

        {latestEmailWithOtp ? (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
            <div className="text-zinc-500 mb-4 text-sm uppercase tracking-widest font-semibold flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              Latest OTP Received
            </div>
            <div className="text-[8rem] sm:text-[12rem] font-mono font-bold leading-none tracking-tighter text-white mb-8 drop-shadow-2xl">
              {latestEmailWithOtp.otp}
            </div>
            
            <div className="flex flex-col items-center gap-6">
              <button
                onClick={() => handleCopy(latestEmailWithOtp.otp!)}
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
                <span>For: <span className="text-zinc-300 font-medium">{latestEmailWithOtp.recipientAlias}</span></span>
                <span>•</span>
                <span>Received {formatDistanceToNow(new Date(latestEmailWithOtp.timestamp))} ago</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-zinc-500">
            <RefreshCw className="w-12 h-12 animate-spin mb-4 opacity-20" />
            <p className="text-xl font-medium">Waiting for OTP emails...</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-zinc-200 flex flex-col">
        <div className="p-6 border-b border-zinc-200">
          <h1 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
            <Mail className="w-6 h-6 text-blue-600" />
            OTP Dashboard
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => setActiveTab('inbox')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
              activeTab === 'inbox' ? "bg-blue-50 text-blue-700" : "text-zinc-600 hover:bg-zinc-100"
            )}
          >
            <Mail className="w-5 h-5" />
            Inbox
            {emails.length > 0 && (
              <span className="ml-auto bg-blue-100 text-blue-700 py-0.5 px-2 rounded-full text-xs">
                {emails.length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('trash')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
              activeTab === 'trash' ? "bg-red-50 text-red-700" : "text-zinc-600 hover:bg-zinc-100"
            )}
          >
            <Trash2 className="w-5 h-5" />
            Trash
          </button>
          
          <button
            onClick={() => setActiveTab('settings')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
              activeTab === 'settings' ? "bg-zinc-100 text-zinc-900" : "text-zinc-600 hover:bg-zinc-100"
            )}
          >
            <Settings className="w-5 h-5" />
            Settings
          </button>
        </nav>

        <div className="p-4 border-t border-zinc-200">
          <button
            onClick={() => setLiveMode(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Power className="w-4 h-4 text-green-400" />
            Enter Live OTP Mode
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-zinc-200 px-8 py-5 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-semibold text-zinc-800 capitalize">{activeTab}</h2>
          <div className="flex items-center gap-4">
            <button 
              onClick={fetchEmails}
              className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors"
              title="Refresh"
            >
              <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-800">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold">Connection Error</h3>
                <p className="text-sm mt-1 opacity-90">{error}</p>
              </div>
            </div>
          )}

          {activeTab === 'inbox' && (
            <div className="space-y-4 max-w-5xl mx-auto">
              {emails.length === 0 && !loading && !error ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-zinc-400" />
                  </div>
                  <h3 className="text-lg font-medium text-zinc-900">Your inbox is empty</h3>
                  <p className="text-zinc-500 mt-1">Waiting for incoming emails from Cloudflare...</p>
                </div>
              ) : (
                emails.map((email) => (
                  <div 
                    key={email._id} 
                    className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group flex flex-col sm:flex-row sm:items-center gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {email.recipientAlias}
                        </span>
                        <span className="text-sm text-zinc-500">
                          {formatDistanceToNow(new Date(email.timestamp))} ago
                        </span>
                      </div>
                      <p className="text-zinc-900 font-medium truncate">
                        {email.otp ? `OTP Received: ${email.otp}` : 'No OTP found in email'}
                      </p>
                      <p className="text-zinc-500 text-sm truncate mt-1">
                        {email.fullBody.substring(0, 100)}...
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0">
                      {email.otp && (
                        <button
                          onClick={() => handleCopy(email.otp!)}
                          className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                          <Copy className="w-4 h-4" />
                          Copy
                        </button>
                      )}
                      <button
                        onClick={() => deleteEmail(email._id)}
                        className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'trash' && (
            <div className="max-w-5xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-zinc-600 font-medium">Deleted Emails</h3>
                <button 
                  onClick={clearAll}
                  className="text-sm text-red-600 hover:text-red-700 font-medium px-4 py-2 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Empty Trash
                </button>
              </div>
              <div className="text-center py-20 border-2 border-dashed border-zinc-200 rounded-2xl">
                <Trash2 className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                <p className="text-zinc-500">Trash is empty</p>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-3xl mx-auto space-y-8">
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-zinc-900 mb-4">Webhook Configuration</h3>
                <p className="text-zinc-600 mb-6 text-sm">
                  Configure your Cloudflare Email Worker to forward emails to this endpoint.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Webhook URL</label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 block p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 font-mono">
                        {window.location.origin}/webhook/email
                      </code>
                      <button 
                        onClick={() => handleCopy(`${window.location.origin}/webhook/email`)}
                        className="p-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg transition-colors"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-zinc-900 mb-4">Cloudflare Worker Code</h3>
                <div className="relative">
                  <pre className="p-4 bg-zinc-950 text-zinc-300 rounded-xl text-sm font-mono overflow-x-auto">
{`export default {
  async email(message, env, ctx) {
    const rawEmail = await new Response(message.raw).text();
    
    const renderUrl = "${window.location.origin}/webhook/email";

    await fetch(renderUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: message.from,
        to: message.to,
        subject: message.headers.get("subject"),
        body: rawEmail
      })
    });
  }
}`)}
                    className="absolute top-4 right-4 p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
