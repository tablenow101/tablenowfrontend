import React, { useState } from 'react';
import { useLang } from '../../context/LangContext';
import GeneralSettings       from './GeneralSettings';
import HoraireSettings       from './HoraireSettings';
import CalendarSettings      from './CalendarSettings';
import NotificationsSettings from './NotificationsSettings';
import IdentifiantsSettings  from './IdentifiantsSettings';
import AssistantSettings     from './AssistantSettings';
import ParrainageSettings    from './ParrainageSettings';

type Tab = 'general' | 'horaires' | 'integrations' | 'systeme' | 'parrainage';

const SettingsPage: React.FC = () => {
    const { t } = useLang();
    const [tab, setTab] = useState<Tab>('general');

    const TABS: { key: Tab; label: string }[] = [
        { key: 'general',     label: t('subGeneral')      },
        { key: 'horaires',    label: t('subHours')        },
        { key: 'integrations',label: t('subIntegrations') },
        { key: 'systeme',     label: 'Système'            },
        { key: 'parrainage',  label: 'Parrainage'         },
    ];

    return (
        <div>
            <h1 className="text-2xl font-bold text-white mb-5">{t('settingsTitle')}</h1>

            {/* Tabs horizontaux */}
            <div className="flex border-b border-[#2a2a2a] mb-6">
                {TABS.map(({ key, label }) => (
                    <button key={key} onClick={() => setTab(key)}
                        className="px-5 py-3 text-sm transition-colors border-b-2 -mb-px whitespace-nowrap"
                        style={tab === key
                            ? { color: '#fff', borderBottomColor: '#b8f000' }
                            : { color: '#888', borderBottomColor: 'transparent' }
                        }
                    >{label}</button>
                ))}
            </div>

            {tab === 'general'      && <GeneralSettings />}
            {tab === 'horaires'     && <HoraireSettings />}
            {tab === 'integrations' && <div className="space-y-4"><CalendarSettings /><NotificationsSettings /></div>}
            {tab === 'systeme'      && <div className="space-y-6"><AssistantSettings /><IdentifiantsSettings /></div>}
            {tab === 'parrainage'   && <ParrainageSettings />}
        </div>
    );
};

export default SettingsPage;
