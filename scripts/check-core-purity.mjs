#!/usr/bin/env node
/**
 * Enforces the /lib/core purity contract. Runs in CI and before every build.
 * The Critic agent relies on this: a violation here is an automatic HIGH finding.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'lib/core';
const FORBIDDEN = [
  [/from\s+['"]react['"]/, 'imports react'],
  [/\bwindow\./, 'uses window'],
  [/\bdocument\./, 'uses document'],
  [/\blocalStorage\b/, 'uses localStorage'],
  [/\bsessionStorage\b/, 'uses sessionStorage'],
  [/\bprocess\.env\b/, 'reads process.env'],
  [/\bfetch\s*\(/, 'performs network I/O'],
];

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.tsx?$/.test(p) && !/\.test\.tsx?$/.test(p)) out.push(p);
  }
  return out;
}

// Strip comments before scanning: the rules are about executable code, and the
// docs in these files legitimately name the very things we forbid.
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .split('\n')
    .map((line) => line.replace(/\/\/.*$/, ''))
    .join('\n');
}

const violations = [];
for (const file of walk(ROOT)) {
  const src = stripComments(readFileSync(file, 'utf8'));
  src.split('\n').forEach((line, i) => {
    for (const [re, why] of FORBIDDEN) {
      if (re.test(line)) violations.push(`${file}:${i + 1} — ${why}`);
    }
  });
}

if (violations.length) {
  console.error('\n/lib/core purity violations (App-Ready architecture broken):');
  for (const v of violations) console.error('  ' + v);
  console.error('\nSee lib/core/README.md\n');
  process.exit(1);
}
console.log('/lib/core purity: OK');
