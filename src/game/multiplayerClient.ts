/**
 * Echoward: Reino das Cinzas - Real-time Multiplayer Client
 * Authoritative WebSocket client with room lobby synchronization,
 * slot management, and in-game co-op event processing.
 */

import {
  RemotePlayer,
  PlayerState,
  RoomPlayerInfo,
  RoomSessionSnapshot,
  RoomChatMessage,
  CharacterArchetype,
} from './types';

export type MultiplayerEventCallback = (event: string, data: any) => void;

export interface ActiveRoomInfo {
  roomId: string;
  playersCount: number;
  maxPlayers: number;
  status: 'lobby' | 'playing';
  isFull: boolean;
  hostId: string;
  players: RoomPlayerInfo[];
}

export class MultiplayerClient {
  private ws: WebSocket | null = null;
  public isConnected: boolean = false;
  public myClientId: string = 'wanderer_' + Math.random().toString(36).substring(2, 9);
  public currentRoomId: string = 'LUMEN';
  public currentName: string = 'Nox';
  public currentCharacter: CharacterArchetype = 'Nox';
  public currentColorIndex: number = 0;
  public isHost: boolean = false;
  public isReady: boolean = false;
  public slotIndex: number = 0;
  public roomStatus: 'lobby' | 'playing' = 'lobby';

  // Room presence & in-game players
  public roomPlayers: RoomPlayerInfo[] = [];
  public remotePlayers: Map<string, RemotePlayer> = new Map();
  public chatLog: RoomChatMessage[] = [];

  // Network stats
  public ping: number = 0;
  private pingInterval: number | null = null;
  private pingStartTime: number = 0;

  private listeners: Set<MultiplayerEventCallback> = new Set();
  private reconnectTimeout: number | null = null;

  constructor() {
    try {
      const savedName = localStorage.getItem('echoward_player_name');
      if (savedName) this.currentName = savedName;
      const savedChar = localStorage.getItem('echoward_character_archetype') as CharacterArchetype;
      if (savedChar && ['Nox', 'Veyra', 'Orin', 'Kael'].includes(savedChar)) {
        this.currentCharacter = savedChar;
      }
      const savedColor = localStorage.getItem('echoward_color_index');
      if (savedColor) this.currentColorIndex = parseInt(savedColor, 10) || 0;
      const savedRoom = localStorage.getItem('echoward_room_code');
      if (savedRoom) this.currentRoomId = savedRoom;
    } catch {}

    // Auto-clean stale remote players if no motion received for 4 seconds
    if (typeof window !== 'undefined') {
      window.setInterval(() => {
        const now = Date.now();
        for (const [id, p] of this.remotePlayers.entries()) {
          if (p.lastSeen && now - p.lastSeen > 4000) {
            this.remotePlayers.delete(id);
          }
        }
      }, 1000);
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
      {
        roomId: 'LUMEN',
        playersCount: 1,
        maxPlayers: 4,
        status: 'lobby',
        isFull: false,
        hostId: '',
        players: [],
      },
    ];
  }

  public async createRoom(
    preferredCode?: string
  ): Promise<{ success: boolean; roomId: string; error?: string }> {
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
          this.connect(data.roomId, this.currentName, this.currentCharacter, this.currentColorIndex);
          return { success: true, roomId: data.roomId };
        }
      }
    } catch (e) {
      console.warn('Create room call error, fallback:', e);
    }

    const fallbackCode = (raw || 'ECHO-' + Math.floor(100 + Math.random() * 899)).toUpperCase();
    this.connect(fallbackCode, this.currentName, this.currentCharacter, this.currentColorIndex);
    return { success: true, roomId: fallbackCode };
  }

  public async joinRoom(
    code: string,
    name?: string,
    character?: CharacterArchetype,
    colorIndex?: number
  ): Promise<{ success: boolean; roomId: string; error?: string }> {
    const cleanCode = (code || 'LUMEN').trim().toUpperCase();
    if (name) this.currentName = name;
    if (character) this.currentCharacter = character;
    if (typeof colorIndex === 'number') this.currentColorIndex = colorIndex;

    try {
      localStorage.setItem('echoward_player_name', this.currentName);
      localStorage.setItem('echoward_character_archetype', this.currentCharacter);
      localStorage.setItem('echoward_color_index', String(this.currentColorIndex));
      localStorage.setItem('echoward_room_code', cleanCode);
    } catch {}

    try {
      const res = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: cleanCode }),
      });
      if (res.ok) {
        const data = await res.json();
        if (!data.success) {
          return { success: false, roomId: cleanCode, error: data.error };
        }
      }
    } catch (e) {
      console.warn('Join room check note:', e);
    }

    this.connect(cleanCode, this.currentName, this.currentCharacter, this.currentColorIndex);
    return { success: true, roomId: cleanCode };
  }

  public connect(
    roomId: string,
    playerName: string = 'Nox',
    character: CharacterArchetype = 'Nox',
    colorIndex: number = 0
  ) {
    const targetRoom = (roomId || 'LUMEN').trim().toUpperCase();
    this.currentRoomId = targetRoom;
    this.currentName = playerName;
    this.currentCharacter = character;
    this.currentColorIndex = colorIndex;

    try {
      localStorage.setItem('echoward_room_code', targetRoom);
      localStorage.setItem('echoward_player_name', playerName);
      localStorage.setItem('echoward_character_archetype', character);
      localStorage.setItem('echoward_color_index', String(colorIndex));
    } catch {}

    if (this.reconnectTimeout) {
      window.clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    // If socket is already open, send join message
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.isConnected = true;
      this.ws.send(
        JSON.stringify({
          type: 'join',
          roomId: targetRoom,
          name: this.currentName,
          character: this.currentCharacter,
          colorIndex: this.currentColorIndex,
        })
      );
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

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      const socket = new WebSocket(wsUrl);
      this.ws = socket;

      socket.onopen = () => {
        if (this.ws !== socket) return;
        this.isConnected = true;
        this.startPingLoop();

        socket.send(
          JSON.stringify({
            type: 'join',
            roomId: this.currentRoomId,
            name: this.currentName,
            character: this.currentCharacter,
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
          console.error('Multiplayer msg parse error:', e);
        }
      };

      socket.onclose = () => {
        if (this.ws === socket) {
          this.isConnected = false;
          this.stopPingLoop();
          this.emit('disconnected', {});

          // Auto-reconnect after 3 seconds
          this.reconnectTimeout = window.setTimeout(() => {
            if (!this.isConnected) {
              this.connect(
                this.currentRoomId,
                this.currentName,
                this.currentCharacter,
                this.currentColorIndex
              );
            }
          }, 3000);
        }
      };

      socket.onerror = (err) => {
        console.warn('WebSocket connection note:', err);
      };
    } catch (e) {
      console.warn('Failed to start WebSocket:', e);
    }
  }

  private startPingLoop() {
    this.stopPingLoop();
    this.pingInterval = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.pingStartTime = performance.now();
        this.ws.send(
          JSON.stringify({
            type: 'ping',
            clientTime: this.pingStartTime,
            lastPing: this.ping,
          })
        );
      }
    }, 2000);
  }

  private stopPingLoop() {
    if (this.pingInterval) {
      window.clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  public setReady(isReady: boolean) {
    this.isReady = isReady;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'set_ready',
          isReady,
        })
      );
    }
  }

  public updateProfile(
    name?: string,
    character?: CharacterArchetype,
    colorIndex?: number
  ) {
    if (name) this.currentName = name;
    if (character) this.currentCharacter = character;
    if (typeof colorIndex === 'number') this.currentColorIndex = colorIndex;

    try {
      localStorage.setItem('echoward_player_name', this.currentName);
      localStorage.setItem('echoward_character_archetype', this.currentCharacter);
      localStorage.setItem('echoward_color_index', String(this.currentColorIndex));
    } catch {}

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'update_profile',
          name: this.currentName,
          character: this.currentCharacter,
          colorIndex: this.currentColorIndex,
        })
      );
    }
  }

  public startGame() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'start_game',
        })
      );
    }
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
        currentAnimation: player.currentAnimation,
        isAttacking: Boolean(player.isAttacking),
        attackDirection: player.attackDirection || 'side',
        isDashing: Boolean(player.isDashing),
        isDowned: player.hp <= 0,
      })
    );
  }

  public sendPlayerAttack(direction: 'side' | 'up' | 'down') {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(
      JSON.stringify({
        type: 'action',
        action: 'attack',
        direction,
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

  public sendChatMessage(text: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !text.trim()) return;
    this.ws.send(
      JSON.stringify({
        type: 'chat',
        text: text.trim(),
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

  public disconnect() {
    this.stopPingLoop();
    if (this.reconnectTimeout) {
      window.clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {}
      this.ws = null;
    }
    this.isConnected = false;
    this.remotePlayers.clear();
    this.roomPlayers = [];
    this.emit('disconnected', {});
  }

  public on(cb: MultiplayerEventCallback) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private emit(event: string, data: any) {
    this.listeners.forEach((cb) => cb(event, data));
  }

  private handleServerMessage(msg: any) {
    // 1. JOINED ROOM
    if (msg.type === 'joined_room') {
      this.myClientId = msg.myId;
      this.isHost = Boolean(msg.isHost);
      this.slotIndex = typeof msg.slotIndex === 'number' ? msg.slotIndex : 0;
      if (msg.room) {
        this.applyRoomSnapshot(msg.room);
      }
      if (Array.isArray(msg.chatLog)) {
        const seenIds = new Set<string>();
        const uniqueMessages: RoomChatMessage[] = [];
        for (const m of msg.chatLog) {
          if (m && m.id && !seenIds.has(m.id)) {
            seenIds.add(m.id);
            uniqueMessages.push(m);
          }
        }
        this.chatLog = uniqueMessages;
      }
      this.emit('joined_room', msg);
    }

    // 2. ROOM STATE SNAPSHOT (Syncs all players in the lobby and game)
    else if (msg.type === 'room_state') {
      if (msg.room) {
        this.applyRoomSnapshot(msg.room);
      }
      this.emit('room_state', msg.room);
    }

    // 3. GAME STARTED (Host pressed Start)
    else if (msg.type === 'game_started') {
      this.roomStatus = 'playing';
      if (msg.room) {
        this.applyRoomSnapshot(msg.room);
      }
      this.emit('game_started', msg);
    }

    // 4. MOTION SYNC PACKET FROM PEER
    else if (msg.type === 'sync') {
      if (!msg.fromId || msg.fromId === this.myClientId) return;

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
        existing.isAttacking = Boolean(msg.isAttacking);
        existing.attackDirection = msg.attackDirection;
        existing.isDashing = Boolean(msg.isDashing);
        existing.isDowned = Boolean(msg.isDowned);
        existing.colorIndex = msg.colorIndex ?? existing.colorIndex;
        existing.character = msg.character ?? existing.character;
        existing.slotIndex = msg.slotIndex ?? existing.slotIndex;
        existing.lastSeen = Date.now();
      } else {
        this.remotePlayers.set(msg.fromId, {
          id: msg.fromId,
          name: msg.name || 'Andarilho',
          character: msg.character || 'Nox',
          slotIndex: msg.slotIndex || 1,
          x: msg.x ?? 200,
          y: msg.y ?? 520,
          vx: msg.vx ?? 0,
          vy: msg.vy ?? 0,
          facing: msg.facing ?? 'right',
          hp: msg.hp ?? 5,
          maxHp: msg.maxHp ?? 5,
          maskCracks: msg.maskCracks ?? 0,
          currentRoomId: msg.currentRoomId || 'room_lumen_haven',
          currentAnimation: msg.currentAnimation || 'idle',
          isAttacking: Boolean(msg.isAttacking),
          attackDirection: msg.attackDirection || 'side',
          isDashing: Boolean(msg.isDashing),
          isDowned: Boolean(msg.isDowned),
          colorIndex: msg.colorIndex ?? 1,
          lastSeen: Date.now(),
        });
      }

      // Also update in roomPlayers array
      const rpInfo = this.roomPlayers.find((p) => p.id === msg.fromId);
      if (rpInfo) {
        rpInfo.currentRoomId = msg.currentRoomId;
        rpInfo.hp = msg.hp;
        rpInfo.maxHp = msg.maxHp;
        rpInfo.status = msg.isDowned ? 'downed' : 'exploring';
      }
    }

    // 5. ATTACK EVENT
    else if (msg.type === 'player_attack') {
      if (msg.fromId && msg.fromId !== this.myClientId) {
        const rp = this.remotePlayers.get(msg.fromId);
        if (rp) {
          rp.isAttacking = true;
          rp.attackDirection = msg.direction || 'side';
        }
        this.emit('player_attack', msg);
      }
    }

    // 6. REVIVE EVENT
    else if (msg.type === 'player_revived') {
      if (msg.targetId === this.myClientId) {
        this.emit('self_revived', msg);
      } else {
        const rp = this.remotePlayers.get(msg.targetId);
        if (rp) {
          rp.isDowned = false;
          rp.hp = msg.hp || 3;
        }
      }
      this.emit('player_revived', msg);
    }

    // 7. BOSS SYNC
    else if (msg.type === 'boss_sync') {
      this.emit('boss_synced', msg);
    }

    // 8. CHAT & EMOTE
    else if (msg.type === 'chat_message') {
      if (msg.message && msg.message.id) {
        if (!this.chatLog.some((m) => m.id === msg.message.id)) {
          this.chatLog.push(msg.message);
          if (this.chatLog.length > 50) this.chatLog.shift();
        }
      }
      this.emit('chat_message', msg.message);
    } else if (msg.type === 'emote') {
      const p = this.remotePlayers.get(msg.fromId);
      if (p) {
        p.lastEmote = { text: msg.text, timer: 4.0 };
      }
      this.emit('emote', msg);
    }

    // 9. PLAYER LEFT
    else if (msg.type === 'player_leave') {
      this.remotePlayers.delete(msg.id);
      this.roomPlayers = this.roomPlayers.filter((p) => p.id !== msg.id);
      if (msg.newHostId === this.myClientId) {
        this.isHost = true;
      }
      this.emit('player_left', msg);
    }

    // 10. PONG
    else if (msg.type === 'pong') {
      const now = performance.now();
      this.ping = Math.max(1, Math.round(now - this.pingStartTime));
    }
  }

  private applyRoomSnapshot(room: RoomSessionSnapshot) {
    this.currentRoomId = room.roomId;
    this.roomStatus = room.status;
    this.roomPlayers = room.players || [];

    // Verify host role
    if (room.hostId === this.myClientId) {
      this.isHost = true;
    }

    // Synchronize remotePlayers collection with room membership
    const activeRemoteIds = new Set<string>();

    for (const p of this.roomPlayers) {
      if (p.id !== this.myClientId) {
        activeRemoteIds.add(p.id);
        const existing = this.remotePlayers.get(p.id);
        if (existing) {
          existing.name = p.name;
          existing.character = p.character;
          existing.colorIndex = p.colorIndex;
          existing.slotIndex = p.slotIndex;
          existing.isDowned = p.status === 'downed';
          if (p.currentRoomId) existing.currentRoomId = p.currentRoomId;
        } else {
          // Initialize remote player in memory so they are instantly visible in menus
          this.remotePlayers.set(p.id, {
            id: p.id,
            name: p.name,
            character: p.character,
            slotIndex: p.slotIndex,
            x: p.x ?? 200 + p.slotIndex * 42,
            y: p.y ?? 520,
            vx: p.vx ?? 0,
            vy: p.vy ?? 0,
            facing: p.facing ?? 'right',
            hp: p.hp ?? 5,
            maxHp: p.maxHp ?? 5,
            maskCracks: 0,
            currentRoomId: p.currentRoomId || 'room_lumen_haven',
            currentAnimation: 'idle',
            isAttacking: false,
            attackDirection: 'side',
            isDashing: false,
            isDowned: p.status === 'downed',
            colorIndex: p.colorIndex,
            lastSeen: Date.now(),
          });
        }
      } else {
        this.slotIndex = p.slotIndex;
        this.isReady = p.isReady;
      }
    }

    // Prune remote players no longer in the room
    for (const id of Array.from(this.remotePlayers.keys())) {
      if (!activeRemoteIds.has(id)) {
        this.remotePlayers.delete(id);
      }
    }
  }

  public getRemotePlayersArray(): RemotePlayer[] {
    return Array.from(this.remotePlayers.values());
  }
}

export const multiplayerClient = new MultiplayerClient();
