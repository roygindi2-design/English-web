'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { appCentre, type AppCard } from '@/lib/core/appCentre';
import { MAX_RING_APPS, installApp, removeApp } from '@/lib/core/ringEdit';
import type { RingNodeId } from '@/lib/core/worldRing';
import { readRing, writeRing } from '@/lib/ringStore';
import { RingIcon } from './WorldRing';

/**
 * T-503 — «מרכז האפליקציות» (`kol-E-02`). 🎨 **Figma `3341:3`** (393×852, light) — every
 * string, size and order below was read from that frame at build time, ⛔ not remembered.
 *
 * ⛔ **This file draws `appCentre(ring)` and decides nothing** (`lib/core/appCentre.ts`):
 * which apps are installed, which are locked, when install is disabled — all of it comes
 * out of the model. The one thing the screen owns is the tap.
 *
 * - «הסר» ⇒ `removeApp` + `writeRing`, ⛔ no confirm dialog (the render has none, and
 *   removing a node removes ⛔ no data — `scene_edit`: «שום נתון לא נמחק»).
 * - «התקן» ⇒ `installApp` + `writeRing` + `/world?place=<id>` (placing itself is `T-505`).
 *   On a full ring the button is `aria-disabled` and the tap does nothing — ⛔ it never
 *   overwrites an app.
 * - A locked app carries «דורש חשבון · בקרוב» and ⛔ no button (`39 § 8`: `מובילים` and
 *   `חברים` are ⛔ not built).
 * ⚠️ The Figma frame's «+ עוד 3 בטבעת (גלילה)» is a note about scrolling, ⛔ not a string:
 * every installed card is drawn, and the page scrolls.
 */

export const OVERLINE_HE = 'קול · מרכז האפליקציות';
export const TITLE_HE = 'בנה את הטבעת שלך';
export const INSTALLED_HE = 'בטבעת';
export const AVAILABLE_HE = 'זמינות להתקנה';
export const REMOVE_HE = 'הסר';
export const INSTALL_HE = 'התקן';
export const LOCKED_NOTE_HE = 'דורש חשבון · בקרוב';
/** Every app removed (T-506's ✕ can get here too) — the one line the frame has ⛔ no room for. */
export const EMPTY_RING_HE = 'הטבעת ריקה · התקן אפליקציה מהרשימה למטה';

export interface AppCentreViewProps {
  readonly ring: readonly RingNodeId[];
  readonly onInstall?: (id: RingNodeId) => void;
  readonly onRemove?: (id: RingNodeId) => void;
}

export function AppCentreView({ ring, onInstall, onRemove }: AppCentreViewProps): React.JSX.Element {
  const model = appCentre(ring);
  return (
    <section data-app-centre className="flex flex-col gap-4 pb-6">
      <header className="flex flex-col gap-1">
        <p className="text-sm text-ink-muted">{OVERLINE_HE}</p>
        <h1 className="text-[28px] font-bold leading-tight text-ink">{TITLE_HE}</h1>
        <p className="text-sm font-medium text-brand" data-ring-count>
          {model.countHe}
        </p>
        {/* Ten pills, filled from the right. ⛔ Not the only channel — the line above
            carries the same number in words (constitution layer A). */}
        <div aria-hidden="true" className="mt-2 flex gap-2">
          {Array.from({ length: MAX_RING_APPS }, (_, i) => (
            <span
              key={i}
              data-pill={i < model.used ? 'on' : 'off'}
              className={`h-2 w-[26px] rounded-md ${i < model.used ? 'bg-brand-surface' : 'bg-border-subtle'}`}
            />
          ))}
        </div>
      </header>

      <h2 className="text-sm font-bold text-ink">{INSTALLED_HE}</h2>
      {model.installed.length === 0 ? (
        <p data-ring-empty className="rounded-2xl border border-dashed border-border-subtle px-4 py-5 text-sm text-ink-muted">
          {EMPTY_RING_HE}
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {model.installed.map((card) => (
            <AppCardRow key={card.id} card={card} onInstall={onInstall} onRemove={onRemove} />
          ))}
        </ul>
      )}

      {model.available.length > 0 && (
        <>
          <h2 className="text-sm font-bold text-ink">{AVAILABLE_HE}</h2>
          <ul className="flex flex-col gap-2.5">
            {model.available.map((card) => (
              <AppCardRow key={card.id} card={card} onInstall={onInstall} onRemove={onRemove} />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function AppCardRow({
  card,
  onInstall,
  onRemove,
}: {
  readonly card: AppCard;
  readonly onInstall?: (id: RingNodeId) => void;
  readonly onRemove?: (id: RingNodeId) => void;
}): React.JSX.Element {
  return (
    <li
      data-app-card={card.id}
      data-state={card.state}
      className="flex min-h-[76px] items-center gap-3 rounded-2xl border border-border-subtle bg-surface-raised px-3 py-3"
    >
      {/* `F-332` (QA, C-0847) · `kol-E-02-centre.png`: every row carries the app's own glyph —
          the same `RingIcon` the ring draws, so the learner recognises the node they will get —
          and its category as a tag beside the name. The square that sat here was the icon
          placeholder of Figma `3341:3`, built literally; it read as a checkbox. */}
      <span
        aria-hidden="true"
        data-app-icon={card.id}
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${
          card.state === 'locked' ? 'border-border-subtle text-ink-muted' : 'border-brand text-brand'
        }`}
      >
        <RingIcon id={card.id} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-[17px] font-bold text-ink">{card.nameHe}</span>
          <span
            data-app-category
            className="rounded-full border border-brand px-2 py-0.5 text-xs font-medium text-brand-surface"
          >
            {card.categoryHe}
          </span>
        </span>
        <span className="text-[13px] text-ink-muted">{card.descHe}</span>
      </span>
      {card.state === 'installed' && (
        <button
          type="button"
          data-remove={card.id}
          onClick={() => onRemove?.(card.id)}
          aria-label={`${REMOVE_HE} את ${card.nameHe}`}
          className="min-h-touch w-[76px] shrink-0 rounded-full border border-ink-muted text-[15px] font-medium text-ink"
        >
          {REMOVE_HE}
        </button>
      )}
      {card.state === 'available' && (
        <button
          type="button"
          data-install={card.id}
          aria-disabled={card.installDisabled || undefined}
          onClick={() => {
            if (!card.installDisabled) onInstall?.(card.id);
          }}
          aria-label={`${INSTALL_HE} את ${card.nameHe}`}
          className={`min-h-touch w-[76px] shrink-0 rounded-full text-[15px] font-bold ${
            card.installDisabled
              ? 'cursor-not-allowed border border-border-subtle text-ink-muted'
              : 'bg-brand-surface text-brand-on'
          }`}
        >
          {INSTALL_HE}
        </button>
      )}
      {card.state === 'locked' && (
        <span data-locked-note className="w-[90px] shrink-0 text-center text-xs text-ink-muted">
          {LOCKED_NOTE_HE}
        </span>
      )}
    </li>
  );
}

/** The live screen: the ring comes from this device (`D-296`), ⛔ never from the server. */
export default function AppCentre(): React.JSX.Element {
  const router = useRouter();
  // `null` until mounted — the server has ⛔ no `localStorage`, and drawing
  // `DEFAULT_RING` first would flash a ring that is not the learner's.
  const [ring, setRing] = useState<readonly RingNodeId[] | null>(null);

  useEffect(() => {
    setRing(readRing());
  }, []);

  if (ring === null) {
    return (
      <section data-app-centre aria-busy="true" className="flex flex-col gap-1">
        <p className="text-sm text-ink-muted">{OVERLINE_HE}</p>
        <h1 className="text-[28px] font-bold leading-tight text-ink">{TITLE_HE}</h1>
      </section>
    );
  }

  const onRemove = (id: RingNodeId): void => {
    const next = removeApp(ring, id);
    if (!next.ok) return;
    writeRing(next.ring);
    setRing(next.ring);
  };

  const onInstall = (id: RingNodeId): void => {
    const next = installApp(ring, id);
    if (!next.ok) return;
    writeRing(next.ring);
    setRing(next.ring);
    router.push(`/world?place=${id}`);
  };

  return <AppCentreView ring={ring} onInstall={onInstall} onRemove={onRemove} />;
}
