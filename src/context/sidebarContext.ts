import { createContext } from 'react';

export interface SidebarContextType {
  activeSection: string;
  setActiveSection: (s: string) => void;
}

export const SidebarContext = createContext<SidebarContextType>({
  activeSection: 'general',
  setActiveSection: () => {},
});
