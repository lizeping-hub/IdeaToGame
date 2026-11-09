import { describe, expect, it } from 'vitest';
import { NOOBI_PACK_IDS } from '../shared/contracts';
import { WORKSHOP_NAVIGATION_NODES } from './productionMapNavigation';
import { productionSceneOccluders, productionScenePoint, type ProductionLayoutId } from './productionSceneLayout';

describe('approved room calibration', () => {
  const layouts: ProductionLayoutId[] = [...NOOBI_PACK_IDS, 'collaboration'];
  it('places the brief desk approach in the narrow floor lane above the coding counter', () => {
    for (const layout of layouts) {
      const point = productionScenePoint({ x: 14, y: 39 }, layout);
      expect(point.y).toBeGreaterThan(36);
      expect(point.y).toBeLessThan(39);
    }
  });
  it('keeps the entire navigation graph inside every new room without reversing a walking segment', () => {
    for (const layout of layouts) {
      for (const node of WORKSHOP_NAVIGATION_NODES) {
        const p = productionScenePoint(node, layout);
        expect(p.x).toBeGreaterThan(0);
        expect(p.x).toBeLessThan(100);
        expect(p.y).toBeGreaterThan(0);
        expect(p.y).toBeLessThan(100);
        for (const neighborId of node.neighbors) {
          const neighbor = WORKSHOP_NAVIGATION_NODES.find(n => n.id === neighborId)!;
          const q = productionScenePoint(neighbor, layout);
          expect(Math.sign(q.x - p.x)).toBe(Math.sign(neighbor.x - node.x));
          expect(Math.sign(q.y - p.y)).toBe(Math.sign(neighbor.y - node.y));
        }
      }
    }
  });
  it('moves the cafe terminal approach clear of its wider counter and uses its own front silhouette', () => {
    const point = productionScenePoint({ x: 26, y: 61 }, 'hellokitty');
    expect(point.x).toBeGreaterThan(27);
    expect(point.y).toBeGreaterThan(62);
    const cafe = productionSceneOccluders('hellokitty').find(x => x.id === 'code-console');
    const classic = productionSceneOccluders('classic').find(x => x.id === 'code-console');
    expect(cafe?.clipPath).not.toBe(classic?.clipPath);
    expect(cafe?.depthY).toBe(69);
  });
});
