import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import { logger } from './middlewares/logger.js';
import { createBroadcast } from './utils/broadcast.js';
import { saveTasks, loadTasks } from './utils/fileOps.js';
import { setupWorkspaceRoutes } from './routes/workspace.js';
import { setupTaskRoutes } from './routes/tasks.js';
import { setupQueueRoutes } from './routes/queue.js';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json());
app.use(logger);

const wsClients = new Set();
const broadcast = createBroadcast(wsClients);

const state = {
  currentWorkspaceRef: { value: null },
  tasksRef: { value: [] },
  broadcast,
  saveTasks,
  loadTasks
};

app.use('/api/workspace', setupWorkspaceRoutes(state));
app.use('/api/tasks', setupTaskRoutes(state));
app.use('/api/queue', setupQueueRoutes(state));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

wss.on('connection', (ws) => {
  wsClients.add(ws);
  console.log(`[WebSocket] Client connected. Total: ${wsClients.size}`);
  ws.on('close', () => {
    wsClients.delete(ws);
    console.log(`[WebSocket] Client disconnected. Total: ${wsClients.size}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
