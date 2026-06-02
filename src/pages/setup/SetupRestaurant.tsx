import React from 'react';
import SetupShell from './SetupShell';
import GeneralSettings from '../settings/GeneralSettings';

// Step 1 — restaurant profile. Reuses the real GeneralSettings form, which saves
// via PUT /settings and refreshes app-state on save (auto-advancing the shell).
const SetupRestaurant: React.FC = () => (
  <SetupShell
    step="/setup/restaurant"
    title="Votre restaurant"
    subtitle="Renseignez les informations de base. Elles sont nécessaires pour activer votre assistant."
  >
    <GeneralSettings />
  </SetupShell>
);

export default SetupRestaurant;
