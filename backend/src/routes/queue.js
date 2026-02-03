import express from 'express';
import { QueueManager } from '../services/queueManager.js';

const router = express.Router();

export function setupQueueRoutes(state) {
  const { currentWorkspaceRef, tasksRef, broadcast } = state;
  let queueManager = null;

  router.post('/start', (req, res) => {
    const { concurrency = 1 } = req.body;
    if (!currentWorkspaceRef.value) {
      console.error('[Queue] Start failed - no workspace');
      return res.status(400).json({ error: 'No workspace selected' });
    }
    if (queueManager && queueManager.running) {
      console.warn('[Queue] Start failed - already running');
      return res.status(400).json({ error: 'Queue already running' });
    }
    queueManager = new QueueManager(concurrency, currentWorkspaceRef.value, tasksRef, broadcast);
    queueManager.on('task:output', (data) => broadcast('task:output', data));
    queueManager.on('task:started', (data) => broadcast('task:started', data));
    queueManager.on('task:completed', (data) => broadcast('task:completed', data));
    queueManager.on('task:failed', (data) => broadcast('task:failed', data));
    queueManager.on('queue:status', (data) => broadcast('queue:status', data));
    queueManager.start();
    console.log(`[Queue] Started with concurrency: ${concurrency}`);
    res.json({ success: true, concurrency });
  });

  router.post('/stop', (req, res) => {
    if (queueManager) {
      console.log('[Queue] Stopping...');
      queueManager.stop();
      queueManager = null;
      console.log('[Queue] Stopped');
    }
    res.json({ success: true });
  });

  router.put('/concurrency', (req, res) => {
    const { concurrency } = req.body;
    if (queueManager) {
      console.log(`[Queue] Concurrency changed: ${queueManager.concurrency} -> ${concurrency}`);
      queueManager.setConcurrency(concurrency);
    }
    res.json({ success: true });
  });

  router.get('/status', (req, res) => {
    if (queueManager) {
      console.log(`[Queue] Status: running=${queueManager.running}, running=${queueManager.runningTasks.size}, pending=${queueManager.pendingTasks.length}`);
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

  return router;
}
