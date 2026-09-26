import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { TASK_ROUTES, isTaskRoute, showsLicenceFooter } from './licenceFooter';

/**
 * 🧹 T-326 — the licence footer leaves the task screens and stays everywhere else.
 *
 * The success measure of the row is a WALK («⛔ not drawn on `/dev/deck` · `/dev/card`
 * · `/dev/lesson`, ⛔ and drawn in `הגדרות`»), and `scripts/verify-mobile.mjs` measures
 * exactly that against this module. What a browser cannot cheaply cover is the other
 * direction: every screen that is ⛔ NOT a task must keep the attribution, because
 * dropping it silently is the licence breach (T-011).
 */
describe('🧹 T-326 — the licence footer hides inside a task and nowhere else', () => {
  it('hides on the three screens the row measured', () => {
    for (const route of ['/dev/deck', '/dev/card', '/dev/lesson'])
      expect(showsLicenceFooter(route), `${route} still draws the licence link`).toBe(false);
  });

  it('hides on the product task screens the fixtures stand for', () => {
    for (const route of [
      '/study',
      '/study/scan',
      '/arcade',
      '/world/compose',
      '/world/story',
      '/world/amirnet/practice',
      '/world/amirnet/simulation',
      '/world/messages/7',
    ])
      expect(isTaskRoute(route), `${route} is a task screen`).toBe(true);
  });

  it('keeps it on every entry screen — the attribution has to be reachable before sign-in', () => {
    for (const route of ['/', '/login', '/signup', '/onboarding', '/offline', '/sources'])
      expect(showsLicenceFooter(route), `${route} lost the attribution link`).toBe(true);
  });

  it('keeps it on the five tabs, `הגדרות` included — they are destinations, not tasks', () => {
    for (const route of ['/cards', '/world', '/studies', '/me', '/settings'])
      expect(showsLicenceFooter(route), `${route} lost the attribution link`).toBe(true);
  });

  /**
   * ⚠️ The inbox is the pair that makes the `/*` suffix earn its place: the list is a
   * destination, the open message is the task. A plain prefix would have taken the link
   * off both.
   */
  it('separates an inbox from the message opened out of it', () => {
    expect(isTaskRoute('/world/messages')).toBe(false);
    expect(isTaskRoute('/world/messages/abc')).toBe(true);
    expect(isTaskRoute('/dev/messages')).toBe(false);
    expect(isTaskRoute('/dev/messages/open')).toBe(true);
  });

  it('keeps it on the אמיר״ם screens that are destinations, ⛔ not answering screens', () => {
    for (const route of ['/world/amirnet', '/dev/amirnet/dashboard', '/dev/amirnet/levels', '/dev/amirnet/result'])
      expect(showsLicenceFooter(route), `${route} lost the attribution link`).toBe(true);
  });

  it('covers the children of a task family without listing each one', () => {
    for (const route of ['/dev/card/typed', '/dev/card/choice', '/dev/deck/done', '/dev/story/done', '/dev/arcade/summary'])
      expect(isTaskRoute(route), `${route} is inside a task family`).toBe(true);
  });

  it('a trailing slash and a query string are the same screen', () => {
    expect(isTaskRoute('/dev/deck/')).toBe(true);
    expect(isTaskRoute('/study?deck=sentences')).toBe(true);
    expect(showsLicenceFooter('/')).toBe(true);
  });

  /**
   * ⛔ A near-miss must ⛔ not match: `/studies` is the tab, `/study` is the task, and
   * a `startsWith` with no separator would have hidden the link on the tab.
   */
  it('⛔ never matches a route that merely starts with a task path', () => {
    expect(isTaskRoute('/studies')).toBe(false);
    expect(isTaskRoute('/arcade-rules')).toBe(false);
  });

  it('every declared pattern is absolute and carries no trailing slash', () => {
    for (const pattern of TASK_ROUTES) {
      expect(pattern.startsWith('/'), `${pattern} is not absolute`).toBe(true);
      expect(pattern.endsWith('/'), `${pattern} ends with a slash`).toBe(false);
    }
  });

  /**
   * ⛔ The list lives in ONE file. A second copy in the component is how the walk and
   * the product start disagreeing — the failure class `F-138` was opened for.
   */
  it('`components/SourcesFooter.tsx` holds ⛔ no route list of its own', () => {
    const src = readFileSync('components/SourcesFooter.tsx', 'utf8');
    expect(src).toContain("from '@/lib/core/licenceFooter'");
    expect(/['"]\/(study|arcade|dev\/deck|dev\/card|dev\/lesson)/.test(src)).toBe(false);
  });
});
