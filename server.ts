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

// API health endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', game: 'Echoward: Reino das Cinzas', timestamp: Date.now() });
});

// Realtime Multiplayer WebSocket Server
interface ConnectedClient {
  ws: WebSocket;
  id: string;
  name: string;
  roomId: string;
  colorIndex: number;
}

const clients = new Map<WebSocket, ConnectedClient>();
const rooms = new Map<string, Set<WebSocket>>();

const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws: WebSocket) => {
  let clientId = 'wanderer_' + Math.random().toString(36).substring(2, 8);

  ws.on('message', (messageData: string) => {
    try {
      const data = JSON.parse(messageData.toString());

      if (data.type === 'join') {
        const roomId = (data.roomId || 'reino_lumen').trim().toUpperCase();
        const playerName = (data.name || 'Viajante').substring(0, 16);
        const colorIndex = typeof data.colorIndex === 'number' ? data.colorIndex : 0;

        // Leave existing room if any
        const existing = clients.get(ws);
        if (existing && rooms.has(existing.roomId)) {
          rooms.get(existing.roomId)!.delete(ws);
          broadcastToRoom(existing.roomId, {
            type: 'player_leave',
            id: existing.id
          }, ws);
        }

        const clientInfo: ConnectedClient = {
          ws,
          id: clientId,
          name: playerName,
          roomId,
          colorIndex
        };
        clients.set(ws, clientInfo);

        if (!rooms.has(roomId)) {
          rooms.set(roomId, new Set());
        }
        rooms.get(roomId)!.add(ws);

        // Send confirmation to the joining player
        ws.send(JSON.stringify({
          type: 'joined_room',
          id: clientId,
          roomId,
          playersCount: rooms.get(roomId)!.size
        }));

        // Notify others in the room
        broadcastToRoom(roomId, {
          type: 'player_joined',
          id: clientId,
          name: playerName,
          colorIndex
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
        if (room.size === 0) {
          rooms.delete(client.roomId);
        } else {
          broadcastToRoom(client.roomId, {
            type: 'player_leave',
            id: client.id
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
