import { Howl, Howler } from 'howler';
import { useAppStore } from './store';

// Helper to use Web Audio API directly for some synthesized sounds
const playTone = (frequency: number, durationMs: number = 80, type: OscillatorType = 'sine', volume: number = 0.25) => {
  // Haptic feedback
  try {
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(Math.min(durationMs, 50));
    }
  } catch (e) {
    // Ignore if not supported / allowed 
  }

  if (useAppStore.getState().audioState.muted) return;
  try {
    const audioCtx = Howler.ctx;
    if (!audioCtx) return;
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);

    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + durationMs / 1000);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + durationMs / 1000);
  } catch (e) {
    console.error("Audio Context not available", e);
  }
};

export const sounds = {
  clickSound: () => playTone(800, 80, 'sine', 0.2), // pop halus
  successSound: () => {
    // chord C-E-G arpegio
    setTimeout(() => playTone(523.25, 600, 'sine', 0.2), 0);
    setTimeout(() => playTone(659.25, 600, 'sine', 0.2), 100);
    setTimeout(() => playTone(783.99, 600, 'sine', 0.2), 200);
  },
  errorSound: () => {
    // freq turun 400->200Hz
    if (useAppStore.getState().audioState.muted) return;
    try {
      const audioCtx = Howler.ctx;
      if (!audioCtx) return;
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.2);
    } catch(e) {}
  },
  confettiSound: () => playTone(1200, 50, 'triangle', 0.1),
  pling: () => {
     // freq 1047Hz (C6), durasi 120ms
     playTone(1047, 120, 'sine', 0.15);
  },
  heartbeat: () => {
    // dua "thump"
    setTimeout(() => playTone(100, 150, 'sine', 0.3), 0);
    setTimeout(() => playTone(100, 150, 'sine', 0.3), 200);
  },
  knockSound: () => {
    // 3 rhythmic knocks
    setTimeout(() => playTone(150, 40, 'square', 0.2), 0);
    setTimeout(() => playTone(100, 50, 'square', 0.2), 150);
    setTimeout(() => playTone(120, 60, 'square', 0.2), 300);
  },
  shutterClick: () => {
    // Shutter click camera
    setTimeout(() => playTone(650, 30, 'square', 0.12), 0);
    setTimeout(() => playTone(1450, 35, 'triangle', 0.08), 30);
  },
  sparkleChime: () => {
    // Fantasy arpeggio
    setTimeout(() => playTone(880, 80, 'sine', 0.1), 0);
    setTimeout(() => playTone(1100, 80, 'sine', 0.1), 60);
    setTimeout(() => playTone(1320, 80, 'sine', 0.1), 120);
    setTimeout(() => playTone(1760, 120, 'sine', 0.08), 180);
  },
  waterDroplet: () => {
    // Bubble pop / water drop
    if (useAppStore.getState().audioState.muted) return;
    try {
      const audioCtx = Howler.ctx;
      if (!audioCtx) return;
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(450, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1300, audioCtx.currentTime + 0.12);
      gainNode.gain.setValueAtTime(0.18, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.12);
    } catch(e) {}
  },
  scribblePaper: () => {
    // Scribbling sound
    setTimeout(() => playTone(240, 45, 'sawtooth', 0.06), 0);
    setTimeout(() => playTone(210, 35, 'sawtooth', 0.06), 55);
    setTimeout(() => playTone(290, 50, 'sawtooth', 0.05), 105);
  },
  softPluck: () => {
    // Acoustic chord pluck
    setTimeout(() => playTone(329.63, 140, 'triangle', 0.2), 0);
    setTimeout(() => playTone(440.00, 180, 'sine', 0.15), 45);
  },
  gameCoin: () => {
    // Classic retro chime
    setTimeout(() => playTone(987.77, 70, 'square', 0.1), 0);
    setTimeout(() => playTone(1318.51, 140, 'square', 0.1), 75);
  }
};

export const updateGlobalMute = (muted: boolean) => {
  Howler.mute(muted);
};
