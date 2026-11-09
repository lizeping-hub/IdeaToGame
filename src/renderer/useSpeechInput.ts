import { useEffect, useRef, useState } from 'react';
import type { VoiceInputControlProps } from './components/VoiceInputControl';

export function retainRecognizedText(previous: string, incoming: string): string {
  return incoming.trim() ? incoming : previous;
}

export function mergeDictationText(original: string, transcript: string): string {
  if (!transcript) return original;
  const separator = original && !/\s$/u.test(original) ? '\n' : '';
  return `${original}${separator}${transcript}`.slice(0, 12_000);
}

export function useSpeechInput(value: string, onText: (text: string) => void) {
  const [phase, setPhase] = useState<VoiceInputControlProps['phase']>('idle');
  const [levels, setLevels] = useState<number[]>(Array(32).fill(0));
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState('');
  const session = useRef<string | null>(null);
  const original = useRef('');
  const recognized = useRef('');
  const latestText = useRef(value);
  latestText.current = value;
  const updateText = useRef(onText);
  updateText.current = onText;
  const startedAt = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (typeof window.noobi.onSpeechInput !== 'function') return;
    const finish = () => {
      session.current = null;
      setPhase('idle');
      if (timer.current) clearInterval(timer.current);
      timer.current = null;
    };
    const unsubscribe = window.noobi.onSpeechInput((event) => {
      if (event.sessionId !== session.current) return;
      switch (event.type) {
        case 'listening':
          setPhase('listening');
          startedAt.current = Date.now();
          if (timer.current) clearInterval(timer.current);
          timer.current = setInterval(() => setSeconds(Math.floor((Date.now() - startedAt.current) / 1000)), 250);
          break;
        case 'stopping': setPhase('stopping'); break;
        case 'level': setLevels((current) => [...current.slice(1), event.level]); break;
        case 'transcript':
          recognized.current = retainRecognizedText(recognized.current, event.text);
          updateText.current(mergeDictationText(original.current, recognized.current));
          break;
        case 'finished':
          recognized.current = retainRecognizedText(recognized.current, event.text);
          updateText.current(mergeDictationText(original.current, recognized.current));
          if (!recognized.current.trim()) setError('没有听清，请靠近麦克风再说一次。');
          finish();
          break;
        case 'error': setError(event.message); finish(); break;
      }
    });
    return () => {
      unsubscribe();
      if (timer.current) clearInterval(timer.current);
      if (session.current) void window.noobi.stopSpeechInput(session.current, true).catch(() => {});
      session.current = null;
    };
  }, []);

  async function toggle() {
    if (phase === 'listening' && session.current) {
      setPhase('stopping');
      try { await window.noobi.stopSpeechInput(session.current); }
      catch { setPhase('listening'); setError('暂时无法停止语音输入，请再点一次停止按钮。'); }
      return;
    }
    if (session.current || phase !== 'idle') return;
    if (typeof window.noobi.startSpeechInput !== 'function') {
      setError('当前窗口尚未载入语音功能，请重新启动简游。');
      return;
    }
    setError('');
    original.current = latestText.current;
    recognized.current = '';
    session.current = crypto.randomUUID();
    setLevels(Array(32).fill(0));
    setSeconds(0);
    setPhase('starting');
    try { await window.noobi.startSpeechInput(session.current); }
    catch (cause) {
      session.current = null;
      setPhase('idle');
      const message = cause instanceof Error ? cause.message : String(cause);
      setError(message.replace(/^Error invoking remote method '[^']+': (?:Error: )?/u, ''));
    }
  }
  return { phase, levels, seconds, error, active: phase !== 'idle', toggle, dismissError: () => setError('') };
}
