import { createContext, useContext, useState } from 'react';
import React from 'react';

interface SidebarContextType {
  activeSection: string;
  setActiveSection: (s: string) => void;
}

export const SidebarContext = createContext<SidebarContextType>({
  activeSection: 'general',
  setActiveSection: () => {},
});

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeSection, setActiveSection] = useState('general');
  return (
    <SidebarContext.Provider value={{ activeSection, setActiveSection }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => useContext(SidebarContext);
