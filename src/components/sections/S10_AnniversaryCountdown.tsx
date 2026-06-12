import confetti from 'canvas-confetti';
import { differenceInDays } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarHeart } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { sounds } from '../../lib/sounds';
import { useAppStore } from '../../lib/store';
import { GlassCard } from '../GlassCard';

const DATE_JADIAN = new Date('2026-03-24T00:00:00');
const DATE_1_BULAN = new Date('2026-04-24T00:00:00');
const DATE_1_TAHUN = new Date('2027-03-24T00:00:00');

const CountdownUnit = ({ value, label }: { value: number, label: string }) => (
  <div className="flex flex-col items-center mx-1 min-w-[48px]">
    <motion.div 
      key={value}
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="text-[32px] font-extrabold text-[var(--text-primary)]"
    >
      {value.toString().padStart(2, '0')}
    </motion.div>
    <div className="text-[10px] uppercase font-medium tracking-[2px] text-[var(--text-secondary)]">{label}</div>
  </div>
);

const Separator = () => (
  <div className="text-[28px] font-bold text-[var(--text-secondary)] opacity-40 mx-1 pb-4 animate-pulse">:</div>
);

const CountdownCard = ({ 
  targetDate, 
  title, 
  accentColor, 
  theme 
}: { 
  targetDate: Date, 
  title: string, 
  accentColor: string,
  theme: 'pink' | 'lavender'
}) => {
  const [timeLeft, setTimeLeft] = useState<{d:number, h:number, m:number, s:number} | null>(null);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      if (now >= targetDate) {
         setTimeLeft(null); // passed
         return;
      }
      const diff = targetDate.getTime() - now.getTime();
      setTimeLeft({
        d: Math.floor(diff / (1000 * 60 * 60 * 24)),
        h: Math.floor((diff / (1000 * 60 * 60)) % 24),
        m: Math.floor((diff / 1000 / 60) % 60),
        s: Math.floor((diff / 1000) % 60)
      });
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [targetDate]);

  return (
    <GlassCard width={320} padding="36px 28px" className="flex flex-col items-center">
       <div className="mb-4 drop-shadow-md" style={{ color: accentColor }}>
          <CalendarHeart size={40} />
       </div>
       <h3 className="text-[16px] font-semibold mb-6 text-[var(--text-primary)]">{title}</h3>

       <div className="h-[80px] flex items-center justify-center w-full">
         <AnimatePresence mode="wait">
            {!timeLeft ? (
               <motion.div 
                 initial={{ scale: 0.8, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 className="relative w-full h-full flex items-center justify-center overflow-hidden"
               >
                 <div className="absolute inset-0 flex justify-center items-center opacity-15 pointer-events-none">
                    <div className="w-full h-[20px] bg-current rotate-[-30deg] scale-150" style={{ color: accentColor }} />
                    <div className="w-full h-[20px] bg-current rotate-[30deg] scale-150 absolute" style={{ color: accentColor }} />
                 </div>
                 <span className="text-[20px] font-bold z-10 drop-shadow-lg" style={{ color: accentColor }}>
                   SELAMAT {title.toUpperCase()}!
                 </span>
               </motion.div>
            ) : (
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 className="flex items-center justify-center"
               >
                  <CountdownUnit value={timeLeft.d} label="Hari" />
                  <Separator />
                  <CountdownUnit value={timeLeft.h} label="Jam" />
                  <Separator />
                  <CountdownUnit value={timeLeft.m} label="Min" />
                  <Separator />
                  <CountdownUnit value={timeLeft.s} label="Det" />
               </motion.div>
            )}
         </AnimatePresence>
       </div>
    </GlassCard>
  );
};

export const S10_AnniversaryCountdown: React.FC = () => {
  const { goToNext, profileData } = useAppStore();
  const [daysTogether, setDaysTogether] = useState(0);

  useEffect(() => {
    // Initial mount confetti if 1 month passed
    if (new Date() >= DATE_1_BULAN) {
      setTimeout(() => confetti({ particleCount: 100, origin: { y: 0.3 } }), 500);
    }
  }, []);

  useEffect(() => {
    const d = differenceInDays(new Date(), DATE_JADIAN);
    setDaysTogether(Math.max(0, d));
    // update every hour is enough for day counter, but strict per day
    const t = setInterval(() => {
      setDaysTogether(Math.max(0, differenceInDays(new Date(), DATE_JADIAN)));
    }, 60000);
    return () => clearInterval(t);
  }, []);

  const handleCelebrate = () => {
    sounds.successSound();
    confetti({ particleCount: 100, spread: 70, origin: { x: 0.2, y: 0.5 } });
    setTimeout(() => confetti({ particleCount: 100, spread: 70, origin: { x: 0.8, y: 0.5 } }), 200);
    setTimeout(() => confetti({ particleCount: 100, spread: 100, origin: { x: 0.5, y: 0.7 } }), 400);

    setTimeout(() => goToNext(), 2000);
  };

  return (
    <div className="w-full max-w-4xl flex flex-col items-center gap-10">
      
      <div className="text-center">
         <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[48px] font-extrabold text-[#EBC2C6] drop-shadow-[0_0_15px_rgba(235,194,198,0.4)]"
         >
            {daysTogether}
         </motion.div>
         <div className="text-[14px] font-medium text-[var(--text-secondary)] uppercase tracking-[3px] mt-1">
            Hari Penuh Cinta & Cerita
         </div>
      </div>

      <div className="flex flex-wrap justify-center gap-6">
        <CountdownCard targetDate={DATE_1_BULAN} title="Satu Bulan" accentColor="#EBC2C6" theme="pink" />
        <CountdownCard targetDate={DATE_1_TAHUN} title="Satu Tahun" accentColor="#D6C2E8" theme="lavender" />
      </div>

      <motion.button 
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={handleCelebrate}
        className="w-full max-w-[300px] mt-4 p-[16px] bg-[image:var(--gradient-btn)] rounded-[60px] text-[#1A0A0C] font-bold shadow-[0_10px_20px_rgba(235,194,198,0.3)]"
      >
        Rayakan Sekarang!
      </motion.button>
    </div>
  );
};
