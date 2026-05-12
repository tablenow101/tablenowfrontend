// @refresh reset
import { useState } from 'react';
import React from 'react';
import { SidebarContext } from './sidebarContext';

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeSection, setActiveSection] = useState('general');
  return (
    <SidebarContext.Provider value={{ activeSection, setActiveSection }}>
      {children}
    </SidebarContext.Provider>
  );
};
