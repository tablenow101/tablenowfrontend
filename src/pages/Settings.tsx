import React, { useState } from 'react';
import { useLang } from '../hooks/useLang';
import GeneralSettings       from './settings/GeneralSettings';
import HoraireSettings       from './settings/HoraireSettings';
import CalendarSettings      from './settings/CalendarSettings';
import NotificationsSettings from './settings/NotificationsSettings';
import ParrainageSettings    from './settings/ParrainageSettings';

type Tab = 'general' | 'horaires' | 'integrations' | 'parrainage';

const Settings: React.FC = () => {
    const { t } = useLang();
    const [tab, setTab] = useState<Tab>('general');

    const TABS: { key: Tab; label: string }[] = [
        { key: 'general',      label: t('subGeneral')      },
        { key: 'horaires',     label: t('subHours')        },
        { key: 'integrations', label: t('subIntegrations') },
        { key: 'parrainage',   label: t('subParrainage')   },
    ];

    return (
        <div>
            <h1 className="text-2xl font-bold text-white mb-5">{t('settingsTitle')}</h1>
            <div className="flex overflow-x-auto border-b border-[#2a2a2a] mb-6">
                {TABS.map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        className="px-5 py-3 text-sm transition-colors border-b-2 -mb-px whitespace-nowrap"
                        style={tab === key
                            ? { color: '#fff', borderBottomColor: '#b8f000' }
                            : { color: '#888', borderBottomColor: 'transparent' }
                        }
                    >
                        {label}
                    </button>
                ))}
            </div>
            {tab === 'general'      && <GeneralSettings />}
            {tab === 'horaires'     && <HoraireSettings />}
            {tab === 'integrations' && <div className="space-y-4"><CalendarSettings /><NotificationsSettings /></div>}
            {tab === 'parrainage'   && <ParrainageSettings />}
        </div>
    );
};

export default Settings;
