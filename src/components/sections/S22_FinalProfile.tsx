'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useSpring, useTransform, useMotionValue, useInView } from 'framer-motion';
import { 
  Heart, Calendar, Star, Trophy, Crown, Gift, Moon, Music, Leaf, Share2, 
  Expand, X, Check, Clock, Puzzle, ChevronLeft, ChevronRight, CheckCircle2, Image as ImageIcon,
  ZoomIn, ZoomOut, RotateCcw, ArrowLeft, Compass, Camera,
  Mic, Send, Volume2, Play, Pause, Trash2, ShieldAlert, Sparkles, Wifi, WifiOff
} from 'lucide-react';
import { useAppStore } from '../../lib/store';
import { sounds } from '../../lib/sounds';
import { 
  syncMessages, 
  sendMessage, 
  syncMoods, 
  logMood, 
  isFirebaseLive,
  clearLocalMoods,
  uploadVoiceNoteToStorage 
} from '../../lib/firebase';

// ----------------------------------------------------------------------
// LIGHTBOX CONTEXT FOR PAGE-WIDE GALLERY ACTION
// ----------------------------------------------------------------------
const LightboxContext = React.createContext<{
  open: (list: { u: string; l: string; c?: string }[], index: number) => void;
} | null>(null);

export const useLightbox = () => {
  const ctx = React.useContext(LightboxContext);
  if (!ctx) return { open: () => {} };
  return ctx;
};

// ----------------------------------------------------------------------
// DATA PRIBADI - HARDCODED
// ----------------------------------------------------------------------

const FloatingHearts = () => {
  const [hearts, setHearts] = useState<{ id: number; left: number; delay: number; size: number; duration: number }[]>([]);

  useEffect(() => {
    const newHearts = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      size: 10 + Math.random() * 20,
      duration: 10 + Math.random() * 15,
    }));
    setHearts(newHearts);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {hearts.map((h) => (
        <motion.div
          key={h.id}
          initial={{ y: '100vh', opacity: 0, x: 0 }}
          animate={{ 
            y: '-10vh', 
            opacity: [0, 0.4, 0.4, 0],
            x: [0, Math.random() * 40 - 20, Math.random() * 40 - 20, 0]
          }}
          transition={{
            duration: h.duration,
            repeat: Infinity,
            delay: h.delay,
            ease: 'linear'
          }}
          className="absolute text-[#EBC2C6]"
          style={{ left: `${h.left}%` }}
        >
          <Heart size={h.size} fill="currentColor" stroke="none" opacity={0.5} />
        </motion.div>
      ))}
    </div>
  );
};

const NAURA = {
  fullName: "Nauraa Rayyani Ayu",
  nickname: "Nauraa",
  birthdate: new Date("2008-03-16"),
  zodiac: "Pisces",
  zodiacSymbol: "♓",
  zodiacElement: "Water",
  mbti: "INFP",
  favoriteFood: "Cokelat",
  favoriteColor: "#EBC2C6",
  favoriteNumber: 24,
  hobbies: ["Mendengarkan musik", "Membaca", "Menulis"],
  photos: [
    "https://files.catbox.moe/jw0yc8.jpg",
    "https://files.catbox.moe/8gtes8.jpg",
    "https://files.catbox.moe/bi3lvs.jpg",
    "https://files.catbox.moe/oz67un.jpg",
  ],
  quote: "Lembut seperti air, dalam seperti samudra",
};

const FARSYA = {
  fullName: "Farsya Zahri",
  nickname: "Farsya",
  birthdate: new Date("2007-01-17"),
  zodiac: "Capricorn",
  zodiacSymbol: "♑",
  zodiacElement: "Earth",
  mbti: "ENFJ",
  favoriteAnimal: "Kucing",
  favoriteColor: "#D6C2E8",
  favoriteNumber: 17,
  hobbies: ["Musik", "Fotografi", "Gaming"],
  photos: [
    "https://files.catbox.moe/tz9k37.jpg",
    "https://files.catbox.moe/23m8rg.jpg",
    "https://files.catbox.moe/0l6k8r.jpg",
  ],
  quote: "Kuat seperti bumi, hangat seperti matahari",
};

const RELATIONSHIP = {
  startDate: new Date("2026-03-24T00:00:00"),
  firstSong: "Last Night On Earth — Green Day",
  firstSongUrl: "https://open.spotify.com/track/5TpPSTItCwtZ8Sltr3vdzm",
  firstPromise: "Chat tengah malam",
  password: "24526",
  milestones: [
    { date: new Date("2026-03-24"), label: "Hari Jadian",       icon: "heart",    color: "#EBC2C6" },
    { date: new Date("2026-04-24"), label: "1 Bulan",           icon: "calendar", color: "#D6C2E8" },
    { date: new Date("2026-06-24"), label: "3 Bulan",           icon: "star",     color: "#B7E3E0" },
    { date: new Date("2026-09-24"), label: "6 Bulan",           icon: "trophy",   color: "#E8D5A3" },
    { date: new Date("2027-03-24"), label: "1 Tahun",           icon: "crown",    color: "#EBC2C6" },
    { date: new Date("2027-03-16"), label: "Ultah Nauraa ke-19", icon: "gift",     color: "#EBC2C6" },
    { date: new Date("2027-01-17"), label: "Ultah Farsya ke-20",icon: "gift",     color: "#D6C2E8" },
  ]
};

const MEMORIES = [
  {
    id: 1, icon: "moon", color: "#D6C2E8", title: "Chat Tengah Malam", date: "24 Maret 2026",
    description: "Kata-kata yang mengalir jujur di tengah malam — awal dari segalanya.",
  },
  {
    id: 2, icon: "music", color: "#EBC2C6", title: "Last Night On Earth", date: "Hari-hari pertama",
    description: "Green Day menemani momen terdiam yang paling bermakna.",
  },
  {
    id: 3, icon: "heart", color: "#F0A0B0", title: "Pertama Bilang Sayang", date: "Maret 2026",
    description: "Farsya memberanikan diri — dan dunia terasa berubah seketika.",
  },
  {
    id: 4, icon: "star", color: "#E8D5A3", title: "Satu Bulan", date: "24 April 2026",
    description: "Satu bulan yang mengajarkan banyak tentang arti hadir.",
  },
  {
    id: 5, icon: "leaf", color: "#B7E3E0", title: "Janji Pertama", date: "Maret 2026",
    description: "Bukan di tempat mewah, tapi di percakapan yang paling tulus.",
  },
];

const BUCKET_PREVIEW = [
  { text: "Nonton konser Green Day bersama",     done: false, color: "#EBC2C6" },
  { text: "Pergi ke pantai berdua",              done: false, color: "#B7E3E0" },
  { text: "Foto bareng di tempat yang indah",    done: false, color: "#D6C2E8" },
  { text: "Merayakan anniversary pertama",       done: false, color: "#E8D5A3" },
  { text: "Membuat playlist musik bersama",      done: true,  color: "#B7E3E0" },
];

const TOGETHER_PHOTOS = [
  { url: "https://files.catbox.moe/hz15xh.jpg",  caption: "Awal segalanya" },
  { url: "https://files.catbox.moe/a5cwnq.jpg",  caption: "Selalu berdua" },
  { url: "https://files.catbox.moe/cd7qiw.jpg",  caption: "Momen manis" },
  { url: "https://files.catbox.moe/cd7qiw.jpg",  caption: "Hari yang indah" },
  { url: "https://files.catbox.moe/6saptd.jpg",  caption: "Cerita kita" },
  { url: "https://files.catbox.moe/6saptd.jpg",  caption: "Kenangan berharga" },
  { url: "https://files.catbox.moe/7u0c5e.jpg",  caption: "Waktu terbaik" },
  { url: "https://files.catbox.moe/9vbkfx.png",  caption: "Berdua saja cukup" },
  { url: "https://files.catbox.moe/p6rdun.png",  caption: "Tawa tanpa sebab" },
  { url: "https://files.catbox.moe/tq19sh.png",  caption: "Ini milik kita" },
  { url: "https://files.catbox.moe/nj7fze.jpg",  caption: "Selamanya" },
];

export interface GameScores {
  triviaScore: number;
  memoryMoves: number;
  catchCount: number;
  meteorScore: number;
  puzzleMoves: number;
  petHappiness: number;
}

export interface S_CoupleProfileProps {
  gameScores?: GameScores;
  onRestart?: () => void;
}

// ----------------------------------------------------------------------
// COMPONENTS
// ----------------------------------------------------------------------

const AnimatedSection = ({ children, id, variant = 'fadeUp', delay = 0 }: { children: React.ReactNode, id?: string, variant?: 'fadeUp' | 'fadeLeft' | 'fadeRight' | 'scaleUp', delay?: number }) => {
  const v = {
    fadeUp: { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 } },
    fadeLeft: { initial: { opacity: 0, x: -30 }, whileInView: { opacity: 1, x: 0 } },
    fadeRight: { initial: { opacity: 0, x: 30 }, whileInView: { opacity: 1, x: 0 } },
    scaleUp: { initial: { opacity: 0, scale: 0.95, y: 20 }, whileInView: { opacity: 1, scale: 1, y: 0 } }
  };
  return (
    <motion.div
      id={id}
      initial={v[variant].initial}
      whileInView={v[variant].whileInView}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: [0.34, 1.2, 0.64, 1], delay }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
};

const Photo = ({ src, eager = false, className = '', onClick }: any) => {
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState(false);
  
  if (err) return (
    <div className={`flex flex-col items-center justify-center bg-[rgba(235,194,198,0.08)] border border-dashed border-[rgba(235,194,198,0.2)] ${className} cursor-pointer`} onClick={onClick}>
      <Heart size={20} className="text-[#EBC2C6] opacity-30 mb-1" />
      <span className="text-[9px] text-[#9A9AB0] px-2 text-center font-mono">FOTO TIDAK TERSEDIA</span>
    </div>
  );
  
  // High-fidelity inline SVG to serve as a micro-blurred base64 loading-placeholder backdrop.
  const lowResSvgBlurBg = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100%25' height='100%25' fill='%23111118'/%3E%3Ccircle cx='50' cy='50' r='45' fill='%23EBC2C6' filter='blur(20px)' opacity='0.15'/%3E%3Ccircle cx='30' cy='40' r='25' fill='%23D6C2E8' filter='blur(15px)' opacity='0.1'/%3E%3C/svg%3E";

  return (
    <div className={`relative overflow-hidden ${className}`} onClick={onClick}>
      {!loaded && (
        <div 
          className="absolute inset-0 rounded-inherit flex flex-col items-center justify-center bg-cover bg-center transition-opacity duration-500 ease-out z-10"
          style={{ 
            backgroundImage: `url("${lowResSvgBlurBg}")`,
            backgroundColor: '#111118'
          }}
        >
          {/* Descriptive sweet heart loader */}
          <div className="flex flex-col items-center gap-1.5 select-none text-center px-4 animate-pulse">
            <div className="p-2 bg-white/5 rounded-full border border-white/5 shadow-md">
              <Heart size={16} className="text-[#EBC2C6]/80" fill="currentColor" />
            </div>
            <span className="text-[8px] font-mono tracking-[0.2em] font-semibold text-[#EBC2C6]/90 uppercase">Memuat Foto</span>
          </div>

          {/* Shimmer glaze focus overlay */}
          <div 
            className="absolute inset-0 pointer-events-none" 
            style={{ 
              background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0) 100%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 2s ease-in-out infinite'
            }} 
          />
        </div>
      )}
      <img 
        src={src} 
        loading={eager ? "eager" : "lazy"} 
        referrerPolicy="no-referrer"
        className={`w-full h-full object-cover transition-all duration-700 ease-out ${loaded ? 'scale-100 opacity-100 blur-0' : 'scale-105 opacity-0 blur-md'}`} 
        onLoad={() => setLoaded(true)} 
        onError={() => setErr(true)} 
      />
    </div>
  );
};

const GlassCard = ({ children, className = '' }: any) => (
  <div className={`glass-card ${className}`}>
    {children}
  </div>
);

// 1. HeroCouple
const HeroCouple = ({ now }: { now: Date }) => {
  const diffTime = now.getTime() - RELATIONSHIP.startDate.getTime();
  const d = Math.floor(diffTime / 86400000);
  const h = Math.floor((diffTime % 86400000) / 3600000);
  const m = Math.floor((diffTime % 3600000) / 60000);
  const s = Math.floor((diffTime % 60000) / 1000);
  const { open } = useLightbox();

  const handleOpenNaura = () => {
    sounds.sparkleChime();
    open(NAURA.photos.map(u => ({ u, l: 'Nauraa Rayyani Ayu', c: 'Senyum manis Nauraa Rayyani Ayu' })), 0);
  };

  const handleOpenFarsya = () => {
    sounds.sparkleChime();
    open(FARSYA.photos.map(u => ({ u, l: 'Farsya Zahri', c: 'Tatapan hangat Farsya' })), 0);
  };

  return (
    <div className="hero-section flex flex-col items-center">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="hero-label">
        LOVE JOURNEY
      </motion.div>
      <div className="hero-avatars">
        <motion.div 
          initial={{ x: -20, opacity: 0 }} 
          animate={{ x: 0, opacity: 1 }} 
          transition={{ delay: 0.2 }} 
          className="hero-avatar hero-avatar-left overflow-hidden cursor-zoom-in hover:scale-105 active:scale-95 transition-all"
          onClick={handleOpenNaura}
        >
          <Photo src={NAURA.photos[0]} eager className="w-full h-full object-cover" />
        </motion.div>
        <motion.div 
          animate={{ scale: [1, 1.18, 1] }} 
          style={{ x: '-50%', y: '-50%' }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }} 
          className="hero-heart"
        >
          <Heart size={14} className="fill-[#EBC2C6] text-[#EBC2C6]" />
        </motion.div>
        <motion.div 
          initial={{ x: 20, opacity: 0 }} 
          animate={{ x: 0, opacity: 1 }} 
          transition={{ delay: 0.3 }} 
          className="hero-avatar hero-avatar-right overflow-hidden cursor-zoom-in hover:scale-105 active:scale-95 transition-all"
          onClick={handleOpenFarsya}
        >
          <Photo src={FARSYA.photos[0]} eager className="w-full h-full object-cover" />
        </motion.div>
      </div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="hero-names">
        Nauraa & Farsya
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="hero-date">
        Bersama sejak 24 Maret 2026
      </motion.div>
      <div className="hero-counter">
        {[ { v: d, l: 'HARI' }, { v: h, l: 'JAM' }, { v: m, l: 'MNT' }, { v: s, l: 'DTK' } ].map((item, idx) => (
          <div key={idx} className="hero-counter-unit">
            <motion.div key={item.v} initial={{ y: -4, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="hero-counter-number">{item.v}</motion.div>
            <div className="hero-counter-label">{item.l}</div>
          </div>
        ))}
      </div>
      <div className="hero-status-badge">
        <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="hero-status-dot" />
        Sedang Pacaran
      </div>
    </div>
  );
};

// 2. StreakCounter
const StreakCounter = ({ now }: { now: Date }) => {
  const days = Math.floor((now.getTime() - RELATIONSHIP.startDate.getTime()) / 86400000);
  const mv = useMotionValue(0);
  const ms = useSpring(mv, { stiffness: 80, damping: 15 });
  const [disp, setDisp] = useState(0);

  useEffect(() => { mv.set(days); }, [days, mv]);
  useEffect(() => { const sub = ms.on('change', v => setDisp(Math.floor(v))); return sub; }, [ms]);

  const prog = (days % 30) / 30;
  const rem = 30 - (days % 30);

  return (
    <GlassCard className="relative overflow-hidden">
      <div className="flex justify-between items-center mb-4 relative z-10">
        <span className="text-[14px] font-semibold">Streak Bersama</span>
        <div className="flex items-center gap-1.5 bg-[#B7E3E0]/20 px-2 py-0.5 rounded-full text-[#B7E3E0] text-[10px] font-bold">
          <motion.div animate={{ opacity: [1,0.5,1] }} transition={{ duration:1, repeat:Infinity }} className="w-1.5 h-1.5 rounded-full bg-[#B7E3E0]" />
          AKTIF
        </div>
      </div>
      
      <div className="flex flex-col items-center justify-center relative mt-6 mb-2">
        <div className="relative w-[180px] h-[180px] flex flex-col items-center justify-center">
          <svg width="180" height="180" viewBox="0 0 180 180" className="streak-ring-svg absolute inset-0 -rotate-90 drop-shadow-[0_0_15px_rgba(235,194,198,0.2)]">
            <circle cx="90" cy="90" r="80" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
            <motion.circle cx="90" cy="90" r="80" fill="none" stroke="#EBC2C6" strokeWidth="6" strokeLinecap="round" 
              strokeDasharray={502} strokeDashoffset={502 - (502 * prog)} 
              initial={{ strokeDashoffset: 502 }} animate={{ strokeDashoffset: 502 - (502 * prog) }} transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </svg>
          <div className="streak-number text-[72px] font-black tracking-tighter text-transparent bg-clip-text leading-none relative z-10 flex items-center" style={{ backgroundImage: 'linear-gradient(to right, #EBC2C6, #D6C2E8)', overflow: 'visible' }}>
            {disp}
            {days >= 7 && (
              <motion.div animate={{ scale: [1, 1.15, 0.95, 1.1, 1] }} transition={{ duration: 0.8, repeat: Infinity }} className="absolute -right-5 top-2 text-[#EBC2C6]">
                <Heart size={20} className="fill-[#EBC2C6] text-[#EBC2C6]" />
              </motion.div>
            )}
          </div>
          <div className="text-[12px] text-[#5A5A70] font-medium mt-2 z-10">hari berturut-turut</div>
        </div>
        
        <div className="text-[11px] text-[#9A9AB0] mt-4 z-10">Menuju 30 hari berikutnya: {rem} hari lagi</div>
      </div>

      <div className="streak-milestones">
        {[{ d: 7, l: "1 Mgg", c: "#B7E3E0" }, { d: 14, l: "2 Mgg", c: "#D6C2E8" }, { d: 30, l: "1 Bln", c: "#EBC2C6" }, { d: 90, l: "3 Bln", c: "#E8D5A3" }, { d: 365, l: "1 Thn", c: "#F0A0B0" }].map((m, i) => {
          const ach = days >= m.d;
          return (
            <motion.div key={i} initial={ach ? { scale: 0 } : {}} animate={ach ? { scale: [1, 1.1, 1] } : {}} transition={{ delay: i * 0.1 }}
              className={`streak-badge flex flex-col items-center justify-center`}
              style={ach ? { background: m.c } : { background: 'transparent', border: '1px dashed rgba(255,255,255,0.15)' }}
            >
              <span className={`text-[11px] whitespace-nowrap ${ach ? 'font-semibold text-[#1A0A0C]' : 'font-normal text-white/40'}`}>{m.l}</span>
              {!ach && <span className="streak-badge-sublabel text-[#9A9AB0]">{m.d - days} hr lagi</span>}
            </motion.div>
          );
        })}
      </div>
    </GlassCard>
  );
};

// 3. ProfileCards
const ProfileCards = ({ now }: { now: Date }) => {
  const [tab, setTab] = useState<'Nauraa' | 'Farsya'>('Nauraa');
  const [activePhoto, setActivePhoto] = useState(0);
  const d = tab === 'Nauraa' ? NAURA : FARSYA;
  const col = d.favoriteColor;
  const { open } = useLightbox();

  const handleZoomProfile = () => {
    sounds.shutterClick();
    open(d.photos.map(u => ({ u, l: d.fullName, c: `Koleksi foto terbaik ${d.nickname}` })), activePhoto);
  };

  return (
    <div>
      <div className="profile-tabs flex justify-center">
        {['Nauraa', 'Farsya'].map(name => (
          <div key={name} onClick={() => { sounds.heartbeat(); setTab(name as any); setActivePhoto(0); }} className={`profile-tab relative font-semibold ${tab === name ? 'active' : ''}`}>
            {tab === name && (
              <motion.div layoutId="tab-p" className="absolute inset-0 rounded-full z-0" style={{ backgroundImage: `linear-gradient(135deg, ${col}, #D6C2E8)`, opacity: 0.9 }} />
            )}
            <span className={`relative z-10 ${tab === name ? 'text-[#1A0A0C]' : 'text-[#9A9AB0]'}`}>{name}</span>
          </div>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, x: tab === 'Nauraa' ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: tab === 'Nauraa' ? 20 : -20 }} transition={{ duration: 0.25 }}>
          <GlassCard>
            <div className="flex flex-col gap-4 mb-5">
              <div 
                className="profile-photo-main overflow-hidden border-[1.5px] shadow-[0_8px_24px_rgba(0,0,0,0.3)] bg-white/5 relative cursor-zoom-in hover:brightness-105 transition-all" 
                style={{ borderColor: `${col}40` }}
                onClick={handleZoomProfile}
              >
                <AnimatePresence mode="wait">
                  <motion.div key={activePhoto} initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.3, ease: 'easeOut' }} className="absolute inset-0">
                    <Photo src={d.photos[activePhoto]} className="w-full h-full object-cover object-top" />
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="profile-thumbs">
                {d.photos.map((p, i) => (
                  <motion.div key={i} whileHover={{ opacity: 0.85, scale: 1.0 }} 
                    onClick={() => { sounds.clickSound(); setActivePhoto(i); }}
                    className={`profile-thumb ${activePhoto === i ? 'active' : 'inactive'}`}
                    style={{ 
                      borderColor: activePhoto === i ? col : 'rgba(255,255,255,0.08)',
                    }}>
                    <Photo src={p} className="w-full h-full object-cover object-top" />
                  </motion.div>
                ))}
              </div>

              <div className="mt-2">
                <h3 className="text-[22px] font-bold">{d.fullName}</h3>
                <div className="flex gap-2 mt-2">
                  <div className="px-3 py-1 rounded-full text-[11px] font-medium border" style={{ background: `${col}15`, borderColor: `${col}40`, color: col }}>
                    {d.zodiacSymbol} {d.zodiac}
                  </div>
                  <div className="px-3 py-1 rounded-full text-[11px] font-medium border border-white/10 bg-white/5">
                    {d.mbti}
                  </div>
                </div>
              </div>
            </div>

            <div className="profile-data-grid">
              {[
                { i: <Calendar size={16}/>, l: 'Tanggal Lahir', v: d.birthdate.toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'}) },
                { i: <Star size={16}/>, l: 'Zodiak', v: `${d.zodiac} (${d.zodiacElement})` },
                { i: <Puzzle size={16}/>, l: 'MBTI', v: d.mbti },
                { i: <Heart size={16}/>, l: tab === 'Nauraa' ? 'Makanan Fav' : 'Hewan Fav', v: tab === 'Nauraa' ? NAURA.favoriteFood : FARSYA.favoriteAnimal },
                { i: <Gift size={16} color={col}/>, l: 'Ultah', v: (() => {
                  const b = new Date(now.getFullYear(), d.birthdate.getMonth(), d.birthdate.getDate());
                  if (now > b) b.setFullYear(b.getFullYear() + 1);
                  return Math.ceil((b.getTime() - now.getTime()) / 86400000) + " Hari Lagi";
                })() },
                { i: <Moon size={16}/>, l: 'Favorit', v: `Angka Fav: ${d.favoriteNumber}` },
              ].map((it, idx) => (
                <div key={idx} className="profile-data-cell">
                  <div className="profile-data-icon">{it.i}</div>
                  <div className="profile-data-value">{it.v}</div>
                  <div className="profile-data-label">{it.l}</div>
                </div>
              ))}
            </div>

            <div className="p-3 pl-4 rounded-xl mb-4 text-[13px] italic text-[#9A9AB0] border-l-[3px] bg-white/5" style={{ borderColor: col }}>
              "{d.quote}"
            </div>

            <details className="group" onToggle={(e) => { if ((e.target as HTMLDetailsElement).open) { sounds.softPluck(); } }}>
              <summary className="text-[14px] font-semibold outline-none cursor-pointer flex justify-between items-center py-2 text-[#EBC2C6]" onClick={() => sounds.softPluck()}>
                Fakta Unik
                <ChevronRight className="transform group-open:rotate-90 transition-transform w-4 h-4" />
              </summary>
              <ul className="pl-4 mt-2 mb-2 text-[13px] text-[#9A9AB0] space-y-2 list-disc marker:text-[#5A5A70]">
                {tab === 'Nauraa' ? [
                  "Pertama ngobrol lewat chat tengah malam",
                  "Paling suka kalau diperhatiin hal kecil",
                  "Zodiac air yang selalu mengalir tenang",
                  "Cokelat adalah bahasa cintanya"
                ].map((f, i) => <li key={i}>{f}</li>) : [
                  "Yang pertama kali bilang sayang",
                  "Kucing adalah hewan paling dimengerti",
                  "Green Day menemani momen paling berani",
                  "Capricorn yang diam-diam sangat perhatian"
                ].map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </details>
          </GlassCard>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const CountUpNum = ({ value }: { value: number }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const mv = useMotionValue(0);
  const ms = useSpring(mv, { stiffness: 60, damping: 15 });
  const [disp, setDisp] = useState(0);

  useEffect(() => { 
    if (inView) mv.set(value); 
  }, [value, inView, mv]);
  
  useEffect(() => { 
    return ms.on('change', v => setDisp(Math.round(v))); 
  }, [ms]);

  return <span ref={ref}>{disp.toLocaleString('id-ID')}</span>;
};

// 4. RelationshipStats
const RelationshipStats = ({ now }: { now: Date }) => {
  const diff = now.getTime() - RELATIONSHIP.startDate.getTime();
  const d = Math.floor(diff / 86400000);
  const sec = Math.floor(diff / 1000);
  
  return (
    <GlassCard className="cursor-pointer" onClick={() => sounds.softPluck()}>
      <h3 className="text-[16px] font-bold mb-4">Statistik Kita</h3>
      <div className="stats-grid">
        {[
          { l: "Hari Bersama", v: d, i: <Calendar size={20} className="text-[#EBC2C6]"/>, c: "#EBC2C6" },
          { l: "Jam Dilalui", v: (d * 24), i: <Clock size={20} className="text-[#D6C2E8]"/>, c: "#D6C2E8" },
          { l: "Menit Berharga", v: (d * 24 * 60), i: <Star size={20} className="text-[#B7E3E0]"/>, c: "#B7E3E0" },
          { l: "Detik Cinta", v: sec, i: <Heart size={20} className="text-[#F0A0B0]"/>, c: "#F0A0B0", anim: true },
        ].map((s, i) => (
          <div key={i} className="stat-cell">
            <div className="mb-2 opacity-80">{s.i}</div>
            <motion.div 
              key={s.l} 
              initial={s.anim ? { y: -5, opacity: 0.5 } : {}} 
              animate={{ y: 0, opacity: 1 }} 
              className="stat-number" 
              style={{ 
                color: s.c,
                fontSize: s.v.toLocaleString('id-ID').length >= 9 
                  ? '15px' 
                  : s.v.toLocaleString('id-ID').length >= 7 
                    ? '19px' 
                    : s.v.toLocaleString('id-ID').length >= 5 
                      ? '23px' 
                      : '28px',
                overflow: 'visible',
                textOverflow: 'unset',
                whiteSpace: 'nowrap'
              }}
            >
              <CountUpNum value={s.v} />
            </motion.div>
            <div className="stat-label">{s.l}</div>
          </div>
        ))}
      </div>
      <div className="stats-footer">
        <div className="stats-footer-item"><Moon size={12}/> Pertama kali bicara: Chat tengah malam</div>
        <div className="stats-footer-item"><Music size={12}/> Lagu pertama: Last Night On Earth</div>
      </div>
    </GlassCard>
  );
};

// 5. MilestoneTimeline
const MilestoneTimeline = ({ now }: { now: Date }) => {
  return (
    <GlassCard>
      <h3 className="text-[16px] font-bold mb-4">Perjalanan Milestone</h3>
      <div className="milestone-list">
        {RELATIONSHIP.milestones.map((m, i) => {
          const isPast = m.date.getTime() < now.getTime();
          const isToday = m.date.toDateString() === now.toDateString();
          const diff = Math.ceil((m.date.getTime() - now.getTime()) / 86400000);
          
          return (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, x: -10 }} 
              whileInView={{ opacity: 1, x: 0 }} 
              viewport={{ once: true, amount: 0.2 }} 
              transition={{ delay: 0.1, duration: 0.5, ease: 'easeOut' }} 
              className="milestone-item relative cursor-pointer hover:bg-white/[0.02] p-1.5 rounded-lg transition-colors"
                onClick={() => {
                  if (isPast) {
                    sounds.successSound();
                  } else {
                    sounds.softPluck();
                  }
                }}
            >
              <div className="milestone-dot" style={isPast || isToday ? { background: m.color, boxShadow: `0 0 8px ${m.color}` } : { border: `2px solid ${m.color}80`, background: '#12121A' }}>
                {isPast ? <Check size={10} className="text-black" /> : isToday ? <motion.div animate={{ scale: [1,1.5,1] }} transition={{ duration:1, repeat:Infinity }} className="w-2 h-2 rounded-full border border-white" /> : <span className="text-[8px] text-white/50">?</span>}
              </div>
              <div className="milestone-content">
                <div className="milestone-title-row">
                  <h4 className="milestone-title font-bold">{m.label}</h4>
                  <span className="milestone-badge text-[9px] px-2 py-0.5 rounded-full font-semibold" style={{ background: `${m.color}15`, color: m.color }}>
                    {isToday ? "HARI INI!" : isPast ? "Sudah Lewat" : `${diff} Hari Lagi`}
                  </span>
                </div>
                <div className="milestone-date">{m.date.toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}</div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </GlassCard>
  );
};

// 6. NextEventCountdown
const NextEventCountdown = ({ now }: { now: Date }) => {
  const nextEv = [...RELATIONSHIP.milestones].filter(m => m.date > now).sort((a,b) => a.date.getTime() - b.date.getTime())[0];
  if (!nextEv) return null;

  const totalDuration = 30 * 86400000; 
  const diffTime = nextEv.date.getTime() - now.getTime();
  const d = Math.floor(diffTime / 86400000);
  const h = Math.floor((diffTime % 86400000) / 3600000);
  const m = Math.floor((diffTime % 3600000) / 60000);
  const s = Math.floor((diffTime % 60000) / 1000);
  const prog = Math.max(0, 1 - (diffTime / totalDuration));

  return (
    <div 
      onClick={() => sounds.sparkleChime()}
      className="p-7 rounded-[28px] border relative overflow-hidden cursor-pointer hover:scale-[1.01] transition-transform duration-300" 
      style={{ background: 'rgba(235,194,198,0.06)', borderColor: 'rgba(235,194,198,0.2)' }}
    >
      <div className="text-center">
        <div className="text-[10px] uppercase tracking-[3px] text-[#5A5A70] mb-1">EVENT SELANJUTNYA</div>
        <div className="text-[22px] font-bold text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #EBC2C6, #D6C2E8)' }}>{nextEv.label}</div>
        <div className="text-[13px] text-[#9A9AB0] mt-1">{nextEv.date.toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}</div>
      </div>

      <div className="countdown-units mt-6">
        {[ { v: d, l: 'HARI' }, { v: h, l: 'JAM' }, { v: m, l: 'MNT' }, { v: s, l: 'DTK', anim: true } ].map((item, idx) => (
          <div key={idx} className="countdown-unit">
            <motion.div key={item.anim ? item.v : 'static'} initial={item.anim ? { y: -8, opacity: 0.5 } : {}} animate={{ y: 0, opacity: 1 }} className="countdown-number">{item.v}</motion.div>
            <div className="countdown-label">{item.l}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 h-1 w-full bg-white/5 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${prog * 100}%` }} transition={{ duration: 1 }} className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #EBC2C6, #D6C2E8)' }} />
      </div>
    </div>
  );
};

// 7. ZodiacMatch
const ZodiacMatch = () => (
  <GlassCard className="cursor-pointer" onClick={() => sounds.waterDroplet()}>
    <h3 className="text-[16px] font-bold mb-6">Kecocokan Bintang</h3>
    <div className="flex items-center justify-center gap-4 mb-6">
      <motion.div initial={{ x: -20, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} className="flex flex-col items-center">
        <div className="w-[80px] h-[80px] rounded-full flex items-center justify-center shadow-lg" style={{ background: 'radial-gradient(circle at 30% 30%, #B7E3E0, #6AA0A0)' }}>
          <span className="text-[36px] text-white drop-shadow-[0_0_12px_rgba(183,227,224,0.8)]">♓</span>
        </div>
        <span className="text-[12px] font-bold mt-2">Pisces</span>
        <span className="text-[10px] text-[#5A5A70]">Nauraa</span>
      </motion.div>
      <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 3, repeat: Infinity }} className="text-[20px] font-bold text-[#EBC2C6]">×</motion.div>
      <motion.div initial={{ x: 20, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} className="flex flex-col items-center">
        <div className="w-[80px] h-[80px] rounded-full flex items-center justify-center shadow-lg" style={{ background: 'radial-gradient(circle at 30% 30%, #D6C2E8, #9A80B8)' }}>
          <span className="text-[36px] text-white drop-shadow-[0_0_12px_rgba(214,194,232,0.8)]">♑</span>
        </div>
        <span className="text-[12px] font-bold mt-2">Capricorn</span>
        <span className="text-[10px] text-[#5A5A70]">Farsya</span>
      </motion.div>
    </div>

    <div className="relative w-[120px] h-[120px] mx-auto flex flex-col items-center justify-center mb-6">
      <svg width="120" height="120" viewBox="0 0 120 120" className="absolute inset-0 -rotate-90">
        <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" strokeDasharray="314" strokeDashoffset={314 * 0.4} className="origin-center rotate-[144deg]" />
        <motion.circle cx="60" cy="60" r="50" fill="none" stroke="url(#zgrad)" strokeWidth="8" strokeLinecap="round" strokeDasharray="314"
          initial={{ strokeDashoffset: 314 }} whileInView={{ strokeDashoffset: 314 - (314 * 0.87 * 0.6) }} transition={{ duration: 2 }} className="origin-center rotate-[144deg]"
        />
        <defs><linearGradient id="zgrad"><stop offset="0%" stopColor="#EBC2C6"/><stop offset="100%" stopColor="#D6C2E8"/></linearGradient></defs>
      </svg>
      <div className="text-[32px] font-black leading-none bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #EBC2C6, #D6C2E8)' }}>87%</div>
      <div className="text-[8px] text-[#5A5A70] mt-1 text-center leading-tight">KOMPATIBILITAS</div>
    </div>

    <div className="grid grid-cols-2 gap-x-6 gap-y-4 px-2">
      {[ { l: "Komunikasi", v: 94, c: "#EBC2C6" }, { l: "Emosional", v: 88, c: "#D6C2E8" }, { l: "Kepercayaan", v: 96, c: "#B7E3E0" }, { l: "Chemistry", v: 82, c: "#E8D5A3" } ].map((a, i) => (
        <div key={i}>
          <div className="flex justify-between text-[11px] mb-1.5"><span className="text-[#9A9AB0]">{a.l}</span><span className="font-bold">{a.v}%</span></div>
          <div className="h-[4px] bg-white/5 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} whileInView={{ width: `${a.v}%` }} transition={{ delay: i * 0.1, duration: 1 }} className="h-full rounded-full" style={{ background: a.c }} />
          </div>
        </div>
      ))}
    </div>

    <div className="mt-6 border-l-2 border-[#EBC2C6]/30 pl-3 text-[12px] italic text-[#9A9AB0]">
      "Pisces dan Capricorn adalah pasangan yang saling melengkapi — air mengalir menuju bumi, bumi menjaga air agar tidak tersesat."
    </div>
  </GlassCard>
);

// 8. LoveLanguage
const LoveLanguage = () => {
  const [t, setT] = useState<'Nauraa'|'Farsya'>('Nauraa');
  const items = t === 'Nauraa' ? [
    { n: "Words of Affirmation", v: 90 }, { n: "Quality Time", v: 80 }, { n: "Physical Touch", v: 70 }, { n: "Acts of Service", v: 65 }, { n: "Receiving Gifts", v: 55 }
  ] : [
    { n: "Acts of Service", v: 85 }, { n: "Quality Time", v: 88 }, { n: "Words of Affirmation", v: 75 }, { n: "Physical Touch", v: 70 }, { n: "Receiving Gifts", v: 50 }
  ];

  return (
    <GlassCard>
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-[16px] font-bold">Bahasa Cinta</h3>
        <div className="flex bg-white/5 rounded-full p-1">
          {['Nauraa', 'Farsya'].map(n => (
            <button key={n} onClick={() => { sounds.softPluck(); setT(n as any); }} className={`px-4 py-1.5 text-[11px] font-bold rounded-full transition-colors cursor-pointer ${t === n ? 'bg-[#EBC2C6] text-black' : 'text-[#9A9AB0]'}`}>{n}</button>
          ))}
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={t} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
          {items.map((it, i) => {
            const isDom = i === 0;
            return (
              <div key={i} className={`flex items-center gap-3 mb-3 ${isDom ? 'border-l-2 border-[#EBC2C6] pl-2 -ml-[10px]' : ''}`}>
                <div className="w-[130px] shrink-0 text-[12px] flex items-center gap-2">
                  <span className={isDom ? 'font-bold text-white' : 'text-[#9A9AB0]'}>{it.n}</span>
                  {isDom && <span className="bg-[#EBC2C6]/20 text-[#EBC2C6] text-[8px] px-1.5 py-0.5 rounded uppercase font-bold">Dom</span>}
                </div>
                <div className="flex-1 h-[6px] bg-white/5 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${it.v}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} className="h-full rounded-full" style={{ background: isDom ? '#EBC2C6' : 'linear-gradient(90deg, rgba(255,255,255,0.1), rgba(255,255,255,0.4))' }} />
                </div>
                <div className="w-[30px] shrink-0 text-right text-[11px] font-bold" style={{ color: isDom ? '#EBC2C6' : '#9A9AB0' }}>{it.v}%</div>
              </div>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </GlassCard>
  );
};

// 9. PhotoGallery
const PhotoItem = ({ src, label, caption, onClick, index, className = '' }: { src: string, label: string, caption?: string, onClick: () => void, index: number, className?: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 35 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10px" }}
      transition={{ duration: 0.6, ease: [0.215, 0.610, 0.355, 1], delay: (index % 3) * 0.08 }}
      whileHover={{ 
        scale: 1.03, 
        borderColor: "rgba(235, 194, 198, 0.35)", 
        boxShadow: "0 0 25px rgba(235, 194, 198, 0.25)",
        filter: 'brightness(1.03)' 
      }}
      whileTap={{ scale: 0.98 }}
      className={`photo-item relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] cursor-zoom-in transition-all duration-300 ${className}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <Photo src={src} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
        <div className="flex items-center justify-between">
          <div className="text-left">
            <p className="text-[11px] font-bold text-white/90 tracking-wide">{label}</p>
            {caption && <p className="text-[10px] text-white/70 line-clamp-1">{caption}</p>}
          </div>
          <div className="p-1.5 bg-white/10 rounded-full backdrop-blur-md">
            <Expand size={14} className="text-white" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const PhotoGallery = () => {
  const [tab, setTab] = useState<'N'|'F'|'B'>('B');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Dates' | 'Liburan' | 'Selfies'>('All');
  const { open } = useLightbox();

  // Reset category filter when tab changes
  useEffect(() => {
    setCategoryFilter('All');
  }, [tab]);

  const getPhotos = () => {
    if (tab === 'N') {
      const cats = ['Selfies', 'Dates', 'Selfies', 'Liburan'];
      return NAURA.photos.map((u, i) => ({ 
        u, 
        l: 'Nauraa Rayyani Ayu', 
        c: 'Senyum manis Nauraa Rayyani Ayu', 
        cat: cats[i % cats.length] 
      }));
    }
    if (tab === 'F') {
      const cats = ['Selfies', 'Dates', 'Liburan', 'Selfies'];
      return FARSYA.photos.map((u, i) => ({ 
        u, 
        l: 'Farsya Zahri', 
        c: 'Pose hangat Farsya Zahri', 
        cat: cats[i % cats.length] 
      }));
    }
    const cats = ['Dates', 'Selfies', 'Liburan', 'Dates', 'Liburan', 'Dates', 'Liburan', 'Selfies', 'Selfies', 'Dates', 'Liburan'];
    return TOGETHER_PHOTOS.map((x, i) => ({ 
      u: x.url, 
      l: 'Berdua', 
      c: x.caption, 
      cat: cats[i % cats.length] 
    }));
  };
  
  const allPhotosForTab = getPhotos();
  const filteredPhotos = categoryFilter === 'All' 
    ? allPhotosForTab 
    : allPhotosForTab.filter(p => p.cat === categoryFilter);

  return (
    <GlassCard>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-[16px] font-bold">Foto Kita</h3>
          <p className="text-[11px] text-[#9A9AB0]">Momen terindah perjalanan cinta kita</p>
        </div>
      </div>
      
      {/* Top Main Tabs (Nauraa, Farsya, Berdua) */}
      <div className="photo-tabs flex gap-2 mb-3 overflow-x-auto scrollbar-hide pb-1">
        {[ 
          {id:'N', n:`Nauraa (${NAURA.photos.length})`}, 
          {id:'F', n:`Farsya (${FARSYA.photos.length})`}, 
          {id:'B', n:`Berdua (${TOGETHER_PHOTOS.length})`} 
        ].map(t => (
          <button key={t.id} onClick={() => { sounds.clickSound(); setTab(t.id as any); }} className={`photo-tab ${tab === t.id ? 'active' : ''}`}>{t.n}</button>
        ))}
      </div>

      {/* Category Pills Filtering mechanism */}
      <div className="flex flex-wrap gap-1.5 mb-5 border-t border-white/5 pt-3.5">
        {[
          { id: 'All', n: 'Semua Kategori', icon: ImageIcon },
          { id: 'Dates', n: 'Dates', icon: Calendar },
          { id: 'Liburan', n: 'Liburan', icon: Compass },
          { id: 'Selfies', n: 'Selfies', icon: Camera }
        ].map(cat => {
          const isSelected = categoryFilter === cat.id;
          const IconComponent = cat.icon;
          // Count items in each category for the active tab to make the filter dynamic
          const count = cat.id === 'All' 
            ? allPhotosForTab.length 
            : allPhotosForTab.filter(p => p.cat === cat.id).length;

          return (
            <motion.button
              key={cat.id}
              onClick={() => { sounds.shutterClick(); setCategoryFilter(cat.id as any); }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className={`text-[11px] px-3.5 py-1.5 rounded-full border transition-all flex items-center gap-1.5 cursor-pointer ${
                isSelected 
                  ? 'bg-gradient-to-r from-[#EBC2C6] to-[#D6C2E8] text-[#1A0A0C] border-transparent font-bold shadow-md shadow-pink-500/10' 
                  : 'bg-white/5 border-white/10 text-white/55 hover:text-white/90 hover:bg-white/10'
              }`}
            >
              <IconComponent size={12} className={isSelected ? 'text-[#1A0A0C]' : 'text-[#EBC2C6]'} />
              <span>{cat.n}</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-black/10 text-[#1A0A0C]/80 font-bold' : 'bg-white/5 text-white/30'}`}>
                {count}
              </span>
            </motion.button>
          );
        })}
      </div>
      
      <div className="w-full">
        {/* Empty State when no photos match category */}
        {filteredPhotos.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-12 px-4 bg-white/[0.01] border border-dashed border-white/5 rounded-2xl text-center"
          >
            <Heart size={24} className="text-[#EBC2C6]/20 mb-2 animate-pulse" />
            <p className="text-xs text-[#9A9AB0] font-mono uppercase tracking-wider">Tidak ada foto di kategori ini</p>
            <p className="text-[10px] text-white/30 mt-1">Nantikan momen romantis berikutnya segera!</p>
          </motion.div>
        ) : (
          /* Render dynamic view or default tailor grids based on categoryFilter */
          categoryFilter !== 'All' ? (
            /* General Responsive Grid Layout for Category Filtering */
            <motion.div 
              layout 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="grid grid-cols-2 md:grid-cols-3 gap-3"
            >
              {filteredPhotos.map((p, i) => (
                <PhotoItem
                  key={`${p.u}-${i}`}
                  src={p.u}
                  label={p.l}
                  caption={`${p.c} • ${p.cat}`}
                  index={i}
                  onClick={() => { sounds.clickSound(); open(filteredPhotos, i); }}
                  className="aspect-square"
                />
              ))}
            </motion.div>
          ) : (
            /* Original Tailor Layouts when viewing all */
            <>
              {tab === 'N' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="photo-grid-2x2">
                  {filteredPhotos.map((p, i) => (
                    <PhotoItem
                      key={`${p.u}-${i}`}
                      src={p.u}
                      label={p.l}
                      caption={p.c}
                      index={i}
                      onClick={() => { sounds.clickSound(); open(filteredPhotos, i); }}
                    />
                  ))}
                </motion.div>
              )}
              
              {tab === 'F' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="photo-grid-farsya">
                  <PhotoItem
                    src={filteredPhotos[0].u}
                    label={filteredPhotos[0].l}
                    caption={filteredPhotos[0].c}
                    index={0}
                    onClick={() => { sounds.clickSound(); open(filteredPhotos, 0); }}
                    className="photo-featured"
                  />
                  {filteredPhotos.slice(1).map((p, i) => (
                    <PhotoItem
                      key={`${p.u}-${i}`}
                      src={p.u}
                      label={p.l}
                      caption={p.c}
                      index={i + 1}
                      onClick={() => { sounds.clickSound(); open(filteredPhotos, i + 1); }}
                      className="photo-small"
                    />
                  ))}
                </motion.div>
              )}
              
              {tab === 'B' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="photo-grid-berdua">
                  {/* [0] full width featured */}
                  <PhotoItem 
                    src={filteredPhotos[0].u} 
                    label="Berdua"
                    caption={filteredPhotos[0].c}
                    onClick={() => { sounds.clickSound(); open(filteredPhotos, 0); }}
                    index={0}
                    className="photo-item-full"
                  />

                  {/* [1][2] */}
                  <PhotoItem 
                    src={filteredPhotos[1].u} 
                    label="Berdua"
                    caption={filteredPhotos[1].c}
                    onClick={() => { sounds.clickSound(); open(filteredPhotos, 1); }}
                    index={1}
                    className="photo-item-sq"
                  />

                  <PhotoItem 
                    src={filteredPhotos[2].u} 
                    label="Berdua"
                    caption={filteredPhotos[2].c}
                    onClick={() => { sounds.clickSound(); open(filteredPhotos, 2); }}
                    index={2}
                    className="photo-item-sq"
                  />

                  {/* [3][4][5] 3 columns row */}
                  <div className="photo-row-3">
                    <PhotoItem 
                      src={filteredPhotos[3].u} 
                      label="Berdua"
                      caption={filteredPhotos[3].c}
                      onClick={() => { sounds.clickSound(); open(filteredPhotos, 3); }}
                      index={3}
                      className="photo-item-sq"
                    />

                    <PhotoItem 
                      src={filteredPhotos[4].u} 
                      label="Berdua"
                      caption={filteredPhotos[4].c}
                      onClick={() => { sounds.clickSound(); open(filteredPhotos, 4); }}
                      index={4}
                      className="photo-item-sq"
                    />

                    <PhotoItem 
                      src={filteredPhotos[5].u} 
                      label="Berdua"
                      caption={filteredPhotos[5].c}
                      onClick={() => { sounds.clickSound(); open(filteredPhotos, 5); }}
                      index={5}
                      className="photo-item-sq"
                    />
                  </div>

                  {/* [6][7] */}
                  <PhotoItem 
                    src={filteredPhotos[6].u} 
                    label="Berdua"
                    caption={filteredPhotos[6].c}
                    onClick={() => { sounds.clickSound(); open(filteredPhotos, 6); }}
                    index={6}
                    className="photo-item-sq"
                  />

                  <PhotoItem 
                    src={filteredPhotos[7].u} 
                    label="Berdua"
                    caption={filteredPhotos[7].c}
                    onClick={() => { sounds.clickSound(); open(filteredPhotos, 7); }}
                    index={7}
                    className="photo-item-sq"
                  />

                  {/* [8] full width */}
                  {filteredPhotos[8] && (
                    <PhotoItem 
                      src={filteredPhotos[8].u} 
                      label="Berdua"
                      caption={filteredPhotos[8].c}
                      onClick={() => { sounds.clickSound(); open(filteredPhotos, 8); }}
                      index={8}
                      className="photo-item-full"
                    />
                  )}

                  {/* [9][10] */}
                  {filteredPhotos[9] && (
                    <PhotoItem 
                      src={filteredPhotos[9].u} 
                      label="Berdua"
                      caption={filteredPhotos[9].c}
                      onClick={() => { sounds.clickSound(); open(filteredPhotos, 9); }}
                      index={9}
                      className="photo-item-sq"
                    />
                  )}

                  {filteredPhotos[10] && (
                    <PhotoItem 
                      src={filteredPhotos[10].u} 
                      label="Berdua"
                      caption={filteredPhotos[10].c}
                      onClick={() => { sounds.clickSound(); open(filteredPhotos, 10); }}
                      index={10}
                      className="photo-item-sq"
                    />
                  )}
                </motion.div>
              )}
            </>
          )
        )}
      </div>
    </GlassCard>
  );
};

// 10. MemoryBoard
const MemoryBoard = () => {
  const getIcon = (n: string, size=24, col: string) => {
    switch(n) {
      case 'moon': return <Moon size={size} color={col}/>;
      case 'music': return <Music size={size} color={col}/>;
      case 'heart': return <Heart size={size} color={col}/>;
      case 'star': return <Star size={size} color={col}/>;
      case 'leaf': return <Leaf size={size} color={col}/>;
      default: return <Star size={size} color={col}/>;
    }
  };

  return (
    <GlassCard className="p-0 overflow-hidden pt-5 pb-2">
      <div className="px-5 mb-4">
        <h3 className="text-[16px] font-bold">Kenangan Manis</h3>
        <p className="text-[12px] text-[#9A9AB0] mt-1">Momen yang selalu diingat</p>
      </div>
      <div className="flex gap-4 overflow-x-auto scroll-snap-x pl-6 pr-6 pb-6 pt-2 scrollbar-hide">
        {MEMORIES.map((m) => (
          <motion.div 
            key={m.id} 
            whileHover={{ y: -4, borderColor: `${m.color}60` }} 
            onClick={() => sounds.knockSound()}
            className="shrink-0 w-[200px] h-[170px] snap-start bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col border-l-[3px] cursor-pointer" 
            style={{ borderLeftColor: m.color }}
          >
            <div className="mb-3">{getIcon(m.icon, 24, m.color)}</div>
            <h4 className="font-bold text-[14px] leading-tight mb-1">{m.title}</h4>
            <div className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: m.color }}>{m.date}</div>
            <p className="text-[12px] text-[#9A9AB0] leading-relaxed line-clamp-3">{m.description}</p>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
};

// 10b. MemoriesTimeline
const MemoriesTimeline = () => {
  const { open } = useLightbox();
  const timelineData = [
    { date: "Maret 2026", title: "Awal Cerita", desc: "Setiap hembusan napas dan senyum yang kita bagi melahirkan lembaran baru.", img: "https://files.catbox.moe/btdvy4.jpg", type: 'past' },
    { date: "April 2026", title: "Tatapan Hangat", desc: "Dalam matamu, aku menemukan dunia yang penuh kehangatan dan kedamaian.", img: "https://files.catbox.moe/5kgxtb.jpg", type: 'past' },
    { date: "Mei 2026", title: "Detik Berharga", desc: "Menghabiskan waktu denganmu adalah bagian terbaik dari setiap hariku.", img: "https://files.catbox.moe/d5zgaf.jpg", type: 'past' },
    { date: "Juni 2026", title: "Cerita Bahagia", desc: "Mengukir senyum dan tawa indah yang takkan pernah pudar oleh waktu.", img: "https://files.catbox.moe/ih96oo.jpg", type: 'past' },
    { date: "Juli 2026", title: "Merajut Asa", desc: "Membangun mimpi indah bersamamu selamanya.", type: 'future' },
  ];

  return (
    <GlassCard className="relative overflow-hidden">
      <h3 className="text-[16px] font-bold mb-6">Timeline Kenangan</h3>
      <div className="relative border-l-2 border-[#EBC2C6]/30 pl-[28px] space-y-6">
        {timelineData.map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ delay: 0.1, duration: 0.5, ease: 'easeOut' }} className="relative flex items-start gap-3">
            <div className="absolute -left-[35px] top-1 w-[10px] h-[10px] rounded-full bg-[#EBC2C6] shadow-[0_0_8px_#EBC2C6]" />
            <div className="flex-1">
              <div className="text-[10px] text-[#EBC2C6] font-bold tracking-widest uppercase mb-1">{item.date}</div>
              <h4 className="text-[15px] font-semibold mb-1">{item.title}</h4>
              <p className="text-[12px] text-[#9A9AB0] leading-[1.6] line-clamp-2">{item.desc}</p>
            </div>
            {item.type === 'past' && item.img ? (
              <motion.div 
                whileHover={{ scale: 1.05 }} 
                className="w-[88px] h-[88px] shrink-0 rounded-[14px] overflow-hidden border-[1.5px] border-white/10 relative cursor-zoom-in"
                onClick={() => {
                  sounds.shutterClick();
                  open([{ u: item.img, l: item.title, c: item.desc }], 0);
                }}
              >
                <Photo src={item.img} className="w-full h-full object-cover object-top" />
              </motion.div>
            ) : (
              <div className="w-[88px] h-[88px] shrink-0 rounded-[14px] border border-dashed border-white/10 opacity-50 flex flex-col items-center justify-center bg-gradient-to-br from-white/5 to-transparent">
                <Star size={16} className="text-[#9A9AB0] mb-1" />
                <span className="text-[9px] text-[#9A9AB0] px-1 text-center font-medium">Segera hadir</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
};

// 11. BucketListPreview
const BucketListPreview = () => {
  const [list, setList] = useState(BUCKET_PREVIEW);

  return (
    <GlassCard>
      <h3 className="text-[16px] font-bold mb-1">Impian Kita</h3>
      <p className="text-[12px] text-[#9A9AB0] mb-5">5 hal yang ingin dilakukan bersama</p>
      <div className="space-y-3">
        {list.map((it, i) => (
          <div 
            key={i} 
            className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0 cursor-pointer" 
            onClick={() => {
              const nl = [...list]; 
              const newDone = !nl[i].done;
              nl[i].done = newDone;
              setList(nl);
              if (newDone) {
                sounds.sparkleChime();
              } else {
                sounds.clickSound();
              }
            }}
          >
            <motion.div whileTap={{ scale: 0.9 }} className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center border-2 transition-colors" style={it.done ? { background: `linear-gradient(135deg, ${it.color}, #D6C2E8)`, borderColor: 'transparent' } : { borderColor: `${it.color}60`, background: 'transparent' }}>
              {it.done && <Check size={12} className="text-white" />}
            </motion.div>
            <span className={`text-[13px] flex-1 transition-all ${it.done ? 'line-through text-[#5A5A70]' : 'text-white'}`}>{it.text}</span>
            <div className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: it.color }} />
          </div>
        ))}
      </div>
      <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
        <span className="text-[11px] font-bold text-[#EBC2C6]">{list.filter(x=>x.done).length} / 5 TERCAPAI</span>
        <button className="px-4 py-1.5 rounded-full border border-[#EBC2C6]/30 text-[#EBC2C6] text-[11px] font-bold hover:bg-[#EBC2C6]/10 transition-colors">Lihat Semua</button>
      </div>
    </GlassCard>
  );
};

// 12. ScoreSummary
const ScoreSummary = ({ scores }: { scores: GameScores }) => {
  return (
    <GlassCard className="cursor-pointer" onClick={() => sounds.gameCoin()}>
      <h3 className="text-[16px] font-bold mb-4">Rekap Petualangan</h3>
      <div className="space-y-0">
        {[
          { l: "Kuis Romantis", v: scores.triviaScore >= 4 ? `${scores.triviaScore}/5 Luar Biasa` : `${scores.triviaScore}/5 Baik`, c: scores.triviaScore >= 4 ? '#B7E3E0' : '#EBC2C6' },
          { l: "Memory Card", v: `${scores.memoryMoves} langkah`, c: scores.memoryMoves <= 20 ? '#B7E3E0' : '#EBC2C6' },
          { l: "Kejar Tombol", v: "Selesai", c: '#B7E3E0' },
          { l: "Meteor Love", v: `${scores.meteorScore}/15`, c: scores.meteorScore >= 10 ? '#B7E3E0' : '#EBC2C6' },
          { l: "Puzzle Geser", v: `${scores.puzzleMoves} langkah`, c: scores.puzzleMoves <= 50 ? '#B7E3E0' : '#D6C2E8' },
          { l: "Virtual Pet", v: `${Math.round(scores.petHappiness)}% bahagia`, c: scores.petHappiness >= 85 ? '#B7E3E0' : '#EBC2C6' },
        ].map((s, i) => (
          <div key={i} className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0 text-[13px]">
            <span className="text-[#9A9AB0]">{s.l}</span>
            <span className="font-bold" style={{ color: s.c }}>{s.v}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2 text-[#B7E3E0] font-bold text-[13px]">
        <CheckCircle2 size={16} /> Semua misi berhasil diselesaikan
      </div>
    </GlassCard>
  );
};

// 12a. ActivePartnerSwitchHeader
const ActivePartnerSwitchHeader = ({ activeUser, onSwitchUser }: { activeUser: 'Nauraa' | 'Farsya', onSwitchUser: (u: 'Nauraa' | 'Farsya') => void }) => {
  return (
    <GlassCard className="border border-pink-500/10 shadow-lg shadow-pink-500/5 hover:border-pink-500/20 transition-all p-3.5 mb-1 relative overflow-hidden">
      <div className="absolute top-2 right-2">
        {isFirebaseLive ? (
          <div className="flex items-center gap-1 text-[8px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <Wifi size={8} className="animate-pulse" /> CLOUD SYNC
          </div>
        ) : (
          <div className="flex items-center gap-1 text-[8px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/10">
            <WifiOff size={8} /> LOCAL STORAGE
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        <div>
          <h4 className="text-[12px] font-bold text-[#EBC2C6] flex items-center gap-1">
            <Sparkles size={12} className="text-yellow-300 animate-[spin_5s_linear_infinite]" /> Identitas HP Ini
          </h4>
          <p className="text-[9px] text-white/55 leading-snug">Siapa yang membuka aplikasi dari HP ini sekarang?</p>
        </div>
        <div className="flex bg-black/40 rounded-full p-1 border border-white/5 shadow-inner w-full justify-between">
          <button 
            onClick={() => onSwitchUser('Nauraa')}
            className={`flex-1 py-1 px-3 text-[11px] font-bold rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer ${activeUser === 'Nauraa' ? 'bg-gradient-to-r from-[#EBC2C6] to-[#D6C2E8] text-[#1A0A0C] font-black' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
          >
            🌸 Nauraa
          </button>
          <button 
            onClick={() => onSwitchUser('Farsya')}
            className={`flex-1 py-1 px-3 text-[11px] font-bold rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer ${activeUser === 'Farsya' ? 'bg-gradient-to-r from-[#D6C2E8] to-[#EBC2C6] text-[#1A0A0C] font-black' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
          >
            ⚡ Farsya
          </button>
        </div>
      </div>
    </GlassCard>
  );
};

// 12b. MoodSelector (Real-time DB-Synced)
export const MoodSelector = ({ activeUser }: { activeUser: 'Nauraa' | 'Farsya' }) => {
  const [currentMoodLogs, setCurrentMoodLogs] = useState<any[]>([]);
  const [note, setNote] = useState('');
  const [isSyncing, setIsSyncing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const moods = [
    { emoji: "💖", label: "Dicintai", desc: "Berbunga-bunga", color: "#EBC2C6" },
    { emoji: "🥰", label: "Bahagia", desc: "Sayang kamu", color: "#D6C2E8" },
    { emoji: "😊", label: "Nyaman", desc: "Tenang damai", color: "#B7E3E0" },
    { emoji: "🥺", label: "Kangen", desc: "Clingy / kangen", color: "#E8D5A3" },
    { emoji: "😴", label: "Lelah", desc: "Ngantuk capek", color: "#9A9AB0" },
    { emoji: "😔", label: "Sedih", desc: "Kurang ceria", color: "#F0A0B0" },
  ];

  useEffect(() => {
    setIsSyncing(true);
    const unsubscribe = syncMoods(
      (logs) => {
        setCurrentMoodLogs(logs);
        setIsSyncing(false);
      },
      (error) => {
        console.error("Failed to sync moods:", error);
        setIsSyncing(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleSelectMood = async (moodOpt: any) => {
    sounds.scribblePaper();
    setIsSaving(true);
    try {
      await logMood(activeUser, moodOpt.emoji, moodOpt.label, moodOpt.color, note);
      sounds.successSound();
      setNote('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetHistory = () => {
    sounds.clickSound();
    if (window.confirm('Hapus semua riwayat perasaan di browser ini?')) {
      clearLocalMoods();
      window.location.reload();
    }
  };

  // Find latest today logs
  const nauraLatest = currentMoodLogs.find(l => l.userId === 'Nauraa');
  const farsyaLatest = currentMoodLogs.find(l => l.userId === 'Farsya');

  return (
    <GlassCard className="relative overflow-hidden">
      {/* Saving State Loader Overlay */}
      {isSaving && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center z-35 rounded-[24px]">
          <span className="w-8 h-8 border-3 border-[#EBC2C6] border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-[11px] text-[#EBC2C6] font-bold">Mengirim perasaanmu ke cloud... 🌸</p>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[15px] font-bold flex items-center gap-1.5">
          <Heart size={14} className="text-[#EBC2C6] fill-[#EBC2C6] animate-pulse" /> 
          Peta Perasaan Berdua
        </h3>
        {!isFirebaseLive && currentMoodLogs.length > 0 && (
          <button onClick={handleResetHistory} className="text-[9px] text-white/30 hover:text-white/60">Reset</button>
        )}
      </div>

      {isSyncing ? (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <span className="w-6 h-6 border-2 border-[#EBC2C6] border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-[10px] font-mono text-white/40">Menyinkronkan status perasaan...</p>
        </div>
      ) : (
        <>
          {/* Side-by-Side Status Cards */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {/* Nauraa Current Section */}
            <div className="bg-white/[0.03] border border-white/5 rounded-[20px] p-3 flex flex-col items-center text-center relative overflow-hidden h-[135px] justify-center">
              <div className="absolute top-2 left-2 text-[8px] bg-pink-500/15 text-[#EBC2C6] px-1.5 py-0.5 rounded-full font-bold">🌸 NAURAA</div>
              {nauraLatest ? (
                <div className="pt-2 flex flex-col items-center">
                  <motion.span animate={{ scale: [1, 1.12, 1] }} transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }} className="text-4xl mb-1 filter drop-shadow-[0_0_6px_rgba(235,194,198,0.3)]">{nauraLatest.mood}</motion.span>
                  <span className="text-[11px] font-bold" style={{ color: nauraLatest.color }}>{nauraLatest.label}</span>
                  <p className="text-[9px] text-white/60 italic mt-1 line-clamp-1 px-1">"{nauraLatest.note}"</p>
                  <span className="text-[7px] text-white/30 mt-1.5 bg-white/5 px-1.5 py-0.2 rounded font-mono">Pukul {nauraLatest.time || '00:00'}</span>
                </div>
              ) : (
                <div className="py-6 text-[10px] text-white/20 text-center">Belum ada kabar... 🌸</div>
              )}
            </div>

            {/* Farsya Current Section */}
            <div className="bg-white/[0.03] border border-white/5 rounded-[20px] p-3 flex flex-col items-center text-center relative overflow-hidden h-[135px] justify-center">
              <div className="absolute top-2 left-2 text-[8px] bg-blue-500/15 text-[#B7E3E0] px-1.5 py-0.5 rounded-full font-bold">⚡ FARSYA</div>
              {farsyaLatest ? (
                <div className="pt-2 flex flex-col items-center">
                  <motion.span animate={{ scale: [1, 1.12, 1] }} transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }} className="text-4xl mb-1 filter drop-shadow-[0_0_6px_rgba(183,227,224,0.3)]">{farsyaLatest.mood}</motion.span>
                  <span className="text-[11px] font-bold" style={{ color: farsyaLatest.color }}>{farsyaLatest.label}</span>
                  <p className="text-[9px] text-white/60 italic mt-1 line-clamp-1 px-1">"{farsyaLatest.note}"</p>
                  <span className="text-[7px] text-white/30 mt-1.5 bg-white/5 px-1.5 py-0.2 rounded font-mono">Pukul {farsyaLatest.time || '00:00'}</span>
                </div>
              ) : (
                <div className="py-6 text-[10px] text-white/20 text-center">Belum ada kabar... ⚡</div>
              )}
            </div>
          </div>

          {/* Input section or display active state */}
          <div className="border-t border-white/5 pt-4">
            <p className="text-[10px] text-white/50 mb-3">
              Perbarui perasaanmu hari ini, <strong className="text-[#EBC2C6]">{activeUser}</strong>:
            </p>

            <div className="grid grid-cols-3 gap-2">
              {moods.map((m) => (
                <motion.button
                  key={m.label}
                  whileHover={{ scale: 1.05, translateY: -1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelectMood(m)}
                  className="flex flex-col items-center justify-center p-2 rounded-[16px] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-center group cursor-pointer"
                >
                  <span className="text-xl mb-0.5 group-hover:scale-110 transition-transform">{m.emoji}</span>
                  <span className="text-[9px] font-bold text-white/80">{m.label}</span>
                  <span className="text-[7px] text-white/40 leading-tight block">{m.desc}</span>
                </motion.button>
              ))}
            </div>

            <div className="pt-3">
              <span className="text-[10px] text-white/60 block mb-1 font-medium">Catatan Pendek Berdua (opsional):</span>
              <input 
                type="text" 
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Misal: Kangen banget pengen telponan... 💕"
                maxLength={100}
                className="w-full bg-white/5 border border-white/10 rounded-[12px] px-3 py-2 text-[11px] text-white placeholder-white/30 focus:outline-none focus:border-[#EBC2C6]/50 transition-all"
              />
            </div>
          </div>

          {currentMoodLogs.length > 0 && (
            <div className="mt-5 pt-4 border-t border-white/5">
              <span className="text-[10px] font-bold text-[#5A5A70] uppercase tracking-wider block mb-2.5">Histori Perasaan</span>
              <div className="flex gap-2 pb-1 overflow-x-auto scrollbar-none snap-x">
                {currentMoodLogs.slice(0, 10).map((log, idx) => (
                  <motion.div 
                    key={idx} 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }}
                    className="shrink-0 snap-align bg-white/5 border border-white/10 rounded-[16px] p-2 min-w-[95px] text-center flex flex-col items-center justify-center"
                  >
                    <span className="text-lg">{log.mood}</span>
                    <span className="text-[9px] font-bold text-white/70 block truncate max-w-full">{log.label}</span>
                    <span className="text-[7px] text-white/40 mt-0.5 font-mono">by {log.userId}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </GlassCard>
  );
};

const SentimentLog = MoodSelector;

// Helper to format messages date time elegantly and compactly
const formatMsgDate = (date: any) => {
  if (!date) return 'baru saja';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return 'baru saja';
  
  const hours = d.getHours().toString().padStart(2, '0');
  const mins = d.getMinutes().toString().padStart(2, '0');
  const timeStr = `${hours}:${mins}`;
  
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return timeStr;
  }
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${d.getDate()} ${months[d.getMonth()]} ${timeStr}`;
};

// 12c. ChatComponent (Real-time DB-Synced Chat & Voice Notes with Cloud Storage)
export const ChatComponent = ({ activeUser }: { activeUser: 'Nauraa' | 'Farsya' }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [textInput, setTextInput] = useState('');
  
  const [isSyncing, setIsSyncing] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [voiceUrl, setVoiceUrl] = useState<string | null>(null);
  const [micFeedback, setMicFeedback] = useState<string>('');
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsSyncing(true);
    const unsubscribe = syncMessages(
      (newMsgs) => {
        setMessages(newMsgs);
        setIsSyncing(false);
        setTimeout(() => {
          if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
          }
        }, 120);
      },
      (error) => {
        console.error('Error syncing messages:', error);
        setIsSyncing(false);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingDuration(d => d + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setRecordingDuration(0);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause();
      }
    };
  }, [currentAudio]);

  const handleSendMessage = async () => {
    if (!textInput.trim() && !audioBase64 && !voiceUrl) return;
    setIsSending(true);
    sounds.clickSound();
    
    const textToSend = textInput.trim() || "🎤 Voice Note Terkirim";
    const voiceToSend = audioBase64 || undefined;
    const voiceDurationToSend = (audioBase64 || voiceUrl) ? recordingDuration : undefined;
    const voiceUrlToSend = voiceUrl || undefined;

    setTextInput('');
    setAudioBase64(null);
    setVoiceUrl(null);

    try {
      await sendMessage(activeUser, textToSend, voiceToSend, voiceDurationToSend, voiceUrlToSend);
      sounds.sparkleChime();
    } catch (err) {
      console.error("Gagal mengirim pesan chat:", err);
    } finally {
      setIsSending(false);
    }
  };

  const startRecording = async () => {
    setMicFeedback('');
    setRecordingTime(0);
    try {
      sounds.shutterClick();
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Perekaman tidak didukung browser ini.");
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Dynamic cross-device MIME format selection for cellphones
      let mimeType = '';
      const types = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
        'audio/wav'
      ];
      
      if (typeof MediaRecorder !== 'undefined') {
        for (const t of types) {
          if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) {
            mimeType = t;
            break;
          }
        }
      }

      if (!mimeType) {
        mimeType = 'audio/mp4'; // Default to mp4 for modern safari/mobile
      }

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        if (timerRef.current) clearInterval(timerRef.current);
        
        const audioBlob = new Blob(chunks, { type: recorder.mimeType || mimeType });
        setIsUploading(true);
        try {
          if (isFirebaseLive) {
            const url = await uploadVoiceNoteToStorage(audioBlob);
            setVoiceUrl(url);
          } else {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64Data = reader.result as string;
              setAudioBase64(base64Data);
            };
            reader.readAsDataURL(audioBlob);
          }
          setMicFeedback("✅ VN Siap!");
        } catch (e) {
          console.warn("Storage upload failed, falling back to local base64.", e);
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64Data = reader.result as string;
            setAudioBase64(base64Data);
          };
          reader.readAsDataURL(audioBlob);
        } finally {
          setIsUploading(false);
          setTimeout(() => setMicFeedback(''), 3000);
        }
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start(1000); // Collect data frequently
      setMediaRecorder(recorder);
      setIsRecording(true);
      setMicFeedback("🎙️ Berhasil terhubung. Silakan bicara manis!");
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      console.warn("Using simulated fallback recording:", err);
      sounds.softPluck();
      setMicFeedback("⚠️ Akses Mikrofon Ditolak/Diblokir. Hubungkan akses mikrofon di setelan HP-mu untuk merekam VN!");
      
      // Clear message after 6 seconds
      setTimeout(() => {
        setMicFeedback('');
      }, 6000);
    }
  };

  const stopRecording = () => {
    sounds.softPluck();
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      // Fallback cute synthesized chime/whistle voice note data URI
      const mockWhisperBase64 = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAAA";
      setAudioBase64(mockWhisperBase64);
      setRecordingDuration(4);
    }
  };

  const playVoiceNote = (id: string, playItem: string) => {
    if (playingId === id) {
      if (currentAudio) currentAudio.pause();
      setPlayingId(null);
      return;
    }

    if (currentAudio) currentAudio.pause();

    sounds.shutterClick();
    const audio = new Audio(playItem);
    audio.play().then(() => {
      setPlayingId(id);
      setCurrentAudio(audio);
    }).catch(err => {
      console.warn("Audio play issue, standard on mobile cellphones.", err);
      setPlayingId(id);
      setCurrentAudio(audio);
    });

    audio.onended = () => {
      setPlayingId(null);
    };
  };

  const formatSecs = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const hasVoiceNotes = messages.some(m => m.voiceBase64 || m.voiceUrl);

  return (
    <GlassCard className="flex flex-col h-[400px] relative">
      <div className="flex justify-between items-center pb-2 border-b border-white/5 mb-3">
        <h3 className="text-[14px] font-bold flex items-center gap-2">
          <Mic size={14} className="text-[#EBC2C6]" />
          <span>Surat Chat & Voice Note Berdua</span>
        </h3>
        <span className="text-[8px] font-mono tracking-widest text-[#5A5A70] uppercase">LIVE SYNC</span>
      </div>

      {/* Message List */}
      <div 
        ref={listRef}
        className="flex-1 overflow-y-auto space-y-3 pr-1 pb-2 scrollbar-none"
      >
        {isSyncing ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-white/35">
            <span className="w-6 h-6 border-2 border-[#EBC2C6] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-[10px] font-mono">Sinkronisasi pesan cinta...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-white/20">
            <Send size={20} className="mb-2 opacity-30 animate-[wiggle_3s_infinite]" />
            <p className="text-[10px] font-bold">Yuk obrolin manis hari ini!</p>
            <p className="text-[8px] max-w-[180px] text-white/40 mt-1">Ketuk mic untuk kirim voice note manis atau tulis chat langsung untuk si dia!</p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.userId === activeUser;
            const userColor = m.userId === 'Nauraa' ? '#EBC2C6' : '#B7E3E0';
            const userEmoji = m.userId === 'Nauraa' ? '🌸' : '⚡';
            
            return (
              <div 
                key={m.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <span className="text-[8px] font-semibold text-white/40 mb-0.5 flex items-center gap-1 px-1">
                  <span>{userEmoji}</span>
                  <span style={{ color: userColor }}>{m.userId}</span>
                </span>

                <div 
                  className={`max-w-[85%] rounded-[16px] p-2.5 shadow border text-[11px] ${isMe ? 'bg-gradient-to-br from-[#2D1418] to-[#1A090B] border-[#EBC2C6]/15 rounded-tr-none text-[#EBC2C6]' : 'bg-[#0E201D] border-[#B7E3E0]/15 rounded-tl-none text-[#B7E3E0]'}`}
                >
                  {m.text && (!m.voiceBase64 && !m.voiceUrl || m.text !== "🎤 Voice Note Terkirim") && (
                    <p className="leading-snug break-all">{m.text}</p>
                  )}

                  {(m.voiceBase64 || m.voiceUrl) && (
                    <div className="flex items-center gap-2.5 pt-0.5">
                      <button 
                        onClick={() => playVoiceNote(m.id, m.voiceUrl || m.voiceBase64)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${playingId === m.id ? 'bg-red-400 rotate-180 animate-pulse text-black' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                      >
                        {playingId === m.id ? <Pause size={10} className="fill-black" /> : <Play size={10} className="ml-0.5 fill-white" />}
                      </button>

                      <div className="flex-1 min-w-[80px]">
                        <div className="flex items-center gap-1">
                          <Volume2 size={10} className="opacity-60" />
                          <span className="text-[9px] font-bold">Voice Note</span>
                          <span className="text-[7px] opacity-40">({m.voiceDuration ? formatSecs(m.voiceDuration) : '0:04'})</span>
                        </div>
                        <div className="flex items-end gap-0.5 h-2 overflow-hidden mt-0.5">
                          {Array.from({ length: 10 }).map((_, i) => (
                            <motion.div 
                              key={i}
                              animate={playingId === m.id ? { height: [3, 8, 2, 7, 3] } : { height: 2 }}
                              transition={{ duration: 0.7 + (i * 0.1), repeat: Infinity }}
                              className="w-1 rounded-full"
                              style={{ backgroundColor: userColor }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <span className="text-[8px] text-white/35 font-mono mt-0.5 px-1 font-semibold">
                  {formatMsgDate(m.createdAt)}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Helpful mobile device silent-switch notification tip */}
      {hasVoiceNotes && (
        <div className="text-[8px] text-yellow-300/60 pb-1.5 text-center px-2 flex items-center justify-center gap-1">
          <span>💡 Jika VN sunyi, pastikan tombol Silent/Hening di samping HP-mu sudah OFF!</span>
        </div>
      )}

      {micFeedback && (
        <div className="text-[10px] text-[#EBC2C6] text-center font-bold pb-2 px-3 animate-pulse flex items-center justify-center gap-2">
          {micFeedback}
          {isRecording && <span className="text-white font-mono bg-red-500/20 px-1.5 py-0.5 rounded text-[9px]">{Math.floor(recordingTime/60)}:{(recordingTime%60).toString().padStart(2,'0')}</span>}
        </div>
      )}

      {(audioBase64 || voiceUrl) && !isRecording && (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 border border-white/10 rounded-xl p-1.5 mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 pl-1.5">
            <Volume2 className="text-[#EBC2C6]" size={12} />
            <span className="text-[9px] font-bold text-white">Voice Note Siap ({formatSecs(recordingDuration)}) {voiceUrl ? "☁️ (Uploaded)" : ""}</span>
          </div>
          <button 
            onClick={() => { sounds.clickSound(); setAudioBase64(null); setVoiceUrl(null); }}
            className="text-[9px] text-red-400 hover:underline px-1.5"
          >
            Hapus
          </button>
        </motion.div>
      )}

      {isUploading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/5 border border-white/10 rounded-xl p-1.5 mb-2.5 flex items-center justify-center gap-2">
          <span className="w-3.5 h-3.5 border-2 border-[#EBC2C6] border-t-transparent rounded-full animate-spin" />
          <span className="text-[9px] font-bold text-white/60">Mengunggah VN ke Cloud Storage...</span>
        </motion.div>
      )}

      {isRecording && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#1A0A0C] border border-[#EBC2C6]/10 rounded-xl p-3 mb-2.5 flex flex-col items-center">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
            <span className="text-[10px] font-bold text-red-400 uppercase">Merekam Suaramu...</span>
          </div>
          <div className="text-xl font-mono text-[#EBC2C6] font-bold mb-2">{formatSecs(recordingDuration)}</div>
          <button 
            onClick={stopRecording}
            className="w-full py-1.5 bg-pink-400 text-black text-[10px] font-extrabold hover:bg-pink-300 transition-all rounded-full cursor-pointer flex items-center justify-center gap-1"
          >
            Selesai Rekam
          </button>
        </motion.div>
      )}

      {!isRecording && (
        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
          <button 
            disabled={isSending || isUploading}
            onClick={startRecording}
            className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 text-[#EBC2C6] cursor-pointer ${(isSending || isUploading) ? 'opacity-55 cursor-not-allowed' : ''}`}
            title="Sampaikan VN"
          >
            <Mic size={15} />
          </button>

          <input 
            type="text"
            disabled={isSending}
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
            placeholder={isSending ? "Mengirim..." : (audioBase64 || voiceUrl) ? "VN Berhasil Terlampir ✨" : "Tulis kata cinta..."}
            className="flex-1 bg-white/5 border border-white/10 rounded-full px-3 h-9 text-[11px] text-white placeholder-white/30 focus:outline-none focus:border-[#EBC2C6]/50 transition-all disabled:opacity-55"
          />

          <button 
            disabled={isSending || isUploading}
            onClick={handleSendMessage}
            className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center bg-[#EBC2C6] hover:scale-105 active:scale-95 transition-all text-[#1A0A0C] cursor-pointer ${(isSending || isUploading) ? 'opacity-55 cursor-not-allowed' : ''}`}
          >
            {isSending ? (
              <span className="w-3.5 h-3.5 border-2 border-[#1A0A0C] border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={13} className="ml-0.5" />
            )}
          </button>
        </div>
      )}
    </GlassCard>
  );
};

const LoveChatRoom = ChatComponent;

// 12b. LoveLetterDraft
const LoveLetterDraft = () => {
  const [letterContent, setLetterContent] = useState('');
  const [paperTheme, setPaperTheme] = useState('pink');
  const [fontStyle, setFontStyle] = useState('romantis');
  const [seal, setSeal] = useState('💖');
  const [saveStatus, setSaveStatus] = useState('');
  const [isPreview, setIsPreview] = useState(false);

  const papers: Record<string, { bg: string, border: string, text: string, accent: string }> = {
    pink: {
      bg: 'linear-gradient(135deg, #2D1418 0%, #1A090B 100%)',
      border: 'rgba(235, 194, 198, 0.2)',
      text: '#EBC2C6',
      accent: '#F0A0B0'
    },
    midnight: {
      bg: 'linear-gradient(135deg, #0C1124 0%, #05060D 100%)',
      border: 'rgba(92, 126, 212, 0.2)',
      text: '#B3C8FE',
      accent: '#6D95FF'
    },
    gold: {
      bg: 'linear-gradient(135deg, #271E13 0%, #110D08 100%)',
      border: 'rgba(232, 213, 163, 0.2)',
      text: '#E8D5A3',
      accent: '#FFDC7F'
    },
    mint: {
      bg: 'linear-gradient(135deg, #0F201D 0%, #08100F 100%)',
      border: 'rgba(183, 227, 224, 0.2)',
      text: '#B7E3E0',
      accent: '#7CEBE1'
    }
  };

  const fonts: Record<string, string> = {
    romantis: 'font-sans tracking-wide leading-relaxed italic',
    santai: 'font-sans tracking-normal leading-relaxed font-light',
    klasik: 'font-mono tracking-tight leading-relaxed text-[12px]'
  };

  useEffect(() => {
    const savedCode = localStorage.getItem('love_letter_draft');
    if (savedCode) {
      try {
        const parsed = JSON.parse(savedCode);
        setLetterContent(parsed.content || '');
        setPaperTheme(parsed.paperTheme || 'pink');
        setFontStyle(parsed.fontStyle || 'romantis');
        setSeal(parsed.seal || '💖');
      } catch (e) {}
    } else {
      setLetterContent(
        "Untuk kekasihku tercinta,\n\n" +
        "Setiap detik perjalanan ini membuatku semakin mengerti arti rasa syukur.\n" +
        "Masih ingatkah kamu saat pertama kali kita berbagi lagu?\n" +
        "Aku ingin selalu bersamamu, merajut asa kita hari demi hari.\n\n" +
        "Dengan penuh kasih sayang,\n" +
        "Aku."
      );
    }
  }, []);

  const handleSave = () => {
    sounds.clickSound();
    const dataToSave = {
      content: letterContent,
      paperTheme,
      fontStyle,
      seal,
      savedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    localStorage.setItem('love_letter_draft', JSON.stringify(dataToSave));
    sounds.successSound();
    setSaveStatus(`Tersimpan jam ${dataToSave.savedAt}`);
    setTimeout(() => setSaveStatus(''), 3000);
  };

  const currentPaper = papers[paperTheme] || papers.pink;

  return (
    <GlassCard>
      <div className="flex justify-between items-center mb-1">
        <h3 className="text-[16px] font-bold">Draf Surat Cinta</h3>
        <button 
          onClick={() => { sounds.scribblePaper(); setIsPreview(!isPreview); }}
          className="text-[11px] text-[#EBC2C6] font-bold hover:underline"
        >
          {isPreview ? 'Mode Edit' : 'Review Surat'}
        </button>
      </div>
      <p className="text-[12px] text-[#9A9AB0] mb-4">Gubah pesan puitis romantis di lembar beludru cinta.</p>

      {!isPreview && (
        <div className="space-y-3.5 mb-4">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-white/60">Warna Kertas:</span>
            <div className="flex gap-2">
              {['pink', 'midnight', 'gold', 'mint'].map((p) => (
                <button
                  key={p}
                  onClick={() => { sounds.scribblePaper(); setPaperTheme(p); }}
                  className={`w-5 h-5 rounded-full border transition-all ${paperTheme === p ? 'ring-2 ring-white scale-110 border-white' : 'border-white/10'}`}
                  style={{
                    background: p === 'pink' ? '#2D1418' : p === 'midnight' ? '#0C1124' : p === 'gold' ? '#271E13' : '#0F201D'
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-white/60">Gaya Huruf:</span>
            <div className="flex gap-1.5">
              {[
                { id: 'romantis', label: 'Romantis' },
                { id: 'santai', label: 'Santai' },
                { id: 'klasik', label: 'Klasik' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => { sounds.scribblePaper(); setFontStyle(f.id); }}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-all ${fontStyle === f.id ? 'bg-white/10 text-[#EBC2C6] border-[#EBC2C6]/50' : 'bg-transparent text-white/40 border-white/5'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-white/60">Segel Lilin Cinta:</span>
            <div className="flex gap-2">
              {['💖', '💌', '🌹', '🕊️'].map((s) => (
                <button
                  key={s}
                  onClick={() => { sounds.scribblePaper(); setSeal(s); }}
                  className={`text-lg p-0.5 rounded transition-transform ${seal === s ? 'scale-125 filter drop-shadow-[0_0_4px_rgba(255,255,255,0.4)]' : 'opacity-40 filter grayscale'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <motion.div 
        layout
        className="w-full rounded-[20px] p-5 border relative overflow-hidden transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
        style={{
          background: currentPaper.bg,
          borderColor: currentPaper.border
        }}
      >
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-9xl">
          {seal}
        </div>

        {isPreview ? (
          <div className="min-h-[160px] flex flex-col justify-between">
            <div className={`whitespace-pre-line text-[13px] ${fonts[fontStyle]}`} style={{ color: currentPaper.text }}>
              {letterContent || <span className="text-white/20 italic">Lembaran ini tampak sepi tanpa torehan pena cintamu...</span>}
            </div>
            
            <div className="flex flex-col items-center mt-8 pt-4 border-t border-white/5">
              <span className="text-[28px] select-none filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]">{seal}</span>
              <span className="text-[9px] uppercase tracking-widest mt-1 font-bold" style={{ color: currentPaper.accent }}>Tersegel Abadi</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            <textarea
              value={letterContent}
              onChange={(e) => setLetterContent(e.target.value)}
              placeholder="Bagikan detak jantungmu lewat kata-kata di sini..."
              rows={8}
              className={`w-full bg-transparent resize-none border-0 p-0 text-[13px] focus:outline-none focus:ring-0 ${fonts[fontStyle]}`}
              style={{ color: currentPaper.text }}
            />
            
            <div className="flex justify-end items-center mt-3 pt-3 border-t border-white/5">
              <span className="text-xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">{seal}</span>
            </div>
          </div>
        )}
      </motion.div>

      {!isPreview && (
        <div className="flex justify-between items-center mt-4">
          <span className="text-[11px] text-[#B7E3E0]/70 font-mono italic">
            {saveStatus || ""}
          </span>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-[12px] text-[#1A0A0C] font-semibold bg-[#EBC2C6] rounded-full shadow-md hover:bg-opacity-90 active:scale-95 transition-all flex items-center gap-1.5"
          >
            Simpan Surat
          </button>
        </div>
      )}
    </GlassCard>
  );
};

// 13. FinalMessage
const FinalMessage = ({ days, onRestart }: { days: number, onRestart: () => void }) => {
  return (
    <div className="w-full pt-8 pb-10 px-6 text-center relative" style={{ background: 'radial-gradient(ellipse at top, rgba(235,194,198,0.08) 0%, transparent 70%)' }}>
      <motion.div animate={{ scale: [1, 1.08, 1], rotate: [0, 2, -2, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} className="mx-auto w-[64px] h-[64px] flex justify-center items-center rounded-full bg-[#EBC2C6]/10 mb-8 border border-[#EBC2C6]/20 shadow-[0_0_30px_rgba(235,194,198,0.15)]">
        <Heart size={32} className="text-[#EBC2C6] fill-[#EBC2C6]" />
      </motion.div>
      <h2 className="text-[26px] font-black leading-tight mb-8 bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #EBC2C6, #D6C2E8, #B7E3E0)' }}>
        Cerita Kita Belum Selesai
      </h2>
      <div className="text-[14px] text-[#9A9AB0] leading-[1.9] max-w-[340px] mx-auto space-y-5">
        <p>Sejak 24 Maret 2026, setiap hari ada satu alasan baru untuk bersyukur — dan alasan itu selalu berujung pada nama yang sama.</p>
        <p>Kamu tidak perlu sempurna. Kamu hanya perlu hadir, jujur, dan terus memilih satu sama lain setiap harinya.</p>
        <p>Green Day, chat tengah malam, hal-hal kecil yang terasa besar — itu semua milik kita, dan tidak ada yang bisa mengambilnya.</p>
        <p className="text-[#EBC2C6] font-medium pt-2">Ini bukan akhir. Ini halaman pertama.</p>
      </div>
      
      <div className="mt-10 pt-10 text-right pr-4 text-[#D6C2E8] font-light text-[15px] italic border-b border-[#D6C2E8]/20 pb-2 inline-block max-w-[200px] ml-auto">
        — Farsya, untuk Nauraa
      </div>

      <div className="flex justify-center flex-row gap-0 items-center mt-16 text-[13px] font-bold">
        <div className="px-5 text-[#EBC2C6]">{days} HARI</div>
        <div className="font-light text-white/20">|</div>
        <div className="px-5 text-[#D6C2E8]">{Math.floor(days/30)} BULAN</div>
        <div className="font-light text-white/20">|</div>
        <div className="px-5 text-[#B7E3E0]">1 LAGU</div>
      </div>

      <div className="flex justify-center flex-row gap-3 mt-12 w-full max-w-[340px] mx-auto">
        <button onClick={onRestart} className="flex-1 max-w-[160px] px-5 py-3.5 rounded-[60px] border-[1.5px] border-[#EBC2C6]/35 bg-transparent text-[#EBC2C6] text-[13px] font-bold hover:bg-[#EBC2C6]/10 transition-colors">
          Mulai Dari Awal
        </button>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1 max-w-[160px] px-5 py-3.5 rounded-[60px] text-[#1A0A0C] text-[13px] font-semibold bg-gradient-to-br from-[#EBC2C6] to-[#D6C2E8] flex items-center justify-center gap-2">
          <Share2 size={14} /> Bagikan
        </motion.button>
      </div>

      <div className="mt-20 text-[10px] tracking-[2px] uppercase text-[#5A5A70]">Dibuat dengan sepenuh hati • 2026</div>
    </div>
  );
};

const BottomNav = ({ active }: { active: string }) => (
  <div className="md:hidden fixed bottom-0 left-0 right-0 h-[60px] bg-[rgba(10,10,14,0.92)] backdrop-blur-[20px] border-t border-[rgba(255,255,255,0.06)] z-50 flex justify-around items-center px-4 max-w-[480px] mx-auto pb-[max(10px,env(safe-area-inset-bottom))] pt-[10px]">
    {[
      { id: 'hero', icon: <Heart size={20} strokeWidth={active === 'hero' ? 2 : 1.5} />, label: 'Hero' },
      { id: 'profile', icon: <Star size={20} strokeWidth={active === 'profile' ? 2 : 1.5} />, label: 'Profil' },
      { id: 'gallery', icon: <ImageIcon size={20} strokeWidth={active === 'gallery' ? 2 : 1.5} />, label: 'Galeri' },
      { id: 'memories', icon: <Clock size={20} strokeWidth={active === 'memories' ? 2 : 1.5} />, label: 'Kenangan' },
    ].map(item => {
      const isActive = active === item.id;
      return (
        <motion.a 
          key={item.id}
          href={`#${item.id}`} 
          whileTap={{ scale: 0.88 }}
          className="flex-1 flex flex-col items-center justify-center gap-[3px] text-center"
          onClick={(e) => {
            e.preventDefault();
            sounds.clickSound();
            const el = document.getElementById(item.id);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <div className={`${isActive ? 'text-[#EBC2C6] fill-none stroke-[#EBC2C6]' : 'text-white/30 stroke-white/30 fill-none'}`}>
            {item.icon}
          </div>
          <span className={`text-[10px] font-medium ${isActive ? 'text-[#EBC2C6]' : 'text-white/30'}`}>{item.label}</span>
          {isActive && <motion.div layoutId="nav-dot" className="w-1 h-1 bg-[#EBC2C6] rounded-full mt-0.5 absolute bottom-1" />}
        </motion.a>
      );
    })}
  </div>
);

// ----------------------------------------------------------------------
// MAIN EXPORT
// ----------------------------------------------------------------------
export const S_CoupleProfile: React.FC<S_CoupleProfileProps> = ({ 
  gameScores = { triviaScore: 5, memoryMoves: 15, catchCount: 1, meteorScore: 12, puzzleMoves: 40, petHappiness: 90 }, 
  onRestart = () => window.location.reload() 
}) => {
  const [now, setNow] = useState(new Date());
  const [activeNav, setActiveNav] = useState('hero');
  const prevActiveNav = useRef('hero');

  const [activeUser, setActiveUser] = useState<'Nauraa' | 'Farsya'>(() => {
    const saved = localStorage.getItem('love_active_partner');
    return (saved === 'Nauraa' || saved === 'Farsya') ? saved : 'Nauraa';
  });

  const handleSwitchUser = (user: 'Nauraa' | 'Farsya') => {
    setActiveUser(user);
    localStorage.setItem('love_active_partner', user);
    sounds.heartbeat();
  };

  const [lightboxState, setLightboxState] = useState<{
    list: { u: string; l: string; c?: string }[];
    index: number;
  } | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const lightboxContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (activeNav !== prevActiveNav.current) {
      prevActiveNav.current = activeNav;
      // Play a custom theme or sectional sound effect based on active view transition
      if (activeNav === 'profile') {
        sounds.heartbeat();
      } else if (activeNav === 'gallery') {
        sounds.pling();
      } else if (activeNav === 'memories') {
        sounds.knockSound();
      } else {
        sounds.clickSound();
      }
    }
  }, [activeNav]);

  useEffect(() => {
    const sections = ['hero', 'profile', 'gallery', 'memories'];
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveNav(entry.target.id);
        }
      });
    }, { root: document.getElementById('main-scroll'), rootMargin: '-40% 0px -40% 0px', threshold: 0 });

    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const days = Math.floor((now.getTime() - RELATIONSHIP.startDate.getTime()) / 86400000);

  const handleOpenLightbox = (list: { u: string; l: string; c?: string }[], index: number) => {
    setLightboxState({ list, index });
  };

  return (
    <LightboxContext.Provider value={{ open: handleOpenLightbox }}>
      <div id="main-scroll" className="fixed inset-0 w-full min-h-screen bg-[#0A0A0E] text-[#F5F5F5] overflow-y-auto overflow-x-hidden z-50 font-sans smooth-scroll pb-12 pb-safe">
        <FloatingHearts />
        <div className="profile-root relative z-10">
        
        {/* KOLOM KIRI (Hero, Streak, Profil, Event) */}
        <div className="col-left flex flex-col gap-[var(--card-gap)]">
          <ActivePartnerSwitchHeader activeUser={activeUser} onSwitchUser={handleSwitchUser} />
          <div id="hero" className="scroll-mt-6"><HeroCouple now={now} /></div>
          
          <AnimatedSection variant="scaleUp">
            <div id="profile" className="scroll-mt-6">
              <StreakCounter now={now} />
            </div>
          </AnimatedSection>
          
          <AnimatedSection variant="fadeUp">
            <ProfileCards now={now} />
          </AnimatedSection>
          
          <AnimatedSection variant="scaleUp">
            <NextEventCountdown now={now} />
          </AnimatedSection>
        </div>

        {/* KOLOM KANAN (Stats, Timeline, Zodiac, Love Lang, Sentiment) */}
        <div className="col-right flex flex-col gap-[var(--card-gap)]">
          <AnimatedSection variant="fadeLeft">
            <RelationshipStats now={now} />
          </AnimatedSection>
          
          <AnimatedSection variant="fadeRight">
            <MilestoneTimeline now={now} />
          </AnimatedSection>
          
          <AnimatedSection variant="fadeUp">
            <ZodiacMatch />
          </AnimatedSection>
          
          <AnimatedSection variant="fadeLeft">
            <LoveLanguage />
          </AnimatedSection>
          
          <AnimatedSection variant="fadeUp">
            <SentimentLog activeUser={activeUser} />
          </AnimatedSection>

          <AnimatedSection variant="fadeUp">
            <LoveChatRoom activeUser={activeUser} />
          </AnimatedSection>
        </div>

        {/* KOLOM FULL WIDTH (Galeri, Kenangan, Impian, Loveltrs, Game, Final) */}
        <div className="col-full flex flex-col gap-[var(--card-gap)]">
          <AnimatedSection variant="fadeRight">
            <div id="gallery" className="scroll-mt-6">
              <PhotoGallery />
            </div>
          </AnimatedSection>
          
          <AnimatedSection variant="fadeUp">
            <MemoryBoard />
          </AnimatedSection>
          
          <AnimatedSection variant="scaleUp">
            <div id="memories" className="scroll-mt-6">
              <MemoriesTimeline />
            </div>
          </AnimatedSection>
          
          <AnimatedSection variant="fadeLeft">
            <BucketListPreview />
          </AnimatedSection>
          
          <AnimatedSection variant="fadeUp">
            <LoveLetterDraft />
          </AnimatedSection>
          
          <AnimatedSection variant="fadeRight">
            <ScoreSummary scores={gameScores} />
          </AnimatedSection>
          
          <AnimatedSection variant="scaleUp">
            <FinalMessage days={days} onRestart={onRestart} />
          </AnimatedSection>
        </div>

      </div>
      <BottomNav active={activeNav} />
    </div>

    {/* Page-Wide Universal Lightbox Portal Overlay */}
    {typeof window !== 'undefined' && document.body && createPortal(
      <AnimatePresence>
        {lightboxState !== null && (
          <motion.div 
            key="lightbox-fullscreen"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[10000] bg-black/98 backdrop-blur-3xl flex flex-col items-center justify-between py-6 px-4 cursor-default select-none animate-fade-in" 
            onClick={() => { 
              if (zoomScale === 1) {
                sounds.clickSound(); 
                setLightboxState(null); 
              }
            }}
          >
            {/* Top Bar with Adaptive Back & Metadata Controls */}
            <div className="w-full max-w-5xl flex items-center justify-between z-[10002] px-2" onClick={e => e.stopPropagation()}>
              <div>
                {/* Mobile back button */}
                <button 
                  onClick={() => { sounds.clickSound(); setLightboxState(null); }}
                  className="md:hidden flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/25 active:scale-95 border border-white/10 rounded-full text-white text-[13px] font-semibold backdrop-blur-md transition-all cursor-pointer"
                >
                  <ArrowLeft size={16} />
                  <span>Kembali</span>
                </button>
                
                {/* Desktop back button */}
                <button 
                  onClick={() => { sounds.clickSound(); setLightboxState(null); }}
                  className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-white text-sm backdrop-blur-md transition-all active:scale-95 cursor-pointer"
                >
                  <X size={16} />
                  <span>Tutup</span>
                </button>
              </div>

              {/* Title & Metadata */}
              <div className="text-center">
                <div className="text-white/40 text-[10px] tracking-widest font-mono uppercase">MEMORI KITA</div>
                <div className="text-white/80 text-sm font-semibold truncate max-w-[150px] sm:max-w-[250px]">{lightboxState.list[lightboxState.index].l}</div>
              </div>

              {/* Counter Indicator */}
              <div className="text-white/70 text-xs bg-white/10 border border-white/10 px-3.5 py-1.5 rounded-full font-mono">
                {lightboxState.index + 1} / {lightboxState.list.length}
              </div>
            </div>

            {/* Middle Container for Centering, Zoom Scale & Drag */}
            <div 
              ref={lightboxContainerRef} 
              className="relative w-full flex-1 flex items-center justify-center overflow-hidden my-4"
              onClick={() => { 
                if (zoomScale === 1) {
                  sounds.clickSound(); 
                  setLightboxState(null); 
                }
              }}
            >
              {/* Carousel Next/Prev Controls - hidden when zoomed in to preserve drag experience */}
              {zoomScale === 1 && (
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2 sm:px-4 z-50 pointer-events-none">
                  <button 
                    className="p-3.5 bg-black/40 hover:bg-black/70 border border-white/15 active:scale-90 transition-all rounded-full text-white backdrop-blur-md pointer-events-auto cursor-pointer flex items-center justify-center shadow-lg" 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      sounds.clickSound(); 
                      setZoomScale(1);
                      setLightboxState({
                        ...lightboxState,
                        index: (lightboxState.index - 1 + lightboxState.list.length) % lightboxState.list.length
                      });
                    }}
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <button 
                    className="p-3.5 bg-black/40 hover:bg-black/70 border border-white/15 active:scale-90 transition-all rounded-full text-[#EBC2C6] backdrop-blur-md pointer-events-auto cursor-pointer flex items-center justify-center shadow-lg" 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      sounds.clickSound(); 
                      setZoomScale(1);
                      setLightboxState({
                        ...lightboxState,
                        index: (lightboxState.index + 1) % lightboxState.list.length
                      });
                    }}
                  >
                    <ChevronRight size={22} />
                  </button>
                </div>
              )}

              {/* Zoomable Image Wrapper with adaptive touch dragging */}
              <motion.div 
                key={lightboxState.index}
                initial={{ scale: 0.95, opacity: 0 }} 
                animate={{ scale: zoomScale, opacity: 1 }} 
                exit={{ scale: 0.95, opacity: 0 }} 
                style={{ cursor: zoomScale > 1 ? 'grab' : 'zoom-in' }}
                whileTap={zoomScale > 1 ? { cursor: 'grabbing' } : {}}
                drag={zoomScale > 1}
                dragConstraints={lightboxContainerRef}
                dragElastic={0.15}
                dragTransition={{ bounceStiffness: 450, bounceDamping: 25 }}
                onClick={(e) => e.stopPropagation()}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  sounds.clickSound();
                  if (zoomScale > 1) {
                    setZoomScale(1);
                  } else {
                    setZoomScale(2.5);
                  }
                }}
                className="relative max-w-[95vw] max-h-[60vh] sm:max-h-[70vh] flex items-center justify-center pointer-events-auto transition-transform duration-200 ease-out" 
              >
                <img 
                  src={lightboxState.list[lightboxState.index].u} 
                  alt={lightboxState.list[lightboxState.index].l}
                  className="max-w-full max-h-[60vh] sm:max-h-[70vh] rounded-2xl shadow-[0_30px_70px_rgba(0,0,0,0.95)] object-contain border border-white/10 select-none pointer-events-none" 
                  draggable={false}
                />
              </motion.div>
            </div>

            {/* Bottom Controls Panel (Zoom buttons, description, caption) */}
            <div className="w-full max-w-xl flex flex-col items-center gap-4 z-[10002]" onClick={e => e.stopPropagation()}>
              
              {/* Floating Pill Zoom Controls BAR */}
              <div className="bg-white/10 border border-white/10 rounded-full px-5 py-2.5 flex items-center gap-4 shadow-xl backdrop-blur-2xl">
                <button 
                  onClick={() => { sounds.clickSound(); setZoomScale(z => Math.max(z - 0.5, 1)); }}
                  disabled={zoomScale === 1}
                  className="p-1.5 hover:bg-white/15 rounded-full text-white/95 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer flex items-center justify-center"
                  title="Zoom Out"
                >
                  <ZoomOut size={18} />
                </button>
                
                <span className="text-white/90 text-xs font-mono font-bold tracking-wider select-none min-w-[40px] text-center">
                  {Math.round(zoomScale * 100)}%
                </span>
                
                <button 
                  onClick={() => { sounds.clickSound(); setZoomScale(z => Math.min(z + 0.5, 4)); }}
                  disabled={zoomScale === 4}
                  className="p-1.5 hover:bg-white/15 rounded-full text-white/95 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer flex items-center justify-center"
                  title="Zoom In"
                >
                  <ZoomIn size={18} />
                </button>

                {zoomScale > 1 && (
                  <button 
                    onClick={() => { sounds.clickSound(); setZoomScale(1); }}
                    className="p-1.5 hover:bg-white/15 rounded-full text-[#EBC2C6] transition-all cursor-pointer border-l border-white/10 pl-3.5 flex items-center justify-center"
                    title="Reset Zoom"
                  >
                    <RotateCcw size={15} />
                  </button>
                )}
              </div>

              {/* Details (caption / title text) */}
              <div className="text-center font-sans tracking-wide select-text px-4 max-w-[90vw]">
                {lightboxState.list[lightboxState.index].c && (
                  <div className="text-[13px] sm:text-[14px] text-white/80 font-light max-w-md mx-auto leading-relaxed mt-1">
                    {lightboxState.list[lightboxState.index].c}
                  </div>
                )}
                {zoomScale > 1 ? (
                  <div className="text-[10px] text-white/40 mt-2 font-mono tracking-wider animate-pulse uppercase">
                    Seret untuk menjelajah • Ketuk 2x untuk normal
                  </div>
                ) : (
                  <div className="text-[10px] text-white/45 mt-2 font-mono tracking-wider uppercase">
                    Ketuk 2x atau gunakan tombol untuk memperbesar
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    )}
    </LightboxContext.Provider>
  );
};

export const S22_FinalProfile = S_CoupleProfile;

export default S_CoupleProfile;
