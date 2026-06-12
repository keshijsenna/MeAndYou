import confetti from 'canvas-confetti';
import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';
import React, { useState } from 'react';
import { TRIVIA_QUESTIONS } from '../../lib/constants';
import { sounds } from '../../lib/sounds';
import { useAppStore } from '../../lib/store';
import { GlassCard } from '../GlassCard';

export const S04_RomanticTrivia: React.FC = () => {
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  
  const { goToNext, setGameState } = useAppStore();

  const handleAnswer = (idx: number) => {
    if (selectedIdx !== null) return; // already answered
    setSelectedIdx(idx);
    const q = TRIVIA_QUESTIONS[currentQ];
    
    if (idx === q.correct) {
      sounds.successSound();
      setScore(s => s + 1);
    } else {
      sounds.errorSound();
    }
    
    setTimeout(() => {
      setShowExplanation(true);
    }, 400);
  };

  const handleNext = () => {
    sounds.clickSound();
    if (currentQ < TRIVIA_QUESTIONS.length - 1) {
       setCurrentQ(c => c + 1);
       setSelectedIdx(null);
       setShowExplanation(false);
    } else {
       // finish
       setGameState({ triviaScore: score });
       setIsFinished(true);
       sounds.confettiSound();
       confetti({ particleCount: 150, spread: 80, origin: { y: 0.4 } });
    }
  };

  if (isFinished) {
    return (
      <GlassCard width={540} padding="60px 40px" className="flex flex-col items-center justify-center text-center">
        <motion.div
           initial={{ scale: 0, rotate: -180 }}
           animate={{ scale: 1, rotate: 0 }}
           transition={{ type: "spring", stiffness: 200, damping: 20 }}
           className="mb-8 drop-shadow-[0_0_20px_rgba(232,213,163,0.5)]"
        >
          <svg width="80" height="80" viewBox="0 0 24 24" fill="#E8D5A3">
            <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0 0 11 15.9V19H7v2h10v-2h-4v-3.1a5.01 5.01 0 0 0 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM7 10.82C5.84 10.4 5 9.3 5 8V7h2v3.82zM19 8c0 1.3-.84 2.4-2 2.82V7h2v1z"/>
          </svg>
        </motion.div>
        
        <h1 className="text-[72px] font-extrabold text-[#EBC2C6] leading-none mb-4">{score}/{TRIVIA_QUESTIONS.length}</h1>
        <p className="text-[20px] font-medium text-[var(--text-primary)] mb-10">
          {score === TRIVIA_QUESTIONS.length ? "Luar Biasa! Kamu benar-benar kenal aku" : "Hampir sempurna! Tapi kamu tetap kesayanganku"}
        </p>
        
        <motion.button 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          onClick={() => goToNext()}
          className="px-10 py-[14px] bg-[image:var(--gradient-btn)] rounded-[60px] text-[#1A0A0C] font-semibold hover:scale-[1.04] transition-transform"
        >
          Lanjut
        </motion.button>
      </GlassCard>
    );
  }

  const q = TRIVIA_QUESTIONS[currentQ];

  return (
    <GlassCard width={540} padding="48px 40px" className="relative overflow-hidden">
      {/* Header */}
      <div className="w-full relative mb-10">
        <div className="flex justify-between items-end mb-2">
           <h2 className="text-[20px] font-semibold">Seberapa Kenal Kamu Aku?</h2>
           <span className="text-[12px] text-[var(--text-secondary)]">Pertanyaan {currentQ + 1}/{TRIVIA_QUESTIONS.length}</span>
        </div>
        <div className="w-full h-[6px] bg-[rgba(255,255,255,0.08)] rounded-[3px] overflow-hidden">
          <motion.div 
            layoutId="progress"
            className="h-full rounded-[3px] bg-gradient-to-r from-[#EBC2C6] to-[#D6C2E8]"
            initial={{ width: `${(currentQ / TRIVIA_QUESTIONS.length) * 100}%` }}
            animate={{ width: `${((currentQ + 1) / TRIVIA_QUESTIONS.length) * 100}%` }}
            transition={{ ease: "easeOut" }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
           key={currentQ}
           initial={{ x: 300, opacity: 0 }}
           animate={{ x: 0, opacity: 1 }}
           exit={{ x: -300, opacity: 0 }}
           transition={{ duration: 0.4, ease: [0.34, 1.2, 0.64, 1] }}
           className="w-full"
        >
          {/* Question Text */}
          <div className="relative bg-[rgba(25,25,40,0.3)] rounded-[20px] p-6 min-h-[80px] mb-8 border border-[rgba(235,194,198,0.1)]">
             <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-[rgba(235,194,198,0.2)] text-[#EBC2C6] flex items-center justify-center font-bold text-[12px] border border-[rgba(235,194,198,0.4)]">
               Q{currentQ + 1}
             </div>
             <p className="text-[18px] font-medium leading-[1.6] text-[var(--text-primary)]">
               {q.question}
             </p>
          </div>

          {/* Options */}
          <div className="flex flex-col gap-[10px]">
             {q.options.map((opt, idx) => {
               const isSelected = selectedIdx === idx;
               const isCorrect = idx === q.correct;
               const isAnswered = selectedIdx !== null;
               
               let btnClass = "w-full p-[16px_20px] rounded-[20px] text-left text-[14px] font-regular transition-all duration-300 flex items-center justify-between border-[1.5px] ";
               let animProps = {};

               if (!isAnswered) {
                 btnClass += "bg-[rgba(255,255,255,0.04)] border-[var(--border-glass)] hover:bg-[rgba(255,255,255,0.08)] cursor-pointer";
               } else {
                 if (isCorrect) {
                   btnClass += "bg-[rgba(183,227,224,0.2)] border-[#B7E3E0]";
                 } else if (isSelected) {
                   btnClass += "bg-[rgba(232,160,160,0.15)] border-[#E8A0A0]";
                   animProps = { animate: { x: [0, -6, 6, -4, 4, -2, 2, 0] }, transition: { duration: 0.3 } };
                 } else {
                   btnClass += "bg-[rgba(255,255,255,0.02)] border-transparent opacity-50 pointer-events-none";
                 }
               }

               return (
                 <motion.button
                   key={idx}
                   onClick={() => handleAnswer(idx)}
                   className={btnClass}
                   {...animProps}
                 >
                   <div className="flex items-center">
                     <span className="font-bold text-[#EBC2C6] mr-3">
                       {String.fromCharCode(65 + idx)}.
                     </span>
                     {opt}
                   </div>
                   {isAnswered && isCorrect && (
                     <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                       <Check size={18} className="text-[#B7E3E0]" />
                     </motion.div>
                   )}
                 </motion.button>
               )
             })}
          </div>

          {/* Explanation */}
          <div className="min-h-[120px] mt-6 relative">
            <AnimatePresence>
              {showExplanation && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[rgba(235,194,198,0.1)] border-l-[3px] border-[#EBC2C6] p-4 rounded-[12px] flex justify-between items-center"
                >
                  <p className="text-[13px] italic text-[var(--text-secondary)] pr-4">
                    "{q.explanation}"
                  </p>
                  <button 
                    onClick={handleNext}
                    className="flex-shrink-0 px-6 py-2 bg-[image:var(--gradient-btn)] rounded-[20px] text-[13px] font-semibold text-[#1A0A0C]"
                  >
                    {currentQ === TRIVIA_QUESTIONS.length - 1 ? "Lihat Skor" : "Selanjutnya"}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </motion.div>
      </AnimatePresence>
    </GlassCard>
  );
};
