import { describe, expect, it } from 'vitest';
import type { ModelOption } from '../shared/contracts.js';
import { gameModelOptions } from './gameModelOptions';

const model = (id: string, isDefault = false): ModelOption => ({
  id, model: id, displayName: id, description: 'Runtime metadata',
  isDefault, defaultEffort: 'medium', efforts: ['low', 'medium', 'high'],
});

describe('game model catalog', () => {
  it('orders the eight requested models and normalizes their display names', () => {
    const ids = ['gpt-6.1-sol', 'gpt-6-astra', 'gpt-6.1-terra', 'gpt-6-sol',
      'gpt-6-luna', 'gpt-5.6-sol', 'gpt-5.6-terra', 'gpt-5.6-luna'];
    const result = gameModelOptions([...ids].reverse().map((id) => model(id, id === ids[0])));
    expect(result.map((item) => item.model)).toEqual(ids);
    expect(result.map((item) => item.displayName)).toEqual([
      'GPT-6.1 Sol', 'GPT-6 Astra', 'GPT-6.1 Terra', 'GPT-6 Sol',
      'GPT-6 Luna', 'GPT-5.6 Sol', 'GPT-5.6 Terra', 'GPT-5.6 Luna',
    ]);
    expect(result[0]?.efforts).toEqual(['low', 'medium', 'high']);
  });

  it('omits unavailable and unrequested models without inventing availability', () => {
    expect(gameModelOptions([model('gpt-5.5', true), model('gpt-6-astra')]))
      .toEqual([{ ...model('gpt-6-astra', true), displayName: 'GPT-6 Astra' }]);
    expect(gameModelOptions([])).toEqual([]);
  });
});
