import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../store/auth';
import { Copy, CheckCircle2, Inbox, Star, Send, File, Search, ArrowLeft, MoreVertical, Edit2, RefreshCw } from 'lucide-react';

export default function UserDashboard() {
  const { token } = useAuthStore();
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchEmails = useCallback(async (isManualRefresh = false) => {
    if (!token) {
      setEmails([]);
      setLoading(false);
      return;
    }
    if (isManualRefresh) setRefreshing(true);

    try {
      const res = await fetch('/api/my-emails', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setEmails(data);
      } else {
        setEmails([]);
      }
    } catch (err) {
      console.error(err);
      setEmails([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchEmails();
    const interval = setInterval(() => fetchEmails(false), 10000); // Auto refresh every 10s
    return () => clearInterval(interval);
  }, [fetchEmails]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredEmails = emails.filter(e => 
    (e.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.from || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.fullBody || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="pt-20 pb-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto h-screen flex flex-col relative z-10">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex-1 flex border border-gray-200 text-gray-800">
        {/* Sidebar */}
        <div className="w-64 bg-gray-50/50 border-r border-gray-200 hidden md:flex flex-col">
          <div className="p-4">
            <button className="bg-[#c2e7ff] hover:bg-[#b3dcf6] text-[#001d35] px-6 py-4 rounded-2xl font-medium flex items-center gap-3 transition-colors shadow-sm w-full">
              <Edit2 className="w-5 h-5" /> Compose
            </button>
          </div>
          <nav className="flex-1 px-3 py-2 space-y-1">
            <button onClick={() => setSelectedEmail(null)} className={`w-full flex items-center gap-4 px-4 py-2 rounded-r-full font-medium transition-colors ${!selectedEmail ? 'bg-[#d3e3fd] text-[#041e49]' : 'text-gray-700 hover:bg-gray-100'}`}>
              <Inbox className="w-5 h-5" /> Inbox 
              <span className="ml-auto text-xs font-bold">{emails.length > 0 ? emails.length : ''}</span>
            </button>
            <button className="w-full flex items-center gap-4 px-4 py-2 rounded-r-full font-medium text-gray-700 hover:bg-gray-100 transition-colors">
              <Star className="w-5 h-5" /> Starred
            </button>
            <button className="w-full flex items-center gap-4 px-4 py-2 rounded-r-full font-medium text-gray-700 hover:bg-gray-100 transition-colors">
              <Send className="w-5 h-5" /> Sent
            </button>
            <button className="w-full flex items-center gap-4 px-4 py-2 rounded-r-full font-medium text-gray-700 hover:bg-gray-100 transition-colors">
              <File className="w-5 h-5" /> Drafts
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          {/* Header */}
          <div className="h-16 border-b border-gray-100 flex items-center px-4 gap-4">
            {selectedEmail && (
              <button onClick={() => setSelectedEmail(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <button 
              onClick={() => fetchEmails(true)} 
              disabled={refreshing}
              className={`p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600 ${refreshing ? 'opacity-50' : ''}`}
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin text-blue-500' : ''}`} />
            </button>
            <div className="flex-1 max-w-2xl bg-[#f0f4f9] rounded-full flex items-center px-4 py-2 focus-within:bg-white focus-within:shadow-md focus-within:ring-1 ring-gray-200 transition-all">
              <Search className="w-5 h-5 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search in emails" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none focus:outline-none ml-3 w-full text-gray-700 placeholder-gray-500" 
              />
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
              </div>
            ) : selectedEmail ? (
              <div className="p-6 md:p-8">
                <div className="flex items-start justify-between mb-8">
                  <h2 className="text-2xl font-normal text-gray-900">{selectedEmail.subject || 'No Subject'}</h2>
                  <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl shadow-sm">
                    {selectedEmail.from ? selectedEmail.from[0].toUpperCase() : 'U'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{selectedEmail.from || 'Unknown Sender'}</span>
                      <span className="text-xs text-gray-500">&lt;{selectedEmail.from || 'unknown@sender.com'}&gt;</span>
                    </div>
                    <div className="text-sm text-gray-600">to {selectedEmail.recipientAlias}</div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(selectedEmail.receivedAt).toLocaleString()}
                  </div>
                </div>

                {selectedEmail.otp && (
                  <div className="mb-8 p-6 bg-[#f0f4f9] rounded-2xl flex items-center justify-between border border-gray-100">
                    <div>
                      <div className="text-sm text-gray-600 font-medium mb-1">Detected OTP / Verification Code</div>
                      <div className="text-3xl font-mono font-bold text-gray-900 tracking-wider">{selectedEmail.otp}</div>
                    </div>
                    <button 
                      onClick={() => handleCopy(selectedEmail.otp, 'otp')} 
                      className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-medium transition-colors shadow-sm"
                    >
                      {copiedId === 'otp' ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                      {copiedId === 'otp' ? 'Copied!' : 'Copy Code'}
                    </button>
                  </div>
                )}

                <div className="prose max-w-none text-gray-800">
                  {selectedEmail.htmlBody ? (
                    <div dangerouslySetInnerHTML={{ __html: selectedEmail.htmlBody }} className="bg-white rounded-xl" />
                  ) : (
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{selectedEmail.fullBody}</pre>
                  )}
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredEmails.map(email => (
                  <div 
                    key={email._id} 
                    onClick={() => setSelectedEmail(email)} 
                    className="flex items-center px-4 py-3 hover:shadow-[inset_1px_0_0_#dadce0,inset_-1px_0_0_#dadce0,0_1px_2px_0_rgba(60,64,67,.3),0_1px_3px_1px_rgba(60,64,67,.15)] border-y border-transparent cursor-pointer bg-white transition-all group z-10 relative hover:z-20"
                  >
                    <div className="w-48 flex-shrink-0 font-bold text-sm text-gray-900 truncate pr-4">
                      {email.from || 'Unknown Sender'}
                    </div>
                    <div className="flex-1 truncate text-sm">
                      <span className="font-bold text-gray-900">{email.subject || 'No Subject'}</span>
                      <span className="text-gray-500 mx-2">-</span>
                      <span className="text-gray-500">{email.fullBody?.substring(0, 100)}</span>
                    </div>
                    <div className="w-24 flex-shrink-0 text-right text-xs font-bold text-gray-900">
                      {formatDate(email.receivedAt)}
                    </div>
                  </div>
                ))}
                {filteredEmails.length === 0 && !loading && (
                  <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                    <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                      <Inbox className="w-12 h-12 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">Your inbox is empty</h3>
                    <p>Emails sent to your purchased addresses will appear here.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
