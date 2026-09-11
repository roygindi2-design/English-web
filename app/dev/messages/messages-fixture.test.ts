import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { mergeInbox, inboxCounts, toInboxRows, toSimulation } from '@/lib/core/messages';
import { FIXTURE_NOW, FIXTURE_SIMULATIONS, FIXTURE_STATES } from './messages-fixture';

/**
 * F-133ⓐ — the guard that was missing on the story. The render files are read HERE and
 * the fixture is measured against them: a fixture that drifts from the render fails the
 * build (`36 § 14.4` as a test, not a good intention).
 */
const VIDEO = readFileSync('docs/design/render_video_C.py', 'utf8');
const SCREENS = readFileSync('docs/design/render_msgs_screens.py', 'utf8');

function renderMails(): { name: string; letter: string; subject: string; when: string; unread: boolean; tag: string }[] {
  const start = VIDEO.indexOf('MAILS = [');
  expect(start).toBeGreaterThan(-1);
  const block = VIDEO.slice(start, VIDEO.indexOf('\n]', start));
  return [...block.matchAll(/\("([^"]+)", "([^"]+)", \([^)]*\), "([^"]+)", "[^"]*",\s*"([^"]+)", (True|False), "([^"]+)"\)/g)].map((m) => ({
    name: m[1]!, letter: m[2]!, subject: m[3]!, when: m[4]!, unread: m[5] === 'True', tag: m[6]!,
  }));
}

function renderRequiredWords(): string[] {
  const m = SCREENS.match(/for word, done in \(\("(\w+)", \w+\), \("(\w+)", \w+\), \("(\w+)", \w+\)\)/);
  expect(m).not.toBeNull();
  return [m![1]!, m![2]!, m![3]!];
}

function renderTomBody(): string {
  const start = SCREENS.indexOf('enumerate([');
  const block = SCREENS.slice(start, SCREENS.indexOf(']', start));
  return [...block.matchAll(/"([^"]+)"/g)].map((m) => m[1]).join(' ');
}

describe('the messages fixture is the render’s data, ⛔ not a second authoring', () => {
  const mails = renderMails();

  it('three rows, in the render’s order, sender · subject · tag', () => {
    expect(mails.length).toBe(3);
    expect(FIXTURE_SIMULATIONS.length).toBe(3);
    const CONTEXT_OF_TAG: Record<string, string> = { 'תייר': 'tourist', 'מסעדה': 'restaurant', 'מורה': 'teacher', 'מלון': 'hotel' };
    mails.forEach((m, i) => {
      const s = FIXTURE_SIMULATIONS[i]!;
      expect(s.senderEn).toBe(m.name);
      expect(s.subjectEn).toBe(m.subject);
      expect(s.context).toBe(CONTEXT_OF_TAG[m.tag]);
    });
  });

  it('unread rows are the render’s unread rows, and the counter is 3 · 2', () => {
    const items = mergeInbox(FIXTURE_SIMULATIONS, FIXTURE_STATES);
    // mergeInbox sorts newest first; the render lists newest first too.
    items.forEach((it, i) => expect(it.readAt === null && it.answeredAt === null).toBe(mails[i]!.unread));
    expect(inboxCounts(items)).toEqual({ total: 3, unanswered: 2 });
  });

  it('Tom’s body and required words are screen_mail’s, verbatim', () => {
    const tom = FIXTURE_SIMULATIONS.find((s) => s.senderEn === 'Tom')!;
    expect(tom.bodyEn).toBe(renderTomBody());
    expect([...tom.requiredWords].sort()).toEqual([...renderRequiredWords()].sort());
  });

  it('every fixture row survives the same mapping production rows go through', () => {
    for (const s of FIXTURE_SIMULATIONS) {
      expect(toSimulation({
        id: s.id, sender_en: s.senderEn, context: s.context, subject_en: s.subjectEn, body_en: s.bodyEn,
        required_words: s.requiredWords, cefr_level: s.level, created_at: s.createdAt,
      })).not.toBeNull();
    }
    expect(FIXTURE_NOW).toBe('2026-09-07T09:30:00+03:00');
  });

  it('the time labels computed from created_at at FIXTURE_NOW are the render’s labels', () => {
    const items = mergeInbox(FIXTURE_SIMULATIONS, FIXTURE_STATES);
    const rows = toInboxRows(items, FIXTURE_NOW, 'Asia/Jerusalem');
    rows.forEach((r, i) => expect(r.whenHe).toBe(mails[i]!.when));
  });
});
