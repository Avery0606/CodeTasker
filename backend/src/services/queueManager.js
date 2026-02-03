import { Executor } from './executor.js';

export class QueueManager {
  constructor(concurrency, workspace, tasks, broadcast) {
    this.concurrency = concurrency;
    this.workspace = workspace;
    this.running = false;
    this.pendingTasks = [...tasks.filter(t => t.status === 'pending')];
    this.broadcast = broadcast;
    this.executionChain = Promise.resolve();
    this.currentBatchPromises = [];
    this.batchInProgress = false;
    this.taskResults = new Map();
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
    this.running = true;
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
    this.executionChain = this.executionChain.then(() => {
      this.currentBatchPromises.forEach(p => {
        if (p._executor && p._executor.kill) {
          p._executor.kill();
        }
      });
    });
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

  executeTask(task) {
    return new Promise((resolve) => {
      task.status = 'running';
      const uniqueKey = task.uniqueKey;
      console.log(`[Queue] Executing task: ${uniqueKey} - ${task.name}`);
      this.emit('task:started', { key: uniqueKey });

      const executor = new Executor(this.workspace, task);
      executor._task = task;

      executor.on('output', (data) => {
        this.emit('task:output', data);
      });

      executor.on('complete', (data) => {
        task.status = data.success ? 'completed' : 'failed';
        task.completedAt = new Date().toISOString();
        this.taskResults.set(uniqueKey, data);
        console.log(`[Queue] Task completed: ${uniqueKey}, success=${data.success}`);
        this.emit('task:completed', { key: uniqueKey, success: data.success });
        resolve(data);
      });

      executor.start();
    });
  }

  processQueue() {
    if (!this.running || this.pendingTasks.length === 0) {
      if (this.running && this.pendingTasks.length === 0 && this.currentBatchPromises.length === 0) {
        this.running = false;
        this.emit('queue:status', {
          running: false,
          concurrency: this.concurrency,
          runningCount: 0,
          pendingCount: 0
        });
      }
      return;
    }

    if (this.batchInProgress) {
      return;
    }

    this.batchInProgress = true;
    const batchSize = Math.min(this.concurrency, this.pendingTasks.length);
    const batchPromises = [];

    for (let i = 0; i < batchSize; i++) {
      const task = this.pendingTasks.shift();
      const promise = this.executeTask(task);
      promise._executor = task.executor;
      batchPromises.push(promise);
    }

    this.currentBatchPromises = batchPromises;

    this.executionChain = this.executionChain.then(async () => {
      try {
        await Promise.allSettled(batchPromises);
      } catch (e) {
        console.error('[Queue] Batch execution error:', e);
      }

      this.currentBatchPromises = [];
      this.batchInProgress = false;

      if (this.pendingTasks.length === 0) {
        this.running = false;
        this.emit('queue:status', {
          running: false,
          concurrency: this.concurrency,
          runningCount: 0,
          pendingCount: 0
        });
      } else {
        this.emit('queue:status', {
          running: true,
          concurrency: this.concurrency,
          runningCount: 0,
          pendingCount: this.pendingTasks.length
        });
        this.processQueue();
      }
    });
  }
}
