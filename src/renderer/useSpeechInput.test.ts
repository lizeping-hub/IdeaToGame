import { describe, expect, it } from 'vitest';
import { mergeDictationText, retainRecognizedText } from './useSpeechInput';

describe('dictation text merge', () => {
  it('preserves typed text and replaces partial recognition without duplicating it', () => {
    const original = '制作一个冒险游戏';
    expect(mergeDictationText(original, '主角是')).toBe('制作一个冒险游戏\n主角是');
    expect(mergeDictationText(original, '主角是一只小猫')).toBe('制作一个冒险游戏\n主角是一只小猫');
    expect(mergeDictationText(original, '')).toBe(original);
  });
  it('keeps empty inputs and respects the prompt length limit', () => {
    expect(mergeDictationText('', '做一个赛车游戏')).toBe('做一个赛车游戏');
    expect(mergeDictationText('已有需求\n', '再加金币')).toBe('已有需求\n再加金币');
    const original = 'a'.repeat(11996);
    const result = mergeDictationText(original, 'abcdefg');
    expect(result).toHaveLength(12000);
    expect(result.startsWith(original)).toBe(true);
  });
});

describe('recognized text retention', () => {
  it('preserves speech across empty partials, whitespace and an empty final', () => {
    let recognized = '';
    for (const text of ['小猫', '小猫收集金币', '', '   ', '']) {
      recognized = retainRecognizedText(recognized, text);
    }
    expect(recognized).toBe('小猫收集金币');
    expect(mergeDictationText('原有需求', recognized)).toBe('原有需求\n小猫收集金币');
  });
  it('allows meaningful corrections without duplicating the previous hypothesis', () => {
    expect(retainRecognizedText('小狗', '小猫')).toBe('小猫');
    expect(retainRecognizedText('', '')).toBe('');
  });
});
