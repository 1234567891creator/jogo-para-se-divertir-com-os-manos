/**
 * Echoward: Reino das Cinzas - Standalone Server Entry Point
 * Designed for deployment on Render, Railway, Fly.io, Cloud Run, or VPS
 */

import http from 'http';
import dotenv from 'dotenv';
import { createEchowardApp, setupWebSocketServer } from './server';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const app = createEchowardApp();
const server = http.createServer(app);

setupWebSocketServer(server);

server.listen(PORT, HOST, () => {
  console.log('====================================================');
  console.log(`[Echoward Server] Servidor Multiplayer Online Ativo!`);
  console.log(`[Echoward Server] Porta: ${PORT}`);
  console.log(`[Echoward Server] WebSocket: ws://${HOST}:${PORT}/ws`);
  console.log(`[Echoward Server] Health Check: http://${HOST}:${PORT}/health`);
  console.log('====================================================');
});
