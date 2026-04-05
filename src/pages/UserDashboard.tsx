import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/auth';
import { Mail, Copy, CheckCircle2 } from 'lucide-react';

export default function UserDashboard() {
  const { token } = useAuthStore();
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setEmails([]);
      setLoading(false);
      return;
    }

    fetch('/api/my-emails', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setEmails(data);
        } else {
          setEmails([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setEmails([]);
        setLoading(false);
      });
  }, [token]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
      <h1 className="text-3xl font-bold mb-8 text-white border-b border-white/10 pb-4">Your Owned Emails</h1>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-green"></div>
        </div>
      ) : emails.length === 0 ? (
        <div className="text-center py-20 glass-panel">
          <Mail className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-300">No Emails</h2>
          <p className="text-gray-500 mt-2">Your purchased emails will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {emails.map((email, idx) => (
            <motion.div
              key={email._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glass-panel p-6 border-l-4 border-l-neon-green"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-white">Activated Email</h3>
                  <p className="text-sm text-gray-400">Purchased on {new Date(email.receivedAt).toLocaleDateString()}</p>
                </div>
                <span className="bg-neon-green/20 text-neon-green text-xs font-bold px-2 py-1 rounded">DELIVERED</span>
              </div>
              
              <div className="bg-black/50 rounded-lg p-4 font-mono text-sm text-gray-300 relative group">
                <div className="mb-2"><span className="text-gray-500">Email:</span> {email.recipientAlias}</div>
                <div><span className="text-gray-500">Password:</span> x95x00thanksforthepurchase</div>
                
                <button 
                  onClick={() => handleCopy(`${email.recipientAlias}:x95x00thanksforthepurchase`, email._id)}
                  className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                >
                  {copiedId === email._id ? <CheckCircle2 className="w-5 h-5 text-neon-green" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
