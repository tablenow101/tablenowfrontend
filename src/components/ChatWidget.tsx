import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle, X, Send } from 'lucide-react';
import { useLang } from '../context/LangContext';
import api from '../lib/api';

interface Message {
  id: number;
  from: 'bot' | 'user';
  text: string;
}

type Step = 'welcome' | 'question' | 'email' | 'done';

const SCRIPTS = {
  fr: {
    greeting: 'Bonjour ! Je suis le Concierge TableNow 👋',
    welcome: 'Comment puis-je vous aider ?',
    quickReplies: ['Essai gratuit', 'En savoir plus', 'Parler à un expert'] as const,
    essai: "Super ! Pour démarrer votre essai gratuit, j'ai juste besoin de votre email.",
    info: 'TableNow est un assistant IA qui répond à vos clients 24h/24 et gère vos réservations automatiquement.',
    expert: 'Parfait ! Un expert vous contactera très prochainement. Quel est votre email ?',
    emailPrompt: 'Entrez une adresse email valide :',
    emailPlaceholder: 'vous@restaurant.fr',
    emailThanks: 'Merci ! On vous contacte très vite 🎉',
    inputPlaceholder: 'Votre message...',
    headerSub: 'Répondez instantanément',
  },
  en: {
    greeting: "Hello! I'm the TableNow Concierge 👋",
    welcome: 'How can I help you today?',
    quickReplies: ['Free trial', 'Learn more', 'Talk to an expert'] as const,
    essai: 'Great! To start your free trial, I just need your email.',
    info: 'TableNow is an AI assistant that answers your customers 24/7 and manages reservations automatically.',
    expert: "Perfect! An expert will contact you shortly. What's your email?",
    emailPrompt: 'Please enter a valid email:',
    emailPlaceholder: 'you@restaurant.com',
    emailThanks: "Thank you! We'll be in touch very soon 🎉",
    inputPlaceholder: 'Your message...',
    headerSub: 'Instant responses',
  },
};

const ChatWidget: React.FC = () => {
  const { lang } = useLang();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [step, setStep] = useState<Step>('welcome');
  const [input, setInput] = useState('');
  const [showQuick, setShowQuick] = useState(false);
  const welcomeShown = useRef(false);
  const nextId = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scriptsRef = useRef(SCRIPTS[lang]);
  scriptsRef.current = SCRIPTS[lang];

  const isPublic = pathname === '/login' || pathname === '/register';
  const s = SCRIPTS[lang];

  const addMsg = useCallback((from: 'bot' | 'user', text: string) => {
    setMessages(prev => [...prev, { id: nextId.current++, from, text }]);
  }, []);

  const showWelcome = useCallback(() => {
    addMsg('bot', scriptsRef.current.greeting);
    setTimeout(() => {
      addMsg('bot', scriptsRef.current.welcome);
      setShowQuick(true);
    }, 800);
  }, [addMsg]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isPublic) return;
    const delay = pathname === '/login' ? 3000 : 5000;
    const t = setTimeout(() => {
      if (!welcomeShown.current) {
        welcomeShown.current = true;
        setOpen(true);
        showWelcome();
      }
    }, delay);
    return () => clearTimeout(t);
  }, [pathname, isPublic, showWelcome]);

  const handleToggle = () => {
    if (open) {
      setOpen(false);
    } else {
      setOpen(true);
      if (!welcomeShown.current) {
        welcomeShown.current = true;
        showWelcome();
      }
    }
  };

  const handleQuickReply = (reply: string) => {
    setShowQuick(false);
    addMsg('user', reply);
    setTimeout(() => {
      if (reply === s.quickReplies[0]) {
        addMsg('bot', s.essai);
        setStep('email');
      } else if (reply === s.quickReplies[1]) {
        addMsg('bot', s.info);
        setStep('question');
      } else {
        addMsg('bot', s.expert);
        setStep('email');
      }
    }, 400);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    addMsg('user', text);

    if (step === 'email') {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
      if (isEmail) {
        try {
          await api.post('/contact', { email: text, lang });
        } catch { /* silent */ }
        setTimeout(() => {
          addMsg('bot', s.emailThanks);
          setStep('done');
        }, 400);
      } else {
        setTimeout(() => addMsg('bot', s.emailPrompt), 400);
      }
    } else {
      setTimeout(() => {
        addMsg('bot', s.welcome);
        setShowQuick(true);
      }, 400);
    }
  };

  if (!isPublic) return null;

  return (
    <>
      {open && (
        <div className="fixed bottom-20 right-4 z-50 w-80 h-[480px] bg-[#111] border border-[#2a2a2a] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-[#b8f000]">
            <div>
              <p className="text-black font-bold text-sm">TableNow Concierge</p>
              <p className="text-black/60 text-xs">{s.headerSub}</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded-full hover:bg-black/10 transition-colors"
            >
              <X size={16} className="text-black" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                  msg.from === 'user'
                    ? 'bg-[#b8f000] text-black font-medium'
                    : 'bg-[#1a1a1a] text-white'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}

            {showQuick && (
              <div className="flex flex-wrap gap-2 mt-2">
                {s.quickReplies.map(r => (
                  <button
                    key={r}
                    onClick={() => handleQuickReply(r)}
                    className="px-3 py-1.5 text-xs bg-[#1a1a1a] border border-[#2a2a2a] rounded-full text-[#b8f000] hover:border-[#b8f000] transition-colors"
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {step !== 'done' && (
            <div className="px-3 py-2 border-t border-[#2a2a2a] flex gap-2">
              <input
                type={step === 'email' ? 'email' : 'text'}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
                placeholder={step === 'email' ? s.emailPlaceholder : s.inputPlaceholder}
                className="flex-1 h-9 px-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#b8f000] transition-colors"
              />
              <button
                onClick={handleSend}
                className="w-9 h-9 bg-[#b8f000] rounded-xl flex items-center justify-center hover:bg-[#a0d800] transition-colors flex-shrink-0"
              >
                <Send size={14} className="text-black" />
              </button>
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleToggle}
        className="fixed bottom-4 right-4 z-50 w-12 h-12 bg-[#b8f000] rounded-full flex items-center justify-center shadow-lg hover:bg-[#a0d800] transition-colors"
      >
        {open
          ? <X size={20} className="text-black" />
          : <MessageCircle size={20} className="text-black" />
        }
      </button>
    </>
  );
};

export default ChatWidget;
