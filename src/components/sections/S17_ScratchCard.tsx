import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../../lib/store';
import { GlassCard } from '../GlassCard';
import { sounds } from '../../lib/sounds';

export const S17_ScratchCard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScratched, setIsScratched] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const { goToNext } = useAppStore();
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill with silver overlay
    ctx.fillStyle = '#666677';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add text overlay
    ctx.font = 'bold 20px Inter';
    ctx.fillStyle = '#AAAAAA';
    ctx.textAlign = 'center';
    ctx.fillText('Gores untuk melihat', canvas.width/2, canvas.height/2);

  }, []);

  const getPointerPos = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const event = e as any;
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
     setIsDrawing(true);
     scratch(e);
  };

  const handlePointerUp = () => {
     setIsDrawing(false);
     checkScratchPercent();
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
     if (!isDrawing) return;
     scratch(e);
  };

  const scratch = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPointerPos(e);
    if (!pos) return;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 25, 0, Math.PI * 2);
    ctx.fill();
    
    if (Math.random() > 0.8) sounds.clickSound(); // play occasional sound while scratching
  };

  const checkScratchPercent = () => {
    const canvas = canvasRef.current;
    if (!canvas || isScratched) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let transparent = 0;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] < 128) transparent++;
    }
    const percent = (transparent / (pixels.length / 4)) * 100;
    
    if (percent > 60) {
       setIsScratched(true);
       sounds.successSound();
       // clear the rest
       ctx.clearRect(0,0, canvas.width, canvas.height);
       setTimeout(() => goToNext(), 2500);
    }
  };

  return (
    <GlassCard width={450} padding="40px" className="flex flex-col items-center">
      <h2 className="text-[24px] font-bold text-[var(--text-primary)] mb-2">Goresan Hati</h2>
      <p className="text-[13px] text-[var(--text-secondary)] mb-6 text-center">Gores (usap layar) untuk mengungkap pesan di baliknya.</p>

      <div className="relative w-[300px] h-[300px] rounded-xl overflow-hidden shadow-xl border border-[var(--border-glass)] cursor-crosshair">
         {/* Hidden message inside */}
         <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#1A0A0C] to-[#2D1B2E]">
            <span className="text-[40px] mb-2">💌</span>
            <div className="text-[#EBC2C6] font-bold text-[20px] mb-2 leading-snug">
               Nauraa,<br/>Kamu adalah hal terbaik<br/>yang pernah terjadi.
            </div>
            <div className="text-[12px] text-[#9A9AB0] mt-2">- Farsya Zahri -</div>
         </div>
         
         <canvas 
            ref={canvasRef}
            width={300}
            height={300}
            className="absolute inset-0 touch-none z-10 block"
            onMouseDown={handlePointerDown}
            onMouseUp={handlePointerUp}
            onMouseOut={handlePointerUp}
            onMouseMove={handlePointerMove}
            onTouchStart={handlePointerDown}
            onTouchEnd={handlePointerUp}
            onTouchMove={handlePointerMove}
         />
      </div>
      
      <div className="mt-6 text-[11px] text-[#5A5A70]">Hapus minimal 60% lapisan</div>
    </GlassCard>
  );
};
