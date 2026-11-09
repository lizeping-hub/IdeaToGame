import { LoaderCircle, Mic, Square } from 'lucide-react';
import './voice-input.css';

export interface VoiceInputControlProps {
  phase: 'idle' | 'starting' | 'listening' | 'stopping';
  levels: readonly number[];
  seconds: number;
  disabled: boolean;
  onToggle: () => void;
}

export function VoiceInputControl({ phase, levels, seconds, disabled, onToggle }: VoiceInputControlProps) {
  const listening = phase === 'listening';
  const pending = phase === 'starting' || phase === 'stopping';
  const label = listening ? '停止语音输入' : phase === 'starting' ? '正在开启麦克风' : phase === 'stopping' ? '正在整理文字' : '开始语音输入';
  return (
    <div className={`voice-input-control phase-${phase}`}>
      {phase !== 'idle' ? (
        <div className="voice-input-strip" role="status" aria-live="polite">
          <span className="voice-input-label">{listening ? '正在聆听' : phase === 'starting' ? '正在开启麦克风…' : '正在整理文字…'}</span>
          <span className="voice-input-wave" aria-hidden="true">
            {Array.from({ length: 32 }, (_, index) => (
              <i key={index} style={{ height: `${3 + Math.min(1, Math.max(0, levels[index] ?? 0)) * 21}px` }} />
            ))}
          </span>
          <time aria-hidden="true">{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</time>
        </div>
      ) : null}
      <button
        className={`voice-input-button${listening ? ' is-listening' : ''}`}
        type="button"
        aria-label={label}
        aria-pressed={listening}
        title={listening ? '停止语音输入，文字会保留在输入框' : label}
        disabled={disabled || pending}
        onClick={onToggle}
      >
        {pending ? <LoaderCircle className="voice-input-spinner" size={19} />
          : listening ? <Square size={13} fill="currentColor" strokeWidth={0} />
            : <Mic size={20} strokeWidth={1.8} />}
      </button>
    </div>
  );
}
