/**
 * PURE. No React, no DOM, no fetch, no process.env reads.
 *
 * Decides whether the "add to home screen" offer may be shown.
 * The DOM-dependent facts (is the app already installed? did the browser give us
 * a native prompt? did the user dismiss it before?) are collected by the caller
 * and passed in, so this rule survives the move to React Native untouched.
 */

/** What the platform actually lets us offer right now. */
export type InstallOffer =
  /** Browser handed us a deferred beforeinstallprompt event. */
  | 'native'
  /** iOS Safari: no event exists, so we can only show manual instructions. */
  | 'ios-manual'
  /** Nothing to offer — already installed, unsupported browser, or in-app webview. */
  | 'none';

export interface InstallPromptInput {
  readonly offer: InstallOffer;
  /** App is already running installed (standalone display mode). */
  readonly isStandalone: boolean;
  /** User has closed this offer before. A dismissal is permanent. */
  readonly dismissed: boolean;
  /**
   * User has done something on the page (tap, key, scroll).
   * UX plan T-001: the offer never appears on page load.
   */
  readonly hasInteracted: boolean;
}

export function shouldShowInstallPrompt(input: InstallPromptInput): boolean {
  if (input.isStandalone) return false;
  if (input.dismissed) return false;
  if (!input.hasInteracted) return false;
  return input.offer !== 'none';
}
