'use client';

import { useCallback, useEffect, useState } from 'react';
import { shouldShowInstallPrompt, type InstallOffer } from '@/lib/core/installPrompt';

const DISMISS_KEY = 'ew.install-offer-dismissed';

/** Not in the DOM lib types — Chromium-only. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
}

/** iOS Safari exposes navigator.standalone; also missing from the DOM lib types. */
interface IosNavigator extends Navigator {
  readonly standalone?: boolean;
}

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    // Private mode / storage blocked. Treat as "not dismissed" rather than crash.
    return false;
  }
}

function writeDismissed(): void {
  try {
    window.localStorage.setItem(DISMISS_KEY, '1');
  } catch {
    // A failed write must never break the page; the offer just reappears later.
  }
}

function detectStandalone(): boolean {
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  return (navigator as IosNavigator).standalone === true;
}

function detectIos(): boolean {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  // iPadOS 13+ reports itself as a Mac; touch points give it away.
  return /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
}

/**
 * "Add to home screen" offer.
 *
 * UX plan T-001: shown only after the user's first interaction, never on page
 * load, and never again once dismissed. The decision rule itself lives in
 * /lib/core/installPrompt.ts (pure, tested); this component only collects the
 * browser facts and renders.
 */
export default function InstallPrompt() {
  const [offer, setOffer] = useState<InstallOffer>('none');
  const [isStandalone, setIsStandalone] = useState(true); // assume installed until proven otherwise
  const [dismissed, setDismissed] = useState(true); // assume dismissed until storage is read
  const [hasInteracted, setHasInteracted] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    setIsStandalone(detectStandalone());
    setDismissed(readDismissed());
    if (detectIos()) setOffer('ios-manual');

    const onBeforeInstallPrompt = (event: Event) => {
      // Keep the browser's own mini-infobar from firing on load; we control timing.
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setOffer('native');
    };

    const onFirstInteraction = () => setHasInteracted(true);

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('pointerdown', onFirstInteraction, { once: true });
    window.addEventListener('keydown', onFirstInteraction, { once: true });
    window.addEventListener('scroll', onFirstInteraction, { once: true, passive: true });

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('pointerdown', onFirstInteraction);
      window.removeEventListener('keydown', onFirstInteraction);
      window.removeEventListener('scroll', onFirstInteraction);
    };
  }, []);

  const dismiss = useCallback(() => {
    writeDismissed();
    setDismissed(true);
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
    } finally {
      // Whatever the user chose, we do not ask again in this session.
      setDeferred(null);
      setOffer('none');
    }
  }, [deferred]);

  if (!shouldShowInstallPrompt({ offer, isStandalone, dismissed, hasInteracted })) {
    return null;
  }

  return (
    <aside
      aria-label="הוספה למסך הבית"
      className="rounded-2xl border border-border-subtle bg-surface-raised p-4 shadow-sm"
    >
      <p className="text-base leading-relaxed text-ink">
        {offer === 'native'
          ? 'רוצה גישה מהירה? אפשר להוסיף את האפליקציה למסך הבית.'
          : 'להוספה למסך הבית: כפתור השיתוף למטה, ואז "הוסף למסך הבית".'}
      </p>

      <div className="mt-3 flex gap-2">
        {offer === 'native' ? (
          <button
            type="button"
            onClick={install}
            className="flex min-h-touch flex-1 items-center justify-center rounded-lg bg-brand-surface px-4 text-base font-semibold text-brand-on active:opacity-90"
          >
            הוסף למסך הבית
          </button>
        ) : null}

        <button
          type="button"
          onClick={dismiss}
          className="flex min-h-touch min-w-touch items-center justify-center rounded-lg border border-border-strong px-4 text-base font-medium text-ink active:opacity-90"
        >
          לא עכשיו
        </button>
      </div>
    </aside>
  );
}
