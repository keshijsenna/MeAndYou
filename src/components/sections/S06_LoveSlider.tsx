import confetti from 'canvas-confetti';
import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion';
import React, { useEffect, useRef, useState } from 'react';
import { SLIDER_TEXTS } from '../../lib/constants';
import { sounds } from '../../lib/sounds';
import { useAppStore } from '../../lib/store';
import { GlassCard } from '../GlassCard';

export const S06_LoveSlider: React.FC = () => {
  const [value, setValue] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const { goToNext, setGameState } = useAppStore();
  
  const mv = useMotionValue(0);
  
  useEffect(() => {
    mv.set(value);
  }, [value, mv]);

  const color = useTransform(mv,
    [0, 30, 70, 100],
    ['#9A9AB0', '#EBC2C6', '#EBC2C6', '#E84060']
  );

  const getBubbleText = (val: number) => {
    const keys = Object.keys(SLIDER_TEXTS).map(Number).sort((a,b) => b-a);
    for (const key of keys) {
       if (val >= key) return SLIDER_TEXTS[key];
    }
    return SLIDER_TEXTS[0];
  };

  const currentText = getBubbleText(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setValue(val);
    if (val === 100 && !isDone) {
      setIsDone(true);
      setGameState({ sliderValue: 100 });
      sounds.successSound();
      
      confetti({ particleCount: 80, spread: 120, colors: ['#EBC2C6','#D6C2E8','#B7E3E0'] });
      setTimeout(() => confetti({ particleCount: 80, spread: 120, colors: ['#EBC2C6','#D6C2E8','#B7E3E0'] }), 200);
      setTimeout(() => confetti({ particleCount: 80, spread: 120, colors: ['#EBC2C6','#D6C2E8','#B7E3E0'] }), 400);
    }
  };

  return (
    <GlassCard width={500} padding="56px 48px" className="flex flex-col items-center select-none text-center">
      <h2 className="text-[24px] font-bold text-[var(--text-primary)] mb-6">Seberapa Besar Rasa Sayangmu?</h2>

      <div className="relative h-[120px] flex items-center justify-center mb-4">
        <motion.div
           style={{ color }}
           animate={{ scale: isDone ? [1, 1.15, 1] : 1 }}
           transition={{ duration: 0.2 }}
           className="text-[96px] font-extrabold flex items-baseline leading-none"
        >
           {value}
           <span className="text-[36px] font-normal ml-2">%</span>
        </motion.div>
      </div>

      <div className="h-[60px] flex items-center justify-center mb-8 relative w-full">
         <AnimatePresence mode="wait">
            <motion.div
              key={currentText}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute bg-[rgba(235,194,198,0.1)] border border-[rgba(235,194,198,0.2)] rounded-[20px] px-[24px] py-[16px] text-[16px] font-medium text-[var(--text-primary)] whitespace-nowrap"
            >
              {currentText}
            </motion.div>
         </AnimatePresence>
      </div>

      {/* Custom Slider Overlay */}
      <div className="relative w-full h-[50px] flex items-center mb-10">
         {/* Native input hidden behind transparent */}
         <input 
           type="range"
           min="0" max="100"
           value={value}
           onChange={handleChange}
           className="absolute z-20 w-full h-full opacity-0 cursor-pointer"
         />
         
         {/* Visual Track */}
         <div className="absolute w-full h-[10px] bg-[rgba(255,255,255,0.08)] rounded-[5px] overflow-hidden pointer-events-none">
            <motion.div 
               className="h-full bg-gradient-to-r from-[#EBC2C6] via-[#D6C2E8] to-[#B7E3E0]"
               style={{ width: `${value}%` }}
               transition={{ type: 'tween', duration: 0.1 }}
            />
         </div>
         
         {/* Visual Thumb */}
         <motion.div 
            className="absolute h-[28px] w-[28px] rounded-full bg-[radial-gradient(circle,#EBC2C6,#D6C2E8)] shadow-[0_0_0_4px_rgba(235,194,198,0.3),0_4px_12px_rgba(0,0,0,0.4)] pointer-events-none -ml-[14px]"
            style={{ left: `${value}%` }}
         />
      </div>

      <div className="w-[90%] flex justify-between px-[14px] text-[10px] text-[var(--text-secondary)] font-mono -mt-6 mb-8">
         {[0,10,20,30,40,50,60,70,80,90,100].map(n => (
            <span key={n} className={value >= n ? 'text-[#EBC2C6]' : ''}>|</span>
         ))}
      </div>

      <AnimatePresence>
         {isDone && (
            <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="w-full"
            >
              <button 
                onClick={() => goToNext()}
                className="w-full p-4 bg-[image:var(--gradient-btn)] rounded-[var(--radius-btn)] text-[#1A0A0C] font-semibold hover:scale-[1.02] transition-transform"
              >
                Lanjut
              </button>
            </motion.div>
         )}
      </AnimatePresence>
      
    </GlassCard>
  );
};
