import React from 'react';
import { useSidebar } from '../../context/SidebarContext';
import GeneralSettings       from './GeneralSettings';
import HoraireSettings       from './HoraireSettings';
import AssistantSettings     from './AssistantSettings';
import ParrainageSettings    from './ParrainageSettings';
import CalendarSettings      from './CalendarSettings';
import NotificationsSettings from './NotificationsSettings';
import IdentifiantsSettings  from './IdentifiantsSettings';
import ServicesSettings      from './ServicesSettings';

const SettingsPage: React.FC = () => {
  const { activeSection } = useSidebar();

  return (
    <div className="bg-[#0a0a0a] min-h-[calc(100vh-84px)] p-8">
      {activeSection === 'general'       && <GeneralSettings />}
      {activeSection === 'hours'         && <HoraireSettings />}
      {activeSection === 'assistant'     && <AssistantSettings />}
      {activeSection === 'referral'      && <ParrainageSettings />}
      {activeSection === 'services'      && <ServicesSettings />}
      {activeSection === 'calendar'      && <CalendarSettings />}
      {activeSection === 'notifications' && <NotificationsSettings />}
      {activeSection === 'identifiers'   && <IdentifiantsSettings />}
    </div>
  );
};

export default SettingsPage;
