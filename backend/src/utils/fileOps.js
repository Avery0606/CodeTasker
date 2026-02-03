import fs from 'fs';
import path from 'path';

export const TASKS_FILE = 'code-tasks.json';

export function saveTasks(tasks, workspace) {
  if (!workspace) return;
  const filePath = path.join(workspace, TASKS_FILE);
  fs.writeFileSync(filePath, JSON.stringify({ tasks }, null, 2));
}

export function loadTasks(workspace) {
  if (!workspace) return [];
  const filePath = path.join(workspace, TASKS_FILE);
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
