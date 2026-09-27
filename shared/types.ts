/**
 * Echoward: Reino das Cinzas - Shared Network Types
 * Authoritative types shared between frontend client and multiplayer server
 */

export type CharacterArchetype = 'Nox' | 'Veyra' | 'Orin' | 'Kael';

export type RemoteAnimationStyle =
  | 'padrao'
  | 'espectral'
  | 'shinobi'
  | 'chibi'
  | 'glitch'
  | 'fogo'
  | 'dancante';

export interface NetworkPlayerState {
  playerId: string;
  characterId: CharacterArchetype;
  displayName: string;
  colorIndex: number;
  slotIndex: number; // 0..3 for 4-player co-op
  roomId: string;
  currentRoomId: string; // Logical game room e.g. 'room_lumen_haven'

  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  facing: 'left' | 'right';

  health: number;
  maxHealth: number;
  grounded: boolean;

  state:
    | 'idle'
    | 'walking'
    | 'running'
    | 'jumping'
    | 'falling'
    | 'attacking'
    | 'dash'
    | 'hurt'
    | 'dead'
    | 'downed';

  isAttacking: boolean;
  attackDirection: string;
  isDashing: boolean;
  isDowned: boolean;
  currentAnimation: string;
  animationStyle: RemoteAnimationStyle;
  maskCracks: number;

  ping: number;
  isHost: boolean;
  isReady: boolean;
  lastSeen: number;
}

export interface NetworkEnemyState {
  enemyId: string;
  type: string;
  roomId: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  health: number;
  maxHealth: number;
  state: 'idle' | 'patrol' | 'chase' | 'attack' | 'dead';
  targetPlayerId?: string;
  isBoss: boolean;
  phase?: number;
  alive: boolean;
}

export interface WorldStateSync {
  bossHp: Record<string, number>;
  defeatedBosses: string[];
  openedDoors: string[];
  activatedTotems: string[];
  collectedLoot: string[];
}

export interface RoomChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  colorIndex: number;
  text: string;
  type: 'chat' | 'emote' | 'system';
  timestamp: number;
}

export interface RoomSessionSnapshot {
  roomId: string;
  hostId: string;
  playersCount: number;
  maxPlayers: number;
  status: 'lobby' | 'playing';
  players: NetworkPlayerState[];
  isFull: boolean;
  worldState?: WorldStateSync;
  createdAt: number;
}
