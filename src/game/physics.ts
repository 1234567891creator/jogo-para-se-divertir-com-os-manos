/**
 * Echoward: Reino das Cinzas - Physics & Movement Engine
 * Ultra-responsive metroidvania physics: Dash, Double Jump, Wall Slide/Jump, Ground Pound & Attacks
 */

import { PlayerState, Platform, AttackSlash, Rect } from './types';
import { soundEngine } from './audio';
import { spriteStore } from './spriteStore';

export const GRAVITY = 1100;
export const MAX_FALL_SPEED = 750;
export const MOVE_SPEED = 280;
export const ACCELERATION = 2100;
export const DECELERATION = 2600;
export const JUMP_FORCE = -490;
export const DOUBLE_JUMP_FORCE = -450;
export const POGO_FORCE = -540;
export const DASH_SPEED = 680;
export const DASH_DURATION = 0.22;
export const DASH_COOLDOWN = 0.38;
export const WALL_SLIDE_SPEED = 100;
export const GROUND_POUND_SPEED = 920;

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jump: boolean;
  jumpPressed: boolean;
  attackPressed: boolean;
  dashPressed: boolean;
  healHold: boolean;
  spellPressed: boolean;
  rewindPressed: boolean;
  visionPressed: boolean;
}

export function checkAABB(r1: Rect, r2: Rect): boolean {
  return (
    r1.x < r2.x + r2.width &&
    r1.x + r1.width > r2.x &&
    r1.y < r2.y + r2.height &&
    r1.y + r1.height > r2.y
  );
}

export class PhysicsEngine {
  public coyoteTimer: number = 0;
  public jumpBufferTimer: number = 0;
  public canDoubleJump: boolean = true;
  public wallSlideGraceTimer: number = 0;
  public lastWallDirection: -1 | 1 = 1;
  public activeSlash: AttackSlash | null = null;
  public screenShake: number = 0;

  public update(
    player: PlayerState,
    input: InputState,
    platforms: Platform[],
    dt: number,
    onBreakFragileFloor?: (p: Platform) => void,
    onRespawn?: () => void
  ) {
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 25);
    }

    // Death sequence
    if (player.isDying) {
      player.deathTimer = (player.deathTimer || 0) + dt;
      player.vx = 0;
      player.vy = Math.min(player.vy + GRAVITY * dt, 400);
      player.currentAnimation = 'morrer';

      if (player.deathTimer >= 1.3) {
        player.isDying = false;
        player.deathTimer = 0;
        player.hp = player.maxHp;
        player.pulse = player.maxPulse;
        player.invulnerableTimer = 1.5;
        if (onRespawn) {
          onRespawn();
        }
      }
      this.handleCollisions(player, platforms, dt, onBreakFragileFloor);
      return;
    }

    if (player.hp <= 0 && !player.isDying) {
      player.isDying = true;
      player.deathTimer = 0;
      player.currentAnimation = 'morrer';
      player.vx = 0;
      this.screenShake = 15;
      soundEngine.playDamage();
      return;
    }

    // Decrement landing timer
    if (player.landingTimer > 0) {
      player.landingTimer -= dt;
    }

    // Decrement jump impulse timer (squat/takeoff sprite)
    if (player.jumpImpulseTimer && player.jumpImpulseTimer > 0) {
      player.jumpImpulseTimer -= dt;
    }

    if (player.doorTransitionTimer && player.doorTransitionTimer > 0) {
      player.doorTransitionTimer -= dt;
      if (player.doorTransitionTimer <= 0) {
        player.isEnteringDoor = false;
      }
    }

    if (player.interactionTimer && player.interactionTimer > 0) {
      player.interactionTimer -= dt;
      if (player.interactionTimer <= 0) {
        player.isInteracting = false;
      }
    }

    // Rewind trail
    player.trailHistory.push({ x: player.x, y: player.y, time: Date.now() });
    if (player.trailHistory.length > 180) {
      player.trailHistory.shift();
    }

    // Timers
    if (player.dashCooldown > 0) player.dashCooldown -= dt;
    if (player.invulnerableTimer > 0) player.invulnerableTimer -= dt;
    if (player.attackCooldown > 0) player.attackCooldown -= dt;
    if (this.jumpBufferTimer > 0) this.jumpBufferTimer -= dt;
    if (this.wallSlideGraceTimer > 0) this.wallSlideGraceTimer -= dt;

    if (input.jumpPressed) {
      this.jumpBufferTimer = 0.16;
    }

    // Memory Vision
    if (input.visionPressed && player.abilities.memoryVision) {
      player.isMemoryVisionActive = !player.isMemoryVisionActive;
      soundEngine.playDash();
    }

    // Rewind
    if (input.rewindPressed && player.abilities.rewind && player.trailHistory.length > 30) {
      const targetPoint = player.trailHistory[0];
      player.x = targetPoint.x;
      player.y = targetPoint.y;
      player.vx = 0;
      player.vy = 0;
      player.trailHistory = [];
      this.screenShake = 12;
      soundEngine.playTotemRest();
    }

    // Healing focus
    if (
      input.healHold &&
      player.isGrounded &&
      !player.isAttacking &&
      !player.isDashing &&
      player.pulse >= 33 &&
      player.hp < player.maxHp
    ) {
      player.isHealing = true;
      player.healHoldTimer += dt;
      if (player.healHoldTimer % 0.2 < dt) {
        soundEngine.playHealFocus();
      }
      if (player.healHoldTimer >= 0.7) {
        player.hp = Math.min(player.maxHp, player.hp + 1);
        player.pulse = Math.max(0, player.pulse - 33);
        player.healHoldTimer = 0;
        soundEngine.playHealComplete();
        this.screenShake = 5;
      }
      player.vx = 0;
    } else {
      player.isHealing = false;
      player.healHoldTimer = 0;
    }

    // 1. MERGULHO ABISSAL (Ground Pound)
    // Trigger on [Down + Spell (X)] OR [Down + Attack in air]
    const triggersMergulho =
      player.abilities.groundPound &&
      input.down &&
      (input.spellPressed || (input.attackPressed && !player.isGrounded));

    if (triggersMergulho && !player.isGrounded && !player.isGroundPounding) {
      player.isGroundPounding = true;
      player.vy = GROUND_POUND_SPEED;
      player.vx = 0;
      soundEngine.playGroundPound();
    }

    // 2. PASSO FANTASMA (Dash)
    if (
      player.abilities.dash &&
      input.dashPressed &&
      player.dashCooldown <= 0 &&
      !player.isDashing &&
      !player.isHealing
    ) {
      player.isDashing = true;
      player.dashTimer = DASH_DURATION;
      player.dashCooldown = DASH_COOLDOWN;
      player.dashDirection = player.facing === 'left' ? -1 : 1;
      player.vy = 0;
      player.invulnerableTimer = DASH_DURATION + 0.08;
      soundEngine.playDash();
    }

    if (player.isDashing) {
      player.dashTimer -= dt;
      player.vx = player.dashDirection * DASH_SPEED;
      player.vy = 0;
      if (player.dashTimer <= 0) {
        player.isDashing = false;
      }
    } else if (player.isGroundPounding) {
      player.vy = GROUND_POUND_SPEED;
      player.vx = 0;
    } else if (!player.isHealing) {
      // Horizontal movement
      let targetVx = 0;
      if (input.left) {
        targetVx -= MOVE_SPEED;
        player.facing = 'left';
      }
      if (input.right) {
        targetVx += MOVE_SPEED;
        player.facing = 'right';
      }

      const accel = targetVx !== 0 ? ACCELERATION : DECELERATION;
      if (player.vx < targetVx) {
        player.vx = Math.min(targetVx, player.vx + accel * dt);
      } else if (player.vx > targetVx) {
        player.vx = Math.max(targetVx, player.vx - accel * dt);
      }

      // 3. GARRA DE CINZA (Wall Slide)
      const isTouchingWall = player.isWallSliding || this.wallSlideGraceTimer > 0;
      if (isTouchingWall && player.vy > 0 && player.abilities.wallClimb) {
        player.vy = Math.min(player.vy, WALL_SLIDE_SPEED);
      } else {
        // Normal Gravity
        player.vy = Math.min(MAX_FALL_SPEED, player.vy + GRAVITY * dt);
      }

      // Variable jump cut
      if (!input.jump && player.vy < 0) {
        player.vy *= 0.45;
      }

      // Ground timer & Double Jump reset
      if (player.isGrounded) {
        this.coyoteTimer = 0.12;
        this.canDoubleJump = true;
      } else {
        this.coyoteTimer -= dt;
      }

      // JUMP EXECUTION (Ground, Wall Jump, Double Jump)
      if (this.jumpBufferTimer > 0) {
        if (this.coyoteTimer > 0) {
          // Normal Ground Jump (triggers pulo_inicio impulse sprite)
          player.vy = JUMP_FORCE;
          player.isGrounded = false;
          player.jumpImpulseTimer = 0.15;
          this.coyoteTimer = 0;
          this.jumpBufferTimer = 0;
          soundEngine.playJump(false);
        } else if (isTouchingWall && player.abilities.wallClimb) {
          // Wall Jump (Garra) - Kicks cleanly away from wall
          player.vy = JUMP_FORCE * 0.95;
          player.jumpImpulseTimer = 0.15;
          const kickDir = player.wallDirection !== 0 ? -player.wallDirection : -this.lastWallDirection;
          player.vx = kickDir * MOVE_SPEED * 1.3;
          player.facing = kickDir === 1 ? 'right' : 'left';
          this.jumpBufferTimer = 0;
          this.wallSlideGraceTimer = 0;
          this.canDoubleJump = true; // reset double jump on wall kick
          soundEngine.playJump(false);
        } else if (this.canDoubleJump && player.abilities.doubleJump) {
          // 4. SALTO DE RESSONÂNCIA (Double Jump)
          player.vy = DOUBLE_JUMP_FORCE;
          player.jumpImpulseTimer = 0.15;
          this.canDoubleJump = false;
          this.jumpBufferTimer = 0;
          soundEngine.playJump(true);
        }
      }
    } else {
      player.vy = Math.min(MAX_FALL_SPEED, player.vy + GRAVITY * dt);
    }

    // Attacks (Lâmina de Eco)
    if (this.activeSlash) {
      this.activeSlash.lifetime -= dt;
      if (this.activeSlash.lifetime <= 0) {
        this.activeSlash = null;
        player.isAttacking = false;
      }
    }

    if (input.attackPressed && player.attackCooldown <= 0 && !player.isHealing) {
      player.isAttacking = true;
      player.attackCooldown = 0.20;

      let dir: 'side' | 'up' | 'down' = 'side';
      if (input.up) dir = 'up';
      else if (input.down && !player.isGrounded) dir = 'down';

      player.attackDirection = dir;
      soundEngine.playSlash(dir);

      const slashW = dir === 'side' ? 70 : 58;
      const slashH = dir === 'side' ? 50 : 66;
      const slashX =
        dir === 'side'
          ? player.facing === 'right'
            ? player.x + player.width
            : player.x - slashW
          : player.x + player.width / 2 - slashW / 2;
      const slashY =
        dir === 'up'
          ? player.y - slashH
          : dir === 'down'
          ? player.y + player.height
          : player.y + player.height / 2 - slashH / 2;

      this.activeSlash = {
        x: slashX,
        y: slashY,
        width: slashW,
        height: slashH,
        direction: dir,
        facing: player.facing === 'left' ? -1 : 1,
        damage: 22 + player.maskCracks * 6,
        lifetime: 0.14,
        maxLifetime: 0.14,
      };
    }

    // Collisions
    this.handleCollisions(player, platforms, dt, onBreakFragileFloor);

    // Animation state
    player.currentAnimation = this.determineAnimationState(player);
  }

  private determineAnimationState(player: PlayerState): string {
    if (player.isDying) return 'morrer';
    if (player.invulnerableTimer > 0.5) return 'dano';
    if (player.isEnteringDoor || (player.doorTransitionTimer && player.doorTransitionTimer > 0)) {
      return 'entrar_porta';
    }
    if (player.isTalking) {
      return 'falar';
    }
    if (player.isInteracting || (player.interactionTimer && player.interactionTimer > 0)) {
      return 'interagir';
    }
    if (player.isHealing) return 'curar';
    if (player.isGroundPounding) return 'mergulho';
    if (player.isDashing) {
      return player.isGrounded ? 'dash' : 'dash_aereo';
    }
    if (player.isAttacking) {
      if (spriteStore.hasFrames('espada')) return 'espada';
      if (player.attackDirection === 'up') return 'ataque_vertical';
      if (player.attackDirection === 'down') return 'ataque_baixo';
      return 'ataque_horizontal';
    }
    if (player.isWallSliding) return 'escalada';
    if (player.landingTimer > 0) return 'aterrissagem';
    if (!player.isGrounded) {
      if (player.jumpImpulseTimer && player.jumpImpulseTimer > 0) {
        return 'pulo_inicio';
      }
      if (player.vy < 30) {
        return 'pulo_ar';
      }
      return 'queda_ar';
    }
    if (Math.abs(player.vx) > 10) return 'correr';
    return 'idle';
  }

  private handleCollisions(
    player: PlayerState,
    platforms: Platform[],
    dt: number,
    onBreakFragileFloor?: (p: Platform) => void
  ) {
    const wasInAir = !player.isGrounded;
    const prevVy = player.vy;

    player.isGrounded = false;
    player.isWallSliding = false;

    // Move X first
    player.x += player.vx * dt;
    const playerRectX: Rect = {
      x: player.x,
      y: player.y,
      width: player.width,
      height: player.height,
    };

    for (const plat of platforms) {
      if (plat.type === 'resonance_barrier' && player.isDashing) {
        continue;
      }
      if (plat.type === 'spike') {
        continue;
      }

      if (checkAABB(playerRectX, plat)) {
        if (
          plat.type === 'solid' ||
          plat.type === 'fragile' ||
          plat.type === 'wall_climbable' ||
          plat.type === 'resonance_barrier'
        ) {
          if (player.vx > 0) {
            player.x = plat.x - player.width;
            if (plat.type === 'wall_climbable' || player.abilities.wallClimb) {
              player.isWallSliding = true;
              player.wallDirection = 1;
              this.lastWallDirection = 1;
              this.wallSlideGraceTimer = 0.16;
            }
          } else if (player.vx < 0) {
            player.x = plat.x + plat.width;
            if (plat.type === 'wall_climbable' || player.abilities.wallClimb) {
              player.isWallSliding = true;
              player.wallDirection = -1;
              this.lastWallDirection = -1;
              this.wallSlideGraceTimer = 0.16;
            }
          } else {
            // Push-out along smallest overlap
            const overlapLeft = player.x + player.width - plat.x;
            const overlapRight = plat.x + plat.width - player.x;
            if (overlapLeft < overlapRight) {
              player.x = plat.x - player.width;
              if (player.abilities.wallClimb) {
                player.isWallSliding = true;
                player.wallDirection = 1;
                this.lastWallDirection = 1;
                this.wallSlideGraceTimer = 0.16;
              }
            } else {
              player.x = plat.x + plat.width;
              if (player.abilities.wallClimb) {
                player.isWallSliding = true;
                player.wallDirection = -1;
                this.lastWallDirection = -1;
                this.wallSlideGraceTimer = 0.16;
              }
            }
          }
          player.vx = 0;
        }
      }
    }

    // Move Y
    player.y += player.vy * dt;
    const playerRectY: Rect = {
      x: player.x,
      y: player.y,
      width: player.width,
      height: player.height,
    };

    for (const plat of platforms) {
      if (plat.type === 'resonance_barrier' && player.isDashing) {
        continue;
      }
      if (plat.type === 'spike') {
        if (checkAABB(playerRectY, plat) && player.invulnerableTimer <= 0 && !player.isDashing) {
          player.hp = Math.max(0, player.hp - 1);
          player.vy = -380;
          player.invulnerableTimer = 1.0;
          soundEngine.playDamage();
          this.screenShake = 10;
        }
        continue;
      }

      if (checkAABB(playerRectY, plat)) {
        if (plat.type === 'bouncy_mushroom') {
          player.vy = POGO_FORCE;
          this.canDoubleJump = true;
          player.dashCooldown = 0;
          soundEngine.playPogo();
          continue;
        }

        if (
          plat.type === 'solid' ||
          plat.type === 'fragile' ||
          plat.type === 'wall_climbable' ||
          plat.type === 'resonance_barrier'
        ) {
          if (player.vy > 0) {
            player.y = plat.y - player.height;
            player.vy = 0;
            player.isGrounded = true;
            this.canDoubleJump = true; // reset double jump on ground

            if (wasInAir && prevVy > 40) {
              player.landingTimer = 0.18;
            }

            if (player.isGroundPounding) {
              player.isGroundPounding = false;
              this.screenShake = 18;
              soundEngine.playHit();
              if (plat.type === 'fragile' && onBreakFragileFloor) {
                onBreakFragileFloor(plat);
              }
            }
          } else if (player.vy < 0) {
            player.y = plat.y + plat.height;
            player.vy = 0;
          }
        }
      }
    }
  }

  public triggerPogoBounce(player: PlayerState) {
    player.vy = POGO_FORCE;
    this.canDoubleJump = true;
    player.dashCooldown = 0;
    this.screenShake = 8;
    soundEngine.playPogo();
  }
}

export const physicsEngine = new PhysicsEngine();
