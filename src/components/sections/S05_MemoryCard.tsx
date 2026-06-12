import { AnimatePresence, motion } from 'framer-motion';
import { Cat, Moon, Star, Mic, Square, Play } from 'lucide-react';
import React, { useEffect, useState, useRef } from 'react';
import { CARD_PAIRS } from '../../lib/constants';
import { sounds } from '../../lib/sounds';
import { useAppStore } from '../../lib/store';
import { GlassCard } from '../GlassCard';
import { ImageWithFallback } from '../ImageWithFallback';

type CardState = 'hidden' | 'revealed' | 'matched';

interface CardItem {
  uid: string;
  id: string;
  type: string;
  src?: string;
  icon?: string;
  color?: string;
  label: string;
  state: CardState;
}

const shuffle = <T,>(array: T[]): T[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

export const S05_MemoryCard: React.FC = () => {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [revealedIds, setRevealedIds] = useState<number[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [matches, setMatches] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWin, setIsWin] = useState(false);
  
  // Voice Memo states
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [memoBase64, setMemoBase64] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { goToNext, setGameState } = useAppStore();

  const initGame = () => {
    sounds.clickSound();
    const paired = [...CARD_PAIRS, ...CARD_PAIRS].map((c, i) => ({
      ...c,
      uid: `${c.id}-${i}`,
      state: 'hidden' as CardState
    }));
    setCards(shuffle(paired));
    setRevealedIds([]);
    setAttempts(0);
    setMatches(0);
    setTimeLeft(60);
    setIsGameOver(false);
    setIsWin(false);
    setMemoBase64(null);
    setRecordTime(0);
  };

  useEffect(() => {
    initGame();
  }, []);

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
  }, [isGameOver, isWin]);

  const handleCardClick = (idx: number) => {
    if (isGameOver || isWin) return;
    const card = cards[idx];
    if (card.state !== 'hidden' || revealedIds.length >= 2) return;

    sounds.clickSound();
    const newCards = [...cards];
    newCards[idx].state = 'revealed';
    setCards(newCards);

    const newRevealed = [...revealedIds, idx];
    setRevealedIds(newRevealed);

    if (newRevealed.length === 2) {
      setAttempts(a => a + 1);
      const [idx1, idx2] = newRevealed;
      if (cards[idx1].id === cards[idx2].id) {
        // match
        setTimeout(() => {
          sounds.pling();
          setCards(prev => {
            const temp = [...prev];
            temp[idx1].state = 'matched';
            temp[idx2].state = 'matched';
            return temp;
          });
          setRevealedIds([]);
          setMatches(m => {
            const nm = m + 1;
            if (nm === CARD_PAIRS.length) {
               setIsWin(true);
               setGameState({ memoryMatchTime: 60 - timeLeft });
               sounds.successSound();
            }
            return nm;
          });
        }, 800);
      } else {
        // mismatch
        setTimeout(() => {
          setCards(prev => {
            const temp = [...prev];
            temp[idx1].state = 'hidden';
            temp[idx2].state = 'hidden';
            return temp;
          });
          setRevealedIds([]);
        }, 800);
      }
    }
  };

  const getIcon = (name: string, color: string) => {
    switch (name) {
      case 'star': return <Star size={48} color={color} fill={color} />;
      case 'moon': return <Moon size={48} color={color} fill={color} />;
      case 'cat': return <Cat size={48} color={color} />;
      default: return null;
    }
  };

  const startRecord = async () => {
    try {
      if (!navigator.mediaDevices) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // MediaRecorder cross-compatibility
      let rType = '';
      if (MediaRecorder.isTypeSupported('audio/webm')) rType = 'audio/webm';
      else if (MediaRecorder.isTypeSupported('audio/mp4')) rType = 'audio/mp4';
      
      const recorder = rType ? new MediaRecorder(stream, { mimeType: rType }) : new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks, { type: rType || 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => setMemoBase64(reader.result as string);
        reader.readAsDataURL(blob);
        if (timerRef.current) clearInterval(timerRef.current);
        setIsRecording(false);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordTime(0);
      timerRef.current = setInterval(() => {
        setRecordTime(prev => {
          if (prev >= 29) {
             recorder.stop();
             return 30;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      console.warn("Mic error");
    }
  };

  const stopRecord = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const togglePlay = () => {
    if (!audioRef.current && memoBase64) {
      audioRef.current = new Audio(memoBase64);
      audioRef.current.onended = () => setIsPlaying(false);
    }
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  return (
    <GlassCard width={580} padding="32px 24px" className="flex flex-col items-center">
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-6 px-4">
        <div>
          <div className={`text-[28px] font-bold ${timeLeft < 10 ? 'text-[#E8A0A0]' : 'text-[var(--accent-mint)]'}`}>
            {timeLeft}s
          </div>
          <div className="w-[80px] h-[4px] bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden mt-1">
             <motion.div 
               className={`h-full ${timeLeft < 10 ? 'bg-[#E8A0A0]' : 'bg-gradient-to-r from-[#EBC2C6] to-[#D6C2E8]'}`}
               animate={{ width: `${(timeLeft / 60) * 100}%` }}
               transition={{ duration: 1, ease: 'linear' }}
             />
          </div>
        </div>
        <div className="text-right">
          <div className="text-[14px] font-medium text-[var(--accent-pink)]">Cocok: {matches} / 6</div>
          <div className="text-[12px] text-[var(--text-secondary)]">Percobaan: {attempts}</div>
        </div>
        <button 
          onClick={initGame}
          className="p-3 bg-[rgba(255,255,255,0.06)] rounded-full hover:bg-[rgba(255,255,255,0.1)] transition-colors"
          title="Reset Game"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
          </svg>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-4 gap-[14px] justify-center relative">
        {cards.map((card, i) => (
          <div 
            key={card.uid}
            className="w-[88px] h-[110px] [perspective:1000px] cursor-pointer"
            onClick={() => handleCardClick(i)}
          >
            <motion.div
              className="w-full h-full relative [transform-style:preserve-3d]"
              animate={{
                rotateY: card.state === 'hidden' ? 0 : 180,
                scale: card.state === 'matched' ? [1, 1.08, 1] : 1
              }}
              transition={{
                rotateY: { duration: 0.45, ease: 'easeOut' },
                scale: { duration: 0.3 }
              }}
            >
              {/* Back Face (Hidden State) */}
              <div className="absolute inset-0 [backface-visibility:hidden] rounded-[18px] bg-gradient-to-br from-[#1E1E2E] to-[#2A2A3A] border border-[rgba(235,194,198,0.15)] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(rgba(235,194,198,0.4) 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                <svg width="24" height="24" viewBox="0 0 24 24" fill="rgba(235,194,198,0.3)">
                   <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </div>

              {/* Front Face (Revealed State) */}
              <div 
                className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-[18px] border-2 border-[var(--accent-pink)] bg-[rgba(255,255,255,0.05)] overflow-hidden flex items-center justify-center shadow-[inset_0_0_20px_rgba(235,194,198,0.2)]"
                style={{ filter: card.state === 'matched' ? 'drop-shadow(0 0 12px rgba(235,194,198,0.8))' : 'none' }}
              >
                {card.type === 'image' ? (
                  <ImageWithFallback src={card.src} alt="memory" className="w-full h-full object-cover" />
                ) : (
                  getIcon(card.icon!, card.color!)
                )}
                {card.state === 'matched' && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <div className="w-[120%] h-[120%] bg-white/20 rounded-full blur-md" />
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        ))}

        {/* Overlays */}
        <AnimatePresence>
          {isGameOver && !isWin && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-[rgba(10,10,14,0.8)] backdrop-blur-sm rounded-[24px] z-20"
            >
               <h3 className="text-[24px] font-bold text-[#E8A0A0] mb-4">Waktu Habis!</h3>
               <p className="text-[14px] text-[var(--text-secondary)] mb-6">Jangan menyerah sayang, coba lagi.</p>
               <button 
                 onClick={initGame}
                 className="px-8 py-3 bg-[rgba(255,255,255,0.1)] rounded-full text-white border border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.15)]"
               >
                 Coba Lagi
               </button>
            </motion.div>
          )}

          {isWin && (
             <motion.div 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             exit={{ opacity: 0 }}
             className="absolute inset-0 flex flex-col items-center justify-center bg-[rgba(10,10,14,0.7)] backdrop-blur-sm rounded-[24px] z-20"
           >
              <h3 className="text-[28px] font-bold text-[#EBC2C6] mb-2">Kamu Berhasil!</h3>
              <p className="text-[14px] text-[var(--text-primary)] mb-6">Selesai dalam {60 - timeLeft} detik</p>
              
              {/* Voice Memo Feature */}
              <div className="flex flex-col items-center mb-6 bg-white/5 p-4 rounded-[20px] border border-white/10 w-full max-w-[240px]">
                <p className="text-[10px] font-bold tracking-widest uppercase text-white/50 mb-3">Tinggalkan Pesan Manis</p>
                {memoBase64 ? (
                  <button onClick={togglePlay} className="flex items-center gap-2 px-6 py-3 bg-[#EBC2C6]/20 border border-[#EBC2C6]/30 text-[#EBC2C6] rounded-full hover:bg-[#EBC2C6]/30">
                    {isPlaying ? <Square size={16} className="fill-[#EBC2C6]" /> : <Play size={16} className="fill-[#EBC2C6]" />}
                    <span className="text-[12px] font-bold">{isPlaying ? 'Playing...' : 'Putar Pesan'}</span>
                  </button>
                ) : (
                  <button 
                    onPointerDown={startRecord} 
                    onPointerUp={stopRecord}
                    onPointerLeave={stopRecord}
                    className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 scale-110' : 'bg-white/10 hover:bg-white/20'}`}
                  >
                    {isRecording ? (
                      <span className="text-[10px] absolute -bottom-6 text-white font-mono">{recordTime}s</span>
                    ) : null}
                    <Mic size={24} className={isRecording ? 'text-white translate-y-[-2px]' : 'text-white/60'} />
                    {isRecording && <div className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping" />}
                  </button>
                )}
                <p className="text-[9px] text-white/40 mt-3 text-center">{!memoBase64 ? 'Tahan tombol untuk merekam (Max 30s)' : 'Tersimpan lokal ✨'}</p>
              </div>

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
