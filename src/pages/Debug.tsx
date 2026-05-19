import React from 'react';
import { supabase } from '../lib/supabase';

const Debug: React.FC = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Debug: Supabase Config</h1>

        <div className="space-y-4">
          <div className="p-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
            <p className="text-white font-bold mb-2">VITE_SUPABASE_URL</p>
            <p className="text-sm text-[#888] font-mono break-all">
              {supabaseUrl || '❌ NOT SET'}
            </p>
          </div>

          <div className="p-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
            <p className="text-white font-bold mb-2">VITE_SUPABASE_ANON_KEY</p>
            <p className="text-sm text-[#888] font-mono">
              {anonKey ? `✅ SET (${anonKey.slice(0, 10)}...)` : '❌ NOT SET'}
            </p>
          </div>

          <div className="p-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
            <p className="text-white font-bold mb-2">localStorage</p>
            <p className="text-sm text-[#888] font-mono">
              {localStorage.length} items
            </p>
            <details className="mt-2">
              <summary className="text-[#b8f000] cursor-pointer">Show all</summary>
              <pre className="text-xs text-[#555] mt-2 overflow-auto max-h-48">
                {JSON.stringify(
                  Object.fromEntries(
                    Object.entries(localStorage).map(([k, v]) => [
                      k,
                      k.includes('token') ? '[REDACTED]' : v
                    ])
                  ),
                  null,
                  2
                )}
              </pre>
            </details>
          </div>

          <div className="p-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
            <p className="text-white font-bold mb-2">URL Parameters</p>
            <p className="text-sm text-[#888] font-mono break-all">
              {window.location.search || '(none)'}
            </p>
          </div>
        </div>

        <button
          onClick={() => window.location.href = '/login'}
          className="mt-8 px-4 py-2 bg-[#b8f000] text-black font-bold rounded-lg"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
};

export default Debug;
