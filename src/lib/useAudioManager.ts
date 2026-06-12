import { useEffect, useRef } from 'react';
import { useAppStore } from './store';

const BGM_URL = 'https://files.catbox.moe/tiowli.mp3';

export const useAudioManager = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioState = useAppStore(state => state.audioState);
  
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(BGM_URL);
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3;
    }
    
    const audio = audioRef.current;
    
    if (!audioState.muted) {
      audio.play().catch(() => {
        // Handle auto-play policy prevention silently
      });
    } else {
      audio.pause();
    }
    
    return () => {
      // Keep audio alive across sections since this hook is used in AppShell
    };
  }, [audioState.muted]);
  
  return null;
};
