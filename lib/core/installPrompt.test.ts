import { describe, expect, it } from 'vitest';
import {
  shouldShowInstallPrompt,
  type InstallPromptInput,
} from './installPrompt';

const base: InstallPromptInput = {
  offer: 'native',
  isStandalone: false,
  dismissed: false,
  hasInteracted: true,
};

describe('shouldShowInstallPrompt', () => {
  it('shows a native offer after the first interaction', () => {
    expect(shouldShowInstallPrompt(base)).toBe(true);
  });

  it('shows the iOS manual offer after the first interaction', () => {
    expect(shouldShowInstallPrompt({ ...base, offer: 'ios-manual' })).toBe(true);
  });

  it('never shows on page load, before any interaction', () => {
    expect(shouldShowInstallPrompt({ ...base, hasInteracted: false })).toBe(false);
  });

  it('never shows again once dismissed', () => {
    expect(shouldShowInstallPrompt({ ...base, dismissed: true })).toBe(false);
  });

  it('never shows when the app is already installed', () => {
    expect(shouldShowInstallPrompt({ ...base, isStandalone: true })).toBe(false);
  });

  it('never shows when the platform offers no install path', () => {
    expect(shouldShowInstallPrompt({ ...base, offer: 'none' })).toBe(false);
  });

  it('standalone wins over an available native offer', () => {
    expect(
      shouldShowInstallPrompt({ ...base, isStandalone: true, offer: 'native' }),
    ).toBe(false);
  });
});
