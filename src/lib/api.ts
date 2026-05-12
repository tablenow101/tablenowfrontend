import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.tablenow.io';

const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
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
    getAuthUrl: ()             => api.get('/calendar/auth-url'),
    callback:   (code: string) => api.post('/calendar/callback', { code }),
    disconnect: ()             => api.post('/calendar/disconnect'),
};

export const emailAPI = {
    getBCCEmails: (params?: Record<string, unknown>) => api.get('/email/bcc', { params }),
};

export const referralAPI = {
    getStats: () => api.get('/referral/stats'),
    getCode:  () => api.get('/referral/code'),
};

export default api;
