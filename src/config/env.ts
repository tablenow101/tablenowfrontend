export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'https://api.tablenow.io',
  frontendUrl: import.meta.env.VITE_FRONTEND_URL || 'https://app.tablenow.io',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'https://kvxujqgaaongkoczjyhc.supabase.co',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
} as const;

export const getAuthCallbackUrl = () => `${config.frontendUrl}/auth/callback`;
