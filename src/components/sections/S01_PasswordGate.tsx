import confetti from 'canvas-confetti';
import { AnimatePresence, motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import React, { useState } from 'react';
import { sounds } from '../../lib/sounds';
import { useAppStore } from '../../lib/store';
import { GlassCard } from '../GlassCard';

export const S01_PasswordGate: React.FC = () => {
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);

  const { goToNext } = useAppStore();

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isAnimating || isSuccess) return;

    sounds.clickSound();
    
    // Check password: "24526" (24 March 2026) -> user request 24/5/26
    if (password.trim() === '24526') {
      setIsSuccess(true);
      sounds.confettiSound();
      confetti({
        particleCount: 120,
        spread: 100,
        colors: ['#EBC2C6', '#D6C2E8', '#B7E3E0', '#F5E6E8'],
        origin: { y: 0.6 }
      });
      setTimeout(() => {
        sounds.successSound();
        goToNext();
      }, 1500);
    } else {
      sounds.knockSound();
      setIsAnimating(true);
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      if (newAttempts >= 3) {
        setErrorMsg('Coba ingat tanggal spesial kita — 24 Maret 2026 (24526)');
      } else {
        setErrorMsg('Kode salah, coba lagi sayang');
      }
      setTimeout(() => setIsAnimating(false), 400);
    }
  };

  return (
    <GlassCard width={380} padding="48px 32px" className="flex flex-col items-center">
      <motion.div
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ repeat: Infinity, duration: 1.8 }}
        className="mb-6 drop-shadow-[0_0_12px_rgba(235,194,198,0.5)] text-[#EBC2C6]"
      >
        <svg width="56" height="56" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </motion.div>

      <p className="text-[11px] font-light text-[var(--text-muted)] tracking-[3px] uppercase mb-[6px]">
        untuk Nauraa Rayyani Ayu
      </p>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-[26px] font-bold text-[var(--text-primary)] text-center mb-2"
      >
        {isSuccess ? 'Selamat datang, sayang' : 'Akses Pintu Hati'}
      </motion.h1>

      {!isSuccess && (
        <p className="text-[13px] text-[var(--text-secondary)] mb-8">
          Masukkan kode spesial kita
        </p>
      )}

      {!isSuccess && (
        <form onSubmit={handleSubmit} className="w-full relative">
          <motion.div
            animate={isAnimating ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="· · · · ·"
              disabled={isAnimating}
              className="w-full p-[16px_24px] bg-[rgba(255,255,255,0.06)] border-[1.5px] border-[var(--border-glass)] rounded-[var(--radius-input)] text-[22px] text-center tracking-[8px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] placeholder:tracking-[4px] focus:border-[#EBC2C6] focus:shadow-[0_0_0_4px_rgba(235,194,198,0.15)] focus:outline-none transition-all duration-300"
            />
          </motion.div>

          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="text-[12px] text-[#E8A0A0] text-center mt-3 absolute w-full"
              >
                {errorMsg}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            whileHover={{ scale: 1.04, boxShadow: 'var(--shadow-glow-pink)' }}
            whileTap={{ scale: 0.96 }}
            className="w-full p-4 mt-8 bg-[image:var(--gradient-btn)] rounded-[var(--radius-btn)] text-[15px] font-semibold text-[#1A0A0C] flex items-center justify-center gap-2"
          >
            <Lock size={16} /> Buka Pintu
          </motion.button>
        </form>
      )}
    </GlassCard>
  );
};
