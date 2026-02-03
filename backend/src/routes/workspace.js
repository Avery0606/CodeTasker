import express from 'express';
import fs from 'fs';

const router = express.Router();

export function setupWorkspaceRoutes(state) {
  const { currentWorkspaceRef, tasksRef, broadcast, loadTasks } = state;

  router.post('/open', (req, res) => {
    const { path: workspacePath } = req.body;
    console.log(`[Workspace] Opening: ${workspacePath}`);
    if (!fs.existsSync(workspacePath) || !fs.statSync(workspacePath).isDirectory()) {
      console.error(`[Workspace] Invalid path: ${workspacePath}`);
      return res.status(400).json({ error: 'Invalid workspace path' });
    }
    currentWorkspaceRef.value = workspacePath;
    tasksRef.value = loadTasks(workspacePath);
    console.log(`[Workspace] Loaded ${tasksRef.value.length} tasks`);
    broadcast('workspace:opened', { path: currentWorkspaceRef.value, taskCount: tasksRef.value.length });
    res.json({ success: true, path: currentWorkspaceRef.value, tasks: tasksRef.value });
  });

  router.get('/', (req, res) => {
    res.json({ path: currentWorkspaceRef.value, taskCount: tasksRef.value.length });
  });

  return router;
}
