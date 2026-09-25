import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseLevel } from '@/lib/core/levelSummary';
import { storyLibrary, type StoryLibraryLevel, type StoryLibraryStory } from '@/lib/core/storyLibrary';

/**
 * The real generated stories, run through the SAME `storyLibrary` the route uses — ⛔ no
 * hand-written titles or word counts (the 23/08 lesson: a fixture that differs from
 * production data in any dimension is a hole). Read at build time on the server.
 */
export function storyLibraryFixture(): readonly StoryLibraryLevel[] {
  const raw = readFileSync(join(process.cwd(), 'data/generated/stories-2026-08-21.jsonl'), 'utf8');
  const stories: StoryLibraryStory[] = [];
  raw
    .split('\n')
    .filter((l) => l.trim() !== '')
    .forEach((line, i) => {
      const row = JSON.parse(line) as { level: string; title_en: string; body_en: string };
      const level = parseLevel(row.level);
      if (level === null) return;
      stories.push({
        id: `fixture-${String(i).padStart(2, '0')}`,
        level,
        titleEn: row.title_en,
        bodyEn: row.body_en,
        createdAt: `2026-08-21T00:00:${String(i).padStart(2, '0')}Z`,
      });
    });
  const a1 = stories.filter((s) => s.level === 'A1');
  return storyLibrary({
    stories,
    readStoryIds: new Set(a1[0] ? [a1[0].id] : []),
    todayId: a1[1]?.id ?? null,
  });
}
