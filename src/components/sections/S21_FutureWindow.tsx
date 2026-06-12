import { motion } from 'framer-motion';
import React, { useState } from 'react';
import { sounds } from '../../lib/sounds';
import { useAppStore } from '../../lib/store';
import { GlassCard } from '../GlassCard';
import { ImageWithFallback } from '../ImageWithFallback';

export const S21_FutureWindow: React.FC = () => {
  const [broken, setBroken] = useState<{ [key: number]: boolean }>({});
  const { goToNext } = useAppStore();
  const PANE_COUNT = 9;

  const handleBreak = (index: number) => {
    if (broken[index]) return;
    sounds.clickSound();
    setBroken(prev => {
       const next = { ...prev, [index]: true };
       if (Object.keys(next).length === PANE_COUNT) {
          sounds.successSound();
       }
       return next;
    });
  };

  const isComplete = Object.keys(broken).length === PANE_COUNT;

  return (
    <GlassCard width={450} padding="40px" className="flex flex-col items-center">
      <h2 className="text-[24px] font-bold text-[var(--text-primary)] mb-2">Jendela Masa Depan</h2>
      <p className="text-[13px] text-[var(--text-secondary)] mb-6 text-center">Ketuk kaca buram untuk melihat masa depan kita.</p>

      <div className="relative w-[300px] h-[300px] border border-white/20 rounded-xl overflow-hidden shadow-2xl bg-black">
         {/* Underlying future image */}
         <ImageWithFallback src="https://files.catbox.moe/23m8rg.jpg" className="absolute inset-0 w-full h-full object-cover" />
         
         <div className="absolute inset-0 bg-black/40" />
         <div className="absolute inset-0 flex flex-col justify-center items-center font-bold text-[#EBC2C6] text-xl drop-shadow-[0_0_10px_black] text-center px-4">
             "Mari mengukir cerita hingga rambut memutih"
         </div>

         {/* Frosted Panes overlay */}
         <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-1 p-1">
            {Array.from({ length: PANE_COUNT }).map((_, i) => (
               <motion.div 
                 key={i} 
                 initial={{ opacity: 1 }}
                 animate={{ opacity: broken[i] ? 0 : 1, scale: broken[i] ? 1.5 : 1 }}
                 transition={{ duration: 0.4 }}
                 onClick={() => handleBreak(i)}
                 className="bg-[rgba(200,200,220,0.8)] backdrop-blur-xl border border-white/20 rounded cursor-pointer"
               />
            ))}
         </div>
      </div>

      {isComplete && (
         <motion.button 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => goToNext()}
            className="mt-8 px-10 py-3 bg-[image:var(--gradient-btn)] text-[#1A0A0C] font-bold rounded-[60px] hover:scale-105 transition"
         >
            Ayo Berkarya Bersama
         </motion.button>
      )}
    </GlassCard>
  );
};
