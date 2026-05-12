import { useContext } from 'react';
import { SidebarContext } from '../context/sidebarContext';

export const useSidebar = () => useContext(SidebarContext);
