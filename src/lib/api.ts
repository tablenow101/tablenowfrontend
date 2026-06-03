import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.tablenow.io';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
});

// Synchronous read of the Supabase access_token from local storage.
// IMPORTANT: do NOT call supabase.auth.getSession() here — this interceptor runs
// for requests fired from onAuthStateChange, and getSession() takes the supabase-js
// auth lock -> deadlock (infinite spinner on /auth/callback). The backend validates
// this Supabase token directly (see middleware/auth.ts).
function getStoredAccessToken(): string | null {
  try {
    const key = Object.keys(localStorage).find(
      (k) => k.startsWith('sb-') && k.endsWith('-auth-token')
    );
    if (!key) return null;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.access_token || parsed?.currentSession?.access_token || null;
  } catch {
    return null;
  }
}

// Request: inject the Supabase access token
api.interceptors.request.use((config) => {
  const token = getStoredAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response: let components handle auth errors
api.interceptors.response.use(
  (res) => res,
  (error) => {
    return Promise.reject(error);
  }
);

// API wrappers. Authentication always yields a Supabase session (Google OAuth OR
// email/password). bootstrap takes that Supabase access token and links or creates
// the matching restaurant server-side — the single, provider-agnostic entry point.
export const authAPI = {
  bootstrap: (token: string) => api.post('/auth/bootstrap', { access_token: token }),
};

export const dashboardAPI = {
  getStats: (params?: Record<string, unknown>) => api.get('/dashboard/stats', { params }),
  getCalls: (params?: Record<string, unknown>) => api.get('/dashboard/calls', { params }),
  getInsights: (date: string) => api.get('/dashboard/insights', { params: { date } }),
};

export const bookingsAPI = {
  getAll: (params?: Record<string, unknown>) => api.get('/bookings', { params }),
  getOne: (id: string) => api.get(`/bookings/${id}`),
  create: (data: Record<string, unknown>) => api.post('/bookings', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/bookings/${id}`, data),
  cancel: (id: string) => api.delete(`/bookings/${id}`),
};

export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data: Record<string, unknown>) => api.put('/settings', data),
  retryVapi: () => api.post('/settings/retry-vapi'),
};

export const calendarAPI = {
  getAuthUrl: (params?: Record<string, unknown>) => api.get('/calendar/auth-url', { params }),
  callback: (code: string) => api.post('/calendar/callback', { code }),
  disconnect: () => api.post('/calendar/disconnect'),
  skip: () => api.post('/calendar/skip'),
  // Connected push calendars (Google, …)
  connections: () => api.get('/calendar/connections'),
  removeConnection: (id: string) => api.delete(`/calendar/connections/${id}`),
  // Universal subscribe feed (any calendar app)
  feedUrl: () => api.get('/calendar/feed-url'),
  rotateFeed: () => api.post('/calendar/feed/rotate'),
};

export const emailAPI = {
  getBCCEmails: (params?: Record<string, unknown>) => api.get('/email/bcc', { params }),
};

export const referralAPI = {
  getStats: () => api.get('/referral/stats'),
  getCode: () => api.get('/referral/code'),
};

export default api;
