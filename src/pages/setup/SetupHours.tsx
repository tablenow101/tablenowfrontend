import React from 'react';
import SetupShell from './SetupShell';
import HoraireSettings from '../settings/HoraireSettings';

// Step 2 — opening hours. Reuses the real HoraireSettings form, which saves
// opening_hours via PUT /settings and refreshes app-state on save.
const SetupHours: React.FC = () => (
  <SetupShell
    step="/setup/hours"
    title="Vos horaires"
    subtitle="Définissez vos services. Votre assistant ne prendra de réservation que sur ces créneaux."
  >
    <HoraireSettings />
  </SetupShell>
);

export default SetupHours;
