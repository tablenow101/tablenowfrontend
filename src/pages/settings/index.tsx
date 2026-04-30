import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Clock,
  Utensils,
  Calendar,
  Bell,
  Bot,
  Key,
  Gift,
} from 'lucide-react';
import GeneralSettings    from './GeneralSettings';
import HoraireSettings    from './HoraireSettings';
import AssistantSettings  from './AssistantSettings';
import ParrainageSettings from './ParrainageSettings';

type SectionId =
  | 'general'
  | 'hours'
  | 'services'
  | 'calendar'
  | 'notifications'
  | 'assistant'
  | 'identifiers'
  | 'referral';

const SIDEBAR_ITEMS: {
  id: SectionId;
  label: string;
  icon: React.ElementType;
  group: string;
}[] = [
  { id: 'general',       label: 'Général',       icon: SettingsIcon, group: 'RESTAURANT'   },
  { id: 'hours',         label: 'Horaires',       icon: Clock,        group: 'RESTAURANT'   },
  { id: 'services',      label: 'Services',       icon: Utensils,     group: 'RESTAURANT'   },
  { id: 'calendar',      label: 'Google Agenda',  icon: Calendar,     group: 'INTÉGRATIONS' },
  { id: 'notifications', label: 'Notifications',  icon: Bell,         group: 'INTÉGRATIONS' },
  { id: 'assistant',     label: 'Assistant IA',   icon: Bot,          group: 'SYSTÈME'      },
  { id: 'identifiers',   label: 'Identifiants',   icon: Key,          group: 'SYSTÈME'      },
  { id: 'referral',      label: 'Parrainage',     icon: Gift,         group: 'SYSTÈME'      },
];

const GROUPS = ['RESTAURANT', 'INTÉGRATIONS', 'SYSTÈME'] as const;

function Placeholder({ title }: { title: string }) {
  return (
    <div className="max-w-2xl">
      <p className="text-sm text-[#555]">Configuration {title} à venir.</p>
    </div>
  );
}

const SettingsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SectionId>('general');

  return (
    <div className="flex min-h-[calc(100vh-84px)] bg-[#0a0a0a]">
      {/* ── Sidebar ── */}
      <nav className="fixed left-0 top-[84px] bottom-0 w-[220px] bg-[#0a0a0a] border-r border-[#1a1a1a] overflow-y-auto z-30 py-5">
        {GROUPS.map(group => (
          <div key={group} className="mb-5">
            <p className="text-[10px] font-semibold text-[#555] uppercase tracking-wider px-4 mb-1">
              {group}
            </p>
            {SIDEBAR_ITEMS.filter(i => i.group === group).map(item => {
              const Icon = item.icon;
              const active = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`flex items-center gap-2.5 w-full px-4 py-2 text-xs transition-colors text-left border-l-2 ${
                    active
                      ? 'border-[#b8f000] text-white'
                      : 'border-transparent text-[#888] hover:text-white'
                  }`}
                >
                  <Icon size={13} className="flex-shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Content area ── */}
      <main className="ml-[220px] flex-1 p-8">
        {activeSection === 'general'       && <GeneralSettings />}
        {activeSection === 'hours'         && <HoraireSettings />}
        {activeSection === 'assistant'     && <AssistantSettings />}
        {activeSection === 'referral'      && <ParrainageSettings />}
        {activeSection === 'services'      && <Placeholder title="Services" />}
        {activeSection === 'calendar'      && <Placeholder title="Google Agenda" />}
        {activeSection === 'notifications' && <Placeholder title="Notifications" />}
        {activeSection === 'identifiers'   && <Placeholder title="Identifiants" />}
      </main>
    </div>
  );
};

export default SettingsPage;
