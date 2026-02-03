import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { loadTasks } from '../utils/fileOps.js';

const router = express.Router();

export function setupTaskRoutes(state) {
  const { currentWorkspaceRef, tasksRef, broadcast, saveTasks } = state;

  function generateKey() {
    return uuidv4();
  }

  router.get('/', (req, res) => {
    tasksRef.value = loadTasks(currentWorkspaceRef.value);
    res.json({ tasks: tasksRef.value });
  });

  router.post('/create', (req, res) => {
    const { name, prompt } = req.body;
    const task = {
      uniqueKey: generateKey(),
      name,
      prompt,
      status: 'pending',
      order: tasksRef.value.length,
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
      output: ''
    };
    tasksRef.value.push(task);
    saveTasks(tasksRef.value, currentWorkspaceRef.value);
    console.log(`[Task] Created: ${task.uniqueKey} - ${name}`);
    broadcast('task:created', task);
    res.json(task);
  });

  router.put('/order', (req, res) => {
    const { orderedKeys } = req.body;
    const newTasks = [];
    orderedKeys.forEach(key => {
      const task = tasksRef.value.find(t => t.uniqueKey === key);
      if (task) {
        task.order = newTasks.length;
        newTasks.push(task);
      }
    });
    tasksRef.value = newTasks;
    saveTasks(tasksRef.value, currentWorkspaceRef.value);
    broadcast('tasks:reordered', { tasks: tasksRef.value });
    res.json({ success: true });
  });

  router.put('/:key', (req, res) => {
    const { key } = req.params;
    const { name, prompt } = req.body;
    const task = tasksRef.value.find(t => t.uniqueKey === key);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    if (name !== undefined) task.name = name;
    if (prompt !== undefined) task.prompt = prompt;
    saveTasks(tasksRef.value, currentWorkspaceRef.value);
    broadcast('task:updated', task);
    res.json(task);
  });

  router.delete('/:key', (req, res) => {
    const { key } = req.params;
    const index = tasksRef.value.findIndex(t => t.uniqueKey === key);
    if (index === -1) {
      console.error(`[Task] Delete failed - not found: ${key}`);
      return res.status(404).json({ error: 'Task not found' });
    }
    const taskName = tasksRef.value[index]?.name || 'unknown';
    tasksRef.value.splice(index, 1);
    tasksRef.value.forEach((t, i) => t.order = i);
    saveTasks(tasksRef.value, currentWorkspaceRef.value);
    console.log(`[Task] Deleted: ${key} - ${taskName}`);
    broadcast('task:deleted', { key });
    res.json({ success: true });
  });

  router.put('/:key/status', (req, res) => {
    const { key } = req.params;
    const { status } = req.body;
    const task = tasksRef.value.find(t => t.uniqueKey === key);
    if (!task) {
      console.error(`[Task] Status update failed - not found: ${key}`);
      return res.status(404).json({ error: 'Task not found' });
    }
    const oldStatus = task.status;
    task.status = status;
    if (status === 'running') {
      task.startedAt = new Date().toISOString();
    } else if (status === 'completed' || status === 'failed') {
      task.completedAt = new Date().toISOString();
    }
    saveTasks(tasksRef.value, currentWorkspaceRef.value);
    console.log(`[Task] Status: ${key} ${oldStatus} -> ${status}`);
    broadcast('task:status', { key, status });
    res.json(task);
  });

  router.put('/:key/output', (req, res) => {
    const { key } = req.params;
    const { output, append } = req.body;
    const task = tasksRef.value.find(t => t.uniqueKey === key);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    if (append) {
      task.output += output;
    } else {
      task.output = output;
    }
    saveTasks(tasksRef.value, currentWorkspaceRef.value);
    broadcast('task:output', { key, output, append });
    res.json(task);
  });

  return router;
}
