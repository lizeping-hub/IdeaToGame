import type { ModelOption } from '../shared/contracts.js';

const GAME_MODELS = [
  ['gpt-6.1-sol', 'GPT-6.1 Sol'],
  ['gpt-6-astra', 'GPT-6 Astra'],
  ['gpt-6.1-terra', 'GPT-6.1 Terra'],
  ['gpt-6-sol', 'GPT-6 Sol'],
  ['gpt-6-luna', 'GPT-6 Luna'],
  ['gpt-5.6-sol', 'GPT-5.6 Sol'],
  ['gpt-5.6-terra', 'GPT-5.6 Terra'],
  ['gpt-5.6-luna', 'GPT-5.6 Luna'],
] as const;

/** Only expose requested models actually advertised by the active Codex runtime. */
export function gameModelOptions(available: readonly ModelOption[]): ModelOption[] {
  const options = GAME_MODELS.flatMap(([id, displayName]) => {
    const model = available.find((item) => item.model === id);
    return model ? [{ ...model, displayName }] : [];
  });
  if (options.length > 0 && !options.some((model) => model.isDefault)) {
    options[0] = { ...options[0]!, isDefault: true };
  }
  return options;
}
