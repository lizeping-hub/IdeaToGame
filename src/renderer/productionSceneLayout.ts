import type { NoobiPackId } from '../shared/contracts';
import type { ProductionDepthObject, ProductionMapPoint } from './productionMapNavigation';

export type ProductionLayoutId = NoobiPackId | 'collaboration';
interface SceneCalibration {
  x: readonly number[];
  y: readonly number[];
}

// Calibrated to the approved 1586×992 rooms. Routes remain in the canonical
// navigation graph; a monotone warp aligns every segment with the new floor.
// Unlike changing just the destination, this also maps roaming and depth.
const CALIBRATIONS: Record<ProductionLayoutId, SceneCalibration> = {
  classic:       { x: [0, 25.5, 45, 65, 100], y: [0, 36.5, 62.5, 86.5, 100] },
  mosslight:     { x: [0, 25.5, 45, 65, 100], y: [0, 36.5, 63.5, 86, 100] },
  starforge:     { x: [0, 25.5, 45, 65, 100], y: [0, 37, 62.5, 86, 100] },
  twilight:      { x: [0, 26, 45, 65, 100], y: [0, 36.5, 63.5, 87, 100] },
  hellokitty:    { x: [0, 27, 45, 65, 100], y: [0, 36, 64, 87, 100] },
  collaboration:{ x: [0, 26.5, 45, 65, 100], y: [0, 36.5, 64, 87, 100] },
};
const X_KNOTS = [0, 25, 45, 65, 100];
const Y_KNOTS = [0, 38, 62, 85, 100];

function interpolate(value: number, input: readonly number[], output: readonly number[]): number {
  const bounded = Math.max(0, Math.min(100, value));
  const i = input.findIndex((end, index) => index > 0 && bounded <= end);
  if (i < 1) return output.at(-1)!;
  const fraction = (bounded - input[i - 1]!) / (input[i]! - input[i - 1]!);
  return output[i - 1]! + fraction * (output[i]! - output[i - 1]!);
}

export function productionScenePoint(point: ProductionMapPoint, id: ProductionLayoutId): ProductionMapPoint {
  const calibration = CALIBRATIONS[id];
  return {
    x: interpolate(point.x, X_KNOTS, calibration.x),
    y: interpolate(point.y, Y_KNOTS, calibration.y),
  };
}

const mask = (id: string, depthY: number, polygon: string): ProductionDepthObject => ({
  id, depthY, clipPath: `polygon(${polygon})`,
});

// These silhouettes belong to the new artwork, not the retired room cutouts.
// Only front faces are copied over an actor: no arbitrary rectangular crops.
const ROOM_FRONTS: readonly ProductionDepthObject[] = [
  mask('brief-desk', 35.5, '5% 12%,18.5% 12%,18.5% 30%,16% 31%,16% 35.5%,12% 35.5%,12% 31%,6% 30%,5% 26%'),
  mask('design-table', 33, '20% 0%,41% 0%,41% 29%,32.6% 29%,32.6% 33%,28% 33%,28% 29%,20% 29%'),
  mask('assembly-bench', 34, '42% 0%,64% 0%,64% 30%,54.5% 30%,54.5% 34%,50.5% 34%,50.5% 30%,42% 30%'),
  mask('asset-easel', 30.5, '68% 0%,79% 0%,79% 28%,74% 30.5%,70% 29.5%,68% 28%'),
  mask('asset-paint-rack', 36.8, '79% 0%,100% 0%,100% 36.8%,82% 36.8%,79% 34%'),
  mask('code-console', 68, '2% 57%,19.5% 58.5%,23.5% 56%,23.5% 61%,18% 66%,5% 68%,2% 63%'),
  mask('world-map-table', 67, '70% 52%,96% 52%,96% 59%,88% 67%,70% 60%'),
  mask('bed', 83, '83% 73%,100% 73%,100% 82%,85% 83%,83% 77%'),
  mask('playtest-arcade', 94, '63% 79%,75% 80%,75% 91.5%,67% 94%,63% 88%'),
  mask('arcade-bookcases', 99, '74% 76%,91.5% 76%,92% 99%,74% 99%'),
  mask('delivery-lounge', 90, '4% 80%,24% 78%,23% 87.5%,12% 90%,4% 85%'),
  mask('delivery-rear-rail', 79, '21% 67%,40% 68%,41% 74%,39% 79%,26% 78%,21% 73%'),
  mask('delivery-front-rail', 100, '0% 91%,20% 93%,23% 96%,30% 89%,41% 91%,41% 100%,0% 100%'),
];

const CAFE_FRONTS = ROOM_FRONTS.map(front => front.id === 'code-console'
  ? mask('code-console', 69, '2% 55%,22% 55%,25% 58%,25% 64%,18% 69%,5% 68%,2% 64%')
  : front);

export function productionSceneOccluders(id: ProductionLayoutId): readonly ProductionDepthObject[] {
  return id === 'hellokitty' ? CAFE_FRONTS : ROOM_FRONTS;
}
