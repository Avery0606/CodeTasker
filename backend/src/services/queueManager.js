import { Executor } from './executor.js';
import { saveTasks } from '../utils/fileOps.js';

export class QueueManager {
  constructor(concurrency, workspace, tasksRef, broadcast) {
    this.concurrency = concurrency;
    this.workspace = workspace;
    this.running = false;
    this.broadcast = broadcast;
    this.tasksRef = tasksRef;
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
    const pendingTasks = this.tasksRef.value.filter(t => t.status === 'pending');
    if (pendingTasks.length === 0) {
      console.log('[Queue] No pending tasks to run');
      return;
    }
    this.running = true;
    this.emit('queue:status', {
      running: true,
      concurrency: this.concurrency,
      runningCount: 0,
      pendingCount: pendingTasks.length
    });
    this.processQueue();
  }

  stop() {
    this.running = false;
    this.emit('queue:status', {
      running: false,
      concurrency: this.concurrency,
      runningCount: 0,
      pendingCount: 0
    });
  }

  setConcurrency(n) {
    this.concurrency = n;
    if (this.running) {
      this.processQueue();
    }
  }

  processQueue() {
    if (!this.running) return;

    const pendingTasks = this.tasksRef.value.filter(t => t.status === 'pending');
    if (pendingTasks.length === 0) {
      this.running = false;
      this.emit('queue:status', {
        running: false,
        concurrency: this.concurrency,
        runningCount: 0,
        pendingCount: 0
      });
      return;
    }

    const batchSize = Math.min(this.concurrency, pendingTasks.length);
    const batchPromises = [];

    for (let i = 0; i < batchSize; i++) {
      const pendingTask = pendingTasks[i];
      const task = this.tasksRef.value.find(t => t.uniqueKey === pendingTask.uniqueKey);
      if (!task) continue;

      task.status = 'running';
      task.startedAt = new Date().toISOString();
      saveTasks(this.tasksRef.value, this.workspace);
      this.emit('task:started', { key: task.uniqueKey });

      const executor = new Executor(this.workspace, task);
      const promise = new Promise((resolve) => {
        executor.on('output', (data) => {
          this.emit('task:output', data);
        });

        executor.on('complete', (data) => {
          const currentTask = this.tasksRef.value.find(t => t.uniqueKey === task.uniqueKey);
          if (currentTask) {
            currentTask.status = data.success ? 'completed' : 'failed';
            currentTask.completedAt = new Date().toISOString();
            saveTasks(this.tasksRef.value, this.workspace);
            console.log('[Queue] Task completed:', currentTask.name, '- status:', currentTask.status);
          }
          this.emit('task:completed', { key: task.uniqueKey, success: data.success });
          resolve(data);
        });

        executor.start();
      });

      batchPromises.push(promise);
    }

    Promise.allSettled(batchPromises).then(() => {
      this.processQueue();
    });
  }
}
