/**
 * @fileoverview The ten Sephiroth in classic Kircher arrangement, with B.O.T.A.
 * Queen-Scale colors and traditional correspondences. Records are world-agnostic;
 * the rendering layer composes world + id into `SephiraKey` for selection.
 */

import type { Pillar, SephiraId } from './types';

export type Sephira = {
  id: SephiraId;
  name: string;
  title: string;
  /** Hebrew name in logical (typing) order — never pre-reverse. */
  hebrewName: string;
  pillar: Pillar;
  /** Position in the (x, y, 0) plane. World offsets are applied by the parent group. */
  pos: readonly [number, number, number];
  /** B.O.T.A. Queen-Scale color (hex) — used when world='assiah' in v1. */
  botaColor: string;
  divineName: string;
  archangel: string;
  angelicChoir: string;
  planetaryCorrespondence: string;
};

export const sephiroth: readonly Sephira[] = [
  {
    id: 1,
    name: 'Kether',
    title: 'Crown',
    hebrewName: 'כתר',
    pillar: 'mildness',
    pos: [0, 4, 0],
    botaColor: '#FFFFFF',
    divineName: 'Eheieh',
    archangel: 'Metatron',
    angelicChoir: 'Chaioth ha-Qadesh',
    planetaryCorrespondence: 'Primum Mobile',
  },
  {
    id: 2,
    name: 'Chokmah',
    title: 'Wisdom',
    hebrewName: 'חכמה',
    pillar: 'mercy',
    pos: [1.5, 3, 0],
    botaColor: '#A6A6A6',
    divineName: 'Yah',
    archangel: 'Raziel',
    angelicChoir: 'Auphanim',
    planetaryCorrespondence: 'Zodiac / Fixed Stars',
  },
  {
    id: 3,
    name: 'Binah',
    title: 'Understanding',
    hebrewName: 'בינה',
    pillar: 'severity',
    pos: [-1.5, 3, 0],
    botaColor: '#000000',
    divineName: 'YHVH Elohim',
    archangel: 'Tzaphkiel',
    angelicChoir: 'Aralim',
    planetaryCorrespondence: 'Saturn',
  },
  {
    id: 4,
    name: 'Chesed',
    title: 'Mercy',
    hebrewName: 'חסד',
    pillar: 'mercy',
    pos: [1.5, 1.5, 0],
    botaColor: '#1F4FFF',
    divineName: 'El',
    archangel: 'Tzadkiel',
    angelicChoir: 'Chasmalim',
    planetaryCorrespondence: 'Jupiter',
  },
  {
    id: 5,
    name: 'Geburah',
    title: 'Severity',
    hebrewName: 'גבורה',
    pillar: 'severity',
    pos: [-1.5, 1.5, 0],
    botaColor: '#D32F2F',
    divineName: 'Elohim Gibor',
    archangel: 'Khamael',
    angelicChoir: 'Seraphim',
    planetaryCorrespondence: 'Mars',
  },
  {
    id: 6,
    name: 'Tiphareth',
    title: 'Beauty',
    hebrewName: 'תפארת',
    pillar: 'mildness',
    pos: [0, 0, 0],
    botaColor: '#FFD700',
    divineName: 'YHVH Eloah va-Daath',
    archangel: 'Raphael',
    angelicChoir: 'Malachim',
    planetaryCorrespondence: 'Sun',
  },
  {
    id: 7,
    name: 'Netzach',
    title: 'Victory',
    hebrewName: 'נצח',
    pillar: 'mercy',
    pos: [1.5, -1.5, 0],
    botaColor: '#2E7D32',
    divineName: 'YHVH Tzabaoth',
    archangel: 'Haniel',
    angelicChoir: 'Elohim',
    planetaryCorrespondence: 'Venus',
  },
  {
    id: 8,
    name: 'Hod',
    title: 'Splendor',
    hebrewName: 'הוד',
    pillar: 'severity',
    pos: [-1.5, -1.5, 0],
    botaColor: '#F57C00',
    divineName: 'Elohim Tzabaoth',
    archangel: 'Michael',
    angelicChoir: 'Beni Elohim',
    planetaryCorrespondence: 'Mercury',
  },
  {
    id: 9,
    name: 'Yesod',
    title: 'Foundation',
    hebrewName: 'יסוד',
    pillar: 'mildness',
    pos: [0, -3, 0],
    botaColor: '#7B1FA2',
    divineName: 'Shaddai El Chai',
    archangel: 'Gabriel',
    angelicChoir: 'Cherubim',
    planetaryCorrespondence: 'Moon',
  },
  {
    id: 10,
    name: 'Malkuth',
    title: 'Kingdom',
    hebrewName: 'מלכות',
    pillar: 'mildness',
    pos: [0, -5, 0],
    botaColor: '#9E7B3A',
    divineName: 'Adonai ha-Aretz',
    archangel: 'Sandalphon',
    angelicChoir: 'Ashim',
    planetaryCorrespondence: 'Earth (Sphere of the Elements)',
  },
] as const;
