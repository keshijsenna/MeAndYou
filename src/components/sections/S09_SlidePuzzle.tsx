import confetti from 'canvas-confetti';
import { AnimatePresence, motion } from 'framer-motion';
import { Shuffle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { PUZZLE_IMAGE } from '../../lib/constants';
import { sounds } from '../../lib/sounds';
import { useAppStore } from '../../lib/store';
import { GlassCard } from '../GlassCard';
import { ImageWithFallback } from '../ImageWithFallback';

export const S09_SlidePuzzle: React.FC = () => {
  const [tiles, setTiles] = useState<(number | null)[]>([]);
  const [moves, setMoves] = useState(0);
  const [isWin, setIsWin] = useState(false);
  const { goToNext, setGameState } = useAppStore();

  const solvedState = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,null];

  useEffect(() => {
    initPuzzle();
  }, []);

  const initPuzzle = () => {
    sounds.clickSound();
    setIsWin(false);
    setMoves(0);
    // shuffle
    let current = [...solvedState];
    // perform random valid moves
    for (let i = 0; i < 200; i++) {
       const emptyIdx = current.indexOf(null);
       const row = Math.floor(emptyIdx / 4);
       const col = emptyIdx % 4;
       const validMoves = [];
       if (row > 0) validMoves.push(emptyIdx - 4);
       if (row < 3) validMoves.push(emptyIdx + 4);
       if (col > 0) validMoves.push(emptyIdx - 1);
       if (col < 3) validMoves.push(emptyIdx + 1);
       
       const move = validMoves[Math.floor(Math.random() * validMoves.length)];
       [current[emptyIdx], current[move]] = [current[move], current[emptyIdx]];
    }
    setTiles(current);
  };

  const handleTileClick = (idx: number) => {
    if (isWin || tiles[idx] === null) return;
    
    const emptyIdx = tiles.indexOf(null);
    const r1 = Math.floor(idx / 4), c1 = idx % 4;
    const r2 = Math.floor(emptyIdx / 4), c2 = emptyIdx % 4;
    
    // Check adjacent
    if ((Math.abs(r1 - r2) === 1 && c1 === c2) || (Math.abs(c1 - c2) === 1 && r1 === r2)) {
       sounds.clickSound();
       const newTiles = [...tiles];
       [newTiles[idx], newTiles[emptyIdx]] = [newTiles[emptyIdx], newTiles[idx]];
       setTiles(newTiles);
       setMoves(m => m + 1);
       checkWin(newTiles);
    }
  };

  const checkWin = (t: (number | null)[]) => {
     const won = t.every((val, i) => val === solvedState[i]);
     if (won) {
        setIsWin(true);
        setGameState({ puzzleMoves: moves + 1 });
        sounds.successSound();
        confetti({ particleCount: 150 });
     }
  };

  return (
    <GlassCard width={420} padding="36px 32px" className="flex flex-col items-center select-none">
       <div className="w-full flex justify-between items-end mb-8 relative">
          <div>
            <h2 className="text-[20px] font-bold text-[var(--text-primary)]">Susun Foto Kita</h2>
            <p className="text-[13px] text-[var(--text-secondary)]">Langkah: {moves}</p>
          </div>
          
          <div className="flex gap-4 items-center">
             {/* Thumbnail hover */}
             <div className="group relative">
                <div className="w-[40px] h-[40px] rounded-md border border-[var(--border-glass)] overflow-hidden cursor-help">
                   <ImageWithFallback src={PUZZLE_IMAGE} className="w-full h-full object-cover" alt="thumb" />
                </div>
                <div className="absolute right-0 top-12 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                   <ImageWithFallback src={PUZZLE_IMAGE} className="w-[160px] h-[160px] object-cover rounded-xl shadow-xl border border-[var(--border-glass)]" alt="preview" />
                </div>
             </div>
             
             <button onClick={initPuzzle} className="p-2 bg-[rgba(255,255,255,0.06)] rounded-full hover:bg-[rgba(255,255,255,0.1)]">
               <Shuffle size={16} />
             </button>
          </div>
       </div>

       <div className="bg-[#1A1A2E] p-1 rounded-[16px] border border-[rgba(235,194,198,0.2)]">
          <div className="grid grid-cols-4 gap-1 w-[332px] h-[332px]">
             <AnimatePresence>
                {tiles.map((t, idx) => {
                   if (t === null) {
                      return (
                        <motion.div key="empty" layout className="w-[80px] h-[80px] border border-dashed border-[rgba(235,194,198,0.15)] rounded-[10px] flex items-center justify-center">
                           <span className="text-[rgba(255,255,255,0.1)] text-2xl">?</span>
                        </motion.div>
                      );
                   }
                   return (
                      <motion.div
                         key={t}
                         layoutId={`tile-${t}`}
                         onClick={() => handleTileClick(idx)}
                         className="w-[80px] h-[80px] rounded-[10px] border border-[rgba(235,194,198,0.2)] cursor-pointer overflow-hidden relative"
                         style={{
                            backgroundImage: `url(${PUZZLE_IMAGE})`,
                            backgroundSize: '320px 320px',
                            backgroundPosition: `-${(t % 4) * 80}px -${Math.floor(t / 4) * 80}px`
                         }}
                         animate={isWin ? { borderColor: ['#EBC2C6', 'rgba(235,194,198,0.2)'] } : {}}
                         transition={isWin ? { repeat: 3, duration: 0.5 } : { type: 'spring', stiffness: 500, damping: 30 }}
                      />
                   );
                })}
             </AnimatePresence>
          </div>
       </div>

       <AnimatePresence>
          {isWin && (
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="w-full mt-8"
             >
                <button 
                  onClick={() => goToNext()}
                  className="w-full p-4 bg-[image:var(--gradient-btn)] rounded-[var(--radius-btn)] text-[#1A0A0C] font-semibold hover:scale-[1.02] transition-transform"
                >
                  Sempurna! Lanjut
                </button>
             </motion.div>
          )}
       </AnimatePresence>
    </GlassCard>
  );
};
