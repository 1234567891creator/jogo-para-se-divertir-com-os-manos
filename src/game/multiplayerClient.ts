/**
 * Echoward: Reino das Cinzas - Real-time Multiplayer Client
 */

import { RemotePlayer, PlayerState } from './types';

export type MultiplayerEventCallback = (event: string, data: any) => void;

export class MultiplayerClient {
  private ws: WebSocket | null = null;
  public isConnected: boolean = false;
  public myClientId: string | null = null;
  public currentRoomId: string | null = null;
  public remotePlayers: Map<string, RemotePlayer> = new Map();
  private listeners: Set<MultiplayerEventCallback> = new Set();
  private syncTimer: number | null = null;

  public connect(roomId: string, playerName: string, colorIndex: number = 0) {
    if (this.ws) {
      this.disconnect();
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.currentRoomId = roomId.toUpperCase();
        this.ws?.send(
          JSON.stringify({
            type: 'join',
            roomId: this.currentRoomId,
            name: playerName,
            colorIndex,
          })
        );
        this.emit('connected', { roomId: this.currentRoomId });
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleServerMessage(msg);
        } catch (e) {
          console.error('Multiplayer msg error:', e);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.remotePlayers.clear();
        this.emit('disconnected', {});
      };

      this.ws.onerror = (err) => {
        console.warn('WebSocket error, running in local solo mode:', err);
      };
    } catch (e) {
      console.warn('Failed to start WebSocket, solo mode active:', e);
    }
  }

  public disconnect() {
    if (this.syncTimer) {
      window.clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.remotePlayers.clear();
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
