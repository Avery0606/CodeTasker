import { spawn } from 'child_process';

export class Executor {
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
    const fullCommand = `opencode run "${this.task.prompt.replace(/"/g, '\\"')}" --format json`;

    console.log(`[Executor] Starting task: ${this.task.uniqueKey} - ${this.task.name}`);

    const proc = spawn('cmd.exe', ['/c', fullCommand], {
      cwd: this.workspace,
      encoding: 'utf8',
      windowsHide: true,
      env: { ...process.env, PATH: process.env.PATH }
    });

    this.process = proc;

    let stdoutBuffer = '';
    let stderrBuffer = '';

    proc.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      stdoutBuffer += text;
      const lines = stdoutBuffer.split('\n');
      stdoutBuffer = lines.pop() || '';

      for (const line of lines) {
        this.processLine(line);
      }
    });

    proc.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      stderrBuffer += text;
      const lines = stderrBuffer.split('\n');
      stderrBuffer = lines.pop() || '';

      for (const line of lines) {
        this.emit('output', {
          key: this.task.uniqueKey,
          output: `[stderr] ${line}\n`,
          append: true
        });
      }
    });

    proc.on('close', (code) => {
      if (stdoutBuffer.trim()) {
        this.processLine(stdoutBuffer);
      }
      if (stderrBuffer.trim()) {
        this.emit('output', {
          key: this.task.uniqueKey,
          output: `[stderr] ${stderrBuffer}\n`,
          append: true
        });
      }

      if (code === 0) {
        this.emit('complete', { success: true });
      } else {
        this.emit('output', {
          key: this.task.uniqueKey,
          output: `\nProcess exited with code ${code}`,
          append: true
        });
        this.emit('complete', { success: false });
      }
    });

    proc.on('error', (err) => {
      this.emit('output', {
        key: this.task.uniqueKey,
        output: `Error: ${err.message}`,
        append: true
      });
      this.emit('complete', { success: false });
    });

    setTimeout(() => {
      if (proc.exitCode === null && !proc.killed) {
        console.log(`[Executor] Task timeout - killing process`);
        proc.kill();
        this.emit('complete', { success: false });
      }
    }, 60000);
  }

  processLine(line) {
    if (!line.trim()) return;

    try {
      const parsed = JSON.parse(line);
      let output = '';

      if (parsed.type === 'text' && parsed.part?.text) {
        output = `[${parsed.part.type}] ${parsed.part.text}`;
      } else if (parsed.type === 'step_start' && parsed.part?.snapshot) {
        output = `[开始步骤] ${parsed.part.snapshot}`;
      } else if (parsed.type === 'step_finish') {
        output = `[完成步骤]`;
      } else {
        return;
      }

      this.emit('output', {
        key: this.task.uniqueKey,
        output: output + '\n',
        append: true
      });
    } catch (e) {
    }
  }

  kill() {
    if (this.process) {
      this.process.kill();
    }
  }
}
