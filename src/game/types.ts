/**
 * Echoward: Reino das Cinzas - Core Types
 */

export type RegionId =
  | 'lumen_village'
  | 'echo_forest'
  | 'varron_mines'
  | 'submerged_city'
  | 'dead_gardens'
  | 'broken_cathedral'
  | 'tower_of_voices'
  | 'ash_fields'
  | 'drowned_palace'
  | 'ner_abyss'
  | 'ancient_nursery'
  | 'echoward_core';

export interface RegionInfo {
  id: RegionId;
  name: string;
  subtitle: string;
  description: string;
  primaryColor: string;
  ambientColors: [string, string, string];
  fogColor: string;
  bgParticles: 'ash' | 'spores' | 'steam' | 'bubbles' | 'petals' | 'resonance' | 'void';
}

export type MaskCrackStage = 0 | 1 | 2 | 3;

export interface PlayerAbilities {
  dash: boolean;            // Passo Fantasma
  doubleJump: boolean;      // Salto de Ressonância
  wallClimb: boolean;       // Garra de Cinza
  groundPound: boolean;     // Mergulho Abissal
  rewind: boolean;          // Eco Reverso
  memoryVision: boolean;    // Visão de Memória
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  facing: 'left' | 'right';
  isGrounded: boolean;
  isWallSliding: boolean;
  wallDirection: -1 | 1 | 0;
  isDashing: boolean;
  dashTimer: number;
  dashCooldown: number;
  dashDirection: -1 | 1;
  isAttacking: boolean;
  attackTimer: number;
  attackDirection: 'side' | 'up' | 'down';
  attackCooldown: number;
  isGroundPounding: boolean;
  isHealing: boolean;
  healHoldTimer: number;
  isMemoryVisionActive: boolean;
  invulnerableTimer: number;
  
  // Stats
  hp: number;
  maxHp: number;
  pulse: number;           // 0 to 100
  maxPulse: number;
  
  // Progression
  maskCracks: MaskCrackStage;
  abilities: PlayerAbilities;
  shardsCount: number;
  geoOrbs: number;         // Eco-fragmentos
  
  // Animation & Life States
  landingTimer: number;
  jumpImpulseTimer?: number;
  isDying: boolean;
  deathTimer: number;
  currentAnimation: string;
  lanternBrightness: 'normal' | 'bright' | 'max';

  // Interaction, Dialogue & Door Passage States
  isEnteringDoor?: boolean;
  doorTransitionTimer?: number;
  isInteracting?: boolean;
  interactionTimer?: number;
  isTalking?: boolean;

  // Rewind capability
  trailHistory: Array<{ x: number; y: number; time: number }>;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Platform extends Rect {
  type: 'solid' | 'fragile' | 'resonance_barrier' | 'spike' | 'bouncy_mushroom' | 'wall_climbable' | 'water';
  color?: string;
  hp?: number; // for fragile floors
}

export interface LoreTablet {
  id: string;
  x: number;
  y: number;
  title: string;
  text: string;
  author: string;
}

export interface RestingTotem {
  id: string;
  x: number;
  y: number;
  name: string;
  activated: boolean;
}

export interface NPC {
  id: string;
  name: string;
  title: string;
  x: number;
  y: number;
  dialogue: string[];
  interacted: boolean;
  portraitIcon: string;
}

export interface Collectible {
  id: string;
  x: number;
  y: number;
  type: 'ability' | 'shard' | 'mask_fragment' | 'pulse_vessel';
  abilityName?: keyof PlayerAbilities;
  label: string;
  collected: boolean;
}

export interface RoomTransition {
  side: 'left' | 'right' | 'top' | 'bottom';
  rect: Rect;
  targetRoomId: string;
  targetSpawn: { x: number; y: number };
}

export interface GameRoom {
  id: string;
  regionId: RegionId;
  name: string;
  width: number;
  height: number;
  platforms: Platform[];
  spawns: { default: { x: number; y: number }; [key: string]: { x: number; y: number } };
  transitions: RoomTransition[];
  enemies: EnemySpawn[];
  tablets: LoreTablet[];
  totems: RestingTotem[];
  npcs: NPC[];
  collectibles: Collectible[];
  isBossRoom?: boolean;
  bossId?: string;
}

export type EnemyType =
  | 'crawler'            // Skittering ash beetle
  | 'specter'            // Floating resonance moth
  | 'varron_sentinel'    // Armored copper guard
  | 'abyss_diver'        // Lurking shadow bat
  | 'boss_guardian'      // O Guardião do Silêncio
  | 'boss_shade';        // A Sombra de Ner

export interface EnemySpawn {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  patrolDist?: number;
}

export interface ActiveEnemy {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  facing: -1 | 1;
  attackTimer: number;
  attackCooldown: number;
  state: 'idle' | 'patrol' | 'chase' | 'attack' | 'hurt' | 'special';
  originX: number;
  patrolDist: number;
  invulnerableTimer: number;
  phase?: number;
  name: string;
  isBoss?: boolean;
}

export interface AttackSlash {
  x: number;
  y: number;
  width: number;
  height: number;
  direction: 'side' | 'up' | 'down';
  facing: -1 | 1;
  damage: number;
  lifetime: number;
  maxLifetime: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  damage: number;
  fromPlayer: boolean;
  lifetime: number;
  piercing?: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  shape?: 'circle' | 'line' | 'square' | 'spark';
  rotation?: number;
  vRot?: number;
}

export interface RemotePlayer {
  id: string;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 'left' | 'right';
  hp: number;
  maxHp: number;
  isAttacking: boolean;
  attackDirection: 'side' | 'up' | 'down';
  isDashing: boolean;
  isDowned: boolean;
  colorIndex: number;
  currentRoomId: string;
  maskCracks: MaskCrackStage;
  lastEmote?: { text: string; timer: number };
}
