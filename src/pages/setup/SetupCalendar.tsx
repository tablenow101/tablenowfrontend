import React, { useState } from 'react';
import SetupShell from './SetupShell';
import CalendarSettings from '../settings/CalendarSettings';
import { calendarAPI } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';

// Step 3 — Google Calendar. Connecting is optional: the user may skip, which is
// persisted server-side (calendar_skipped_at) and lets the flow proceed.
const SetupCalendar: React.FC = () => {
  const { refreshUser } = useAuth();
  const [skipping, setSkipping] = useState(false);

  const skip = async () => {
    setSkipping(true);
    try {
      await calendarAPI.skip();
      await refreshUser(); // app-state advances, SetupShell navigates forward
    } catch (err) {
      console.error('Calendar skip failed:', err);
      setSkipping(false);
    }
  };

  return (
    <SetupShell
      step="/setup/calendar"
      title="Synchronisez votre agenda"
      subtitle="Connectez Google Calendar pour voir vos réservations dans votre agenda, ou passez cette étape."
      footer={
        <button
          onClick={skip}
          disabled={skipping}
          className="h-11 px-6 bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-xl text-sm hover:border-[#444] transition-colors disabled:opacity-60"
        >
          {skipping ? '…' : 'Passer cette étape'}
        </button>
      }
    >
      <CalendarSettings returnTo="/setup/calendar" />
    </SetupShell>
  );
};

export default SetupCalendar;
