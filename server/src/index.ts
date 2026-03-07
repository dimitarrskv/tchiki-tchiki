import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { config } from './config';
import { RoomManager } from './rooms/RoomManager';
import { registerSocketHandlers } from './socket/handlers';
import type { ClientToServerEvents, ServerToClientEvents } from 'shared/src/types';

const app = express();
const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: config.clientUrl,
    methods: ['GET', 'POST'],
  },
});

app.use(cors({ origin: config.clientUrl }));
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', rooms: roomManager.roomCount });
});

// Initialize room manager and socket handlers
const roomManager = new RoomManager();
registerSocketHandlers(io, roomManager);

httpServer.listen(config.port, () => {
  console.log(`🎵 Spotifight server running on port ${config.port}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  roomManager.destroy();
  httpServer.close();
});
