import type { ReactNode } from 'react';
import { WALL_PICTURE_KEYS, type WallPictureKey } from '@/lib/core/wallFeed';

/**
 * T-484 · D-291 · `39 § 5` — the picture a wall question asks about. 🎯 Render:
 * docs/design/kol-C-10-wall-feed.png, the second post, drawn by msgs_ui.py `photo` (:193-218):
 * card-width less 10px each side · 104px high on a 375 screen (⇒ ~3:1) · radius 12 · a sky
 * gradient (94,148,214)⇢(238,186,130) · a sun at 74%/30% · two hills · a ground band at 78%.
 *
 * ⛔ A CLOSED gallery of eight drawn scenes (D-291) — ⛔ no network image, ⛔ no upload. The
 * picture is illustration, ⛔ not UI chrome ⇒ its colours are its own and stay in this file.
 * The ratio is reserved before paint (⛔ no layout jump); an unknown key draws ⛔ nothing.
 */
export { WALL_PICTURE_KEYS };

export const WALL_PICTURE_LABEL_HE: Readonly<Record<WallPictureKey, string>> = {
  mountains: 'נוף הרים',
  beach: 'חוף ים',
  classroom: 'כיתה',
  market: 'שוק',
  park: 'פארק',
  kitchen: 'מטבח',
  city: 'עיר',
  rain: 'יום גשום',
};

/** The render's box on a 375 screen: 315 × 104. */
const W = 315;
const H = 104;

function Sky({ id, from, to }: { readonly id: string; readonly from: string; readonly to: string }) {
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${id})`} />
    </>
  );
}

const SCENES: Readonly<Record<WallPictureKey, (id: string) => ReactNode>> = {
  // the render's own scene, value for value
  mountains: (id) => (
    <>
      <Sky id={id} from="#5e94d6" to="#eeba82" />
      <circle cx={W * 0.74} cy={H * 0.3} r={15} fill="#ffecb2" fillOpacity={0.92} />
      <polygon points={`0,${H} ${W * 0.34},${H * 0.46} ${W * 0.62},${H}`} fill="#487460" />
      <polygon points={`${W * 0.3},${H} ${W * 0.62},${H * 0.34} ${W},${H}`} fill="#3a6052" />
      <rect y={H * 0.78} width={W} height={H * 0.22} fill="#2e4a46" fillOpacity={0.92} />
    </>
  ),
  beach: (id) => (
    <>
      <Sky id={id} from="#6aa8e0" to="#cfe6f5" />
      <circle cx={W * 0.2} cy={H * 0.28} r={14} fill="#ffe08a" />
      <rect y={H * 0.52} width={W} height={H * 0.2} fill="#3f86c4" />
      <path d={`M0 ${H * 0.72} Q ${W * 0.5} ${H * 0.62} ${W} ${H * 0.72} V ${H} H 0 Z`} fill="#ecd29a" />
      <line x1={W * 0.72} y1={H * 0.9} x2={W * 0.76} y2={H * 0.52} stroke="#7a5a3a" strokeWidth={3} />
      <path d={`M${W * 0.64} ${H * 0.56} Q ${W * 0.76} ${H * 0.36} ${W * 0.88} ${H * 0.56} Z`} fill="#e2574c" />
    </>
  ),
  classroom: () => (
    <>
      <rect width={W} height={H} fill="#e9dcc3" />
      <rect x={W * 0.18} y={H * 0.14} width={W * 0.64} height={H * 0.46} rx={4} fill="#2f5d4c" />
      <line x1={W * 0.26} y1={H * 0.3} x2={W * 0.52} y2={H * 0.3} stroke="#e8efe9" strokeWidth={2} />
      <line x1={W * 0.26} y1={H * 0.42} x2={W * 0.44} y2={H * 0.42} stroke="#e8efe9" strokeWidth={2} />
      <rect y={H * 0.78} width={W} height={H * 0.22} fill="#b58a5c" />
      <rect x={W * 0.1} y={H * 0.68} width={W * 0.24} height={H * 0.1} fill="#8a6440" />
      <rect x={W * 0.66} y={H * 0.68} width={W * 0.24} height={H * 0.1} fill="#8a6440" />
    </>
  ),
  market: (id) => (
    <>
      <Sky id={id} from="#8cc0ea" to="#f3e3c4" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={W * (0.06 + i * 0.32)} y={H * 0.5} width={W * 0.26} height={H * 0.32} fill="#c98d4e" />
          <path d={`M${W * (0.04 + i * 0.32)} ${H * 0.5} L ${W * (0.19 + i * 0.32)} ${H * 0.3} L ${W * (0.34 + i * 0.32)} ${H * 0.5} Z`} fill={['#e2574c', '#f2b544', '#3f9e6e'][i]} />
          <circle cx={W * (0.13 + i * 0.32)} cy={H * 0.62} r={5} fill="#f07b2f" />
          <circle cx={W * (0.19 + i * 0.32)} cy={H * 0.62} r={5} fill="#7cbf4a" />
          <circle cx={W * (0.25 + i * 0.32)} cy={H * 0.62} r={5} fill="#d94a5a" />
        </g>
      ))}
      <rect y={H * 0.82} width={W} height={H * 0.18} fill="#b9a58a" />
    </>
  ),
  park: (id) => (
    <>
      <Sky id={id} from="#7db6ea" to="#dff0fa" />
      <path d={`M0 ${H * 0.7} Q ${W * 0.5} ${H * 0.56} ${W} ${H * 0.7} V ${H} H 0 Z`} fill="#6fae5a" />
      <rect x={W * 0.24} y={H * 0.44} width={6} height={H * 0.3} fill="#7a5a3a" />
      <circle cx={W * 0.24 + 3} cy={H * 0.38} r={18} fill="#3f8a4a" />
      <rect x={W * 0.7} y={H * 0.5} width={6} height={H * 0.26} fill="#7a5a3a" />
      <circle cx={W * 0.7 + 3} cy={H * 0.44} r={14} fill="#4c9a56" />
      <rect x={W * 0.44} y={H * 0.72} width={W * 0.14} height={4} fill="#8a6440" />
    </>
  ),
  kitchen: () => (
    <>
      <rect width={W} height={H} fill="#f4ead8" />
      <rect x={W * 0.08} y={H * 0.12} width={W * 0.3} height={H * 0.24} rx={3} fill="#cfe3ee" stroke="#9fb8c6" strokeWidth={2} />
      <rect y={H * 0.62} width={W} height={H * 0.38} fill="#c9d6de" />
      <rect y={H * 0.58} width={W} height={H * 0.06} fill="#8fa3ae" />
      <rect x={W * 0.56} y={H * 0.4} width={W * 0.14} height={H * 0.18} rx={3} fill="#3f4a56" />
      <rect x={W * 0.52} y={H * 0.36} width={W * 0.22} height={H * 0.05} rx={2} fill="#2b333c" />
      <circle cx={W * 0.86} cy={H * 0.5} r={7} fill="#e2574c" />
    </>
  ),
  city: (id) => (
    <>
      <Sky id={id} from="#5f8fcf" to="#f0c9a0" />
      {[
        [0.04, 0.4], [0.16, 0.24], [0.3, 0.5], [0.42, 0.18], [0.56, 0.36], [0.7, 0.28], [0.84, 0.46],
      ].map(([x, y], i) => (
        <rect key={i} x={W * (x as number)} y={H * (y as number)} width={W * 0.12} height={H} fill={i % 2 ? '#3d4a66' : '#4e5c7a'} />
      ))}
      {[0.2, 0.46, 0.6, 0.74].map((x) => (
        <rect key={x} x={W * x} y={H * 0.56} width={5} height={5} fill="#ffd98a" />
      ))}
      <rect y={H * 0.86} width={W} height={H * 0.14} fill="#2c3446" />
    </>
  ),
  rain: (id) => (
    <>
      <Sky id={id} from="#7d8a9c" to="#c3ccd6" />
      <ellipse cx={W * 0.36} cy={H * 0.26} rx={46} ry={16} fill="#eef1f5" />
      <ellipse cx={W * 0.62} cy={H * 0.22} rx={54} ry={18} fill="#e2e7ee" />
      {Array.from({ length: 14 }, (_, i) => (
        <line key={i} x1={W * (0.08 + i * 0.065)} y1={H * (0.46 + (i % 3) * 0.06)} x2={W * (0.06 + i * 0.065)} y2={H * (0.6 + (i % 3) * 0.06)} stroke="#5b7aa0" strokeWidth={2} strokeLinecap="round" />
      ))}
      <rect y={H * 0.84} width={W} height={H * 0.16} fill="#5d6b58" />
    </>
  ),
};

/** The bare drawing, cropped to fill whatever box it is put in (`slice`). */
function SceneSvg({ pictureKey }: { readonly pictureKey: WallPictureKey }) {
  return (
    <svg aria-hidden viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="block h-full w-full">
      {SCENES[pictureKey](`wall-sky-${pictureKey}`)}
    </svg>
  );
}

/** Draws the scene, or ⛔ nothing at all when the key is not in the gallery. */
export default function WallPicture({ pictureKey, className = '' }: { readonly pictureKey: WallPictureKey | undefined; readonly className?: string }) {
  if (!pictureKey || !(pictureKey in SCENES)) return null;
  return (
    <div
      data-wall-picture={pictureKey}
      role="img"
      aria-label={WALL_PICTURE_LABEL_HE[pictureKey]}
      className={`overflow-hidden rounded-xl border border-ink-muted/20 ${className}`}
      style={{ aspectRatio: `${W} / ${H}` }}
    >
      <SceneSvg pictureKey={pictureKey} />
    </div>
  );
}

export const NO_PICTURE_HE = 'בלי תמונה';
export const PICTURE_PICKER_HE = 'תמונה לשאלה';

/**
 * T-486 · D-291 — the opener picks the picture for a new question: one horizontally
 * scrolling row of nine tiles, `בלי תמונה` first (on the right, RTL) and then the eight
 * scenes. Every tile ≥ 44×44; the chosen one carries a `--brand` ring AND `aria-pressed`
 * AND a check mark — ⛔ never the ring (colour) alone. The row scrolls inside itself, ⛔ the
 * page never scrolls sideways. Picking animates nothing but the press (emil-design-eng:
 * a choice the finger makes ⇒ feedback, ⛔ no entrance); the preview is the card's own size.
 */
export function WallPicturePicker({ value, onChange }: { readonly value: WallPictureKey | undefined; readonly onChange: (k: WallPictureKey | undefined) => void }) {
  const tiles: readonly (WallPictureKey | undefined)[] = [undefined, ...WALL_PICTURE_KEYS];
  return (
    <div data-wall-picture-picker>
      <p className="text-xs font-semibold text-ink-muted">{PICTURE_PICKER_HE}</p>
      <div role="group" aria-label={PICTURE_PICKER_HE} className="-mx-1 mt-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {tiles.map((k) => {
          const on = k === value;
          const label = k ? WALL_PICTURE_LABEL_HE[k] : NO_PICTURE_HE;
          return (
            <button
              key={k ?? 'none'}
              type="button"
              data-wall-picture-tile={k ?? 'none'}
              aria-pressed={on}
              aria-label={label}
              onClick={() => onChange(k)}
              className={`relative flex h-12 min-h-touch w-16 min-w-touch shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-surface-raised text-center text-xs font-semibold leading-tight text-ink-muted transition-transform duration-150 ease-out active:scale-[0.97] motion-reduce:transform-none motion-reduce:transition-none ${on ? 'border-transparent ring-2 ring-brand' : 'border-ink-muted/25'}`}
            >
              {k ? <SceneSvg pictureKey={k} /> : <span aria-hidden>{NO_PICTURE_HE}</span>}
              {on ? (
                <span aria-hidden className="absolute bottom-0.5 left-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-surface text-brand-on">
                  <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-10" /></svg>
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <WallPicture pictureKey={value} className="mt-2" />
    </div>
  );
}
