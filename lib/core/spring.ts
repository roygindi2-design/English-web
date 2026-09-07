/**
 * PURE. No React, no DOM, no clock, no env, no I/O.
 *
 * T-243 · T-259ⓑ · 35 § ב6 · D-158 § ב׳ · D-159 · `apple-design` § 4 · § 5.
 *
 * A critically damped spring (damping ratio 1) in Apple's two designer parameters:
 * damping ratio and RESPONSE (seconds) — ⛔ not mass/stiffness, ⛔ not a duration. The
 * settle time is an OUTCOME (`springSettleMs`), which is why 35 § ב6 says a spring cannot
 * be written in the language of «150–300ms».
 *
 * Why closed form, and why a CSS `linear()` string: the components that release a
 * gesture are forbidden a JS clock (`SpellCard.test.ts:23`, `ArenaStage.test.ts:40`), and
 * `Flashcard.tsx` already pays one rAF per frame for the drag alone (T-233). A spring
 * sampled here into `linear(0, …, 1)` plus its settle duration lets the BROWSER run the
 * curve on the compositor, with the velocity of the finger baked into the shape. The
 * component sets two custom properties and touches no clock.
 *
 * Interruptibility (`apple-design` § 3) is handled by the component: a `pointerdown`
 * mid-flight reads the presentation transform and hands `dragOffset` a `baseX`.
 */

export const SPRING_DAMPING_RATIO = 1;
export const SPRING_RESPONSE_S = 0.3;
export const SPRING_REST_DISTANCE_PX = 0.5;
export const SPRING_REST_VELOCITY_PX_S = 10;
export const SPRING_MAX_SETTLE_MS = 1000;
export const SPRING_EASING_STOPS = 24;
export const VELOCITY_WINDOW_MS = 100;
export const VELOCITY_MAX_SAMPLES = 8;

export interface SpringState {
  readonly x: number;
  readonly v: number;
}

/** ω = 2π / response — Apple's «response» is the period of the undamped spring. */
function omega(responseS: number): number {
  return (2 * Math.PI) / responseS;
}

export function criticalSpringAt(input: {
  readonly from: number;
  readonly velocity: number;
  readonly target: number;
  readonly tS: number;
  readonly responseS?: number;
}): SpringState {
  const { from, velocity, target, tS } = input;
  const responseS = input.responseS ?? SPRING_RESPONSE_S;
  for (const value of [from, velocity, target, tS, responseS]) {
    // A non-finite number is neither «zero» nor «a lot»: it would reach a transform as NaN.
    if (!Number.isFinite(value)) return { x: Number.isFinite(target) ? target : 0, v: 0 };
  }
  const w = omega(responseS);
  // ζ = 1 ⇒ x(t) = target + (c1 + c2·t)·e^(−ωt), c1 = x0 − target, c2 = v0 + ω·c1.
  const c1 = from - target;
  const c2 = velocity + w * c1;
  const e = Math.exp(-w * tS);
  return {
    x: target + (c1 + c2 * tS) * e,
    v: (c2 - w * (c1 + c2 * tS)) * e,
  };
}

export function springSettleMs(input: {
  readonly from: number;
  readonly velocity: number;
  readonly target: number;
  readonly responseS?: number;
}): number {
  for (let ms = 0; ms <= SPRING_MAX_SETTLE_MS; ms += 1) {
    const s = criticalSpringAt({ ...input, tS: ms / 1000 });
    if (
      Math.abs(s.x - input.target) < SPRING_REST_DISTANCE_PX &&
      Math.abs(s.v) < SPRING_REST_VELOCITY_PX_S
    ) {
      return ms;
    }
  }
  return SPRING_MAX_SETTLE_MS;
}

export interface ReleaseCurve {
  readonly ms: number;
  readonly easing: string;
}

const AT_REST: ReleaseCurve = { ms: 0, easing: 'linear' };

export function releaseCurve(input: {
  readonly from: number;
  readonly velocity: number;
  readonly target: number;
  readonly reducedMotion: boolean;
  readonly responseS?: number;
}): ReleaseCurve {
  // שכבה A: reduced motion is ZERO motion. The feedback survives as the badge, not here.
  if (input.reducedMotion) return AT_REST;
  const span = input.target - input.from;
  if (!Number.isFinite(span) || Math.abs(span) < SPRING_REST_DISTANCE_PX) return AT_REST;
  const ms = springSettleMs(input);
  if (ms === 0) return AT_REST;
  const stops: string[] = [];
  for (let i = 0; i <= SPRING_EASING_STOPS; i += 1) {
    const tS = (ms / 1000) * (i / SPRING_EASING_STOPS);
    const { x } = criticalSpringAt({ ...input, tS });
    // Progress is normalised to the span: values < 0 (moving away first) and > 1 are legal
    // in `linear()`, and they are exactly what a thrown card looks like.
    const p = i === SPRING_EASING_STOPS ? 1 : (x - input.from) / span;
    stops.push(i === 0 ? '0' : p.toFixed(3));
  }
  return { ms, easing: `linear(${stops.join(', ')})` };
}

export interface PointerSample {
  readonly x: number;
  readonly tMs: number;
}

export function pushSample(
  samples: readonly PointerSample[],
  sample: PointerSample,
): readonly PointerSample[] {
  const next = [...samples, sample];
  return next.length > VELOCITY_MAX_SAMPLES ? next.slice(next.length - VELOCITY_MAX_SAMPLES) : next;
}

/**
 * Velocity at release in px/s: the oldest sample still inside the window against the
 * last one. ⛔ Not the last two alone — two `pointermove`s 4ms apart on a 120Hz screen
 * measure jitter, ⛔ not intent. A finger that stopped and then lifted has velocity 0.
 */
export function releaseVelocity(
  samples: readonly PointerSample[],
  windowMs: number = VELOCITY_WINDOW_MS,
): number {
  if (samples.length < 2) return 0;
  const last = samples[samples.length - 1];
  if (last === undefined) return 0;
  const first = samples.find((s) => last.tMs - s.tMs <= windowMs);
  if (first === undefined || first === last) return 0;
  const dt = last.tMs - first.tMs;
  if (!(dt > 0)) return 0;
  const v = ((last.x - first.x) / dt) * 1000;
  return Number.isFinite(v) ? v : 0;
}
