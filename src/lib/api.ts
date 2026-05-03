import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.tablenow.io/api';

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const authAPI = {
    login:       (data: any) => api.post('/auth/login', data),
    register:    (data: any) => api.post('/auth/register', data),
    verifyEmail: (token: string) => api.post('/auth/verify-email', { token }),
    me:          () => api.get('/auth/me'),
};

export const dashboardAPI = {
    getStats:    (params?: any) => api.get('/dashboard/stats', { params }),
    getCalls:    (params?: any) => api.get('/dashboard/calls', { params }),
    getInsights: (date?: string) => api.get('/dashboard/insights', { params: date ? { date } : {} }),
};

export const bookingsAPI = {
    getAll:  (params?: any)  => api.get('/bookings', { params }),
    create:  (data: any)     => api.post('/bookings', data),
    update:  (id: string, data: any) => api.put(`/bookings/${id}`, data),
    cancel:  (id: string)    => api.delete(`/bookings/${id}`),
    getById: (id: string)    => api.get(`/bookings/${id}`),
};

export const settingsAPI = {
    get:       ()           => api.get('/settings'),
    update:    (data: any)  => api.put('/settings', data),
    retryVapi: ()           => api.post('/settings/retry-vapi'),
};

export const calendarAPI = {
    getAuthUrl:  () => api.get('/calendar/auth-url'),
    callback:    (code: string) => api.post('/calendar/callback', { code }),
    disconnect:  () => api.post('/calendar/disconnect'),
};

export const referralAPI = {
    getStats: () => api.get('/referral/stats'),
    getList:  () => api.get('/referral/list'),
};

export const callsAPI = {
    getAll:     (params?: any) => api.get('/call-logs', { params }),
    getById:    (id: string)   => api.get(`/call-logs/${id}`),
    getTranscript: (id: string) => api.get(`/call-logs/${id}/transcript`),
};
