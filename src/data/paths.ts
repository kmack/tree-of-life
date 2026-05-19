/**
 * @fileoverview The 22 paths of the Tree of Life with B.O.T.A./Case Hebrew
 * letter attributions. Path color, Tarot key, and astrological correspondence
 * are derived from the letter via `label-spec.getSpec`.
 */

import type { HebrewLetter } from './label-spec';
import type { PathNumber, SephiraId } from './types';

export type TreePath = {
  pathNumber: PathNumber;
  from: SephiraId;
  to: SephiraId;
  letter: HebrewLetter;
};

export const paths: readonly TreePath[] = [
  { pathNumber: 11, from: 1, to: 2, letter: 'Aleph' },
  { pathNumber: 12, from: 1, to: 3, letter: 'Beth' },
  { pathNumber: 13, from: 1, to: 6, letter: 'Gimel' },
  { pathNumber: 14, from: 2, to: 3, letter: 'Daleth' },
  { pathNumber: 15, from: 2, to: 6, letter: 'Heh' },
  { pathNumber: 16, from: 2, to: 4, letter: 'Vav' },
  { pathNumber: 17, from: 3, to: 6, letter: 'Zain' },
  { pathNumber: 18, from: 3, to: 5, letter: 'Cheth' },
  { pathNumber: 19, from: 4, to: 5, letter: 'Teth' },
  { pathNumber: 20, from: 4, to: 6, letter: 'Yod' },
  { pathNumber: 21, from: 4, to: 7, letter: 'Kaph' },
  { pathNumber: 22, from: 5, to: 6, letter: 'Lamed' },
  { pathNumber: 23, from: 5, to: 8, letter: 'Mem' },
  { pathNumber: 24, from: 6, to: 7, letter: 'Nun' },
  { pathNumber: 25, from: 6, to: 9, letter: 'Samekh' },
  { pathNumber: 26, from: 6, to: 8, letter: 'Ayin' },
  { pathNumber: 27, from: 7, to: 8, letter: 'Peh' },
  { pathNumber: 28, from: 7, to: 9, letter: 'Tzaddi' },
  { pathNumber: 29, from: 7, to: 10, letter: 'Qoph' },
  { pathNumber: 30, from: 8, to: 9, letter: 'Resh' },
  { pathNumber: 31, from: 8, to: 10, letter: 'Shin' },
  { pathNumber: 32, from: 9, to: 10, letter: 'Tav' },
] as const;
