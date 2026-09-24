/**
 * Echoward: Reino das Cinzas - Enemy AI & Boss Logic
 */

import { ActiveEnemy, EnemyType, PlayerState, Projectile, AttackSlash, Rect } from './types';
import { checkAABB } from './physics';
import { soundEngine } from './audio';

export class EnemyManager {
  public projectiles: Projectile[] = [];

  public clearProjectiles() {
    this.projectiles = [];
  }

  public createEnemy(
    id: string,
    type: EnemyType,
    x: number,
    y: number,
    patrolDist: number = 150
  ): ActiveEnemy {
    switch (type) {
      case 'crawler':
        return {
          id,
          type,
          x,
          y,
          vx: 50,
          vy: 0,
          width: 44,
          height: 32,
          hp: 35,
          maxHp: 35,
          facing: 1,
          attackTimer: 0,
          attackCooldown: 1.5,
          state: 'patrol',
          originX: x,
          patrolDist,
          invulnerableTimer: 0,
          name: 'Crawler de Cinzas',
        };

      case 'specter':
        return {
          id,
          type,
          x,
          y,
          vx: 0,
          vy: 0,
          width: 40,
          height: 48,
          hp: 28,
          maxHp: 28,
          facing: 1,
          attackTimer: 1.0,
          attackCooldown: 2.2,
          state: 'patrol',
          originX: x,
          patrolDist,
          invulnerableTimer: 0,
          name: 'Espectro do Eco',
        };

      case 'varron_sentinel':
        return {
          id,
          type,
          x,
          y,
          vx: 40,
          vy: 0,
          width: 52,
          height: 68,
          hp: 75,
          maxHp: 75,
          facing: 1,
          attackTimer: 0,
          attackCooldown: 2.0,
          state: 'patrol',
          originX: x,
          patrolDist,
          invulnerableTimer: 0,
          name: 'Sentinela de Varron',
        };

      case 'abyss_diver':
        return {
          id,
          type,
          x,
          y,
          vx: 0,
          vy: 0,
          width: 46,
          height: 40,
          hp: 45,
          maxHp: 45,
          facing: 1,
          attackTimer: 0,
          attackCooldown: 1.8,
          state: 'idle',
          originX: x,
          patrolDist,
          invulnerableTimer: 0,
          name: 'Devorador Abissal',
        };

      case 'boss_guardian':
        return {
          id,
          type,
          x,
          y,
          vx: 0,
          vy: 0,
          width: 100,
          height: 140,
          hp: 380,
          maxHp: 380,
          facing: -1,
          attackTimer: 1.5,
          attackCooldown: 2.4,
          state: 'idle',
          originX: x,
          patrolDist,
          invulnerableTimer: 0,
          phase: 1,
          isBoss: true,
          name: 'O Guardião do Silêncio',
        };

      case 'boss_varron_colossus':
        return {
          id,
          type,
          x,
          y,
          vx: 0,
          vy: 0,
          width: 120,
          height: 150,
          hp: 450,
          maxHp: 450,
          facing: -1,
          attackTimer: 2.0,
          attackCooldown: 2.5,
          state: 'idle',
          originX: x,
          patrolDist,
          invulnerableTimer: 0,
          phase: 1,
          isBoss: true,
          name: 'Colosso Forjado de Varron',
        };

      case 'boss_shade':
        return {
          id,
          type,
          x,
          y,
          vx: 0,
          vy: 0,
          width: 90,
          height: 130,
          hp: 550,
          maxHp: 550,
          facing: -1,
          attackTimer: 1.2,
          attackCooldown: 2.0,
          state: 'idle',
          originX: x,
          patrolDist,
          invulnerableTimer: 0,
          phase: 1,
          isBoss: true,
          name: 'A Sombra de Ner · Arauto do Vazio',
        };

      default:
        return {
          id,
          type: 'crawler',
          x,
          y,
          vx: 40,
          vy: 0,
          width: 40,
          height: 30,
          hp: 30,
          maxHp: 30,
          facing: 1,
          attackTimer: 0,
          attackCooldown: 2.0,
          state: 'patrol',
          originX: x,
          patrolDist,
          invulnerableTimer: 0,
          name: 'Criatura de Cinzas',
        };
    }
  }

  public update(
    enemies: ActiveEnemy[],
    player: PlayerState,
    dt: number,
    onEnemyDefeated?: (enemy: ActiveEnemy) => void,
    onPogoBounce?: () => void
  ) {
    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.lifetime -= dt;

      // Projectile vs Player collision
      if (!p.fromPlayer && player.invulnerableTimer <= 0) {
        const pRect: Rect = { x: p.x - p.radius, y: p.y - p.radius, width: p.radius * 2, height: p.radius * 2 };
        const playerRect: Rect = { x: player.x, y: player.y, width: player.width, height: player.height };
        if (checkAABB(pRect, playerRect)) {
          player.hp = Math.max(0, player.hp - 1);
          player.invulnerableTimer = 1.0;
          soundEngine.playDamage();
          this.projectiles.splice(i, 1);
          continue;
        }
      }

      if (p.lifetime <= 0) {
        this.projectiles.splice(i, 1);
      }
    }

    // Update each enemy
    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i];

      if (enemy.invulnerableTimer > 0) {
        enemy.invulnerableTimer -= dt;
      }

      const distToPlayer = Math.hypot(player.x - enemy.x, player.y - enemy.y);
      enemy.facing = player.x < enemy.x ? -1 : 1;

      switch (enemy.type) {
        case 'crawler':
          // Patrol back and forth on ground
          enemy.x += enemy.vx * dt;
          if (Math.abs(enemy.x - enemy.originX) > enemy.patrolDist) {
            enemy.vx = -enemy.vx;
          }
          break;

        case 'specter':
          // Sinusoidal floating and firing resonance motes with a disciplined cooldown
          enemy.attackTimer -= dt;
          enemy.y += Math.sin(Date.now() * 0.003) * 30 * dt;

          if (distToPlayer < 420) {
            enemy.x += (player.x < enemy.x ? -30 : 30) * dt;
            if (enemy.attackTimer <= 0) {
              // Reset timer to full 2.6s cooldown
              enemy.attackTimer = enemy.attackCooldown > 0 ? enemy.attackCooldown : 2.6;

              // Only fire if project limit not saturated
              if (this.projectiles.length < 16) {
                const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
                this.projectiles.push({
                  id: 'orb_' + Math.random(),
                  x: enemy.x + enemy.width / 2,
                  y: enemy.y + enemy.height / 2,
                  vx: Math.cos(angle) * 175,
                  vy: Math.sin(angle) * 175,
                  radius: 7,
                  color: '#38bdf8',
                  damage: 1,
                  fromPlayer: false,
                  lifetime: 3.5,
                });
                soundEngine.playSpellCast();
              }
            }
          } else {
            // Keep at least 0.9s buffer when player is outside detection range
            if (enemy.attackTimer < 0.9) {
              enemy.attackTimer = 0.9;
            }
          }
          break;

        case 'varron_sentinel':
          // Slow walk, charges when close
          enemy.attackTimer -= dt;
          if (distToPlayer < 240 && enemy.attackTimer <= 0) {
            // Lunge attack
            enemy.vx = enemy.facing * 180;
            enemy.attackTimer = enemy.attackCooldown > 0 ? enemy.attackCooldown : 2.5;
            soundEngine.playSlash('side');
          } else {
            enemy.x += enemy.facing * 35 * dt;
          }
          break;

        case 'abyss_diver':
          if (distToPlayer < 300) {
            // Dive towards player
            const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
            enemy.x += Math.cos(angle) * 220 * dt;
            enemy.y += Math.sin(angle) * 220 * dt;
          } else {
            // Return to origin
            enemy.y += (enemy.originX - enemy.y) * 0.5 * dt;
          }
          break;

        case 'boss_guardian':
          this.updateGuardianBoss(enemy, player, dt);
          break;

        case 'boss_varron_colossus':
          this.updateVarronBoss(enemy, player, dt);
          break;

        case 'boss_shade':
          this.updateShadeBoss(enemy, player, dt);
          break;
      }

      // Check contact damage with player
      const enemyRect: Rect = { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height };
      const playerRect: Rect = { x: player.x, y: player.y, width: player.width, height: player.height };

      if (checkAABB(enemyRect, playerRect) && player.invulnerableTimer <= 0 && !player.isDashing) {
        player.hp = Math.max(0, player.hp - 1);
        player.invulnerableTimer = 1.0;
        player.vx = enemy.facing * 250;
        player.vy = -200;
        soundEngine.playDamage();
      }

      // Death check
      if (enemy.hp <= 0) {
        // Drop Pulse and Geo
        player.pulse = Math.min(player.maxPulse, player.pulse + 25);
        player.geoOrbs += enemy.isBoss ? 200 : 15;
        if (onEnemyDefeated) {
          onEnemyDefeated(enemy);
        }
        enemies.splice(i, 1);
      }
    }
  }

  private updateGuardianBoss(boss: ActiveEnemy, player: PlayerState, dt: number) {
    // Check phase transition
    if (boss.hp <= boss.maxHp * 0.5 && boss.phase === 1) {
      boss.phase = 2;
      boss.attackCooldown = 1.5;
      soundEngine.playGroundPound();
    }

    boss.attackTimer -= dt;

    const dist = Math.abs(player.x - boss.x);

    if (boss.attackTimer <= 0) {
      boss.attackTimer = boss.phase === 2 ? 1.8 : 2.5;

      const attackChoice = Math.random();

      if (attackChoice < 0.45) {
        // Halberd Ground Slam with Shockwaves
        boss.state = 'attack';
        soundEngine.playGroundPound();

        // Spawn left and right shockwaves
        [-240, 240].forEach((vx) => {
          this.projectiles.push({
            id: 'shock_' + Math.random(),
            x: boss.x + boss.width / 2,
            y: boss.y + boss.height - 20,
            vx,
            vy: 0,
            radius: 12,
            color: '#f59e0b',
            damage: 1,
            fromPlayer: false,
            lifetime: 2.0,
          });
        });
      } else if (attackChoice < 0.8) {
        // Leap towards player
        boss.vx = boss.facing * (boss.phase === 2 ? 300 : 200);
        boss.vy = -350;
        soundEngine.playSlash('up');
      } else if (boss.phase === 2) {
        // Phase 2: Concentric Sound Rings
        for (let i = 0; i < 6; i++) {
          const ang = (i * Math.PI * 2) / 6;
          this.projectiles.push({
            id: 'ring_' + Math.random(),
            x: boss.x + boss.width / 2,
            y: boss.y + 40,
            vx: Math.cos(ang) * 160,
            vy: Math.sin(ang) * 160,
            radius: 9,
            color: '#38bdf8',
            damage: 1,
            fromPlayer: false,
            lifetime: 3.0,
          });
        }
        soundEngine.playSpellCast();
      }
    }

    // Boss physics: gravity & position
    boss.x += boss.vx * dt;
    boss.y += boss.vy * dt;
    boss.vy = Math.min(700, boss.vy + 800 * dt);

    // Stop at ground level (y ≈ 660)
    if (boss.y > 660) {
      boss.y = 660;
      boss.vy = 0;
      boss.vx *= 0.85;
    }
  }

  // BOSS 2: Colosso Forjado de Varron
  private updateVarronBoss(boss: ActiveEnemy, player: PlayerState, dt: number) {
    if (boss.hp <= boss.maxHp * 0.45 && boss.phase === 1) {
      boss.phase = 2;
      boss.attackCooldown = 1.6;
      soundEngine.playGroundPound();
    }

    boss.facing = player.x < boss.x ? -1 : 1;
    boss.attackTimer -= dt;

    if (boss.attackTimer <= 0) {
      boss.attackTimer = boss.phase === 2 ? 1.6 : 2.4;
      const roll = Math.random();

      if (roll < 0.4) {
        // Copper Steam Eruption (3 fiery arcing balls)
        boss.state = 'attack';
        soundEngine.playSpellCast();
        [-180, 0, 180].forEach((vx) => {
          this.projectiles.push({
            id: 'steam_' + Math.random(),
            x: boss.x + boss.width / 2,
            y: boss.y + 20,
            vx,
            vy: -260,
            radius: 14,
            color: '#ea580c',
            damage: 1,
            fromPlayer: false,
            lifetime: 2.5,
          });
        });
      } else if (roll < 0.75) {
        // Charging Steam Ram
        boss.vx = boss.facing * (boss.phase === 2 ? 340 : 250);
        boss.vy = -180;
        soundEngine.playDash();
      } else {
        // Molten Hammer Seismic Quake
        soundEngine.playGroundPound();
        [-280, 280].forEach((vx) => {
          this.projectiles.push({
            id: 'magma_' + Math.random(),
            x: boss.x + boss.width / 2,
            y: boss.y + boss.height - 20,
            vx,
            vy: 0,
            radius: 15,
            color: '#f97316',
            damage: 1,
            fromPlayer: false,
            lifetime: 2.2,
          });
        });
      }
    }

    boss.x += boss.vx * dt;
    boss.y += boss.vy * dt;
    boss.vy = Math.min(800, boss.vy + 900 * dt);

    if (boss.y > 650) {
      boss.y = 650;
      boss.vy = 0;
      boss.vx *= 0.8;
    }
  }

  // BOSS 3: A Sombra de Ner · Arauto do Vazio
  private updateShadeBoss(boss: ActiveEnemy, player: PlayerState, dt: number) {
    if (boss.hp <= boss.maxHp * 0.5 && boss.phase === 1) {
      boss.phase = 2;
      boss.attackCooldown = 1.3;
      soundEngine.playNpcVoice();
    }

    boss.facing = player.x < boss.x ? -1 : 1;
    boss.attackTimer -= dt;

    if (boss.attackTimer <= 0) {
      boss.attackTimer = boss.phase === 2 ? 1.4 : 2.1;
      const roll = Math.random();

      if (roll < 0.35) {
        // Shadow Teleport behind player!
        const offset = player.facing === 'right' ? -130 : 130;
        boss.x = Math.max(100, Math.min(1600, player.x + offset));
        boss.y = player.y - 40;
        boss.vx = 0;
        boss.vy = 0;
        soundEngine.playDash();

        // Release shadow burst
        for (let i = 0; i < 4; i++) {
          const ang = (i * Math.PI) / 2;
          this.projectiles.push({
            id: 'void_' + Math.random(),
            x: boss.x + boss.width / 2,
            y: boss.y + boss.height / 2,
            vx: Math.cos(ang) * 190,
            vy: Math.sin(ang) * 190,
            radius: 10,
            color: '#a855f7',
            damage: 1,
            fromPlayer: false,
            lifetime: 2.5,
          });
        }
      } else if (roll < 0.7) {
        // Homing Void Darts
        soundEngine.playSpellCast();
        const count = boss.phase === 2 ? 5 : 3;
        for (let i = 0; i < count; i++) {
          const ang = Math.atan2(player.y - boss.y, player.x - boss.x) + (i - 1) * 0.35;
          this.projectiles.push({
            id: 'dart_' + Math.random(),
            x: boss.x + boss.width / 2,
            y: boss.y + 40,
            vx: Math.cos(ang) * 220,
            vy: Math.sin(ang) * 220,
            radius: 9,
            color: '#c084fc',
            damage: 1,
            fromPlayer: false,
            lifetime: 3.2,
          });
        }
      } else {
        // Void Dive Slam
        boss.vx = (player.x - boss.x) * 1.5;
        boss.vy = -380;
        soundEngine.playGroundPound();
      }
    }

    boss.x += boss.vx * dt;
    boss.y += boss.vy * dt;
    boss.vy = Math.min(750, boss.vy + 700 * dt);

    if (boss.y > 660) {
      boss.y = 660;
      boss.vy = 0;
      boss.vx *= 0.85;
    }
  }

  // Handle player slash against all enemies
  public checkPlayerSlash(
    slash: AttackSlash,
    enemies: ActiveEnemy[],
    player: PlayerState,
    onPogoBounce: () => void
  ): boolean {
    let hitAny = false;
    const slashRect: Rect = { x: slash.x, y: slash.y, width: slash.width, height: slash.height };

    for (const enemy of enemies) {
      if (enemy.invulnerableTimer > 0) continue;

      const enemyRect: Rect = { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height };

      if (checkAABB(slashRect, enemyRect)) {
        hitAny = true;
        enemy.hp -= slash.damage;
        enemy.invulnerableTimer = 0.18;
        soundEngine.playHit();

        // Gain Pulse on hit
        player.pulse = Math.min(player.maxPulse, player.pulse + 16);

        // Knockback on enemy
        enemy.vx = slash.facing * 140;

        // Downward pogo bounce!
        if (slash.direction === 'down') {
          onPogoBounce();
        }
      }
    }

    return hitAny;
  }
}

export const enemyManager = new EnemyManager();
