'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useSpring, useTransform, useMotionValue, useInView } from 'framer-motion';
import { 
  Heart, Calendar, Star, Trophy, Crown, Gift, Moon, Music, Leaf, Share2, MapPin,
  Expand, X, Check, Clock, Puzzle, ChevronLeft, ChevronRight, CheckCircle2, Image as ImageIcon,
  ZoomIn, ZoomOut, RotateCcw, ArrowLeft, Compass, Camera,
  Mic, Send, Volume2, Play, Pause, Trash2, ShieldAlert, Sparkles, Wifi, WifiOff,
  MessageSquare, Facebook, Copy, ExternalLink, Settings, Download, Layout, Bell, Smile
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
  uploadVoiceNoteToStorage,
  syncDreams,
  addDream,
  toggleDream,
  syncSchedules,
  addSchedule,
  syncLoveLetter,
  saveLoveLetter,
  syncMemories,
  addMemory,
  syncPhotos,
  addPhoto,
  deleteDream,
  db
} from '../../lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

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
  startDate: new Date("2026-04-24T00:00:00"),
  firstSong: "Last Night On Earth — Green Day",
  firstSongUrl: "https://open.spotify.com/track/5TpPSTItCwtZ8Sltr3vdzm",
  firstPromise: "Chat tengah malam",
  password: "24426",
  milestones: [
    { date: new Date("2026-04-24"), label: "Hari Jadian",       icon: "heart",    color: "#EBC2C6" },
    { date: new Date("2026-05-24"), label: "1 Bulan",           icon: "calendar", color: "#D6C2E8" },
    { date: new Date("2026-07-24"), label: "3 Bulan",           icon: "star",     color: "#B7E3E0" },
    { date: new Date("2026-10-24"), label: "6 Bulan",           icon: "trophy",   color: "#E8D5A3" },
    { date: new Date("2027-04-24"), label: "1 Tahun",           icon: "crown",    color: "#E92A60" },
    { date: new Date("2027-03-16"), label: "Ultah Nauraa ke-19", icon: "gift",     color: "#EBC2C6" },
    { date: new Date("2027-01-17"), label: "Ultah Farsya ke-20",icon: "gift",     color: "#D6C2E8" },
  ]
};

const getIndonesianMonthYear = (baseDate: Date, offsetMonths: number) => {
  const d = new Date(baseDate.getTime());
  d.setMonth(d.getMonth() + offsetMonths);
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
};

const getMilestones = (annivDate: Date) => {
  const dJadian = new Date(annivDate.getTime());
  
  const d1M = new Date(annivDate.getTime());
  d1M.setMonth(d1M.getMonth() + 1);
  
  const d3M = new Date(annivDate.getTime());
  d3M.setMonth(d3M.getMonth() + 3);
  
  const d6M = new Date(annivDate.getTime());
  d6M.setMonth(d6M.getMonth() + 6);
  
  const d1Y = new Date(annivDate.getTime());
  d1Y.setFullYear(d1Y.getFullYear() + 1);

  const dNauraa19 = new Date("2027-03-16T00:00:00");
  const dFarsya20 = new Date("2027-01-17T00:00:00");

  return [
    { date: dJadian, label: "Hari Jadian",       icon: "heart",    color: "#EBC2C6" },
    { date: d1M, label: "1 Bulan",           icon: "calendar", color: "#D6C2E8" },
    { date: d3M, label: "3 Bulan",           icon: "star",     color: "#B7E3E0" },
    { date: d6M, label: "6 Bulan",           icon: "trophy",   color: "#E8D5A3" },
    { date: d1Y, label: "1 Tahun",           icon: "crown",    color: "#EBC2C6" },
    { date: dNauraa19, label: "Ultah Nauraa ke-19", icon: "gift",     color: "#EBC2C6" },
    { date: dFarsya20, label: "Ultah Farsya ke-20",icon: "gift",     color: "#D6C2E8" },
  ];
};

const getDynamicMemories = (annivDate: Date) => {
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  
  const dJadian = new Date(annivDate.getTime());
  const dateStr0 = `${dJadian.getDate()} ${months[dJadian.getMonth()]} ${dJadian.getFullYear()}`;
  
  const dSayang = new Date(annivDate.getTime());
  const dateStr1 = `${months[dSayang.getMonth()]} ${dSayang.getFullYear()}`;
  
  const dMonth1 = new Date(annivDate.getTime());
  dMonth1.setMonth(dMonth1.getMonth() + 1);
  const dateStr2 = `${dMonth1.getDate()} ${months[dMonth1.getMonth()]} ${dMonth1.getFullYear()}`;

  const dPromise = new Date(annivDate.getTime());
  const dateStr3 = `${months[dPromise.getMonth()]} ${dPromise.getFullYear()}`;

  return [
    {
      id: 1, icon: "moon", color: "#D6C2E8", title: "Chat Tengah Malam", date: dateStr0,
      description: "Kata-kata yang mengalir jujur di tengah malam — awal dari segalanya.",
    },
    {
      id: 2, icon: "music", color: "#EBC2C6", title: "Last Night On Earth", date: "Hari-hari pertama",
      description: "Green Day menemani momen terdiam yang paling bermakna.",
    },
    {
      id: 3, icon: "heart", color: "#F0A0B0", title: "Pertama Bilang Sayang", date: dateStr1,
      description: "Farsya memberanikan diri — dan dunia terasa berubah seketika.",
    },
    {
      id: 4, icon: "star", color: "#E8D5A3", title: "Satu Bulan", date: dateStr2,
      description: "Satu bulan yang mengajarkan banyak tentang arti hadir.",
    },
    {
      id: 5, icon: "leaf", color: "#B7E3E0", title: "Janji Pertama", date: dateStr3,
      description: "Bukan di tempat mewah, tapi di percakapan yang paling tulus.",
    },
  ];
};

const THEMES = [
  {
    id: 'amour',
    name: 'Classic Amour 🌸',
    desc: 'Pink romantis & ungu lavender lembut.',
    vars: {
      '--bg-primary': '#0A0A0E',
      '--bg-secondary': '#111118',
      '--accent-pink': '#EBC2C6',
      '--accent-mint': '#B7E3E0',
      '--accent-lavender': '#D6C2E8',
      '--accent-gold': '#E8D5A3',
      '--border-glass': 'rgba(232,180,184,0.25)',
      '--border-active': 'rgba(232,180,184,0.6)',
      '--gradient-btn': 'linear-gradient(90deg, #EBC2C6 0%, #D6C2E8 100%)',
      '--gradient-card': 'linear-gradient(145deg, rgba(235,194,198,0.08) 0%, rgba(214,194,232,0.05) 100%)',
    },
    colors: ['#EBC2C6', '#D6C2E8', '#0A0A0E']
  },
  {
    id: 'cosmic',
    name: 'Cosmic Sunset 🌌',
    desc: 'Lembayung ungu malam & coral membara.',
    vars: {
      '--bg-primary': '#0E0816',
      '--bg-secondary': '#160E25',
      '--accent-pink': '#FF6B8B',
      '--accent-mint': '#34D399',
      '--accent-lavender': '#A78BFA',
      '--accent-gold': '#FBBF24',
      '--border-glass': 'rgba(255,107,139,0.25)',
      '--border-active': 'rgba(255,107,139,0.6)',
      '--gradient-btn': 'linear-gradient(90deg, #FF6B8B 0%, #A78BFA 100%)',
      '--gradient-card': 'linear-gradient(145deg, rgba(255,107,139,0.08) 0%, rgba(167,139,250,0.05) 100%)',
    },
    colors: ['#FF6B8B', '#A78BFA', '#0E0816']
  },
  {
    id: 'sakura',
    name: 'Sweet Sakura 💮',
    desc: 'Taman bunga sakura Jepang yang indah.',
    vars: {
      '--bg-primary': '#0C0409',
      '--bg-secondary': '#180B14',
      '--accent-pink': '#FFA6C9',
      '--accent-mint': '#A7F3D0',
      '--accent-lavender': '#F3E8FF',
      '--accent-gold': '#FCD34D',
      '--border-glass': 'rgba(255,166,201,0.25)',
      '--border-active': 'rgba(255,166,201,0.6)',
      '--gradient-btn': 'linear-gradient(90deg, #FFA6C9 0%, #F3E8FF 100%)',
      '--gradient-card': 'linear-gradient(145deg, rgba(255,166,201,0.08) 0%, rgba(243,232,255,0.05) 100%)',
    },
    colors: ['#FFA6C9', '#FCD34D', '#0C0409']
  },
  {
    id: 'cocoa',
    name: 'Warm Cocoa 🧸',
    desc: 'Suasana kedai kopi klasik hangat & intim.',
    vars: {
      '--bg-primary': '#140D0B',
      '--bg-secondary': '#1D1412',
      '--accent-pink': '#E07A5F',
      '--accent-mint': '#A3B19B',
      '--accent-lavender': '#F4F1DE',
      '--accent-gold': '#F2CC8F',
      '--border-glass': 'rgba(224,122,95,0.25)',
      '--border-active': 'rgba(224,122,95,0.6)',
      '--gradient-btn': 'linear-gradient(90deg, #E07A5F 0%, #F4F1DE 100%)',
      '--gradient-card': 'linear-gradient(145deg, rgba(224,122,95,0.08) 0%, rgba(244,241,222,0.05) 100%)',
    },
    colors: ['#E07A5F', '#F2CC8F', '#140D0B']
  }
];

const MEMORIES = [
  {
    id: 1, icon: "moon", color: "#D6C2E8", title: "Chat Tengah Malam", date: "24 April 2026",
    description: "Kata-kata yang mengalir jujur di tengah malam — awal dari segalanya.",
  },
  {
    id: 2, icon: "music", color: "#EBC2C6", title: "Last Night On Earth", date: "Hari-hari pertama",
    description: "Green Day menemani momen terdiam yang paling bermakna.",
  },
  {
    id: 3, icon: "heart", color: "#F0A0B0", title: "Pertama Bilang Sayang", date: "April 2026",
    description: "Farsya memberanikan diri — dan dunia terasa berubah seketika.",
  },
  {
    id: 4, icon: "star", color: "#E8D5A3", title: "Satu Bulan", date: "24 Mei 2026",
    description: "Satu bulan yang mengajarkan banyak tentang arti hadir.",
  },
  {
    id: 5, icon: "leaf", color: "#B7E3E0", title: "Janji Pertama", date: "April 2026",
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

const containerVariants: any = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05
    }
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.15 }
  }
};

const cardVariants: any = {
  hidden: { opacity: 0, y: 15 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: "spring", 
      stiffness: 110, 
      damping: 17
    } 
  }
};

const GlassCard = ({ children, className = '', onClick, delayIndex = 0 }: any) => {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    setRevealed(false);
    const raf = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        setRevealed(true);
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [delayIndex]);

  return (
    <div 
      className={`glass-card transition-all duration-[750ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
        revealed ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-[0.98]'
      } ${className}`}
      style={{
        transitionDelay: `${delayIndex * 80}ms`
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

const DailyAffirmation = ({ delayIndex = 0 }: { delayIndex?: number }) => {
  const [quote, setQuote] = useState<string>("Mengambil kutipan harian...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const res = await fetch("/api/affirmation");
        const data = await res.json();
        if (data.quote) {
           setQuote(data.quote);
        } else {
           setQuote("Setiap hari bersamamu adalah sebuah petualangan yang tak terlupakan.");
        }
      } catch (err) {
        setQuote("Cinta yang tulus mengalahkan segalanya, hari demi hari.");
      } finally {
        setLoading(false);
      }
    };
    fetchQuote();
  }, []);

  return (
    <GlassCard delayIndex={delayIndex} className="p-4 border border-[#EBC2C6]/20 bg-gradient-to-r from-pink-500/5 to-[#D6C2E8]/5 relative overflow-hidden">
      <div className="absolute top-0 right-0 -mr-4 -mt-4 opacity-10">
         <Sparkles size={60} className="text-[#EBC2C6]" />
      </div>
      <div className="flex flex-col gap-2 relative z-10 text-center items-center justify-center">
         <span className="text-[10px] font-bold tracking-widest text-[#EBC2C6] uppercase flex items-center gap-1.5 mx-auto">
            <Sparkles size={12} /> Daily Affirmation
         </span>
         {loading ? (
            <p className="text-[13px] font-medium text-white/50 italic animate-pulse py-2">Mendengarkan angin cinta...</p>
         ) : (
            <p className="text-[14px] font-medium text-white/90 leading-relaxed italic px-2">"{quote}"</p>
         )}
      </div>
    </GlassCard>
  );
};

// 1. HeroCouple
const HeroCouple = ({ now, anniversaryDate, onDateChange }: { now: Date, anniversaryDate: Date, onDateChange: (d: string) => void }) => {
  const diffTime = Math.max(0, now.getTime() - anniversaryDate.getTime());
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
        Bersama sejak <input type="date" value={anniversaryDate.toISOString().split('T')[0]} onChange={(e) => onDateChange(e.target.value)} className="bg-transparent border-b border-[#EBC2C6]/30 text-[#EBC2C6] font-mono cursor-pointer hover:border-[#EBC2C6] transition-colors outline-none" />
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
const StreakCounter = ({ now, anniversaryDate, delayIndex = 0 }: { now: Date, anniversaryDate: Date, delayIndex?: number }) => {
  const days = Math.floor((now.getTime() - anniversaryDate.getTime()) / 86400000);
  const mv = useMotionValue(0);
  const ms = useSpring(mv, { stiffness: 80, damping: 15 });
  const [disp, setDisp] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharedTextCopied, setSharedTextCopied] = useState(false);

  const getShareText = () => {
    const appUrl = typeof window !== 'undefined' ? window.location.href : 'https://ais-pre-f3yp2zgdgemtlzogz5uyz4-974043428757.asia-southeast1.run.app';
    return `💖 Nauraa & Farsya - Love Journey 💖\n\n` +
           `✨ Hari ke-${days} Bersama!\n` +
           `🔥 Streak Aktif: ${days} Hari Berturut-turut.\n` +
           `💕 Misi Petualangan: Hubungan kami penuh dengan tantangan romantis berdua.\n\n` +
           `Intip situs cinta kami bersama di sini: ${appUrl} 🌸✨`;
  };

  const handleShare = async () => {
    const text = getShareText();
    const appUrl = typeof window !== 'undefined' ? window.location.href : 'https://ais-pre-f3yp2zgdgemtlzogz5uyz4-974043428757.asia-southeast1.run.app';
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Love Journey Nauraa & Farsya',
          text: `Kami sudah bersama selama ${days} hari! 💕`,
          url: appUrl,
        });
        sounds.successSound();
      } catch (err) {
        console.warn(err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        sounds.successSound();
        setSharedTextCopied(true);
        setTimeout(() => setSharedTextCopied(false), 3000);
      } catch (e) {
        console.warn(e);
      }
    }
  };

  useEffect(() => { mv.set(days); }, [days, mv]);
  useEffect(() => { const sub = ms.on('change', v => setDisp(Math.floor(v))); return sub; }, [ms]);

  const prog = (days % 30) / 30;
  const rem = 30 - (days % 30);

  return (
    <GlassCard delayIndex={delayIndex} className="relative overflow-hidden">
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

      <div className="mt-5 pt-3 border-t border-white/5 flex justify-center">
        <button
          onClick={() => {
            sounds.sparkleChime();
            setShowShareModal(true);
          }}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-pink-500/10 to-purple-500/10 hover:from-pink-500/20 hover:to-purple-500/20 border border-pink-500/20 hover:border-pink-500/40 rounded-full text-[11px] font-bold text-[#EBC2C6] tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(235,194,198,0.1)] active:scale-95 cursor-pointer"
        >
          <Share2 size={12} />
          <span>Bagikan Kisah Kita ✨</span>
        </button>
      </div>

      {/* Share Modal Dialog Overlay */}
      {showShareModal && (
        <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm bg-[#111118] border border-white/10 rounded-[28px] overflow-hidden p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                sounds.clickSound();
                setShowShareModal(false);
              }}
              className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-full transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>

            <h3 className="text-[16px] font-bold text-center mb-1">Bagikan Kisah Cinta Kita</h3>
            <p className="text-[11px] text-[#9A9AB0] text-center mb-5">Pamerkan milestone indah hubungan kalian di media sosial.</p>

            {/* Shareable Card Preview */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-pink-500/20 via-purple-500/10 to-[#0A0A0E] border border-pink-500/20 text-center relative overflow-hidden mb-5 aspect-[4/5] flex flex-col justify-between shadow-[0_0_25px_rgba(235,194,198,0.15)]">
              <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                <Heart size={150} className="fill-white" />
              </div>

              <div className="flex justify-between items-center z-10 w-full mb-2">
                <span className="text-[9px] font-bold text-white/40 tracking-[3px] uppercase">Love Journey Card</span>
                <span className="text-[9px] font-mono font-bold bg-[#EBC2C6]/20 text-[#EBC2C6] border border-[#EBC2C6]/30 px-2 py-0.5 rounded-full">ACTIVE</span>
              </div>

              <div className="flex flex-col items-center gap-1.5 z-10 my-auto">
                <div className="flex -space-x-3 mb-2">
                  <div className="w-10 h-10 rounded-full border-2 border-[#EBC2C6] overflow-hidden bg-gray-800">
                    <img src="https://files.catbox.moe/jw0yc8.jpg" className="w-full h-full object-cover" />
                  </div>
                  <div className="w-10 h-10 rounded-full border-2 border-[#D6C2E8] overflow-hidden bg-gray-800">
                    <img src="https://files.catbox.moe/tz9k37.jpg" className="w-full h-full object-cover" />
                  </div>
                </div>
                
                <h4 className="text-lg font-black text-white leading-tight">Nauraa & Farsya</h4>
                <div className="text-[10px] text-[#EBC2C6] font-mono tracking-wider uppercase">
                  Bersama sejak {anniversaryDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>

                <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#EBC2C6] to-[#D6C2E8] mt-4 leading-none">
                  {days} HARI
                </div>
                <div className="text-[11px] text-[#9A9AB0] font-medium uppercase tracking-[2px] mt-1">Telah Kita Lahui 💕</div>
              </div>

              <div className="flex justify-center items-center gap-1 text-[9px] text-white/30 z-10 border-t border-white/5 pt-3">
                 <Sparkles size={8} className="text-yellow-300" />
                 <span>Terhubung di Lembah Cinta Abadi</span>
              </div>
            </div>

            {/* Social Sharing Selection Buttons */}
            <div className="flex flex-col gap-3">
              <span className="text-[10px] uppercase tracking-wider text-[#9A9AB0] font-bold block text-center mb-1">
                Pilih Media Sosial
              </span>
              
              <div className="grid grid-cols-2 gap-2">
                {/* WhatsApp button */}
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(getShareText())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => sounds.successSound()}
                  className="p-2.5 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 transition-all text-center flex items-center justify-center gap-1.5 text-xs font-bold"
                >
                  <MessageSquare size={13} />
                  <span>WhatsApp</span>
                </a>

                {/* Twitter / X button */}
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(getShareText())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => sounds.successSound()}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all text-center flex items-center justify-center gap-1.5 text-xs font-bold"
                >
                  <ExternalLink size={13} />
                  <span>Twitter / X</span>
                </a>

                {/* Facebook button */}
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : 'https://ais-pre-f3yp2zgdgemtlzogz5uyz4-974043428757.asia-southeast1.run.app')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => sounds.successSound()}
                  className="p-2.5 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-300 hover:text-blue-200 transition-all text-center flex items-center justify-center gap-1.5 text-xs font-bold"
                >
                  <Facebook size={13} />
                  <span>Facebook</span>
                </a>

                {/* Copy Text button */}
                <button
                  onClick={handleShare}
                  className="p-2.5 rounded-xl bg-[#EBC2C6]/15 hover:bg-[#EBC2C6]/25 border border-[#EBC2C6]/30 text-[#EBC2C6] hover:text-[#f3d4d7] transition-all text-center flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer"
                >
                  <Copy size={13} />
                  <span>Salin Cerita</span>
                </button>
              </div>

              {sharedTextCopied && (
                <div className="text-center text-[10px] text-green-400 font-bold animate-pulse">
                  ✓ Berhasil menyalin cerita cinta ke clipboard!
                </div>
              )}

              {/* Instagram Sharing Instructions Card */}
              <div className="p-3 rounded-2xl bg-gradient-to-tr from-pink-500/10 via-purple-500/5 to-[#111118]/20 border border-pink-500/10 text-[10px] leading-relaxed text-[#9A9AB0]">
                <div className="flex items-center gap-1 text-[#EBC2C6] font-bold mb-1.5">
                  <span className="text-xs">📸</span>
                  <span>Cara Bagikan ke Instagram Stories:</span>
                </div>
                <ol className="list-decimal pl-3.5 space-y-0.5 text-white/70">
                  <li>Screenshot atau simpan Kartu Cinta di atas</li>
                  <li>Buka Instagram Stories, pilih hasil screenshot</li>
                  <li>Tempel / paste caption kisah cinta yang sudah kamu salin! 💕</li>
                </ol>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </GlassCard>
  );
};

// 3. ProfileCards
const ProfileCards = ({ now, delayIndex = 0 }: { now: Date, delayIndex?: number }) => {
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
          <GlassCard delayIndex={delayIndex}>
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
                ].map((f) => <li key={f}>{f}</li>) : [
                  "Yang pertama kali bilang sayang",
                  "Kucing adalah hewan paling dimengerti",
                  "Green Day menemani momen paling berani",
                  "Capricorn yang diam-diam sangat perhatian"
                ].map((f) => <li key={f}>{f}</li>)}
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
const RelationshipStats = ({ now, anniversaryDate, delayIndex = 0 }: { now: Date, anniversaryDate: Date, delayIndex?: number }) => {
  const diff = now.getTime() - anniversaryDate.getTime();
  const d = Math.floor(diff / 86400000);
  const sec = Math.floor(diff / 1000);
  
  return (
    <GlassCard delayIndex={delayIndex} className="cursor-pointer" onClick={() => sounds.softPluck()}>
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
const MilestoneTimeline = ({ now, anniversaryDate, delayIndex = 0 }: { now: Date, anniversaryDate: Date, delayIndex?: number }) => {
  const milestones = getMilestones(anniversaryDate);
  return (
    <GlassCard delayIndex={delayIndex}>
      <h3 className="text-[16px] font-bold mb-4">Perjalanan Milestone</h3>
      <div className="milestone-list">
        {milestones.map((m, i) => {
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
const NextEventCountdown = ({ now, anniversaryDate, delayIndex = 0 }: { now: Date, anniversaryDate: Date, delayIndex?: number }) => {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    setRevealed(false);
    const raf = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        setRevealed(true);
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [delayIndex]);

  const milestones = getMilestones(anniversaryDate);
  const nextEv = [...milestones].filter(m => m.date > now).sort((a,b) => a.date.getTime() - b.date.getTime())[0];
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
      className={`p-7 rounded-[28px] border relative overflow-hidden cursor-pointer hover:scale-[1.01] transition-all duration-[750ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
        revealed ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-[0.98]'
      }`}
      style={{ 
        background: 'rgba(235,194,198,0.06)', 
        borderColor: 'rgba(235,194,198,0.2)',
        transitionDelay: `${delayIndex * 80}ms`
      }}
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
const ZodiacMatch = ({ delayIndex = 0 }: { delayIndex?: number }) => (
  <GlassCard delayIndex={delayIndex} className="cursor-pointer" onClick={() => sounds.waterDroplet()}>
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
const LoveLanguage = ({ delayIndex = 0 }: { delayIndex?: number }) => {
  const [t, setT] = useState<'Nauraa'|'Farsya'>('Nauraa');
  const items = t === 'Nauraa' ? [
    { n: "Words of Affirmation", v: 90 }, { n: "Quality Time", v: 80 }, { n: "Physical Touch", v: 70 }, { n: "Acts of Service", v: 65 }, { n: "Receiving Gifts", v: 55 }
  ] : [
    { n: "Acts of Service", v: 85 }, { n: "Quality Time", v: 88 }, { n: "Words of Affirmation", v: 75 }, { n: "Physical Touch", v: 70 }, { n: "Receiving Gifts", v: 50 }
  ];

  return (
    <GlassCard delayIndex={delayIndex}>
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
const PhotoGalleryContext = React.createContext<{
  loveFilter: boolean;
  favorites: string[];
  toggleFavorite: (url: string) => void;
} | null>(null);

const PhotoItem = ({ src, label, caption, onClick, index, className = '', isCustom, onDelete }: { src: string, label: string, caption?: string, onClick: () => void, index: number, className?: string, isCustom?: boolean, onDelete?: (e: React.MouseEvent) => void }) => {
  const galleryCtx = React.useContext(PhotoGalleryContext);
  const showLoveFilter = galleryCtx?.loveFilter || false;
  const isFavorite = galleryCtx?.favorites.includes(src) || false;
  
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
      className={`photo-item relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] cursor-zoom-in transition-all duration-300 ${className} ${showLoveFilter ? 'after:absolute after:inset-0 after:bg-pink-500/15 after:pointer-events-none after:mix-blend-color-burn' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <Photo src={src} className="w-full h-full object-cover" />
      
      {/* Love Filter visual overlay element */}
      {showLoveFilter && (
        <div className="absolute inset-0 bg-pink-500/10 pointer-events-none mix-blend-color z-10" />
      )}

      {/* Favorite Heart Button */}
      {galleryCtx && (
        <button 
          onClick={(e) => { e.stopPropagation(); galleryCtx.toggleFavorite(src); }}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute top-2 left-2 bg-[#1A0A0C]/80 p-2 rounded-full hover:scale-110 active:scale-95 transition-all z-30 shadow shadow-black/50"
        >
          <Heart size={14} className={`${isFavorite ? 'text-rose-500 fill-rose-500 animate-pulse' : 'text-white/60 hover:text-white'}`} />
        </button>
      )}

      {isCustom && onDelete && (
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(e); }}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute top-2 right-2 bg-[#1A0A0C]/80 p-2 rounded-full hover:bg-red-500 transition-colors z-30 text-white shadow shadow-black/50"
        >
          <Trash2 size={14} />
        </button>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
        <div className="flex items-center justify-between">
          <div className="text-left">
            <p className="text-[11px] font-bold text-white/90 tracking-wide">{label}</p>
            {caption && <p className="text-[10px] text-white/70 line-clamp-1">{caption}</p>}
          </div>
          <div className="flex items-center gap-1.5 z-20">
            {isFavorite && (
              <div className="p-1.5 bg-rose-500/20 text-rose-400 rounded-full backdrop-blur-md border border-rose-500/35">
                <Heart size={12} className="fill-current text-rose-400" />
              </div>
            )}
            <div className="p-1.5 bg-white/10 rounded-full backdrop-blur-md">
              <Expand size={14} className="text-white" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const PhotoGallery = ({ delayIndex = 0, activeUser }: { delayIndex?: number, activeUser: 'Nauraa' | 'Farsya' }) => {
  const [tab, setTab] = useState<'N'|'F'|'B'>('B');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Dates' | 'Liburan' | 'Selfies'>('All');
  const { open } = useLightbox();

  const [loveFilter, setLoveFilter] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('love_favorite_photos');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleFavorite = (url: string) => {
    sounds.clickSound();
    const isFav = favorites.includes(url);
    const newFavs = isFav ? favorites.filter(id => id !== url) : [...favorites, url];
    setFavorites(newFavs);
    localStorage.setItem('love_favorite_photos', JSON.stringify(newFavs));
  };

  // Load custom photos from Firebase or falling back to local
  const [syncedPhotos, setSyncedPhotos] = useState<any[]>([]);

  useEffect(() => {
    const unsub = syncPhotos((photos) => {
      setSyncedPhotos(photos);
    });
    return () => unsub();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    sounds.clickSound();
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      const caption = prompt("Beri caption untuk foto ini?", `Kenangan Baru - ${new Date().toLocaleDateString()}`) || "";
      await addPhoto(base64, caption, tab, activeUser);
      sounds.successSound();
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePhoto = async (id: string | undefined, url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.clickSound();
    if (id) {
       await deleteDoc(doc(db, 'photos', id));
    }
  };

  const getPhotos = () => {
    if (tab === 'N') {
      const cats = ['Selfies', 'Dates', 'Selfies', 'Liburan'];
      const base = NAURA.photos.map((u, i) => ({ 
        u, 
        l: 'Nauraa Rayyani Ayu', 
        c: 'Senyum manis Nauraa Rayyani Ayu', 
        cat: cats[i % cats.length] 
      }));
      const custom = syncedPhotos.filter(p => p.tab === 'N').map(x => ({ id: x.id, u: x.url, l: 'Nauraa Rayyani Ayu', c: x.caption, cat: 'Selfies', isCustom: true }));
      return [...custom, ...base];
    }
    if (tab === 'F') {
      const cats = ['Selfies', 'Dates', 'Liburan', 'Selfies'];
      const base = FARSYA.photos.map((u, i) => ({ 
        u, 
        l: 'Farsya Zahri', 
        c: 'Pose hangat Farsya Zahri', 
        cat: cats[i % cats.length] 
      }));
      const custom = syncedPhotos.filter(p => p.tab === 'F').map(x => ({ id: x.id, u: x.url, l: 'Farsya Zahri', c: x.caption, cat: 'Selfies', isCustom: true }));
      return [...custom, ...base];
    }
    const cats = ['Dates', 'Selfies', 'Liburan', 'Dates', 'Liburan', 'Dates', 'Liburan', 'Selfies', 'Selfies', 'Dates', 'Liburan'];
    const base = TOGETHER_PHOTOS.map((x, i) => ({ 
      u: x.url, 
      l: 'Berdua', 
      c: x.caption, 
      cat: cats[i % cats.length] 
    }));
    const custom = syncedPhotos.filter(p => p.tab === 'B').map(x => ({ id: x.id, u: x.url, l: 'Berdua', c: x.caption, cat: 'Dates', isCustom: true }));
    return [...custom, ...base];
  };

  const allPhotosForTab = getPhotos();
  const filteredPhotos = categoryFilter === 'All' 
    ? allPhotosForTab 
    : allPhotosForTab.filter(p => p.cat === categoryFilter);

  return (
    <PhotoGalleryContext.Provider value={{ loveFilter, favorites, toggleFavorite }}>
      <GlassCard delayIndex={delayIndex}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-[16px] font-bold">Foto Kita</h3>
            <p className="text-[11px] text-[#9A9AB0]">Momen terindah perjalanan cinta kita</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Love Filter Toggle Button */}
            <button 
              onClick={() => { sounds.clickSound(); setLoveFilter(!loveFilter); }}
              className={`text-[10px] px-3 py-1.5 rounded-full flex gap-1.5 items-center cursor-pointer transition-all border active:scale-95 ${loveFilter ? 'bg-pink-500/20 text-pink-300 border-pink-500/40 shadow-[0_0_10px_rgba(244,63,94,0.35)] font-semibold' : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white'}`}
            >
              <Sparkles size={11} className={loveFilter ? 'text-pink-300 animate-[spin_4s_linear_infinite]' : ''} />
              <span>Love Filter: {loveFilter ? 'ON 💖' : 'OFF'}</span>
            </button>

            {loveFilter && (
              <button 
                onClick={() => { sounds.clickSound(); setLoveFilter(false); }}
                className="text-[10px] px-3 py-1.5 rounded-full flex gap-1.5 items-center cursor-pointer transition-all border border-pink-500/35 bg-pink-500/10 hover:bg-pink-500/25 active:scale-95 font-semibold text-pink-200"
              >
                <RotateCcw size={11} className="text-pink-300 animate-spin-slow" />
                <span>Reset Pin</span>
              </button>
            )}

            <label className="text-[10px] bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full flex gap-1.5 items-center cursor-pointer transition-colors border border-white/5 active:scale-95 text-[#EBC2C6]">
              <Camera size={14} /> Tambah Foto
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>
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
                  isCustom={(p as any).isCustom}
                  onDelete={(e) => handleDeletePhoto((p as any).id, p.u, e)}
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
                      isCustom={(p as any).isCustom}
                      onDelete={(e) => handleDeletePhoto((p as any).id, p.u, e)}
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
                    isCustom={(filteredPhotos[0] as any).isCustom}
                    onDelete={(e) => handleDeletePhoto((filteredPhotos[0] as any).id, filteredPhotos[0].u, e)}
                    src={filteredPhotos[0].u}
                    label={filteredPhotos[0].l}
                    caption={filteredPhotos[0].c}
                    index={0}
                    onClick={() => { sounds.clickSound(); open(filteredPhotos, 0); }}
                    className="photo-featured"
                  />
                  {filteredPhotos.slice(1).map((p, i) => (
                    <PhotoItem
                      isCustom={(p as any).isCustom}
                      onDelete={(e) => handleDeletePhoto((p as any).id, p.u, e)}
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
                    isCustom={(filteredPhotos[0] as any).isCustom}
                    onDelete={(e) => handleDeletePhoto((filteredPhotos[0] as any).id, filteredPhotos[0].u, e)}
                    src={filteredPhotos[0].u} 
                    label="Berdua"
                    caption={filteredPhotos[0].c}
                    onClick={() => { sounds.clickSound(); open(filteredPhotos, 0); }}
                    index={0}
                    className="photo-item-full"
                  />

                  {/* [1][2] */}
                  <PhotoItem 
                    isCustom={(filteredPhotos[1] as any).isCustom}
                    onDelete={(e) => handleDeletePhoto((filteredPhotos[1] as any).id, filteredPhotos[1].u, e)}
                    src={filteredPhotos[1].u} 
                    label="Berdua"
                    caption={filteredPhotos[1].c}
                    onClick={() => { sounds.clickSound(); open(filteredPhotos, 1); }}
                    index={1}
                    className="photo-item-sq"
                  />

                  <PhotoItem 
                    isCustom={(filteredPhotos[2] as any).isCustom}
                    onDelete={(e) => handleDeletePhoto((filteredPhotos[2] as any).id, filteredPhotos[2].u, e)}
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
                      isCustom={(filteredPhotos[3] as any).isCustom}
                      onDelete={(e) => handleDeletePhoto((filteredPhotos[3] as any).id, filteredPhotos[3].u, e)}
                      src={filteredPhotos[3].u} 
                      label="Berdua"
                      caption={filteredPhotos[3].c}
                      onClick={() => { sounds.clickSound(); open(filteredPhotos, 3); }}
                      index={3}
                      className="photo-item-sq"
                    />

                    <PhotoItem 
                      isCustom={(filteredPhotos[4] as any).isCustom}
                      onDelete={(e) => handleDeletePhoto((filteredPhotos[4] as any).id, filteredPhotos[4].u, e)}
                      src={filteredPhotos[4].u} 
                      label="Berdua"
                      caption={filteredPhotos[4].c}
                      onClick={() => { sounds.clickSound(); open(filteredPhotos, 4); }}
                      index={4}
                      className="photo-item-sq"
                    />

                    <PhotoItem 
                      isCustom={(filteredPhotos[5] as any).isCustom}
                      onDelete={(e) => handleDeletePhoto((filteredPhotos[5] as any).id, filteredPhotos[5].u, e)}
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
                    isCustom={(filteredPhotos[6] as any).isCustom}
                    onDelete={(e) => handleDeletePhoto((filteredPhotos[6] as any).id, filteredPhotos[6].u, e)}
                    src={filteredPhotos[6].u} 
                    label="Berdua"
                    caption={filteredPhotos[6].c}
                    onClick={() => { sounds.clickSound(); open(filteredPhotos, 6); }}
                    index={6}
                    className="photo-item-sq"
                  />

                  <PhotoItem 
                    isCustom={(filteredPhotos[7] as any).isCustom}
                    onDelete={(e) => handleDeletePhoto((filteredPhotos[7] as any).id, filteredPhotos[7].u, e)}
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
                      isCustom={(filteredPhotos[8] as any).isCustom}
                      onDelete={(e) => handleDeletePhoto((filteredPhotos[8] as any).id, filteredPhotos[8].u, e)}
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
                      isCustom={(filteredPhotos[9] as any).isCustom}
                      onDelete={(e) => handleDeletePhoto((filteredPhotos[9] as any).id, filteredPhotos[9].u, e)}
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
                      isCustom={(filteredPhotos[10] as any).isCustom}
                      onDelete={(e) => handleDeletePhoto((filteredPhotos[10] as any).id, filteredPhotos[10].u, e)}
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
    </PhotoGalleryContext.Provider>
  );
};

// 10. MemoryBoard
const MemoryBoard = ({ anniversaryDate, delayIndex = 0 }: { anniversaryDate: Date, delayIndex?: number }) => {
  const [memories, setMemories] = useState<any[]>(() => {
    const saved = localStorage.getItem('love_journey_memories');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return getDynamicMemories(anniversaryDate);
  });

  const [isCleanupMode, setIsCleanupMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('love_journey_memories');
    if (!saved) {
      setMemories(getDynamicMemories(anniversaryDate));
    }
  }, [anniversaryDate]);

  const [memoryLikes, setMemoryLikes] = useState<{[key: number]: number}>(() => {
    try {
      const saved = localStorage.getItem('love_journey_memory_likes');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [floatingHearts, setFloatingHearts] = useState<{id: string, x: number, y: number}[]>([]);
  const [expandedCardId, setExpandedCardId] = useState<number | null>(null);

  const handleLikeMemory = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    sounds.clickSound();
    
    // Heart animation
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top;
    
    const heartId = Date.now().toString() + Math.random();
    setFloatingHearts(prev => [...prev, {id: heartId, x, y}]);
    setTimeout(() => {
        setFloatingHearts(prev => prev.filter(h => h.id !== heartId));
    }, 1000);
    
    setMemoryLikes(prev => {
        const newLikes = { ...prev, [id]: (prev[id] || 0) + 1 };
        localStorage.setItem('love_journey_memory_likes', JSON.stringify(newLikes));
        return newLikes;
    });
  };

  const saveMemories = (newList: any[]) => {
    setMemories(newList);
    localStorage.setItem('love_journey_memories', JSON.stringify(newList));
  };

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

  const handleToggleSelectChange = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Bulk Delete
  const handleBulkDelete = () => {
    sounds.clickSound();
    const newList = memories.filter(m => !selectedIds.includes(m.id));
    saveMemories(newList);
    setSelectedIds([]);
    setIsCleanupMode(false);
  };

  // Bulk Archive
  const handleBulkArchive = () => {
    sounds.sparkleChime();
    const newList = memories.map(m => 
      selectedIds.includes(m.id) ? { ...m, isArchived: true } : m
    );
    saveMemories(newList);
    setSelectedIds([]);
    setIsCleanupMode(false);
  };

  // Reset memories to default
  const handleResetMemories = () => {
    sounds.waterDroplet();
    saveMemories(getDynamicMemories(anniversaryDate));
    setSelectedIds([]);
    setIsCleanupMode(false);
  };

  // Helper to add fake duplicates / old memories for demonstration
  const handleAddDemoElements = () => {
    sounds.sparkleChime();
    const demoItems = [
      {
        id: Date.now(),
        icon: 'heart',
        color: '#EBC2C6',
        title: 'Chat Tengah Malam', // Duplicate of id 1
        date: '24 Maret 2026', // Old date
        description: 'Salinan duplikat dari obrolan pertama kita — ayo bersihkan ini!',
        isDemo: true
      },
      {
        id: Date.now() + 1,
        icon: 'music',
        color: '#D6C2E8',
        title: 'Momen Duplikat 1',
        date: '15 Maret 2026', // Old date
        description: 'Contoh memori usang dari bulan Maret yang harus dibersihkan.',
        isDemo: true
      },
      {
        id: Date.now() + 2,
        icon: 'music',
        color: '#D6C2E8',
        title: 'Momen Duplikat 1', // Duplicate title
        date: '10 April 2026',
        description: 'Satu lagi memori dengan judul yang sama dengan di atas.',
        isDemo: true
      }
    ];
    saveMemories([...memories, ...demoItems]);
  };

  // Process list
  const activeMemories = memories.filter(m => showArchived ? m.isArchived : !m.isArchived);

  // Checks for duplicates
  const duplicateTitles = activeMemories.reduce((acc: {[key: string]: number}, m) => {
    acc[m.title] = (acc[m.title] || 0) + 1;
    return acc;
  }, {});

  const processedMemories = activeMemories.map(m => {
    const isDuplicate = duplicateTitles[m.title] > 1;
    const isOld = m.date.includes('Maret') || m.date.includes('Mar') || m.date.includes('2025');
    return {
      ...m,
      isDuplicate,
      isOld
    };
  });

  return (
    <GlassCard delayIndex={delayIndex} className="p-0 overflow-hidden pt-5 pb-5">
      <div className="px-5 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-[16px] font-bold text-white">Kenangan Manis</h3>
          <p className="text-[12px] text-[#9A9AB0] mt-1">Momen yang selalu kita ingat dan abadikan</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle show archived */}
          <button
            type="button"
            onClick={() => { sounds.clickSound(); setShowArchived(prev => !prev); }}
            className={`text-[11px] font-bold px-3 py-1.5 rounded-full transition-all border cursor-pointer ${
              showArchived 
                ? 'bg-purple-500/20 text-[#D6C2E8] border-purple-500/40' 
                : 'bg-white/5 text-white/50 border-white/10 hover:text-white'
            }`}
          >
            {showArchived ? 'Lihat Aktif' : 'Lihat Arsip 📁'}
          </button>

          {/* Toggle cleanup mode */}
          <button
            type="button"
            onClick={() => { sounds.clickSound(); setIsCleanupMode(prev => !prev); setSelectedIds([]); }}
            className={`text-[11px] font-bold px-3 py-1.5 rounded-full transition-all border flex items-center gap-1.5 cursor-pointer ${
              isCleanupMode 
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                : 'bg-white/5 text-white/50 border-white/10 hover:text-white hover:border-white/20'
            }`}
          >
            <span>🧹 {isCleanupMode ? 'Selesai Bersihkan' : 'Arsip & Bersihkan'}</span>
          </button>

          {/* Reset button if list is customized */}
          {memories.length !== 5 && (
            <button
              type="button"
              onClick={handleResetMemories}
              className="text-[11px] font-bold bg-white/5 text-white/40 border border-white/10 hover:text-white/70 hover:border-white/20 px-3 py-1.5 rounded-full transition-all cursor-pointer"
              title="Kembalikan semua memori bawaan"
            >
              Reset 🔄
            </button>
          )}
        </div>
      </div>

      {/* Danger/Highlight alert if cleanup mode is active */}
      {isCleanupMode && (
        <div className="mx-5 mb-4 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-orange-200">
          <div className="flex flex-col gap-0.5">
            <span className="font-bold flex items-center gap-1">⚠️ Mode Pembersihan Aktif</span>
            <span>Memori dengan tanda berwarna <strong className="text-red-400">⚠️ Duplikat</strong> atau <strong className="text-orange-400">⏳ Usang</strong> disorot otomatis untuk memudahkan perapian.</span>
          </div>
          <button 
            type="button"
            onClick={handleAddDemoElements}
            className="self-start sm:self-center bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-300 px-2.5 py-1 rounded-lg transition-colors font-bold text-[10px] cursor-pointer"
          >
            + Buat Contoh Duplikat untuk Tes
          </button>
        </div>
      )}

      {processedMemories.length === 0 ? (
        <div className="text-center py-10 text-white/40 italic text-xs mx-5 bg-white/[0.01] border border-dashed border-white/10 rounded-2xl">
          Tidak ada memori di folder ini. {showArchived ? 'Arsip Anda kosong.' : 'Silakan gunakan tombol Reset untuk memulihkan!'}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto scroll-snap-x pl-6 pr-6 pb-5 pt-2 scrollbar-none">
          {processedMemories.map((m) => {
            const isSelected = selectedIds.includes(m.id);
            return (
              <motion.div 
                key={m.id} 
                whileHover={isCleanupMode ? {} : { y: -4, borderColor: `${m.color}60` }} 
                onClick={() => {
                  if (isCleanupMode) {
                    sounds.clickSound();
                    handleToggleSelectChange(m.id);
                  } else {
                    sounds.knockSound();
                    setExpandedCardId(m.id);
                  }
                }}
                className={`relative shrink-0 w-[210px] h-[190px] snap-start bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col border-l-[3px] transition-all cursor-pointer select-none group ${
                  isSelected ? 'ring-2 ring-rose-400 border-rose-400 shadow-lg shadow-rose-500/10' : ''
                } ${
                  isCleanupMode && m.isDuplicate ? 'ring-1 ring-red-500/50 hover:bg-red-500/5 border-red-500/20' : ''
                } ${
                  isCleanupMode && m.isOld && !m.isDuplicate ? 'ring-1 ring-orange-500/50 hover:bg-orange-500/5 border-orange-500/20' : ''
                }`}
                style={{ borderLeftColor: isCleanupMode ? (m.isDuplicate ? '#ef4444' : m.isOld ? '#f97316' : m.color) : m.color }}
              >
                {/* Selection checkbox overlay in cleanup mode */}
                {isCleanupMode && (
                  <div className="absolute top-3 right-3 z-10 w-5 h-5 rounded-full border border-white/30 flex items-center justify-center bg-black/40">
                    <div className={`w-3 h-3 rounded-full transition-all ${isSelected ? 'bg-rose-400 scale-100' : 'scale-0'}`} />
                  </div>
                )}

                {/* Badges */}
                <div className="flex items-center gap-1.5 mb-2.5">
                  <div className="shrink-0">{getIcon(m.icon, 20, m.color)}</div>
                  {isCleanupMode && m.isDuplicate && (
                    <span className="text-[9px] bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded border border-red-500/30 font-bold uppercase tracking-wider motion-safe:animate-pulse">
                      ⚠️ Duplikat
                    </span>
                  )}
                  {isCleanupMode && m.isOld && (
                    <span className="text-[9px] bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded border border-orange-500/30 font-bold uppercase tracking-wider">
                      ⏳ Usang
                    </span>
                  )}
                </div>

                <h4 className="font-bold text-[13px] leading-tight mb-1 text-white truncate">{m.title}</h4>
                <div className="text-[9px] uppercase tracking-wider font-semibold mb-2" style={{ color: m.color }}>{m.date}</div>
                <p className="text-[11px] text-[#9A9AB0] leading-relaxed line-clamp-3">{m.description}</p>
                
                {/* Single Delete/Archive in normal view if user wants to play around */}
                {!isCleanupMode && (
                  <div className="mt-auto pt-2 flex justify-between items-center opacity-0 hover:opacity-100 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => handleLikeMemory(e, m.id)}
                      className="text-[10px] flex items-center gap-1.5 text-rose-400/80 hover:text-rose-400 p-1.5 rounded cursor-pointer"
                    >
                      <Heart size={14} className={memoryLikes[m.id] ? "fill-current scale-110" : "scale-100"} />
                      <span className="font-bold">{memoryLikes[m.id] ? memoryLikes[m.id] : ""}</span>
                    </button>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        sounds.clickSound();
                        saveMemories(memories.filter(x => x.id !== m.id));
                      }}
                      className="text-[10px] text-rose-400/70 hover:text-rose-400 p-1 rounded cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Floating Action Buttons for cleanup mode */}
      {isCleanupMode && selectedIds.length > 0 && (
        <div className="mx-5 mt-4 p-2.5 rounded-xl bg-rose-950/20 border border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-200">
          <span className="font-semibold text-[11px] px-1 text-rose-300">Terpilih: <strong>{selectedIds.length}</strong> memori</span>
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={() => setSelectedIds([])}
              className="flex-1 sm:flex-none text-[11px] font-bold text-white/60 hover:text-white px-3.5 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 transition-all cursor-pointer"
            >
              Batal
            </button>
            <button 
              type="button"
              onClick={handleBulkArchive}
              className="flex-1 sm:flex-none text-[11px] font-bold bg-purple-600/30 text-[#D6C2E8] border border-purple-500/30 hover:bg-purple-600/40 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer"
            >
              📁 Arsipkan Terpilih
            </button>
            <button 
              type="button"
              onClick={handleBulkDelete}
              className="flex-1 sm:flex-none text-[11px] font-bold bg-rose-600 hover:bg-rose-500 text-white px-3.5 py-1.5 rounded-lg shadow-sm shadow-rose-500/10 transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <Trash2 size={11} />
              <span>Hapus Massal</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Hearts Animation */}
      <AnimatePresence>
        {floatingHearts.map(heart => (
          <motion.div
            key={heart.id}
            initial={{ opacity: 1, y: heart.y, x: heart.x, scale: 0.5 }}
            animate={{ opacity: 0, y: heart.y - 120, scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="fixed z-[9999] pointer-events-none text-rose-400"
          >
            <Heart size={32} className="fill-rose-400 drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]" />
          </motion.div>
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {expandedCardId && (() => {
           const card = activeMemories.find(m => m.id === expandedCardId);
           if (!card) return null;
           return (
             <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
               onClick={() => setExpandedCardId(null)}
             >
               <motion.div
                 initial={{ opacity: 0, scale: 0.9, y: 20 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.9, y: 20 }}
                 className="bg-[#1C1C28] border border-white/10 p-6 rounded-3xl max-w-sm w-full relative shadow-2xl"
                 onClick={e => e.stopPropagation()}
                 style={{ borderTop: `4px solid ${card.color}` }}
               >
                 <button onClick={() => setExpandedCardId(null)} className="absolute top-4 right-4 text-white/50 hover:text-white cursor-pointer bg-white/5 p-1.5 rounded-full hover:bg-white/10 transition-colors">
                   <X size={16} />
                 </button>
                 <div className="flex items-center gap-3 mb-5 mt-2">
                   {getIcon(card.icon, 32, card.color)}
                   <div>
                     <h4 className="font-bold text-lg leading-tight text-white mb-1">{card.title}</h4>
                     <div className="text-xs uppercase tracking-wider font-semibold" style={{ color: card.color }}>{card.date}</div>
                   </div>
                 </div>
                 <p className="text-[13px] text-[#9A9AB0] leading-relaxed mb-8 whitespace-pre-wrap">{card.description}</p>
                 
                 <div className="flex justify-between items-center pt-4 border-t border-white/5">
                   <button 
                     onClick={(e) => handleLikeMemory(e, card.id)} 
                     className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-all cursor-pointer active:scale-95"
                   >
                     <Heart size={16} className={memoryLikes[card.id] ? "fill-current" : ""} />
                     <span className="text-[11px] font-bold">{memoryLikes[card.id] || "Suka"}</span>
                   </button>
                   
                   <button 
                     onClick={(e) => {
                       e.stopPropagation();
                       sounds.clickSound();
                       saveMemories(memories.filter(x => x.id !== card.id));
                       setExpandedCardId(null);
                     }}
                     className="text-[11px] text-white/40 hover:text-rose-400 px-3 py-1.5 flex items-center gap-1.5 cursor-pointer bg-white/5 rounded-full hover:bg-white/10 transition-colors"
                   >
                     <Trash2 size={12} /> Hapus
                   </button>
                 </div>
               </motion.div>
             </motion.div>
           );
        })()}
      </AnimatePresence>
    </GlassCard>
  );
};

// 10b. MemoriesTimeline
const MemoriesTimeline = ({ anniversaryDate, delayIndex = 0 }: { anniversaryDate: Date, delayIndex?: number }) => {
  const { open } = useLightbox();
  const timelineData = [
    { date: getIndonesianMonthYear(anniversaryDate, 0), title: "Awal Cerita", desc: "Setiap hembusan napas dan senyum yang kita bagi melahirkan lembaran baru.", img: "https://files.catbox.moe/btdvy4.jpg", type: 'past' },
    { date: getIndonesianMonthYear(anniversaryDate, 1), title: "Tatapan Hangat", desc: "Dalam matamu, aku menemukan dunia yang penuh kehangatan and kedamaian.", img: "https://files.catbox.moe/5kgxtb.jpg", type: 'past' },
    { date: getIndonesianMonthYear(anniversaryDate, 2), title: "Detik Berharga", desc: "Menghabiskan waktu denganmu adalah bagian terbaik dari setiap hariku.", img: "https://files.catbox.moe/d5zgaf.jpg", type: 'past' },
    { date: getIndonesianMonthYear(anniversaryDate, 3), title: "Cerita Bahagia", desc: "Mengukir senyum dan tawa indah yang takkan pernah pudar oleh waktu.", img: "https://files.catbox.moe/ih96oo.jpg", type: 'past' },
    { date: getIndonesianMonthYear(anniversaryDate, 4), title: "Merajut Asa", desc: "Membangun mimpi indah bersamamu selamanya.", type: 'future' },
  ];

  const [searchQuery, setSearchQuery] = useState("");
  const [timelineLikes, setTimelineLikes] = useState<{[key: string]: number}>(() => {
    try {
      const saved = localStorage.getItem('love_journey_timeline_likes');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [floatingHearts, setFloatingHearts] = useState<{id: string, x: number, y: number}[]>([]);

  const handleLikeTimeline = (e: React.MouseEvent, title: string) => {
    e.stopPropagation();
    sounds.clickSound();
    
    // Heart animation
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top;
    
    const heartId = Date.now().toString() + Math.random();
    setFloatingHearts(prev => [...prev, {id: heartId, x, y}]);
    setTimeout(() => {
        setFloatingHearts(prev => prev.filter(h => h.id !== heartId));
    }, 1000);

    setTimelineLikes(prev => {
        const newLikes = { ...prev, [title]: (prev[title] || 0) + 1 };
        localStorage.setItem('love_journey_timeline_likes', JSON.stringify(newLikes));
        return newLikes;
    });
  };

  const filteredTimeline = timelineData.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <GlassCard delayIndex={delayIndex} className="relative overflow-hidden w-full">
      <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-3 mb-6">
        <h3 className="text-[16px] font-bold text-white">Timeline Kenangan</h3>
        <div className="flex items-center gap-2 w-full sm:w-auto">
            <button 
                onClick={() => exportTimelineAsJSON(timelineData)}
                className="p-2 bg-white/5 border border-white/10 rounded-full text-white/50 hover:text-white transition-all cursor-pointer"
                title="Ekspor Timeline"
            >
                <Download size={14} />
            </button>
            <input 
                type="text"
                placeholder="Cari momen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-[200px] bg-white/5 border border-white/10 rounded-full px-4 py-2 text-[12px] text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-[#EBC2C6] focus:border-[#EBC2C6]/50 transition-all shadow-inner"
            />
        </div>
      </div>
      
      {filteredTimeline.length === 0 ? (
        <div className="text-center py-8 text-[12px] text-[#9A9AB0] bg-white/5 rounded-2xl border border-dashed border-white/10 italic">
            Tidak ada kenangan yang cocok.
        </div>
      ) : (
        <div className="relative border-l-2 border-[#EBC2C6]/30 pl-[28px] space-y-7">
          {filteredTimeline.map((item, i) => (
            <motion.div key={item.id || `${item.date}-${item.title}`} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ delay: 0.1, duration: 0.5, ease: 'easeOut' }} className="relative flex items-start gap-4 group/timeline">
              <div className="absolute -left-[35px] top-1.5 w-[12px] h-[12px] rounded-full bg-[#EBC2C6] shadow-[0_0_8px_#EBC2C6] group-hover/timeline:scale-125 transition-transform" />
              <div className="flex-1">
                <div className="text-[10px] text-[#EBC2C6] font-bold tracking-widest uppercase mb-1">{item.date}</div>
                <h4 className="text-[15px] font-bold text-white mb-1.5">{item.title}</h4>
                <p className="text-[12px] text-[#9A9AB0] leading-relaxed line-clamp-2 md:line-clamp-none">{item.desc}</p>
                
                <div className="mt-2.5 flex items-center gap-2">
                    <button 
                      onClick={(e) => handleLikeTimeline(e, item.title)} 
                      className="flex items-center gap-1 text-[11px] font-semibold text-rose-400/80 hover:text-rose-400 hover:bg-rose-400/10 px-2 py-1 rounded-md transition-all cursor-pointer active:scale-95"
                    >
                        <Heart size={13} className={timelineLikes[item.title] ? "fill-current" : ""} />
                        <span>{timelineLikes[item.title] > 0 ? timelineLikes[item.title] : "Suka"}</span>
                    </button>
                </div>
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
      )}

      {/* Floating Hearts Animation for Timeline */}
      <AnimatePresence>
        {floatingHearts.map(heart => (
          <motion.div
            key={heart.id}
            initial={{ opacity: 1, y: heart.y, x: heart.x, scale: 0.5 }}
            animate={{ opacity: 0, y: heart.y - 120, scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="fixed z-[9999] pointer-events-none text-rose-400"
          >
            <Heart size={32} className="fill-rose-400 drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]" />
          </motion.div>
        ))}
      </AnimatePresence>
    </GlassCard>
  );
};

// 11. BucketListPreview
const BucketListPreview = ({ delayIndex = 0, activeUser }: { delayIndex?: number, activeUser: string }) => {
  const [list, setList] = useState<any[]>([]);
  const [newDream, setNewDream] = useState('');

  useEffect(() => {
    const unsub = syncDreams(
      (dreams) => setList(dreams),
      (err) => console.error("Dream sync failed", err)
    );
    return () => unsub();
  }, []);

  const handleAddDream = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newDream.trim()) return;
    
    sounds.sparkleChime();
    const colors = ["#EBC2C6", "#B7E3E0", "#D6C2E8", "#E8D5A3", "#F3A1A1", "#A6C1EE"];
    const randomColor = colors[list.length % colors.length];
    
    await addDream(newDream.trim(), randomColor, activeUser);
    setNewDream('');
  };

  const handleToggleDream = async (id: string, currentStatus: boolean) => {
    if (!currentStatus) sounds.sparkleChime();
    else sounds.clickSound();
    await toggleDream(id, !currentStatus);
  };
  
  const handleArchive = async (id: string) => {
     sounds.clickSound();
     await deleteDream(id);
  };

  return (
    <GlassCard delayIndex={delayIndex}>
      <div className="flex justify-between items-start mb-1">
        <div>
          <h3 className="text-[16px] font-bold">Impian Kita ✨</h3>
          <p className="text-[12px] text-[#9A9AB0]">Daftar impian dan harapan indah berdua (Cloud Synced)</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className="text-[11px] font-mono font-bold text-[#EBC2C6] bg-[#EBC2C6]/10 px-2.5 py-1 rounded-full border border-[#EBC2C6]/20 shadow-sm shadow-pink-500/5 uppercase">
            {list.filter(x => x.done).length} / {list.length} Tercapai
          </span>
        </div>
      </div>

      <form onSubmit={handleAddDream} className="flex gap-2 my-4">
        <input
          type="text"
          value={newDream}
          onChange={(e) => setNewDream(e.target.value)}
          placeholder="Tulis impian baru kita di sini..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-[#EBC2C6]/50 transition-colors"
        />
        <button
          type="submit"
          disabled={!newDream.trim()}
          className="px-4 py-2 bg-gradient-to-r from-[#EBC2C6] to-[#D6C2E8] disabled:from-white/5 disabled:to-white/5 disabled:border-white/5 disabled:text-white/20 hover:opacity-90 active:scale-95 text-[#1A0A0C] font-bold text-xs rounded-xl border border-white/5 shadow transition-all cursor-pointer select-none"
        >
          Simpan ✨
        </button>
      </form>

      {list.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
          <p className="text-[12px] text-white/40 italic">Belum ada daftar impian kita. Mari buat satu! 🥰</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin">
          {list.map((it) => (
            <motion.div 
              key={it.id} 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="group flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-white/[0.03] border border-transparent hover:border-white/5 transition-all cursor-pointer" 
              onClick={() => handleToggleDream(it.id, it.done)}
            >
              <div className="flex items-center gap-3 flex-1 overflow-hidden">
                <div 
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${it.done ? 'bg-[#EBC2C6] border-[#EBC2C6]' : 'border-white/20'}`}
                  style={{ borderColor: it.done ? 'var(--accent-pink)' : it.color }}
                >
                  {it.done && <Check size={12} className="text-black" />}
                </div>
                <span className={`text-[13px] font-medium truncate ${it.done ? 'text-[#9A9AB0] line-through' : 'text-white'}`}>
                  {it.text}
                </span>
                {it.userId && (
                   <span className="text-[8px] px-1 bg-white/10 rounded-sm text-[#EBC2C6]/60 font-mono uppercase shrink-0">{it.userId}</span>
                )}
              </div>
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); handleArchive(it.id); }}
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-rose-500/10 rounded-lg text-[#9A9AB0] hover:text-rose-400 transition-all cursor-pointer"
              >
                <Trash2 size={13} />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </GlassCard>
  );
};

// 12. ScoreSummary
const ScoreSummary = ({ scores, delayIndex = 0 }: { scores: GameScores, delayIndex?: number }) => {
  return (
    <GlassCard delayIndex={delayIndex} className="cursor-pointer" onClick={() => sounds.gameCoin()}>
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
const MoodGridCalendar = ({ currentMoodLogs, activeUser }: { currentMoodLogs: any[], activeUser: string }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();
  
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const moodMap = React.useMemo(() => {
    const map: {[key: string]: any[]} = {};
    currentMoodLogs.forEach(log => {
      const d = log.dateStr;
      if (!map[d]) map[d] = [];
      map[d].push(log);
    });
    return map;
  }, [currentMoodLogs]);

  const days = daysInMonth(viewDate.getMonth(), viewDate.getFullYear());
  const startDay = firstDayOfMonth(viewDate.getMonth(), viewDate.getFullYear());

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mt-6">
      <div className="flex items-center justify-between mb-4 px-1">
        <h4 className="text-[11px] font-bold text-[#EBC2C6] uppercase tracking-[0.2em]">{monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}</h4>
        <div className="flex gap-2">
          <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="p-1 hover:bg-white/10 rounded-full text-white/50"><ChevronLeft size={14}/></button>
          <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="p-1 hover:bg-white/10 rounded-full text-white/50"><ChevronRight size={14}/></button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['M', 'S', 'S', 'R', 'K', 'J', 'S'].map((d, i) => <span key={`${d}-${i}`} className="text-[9px] text-[#9A9AB0] font-bold">{d}</span>)}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startDay }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: days }).map((_, i) => {
          const d = i + 1;
          const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), d);
          const dateStr = date.toDateString();
          const moods = moodMap[dateStr] || [];
          const isToday = date.toDateString() === new Date().toDateString();
          
          return (
            <motion.button
              key={d}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSelectedDate(date)}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center border transition-all ${isToday ? 'border-[#EBC2C6] bg-[#EBC2C6]/10' : 'border-white/5 bg-white/5 hover:border-white/20'}`}
            >
              <span className={`text-[9px] mb-0.5 ${isToday ? 'text-[#EBC2C6] font-bold' : 'text-[#9A9AB0]'}`}>{d}</span>
              <div className="flex -space-x-1.5 h-3 items-center">
                {moods.slice(0, 2).map((m) => (
                  <span key={m.label} className="text-[11px] drop-shadow-sm">{m.mood}</span>
                ))}
                {moods.length > 2 && <span className="text-[7px] text-[#EBC2C6] font-bold ml-0.5">+{moods.length - 2}</span>}
              </div>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedDate && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            className="mt-4 p-3 bg-[#EBC2C6]/10 border border-[#EBC2C6]/20 rounded-xl"
          >
             <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-[#EBC2C6]">{selectedDate.toLocaleDateString('id-ID', { day:'numeric', month:'long' })}</span>
                <button type="button" onClick={() => setSelectedDate(null)}><X size={12} className="text-[#9A9AB0]"/></button>
             </div>
             <div className="space-y-2">
                {(moodMap[selectedDate.toDateString()] || []).map((m, idx) => (
                  <div key={`${m.dateStr}-${idx}`} className="flex gap-2 items-start">
                    <span className="text-sm shrink-0">{m.mood}</span>
                    <div>
                      <div className="text-[9px] font-bold" style={{ color: m.color }}>{m.userId} • {m.label}</div>
                      <p className="text-[10px] text-[#F5F5F5] leading-tight italic">"{m.note}"</p>
                    </div>
                  </div>
                ))}
                {(!moodMap[selectedDate.toDateString()] || moodMap[selectedDate.toDateString()].length === 0) && (
                  <p className="text-[10px] text-[#9A9AB0] text-center py-2 italic font-mono uppercase tracking-tighter">Tidak ada catatan mood</p>
                )}
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const MoodSelector = ({ activeUser, delayIndex = 0 }: { activeUser: 'Nauraa' | 'Farsya', delayIndex?: number }) => {
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
    <GlassCard delayIndex={delayIndex} className="relative overflow-hidden">
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
              {moods.map((m, idx) => (
                <motion.button
                  key={`${m.label}-${idx}`}
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
            <MoodGridCalendar currentMoodLogs={currentMoodLogs} activeUser={activeUser} />
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
export const ChatComponent = ({ activeUser, delayIndex = 0 }: { activeUser: 'Nauraa' | 'Farsya', delayIndex?: number }) => {
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

      // Initialize recorder using supported MIME or let browser decide defaults
      const recorderOptions = mimeType ? { mimeType } : undefined;
      const recorder = new MediaRecorder(stream, recorderOptions);
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
            await new Promise<void>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                const base64Data = reader.result as string;
                setAudioBase64(base64Data);
                resolve();
              };
              reader.readAsDataURL(audioBlob);
            });
          }
          setMicFeedback("✅ VN Siap!");
        } catch (e) {
          console.warn("Storage upload failed, falling back to local base64.", e);
          await new Promise<void>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64Data = reader.result as string;
              setAudioBase64(base64Data);
              resolve();
            };
            reader.readAsDataURL(audioBlob);
          });
          setMicFeedback("✅ VN Siap! (Offline Mode)");
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
    <GlassCard delayIndex={delayIndex} className="flex flex-col h-[400px] relative">
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
const LoveLetterDraft = ({ delayIndex = 0, activeUser }: { delayIndex?: number, activeUser: string }) => {
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
    const unsub = syncLoveLetter(activeUser, (content) => {
      setLetterContent(content);
    });
    return () => unsub();
  }, [activeUser]);

  const handleSave = async () => {
    setSaveStatus('Saving to Cloud...');
    sounds.sparkleChime();
    await saveLoveLetter(activeUser, letterContent);
    setTimeout(() => setSaveStatus('All changes saved! ✨'), 1500);
    setTimeout(() => setSaveStatus(''), 4000);
  };

  const currentPaper = papers[paperTheme] || papers.pink;

  return (
    <GlassCard delayIndex={delayIndex}>
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
const FinalMessage = ({ days, onRestart, anniversaryDate, delayIndex = 0 }: { days: number, onRestart: () => void, anniversaryDate: Date, delayIndex?: number }) => {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    setRevealed(false);
    const raf = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        setRevealed(true);
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [delayIndex]);

  const formattedAnniv = anniversaryDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <div 
      className={`w-full pt-8 pb-10 px-6 text-center relative transition-all duration-[750ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
        revealed ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-[0.98]'
      }`}
      style={{ 
        background: 'radial-gradient(ellipse at top, rgba(235,194,198,0.08) 0%, transparent 70%)',
        transitionDelay: `${delayIndex * 80}ms`
      }}
    >
      <motion.div animate={{ scale: [1, 1.08, 1], rotate: [0, 2, -2, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} className="mx-auto w-[64px] h-[64px] flex justify-center items-center rounded-full bg-[#EBC2C6]/10 mb-8 border border-[#EBC2C6]/20 shadow-[0_0_30px_rgba(235,194,198,0.15)]">
        <Heart size={32} className="text-[#EBC2C6] fill-[#EBC2C6]" />
      </motion.div>
      <h2 className="text-[26px] font-black leading-tight mb-8 bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #EBC2C6, #D6C2E8, #B7E3E0)' }}>
        Cerita Kita Belum Selesai
      </h2>
      <div className="text-[14px] text-[#9A9AB0] leading-[1.9] max-w-[340px] mx-auto space-y-5">
        <p>Sejak {formattedAnniv}, setiap hari ada satu alasan baru untuk bersyukur — dan alasan itu selalu berujung pada nama yang sama.</p>
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

const BottomNav = ({ active, onNav }: { active: string, onNav: (id: string) => void }) => (
  <div className="md:hidden fixed bottom-0 left-0 right-0 h-[60px] bg-[rgba(10,10,14,0.92)] backdrop-blur-[20px] border-t border-[rgba(255,255,255,0.06)] z-50 flex justify-around items-center px-4 max-w-[480px] mx-auto pb-[max(10px,env(safe-area-inset-bottom))] pt-[10px]">
    {[
      { id: 'hero', icon: <Heart size={20} strokeWidth={active === 'hero' ? 2 : 1.5} />, label: 'Home' },
      { id: 'profile', icon: <Star size={20} strokeWidth={active === 'profile' ? 2 : 1.5} />, label: 'Hubungan' },
      { id: 'gallery', icon: <ImageIcon size={20} strokeWidth={active === 'gallery' ? 2 : 1.5} />, label: 'Galeri' },
      { id: 'memories', icon: <Clock size={20} strokeWidth={active === 'memories' ? 2 : 1.5} />, label: 'Kenangan' },
    ].map(item => {
      const isActive = active === item.id;
      return (
        <motion.button 
          key={item.id}
          whileTap={{ scale: 0.88 }}
          className="flex-1 flex flex-col items-center justify-center gap-[3px] text-center bg-transparent border-none outline-none"
          onClick={() => {
            sounds.clickSound();
            onNav(item.id);
            window.scrollTo({ top: 0, behavior: 'instant' });
          }}
        >
          <div className={`${isActive ? 'text-[#EBC2C6] fill-none stroke-[#EBC2C6]' : 'text-white/30 stroke-white/30 fill-none'}`}>
            {item.icon}
          </div>
          <span className={`text-[10px] font-medium ${isActive ? 'text-[#EBC2C6]' : 'text-white/30'}`}>{item.label}</span>
          {isActive && <motion.div layoutId="nav-dot" className="w-1 h-1 bg-[#EBC2C6] rounded-full mt-0.5 absolute bottom-1" />}
        </motion.button>
      );
    })}
  </div>
);

// 18. CalendarSchedules
const CalendarSchedules = ({ delayIndex = 0, activeUser }: { delayIndex?: number, activeUser: string }) => {
  const [schedules, setSchedules] = useState<{ id?: string; date: string; title: string; location?: string }[]>([]);
  const [showConfig, setShowConfig] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newLoc, setNewLoc] = useState('');

  useEffect(() => {
    const unsub = syncSchedules(
      (list) => setSchedules(list),
      (err) => console.error(err)
    );
    return () => unsub();
  }, []);

  const handleAdd = async () => {
    if (newDate && newTitle) {
      sounds.sparkleChime();
      await addSchedule(newDate, newTitle, newLoc, activeUser);
      setNewDate('');
      setNewTitle('');
      setNewLoc('');
      setShowConfig(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    sounds.clickSound();
    await deleteDoc(doc(db, 'schedules', id));
  };

  const sorted = [...schedules].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const getUpcomingAlerts = () => {
    const alerts: { date: Date; diffDays: number; type: 'birthday' | 'anniversary'; label: string; icon: string }[] = [];
    const today = new Date();
    today.setHours(0,0,0,0);
    
    // 1. Monthly Anniversary on the 24th of every month
    let nextAnniv = new Date(today.getFullYear(), today.getMonth(), 24);
    if (nextAnniv.getTime() < today.getTime()) {
      nextAnniv = new Date(today.getFullYear(), today.getMonth() + 1, 24);
    }
    const diffAnniv = Math.round((nextAnniv.getTime() - today.getTime()) / 86400000);
    if (diffAnniv <= 30) {
      alerts.push({
        date: nextAnniv,
        diffDays: diffAnniv,
        type: 'anniversary',
        label: `Monthly Anniversary (${nextAnniv.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })})`,
        icon: '💖'
      });
    }

    // 2. Birthday Nauraa (March 16)
    let nextNauraBday = new Date(today.getFullYear(), 2, 16);
    if (nextNauraBday.getTime() < today.getTime()) {
      nextNauraBday = new Date(today.getFullYear() + 1, 2, 16);
    }
    const diffNaura = Math.round((nextNauraBday.getTime() - today.getTime()) / 86400000);
    if (diffNaura <= 30) {
      alerts.push({
        date: nextNauraBday,
        diffDays: diffNaura,
        type: 'birthday',
        label: `Hari Ulang Tahun Nauraa Rayyani Ayu 🌸 (${nextNauraBday.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })})`,
        icon: '🌸'
      });
    }

    // 3. Birthday Farsya (January 17)
    let nextFarsyaBday = new Date(today.getFullYear(), 0, 17);
    if (nextFarsyaBday.getTime() < today.getTime()) {
      nextFarsyaBday = new Date(today.getFullYear() + 1, 0, 17);
    }
    const diffFarsya = Math.round((nextFarsyaBday.getTime() - today.getTime()) / 86400000);
    if (diffFarsya <= 30) {
      alerts.push({
        date: nextFarsyaBday,
        diffDays: diffFarsya,
        type: 'birthday',
        label: `Hari Ulang Tahun Farsya Zahri ⚡ (${nextFarsyaBday.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })})`,
        icon: '⚡'
      });
    }

    return alerts.sort((a,b) => a.diffDays - b.diffDays);
  };

  const upcomingAlerts = getUpcomingAlerts();

  return (
    <GlassCard delayIndex={delayIndex} className="border border-white/5 bg-[#0A0A0E]/60 min-h-[300px]">
      <div className="flex justify-between items-end mb-5">
        <div>
          <h3 className="text-[16px] font-bold text-white flex items-center gap-2 tracking-tight">
            <Calendar size={16} className="text-[#EBC2C6]" /> Jadwal & Kalender Kita
          </h3>
          <p className="text-[10px] text-white/50 tracking-wider font-light mt-1 uppercase">Upcoming Events Together</p>
        </div>
        <button 
          onClick={() => setShowConfig(!showConfig)}
          className="text-[20px] text-[#EBC2C6] w-8 h-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center cursor-pointer hover:bg-white/10"
        >
          {showConfig ? '×' : '+'}
        </button>
      </div>

      {/* Alert / Notification system highlights */}
      {upcomingAlerts.length > 0 && (
        <div className="mb-5 space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#EBC2C6] tracking-wider uppercase">
            <Sparkles size={11} className="text-yellow-300 animate-pulse" /> Pengingat Hari Spesial Kita 💕
          </div>
          {upcomingAlerts.map((alert, idx) => (
            <motion.div 
              key={idx}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-3 rounded-xl bg-gradient-to-r from-pink-500/15 via-purple-500/10 to-transparent border border-pink-500/20 flex items-center justify-between shadow-[0_0_15px_rgba(235,194,198,0.1)]"
            >
              <div className="flex items-center gap-2 w-full overflow-hidden">
                <span className="text-[18px]">{alert.icon}</span>
                <div className="flex flex-col truncate">
                  <span className="text-[11px] font-bold text-white leading-normal truncate">{alert.label}</span>
                  <span className="text-[9px] text-[#EBC2C6]/80 font-mono tracking-wider uppercase">
                    {alert.diffDays === 0 ? "HARI INI! 🎉" : `${alert.diffDays} Hari Lagi ✨`}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showConfig && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-5">
            <div className="flex flex-col gap-3 p-4 rounded-xl bg-black/40 border border-[#EBC2C6]/10">
              <input 
                type="date" 
                value={newDate} 
                onChange={e => setNewDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#EBC2C6]/50"
              />
              <input 
                type="text" 
                value={newTitle} 
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Rencana kegiatan..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#EBC2C6]/50"
              />
              <input 
                type="text" 
                value={newLoc} 
                onChange={e => setNewLoc(e.target.value)}
                placeholder="Lokasi (Opsional)..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#EBC2C6]/50"
              />
              <button onClick={handleAdd} className="w-full py-2 bg-[#EBC2C6]/20 text-[#EBC2C6] text-xs font-bold rounded-lg border border-[#EBC2C6]/30 hover:bg-[#EBC2C6]/30 transition-colors">
                Tambah Jadwal
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {sorted.map((s, i) => {
          const sDate = new Date(s.date);
          const isPast = sDate.getTime() < Date.now();
          return (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`p-3 rounded-2xl border ${isPast ? 'bg-white/5 border-white/5' : 'bg-gradient-to-r from-pink-500/10 to-transparent border-pink-500/20'} relative flex items-center justify-between group`}
            >
              <div className="flex items-center gap-3">
                 <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shadow-lg ${isPast ? 'bg-white/10 text-white/40' : 'bg-gradient-to-b from-[#EBC2C6] to-[#D6C2E8] text-black'} font-bold`}>
                   <span className="text-[10px] leading-tight uppercase relative -bottom-1">{sDate.toLocaleString('default', { month: 'short' })}</span>
                   <span className="text-[18px] leading-tight font-black">{sDate.getDate()}</span>
                 </div>
                 <div className="flex flex-col gap-1">
                   <span className={`text-[12px] font-bold ${isPast ? 'text-white/40 line-through' : 'text-white'}`}>{s.title}</span>
                   <span className={`text-[10px] font-mono tracking-widest uppercase flex items-center gap-1 ${isPast ? 'text-white/20' : 'text-[#EBC2C6]/70'}`}>
                     <MapPin size={10} /> {s.location || 'Spontan'}
                   </span>
                 </div>
              </div>
              
              <button onClick={() => handleDelete(s.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-white/30 hover:text-red-400">
                <Trash2 size={16} />
              </button>
            </motion.div>
          );
        })}
        {sorted.length === 0 && <p className="text-center text-white/40 text-xs py-10">Belum ada jadwal. Yuk buat rencana bersama! ✨</p>}
      </div>
    </GlassCard>
  );
};

// ThemeSelector component to choose dynamic romantic color palettes
const ThemeSelector = ({ activeThemeId, onChangeTheme, delayIndex = 0 }: { activeThemeId: string; onChangeTheme: (id: string) => void, delayIndex?: number }) => {
  return (
    <GlassCard delayIndex={delayIndex}>
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={15} className="text-[#EBC2C6] animate-[spin_8s_linear_infinite]" />
        <h3 className="text-[15px] font-bold text-white">Nuansa Warna Cinta</h3>
      </div>
      <p className="text-[11px] text-[#9A9AB0] mb-4">Pilih warna romantis yang paling menggambarkan kisah indah kalian berdua.</p>
      
      <div className="grid grid-cols-2 gap-2.5">
        {THEMES.map(theme => {
          const isActive = theme.id === activeThemeId;
          return (
            <motion.button
              key={theme.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                sounds.sparkleChime();
                onChangeTheme(theme.id);
              }}
              className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between h-[96px] ${isActive ? 'bg-[#EBC2C6]/15 border-[#EBC2C6] shadow-[0_0_15px_rgba(235,194,198,0.25)]' : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'}`}
            >
              <div>
                <span className="text-xs font-bold text-white block truncate">{theme.name}</span>
                <span className="text-[9px] text-[#9A9AB0] block leading-tight mt-0.5 line-clamp-2">{theme.desc}</span>
              </div>
              
              {/* Palette dots */}
              <div className="flex gap-1.5 mt-2">
                {theme.colors.map((c, i) => (
                  <div key={i} className="w-3 h-3 rounded-full border border-white/10 shadow-sm" style={{ backgroundColor: c }} />
                ))}
              </div>
            </motion.button>
          );
        })}
      </div>
    </GlassCard>
  );
};

const exportTimelineAsJSON = (data: any[]) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `love_journey_timeline_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

const SettingsPanel = ({ delayIndex = 0 }: { delayIndex?: number }) => {
  const [notifications, setNotifications] = useState(() => localStorage.getItem('love_notifications_enabled') === 'true');
  
  const handleToggleNotifications = async () => {
    if (!notifications) {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            setNotifications(true);
            localStorage.setItem('love_notifications_enabled', 'true');
            new Notification("Notifikasi Aktif!", { body: "Kamu akan menerima pengingat untuk momen penting kita. ❤️" });
        }
      }
    } else {
      setNotifications(false);
      localStorage.setItem('love_notifications_enabled', 'false');
    }
  };

  return (
    <GlassCard delayIndex={delayIndex} className="p-6">
      <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
        <Settings size={20} className="text-[#EBC2C6]" /> Pengaturan Aplikasi
      </h3>
      
      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
          <div>
            <h4 className="text-sm font-semibold text-white">Notifikasi Browser</h4>
            <p className="text-[11px] text-[#9A9AB0] mt-1">Dapatkan pengingat untuk milestone dan mimpi kita.</p>
          </div>
          <button 
            type="button"
            onClick={handleToggleNotifications}
            className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 relative ${notifications ? 'bg-[#EBC2C6]' : 'bg-white/10'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${notifications ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
          <div className="flex items-center gap-3 mb-2">
             <div className="p-2 bg-indigo-500/10 rounded-lg">
                <Wifi size={18} className="text-indigo-400" />
             </div>
             <div>
                <h4 className="text-sm font-semibold text-white">Sinkronisasi Cloud</h4>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isFirebaseLive ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                    <span className="text-[11px] text-[#9A9AB0]">
                    {isFirebaseLive ? 'Online - Semua data aman' : 'Lokal - Data hanya di HP ini'}
                    </span>
                </div>
             </div>
          </div>
          {isFirebaseLive && (
             <p className="text-[10px] text-[#9A9AB0]/70 mt-2 italic border-t border-white/5 pt-2">
                "Cintaku kepadamu tidak terbatas oleh ruang, apalagi cuma kuota data."
             </p>
          )}
        </div>
      </div>
    </GlassCard>
  );
};

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

  const setProfileActiveTab = useAppStore(state => state.setProfileActiveTab);
  useEffect(() => {
    setProfileActiveTab(activeNav);
  }, [activeNav, setProfileActiveTab]);

  const [activeUser, setActiveUser] = useState<'Nauraa' | 'Farsya'>(() => {
    const saved = localStorage.getItem('love_active_partner');
    return (saved === 'Nauraa' || saved === 'Farsya') ? saved : 'Nauraa';
  });

  const [anniversaryDate, setAnniversaryDate] = useState<Date>(() => {
    const saved = localStorage.getItem('love_anniversary_date');
    return saved ? new Date(saved) : RELATIONSHIP.startDate;
  });

  const handleAnniversaryChange = (newDateStr: string) => {
    const parsed = new Date(newDateStr);
    if (!isNaN(parsed.getTime())) {
      setAnniversaryDate(parsed);
      localStorage.setItem('love_anniversary_date', parsed.toISOString());
    }
  };

  const handleSwitchUser = (user: 'Nauraa' | 'Farsya') => {
    setActiveUser(user);
    localStorage.setItem('love_active_partner', user);
    sounds.heartbeat();
  };

  const [activeThemeId, setActiveThemeId] = useState(() => {
    return localStorage.getItem('love_journey_theme_id') || 'amour';
  });

  const handleThemeChange = (id: string) => {
    setActiveThemeId(id);
    localStorage.setItem('love_journey_theme_id', id);
  };

  useEffect(() => {
    const found = THEMES.find(t => t.id === activeThemeId) || THEMES[0];
    Object.entries(found.vars).forEach(([key, val]) => {
      document.documentElement.style.setProperty(key, val);
    });
  }, [activeThemeId]);

  const [lightboxState, setLightboxState] = useState<{
    list: { u: string; l: string; c?: string }[];
    index: number;
  } | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [imgShareCopied, setImgShareCopied] = useState(false);
  const lightboxContainerRef = useRef<HTMLDivElement>(null);

  const handleShareCurrentImage = async () => {
    if (!lightboxState) return;
    const activeImg = lightboxState.list[lightboxState.index];
    const text = activeImg.c || activeImg.l || 'Kenangan Indah Nauraa & Farsya';
    const link = activeImg.u;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Memori Cinta - Nauraa & Farsya',
          text: `${text} 💕`,
          url: link,
        });
        sounds.successSound();
      } catch (err) {
        console.warn(err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${text}\n${link}`);
        sounds.successSound();
        setImgShareCopied(true);
        setTimeout(() => setImgShareCopied(false), 2000);
      } catch (e) {
        console.warn(e);
      }
    }
  };
  
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
    // We don't need scroll observer anymore, activeNav holds the true view state.
    // Clean component returns
  }, []);

  const days = Math.floor((now.getTime() - anniversaryDate.getTime()) / 86400000);

  const handleOpenLightbox = (list: { u: string; l: string; c?: string }[], index: number) => {
    setLightboxState({ list, index });
  };

  const navTabs = [
    { id: 'hero', label: 'Home' },
    { id: 'profile', label: 'Hubungan' },
    { id: 'gallery', label: 'Galeri' },
    { id: 'memories', label: 'Kenangan' },
    { id: 'settings', label: 'Set' },
  ];

  return (
    <LightboxContext.Provider value={{ open: handleOpenLightbox }}>
      <div 
        id="main-scroll" 
        className="fixed inset-0 w-full min-h-screen text-[#F5F5F5] overflow-y-auto overflow-x-hidden z-50 font-sans smooth-scroll pb-24 pb-safe transition-colors duration-500"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <style dangerouslySetInnerHTML={{ __html: `
          /* Dynamic style overrides for raw hex tailwind classes so themes update instantly without reload */
          .text-\\[\\#EBC2C6\\] { color: var(--accent-pink) !important; }
          .bg-\\[\\#EBC2C6\\] { background-color: var(--accent-pink) !important; }
          .border-\\[\\#EBC2C6\\] { border-color: var(--accent-pink) !important; }
          .shadow-\\[\\#EBC2C6\\] { --tw-shadow-color: var(--accent-pink) !important; }
          .to-\\[\\#EBC2C6\\] { --tw-gradient-to: var(--accent-pink) !important; }
          .from-\\[\\#EBC2C6\\] { --tw-gradient-from: var(--accent-pink) !important; }
          .bg-\\[\\#EBC2C6\\]\\/10 { background-color: rgba(235,194,198, 0.1) !important; }
          .bg-\\[\\#EBC2C6\\]\\/15 { background-color: rgba(235,194,198, 0.15) !important; }

          .text-\\[\\#D6C2E8\\] { color: var(--accent-lavender) !important; }
          .bg-\\[\\#D6C2E8\\] { background-color: var(--accent-lavender) !important; }
          .border-\\[\\#D6C2E8\\] { border-color: var(--accent-lavender) !important; }
          .to-\\[\\#D6C2E8\\] { --tw-gradient-to: var(--accent-lavender) !important; }
          .from-\\[\\#D6C2E8\\] { --tw-gradient-from: var(--accent-lavender) !important; }

          .text-\\[\\#B7E3E0\\] { color: var(--accent-mint) !important; }
          .bg-\\[\\#B7E3E0\\] { background-color: var(--accent-mint) !important; }
          .border-\\[\\#B7E3E0\\] { border-color: var(--accent-mint) !important; }
          .to-\\[\\#B7E3E0\\] { --tw-gradient-to: var(--accent-mint) !important; }
          .from-\\[\\#B7E3E0\\] { --tw-gradient-from: var(--accent-mint) !important; }

          .text-\\[\\#E8D5A3\\] { color: var(--accent-gold) !important; }
          .bg-\\[\\#E8D5A3\\] { background-color: var(--accent-gold) !important; }
          .border-\\[\\#E8D5A3\\] { border-color: var(--accent-gold) !important; }
          .to-\\[\\#E8D5A3\\] { --tw-gradient-to: var(--accent-gold) !important; }
          .from-\\[\\#E8D5A3\\] { --tw-gradient-from: var(--accent-gold) !important; }
        ` }} />
        <FloatingHearts />
        
        <div className="profile-root relative z-10 lg:max-w-4xl lg:mx-auto pt-24 md:pt-28">
        
        {/* TOP TAB NAV FOR DESKTOP */}
        <div className="hidden md:flex bg-white/5 border border-white/10 rounded-full p-1 mx-auto mb-8 w-max max-w-full">
          {navTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { sounds.clickSound(); setActiveNav(tab.id); }}
              className={`px-8 py-3 rounded-full text-xs font-bold tracking-wider uppercase transition-all ${activeNav === tab.id ? 'bg-[#EBC2C6] text-black shadow-[0_0_20px_rgba(235,194,198,0.4)]' : 'text-white/50 hover:text-white/80'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeNav === 'hero' && (
            <motion.div 
              key="hero" 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              className="flex flex-col gap-[var(--card-gap)]"
            >
              <ActivePartnerSwitchHeader activeUser={activeUser} onSwitchUser={handleSwitchUser} />
              <HeroCouple now={now} anniversaryDate={anniversaryDate} onDateChange={handleAnniversaryChange} />
              <DailyAffirmation delayIndex={1} />
              <StreakCounter now={now} anniversaryDate={anniversaryDate} delayIndex={2} />
              <ProfileCards now={now} delayIndex={3} />
              <NextEventCountdown now={now} anniversaryDate={anniversaryDate} delayIndex={4} />
            </motion.div>
          )}

          {activeNav === 'profile' && (
            <motion.div 
              key="profile" 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              className="flex flex-col gap-[var(--card-gap)]"
            >
              <ThemeSelector activeThemeId={activeThemeId} onChangeTheme={handleThemeChange} delayIndex={1} />
              <RelationshipStats now={now} anniversaryDate={anniversaryDate} delayIndex={2} />
              <LoveChatRoom activeUser={activeUser} delayIndex={3} />
              <SentimentLog activeUser={activeUser} delayIndex={4} />
              <ZodiacMatch delayIndex={5} />
              <LoveLanguage delayIndex={6} />
            </motion.div>
          )}

          {activeNav === 'gallery' && (
            <motion.div 
              key="gallery" 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              className="flex flex-col gap-[var(--card-gap)] relative"
            >
              <PhotoGallery activeUser={activeUser} delayIndex={1} />
              <MemoryBoard anniversaryDate={anniversaryDate} delayIndex={2} />
            </motion.div>
          )}

          {activeNav === 'settings' && (
            <motion.div 
              key="settings" 
              variants={containerVariants}
              initial="hidden" animate="show" exit="exit"
              className="space-y-6"
            >
              <SettingsPanel delayIndex={1} />
            </motion.div>
          )}

          {activeNav === 'memories' && (
            <motion.div 
              key="memories" 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              className="flex flex-col gap-[var(--card-gap)]"
            >
              <CalendarSchedules activeUser={activeUser} delayIndex={1} />
              <MemoriesTimeline anniversaryDate={anniversaryDate} delayIndex={2} />
              <MilestoneTimeline now={now} anniversaryDate={anniversaryDate} delayIndex={3} />
              <LoveLetterDraft activeUser={activeUser} delayIndex={4} />
              <BucketListPreview delayIndex={5} activeUser={activeUser} />
              <ScoreSummary scores={gameScores} delayIndex={6} />
              <FinalMessage days={days} onRestart={onRestart} anniversaryDate={anniversaryDate} delayIndex={7} />
            </motion.div>
          )}
        </AnimatePresence>

      </div>
      <BottomNav active={activeNav} onNav={setActiveNav} />
    </div>

    {/* Page-Wide Universal Lightbox Portal Overlay */}
    {typeof window !== 'undefined' && document.body && createPortal(
      <AnimatePresence>
        {lightboxState !== null && (
          <motion.div 
            key="lightbox-fullscreen"
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ 
              opacity: 1, 
              scale: 1,
              transition: { type: "spring", stiffness: 300, damping: 28 }
            }} 
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }} 
            className="fixed inset-0 z-[10000] bg-black/98 backdrop-blur-3xl flex flex-col items-center justify-between py-6 px-4 cursor-default select-none -webkit-overflow-scrolling-touch" 
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
                
                <button 
                  onClick={handleShareCurrentImage}
                  className="p-1.5 hover:bg-white/15 rounded-full text-[#EBC2C6] transition-all cursor-pointer border-l border-white/15 pl-3.5 flex items-center justify-center gap-1.5"
                  title="Share Memory"
                >
                  {imgShareCopied ? <Check size={16} className="text-green-400" /> : <Share2 size={16} />}
                </button>
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
