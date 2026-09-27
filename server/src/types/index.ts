import { WebSocket } from 'ws';
import {
  CharacterArchetype,
  RemoteAnimationStyle,
  NetworkPlayerState,
  RoomChatMessage,
  WorldStateSync,
  RoomSessionSnapshot,
} from '../../../shared/types';

export interface RoomPlayerSession {
  ws: WebSocket;
  id: string; // unique network ID (e.g. uuid)
  name: string;
  character: CharacterArchetype;
  colorIndex: number;
  isHost: boolean;
  isReady: boolean;
  status: 'lobby' | 'ready' | 'exploring' | 'downed';
  ping: number;
  slotIndex: number; // 0..3
  currentRoomId: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 'left' | 'right';
  hp: number;
  maxHp: number;
  maskCracks: number;
  isAttacking: boolean;
  attackDirection: string;
  isDashing: boolean;
  isDowned: boolean;
  currentAnimation: string;
  animationStyle: RemoteAnimationStyle;
  lastSeen: number;
  messageCount: number;
  lastRateReset: number;
}

export interface GameRoomState {
  roomId: string;
  hostId: string;
  createdAt: number;
  lastActivity: number;
  status: 'lobby' | 'playing';
  maxPlayers: number;
  players: Map<WebSocket, RoomPlayerSession>;
  worldState: WorldStateSync;
  chatLog: RoomChatMessage[];
}
