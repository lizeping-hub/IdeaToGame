import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { createInterface } from 'node:readline';
import { access } from 'node:fs/promises';
import type { SpeechInputEvent } from '../shared/contracts.js';

interface ActiveSession {
  id: string;
  child: ChildProcessWithoutNullStreams;
  text: string;
  done: boolean;
  stopTimer?: NodeJS.Timeout;
}

/** Audio and transcription stay in the native on-device recognizer, never on disk. */
export class SpeechInputService {
  #active: ActiveSession | null = null;
  #pending: string | null = null;
  constructor(readonly executable: string, readonly emit: (event: SpeechInputEvent) => void) {}

  async start(id: string): Promise<void> {
    if (!/^[a-f0-9-]{36}$/iu.test(id)) throw new Error('无效的语音输入会话');
    if (process.platform !== 'darwin') throw new Error('当前版本的语音输入支持 macOS。');
    if (this.#active || this.#pending) throw new Error('语音输入尚未结束，请稍后再试。');
    this.#pending = id;
    try { await access(this.executable); }
    catch {
      if (this.#pending === id) this.#pending = null;
      throw new Error('语音输入组件尚未就绪，请重新构建并启动简游。');
    }
    if (this.#pending !== id) return;
    this.#pending = null;
    const child = spawn(this.executable, [], { stdio: ['pipe', 'pipe', 'pipe'] });
    const session: ActiveSession = { id, child, text: '', done: false };
    this.#active = session;
    child.stdin.on('error', () => {});
    const lines = createInterface({ input: child.stdout });
    lines.on('line', (line) => {
      if (session.done || line.length > 100_000) return;
      let message: Record<string, unknown>;
      try {
        const parsed: unknown = JSON.parse(line);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return;
        message = parsed as Record<string, unknown>;
      } catch { return; }
      switch (message.type) {
        case 'listening': case 'stopping':
          this.emit({ sessionId: id, type: message.type });
          break;
        case 'level':
          if (typeof message.level === 'number' && Number.isFinite(message.level)) {
            this.emit({ sessionId: id, type: 'level', level: Math.max(0, Math.min(1, message.level)) });
          }
          break;
        case 'transcript': case 'finished': {
          if (typeof message.text !== 'string') return;
          if (message.text.trim()) session.text = message.text.slice(0, 12_000);
          if (message.type === 'finished') this.#finish(session);
          else this.emit({ sessionId: id, type: 'transcript', text: session.text });
          break;
        }
        case 'error':
          this.#finish(session, typeof message.message === 'string' ? message.message.slice(0, 500) : '语音识别中断，请重试。');
      }
    });
    // Drain native diagnostics without persisting or exposing audio/transcript data.
    child.stderr.resume();
    child.once('error', () => this.#finish(session, '无法启动语音输入，请重新启动简游后重试。'));
    child.once('close', (_code, signal) => {
      lines.close();
      if (!session.done) {
        const message = signal === 'SIGABRT'
          ? '语音组件被系统权限检查终止。请从简游应用图标重新启动后再试。'
          : '语音输入意外中断，请重试。';
        this.#finish(session, message);
      }
    });
  }

  stop(id: string, cancel = false): void {
    if (this.#pending === id && cancel) this.#pending = null;
    const session = this.#active;
    if (!session || session.id !== id || session.done) return;
    if (cancel) {
      session.child.kill('SIGTERM');
      this.#finish(session);
      return;
    }
    if (session.stopTimer) return;
    session.child.stdin.write('stop\n');
    session.stopTimer = setTimeout(() => {
      session.child.kill('SIGKILL');
      this.#finish(session);
    }, 8_000);
    session.stopTimer.unref();
  }

  cancel(): void {
    this.#pending = null;
    if (this.#active) this.stop(this.#active.id, true);
  }

  #finish(session: ActiveSession, error?: string): void {
    if (session.done) return;
    session.done = true;
    if (session.stopTimer) clearTimeout(session.stopTimer);
    if (this.#active === session) this.#active = null;
    if (session.text) this.emit({ sessionId: session.id, type: 'transcript', text: session.text });
    this.emit(error ? { sessionId: session.id, type: 'error', message: error }
      : { sessionId: session.id, type: 'finished', text: session.text });
  }
}
