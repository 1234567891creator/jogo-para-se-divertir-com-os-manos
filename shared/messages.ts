/**
 * Echoward: Reino das Cinzas - WebSocket Messages Protocol
 */

import {
  CharacterArchetype,
  RemoteAnimationStyle,
  NetworkPlayerState,
  RoomSessionSnapshot,
  RoomChatMessage,
  WorldStateSync,
} from './types';

// =================== CLIENT -> SERVER MESSAGES ===================

export interface ClientJoinRoomMessage {
  type: 'join';
  roomId: string;
  name: string;
  character: CharacterArchetype;
  colorIndex?: number;
  protocolVersion?: string;
}

export interface ClientSyncMessage {
  type: 'sync';
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 'left' | 'right';
  currentRoomId: string;
  hp: number;
  maxHp: number;
  isAttacking: boolean;
  attackDirection: string;
  isDashing: boolean;
  isDowned: boolean;
  currentAnimation: string;
  animationStyle?: RemoteAnimationStyle;
  maskCracks: number;
  timestamp?: number;
  sequenceNumber?: number;
}

export interface ClientAttackMessage {
  type: 'attack';
  direction: string;
  x?: number;
  y?: number;
  timestamp: number;
}

export interface ClientBossDamageMessage {
  type: 'boss_damage';
  bossId: string;
  damage: number;
  clientHealthReport?: number;
}

export interface ClientReviveMessage {
  type: 'revive';
  targetPlayerId: string;
}

export interface ClientChatMessage {
  type: 'chat';
  text: string;
}

export interface ClientEmoteMessage {
  type: 'emote';
  text: string;
}

export interface ClientSetReadyMessage {
  type: 'set_ready';
  isReady: boolean;
}

export interface ClientStartGameMessage {
  type: 'start_game';
}

export interface ClientChangeAnimationStyleMessage {
  type: 'change_other_players_anim_style';
  style: RemoteAnimationStyle;
  targetPlayerId?: string;
}

export interface ClientPingMessage {
  type: 'ping';
  timestamp: number;
}

export interface ClientLeaveRoomMessage {
  type: 'leave';
}

export type ClientMessage =
  | ClientJoinRoomMessage
  | ClientSyncMessage
  | ClientAttackMessage
  | ClientBossDamageMessage
  | ClientReviveMessage
  | ClientChatMessage
  | ClientEmoteMessage
  | ClientSetReadyMessage
  | ClientStartGameMessage
  | ClientChangeAnimationStyleMessage
  | ClientPingMessage
  | ClientLeaveRoomMessage;

// =================== SERVER -> CLIENT MESSAGES ===================

export interface ServerRoomJoinedMessage {
  type: 'room_joined';
  playerId: string;
  roomId: string;
  slotIndex: number;
  isHost: boolean;
  room: RoomSessionSnapshot;
}

export interface ServerRoomStateMessage {
  type: 'room_state';
  room: RoomSessionSnapshot;
}

export interface ServerPlayerJoinedMessage {
  type: 'player_joined';
  player: NetworkPlayerState;
}

export interface ServerPlayerLeftMessage {
  type: 'player_left';
  id: string;
  name: string;
  newHostId?: string;
}

export interface ServerPlayerSyncMessage {
  type: 'player_sync';
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 'left' | 'right';
  currentRoomId: string;
  hp: number;
  maxHp: number;
  isAttacking: boolean;
  attackDirection: string;
  isDashing: boolean;
  isDowned: boolean;
  currentAnimation: string;
  animationStyle: RemoteAnimationStyle;
  maskCracks: number;
  timestamp: number;
}

export interface ServerPlayerDamagedMessage {
  type: 'player_damaged';
  playerId: string;
  hp: number;
  maxHp: number;
  isDowned: boolean;
  damageSource?: string;
}

export interface ServerPlayerDiedMessage {
  type: 'player_died';
  playerId: string;
  name: string;
}

export interface ServerPlayerRevivedMessage {
  type: 'player_revived';
  targetPlayerId: string;
  revivedByName: string;
}

export interface ServerBossSyncMessage {
  type: 'boss_sync';
  bossId: string;
  hp: number;
  maxHp: number;
  isDefeated: boolean;
  damagedByName?: string;
}

export interface ServerWorldStateMessage {
  type: 'world_state';
  worldState: WorldStateSync;
}

export interface ServerChatMessage {
  type: 'chat_message';
  message: RoomChatMessage;
}

export interface ServerEmoteMessage {
  type: 'emote';
  id: string;
  text: string;
}

export interface ServerGameStartedMessage {
  type: 'game_started';
}

export interface ServerErrorMessage {
  type: 'error';
  error: string;
  code?: string;
}

export interface ServerPongMessage {
  type: 'pong';
  originalTimestamp: number;
  serverTimestamp: number;
}

export type ServerMessage =
  | ServerRoomJoinedMessage
  | ServerRoomStateMessage
  | ServerPlayerJoinedMessage
  | ServerPlayerLeftMessage
  | ServerPlayerSyncMessage
  | ServerPlayerDamagedMessage
  | ServerPlayerDiedMessage
  | ServerPlayerRevivedMessage
  | ServerBossSyncMessage
  | ServerWorldStateMessage
  | ServerChatMessage
  | ServerEmoteMessage
  | ServerGameStartedMessage
  | ServerErrorMessage
  | ServerPongMessage;
