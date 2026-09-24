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

// Realtime Multiplayer Data structures
interface ConnectedClient {
  ws: WebSocket;
  id: string;
  name: string;
  roomId: string;
  colorIndex: number;
}

const clients = new Map<WebSocket, ConnectedClient>();
const rooms = new Map<string, Set<WebSocket>>();

// Pre-populate standard public rooms so players always see rooms to join
const publicRoomCodes = new Set(['LUMEN', 'CINZAS', 'NER', 'ECOS']);
for (const code of publicRoomCodes) {
  if (!rooms.has(code)) {
    rooms.set(code, new Set());
  }
}

// API Endpoints for Rooms & Multiplayer Status
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', game: 'Echoward: Reino das Cinzas', timestamp: Date.now() });
});

// List all active rooms
app.get('/api/rooms', (_req, res) => {
  const roomList = Array.from(rooms.entries()).map(([code, clientSet]) => {
    const activeClients: Array<{ id: string; name: string; colorIndex: number }> = [];
    for (const ws of clientSet) {
      const c = clients.get(ws);
      if (c) {
        activeClients.push({ id: c.id, name: c.name, colorIndex: c.colorIndex });
      }
    }
    return {
      roomId: code,
      playersCount: clientSet.size,
      players: activeClients,
      isFull: clientSet.size >= 4,
    };
  });

  res.json({ rooms: roomList });
});

// Create room endpoint
app.post('/api/rooms/create', (req, res) => {
  let { preferredCode, name } = req.body || {};
  let roomId = (preferredCode || '').trim().toUpperCase();

  if (!roomId || roomId.length < 3) {
    // Generate random code like SOL7, LUM9, NOX3
    const prefixes = ['LUM', 'NOX', 'ASH', 'NER', 'SOL', 'ECO', 'SIL'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(10 + Math.random() * 90);
    roomId = `${prefix}${num}`;
  }

  roomId = roomId.substring(0, 10).replace(/[^A-Z0-9_-]/g, '');

  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }

  res.json({
    success: true,
    roomId,
    message: `Sala ${roomId} criada com sucesso!`,
    playersCount: rooms.get(roomId)!.size,
  });
});

// Join room endpoint (validation)
app.post('/api/rooms/join', (req, res) => {
  const { roomId } = req.body || {};
  const cleanId = (roomId || '').trim().toUpperCase();

  if (!cleanId) {
    return res.status(400).json({ success: false, error: 'Código da sala inválido.' });
  }

  if (!rooms.has(cleanId)) {
    // Automatically create if not exists so joining any typed code works!
    rooms.set(cleanId, new Set());
  }

  const room = rooms.get(cleanId)!;
  if (room.size >= 4) {
    return res.status(400).json({ success: false, error: 'Esta sala já atingiu a capacidade máxima (4 jogadores).' });
  }

  res.json({
    success: true,
    roomId: cleanId,
    playersCount: room.size,
  });
});

// Realtime Multiplayer WebSocket Server
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const { pathname } = new URL(request.url || '', `http://${request.headers.host}`);
  if (pathname === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  }
});

wss.on('connection', (ws: WebSocket) => {
  const clientId = 'wanderer_' + Math.random().toString(36).substring(2, 8);

  ws.on('message', (messageData: string) => {
    try {
      const data = JSON.parse(messageData.toString());

      if (data.type === 'join') {
        const roomId = (data.roomId || 'LUMEN').trim().toUpperCase();
        const playerName = (data.name || 'Nox').substring(0, 16);
        const colorIndex = typeof data.colorIndex === 'number' ? data.colorIndex : 0;

        // Leave existing room if any
        const existing = clients.get(ws);
        if (existing && rooms.has(existing.roomId)) {
          rooms.get(existing.roomId)!.delete(ws);
          broadcastToRoom(existing.roomId, {
            type: 'player_leave',
            id: existing.id,
          }, ws);
        }

        const clientInfo: ConnectedClient = {
          ws,
          id: clientId,
          name: playerName,
          roomId,
          colorIndex,
        };
        clients.set(ws, clientInfo);

        if (!rooms.has(roomId)) {
          rooms.set(roomId, new Set());
        }
        rooms.get(roomId)!.add(ws);

        // Collect existing players in the room to send to this newcomer!
        const existingPlayers: Array<{ id: string; name: string; colorIndex: number }> = [];
        for (const otherWs of rooms.get(roomId)!) {
          if (otherWs !== ws) {
            const oc = clients.get(otherWs);
            if (oc) {
              existingPlayers.push({ id: oc.id, name: oc.name, colorIndex: oc.colorIndex });
            }
          }
        }

        // Send confirmation & existing players to the joining player
        ws.send(JSON.stringify({
          type: 'joined_room',
          id: clientId,
          roomId,
          playersCount: rooms.get(roomId)!.size,
          existingPlayers,
        }));

        // Notify others in the room
        broadcastToRoom(roomId, {
          type: 'player_joined',
          id: clientId,
          name: playerName,
          colorIndex,
        }, ws);

      } else if (data.type === 'sync' || data.type === 'action' || data.type === 'boss_sync' || data.type === 'emote') {
        const client = clients.get(ws);
        if (client && client.roomId) {
          data.fromId = client.id;
          data.name = client.name;
          data.colorIndex = client.colorIndex;
          broadcastToRoom(client.roomId, data, ws);
        }
      }
    } catch (err) {
      console.error('WS parse error:', err);
    }
  });

  ws.on('close', () => {
    const client = clients.get(ws);
    if (client) {
      const room = rooms.get(client.roomId);
      if (room) {
        room.delete(ws);
        // Don't delete standard public rooms
        if (room.size === 0 && !publicRoomCodes.has(client.roomId)) {
          rooms.delete(client.roomId);
        } else {
          broadcastToRoom(client.roomId, {
            type: 'player_leave',
            id: client.id,
          });
        }
      }
      clients.delete(ws);
    }
  });
});

function broadcastToRoom(roomId: string, message: any, senderWs?: WebSocket) {
  const room = rooms.get(roomId);
  if (!room) return;
  const payload = JSON.stringify(message);
  for (const clientWs of room) {
    if (clientWs !== senderWs && clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(payload);
    }
  }
}

// Vite or Static Middleware setup
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
