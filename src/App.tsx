import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import GridBackground from './components/GridBackground';
import Shop from './pages/Shop';
import Auth from './pages/Auth';
import Checkout from './pages/Checkout';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
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
  );
}

export default App;
