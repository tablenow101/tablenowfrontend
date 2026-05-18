import axios from 'axios';
import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.tablenow.io';

const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
});

api.interceptors.request.use(async (config) => {
    const { data } = await supabase.auth.getSession();
    const accessToken = data?.session?.access_token;

    if (accessToken) {
        config.headers = config.headers ?? {};
        (config.headers as any).Authorization = `Bearer ${accessToken}`;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const authAPI = {
    register:       (data: Record<string, unknown>)    => api.post('/auth/register', data),
    login:          (data: Record<string, unknown>)    => api.post('/auth/login', data),
    verifyEmail:    (token: string)=> api.post('/auth/verify-email', { token }),
    getMe:          ()             => api.get('/auth/me'),
    googleCallback: (token: string)=> api.post('/auth/google/token', { access_token: token }),
};

export const dashboardAPI = {
    getStats:    (params?: Record<string, unknown>) => api.get('/dashboard/stats', { params }),
    getCalls:    (params?: Record<string, unknown>) => api.get('/dashboard/calls', { params }),
    getInsights: (date: string) => api.get('/dashboard/insights', { params: { date } }),
};

export const bookingsAPI = {
    getAll: (params?: Record<string, unknown>)          => api.get('/bookings', { params }),
    getOne: (id: string)            => api.get(`/bookings/${id}`),
    create: (data: Record<string, unknown>)             => api.post('/bookings', data),
    update: (id: string, data: Record<string, unknown>) => api.put(`/bookings/${id}`, data),
    cancel: (id: string)            => api.delete(`/bookings/${id}`),
};

export const settingsAPI = {
    get:       ()          => api.get('/settings'),
    update:    (data: Record<string, unknown>) => api.put('/settings', data),
    retryVapi: ()          => api.post('/settings/retry-vapi'),
};

export const calendarAPI = {
    getAuthUrl: (params?: Record<string, unknown>) => api.get('/calendar/auth-url', { params }),
    callback:   (code: string)                    => api.post('/calendar/callback', { code }),
    disconnect: ()                                => api.post('/calendar/disconnect'),
    skip:       ()                                => api.post('/calendar/skip'),
};

export const emailAPI = {
    getBCCEmails: (params?: Record<string, unknown>) => api.get('/email/bcc', { params }),
};

export const referralAPI = {
    getStats: () => api.get('/referral/stats'),
    getCode:  () => api.get('/referral/code'),
};

export default api;
