import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { SETUP_STEPS } from './setupSteps';

interface SetupShellProps {
  /** Canonical route this page represents, e.g. '/setup/restaurant'. */
  step: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Optional extra actions rendered in the footer (e.g. a Skip button). */
  footer?: React.ReactNode;
}

/**
 * Shared onboarding shell.
 *
 * The whole flow is driven by the backend's appState.next_route — the single
 * source of truth. Whenever next_route advances PAST the current step (because
 * the underlying DB state changed after a save), this shell navigates forward
 * automatically. It never invents destinations and never replaces the real
 * business page: it only follows the backend.
 */
const SetupShell: React.FC<SetupShellProps> = ({ step, title, subtitle, children, footer }) => {
  const { appState, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const nextRoute = appState?.next_route ?? null;

  // Follow the backend: if it now points somewhere other than this step, go there.
  useEffect(() => {
    if (!nextRoute) return;
    if (nextRoute !== step && nextRoute !== location.pathname) {
      navigate(nextRoute, { replace: true });
    }
  }, [nextRoute, step, location.pathname, navigate]);

  const currentIndex = SETUP_STEPS.findIndex((s) => s.route === step);

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 py-8 sm:py-12">
      <div className="max-w-2xl mx-auto">
        {/* Stepper */}
        <ol className="flex items-center justify-between mb-8">
          {SETUP_STEPS.map((s, i) => {
            const done = i < currentIndex;
            const active = i === currentIndex;
            return (
              <li key={s.route} className="flex-1 flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${
                      active
                        ? 'bg-[#b8f000] text-black border-[#b8f000]'
                        : done
                        ? 'bg-[#b8f00020] text-[#b8f000] border-[#b8f000]'
                        : 'text-[#555] border-[#2a2a2a]'
                    }`}
                  >
                    {done ? '✓' : i + 1}
                  </div>
                  <span className={`mt-1 text-[10px] ${active ? 'text-white' : 'text-[#555]'}`}>{s.label}</span>
                </div>
                {i < SETUP_STEPS.length - 1 && (
                  <div className={`flex-1 h-px mx-1 ${done ? 'bg-[#b8f000]' : 'bg-[#2a2a2a]'}`} />
                )}
              </li>
            );
          })}
        </ol>

        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">{title}</h1>
        {subtitle && <p className="text-[#888] text-sm mb-6">{subtitle}</p>}

        <div className="mt-6">{children}</div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-end">
          {footer}
          <button
            onClick={() => refreshUser()}
            className="h-11 px-6 bg-[#b8f000] text-black font-bold rounded-xl text-sm hover:opacity-90 transition-opacity"
          >
            Continuer
          </button>
        </div>
        <p className="mt-3 text-[11px] text-[#555] text-right">
          Enregistrez l'étape, puis « Continuer » vous amène automatiquement à la suivante.
        </p>
      </div>
    </div>
  );
};

export default SetupShell;
