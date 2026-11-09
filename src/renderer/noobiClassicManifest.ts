import noobiCarrySprite from './assets/ideatogame/packs/classic/frames/sprite-carry-a.png';
import noobiCelebrateSprite from './assets/ideatogame/packs/classic/frames/sprite-celebrate-a.png';
import noobiIdleSprite from './assets/ideatogame/packs/classic/frames/sprite-idle-a.png';
import noobiPaintSprite from './assets/ideatogame/packs/classic/frames/sprite-paint-a.png';
import noobiPlaySprite from './assets/ideatogame/packs/classic/frames/sprite-play-a.png';
import noobiRepairSprite from './assets/ideatogame/packs/classic/frames/sprite-repair-a.png';
import noobiSleepSprite from './assets/ideatogame/packs/classic/frames/sprite-sleep-a.png';
import noobiWalkASprite from './assets/ideatogame/packs/classic/frames/sprite-walk-a-a.png';
import noobiWalkBSprite from './assets/ideatogame/packs/classic/frames/sprite-walk-b-a.png';
import noobiWorkSprite from './assets/ideatogame/packs/classic/frames/sprite-work-a.png';
import noobiCoffeeASprite from './assets/ideatogame/packs/classic/frames/sprite-coffee-a.png';
import noobiCoffeeBSprite from './assets/ideatogame/packs/classic/frames/sprite-coffee-b.png';
import noobiInspectASprite from './assets/ideatogame/packs/classic/frames/sprite-inspect-a.png';
import noobiInspectBSprite from './assets/ideatogame/packs/classic/frames/sprite-inspect-b.png';
import noobiStretchASprite from './assets/ideatogame/packs/classic/frames/sprite-stretch-a.png';
import noobiStretchBSprite from './assets/ideatogame/packs/classic/frames/sprite-stretch-b.png';
import noobiSweepASprite from './assets/ideatogame/packs/classic/frames/sprite-sweep-a.png';
import noobiSweepBSprite from './assets/ideatogame/packs/classic/frames/sprite-sweep-b.png';
import noobiTypeASprite from './assets/ideatogame/packs/classic/frames/sprite-type-a.png';
import noobiTypeBSprite from './assets/ideatogame/packs/classic/frames/sprite-type-b.png';
import type {
  NoobiAnimation,
  NoobiAnimationFrame,
  NoobiSpriteManifest,
} from './noobiAnimation';

const frame = (src: string, durationMs: number): NoobiAnimationFrame => ({ src, durationMs });

const singleFrame = (
  id: string,
  src: string,
  durationMs = 800,
): NoobiAnimation => ({
  id,
  frames: [frame(src, durationMs)],
  loop: true,
  restFrame: 0,
});

const alternatingFrames = (
  id: string,
  frameA: string,
  frameB: string,
  durationMs = 220,
): NoobiAnimation => ({
  id,
  frames: [
    frame(frameA, durationMs),
    frame(frameB, durationMs),
    frame(frameA, durationMs),
    frame(frameB, durationMs + 80),
  ],
  loop: true,
  restFrame: 0,
});

/**
 * Compatibility manifest for the original 简游 sprite set.
 *
 * New character packs can replace this object with any number of authored
 * frames per pose. Keeping animation data outside the component means a pack
 * never needs pose-specific rendering code.
 */
export const CLASSIC_NOOBI_SPRITE_MANIFEST: NoobiSpriteManifest = {
  schemaVersion: 1,
  id: 'classic-noobi-v1',
  canvas: {
    width: 252,
    height: 336,
    pivot: { x: 126, y: 320 },
  },
  animations: {
    idle: singleFrame('classic-idle', noobiIdleSprite),
    think: singleFrame('classic-think', noobiIdleSprite),
    wait: singleFrame('classic-wait', noobiIdleSprite),
    walk: {
      id: 'classic-walk',
      frames: [
        frame(noobiWalkASprite, 150),
        frame(noobiWalkBSprite, 150),
        frame(noobiWalkASprite, 150),
        frame(noobiWalkBSprite, 150),
      ],
      loop: true,
      restFrame: 0,
    },
    work: singleFrame('classic-work', noobiWorkSprite),
    carry: singleFrame('classic-carry', noobiCarrySprite),
    paint: singleFrame('classic-paint', noobiPaintSprite),
    sleep: singleFrame('classic-sleep', noobiSleepSprite, 1_200),
    play: singleFrame('classic-play', noobiPlaySprite),
    repair: singleFrame('classic-repair', noobiRepairSprite),
    coffee: alternatingFrames('classic-coffee', noobiCoffeeASprite, noobiCoffeeBSprite, 360),
    stretch: alternatingFrames('classic-stretch', noobiStretchASprite, noobiStretchBSprite, 340),
    type: alternatingFrames('classic-type', noobiTypeASprite, noobiTypeBSprite, 150),
    inspect: alternatingFrames('classic-inspect', noobiInspectASprite, noobiInspectBSprite, 320),
    sweep: alternatingFrames('classic-sweep', noobiSweepASprite, noobiSweepBSprite, 240),
    celebrate: singleFrame('classic-celebrate', noobiCelebrateSprite),
  },
};
