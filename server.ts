/**
 * Echoward: Reino das Cinzas - Unified Full-Stack Application Server
 * Runs the authoritative Express & WebSocket multiplayer server together
 * with the Vite development middleware in dev, and static production serving.
 */

import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { createEchowardApp, setupWebSocketServer } from './server/src/server';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const app = createEchowardApp();
const server = http.createServer(app);

// Initialize authoritative WebSocket multiplayer server
setupWebSocketServer(server);

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
    app.use(await import('express').then((m) => m.default.static(distPath)));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Echoward Server] Servidor Multiplayer ativo em http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup error:', err);
  process.exit(1);
});
