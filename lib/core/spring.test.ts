import { describe, expect, it } from 'vitest';
import {
  criticalSpringAt,
  pushSample,
  releaseCurve,
  releaseVelocity,
  springSettleMs,
  SPRING_EASING_STOPS,
  SPRING_RESPONSE_S,
  VELOCITY_MAX_SAMPLES,
} from './spring';

describe('criticalSpringAt — closed form, damping ratio 1 (35 § ב6 · apple-design § 4)', () => {
  it('starts exactly at `from` with the handed-off velocity (apple-design § 5)', () => {
    const s = criticalSpringAt({ from: 100, velocity: -800, target: 0, tS: 0 });
    expect(s.x).toBe(100);
    expect(s.v).toBe(-800);
  });
  it('arrives at the target', () => {
    expect(criticalSpringAt({ from: 100, velocity: 0, target: 0, tS: 2 }).x).toBeCloseTo(0, 3);
    expect(criticalSpringAt({ from: 100, velocity: 0, target: 495, tS: 2 }).x).toBeCloseTo(495, 3);
  });
  it('never overshoots with zero initial velocity — monotonic, no bounce', () => {
    let previous = 100;
    for (let ms = 1; ms <= 600; ms += 1) {
      const { x } = criticalSpringAt({ from: 100, velocity: 0, target: 0, tS: ms / 1000 });
      expect(x).toBeLessThanOrEqual(previous + 1e-9);
      expect(x).toBeGreaterThanOrEqual(-1e-9);
      previous = x;
    }
  });
  it('carries momentum: velocity AWAY from the target first moves away, then returns', () => {
    let max = 100;
    for (let ms = 1; ms <= 400; ms += 1) {
      max = Math.max(max, criticalSpringAt({ from: 100, velocity: 800, target: 0, tS: ms / 1000 }).x);
    }
    expect(max).toBeGreaterThan(100); // measured 104.8 at response 0.3
    expect(max).toBeLessThan(110);
  });
  it('rejects a non-finite input by holding at the target (no NaN ever reaches a transform)', () => {
    const s = criticalSpringAt({ from: Number.NaN, velocity: 0, target: 0, tS: 0.1 });
    expect(s).toEqual({ x: 0, v: 0 });
  });
});

describe('springSettleMs — the settle time EMERGES, it is not a duration (35 § ב6)', () => {
  it('return 100px→0 at rest velocity settles in 355ms (measured 07/09)', () => {
    expect(springSettleMs({ from: 100, velocity: 0, target: 0 })).toBe(355);
  });
  it('velocity toward the target arrives sooner than a dead release', () => {
    const dead = springSettleMs({ from: 100, velocity: 0, target: 0 });
    const flick = springSettleMs({ from: 100, velocity: -800, target: 0 });
    expect(flick).toBeLessThan(dead);
  });
  it('the render exit (100px → 495px) stays under the 1000ms guard', () => {
    expect(springSettleMs({ from: 100, velocity: 1200, target: 495 })).toBeLessThanOrEqual(450);
  });
  it('response is 0.3 s — the snappy end of the sanctioned 0.3–0.4', () => {
    expect(SPRING_RESPONSE_S).toBe(0.3);
  });
});

describe('releaseCurve — the spring as a CSS linear() easing', () => {
  it('emits `linear(0, …, 1)` with SPRING_EASING_STOPS + 1 stops and a positive duration', () => {
    const curve = releaseCurve({ from: 100, velocity: -800, target: 0, reducedMotion: false });
    const stops = curve.easing.replace(/^linear\(|\)$/g, '').split(',').map((s) => Number(s.trim()));
    expect(stops).toHaveLength(SPRING_EASING_STOPS + 1);
    expect(stops[0]).toBe(0);
    expect(stops[stops.length - 1]).toBe(1);
    expect(stops.every((n) => Number.isFinite(n))).toBe(true);
    expect(curve.ms).toBe(springSettleMs({ from: 100, velocity: -800, target: 0 }));
  });
  it('velocity away from the target is visible in the curve: the first stop dips below 0', () => {
    const curve = releaseCurve({ from: 100, velocity: 800, target: 0, reducedMotion: false });
    const second = Number(curve.easing.replace(/^linear\(|\)$/g, '').split(',')[1]);
    expect(second).toBeLessThan(0);
  });
  it('prefers-reduced-motion ⇒ ms 0, easing `linear` — zero motion, ⛔ not less motion (שכבה A)', () => {
    expect(releaseCurve({ from: 100, velocity: -800, target: 0, reducedMotion: true })).toEqual({
      ms: 0,
      easing: 'linear',
    });
  });
  it('released at rest (|from − target| < 0.5px) ⇒ nothing to animate', () => {
    expect(releaseCurve({ from: 0.2, velocity: 0, target: 0, reducedMotion: false })).toEqual({
      ms: 0,
      easing: 'linear',
    });
  });
});

describe('releaseVelocity — px/s from the last samples (apple-design § 2 · § 5)', () => {
  it('100px over 50ms ⇒ 2000 px/s', () => {
    expect(releaseVelocity([{ x: 0, tMs: 1000 }, { x: 100, tMs: 1050 }])).toBe(2000);
  });
  it('one sample, or none ⇒ 0', () => {
    expect(releaseVelocity([])).toBe(0);
    expect(releaseVelocity([{ x: 5, tMs: 1 }])).toBe(0);
  });
  it('samples older than the window are ignored — a finger that paused then lifted has velocity 0', () => {
    const samples = [{ x: 0, tMs: 0 }, { x: 100, tMs: 60 }, { x: 100, tMs: 400 }];
    expect(releaseVelocity(samples)).toBe(0);
  });
  it('equal timestamps ⇒ 0, never Infinity', () => {
    expect(releaseVelocity([{ x: 0, tMs: 7 }, { x: 40, tMs: 7 }])).toBe(0);
  });
  it('pushSample caps the ring at VELOCITY_MAX_SAMPLES and keeps the newest', () => {
    let ring: readonly { x: number; tMs: number }[] = [];
    for (let i = 0; i < 20; i += 1) ring = pushSample(ring, { x: i, tMs: i });
    expect(ring).toHaveLength(VELOCITY_MAX_SAMPLES);
    expect(ring[ring.length - 1]).toEqual({ x: 19, tMs: 19 });
  });
});
