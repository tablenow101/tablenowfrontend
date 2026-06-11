import React, { useState, useRef, useEffect } from 'react';
import { settingsAPI } from '../../lib/api';
import { useLang } from '../../hooks/useLang';

const DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];

const DEFAULT_SERVICE_TYPES = ['Déjeuner', 'Dîner', 'Brunch', 'Apéritif', 'Service spécial'];
const DEFAULT_COVERS = 50;

type Service = { name: string; start: string; end: string; covers: number };
type DayData = { enabled: boolean; services: Service[] };

const DEFAULT: DayData[] = [
  { enabled:true,  services:[{name:'Déjeuner',start:'12:00',end:'14:30',covers:DEFAULT_COVERS},{name:'Dîner',start:'19:00',end:'22:30',covers:DEFAULT_COVERS}] },
  { enabled:true,  services:[{name:'Déjeuner',start:'12:00',end:'14:30',covers:DEFAULT_COVERS},{name:'Dîner',start:'19:00',end:'22:30',covers:DEFAULT_COVERS}] },
  { enabled:true,  services:[{name:'Déjeuner',start:'12:00',end:'14:30',covers:DEFAULT_COVERS},{name:'Dîner',start:'19:00',end:'22:30',covers:DEFAULT_COVERS}] },
  { enabled:true,  services:[{name:'Déjeuner',start:'12:00',end:'14:30',covers:DEFAULT_COVERS},{name:'Dîner',start:'19:00',end:'22:30',covers:DEFAULT_COVERS}] },
  { enabled:true,  services:[{name:'Déjeuner',start:'12:00',end:'14:30',covers:DEFAULT_COVERS},{name:'Dîner',start:'19:00',end:'23:00',covers:DEFAULT_COVERS}] },
  { enabled:true,  services:[{name:'Déjeuner',start:'12:00',end:'14:30',covers:DEFAULT_COVERS},{name:'Dîner',start:'19:00',end:'23:00',covers:DEFAULT_COVERS}] },
  { enabled:false, services:[] },
];

const timeInp = "w-[76px] h-9 px-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm text-white text-center focus:outline-none focus:border-[#444] transition-colors";
const covInp  = "w-[56px] h-9 px-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm text-white text-center focus:outline-none focus:border-[#444] transition-colors";
const nameSel = "h-9 px-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm text-white focus:outline-none focus:border-[#444] transition-colors min-w-[100px]";

function nextServiceName(types: string[], existing: Service[]): string {
  for (const t of types) {
    if (!existing.some(s => s.name === t)) return t;
  }
  return `Service ${existing.length + 1}`;
}

const HoraireSettings: React.FC = () => {
  const { t } = useLang();
  const [days, setDays] = useState<DayData[]>(DEFAULT.map(d => ({ ...d, services: d.services.map(s => ({ ...s })) })));
  const [serviceTypes, setServiceTypes] = useState<string[]>(DEFAULT_SERVICE_TYPES);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const original = useRef<DayData[]>(JSON.parse(JSON.stringify(DEFAULT)));

  useEffect(() => {
    settingsAPI.get()
      .then(res => {
        const d = res.data?.restaurant ?? res.data?.settings ?? res.data ?? {};
        if (Array.isArray(d.services) && d.services.length > 0) {
          setServiceTypes(d.services as string[]);
        }
        if (Array.isArray(d.opening_hours) && d.opening_hours.length === 7) {
          original.current = JSON.parse(JSON.stringify(d.opening_hours));
          setDays(JSON.parse(JSON.stringify(d.opening_hours)));
        }
      })
      .catch(() => {});
  }, []);

  const update = (fn: (d: DayData[]) => DayData[]) => {
    setDays(fn);
    setDirty(true);
  };

  const toggleDay = (i: number) => update(d => {
    const copy = JSON.parse(JSON.stringify(d));
    copy[i].enabled = !copy[i].enabled;
    if (copy[i].enabled && copy[i].services.length === 0)
      copy[i].services = [{ name: nextServiceName(serviceTypes, []), start: '12:00', end: '14:30', covers: DEFAULT_COVERS }];
    return copy;
  });

  const setField = (di: number, si: number, field: keyof Service, val: string | number) => update(d => {
    const copy = JSON.parse(JSON.stringify(d)) as DayData[];
    copy[di].services[si][field] = val as never;
    return copy;
  });

  const addService = (di: number) => update(d => {
    const copy = JSON.parse(JSON.stringify(d)) as DayData[];
    copy[di].services.push({
      name: nextServiceName(serviceTypes, copy[di].services),
      start: '12:00',
      end: '15:00',
      covers: DEFAULT_COVERS,
    });
    return copy;
  });

  const removeService = (di: number, si: number) => update(d => {
    const copy = JSON.parse(JSON.stringify(d)) as DayData[];
    copy[di].services.splice(si, 1);
    if (copy[di].services.length === 0) copy[di].enabled = false;
    return copy;
  });

  const addServiceType = () => {
    const label = window.prompt(
      t('addServiceTypePrompt') || 'Nom du type de service :',
      'Brunch'
    );
    if (!label?.trim()) return;
    const name = label.trim();
    if (!serviceTypes.includes(name)) {
      setServiceTypes(prev => [...prev, name]);
      setDirty(true);
    }
  };

  const save = async () => {
    setSaving(true); setError('');
    try {
      await settingsAPI.update({ opening_hours: days, services: serviceTypes });
      original.current = JSON.parse(JSON.stringify(days));
      setDirty(false);
    } catch { setError("Erreur lors de l'enregistrement."); }
    finally { setSaving(false); }
  };

  const cancel = () => { setDays(JSON.parse(JSON.stringify(original.current))); setDirty(false); setError(''); };

  const renderServiceName = (di: number, si: number, svc: Service) => (
    <select
      value={svc.name}
      className={nameSel}
      onChange={e => setField(di, si, 'name', e.target.value)}
    >
      {serviceTypes.map(typeName => (
        <option key={typeName} value={typeName}>{typeName}</option>
      ))}
      {!serviceTypes.includes(svc.name) && (
        <option value={svc.name}>{svc.name}</option>
      )}
    </select>
  );

  return (
    <div className="max-w-3xl">
      <div className="mb-1"><h2 className="text-base font-bold text-white">Horaires &amp; Services</h2></div>
      <p className="text-sm text-[#888] mb-5">Cochez les jours d'ouverture. Ajoutez autant de services que nécessaire par ligne.</p>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-bold tracking-[.15em] text-[#555]">TYPES DE SERVICE</span>
        {serviceTypes.map(typeName => (
          <span key={typeName} className="text-xs px-2 py-1 rounded-lg border border-[#2a2a2a] text-[#888]">{typeName}</span>
        ))}
        <button
          type="button"
          onClick={addServiceType}
          className="text-xs px-2 py-1 rounded-lg border border-[#b8f000]/40 text-[#b8f000] hover:bg-[#b8f000]/10"
        >
          + Type
        </button>
      </div>

      <div className="bg-[#111] border border-[#2a2a2a] rounded-xl overflow-hidden">
        {DAYS.map((dayName, di) => {
          const day = days[di];
          return (
            <div key={dayName} className="border-b border-[#1a1a1a] last:border-0">
              {!day.enabled ? (
                <div className="flex items-center gap-4 px-5 py-4">
                  <button onClick={() => toggleDay(di)}
                    className="w-5 h-5 border-2 border-[#333] rounded flex-shrink-0 hover:border-[#555] transition-colors"/>
                  <span className="text-sm text-[#555] w-28">{dayName}</span>
                  <span className="text-sm italic text-[#555]">Fermé</span>
                </div>
              ) : (
                <div className="flex items-start gap-4 px-5 py-4">
                  <button onClick={() => toggleDay(di)}
                    className="w-5 h-5 border-2 border-[#b8f000] rounded flex-shrink-0 mt-2.5 flex items-center justify-center"
                    style={{ background: 'rgba(184,240,0,.15)' }}>
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l3 3 5-6" stroke="#b8f000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <span className="text-sm text-white w-28 mt-2.5 flex-shrink-0">{dayName}</span>
                  <div className="flex flex-col gap-2 flex-1 min-w-0">
                    {day.services.map((svc, si) => (
                      <div key={si}>
                        <div className="hidden sm:flex sm:flex-row sm:items-center gap-2">
                          {renderServiceName(di, si, svc)}
                          <input type="time" value={svc.start} className={timeInp}
                            onChange={e => setField(di, si, 'start', e.target.value)}/>
                          <input type="time" value={svc.end} className={timeInp}
                            onChange={e => setField(di, si, 'end', e.target.value)}/>
                          <input type="number" value={svc.covers} min={1} className={covInp}
                            onChange={e => setField(di, si, 'covers', parseInt(e.target.value) || 0)}/>
                          <button onClick={() => removeService(di, si)}
                            className="w-7 h-7 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[#555] hover:text-red-400 hover:border-red-400/30 transition-colors text-sm flex-shrink-0">
                            ×
                          </button>
                          {si === day.services.length - 1 && (
                            <button onClick={() => addService(di)}
                              className="px-3 py-1.5 bg-[#b8f000] text-black text-xs font-bold rounded-lg hover:opacity-90 transition-opacity flex-shrink-0">
                              + Ajouter
                            </button>
                          )}
                        </div>
                        <div className="sm:hidden flex flex-col gap-2">
                          {renderServiceName(di, si, svc)}
                          <div className="grid grid-cols-2 gap-2">
                            <input type="time" value={svc.start}
                              className="h-9 px-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm text-white text-center focus:outline-none focus:border-[#444] transition-colors"
                              onChange={e => setField(di, si, 'start', e.target.value)}/>
                            <input type="time" value={svc.end}
                              className="h-9 px-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm text-white text-center focus:outline-none focus:border-[#444] transition-colors"
                              onChange={e => setField(di, si, 'end', e.target.value)}/>
                          </div>
                          <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                            <input type="number" value={svc.covers} min={1}
                              className="h-9 px-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm text-white text-center focus:outline-none focus:border-[#444] transition-colors"
                              onChange={e => setField(di, si, 'covers', parseInt(e.target.value) || 0)}/>
                            <button onClick={() => removeService(di, si)}
                              className="w-7 h-7 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[#555] hover:text-red-400 hover:border-red-400/30 transition-colors text-sm flex-shrink-0">
                              ×
                            </button>
                          </div>
                          {si === day.services.length - 1 && (
                            <button onClick={() => addService(di)}
                              className="w-full px-3 py-1.5 bg-[#b8f000] text-black text-xs font-bold rounded-lg hover:opacity-90 transition-opacity">
                              + Ajouter
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      {dirty && (
        <div className="flex flex-col sm:flex-row gap-3 mt-5 justify-end">
          <button onClick={cancel}
            className="h-11 px-6 bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-xl text-sm hover:border-[#444] transition-colors">
            {t('cancel')}
          </button>
          <button onClick={save} disabled={saving}
            className="h-11 px-6 bg-[#b8f000] text-black font-bold rounded-xl text-sm disabled:opacity-60 flex items-center justify-center gap-2">
            {saving && <span className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin"/>}
            {t('save')}
          </button>
        </div>
      )}
    </div>
  );
};

export default HoraireSettings;
