import { useRef, useCallback, useState, useEffect } from 'react';

export const useSound = (soundPath: string) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // Create audio element on mount
  useEffect(() => {
    audioRef.current = new Audio(soundPath);
  }, [soundPath]);

  const playSound = useCallback(() => {
    if (isMuted || !audioRef.current) {
      return;
    }
    
    // Reset and play
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(err => {
      // Silently handle autoplay restrictions
      console.debug('Sound playback failed:', err);
    });
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  return { playSound, isMuted, toggleMute };
};
