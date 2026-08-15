import { describe, expect, it } from 'vitest';
import { splitRow, rowShape, TASK_COLUMNS } from './planTable';

describe('splitRow', () => {
  it('drops the leading and trailing empties and trims', () => {
    expect(splitRow('| T-001 | M0 | build it |')).toEqual(['T-001', 'M0', 'build it']);
  });

  it('treats a backslash-escaped pipe as content, not a column break', () => {
    // Measured M7: the escape is already in use on 10 lines of 50-tasks.md and 7 of
    // 60-findings.md. A splitter that ignores it invents columns out of prose.
    expect(splitRow('| F-004 | fix | if (!payload \\| bad) return |')).toEqual([
      'F-004',
      'fix',
      'if (!payload | bad) return',
    ]);
  });

  it('does not swallow a doubled backslash before a real break', () => {
    expect(splitRow('| a | ends with \\\\ | b |')).toEqual(['a', 'ends with \\', 'b']);
  });
});

describe('rowShape', () => {
  it('returns null for a line that is not a register row', () => {
    expect(rowShape('|---|---|', TASK_COLUMNS)).toBeNull();
    expect(rowShape('some prose', TASK_COLUMNS)).toBeNull();
  });

  it('accepts a row with exactly the declared column count', () => {
    const line = '| T-001 | M0 | task | src | ✅ | 0 | files | — |';
    expect(rowShape(line, TASK_COLUMNS)).toEqual({
      id: 'T-001',
      cells: ['T-001', 'M0', 'task', 'src', '✅', '0', 'files', '—'],
      expected: 8,
      ok: true,
    });
  });

  it('flags a short row — measured M5: T-042 carries six cells, not eight', () => {
    const shape = rowShape('| T-042 | M2 | task | R-014 | ✅ done | — |', TASK_COLUMNS);
    expect(shape?.ok).toBe(false);
    expect(shape?.cells.length).toBe(6);
  });

  it('flags a long row — an unescaped pipe in prose invents columns', () => {
    const shape = rowShape('| T-003 | M1 | a | b | c | d | e | f | g |', TASK_COLUMNS);
    expect(shape?.ok).toBe(false);
    expect(shape?.cells.length).toBe(9);
  });
});
