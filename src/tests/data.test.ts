/**
 * @fileoverview Confirms the data layer's structural invariants pass and that
 * the load-time validator throws on import without error.
 */

import '../data/validation';

import { describe, expect, it } from 'vitest';

import { paths } from '../data/paths';
import { sephiroth } from '../data/sephiroth';

describe('Tree of Life data', () => {
  it('has 10 sephiroth with unique ids 1..10', () => {
    expect(sephiroth.length).toBe(10);
    const ids = sephiroth.map((s) => s.id).sort((a, b) => a - b);
    expect(ids).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('has 22 paths numbered 11..32', () => {
    expect(paths.length).toBe(22);
    const nums = paths.map((p) => p.pathNumber).sort((a, b) => a - b);
    expect(nums).toEqual([
      11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28,
      29, 30, 31, 32,
    ]);
  });

  it('uses each Hebrew letter exactly once', () => {
    const letters = paths.map((p) => p.letter);
    expect(new Set(letters).size).toBe(letters.length);
  });

  it('connects only valid sephira ids', () => {
    for (const p of paths) {
      expect(p.from).toBeGreaterThanOrEqual(1);
      expect(p.from).toBeLessThanOrEqual(10);
      expect(p.to).toBeGreaterThanOrEqual(1);
      expect(p.to).toBeLessThanOrEqual(10);
      expect(p.from).not.toBe(p.to);
    }
  });

  it('matches the hand-verified snapshot', () => {
    const snapshot = [
      { pathNumber: 11, from: 1, to: 2, letter: 'Aleph' },
      { pathNumber: 15, from: 2, to: 6, letter: 'Heh' },
      { pathNumber: 22, from: 5, to: 6, letter: 'Lamed' },
      { pathNumber: 27, from: 7, to: 8, letter: 'Peh' },
      { pathNumber: 31, from: 8, to: 10, letter: 'Shin' },
      { pathNumber: 32, from: 9, to: 10, letter: 'Tav' },
    ];
    for (const expected of snapshot) {
      const actual = paths.find((p) => p.pathNumber === expected.pathNumber);
      expect(actual).toBeDefined();
      expect(actual).toMatchObject(expected);
    }
  });
});
