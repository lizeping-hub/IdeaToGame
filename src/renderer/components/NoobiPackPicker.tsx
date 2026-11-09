import { Check, ChevronDown, Sparkles } from 'lucide-react';
import React, { type KeyboardEvent } from 'react';

import type { NoobiPackId } from '../../shared/contracts';
import classicAvatar from '../assets/ideatogame/packs/classic/frames/sprite-idle-a.png';
import classicScene from '../assets/ideatogame/packs/classic/scene.png';
import helloKittyAvatar from '../assets/ideatogame/packs/hellokitty/frames/sprite-idle-a.png';
import helloKittyScene from '../assets/ideatogame/packs/hellokitty/scene.png';
import mosslightAvatar from '../assets/ideatogame/packs/mosslight/frames/sprite-idle-a.png';
import mosslightScene from '../assets/ideatogame/packs/mosslight/scene.png';
import starforgeAvatar from '../assets/ideatogame/packs/starforge/frames/sprite-idle-a.png';
import starforgeScene from '../assets/ideatogame/packs/starforge/scene.png';
import twilightAvatar from '../assets/ideatogame/packs/twilight/frames/sprite-idle-a.png';
import twilightScene from '../assets/ideatogame/packs/twilight/scene.png';

export interface NoobiPackOption {
  id: NoobiPackId;
  name: string;
  eyebrow: string;
  description: string;
  avatarLabel: string;
  avatarDescription: string;
  sceneDescription: string;
  sceneImage: string;
  avatarImage: string;
}

export const NOOBI_PACK_OPTIONS: readonly NoobiPackOption[] = [
  {
    id: 'classic',
    name: '经典工坊',
    eyebrow: 'CLASSIC STUDIO',
    description: '蓝领巾卡皮巴拉与暖木制作室，适合日常游戏创作。',
    avatarLabel: '经典制作人',
    avatarDescription: '热情可靠的卡皮巴拉伙伴，陪你把第一个游戏创意变成作品。',
    sceneDescription: '靛蓝与暖木相映的制作室，备好了策划桌、装配台与试玩机。',
    sceneImage: classicScene,
    avatarImage: classicAvatar,
  },
  {
    id: 'mosslight',
    name: '松烟工坊',
    eyebrow: 'PINE TRAVELER ATELIER',
    description: '松烟旅人与森林研究室，带来探索与自然的氛围。',
    avatarLabel: '松烟旅人',
    avatarDescription: '披着松绿斗篷的卡皮巴拉旅人，喜欢地图、探索与自然故事。',
    sceneDescription: '松木、地图和植物标本围绕着工作台，琥珀小灯照亮安静的制作时光。',
    sceneImage: mosslightScene,
    avatarImage: mosslightAvatar,
  },
  {
    id: 'starforge',
    name: '晶械工坊',
    eyebrow: 'CRYSTAL MACHINE LAB',
    description: '晶械匠师与晶体机械间，带来动手搭建的氛围。',
    avatarLabel: '晶械匠师',
    avatarDescription: '带着晶体工具的卡皮巴拉匠师，喜欢机械、搭建与动手制作。',
    sceneDescription: '青蓝晶体为机械终端供能，工具台与沙盘让构想逐步成形。',
    sceneImage: starforgeScene,
    avatarImage: starforgeAvatar,
  },
  {
    id: 'twilight',
    name: '库洛米工坊',
    eyebrow: 'KUROMI STUDIO',
    description: '库洛米与紫黑创意室，让制作多一点个性。',
    avatarLabel: '库洛米',
    avatarDescription: '爱玩又有主见的创意伙伴，为制作时光添一点紫黑色的俏皮。',
    sceneDescription: '紫黑色创意室里摆满手工工具、蝴蝶结和俏皮的小物。',
    sceneImage: twilightScene,
    avatarImage: twilightAvatar,
  },
  {
    id: 'hellokitty',
    name: '白熊工坊',
    eyebrow: 'POLAR BEAR CAFE STUDIO',
    description: '白熊店长与咖啡制作室，带来从容的创作节奏。',
    avatarLabel: '白熊店长',
    avatarDescription: '从白熊咖啡厅走来的温和店长，带着咖啡香陪你慢慢打磨作品。',
    sceneDescription: '奶白色工作室融入咖啡吧台、书架与绿植，安静又温暖。',
    sceneImage: helloKittyScene,
    avatarImage: helloKittyAvatar,
  },
] as const;

export function noobiPackGridColumnCount(container: HTMLElement | null): number {
  if (!container) return 1;
  const tracks = getComputedStyle(container).gridTemplateColumns
    .split(/\s+/)
    .filter((track) => track && track !== 'none');
  return Math.max(1, tracks.length);
}

export function noobiPackLabel(id: NoobiPackId): string {
  return NOOBI_PACK_OPTIONS.find((option) => option.id === id)?.name ?? '经典工坊';
}

interface NoobiPackPickerProps {
  value: NoobiPackId | null;
  globalValue?: NoobiPackId;
  mode: 'global' | 'project';
  variant?: 'cards' | 'compact';
  presentation?: 'bundle' | 'character';
  disabled?: boolean;
  busy?: boolean;
  onChange: (value: NoobiPackId | null) => void;
}

export function NoobiPackPicker({
  value,
  globalValue = 'classic',
  mode,
  variant = 'cards',
  presentation = 'bundle',
  disabled = false,
  busy = false,
  onChange,
}: NoobiPackPickerProps) {
  const resolvedValue = value ?? globalValue;
  const resolvedOption = NOOBI_PACK_OPTIONS.find((option) => option.id === resolvedValue)
    ?? NOOBI_PACK_OPTIONS[0];

  if (variant === 'compact') {
    return (
      <label
        className={`noobi-pack-compact is-${resolvedValue}${value === null ? ' is-inherited' : ''}`}
        title={disabled ? 'Agent 运行期间不能切换制作场景' : '选择这个项目的伙伴形象与制作场景'}
      >
        <span
          className="noobi-pack-compact-swatch"
          aria-hidden="true"
          style={{ backgroundImage: `url(${resolvedOption.sceneImage})` }}
        >
          <img src={resolvedOption.avatarImage} alt="" draggable={false} />
        </span>
        <span className="noobi-pack-compact-copy" aria-hidden="true">
          <small>{mode === 'global' ? '默认场景' : value === null ? '跟随全局' : '项目场景'}</small>
          <strong>{busy ? '保存中…' : noobiPackLabel(resolvedValue)}</strong>
        </span>
        <select
          aria-label="项目伙伴形象与制作场景"
          value={value ?? 'inherit'}
          disabled={disabled || busy}
          onChange={(event) => {
            const nextValue = event.target.value;
            onChange(nextValue === 'inherit' ? null : nextValue as NoobiPackId);
          }}
        >
          {mode === 'project' ? (
            <option value="inherit">跟随全局（当前：{noobiPackLabel(globalValue)}）</option>
          ) : null}
          {NOOBI_PACK_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>{option.name} · {option.avatarLabel}</option>
          ))}
        </select>
        <ChevronDown size={12} aria-hidden="true" />
      </label>
    );
  }

  const options: Array<NoobiPackOption & { inherited?: boolean }> = mode === 'project'
    ? [{
        ...NOOBI_PACK_OPTIONS.find((option) => option.id === globalValue)!,
        id: globalValue,
        name: `跟随全局 · ${noobiPackLabel(globalValue)}`,
        eyebrow: 'FOLLOW GLOBAL',
        description: '项目会自动使用设置中的全局默认主题包。',
        inherited: true,
      }, ...NOOBI_PACK_OPTIONS]
    : [...NOOBI_PACK_OPTIONS];

  function selectAt(index: number) {
    const option = options[index];
    if (!option) return;
    onChange(option.inherited ? null : option.id);
  }

  function handleArrowKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const container = event.currentTarget.parentElement;
    const columnCount = noobiPackGridColumnCount(container);
    let nextIndex = index;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = options.length - 1;
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + options.length) % options.length;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % options.length;
    if (event.key === 'ArrowUp') nextIndex = Math.max(0, index - columnCount);
    if (event.key === 'ArrowDown') nextIndex = Math.min(options.length - 1, index + columnCount);
    const nextButton = container?.querySelector<HTMLButtonElement>(`button[data-pack-index="${nextIndex}"]`);
    nextButton?.focus();
    selectAt(nextIndex);
  }

  return (
    <div
      className={`noobi-pack-picker mode-${mode} presentation-${presentation}`}
      role="radiogroup"
      aria-label={presentation === 'character'
        ? '选择默认伙伴'
        : mode === 'global' ? '默认伙伴形象与制作场景' : '项目伙伴形象与制作场景'}
      aria-busy={busy}
    >
      {options.map((option, index) => {
        const selected = option.inherited ? value === null : value === option.id;
        return (
          <button
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={presentation === 'character'
              ? `${option.avatarLabel}：${option.avatarDescription}`
              : `${option.name}：${option.description}`}
            data-pack-kind={presentation}
            data-pack-index={index}
            className={`noobi-pack-card pack-${option.id}${selected ? ' is-selected' : ''}${option.inherited ? ' is-inherited' : ''}`}
            key={option.inherited ? 'inherit' : option.id}
            disabled={disabled || busy}
            tabIndex={selected || (!options.some((item) => item.inherited ? value === null : value === item.id) && index === 0) ? 0 : -1}
            onKeyDown={(event) => handleArrowKey(event, index)}
            onClick={() => selectAt(index)}
          >
            <span
              className={`noobi-pack-preview${presentation === 'character' ? ' noobi-character-preview' : ''}`}
              aria-hidden="true"
            >
              {presentation === 'bundle' ? (
                <img
                  className="noobi-pack-scene-image"
                  src={option.sceneImage}
                  alt=""
                  draggable={false}
                />
              ) : <span className="noobi-character-pixel-grid" />}
              <img
                className={`noobi-pack-avatar-image${presentation === 'character' ? ' noobi-character-avatar-image' : ''}`}
                src={option.avatarImage}
                alt=""
                draggable={false}
              />
              {option.inherited ? <Sparkles className="noobi-pack-follow-icon" size={17} /> : null}
            </span>
            <span className="noobi-pack-card-copy">
              <small>{presentation === 'character' ? 'IDEATOGAME CHARACTER' : option.eyebrow}</small>
              <strong>{presentation === 'character' ? option.avatarLabel : option.name}</strong>
              <span>{presentation === 'character' ? option.avatarDescription : option.description}</span>
            </span>
            <span className="noobi-pack-check" aria-hidden="true"><Check size={13} /></span>
          </button>
        );
      })}
    </div>
  );
}
