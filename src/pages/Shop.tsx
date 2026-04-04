import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Zap, Shield, Clock, Package } from 'lucide-react';
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
