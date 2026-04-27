import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import i18n from '../i18n';
import { initDatabase } from '../database';
import { getProfiles, getSetting, upsertSetting } from '../database/queries';
import { Profile, SupportedLanguage } from '../types';

interface AppContextValue {
  isLoading: boolean;
  profiles: Profile[];
  currentProfile: Profile | null;
  language: SupportedLanguage;
  setCurrentProfile: (p: Profile) => void;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  refreshProfiles: () => Promise<void>;
}

const AppContext = createContext<AppContextValue>({} as AppContextValue);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [language, setLanguageState] = useState<SupportedLanguage>('ro');

  useEffect(() => {
    (async () => {
      try {
        await initDatabase();
        const [profs, savedLang] = await Promise.all([
          getProfiles(),
          getSetting('language'),
        ]);
        const lang = (savedLang as SupportedLanguage) ?? 'ro';
        setLanguageState(lang);
        await i18n.changeLanguage(lang);
        setProfiles(profs);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const setLanguage = useCallback(async (lang: SupportedLanguage) => {
    setLanguageState(lang);
    await Promise.all([
      i18n.changeLanguage(lang),
      upsertSetting('language', lang),
    ]);
  }, []);

  const refreshProfiles = useCallback(async () => {
    const profs = await getProfiles();
    setProfiles(profs);
  }, []);

  return (
    <AppContext.Provider
      value={{
        isLoading,
        profiles,
        currentProfile,
        language,
        setCurrentProfile,
        setLanguage,
        refreshProfiles,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  return useContext(AppContext);
}
