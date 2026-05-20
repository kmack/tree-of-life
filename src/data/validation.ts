/**
 * @fileoverview Module-load validation for the Tree of Life data layer. Throws
 * on import if the sephiroth/paths arrays violate structural invariants. Catches
 * data-entry mistakes at boot rather than letting them surface as silent visual
 * bugs (missing edges, mismatched letters, etc.).
 */

import type { HebrewLetter } from './label-spec';
import { paths } from './paths';
import { sephiroth } from './sephiroth';
import type { PathNumber, SephiraId } from './types';

const NON_FINAL_LETTERS: ReadonlySet<HebrewLetter> = new Set([
  'Aleph',
  'Beth',
  'Gimel',
  'Daleth',
  'Heh',
  'Vav',
  'Zain',
  'Cheth',
  'Teth',
  'Yod',
  'Kaph',
  'Lamed',
  'Mem',
  'Nun',
  'Samekh',
  'Ayin',
  'Peh',
  'Tzaddi',
  'Qoph',
  'Resh',
  'Shin',
  'Tav',
]);

const EXPECTED_PATH_NUMBERS: ReadonlySet<PathNumber> = new Set<PathNumber>([
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
  30, 31, 32,
]);

/** Hand-verified rows that must match exactly. Any drift here is a data bug. */
const SNAPSHOT: ReadonlyArray<{
  pathNumber: PathNumber;
  from: SephiraId;
  to: SephiraId;
  letter: HebrewLetter;
}> = [
  { pathNumber: 11, from: 1, to: 2, letter: 'Aleph' },
  { pathNumber: 15, from: 2, to: 6, letter: 'Heh' },
  { pathNumber: 22, from: 5, to: 6, letter: 'Lamed' },
  { pathNumber: 27, from: 7, to: 8, letter: 'Peh' },
  { pathNumber: 31, from: 8, to: 10, letter: 'Shin' },
  { pathNumber: 32, from: 9, to: 10, letter: 'Tav' },
];

function fail(msg: string): never {
  throw new Error(`[tree-of-life data] ${msg}`);
}

export function validate(): void {
  if (sephiroth.length !== 10) {
    fail(`expected 10 sephiroth, got ${sephiroth.length}`);
  }
  const ids = new Set<SephiraId>();
  for (const s of sephiroth) {
    if (s.id < 1 || s.id > 10) fail(`sephira id out of range: ${s.id}`);
    if (ids.has(s.id)) fail(`duplicate sephira id: ${s.id}`);
    ids.add(s.id);
  }
  const ALL_IDS: readonly SephiraId[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  for (const i of ALL_IDS) {
    if (!ids.has(i)) fail(`missing sephira id: ${i}`);
  }

  if (paths.length !== 22) {
    fail(`expected 22 paths, got ${paths.length}`);
  }
  const seenPathNumbers = new Set<PathNumber>();
  const seenLetters = new Set<HebrewLetter>();
  for (const p of paths) {
    if (!EXPECTED_PATH_NUMBERS.has(p.pathNumber)) {
      fail(`unexpected path number: ${p.pathNumber}`);
    }
    if (seenPathNumbers.has(p.pathNumber)) {
      fail(`duplicate path number: ${p.pathNumber}`);
    }
    seenPathNumbers.add(p.pathNumber);

    if (!NON_FINAL_LETTERS.has(p.letter)) {
      fail(`path ${p.pathNumber} uses non-allowed letter: ${p.letter}`);
    }
    if (seenLetters.has(p.letter)) {
      fail(`duplicate letter across paths: ${p.letter}`);
    }
    seenLetters.add(p.letter);

    if (!ids.has(p.from)) fail(`path ${p.pathNumber} from invalid: ${p.from}`);
    if (!ids.has(p.to)) fail(`path ${p.pathNumber} to invalid: ${p.to}`);
    if (p.from === p.to) fail(`path ${p.pathNumber} is a self-loop`);
  }

  for (const expected of SNAPSHOT) {
    const actual = paths.find((p) => p.pathNumber === expected.pathNumber);
    if (!actual) fail(`snapshot path ${expected.pathNumber} missing`);
    if (
      actual.from !== expected.from ||
      actual.to !== expected.to ||
      actual.letter !== expected.letter
    ) {
      fail(
        `snapshot mismatch on path ${expected.pathNumber}: ` +
          `expected ${expected.from}->${expected.to} (${expected.letter}), ` +
          `got ${actual.from}->${actual.to} (${actual.letter})`
      );
    }
  }
}

validate();
