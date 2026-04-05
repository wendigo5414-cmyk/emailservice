import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, User, LogOut, ShieldAlert, Package, Zap, Shield, Clock, Lock, Mail, Trash2, ArrowRight, CheckCircle, AlertTriangle, Copy, CheckCircle2, Settings, ShoppingBag } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuthStore, useCartStore } from './store';

// --- GridBackground Component ---
function GridBackground() {
  const [blocks, setBlocks] = useState<number[]>([]);

  useEffect(() => {
    const calculateBlocks = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const blockSize = 50; // 50x50 pixels per block
      const cols = Math.ceil(width / blockSize);
      const rows = Math.ceil(height / blockSize);
      setBlocks(Array.from({ length: cols * rows }));
    };

    calculateBlocks();
    window.addEventListener('resize', calculateBlocks);
    return () => window.removeEventListener('resize', calculateBlocks);
  }, []);

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden flex flex-wrap" style={{ alignContent: 'flex-start' }}>
      {blocks.map((_, i) => (
        <div
          key={i}
          className="w-[50px] h-[50px] border-[0.5px] border-white/[0.015] transition-colors duration-500 hover:duration-0 hover:bg-neon-blue/20"
        />
      ))}
    </div>
  );
}

// --- Navbar Component ---
function Navbar() {
  const { user, logout } = useAuthStore();
  const { items } = useCartStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/signup');
  };

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <nav className="fixed top-0 w-full z-50 glass border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center shadow-[0_0_15px_rgba(0,243,255,0.5)] group-hover:shadow-[0_0_25px_rgba(188,19,254,0.6)] transition-all duration-300">
              <span className="font-bold text-white">P</span>
            </div>
            <span className="font-bold text-xl tracking-wider text-white text-glow-blue group-hover:text-glow-purple transition-all duration-300">PRIME X HUB</span>
          </Link>

          <div className="flex items-center gap-6">
            <Link to="/checkout" className="relative text-gray-300 hover:text-white transition-colors hover:scale-110 transform duration-200">
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-neon-red text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-[0_0_10px_rgba(255,0,60,0.8)] animate-pulse">
                  {cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center gap-4">
                {user.isAdmin && (
                  <Link to="/admin" className="text-neon-orange hover:text-white transition-colors flex items-center gap-1 hover:scale-105 transform duration-200">
                    <ShieldAlert className="w-5 h-5" />
                    <span className="hidden sm:inline text-sm font-medium">Admin</span>
                  </Link>
                )}
                <Link to="/emails" className="text-neon-green hover:text-white transition-colors flex items-center gap-1 hover:scale-105 transform duration-200">
                  <Package className="w-5 h-5" />
                  <span className="hidden sm:inline text-sm font-medium">My Items</span>
                </Link>
                <button onClick={handleLogout} className="text-gray-400 hover:text-neon-red transition-colors hover:scale-110 transform duration-200">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link to="/signup" className="flex items-center gap-2 text-sm font-medium text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all border border-white/5 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:scale-105 transform duration-200">
                <User className="w-4 h-4" />
                Login / Signup
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

// --- Shop Component ---
interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  thumbnail: string;
  type: string;
  stock: number;
}

function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore(state => state.addItem);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-neon-blue via-neon-purple to-neon-red tracking-tight">
          Welcome to Prime X Hub
        </h1>
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto font-medium">
          Your premier destination for high-quality digital assets.
        </p>
        
        <div className="flex flex-wrap justify-center gap-4 mt-10">
          <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-2 text-sm text-white glass px-6 py-3 rounded-full shadow-[0_0_15px_rgba(255,106,0,0.2)] border-neon-orange/30">
            <Zap className="w-5 h-5 text-neon-orange" /> Instant Delivery
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-2 text-sm text-white glass px-6 py-3 rounded-full shadow-[0_0_15px_rgba(0,255,102,0.2)] border-neon-green/30">
            <Shield className="w-5 h-5 text-neon-green" /> Secure Crypto
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-2 text-sm text-white glass px-6 py-3 rounded-full shadow-[0_0_15px_rgba(0,243,255,0.2)] border-neon-blue/30">
            <Clock className="w-5 h-5 text-neon-blue" /> 24/7 Automated
          </motion.div>
        </div>
      </motion.div>

      {/* Products Grid */}
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-3xl font-bold border-b-2 border-neon-blue pb-2 inline-block text-white">Available Items</h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-neon-blue shadow-[0_0_15px_rgba(0,243,255,0.5)]"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.map((product, idx) => (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.4 }}
              whileHover={{ y: -5 }}
              className="glass-panel overflow-hidden flex flex-col group hover:border-neon-blue/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,243,255,0.15)]"
            >
              <div className="h-56 w-full bg-gray-900 relative overflow-hidden">
                {product.thumbnail ? (
                  <img 
                    src={product.thumbnail} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                    <Package className="w-16 h-16 text-gray-700" />
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-bold border border-white/10 shadow-lg">
                  Stock: <span className={product.stock > 0 ? 'text-neon-green' : 'text-neon-red'}>{product.stock}</span>
                </div>
                {product.type === 'activated_email' && (
                  <div className="absolute top-3 left-3 bg-neon-purple/20 text-neon-purple backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-bold border border-neon-purple/30 shadow-lg">
                    Auto-Delivery
                  </div>
                )}
              </div>
              
              <div className="p-6 flex flex-col flex-grow bg-gradient-to-b from-transparent to-black/40">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-neon-blue transition-colors">{product.name}</h3>
                <p className="text-sm text-gray-400 mb-6 line-clamp-2 flex-grow leading-relaxed">{product.description}</p>
                
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/10">
                  <span className="text-2xl font-black text-neon-green tracking-tight">${product.price.toFixed(2)}</span>
                  <motion.button
                    whileHover={{ scale: product.stock > 0 ? 1.05 : 1 }}
                    whileTap={{ scale: product.stock > 0 ? 0.95 : 1 }}
                    onClick={() => addItem({
                      productId: product._id,
                      name: product.name,
                      price: product.price,
                      quantity: 1,
                      thumbnail: product.thumbnail
                    })}
                    disabled={product.stock <= 0}
                    className="flex items-center gap-2 bg-white/10 hover:bg-neon-blue hover:text-black disabled:opacity-50 disabled:hover:bg-white/10 disabled:hover:text-white transition-all px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {product.stock > 0 ? 'Add to Cart' : 'Sold Out'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Auth Component ---
function Auth() {
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(location.pathname !== '/signup');
  const [identifier, setIdentifier] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const setAuth = useAuthStore(state => state.setAuth);
  const navigate = useNavigate();

  useEffect(() => {
    setIsLogin(location.pathname !== '/signup');
  }, [location.pathname]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin 
      ? { identifier, password }
      : { username, email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setAuth(data.token, data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-16">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel w-full max-w-md p-8 relative overflow-hidden"
      >
        {/* Decorative background glow */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-neon-blue/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-neon-purple/20 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-purple">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm mb-6 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {isLogin ? (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Username or Email</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input 
                    type="text" 
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    required
                    className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-neon-blue transition-colors"
                    placeholder="Enter username or email"
                  />
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Username</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input 
                      type="text" 
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      required
                      className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-neon-blue transition-colors"
                      placeholder="Choose a username"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input 
                      type="email" 
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-neon-blue transition-colors"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-neon-blue transition-colors"
                  placeholder="Enter password"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-neon-blue to-neon-purple hover:from-neon-purple hover:to-neon-blue text-white font-bold py-3 rounded-lg shadow-[0_0_15px_rgba(0,243,255,0.3)] transition-all disabled:opacity-50"
            >
              {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// --- Checkout Component ---
function Checkout() {
  const { items, getTotal, removeItem, clearCart } = useCartStore();
  const { token, user } = useAuthStore();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [customerDetails, setCustomerDetails] = useState({ robloxUsername: '', discordTag: '' });
  const [orderInfo, setOrderInfo] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 3 && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && step === 3) {
      setStep(4); // Failed/Timeout
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  const handleCreateOrder = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items,
          customerDetails,
          cryptoCurrency: 'USDT_TRC20'
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setOrderInfo(data);
      setStep(3);
    } catch (err) {
      console.error(err);
      alert('Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const handleMockPaymentComplete = async () => {
    try {
      await fetch(`/api/admin/orders/${orderInfo.orderId}/complete`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      clearCart();
      setStep(5); // Success
    } catch (err) {
      console.error(err);
    }
  };

  if (items.length === 0 && step === 1) {
    return (
      <div className="pt-32 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Your cart is empty</h2>
        <button onClick={() => navigate('/')} className="text-neon-blue hover:underline">Go back to shop</button>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-12 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-800 -z-10"></div>
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-neon-blue -z-10 transition-all duration-500" style={{ width: `${((step - 1) / 3) * 100}%` }}></div>
        
        {[1, 2, 3, 4].map(s => (
          <div key={s} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= s ? 'bg-neon-blue text-black shadow-[0_0_10px_rgba(0,243,255,0.8)]' : 'bg-gray-800 text-gray-500'}`}>
            {s}
          </div>
        ))}
      </div>

      <motion.div 
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="glass-panel p-6 sm:p-8"
      >
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-white">Review Order</h2>
            <div className="space-y-4 mb-8">
              {items.map(item => (
                <div key={item.productId} className="flex items-center justify-between bg-black/30 p-4 rounded-lg border border-white/5">
                  <div>
                    <h3 className="font-bold text-white">{item.name}</h3>
                    <p className="text-sm text-gray-400">Qty: {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-neon-green">${(item.price * item.quantity).toFixed(2)}</span>
                    <button onClick={() => removeItem(item.productId)} className="text-gray-500 hover:text-neon-red transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center border-t border-white/10 pt-6">
              <span className="text-xl text-gray-300">Total:</span>
              <span className="text-3xl font-bold text-white">${getTotal().toFixed(2)}</span>
            </div>
            <button 
              onClick={() => setStep(2)}
              className="w-full mt-8 bg-neon-blue hover:bg-white text-black font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              Continue <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-white">Customer Details</h2>
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Roblox Username (Optional)</label>
                <input 
                  type="text" 
                  value={customerDetails.robloxUsername}
                  onChange={e => setCustomerDetails({...customerDetails, robloxUsername: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-neon-blue"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Discord Tag (Optional)</label>
                <input 
                  type="text" 
                  value={customerDetails.discordTag}
                  onChange={e => setCustomerDetails({...customerDetails, discordTag: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-neon-blue"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setStep(1)} className="w-1/3 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-lg transition-colors">Back</button>
              <button 
                onClick={handleCreateOrder}
                disabled={loading}
                className="w-2/3 bg-neon-purple hover:bg-white text-white hover:text-black font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Proceed to Payment'} <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && orderInfo && (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2 text-white">Awaiting Payment</h2>
            <p className="text-gray-400 mb-6">Send EXACTLY the amount below to the address.</p>
            
            <div className="bg-black/50 border border-neon-orange/30 p-6 rounded-xl mb-8 inline-block">
              <div className="text-4xl font-extrabold text-neon-orange mb-2">{orderInfo.exactCryptoAmount.toFixed(2)} USDT</div>
              <div className="text-sm text-gray-400 mb-6">Network: TRC20 (Tron)</div>
              
              <div className="bg-white p-4 rounded-lg inline-block mb-6">
                <QRCodeSVG value={`USDT:TYourWalletAddressHere?amount=${orderInfo.exactCryptoAmount}`} size={200} />
              </div>
              
              <div className="bg-gray-900 p-3 rounded border border-white/10 text-sm font-mono break-all text-gray-300 select-all">
                TYourWalletAddressHere123456789
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-neon-red font-bold mb-8">
              <Clock className="w-5 h-5" />
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>

            {/* MOCK BUTTON FOR TESTING */}
            <button 
              onClick={handleMockPaymentComplete}
              className="text-xs text-gray-500 hover:text-white underline"
            >
              [Dev] Simulate Payment Received
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-neon-red mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Payment Timeout</h2>
            <p className="text-gray-400 mb-8">The payment window has expired. If you sent funds, please contact support.</p>
            <button onClick={() => navigate('/')} className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-8 rounded-lg transition-colors">Return to Shop</button>
          </div>
        )}

        {step === 5 && (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-neon-green mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
            <p className="text-gray-400 mb-8">Your order has been processed. You can view your items in your dashboard.</p>
            <button onClick={() => navigate('/emails')} className="bg-neon-green hover:bg-white text-black font-bold py-3 px-8 rounded-lg transition-colors">View My Items</button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// --- UserDashboard Component ---
function UserDashboard() {
  const { token } = useAuthStore();
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/my-emails', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setEmails(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [token]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-white border-b border-white/10 pb-4">My Items</h1>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-green"></div>
        </div>
      ) : emails.length === 0 ? (
        <div className="text-center py-20 glass-panel">
          <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-300">No items yet</h2>
          <p className="text-gray-500 mt-2">Your purchased items will appear here.</p>
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

// --- AdminDashboard Component ---
function AdminDashboard() {
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

  const currentMode = config.find(c => c.key === 'emailMode')?.value || 'STOCKING';

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
                  {products.map(p => (
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
                  {orders.map(o => (
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
            <h2 className="text-xl font-bold text-white mb-4">Admin Inbox (Mode: ADMIN)</h2>
            <div className="space-y-4">
              {emails.length === 0 ? <p className="text-gray-500">No admin emails found.</p> : emails.map(e => (
                <div key={e._id} className="bg-black/30 p-4 rounded border border-white/5">
                  <div className="font-bold text-white mb-1">{e.subject || 'No Subject'}</div>
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

// --- Main App Route Configuration ---
function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#030712] text-white selection:bg-neon-blue selection:text-black relative">
        <GridBackground />
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Shop />} />
            <Route path="/signup" element={<Auth />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/emails" element={<UserDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
