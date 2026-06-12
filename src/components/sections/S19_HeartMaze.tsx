import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { sounds } from '../../lib/sounds';
import { useAppStore } from '../../lib/store';
import { GlassCard } from '../GlassCard';

const MAZE_GRID = [
  [1,1,1,1,1,1,1,1],
  [1,0,0,0,1,0,0,1],
  [1,0,1,0,1,0,1,1],
  [1,0,1,0,0,0,0,1],
  [1,0,1,1,1,1,0,1],
  [1,0,0,0,0,1,0,1],
  [1,1,1,1,0,0,2,1],
  [1,1,1,1,1,1,1,1],
];

export const S19_HeartMaze: React.FC = () => {
  const [pos, setPos] = useState({ x: 1, y: 1 });
  const { goToNext } = useAppStore();

  const handleArrow = (dx: number, dy: number) => {
    const ny = pos.y + dy;
    const nx = pos.x + dx;
    if (ny >= 0 && ny < MAZE_GRID.length && nx >= 0 && nx < MAZE_GRID[0].length) {
       if (MAZE_GRID[ny][nx] !== 1) {
          sounds.clickSound();
          setPos({ x: nx, y: ny });
       } else {
          sounds.knockSound(); // Hit wall
       }
    }
  };

  useEffect(() => {
    if (MAZE_GRID[pos.y][pos.x] === 2) {
       sounds.successSound();
       setTimeout(() => goToNext(), 1500);
    }
  }, [pos, goToNext]);

  return (
    <GlassCard width={400} padding="40px" className="flex flex-col items-center">
      <h2 className="text-[24px] font-bold text-[var(--text-primary)] mb-2">Labirin Hati</h2>
      <p className="text-[13px] text-[var(--text-secondary)] mb-6 text-center">Bawa titikmu menuju hati menggunakan tombol arah.</p>

      <div className="bg-[#111118] p-2 rounded-xl border border-[var(--border-glass)] relative">
         <div 
           className="grid gap-[2px]" 
           style={{ gridTemplateColumns: `repeat(${MAZE_GRID[0].length}, 30px)` }}
         >
            {MAZE_GRID.map((row, y) => (
               row.map((cell, x) => (
                  <div key={`${y}-${x}`} className={`w-[30px] h-[30px] rounded-[4px] ${cell === 1 ? 'bg-white/10' : 'bg-transparent'} flex items-center justify-center relative`}>
                     {cell === 2 && <Heart size={16} fill="#EBC2C6" className="text-[#EBC2C6]" />}
                  </div>
               ))
            ))}
         </div>
         {/* Player */}
         <motion.div 
            className="absolute rounded-full bg-[#D6C2E8] shadow-[0_0_10px_#D6C2E8] z-10 w-[20px] h-[20px]"
            animate={{ left: pos.x * 32 + 8, top: pos.y * 32 + 8 }} // 30px cell + 2px gap = 32px step. Padding 8 offsets to center of 32
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
         />
      </div>

      <div className="grid grid-cols-3 gap-2 mt-8">
         <div />
         <button onClick={() => handleArrow(0, -1)} className="p-4 bg-white/5 rounded-xl hover:bg-white/10 flex justify-center active:scale-95">↑</button>
         <div />
         <button onClick={() => handleArrow(-1, 0)} className="p-4 bg-white/5 rounded-xl hover:bg-white/10 flex justify-center active:scale-95">←</button>
         <button onClick={() => handleArrow(0, 1)} className="p-4 bg-white/5 rounded-xl hover:bg-white/10 flex justify-center active:scale-95">↓</button>
         <button onClick={() => handleArrow(1, 0)} className="p-4 bg-white/5 rounded-xl hover:bg-white/10 flex justify-center active:scale-95">→</button>
      </div>
    </GlassCard>
  );
};
