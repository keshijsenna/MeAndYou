import { AnimatePresence, motion } from 'framer-motion';
import React, { useState } from 'react';
import { sounds } from '../../lib/sounds';
import { useAppStore } from '../../lib/store';
import { GlassCard } from '../GlassCard';

export const S14_WishingTree: React.FC = () => {
  const [wish, setWish] = useState('');
  const [wishes, setWishes] = useState<{ id: number, text: string, x: number, y: number }[]>([]);
  const { goToNext } = useAppStore();

  const handleAddWish = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!wish.trim()) return;

    sounds.clickSound();
    const newWish = {
      id: Date.now(),
      text: wish,
      x: 10 + Math.random() * 80, // %
      y: 10 + Math.random() * 60, // %
    };
    
    setWishes(prev => [...prev, newWish]);
    setWish('');

    if (wishes.length >= 3) {
      setTimeout(() => goToNext(), 3000);
    }
  };

  return (
    <GlassCard width={600} padding="40px" className="flex flex-col items-center">
      <h2 className="text-[24px] font-bold text-[var(--text-primary)] mb-2">Pohon Harapan</h2>
      <p className="text-[13px] text-[var(--text-secondary)] mb-6 text-center">Gantungkan 4 harapanmu untuk kita di ranting pohon ini.</p>

      <div className="w-full h-[300px] relative bg-[rgba(255,255,255,0.02)] rounded-[20px] mb-8 overflow-hidden border border-[var(--border-glass)]">
         {/* Simple Tree Structure SVG */}
         <svg className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200px] h-[250px] opacity-20 pointer-events-none" viewBox="0 0 100 150">
            <path d="M45,150 L55,150 L52,70 L80,30 L50,60 L20,30 L48,70 Z" fill="currentColor" className="text-[#EBC2C6]" />
         </svg>

         <AnimatePresence>
            {wishes.map((w) => (
              <motion.div
                key={w.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute w-[80px] h-[80px] flex items-center justify-center p-2 rounded-full cursor-help group"
                style={{ left: `${w.x}%`, top: `${w.y}%`, transform: 'translate(-50%, -50%)' }}
              >
                <div className="w-4 h-4 rounded-full bg-[#EBC2C6] shadow-[0_0_10px_#EBC2C6]" />
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-black/80 backdrop-blur-md px-3 py-1 rounded text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap border border-white/10 pointer-events-none">
                  {w.text}
                </div>
              </motion.div>
            ))}
         </AnimatePresence>
      </div>

      <form onSubmit={handleAddWish} className="w-full flex gap-3">
         <input 
            type="text" 
            value={wish}
            onChange={e => setWish(e.target.value)}
            placeholder="Tulis harapanmu..."
            maxLength={60}
            className="flex-1 bg-white/5 border border-white/10 rounded-full px-5 py-3 text-sm focus:outline-none focus:border-[#EBC2C6]"
         />
         <button 
           type="submit"
           disabled={!wish.trim()}
           className="px-6 py-3 rounded-full bg-[image:var(--gradient-btn)] text-[#1A0A0C] font-bold text-sm disabled:opacity-50"
         >
           Gantung
         </button>
      </form>

      {wishes.length >= 4 && (
        <motion.button 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => goToNext()}
          className="mt-6 w-full py-3 border border-[#EBC2C6]/30 text-[#EBC2C6] rounded-full text-sm hover:bg-[#EBC2C6]/10"
        >
          Harapan Tersimpan, Lanjut!
        </motion.button>
      )}
    </GlassCard>
  );
};
