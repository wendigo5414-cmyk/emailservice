import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Zap, Shield, Clock, Package, Search, Sparkles } from 'lucide-react';
import { useCartStore } from '../store/cart';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  thumbnail: string;
  type: string;
  stock: number;
}

export default function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(debouncedQuery.toLowerCase()) || 
    p.description.toLowerCase().includes(debouncedQuery.toLowerCase())
  );

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
      {/* Premium Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center mb-20 relative"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-neon-purple/20 rounded-full blur-[100px] transform-gpu -z-10"></div>
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/10 mb-6 text-sm font-medium text-gray-300"
        >
          <Sparkles className="w-4 h-4 text-neon-blue" />
          <span>The Next Generation Digital Marketplace</span>
        </motion.div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 tracking-tighter text-white">
          PRIME <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue via-neon-purple to-neon-red">X</span> HUB
        </h1>
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
          Elevate your digital experience with our premium selection of high-quality assets, delivered instantly and securely.
        </p>
        
        <div className="flex flex-wrap justify-center gap-4 mt-10">
          <motion.div whileHover={{ y: -2 }} className="flex items-center gap-3 text-sm text-white bg-white/5 px-6 py-3.5 rounded-2xl border border-white/10 shadow-lg">
            <div className="p-2 bg-neon-orange/10 rounded-lg"><Zap className="w-5 h-5 text-neon-orange" /></div>
            <span className="font-semibold tracking-wide">Instant Delivery</span>
          </motion.div>
          <motion.div whileHover={{ y: -2 }} className="flex items-center gap-3 text-sm text-white bg-white/5 px-6 py-3.5 rounded-2xl border border-white/10 shadow-lg">
            <div className="p-2 bg-neon-green/10 rounded-lg"><Shield className="w-5 h-5 text-neon-green" /></div>
            <span className="font-semibold tracking-wide">Secure Crypto</span>
          </motion.div>
          <motion.div whileHover={{ y: -2 }} className="flex items-center gap-3 text-sm text-white bg-white/5 px-6 py-3.5 rounded-2xl border border-white/10 shadow-lg">
            <div className="p-2 bg-neon-blue/10 rounded-lg"><Clock className="w-5 h-5 text-neon-blue" /></div>
            <span className="font-semibold tracking-wide">24/7 Automated</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Search and Filter Section */}
      <div className="mb-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="relative w-full md:w-96 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-500 group-focus-within:text-neon-blue transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search premium assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-neon-blue/50 focus:border-transparent transition-all shadow-lg"
          />
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm font-medium">{filteredProducts.length} items found</span>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex justify-center py-32">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-neon-blue"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-neon-purple opacity-20"></div>
          </div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-32 glass-panel rounded-3xl border-white/5">
          <Package className="w-20 h-20 text-gray-600 mx-auto mb-6 opacity-50" />
          <h2 className="text-2xl font-bold text-gray-300 mb-2">No assets found</h2>
          <p className="text-gray-500">Try adjusting your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredProducts.map((product, idx) => (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.5, ease: "easeOut" }}
              whileHover={{ y: -8 }}
              className="group relative bg-[#0c0c0e] rounded-3xl overflow-hidden border border-white/[0.05] hover:border-white/[0.15] transition-all duration-300 shadow-xl hover:shadow-2xl"
            >
              {/* Glow effect behind card on hover */}
              <div className="absolute inset-0 bg-gradient-to-b from-neon-blue/0 to-neon-blue/0 group-hover:from-neon-blue/5 group-hover:to-transparent transition-colors duration-500 z-0"></div>

              <div className="h-60 w-full bg-[#0a0a0a] relative overflow-hidden z-10">
                {product.thumbnail ? (
                  <img 
                    src={product.thumbnail} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-90 group-hover:opacity-100"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-[#0a0a0a]">
                    <Package className="w-16 h-16 text-gray-800" />
                  </div>
                )}
                
                {/* Badges */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                  <div className="bg-black/80 px-3 py-1.5 rounded-full text-xs font-bold border border-white/10 shadow-lg">
                    <span className={product.stock > 0 ? 'text-neon-green' : 'text-neon-red'}>
                      {product.stock > 0 ? `${product.stock} in stock` : 'Sold Out'}
                    </span>
                  </div>
                </div>
                
                {product.type === 'activated_email' && (
                  <div className="absolute top-4 left-4 bg-neon-purple/20 text-neon-purple px-3 py-1.5 rounded-full text-xs font-bold border border-neon-purple/30 shadow-lg">
                    Auto-Delivery
                  </div>
                )}
              </div>
              
              <div className="p-6 flex flex-col flex-grow relative z-10">
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-neon-blue transition-colors duration-300">{product.name}</h3>
                <p className="text-sm text-gray-400 mb-8 line-clamp-2 flex-grow leading-relaxed font-medium">{product.description}</p>
                
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Price</span>
                    <span className="text-2xl font-black text-white tracking-tight">${product.price.toFixed(2)}</span>
                  </div>
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
                    className="flex items-center justify-center w-12 h-12 bg-white/5 hover:bg-neon-blue hover:text-black disabled:opacity-50 disabled:hover:bg-white/5 disabled:hover:text-white transition-all rounded-2xl border border-white/10 hover:border-neon-blue shadow-lg group/btn"
                  >
                    <ShoppingCart className="w-5 h-5 transition-transform group-hover/btn:scale-110" />
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
