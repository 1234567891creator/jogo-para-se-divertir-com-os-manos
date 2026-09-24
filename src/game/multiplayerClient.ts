/**
 * Echoward: Reino das Cinzas - Real-time Multiplayer Client
 */

import { RemotePlayer, PlayerState } from './types';

export type MultiplayerEventCallback = (event: string, data: any) => void;

export interface ActiveRoomInfo {
  roomId: string;
  playersCount: number;
  isFull: boolean;
}

export class MultiplayerClient {
  private ws: WebSocket | null = null;
  public isConnected: boolean = false;
  public myClientId: string | null = null;
  public currentRoomId: string = 'LUMEN';
  public currentName: string = 'Nox';
  public currentColorIndex: number = 0;
  public remotePlayers: Map<string, RemotePlayer> = new Map();
  private listeners: Set<MultiplayerEventCallback> = new Set();
  private syncTimer: number | null = null;
  private isConnecting: boolean = false;

  public async fetchActiveRooms(): Promise<ActiveRoomInfo[]> {
    try {
      const res = await fetch('/api/rooms');
      if (res.ok) {
        const data = await res.json();
        return data.rooms || [];
      }
    } catch (e) {
      console.warn('Failed to fetch rooms from server:', e);
    }
    return [
      { roomId: 'LUMEN', playersCount: 1, isFull: false },
      { roomId: 'CINZAS', playersCount: 0, isFull: false },
      { roomId: 'NER', playersCount: 0, isFull: false },
    ];
  }

  public async createRoom(preferredCode?: string): Promise<{ success: boolean; roomId: string; error?: string }> {
    try {
      const res = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferredCode, name: this.currentName }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.roomId) {
          this.connect(data.roomId, this.currentName, this.currentColorIndex);
          return { success: true, roomId: data.roomId };
        }
      }
    } catch (e) {
      console.warn('Create room HTTP call error, falling back to local WS connect:', e);
    }

    const fallbackCode = (preferredCode || 'SALA' + Math.floor(10 + Math.random() * 89)).toUpperCase();
    this.connect(fallbackCode, this.currentName, this.currentColorIndex);
    return { success: true, roomId: fallbackCode };
  }

  public async joinRoom(code: string, name?: string, colorIndex?: number): Promise<{ success: boolean; roomId: string; error?: string }> {
    const cleanCode = (code || 'LUMEN').trim().toUpperCase();
    if (name) this.currentName = name;
    if (typeof colorIndex === 'number') this.currentColorIndex = colorIndex;

    try {
      const res = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: cleanCode }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { success: false, roomId: cleanCode, error: err.error || 'Não foi possível entrar na sala.' };
      }
    } catch (e) {
      console.warn('Join room check warning:', e);
    }

    this.connect(cleanCode, this.currentName, this.currentColorIndex);
    return { success: true, roomId: cleanCode };
  }

  public setName(name: string) {
    this.currentName = name;
  }

  public setColorIndex(index: number) {
    this.currentColorIndex = index;
  }

  public connect(roomId: string, playerName: string = 'Nox', colorIndex: number = 0) {
    const targetRoom = (roomId || 'LUMEN').trim().toUpperCase();
    this.currentRoomId = targetRoom;
    this.currentName = playerName;
    this.currentColorIndex = colorIndex;

    // If socket is already open, simply send a join message for the target room
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.isConnected = true;
      this.isConnecting = false;
      this.ws.send(
        JSON.stringify({
          type: 'join',
          roomId: targetRoom,
          name: this.currentName,
          colorIndex: this.currentColorIndex,
        })
      );
      this.emit('connected', { roomId: targetRoom });
      return;
    }

    // If currently connecting, let onopen send the join message with updated room
    if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
      return;
    }

    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {}
      this.ws = null;
    }

    this.isConnecting = true;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      const socket = new WebSocket(wsUrl);
      this.ws = socket;

      socket.onopen = () => {
        if (this.ws !== socket) return;
        this.isConnected = true;
        this.isConnecting = false;

        socket.send(
          JSON.stringify({
            type: 'join',
            roomId: this.currentRoomId,
            name: this.currentName,
            colorIndex: this.currentColorIndex,
          })
        );
        this.emit('connected', { roomId: this.currentRoomId });
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleServerMessage(msg);
        } catch (e) {
          console.error('Multiplayer msg error:', e);
        }
      };

      socket.onclose = () => {
        if (this.ws === socket) {
          this.isConnected = false;
          this.isConnecting = false;
          this.remotePlayers.clear();
          this.emit('disconnected', {});
        }
      };

      socket.onerror = (err) => {
        console.warn('WebSocket connection note:', err);
      };
    } catch (e) {
      console.warn('Failed to start WebSocket, solo mode active:', e);
      this.isConnecting = false;
    }
  }

  public disconnect() {
    if (this.syncTimer) {
      window.clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {}
      this.ws = null;
    }
    this.isConnected = false;
    this.isConnecting = false;
    this.remotePlayers.clear();
    this.emit('disconnected', {});
  }

  public on(cb: MultiplayerEventCallback) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private emit(event: string, data: any) {
    this.listeners.forEach((cb) => cb(event, data));
  }

  public sendPlayerSync(player: PlayerState, currentRoomId: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    this.ws.send(
      JSON.stringify({
        type: 'sync',
        x: Math.round(player.x),
        y: Math.round(player.y),
        vx: Math.round(player.vx),
        vy: Math.round(player.vy),
        facing: player.facing,
        hp: player.hp,
        maxHp: player.maxHp,
        maskCracks: player.maskCracks,
        currentRoomId,
        isAttacking: player.isAttacking,
        attackDirection: player.attackDirection,
        isDashing: player.isDashing,
        isDowned: player.hp <= 0,
      })
    );
  }

  public sendEmote(text: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(
      JSON.stringify({
        type: 'emote',
        text,
      })
    );
  }

  public sendBossDamage(bossId: string, damage: number, currentHp: number) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(
      JSON.stringify({
        type: 'boss_sync',
        bossId,
        damage,
        currentHp,
      })
    );
  }

  public sendRevive(targetPlayerId: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(
      JSON.stringify({
        type: 'action',
        action: 'revive',
        targetId: targetPlayerId,
      })
    );
  }

  private handleServerMessage(msg: any) {
    if (msg.type === 'joined_room') {
      this.myClientId = msg.id;
      this.currentRoomId = msg.roomId;
      this.remotePlayers.clear();

      // Seed existing players in this room!
      if (Array.isArray(msg.existingPlayers)) {
        for (const ep of msg.existingPlayers) {
          if (ep.id !== this.myClientId) {
            this.remotePlayers.set(ep.id, {
              id: ep.id,
              name: ep.name,
              x: 200,
              y: 500,
              vx: 0,
              vy: 0,
              facing: 'right',
              hp: 5,
              maxHp: 5,
              isAttacking: false,
              attackDirection: 'side',
              isDashing: false,
              isDowned: false,
              colorIndex: ep.colorIndex ?? 1,
              currentRoomId: 'room_lumen_haven',
              maskCracks: 0,
            });
          }
        }
      }

      this.emit('room_joined', msg);
    } else if (msg.type === 'player_joined') {
      this.remotePlayers.set(msg.id, {
        id: msg.id,
        name: msg.name,
        x: 200,
        y: 500,
        vx: 0,
        vy: 0,
        facing: 'right',
        hp: 5,
        maxHp: 5,
        isAttacking: false,
        attackDirection: 'side',
        isDashing: false,
        isDowned: false,
        colorIndex: msg.colorIndex ?? 1,
        currentRoomId: 'room_lumen_haven',
        maskCracks: 0,
      });
      this.emit('player_joined', msg);
    } else if (msg.type === 'player_leave') {
      this.remotePlayers.delete(msg.id);
      this.emit('player_left', msg);
    } else if (msg.type === 'sync') {
      const existing = this.remotePlayers.get(msg.fromId);
      if (existing) {
        existing.x = msg.x;
        existing.y = msg.y;
        existing.vx = msg.vx;
        existing.vy = msg.vy;
        existing.facing = msg.facing;
        existing.hp = msg.hp;
        existing.maxHp = msg.maxHp;
        existing.maskCracks = msg.maskCracks;
        existing.currentRoomId = msg.currentRoomId;
        existing.isAttacking = msg.isAttacking;
        existing.attackDirection = msg.attackDirection;
        existing.isDashing = msg.isDashing;
        existing.isDowned = msg.isDowned;
      } else {
        this.remotePlayers.set(msg.fromId, {
          id: msg.fromId,
          name: msg.name || 'Wanderer',
          x: msg.x,
          y: msg.y,
          vx: msg.vx,
          vy: msg.vy,
          facing: msg.facing,
          hp: msg.hp,
          maxHp: msg.maxHp,
          maskCracks: msg.maskCracks,
          currentRoomId: msg.currentRoomId,
          isAttacking: msg.isAttacking,
          attackDirection: msg.attackDirection,
          isDashing: msg.isDashing,
          isDowned: msg.isDowned,
          colorIndex: msg.colorIndex ?? 1,
        });
      }
    } else if (msg.type === 'emote') {
      const p = this.remotePlayers.get(msg.fromId);
      if (p) {
        p.lastEmote = { text: msg.text, timer: 4.0 };
      }
    } else if (msg.type === 'boss_sync') {
      this.emit('boss_synced', msg);
    } else if (msg.type === 'action' && msg.action === 'revive') {
      this.emit('revived', msg);
    }
  }

  public getRemotePlayersArray(): RemotePlayer[] {
    return Array.from(this.remotePlayers.values());
  }
}

export const multiplayerClient = new MultiplayerClient();
