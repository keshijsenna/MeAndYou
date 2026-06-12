import confetti from 'canvas-confetti';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useRef, useState } from 'react';
import { sounds } from '../../lib/sounds';
import { useAppStore } from '../../lib/store';
import { GlassCard } from '../GlassCard';

interface LoveObject {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotSpeed: number;
  size: number;
  trail: {x: number, y: number}[];
}

export const S08_LoveMeteor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const reqRef = useRef<number | null>(null);
  
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWin, setIsWin] = useState(false);
  
  const lovesRef = useRef<LoveObject[]>([]);
  const lastSpawnRef = useRef(0);
  const livesRef = useRef(3);
  const scoreRef = useRef(0);
  const idCounter = useRef(0);
  
  const { goToNext, setGameState } = useAppStore();

  const initGame = () => {
    setScore(0);
    setLives(3);
    setIsGameOver(false);
    setIsWin(false);
    lovesRef.current = [];
    livesRef.current = 3;
    scoreRef.current = 0;
    lastSpawnRef.current = performance.now();
  };

  useEffect(() => {
    initGame();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = Math.min(600, window.innerWidth - 32 - 40); // account for padding
    let height = 420;
    canvas.width = width;
    canvas.height = height;

    const stars = Array.from({ length: 80 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 1 + Math.random(),
      blinkPhase: Math.random() * Math.PI * 2
    }));

    const render = (time: number) => {
      if (isGameOver || isWin) return;

      // Update resolution in case of resize
      if (containerRef.current) {
         const cr = containerRef.current.getBoundingClientRect();
         if (cr.width !== width) {
            width = cr.width;
            canvas.width = width;
         }
      }

      ctx.clearRect(0, 0, width, height);

      // Background Gradient
      const grad = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width);
      grad.addColorStop(0, '#1A1A2E');
      grad.addColorStop(1, '#0A0A0E');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Stars
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      stars.forEach(s => {
        const op = 0.2 + Math.sin(time * 0.002 + s.blinkPhase) * 0.2;
        ctx.globalAlpha = Math.max(0, op);
        ctx.fillRect(s.x, s.y, s.size, s.size);
      });
      ctx.globalAlpha = 1;

      // Spawn logic
      const level = Math.floor(scoreRef.current / 5);
      const spawnInterval = Math.max(500, 1200 - level * 100);
      
      if (time - lastSpawnRef.current > spawnInterval) {
         lastSpawnRef.current = time;
         lovesRef.current.push({
           id: idCounter.current++,
           x: 30 + Math.random() * (width - 60),
           y: -30,
           vx: (Math.random() - 0.5),
           vy: 2 + level * 0.5 + Math.random() * 1.5,
           rotation: 0,
           rotSpeed: (Math.random() - 0.5) * 0.1,
           size: 28,
           trail: []
         });
      }

      // Update & Draw
      for (let i = lovesRef.current.length - 1; i >= 0; i--) {
        const lv = lovesRef.current[i];
        
        lv.trail.unshift({x: lv.x, y: lv.y});
        if (lv.trail.length > 8) lv.trail.pop();
        
        lv.x += lv.vx;
        lv.y += lv.vy;
        lv.rotation += lv.rotSpeed;

        // check bounds
        if (lv.y > height + 30) {
           lovesRef.current.splice(i, 1);
           livesRef.current -= 1;
           setLives(livesRef.current);
           sounds.errorSound();
           if (livesRef.current <= 0) {
              setIsGameOver(true);
           }
           continue;
        }

        // Draw trail
        lv.trail.forEach((tr, idx) => {
          ctx.save();
          ctx.translate(tr.x, tr.y);
          ctx.globalAlpha = (8 - idx) / 8 * 0.3;
          ctx.fillStyle = '#FF8FAB';
          ctx.beginPath();
          ctx.arc(0, 0, lv.size/3, 0, Math.PI*2);
          ctx.fill();
          ctx.restore();
        });

        // Draw object
        ctx.save();
        ctx.translate(lv.x, lv.y);
        ctx.rotate(lv.rotation);
        
        ctx.shadowColor = '#EBC2C6';
        ctx.shadowBlur = 15;
        
        ctx.beginPath();
        const s = lv.size;
        ctx.moveTo(0, -s/3);
        ctx.bezierCurveTo(s/2, -s/2, s/2+4, s/6, 0, s/2);
        ctx.bezierCurveTo(-s/2-4, s/6, -s/2, -s/2, 0, -s/3);
        
        const hgrad = ctx.createRadialGradient(0,0,0, 0,0, s/2);
        hgrad.addColorStop(0, '#FF8FAB');
        hgrad.addColorStop(1, '#EBC2C6');
        ctx.fillStyle = hgrad;
        ctx.fill();
        
        ctx.restore();
      }

      if (!isGameOver && !isWin) {
         reqRef.current = requestAnimationFrame(render);
      }
    };

    reqRef.current = requestAnimationFrame(render);

    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [isGameOver, isWin]);

  const handleCanvasClick = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isGameOver || isWin) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check hit
    for (let i = lovesRef.current.length - 1; i >= 0; i--) {
       const lv = lovesRef.current[i];
       const dist = Math.hypot(lv.x - x, lv.y - y);
       if (dist < lv.size/2 + 15) { // 15px tolerance
          // hit!
          lovesRef.current.splice(i, 1);
          sounds.clickSound(); // or a special pop
          scoreRef.current += 1;
          setScore(scoreRef.current);
          
          if (scoreRef.current >= 15) {
             setIsWin(true);
             setGameState({ meteorScore: scoreRef.current });
             sounds.successSound();
             confetti({ particleCount: 150, zIndex: 100 });
          }
          break; // only hit one per click
       }
    }
  };

  return (
    <GlassCard width={640} padding="24px" className="flex flex-col items-center">
      <div className="w-full flex justify-between items-center px-4 mb-4">
        <div className="font-semibold text-[16px] text-[var(--accent-pink)]">
           Love Caught: {score} / 15
        </div>
        <div className="flex gap-1 justify-end">
           {[1,2,3].map(n => (
              <svg key={n} width="20" height="20" viewBox="0 0 24 24" fill={n <= lives ? "#E84060" : "rgba(255,255,255,0.1)"} className="drop-shadow-md">
                 <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
           ))}
        </div>
      </div>

      <div ref={containerRef} className="w-full relative rounded-[28px] overflow-hidden">
         <canvas 
            ref={canvasRef}
            onPointerDown={handleCanvasClick}
            className="w-full h-[420px] touch-none cursor-crosshair block"
         />

         <AnimatePresence>
            {isGameOver && (
               <motion.div 
                 initial={{ y: 50, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 exit={{ opacity: 0 }}
                 className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(10,10,14,0.95)] to-transparent h-full flex flex-col justify-center items-center pb-10"
               >
                  <h3 className="text-[#E8A0A0] text-[28px] font-bold mb-2">Game Over</h3>
                  <p className="text-[var(--text-secondary)] mb-6">Jangan menyerah sayang!</p>
                  <button 
                     onClick={initGame}
                     className="px-8 py-[12px] border border-[var(--border-glass)] rounded-[60px] hover:bg-[rgba(255,255,255,0.05)] transition-colors text-white"
                  >
                     Coba Lagi
                  </button>
               </motion.div>
            )}

            {isWin && (
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 className="absolute inset-0 bg-[rgba(10,10,14,0.8)] backdrop-blur-sm flex flex-col justify-center items-center"
               >
                  <h3 className="text-[#EBC2C6] text-[32px] font-extrabold mb-4">You Did It!</h3>
                  <button 
                     onClick={() => goToNext()}
                     className="px-10 py-[14px] bg-[image:var(--gradient-btn)] rounded-[60px] text-[#1A0A0C] font-semibold hover:scale-105 transition-transform"
                  >
                     Lanjut
                  </button>
               </motion.div>
            )}
         </AnimatePresence>
      </div>
    </GlassCard>
  );
};
