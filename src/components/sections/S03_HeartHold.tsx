import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { sounds } from '../../lib/sounds';
import { useAppStore } from '../../lib/store';
import { GlassCard } from '../GlassCard';

export const S03_HeartHold: React.FC = () => {
  const [isHolding, setIsHolding] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [feedbackState, setFeedbackState] = useState<'idle' | 'holding' | 'almost' | 'success'>('idle');
  const [elapsed, setElapsed] = useState(0);

  const { goToNext } = useAppStore();
  
  const startTimeRef = useRef<number | null>(null);
  const reqRef = useRef<number | null>(null);
  const progressPathRef = useRef<SVGPathElement>(null);

  const holdDuration = 3000;
  const loopDuration = 3000;
  
  // Create interpolated values via framer-motion for smooth coloring
  // Instead of tying to React state, we tie a motion value
  const progressMv = useMotionValue(0); // 0 to 1

  const animateLoop = useCallback((timestamp: number) => {
    if (!startTimeRef.current) startTimeRef.current = timestamp;
    const currentElapsed = timestamp - startTimeRef.current;
    
    let progress = Math.min(currentElapsed / holdDuration, 1);
    
    // update real elapsed for display (every ~50ms to save CPU, but inside RAF)
    setElapsed(currentElapsed);
    progressMv.set(progress);

    if (progressPathRef.current) {
        const dashOffset = 628.3 - (progress * 628.3);
        progressPathRef.current.style.strokeDashoffset = dashOffset.toString();
        
        // rudimentary color interpolation in JS for stroke
        // using template string to mimic motion value without extra component
        const r = Math.floor(235 - (progress * (235 - 232)));
        const g = Math.floor(194 - (progress * (194 - 64)));
        const b = Math.floor(198 - (progress * (198 - 96)));
        progressPathRef.current.style.stroke = `rgb(${r},${g},${b})`;
    }

    if (progress >= 1) {
      handleSuccess();
    } else {
      reqRef.current = requestAnimationFrame(animateLoop);
    }
  }, [progressMv]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault(); // prevent long press menu
    if (isCompleted) return;
    setIsHolding(true);
    setFeedbackState('holding');
    startTimeRef.current = null;
    reqRef.current = requestAnimationFrame(animateLoop);
    sounds.heartbeat();
  };

  const handlePointerUp = () => {
    if (isCompleted) return;
    if (reqRef.current) cancelAnimationFrame(reqRef.current);
    setIsHolding(false);
    
    if (elapsed < holdDuration && elapsed > 100) {
      setFeedbackState('almost');
      sounds.errorSound();
      
      // smooth reset
      const reset = () => {
         progressMv.set(0);
         setElapsed(0);
         if (progressPathRef.current) {
           progressPathRef.current.style.strokeDashoffset = '628.3';
           progressPathRef.current.style.stroke = '#EBC2C6';
         }
      }
      setTimeout(reset, 300);
    }
  };

  const handleSuccess = () => {
    setIsCompleted(true);
    setIsHolding(false);
    setFeedbackState('success');
    sounds.confettiSound();
    
    if (window.navigator?.vibrate) {
      window.navigator.vibrate([100,50,100]);
    }
    
    // spawn mini hearts
    explodeMiniHearts();
  };

  const explodeMiniHearts = () => {
    const parent = document.getElementById('heart-center');
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    for(let i=0; i<20; i++) {
       const el = document.createElement('div');
       el.innerHTML = '<svg viewBox="0 0 24 24" fill="#EBC2C6" width="100%" height="100%"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
       el.className = 'fixed pointer-events-none z-50';
       el.style.left = `${cx - 10}px`;
       el.style.top = `${cy - 10}px`;
       
       const size = 16 + Math.random() * 12;
       el.style.width = `${size}px`;
       el.style.height = `${size}px`;
       
       const tx = (Math.random() - 0.5) * 300;
       const ty = -Math.random() * 250 + 50;
       
       el.style.setProperty('--tx', `${tx}px`);
       el.style.setProperty('--ty', `${ty}px`);
       el.style.setProperty('--rot', `${(Math.random()-0.5)*180}deg`);
       el.style.animation = `flowerExplode 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`;
       
       document.body.appendChild(el);
       setTimeout(() => el.remove(), 1000);
    }
  };

  const getFeedbackMessage = () => {
    switch (feedbackState) {
      case 'idle': return '';
      case 'holding': return 'Tahan terus...';
      case 'almost': return 'Hampir! Coba lagi sayang';
      case 'success': return 'Mantap! Kamu sayang banget';
    }
  };

  // Convert elapsed to seconds
  const displaySeconds = Math.max(0, Math.min(elapsed / 1000, 3)).toFixed(1);

  return (
    <GlassCard width={420} padding="56px 40px" className="flex flex-col items-center select-none touch-none">
      <h2 className="text-[26px] font-bold text-[var(--text-primary)] mb-2">Seberapa Sayang Kamu?</h2>
      <p className="text-[14px] text-[var(--text-secondary)] mb-10">
        Tahan hati ini selama 3 detik penuh
      </p>

      <div className="relative w-[260px] h-[260px] flex items-center justify-center mb-8" id="heart-center">
        {/* SVG Progress Ring */}
        <svg className="absolute inset-0 w-full h-full pb-1" viewBox="0 0 260 260" 
             style={{ transform: "rotate(-90deg)" }}
        >
           <circle 
             cx="130" cy="130" r="100" 
             stroke="rgba(255,255,255,0.08)" 
             strokeWidth="10" fill="none" 
           />
           <path 
             ref={progressPathRef}
             d="M 130 30 A 100 100 0 1 1 129.99 30"
             stroke="#EBC2C6"
             strokeWidth="10"
             fill="none"
             strokeLinecap="round"
             strokeDasharray="628.3"
             strokeDashoffset="628.3"
           />
        </svg>

        {/* Big Heart */}
        <motion.div
           onPointerDown={handlePointerDown}
           onPointerUp={handlePointerUp}
           onPointerLeave={handlePointerUp}
           className="w-[100px] h-[90px] cursor-pointer flex items-center justify-center z-10"
           animate={
             isHolding ? { scale: [1, 1.12, 1] } : 
             (feedbackState === 'almost' ? { scale: [1, 0.75, 1.05, 1] } : {})
           }
           transition={{ duration: isHolding ? 0.5 : 0.3, repeat: isHolding ? Infinity : 0 }}
        >
           <svg viewBox="0 0 24 24" fill={isCompleted ? "#E84060" : "#EBC2C6"} width="100%" height="100%" 
                className="filter drop-shadow-[0_0_12px_rgba(235,194,198,0.8)]">
             <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
           </svg>
        </motion.div>
      </div>

      <div className="text-[18px] font-semibold text-[var(--accent-mint)] tabular-nums mb-4">
         {displaySeconds}s / 3.0s
      </div>

      <div className="h-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={feedbackState}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className={`font-medium ${feedbackState === 'almost' ? 'text-[#E8A0A0]' : 'text-[#EBC2C6]'}`}
          >
            {getFeedbackMessage()}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isCompleted && (
           <motion.div
             initial={{ scale: 0.7, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             transition={{ type: 'spring', stiffness: 300, delay: 0.5 }}
             className="w-full mt-6"
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
