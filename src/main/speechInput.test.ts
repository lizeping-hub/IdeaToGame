import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SpeechInputEvent } from '../shared/contracts';

const mocks = vi.hoisted(() => ({ spawn: vi.fn(), access: vi.fn() }));
vi.mock('node:child_process', () => ({ spawn: mocks.spawn }));
vi.mock('node:fs/promises', () => ({ access: mocks.access }));
import { SpeechInputService } from './speechInput';

const id = '00000000-0000-4000-8000-000000000001';
const tick = () => new Promise((resolve) => setImmediate(resolve));
function childProcess() {
  return Object.assign(new EventEmitter(), {
    stdin: new PassThrough(), stdout: new PassThrough(), stderr: new PassThrough(), kill: vi.fn(),
  });
}
const originalPlatform = process.platform;
beforeEach(() => {
  Object.defineProperty(process, 'platform', { value: 'darwin' });
  mocks.access.mockResolvedValue(undefined);
});
afterEach(() => {
  Object.defineProperty(process, 'platform', { value: originalPlatform });
  vi.restoreAllMocks(); vi.clearAllMocks();
});

describe('native dictation lifecycle', () => {
  it('keeps the final transcript, bounds levels, and does not emit duplicate failures on exit', async () => {
    const child = childProcess(); mocks.spawn.mockReturnValue(child);
    const events: SpeechInputEvent[] = [];
    const service = new SpeechInputService('/helper', (event) => events.push(event));
    await service.start(id);
    child.stdout.write('{"type":"listening"}\n{"type":"level","level":5}\n{"type":"transcript","text":"做一个小猫游戏"}\n');
    await tick();
    service.stop(id);
    expect(child.stdin.read()?.toString()).toBe('stop\n');
    child.stdout.write('{"type":"finished","text":"做一个小猫游戏。"}\n');
    await tick(); child.emit('close', 0, null);
    expect(events).toContainEqual({ sessionId: id, type: 'level', level: 1 });
    expect(events.at(-1)).toEqual({ sessionId: id, type: 'finished', text: '做一个小猫游戏。' });
    expect(events.filter((event) => event.type === 'error')).toHaveLength(0);
  });

  it('cancels a pending launch without opening the microphone', async () => {
    let ready!: () => void;
    mocks.access.mockImplementation(() => new Promise<void>((resolve) => { ready = resolve; }));
    const service = new SpeechInputService('/helper', () => {});
    const starting = service.start(id);
    service.stop(id, true); ready(); await starting;
    expect(mocks.spawn).not.toHaveBeenCalled();
  });

  it('ignores another session stop and kills its own recording on disposal', async () => {
    const child = childProcess(); mocks.spawn.mockReturnValue(child);
    const service = new SpeechInputService('/helper', () => {});
    await service.start(id);
    service.stop('another-session', true);
    expect(child.kill).not.toHaveBeenCalled();
    await expect(service.start(id)).rejects.toThrow('尚未结束');
    service.cancel(); expect(child.kill).toHaveBeenCalledWith('SIGTERM');
  });

  it('surfaces permission errors once, with no transcript logging', async () => {
    const child = childProcess(); mocks.spawn.mockReturnValue(child);
    const events: SpeechInputEvent[] = [];
    const service = new SpeechInputService('/helper', (event) => events.push(event));
    await service.start(id);
    child.stdout.write('{"type":"error","message":"未获得麦克风权限"}\n');
    await tick(); child.emit('close', 1, null);
    expect(events).toEqual([{ sessionId: id, type: 'error', message: '未获得麦克风权限' }]);
  });
  it('waits for stdout to drain after process exit before classifying the session', async () => {
    const child = childProcess(); mocks.spawn.mockReturnValue(child);
    const events: SpeechInputEvent[] = [];
    const service = new SpeechInputService('/helper', (event) => events.push(event));
    await service.start(id);
    child.emit('exit', 0, null);
    child.stdout.write('{"type":"finished","text":"最终文字"}\n');
    await tick(); child.emit('close', 0, null);
    expect(events.at(-1)).toEqual({ sessionId: id, type: 'finished', text: '最终文字' });
    expect(events.some((event) => event.type === 'error')).toBe(false);
  });

  it('explains a privacy abort rather than suggesting a missing user transcript', async () => {
    const child = childProcess(); mocks.spawn.mockReturnValue(child);
    const events: SpeechInputEvent[] = [];
    const service = new SpeechInputService('/helper', (event) => events.push(event));
    await service.start(id);
    child.emit('close', null, 'SIGABRT');
    expect(events).toEqual([{ sessionId: id, type: 'error', message: '语音组件被系统权限检查终止。请从简游应用图标重新启动后再试。' }]);
  });

  it('retains the last nonempty transcription when silence produces empty callbacks and a blank final', async () => {
    const child = childProcess(); mocks.spawn.mockReturnValue(child);
    const events: SpeechInputEvent[] = [];
    const service = new SpeechInputService('/helper', (event) => events.push(event));
    await service.start(id);
    for (const message of [
      { type: 'transcript', text: '小猫收集金币' },
      { type: 'transcript', text: '' },
      { type: 'transcript', text: '   ' },
      { type: 'finished', text: '' },
    ]) child.stdout.write(JSON.stringify(message) + '\n');
    await tick(); child.emit('close', 0, null);
    expect(events.at(-1)).toEqual({ sessionId: id, type: 'finished', text: '小猫收集金币' });
    expect(events.filter((event) => event.type === 'transcript').every((event) => event.text === '小猫收集金币')).toBe(true);
  });

});
