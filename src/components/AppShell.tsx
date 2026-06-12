import { AnimatePresence, motion } from 'framer-motion';
import React, { useState, useEffect, useRef } from 'react';
import { differenceInDays } from 'date-fns';
import { Heart, Play, Music, LogOut, SkipForward } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { GlobalBackground } from './GlobalBackground';
import { GlassCard } from './GlassCard';
import { ImageWithFallback } from './ImageWithFallback';
import { useAudioManager } from '../lib/useAudioManager';
import { PinLockScreen } from './PinLockScreen';
import { sounds } from '../lib/sounds';

function MicPromptModal({ onDone }: { onDone: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
      <div className="bg-[#1A0A0C] border border-[#EBC2C6]/30 p-8 rounded-[32px] max-w-sm w-full text-center shadow-2xl flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 rounded-full bg-[#EBC2C6]/10 flex items-center justify-center text-[#EBC2C6]">
          <Music className="w-8 h-8" />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold text-white tracking-tight">Izin Mikrofon</h2>
          <p className="text-sm text-balance text-[#9A9AB0]">
            Untuk fitur Voice Note, pastikan kamu memberikan akses Mikrofon di browser.
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={async () => {
              try {
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                  stream.getTracks().forEach(t => t.stop());
                }
              } catch (e) {
                console.warn(e);
              }
              onDone();
            }}
            className="w-full bg-gradient-to-r from-[#EBC2C6] to-[#D6C2E8] text-[#1A0A0C] font-bold py-3 px-6 rounded-full hover:opacity-90 transition-opacity"
          >
            Aktifkan Mikrofon
          </button>
          <button
            onClick={onDone}
            className="w-full bg-white/5 text-white/50 font-semibold py-3 px-6 rounded-full hover:bg-white/10 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

// import sections
import { S01_PasswordGate } from './sections/S01_PasswordGate';
import { S02_GiftBox } from './sections/S02_GiftBox';
import { S03_HeartHold } from './sections/S03_HeartHold';
import { S04_RomanticTrivia } from './sections/S04_RomanticTrivia';
import { S05_MemoryCard } from './sections/S05_MemoryCard';
import { S06_LoveSlider } from './sections/S06_LoveSlider';
import { S07_CatchButton } from './sections/S07_CatchButton';
import { S08_LoveMeteor } from './sections/S08_LoveMeteor';
import { S09_SlidePuzzle } from './sections/S09_SlidePuzzle';
import { S10_AnniversaryCountdown } from './sections/S10_AnniversaryCountdown';
import { S11_Magic8Ball } from './sections/S11_Magic8Ball';
import { S12_GuessNumber } from './sections/S12_GuessNumber';
import { S13_BalloonMessage } from './sections/S13_BalloonMessage';
import { S14_WishingTree } from './sections/S14_WishingTree';
import { S15_MusicBox } from './sections/S15_MusicBox';
import { S16_LoveScale } from './sections/S16_LoveScale';
import { S17_ScratchCard } from './sections/S17_ScratchCard';
import { S18_LoveCalculator } from './sections/S18_LoveCalculator';
import { S19_HeartMaze } from './sections/S19_HeartMaze';
import { S20_MemorySpinner } from './sections/S20_MemorySpinner';
import { S21_FutureWindow } from './sections/S21_FutureWindow';
import { S22_FinalProfile } from './sections/S22_FinalProfile';

const ALL_MISSIONS = [
  "Gerbang Kode", "Kotak Hadiah", "Tahan Hati", "Trivia Kuis", "Memory Match", 
  "Love Slider", "Kejar Tomb0l", "Hujan Bintang", "Puzzle Cinta", "Hitung Waktu",
  "Bola Rahasia", "Tebak Angka", "Pesan Balon", "Pohon Harapan", "Kotak Musik",
  "Penimbang Cinta", "Goresan Hati", "Kalkulator Cinta", "Labirin Hati", "Pemutar Janji",
  "Jendela Masa Depan", "Puncak Cinta"
];

const NoSection = () => (
  <GlassCard width={500} padding="60px 40px" className="text-center flex flex-col items-center">
    <motion.div
       initial={{ scale: 0 }}
       animate={{ scale: 1 }}
       transition={{ type: "spring", stiffness: 200, damping: 20 }}
       className="mb-8 drop-shadow-[0_0_20px_rgba(235,194,198,0.5)]"
    >
       <svg width="80" height="80" viewBox="0 0 24 24" fill="#EBC2C6">
         <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
       </svg>
    </motion.div>
    
    <h2 className="text-[28px] font-bold text-[var(--text-primary)] mb-4">
      To Be Continued...
    </h2>
    <p className="text-[14px] text-[var(--text-secondary)] mb-2">
      Cerita Nauraa & Farsya masih akan terus berlanjut.
    </p>
    <p className="text-[14px] text-[var(--text-secondary)] italic">
      "I love you more than words can say."
    </p>
  </GlassCard>
);

export const AppShell: React.FC = () => {
  const [isLocked, setIsLocked] = useState(true);
  const [showMicPrompt, setShowMicPrompt] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const currentSection = useAppStore(state => state.currentSection);
  const unlockedSections = useAppStore(state => state.unlockedSections);
  const audioState = useAppStore(state => state.audioState);
  const toggleMuteStore = useAppStore(state => state.toggleMute);
  const goToNext = useAppStore(state => state.goToNext);
  const profileActiveTab = useAppStore(state => state.profileActiveTab);
  
  useEffect(() => {
    if (sessionStorage.getItem('mic_prompt_done')) return;
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'microphone' as any }).then(status => {
        if (status.state === 'prompt' || status.state === 'denied') {
          setShowMicPrompt(true);
        }
      }).catch(() => setShowMicPrompt(true));
    } else {
      setShowMicPrompt(true);
    }
  }, []);
  
  const handleMicDone = () => {
    sessionStorage.setItem('mic_prompt_done', 'true');
    setShowMicPrompt(false);
  };
  
  const isMuted = audioState.muted;
  const toggleMute = () => {
    toggleMuteStore();
    import('../lib/sounds').then(m => m.updateGlobalMute(!isMuted));
    
    if (audioRef.current) {
       if (isMuted) {
         audioRef.current.play().catch(e => console.log('Autoplay prevent:', e));
       } else {
         audioRef.current.pause();
       }
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      if (!isMuted) {
         audioRef.current.play().catch(e => console.log('Autoplay prevent:', e));
      } else {
         audioRef.current.pause();
      }
    }
  }, [isMuted]);
  
  const START_DATE = new Date('2026-04-24T00:00:00');
  const daysTogether = Math.max(0, differenceInDays(new Date(), START_DATE));

  const renderSection = () => {
    switch (currentSection) {
      case 1: return <S01_PasswordGate key="s1" />;
      case 2: return <S02_GiftBox key="s2" />;
      case 3: return <S03_HeartHold key="s3" />;
      case 4: return <S04_RomanticTrivia key="s4" />;
      case 5: return <S05_MemoryCard key="s5" />;
      case 6: return <S06_LoveSlider key="s6" />;
      case 7: return <S07_CatchButton key="s7" />;
      case 8: return <S08_LoveMeteor key="s8" />;
      case 9: return <S09_SlidePuzzle key="s9" />;
      case 10: return <S10_AnniversaryCountdown key="s10" />;
      case 11: return <S11_Magic8Ball key="s11" />;
      case 12: return <S12_GuessNumber key="s12" />;
      case 13: return <S13_BalloonMessage key="s13" />;
      case 14: return <S14_WishingTree key="s14" />;
      case 15: return <S15_MusicBox key="s15" />;
      case 16: return <S16_LoveScale key="s16" />;
      case 17: return <S17_ScratchCard key="s17" />;
      case 18: return <S18_LoveCalculator key="s18" />;
      case 19: return <S19_HeartMaze key="s19" />;
      case 20: return <S20_MemorySpinner key="s20" />;
      case 21: return <S21_FutureWindow key="s21" />;
      case 22: return <S22_FinalProfile key="s22" />;
      default: return <NoSection key="default" />;
    }
  };

  const progressPercent = ((currentSection - 1) / ALL_MISSIONS.length) * 100;

  return (
    <div className="w-full h-screen overflow-hidden relative flex flex-col font-sans text-white select-none bg-[#0A0A0E]">
      <GlobalBackground turboMode={false} />
      <audio ref={audioRef} loop src="https://files.catbox.moe/u6yxyy.mp3" className="hidden" />
      
      <AnimatePresence>
        {isLocked && (
          <PinLockScreen key="lock-screen" onUnlock={() => setIsLocked(false)} />
        )}
        {showMicPrompt && (
          <MicPromptModal key="mic-prompt" onDone={handleMicDone} />
        )}
      </AnimatePresence>
      
      {/* Additional Foreground elements */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[15%] left-[10%] w-8 h-8 opacity-60 text-[#EBC2C6] animate-[pulse_4s_ease-in-out_infinite]">
          <Heart fill="currentColor" />
        </div>
        <div className="absolute top-[70%] left-[85%] w-12 h-12 opacity-40 text-[#D6C2E8] rotate-12 animate-[float_8s_ease-in-out_infinite]">
          <Play fill="currentColor" />
        </div>
      </div>

      {currentSection < ALL_MISSIONS.length && (
         <div className="absolute bottom-6 right-6 lg:bottom-24 lg:right-10 z-50 flex flex-row gap-2">
           <button 
             onClick={() => goToNext()} 
             className="flex items-center justify-center gap-1.5 text-[10px] font-bold tracking-wider text-white/50 hover:text-white bg-white/5 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md transition-all hover:bg-white/10 hover:scale-105 cursor-pointer"
           >
             LANJUT MISI <SkipForward size={12} />
           </button>
           <button 
             onClick={() => {
               const allSecs = Array.from({ length: 22 }, (_, i) => i + 1);
               useAppStore.setState({ unlockedSections: allSecs, currentSection: 22 });
               sounds.successSound();
             }} 
             className="flex items-center justify-center gap-1.5 text-[10px] font-black tracking-wider text-[#1A0A0C] bg-gradient-to-r from-[#EBC2C6] to-[#D6C2E8] hover:opacity-90 px-4 py-2 rounded-full border border-[#EBC2C6]/20 backdrop-blur-md transition-all hover:scale-105 shadow-md shadow-pink-500/10 cursor-pointer"
           >
             PROFIL UTAMA 🌸
           </button>
         </div>
      )}

      {/* Header */}
      <header className="relative z-[60] flex justify-between items-center px-6 lg:px-10 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#EBC2C6] to-[#D6C2E8] flex items-center justify-center shadow-lg">
            <Heart className="w-6 h-6 text-[#1A0A0C]" fill="currentColor" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-[3px] text-[#9A9AB0] font-light">Love Journey</span>
            <span className="text-lg font-bold tracking-tight text-white">Nauraa & Farsya</span>
          </div>
        </div>
        <div className="flex items-center gap-6 ml-auto">
          {currentSection < 22 && (
            <div className="hidden sm:flex gap-2">
              <div className="px-3 py-1 rounded-full border border-[#EBC2C6]/30 bg-[#EBC2C6]/10 text-[#EBC2C6] text-[11px] font-semibold tracking-wider">ONLINE</div>
            </div>
          )}
          <button onClick={toggleMute} className="w-12 h-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center backdrop-blur-md hover:bg-white/10 transition-colors z-50 cursor-pointer">
            {isMuted ? <Music className="w-5 h-5 text-white/40" /> : <Music className="w-5 h-5 text-white/70" />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10 flex px-4 lg:px-10 gap-8 overflow-hidden pb-10 flex-col lg:flex-row">
        
        {/* Left Sidebar */}
        <aside className="hidden lg:flex w-[240px] flex-col gap-4">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-[#5A5A70] uppercase tracking-[2px]">Progress Misi</h3>
            <div className="space-y-3 h-[200px] overflow-y-auto scrollbar-none pr-2">
              {ALL_MISSIONS.map((miss, idx) => {
                const sId = idx + 1;
                const isCurrent = currentSection === sId;
                const isUnlocked = unlockedSections.includes(sId);
                const isLocked = !isUnlocked;
                
                return (
                  <div key={idx} className={`flex items-center gap-3 transition-opacity ${isCurrent ? 'opacity-100' : isUnlocked ? 'opacity-70' : 'opacity-40'}`}>
                    <div className={`w-6 h-6 rounded-full flex flex-shrink-0 items-center justify-center text-[10px] font-bold ${isCurrent ? 'bg-[#EBC2C6] text-[#1A0A0C]' : 'border border-white/20'}`}>
                      {sId.toString().padStart(2, '0')}
                    </div>
                    <span className={`text-sm ${isCurrent ? 'font-medium' : ''} truncate`}>{miss}</span>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="text-[10px] text-[#5A5A70] mb-1">TOTAL PROGRESS</div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#EBC2C6] to-[#D6C2E8] transition-all duration-1000" style={{ width: `${Math.max(4.5, progressPercent)}%` }}></div>
              </div>
            </div>
          </div>
          
          <div className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 flex flex-col justify-end gap-4" style={{ background: 'linear-gradient(180deg, rgba(235,194,198,0.05) 0%, rgba(10,10,14,0.1) 100%)' }}>
            <div className="flex -space-x-4">
              <div className="w-10 h-10 rounded-full border-2 border-[#EBC2C6] overflow-hidden bg-gray-800">
                <ImageWithFallback src="https://files.catbox.moe/jw0yc8.jpg" className="w-full h-full object-cover" alt="N" />
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-[#D6C2E8] overflow-hidden bg-gray-800">
                <ImageWithFallback src="https://files.catbox.moe/tz9k37.jpg" className="w-full h-full object-cover" alt="F" />
              </div>
            </div>
            <div>
              <div className="text-xs text-[#9A9AB0] uppercase tracking-widest font-medium mb-1">Hari Ini</div>
              <div className="text-2xl font-bold">Day {daysTogether}</div>
              <div className="text-[11px] text-[#EBC2C6] mt-1">{currentSection === 1 ? 'Menunggu kamu masuk...' : `Misi ke-${currentSection} berjalan`}</div>
            </div>
          </div>
        </aside>

        {/* Center Canvas */}
        <section className="flex-1 flex items-center justify-center relative max-h-full">
          <AnimatePresence mode="wait">
            {renderSection()}
          </AnimatePresence>
        </section>

        {/* Right Sidebar */}
        <aside className="hidden xl:flex w-[320px] flex-col gap-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-[#5A5A70] uppercase tracking-[2px]">Music</h3>
              <div className={`w-2 h-2 rounded-full ${isMuted ? 'bg-[#5A5A70]' : 'bg-[#EBC2C6] animate-pulse'}`}></div>
            </div>
            <div className="flex gap-4 items-center">
              <div className={`w-16 h-16 rounded-full border-2 border-white/20 overflow-hidden shrink-0 ${isMuted ? '' : 'animate-[spin_10s_linear_infinite]'}`}>
                <img src="https://files.catbox.moe/cx39ee.jpg" className="w-full h-full object-cover" alt="Album" />
              </div>
              <div className="flex flex-col overflow-hidden w-full">
                <span className="text-sm font-bold truncate">A Thousand Years</span>
                <span className="text-[11px] text-[#9A9AB0] truncate">Christina Perri</span>
                <div className="mt-2 w-full h-[3px] bg-white/10 rounded-full">
                  <div className="h-full bg-[#EBC2C6] transition-all" style={{ width: '35%' }}></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 flex-1 flex flex-col">
            <h3 className="text-xs font-bold text-[#5A5A70] uppercase tracking-[2px] mb-4">Berita Bintang</h3>
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-[#B7E3E0]/5 border border-[#B7E3E0]/10">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#B7E3E0]/20 text-[#B7E3E0] font-bold">PISCES</span>
                  <span className="text-[10px] text-[#9A9AB0]">16 Mar</span>
                </div>
                <p className="text-[11px] leading-relaxed italic">"Air yang tenang membawa kedamaian bagi sang Capricorn."</p>
              </div>
              <div className="p-3 rounded-2xl bg-[#D6C2E8]/5 border border-[#D6C2E8]/10">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#D6C2E8]/20 text-[#D6C2E8] font-bold">CAPRICORN</span>
                  <span className="text-[10px] text-[#9A9AB0]">17 Jan</span>
                </div>
                <p className="text-[11px] leading-relaxed italic">"Bumi akan selalu menjadi tempat bersandar bagi sang Pisces."</p>
              </div>
              <div className="flex-1 flex flex-col justify-center items-center text-center mt-4 border-t border-white/5 pt-4">
                <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#EBC2C6] to-[#D6C2E8] mb-1">87%</div>
                <div className="text-[10px] text-[#5A5A70] uppercase tracking-[1px]">Compatibility</div>
              </div>
            </div>
          </div>
        </aside>
        
      </main>

      {/* Footer */}
      <footer className="relative z-50 px-10 py-6 hidden lg:flex justify-between items-center text-[#5A5A70] text-[11px] font-medium border-t border-white/5 bg-black/20 backdrop-blur-sm">
        <div className="flex gap-8">
          <span>DIBUAT OLEH: FARSYA ZAHRI</span>
          <span>UNYUK: NAURAA RAYYANI AYU</span>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex gap-1">
            <div className="w-1 h-1 rounded-full bg-[#EBC2C6]"></div>
            <div className="w-1 h-1 rounded-full bg-[#D6C2E8]"></div>
            <div className="w-1 h-1 rounded-full bg-[#B7E3E0]"></div>
          </div>
          <span>v1.0.0 STABLE</span>
        </div>
      </footer>
    </div>
  );
};


