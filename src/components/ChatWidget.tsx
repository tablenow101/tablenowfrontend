import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageSquare, X, Send } from 'lucide-react';
import { useLang } from '../hooks/useLang';
import api from '../lib/api';

interface ChatMessage {
  id: number;
  from: 'bot' | 'user';
  text: string;
  quickReplies?: string[];
  isCalendly?: boolean;
}

type Step = 'idle' | 'email' | 'done';

const SCRIPTS = {
  fr: {
    greeting: 'Bonjour ! 👋 Je suis le concierge TableNow. Comment puis-je vous aider ?',
    quickReplies: ['Voir une démo', 'Voir les tarifs', 'Comment ça marche ?', 'Parler à un humain'],
    demoIntro: 'Parfait ! Réservez un créneau de 30 minutes avec notre équipe 👇',
    pricing: 'TableNow commence à partir de 79€/mois. L\'IA répond à vos clients 24h/24, gère les réservations et les annulations automatiquement.',
    how: 'TableNow est un assistant IA qui décroche votre téléphone, parle avec vos clients en français ou en anglais, et gère vos réservations. Zéro effort de votre côté.',
    human: 'Bien sûr ! Laissez-moi votre email et un expert vous rappelle dans les 24h.',
    followUp: 'Autre chose que je peux faire pour vous ?',
    genericReply: 'Bonne question ! Je peux vous aider avec une démo, les tarifs ou une mise en contact avec notre équipe.',
    emailPrompt: 'Entrez une adresse email valide :',
    emailPlaceholder: 'vous@restaurant.fr',
    emailThanks: 'Merci ! On vous contacte très vite 🎉',
    inputPlaceholder: 'Votre message...',
    headerOnline: 'En ligne',
  },
  en: {
    greeting: 'Hi! 👋 I\'m the TableNow Concierge. How can I help you?',
    quickReplies: ['Book a demo', 'See pricing', 'How does it work?', 'Talk to a human'],
    demoIntro: 'Great! Book a 30-minute slot with our team 👇',
    pricing: 'TableNow starts at €79/month. The AI answers your customers 24/7, handles reservations and cancellations automatically.',
    how: 'TableNow is an AI assistant that answers your phone, speaks with customers in French or English, and manages your reservations. Zero effort on your end.',
    human: 'Of course! Leave your email and an expert will call you within 24 hours.',
    followUp: 'Anything else I can help you with?',
    genericReply: 'Good question! I can help you with a demo, pricing, or connecting you with our team.',
    emailPrompt: 'Please enter a valid email:',
    emailPlaceholder: 'you@restaurant.com',
    emailThanks: 'Thank you! We\'ll be in touch very soon 🎉',
    inputPlaceholder: 'Your message...',
    headerOnline: 'Online now',
  },
};

const CHAT_SHOWN_KEY = 'tablenow_chat_shown';

const ChatWidget: React.FC = () => {
  const { lang } = useLang();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [step, setStep] = useState<Step>('idle');
  const [input, setInput] = useState('');
  const nextId = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const langRef = useRef(lang);
  const hasShownWelcome = useRef(false);
  langRef.current = lang;

  const isPublic = pathname === '/login' || pathname === '/register';
  const s = SCRIPTS[lang];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Show welcome once when chat opens
  useEffect(() => {
    if (open && !hasShownWelcome.current) {
      hasShownWelcome.current = true;
      const l = langRef.current;
      setMessages([{
        id: nextId.current++,
        from: 'bot',
        text: SCRIPTS[l].greeting,
        quickReplies: [...SCRIPTS[l].quickReplies],
      }]);
    }
  }, [open]);

  // Chat stays closed until user clicks the bubble

  const addMsg = (from: 'bot' | 'user', text: string, opts?: { quickReplies?: string[]; isCalendly?: boolean }) => {
    setMessages(prev => [...prev, { id: nextId.current++, from, text, ...opts }]);
  };

  const showFollowUp = () => {
    setTimeout(() => {
      const l = langRef.current;
      setStep('idle');
      setMessages(prev => [...prev, {
        id: nextId.current++,
        from: 'bot',
        text: SCRIPTS[l].followUp,
        quickReplies: [...SCRIPTS[l].quickReplies],
      }]);
    }, 800);
  };

  const handleToggle = () => {
    if (!open && !sessionStorage.getItem(CHAT_SHOWN_KEY)) {
      sessionStorage.setItem(CHAT_SHOWN_KEY, '1');
    }
    setOpen(o => !o);
  };

  const handleQuickReply = (reply: string, index: number) => {
    addMsg('user', reply);
    setTimeout(() => {
      const l = langRef.current;
      const cur = SCRIPTS[l];
      if (index === 0) {
        // Demo → inline Calendly iframe; follow-up after 2000ms
        setMessages(prev => [
          ...prev,
          { id: nextId.current++, from: 'bot', text: cur.demoIntro },
          { id: nextId.current++, from: 'bot', text: '', isCalendly: true },
        ]);
        setTimeout(() => showFollowUp(), 2000);
      } else if (index === 1) {
        // Pricing
        addMsg('bot', cur.pricing);
        showFollowUp();
      } else if (index === 2) {
        // How it works
        addMsg('bot', cur.how);
        showFollowUp();
      } else {
        // Human → ask for email
        addMsg('bot', cur.human);
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
        try { await api.post('/contact', { email: text, lang }); } catch { /* silent */ }
        setTimeout(() => {
          addMsg('bot', SCRIPTS[langRef.current].emailThanks);
          showFollowUp();
        }, 400);
      } else {
        setTimeout(() => addMsg('bot', SCRIPTS[langRef.current].emailPrompt), 400);
      }
    } else {
      setTimeout(() => {
        addMsg('bot', SCRIPTS[langRef.current].genericReply);
        showFollowUp();
      }, 400);
    }
  };

  if (!isPublic) return null;

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[340px] h-[480px] bg-[#111] border border-[#2a2a2a] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#b8f000] flex-shrink-0">
            <div className="min-w-0">
              <p className="text-black font-bold text-sm">TableNow Concierge</p>
              <p className="text-black/70 text-xs">{s.headerOnline}</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="ml-3 flex-shrink-0 p-1 rounded-full hover:bg-black/10 transition-colors"
            >
              <X size={16} className="text-black" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.from === 'user' ? 'items-end' : 'items-start'}`}
              >
                {msg.isCalendly ? (
                  <div
                    className="w-full mt-2 rounded-xl overflow-hidden border border-[#2a2a2a]"
                    style={{ height: '320px' }}
                  >
                    <iframe
                      src="https://calendly.com/tablenow101/30min?embed_type=inline&hide_gdpr_banner=1&background_color=111111&text_color=ffffff&primary_color=b8f000"
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      title="Calendly"
                    />
                  </div>
                ) : (
                  <div
                    className={`max-w-[80%] px-4 py-3 text-sm break-words ${
                      msg.from === 'user'
                        ? 'bg-[#b8f000] text-black font-medium rounded-2xl rounded-tr-sm'
                        : 'bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-2xl rounded-tl-sm'
                    }`}
                    style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                  >
                    {msg.text}
                  </div>
                )}
                {msg.quickReplies && msg.quickReplies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {msg.quickReplies.map((r, i) => (
                      <button
                        key={r}
                        onClick={() => handleQuickReply(r, i)}
                        className="border border-[#2a2a2a] text-[#888] text-xs px-3 py-1.5 rounded-full hover:border-[#b8f000] hover:text-white transition cursor-pointer whitespace-nowrap"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          {step !== 'done' && (
            <div className="border-t border-[#2a2a2a] p-3 flex gap-2 items-center flex-shrink-0">
              <input
                type={step === 'email' ? 'email' : 'text'}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
                placeholder={step === 'email' ? s.emailPlaceholder : s.inputPlaceholder}
                className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-white text-sm placeholder-[#555] focus:outline-none focus:border-[#b8f000] transition-colors"
              />
              <button
                onClick={handleSend}
                className="bg-[#b8f000] p-2.5 rounded-xl hover:opacity-90 transition flex-shrink-0"
              >
                <Send size={16} className="text-black" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Trigger bubble */}
      <button
        onClick={handleToggle}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#b8f000] rounded-full shadow-xl flex items-center justify-center cursor-pointer hover:opacity-90 transition z-50"
      >
        {open
          ? <X className="text-black w-6 h-6" />
          : <MessageSquare className="text-black w-6 h-6" />
        }
      </button>
    </>
  );
};

export default ChatWidget;
