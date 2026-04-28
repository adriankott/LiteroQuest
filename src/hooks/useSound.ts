import * as Speech from 'expo-speech';
import { createAudioPlayer, AudioPlayer, setAudioModeAsync } from 'expo-audio';
import { useCallback, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { RO_AUDIO } from '../constants/audioMap.ro';

const LANG_MAP: Record<string, string> = {
  ro: 'ro-RO',
  en: 'en-US',
};

export function useSound() {
  const { language } = useApp();
  const speechLang = LANG_MAP[language] ?? 'ro-RO';
  const playerRef = useRef<AudioPlayer | null>(null);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true });
  }, []);

  const stopSpeech = useCallback(() => {
    Speech.stop();
    if (playerRef.current) {
      playerRef.current.remove();
      playerRef.current = null;
    }
  }, []);

  const speak = useCallback(
    (text: string, lang?: string) => {
      stopSpeech();

      const effectiveLang = lang ?? speechLang;

      if (effectiveLang === 'ro-RO') {
        const asset = RO_AUDIO[text.toLowerCase()];
        if (asset !== undefined) {
          try {
            const player = createAudioPlayer(asset);
            playerRef.current = player;
            player.play();
            return;
          } catch {
            // fall through to expo-speech
          }
        }
      }

      Speech.speak(text, {
        language: effectiveLang,
        rate: 0.85,
        pitch: 1.1,
      });
    },
    [speechLang, stopSpeech],
  );

  return { speak, stopSpeech };
}
