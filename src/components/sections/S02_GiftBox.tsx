import { AnimatePresence, motion } from 'framer-motion';
import { Heart, Star } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useAnimationFrame } from '../../hooks/useAnimationFrame';
import { useWindowSize } from '../../hooks/useWindowSize';
import { sounds } from '../../lib/sounds';
import { useAppStore } from '../../lib/store';

interface StemSegment {
  relativeX: number;
  relativeY: number;
  controlX: number;
  controlY: number;
}

interface Leaf {
  segmentIndex: number;
  side: 'left' | 'right';
  size: number;
  angle: number;
  color: string;
  opacity: number;
  growthProgress: number;
  shape: 'oval' | 'pointed' | 'heart';
}

interface FlowerHead {
  petalCount: number;
  petalColor: string;
  petalSecondaryColor: string;
  centerColor: string;
  size: number;
  bloomProgress: number;
  bloomSpeed: number;
  rotation: number;
  rotationSpeed: number;
  glowColor: string;
  glowIntensity: number;
  swayOffset: number;
  type: 'rose' | 'daisy' | 'tulip' | 'sakura' | 'lily';
}

interface FlowerStem {
  id: number;
  x: number;
  startY: number;
  segments: StemSegment[];
  totalHeight: number;
  growthProgress: number;
  growthSpeed: number;
  growthDelay: number;
  thickness: number;
  color: string;
  swayPhase: number;
  swaySpeed: number;
  swayAmplitude: number;
  leaves: Leaf[];
  flower: FlowerHead | null;
  isFullyGrown: boolean;
  type: 'tall' | 'medium' | 'short' | 'vine';
}

interface FallingPetal {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  size: number;
  color: string;
  opacity: number;
  life: number;
  lifeDecay: number;
  swayPhase: number;
  swaySpeed: number;
}

const GIFS = [
  'https://files.catbox.moe/hc81h8.webp',
  'https://files.catbox.moe/umv8is.webp',
  'https://files.catbox.moe/fl1u0y.webp',
  'https://files.catbox.moe/qqdr95.webp',
  'https://files.catbox.moe/afns3z.webp',
  'https://files.catbox.moe/311hpp.gif',
  'https://files.catbox.moe/qkweni.webp',
  'https://files.catbox.moe/ffpxpp.webp',
];

export const S02_GiftBox: React.FC = () => {
  const { goToNext } = useAppStore();
  const { width, height } = useWindowSize();
  
  const canvasFlowerRef = useRef<HTMLCanvasElement>(null);
  const canvasPetalRef = useRef<HTMLCanvasElement>(null);
  
  const stemsRef = useRef<FlowerStem[]>([]);
  const petalsRef = useRef<FallingPetal[]>([]);
  const isMounted = useRef(true);

  const [phase, setPhase] = useState<'idle' | 'opening' | 'growing' | 'blooming' | 'complete'>('idle');
  const [gifUrl, setGifUrl] = useState('');
  const [gifVisible, setGifVisible] = useState(false);
  const [particles, setParticles] = useState<any[]>([]);
  const [ambientColor, setAmbientColor] = useState('rgba(183,227,224,0.08)');

  useEffect(() => {
    isMounted.current = true;
    const rand = GIFS[Math.floor(Math.random() * GIFS.length)];
    setGifUrl(rand);
    GIFS.forEach(src => {
      const img = new Image();
      img.src = src;
    });
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (phase !== 'idle' && phase !== 'opening') {
      const interval = setInterval(() => {
        setAmbientColor(prev => prev === 'rgba(183,227,224,0.08)' ? 'rgba(235,194,198,0.08)' : 'rgba(183,227,224,0.08)');
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [phase]);

  const initFlowers = (cw: number, ch: number) => {
    const stems: FlowerStem[] = [];
    const slotWidth = cw / 22;

    for (let i = 0; i < 22; i++) {
      const isTall = i % 3 === 0;
      const isVine = [3, 7, 11, 15, 19].includes(i);
      const isShort = i % 3 === 2 && !isVine;
      const type = isVine ? 'vine' : isTall ? 'tall' : isShort ? 'short' : 'medium';

      let totalHeight = 140 + Math.random() * 80;
      let growthDelay = 15 + Math.random() * 45;

      if (type === 'tall') {
        totalHeight = 220 + Math.random() * 100;
        growthDelay = Math.random() * 20;
      } else if (type === 'short') {
        totalHeight = 80 + Math.random() * 60;
        growthDelay = 40 + Math.random() * 60;
      } else if (type === 'vine') {
        totalHeight = 180 + Math.random() * 100;
        growthDelay = 20 + Math.random() * 40;
      }

      const x = slotWidth * i + slotWidth * 0.5 + (Math.random() - 0.5) * slotWidth * 0.6;
      const startY = ch + 30 + Math.random() * 50;

      const segments: StemSegment[] = [];
      const segmentCount = Math.floor(totalHeight / 25);
      for (let j = 0; j <= segmentCount; j++) {
        const t = j / segmentCount;
        segments.push({
          relativeX: Math.sin(j * 0.8 + i) * (j * 1.5),
          relativeY: -(totalHeight * t),
          controlX: Math.sin(j * 1.2) * 8,
          controlY: -(totalHeight * t) + 12
        });
      }

      const leaves: Leaf[] = [];
      const leafCount = 2 + Math.floor(Math.random() * 3);
      for (let j = 0; j < leafCount; j++) {
        leaves.push({
          segmentIndex: Math.floor((j + 1) * (segmentCount / (leafCount + 1))),
          side: Math.random() > 0.5 ? 'left' : 'right',
          size: 8 + Math.random() * 14,
          angle: 30 + Math.random() * 40,
          color: ['#3A7A30', '#4A8C3F', '#5AAA48'][Math.floor(Math.random() * 3)],
          opacity: 0.7 + Math.random() * 0.3,
          growthProgress: 0,
          shape: ['oval', 'pointed', 'heart'][Math.floor(Math.random() * 3)] as Leaf['shape']
        });
      }

      stems.push({
        id: i,
        x,
        startY,
        segments,
        totalHeight,
        growthProgress: 0,
        growthSpeed: 0.004 + Math.random() * 0.008,
        growthDelay,
        thickness: 1.5 + Math.random() * 2,
        color: '#3A7A30',
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: 0.008 + Math.random() * 0.012,
        swayAmplitude: 3 + Math.random() * 9,
        leaves,
        flower: null,
        isFullyGrown: false,
        type
      });
    }
    stemsRef.current = stems;
  };

  const generateFlower = (stem: FlowerStem, index: number): FlowerHead => {
    const isRose = [0, 4, 8, 12, 16].includes(index);
    const isDaisy = [1, 5, 9, 13, 17].includes(index);
    const isTulip = [2, 6, 10, 18].includes(index);
    const isSakura = [3, 7, 11, 19].includes(index);
    const type = isRose ? 'rose' : isDaisy ? 'daisy' : isTulip ? 'tulip' : isSakura ? 'sakura' : 'lily';

    let petalColor = '#EBC2C6';
    let petalSecondaryColor = '#F0A0B0';
    let centerColor = '#E8D5A3';

    if (type === 'rose') {
      petalColor = '#EBC2C6'; petalSecondaryColor = '#F0A0B0'; centerColor = '#E8D5A3';
    } else if (type === 'daisy') {
      petalColor = '#F5E6E8'; petalSecondaryColor = '#EBC2C6'; centerColor = '#E8D5A3';
    } else if (type === 'tulip') {
      petalColor = '#D6C2E8'; petalSecondaryColor = '#EBC2C6'; centerColor = '#B7A0C8';
    } else if (type === 'sakura') {
      petalColor = '#F5E6E8'; petalSecondaryColor = '#F0C8D0'; centerColor = '#F5E6A0';
    } else if (type === 'lily') {
      petalColor = '#B7E3E0'; petalSecondaryColor = '#90CCC9'; centerColor = '#F5E6E8';
    }

    return {
      petalCount: type === 'sakura' ? 5 : type === 'lily' ? 6 : type === 'tulip' ? 6 : type === 'daisy' ? 12 : 10,
      petalColor,
      petalSecondaryColor,
      centerColor,
      size: 18 + Math.random() * 22,
      bloomProgress: 0,
      bloomSpeed: 0.008 + Math.random() * 0.012,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.01,
      glowColor: petalColor,
      glowIntensity: 10,
      swayOffset: 0,
      type
    };
  };

  useEffect(() => {
    const dpr = window.devicePixelRatio || 1;
    [canvasFlowerRef, canvasPetalRef].forEach(ref => {
      const canvas = ref.current;
      if (canvas && width > 0 && height > 0) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.scale(dpr, dpr);
      }
    });

    if (width > 0 && height > 0 && stemsRef.current.length === 0) {
      initFlowers(width, height);
    } else if (width > 0 && height > 0) {
      const slotWidth = width / 22;
      stemsRef.current.forEach(s => {
        s.x = slotWidth * s.id + slotWidth * 0.5 + (Math.random() - 0.5) * 20;
        s.startY = height + 30 + Math.random() * 50;
      });
    }
  }, [width, height]);

  const drawFlowerCanvas = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.clearRect(0, 0, w, h);

    stemsRef.current.forEach((stem, index) => {
      if (stem.growthDelay > 0) {
        stem.growthDelay--;
        return;
      }

      if (stem.growthProgress < 1) {
        stem.growthProgress = Math.min(1, stem.growthProgress + stem.growthSpeed);
      }

      const visibleHeight = stem.totalHeight * stem.growthProgress;
      stem.swayPhase += stem.swaySpeed;
      const swayOffset = Math.sin(stem.swayPhase) * stem.swayAmplitude;

      ctx.save();
      ctx.translate(stem.x + swayOffset * stem.growthProgress, stem.startY);

      ctx.beginPath();
      ctx.moveTo(0, 0);

      let drawnHeight = 0;
      for (let i = 1; i < stem.segments.length; i++) {
        const seg = stem.segments[i];
        const prevSeg = stem.segments[i - 1];
        const segHeight = Math.abs(seg.relativeY - prevSeg.relativeY);

        if (drawnHeight + segHeight > visibleHeight) {
          const partial = (visibleHeight - drawnHeight) / segHeight;
          const endX = prevSeg.relativeX + (seg.relativeX - prevSeg.relativeX) * partial;
          const endY = prevSeg.relativeY + (seg.relativeY - prevSeg.relativeY) * partial;
          ctx.quadraticCurveTo(seg.controlX * partial, seg.controlY * partial, endX, endY);
          break;
        }
        ctx.quadraticCurveTo(seg.controlX, seg.controlY, seg.relativeX, seg.relativeY);
        drawnHeight += segHeight;
      }

      const stemGrad = ctx.createLinearGradient(0, 0, 0, -stem.totalHeight);
      stemGrad.addColorStop(0, '#1A3A15');
      stemGrad.addColorStop(0.4, stem.color);
      stemGrad.addColorStop(1, '#5AAA48');
      ctx.strokeStyle = stemGrad;
      ctx.lineWidth = stem.thickness;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      stem.leaves.forEach(leaf => {
        const leafTriggerProgress = leaf.segmentIndex / stem.segments.length;
        if (stem.growthProgress < leafTriggerProgress) return;

        if (leaf.growthProgress < 1) {
          leaf.growthProgress = Math.min(1, leaf.growthProgress + 0.025);
        }

        const segPos = stem.segments[leaf.segmentIndex];
        const leafSway = Math.sin(stem.swayPhase) * stem.swayAmplitude * (leaf.segmentIndex / stem.segments.length);

        ctx.save();
        ctx.translate(segPos.relativeX + leafSway - swayOffset * stem.growthProgress, segPos.relativeY);

        const leafRotation = leaf.side === 'left' ? -(Math.PI / 180 * leaf.angle) : (Math.PI / 180 * leaf.angle);
        ctx.rotate(leafRotation);

        const eased = 1 - Math.pow(1 - leaf.growthProgress, 3);
        ctx.scale(eased, eased);
        ctx.globalAlpha = leaf.opacity * eased;

        if (leaf.shape === 'oval') {
          ctx.beginPath();
          ctx.ellipse(leaf.side === 'left' ? -leaf.size * 0.5 : leaf.size * 0.5, 0, leaf.size * 0.8, leaf.size * 0.35, 0, 0, Math.PI * 2);
          const leafGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, leaf.size);
          leafGrad.addColorStop(0, leaf.color + 'EE');
          leafGrad.addColorStop(0.7, leaf.color + 'CC');
          leafGrad.addColorStop(1, leaf.color + '66');
          ctx.fillStyle = leafGrad;
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(leaf.side === 'left' ? -leaf.size * 0.9 : leaf.size * 0.9, 0);
          ctx.strokeStyle = '#2A5A2280';
          ctx.lineWidth = 0.6;
          ctx.stroke();
        } else if (leaf.shape === 'pointed') {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          const ls = leaf.size;
          ctx.quadraticCurveTo(leaf.side === 'left' ? -ls * 0.3 : ls * 0.3, -ls * 0.5, leaf.side === 'left' ? -ls : ls, 0);
          ctx.quadraticCurveTo(leaf.side === 'left' ? -ls * 0.3 : ls * 0.3, ls * 0.5, 0, 0);
          ctx.fillStyle = leaf.color + 'DD';
          ctx.fill();
        } else if (leaf.shape === 'heart') {
          const ls = leaf.size * 0.5;
          ctx.beginPath();
          ctx.moveTo(0, ls * 0.5);
          ctx.bezierCurveTo(-ls, -ls * 0.2, -ls * 1.2, ls * 0.8, 0, ls * 1.5);
          ctx.bezierCurveTo(ls * 1.2, ls * 0.8, ls, -ls * 0.2, 0, ls * 0.5);
          ctx.fillStyle = leaf.color + 'CC';
          ctx.fill();
        }
        ctx.restore();
      });

      ctx.restore();

      if (stem.growthProgress >= 0.80 && !stem.flower) {
        stem.flower = generateFlower(stem, index);
      }

      if (stem.flower) {
        const flower = stem.flower;
        const tipSegment = stem.segments[stem.segments.length - 1];
        const currentSway = Math.sin(stem.swayPhase) * stem.swayAmplitude;
        const flowerX = stem.x + tipSegment.relativeX + currentSway;
        const flowerY = stem.startY + tipSegment.relativeY;

        if (flower.bloomProgress < 1) {
          flower.bloomProgress = Math.min(1, flower.bloomProgress + flower.bloomSpeed);
        }
        const bloom = flower.bloomProgress;
        const eased = 1 - Math.pow(1 - bloom, 2);

        flower.rotation += flower.rotationSpeed;

        ctx.save();
        ctx.translate(flowerX, flowerY);
        ctx.rotate(flower.rotation);

        if (bloom > 0.3) {
          const glowRadius = flower.size * 2 * bloom;
          const glowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
          const hexR = parseInt(flower.glowColor.slice(1, 3), 16) || 255;
          const hexG = parseInt(flower.glowColor.slice(3, 5), 16) || 255;
          const hexB = parseInt(flower.glowColor.slice(5, 7), 16) || 255;
          glowGrad.addColorStop(0, `rgba(${hexR},${hexG},${hexB},${0.25 * bloom})`);
          glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        if (flower.type === 'rose') {
          for (let layer = 2; layer >= 0; layer--) {
            const layerScale = 1 - layer * 0.25;
            const layerPetalCount = flower.petalCount - layer * 2;
            const layerRotOffset = layer * (Math.PI / layerPetalCount);

            for (let p = 0; p < layerPetalCount; p++) {
              const angle = (p / layerPetalCount) * Math.PI * 2 + layerRotOffset;
              const petalOpenAngle = angle + (1 - eased) * 0.5;

              ctx.save();
              ctx.rotate(petalOpenAngle);
              ctx.scale(eased * layerScale, eased * layerScale);

              const pw = flower.size * 0.4;
              const ph = flower.size * 0.7;
              ctx.beginPath();
              ctx.ellipse(0, -flower.size * 0.4 * layerScale, pw * 0.6, ph * 0.6, 0, 0, Math.PI * 2);

              const petalGrad = ctx.createRadialGradient(0, -flower.size * 0.2, 0, 0, -flower.size * 0.4, ph);
              petalGrad.addColorStop(0, flower.petalSecondaryColor + 'FF');
              petalGrad.addColorStop(0.5, flower.petalColor + 'EE');
              petalGrad.addColorStop(1, flower.petalColor + '88');
              ctx.fillStyle = petalGrad;
              ctx.fill();
              ctx.restore();
            }
          }
        } else if (flower.type === 'daisy') {
          for (let p = 0; p < flower.petalCount; p++) {
            const angle = (p / flower.petalCount) * Math.PI * 2;
            ctx.save();
            ctx.rotate(angle);
            ctx.scale(eased, eased);

            ctx.beginPath();
            ctx.ellipse(0, -flower.size * 0.6, flower.size * 0.18, flower.size * 0.55, 0, 0, Math.PI * 2);

            const daisyGrad = ctx.createLinearGradient(0, 0, 0, -flower.size);
            daisyGrad.addColorStop(0, flower.petalSecondaryColor + 'AA');
            daisyGrad.addColorStop(1, flower.petalColor + 'FF');
            ctx.fillStyle = daisyGrad;
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(0, -flower.size * 0.1);
            ctx.lineTo(0, -flower.size * 1.1);
            ctx.strokeStyle = flower.petalSecondaryColor + '40';
            ctx.lineWidth = 0.5;
            ctx.stroke();
            ctx.restore();
          }
          ctx.beginPath();
          ctx.arc(0, 0, flower.size * 0.28 * eased, 0, Math.PI * 2);
          const centerGrad = ctx.createRadialGradient(-flower.size * 0.08, -flower.size * 0.08, 0, 0, 0, flower.size * 0.28);
          centerGrad.addColorStop(0, '#F5E680');
          centerGrad.addColorStop(0.6, flower.centerColor);
          centerGrad.addColorStop(1, '#C8A820');
          ctx.fillStyle = centerGrad;
          ctx.fill();
          for (let d = 0; d < 7; d++) {
            const da = (d / 7) * Math.PI * 2;
            ctx.beginPath();
            ctx.arc(Math.cos(da) * flower.size * 0.14 * eased, Math.sin(da) * flower.size * 0.14 * eased, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = '#8B6914';
            ctx.fill();
          }
        } else if (flower.type === 'tulip') {
          for (let p = 0; p < flower.petalCount; p++) {
            const angle = (p / flower.petalCount) * Math.PI * 2;
            ctx.save();
            ctx.rotate(angle);

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(
              -flower.size * 0.3, -flower.size * 0.5,
              -flower.size * 0.4, -flower.size * 0.9,
              0, -flower.size * (0.9 + eased * 0.2)
            );
            ctx.bezierCurveTo(
              flower.size * 0.4, -flower.size * 0.9,
              flower.size * 0.3, -flower.size * 0.5,
              0, 0
            );
            ctx.closePath();

            const tulipGrad = ctx.createLinearGradient(-flower.size * 0.3, 0, flower.size * 0.3, 0);
            tulipGrad.addColorStop(0, flower.petalSecondaryColor + 'DD');
            tulipGrad.addColorStop(0.5, flower.petalColor + 'FF');
            tulipGrad.addColorStop(1, flower.petalSecondaryColor + 'DD');
            ctx.fillStyle = tulipGrad;
            ctx.scale(eased, eased);
            ctx.fill();
            ctx.restore();
          }
        } else if (flower.type === 'sakura') {
          for (let p = 0; p < 5; p++) {
            const angle = (p / 5) * Math.PI * 2 - Math.PI / 2;
            const px = Math.cos(angle) * flower.size * 0.45;
            const py = Math.sin(angle) * flower.size * 0.45;

            ctx.save();
            ctx.translate(px * eased, py * eased);
            ctx.rotate(angle + Math.PI / 2);
            ctx.scale(eased * flower.size / 20, eased * flower.size / 20);

            const hs = 10;
            ctx.beginPath();
            ctx.moveTo(0, hs * 0.4);
            ctx.bezierCurveTo(-hs, -hs * 0.1, -hs * 1.1, hs * 0.9, 0, hs * 1.5);
            ctx.bezierCurveTo(hs * 1.1, hs * 0.9, hs, -hs * 0.1, 0, hs * 0.4);

            const sakuraGrad = ctx.createRadialGradient(0, hs * 0.8, 0, 0, hs * 0.8, hs * 1.2);
            sakuraGrad.addColorStop(0, '#FFFFFF99');
            sakuraGrad.addColorStop(0.4, flower.petalColor + 'FF');
            sakuraGrad.addColorStop(1, flower.petalSecondaryColor + 'CC');
            ctx.fillStyle = sakuraGrad;
            ctx.fill();
            ctx.restore();
          }
          if (bloom > 0.7) {
            for (let s = 0; s < 6; s++) {
              const sa = (s / 6) * Math.PI * 2;
              const sr = flower.size * 0.3 * (bloom - 0.7) / 0.3;
              ctx.beginPath();
              ctx.arc(Math.cos(sa) * sr, Math.sin(sa) * sr, 1, 0, Math.PI * 2);
              ctx.fillStyle = '#F5E6A0CC';
              ctx.fill();
            }
          }
        } else if (flower.type === 'lily') {
          for (let p = 0; p < 6; p++) {
            const angle = (p / 6) * Math.PI * 2;
            ctx.save();
            ctx.rotate(angle);
            ctx.scale(eased, eased);

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(
              -flower.size * 0.35, -flower.size * 0.25,
              -flower.size * 0.25, -flower.size * 0.85,
              0, -flower.size * 1.0
            );
            ctx.bezierCurveTo(
              flower.size * 0.25, -flower.size * 0.85,
              flower.size * 0.35, -flower.size * 0.25,
              0, 0
            );

            const lilyGrad = ctx.createLinearGradient(0, 0, 0, -flower.size);
            lilyGrad.addColorStop(0, flower.petalSecondaryColor + 'BB');
            lilyGrad.addColorStop(0.3, flower.petalColor + 'EE');
            lilyGrad.addColorStop(1, '#FFFFFF88');
            ctx.fillStyle = lilyGrad;
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(0, -flower.size * 0.1);
            ctx.lineTo(0, -flower.size * 0.95);
            ctx.strokeStyle = flower.petalSecondaryColor + '60';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();
          }
          if (bloom > 0.5) {
            const stamens = 6;
            for (let s = 0; s < stamens; s++) {
              const sa = (s / stamens) * Math.PI * 2;
              const sr = flower.size * 0.3;
              const sx = Math.cos(sa) * sr;
              const sy = Math.sin(sa) * sr;
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.lineTo(sx * bloom, sy * bloom - flower.size * 0.4 * bloom);

              const hexColor = '#F5E6A0' + Math.floor((bloom - 0.5) * 2 * 255).toString(16).padStart(2, '0');
              ctx.strokeStyle = hexColor;
              ctx.lineWidth = 0.8;
              ctx.stroke();
              ctx.beginPath();
              ctx.arc(sx * bloom, sy * bloom - flower.size * 0.4 * bloom, 2 * bloom, 0, Math.PI * 2);
              ctx.fillStyle = '#F0D840';
              ctx.fill();
            }
          }
        }

        ctx.restore();

        if (bloom > 0.5 && phase === 'complete' && Math.random() < 0.05 && petalsRef.current.length < 40) {
          petalsRef.current.push({
            id: Date.now() + Math.random(),
            x: flowerX,
            y: flowerY,
            vx: -1.2 + Math.random() * 2.4,
            vy: 0.4 + Math.random() * 1.4,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: -0.04 + Math.random() * 0.08,
            size: 5 + Math.random() * 7,
            color: flower.petalColor,
            opacity: 0.7 + Math.random() * 0.3,
            life: 1.0,
            lifeDecay: 0.003 + Math.random() * 0.004,
            swayPhase: Math.random() * Math.PI * 2,
            swaySpeed: 0.02 + Math.random() * 0.03
          });
        }
      }
    });
  };

  const drawPetalCanvas = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.clearRect(0, 0, w, h);

    if (phase !== 'complete') return;

    for (let i = petalsRef.current.length - 1; i >= 0; i--) {
      const petal = petalsRef.current[i];
      petal.vy += 0.02;
      petal.x += petal.vx + Math.sin(petal.swayPhase) * 0.8;
      petal.y += petal.vy;
      petal.rotation += petal.rotationSpeed;
      petal.swayPhase += petal.swaySpeed;
      petal.life -= petal.lifeDecay;
      petal.opacity = petal.life;

      if (petal.life <= 0 || petal.y > h + 20) {
        petalsRef.current.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.translate(petal.x, petal.y);
      ctx.rotate(petal.rotation);
      ctx.globalAlpha = Math.max(0, petal.opacity);

      ctx.beginPath();
      ctx.ellipse(0, 0, petal.size * 0.6, petal.size, Math.PI / 6, 0, Math.PI * 2);

      const hexOpacity = Math.max(0, Math.min(255, Math.floor(petal.opacity * 200))).toString(16).padStart(2, '0');
      ctx.fillStyle = petal.color + hexOpacity;
      ctx.fill();
      ctx.restore();
    }
  };

  useAnimationFrame(() => {
    if (phase === 'idle' || phase === 'opening') return;

    const fc = canvasFlowerRef.current;
    if (fc && isMounted.current) {
      const ctxF = fc.getContext('2d');
      if (ctxF) drawFlowerCanvas(ctxF, width, height);
    }

    const pc = canvasPetalRef.current;
    if (pc && isMounted.current) {
      const ctxP = pc.getContext('2d');
      if (ctxP) drawPetalCanvas(ctxP, width, height);
    }
  }, true);

  const triggerBurst = () => {
    const newParticles = Array.from({ length: 60 }).map((_, i) => ({
      id: Date.now() + i,
      type: i < 30 ? 'heart' : i < 50 ? 'star' : 'circle',
      x: (Math.random() - 0.5) * 560,
      y: -Math.random() * 450 + 100,
      delay: Math.random() * 0.15,
      duration: 0.9 + Math.random() * 0.9,
      rotate: (Math.random() - 0.5) * 720,
      scale: 1.2 + Math.random() * 0.8,
      color: ['#EBC2C6', '#D6C2E8', '#B7E3E0', '#F5C2A0'][Math.floor(Math.random() * 4)]
    }));
    setParticles(newParticles);
    setTimeout(() => { if (isMounted.current) setParticles([]); }, 1800);
  };

  const handleBoxClick = (e?: React.MouseEvent | React.TouchEvent | React.PointerEvent) => {
    if (e) e.preventDefault();
    if (phase !== 'idle') return;

    sounds.clickSound?.();
    setPhase('opening');

    setTimeout(() => {
      if (!isMounted.current) return;
      setGifVisible(true);
      sounds.successSound?.();
    }, 400);

    setTimeout(() => {
      if (!isMounted.current) return;
      triggerBurst();
    }, 600);

    setTimeout(() => {
      if (isMounted.current) setPhase('growing');
    }, 800);

    setTimeout(() => {
      if (isMounted.current) setPhase('blooming');
    }, 3000);

    setTimeout(() => {
      if (isMounted.current) setPhase('complete');
    }, 5000);
  };

  return (
    <div className="fixed inset-0 bg-[#0A0A0E] overflow-hidden flex flex-col items-center justify-center z-20">
      <canvas ref={canvasFlowerRef} className="fixed inset-0 w-full h-full pointer-events-none z-0" />

      <AnimatePresence>
        {phase !== 'idle' && phase !== 'opening' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, background: `linear-gradient(to top, ${ambientColor} 0%, rgba(214,194,232,0.05) 30%, transparent 100%)` }}
            transition={{ duration: 2.5, delay: 0.8 }}
            className="fixed bottom-0 left-0 right-0 h-[40%] pointer-events-none z-10"
          />
        )}
      </AnimatePresence>

      <motion.div className="z-20 w-[420px] flex flex-col items-center relative">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-[13px] font-[300] text-[#5A5A70] tracking-[3px] uppercase mb-[40px] drop-shadow-md"
        >
          Ada sesuatu untukmu
        </motion.div>

        <motion.div
          className="w-[200px] h-[200px] relative select-none"
          style={{ perspective: 800, transformStyle: 'preserve-3d', cursor: phase === 'idle' ? 'pointer' : 'default' }}
          onClick={phase === 'idle' ? handleBoxClick : undefined}
          onPointerDown={phase === 'idle' ? handleBoxClick : undefined}
          animate={phase === 'idle' ? { y: [0, -10, 0], rotate: [-1, 1, -1] } : undefined}
          transition={phase === 'idle' ? { duration: 2.2, repeat: Infinity, ease: 'easeInOut' } : undefined}
          whileHover={phase === 'idle' ? { scale: 1.06, y: -5, boxShadow: '0 40px 80px rgba(235,194,198,0.3), 0 0 0 1px rgba(235,194,198,0.4)' } : {}}
          whileTap={phase === 'idle' ? { scale: 0.97 } : {}}
        >
          {phase === 'idle' && (
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -inset-[200px] z-[-1] rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(ellipse, rgba(235,194,198,0.04) 0%, transparent 70%)' }}
            />
          )}

          <div
            className="w-[200px] h-[200px] rounded-[12px] relative overflow-visible"
            style={{
              background: 'linear-gradient(145deg, #C8A0A8, #A880B0, #B090C0)',
              boxShadow: '0 30px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(235,194,198,0.2), inset 0 2px 4px rgba(255,255,255,0.15), inset 0 -4px 8px rgba(0,0,0,0.2)'
            }}
          >
            <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[28px] h-full rounded-[2px]" style={{ background: 'linear-gradient(90deg, #F0A0B0, #E88090, #F8B0C0, #E88090, #F0A0B0)' }} />
            <div className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-[28px]" style={{ background: 'linear-gradient(180deg, #F0A0B0, #E88090, #F8B0C0, #E88090, #F0A0B0)' }} />
            <div className="absolute top-0 left-0 w-[40%] h-[40%] rounded-tl-[12px] pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.15), transparent)' }} />

            {phase === 'idle' && (
              <motion.div
                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex justify-center items-center pointer-events-none"
                animate={{ y: [-2, 2, -2] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="w-[50px] h-[30px] rounded-[50%] bg-[#F8B0C0] absolute right-2 origin-left rotate-[-40deg] shadow-[0_2px_8px_rgba(0,0,0,0.3)]" />
                <div className="w-[50px] h-[30px] rounded-[50%] bg-[#F8B0C0] absolute left-2 origin-right rotate-[40deg] shadow-[0_2px_8px_rgba(0,0,0,0.3)]" />
                <div className="w-[18px] h-[18px] rounded-full bg-[#F8B0C0] shadow-[0_2px_8px_rgba(0,0,0,0.3)] relative z-10" />
              </motion.div>
            )}

            <AnimatePresence>
              {gifVisible && (
                <motion.img
                  src={gifUrl}
                  initial={{ scale: 0, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: -90 }}
                  transition={{ delay: 0.1, duration: 0.5, type: 'spring', stiffness: 300, damping: 20 }}
                  className="absolute top-1/2 left-1/2 -ml-[65px] mt-[10px] w-[130px] h-[130px] rounded-full border-[3px] border-[rgba(235,194,198,0.6)] object-cover shadow-[0_10px_30px_rgba(0,0,0,0.4),_0_0_20px_rgba(235,194,198,0.2)] z-[-1]"
                />
              )}
            </AnimatePresence>
          </div>

          <motion.div
            className="absolute top-[-28px] left-[-8px] w-[216px] h-[60px] rounded-t-[10px] origin-bottom z-10 overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, #D8B0B8, #B890C8)',
              boxShadow: '0 -4px 12px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.2)',
              transformOrigin: 'bottom center'
            }}
            animate={phase !== 'idle' ? { rotateX: -130, y: -20 } : { rotateX: 0, y: 0 }}
            transition={{ duration: 0.6, ease: [0.34, 1.2, 0.64, 1] }}
          >
            <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[28px] h-full rounded-[2px]" style={{ background: 'linear-gradient(90deg, #F0A0B0, #E88090, #F8B0C0, #E88090, #F0A0B0)' }} />
          </motion.div>
        </motion.div>
      </motion.div>

      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute left-1/2 top-1/2 pointer-events-none z-30"
          initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
          animate={{ x: p.x, y: p.y, scale: [0, p.scale, 0], opacity: [1, 1, 0], rotate: p.rotate }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeOut' }}
        >
          {p.type === 'heart' && <Heart fill={p.color} color={p.color} size={16} />}
          {p.type === 'star' && <Star fill={p.color} color={p.color} size={14} />}
          {p.type === 'circle' && <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color }} />}
        </motion.div>
      ))}

      <canvas ref={canvasPetalRef} className="fixed inset-0 w-full h-full pointer-events-none z-40" />

      <AnimatePresence>
        {phase === 'complete' && (
          <motion.button
            initial={{ opacity: 0, y: 30, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            whileHover={{ scale: 1.05, boxShadow: '0 12px 32px rgba(235,194,198,0.45)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => goToNext()}
            className="fixed bottom-[40px] left-1/2 -translate-x-1/2 z-50 flex items-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #EBC2C6, #D6C2E8)',
              borderRadius: '60px',
              padding: '16px 48px',
              font: '600 15px/1 sans-serif',
              color: '#1A0A0C',
              boxShadow: '0 8px 24px rgba(235,194,198,0.3)'
            }}
          >
            Lanjutkan Petualangan
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default S02_GiftBox;
