// Determine frontend URL: env var → current origin → prod fallback
const determineFrontendUrl = () => {
  if (import.meta.env.VITE_FRONTEND_URL) {
    return import.meta.env.VITE_FRONTEND_URL;
  }
  // In dev/local: use current origin (http://localhost:3000, http://localhost:5173, etc)
  if (window.location.hostname !== 'app.tablenow.io') {
    return window.location.origin;
  }
  // In prod: use prod URL
  return 'https://app.tablenow.io';
};

export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'https://api.tablenow.io',
  frontendUrl: determineFrontendUrl(),
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'https://kvxujqgaaongkoczjyhc.supabase.co',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
} as const;

export const getAuthCallbackUrl = () => `${config.frontendUrl}/auth/callback`;
