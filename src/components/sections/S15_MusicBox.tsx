import { AnimatePresence, motion } from 'framer-motion';
import { Music } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { sounds } from '../../lib/sounds';
import { useAppStore } from '../../lib/store';
import { GlassCard } from '../GlassCard';

export const S15_MusicBox: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const { goToNext } = useAppStore();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            clearInterval(interval);
            setTimeout(() => goToNext(), 1000);
            return 100;
          }
          return p + 2; // complete in 50 ticks (5 seconds if 100ms interval)
        });
        if (Math.random() > 0.5) {
           sounds.pling(); // simulate music box notes
        }
      }, 200);
    }
    return () => clearInterval(interval);
  }, [isPlaying, goToNext]);

  const handleWindUp = () => {
     if (isPlaying) return;
     sounds.clickSound();
     setIsPlaying(true);
  };

  return (
    <GlassCard width={400} padding="50px 40px" className="flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 rounded-full bg-[rgba(255,255,255,0.05)] border border-[var(--border-glass)] flex items-center justify-center mb-6">
        <Music className="text-[#EBC2C6]" />
      </div>
      <h2 className="text-[22px] font-bold text-[var(--text-primary)] mb-2">Kotak Musik Hati</h2>
      <p className="text-[13px] text-[var(--text-secondary)] mb-8">Putar tuasnya untuk mengamankan memori kita melodi demi melodi.</p>

      <div className="relative w-[200px] h-[200px] flex items-center justify-center mb-8">
        <motion.div 
           animate={{ rotate: isPlaying ? 360 : 0 }}
           transition={{ duration: 4, ease: "linear", repeat: isPlaying ? Infinity : 0 }}
           className="w-[160px] h-[160px] rounded-full border-4 border-[#EBC2C6]/20 border-t-[#EBC2C6] relative shadow-[0_0_30px_rgba(235,194,198,0.2)]"
        />
        
        <div className="absolute inset-0 flex items-center justify-center">
           <button 
              onClick={handleWindUp}
              disabled={isPlaying}
              className={`w-[80px] h-[80px] rounded-full flex items-center justify-center transition-transform ${isPlaying ? 'bg-[#EBC2C6]/20 scale-110' : 'bg-[#EBC2C6] text-[#1A0A0C] hover:scale-105'}`}
           >
              {isPlaying ? <Music size={32} className="animate-pulse text-[#EBC2C6]" /> : <span className="font-bold">Play</span>}
           </button>
        </div>
      </div>

      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
         <motion.div 
            className="h-full bg-gradient-to-r from-[#EBC2C6] to-[#D6C2E8]"
            style={{ width: `${progress}%` }}
         />
      </div>
      <div className="mt-2 text-[10px] text-[#5A5A70] uppercase font-bold tracking-widest">
         Melody Progress : {progress}%
      </div>
    </GlassCard>
  );
};
