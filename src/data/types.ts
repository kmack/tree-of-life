/**
 * @fileoverview Core identity and selection types for the Tree of Life. Base
 * sephira/path records are world-agnostic; world identity is supplied at the
 * component level and composed into `SephiraKey`/`PathKey` so selection state
 * cannot collide across worlds.
 */

export type World = 'atziluth' | 'briah' | 'yetzirah' | 'assiah';

export type SephiraId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type PathNumber =
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
  | 25
  | 26
  | 27
  | 28
  | 29
  | 30
  | 31
  | 32;

export type SephiraKey = `${World}:${SephiraId}`;
export type PathKey = `${World}:${PathNumber}`;

export type Selection =
  | { kind: 'sephira'; key: SephiraKey; id: SephiraId }
  | { kind: 'path'; key: PathKey; pathNumber: PathNumber }
  | null;

export type Pillar = 'mercy' | 'severity' | 'mildness';
