import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthCallback: React.FC = () => {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const { loginWithToken } = useAuth();

    useEffect(() => {
        const token = params.get('token');
        const error = params.get('error');
        if (error) { navigate(`/login?error=${error}`); return; }
        if (token) {
            loginWithToken(token);
        } else {
            navigate('/login?error=no_token');
        }
    }, []);

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#b8f000] border-t-transparent rounded-full animate-spin" />
        </div>
    );
};

export default AuthCallback;
