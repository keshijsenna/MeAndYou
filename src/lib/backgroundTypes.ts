export interface Butterfly {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  baseVx: number
  baseVy: number
  angle: number
  targetAngle: number
  wingPhase: number
  wingSpeed: number
  wingOpenness: number
  size: number
  color: string
  secondaryColor: string
  opacity: number
  sinOffset: number
  sinAmplitude: number
  sinFrequency: number
  frameCount: number
  turboMultiplier: number
  trailPositions: {x:number; y:number}[]
  directionChangeTimer: number
  directionChangeInterval: number
}

export interface LoveParticle {
  id: number
  x: number
  y: number
  startY: number
  size: number
  opacity: number
  maxOpacity: number
  speed: number
  drift: number
  driftPhase: number
  driftFrequency: number
  color: string
  rotation: number
  rotationSpeed: number
  pulsePhase: number
  pulseSpeed: number
  spawnDelay: number
}

export interface Star {
  x: number
  y: number
  size: number
  opacity: number
  twinklePhase: number
  twinkleSpeed: number
  twinkleAmplitude: number
}

export interface GlobalBackgroundProps {
  turboMode?: boolean
  particleIntensity?: 'low' | 'normal' | 'high'
  className?: string
}

export interface GlobalBackgroundRef {
  triggerTurbo: () => void
}
