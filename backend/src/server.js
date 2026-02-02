import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

let currentWorkspace = null;
let tasks = [];
let wsClients = new Set();

const TASKS_FILE = 'code-tasks.json';

function broadcast(event, data) {
  const message = JSON.stringify({ event, data });
  wsClients.forEach(client => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
}

function saveTasks() {
  if (!currentWorkspace) return;
  const filePath = path.join(currentWorkspace, TASKS_FILE);
  fs.writeFileSync(filePath, JSON.stringify({ tasks }, null, 2));
}

function loadTasks() {
  if (!currentWorkspace) return [];
  const filePath = path.join(currentWorkspace, TASKS_FILE);
  if (fs.existsSync(filePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      return data.tasks || [];
    } catch (e) {
      return [];
    }
  }
  return [];
}

function generateKey() {
  return uuidv4();
}

app.post('/api/workspace/open', (req, res) => {
  const { path: workspacePath } = req.body;
  if (!fs.existsSync(workspacePath) || !fs.statSync(workspacePath).isDirectory()) {
    return res.status(400).json({ error: 'Invalid workspace path' });
  }
  currentWorkspace = workspacePath;
  tasks = loadTasks();
  broadcast('workspace:opened', { path: currentWorkspace, taskCount: tasks.length });
  res.json({ success: true, path: currentWorkspace, tasks });
});



app.get('/api/workspace', (req, res) => {
  res.json({ path: currentWorkspace, taskCount: tasks.length });
});

app.get('/api/tasks', (req, res) => {
  res.json({ tasks });
});

app.post('/api/tasks', (req, res) => {
  const { name, prompt } = req.body;
  const task = {
    uniqueKey: generateKey(),
    name,
    prompt,
    status: 'pending',
    order: tasks.length,
    createdAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
    output: ''
  };
  tasks.push(task);
  saveTasks();
  broadcast('task:created', task);
  res.json(task);
});

app.put('/api/tasks/:key', (req, res) => {
  const { key } = req.params;
  const { name, prompt } = req.body;
  const task = tasks.find(t => t.uniqueKey === key);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  if (name !== undefined) task.name = name;
  if (prompt !== undefined) task.prompt = prompt;
  saveTasks();
  broadcast('task:updated', task);
  res.json(task);
});

app.delete('/api/tasks/:key', (req, res) => {
  const { key } = req.params;
  const index = tasks.findIndex(t => t.uniqueKey === key);
  if (index === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }
  tasks.splice(index, 1);
  tasks.forEach((t, i) => t.order = i);
  saveTasks();
  broadcast('task:deleted', { key });
  res.json({ success: true });
});

app.put('/api/tasks/order', (req, res) => {
  const { orderedKeys } = req.body;
  const newTasks = [];
  orderedKeys.forEach(key => {
    const task = tasks.find(t => t.uniqueKey === key);
    if (task) {
      task.order = newTasks.length;
      newTasks.push(task);
    }
  });
  tasks = newTasks;
  saveTasks();
  broadcast('tasks:reordered', { tasks });
  res.json({ success: true });
});

app.put('/api/tasks/:key/status', (req, res) => {
  const { key } = req.params;
  const { status } = req.body;
  const task = tasks.find(t => t.uniqueKey === key);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  task.status = status;
  if (status === 'running') {
    task.startedAt = new Date().toISOString();
  } else if (status === 'completed' || status === 'failed') {
    task.completedAt = new Date().toISOString();
  }
  saveTasks();
  broadcast('task:status', { key, status });
  res.json(task);
});

app.put('/api/tasks/:key/output', (req, res) => {
  const { key } = req.params;
  const { output, append } = req.body;
  const task = tasks.find(t => t.uniqueKey === key);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  if (append) {
    task.output += output;
  } else {
    task.output = output;
  }
  saveTasks();
  broadcast('task:output', { key, output, append });
  res.json(task);
});

let queueManager = null;

app.post('/api/queue/start', (req, res) => {
  const { concurrency = 1 } = req.body;
  if (!currentWorkspace) {
    return res.status(400).json({ error: 'No workspace selected' });
  }
  if (queueManager && queueManager.running) {
    return res.status(400).json({ error: 'Queue already running' });
  }
  queueManager = new QueueManager(concurrency, currentWorkspace, tasks, broadcast);
  queueManager.on('task:output', (data) => broadcast('task:output', data));
  queueManager.on('task:started', (data) => broadcast('task:started', data));
  queueManager.on('task:completed', (data) => broadcast('task:completed', data));
  queueManager.on('task:failed', (data) => broadcast('task:failed', data));
  queueManager.on('queue:status', (data) => broadcast('queue:status', data));
  queueManager.start();
  res.json({ success: true, concurrency });
});

app.post('/api/queue/stop', (req, res) => {
  if (queueManager) {
    queueManager.stop();
    queueManager = null;
  }
  res.json({ success: true });
});

app.put('/api/queue/concurrency', (req, res) => {
  const { concurrency } = req.body;
  if (queueManager) {
    queueManager.setConcurrency(concurrency);
  }
  res.json({ success: true });
});

app.get('/api/queue/status', (req, res) => {
  if (queueManager) {
    res.json({
      running: queueManager.running,
      concurrency: queueManager.concurrency,
      runningCount: queueManager.runningTasks.size,
      pendingCount: queueManager.pendingTasks.length
    });
  } else {
    res.json({ running: false, concurrency: 1, runningCount: 0, pendingCount: 0 });
  }
});

class QueueManager {
  constructor(concurrency, workspace, tasks, broadcast) {
    this.concurrency = concurrency;
    this.workspace = workspace;
    this.running = true;
    this.runningTasks = new Map();
    this.pendingTasks = tasks.filter(t => t.status === 'pending');
    this.broadcast = broadcast;
    this.activeExecutors = [];
  }

  on(event, handler) {
    if (!this._events) this._events = {};
    this._events[event] = handler;
  }

  emit(event, data) {
    if (this._events && this._events[event]) {
      this._events[event](data);
    }
  }

  start() {
    this.emit('queue:status', {
      running: true,
      concurrency: this.concurrency,
      runningCount: 0,
      pendingCount: this.pendingTasks.length
    });
    this.processQueue();
  }

  stop() {
    this.running = false;
    this.activeExecutors.forEach(executor => executor.kill());
    this.emit('queue:status', {
      running: false,
      concurrency: this.concurrency,
      runningCount: 0,
      pendingCount: this.pendingTasks.length
    });
  }

  setConcurrency(n) {
    this.concurrency = n;
    this.processQueue();
  }

  processQueue() {
    while (this.runningTasks.size < this.concurrency && this.pendingTasks.length > 0 && this.running) {
      const task = this.pendingTasks.shift();
      this.executeTask(task);
    }
    if (this.runningTasks.size === 0 && this.pendingTasks.length === 0 && this.running) {
      this.running = false;
      this.emit('queue:status', {
        running: false,
        concurrency: this.concurrency,
        runningCount: 0,
        pendingCount: 0
      });
    }
  }

  executeTask(task) {
    task.status = 'running';
    this.runningTasks.set(task.uniqueKey, task);
    this.emit('task:started', { key: task.uniqueKey });
    this.emit('queue:status', {
      running: true,
      concurrency: this.concurrency,
      runningCount: this.runningTasks.size,
      pendingCount: this.pendingTasks.length
    });

    const executor = new Executor(this.workspace, task);
    this.activeExecutors.push(executor);

    executor.on('output', (data) => {
      this.emit('task:output', data);
    });

    executor.on('complete', (data) => {
      this.runningTasks.delete(task.uniqueKey);
      task.status = data.success ? 'completed' : 'failed';
      task.completedAt = new Date().toISOString();
      this.activeExecutors = this.activeExecutors.filter(e => e !== executor);
      this.emit('task:completed', { key: task.uniqueKey, success: data.success });
      this.processQueue();
    });

    executor.start();
  }
}

class Executor {
  constructor(workspace, task) {
    this.workspace = workspace;
    this.task = task;
    this.process = null;
    this._events = {};
  }

  on(event, handler) {
    this._events[event] = handler;
  }

  emit(event, data) {
    if (this._events[event]) {
      this._events[event](data);
    }
  }

  start() {
    const command = `opencode run "${this.task.prompt}" --format json`;
    const { execSync } = require('child_process');

    try {
      const output = execSync(command, {
        cwd: this.workspace,
        encoding: 'utf8'
      });

      let formattedOutput = output;
      try {
        const parsed = JSON.parse(output);
        formattedOutput = JSON.stringify(parsed, null, 2);
      } catch (e) {
      }

      this.emit('output', { key: this.task.uniqueKey, output: formattedOutput, append: false });
      this.emit('complete', { success: true });
    } catch (err) {
      this.emit('output', { key: this.task.uniqueKey, output: `Error: ${err.message}`, append: true });
      this.emit('complete', { success: false });
    }
  }

  kill() {
  }
}

wss.on('connection', (ws) => {
  wsClients.add(ws);
  ws.on('close', () => wsClients.delete(ws));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
