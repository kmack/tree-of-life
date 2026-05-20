/**
 * @fileoverview Three translucent vertical bars marking the Pillars of Mercy
 * (right), Severity (left), and Mildness (center). Pure visual aid; never
 * receives pointer events.
 */

import * as React from 'react';

import { PILLAR_X_OFFSET } from '../data/constants';

interface PillarColumnsProps {
  visible: boolean;
  opacity?: number;
}

const PILLAR_HEIGHT = 11;
const PILLAR_WIDTH = 0.06;
const PILLAR_DEPTH = 0.06;
const PILLAR_Y = -0.5; // center between Kether (4) and Malkuth (-5)

const PILLARS: ReadonlyArray<{ x: number; color: string; key: string }> = [
  { x: -PILLAR_X_OFFSET, color: '#222222', key: 'severity' },
  { x: 0, color: '#888888', key: 'mildness' },
  { x: PILLAR_X_OFFSET, color: '#DDDDDD', key: 'mercy' },
];

export function PillarColumns({
  visible,
  opacity = 0.18,
}: PillarColumnsProps): React.JSX.Element {
  return (
    <group visible={visible}>
      {PILLARS.map((p) => (
        <mesh key={p.key} position={[p.x, PILLAR_Y, -0.05]}>
          <boxGeometry args={[PILLAR_WIDTH, PILLAR_HEIGHT, PILLAR_DEPTH]} />
          <meshBasicMaterial
            color={p.color}
            transparent
            opacity={opacity}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
