import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useRef, useState } from 'react';
import { sounds } from '../../lib/sounds';
import { useAppStore } from '../../lib/store';
import { GlassCard } from '../GlassCard';

export const S07_CatchButton: React.FC = () => {
  const [counter, setCounter] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [pos, setPos] = useState({ top: 120, left: 200 });
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWin, setIsWin] = useState(false);
  const playAreaRef = useRef<HTMLDivElement>(null);
  
  const { goToNext, setGameState } = useAppStore();
  const lastMoveRef = useRef(0);

  const maxCounter = 10;
  // Size decreases as counter increases (max 10: 78 -> 72 -> 66)
  const btnSize = counter < 3 ? 78 : counter < 6 ? 72 : 66;

  useEffect(() => {
    if (isGameOver || isWin) return;
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(t);
          setIsGameOver(true);
          sounds.errorSound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [isWin, isGameOver]);

  const explodeParticles = (x: number, y: number) => {
    if (!playAreaRef.current) return;
    const parent = playAreaRef.current;
    
    for (let i = 0; i < 6; i++) {
       const el = document.createElement('div');
       el.className = 'absolute z-10 rounded-full w-2 h-2 bg-[#EBC2C6]';
       el.style.left = `${x}px`;
       el.style.top = `${y}px`;
       
       const tx = (Math.random() - 0.5) * 100;
       const ty = (Math.random() - 0.5) * 100;
       
       el.style.setProperty('--tx', `${tx}px`);
       el.style.setProperty('--ty', `${ty}px`);
       el.style.setProperty('--rot', `0deg`);
       el.style.animation = `flowerExplode 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`;
       
       parent.appendChild(el);
       setTimeout(() => el.remove(), 500);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isGameOver || isWin || !playAreaRef.current) return;
    
    const now = Date.now();
    if (now - lastMoveRef.current < 80) return;
    
    const area = playAreaRef.current.getBoundingClientRect();
    // distance to center of button
    const btnCx = pos.left + btnSize / 2;
    const btnCy = pos.top + btnSize / 2;
    
    // pointer relative to play area
    const pX = e.clientX - area.left;
    const pY = e.clientY - area.top;
    
    const dist = Math.hypot(pX - btnCx, pY - btnCy);
    
    if (dist < 110) {
      lastMoveRef.current = now;
      moveButton(area.width, area.height);
    }
  };

  const moveButton = (w: number, h: number) => {
    let nx = Math.random() * (w - btnSize - 16) + 8;
    let ny = Math.random() * (h - btnSize - 16) + 8;
    setPos({ left: nx, top: ny });
  };

  const handleBtnClick = () => {
    if (isGameOver || isWin) return;
    sounds.clickSound();
    
    const newCount = counter + 1;
    setCounter(newCount);
    
    explodeParticles(pos.left + btnSize/2, pos.top + btnSize/2);
    
    if (newCount >= maxCounter) {
      setIsWin(true);
      setGameState({ catchButtonCount: timeLeft });
      sounds.successSound();
    } else {
      if (playAreaRef.current) {
        const area = playAreaRef.current.getBoundingClientRect();
        moveButton(area.width, area.height);
      }
    }
  };

  const handleReset = () => {
    setCounter(0);
    setTimeLeft(45);
    setIsGameOver(false);
    setPos({ top: 120, left: 200 }); // reset center
  };

  return (
    <GlassCard width={580} padding="32px">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[20px] font-bold text-[var(--text-primary)]">Tangkap Aku Kalau Bisa</h2>
        <div className="flex items-center gap-6">
           <div className="text-[24px] font-bold text-[var(--accent-pink)]">
             {counter} / {maxCounter}
           </div>
           <div className="flex flex-col items-end">
             <div className="text-[20px] font-semibold text-[var(--accent-mint)]">{timeLeft}s</div>
             <div className="w-[60px] h-[4px] bg-[rgba(255,255,255,0.08)] rounded-full mt-1">
               <motion.div 
                 className="h-full bg-gradient-to-r from-[#B7E3E0] to-[#EBC2C6]"
                 animate={{ width: `${(timeLeft / 45) * 100}%` }}
                 transition={{ ease: 'linear' }}
               />
             </div>
           </div>
        </div>
      </div>

      <div 
        ref={playAreaRef}
        onPointerMove={handlePointerMove}
        className="w-full h-[320px] relative rounded-[28px] overflow-hidden border border-[rgba(235,194,198,0.1)] touch-none select-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(25,20,40,0.8) 0%, rgba(10,10,14,0.95) 100%)'
        }}
      >
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(235,194,198,0.15) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <motion.button
          onClick={handleBtnClick}
          whileTap={{ scale: 0.8 }}
          animate={{ 
            x: pos.left, 
            y: pos.top,
            backgroundColor: isWin ? '#B7E3E0' : undefined
          }}
          transition={{ duration: 0.18, ease: [0.34, 1.2, 0.64, 1] }}
          className="absolute flex items-center justify-center rounded-full text-[13px] font-semibold text-[rgba(30,10,20,0.8)] z-20 cursor-pointer"
          style={{ 
            width: btnSize, 
            height: btnSize,
            background: isWin ? '#B7E3E0' : 'radial-gradient(circle at 35% 35%, #EBC2C6, #C890C4)',
            boxShadow: '0 0 20px rgba(235,194,198,0.5), 0 0 40px rgba(235,194,198,0.2), inset 0 2px 4px rgba(255,255,255,0.3)',
            animation: isWin ? 'none' : 'pulse 1.2s ease-in-out infinite'
          }}
        >
          {isWin ? "Dapat!" : "Tap!"}
        </motion.button>
        
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes pulse {
            0%, 100% { box-shadow: 0 0 20px rgba(235,194,198,0.5), 0 0 40px rgba(235,194,198,0.2); }
            50% { box-shadow: 0 0 30px rgba(235,194,198,0.8), 0 0 60px rgba(235,194,198,0.35); }
          }
        `}} />

        <AnimatePresence>
          {isGameOver && !isWin && (
            <motion.div 
               initial={{ y: -50, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               className="absolute top-4 left-1/2 -translate-x-1/2 bg-[rgba(232,160,160,0.2)] border border-[#E8A0A0] text-[#E8A0A0] px-6 py-2 content-center rounded-[20px] backdrop-blur-md z-30"
            >
               Waktu habis! Coba lagi, jangan menyerah.
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
         {(isGameOver && !isWin) && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={handleReset}
              className="w-full mt-6 p-4 border border-[var(--border-glass)] rounded-[var(--radius-btn)] text-white font-medium bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.08)]"
            >
              Reset Game
            </motion.button>
         )}

         {isWin && (
           <motion.div
             initial={{ scale: 0.8, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="w-full mt-6"
           >
              <button 
                onClick={() => goToNext()}
                className="w-full p-4 bg-[image:var(--gradient-btn)] rounded-[var(--radius-btn)] text-[#1A0A0C] font-semibold hover:scale-[1.02] transition-transform"
              >
                Hebat! Lanjut
              </button>
           </motion.div>
         )}
      </AnimatePresence>
    </GlassCard>
  );
};
