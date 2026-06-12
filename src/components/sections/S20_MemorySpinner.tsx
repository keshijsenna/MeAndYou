import { motion } from 'framer-motion';
import React, { useState } from 'react';
import { sounds } from '../../lib/sounds';
import { useAppStore } from '../../lib/store';
import { GlassCard } from '../GlassCard';

const OPTIONS = ["Nonton Film", "Makan Cantik", "Jalan Santai", "Main Game Bareng", "Deep Talk", "Bikin Kue"];

export const S20_MemorySpinner: React.FC = () => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const { goToNext } = useAppStore();

  const handleSpin = () => {
    if (isSpinning) return;
    
    sounds.clickSound();
    setIsSpinning(true);
    setResult(null);

    const spins = 5;
    const sliceAngle = 360 / OPTIONS.length;
    const chosenIdx = Math.floor(Math.random() * OPTIONS.length);
    const localAngle = chosenIdx * sliceAngle + (sliceAngle / 2);
    const baseRot = Math.floor(rotation / 360) * 360;
    
    // Add extra 360 if we would rotate backwards
    const nextRot = baseRot + (spins * 360) + (360 - localAngle);
    const targetRotation = nextRot <= rotation ? nextRot + 360 : nextRot;
    
    setRotation(targetRotation);

    setTimeout(() => {
       setIsSpinning(false);
       sounds.successSound();
       setResult(OPTIONS[chosenIdx]);
    }, 4000); // Wait for transition 4s
  };

  return (
    <GlassCard width={450} padding="40px" className="flex flex-col items-center overflow-hidden relative text-center">
      <h2 className="text-[24px] font-bold text-[var(--text-primary)] mb-2">Pemutar Janji</h2>
      <p className="text-[13px] text-[var(--text-secondary)] mb-6">Putar roda untuk menentukan aktivitas kencan kita selanjutnya.</p>

      {/* Roda */}
      <div className="relative w-[240px] h-[240px] rounded-full my-6 flex justify-center items-center drop-shadow-[0_0_20px_rgba(235,194,198,0.2)]" style={{ isolation: 'isolate' }}>
         <motion.div 
            className="absolute w-full h-full"
            animate={{ rotate: rotation }}
            transition={{ duration: 4, ease: [0.2, 0.8, 0.2, 1] }} // smooth ease out
         >
            <svg width="240" height="240" viewBox="0 0 240 240" className="absolute inset-0">
               {OPTIONS.map((opt, i) => {
                  const slice = 360 / OPTIONS.length;
                  const rot = i * slice;
                  const color = ['#302438', '#422A3A', '#242B38', '#2A3A42', '#38242A', '#3A2A42'][i];
                  return (
                     <g key={i} transform={`rotate(${rot} 120 120)`}>
                       <path d="M120 120 L120 0 A120 120 0 0 1 223.923 60 Z" fill={color} stroke="rgba(255,255,255,0.1)" />
                       <g transform="rotate(30 120 120)">
                         <text x="120" y="60" transform="rotate(-90 120 60)" fill="rgba(255,255,255,0.7)" fontSize="11" fontWeight="bold" textAnchor="middle">{opt}</text>
                       </g>
                     </g>
                  );
               })}
            </svg>
         </motion.div>

         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[20px] border-t-[#EBC2C6] -mt-2 drop-shadow-md z-10" />
         
         <div className="w-[40px] h-[40px] bg-[#1A0A0C] border-2 border-[#EBC2C6] rounded-full z-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>

      <div className="h-[40px] mt-4 mb-4">
        {result && (
           <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-[#EBC2C6] font-bold text-lg px-6 py-2 bg-white/5 rounded-full border border-[#EBC2C6]/20">
              {result}
           </motion.div>
        )}
      </div>

      {!result ? (
         <button 
           onClick={handleSpin}
           disabled={isSpinning}
           className="px-8 py-3 bg-[image:var(--gradient-btn)] disabled:opacity-50 text-[#1A0A0C] font-bold rounded-full hover:scale-105 transition"
         >
           {isSpinning ? 'MENGUNDI...' : 'PUTAR RODA'}
         </button>
      ) : (
         <button onClick={() => goToNext()} className="px-8 py-3 border border-[#D6C2E8]/40 hover:bg-[#D6C2E8]/10 text-[#D6C2E8] font-bold rounded-full transition">
           Sepakat, Lanjut!
         </button>
      )}
    </GlassCard>
  );
};
