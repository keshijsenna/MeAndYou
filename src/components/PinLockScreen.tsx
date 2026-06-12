import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, CheckCircle2, Lock, Unlock, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { getSecurityPINHash, setSecurityPINHash } from '../lib/firebase';
import { sounds } from '../lib/sounds';

interface PinLockScreenProps {
  onUnlock: () => void;
}

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const PinLockScreen: React.FC<PinLockScreenProps> = ({ onUnlock }) => {
  const [loading, setLoading] = useState(true);
  const [pinHash, setPinHash] = useState<string | null>(null);
  
  // 'enter' -> entering existing PIN, 'setup_1' -> enter new pin, 'setup_2' -> confirm new pin
  const [mode, setMode] = useState<'enter' | 'setup_1' | 'setup_2'>('enter');
  
  const [inputVal, setInputVal] = useState<string>('');
  const [setupFirstVal, setSetupFirstVal] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Load the hash from Firestore on startup
  useEffect(() => {
    async function fetchPin() {
      try {
        const storedHash = await getSecurityPINHash();
        if (storedHash) {
          setPinHash(storedHash);
          setMode('enter');
        } else {
          setMode('setup_1');
        }
      } catch (err) {
        console.error('Failed to load PIN lock configuration:', err);
        setMode('setup_1');
      } finally {
        setLoading(false);
      }
    }
    fetchPin();
  }, []);

  const handleKeyPress = (num: string) => {
    if (isSuccess) return;
    if (inputVal.length >= 4) return;
    
    sounds.clickSound();
    setErrorMsg('');
    const newVal = inputVal + num;
    setInputVal(newVal);
    
    if (newVal.length === 4) {
      // Auto register/evaluate on fourth digit
      setTimeout(() => {
        evaluatePin(newVal);
      }, 250);
    }
  };

  const handleBackspace = () => {
    if (isSuccess) return;
    sounds.softPluck();
    setInputVal(prev => prev.slice(0, -1));
  };

  const evaluatePin = async (completedPin: string) => {
    if (mode === 'enter') {
      const hashed = await sha256(completedPin);
      if (hashed === pinHash) {
        setIsSuccess(true);
        sounds.sparkleChime();
        setTimeout(() => {
          onUnlock();
        }, 800);
      } else {
        setInputVal('');
        setErrorMsg('PIN Salah. Coba lagi ya sayang ❤️');
        sounds.softPluck();
      }
    } 
    
    else if (mode === 'setup_1') {
      sounds.shutterClick();
      setSetupFirstVal(completedPin);
      setInputVal('');
      setMode('setup_2');
    } 
    
    else if (mode === 'setup_2') {
      if (completedPin === setupFirstVal) {
        setIsSuccess(true);
        const hashed = await sha256(completedPin);
        try {
          await setSecurityPINHash(hashed);
          setPinHash(hashed);
          sounds.successSound();
          setTimeout(() => {
            onUnlock();
          }, 800);
        } catch (err) {
          setErrorMsg('Gagal menyimpan PIN ke database. Coba lagi.');
          setMode('setup_1');
          setInputVal('');
        }
      } else {
        setInputVal('');
        setErrorMsg('PIN Konfirmasi Tidak Cocok! Silakan buat ulang.');
        setMode('setup_1');
        sounds.softPluck();
      }
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0A0A0E] z-[999] flex flex-col items-center justify-center">
        <span className="w-10 h-10 border-4 border-[#EBC2C6] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-mono text-white/50 tracking-wider">MEMULAI LOVE JOURNAL SECURE ENGINE...</p>
      </div>
    );
  }

  const modeTitle = {
    enter: "Masukkan PIN 4-Digit",
    setup_1: "Buat PIN Baru",
    setup_2: "Konfirmasi PIN Baru"
  }[mode];

  const modeDesc = {
    enter: "Amankan perjalanan cinta Nauraa & Farsya",
    setup_1: "Pilih 4 digit PIN rahasia untuk mengunci aplikasi ini",
    setup_2: "Masukkan ulang 4 digit PIN yang baru Anda ketik"
  }[mode];

  return (
    <div className="fixed inset-0 w-full h-full bg-gradient-to-b from-[#0F0F15] via-[#08080B] to-[#0A0A0E] flex flex-col items-center justify-center z-[9999] px-4 overflow-hidden select-none">
      
      {/* Decorative ambient background lights */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-pink-500/10 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-purple-500/5 blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="relative z-10 w-full max-w-[360px] flex flex-col items-center"
      >
        {/* Header Icon Block */}
        <div className="relative mb-8 flex justify-center items-center">
          <motion.div
            animate={isSuccess ? { scale: [1, 1.2, 1], rotate: [0, 15, -15, 0] } : {}}
            transition={{ duration: 0.6 }}
            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg border-2 backdrop-blur-md ${isSuccess ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400' : 'bg-white/5 border-white/10 text-[#EBC2C6]'}`}
          >
            {isSuccess ? <Unlock size={26} className="animate-[pulse_1s_infinite]" /> : <Lock size={26} />}
          </motion.div>
          {!isSuccess && pinHash && (
            <span className="absolute -bottom-1 text-[8px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full border border-red-500/30">
              SECURED
            </span>
          )}
          {!isSuccess && !pinHash && (
            <span className="absolute -bottom-1 text-[8px] bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full border border-yellow-500/20">
              SETUP MODE
            </span>
          )}
        </div>

        {/* Text descriptions */}
        <h2 className="text-xl font-bold tracking-tight text-white mb-2 text-center">
          {modeTitle}
        </h2>
        <p className="text-xs text-[#9A9AB0] text-center max-w-[280px] leading-relaxed mb-8">
          {modeDesc}
        </p>

        {/* PIN Dot Indicators */}
        <div className="flex gap-4 justify-center items-center mb-6">
          {[0, 1, 2, 3].map((idx) => {
            const filled = inputVal.length > idx;
            return (
              <motion.div
                key={idx}
                animate={filled ? { scale: [1, 1.25, 1], backgroundColor: ["rgba(255,192,203,0.2)", "#EBC2C6"] } : { scale: 1, backgroundColor: "rgba(255,255,255,0.08)" }}
                transition={{ duration: 0.2 }}
                className={`w-4 h-4 rounded-full border ${filled ? 'border-[#EBC2C6]' : 'border-white/15'}`}
              />
            );
          })}
        </div>

        {/* Error message slot */}
        <div className="h-6 mb-8 text-center">
          <AnimatePresence mode="wait">
            {errorMsg && (
              <motion.span
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="text-[11px] font-medium text-rose-400 flex items-center justify-center gap-1.5"
              >
                <ShieldAlert size={12} /> {errorMsg}
              </motion.span>
            )}
            {isSuccess && (
              <motion.span
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[11px] font-bold text-emerald-400 flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 size={12} /> Akses Diterima. Selamat Datang! ❤️
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Custom Numeric Keypad */}
        <div className="grid grid-cols-3 gap-x-5 gap-y-4 w-full px-4 mb-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="w-16 h-16 rounded-full bg-white/5 border border-white/5 flex items-center justify-center font-bold text-lg text-white hover:bg-white/15 active:scale-95 transition-all outline-none mx-auto cursor-pointer"
            >
              {num}
            </button>
          ))}
          {/* Backspace button */}
          <button
            onClick={handleBackspace}
            className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-xs font-semibold text-white/60 hover:bg-white/15 active:scale-95 transition-all outline-none mx-auto cursor-pointer"
          >
            HAPUS
          </button>
          {/* Zero key */}
          <button
            onClick={() => handleKeyPress('0')}
            className="w-16 h-16 rounded-full bg-white/5 border border-white/5 flex items-center justify-center font-bold text-lg text-white hover:bg-white/15 active:scale-95 transition-all outline-none mx-auto cursor-pointer"
          >
            0
          </button>
          {/* Reset setting / setup-trigger key (only in enter mode to let them re-configure if desired) */}
          <button
            onClick={() => {
              if (confirm('Atur ulang PIN aplikasi?')) {
                sounds.shutterClick();
                setMode('setup_1');
                setInputVal('');
                setErrorMsg('');
              }
            }}
            title="Reset PIN"
            className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/55 hover:bg-white/15 active:scale-95 transition-all outline-none mx-auto cursor-pointer"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Subtle romantic watermark */}
        <span className="text-[9px] text-white/20 font-mono tracking-[4px] uppercase mt-8">
          NAURAA x FARSYA
        </span>
      </motion.div>
    </div>
  );
};
