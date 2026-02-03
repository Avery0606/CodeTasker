import { Executor } from './executor.js';

export class QueueManager {
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
