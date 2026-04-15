import React, { useEffect, useState } from 'react';
import { settingsAPI, calendarAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
    Save,
    Calendar,
    Mail,
    Phone,
    Settings as SettingsIcon,
    AlertCircle,
    CheckCircle,
    Clock,
    Users,
    Copy,
    Check,
} from 'lucide-react';

const DAYS = [
    { key: 'monday', label: 'Lundi' },
    { key: 'tuesday', label: 'Mardi' },
    { key: 'wednesday', label: 'Mercredi' },
    { key: 'thursday', label: 'Jeudi' },
    { key: 'friday', label: 'Vendredi' },
    { key: 'saturday', label: 'Samedi' },
    { key: 'sunday', label: 'Dimanche' },
] as const;

const DEFAULT_HOURS: Record<string, { open: boolean; from: string; to: string }> = {
    monday: { open: true, from: '12:00', to: '22:30' },
    tuesday: { open: true, from: '12:00', to: '22:30' },
    wednesday: { open: true, from: '12:00', to: '22:30' },
    thursday: { open: true, from: '12:00', to: '22:30' },
    friday: { open: true, from: '12:00', to: '23:00' },
    saturday: { open: true, from: '12:00', to: '23:00' },
    sunday: { open: false, from: '12:00', to: '22:00' },
};

const DEFAULT_SERVICES = {
    lunch: { active: true, from: '12:00', to: '14:30', capacity: 20 },
    dinner: { active: true, from: '19:00', to: '22:30', capacity: 20 },
};

const Settings: React.FC = () => {
    const { user, refreshUser } = useAuth();
    const [settings, setSettings] = useState<any>({});
    const [hours, setHours] = useState<Record<string, { open: boolean; from: string; to: string }>>(DEFAULT_HOURS);
    const [services, setServices] = useState(DEFAULT_SERVICES);
    const [totalCapacity, setTotalCapacity] = useState(40);
    const [confirmationEmail, setConfirmationEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetchSettings();

        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if (code) {
            handleCalendarCallback(code);
        }
    }, []);

    const handleCalendarCallback = async (code: string) => {
        try {
            setMessage({ type: 'success', text: 'Connecting Google Calendar...' });
            await calendarAPI.callback(code);
            await refreshUser();
            setMessage({ type: 'success', text: 'Google Calendar connected successfully!' });
            window.history.replaceState({}, document.title, window.location.pathname);
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to connect Google Calendar' });
        }
    };

    const fetchSettings = async () => {
        try {
            const response = await settingsAPI.get();
            const s = response.data.settings;
            setSettings(s);
            if (s.opening_hours && Object.keys(s.opening_hours).length > 0) setHours(s.opening_hours);
            if (s.services && Object.keys(s.services).length > 0) setServices(s.services);
            if (s.total_capacity) setTotalCapacity(s.total_capacity);
            setConfirmationEmail(s.confirmation_email || s.email || '');
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setSettings({ ...settings, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            await settingsAPI.update({
                ...settings,
                opening_hours: hours,
                services,
                total_capacity: totalCapacity,
                confirmation_email: confirmationEmail,
            });
            await refreshUser();
            setMessage({ type: 'success', text: 'Settings updated successfully!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to update settings' });
        } finally {
            setSaving(false);
        }
    };

    const connectCalendar = async () => {
        try {
            const response = await calendarAPI.getAuthUrl();
            window.open(response.data.authUrl, '_blank');
            setMessage({ type: 'success', text: 'Please complete the authorization in the new window' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to get calendar authorization URL' });
        }
    };

    const disconnectCalendar = async () => {
        if (!confirm('Are you sure you want to disconnect Google Calendar?')) return;
        try {
            await calendarAPI.disconnect();
            await refreshUser();
            setMessage({ type: 'success', text: 'Calendar disconnected successfully' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to disconnect calendar' });
        }
    };

    const retryVapiSetup = async () => {
        if (!confirm('This will attempt to set up your AI phone assistant. Continue?')) return;
        setSaving(true);
        setMessage(null);
        try {
            const response = await settingsAPI.retryVapi();
            await refreshUser();
            await fetchSettings();
            setMessage({ type: 'success', text: `VAPI setup successful! Your phone number is ${response.data.phoneNumber}` });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to set up VAPI. Please contact support.' });
        } finally {
            setSaving(false);
        }
    };

    function copyBcc() {
        if (user?.bcc_email) {
            navigator.clipboard.writeText(user.bcc_email);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="loading w-12 h-12"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-gray-600 mt-1">Manage your restaurant configuration</p>
            </div>

            {message && (
                <div className={`p-4 rounded-lg border-2 flex items-start space-x-2 ${message.type === 'success' ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
                    {message.type === 'success' ? <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} /> : <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />}
                    <p className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>{message.text}</p>
                </div>
            )}

            {/* VAPI Integration */}
            <div className="card">
                <div className="flex items-center space-x-3 mb-4">
                    <Phone size={24} />
                    <h2 className="text-xl font-bold">AI Phone Assistant</h2>
                </div>
                <div className="space-y-4">
                    <div className="p-4 bg-black text-white rounded-lg">
                        <p className="text-sm text-gray-300">Your AI Phone Number</p>
                        <p className="text-2xl font-bold mt-1">{user?.vapi_phone_number || 'Not configured'}</p>
                    </div>
                    {(!user?.vapi_phone_number || !user?.vapi_assistant_id) && (
                        <button onClick={retryVapiSetup} disabled={saving} className="btn btn-primary w-full">
                            {saving ? <span className="flex items-center justify-center"><span className="loading mr-2"></span>Setting up...</span> : 'Retry AI Phone Setup'}
                        </button>
                    )}
                    {user?.vapi_assistant_id && (
                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                            <p className="text-sm text-gray-600">Assistant ID</p>
                            <p className="font-mono text-sm mt-1">{user.vapi_assistant_id}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* BCC Email */}
            <div className="card">
                <div className="flex items-center space-x-3 mb-4">
                    <Mail size={24} />
                    <h2 className="text-xl font-bold">Third-Party Booking Sync via Email</h2>
                </div>
                <div className="space-y-4">
                    <p className="text-gray-600">Automatically sync your Zenchef or SevenRooms reservations by forwarding booking confirmation emails to this address.</p>
                    <div className="p-4 bg-gray-50 border-2 border-gray-300 rounded-lg">
                        <p className="text-sm text-gray-600 mb-2">Your BCC Email Address</p>
                        <div className="flex items-center gap-2">
                            <p className="font-mono text-lg font-bold break-all flex-1">{user?.bcc_email || 'Not configured'}</p>
                            {user?.bcc_email && (
                                <button onClick={copyBcc} className="p-2 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
                                    {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Google Calendar */}
            <div className="card">
                <div className="flex items-center space-x-3 mb-4">
                    <Calendar size={24} />
                    <h2 className="text-xl font-bold">Google Calendar Integration</h2>
                </div>
                <div className="space-y-4">
                    <p className="text-gray-600">Connect your Google Calendar to automatically create events for new bookings.</p>
                    {user?.google_calendar_tokens ? (
                        <div className="p-4 bg-green-50 border-2 border-green-500 rounded-lg flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <CheckCircle className="text-green-600" size={20} />
                                <span className="font-medium">Calendar Connected</span>
                            </div>
                            <button onClick={disconnectCalendar} className="btn btn-secondary text-sm">Disconnect</button>
                        </div>
                    ) : (
                        <button onClick={connectCalendar} className="btn btn-primary">Connect Google Calendar</button>
                    )}
                </div>
            </div>

            {/* Restaurant Settings Form */}
            <form onSubmit={handleSubmit} className="card">
                <div className="flex items-center space-x-3 mb-4">
                    <SettingsIcon size={24} />
                    <h2 className="text-xl font-bold">Restaurant Information</h2>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Restaurant Name</label>
                            <input type="text" name="name" value={settings.name || ''} onChange={handleChange} className="input" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Owner Name</label>
                            <input type="text" name="owner_name" value={settings.owner_name || ''} onChange={handleChange} className="input" required />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Phone</label>
                            <input type="tel" name="phone" value={settings.phone || ''} onChange={handleChange} className="input" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Cuisine Type</label>
                            <input type="text" name="cuisine_type" value={settings.cuisine_type || ''} onChange={handleChange} className="input" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Address</label>
                        <input type="text" name="address" value={settings.address || ''} onChange={handleChange} className="input" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Confirmation Email</label>
                        <input type="email" value={confirmationEmail} onChange={(e) => setConfirmationEmail(e.target.value)} className="input" placeholder="reservations@votre-restaurant.fr" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Total Capacity</label>
                            <input type="number" value={totalCapacity} onChange={(e) => setTotalCapacity(parseInt(e.target.value) || 0)} className="input" min="1" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Max Party Size</label>
                            <input type="number" name="max_party_size" value={settings.max_party_size || ''} onChange={handleChange} className="input" min="1" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Advance Booking (days)</label>
                            <input type="number" name="advance_booking_days" value={settings.advance_booking_days || ''} onChange={handleChange} className="input" min="1" />
                        </div>
                    </div>
                </div>
            </form>

            {/* Opening Hours */}
            <div className="card">
                <div className="flex items-center space-x-3 mb-4">
                    <Clock size={24} />
                    <h2 className="text-xl font-bold">Opening Hours</h2>
                </div>
                <div className="space-y-3">
                    {DAYS.map(({ key, label }) => {
                        const day = hours[key] || { open: false, from: '12:00', to: '22:00' };
                        return (
                            <div key={key} className="flex items-center gap-3">
                                <label className="w-24 text-sm font-medium">{label}</label>
                                <button
                                    type="button"
                                    onClick={() => setHours({ ...hours, [key]: { ...day, open: !day.open } })}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${day.open ? 'bg-green-500' : 'bg-gray-300'}`}
                                >
                                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${day.open ? 'left-6' : 'left-0.5'}`} />
                                </button>
                                {day.open ? (
                                    <div className="flex items-center gap-2 text-sm">
                                        <input type="time" value={day.from} onChange={(e) => setHours({ ...hours, [key]: { ...day, from: e.target.value } })} className="input !w-32 !py-1.5 text-center" />
                                        <span className="text-gray-400">→</span>
                                        <input type="time" value={day.to} onChange={(e) => setHours({ ...hours, [key]: { ...day, to: e.target.value } })} className="input !w-32 !py-1.5 text-center" />
                                    </div>
                                ) : (
                                    <span className="text-sm text-gray-400 italic">Fermé</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Services */}
            <div className="card">
                <div className="flex items-center space-x-3 mb-4">
                    <Users size={24} />
                    <h2 className="text-xl font-bold">Services</h2>
                </div>
                <div className="space-y-4">
                    {/* Lunch */}
                    <div className="p-4 border-2 border-gray-200 rounded-xl space-y-3">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setServices({ ...services, lunch: { ...services.lunch, active: !services.lunch.active } })}
                                className={`w-12 h-6 rounded-full transition-colors relative ${services.lunch.active ? 'bg-green-500' : 'bg-gray-300'}`}
                            >
                                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${services.lunch.active ? 'left-6' : 'left-0.5'}`} />
                            </button>
                            <span className="font-semibold">Lunch</span>
                        </div>
                        {services.lunch.active && (
                            <div className="flex flex-wrap items-center gap-3">
                                <div><label className="text-xs text-gray-500">From</label><input type="time" className="input !w-28 !py-1.5 text-center" value={services.lunch.from} onChange={(e) => setServices({ ...services, lunch: { ...services.lunch, from: e.target.value } })} /></div>
                                <div><label className="text-xs text-gray-500">To</label><input type="time" className="input !w-28 !py-1.5 text-center" value={services.lunch.to} onChange={(e) => setServices({ ...services, lunch: { ...services.lunch, to: e.target.value } })} /></div>
                                <div><label className="text-xs text-gray-500">Max covers</label><input type="number" min={1} className="input !w-24 !py-1.5 text-center" value={services.lunch.capacity} onChange={(e) => setServices({ ...services, lunch: { ...services.lunch, capacity: parseInt(e.target.value) || 0 } })} /></div>
                            </div>
                        )}
                    </div>
                    {/* Dinner */}
                    <div className="p-4 border-2 border-gray-200 rounded-xl space-y-3">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setServices({ ...services, dinner: { ...services.dinner, active: !services.dinner.active } })}
                                className={`w-12 h-6 rounded-full transition-colors relative ${services.dinner.active ? 'bg-green-500' : 'bg-gray-300'}`}
                            >
                                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${services.dinner.active ? 'left-6' : 'left-0.5'}`} />
                            </button>
                            <span className="font-semibold">Dinner</span>
                        </div>
                        {services.dinner.active && (
                            <div className="flex flex-wrap items-center gap-3">
                                <div><label className="text-xs text-gray-500">From</label><input type="time" className="input !w-28 !py-1.5 text-center" value={services.dinner.from} onChange={(e) => setServices({ ...services, dinner: { ...services.dinner, from: e.target.value } })} /></div>
                                <div><label className="text-xs text-gray-500">To</label><input type="time" className="input !w-28 !py-1.5 text-center" value={services.dinner.to} onChange={(e) => setServices({ ...services, dinner: { ...services.dinner, to: e.target.value } })} /></div>
                                <div><label className="text-xs text-gray-500">Max covers</label><input type="number" min={1} className="input !w-24 !py-1.5 text-center" value={services.dinner.capacity} onChange={(e) => setServices({ ...services, dinner: { ...services.dinner, capacity: parseInt(e.target.value) || 0 } })} /></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Policies */}
            <form onSubmit={handleSubmit} className="card">
                <div className="flex items-center space-x-3 mb-4">
                    <SettingsIcon size={24} />
                    <h2 className="text-xl font-bold">Policies & Features</h2>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Cancellation Policy</label>
                        <textarea name="cancellation_policy" value={settings.cancellation_policy || ''} onChange={handleChange} className="input" rows={3} placeholder="e.g., 24 hours notice required" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Special Features</label>
                        <textarea name="special_features" value={settings.special_features || ''} onChange={handleChange} className="input" rows={3} placeholder="e.g., Outdoor seating, Private dining" />
                    </div>

                    <button type="submit" disabled={saving} className="btn btn-primary">
                        {saving ? (
                            <span className="flex items-center justify-center"><span className="loading mr-2"></span>Saving...</span>
                        ) : (
                            <span className="flex items-center justify-center"><Save size={20} className="mr-2" />Save All Settings</span>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Settings;
