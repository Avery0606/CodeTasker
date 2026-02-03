import { execSync } from 'child_process';

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
    const command = `opencode run "${this.task.prompt}" --format json`;
    console.log(`[Executor] Starting task: ${this.task.uniqueKey} - ${this.task.name}`);
    console.log(`[Executor] Command: ${command}`);

    try {
      const output = execSync(command, {
        cwd: this.workspace,
        encoding: 'utf8'
      });

      const lines = output.trim().split('\n');
      let formattedOutput = '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.type === 'text' && parsed.part?.text) {
            formattedOutput += `[${parsed.part.type}] ${parsed.part.text}\n`;
          } else if (parsed.type === 'step_start' && parsed.part?.snapshot) {
            formattedOutput += `[开始步骤] ${parsed.part.snapshot}\n`;
          } else if (parsed.type === 'step_finish') {
            formattedOutput += `[完成步骤]\n`;
          }
        } catch (e) {
          formattedOutput += line + '\n';
        }
      }

      if (!formattedOutput.trim()) {
        formattedOutput = output;
      }

      this.emit('output', { key: this.task.uniqueKey, output: formattedOutput, append: false });
      this.emit('complete', { success: true });
      console.log(`[Executor] Task completed: ${this.task.uniqueKey}`);
    } catch (err) {
      console.error(`[Executor] Task failed: ${this.task.uniqueKey} - ${err.message}`);
      this.emit('output', { key: this.task.uniqueKey, output: `Error: ${err.message}`, append: true });
      this.emit('complete', { success: false });
    }
  }

  kill() {
  }
}
