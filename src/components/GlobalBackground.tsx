'use client';

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { useAnimationFrame } from '../hooks/useAnimationFrame';
import { useWindowSize } from '../hooks/useWindowSize';
import { Butterfly, LoveParticle, Star, GlobalBackgroundProps, GlobalBackgroundRef } from '../lib/backgroundTypes';

const COLORS = {
  PINK: '#EBC2C6',
  LAVENDER: '#D6C2E8',
  MINT: '#B7E3E0',
  PEACH: '#F5C2A0',
  SOFT_WHITE: '#F5E6E8',
  BG_DEEP: '#0A0A0E'
};

const SECONDARY_COLORS = ['#C89B9F', '#BAA5CB', '#9BCBC8', '#D6A584', '#D4B8BB', '#92A8A5'];
const COLOR_PALETTE = [COLORS.PINK, COLORS.LAVENDER, COLORS.MINT, COLORS.PEACH, COLORS.SOFT_WHITE];
const BUTTERFLY_COLORS = [COLORS.PINK, COLORS.LAVENDER, COLORS.MINT, COLORS.PEACH, '#F0D4D8', '#C8E8E4'];

export const GlobalBackground = forwardRef<GlobalBackgroundRef, GlobalBackgroundProps>(
  ({ turboMode = false, particleIntensity = 'normal', className = '' }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { width, height } = useWindowSize();
    const isMounted = useRef(false);

    const stars = useRef<Star[]>([]);
    const loveParticles = useRef<LoveParticle[]>([]);
    const butterflies = useRef<Butterfly[]>([]);
    
    const shootingStars = useRef<{x: number, y: number, ex: number, ey: number, life: number}[]>([]);
    const turboStatus = useRef({ active: false, multiplier: 1.0 });

    const initStars = (cw: number, ch: number) => {
      stars.current = Array.from({ length: 90 }, () => ({
        x: Math.random() * cw,
        y: Math.random() * ch,
        size: 0.4 + Math.random() * 1.8,
        opacity: 0.08 + Math.random() * 0.35,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.008 + Math.random() * 0.028,
        twinkleAmplitude: 0.06 + Math.random() * 0.30
      }));
    };

    const initLoveParticles = (cw: number, ch: number) => {
      const count = particleIntensity === 'high' ? 40 : particleIntensity === 'low' ? 10 : 25;
      const groups = 5;
      const perGroup = count / groups;
      
      const newParticles: LoveParticle[] = [];
      let idCounter = 0;

      for (let g = 0; g < groups; g++) {
        for (let i = 0; i < perGroup; i++) {
          let yMin = 0, yMax = 0;
          if (g === 0) { yMin = ch; yMax = ch * 1.4; }
          else if (g === 1) { yMin = ch * 0.6; yMax = ch; }
          else if (g === 2) { yMin = ch * 0.2; yMax = ch * 0.6; }
          else if (g === 3) { yMin = -100; yMax = ch * 0.2; }
          else { yMin = ch; yMax = ch * 1.8; }

          newParticles.push({
            id: idCounter++,
            x: Math.random() * cw,
            y: yMin + Math.random() * (yMax - yMin),
            startY: ch + 30 + Math.random() * 50,
            size: 9 + Math.random() * 16,
            opacity: 0,
            maxOpacity: 0.45 + Math.random() * 0.4,
            speed: 0.28 + Math.random() * 0.68,
            drift: 7 + Math.random() * 18,
            driftPhase: Math.random() * Math.PI * 2,
            driftFrequency: 0.009 + Math.random() * 0.022,
            color: COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)],
            rotation: (Math.random() - 0.5) * 0.4,
            rotationSpeed: (Math.random() - 0.5) * 0.006,
            pulsePhase: Math.random() * Math.PI * 2,
            pulseSpeed: 0.018 + Math.random() * 0.038,
            spawnDelay: Math.floor(Math.random() * 60)
          });
        }
      }
      loveParticles.current = newParticles;
    };

    const initButterflies = (cw: number, ch: number) => {
      const zones = [
        { x: [0.05, 0.2], y: [0.05, 0.25] },
        { x: [0.75, 0.95], y: [0.05, 0.25] },
        { x: [0.05, 0.25], y: [0.4, 0.6] },
        { x: [0.75, 0.95], y: [0.4, 0.6] },
        { x: [0.1, 0.3], y: [0.65, 0.85] },
        { x: [0.7, 0.9], y: [0.65, 0.85] },
        { x: [0.35, 0.65], y: [0.05, 0.2] },
        { x: [0.35, 0.65], y: [0.75, 0.9] },
      ];

      butterflies.current = Array.from({ length: 8 }, (_, i) => {
        const zone = zones[i];
        const vx = (Math.random() > 0.5 ? 1 : -1) * (0.5 + Math.random() * 1.5);
        const vy = (Math.random() > 0.5 ? 1 : -1) * (0.5 + Math.random() * 1.5);
        
        return {
          id: i,
          x: cw * (zone.x[0] + Math.random() * (zone.x[1] - zone.x[0])),
          y: ch * (zone.y[0] + Math.random() * (zone.y[1] - zone.y[0])),
          vx, vy, baseVx: vx, baseVy: vy,
          angle: Math.atan2(vy, vx),
          targetAngle: Math.atan2(vy, vx),
          wingPhase: Math.random() * Math.PI * 2,
          wingSpeed: 0.055 + Math.random() * 0.085,
          wingOpenness: 1,
          size: 18 + Math.random() * 18,
          color: BUTTERFLY_COLORS[i % 6],
          secondaryColor: SECONDARY_COLORS[i % 6] || '#999',
          opacity: 0.30 + Math.random() * 0.45,
          sinOffset: Math.random() * Math.PI * 2,
          sinAmplitude: 12 + Math.random() * 32,
          sinFrequency: 0.007 + Math.random() * 0.018,
          frameCount: 0,
          turboMultiplier: 1.0,
          trailPositions: [],
          directionChangeInterval: 200 + Math.floor(Math.random() * 220),
          directionChangeTimer: Math.floor(Math.random() * 220)
        };
      });
    };

    useImperativeHandle(ref, () => ({
      triggerTurbo: () => {
        turboStatus.current.active = true;
        setTimeout(() => {
          turboStatus.current.active = false;
        }, 1500);
      }
    }));

    useEffect(() => {
      if (turboMode && !turboStatus.current.active) {
        turboStatus.current.active = true;
        setTimeout(() => {
          turboStatus.current.active = false;
        }, 1500);
      }
    }, [turboMode]);

    useEffect(() => {
      isMounted.current = true;
      if (width > 0 && height > 0) {
        initStars(width, height);
        initLoveParticles(width, height);
        initButterflies(width, height);
      }
      return () => { isMounted.current = false; };
    }, [width, height]);

    useEffect(() => {
      if (!canvasRef.current || width === 0 || height === 0) return;
      const canvas = canvasRef.current;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    }, [width, height]);

    const [reducedMotion, setReducedMotion] = React.useState(false);

    useEffect(() => {
      const matchMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(matchMedia.matches);
      
      const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      matchMedia.addEventListener('change', listener);
      return () => matchMedia.removeEventListener('change', listener);
    }, []);

    const drawHeart = (ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string, opacity: number, rotation: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);
      ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
      
      const s = size / 10;
      ctx.beginPath();
      ctx.moveTo(0, s * 3.5);
      ctx.bezierCurveTo(0, s * 3.5, -size, -s, -size, -s * 4);
      ctx.bezierCurveTo(-size, -s * 9, 0, -s * 8.5, 0, -s * 3.5);
      ctx.bezierCurveTo(0, -s * 8.5, size, -s * 9, size, -s * 4);
      ctx.bezierCurveTo(size, -s, 0, s * 3.5, 0, s * 3.5);
      ctx.closePath();
      
      const grad = ctx.createRadialGradient(0, -s*2, 0, 0, -s*2, s * 7);
      grad.addColorStop(0, color + 'FF');
      grad.addColorStop(0.6, color + 'CC');
      grad.addColorStop(1, color + '44');
      ctx.fillStyle = grad;
      ctx.fill();
      
      ctx.shadowColor = color;
      ctx.shadowBlur = size * 0.6;
      ctx.fill();
      ctx.shadowBlur = 0;
      
      ctx.beginPath();
      ctx.arc(-s * 2.5, -s * 4.0, s * 1.2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,0.35)`;
      ctx.fill();
      
      ctx.restore();
    };

    const drawButterfly = (ctx: CanvasRenderingContext2D, butterfly: Butterfly) => {
      ctx.save();
      ctx.translate(butterfly.x, butterfly.y);
      ctx.rotate(butterfly.angle + Math.PI / 2);
      ctx.globalAlpha = butterfly.opacity;
      
      const s = butterfly.size;
      const wing = Math.max(0.01, butterfly.wingOpenness);
      
      butterfly.trailPositions.forEach((pos, i) => {
        ctx.save();
        ctx.restore();
        
        ctx.save();
        ctx.translate(pos.x - butterfly.x, pos.y - butterfly.y);
        const trailOpacity = butterfly.opacity * (1 - i / 6) * 0.25;
        ctx.globalAlpha = Math.max(0, trailOpacity);
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.12 * (1 - i/6), 0, Math.PI * 2);
        ctx.fillStyle = butterfly.color;
        ctx.fill();
        ctx.restore();
      });
      ctx.globalAlpha = butterfly.opacity;
      
      ctx.save();
      ctx.transform(wing, 0, 0, 1, 0, 0); 
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-s * 0.8, -s * 0.3, -s * 1.4, -s * 1.0, -s * 0.9, -s * 1.3);
      ctx.bezierCurveTo(-s * 0.4, -s * 1.5, 0, -s * 0.8, 0, -s * 0.2);
      ctx.closePath();
      
      const wingGradL = ctx.createLinearGradient(-s, -s * 1.5, 0, 0);
      wingGradL.addColorStop(0, butterfly.color + 'BB');
      wingGradL.addColorStop(0.5, butterfly.color + '99');
      wingGradL.addColorStop(1, butterfly.color + '55');
      ctx.fillStyle = wingGradL;
      ctx.fill();
      
      ctx.strokeStyle = butterfly.secondaryColor + '40';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.1);
      ctx.quadraticCurveTo(-s * 0.7, -s * 0.6, -s * 0.8, -s * 1.2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.1);
      ctx.quadraticCurveTo(-s * 0.3, -s * 0.8, -s * 0.2, -s * 1.3);
      ctx.stroke();
      ctx.restore();
      
      ctx.save();
      ctx.scale(-1, 1);
      ctx.transform(wing, 0, 0, 1, 0, 0);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-s * 0.8, -s * 0.3, -s * 1.4, -s * 1.0, -s * 0.9, -s * 1.3);
      ctx.bezierCurveTo(-s * 0.4, -s * 1.5, 0, -s * 0.8, 0, -s * 0.2);
      ctx.closePath();
      ctx.fillStyle = wingGradL;
      ctx.fill();
      ctx.strokeStyle = butterfly.secondaryColor + '40';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.1);
      ctx.quadraticCurveTo(-s * 0.7, -s * 0.6, -s * 0.8, -s * 1.2);
      ctx.stroke();
      ctx.restore();
      
      ctx.save();
      ctx.transform(wing * 0.85, 0, 0, 1, 0, 0);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-s * 0.9, s * 0.1, -s * 1.2, s * 0.7, -s * 0.7, s * 0.9);
      ctx.bezierCurveTo(-s * 0.3, s * 1.0, 0, s * 0.5, 0, s * 0.1);
      ctx.closePath();
      ctx.fillStyle = butterfly.color + '88';
      ctx.fill();
      ctx.restore();
      
      ctx.save();
      ctx.scale(-1, 1);
      ctx.transform(wing * 0.85, 0, 0, 1, 0, 0);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-s * 0.9, s * 0.1, -s * 1.2, s * 0.7, -s * 0.7, s * 0.9);
      ctx.bezierCurveTo(-s * 0.3, s * 1.0, 0, s * 0.5, 0, s * 0.1);
      ctx.closePath();
      ctx.fillStyle = butterfly.color + '88';
      ctx.fill();
      ctx.restore();
      
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.3, s * 0.12, s * 0.55, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#1A1A2E';
      ctx.fill();
      ctx.strokeStyle = butterfly.color + '60';
      ctx.lineWidth = 0.8;
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(0, -s * 0.9, s * 0.14, 0, Math.PI * 2);
      ctx.fillStyle = '#1A1A2E';
      ctx.fill();
      
      ctx.beginPath();
      ctx.moveTo(-s * 0.08, -s * 0.95);
      ctx.quadraticCurveTo(-s * 0.4, -s * 1.5, -s * 0.35, -s * 1.7);
      ctx.strokeStyle = butterfly.color + '90';
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-s * 0.35, -s * 1.7, s * 0.07, 0, Math.PI * 2);
      ctx.fillStyle = butterfly.color;
      ctx.fill();
      
      ctx.beginPath();
      ctx.moveTo(s * 0.08, -s * 0.95);
      ctx.quadraticCurveTo(s * 0.4, -s * 1.5, s * 0.35, -s * 1.7);
      ctx.strokeStyle = butterfly.color + '90';
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(s * 0.35, -s * 1.7, s * 0.07, 0, Math.PI * 2);
      ctx.fillStyle = butterfly.color;
      ctx.fill();
      
      ctx.globalAlpha = butterfly.opacity * 0.5;
      ctx.beginPath();
      ctx.arc(-s * 0.5, -s * 0.8, s * 0.1, 0, Math.PI * 2);
      ctx.fillStyle = butterfly.secondaryColor;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(s * 0.5, -s * 0.8, s * 0.1, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    };

    useAnimationFrame((frameCount) => {
      if (!isMounted.current || !canvasRef.current || width === 0 || height === 0) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const tStatus = turboStatus.current;
      if (tStatus.active) {
         tStatus.multiplier = Math.min(2.5, tStatus.multiplier + 0.1);
      } else {
         tStatus.multiplier = Math.max(1.0, tStatus.multiplier - 0.02);
      }

      ctx.clearRect(0, 0, width, height);

      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#0A0A0E');
      bgGrad.addColorStop(0.5, '#0D0D15');
      bgGrad.addColorStop(1, '#0A0A0E');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);
      
      const vigGrad = ctx.createRadialGradient(
        width/2, height/2, height * 0.3,
        width/2, height/2, height * 0.85
      );
      vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
      vigGrad.addColorStop(1, 'rgba(0,0,0,0.35)');
      ctx.fillStyle = vigGrad;
      ctx.fillRect(0, 0, width, height);

      stars.current.forEach(star => {
        let currentOpacity = star.opacity;
        if (!reducedMotion) {
           currentOpacity += Math.sin(star.twinklePhase) * star.twinkleAmplitude;
           star.twinklePhase += star.twinkleSpeed;
        }
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245, 230, 232, ${Math.max(0.02, currentOpacity)})`;
        ctx.fill();
      });

      if (!reducedMotion && frameCount % 600 === 0 && Math.random() > 0.5) {
         shootingStars.current.push({
           x: Math.random() * width,
           y: Math.random() * (height / 2),
           ex: 30 + Math.random() * 50,
           ey: -20 + Math.random() * 40,
           life: 8
         });
      }
      
      if (!reducedMotion) {
        shootingStars.current = shootingStars.current.filter(ss => {
          if (ss.life > 0) {
             const progress = (8 - ss.life) / 8;
             const curX = ss.x + ss.ex * progress;
             const curY = ss.y + ss.ey * progress;
             
             const ssGrad = ctx.createLinearGradient(ss.x, ss.y, curX, curY);
             ssGrad.addColorStop(0, 'rgba(245, 230, 232, 0)');
             ssGrad.addColorStop(0.5, 'rgba(245, 230, 232, 0.8)');
             ssGrad.addColorStop(1, 'rgba(245, 230, 232, 0)');
             
             ctx.beginPath();
             ctx.moveTo(ss.x, ss.y);
             ctx.lineTo(curX, curY);
             ctx.strokeStyle = ssGrad;
             ctx.lineWidth = 1;
             ctx.stroke();
             
             ss.life--;
             return true;
          }
          return false;
        });
      }

      if (reducedMotion) return;

      loveParticles.current.forEach(particle => {
        if (particle.spawnDelay > 0) {
           particle.spawnDelay--;
           return;
        }
        
        particle.y -= particle.speed * ((tStatus.multiplier - 1) * 0.8 + 1);
        
        const driftX = Math.sin(particle.driftPhase) * particle.drift;
        particle.driftPhase += particle.driftFrequency;
        const currentX = particle.x + driftX;
        
        particle.rotation += particle.rotationSpeed;
        particle.pulsePhase += particle.pulseSpeed;
        const pulse = Math.sin(particle.pulsePhase) * 0.12;
        
        const progress = (height - particle.y) / height;
        let zoneOpacity = 1.0;
        if (progress < 0.15) {
           zoneOpacity = Math.max(0, progress / 0.15);
        } else if (progress > 0.75) {
           zoneOpacity = Math.max(0, 1.0 - (progress - 0.75) / 0.25);
        }
        
        const finalOpacity = particle.maxOpacity * zoneOpacity + pulse;
        
        if (particle.y < -particle.size * 2) {
           particle.y = height + particle.size + Math.random() * 80;
           particle.x = Math.random() * width;
           particle.driftPhase = Math.random() * Math.PI * 2;
           particle.pulsePhase = Math.random() * Math.PI * 2;
        }
        
        if (finalOpacity > 0) {
          drawHeart(ctx, currentX, particle.y, particle.size, particle.color, finalOpacity, particle.rotation);
        }
      });

      butterflies.current.forEach(butterfly => {
        butterfly.frameCount++;
        butterfly.turboMultiplier = tStatus.multiplier;
        
        butterfly.directionChangeTimer--;
        if (butterfly.directionChangeTimer <= 0) {
           const newAngle = Math.random() * Math.PI * 2;
           butterfly.targetAngle = newAngle;
           butterfly.vx = Math.cos(newAngle) * (0.5 + Math.random() * 1.5);
           butterfly.vy = Math.sin(newAngle) * (0.5 + Math.random() * 1.5);
           butterfly.directionChangeTimer = butterfly.directionChangeInterval;
        }
        
        const sineOffset = Math.sin(butterfly.frameCount * butterfly.sinFrequency + butterfly.sinOffset) * butterfly.sinAmplitude;
        
        const speed = Math.sqrt(butterfly.vx**2 + butterfly.vy**2);
        const perpX = speed > 0 ? -butterfly.vy / speed : 0;
        const perpY = speed > 0 ? butterfly.vx / speed : 0;
        
        const newX = butterfly.x + butterfly.vx * butterfly.turboMultiplier + perpX * sineOffset * 0.04;
        const newY = butterfly.y + butterfly.vy * butterfly.turboMultiplier + perpY * sineOffset * 0.04;
        
        if (newX < -butterfly.size) {
           butterfly.x = -butterfly.size + 1;
           butterfly.vx = Math.abs(butterfly.vx);
        } else if (newX > width + butterfly.size) {
           butterfly.x = width + butterfly.size - 1;
           butterfly.vx = -Math.abs(butterfly.vx);
        } else {
           butterfly.x = newX;
        }
        
        if (newY < -butterfly.size) {
           butterfly.y = -butterfly.size + 1;
           butterfly.vy = Math.abs(butterfly.vy);
        } else if (newY > height + butterfly.size) {
           butterfly.y = height + butterfly.size - 1;
           butterfly.vy = -Math.abs(butterfly.vy);
        } else {
           butterfly.y = newY;
        }
        
        const angleDiff = butterfly.targetAngle - butterfly.angle;
        const normalizedDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
        butterfly.angle += normalizedDiff * 0.08;
        
        butterfly.wingPhase += butterfly.wingSpeed * (1 + (tStatus.multiplier - 1) * 0.5);
        butterfly.wingOpenness = (Math.sin(butterfly.wingPhase) + 1) / 2;
        
        if (butterfly.frameCount % 2 === 0) {
           butterfly.trailPositions.unshift({ x: butterfly.x, y: butterfly.y });
           if (butterfly.trailPositions.length > 6) butterfly.trailPositions.pop();
        }
        
        drawButterfly(ctx, butterfly);
      });

    }, !reducedMotion);

    return (
      <canvas
        ref={canvasRef}
        className={`fixed inset-0 w-full h-full pointer-events-none z-0 ${className}`}
        style={{ zIndex: 0 }}
      />
    );
  }
);

GlobalBackground.displayName = 'GlobalBackground';

export default GlobalBackground;
