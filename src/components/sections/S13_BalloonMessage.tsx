import { AnimatePresence, motion } from 'framer-motion';
import { Send } from 'lucide-react';
import React, { useState } from 'react';
import { sounds } from '../../lib/sounds';
import { GlassCard } from '../GlassCard';

export const S13_BalloonMessage: React.FC = () => {
  const [message, setMessage] = useState('');
  const [balloons, setBalloons] = useState<{id:number, text:string, left:number, color:string}[]>([]);
  const [hasSent, setHasSent] = useState(false);
  const [balloonId, setBalloonId] = useState(0);

  const colors = ['#EBC2C6', '#D6C2E8', '#B7E3E0', '#F5C2A0'];

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!message.trim()) return;

    sounds.clickSound();
    
    setBalloons(prev => [...prev, {
      id: balloonId,
      text: message,
      left: 10 + Math.random() * 80, // 10% to 90%
      color: colors[Math.floor(Math.random() * colors.length)]
    }]);
    
    setBalloonId(b => b + 1);
    setMessage('');
    
    if (!hasSent) {
      setTimeout(() => setHasSent(true), 3000);
    }
  };

  return (
    <div className="w-full max-w-[600px] h-[600px] relative rounded-[28px] overflow-hidden shadow-[var(--shadow-card)] border border-[var(--border-glass)] flex flex-col bg-[#0A0A0E]">
       {/* Sky Area */}
       <div className="absolute top-0 left-0 w-full h-[480px] bg-gradient-to-b from-[#050520] via-[#0D0D35] to-[#1A1A2A] overflow-hidden">
          {/* Stars */}
          <div className="absolute inset-0 z-0">
             {Array.from({length: 60}).map((_, i) => (
                <div 
                   key={i} 
                   className="absolute bg-white rounded-full bg-opacity-60"
                   style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      width: `${1 + Math.random()}px`,
                      height: `${1 + Math.random()}px`,
                      animation: `pulse ${2 + Math.random() * 3}s infinite alternate`
                   }}
                />
             ))}
          </div>

          {/* Moon */}
          <div className="absolute top-10 right-10 w-[50px] h-[50px] rounded-full bg-[rgba(235,194,198,0.1)] shadow-[0_0_20px_rgba(235,194,198,0.15)] pointer-events-none z-0" />
          
          {/* Balloons */}
          <AnimatePresence>
             {balloons.map(b => (
                <motion.div
                  key={b.id}
                  initial={{ y: 500, x: 0, opacity: 0, scale: 0.8 }}
                  animate={{ 
                    y: -150, 
                    x: [(Math.random()-0.5)*20, (Math.random()-0.5)*20, (Math.random()-0.5)*20], 
                    opacity: 1, 
                    scale: 1 
                  }}
                  transition={{ 
                    y: { duration: 8 + Math.random() * 4, ease: "linear" },
                    x: { duration: 3, repeat: Infinity, repeatType: 'mirror', ease: "easeInOut" },
                    opacity: { duration: 0.5 }
                  }}
                  className="absolute z-10 flex flex-col items-center"
                  style={{ left: `${b.left}%` }}
                >
                   {/* Balloon Shape */}
                   <div 
                     className="w-[80px] h-[100px] rounded-[50%_50%_50%_50%/40%_40%_60%_60%] relative shadow-[inset_-10px_-10px_20px_rgba(0,0,0,0.2)]"
                     style={{ backgroundColor: b.color }}
                   >
                      <div className="absolute top-[15%] left-[20%] w-[15px] h-[30px] rounded-full bg-white opacity-20 rotate-[-15deg]" />
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px]" style={{ borderBottomColor: b.color }} />
                   </div>
                   
                   {/* String */}
                   <svg width="20" height="60" viewBox="0 0 20 60" className="mt-2 text-white/30">
                      <path d="M10,0 C20,20 0,40 10,60" fill="none" stroke="currentColor" strokeWidth="1" />
                   </svg>
                   
                   {/* Message Tag */}
                   <div className="absolute top-[60px] max-w-[120px] bg-white text-[#1A0A0C] text-[10px] p-2 rounded shadow-md z-20 font-medium">
                      {b.text}
                   </div>
                </motion.div>
             ))}
          </AnimatePresence>

          {/* Hint */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
             {balloons.length === 0 && (
                <p className="text-[14px] text-[var(--text-secondary)] bg-[rgba(10,10,14,0.5)] px-4 py-2 rounded-full backdrop-blur-sm">
                   Terbangkan pesan rahasiamu ke langit
                </p>
             )}
          </div>
       </div>

       {/* Input Area */}
       <div className="absolute bottom-0 left-0 w-full h-[120px] bg-[rgba(25,25,40,0.95)] backdrop-blur-lg p-5 z-30 flex gap-4 items-center">
          <form onSubmit={handleSend} className="w-full relative flex items-center">
             <textarea 
               value={message}
               onChange={e => setMessage(e.target.value)}
               maxLength={150}
               rows={2}
               placeholder="Tulis pesan romantis di sini..."
               className="w-full bg-[rgba(255,255,255,0.05)] border-[1.5px] border-[var(--border-glass)] rounded-[20px] p-[14px] pr-[100px] text-[14px] text-[var(--text-primary)] resize-none focus:outline-none focus:border-[#EBC2C6] transition-colors"
             />
             <div className="absolute right-[65px] text-[11px] text-[var(--text-secondary)]">
                {message.length}/150
             </div>
             <button 
                type="submit"
                disabled={!message.trim()}
                className="absolute right-3 w-[40px] h-[40px] rounded-full bg-[image:var(--gradient-btn)] flex items-center justify-center text-[#1A0A0C] hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
             >
                <Send size={18} />
             </button>
          </form>
       </div>
    </div>
  );
};
