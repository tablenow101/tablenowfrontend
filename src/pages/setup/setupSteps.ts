// Canonical onboarding steps, in business order. Mirrors the backend
// resolveNextRoute() contract exactly.
export const SETUP_STEPS: { route: string; label: string }[] = [
  { route: '/setup/restaurant', label: 'Restaurant' },
  { route: '/setup/hours', label: 'Horaires' },
  { route: '/setup/calendar', label: 'Calendrier' },
  { route: '/setup/assistant', label: 'Assistant' },
  { route: '/setup/success', label: 'Terminé' },
];
