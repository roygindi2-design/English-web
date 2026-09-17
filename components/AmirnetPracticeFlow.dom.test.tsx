// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AmirnetPracticeFlow, {
  CHECKING_LABEL_HE,
  STARTING_HE,
} from '@/components/AmirnetPracticeFlow';
import { PRACTISE_HE } from '@/components/AmirnetPracticeMenu';
import { STATS_UNKNOWN_HE, LEVEL_CHIP_HE } from '@/lib/core/amirnetPractice';

afterEach(cleanup);

/**
 * `T-376` — the door. `F-265` measured that `AmirnetQuestion` is reachable from ⛔ no production
 * path, so `onAnswered` (`T-372`ⓒ) ⛔ could never fire and the dashboard's own success measure —
 * «three type cards carrying a real number» — was ⛔ not performable by a learner.
 *
 * ⚠️ These assertions RENDER and PRESS; they ⛔ do not `grep` the source. That is `F-224`'s
 * lesson, and it is the only way to measure the failure scenario the row names: a source that
 * posts twice reads exactly like one that posts once.
 */
const OPTIONS = ['approved', 'approve', 'approving', 'approval'] as const;

const ITEM = {
  id: 'item-1',
  type: 'sc' as const,
  level: 2 as const,
  stemEn: 'The committee ____ the proposal.',
  passageEn: '',
  optionsEn: OPTIONS,
  correctIndex: 0,
  explanationHe: 'הנושא ברבים דורש צורת עבר פשוטה.',
};

/** ⛔ Indexing under `noUncheckedIndexedAccess` — a missing element is a FAILED test, ⛔ never
 *  a silent `undefined` that makes the next assertion meaningless. */
function at<T>(list: readonly T[], i: number): T {
  const one = list[i];
  if (one === undefined) throw new Error(`⛔ no element at index ${i} (length ${list.length})`);
  return one;
}

type Call = { readonly url: string; readonly init?: RequestInit };

function mockFetch(handler: (url: string, init?: RequestInit) => unknown): Call[] {
  const calls: Call[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      calls.push({ url, init });
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(handler(url, init)),
      } as Response);
    }),
  );
  return calls;
}

const STATS_OK = { ok: true, stats: [
  { type: 'sc', answered: 4, correct: 3 },
  { type: 'rs', answered: 0, correct: 0 },
  { type: 'rc', answered: 0, correct: 0 },
] };

beforeEach(() => vi.unstubAllGlobals());

async function openQuestion(): Promise<Call[]> {
  const calls = mockFetch((url) =>
    url.startsWith('/api/amirnet/practice/result') ? STATS_OK : { ok: true, type: 'sc', level: 2, items: [ITEM] },
  );
  render(<AmirnetPracticeFlow />);
  await waitFor(() => expect(screen.getByText(LEVEL_CHIP_HE(2))).toBeDefined());
  fireEvent.click(screen.getByRole('button', { name: LEVEL_CHIP_HE(2) }));
  fireEvent.click(at(screen.getAllByRole('button', { name: PRACTISE_HE }), 0));
  await waitFor(() => expect(screen.getByText(OPTIONS[0])).toBeDefined());
  return calls;
}

describe('AmirnetPracticeFlow — the production door (T-376)', () => {
  it('asks for the learner\'s own performance before it draws the menu', async () => {
    const calls = mockFetch(() => STATS_OK);
    render(<AmirnetPracticeFlow />);
    expect(screen.getByText(CHECKING_LABEL_HE)).toBeDefined();
    await waitFor(() => expect(screen.getByText('4 שאלות שנענו')).toBeDefined());
    expect(at(calls, 0).url).toBe('/api/amirnet/practice/result');
  });

  it('🔴 a failed performance read ⛔ never becomes «you practised nothing» — and the menu still opens', async () => {
    mockFetch(() => ({ ok: false, code: 'unavailable' }));
    render(<AmirnetPracticeFlow />);
    await waitFor(() => expect(screen.getAllByText(STATS_UNKNOWN_HE).length).toBe(3));
    // the action survives the failed statistic
    expect(screen.getAllByRole('button', { name: PRACTISE_HE }).length).toBe(3);
  });

  it('⛔ the question ⛔ does not open until BOTH choices exist (41 § 7)', async () => {
    const calls = mockFetch(() => STATS_OK);
    render(<AmirnetPracticeFlow />);
    await waitFor(() => expect(screen.getAllByRole('button', { name: PRACTISE_HE }).length).toBe(3));
    fireEvent.click(at(screen.getAllByRole('button', { name: PRACTISE_HE }), 0));
    expect(calls.some((c) => c.url.startsWith('/api/amirnet/practice?'))).toBe(false);
  });

  it('both choices ⇒ it asks the bank with the learner\'s OWN two values', async () => {
    const calls = await openQuestion();
    const served = calls.find((c) => c.url.startsWith('/api/amirnet/practice?'));
    expect(served?.url).toBe('/api/amirnet/practice?type=sc&level=2');
  });

  it('🔴 THE FAILURE SCENARIO THE ROW NAMES: one answer ⇒ exactly ONE write', async () => {
    const calls = await openQuestion();
    fireEvent.click(at(screen.getAllByRole('button', { name: /approv/ }), 0));
    await waitFor(() =>
      expect(calls.filter((c) => c.init?.method === 'POST').length).toBe(1),
    );
    // and pressing again — the same option, then a different one — writes ⛔ nothing more.
    // ⚠️ By POSITION, ⛔ not by name: `approve` is a substring of `approved`, and that is the
    // production bank's own shape (`0024`), ⛔ not a fixture simplified to make a query easy.
    fireEvent.click(at(screen.getAllByRole('button', { name: /approv/ }), 0));
    fireEvent.click(at(screen.getAllByRole('button', { name: /approv/ }), 1));
    await waitFor(() =>
      expect(calls.filter((c) => c.init?.method === 'POST').length).toBe(1),
    );
  });

  it('the write carries the answer as a FACT — ⛔ no percentage, ⛔ no elapsed time', async () => {
    const calls = await openQuestion();
    fireEvent.click(at(screen.getAllByRole('button', { name: /approv/ }), 0));
    await waitFor(() => expect(calls.some((c) => c.init?.method === 'POST')).toBe(true));
    const post = calls.find((c) => c.init?.method === 'POST');
    expect(post?.url).toBe('/api/amirnet/practice/result');
    expect(JSON.parse(String(post?.init?.body))).toEqual({
      itemId: 'item-1',
      type: 'sc',
      level: 2,
      correct: true,
    });
  });

  it('⛔ the learner is ⛔ never left on a blank screen while the bank is read', async () => {
    mockFetch((url) =>
      url.startsWith('/api/amirnet/practice/result') ? STATS_OK : new Promise(() => ({})),
    );
    render(<AmirnetPracticeFlow />);
    await waitFor(() => expect(screen.getAllByRole('button', { name: PRACTISE_HE }).length).toBe(3));
    fireEvent.click(screen.getByRole('button', { name: LEVEL_CHIP_HE(2) }));
    fireEvent.click(at(screen.getAllByRole('button', { name: PRACTISE_HE }), 0));
    await waitFor(() => expect(screen.getByText(STARTING_HE)).toBeDefined());
  });
});

/**
 * The page's own guard — source-scanning, and ⛔ deliberately separate from the render tests
 * above: what is measured here is that the production ROUTE is the one that mounts the flow.
 * `F-265` was invisible for exactly as long as it was, because every component involved had a
 * green test and ⛔ nothing measured the wire between them.
 */
describe('the production route is the one that opens the door (T-376)', () => {
  const PAGE = readFileSync('app/(tabs)/world/amirnet/practice/page.tsx', 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  it('🔴 the page no longer feeds the menu a CONSTANT, and no longer drops the press', () => {
    expect(PAGE).not.toMatch(/zeroStats/);
    expect(PAGE).toMatch(/AmirnetPracticeFlow/);
  });

  it('a page ⛔ never touches the database, and ⛔ never speaks HTTP itself', () => {
    expect(PAGE).not.toMatch(/fetch\(|supabase|createRouteClient|apiGet|apiPost/);
  });

  it('`?type=` is still dropped when it names no known type', () => {
    expect(PAGE).toMatch(/AMIRNET_TYPES\.find/);
  });
});
