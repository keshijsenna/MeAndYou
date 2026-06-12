import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { sounds } from '../../lib/sounds';
import { useAppStore } from '../../lib/store';
import { GlassCard } from '../GlassCard';

export const S16_LoveScale: React.FC = () => {
  const [nauraLove, setNauraLove] = useState(50);
  const [farsyaLove, setFarsyaLove] = useState(50);
  const { goToNext } = useAppStore();

  const isBalancedAndFull = nauraLove === 100 && farsyaLove === 100;

  useEffect(() => {
    if (isBalancedAndFull) {
       sounds.successSound();
       setTimeout(() => goToNext(), 2000);
    }
  }, [isBalancedAndFull, goToNext]);

  const handleInteract = (setter: React.Dispatch<React.SetStateAction<number>>, current: number) => {
    if (current < 100) {
      sounds.clickSound();
      setter(prev => Math.min(100, prev + 10));
    }
  };

  const rotation = (farsyaLove - nauraLove) * 0.5; // -50 to 50 degrees

  return (
    <GlassCard width={500} padding="50px 40px" className="flex flex-col items-center">
      <h2 className="text-[24px] font-bold text-[var(--text-primary)] mb-2">Penimbang Cinta</h2>
      <p className="text-[13px] text-[var(--text-secondary)] mb-12 text-center">Tekan tombol untuk menyeimbangkan dan memaksimalkan kadar cinta kita berdua.</p>

      {/* Timbangan App */}
      <div className="w-full relative h-[250px] flex items-center justify-center">
         
         {/* Stand */}
         <div className="w-4 h-[180px] bg-white/20 absolute bottom-0 rounded-t-full" />
         <div className="w-[120px] h-4 bg-white/20 absolute bottom-0 rounded-full" />
         
         {/* Beam */}
         <motion.div 
           className="absolute top-[70px] w-[350px] h-3 bg-[#EBC2C6] rounded-full origin-center flex justify-between items-center px-4"
           animate={{ rotate: rotation }}
           transition={{ type: "spring", stiffness: 100, damping: 10 }}
         >
           {/* Let's drop strings from the ends of the beam */}
           <div className="w-1 h-[80px] bg-white/20 absolute -left-2 top-0 origin-top flex items-end justify-center">
              <div className="w-[80px] h-[30px] border-b-4 border-l-4 border-r-4 border-white/40 rounded-b-xl flex items-end justify-center pb-2 translate-y-full">
                 <div className="text-[12px] font-bold bg-[#EBC2C6]/20 px-2 rounded-full whitespace-nowrap mb-[-25px]">Nauraa: {nauraLove}%</div>
              </div>
           </div>

           <div className="w-1 h-[80px] bg-white/20 absolute -right-2 top-0 origin-top flex items-end justify-center">
              <div className="w-[80px] h-[30px] border-b-4 border-l-4 border-r-4 border-white/40 rounded-b-xl flex items-end justify-center pb-2 translate-y-full">
                 <div className="text-[12px] font-bold bg-[#D6C2E8]/20 px-2 rounded-full whitespace-nowrap mb-[-25px]">Farsya: {farsyaLove}%</div>
              </div>
           </div>
         </motion.div>
         {/* Pivot Pin */}
         <div className="w-6 h-6 rounded-full bg-[#1A0A0C] border-4 border-[#EBC2C6] absolute top-[64px] z-10" />

      </div>

      <div className="flex w-full justify-between px-10 mt-12">
        <button 
           onClick={() => handleInteract(setNauraLove, nauraLove)}
           disabled={isBalancedAndFull}
           className="w-[120px] py-4 bg-white/5 border border-[#EBC2C6]/40 rounded-xl hover:bg-white/10 active:scale-95 transition-all text-[14px] font-bold text-[#EBC2C6]"
        >
           Tambah Nauraa
        </button>
        <button 
           onClick={() => handleInteract(setFarsyaLove, farsyaLove)}
           disabled={isBalancedAndFull}
           className="w-[120px] py-4 bg-white/5 border border-[#D6C2E8]/40 rounded-xl hover:bg-white/10 active:scale-95 transition-all text-[14px] font-bold text-[#D6C2E8]"
        >
           Tambah Farsya
        </button>
      </div>
      
      {isBalancedAndFull && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="text-[#EBC2C6] mt-6 font-bold tracking-widest text-[14px]">
          SEIMBANG & SEMPURNA!
        </motion.div>
      )}
    </GlassCard>
  );
};
