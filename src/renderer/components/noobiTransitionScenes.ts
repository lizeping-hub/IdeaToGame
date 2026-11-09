import poster0 from '../assets/ideatogame/transitions/classic-poster.png';
import poster1 from '../assets/ideatogame/transitions/crystal-poster.png';
import poster2 from '../assets/ideatogame/transitions/pine-poster.png';
import poster3 from '../assets/ideatogame/transitions/sporelight-poster.png';
import poster4 from '../assets/ideatogame/transitions/moonbay-poster.png';
import poster5 from '../assets/ideatogame/transitions/polarbear-poster.png';
import poster6 from '../assets/ideatogame/transitions/night-v2-poster.png';
import poster7 from '../assets/ideatogame/transitions/kuromi-poster.png';
import poster8 from '../assets/ideatogame/transitions/dawn-v2-poster.png';
import cozyWorkshopGif from '../assets/ideatogame/transitions/classic.gif';
import crystalLabGif from '../assets/ideatogame/transitions/crystal.gif';
import forestCampGif from '../assets/ideatogame/transitions/pine.gif';
import potionGardenGif from '../assets/ideatogame/transitions/kuromi.gif';
import rooftopStudioGif from '../assets/ideatogame/transitions/dawn-v2.gif';
import seasideArcadeGif from '../assets/ideatogame/transitions/moonbay.gif';
import skyDockGif from '../assets/ideatogame/transitions/sporelight.gif';
import snowCabinGif from '../assets/ideatogame/transitions/polarbear.gif';
import starObservatoryGif from '../assets/ideatogame/transitions/night-v2.gif';

export const NOOBI_TRANSITION_SCENES = [
  cozyWorkshopGif,
  crystalLabGif,
  forestCampGif,
  skyDockGif,
  seasideArcadeGif,
  snowCabinGif,
  starObservatoryGif,
  potionGardenGif,
  rooftopStudioGif,
] as const;

export const NOOBI_TRANSITION_SCENE_COUNT = NOOBI_TRANSITION_SCENES.length;

export function noobiTransitionSceneIndex(runId: number): number {
  if (!Number.isFinite(runId) || runId <= 1) return 0;
  return (Math.floor(runId) - 1) % NOOBI_TRANSITION_SCENE_COUNT;
}

export function noobiTransitionSceneForRun(runId: number): string {
  return NOOBI_TRANSITION_SCENES[noobiTransitionSceneIndex(runId)];
}

const TRANSITION_POSTERS = [poster0, poster1, poster2, poster3, poster4, poster5, poster6, poster7, poster8] as const;

export function noobiTransitionPosterForRun(runId: number): string {
  return TRANSITION_POSTERS[noobiTransitionSceneIndex(runId)];
}
