/**
 * Echoward: Reino das Cinzas - Canvas 2D Hand-Drawn Style Renderer
 * Accurately styled after the Nox concept sheet with luminous player lantern lighting
 */

import {
  PlayerState,
  GameRoom,
  ActiveEnemy,
  AttackSlash,
  Projectile,
  Particle,
  RemotePlayer,
  Platform,
} from './types';
import { REGIONS } from './regionsData';
import { spriteStore, AnimationStateName } from './spriteStore';
import { playerAnimationStore } from './playerAnimationStore';

export class GameRenderer {
  public cameraX: number = 0;
  public cameraY: number = 0;
  public particles: Particle[] = [];

  // Lighting scratch canvas
  private lightCanvas: HTMLCanvasElement | null = null;
  private lightCtx: CanvasRenderingContext2D | null = null;

  constructor() {
    if (typeof document !== 'undefined') {
      this.lightCanvas = document.createElement('canvas');
      this.lightCtx = this.lightCanvas.getContext('2d');
    }
  }

  public addSparks(x: number, y: number, color: string = '#72E7FE', count: number = 10) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 220;
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        size: 2 + Math.random() * 3,
        color,
        alpha: 1,
        decay: 1.5 + Math.random() * 2,
        shape: 'spark',
      });
    }
  }

  public addDust(x: number, y: number, count: number = 6) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 6,
        vx: (Math.random() - 0.5) * 50,
        vy: -15 - Math.random() * 35,
        size: 3 + Math.random() * 4,
        color: '#94a3b8',
        alpha: 0.7,
        decay: 1.5,
        shape: 'circle',
      });
    }
  }

  public render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    room: GameRoom,
    player: PlayerState,
    enemies: ActiveEnemy[],
    projectiles: Projectile[],
    slash: AttackSlash | null,
    remotePlayers: RemotePlayer[],
    screenShake: number,
    dt: number
  ) {
    const region = REGIONS[room.regionId] || REGIONS.lumen_village;

    // Smooth Camera Follow with lookahead
    const lookaheadX = player.facing === 'right' ? 80 : -80;
    const targetCamX = player.x + player.width / 2 + lookaheadX - width / 2;
    const targetCamY = player.y + player.height / 2 - height / 2;

    this.cameraX += (targetCamX - this.cameraX) * 0.12;
    this.cameraY += (targetCamY - this.cameraY) * 0.12;

    // Clamp camera within room bounds
    this.cameraX = Math.max(0, Math.min(room.width - width, this.cameraX));
    this.cameraY = Math.max(0, Math.min(room.height - height, this.cameraY));

    // Screen shake offset
    const shakeX = (Math.random() - 0.5) * screenShake * 1.5;
    const shakeY = (Math.random() - 0.5) * screenShake * 1.5;

    ctx.save();
    ctx.translate(-Math.round(this.cameraX + shakeX), -Math.round(this.cameraY + shakeY));

    // 1. Parallax Deep Background
    this.renderBackground(ctx, width, height, room, region);

    // 2. Room Architecture & Platforms
    this.renderPlatforms(ctx, room.platforms, player.isMemoryVisionActive);

    // 3. Totems, Lore Tablets, NPCs, Collectibles
    this.renderWorldObjects(ctx, room, player);

    // 4. Remote Players (Co-op Companions)
    for (const remote of remotePlayers) {
      if (remote.currentRoomId === room.id) {
        this.renderRemoteWanderer(ctx, remote);
      }
    }

    // 5. Active Enemies & Bosses
    this.renderEnemies(ctx, enemies);

    // 6. Player (Nox)
    this.renderNox(ctx, player, slash);

    // 7. Projectiles
    this.renderProjectiles(ctx, projectiles);

    // 8. Particles
    this.updateAndRenderParticles(ctx, dt, room);

    // 9. Lighting / Luminous Lantern Pass (Bright light around Nox to see the path!)
    this.renderLighting(ctx, width, height, player, room, enemies);

    ctx.restore();
  }

  private renderBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    room: GameRoom,
    region: typeof REGIONS.lumen_village
  ) {
    const grad = ctx.createLinearGradient(this.cameraX, 0, this.cameraX, room.height);
    grad.addColorStop(0, region.ambientColors[0]);
    grad.addColorStop(0.5, region.ambientColors[1]);
    grad.addColorStop(1, region.ambientColors[2]);
    ctx.fillStyle = grad;
    ctx.fillRect(this.cameraX, this.cameraY, width, height);

    // Distant gothic arches (Parallax layer 0.3x)
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.40)';
    const archSpacing = 320;
    const offsetArch = (this.cameraX * 0.3) % archSpacing;
    for (let x = this.cameraX - offsetArch - archSpacing; x < this.cameraX + width + archSpacing; x += archSpacing) {
      ctx.beginPath();
      ctx.rect(x + 40, 150, 45, 550);
      ctx.arc(x + 120, 200, 80, Math.PI, 0);
      ctx.rect(x + 155, 150, 45, 550);
      ctx.fill();
    }

    // Midground rocky pillars (Parallax layer 0.6x)
    ctx.fillStyle = 'rgba(12, 17, 26, 0.55)';
    const midSpacing = 420;
    const offsetMid = (this.cameraX * 0.6) % midSpacing;
    for (let x = this.cameraX - offsetMid - midSpacing; x < this.cameraX + width + midSpacing; x += midSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, room.height - 100);
      ctx.lineTo(x + 60, 280);
      ctx.lineTo(x + 180, 260);
      ctx.lineTo(x + 240, room.height - 100);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  private renderPlatforms(ctx: CanvasRenderingContext2D, platforms: Platform[], isMemoryVision: boolean) {
    for (const plat of platforms) {
      ctx.save();
      if (plat.type === 'solid') {
        // Dark weathered basalt block
        ctx.fillStyle = '#171d27';
        ctx.fillRect(plat.x, plat.y, plat.width, plat.height);

        // Top stone highlight
        ctx.fillStyle = '#2d3748';
        ctx.fillRect(plat.x, plat.y, plat.width, 4);

        // Stone borders
        ctx.strokeStyle = '#0e141d';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(plat.x, plat.y, plat.width, plat.height);

        // Bioluminescent moss edge on top
        ctx.fillStyle = 'rgba(114, 231, 254, 0.25)';
        ctx.fillRect(plat.x + 6, plat.y + 3, plat.width - 12, 2);
      } else if (plat.type === 'fragile') {
        // Crumbly cracked floor
        ctx.fillStyle = '#2a1f18';
        ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(plat.x, plat.y, plat.width, 3);

        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(plat.x + 20, plat.y);
        ctx.lineTo(plat.x + plat.width / 2, plat.y + plat.height);
        ctx.lineTo(plat.x + plat.width - 20, plat.y);
        ctx.stroke();
      } else if (plat.type === 'resonance_barrier') {
        const pulse = 0.5 + Math.sin(Date.now() * 0.005) * 0.3;
        ctx.fillStyle = `rgba(114, 231, 254, ${pulse * 0.6})`;
        ctx.fillRect(plat.x, plat.y, plat.width, plat.height);

        ctx.strokeStyle = '#72E7FE';
        ctx.lineWidth = 3;
        ctx.strokeRect(plat.x, plat.y, plat.width, plat.height);
      } else if (plat.type === 'bouncy_mushroom') {
        const capPulse = Math.sin(Date.now() * 0.006) * 3;
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.ellipse(
          plat.x + plat.width / 2,
          plat.y + plat.height / 2,
          plat.width / 2,
          plat.height / 2 + capPulse,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.fillStyle = '#ecfeff';
        ctx.beginPath();
        ctx.arc(plat.x + plat.width / 2, plat.y + 8, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (plat.type === 'spike') {
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;
        const spikeCount = Math.floor(plat.width / 14);
        const spikeW = plat.width / spikeCount;
        for (let i = 0; i < spikeCount; i++) {
          ctx.beginPath();
          ctx.moveTo(plat.x + i * spikeW, plat.y + plat.height);
          ctx.lineTo(plat.x + (i + 0.5) * spikeW, plat.y);
          ctx.lineTo(plat.x + (i + 1) * spikeW, plat.y + plat.height);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      } else if (plat.type === 'wall_climbable') {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
        ctx.fillStyle = '#94a3b8';
        for (let y = plat.y + 10; y < plat.y + plat.height; y += 24) {
          ctx.fillRect(plat.x + 2, y, plat.width - 4, 4);
        }
      }

      if (isMemoryVision) {
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(plat.x - 2, plat.y - 2, plat.width + 4, plat.height + 4);
      }
      ctx.restore();
    }
  }

  private renderWorldObjects(ctx: CanvasRenderingContext2D, room: GameRoom, player?: PlayerState) {
    // Resting Totems
    for (const totem of room.totems) {
      ctx.save();
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(totem.x - 20, totem.y + 40, 70, 20);
      ctx.fillStyle = '#334155';
      ctx.fillRect(totem.x, totem.y, 30, 45);

      const glow = Math.sin(Date.now() * 0.004) * 0.2 + 0.8;
      ctx.fillStyle = `rgba(110, 231, 183, ${glow})`;
      ctx.beginPath();
      ctx.arc(totem.x + 15, totem.y - 6, 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '11px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('[W / ↑] Descansar', totem.x + 15, totem.y - 22);
      ctx.restore();
    }

    // Tablets
    for (const tab of room.tablets) {
      ctx.save();
      ctx.fillStyle = '#334155';
      ctx.fillRect(tab.x, tab.y, 24, 40);
      ctx.strokeStyle = '#72E7FE';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(tab.x, tab.y, 24, 40);

      ctx.fillStyle = '#67e8f9';
      ctx.fillRect(tab.x + 6, tab.y + 10, 12, 2);
      ctx.fillRect(tab.x + 6, tab.y + 18, 12, 2);
      ctx.fillRect(tab.x + 6, tab.y + 26, 12, 2);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('[W / ↑] Ler', tab.x + 12, tab.y - 10);
      ctx.restore();
    }

    // NPCs (Com suporte a animações customizadas e interação)
    const nowSec = Date.now() / 1000;
    for (const npc of room.npcs) {
      ctx.save();
      const isPlayerNear =
        player &&
        Math.hypot(
          player.x + player.width / 2 - (npc.x + 16),
          player.y + player.height / 2 - (npc.y + 24)
        ) < 85;

      // Prioridade de sprite: interação ativa > sprite específico do NPC > interação perto > idle geral
      const customNpcFrame =
        (isPlayerNear && (player?.isTalking || player?.isInteracting) && spriteStore.getFrame('npc_interagir', nowSec)) ||
        spriteStore.getFrame(`npc_${npc.id}`, nowSec) ||
        (isPlayerNear && spriteStore.getFrame('npc_interagir', nowSec)) ||
        spriteStore.getFrame('npc_idle', nowSec);

      if (customNpcFrame) {
        const drawW = 46;
        const drawH = 56;
        const bob = Math.sin(nowSec * 3) * 2;
        ctx.drawImage(customNpcFrame, npc.x + 16 - drawW / 2, npc.y + 24 - drawH / 2 + bob, drawW, drawH);

        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(npc.name, npc.x + 16, npc.y - 18);

        if (isPlayerNear) {
          ctx.fillStyle = '#72E7FE';
          ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
          ctx.fillText('💬 [W / ↑ / Toque] Conversar', npc.x + 16, npc.y - 6);
        }
        ctx.restore();
        continue;
      }

      // Fallback procedural
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(npc.x, npc.y + 10, 32, 44);
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(npc.x + 16, npc.y + 12, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f1f5f9';
      ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(npc.name, npc.x + 16, npc.y - 18);
      ctx.fillStyle = '#72E7FE';
      ctx.font = '10px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('[W / ↑] Conversar', npc.x + 16, npc.y - 6);
      ctx.restore();
    }

    // Collectibles
    for (const item of room.collectibles) {
      if (item.collected) continue;
      ctx.save();
      const floatY = Math.sin(Date.now() * 0.006) * 6;
      const pulseColor = item.type === 'ability' ? '#f59e0b' : '#72E7FE';

      ctx.fillStyle = item.type === 'ability' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(114, 231, 254, 0.3)';
      ctx.beginPath();
      ctx.arc(item.x, item.y + floatY, 22, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = pulseColor;
      ctx.beginPath();
      ctx.arc(item.x, item.y + floatY, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 11px "Cinzel", serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.label, item.x, item.y + floatY - 26);
      ctx.restore();
    }
  }

  /**
   * Render Nox - Exactly matching the concept sheet
   * Palette:
   * Porcelain Mask: #EDE3E2, blush/shading: #DBC7C6
   * Eye Socket: #0A0D14, Glowing Cyan Iris: #72E7FE
   * Cape Outer: #3B4262, Cape Inner/Shadow: #22263D
   * Slender Needle Blade: #CBD5E1, Guard Cyan: #72E7FE
   */
  private renderNox(ctx: CanvasRenderingContext2D, player: PlayerState, slash: AttackSlash | null) {
    ctx.save();

    const anim = (player.currentAnimation || 'idle') as AnimationStateName;
    const isRight = player.facing === 'right';
    const centerX = player.x + player.width / 2;
    const time = Date.now() / 1000;

    // Check if custom user imported sprite exists for this animation (uses regulated FPS)
    const customFrame = spriteStore.getFrame(anim, time);
    if (customFrame) {
      ctx.save();
      if (!isRight) {
        ctx.translate(centerX * 2, 0);
        ctx.scale(-1, 1);
      }
      // Draw custom user frame
      const frameW = player.width * 1.8;
      const frameH = player.height * 1.8;
      ctx.drawImage(customFrame, centerX - frameW / 2, player.y + player.height - frameH, frameW, frameH);
      ctx.restore();

      if (slash) {
        this.renderSlash(ctx, slash);
      }
      ctx.restore();
      return;
    }

    // Invulnerability flicker
    if (player.invulnerableTimer > 0 && Math.floor(Date.now() / 60) % 2 === 0) {
      ctx.globalAlpha = 0.45;
    }

    // 1. Dash Ghost Trail (Image 1 & 2: DASH)
    if (player.isDashing) {
      ctx.fillStyle = 'rgba(114, 231, 254, 0.35)';
      ctx.fillRect(player.x - player.dashDirection * 28, player.y + 4, player.width, player.height - 8);

      // Trailing aerodynamic shockwave lines
      ctx.strokeStyle = '#72E7FE';
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const lineY = player.y + 10 + i * 12;
        ctx.beginPath();
        ctx.moveTo(centerX - player.dashDirection * 20, lineY);
        ctx.lineTo(centerX - player.dashDirection * (45 + i * 10), lineY);
        ctx.stroke();
      }

      // Front Crescent Shockwave Arc on Dash (Exact to Image 1 & 2 DASH)
      ctx.strokeStyle = '#72E7FE';
      ctx.lineWidth = 4;
      ctx.beginPath();
      const arcX = player.dashDirection === 1 ? player.x + player.width + 10 : player.x - 10;
      ctx.arc(arcX, player.y + player.height / 2, 26, isRight ? -Math.PI * 0.45 : Math.PI * 0.45, isRight ? Math.PI * 0.45 : -Math.PI * 0.45, !isRight);
      ctx.stroke();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 2. Healing Focus (Curar - Image 2)
    if (player.isHealing) {
      const radius = 32 + Math.sin(Date.now() * 0.015) * 6;
      ctx.strokeStyle = 'rgba(114, 231, 254, 0.85)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(centerX, player.y + player.height / 2, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Ascension motes
      for (let i = 0; i < 4; i++) {
        const moteY = player.y + player.height - ((Date.now() * 0.08 + i * 14) % 40);
        ctx.fillStyle = '#72E7FE';
        ctx.fillRect(centerX + Math.sin(i * 2 + Date.now() * 0.005) * 16, moteY, 3, 3);
      }
    }

    // 2.8 Jump Takeoff Impulse (Pulo ao apertar - Pulo Início)
    if (anim === 'pulo_inicio' || (player.jumpImpulseTimer && player.jumpImpulseTimer > 0)) {
      ctx.save();
      // Jump launch ring on ground/air
      ctx.strokeStyle = '#72E7FE';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(centerX, player.y + player.height, 16, 5, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Launch sparks/dust
      ctx.fillStyle = '#CBD5E1';
      ctx.beginPath();
      ctx.arc(centerX - 10, player.y + player.height - 2, 3, 0, Math.PI * 2);
      ctx.arc(centerX + 10, player.y + player.height - 2, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 2.9 Air Fall Draft (Queda no Ar)
    if (anim === 'queda_ar' || anim === 'queda') {
      ctx.save();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 2; i++) {
        const lineX = centerX + (i === 0 ? -16 : 16);
        const lineY = player.y + 4 + ((Date.now() * 0.1 + i * 15) % 30);
        ctx.beginPath();
        ctx.moveTo(lineX, lineY);
        ctx.lineTo(lineX, lineY - 8);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 3. Landing Dust Puff (Aterrissagem - Ao Tocar o Chão)
    if (anim === 'aterrissagem' || player.landingTimer > 0) {
      ctx.save();
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(centerX - 16, player.y + player.height - 1, 6, 0, Math.PI * 2);
      ctx.arc(centerX + 16, player.y + player.height - 1, 6, 0, Math.PI * 2);
      ctx.fill();

      // Ground shockwave line
      ctx.strokeStyle = 'rgba(114, 231, 254, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(centerX - 22, player.y + player.height);
      ctx.lineTo(centerX + 22, player.y + player.height);
      ctx.stroke();
      ctx.restore();
    }

    // 3.1 Door / Portal Entry (Entrar Porta)
    if (anim === 'entrar_porta' || (player.doorTransitionTimer && player.doorTransitionTimer > 0)) {
      ctx.save();
      const beamGrad = ctx.createRadialGradient(
        centerX,
        player.y + player.height / 2,
        4,
        centerX,
        player.y + player.height / 2,
        48
      );
      beamGrad.addColorStop(0, 'rgba(114, 231, 254, 0.65)');
      beamGrad.addColorStop(1, 'rgba(114, 231, 254, 0)');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.arc(centerX, player.y + player.height / 2, 48, 0, Math.PI * 2);
      ctx.fill();

      // Portal ascension threshold motes
      for (let i = 0; i < 6; i++) {
        const moteY = player.y + player.height - ((Date.now() * 0.08 + i * 16) % 55);
        ctx.fillStyle = i % 2 === 0 ? '#72E7FE' : '#FFFFFF';
        ctx.fillRect(centerX + Math.sin(i * 1.8 + Date.now() * 0.007) * 20, moteY, 2.5, 2.5);
      }
      ctx.restore();
    }

    // 3.2 Interaction Pulse (Interagir)
    if (anim === 'interagir' || (player.interactionTimer && player.interactionTimer > 0)) {
      ctx.save();
      const rippleRadius = ((Date.now() * 0.04) % 36) + 12;
      ctx.strokeStyle = `rgba(114, 231, 254, ${Math.max(0, 1 - rippleRadius / 45)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(centerX, player.y + player.height - 2, rippleRadius, rippleRadius * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Resonance light beacon from lantern/hand
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(centerX + (isRight ? 10 : -10), player.y + 12, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3.3 Dialogue Motes (Falar)
    if (anim === 'falar' || player.isTalking) {
      ctx.save();
      for (let i = 0; i < 3; i++) {
        const bubbleY = player.y - 12 - ((Date.now() * 0.035 + i * 14) % 25);
        const bubbleX = centerX + (isRight ? 14 : -14) + Math.sin(i * 2 + Date.now() * 0.005) * 5;
        ctx.fillStyle = 'rgba(114, 231, 254, 0.85)';
        ctx.beginPath();
        ctx.arc(bubbleX, bubbleY, 2.2 - i * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Calculate pose angles based on state
    let leanAngle = 0;
    let headOffsetY = 0;
    let cloakFlare = 0;

    if (anim === 'correr') {
      leanAngle = isRight ? 0.28 : -0.28;
    } else if (anim === 'andar') {
      leanAngle = isRight ? 0.14 : -0.14;
    } else if (anim === 'pulo_inicio') {
      // Compressão / agachamento elástico pré-impulso ao apertar o botão de pulo
      headOffsetY = 5;
      cloakFlare = -4;
    } else if (anim === 'pulo_ar' || anim === 'pular') {
      // Subindo no ar: esticado ascendente, capa afunilada
      headOffsetY = -2;
      cloakFlare = 4;
      leanAngle = isRight ? 0.08 : -0.08;
    } else if (anim === 'queda_ar' || anim === 'queda') {
      // Queda no ar (Image 1): capa flutuando para cima em paraquedas, chifres para frente
      cloakFlare = -14;
      headOffsetY = 3;
      leanAngle = isRight ? 0.05 : -0.05;
    } else if (anim === 'aterrissagem') {
      // Aterrissagem ao tocar o chão: agachamento de absorção do choque
      headOffsetY = 8;
      cloakFlare = -6;
    } else if (anim === 'curar') {
      headOffsetY = 8;
    } else if (anim === 'interagir') {
      headOffsetY = 4;
      leanAngle = isRight ? -0.08 : 0.08;
    } else if (anim === 'falar') {
      headOffsetY = 2;
      leanAngle = isRight ? 0.08 : -0.08;
    } else if (anim === 'entrar_porta') {
      headOffsetY = 2;
      cloakFlare = -6;
    } else if (anim === 'dash' || anim === 'dash_aereo') {
      leanAngle = isRight ? 0.55 : -0.55;
      headOffsetY = 4;
    } else if (anim === 'morrer') {
      headOffsetY = 12;
    }

    ctx.save();
    ctx.translate(centerX, player.y + player.height / 2);
    ctx.rotate(leanAngle);
    ctx.translate(-centerX, -(player.y + player.height / 2));

    // 4. Billowing Cloak (Palette: #3B4262 with #22263D inner folds)
    const cloakSway = -player.vx * 0.035;
    const cloakBottomY = player.y + player.height + cloakFlare;

    ctx.fillStyle = '#22263D'; // Inner dark shadow
    ctx.beginPath();
    ctx.moveTo(centerX, player.y + 18 + headOffsetY);
    ctx.lineTo(centerX + (isRight ? -16 : 16) + cloakSway, cloakBottomY);
    ctx.lineTo(centerX + (isRight ? 12 : -12), cloakBottomY);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#3B4262'; // Main deep indigo cloak
    ctx.beginPath();
    ctx.moveTo(centerX, player.y + 16 + headOffsetY);
    // Tattered ragged hem
    ctx.quadraticCurveTo(
      centerX + (isRight ? -14 : 14) + cloakSway,
      player.y + player.height - 4,
      centerX + (isRight ? -22 : 22) + cloakSway,
      cloakBottomY
    );
    // Shredded frayed hem spikes
    ctx.lineTo(centerX + (isRight ? -12 : 12), cloakBottomY - 3);
    ctx.lineTo(centerX + (isRight ? -4 : 4), cloakBottomY + 1);
    ctx.lineTo(centerX + (isRight ? 8 : -8), cloakBottomY - 2);
    ctx.lineTo(centerX + (isRight ? 14 : -14), player.y + player.height - 4);
    ctx.closePath();
    ctx.fill();

    // Cowl / Hood bunched collar around neck (Image 2)
    ctx.fillStyle = '#2B324D';
    ctx.beginPath();
    ctx.ellipse(centerX, player.y + 18 + headOffsetY, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // 5. Pale Bone/Porcelain Mask of Nox (Palette: #EDE3E2, curved bone horns)
    const maskY = player.y + 14 + headOffsetY;

    // 6. Seamless Porcelain Horns (Bone-white matching the mask in concept sheet)
    // Horn shadow/rim
    ctx.fillStyle = '#D6C8C7';
    // Left Horn Shadow
    ctx.beginPath();
    ctx.moveTo(centerX - 9, maskY - 5);
    ctx.quadraticCurveTo(centerX - 18, maskY - 18, centerX - 12, maskY - 28);
    ctx.quadraticCurveTo(centerX - 5, maskY - 18, centerX - 2, maskY - 7);
    ctx.closePath();
    ctx.fill();
    // Right Horn Shadow
    ctx.beginPath();
    ctx.moveTo(centerX + 2, maskY - 7);
    ctx.quadraticCurveTo(centerX + 6, maskY - 17, centerX + 13, maskY - 24);
    ctx.quadraticCurveTo(centerX + 14, maskY - 13, centerX + 9, maskY - 5);
    ctx.closePath();
    ctx.fill();

    // Main Porcelain Horns (Bone White #EDE3E2)
    ctx.fillStyle = '#EDE3E2';
    // Left Horn (Tall, sweeping outward and upward)
    ctx.beginPath();
    ctx.moveTo(centerX - 8, maskY - 6);
    ctx.quadraticCurveTo(centerX - 16, maskY - 18, centerX - 11, maskY - 26);
    ctx.quadraticCurveTo(centerX - 6, maskY - 18, centerX - 3, maskY - 8);
    ctx.closePath();
    ctx.fill();

    // Right Horn (Slightly shorter, graceful curve inward)
    ctx.beginPath();
    ctx.moveTo(centerX + 3, maskY - 8);
    ctx.quadraticCurveTo(centerX + 7, maskY - 16, centerX + 12, maskY - 22);
    ctx.quadraticCurveTo(centerX + 13, maskY - 14, centerX + 8, maskY - 6);
    ctx.closePath();
    ctx.fill();

    // Mask shadow rim
    ctx.fillStyle = '#DBC7C6';
    ctx.beginPath();
    ctx.ellipse(centerX, maskY + 1, 13, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Main Porcelain Mask
    ctx.fillStyle = '#EDE3E2';
    ctx.beginPath();
    ctx.ellipse(centerX, maskY, 12.5, 14.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Subtle Bone White Highlight on forehead and horn crest
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(centerX, maskY - 7, 5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 7. Evolving Mask Cracks (Image 2: Evolução da Máscara)
    const crackStage = player.maskCracks;
    if (crackStage >= 1) {
      // Stage 1: Fine crack branching across right cheek/forehead
      ctx.strokeStyle = '#72E7FE';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(centerX + 2, maskY - 4);
      ctx.lineTo(centerX + 8, maskY + 4);
      ctx.lineTo(centerX + 7, maskY + 12);
      ctx.stroke();
    }
    if (crackStage >= 2) {
      // Stage 2: Deep crack across left eye slit
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(centerX - 6, maskY - 10);
      ctx.lineTo(centerX - 3, maskY);
      ctx.lineTo(centerX - 7, maskY + 8);
      ctx.stroke();
    }
    if (crackStage >= 3) {
      // Stage 3 (Forma Final): Lightning network of brilliant cyan resonance cracks!
      ctx.strokeStyle = '#72E7FE';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(centerX - 10, maskY - 24);
      ctx.lineTo(centerX - 7, maskY - 14);
      ctx.lineTo(centerX - 1, maskY + 2);
      ctx.lineTo(centerX + 4, maskY + 12);
      ctx.stroke();

      // Flame energy wisp on horn tip (Image 2: Forma Final)
      ctx.fillStyle = 'rgba(114, 231, 254, 0.4)';
      ctx.beginPath();
      ctx.arc(centerX - 11, maskY - 26, 6 + Math.sin(Date.now() * 0.01) * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 8. Dark Oval Eye Sockets with Glowing Cyan Iris (Palette: #72E7FE)
    const eyeOffsetX = isRight ? 2.5 : -2.5;

    // Dark Cavities
    ctx.fillStyle = '#0A0D14';
    ctx.beginPath();
    ctx.ellipse(centerX - 4.5 + eyeOffsetX, maskY + 2, 3.2, 5.2, -0.15, 0, Math.PI * 2);
    ctx.ellipse(centerX + 4.5 + eyeOffsetX, maskY + 2, 3.2, 5.2, 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Glowing Cyan Core
    ctx.fillStyle = '#72E7FE';
    ctx.beginPath();
    ctx.ellipse(centerX - 4.5 + eyeOffsetX, maskY + 2, 2.2, 3.6, -0.15, 0, Math.PI * 2);
    ctx.ellipse(centerX + 4.5 + eyeOffsetX, maskY + 2, 2.2, 3.6, 0.15, 0, Math.PI * 2);
    ctx.fill();

    // White Pupil Sparkle
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(centerX - 4 + eyeOffsetX, maskY + 1, 0.9, 0, Math.PI * 2);
    ctx.arc(centerX + 5 + eyeOffsetX, maskY + 1, 0.9, 0, Math.PI * 2);
    ctx.fill();

    // 9. Slender Needle Blade & Dynamic Sword Strike Animation (Image 2)
    if (!player.isAttacking) {
      ctx.save();
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 2.2;
      const bladeX = centerX + (isRight ? -8 : 8);
      ctx.beginPath();
      ctx.moveTo(bladeX, player.y + 12 + headOffsetY);
      ctx.lineTo(bladeX + (isRight ? -16 : 16), player.y + player.height + 2);
      ctx.stroke();

      // Cyan glowing hilt guard
      ctx.fillStyle = '#72E7FE';
      ctx.fillRect(bladeX - 1.5, player.y + 10 + headOffsetY, 3, 3);
      ctx.restore();
    } else {
      // Dynamic animated sword thrust / swing arc
      ctx.save();
      const attackProgress = Math.max(0, Math.min(1, 1 - (player.attackTimer / 0.20)));
      const swingAngle = (attackProgress - 0.5) * Math.PI * 0.9;
      const armX = centerX + (isRight ? 6 : -6);
      const armY = player.y + 15 + headOffsetY;

      ctx.translate(armX, armY);
      if (player.attackDirection === 'up') {
        ctx.rotate(isRight ? -Math.PI * 0.45 + swingAngle * 0.5 : Math.PI * 0.45 - swingAngle * 0.5);
      } else if (player.attackDirection === 'down') {
        ctx.rotate(isRight ? Math.PI * 0.45 - swingAngle * 0.5 : -Math.PI * 0.45 + swingAngle * 0.5);
      } else {
        ctx.rotate(isRight ? swingAngle : -swingAngle);
      }

      // Slashing blade with cyan resonance core & white cutting tip
      ctx.strokeStyle = '#72E7FE';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(isRight ? 34 : -34, 0);
      ctx.stroke();

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(isRight ? 32 : -32, 0);
      ctx.stroke();

      // Cyan resonance guard
      ctx.fillStyle = '#72E7FE';
      ctx.beginPath();
      ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Sharp gleaming tip spark
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(isRight ? 34 : -34, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    ctx.restore(); // Restore lean/rotation

    // 10. Render Weapon Slash Arc (Lâmina de Eco - Image 2)
    if (slash) {
      this.renderSlash(ctx, slash);
    }

    // Floating Player Name Tag above head (online / local)
    const localName = player.name || 'Nox';
    this.renderPlayerNameTag(
      ctx,
      centerX,
      player.y - 32,
      localName,
      '#38bdf8',
      true,
      player.hp,
      player.maxHp
    );

    ctx.restore();
  }

  private renderSlash(ctx: CanvasRenderingContext2D, slash: AttackSlash) {
    // Check if user uploaded custom sprites for the blade slash effect (lamina / slash FX)
    const slashAnimName: AnimationStateName =
      slash.direction === 'up'
        ? 'lamina_vertical'
        : slash.direction === 'down'
        ? 'lamina_baixo'
        : 'lamina';

    const progress = Math.max(0, slash.maxLifetime - slash.lifetime);
    const slashFps = spriteStore.getFps(slashAnimName);
    const customSlashFrame =
      spriteStore.getFrame(slashAnimName, progress, slashFps) ||
      spriteStore.getFrame('lamina', progress, slashFps);

    if (customSlashFrame) {
      ctx.save();
      const centerX = slash.x + slash.width / 2;
      const centerY = slash.y + slash.height / 2;
      ctx.translate(centerX, centerY);

      if (slash.direction === 'up') {
        ctx.rotate(-Math.PI / 2);
      } else if (slash.direction === 'down') {
        ctx.rotate(Math.PI / 2);
      } else if (slash.facing === -1) {
        ctx.scale(-1, 1);
      }

      const drawW = slash.width * 1.6;
      const drawH = slash.height * 1.6;
      ctx.drawImage(customSlashFrame, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.strokeStyle = '#72E7FE';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';

    ctx.beginPath();
    if (slash.direction === 'side') {
      const startAngle = slash.facing === 1 ? -Math.PI * 0.45 : Math.PI * 0.45;
      const endAngle = slash.facing === 1 ? Math.PI * 0.45 : -Math.PI * 0.45;
      ctx.arc(
        slash.facing === 1 ? slash.x : slash.x + slash.width,
        slash.y + slash.height / 2,
        slash.width * 0.9,
        startAngle,
        endAngle,
        slash.facing === -1
      );
    } else if (slash.direction === 'up') {
      ctx.arc(
        slash.x + slash.width / 2,
        slash.y + slash.height,
        slash.height * 0.9,
        -Math.PI * 0.85,
        -Math.PI * 0.15
      );
    } else if (slash.direction === 'down') {
      ctx.arc(
        slash.x + slash.width / 2,
        slash.y,
        slash.height * 0.9,
        Math.PI * 0.15,
        Math.PI * 0.85
      );
    }
    ctx.stroke();

    // White core highlight inside the slash
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.restore();
  }

  private renderRemoteWanderer(ctx: CanvasRenderingContext2D, remote: RemotePlayer) {
    ctx.save();

    // 1. Determine Animation Style & Overrides
    const animStyle = playerAnimationStore.getStyleForPlayer(remote.id, remote.name);
    const activePose = playerAnimationStore.getActivePose(remote.id) || remote.customPose;
    const animSpeed = playerAnimationStore.animationSpeed;
    const effectsIntensity = playerAnimationStore.effectsIntensity;

    const time = (Date.now() / 1000) * animSpeed;
    const isRight = remote.facing === 'right';
    const centerX = remote.x + 14;
    const colors = ['#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#eab308'];
    const cloakColor = colors[remote.colorIndex % colors.length];

    // Determine current animation state
    let anim = activePose || remote.currentAnimation || 'idle';
    if (!activePose && !remote.currentAnimation) {
      if (Math.abs(remote.vx) > 30) anim = 'correr';
      else if (Math.abs(remote.vx) > 5) anim = 'andar';
      else if (remote.vy < -20) anim = 'pulo_ar';
      else if (remote.vy > 20) anim = 'queda_ar';
    }

    // 2. Check Custom Sprite from spriteStore
    if (spriteStore.useCustomSprites && spriteStore.hasFrames(anim as AnimationStateName)) {
      const customFrame = spriteStore.getFrame(anim as AnimationStateName, time);
      if (customFrame) {
        ctx.save();
        if (!isRight) {
          ctx.translate(centerX * 2, 0);
          ctx.scale(-1, 1);
        }
        const frameW = 28 * 1.8;
        const frameH = 40 * 1.8;
        ctx.drawImage(customFrame, centerX - frameW / 2, remote.y + 40 - frameH, frameW, frameH);
        ctx.restore();

        // Still render name tag and emotes
        this.renderPlayerNameTag(
          ctx,
          centerX,
          remote.y - 32,
          remote.name,
          cloakColor,
          false,
          remote.hp,
          remote.maxHp,
          remote.isDowned
        );
        ctx.restore();
        return;
      }
    }

    // 3. Downed Beacon & Revive Prompt
    if (remote.isDowned) {
      const pulse = Math.sin(time * 6) * 4;
      ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
      ctx.beginPath();
      ctx.arc(centerX, remote.y + 24, 26 + pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, remote.y + 24, 30 + pulse, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#f87171';
      ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🚨 [E] Reanimar Companheiro', centerX, remote.y - 42);
    }

    // 4. Dash Trail & Ghost Afterimages
    if (remote.isDashing || anim === 'dash' || anim === 'dash_aereo') {
      const dashDir = isRight ? 1 : -1;
      const ghostAlpha = effectsIntensity === 'baixo' ? 0.2 : 0.45;
      ctx.fillStyle = animStyle === 'shinobi' ? `rgba(15, 23, 42, ${ghostAlpha})` :
                      animStyle === 'fogo' ? `rgba(249, 115, 22, ${ghostAlpha})` :
                      animStyle === 'espectral' ? `rgba(192, 132, 252, ${ghostAlpha})` :
                      `rgba(114, 231, 254, ${ghostAlpha})`;

      // Trailing clone silhouettes
      ctx.fillRect(remote.x - dashDir * 24, remote.y + 4, 24, 34);
      ctx.fillRect(remote.x - dashDir * 44, remote.y + 6, 20, 30);

      // Front Crescent Aerodynamic Shockwave Arc
      ctx.strokeStyle = animStyle === 'fogo' ? '#f97316' : animStyle === 'shinobi' ? '#f43f5e' : '#72E7FE';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      const arcX = dashDir === 1 ? remote.x + 28 + 8 : remote.x - 8;
      ctx.arc(arcX, remote.y + 22, 24, isRight ? -Math.PI * 0.45 : Math.PI * 0.45, isRight ? Math.PI * 0.45 : -Math.PI * 0.45, !isRight);
      ctx.stroke();
    }

    // 5. Jump Takeoff Ring & Fall Draft Lines
    if (anim === 'pulo_inicio' || anim === 'pulo_ar' || anim === 'pular' || remote.vy < -20) {
      ctx.save();
      ctx.strokeStyle = animStyle === 'fogo' ? '#fdba74' : animStyle === 'espectral' ? '#d8b4fe' : '#72E7FE';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(centerX, remote.y + 42, 14, 4, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else if (anim === 'queda_ar' || anim === 'queda' || remote.vy > 20) {
      ctx.save();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 2; i++) {
        const lineX = centerX + (i === 0 ? -14 : 14);
        const lineY = remote.y + 4 + ((time * 120 + i * 14) % 28);
        ctx.beginPath();
        ctx.moveTo(lineX, lineY);
        ctx.lineTo(lineX, lineY - 8);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 6. Style-Specific Pre-Render Pass
    let hoverOffsetY = 0;
    let headOffsetY = 0;
    let leanAngle = 0;
    let cloakFlare = 0;
    let squashX = 1;
    let squashY = 1;

    // A. Espectral Style
    if (animStyle === 'espectral') {
      ctx.globalAlpha = 0.84;
      hoverOffsetY = Math.sin(time * 3.2) * 5 - 3;
      // Stardust glimmers
      if (effectsIntensity !== 'baixo') {
        for (let i = 0; i < 3; i++) {
          const starX = centerX + Math.sin(time * 2 + i * 2.1) * 18;
          const starY = remote.y + 12 + Math.cos(time * 2.5 + i * 1.5) * 16 + hoverOffsetY;
          ctx.fillStyle = i % 2 === 0 ? '#c084fc' : '#e0e7ff';
          ctx.beginPath();
          ctx.arc(starX, starY, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // B. Shinobi Style
    else if (animStyle === 'shinobi') {
      headOffsetY += 3;
      // Draw dynamic flowing red scarf trailing behind
      const scarfDir = isRight ? -1 : 1;
      const wave = Math.sin(time * 9) * 4;
      ctx.strokeStyle = '#e11d48';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(centerX, remote.y + 16);
      ctx.quadraticCurveTo(
        centerX + scarfDir * 16,
        remote.y + 14 + wave,
        centerX + scarfDir * 32,
        remote.y + 18 - wave
      );
      ctx.stroke();
    }

    // C. Chibi Style (Squash & Stretch)
    else if (animStyle === 'chibi') {
      const bounce = Math.abs(Math.sin(time * 6));
      squashY = 0.92 + bounce * 0.16;
      squashX = 1.08 - bounce * 0.12;
      hoverOffsetY = -bounce * 4;
    }

    // D. Glitch Style (Hologram Scanlines & Chromatic Offset)
    else if (animStyle === 'glitch') {
      // Offset magenta echo
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.ellipse(centerX - 3, remote.y + 20, 12, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // E. Fogo Style (Flame Glow & Embers)
    else if (animStyle === 'fogo') {
      if (effectsIntensity !== 'baixo') {
        for (let i = 0; i < 3; i++) {
          const emberX = centerX + Math.sin(time * 4 + i * 2) * 14;
          const emberY = remote.y + 20 - ((time * 40 + i * 16) % 36);
          ctx.fillStyle = i % 2 === 0 ? '#f97316' : '#facc15';
          ctx.beginPath();
          ctx.arc(emberX, emberY, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // F. Dança Style (Celebratory Groove)
    else if (animStyle === 'danca' || anim === 'danca') {
      const danceStep = Math.sin(time * 7);
      leanAngle = danceStep * 0.18;
      hoverOffsetY = -Math.abs(Math.sin(time * 7)) * 6;

      // Colorful disco aura ring at feet
      ctx.save();
      ctx.strokeStyle = `hsl(${(time * 120) % 360}, 90%, 65%)`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(centerX, remote.y + 42, 18, 5, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Floating musical notes
      const noteY = remote.y - 10 - ((time * 25) % 30);
      ctx.fillStyle = '#f472b6';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('♪', centerX + Math.sin(time * 3) * 16, noteY);
      ctx.restore();
    }

    // Interactive Pose Adjustments
    if (anim === 'meditar') {
      hoverOffsetY = Math.sin(time * 2.5) * 6 - 8;
      // Rotating Runic Circle
      ctx.save();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(centerX, remote.y + 40 + hoverOffsetY, 22, 7, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else if (anim === 'pose_vitoria') {
      headOffsetY = -4;
    } else if (anim === 'reverencia') {
      headOffsetY = 6;
      leanAngle = isRight ? 0.35 : -0.35;
    } else if (anim === 'correr') {
      leanAngle = isRight ? 0.24 : -0.24;
    } else if (anim === 'andar') {
      leanAngle = isRight ? 0.12 : -0.12;
    } else if (anim === 'queda_ar' || anim === 'queda') {
      cloakFlare = -10;
      headOffsetY = 2;
    } else if (anim === 'morrer' || remote.isDowned) {
      headOffsetY = 12;
    }

    // Apply Transformation Matrix for Lean & Squash
    ctx.save();
    ctx.translate(centerX, remote.y + 20 + hoverOffsetY);
    ctx.rotate(leanAngle);
    ctx.scale(squashX, squashY);
    ctx.translate(-centerX, -(remote.y + 20 + hoverOffsetY));

    const posY = remote.y + hoverOffsetY;
    const cloakSway = -remote.vx * 0.035;
    const cloakBottomY = posY + 42 + cloakFlare;

    // 7. Cloak / Cape
    if (animStyle === 'fogo') {
      const flameGrad = ctx.createLinearGradient(centerX, posY + 16, centerX, cloakBottomY);
      flameGrad.addColorStop(0, '#ef4444');
      flameGrad.addColorStop(0.5, '#f97316');
      flameGrad.addColorStop(1, '#eab308');
      ctx.fillStyle = flameGrad;
    } else if (animStyle === 'espectral') {
      ctx.fillStyle = '#a855f7';
    } else {
      ctx.fillStyle = cloakColor;
    }

    ctx.beginPath();
    ctx.moveTo(centerX, posY + 16 + headOffsetY);
    ctx.quadraticCurveTo(
      centerX + (isRight ? -14 : 14) + cloakSway,
      posY + 32,
      centerX + (isRight ? -18 : 18) + cloakSway,
      cloakBottomY
    );
    // Tattered hem spikes
    ctx.lineTo(centerX + (isRight ? -10 : 10), cloakBottomY - 3);
    ctx.lineTo(centerX + (isRight ? -4 : 4), cloakBottomY + 1);
    ctx.lineTo(centerX + (isRight ? 6 : -6), cloakBottomY - 2);
    ctx.lineTo(centerX + (isRight ? 14 : -14), posY + 32);
    ctx.closePath();
    ctx.fill();

    // Cowl / Collar collar
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.ellipse(centerX, posY + 18 + headOffsetY, 11, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 8. Porcelain Horns (Archetype Specific)
    const char = remote.character || 'Nox';
    const maskY = posY + 14 + headOffsetY;

    if (animStyle === 'fogo') {
      ctx.fillStyle = '#f97316';
    } else {
      ctx.fillStyle = '#EDE3E2';
    }

    if (char === 'Veyra') {
      // Triple Antler Horns
      ctx.beginPath();
      ctx.moveTo(centerX - 5, maskY - 4);
      ctx.lineTo(centerX - 12, maskY - 18);
      ctx.lineTo(centerX - 7, maskY - 14);
      ctx.lineTo(centerX - 14, maskY - 26);
      ctx.lineTo(centerX - 3, maskY - 6);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(centerX + 3, maskY - 6);
      ctx.lineTo(centerX + 12, maskY - 24);
      ctx.lineTo(centerX + 7, maskY - 14);
      ctx.lineTo(centerX + 11, maskY - 18);
      ctx.lineTo(centerX + 5, maskY - 4);
      ctx.closePath();
      ctx.fill();
    } else if (char === 'Orin') {
      // Curled Ram Horns
      ctx.beginPath();
      ctx.ellipse(centerX - 8, maskY - 10, 6, 9, -0.4, 0, Math.PI * 2);
      ctx.ellipse(centerX + 8, maskY - 10, 6, 9, 0.4, 0, Math.PI * 2);
      ctx.fill();
    } else if (char === 'Kael') {
      // Single Sharp Crescent Blade Horn
      ctx.beginPath();
      ctx.moveTo(centerX - 4, maskY - 4);
      ctx.quadraticCurveTo(centerX + 12, maskY - 24, centerX + 6, maskY - 30);
      ctx.quadraticCurveTo(centerX - 2, maskY - 16, centerX - 1, maskY - 4);
      ctx.closePath();
      ctx.fill();
    } else {
      // Nox: Classic Tall Sweeping Horns
      ctx.beginPath();
      ctx.moveTo(centerX - 6, maskY - 6);
      ctx.quadraticCurveTo(centerX - 14, maskY - 18, centerX - 9, maskY - 24);
      ctx.quadraticCurveTo(centerX - 4, maskY - 18, centerX - 2, maskY - 8);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(centerX + 2, maskY - 8);
      ctx.quadraticCurveTo(centerX + 5, maskY - 16, centerX + 10, maskY - 20);
      ctx.quadraticCurveTo(centerX + 11, maskY - 14, centerX + 6, maskY - 6);
      ctx.closePath();
      ctx.fill();
    }

    // 9. Porcelain Mask
    const maskRadiusX = animStyle === 'chibi' ? 14 : 11;
    const maskRadiusY = animStyle === 'chibi' ? 14 : 13;
    ctx.fillStyle = '#EDE3E2';
    ctx.beginPath();
    ctx.ellipse(centerX, maskY, maskRadiusX, maskRadiusY, 0, 0, Math.PI * 2);
    ctx.fill();

    // 10. Glowing Eyes
    const eyeOffsetX = isRight ? 2 : -2;
    if (animStyle === 'glitch') {
      // Cyber single-line horizontal visor
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(centerX - 8, maskY - 1, 16, 3);
    } else {
      ctx.fillStyle = '#0a0d14';
      ctx.beginPath();
      const eyeR = animStyle === 'chibi' ? 3.8 : 2.5;
      ctx.ellipse(centerX - 3.5 + eyeOffsetX, maskY, eyeR, eyeR * 1.5, 0, 0, Math.PI * 2);
      ctx.ellipse(centerX + 3.5 + eyeOffsetX, maskY, eyeR, eyeR * 1.5, 0, 0, Math.PI * 2);
      ctx.fill();

      const eyeColor = animStyle === 'fogo' ? '#f59e0b' :
                       animStyle === 'espectral' ? '#c084fc' :
                       animStyle === 'shinobi' ? '#f43f5e' : '#72E7FE';
      ctx.fillStyle = eyeColor;
      ctx.beginPath();
      ctx.ellipse(centerX - 3.5 + eyeOffsetX, maskY, eyeR * 0.7, eyeR * 1.1, 0, 0, Math.PI * 2);
      ctx.ellipse(centerX + 3.5 + eyeOffsetX, maskY, eyeR * 0.7, eyeR * 1.1, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pupil sparkle
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(centerX - 3 + eyeOffsetX, maskY - 1, 0.9, 0, Math.PI * 2);
      ctx.arc(centerX + 4 + eyeOffsetX, maskY - 1, 0.9, 0, Math.PI * 2);
      ctx.fill();
    }

    // 11. Blade & Dynamic Attack Slashes
    if (!remote.isAttacking && anim !== 'pose_vitoria') {
      // Slender needle blade strapped to back
      ctx.save();
      ctx.translate(centerX + (isRight ? 11 : -11), posY + 24 + headOffsetY);
      ctx.strokeStyle = animStyle === 'shinobi' ? '#475569' : '#cbd5e1';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(isRight ? 14 : -14, 6);
      ctx.stroke();

      // Blade hilt glow
      ctx.fillStyle = animStyle === 'fogo' ? '#f97316' : '#72E7FE';
      ctx.fillRect(-1.5, -1.5, 3, 3);
      ctx.restore();
    } else if (anim === 'pose_vitoria') {
      // Victory stance: Sword raised straight up into the air
      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX + (isRight ? 4 : -4), maskY);
      ctx.lineTo(centerX + (isRight ? 4 : -4), maskY - 32);
      ctx.stroke();

      // Radiant light beacon on tip
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(centerX + (isRight ? 4 : -4), maskY - 32, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      // Dynamic animated slashing attack arc
      ctx.save();
      const armX = centerX + (isRight ? 8 : -8);
      const armY = posY + 16 + headOffsetY;
      ctx.translate(armX, armY);

      if (remote.attackDirection === 'up') {
        ctx.rotate(isRight ? -Math.PI * 0.4 : Math.PI * 0.4);
      } else if (remote.attackDirection === 'down') {
        ctx.rotate(isRight ? Math.PI * 0.4 : -Math.PI * 0.4);
      }

      // Slashing blade
      const slashColor = animStyle === 'fogo' ? '#f97316' :
                         animStyle === 'espectral' ? '#c084fc' :
                         animStyle === 'shinobi' ? '#f43f5e' : '#72E7FE';
      ctx.strokeStyle = slashColor;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(isRight ? 32 : -32, 0);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(isRight ? 30 : -30, 0);
      ctx.stroke();

      // Crescent light trail in front of sword
      ctx.strokeStyle = slashColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(isRight ? 18 : -18, 0, 18, isRight ? -Math.PI * 0.4 : Math.PI * 0.6, isRight ? Math.PI * 0.4 : Math.PI * 1.4);
      ctx.stroke();

      ctx.restore();
    }

    ctx.restore(); // Restore matrix transformation

    // 12. Floating Name Tag above head
    this.renderPlayerNameTag(
      ctx,
      centerX,
      remote.y - 32,
      remote.name,
      cloakColor,
      false,
      remote.hp,
      remote.maxHp,
      remote.isDowned
    );

    // 13. Emote Bubble
    if (remote.lastEmote && remote.lastEmote.timer > 0) {
      const bubbleY = remote.y - 58;
      ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
      const bubbleText = remote.lastEmote.text;
      const bWidth = ctx.measureText(bubbleText).width + 16;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.beginPath();
      ctx.roundRect(centerX - bWidth / 2, bubbleY - 14, bWidth, 24, 8);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(bubbleText, centerX, bubbleY - 2);
    }

    ctx.restore();
  }

  public renderPlayerNameTag(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    name: string,
    accentColor: string,
    isLocal: boolean,
    hp: number,
    maxHp: number,
    isDowned: boolean = false
  ) {
    ctx.save();
    ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
    const tagText = isLocal ? `${name} (Você)` : name;
    const textWidth = ctx.measureText(tagText).width;
    const paddingX = 8;
    const tagW = Math.max(textWidth + paddingX * 2, 46);
    const tagH = 19;
    const tagX = x - tagW / 2;
    const tagY = y;

    // Background pill
    ctx.fillStyle = isDowned ? 'rgba(153, 27, 27, 0.92)' : 'rgba(8, 12, 20, 0.88)';
    ctx.beginPath();
    ctx.roundRect(tagX, tagY, tagW, tagH, 6);
    ctx.fill();

    // Accent border
    ctx.strokeStyle = isDowned ? '#ef4444' : accentColor;
    ctx.lineWidth = 1.3;
    ctx.stroke();

    // Status dot
    const dotX = tagX + 7;
    const dotY = tagY + tagH / 2;
    ctx.fillStyle = isDowned ? '#f87171' : accentColor;
    ctx.beginPath();
    ctx.arc(dotX, dotY, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Name text
    ctx.fillStyle = isDowned ? '#fecaca' : '#f1f5f9';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(tagText, tagX + 14, dotY);

    // Mini HP pips below tag
    if (maxHp > 0) {
      const pipW = 4;
      const pipH = 2.5;
      const gap = 2;
      const totalPipsW = maxHp * pipW + (maxHp - 1) * gap;
      const pipsStartX = x - totalPipsW / 2;
      const pipsY = tagY + tagH + 2;

      for (let i = 0; i < maxHp; i++) {
        ctx.fillStyle = i < hp ? (isDowned ? '#ef4444' : accentColor) : 'rgba(71, 85, 105, 0.6)';
        ctx.fillRect(pipsStartX + i * (pipW + gap), pipsY, pipW, pipH);
      }
    }

    ctx.restore();
  }

  private renderEnemies(ctx: CanvasRenderingContext2D, enemies: ActiveEnemy[]) {
    const nowSec = Date.now() / 1000;
    for (const en of enemies) {
      ctx.save();

      // Check custom enemy sprite
      let enemyAnimKey = `enemy_${en.type}`;
      if (en.type === 'varron_sentinel') enemyAnimKey = 'enemy_sentinel';
      if (en.type === 'abyss_diver') enemyAnimKey = 'enemy_diver';
      if (en.type === 'boss_guardian') enemyAnimKey = 'enemy_boss_guardian';
      if (en.type === 'boss_shade') enemyAnimKey = 'enemy_boss_shade';

      if (en.invulnerableTimer > 0 && spriteStore.hasFrames('enemy_dano')) {
        enemyAnimKey = 'enemy_dano';
      }

      const customEnemyFrame = spriteStore.getFrame(enemyAnimKey, nowSec);
      if (customEnemyFrame) {
        const centerX = en.x + en.width / 2;
        const centerY = en.y + en.height / 2;
        ctx.translate(centerX, centerY);
        if (en.facing === -1) {
          ctx.scale(-1, 1);
        }
        if (en.invulnerableTimer > 0) {
          ctx.filter = 'brightness(1.8) drop-shadow(0 0 8px #ef4444)';
        }
        const drawW = en.width * 1.35;
        const drawH = en.height * 1.35;
        ctx.drawImage(customEnemyFrame, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();
        continue;
      }

      if (en.invulnerableTimer > 0) {
        ctx.fillStyle = '#ef4444';
      }

      if (en.type === 'crawler') {
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.ellipse(en.x + en.width / 2, en.y + en.height / 2, en.width / 2, en.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#f87171';
        const eyeX = en.facing === 1 ? en.x + en.width - 8 : en.x + 8;
        ctx.beginPath();
        ctx.arc(eyeX, en.y + 10, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (en.type === 'specter') {
        ctx.fillStyle = 'rgba(114, 231, 254, 0.7)';
        ctx.beginPath();
        ctx.arc(en.x + en.width / 2, en.y + 16, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(en.x + 8, en.y + 16, 24, 28);

        const wingFlap = Math.sin(Date.now() * 0.01) * 8;
        ctx.fillStyle = 'rgba(114, 231, 254, 0.4)';
        ctx.beginPath();
        ctx.ellipse(en.x - 6, en.y + 14, 12, 18 + wingFlap, 0.3, 0, Math.PI * 2);
        ctx.ellipse(en.x + en.width + 6, en.y + 14, 12, 18 + wingFlap, -0.3, 0, Math.PI * 2);
        ctx.fill();
      } else if (en.type === 'varron_sentinel') {
        ctx.fillStyle = '#78350f';
        ctx.fillRect(en.x + 10, en.y + 16, en.width - 20, en.height - 16);

        ctx.fillStyle = '#d97706';
        const shieldX = en.facing === 1 ? en.x + en.width - 16 : en.x;
        ctx.fillRect(shieldX, en.y + 8, 16, en.height - 8);

        ctx.fillStyle = '#f97316';
        ctx.fillRect(en.x + en.width / 2 - 4, en.y + 8, 8, 3);
      } else if (en.type === 'boss_guardian') {
        this.renderGuardianBoss(ctx, en);
      } else if (en.type === 'boss_varron_colossus') {
        this.renderVarronBoss(ctx, en);
      } else if (en.type === 'boss_shade') {
        this.renderShadeBoss(ctx, en);
      }

      ctx.restore();
    }
  }

  private renderVarronBoss(ctx: CanvasRenderingContext2D, boss: ActiveEnemy) {
    const centerX = boss.x + boss.width / 2;
    // Massive bronze plated colossus
    ctx.fillStyle = '#451a03';
    ctx.fillRect(boss.x + 12, boss.y + 40, boss.width - 24, boss.height - 40);

    // Copper armor plates
    ctx.fillStyle = '#b45309';
    ctx.fillRect(boss.x + 8, boss.y + 30, boss.width - 16, 50);

    // Glowing molten furnace core
    const pulse = Math.sin(Date.now() * 0.008) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(249, 115, 22, ${pulse})`;
    ctx.beginPath();
    ctx.arc(centerX, boss.y + 60, 22, 0, Math.PI * 2);
    ctx.fill();

    // Heavy steam chimney shoulders
    ctx.fillStyle = '#78350f';
    ctx.fillRect(boss.x, boss.y + 15, 20, 30);
    ctx.fillRect(boss.x + boss.width - 20, boss.y + 15, 20, 30);

    // Steam vents
    ctx.fillStyle = 'rgba(255, 237, 213, 0.4)';
    const steamY = Math.sin(Date.now() * 0.015) * 8;
    ctx.beginPath();
    ctx.arc(boss.x + 10, boss.y - 5 + steamY, 12, 0, Math.PI * 2);
    ctx.arc(boss.x + boss.width - 10, boss.y - 5 + steamY, 12, 0, Math.PI * 2);
    ctx.fill();

    // Molten hammer
    const hammerX = boss.facing === 1 ? boss.x + boss.width + 12 : boss.x - 24;
    ctx.fillStyle = '#292524';
    ctx.fillRect(hammerX + 8, boss.y - 20, 10, boss.height);
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(hammerX - 10, boss.y - 35, 46, 30);
  }

  private renderShadeBoss(ctx: CanvasRenderingContext2D, boss: ActiveEnemy) {
    const centerX = boss.x + boss.width / 2;
    const time = Date.now() * 0.004;

    // Dark void mist aura
    ctx.fillStyle = 'rgba(88, 28, 135, 0.35)';
    ctx.beginPath();
    ctx.arc(centerX, boss.y + boss.height / 2, 65 + Math.sin(time * 3) * 8, 0, Math.PI * 2);
    ctx.fill();

    // Somber shadow body
    ctx.fillStyle = '#090514';
    ctx.beginPath();
    ctx.ellipse(centerX, boss.y + 55, boss.width / 2, boss.height / 2 - 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Purple ethereal horn mantle
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(centerX - 24, boss.y + 25);
    ctx.quadraticCurveTo(centerX - 45, boss.y - 25, centerX - 15, boss.y - 35);
    ctx.moveTo(centerX + 24, boss.y + 25);
    ctx.quadraticCurveTo(centerX + 45, boss.y - 25, centerX + 15, boss.y - 35);
    ctx.stroke();

    // Twin piercing void eyes
    ctx.fillStyle = boss.phase === 2 ? '#f43f5e' : '#c084fc';
    const eyeOffset = boss.facing === 1 ? 6 : -6;
    ctx.beginPath();
    ctx.ellipse(centerX - 10 + eyeOffset, boss.y + 35, 5, 8, 0.2, 0, Math.PI * 2);
    ctx.ellipse(centerX + 10 + eyeOffset, boss.y + 35, 5, 8, -0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderGuardianBoss(ctx: CanvasRenderingContext2D, boss: ActiveEnemy) {
    const centerX = boss.x + boss.width / 2;

    ctx.fillStyle = '#1c1917';
    ctx.fillRect(boss.x + 15, boss.y + 35, boss.width - 30, boss.height - 35);

    ctx.fillStyle = '#292524';
    ctx.fillRect(boss.x + 10, boss.y + 30, boss.width - 20, 45);

    ctx.fillStyle = '#44403c';
    ctx.beginPath();
    ctx.arc(centerX, boss.y + 20, 24, Math.PI, 0);
    ctx.lineTo(centerX + 24, boss.y + 36);
    ctx.lineTo(centerX - 24, boss.y + 36);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = boss.phase === 2 ? '#72E7FE' : '#f59e0b';
    ctx.fillRect(centerX - 10, boss.y + 22, 20, 5);

    if (boss.phase === 2) {
      ctx.fillStyle = 'rgba(114, 231, 254, 0.45)';
      ctx.beginPath();
      ctx.arc(centerX, boss.y + 55, 20, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = '#78716c';
    ctx.lineWidth = 6;
    const staffX = boss.facing === 1 ? boss.x + boss.width + 10 : boss.x - 10;
    ctx.beginPath();
    ctx.moveTo(staffX, boss.y - 30);
    ctx.lineTo(staffX, boss.y + boss.height);
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(staffX - 18, boss.y - 45, 36, 18);
    ctx.fillRect(staffX - 18, boss.y - 65, 8, 22);
    ctx.fillRect(staffX + 10, boss.y - 65, 8, 22);
  }

  private renderProjectiles(ctx: CanvasRenderingContext2D, projectiles: Projectile[]) {
    for (const p of projectiles) {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private updateAndRenderParticles(ctx: CanvasRenderingContext2D, dt: number, room: GameRoom) {
    if (this.particles.length < 50 && Math.random() < 0.4) {
      const region = REGIONS[room.regionId] || REGIONS.lumen_village;
      const x = this.cameraX + Math.random() * 1200;
      const y = this.cameraY + Math.random() * 800;
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 20,
        vy: region.bgParticles === 'bubbles' ? -35 : 25 + Math.random() * 20,
        size: 2 + Math.random() * 2,
        color: region.primaryColor,
        alpha: 0.5,
        decay: 0.25,
        shape: 'circle',
      });
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha -= p.decay * dt;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;

      if (p.shape === 'spark') {
        ctx.fillRect(p.x - 1, p.y - 1, p.size, p.size);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  /**
   * High-Visibility Cavern Lighting with Luminous Player Lantern
   * Creates an expansive clear light field around Nox so platforms and paths are easily seen!
   */
  private renderLighting(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    player: PlayerState,
    room: GameRoom,
    enemies: ActiveEnemy[]
  ) {
    if (!this.lightCanvas || !this.lightCtx) return;

    if (this.lightCanvas.width !== width || this.lightCanvas.height !== height) {
      this.lightCanvas.width = width;
      this.lightCanvas.height = height;
    }

    const lCtx = this.lightCtx;

    // Atmospheric darkness (softened from 0.94 so paths and platforms are never pitch black)
    const baseDarkness = room.regionId === 'ner_abyss' ? 0.65 : 0.45;
    lCtx.globalCompositeOperation = 'source-over';
    lCtx.fillStyle = `rgba(6, 9, 16, ${baseDarkness})`;
    lCtx.fillRect(0, 0, width, height);

    // Punch expansive illumination holes with 'destination-out'
    lCtx.globalCompositeOperation = 'destination-out';

    // 1. Nox's Luminous Lantern Field (Expansive radius: 320px to 480px)
    const pScreenX = player.x + player.width / 2 - this.cameraX;
    const pScreenY = player.y + player.height / 2 - this.cameraY;

    let lightRadius = 340 + player.maskCracks * 35;
    if (player.lanternBrightness === 'bright') lightRadius += 80;
    if (player.lanternBrightness === 'max') lightRadius += 160;

    // Multi-tier radial gradient for crystal-clear path visibility
    const pGrad = lCtx.createRadialGradient(pScreenX, pScreenY, 20, pScreenX, pScreenY, lightRadius);
    pGrad.addColorStop(0, 'rgba(0, 0, 0, 1)'); // completely transparent/clear in center
    pGrad.addColorStop(0.55, 'rgba(0, 0, 0, 0.95)'); // clear throughout movement path
    pGrad.addColorStop(0.85, 'rgba(0, 0, 0, 0.55)'); // gentle transition
    pGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    lCtx.fillStyle = pGrad;
    lCtx.beginPath();
    lCtx.arc(pScreenX, pScreenY, lightRadius, 0, Math.PI * 2);
    lCtx.fill();

    // 2. Totems Light
    for (const totem of room.totems) {
      const tX = totem.x + 15 - this.cameraX;
      const tY = totem.y - 6 - this.cameraY;
      const tGrad = lCtx.createRadialGradient(tX, tY, 5, tX, tY, 160);
      tGrad.addColorStop(0, 'rgba(0, 0, 0, 1)');
      tGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      lCtx.fillStyle = tGrad;
      lCtx.beginPath();
      lCtx.arc(tX, tY, 160, 0, Math.PI * 2);
      lCtx.fill();
    }

    // 3. Boss Arena Light
    for (const en of enemies) {
      if (en.isBoss) {
        const bX = en.x + en.width / 2 - this.cameraX;
        const bY = en.y + en.height / 2 - this.cameraY;
        const bGrad = lCtx.createRadialGradient(bX, bY, 20, bX, bY, 260);
        bGrad.addColorStop(0, 'rgba(0, 0, 0, 1)');
        bGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        lCtx.fillStyle = bGrad;
        lCtx.beginPath();
        lCtx.arc(bX, bY, 260, 0, Math.PI * 2);
        lCtx.fill();
      }
    }

    // Draw darkness mask onto main canvas in screen coordinates
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(this.lightCanvas, 0, 0);

    // Warm luminous lantern aura overlay on Nox
    const auraGrad = ctx.createRadialGradient(pScreenX, pScreenY, 5, pScreenX, pScreenY, 140);
    auraGrad.addColorStop(0, 'rgba(114, 231, 254, 0.18)');
    auraGrad.addColorStop(0.6, 'rgba(114, 231, 254, 0.05)');
    auraGrad.addColorStop(1, 'rgba(114, 231, 254, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(pScreenX, pScreenY, 140, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

export const gameRenderer = new GameRenderer();
