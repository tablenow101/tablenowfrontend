import { useContext } from 'react';
import { LangContext } from '../context/langContext';

export const useLang = () => useContext(LangContext);
