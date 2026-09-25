import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

export type CharacterArchetype = 'Nox' | 'Veyra' | 'Orin' | 'Kael';

interface RoomPlayerSession {
  ws: WebSocket;
  id: string; // networkId (unique in session)
  name: string;
  character: CharacterArchetype;
  colorIndex: number;
  isHost: boolean;
  isReady: boolean;
  status: 'lobby' | 'ready' | 'exploring' | 'downed';
  ping: number;
  slotIndex: number; // 0, 1, 2, 3
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
  lastSeen: number;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  colorIndex: number;
  text: string;
  type: 'chat' | 'emote' | 'system';
  timestamp: number;
}

interface GameRoomState {
  roomId: string;
  hostId: string;
  createdAt: number;
  status: 'lobby' | 'playing';
  players: Map<WebSocket, RoomPlayerSession>;
  worldState: {
    bossHp: Record<string, number>;
    defeatedBosses: Set<string>;
    openedDoors: Set<string>;
    activatedTotems: Set<string>;
  };
  chatLog: ChatMessage[];
}

const rooms = new Map<string, GameRoomState>();
const socketToRoom = new Map<WebSocket, string>();

// Pre-create persistent sanctuary rooms
const publicRoomCodes = new Set(['LUMEN', 'CINZAS', 'NER', 'ECOS']);
for (const code of publicRoomCodes) {
  rooms.set(code, {
    roomId: code,
    hostId: '',
    createdAt: Date.now(),
    status: 'lobby',
    players: new Map(),
    worldState: {
      bossHp: {},
      defeatedBosses: new Set(),
      openedDoors: new Set(),
      activatedTotems: new Set(),
    },
    chatLog: [],
  });
}

let msgSequence = 0;
function createMessageId(): string {
  msgSequence = (msgSequence + 1) % 1000000;
  return `msg_${Date.now()}_${msgSequence}_${Math.random().toString(36).substring(2, 7)}`;
}

function getRoomSnapshot(room: GameRoomState) {
  const playersList: any[] = [];
  for (const session of room.players.values()) {
    playersList.push({
      id: session.id,
      name: session.name,
      character: session.character,
      colorIndex: session.colorIndex,
      isHost: session.isHost,
      isReady: session.isReady,
      status: session.status,
      ping: session.ping,
      slotIndex: session.slotIndex,
      currentRoomId: session.currentRoomId,
      hp: session.hp,
      maxHp: session.maxHp,
      x: session.x,
      y: session.y,
      vx: session.vx,
      vy: session.vy,
      facing: session.facing,
      isDowned: session.isDowned,
      isAttacking: session.isAttacking,
      attackDirection: session.attackDirection,
      isDashing: session.isDashing,
      currentAnimation: session.currentAnimation,
      maskCracks: session.maskCracks,
    });
  }
  // Sort players deterministically by slotIndex
  playersList.sort((a, b) => a.slotIndex - b.slotIndex);

  return {
    roomId: room.roomId,
    hostId: room.hostId,
    playersCount: room.players.size,
    maxPlayers: 4,
    status: room.status,
    players: playersList,
    isFull: room.players.size >= 4,
  };
}

function broadcastToRoom(room: GameRoomState, message: any, excludeWs?: WebSocket) {
  const payload = JSON.stringify(message);
  for (const clientWs of room.players.keys()) {
    if (clientWs !== excludeWs && clientWs.readyState === WebSocket.OPEN) {
      try {
        clientWs.send(payload);
      } catch (err) {
        console.error('Failed to send to socket:', err);
      }
    }
  }
}

function allocateSlotIndex(room: GameRoomState): number {
  const usedSlots = new Set<number>();
  for (const session of room.players.values()) {
    usedSlots.add(session.slotIndex);
  }
  for (let i = 0; i < 4; i++) {
    if (!usedSlots.has(i)) return i;
  }
  return 0;
}

// REST API Endpoints
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    game: 'Echoward: Reino das Cinzas',
    activeRooms: rooms.size,
    timestamp: Date.now(),
  });
});

app.get('/api/rooms', (_req, res) => {
  const list = Array.from(rooms.values()).map((r) => getRoomSnapshot(r));
  res.json({ rooms: list });
});

app.post('/api/rooms/create', (req, res) => {
  let { preferredCode, name } = req.body || {};
  let roomId = (preferredCode || '').trim().toUpperCase();

  if (!roomId || roomId.length < 3) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rand = '';
    for (let i = 0; i < 4; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    roomId = `ECHO-${rand}`;
  }

  roomId = roomId.substring(0, 12).replace(/[^A-Z0-9_-]/g, '');

  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      roomId,
      hostId: '',
      createdAt: Date.now(),
      status: 'lobby',
      players: new Map(),
      worldState: {
        bossHp: {},
        defeatedBosses: new Set(),
        openedDoors: new Set(),
        activatedTotems: new Set(),
      },
      chatLog: [],
    });
  }

  const room = rooms.get(roomId)!;
  res.json({
    success: true,
    roomId,
    playersCount: room.players.size,
    isFull: room.players.size >= 4,
    message: `Sessão ${roomId} pronta para conexão.`,
  });
});

app.post('/api/rooms/join', (req, res) => {
  const { roomId } = req.body || {};
  const cleanId = (roomId || '').trim().toUpperCase();

  if (!cleanId) {
    return res.status(400).json({ success: false, error: 'Código de sala inválido.' });
  }

  if (!rooms.has(cleanId)) {
    // Automatically create room if not exists so joining friend's code always succeeds
    rooms.set(cleanId, {
      roomId: cleanId,
      hostId: '',
      createdAt: Date.now(),
      status: 'lobby',
      players: new Map(),
      worldState: {
        bossHp: {},
        defeatedBosses: new Set(),
        openedDoors: new Set(),
        activatedTotems: new Set(),
      },
      chatLog: [],
    });
  }

  const room = rooms.get(cleanId)!;
  if (room.players.size >= 4) {
    return res.status(400).json({
      success: false,
      error: 'A sala está cheia. O limite máximo é de 4 jogadores por sessão.',
    });
  }

  res.json({
    success: true,
    roomId: cleanId,
    playersCount: room.players.size,
    isFull: false,
  });
});

// WebSocket Server
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const url = request.url || '';
  if (url === '/ws' || url.startsWith('/ws?') || url.startsWith('/ws/')) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  }
});

// Periodic heartbeat to prevent timeout
const heartbeat = setInterval(() => {
  for (const clientWs of socketToRoom.keys()) {
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.ping();
    }
  }
}, 20000);
heartbeat.unref();

wss.on('connection', (ws: WebSocket) => {
  const connectionId = 'player_' + Math.random().toString(36).substring(2, 8);

  ws.on('message', (messageData: string) => {
    try {
      const data = JSON.parse(messageData.toString());

      // 1. JOIN ROOM
      if (data.type === 'join') {
        const targetRoomId = (data.roomId || 'LUMEN').trim().toUpperCase();
        const playerName = (data.name || 'Nox').trim().substring(0, 16);
        const character: CharacterArchetype = ['Nox', 'Veyra', 'Orin', 'Kael'].includes(data.character)
          ? data.character
          : 'Nox';
        const colorIndex = typeof data.colorIndex === 'number' ? data.colorIndex : 0;

        // Clean up previous room if any
        const prevRoomId = socketToRoom.get(ws);
        if (prevRoomId && rooms.has(prevRoomId)) {
          handlePlayerLeave(ws, prevRoomId);
        }

        if (!rooms.has(targetRoomId)) {
          rooms.set(targetRoomId, {
            roomId: targetRoomId,
            hostId: '',
            createdAt: Date.now(),
            status: 'lobby',
            players: new Map(),
            worldState: {
              bossHp: {},
              defeatedBosses: new Set(),
              openedDoors: new Set(),
              activatedTotems: new Set(),
            },
            chatLog: [],
          });
        }

        const room = rooms.get(targetRoomId)!;

        // Enforce strict 4-player limit
        if (room.players.size >= 4) {
          ws.send(
            JSON.stringify({
              type: 'error',
              error: 'A sala está cheia. Limite de 4 jogadores alcançado.',
            })
          );
          return;
        }

        const isHost = room.players.size === 0;
        if (isHost) {
          room.hostId = connectionId;
        }

        const slotIndex = allocateSlotIndex(room);

        // Calculate initial spawn offset based on slot index (Section 12)
        const spawnX = 200 + slotIndex * 42;
        const spawnY = 520;

        const session: RoomPlayerSession = {
          ws,
          id: connectionId,
          name: playerName,
          character,
          colorIndex,
          isHost,
          isReady: isHost, // Host is ready by default
          status: 'lobby',
          ping: 20,
          slotIndex,
          currentRoomId: 'room_lumen_haven',
          x: spawnX,
          y: spawnY,
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
          lastSeen: Date.now(),
        };

        room.players.set(ws, session);
        socketToRoom.set(ws, targetRoomId);

        // System message in chat
        const joinMsg: ChatMessage = {
          id: createMessageId(),
          senderId: 'system',
          senderName: 'SISTEMA',
          colorIndex: 0,
          text: `${playerName} entrou no santuário (${room.players.size}/4 Andarilhos).`,
          type: 'system',
          timestamp: Date.now(),
        };
        room.chatLog.push(joinMsg);
        if (room.chatLog.length > 50) room.chatLog.shift();

        const roomSnapshot = getRoomSnapshot(room);

        // Send joined confirmation with full room state to the newly joined player
        ws.send(
          JSON.stringify({
            type: 'joined_room',
            myId: connectionId,
            isHost,
            slotIndex,
            room: roomSnapshot,
            chatLog: room.chatLog.slice(-25),
          })
        );

        // Broadcast updated room state to ALL players in the room
        broadcastToRoom(room, {
          type: 'room_state',
          room: roomSnapshot,
        });

        // Broadcast chat notification to existing players (joining client already has it in joined_room chatLog)
        broadcastToRoom(
          room,
          {
            type: 'chat_message',
            message: joinMsg,
          },
          ws
        );
      }


      // 2. TOGGLE READY STATUS
      else if (data.type === 'set_ready') {
        const roomId = socketToRoom.get(ws);
        if (!roomId || !rooms.has(roomId)) return;
        const room = rooms.get(roomId)!;
        const session = room.players.get(ws);
        if (!session) return;

        session.isReady = Boolean(data.isReady);
        session.status = session.isReady ? 'ready' : 'lobby';

        broadcastToRoom(room, {
          type: 'room_state',
          room: getRoomSnapshot(room),
        });
      }

      // 3. UPDATE PROFILE (Name, Character Archetype, Color)
      else if (data.type === 'update_profile') {
        const roomId = socketToRoom.get(ws);
        if (!roomId || !rooms.has(roomId)) return;
        const room = rooms.get(roomId)!;
        const session = room.players.get(ws);
        if (!session) return;

        if (data.name) session.name = data.name.trim().substring(0, 16);
        if (data.character && ['Nox', 'Veyra', 'Orin', 'Kael'].includes(data.character)) {
          session.character = data.character;
        }
        if (typeof data.colorIndex === 'number') {
          session.colorIndex = data.colorIndex;
        }

        broadcastToRoom(room, {
          type: 'room_state',
          room: getRoomSnapshot(room),
        });
      }

      // 4. START GAME (Host Only)
      else if (data.type === 'start_game') {
        const roomId = socketToRoom.get(ws);
        if (!roomId || !rooms.has(roomId)) return;
        const room = rooms.get(roomId)!;
        const session = room.players.get(ws);
        if (!session || !session.isHost) return;

        room.status = 'playing';
        for (const s of room.players.values()) {
          s.status = 'exploring';
        }

        const startMsg: ChatMessage = {
          id: createMessageId(),
          senderId: 'system',
          senderName: 'SISTEMA',
          colorIndex: 0,
          text: '⚔️ A exploração co-op começou! O Reino das Cinzas aguarda.',
          type: 'system',
          timestamp: Date.now(),
        };
        room.chatLog.push(startMsg);

        broadcastToRoom(room, {
          type: 'game_started',
          room: getRoomSnapshot(room),
        });
        broadcastToRoom(room, {
          type: 'chat_message',
          message: startMsg,
        });
      }

      // 5. MOTION SYNC (20Hz snapshots with interpolation support)
      else if (data.type === 'sync') {
        const roomId = socketToRoom.get(ws);
        if (!roomId || !rooms.has(roomId)) return;
        const room = rooms.get(roomId)!;
        const session = room.players.get(ws);
        if (!session) return;

        session.x = typeof data.x === 'number' ? data.x : session.x;
        session.y = typeof data.y === 'number' ? data.y : session.y;
        session.vx = typeof data.vx === 'number' ? data.vx : session.vx;
        session.vy = typeof data.vy === 'number' ? data.vy : session.vy;
        session.facing = data.facing || session.facing;
        session.hp = typeof data.hp === 'number' ? data.hp : session.hp;
        session.maxHp = typeof data.maxHp === 'number' ? data.maxHp : session.maxHp;
        session.maskCracks = typeof data.maskCracks === 'number' ? data.maskCracks : session.maskCracks;
        session.currentRoomId = data.currentRoomId || session.currentRoomId;
        session.currentAnimation = data.currentAnimation || session.currentAnimation;
        session.isAttacking = Boolean(data.isAttacking);
        session.attackDirection = data.attackDirection || 'side';
        session.isDashing = Boolean(data.isDashing);
        session.isDowned = Boolean(data.isDowned);
        session.status = session.isDowned ? 'downed' : 'exploring';
        session.lastSeen = Date.now();

        // Broadcast motion packet to other players in the room
        broadcastToRoom(
          room,
          {
            type: 'sync',
            fromId: session.id,
            name: session.name,
            character: session.character,
            colorIndex: session.colorIndex,
            slotIndex: session.slotIndex,
            x: session.x,
            y: session.y,
            vx: session.vx,
            vy: session.vy,
            facing: session.facing,
            hp: session.hp,
            maxHp: session.maxHp,
            maskCracks: session.maskCracks,
            currentRoomId: session.currentRoomId,
            currentAnimation: session.currentAnimation,
            isAttacking: session.isAttacking,
            attackDirection: session.attackDirection,
            isDashing: session.isDashing,
            isDowned: session.isDowned,
            timestamp: Date.now(),
          },
          ws
        );
      }

      // 6. ATTACK ACTION (Server authoritative relay)
      else if (data.type === 'action' && data.action === 'attack') {
        const roomId = socketToRoom.get(ws);
        if (!roomId || !rooms.has(roomId)) return;
        const room = rooms.get(roomId)!;
        const session = room.players.get(ws);
        if (!session || session.isDowned) return;

        broadcastToRoom(
          room,
          {
            type: 'player_attack',
            fromId: session.id,
            name: session.name,
            direction: data.direction || 'side',
            x: session.x,
            y: session.y,
            facing: session.facing,
          },
          ws
        );
      }

      // 7. REVIVE TEAMMATE (Section 1)
      else if (data.type === 'action' && data.action === 'revive') {
        const roomId = socketToRoom.get(ws);
        if (!roomId || !rooms.has(roomId)) return;
        const room = rooms.get(roomId)!;
        const session = room.players.get(ws);
        if (!session || session.isDowned) return;

        const targetId = data.targetId;
        for (const target of room.players.values()) {
          if (target.id === targetId && target.isDowned) {
            target.isDowned = false;
            target.hp = Math.max(3, Math.floor(target.maxHp / 2));
            target.status = 'exploring';

            const reviveMsg: ChatMessage = {
              id: createMessageId(),
              senderId: 'system',
              senderName: 'SISTEMA',
              colorIndex: 0,
              text: `✨ ${session.name} reanimou ${target.name}!`,
              type: 'system',
              timestamp: Date.now(),
            };
            room.chatLog.push(reviveMsg);

            broadcastToRoom(room, {
              type: 'player_revived',
              targetId: target.id,
              revivedBy: session.name,
              hp: target.hp,
            });
            broadcastToRoom(room, {
              type: 'chat_message',
              message: reviveMsg,
            });
            broadcastToRoom(room, {
              type: 'room_state',
              room: getRoomSnapshot(room),
            });
            break;
          }
        }
      }

      // 8. BOSS & ENEMY DAMAGE SYNC (Authoritative world state)
      else if (data.type === 'boss_sync') {
        const roomId = socketToRoom.get(ws);
        if (!roomId || !rooms.has(roomId)) return;
        const room = rooms.get(roomId)!;
        const session = room.players.get(ws);
        if (!session) return;

        const bossId = data.bossId;
        const damage = typeof data.damage === 'number' ? data.damage : 0;
        const currentHp = typeof data.currentHp === 'number' ? data.currentHp : 0;

        room.worldState.bossHp[bossId] = currentHp;
        if (currentHp <= 0) {
          room.worldState.defeatedBosses.add(bossId);
        }

        broadcastToRoom(
          room,
          {
            type: 'boss_sync',
            bossId,
            damage,
            currentHp,
            dealerName: session.name,
            isDefeated: currentHp <= 0,
          },
          ws
        );
      }

      // 9. EMOTE & CHAT
      else if (data.type === 'emote' || data.type === 'chat') {
        const roomId = socketToRoom.get(ws);
        if (!roomId || !rooms.has(roomId)) return;
        const room = rooms.get(roomId)!;
        const session = room.players.get(ws);
        if (!session) return;

        const chatMsg: ChatMessage = {
          id: createMessageId(),
          senderId: session.id,
          senderName: session.name,
          colorIndex: session.colorIndex,
          text: (data.text || '').substring(0, 80),
          type: data.type === 'emote' ? 'emote' : 'chat',
          timestamp: Date.now(),
        };

        room.chatLog.push(chatMsg);
        if (room.chatLog.length > 50) room.chatLog.shift();

        broadcastToRoom(room, {
          type: 'chat_message',
          message: chatMsg,
        });

        if (data.type === 'emote') {
          broadcastToRoom(room, {
            type: 'emote',
            fromId: session.id,
            text: chatMsg.text,
          });
        }
      }

      // 10. PING / PONG (Latency testing)
      else if (data.type === 'ping') {
        const roomId = socketToRoom.get(ws);
        if (roomId && rooms.has(roomId)) {
          const session = rooms.get(roomId)!.players.get(ws);
          if (session && typeof data.lastPing === 'number') {
            session.ping = Math.max(1, Math.round(data.lastPing));
          }
        }
        ws.send(
          JSON.stringify({
            type: 'pong',
            clientTime: data.clientTime,
            serverTime: Date.now(),
          })
        );
      }
    } catch (err) {
      console.error('WebSocket message parsing error:', err);
    }
  });

  ws.on('close', () => {
    const roomId = socketToRoom.get(ws);
    if (roomId) {
      handlePlayerLeave(ws, roomId);
    }
  });
});

function handlePlayerLeave(ws: WebSocket, roomId: string) {
  socketToRoom.delete(ws);
  const room = rooms.get(roomId);
  if (!room) return;

  const session = room.players.get(ws);
  if (!session) return;

  room.players.delete(ws);

  // If host leaves and others remain, assign new host
  let newHostId = '';
  if (session.isHost && room.players.size > 0) {
    const nextSession = room.players.values().next().value;
    if (nextSession) {
      nextSession.isHost = true;
      room.hostId = nextSession.id;
      newHostId = nextSession.id;
    }
  }

  // If empty and not public sanctuary room, delete room
  if (room.players.size === 0 && !publicRoomCodes.has(roomId)) {
    rooms.delete(roomId);
    return;
  }

  const leaveMsg: ChatMessage = {
    id: createMessageId(),
    senderId: 'system',
    senderName: 'SISTEMA',
    colorIndex: 0,
    text: `${session.name} desconectou-se da sessão.`,
    type: 'system',
    timestamp: Date.now(),
  };
  room.chatLog.push(leaveMsg);

  broadcastToRoom(room, {
    type: 'player_leave',
    id: session.id,
    name: session.name,
    newHostId,
  });

  broadcastToRoom(room, {
    type: 'room_state',
    room: getRoomSnapshot(room),
  });

  broadcastToRoom(room, {
    type: 'chat_message',
    message: leaveMsg,
  });
}

// Vite middleware or Static server setup
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Echoward Server] Running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup error:', err);
  process.exit(1);
});
