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
  RemoteAnimationStyle,
} from './types';
import { playerAnimationStore } from './playerAnimationStore';

export type ConnectionStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'ERROR';

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
  public connectionStatus: ConnectionStatus = 'DISCONNECTED';
  public connectionError: string | null = null;
  public lastWsUrl: string = '';
  public lastMessage: string = 'Nenhuma';
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

  private reconnectAttempts = 0;

  /**
   * Resolves REST API and WebSocket endpoints.
   * Priority:
   * 1. localStorage custom URL (if configured in UI)
   * 2. VITE_GAME_SERVER_URL environment variable
   * 3. Default to Render production server (https://echard-servidor.onrender.com) when hosted on Netlify or external domains
   * 4. Current host (/ws) for local development
   */
  public getServerEndpoints(): { httpBaseUrl: string; wsUrl: string } {
    let customUrl = '';
    try {
      customUrl = (localStorage.getItem('echoward_custom_server_url') || '').trim();
    } catch {}

    let envUrl = '';
    try {
      envUrl = (import.meta.env?.VITE_GAME_SERVER_URL || '').trim();
    } catch {}

    let targetUrl = customUrl || envUrl;

    // Auto-detect Netlify or external domains without custom server configured
    if (!targetUrl && typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (
        hostname.includes('netlify.app') ||
        (!hostname.includes('localhost') &&
          !hostname.includes('127.0.0.1') &&
          !hostname.includes('ais-dev') &&
          !hostname.includes('ais-pre'))
      ) {
        targetUrl = 'https://echard-servidor.onrender.com';
      }
    }

    if (targetUrl) {
      const cleanUrl = targetUrl.replace(/\/+$/, '');
      let wsUrl = cleanUrl;
      if (wsUrl.startsWith('https://')) {
        wsUrl = 'wss://' + wsUrl.substring(8);
      } else if (wsUrl.startsWith('http://')) {
        wsUrl = 'ws://' + wsUrl.substring(7);
      } else if (!wsUrl.startsWith('ws://') && !wsUrl.startsWith('wss://')) {
        wsUrl = 'wss://' + wsUrl;
      }
      if (!wsUrl.endsWith('/ws')) {
        wsUrl += '/ws';
      }
      const httpBaseUrl = cleanUrl.replace(/^wss:\/\//, 'https://').replace(/^ws:\/\//, 'http://');
      this.lastWsUrl = wsUrl;
      return { httpBaseUrl, wsUrl };
    }

    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const host = typeof window !== 'undefined' ? window.location.host : 'localhost:3000';
    const wsUrl = `${isHttps ? 'wss:' : 'ws:'}//${host}/ws`;
    this.lastWsUrl = wsUrl;
    return {
      httpBaseUrl: '',
      wsUrl,
    };
  }

  public setCustomServerUrl(url: string) {
    try {
      const trimmed = url.trim();
      if (trimmed) {
        localStorage.setItem('echoward_custom_server_url', trimmed);
      } else {
        localStorage.removeItem('echoward_custom_server_url');
      }
    } catch {}
    // Reconnect with new endpoint
    this.connect(this.currentRoomId, this.currentName, this.currentCharacter, this.currentColorIndex);
  }

  public getEffectiveServerUrl(): string {
    const endpoints = this.getServerEndpoints();
    return endpoints.httpBaseUrl || 'Servidor Local (Porta 3000)';
  }

  public async fetchActiveRooms(): Promise<ActiveRoomInfo[]> {
    try {
      const { httpBaseUrl } = this.getServerEndpoints();
      const res = await fetch(`${httpBaseUrl}/api/rooms`);
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
        maxPlayers: 16,
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
      const { httpBaseUrl } = this.getServerEndpoints();
      const res = await fetch(`${httpBaseUrl}/api/rooms/create`, {
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
      const { httpBaseUrl } = this.getServerEndpoints();
      const res = await fetch(`${httpBaseUrl}/api/rooms/join`, {
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
      const { wsUrl } = this.getServerEndpoints();
      const socket = new WebSocket(wsUrl);
      this.ws = socket;

      socket.onopen = () => {
        if (this.ws !== socket) return;
        this.isConnected = true;
        this.reconnectAttempts = 0;
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

          // Auto-reconnect with exponential backoff (1s, 2s, 4s, 8s max)
          const delay = Math.min(8000, 1000 * Math.pow(2, this.reconnectAttempts));
          this.reconnectAttempts++;

          this.reconnectTimeout = window.setTimeout(() => {
            if (!this.isConnected) {
              this.connect(
                this.currentRoomId,
                this.currentName,
                this.currentCharacter,
                this.currentColorIndex
              );
            }
          }, delay);
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
        animationStyle: playerAnimationStore.getStyleForPlayer(this.myClientId, this.currentName),
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

  public changeOtherPlayersAnimationStyle(style: RemoteAnimationStyle, targetId: string = 'all') {
    if (targetId === 'all') {
      playerAnimationStore.setGlobalOtherPlayersStyle(style);
      for (const rp of this.remotePlayers.values()) {
        rp.animationStyle = style;
      }
    } else {
      playerAnimationStore.setPlayerStyle(targetId, style);
      const rp = this.remotePlayers.get(targetId);
      if (rp) rp.animationStyle = style;
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'change_animation_style',
          targetId,
          style,
        })
      );
    }
    this.emit('animation_style_changed', { targetId, style, fromId: this.myClientId });
  }

  public triggerAnimationPose(anim: string, targetId: string = 'all', duration: number = 6) {
    playerAnimationStore.triggerPose(targetId, anim, duration);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'trigger_animation_pose',
          targetId,
          anim,
          duration,
        })
      );
    }
    this.emit('animation_pose_triggered', { targetId, anim, duration, fromId: this.myClientId });
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
    // 1. JOINED ROOM / ROOM JOINED
    if (msg.type === 'joined_room' || msg.type === 'room_joined') {
      this.myClientId = msg.playerId || msg.myId;
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
      this.emit('room_joined', msg);
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
    else if (msg.type === 'sync' || msg.type === 'player_sync') {
      const peerId = msg.id || msg.fromId;
      if (!peerId || peerId === this.myClientId) return;

      const existing = this.remotePlayers.get(peerId);
      if (existing) {
        // LERP / Smooth Interpolation to eliminate jitter
        existing.x = existing.x + (msg.x - existing.x) * 0.45;
        existing.y = existing.y + (msg.y - existing.y) * 0.45;
        existing.vx = msg.vx;
        existing.vy = msg.vy;
        existing.facing = msg.facing;
        existing.hp = msg.hp;
        existing.maxHp = msg.maxHp;
        existing.maskCracks = msg.maskCracks;
        existing.currentRoomId = msg.currentRoomId;
        existing.currentAnimation = msg.currentAnimation;
        if (msg.animationStyle) existing.animationStyle = msg.animationStyle;
        existing.isAttacking = Boolean(msg.isAttacking);
        existing.attackDirection = msg.attackDirection;
        existing.isDashing = Boolean(msg.isDashing);
        existing.isDowned = Boolean(msg.isDowned);
        existing.colorIndex = msg.colorIndex ?? existing.colorIndex;
        existing.character = msg.character ?? existing.character;
        existing.slotIndex = msg.slotIndex ?? existing.slotIndex;
        existing.lastSeen = Date.now();
      } else {
        this.remotePlayers.set(peerId, {
          id: peerId,
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
          animationStyle: msg.animationStyle || 'padrao',
          isAttacking: Boolean(msg.isAttacking),
          attackDirection: msg.attackDirection || 'side',
          isDashing: Boolean(msg.isDashing),
          isDowned: Boolean(msg.isDowned),
          colorIndex: msg.colorIndex ?? 1,
          lastSeen: Date.now(),
        });
      }

      // Also update in roomPlayers array
      const rpInfo = this.roomPlayers.find((p: any) => (p.id === peerId || p.playerId === peerId));
      if (rpInfo) {
        rpInfo.currentRoomId = msg.currentRoomId;
        rpInfo.hp = msg.hp;
        rpInfo.maxHp = msg.maxHp;
        rpInfo.status = msg.isDowned ? 'downed' : 'exploring';
        if (msg.animationStyle) rpInfo.animationStyle = msg.animationStyle;
      }
    }

    // 5. ATTACK EVENT
    else if (msg.type === 'player_attack') {
      const peerId = msg.id || msg.fromId;
      if (peerId && peerId !== this.myClientId) {
        const rp = this.remotePlayers.get(peerId);
        if (rp) {
          rp.isAttacking = true;
          rp.attackDirection = msg.direction || 'side';
        }
        this.emit('player_attack', msg);
      }
    }

    // 6. REVIVE EVENT
    else if (msg.type === 'player_revived') {
      const targetId = msg.targetPlayerId || msg.targetId;
      if (targetId === this.myClientId) {
        this.emit('self_revived', msg);
      } else {
        const rp = this.remotePlayers.get(targetId);
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
      const p = this.remotePlayers.get(msg.id || msg.fromId);
      if (p) {
        p.lastEmote = { text: msg.text, timer: 4.0 };
      }
      this.emit('emote', msg);
    }

    // 9. ANIMATION STYLE CHANGED EVENT
    else if (msg.type === 'animation_style_changed') {
      const targetId = msg.targetId;
      const style = msg.style;
      if (targetId === 'all') {
        playerAnimationStore.setGlobalOtherPlayersStyle(style);
        for (const rp of this.remotePlayers.values()) {
          rp.animationStyle = style;
        }
      } else {
        playerAnimationStore.setPlayerStyle(targetId, style);
        const rp = this.remotePlayers.get(targetId);
        if (rp) rp.animationStyle = style;
      }
      this.emit('animation_style_changed', msg);
    }

    // 10. INTERACTIVE POSE TRIGGERED EVENT
    else if (msg.type === 'animation_pose_triggered') {
      playerAnimationStore.triggerPose(msg.targetId, msg.anim, msg.duration || 6);
      this.emit('animation_pose_triggered', msg);
    }

    // 11. PLAYER LEFT
    else if (msg.type === 'player_leave' || msg.type === 'player_left') {
      this.remotePlayers.delete(msg.id);
      this.roomPlayers = this.roomPlayers.filter((p: any) => (p.id !== msg.id && p.playerId !== msg.id));
      if (msg.newHostId === this.myClientId) {
        this.isHost = true;
      }
      this.emit('player_left', msg);
    }

    // 12. PONG
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

    for (const p of this.roomPlayers as any[]) {
      const pId = p.id || p.playerId;
      const pName = p.name || p.displayName || 'Andarilho';
      const pChar = p.character || p.characterId || 'Nox';

      if (pId !== this.myClientId) {
        activeRemoteIds.add(pId);
        const existing = this.remotePlayers.get(pId);
        if (existing) {
          existing.name = pName;
          existing.character = pChar;
          existing.colorIndex = p.colorIndex;
          existing.slotIndex = p.slotIndex;
          existing.isDowned = p.status === 'downed' || Boolean(p.isDowned);
          if (p.currentRoomId) existing.currentRoomId = p.currentRoomId;
        } else {
          // Initialize remote player in memory so they are instantly visible in menus
          this.remotePlayers.set(pId, {
            id: pId,
            name: pName,
            character: pChar,
            slotIndex: p.slotIndex,
            x: p.x ?? 200 + (p.slotIndex || 0) * 42,
            y: p.y ?? 520,
            vx: p.vx ?? 0,
            vy: p.vy ?? 0,
            facing: p.facing ?? 'right',
            hp: p.hp ?? p.health ?? 5,
            maxHp: p.maxHp ?? p.maxHealth ?? 5,
            maskCracks: p.maskCracks ?? 0,
            currentRoomId: p.currentRoomId || 'room_lumen_haven',
            currentAnimation: p.currentAnimation || 'idle',
            animationStyle: p.animationStyle || 'padrao',
            isAttacking: false,
            attackDirection: 'side',
            isDashing: false,
            isDowned: p.status === 'downed' || Boolean(p.isDowned),
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
