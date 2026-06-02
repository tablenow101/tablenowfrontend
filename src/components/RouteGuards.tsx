import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import NotLinked from '../pages/NotLinked';

interface RouteGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// Loading fallback component
function DefaultLoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="loading w-12 h-12"></div>
    </div>
  );
}

// Loop-safe redirect: never navigate to the route we are already on.
// This is the single mechanism that makes every guard immune to redirect
// loops — if a guard's target resolves to the current location (e.g.
// next_route === current path), we render the children instead of looping.
function GuardRedirect({ to, children }: { to: string; children: React.ReactNode }) {
  const location = useLocation();
  const current = `${location.pathname}${location.search}`;
  if (to === location.pathname || to === current) {
    return <>{children}</>;
  }
  return <Navigate to={to} replace />;
}

// ──────────────────────────────────────────────────────────────────────────────
// ProtectedRoute: Requires authentication + restaurant linkage
// ──────────────────────────────────────────────────────────────────────────────

export const ProtectedRoute: React.FC<RouteGuardProps> = ({
  children,
  fallback = <DefaultLoadingSpinner />,
}) => {
  const { session, restaurant, authReady } = useAuth();

  if (!authReady) {
    return <>{fallback}</>;
  }

  // No session: redirect to login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // No restaurant: show not linked page
  if (!restaurant?.id) {
    return <NotLinked />;
  }

  return <>{children}</>;
};

// ──────────────────────────────────────────────────────────────────────────────
// OnboardingGuard: Requires onboarding to be complete
// ──────────────────────────────────────────────────────────────────────────────

export const OnboardingGuard: React.FC<RouteGuardProps> = ({
  children,
  fallback = <DefaultLoadingSpinner />,
}) => {
  const { session, appState, authReady } = useAuth();

  if (!authReady) {
    return <>{fallback}</>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!appState?.restaurant?.id) {
    return <NotLinked />;
  }

  const isOnboardingComplete = appState?.onboarding?.status === 'complete';

  if (!isOnboardingComplete) {
    // Backend-driven destination: a real /setup/* onboarding page (or /dashboard
    // once done). GuardRedirect prevents self-redirects; the fallback is the
    // first real onboarding step.
    const nextRoute = appState?.next_route || '/setup/restaurant';
    return <GuardRedirect to={nextRoute}>{children}</GuardRedirect>;
  }

  return <>{children}</>;
};

// ──────────────────────────────────────────────────────────────────────────────
// SubscriptionGuard: Requires active subscription
// ──────────────────────────────────────────────────────────────────────────────

export const SubscriptionGuard: React.FC<RouteGuardProps> = ({
  children,
  fallback = <DefaultLoadingSpinner />,
}) => {
  const { session, appState, authReady } = useAuth();

  if (!authReady) {
    return <>{fallback}</>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!appState?.restaurant?.id) {
    return <NotLinked />;
  }

  const subscriptionStatus = appState?.subscription?.status;
  const isSubscriptionActive = subscriptionStatus === 'active' || subscriptionStatus === 'trial';

  if (!isSubscriptionActive) {
    return <GuardRedirect to="/billing">{children}</GuardRedirect>;
  }

  return <>{children}</>;
};

// ──────────────────────────────────────────────────────────────────────────────
// RestaurantCompleteGuard: Requires restaurant profile to be complete
// ──────────────────────────────────────────────────────────────────────────────

export const RestaurantCompleteGuard: React.FC<RouteGuardProps> = ({
  children,
  fallback = <DefaultLoadingSpinner />,
}) => {
  const { session, appState, authReady } = useAuth();

  if (!authReady) {
    return <>{fallback}</>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!appState?.restaurant?.id) {
    return <NotLinked />;
  }

  const isRestaurantComplete = appState?.restaurant?.is_complete;

  if (!isRestaurantComplete) {
    return <GuardRedirect to="/settings">{children}</GuardRedirect>;
  }

  return <>{children}</>;
};

// ──────────────────────────────────────────────────────────────────────────────
// AssistantGuard: Requires voice assistant to be active
// ──────────────────────────────────────────────────────────────────────────────

export const AssistantGuard: React.FC<RouteGuardProps> = ({
  children,
  fallback = <DefaultLoadingSpinner />,
}) => {
  const { session, appState, authReady } = useAuth();

  if (!authReady) {
    return <>{fallback}</>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!appState?.restaurant?.id) {
    return <NotLinked />;
  }

  const assistantStatus = appState?.assistant?.status;
  const isAssistantActive = assistantStatus === 'active';

  if (!isAssistantActive) {
    return <GuardRedirect to="/settings">{children}</GuardRedirect>;
  }

  return <>{children}</>;
};
