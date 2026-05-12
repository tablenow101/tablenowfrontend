import React from 'react';
import { useNavigate } from 'react-router-dom';

const Start: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">TableNow</h1>
        <p className="text-[#888] text-sm mb-12">AI phone hostess for restaurants</p>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => navigate('/signup')}
            className="w-full h-14 bg-[#b8f000] text-black font-semibold rounded-xl hover:bg-[#a8df00] transition-colors"
          >
            Créer un compte
          </button>
          <button
            onClick={() => navigate('/login')}
            className="w-full h-14 bg-[#1a1a1a] text-white border border-[#2a2a2a] font-semibold rounded-xl hover:border-[#444] transition-colors"
          >
            Se connecter
          </button>
        </div>
      </div>
    </div>
  );
};

export default Start;
