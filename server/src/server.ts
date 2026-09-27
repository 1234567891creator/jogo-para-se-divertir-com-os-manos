/**
 * Echoward: Reino das Cinzas - Production Multiplayer WebSocket & REST Server
 */

import express, { Request, Response } from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { roomManager } from './rooms/RoomManager';
import { NetworkSecurity } from './networking/validation';
import { CombatManager } from './combat/CombatManager';
import { RoomPlayerSession } from './types';
import {
  CharacterArchetype,
  RemoteAnimationStyle,
  RoomChatMessage,
} from '../../shared/types';
import {
  PROTOCOL_VERSION,
  DEFAULT_MAIN_SERVER_ROOM,
  PUBLIC_SANCTUARY_ROOMS,
} from '../../shared/constants';
import {
  sanitizeRoomCode,
  sanitizePlayerName,
  isValidCharacter,
} from '../../shared/protocols';

export function createEchowardApp() {
  const app = express();

  // CORS configuration for Netlify or custom domains
  app.use((req, res, next) => {
    const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || '';
    const origin = req.headers.origin;

    if (allowedOriginsEnv === '*' || !allowedOriginsEnv) {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
    } else {
      const allowedList = allowedOriginsEnv.split(',').map((o) => o.trim().toLowerCase());
      if (origin && allowedList.includes(origin.toLowerCase())) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      }
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  app.use(express.json({ limit: '64kb' }));

  const serverStartTime = Date.now();

  // 1. Health check endpoint (for Netlify, Cloud Run, Render, Fly.io, Railway)
  app.get('/health', (_req: Request, res: Response) => {
    const rooms = roomManager.getAllRoomsList();
    const totalPlayers = rooms.reduce((acc, r) => acc + r.playersCount, 0);

    res.json({
      status: 'ok',
      game: 'Echoward: Reino das Cinzas',
      version: PROTOCOL_VERSION,
      uptimeSeconds: Math.floor((Date.now() - serverStartTime) / 1000),
      activeRooms: rooms.length,
      connectedPlayers: totalPlayers,
      sanctuaries: PUBLIC_SANCTUARY_ROOMS,
      timestamp: Date.now(),
    });
  });

  // Alias for /api/health
  app.get('/api/health', (req: Request, res: Response) => {
    res.redirect(307, '/health');
  });

  // 2. Rooms listing
  app.get('/api/rooms', (_req: Request, res: Response) => {
    res.json({ rooms: roomManager.getAllRoomsList() });
  });

  // 3. Room creation
  app.post('/api/rooms/create', (req: Request, res: Response) => {
    const { preferredCode } = req.body || {};
    const room = roomManager.createRoom(preferredCode);

    res.json({
      success: true,
      roomId: room.roomId,
      playersCount: room.players.size,
      maxPlayers: room.maxPlayers,
      isFull: room.players.size >= room.maxPlayers,
      message: `Sessão ${room.roomId} pronta para conexão.`,
    });
  });

  // 4. Room join validation
  app.post('/api/rooms/join', (req: Request, res: Response) => {
    const { roomId } = req.body || {};
    const cleanId = sanitizeRoomCode(roomId);

    if (!cleanId) {
      return res.status(400).json({ success: false, error: 'Código de sala inválido.' });
    }

    let room = roomManager.getRoom(cleanId);
    if (!room) {
      // Create if non-existent so invite codes work instantly
      room = roomManager.createRoom(cleanId);
    }

    if (room.players.size >= room.maxPlayers) {
      return res.status(400).json({
        success: false,
        error: `A sala está cheia. Limite de ${room.maxPlayers} jogadores alcançado.`,
      });
    }

    res.json({
      success: true,
      roomId: cleanId,
      playersCount: room.players.size,
      isFull: false,
    });
  });

  return app;
}

export function setupWebSocketServer(httpServer: http.Server) {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (request, socket, head) => {
    const url = request.url || '';
    if (url === '/ws' || url.startsWith('/ws?') || url.startsWith('/ws/')) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  let messageCounter = 0;
  function createMessageId(): string {
    messageCounter = (messageCounter + 1) % 1000000;
    return `msg_${Date.now()}_${messageCounter}`;
  }

  // Heartbeat loop every 20 seconds to prevent reverse proxy timeouts
  const heartbeatInterval = setInterval(() => {
    for (const clientWs of wss.clients) {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.ping();
      }
    }
  }, 20000);
  heartbeatInterval.unref();

  wss.on('connection', (ws: WebSocket) => {
    // Generate unique UUID-like player network ID
    const playerId = `wanderer_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;

    ws.on('message', (messageData: string) => {
      try {
        if (!NetworkSecurity.isPayloadSizeValid(messageData.length)) {
          ws.send(JSON.stringify({ type: 'error', error: 'Mensagem excede tamanho máximo.' }));
          return;
        }

        const data = JSON.parse(messageData.toString());

        // 1. JOIN ROOM
        if (data.type === 'join') {
          const rawRoomId = sanitizeRoomCode(data.roomId) || DEFAULT_MAIN_SERVER_ROOM;
          const playerName = sanitizePlayerName(data.name);
          const character: CharacterArchetype = isValidCharacter(data.character) ? data.character : 'Nox';
          const colorIndex = typeof data.colorIndex === 'number' ? data.colorIndex : 0;

          // Remove from previous room if any
          const prevRemoval = roomManager.removePlayer(ws);
          if (prevRemoval.room && prevRemoval.session) {
            handlePlayerLeaveBroadcast(prevRemoval.room, prevRemoval.session);
          }

          let room = roomManager.getRoom(rawRoomId);
          if (!room) {
            room = roomManager.createRoom(rawRoomId);
          }

          if (room.players.size >= room.maxPlayers) {
            ws.send(
              JSON.stringify({
                type: 'error',
                error: `A sala ${room.roomId} está cheia. Limite de ${room.maxPlayers} jogadores alcançado.`,
              })
            );
            return;
          }

          const slotIndex = roomManager.allocateSlot(room);
          const isHost = room.players.size === 0;
          if (isHost) room.hostId = playerId;

          const session: RoomPlayerSession = {
            ws,
            id: playerId,
            name: playerName,
            character,
            colorIndex,
            isHost,
            isReady: true,
            status: 'exploring',
            ping: 0,
            slotIndex,
            currentRoomId: 'room_lumen_haven',
            x: 200 + slotIndex * 40,
            y: 556,
            vx: 0,
            vy: 0,
            facing: 'right',
            hp: 5,
            maxHp: 5,
            maskCracks: 0,
            isAttacking: false,
            attackDirection: 'side',
            isDashing: false,
            isDowned: false,
            currentAnimation: 'idle',
            animationStyle: 'padrao',
            lastSeen: Date.now(),
            messageCount: 0,
            lastRateReset: Date.now(),
          };

          room.players.set(ws, session);
          roomManager.setSocketRoom(ws, room.roomId);

          console.log(`[Echoward Server] ${session.name} (${session.character}) entrou na sala ${room.roomId}`);

          // Welcome back existing join message
          const joinMsg: RoomChatMessage = {
            id: createMessageId(),
            senderId: 'system',
            senderName: 'SISTEMA',
            colorIndex: 0,
            text: `${session.name} adentrou o Santuário [${room.roomId}].`,
            type: 'system',
            timestamp: Date.now(),
          };
          room.chatLog.push(joinMsg);

          // Reply to joining player with authoritative snapshot
          ws.send(
            JSON.stringify({
              type: 'room_joined',
              playerId: session.id,
              roomId: room.roomId,
              slotIndex: session.slotIndex,
              isHost: session.isHost,
              room: roomManager.getRoomSnapshot(room),
            })
          );

          // Broadcast to existing room companions
          roomManager.broadcast(
            room,
            {
              type: 'player_joined',
              player: {
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
                grounded: true,
                state: 'idle',
                isAttacking: false,
                attackDirection: 'side',
                isDashing: false,
                isDowned: false,
                currentAnimation: 'idle',
                animationStyle: session.animationStyle,
                maskCracks: 0,
                ping: 0,
                isHost: session.isHost,
                isReady: true,
                lastSeen: Date.now(),
              },
            },
            ws
          );

          roomManager.broadcast(room, {
            type: 'room_state',
            room: roomManager.getRoomSnapshot(room),
          });

          roomManager.broadcast(room, {
            type: 'chat_message',
            message: joinMsg,
          });

          return;
        }

        const room = roomManager.getRoomBySocket(ws);
        if (!room) return;

        const session = room.players.get(ws);
        if (!session) return;

        if (!NetworkSecurity.checkRateLimit(session)) {
          return; // Dropped spam payload
        }

        session.lastSeen = Date.now();

        // 2. PLAYER INPUT & MOTION SYNC
        if (data.type === 'sync') {
          if (NetworkSecurity.validatePosition(data.x, data.y)) {
            session.x = data.x;
            session.y = data.y;
          }
          if (typeof data.vx === 'number') session.vx = data.vx;
          if (typeof data.vy === 'number') session.vy = data.vy;
          if (data.facing === 'left' || data.facing === 'right') session.facing = data.facing;
          if (data.currentRoomId && typeof data.currentRoomId === 'string') {
            session.currentRoomId = data.currentRoomId;
          }
          if (NetworkSecurity.validateHp(data.hp, data.maxHp)) {
            session.hp = data.hp;
            session.maxHp = data.maxHp;
            session.isDowned = session.hp <= 0;
          }
          session.isAttacking = Boolean(data.isAttacking);
          if (data.attackDirection) session.attackDirection = String(data.attackDirection);
          session.isDashing = Boolean(data.isDashing);
          if (data.currentAnimation) session.currentAnimation = String(data.currentAnimation);
          if (data.animationStyle) session.animationStyle = data.animationStyle;
          if (typeof data.maskCracks === 'number') session.maskCracks = data.maskCracks;

          // Broadcast authoritative snapshot to other players in the room
          roomManager.broadcast(
            room,
            {
              type: 'player_sync',
              id: session.id,
              x: session.x,
              y: session.y,
              vx: session.vx,
              vy: session.vy,
              facing: session.facing,
              currentRoomId: session.currentRoomId,
              hp: session.hp,
              maxHp: session.maxHp,
              isAttacking: session.isAttacking,
              attackDirection: session.attackDirection,
              isDashing: session.isDashing,
              isDowned: session.isDowned,
              currentAnimation: session.currentAnimation,
              animationStyle: session.animationStyle,
              maskCracks: session.maskCracks,
              timestamp: Date.now(),
            },
            ws
          );
          return;
        }

        // 3. ATTACK EVENT
        if (data.type === 'attack') {
          const dir = data.direction || 'side';
          session.isAttacking = true;
          session.attackDirection = dir;

          roomManager.broadcast(
            room,
            {
              type: 'player_attack',
              id: session.id,
              direction: dir,
              timestamp: Date.now(),
            },
            ws
          );
          return;
        }

        // 4. AUTHORITATIVE BOSS DAMAGE
        if (data.type === 'boss_damage') {
          const bossId = String(data.bossId || 'guardian');
          const damage = Number(data.damage) || 1;
          const result = CombatManager.handleBossDamage(room, session, bossId, damage);

          roomManager.broadcast(room, {
            type: 'boss_sync',
            bossId,
            hp: result.currentHp,
            maxHp: 30,
            isDefeated: result.defeated,
            damagedByName: session.name,
          });
          return;
        }

        // 5. REVIVE CO-OP COMPANION
        if (data.type === 'revive') {
          const targetPlayerId = String(data.targetPlayerId || '');
          const revived = CombatManager.revivePlayer(room, session, targetPlayerId);

          if (revived) {
            const reviveMsg: RoomChatMessage = {
              id: createMessageId(),
              senderId: 'system',
              senderName: 'SISTEMA',
              colorIndex: 0,
              text: `✨ ${session.name} reergueu a alma de ${revived.name}!`,
              type: 'system',
              timestamp: Date.now(),
            };
            room.chatLog.push(reviveMsg);

            roomManager.broadcast(room, {
              type: 'player_revived',
              targetPlayerId: revived.id,
              revivedByName: session.name,
            });

            roomManager.broadcast(room, {
              type: 'chat_message',
              message: reviveMsg,
            });

            roomManager.broadcast(room, {
              type: 'room_state',
              room: roomManager.getRoomSnapshot(room),
            });
          }
          return;
        }

        // 6. CHAT MESSAGE
        if (data.type === 'chat') {
          const text = String(data.text || '').trim().substring(0, 120);
          if (text) {
            const chatMsg: RoomChatMessage = {
              id: createMessageId(),
              senderId: session.id,
              senderName: session.name,
              colorIndex: session.colorIndex,
              text,
              type: 'chat',
              timestamp: Date.now(),
            };
            room.chatLog.push(chatMsg);
            if (room.chatLog.length > 50) room.chatLog.shift();

            roomManager.broadcast(room, {
              type: 'chat_message',
              message: chatMsg,
            });
          }
          return;
        }

        // 7. EMOTE
        if (data.type === 'emote') {
          const emoteText = String(data.text || '').substring(0, 30);
          roomManager.broadcast(room, {
            type: 'emote',
            id: session.id,
            text: emoteText,
          });
          return;
        }

        // 8. CHANGE OTHER PLAYERS ANIMATION STYLE
        if (data.type === 'change_other_players_anim_style') {
          const style: RemoteAnimationStyle = data.style || 'padrao';
          const targetPlayerId = data.targetPlayerId;

          if (targetPlayerId && targetPlayerId !== 'all') {
            for (const otherSession of room.players.values()) {
              if (otherSession.id === targetPlayerId) {
                otherSession.animationStyle = style;
              }
            }
          } else {
            for (const otherSession of room.players.values()) {
              if (otherSession.id !== session.id) {
                otherSession.animationStyle = style;
              }
            }
          }

          roomManager.broadcast(room, {
            type: 'room_state',
            room: roomManager.getRoomSnapshot(room),
          });
          return;
        }

        // 9. HEARTBEAT PING
        if (data.type === 'ping') {
          ws.send(
            JSON.stringify({
              type: 'pong',
              originalTimestamp: data.timestamp,
              serverTimestamp: Date.now(),
            })
          );
          return;
        }
      } catch (err) {
        console.error('[Echoward Server] Message handling error:', err);
      }
    });

    ws.on('close', () => {
      const removal = roomManager.removePlayer(ws);
      if (removal.room && removal.session) {
        handlePlayerLeaveBroadcast(removal.room, removal.session);
      }
    });

    ws.on('error', (err) => {
      console.warn(`[Echoward Server] WebSocket error on player ${playerId}:`, err.message);
    });
  });

  function handlePlayerLeaveBroadcast(room: any, session: RoomPlayerSession) {
    console.log(`[Echoward Server] ${session.name} saiu da sala ${room.roomId}`);

    const leaveMsg: RoomChatMessage = {
      id: createMessageId(),
      senderId: 'system',
      senderName: 'SISTEMA',
      colorIndex: 0,
      text: `${session.name} desconectou-se da sessão.`,
      type: 'system',
      timestamp: Date.now(),
    };
    room.chatLog.push(leaveMsg);

    roomManager.broadcast(room, {
      type: 'player_left',
      id: session.id,
      name: session.name,
      newHostId: room.hostId,
    });

    roomManager.broadcast(room, {
      type: 'room_state',
      room: roomManager.getRoomSnapshot(room),
    });

    roomManager.broadcast(room, {
      type: 'chat_message',
      message: leaveMsg,
    });
  }

  return wss;
}
