/**
 * Echoward: Reino das Cinzas - Global Particle System Manager
 * High-performance, object-pooled visual effects manager for dust puffs,
 * combat sparks, ground impact shockwaves, blood ash, and boss abilities.
 */

export interface VisualParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  startSize: number;
  color: string;
  alpha: number;
  decay: number;
  gravity: number;
  friction: number;
  shape: 'spark' | 'dust' | 'ring' | 'debris' | 'smoke' | 'ember';
  rotation?: number;
  rotationSpeed?: number;
  ringRadius?: number;
  maxRingRadius?: number;
}

export class ParticleSystemManager {
  private particles: VisualParticle[] = [];
  private maxParticles: number = 400;

  constructor() {}

  /**
   * Resets all active particles
   */
  public clear(): void {
    this.particles = [];
  }

  /**
   * Emits dust puff when player walks, dashes, lands, or jumps
   */
  public createDustPuff(
    x: number,
    y: number,
    count: number = 8,
    vxBias: number = 0,
    color: string = '#94a3b8'
  ): void {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const angle = Math.PI + (Math.random() - 0.5) * 1.2;
      const speed = 20 + Math.random() * 60;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y + (Math.random() - 0.5) * 4,
        vx: Math.cos(angle) * speed + vxBias * 30,
        vy: -10 - Math.random() * 35,
        size: 3 + Math.random() * 5,
        startSize: 3 + Math.random() * 5,
        color,
        alpha: 0.65 + Math.random() * 0.25,
        decay: 1.6 + Math.random() * 1.2,
        gravity: 15,
        friction: 0.92,
        shape: 'dust',
      });
    }
  }

  /**
   * Emits bright, sharp combat sparks when slashing enemies or parrying
   */
  public createCombatSparks(
    x: number,
    y: number,
    color: string = '#72E7FE',
    count: number = 14,
    speedMultiplier: number = 1.0
  ): void {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const ang = Math.random() * Math.PI * 2;
      const speed = (90 + Math.random() * 260) * speedMultiplier;
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        size: 2 + Math.random() * 3,
        startSize: 2 + Math.random() * 3,
        color,
        alpha: 1.0,
        decay: 2.2 + Math.random() * 2.5,
        gravity: 120,
        friction: 0.95,
        shape: 'spark',
      });
    }
  }

  /**
   * Creates an impactful ground impact effect with expanding shockwave ring,
   * radial dust puffs, and basalt debris chunks.
   */
  public createGroundImpact(
    x: number,
    y: number,
    intensity: number = 1.0,
    radius: number = 32
  ): void {
    // 1. Shockwave ring expanding along the ground
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      size: 2,
      startSize: 2,
      ringRadius: 4,
      maxRingRadius: radius * intensity,
      color: '#72E7FE',
      alpha: 0.85,
      decay: 2.4 / intensity,
      gravity: 0,
      friction: 1,
      shape: 'ring',
    });

    // 2. Dust plumes kicking left and right
    const dustCount = Math.floor(10 * intensity);
    for (let i = 0; i < dustCount; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const side = i % 2 === 0 ? 1 : -1;
      const speed = 40 + Math.random() * 90 * intensity;
      this.particles.push({
        x: x + side * (Math.random() * 12),
        y: y - 2,
        vx: side * speed,
        vy: -20 - Math.random() * 45 * intensity,
        size: 4 + Math.random() * 5 * intensity,
        startSize: 4 + Math.random() * 5 * intensity,
        color: '#94a3b8',
        alpha: 0.7,
        decay: 1.8,
        gravity: 25,
        friction: 0.91,
        shape: 'dust',
      });
    }

    // 3. Basalt rock debris
    const debrisCount = Math.floor(6 * intensity);
    for (let i = 0; i < debrisCount; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const ang = -Math.PI * (0.15 + Math.random() * 0.7);
      const spd = 70 + Math.random() * 130 * intensity;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y - 4,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        size: 2.5 + Math.random() * 3,
        startSize: 2.5 + Math.random() * 3,
        color: '#334155',
        alpha: 1.0,
        decay: 1.4,
        gravity: 420,
        friction: 0.97,
        shape: 'debris',
        rotation: Math.random() * Math.PI,
        rotationSpeed: (Math.random() - 0.5) * 10,
      });
    }
  }

  /**
   * Blood-ash particles emitted when receiving damage
   */
  public createDamageAsh(x: number, y: number, color: string = '#ef4444', count: number = 14): void {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const ang = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 180;
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 30,
        size: 2.5 + Math.random() * 3.5,
        startSize: 2.5 + Math.random() * 3.5,
        color,
        alpha: 0.9,
        decay: 2.0,
        gravity: 160,
        friction: 0.94,
        shape: 'spark',
      });
    }
  }

  /**
   * Boss attack slam or blast effect
   */
  public createBossAttackEffect(
    x: number,
    y: number,
    color: string = '#f59e0b',
    intensity: number = 1.5
  ): void {
    this.createGroundImpact(x, y, intensity, 50);
    for (let i = 0; i < 20; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const ang = Math.random() * Math.PI * 2;
      const spd = 120 + Math.random() * 280;
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 60,
        size: 3 + Math.random() * 4,
        startSize: 3 + Math.random() * 4,
        color,
        alpha: 1.0,
        decay: 1.5,
        gravity: 180,
        friction: 0.96,
        shape: 'ember',
      });
    }
  }

  /**
   * Update particle positions, velocities, friction, and alphas
   */
  public update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      p.vx *= p.friction;
      p.vy *= p.friction;
      p.vy += p.gravity * dt;

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      p.alpha -= p.decay * dt;

      if (p.shape === 'ring' && p.ringRadius !== undefined && p.maxRingRadius !== undefined) {
        p.ringRadius += (p.maxRingRadius - p.ringRadius) * (8 * dt);
      }

      if (p.rotation !== undefined && p.rotationSpeed !== undefined) {
        p.rotation += p.rotationSpeed * dt;
      }

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  /**
   * Render all particles on the canvas context (in world coordinates)
   */
  public render(ctx: CanvasRenderingContext2D): void {
    if (this.particles.length === 0) return;

    ctx.save();
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (p.alpha <= 0) continue;

      ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));

      if (p.shape === 'spark') {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      } else if (p.shape === 'ember') {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'dust') {
        ctx.shadowBlur = 0;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.8 + (1 - p.alpha) * 0.4), 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'debris') {
        ctx.shadowBlur = 0;
        ctx.fillStyle = p.color;
        ctx.save();
        ctx.translate(p.x, p.y);
        if (p.rotation) ctx.rotate(p.rotation);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
        ctx.restore();
      } else if (p.shape === 'ring' && p.ringRadius) {
        ctx.shadowBlur = 4;
        ctx.shadowColor = p.color;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(1, 2.5 * p.alpha);
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.ringRadius, p.ringRadius * 0.35, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}

export const globalParticleSystem = new ParticleSystemManager();
