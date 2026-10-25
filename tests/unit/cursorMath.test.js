import { describe, it, expect } from 'vitest';
import {
  normalizeAngle,
  shortestAngleDelta,
  stepAngle,
  computeHeading,
  pruneTrailPoints,
  computeSmoothTrailSegments,
  computeSmoothMidpoints
} from '../../src/core/cursor.js';

describe('Cursor Math & Trail Engine (src/core/cursor.js)', () => {
  describe('normalizeAngle(rad)', () => {
    it('keeps angles within [-π, π] unchanged', () => {
      expect(normalizeAngle(0)).toBe(0);
      expect(normalizeAngle(Math.PI / 2)).toBeCloseTo(Math.PI / 2);
      expect(normalizeAngle(-Math.PI / 2)).toBeCloseTo(-Math.PI / 2);
      expect(normalizeAngle(Math.PI)).toBeCloseTo(Math.PI);
      expect(normalizeAngle(-Math.PI)).toBeCloseTo(-Math.PI);
    });

    it('wraps angles > π into [-π, π]', () => {
      // 1.5π -> -0.5π
      expect(normalizeAngle(1.5 * Math.PI)).toBeCloseTo(-0.5 * Math.PI);
      // 2π -> 0
      expect(normalizeAngle(2 * Math.PI)).toBeCloseTo(0);
      // 3π -> π
      expect(normalizeAngle(3 * Math.PI)).toBeCloseTo(Math.PI);
      // 2.25π -> 0.25π
      expect(normalizeAngle(2.25 * Math.PI)).toBeCloseTo(0.25 * Math.PI);
    });

    it('wraps angles < -π into [-π, π]', () => {
      // -1.5π -> 0.5π
      expect(normalizeAngle(-1.5 * Math.PI)).toBeCloseTo(0.5 * Math.PI);
      // -2π -> 0
      expect(normalizeAngle(-2 * Math.PI)).toBeCloseTo(0);
      // -3π -> -π
      expect(normalizeAngle(-3 * Math.PI)).toBeCloseTo(-Math.PI);
    });

    it('returns 0 for non-finite values', () => {
      expect(normalizeAngle(NaN)).toBe(0);
      expect(normalizeAngle(Infinity)).toBe(0);
      expect(normalizeAngle(-Infinity)).toBe(0);
    });
  });

  describe('shortestAngleDelta(fromRad, toRad)', () => {
    it('calculates standard difference when within [-π, π]', () => {
      expect(shortestAngleDelta(0, Math.PI / 2)).toBeCloseTo(Math.PI / 2);
      expect(shortestAngleDelta(Math.PI / 2, 0)).toBeCloseTo(-Math.PI / 2);
    });

    it('computes shortest delta across the +180° / -180° boundary', () => {
      // 170° to -170° is +20° (turning clockwise across boundary), not -340°
      const degToRad = (d) => (d * Math.PI) / 180;
      const radToDeg = (r) => (r * 180) / Math.PI;

      const from170 = degToRad(170);
      const toMinus170 = degToRad(-170);

      const delta = shortestAngleDelta(from170, toMinus170);
      expect(radToDeg(delta)).toBeCloseTo(20, 5);

      // And reverse: -170° to 170° is -20°
      const reverseDelta = shortestAngleDelta(toMinus170, from170);
      expect(radToDeg(reverseDelta)).toBeCloseTo(-20, 5);
    });

    it('handles identical angles correctly', () => {
      expect(shortestAngleDelta(1.2, 1.2)).toBe(0);
    });
  });

  describe('stepAngle(currentRad, targetRad, smoothing)', () => {
    it('interpolates toward target by factor smoothing along shortest path', () => {
      const from = 0;
      const target = Math.PI;
      const stepped = stepAngle(from, target, 0.5);
      expect(stepped).toBeCloseTo(Math.PI / 2);
    });

    it('steps across the +/- π boundary smoothly', () => {
      const degToRad = (d) => (d * Math.PI) / 180;
      const radToDeg = (r) => (r * 180) / Math.PI;

      // From 170° toward -170° by 50% factor: should arrive at 180° / -180°
      const from = degToRad(170);
      const to = degToRad(-170);
      const stepped = stepAngle(from, to, 0.5);

      // 170° + (+20° * 0.5) = 180°
      expect(Math.abs(radToDeg(stepped))).toBeCloseTo(180, 5);
    });

    it('clamps smoothing factor between 0 and 1', () => {
      expect(stepAngle(0, Math.PI, 0)).toBe(0);
      expect(stepAngle(0, Math.PI, 1)).toBeCloseTo(Math.PI);
    });
  });

  describe('computeHeading(dx, dy, minSpeed)', () => {
    it('returns null when movement speed is below threshold (< 0.6 by default)', () => {
      expect(computeHeading(0, 0)).toBeNull();
      expect(computeHeading(0.2, 0.2)).toBeNull(); // hypot ~ 0.28 < 0.6
      expect(computeHeading(0.3, 0.4, 0.6)).toBeNull(); // hypot = 0.5 < 0.6
    });

    it('returns correct radian angle for cardinal directions', () => {
      // East (right, +X): 0
      expect(computeHeading(10, 0)).toBeCloseTo(0);
      // South (down, +Y): π / 2
      expect(computeHeading(0, 10)).toBeCloseTo(Math.PI / 2);
      // West (left, -X): π
      expect(computeHeading(-10, 0)).toBeCloseTo(Math.PI);
      // North (up, -Y): -π / 2
      expect(computeHeading(0, -10)).toBeCloseTo(-Math.PI / 2);
    });

    it('returns correct angle for diagonal movement', () => {
      // South-East: π / 4
      expect(computeHeading(10, 10)).toBeCloseTo(Math.PI / 4);
      // North-East: -π / 4
      expect(computeHeading(10, -10)).toBeCloseTo(-Math.PI / 4);
    });
  });

  describe('pruneTrailPoints(points, nowMs, maxAgeMs, maxPoints)', () => {
    it('prunes points older than nowMs - maxAgeMs (default 380ms)', () => {
      const now = 1000;
      const points = [
        { x: 10, y: 10, t: 500 }, // age = 500ms > 380 -> drop
        { x: 20, y: 20, t: 610 }, // age = 390ms > 380 -> drop
        { x: 30, y: 30, t: 630 }, // age = 370ms <= 380 -> keep
        { x: 40, y: 40, t: 950 }  // age = 50ms <= 380 -> keep
      ];

      const pruned = pruneTrailPoints(points, now, 380, 80);
      expect(pruned).toHaveLength(2);
      expect(pruned[0].t).toBe(630);
      expect(pruned[1].t).toBe(950);
    });

    it('caps the buffer length at maxPoints returning the newest points', () => {
      const now = 1000;
      const points = [];
      for (let i = 0; i < 100; i++) {
        points.push({ x: i, y: i, t: 900 + i }); // all within 100ms
      }

      const capped = pruneTrailPoints(points, now, 380, 40);
      expect(capped).toHaveLength(40);
      expect(capped[0].x).toBe(60);
      expect(capped[capped.length - 1].x).toBe(99);
    });

    it('handles empty or malformed input arrays safely', () => {
      expect(pruneTrailPoints([], 1000)).toEqual([]);
      expect(pruneTrailPoints(null, 1000)).toEqual([]);
      expect(pruneTrailPoints([null, undefined, { x: 'bad' }], 1000)).toEqual([]);
    });
  });

  describe('computeSmoothTrailSegments(points)', () => {
    it('returns empty array for less than 2 points', () => {
      expect(computeSmoothTrailSegments([])).toEqual([]);
      expect(computeSmoothTrailSegments([{ x: 1, y: 1, t: 100 }])).toEqual([]);
    });

    it('creates 1 midpoint segment for exactly 2 points', () => {
      const pts = [
        { x: 0, y: 0, t: 100 },
        { x: 10, y: 10, t: 200 }
      ];
      const segments = computeSmoothTrailSegments(pts);
      expect(segments).toHaveLength(1);
      expect(segments[0]).toEqual({
        fromX: 0,
        fromY: 0,
        cpX: 5,
        cpY: 5,
        toX: 10,
        toY: 10,
        t: 200
      });
    });

    it('produces continuous connected quadratic spline segments for 3 or more points', () => {
      const pts = [
        { x: 0, y: 0, t: 100 },
        { x: 10, y: 20, t: 150 },
        { x: 30, y: 40, t: 200 },
        { x: 60, y: 50, t: 250 }
      ];

      const segments = computeSmoothTrailSegments(pts);
      expect(segments.length).toBeGreaterThanOrEqual(2);

      // Verify each segment starts exactly where the previous segment ended (continuous line with zero gaps)
      for (let i = 0; i < segments.length - 1; i++) {
        expect(segments[i].toX).toBe(segments[i + 1].fromX);
        expect(segments[i].toY).toBe(segments[i + 1].fromY);
      }

      // Verify start and end coordinates match the input extremities
      expect(segments[0].fromX).toBe(pts[0].x);
      expect(segments[0].fromY).toBe(pts[0].y);
      expect(segments[segments.length - 1].toX).toBe(pts[pts.length - 1].x);
      expect(segments[segments.length - 1].toY).toBe(pts[pts.length - 1].y);
    });

    it('exports computeSmoothMidpoints as an identical alias', () => {
      expect(computeSmoothMidpoints).toBe(computeSmoothTrailSegments);
    });
  });
});
