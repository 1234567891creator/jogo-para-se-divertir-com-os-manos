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
  public myClientId: string = 'wanderer_' + Math.random().toString(36).substring(2, 9);
  public currentRoomId: string = 'LUMEN';
  public currentName: string = 'Nox';
  public currentColorIndex: number = 0;
  public remotePlayers: Map<string, RemotePlayer> = new Map();
  private listeners: Set<MultiplayerEventCallback> = new Set();
  private syncTimer: number | null = null;
  private isConnecting: boolean = false;
  private reconnectTimeout: number | null = null;
  private lastHttpSyncTime: number = 0;

  constructor() {
    try {
      const savedName = localStorage.getItem('echoward_player_name');
      if (savedName) this.currentName = savedName;
      const savedColor = localStorage.getItem('echoward_color_index');
      if (savedColor) this.currentColorIndex = parseInt(savedColor, 10) || 0;
      const savedId = sessionStorage.getItem('echoward_client_id');
      if (savedId) {
        this.myClientId = savedId;
      } else {
        sessionStorage.setItem('echoward_client_id', this.myClientId);
      }
    } catch {}

    // Clean up stale players automatically (idle > 2.5s)
    if (typeof window !== 'undefined') {
      window.setInterval(() => {
        const now = Date.now();
        for (const [id, p] of this.remotePlayers.entries()) {
          if (p.lastSeen && now - p.lastSeen > 2500) {
            this.remotePlayers.delete(id);
          }
        }
      }, 500);
    }
  }

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
    const raw = (preferredCode || '').trim().toUpperCase();
    try {
      const res = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferredCode: raw || undefined, name: this.currentName }),
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

    const fallbackCode = (raw || 'SALA' + Math.floor(10 + Math.random() * 89)).toUpperCase();
    this.connect(fallbackCode, this.currentName, this.currentColorIndex);
    return { success: true, roomId: fallbackCode };
  }

  public async joinRoom(code: string, name?: string, colorIndex?: number): Promise<{ success: boolean; roomId: string; error?: string }> {
    const cleanCode = (code || 'LUMEN').trim().toUpperCase();
    if (name) this.currentName = name;
    if (typeof colorIndex === 'number') this.currentColorIndex = colorIndex;

    try {
      localStorage.setItem('echoward_player_name', this.currentName);
      localStorage.setItem('echoward_color_index', String(this.currentColorIndex));
    } catch {}

    try {
      const res = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: cleanCode }),
      });
      if (res.ok) {
        const data = await res.json();
        this.connect(data.roomId || cleanCode, this.currentName, this.currentColorIndex);
        return { success: true, roomId: data.roomId || cleanCode };
      }
    } catch (e) {
      console.warn('Join room check warning:', e);
    }

    // Always succeed locally and join!
    this.connect(cleanCode, this.currentName, this.currentColorIndex);
    return { success: true, roomId: cleanCode };
  }

  public setName(name: string) {
    this.currentName = name;
    try {
      localStorage.setItem('echoward_player_name', name);
    } catch {}
  }

  public setColorIndex(index: number) {
    this.currentColorIndex = index;
    try {
      localStorage.setItem('echoward_color_index', String(index));
    } catch {}
  }

  public connect(roomId: string, playerName: string = 'Nox', colorIndex: number = 0) {
    const targetRoom = (roomId || 'LUMEN').trim().toUpperCase();
    this.currentRoomId = targetRoom;
    this.currentName = playerName;
    this.currentColorIndex = colorIndex;

    if (this.reconnectTimeout) {
      window.clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

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
          this.emit('disconnected', {});
          // Auto-reconnect after 3 seconds if disconnected
          this.reconnectTimeout = window.setTimeout(() => {
            if (!this.isConnected) {
              this.connect(this.currentRoomId, this.currentName, this.currentColorIndex);
            }
          }, 3000);
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
    if (this.reconnectTimeout) {
      window.clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
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
    const payload = {
      x: Math.round(player.x),
      y: Math.round(player.y),
      vx: Math.round(player.vx),
      vy: Math.round(player.vy),
      facing: player.facing,
      hp: player.hp,
      maxHp: player.maxHp,
      maskCracks: player.maskCracks,
      currentRoomId,
      currentAnimation: player.currentAnimation,
      isAttacking: player.isAttacking,
      attackDirection: player.attackDirection,
      isDashing: player.isDashing,
      isDowned: player.hp <= 0,
    };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'sync',
          ...payload,
        })
      );
    }

    // Dual-layer HTTP sync only as fallback when WebSocket is NOT open
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      const now = Date.now();
      if (now - this.lastHttpSyncTime > 1500) {
        this.lastHttpSyncTime = now;
        fetch('/api/rooms/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: this.currentRoomId,
            playerId: this.myClientId,
            name: this.currentName,
            colorIndex: this.currentColorIndex,
            state: payload,
          }),
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data && Array.isArray(data.players)) {
              const returnedIds = new Set<string>();
              for (const p of data.players) {
                if (p.id && p.id !== this.myClientId && p.currentRoomId) {
                  returnedIds.add(p.id);
                  const existing = this.remotePlayers.get(p.id);
                  if (existing) {
                    existing.x = p.x ?? existing.x;
                    existing.y = p.y ?? existing.y;
                    existing.vx = p.vx ?? existing.vx;
                    existing.vy = p.vy ?? existing.vy;
                    existing.facing = p.facing ?? existing.facing;
                    existing.hp = p.hp ?? existing.hp;
                    existing.maxHp = p.maxHp ?? existing.maxHp;
                    existing.currentRoomId = p.currentRoomId;
                    existing.currentAnimation = p.currentAnimation ?? existing.currentAnimation;
                    existing.isAttacking = p.isAttacking ?? existing.isAttacking;
                    existing.isDashing = p.isDashing ?? existing.isDashing;
                    existing.isDowned = p.isDowned ?? existing.isDowned;
                    existing.colorIndex = p.colorIndex ?? existing.colorIndex;
                    existing.name = p.name ?? existing.name;
                    existing.lastSeen = Date.now();
                  } else {
                    this.remotePlayers.set(p.id, {
                      id: p.id,
                      name: p.name || 'Andarilho',
                      x: p.x ?? 200,
                      y: p.y ?? 520,
                      vx: p.vx ?? 0,
                      vy: p.vy ?? 0,
                      facing: p.facing ?? 'right',
                      hp: p.hp ?? 5,
                      maxHp: p.maxHp ?? 5,
                      maskCracks: p.maskCracks ?? 0,
                      currentRoomId: p.currentRoomId,
                      currentAnimation: p.currentAnimation ?? 'idle',
                      isAttacking: Boolean(p.isAttacking),
                      attackDirection: p.attackDirection ?? 'side',
                      isDashing: Boolean(p.isDashing),
                      isDowned: Boolean(p.isDowned),
                      colorIndex: p.colorIndex ?? 1,
                      lastSeen: Date.now(),
                    });
                  }
                }
              }
              // Prune remote players no longer returned by the server
              for (const id of Array.from(this.remotePlayers.keys())) {
                if (!returnedIds.has(id)) {
                  this.remotePlayers.delete(id);
                }
              }
            }
          })
          .catch(() => {});
      }
    }
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

      // Seed existing players in this room ONLY if they have valid currentRoomId and state!
      if (Array.isArray(msg.existingPlayers)) {
        for (const ep of msg.existingPlayers) {
          if (ep.id !== this.myClientId && ep.lastState && ep.lastState.currentRoomId) {
            const ls = ep.lastState;
            this.remotePlayers.set(ep.id, {
              id: ep.id,
              name: ep.name || 'Andarilho',
              x: ls.x ?? 200,
              y: ls.y ?? 520,
              vx: ls.vx ?? 0,
              vy: ls.vy ?? 0,
              facing: ls.facing ?? 'right',
              hp: ls.hp ?? 5,
              maxHp: ls.maxHp ?? 5,
              isAttacking: Boolean(ls.isAttacking),
              attackDirection: ls.attackDirection ?? 'side',
              isDashing: Boolean(ls.isDashing),
              isDowned: Boolean(ls.isDowned),
              colorIndex: ep.colorIndex ?? 1,
              currentRoomId: ls.currentRoomId,
              currentAnimation: ls.currentAnimation ?? 'idle',
              maskCracks: ls.maskCracks ?? 0,
              lastSeen: Date.now(),
            });
          }
        }
      }

      this.emit('room_joined', msg);
    } else if (msg.type === 'player_joined') {
      // Do NOT spawn a ghost Nox in room_lumen_haven!
      // Wait for their first 'sync' packet which contains their actual room and coordinates.
      this.emit('player_joined', msg);
    } else if (msg.type === 'player_leave') {
      this.remotePlayers.delete(msg.id);
      this.emit('player_left', msg);
    } else if (msg.type === 'sync') {
      if (!msg.fromId || msg.fromId === this.myClientId) return;
      if (!msg.currentRoomId) return;

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
        existing.currentAnimation = msg.currentAnimation;
        existing.isAttacking = msg.isAttacking;
        existing.attackDirection = msg.attackDirection;
        existing.isDashing = msg.isDashing;
        existing.isDowned = msg.isDowned;
        existing.lastSeen = Date.now();
        if (msg.name) existing.name = msg.name;
        if (typeof msg.colorIndex === 'number') existing.colorIndex = msg.colorIndex;
      } else {
        this.remotePlayers.set(msg.fromId, {
          id: msg.fromId,
          name: msg.name || 'Andarilho',
          x: msg.x,
          y: msg.y,
          vx: msg.vx,
          vy: msg.vy,
          facing: msg.facing,
          hp: msg.hp,
          maxHp: msg.maxHp,
          maskCracks: msg.maskCracks,
          currentRoomId: msg.currentRoomId,
          currentAnimation: msg.currentAnimation || 'idle',
          isAttacking: msg.isAttacking,
          attackDirection: msg.attackDirection,
          isDashing: msg.isDashing,
          isDowned: msg.isDowned,
          colorIndex: msg.colorIndex ?? 1,
          lastSeen: Date.now(),
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
