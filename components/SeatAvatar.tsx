import './seat-tokens.css';

/**
 * A class member's avatar — the SEAT, one number per author across the wall and the story
 * (T-521 · D-303 · `lib/core/classSeats.ts`). 🎯 `kol-C-10-wall-feed.png` draws one avatar
 * per author; ⛔ no table holds a name (`for-roy` 145), so the circle carries the seat
 * number where the render draws a letter. If 145 is answered «yes», the name replaces the
 * number's text and the seat colour stays.
 * The number is WRITTEN (⛔ colour is never the only channel); the seat colour is a ring
 * from `seat-tokens.css`, cycling through eight. The learner's own avatar is the brand fill,
 * as in the story. `seat` < 1 ⇒ an empty circle (a seat not yet known — e.g. the learner's
 * first line, before the feed reloads).
 * ⛔ `aria-hidden`: the author line next to it is what a screen reader reads.
 */
export const SEAT_HUES = 8;

export function seatHue(seat: number): number {
  return (((seat - 1) % SEAT_HUES) + SEAT_HUES) % SEAT_HUES;
}

export default function SeatAvatar({ seat, mine, size = 'sm', className = '' }: {
  readonly seat: number | null;
  readonly mine: boolean;
  readonly size?: 'lg' | 'sm';
  readonly className?: string;
}) {
  const known = seat !== null && seat >= 1;
  const box = size === 'lg' ? 'h-10 w-10 text-sm' : 'h-8 w-8 text-xs';
  const face = mine ? 'bg-brand-surface text-brand-on' : 'bg-surface-raised text-ink';
  return (
    <span
      aria-hidden
      {...(mine ? {} : { 'data-seat-avatar': '' })}
      {...(known && !mine ? { 'data-seat-hue': String(seatHue(seat)) } : {})}
      data-seat={known ? seat : undefined}
      className={`flex ${box} shrink-0 items-center justify-center rounded-full font-bold tabular-nums ${face} ${className}`}
    >
      {known ? seat : ''}
    </span>
  );
}
