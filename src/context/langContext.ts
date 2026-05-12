import { createContext } from 'react';

export type Lang = 'fr' | 'en';

export interface LangContextValue {
    lang: Lang;
    setLang: (lang: Lang) => void;
    t: (key: string) => string;
}

export const LangContext = createContext<LangContextValue>({
    lang: 'fr',
    setLang: () => {},
    t: (k) => k,
});
