import confetti from 'canvas-confetti';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useState } from 'react';
import { sounds } from '../../lib/sounds';
import { useAppStore } from '../../lib/store';
import { GlassCard } from '../GlassCard';
import { ImageWithFallback } from '../ImageWithFallback';

export const S12_GuessNumber: React.FC = () => {
  const [guess, setGuess] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const [isWin, setIsWin] = useState(false);
  const [winnerName, setWinnerName] = useState<'Nauraa'|'Farsya'|null>(null);
  
  const { goToNext } = useAppStore();

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!guess.trim() || isWin) return;
    
    const num = parseInt(guess);
    if (isNaN(num)) return;

    sounds.clickSound();

    if (num === 16) {
       handleSuccess('Nauraa');
    } else if (num === 17) {
       handleSuccess('Farsya');
    } else {
       setAttempts(a => a + 1);
       setIsShaking(true);
       sounds.errorSound();
       setTimeout(() => setIsShaking(false), 400);
       setGuess('');
    }
  };

  const handleSuccess = (name: 'Nauraa' | 'Farsya') => {
     setIsWin(true);
     setWinnerName(name);
     sounds.successSound();
     confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
     setTimeout(() => goToNext(), 3000);
  };

  const getHint = () => {
     if (attempts === 0) return null;
     if (attempts === 1) return { num: 1, text: "Ini adalah tanggal lahir salah satu dari kami", color: "#EBC2C6" };
     if (attempts === 2) return { num: 2, text: "Salah satunya lahir di bulan Januari", color: "#B7E3E0" };
     if (attempts >= 3 && attempts < 5) return { num: 3, text: "Yang lainnya lahir di bulan Maret", color: "#D6C2E8" };
     if (attempts >= 5) return { num: 4, text: "Satu angka antara 15-18, yang lain juga sekitar itu", color: "#E8D5A3" };
     return null;
  };

  const hint = getHint();

  return (
    <GlassCard width={440} padding="56px 40px" className="flex flex-col items-center text-center">
       <AnimatePresence mode="wait">
         {!isWin ? (
           <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
              <h2 className="text-[24px] font-bold text-[var(--text-primary)] mb-2">Tebak Angka Favorit Kami</h2>
              <p className="text-[13px] text-[var(--text-secondary)] mb-10">Ada dua angka yang bisa jadi jawabannya</p>

              <form onSubmit={handleSubmit} className="w-full flex justify-center mb-6">
                 <motion.input
                    animate={isShaking ? { x: [0,-10,10,-8,8,-4,4,0] } : {}}
                    transition={{ duration: 0.4 }}
                    type="text"
                    pattern="[0-9]*"
                    maxLength={2}
                    value={guess}
                    onChange={(e) => setGuess(e.target.value.replace(/[^0-9]/g, ''))}
                    className={`w-[140px] p-[16px] text-center text-[36px] font-bold rounded-[20px] bg-[rgba(255,255,255,0.06)] border-[2px] transition-colors focus:outline-none ${isShaking ? 'border-[#E8A0A0] text-[#E8A0A0]' : 'border-[var(--border-glass)] text-[var(--text-primary)] focus:border-[#EBC2C6]'}`}
                 />
              </form>

              <button 
                onClick={handleSubmit} 
                disabled={!guess.trim()}
                className="px-10 py-3 bg-[image:var(--gradient-btn)] rounded-[60px] text-[#1A0A0C] font-semibold hover:scale-105 transition-transform disabled:opacity-50"
              >
                 Tebak
              </button>

              <div className="mt-4 text-[12px] text-[var(--text-secondary)]">
                 Percobaan ke-{attempts}
              </div>

              <div className="min-h-[80px] mt-6 w-full">
                 <AnimatePresence mode="wait">
                    {hint && (
                       <motion.div
                         key={hint.num}
                         initial={{ opacity: 0, y: -10 }}
                         animate={{ opacity: 1, y: 0 }}
                         className="p-[14px_18px] rounded-[12px] bg-[rgba(255,255,255,0.04)] border-l-[3px] text-left"
                         style={{ borderColor: hint.color }}
                       >
                          <div 
                             className="inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wider mb-2"
                             style={{ backgroundColor: `${hint.color}33`, color: hint.color }}
                          >
                             PETUNJUK {hint.num}
                          </div>
                          <p className="text-[13px] text-[var(--text-primary)] leading-tight">{hint.text}</p>
                       </motion.div>
                    )}
                 </AnimatePresence>
              </div>
           </motion.div>
         ) : (
           <motion.div key="win" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full flex flex-col items-center">
              <h2 className="text-[28px] font-bold text-[#EBC2C6] mb-4 leading-tight">
                 Benar! Itu tanggal lahir {winnerName} — {winnerName === 'Nauraa' ? '16 Maret' : '17 Januari'}
              </h2>
              
              <motion.div
                 initial={{ scale: 0 }}
                 animate={{ scale: 1 }}
                 transition={{ delay: 0.3, type: "spring" }}
                 className="w-[160px] h-[160px] rounded-full overflow-hidden border-4 border-[#EBC2C6] my-6 shadow-[0_10px_30px_rgba(235,194,198,0.4)] relative"
              >
                 <ImageWithFallback 
                    src={winnerName === 'Nauraa' ? 'https://files.catbox.moe/jw0yc8.jpg' : 'https://files.catbox.moe/tz9k37.jpg'} 
                    alt={winnerName!} 
                    className="w-full h-full object-cover" 
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.5)] to-transparent" />
                 <span className="absolute bottom-4 left-0 w-full text-center font-bold text-white tracking-widest">{winnerName?.toUpperCase()}</span>
              </motion.div>
           </motion.div>
         )}
       </AnimatePresence>
    </GlassCard>
  );
};
