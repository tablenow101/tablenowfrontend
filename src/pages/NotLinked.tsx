import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Mail } from 'lucide-react';

const NotLinked: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#080912] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="p-6 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col items-center space-y-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center bg-amber-500/20">
            <AlertCircle className="text-amber-400" size={32} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Restaurant Not Linked</h1>
            <p className="text-sm text-[#888] leading-relaxed">
              Your account exists but hasn't been linked to a restaurant yet. Please contact support to complete the setup.
            </p>
          </div>

          <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Mail size={18} className="text-[#b8f000] flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-xs font-semibold text-[#666] uppercase tracking-wide">Contact Support</p>
                <p className="text-sm text-white">support@tablenow.io</p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate('/login', { replace: true })}
          className="w-full px-4 py-3 bg-[#b8f000] text-black font-semibold rounded-xl hover:opacity-90 transition-opacity"
        >
          Return to Login
        </button>
      </div>
    </div>
  );
};

export default NotLinked;
