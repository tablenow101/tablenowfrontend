import React from 'react';
import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4">
      <div className="text-center space-y-8 max-w-lg">
        <h1 className="text-6xl font-black tracking-tight text-white">
          Table<span style={{ color: '#b8f000' }}>Now</span>
        </h1>
        <p className="text-lg" style={{ color: '#555' }}>Your Restaurant Host(ess) 24/7</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/register"
            className="px-8 py-4 font-bold rounded-xl text-sm hover:opacity-90 transition-opacity"
            style={{ background: '#b8f000', color: '#000' }}
          >
            Commencer l'essai gratuit →
          </Link>
          <Link
            to="/login"
            className="px-8 py-4 border font-bold rounded-xl text-sm hover:border-[#444] transition-colors"
            style={{ background: '#111', borderColor: '#2a2a2a', color: '#fff' }}
          >
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}
