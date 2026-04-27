import * as Speech from 'expo-speech';
import { useCallback } from 'react';
import { useApp } from '../context/AppContext';

const LANG_MAP: Record<string, string> = {
  ro: 'ro-RO',
  en: 'en-US',
};

export function useSound() {
  const { language } = useApp();
  const speechLang = LANG_MAP[language] ?? 'ro-RO';

  const speak = useCallback(
    (text: string, lang?: string) => {
      Speech.stop();
      Speech.speak(text, {
        language: lang ?? speechLang,
        rate: 0.85,
        pitch: 1.1,
      });
    },
    [speechLang],
  );

  const stopSpeech = useCallback(() => {
    Speech.stop();
  }, []);

  return { speak, stopSpeech };
}
