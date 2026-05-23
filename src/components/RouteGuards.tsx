import React from 'react';
import { Navigate } from 'react-router-dom';
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

  // Check if onboarding is complete
  const isOnboardingComplete = appState?.onboarding?.status === 'complete';

  if (!isOnboardingComplete) {
    // Redirect to next route as determined by backend
    const nextRoute = appState?.next_route || '/setup';
    return <Navigate to={nextRoute} replace />;
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
    // Redirect to subscription/billing page
    return <Navigate to="/billing" replace />;
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
    // Redirect to complete restaurant setup
    return <Navigate to="/settings" replace />;
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
    // Redirect to assistant setup
    return <Navigate to="/settings?tab=voice" replace />;
  }

  return <>{children}</>;
};

// ──────────────────────────────────────────────────────────────────────────────
// ComposableGuards: Combine multiple guards with AND logic
// ──────────────────────────────────────────────────────────────────────────────

interface GuardConfig {
  protection?: 'protected' | 'subscription' | 'onboarding' | 'complete' | 'assistant';
}

export const withGuards = (
  Component: React.ComponentType,
  config: GuardConfig
): React.ComponentType => {
  return ({ ...props }) => {
    const guards = config.protection;

    if (guards === 'protected') {
      return (
        <ProtectedRoute>
          <Component {...props} />
        </ProtectedRoute>
      );
    }

    if (guards === 'subscription') {
      return (
        <ProtectedRoute>
          <SubscriptionGuard>
            <Component {...props} />
          </SubscriptionGuard>
        </ProtectedRoute>
      );
    }

    if (guards === 'onboarding') {
      return (
        <ProtectedRoute>
          <OnboardingGuard>
            <Component {...props} />
          </OnboardingGuard>
        </ProtectedRoute>
      );
    }

    if (guards === 'complete') {
      return (
        <ProtectedRoute>
          <RestaurantCompleteGuard>
            <Component {...props} />
          </RestaurantCompleteGuard>
        </ProtectedRoute>
      );
    }

    if (guards === 'assistant') {
      return (
        <ProtectedRoute>
          <AssistantGuard>
            <Component {...props} />
          </AssistantGuard>
        </ProtectedRoute>
      );
    }

    // Default: no guards
    return <Component {...props} />;
  };
};

export default {
  ProtectedRoute,
  OnboardingGuard,
  SubscriptionGuard,
  RestaurantCompleteGuard,
  AssistantGuard,
  withGuards,
};
