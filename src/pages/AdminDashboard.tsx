import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/auth';
import { useNavigate, Navigate } from 'react-router-dom';
import { Settings, Package, ShoppingBag, Mail, ShieldAlert } from 'lucide-react';

export default function AdminDashboard() {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('config');
  
  const [config, setConfig] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [emails, setEmails] = useState<any[]>([]);

  useEffect(() => {
    if (user && user.isAdmin) {
      fetchData();
    }
  }, [user, activeTab]);

  if (!user || !user.isAdmin) {
    return <Navigate to="/" replace />;
  }

  const fetchData = async () => {
    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      if (activeTab === 'config') {
        const res = await fetch('/api/admin/config', { headers });
        setConfig(await res.json());
      } else if (activeTab === 'products') {
        const res = await fetch('/api/products'); // public route
        setProducts(await res.json());
      } else if (activeTab === 'orders') {
        const res = await fetch('/api/admin/orders', { headers });
        setOrders(await res.json());
      } else if (activeTab === 'emails') {
        const res = await fetch('/api/admin/emails', { headers });
        setEmails(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleModeChange = async (newMode: string) => {
    try {
      await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ key: 'emailMode', value: newMode })
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const productData = {
      name: formData.get('name'),
      description: formData.get('description'),
      price: Number(formData.get('price')),
      thumbnail: formData.get('thumbnail'),
      type: formData.get('type'),
      stock: Number(formData.get('stock') || 0)
    };

    try {
      await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(productData)
      });
      e.currentTarget.reset();
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const currentMode = Array.isArray(config) ? (config.find(c => c.key === 'emailMode')?.value || 'STOCKING') : 'STOCKING';

  return (
    <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-white flex items-center gap-3">
        <ShieldAlert className="w-8 h-8 text-neon-orange" /> Admin Control Panel
      </h1>

      <div className="flex flex-wrap gap-4 mb-8 border-b border-white/10 pb-4">
        <button onClick={() => setActiveTab('config')} className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'config' ? 'bg-neon-orange text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
          <Settings className="w-4 h-4" /> Config
        </button>
        <button onClick={() => setActiveTab('products')} className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'products' ? 'bg-neon-orange text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
          <Package className="w-4 h-4" /> Products
        </button>
        <button onClick={() => setActiveTab('orders')} className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'orders' ? 'bg-neon-orange text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
          <ShoppingBag className="w-4 h-4" /> Orders
        </button>
        <button onClick={() => setActiveTab('emails')} className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'emails' ? 'bg-neon-orange text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
          <Mail className="w-4 h-4" /> Admin Inbox
        </button>
      </div>

      <div className="glass-panel p-6">
        {activeTab === 'config' && (
          <div>
            <h2 className="text-xl font-bold text-white mb-6">Email Processing Mode</h2>
            <div className="flex gap-4">
              <button 
                onClick={() => handleModeChange('OFF')}
                className={`px-6 py-3 rounded-lg font-bold transition-all ${currentMode === 'OFF' ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-gray-800 text-gray-400'}`}
              >
                OFF (Ignore)
              </button>
              <button 
                onClick={() => handleModeChange('STOCKING')}
                className={`px-6 py-3 rounded-lg font-bold transition-all ${currentMode === 'STOCKING' ? 'bg-neon-blue text-black shadow-[0_0_15px_rgba(0,243,255,0.5)]' : 'bg-gray-800 text-gray-400'}`}
              >
                STOCKING (7 Days Pending)
              </button>
              <button 
                onClick={() => handleModeChange('ADMIN')}
                className={`px-6 py-3 rounded-lg font-bold transition-all ${currentMode === 'ADMIN' ? 'bg-neon-purple text-white shadow-[0_0_15px_rgba(188,19,254,0.5)]' : 'bg-gray-800 text-gray-400'}`}
              >
                ADMIN (Direct to Inbox)
              </button>
            </div>
            <p className="mt-4 text-sm text-gray-400">Current Mode: <strong className="text-white">{currentMode}</strong></p>
          </div>
        )}

        {activeTab === 'products' && (
          <div>
            <h2 className="text-xl font-bold text-white mb-6">Add New Product</h2>
            <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
              <input name="name" placeholder="Product Name" required className="bg-black/50 border border-white/10 rounded p-3 text-white" />
              <input name="price" type="number" step="0.01" placeholder="Price ($)" required className="bg-black/50 border border-white/10 rounded p-3 text-white" />
              <input name="thumbnail" placeholder="Image URL" className="bg-black/50 border border-white/10 rounded p-3 text-white" />
              <select name="type" className="bg-black/50 border border-white/10 rounded p-3 text-white">
                <option value="activated_email">Activated Email (Auto Stock)</option>
                <option value="account">Account (Manual Stock)</option>
                <option value="service">Service</option>
              </select>
              <input name="stock" type="number" placeholder="Manual Stock (Leave 0 for Auto)" className="bg-black/50 border border-white/10 rounded p-3 text-white" />
              <textarea name="description" placeholder="Description" className="bg-black/50 border border-white/10 rounded p-3 text-white md:col-span-2"></textarea>
              <button type="submit" className="bg-neon-orange text-black font-bold py-3 rounded md:col-span-2 hover:bg-white transition-colors">Add Product</button>
            </form>

            <h2 className="text-xl font-bold text-white mb-4">Current Products</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-gray-300">
                <thead className="bg-white/5">
                  <tr>
                    <th className="p-3">Name</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Price</th>
                    <th className="p-3">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(products) && products.map(p => (
                    <tr key={p._id} className="border-b border-white/5">
                      <td className="p-3">{p.name}</td>
                      <td className="p-3">{p.type}</td>
                      <td className="p-3">${p.price}</td>
                      <td className="p-3">{p.stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Recent Orders</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-gray-300">
                <thead className="bg-white/5">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">User</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(orders) && orders.map(o => (
                    <tr key={o._id} className="border-b border-white/5">
                      <td className="p-3 font-mono text-xs">{o._id}</td>
                      <td className="p-3">{o.userId?.username || 'Unknown'}</td>
                      <td className="p-3">${o.totalAmount} ({o.exactCryptoAmount} {o.cryptoCurrency})</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${o.status === 'completed' ? 'bg-neon-green/20 text-neon-green' : 'bg-yellow-500/20 text-yellow-500'}`}>
                          {o.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'emails' && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Admin Inbox (Unsold & Stock Emails)</h2>
            <div className="space-y-4">
              {!Array.isArray(emails) || emails.length === 0 ? <p className="text-gray-500">No admin emails found.</p> : emails.map(e => (
                <div key={e._id} className="bg-black/30 p-4 rounded border border-white/5">
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-bold text-white">{e.subject || 'No Subject'}</div>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${e.status === 'stock' ? 'bg-neon-blue/20 text-neon-blue' : e.status === 'admin' ? 'bg-neon-purple/20 text-neon-purple' : 'bg-gray-500/20 text-gray-400'}`}>
                      {e.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400 mb-2">From: {e.from} | To: {e.recipientAlias}</div>
                  <div className="text-sm text-gray-300 font-mono bg-black/50 p-2 rounded">{e.otp ? `OTP: ${e.otp}` : 'No OTP detected'}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


