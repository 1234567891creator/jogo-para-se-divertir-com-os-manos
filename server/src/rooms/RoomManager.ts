/**
 * Echoward Server - Room Manager
 * Manages player rooms, persistent public sanctuaries, 4-player co-op limits,
 * slot allocations, and room snapshots.
 */

import { WebSocket } from 'ws';
import { GameRoomState, RoomPlayerSession } from '../types';
import { WorldStateManager } from '../world/WorldStateManager';
import {
  MAX_PLAYERS_PER_ROOM,
  MAX_PUBLIC_ROOM_PLAYERS,
  PUBLIC_SANCTUARY_ROOMS,
  DEFAULT_MAIN_SERVER_ROOM,
} from '../../../shared/constants';
import { RoomSessionSnapshot, NetworkPlayerState } from '../../../shared/types';
import { generateRoomCode } from '../../../shared/protocols';

export class RoomManager {
  private rooms: Map<string, GameRoomState> = new Map();
  private socketToRoom: Map<WebSocket, string> = new Map();

  constructor() {
    this.initPublicSanctuaries();
  }

  private initPublicSanctuaries(): void {
    for (const code of PUBLIC_SANCTUARY_ROOMS) {
      this.rooms.set(code, {
        roomId: code,
        hostId: '',
        createdAt: Date.now(),
        lastActivity: Date.now(),
        status: 'lobby',
        maxPlayers: MAX_PUBLIC_ROOM_PLAYERS,
        players: new Map(),
        worldState: WorldStateManager.createDefaultWorld(),
        chatLog: [],
      });
    }
  }

  public getRoom(roomId: string): GameRoomState | undefined {
    return this.rooms.get(roomId.toUpperCase());
  }

  public getRoomBySocket(ws: WebSocket): GameRoomState | undefined {
    const roomId = this.socketToRoom.get(ws);
    return roomId ? this.rooms.get(roomId) : undefined;
  }

  public setSocketRoom(ws: WebSocket, roomId: string): void {
    this.socketToRoom.set(ws, roomId.toUpperCase());
  }

  public removeSocketRoom(ws: WebSocket): void {
    this.socketToRoom.delete(ws);
  }

  public createRoom(preferredCode?: string): GameRoomState {
    let cleanCode = (preferredCode || '').trim().toUpperCase();

    if (!cleanCode || cleanCode.length < 3) {
      cleanCode = generateRoomCode();
    }

    cleanCode = cleanCode.substring(0, 10).replace(/[^A-Z0-9_-]/g, '');

    if (!this.rooms.has(cleanCode)) {
      const isPublic = (PUBLIC_SANCTUARY_ROOMS as readonly string[]).includes(cleanCode);
      this.rooms.set(cleanCode, {
        roomId: cleanCode,
        hostId: '',
        createdAt: Date.now(),
        lastActivity: Date.now(),
        status: 'lobby',
        maxPlayers: isPublic ? MAX_PUBLIC_ROOM_PLAYERS : MAX_PLAYERS_PER_ROOM,
        players: new Map(),
        worldState: WorldStateManager.createDefaultWorld(),
        chatLog: [],
      });
    }

    return this.rooms.get(cleanCode)!;
  }

  public allocateSlot(room: GameRoomState): number {
    const usedSlots = new Set<number>();
    for (const session of room.players.values()) {
      usedSlots.add(session.slotIndex);
    }
    for (let i = 0; i < room.maxPlayers; i++) {
      if (!usedSlots.has(i)) return i;
    }
    return 0;
  }

  public getRoomSnapshot(room: GameRoomState): RoomSessionSnapshot {
    const playersList: NetworkPlayerState[] = [];

    for (const session of room.players.values()) {
      playersList.push({
        playerId: session.id,
        characterId: session.character,
        displayName: session.name,
        colorIndex: session.colorIndex,
        slotIndex: session.slotIndex,
        roomId: room.roomId,
        currentRoomId: session.currentRoomId,
        x: session.x,
        y: session.y,
        velocityX: session.vx,
        velocityY: session.vy,
        facing: session.facing,
        health: session.hp,
        maxHealth: session.maxHp,
        grounded: !session.isDowned,
        state: session.isDowned ? 'downed' : (session.currentAnimation as any) || 'idle',
        isAttacking: session.isAttacking,
        attackDirection: session.attackDirection,
        isDashing: session.isDashing,
        isDowned: session.isDowned,
        currentAnimation: session.currentAnimation,
        animationStyle: session.animationStyle,
        maskCracks: session.maskCracks,
        ping: session.ping,
        isHost: session.isHost,
        isReady: session.isReady,
        lastSeen: session.lastSeen,
      });
    }

    playersList.sort((a, b) => a.slotIndex - b.slotIndex);

    return {
      roomId: room.roomId,
      hostId: room.hostId,
      playersCount: room.players.size,
      maxPlayers: room.maxPlayers,
      status: room.status,
      players: playersList,
      isFull: room.players.size >= room.maxPlayers,
      worldState: room.worldState,
      createdAt: room.createdAt,
    };
  }

  public getAllRoomsList(): RoomSessionSnapshot[] {
    return Array.from(this.rooms.values()).map((r) => this.getRoomSnapshot(r));
  }

  public broadcast(room: GameRoomState, message: any, excludeWs?: WebSocket): void {
    const payload = JSON.stringify(message);
    for (const clientWs of room.players.keys()) {
      if (clientWs !== excludeWs && clientWs.readyState === WebSocket.OPEN) {
        try {
          clientWs.send(payload);
        } catch (err) {
          console.error('[RoomManager] broadcast error:', err);
        }
      }
    }
  }

  public removePlayer(ws: WebSocket): { room?: GameRoomState; session?: RoomPlayerSession } {
    const roomId = this.socketToRoom.get(ws);
    if (!roomId) return {};

    const room = this.rooms.get(roomId);
    if (!room) return {};

    const session = room.players.get(ws);
    room.players.delete(ws);
    this.socketToRoom.delete(ws);

    if (session) {
      // Reassign host if host left
      if (session.isHost && room.players.size > 0) {
        const nextSession = room.players.values().next().value;
        if (nextSession) {
          nextSession.isHost = true;
          room.hostId = nextSession.id;
        }
      }
    }

    // If room is empty and not a permanent sanctuary, prune it after 5 minutes
    const isPublic = (PUBLIC_SANCTUARY_ROOMS as readonly string[]).includes(room.roomId);
    if (room.players.size === 0 && !isPublic) {
      this.rooms.delete(room.roomId);
    }

    return { room, session };
  }
}

export const roomManager = new RoomManager();
