import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import React, { useState } from 'react';
import { MAGIC_ANSWERS } from '../../lib/constants';
import { sounds } from '../../lib/sounds';
import { useAppStore } from '../../lib/store';
import { GlassCard } from '../GlassCard';

export const S11_Magic8Ball: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [history, setHistory] = useState<{q: string, a: string}[]>([]);
  
  const { goToNext } = useAppStore();

  const handleAsk = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!question.trim() || isShaking) return;
    
    sounds.clickSound();
    setIsShaking(true);
    setAnswer('');
    
    // Pick answer
    const nextAns = MAGIC_ANSWERS[Math.floor(Math.random() * MAGIC_ANSWERS.length)];
    
    setTimeout(() => {
       setAnswer(nextAns);
       setIsShaking(false);
       setHistory(prev => [{q: question, a: nextAns}, ...prev].slice(0, 3));
       setQuestion('');
       sounds.pling();
    }, 1000);
  };

  return (
    <GlassCard width={460} padding="48px 40px" className="flex flex-col items-center select-none text-center relative">
      <h2 className="text-[24px] font-bold text-[var(--text-primary)] mb-1">Bola Rahasia Cinta</h2>
      <p className="text-[13px] text-[var(--text-secondary)] mb-10">Tanyakan apa saja tentang hubungan kalian</p>

      {/* 3D Ball */}
      <motion.div
        className="w-[220px] h-[220px] rounded-full cursor-pointer relative mb-10 shadow-[inset_-20px_-20px_40px_rgba(0,0,0,0.6),inset_12px_12px_30px_rgba(255,255,255,0.06),0_20px_60px_rgba(0,0,0,0.5),0_0_40px_rgba(100,80,160,0.2)]"
        style={{
           background: 'radial-gradient(circle at 30% 25%, #3A3A6A 0%, #1A1A3A 40%, #0A0A1E 100%)'
        }}
        animate={isShaking ? {
           rotateY: [0, 180, 360],
           rotateX: [0, 15, -15, 0],
           scale: [1, 0.95, 1]
        } : {}}
        transition={{ duration: 0.9, ease: "easeInOut" }}
        onClick={() => { if(question.trim()) handleAsk(); }}
      >
         {/* Specular Highlight */}
         <div 
           className="absolute top-[15%] left-[20%] w-[70px] h-[45px] rounded-[50%] pointer-events-none"
           style={{
             background: 'radial-gradient(ellipse, rgba(255,255,255,0.18) 0%, transparent 70%)',
             transform: 'rotate(-30deg)'
           }}
         />

         {/* Number 8 */}
         <div className="absolute inset-0 flex items-center justify-center font-extrabold text-[60px] text-[rgba(100,80,160,0.3)] pointer-events-none">
            8
         </div>

         {/* Window Triangle */}
         <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110px] h-[110px] flex items-center justify-center pointer-events-none pt-[15px]"
            style={{
              background: 'radial-gradient(circle, #1A1A3A 0%, #0D0D28 100%)',
              clipPath: 'polygon(50% 100%, 0% 0%, 100% 0%)'
            }}
         >
            <AnimatePresence>
               {answer && !isShaking && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                    className="text-[11px] font-semibold text-[#B7E3E0] text-center px-6 leading-tight"
                  >
                     {answer}
                  </motion.div>
               )}
            </AnimatePresence>
         </div>
      </motion.div>

      {/* Input Form */}
      <form onSubmit={handleAsk} className="w-full relative z-10 mb-6">
         <input 
           type="text"
           value={question}
           onChange={(e) => setQuestion(e.target.value)}
           placeholder="Apa yang ingin kamu tanyakan?"
           disabled={isShaking}
           className="w-full p-[14px_20px] bg-[rgba(255,255,255,0.06)] border-[1.5px] border-[var(--border-glass)] rounded-[60px] text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#D6C2E8] focus:shadow-[0_0_0_4px_rgba(214,194,232,0.15)] transition-all mb-4"
         />
         <button 
           type="submit"
           disabled={!question.trim() || isShaking}
           className="w-full p-3 bg-[image:var(--gradient-btn)] rounded-[60px] text-[#1A0A0C] font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
         >
            <Sparkles size={16} /> Tanyakan Bola
         </button>
      </form>

      {/* Logic to proceed */}
      {history.length >= 3 && !isShaking && (
         <motion.button 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           onClick={() => goToNext()}
           className="w-full p-3 border border-[rgba(235,194,198,0.4)] rounded-[60px] text-[#EBC2C6] text-[13px] font-medium hover:bg-[rgba(235,194,198,0.1)] transition-colors mb-4"
         >
            Sudah cukup tanya, Lanjut!
         </motion.button>
      )}

      {/* History */}
      <div className="w-full max-h-[120px] overflow-y-auto pr-2 space-y-3 text-left scrollbar-thin">
         {history.map((h, i) => (
            <div key={i} className="bg-[rgba(255,255,255,0.04)] rounded-lg p-3">
               <p className="text-[12px] text-[var(--text-secondary)] mb-1 font-medium truncate">Q: {h.q}</p>
               <p className="text-[12px] text-[#D6C2E8]">A: {h.a}</p>
            </div>
         ))}
      </div>

    </GlassCard>
  );
};
