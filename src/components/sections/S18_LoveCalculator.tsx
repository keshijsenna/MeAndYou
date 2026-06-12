import { motion } from 'framer-motion';
import React, { useState } from 'react';
import { sounds } from '../../lib/sounds';
import { useAppStore } from '../../lib/store';
import { GlassCard } from '../GlassCard';

export const S18_LoveCalculator: React.FC = () => {
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const { goToNext } = useAppStore();

  const handleCalculate = () => {
    sounds.clickSound();
    setCalculating(true);
    setResult(null);

    let progress = 0;
    const interval = setInterval(() => {
       progress += Math.random() * 20;
       if (progress >= 100) {
          clearInterval(interval);
          setCalculating(false);
          sounds.successSound();
          setResult(9999);
          setTimeout(() => goToNext(), 3000);
       }
    }, 150);
  };

  return (
    <GlassCard width={400} padding="40px" className="flex flex-col items-center">
      <h2 className="text-[24px] font-bold text-[var(--text-primary)] mb-2">Kalkulator Cinta</h2>
      <p className="text-[13px] text-[var(--text-secondary)] mb-8 text-center">Berapa besar persentase kecocokan kita?</p>

      <div className="w-full flex gap-4 items-center mb-8">
         <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <div className="text-[10px] text-[#5A5A70] mb-1">NAMA PEREMPUAN</div>
            <div className="font-bold text-[#EBC2C6]">NAURA</div>
         </div>
         <span className="text-xl font-bold opacity-50">+</span>
         <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <div className="text-[10px] text-[#5A5A70] mb-1">NAMA LAKI-LAKI</div>
            <div className="font-bold text-[#D6C2E8]">FARSYA</div>
         </div>
      </div>

      {!calculating && result === null && (
        <button 
           onClick={handleCalculate}
           className="w-full py-4 bg-[image:var(--gradient-btn)] rounded-[40px] text-[#1A0A0C] font-bold hover:scale-105 transition-transform"
        >
           Hitung Kecocokan
        </button>
      )}

      {calculating && (
        <div className="w-full py-4 text-center text-[#EBC2C6] font-mono tracking-widest text-xl animate-pulse">
           CALCULATING...
        </div>
      )}

      {result !== null && (
         <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-full text-center flex flex-col items-center"
         >
            <div className="text-[60px] font-black text-transparent bg-clip-text bg-gradient-to-r from-[#EBC2C6] to-[#D6C2E8] leading-none mb-2">
               {result}%
            </div>
            <div className="text-[12px] text-[#B7E3E0] uppercase tracking-[3px] font-bold">ERROR: Melampaui Batas Logika</div>
         </motion.div>
      )}
    </GlassCard>
  );
};
