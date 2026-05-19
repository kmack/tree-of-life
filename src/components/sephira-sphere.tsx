/**
 * @fileoverview Sphere mesh for a single Sephira with hover/select interaction
 * and a billboarded text label.
 */

import { Billboard, Text } from '@react-three/drei';
import { type ThreeEvent } from '@react-three/fiber';
import * as React from 'react';
import type * as THREE from 'three';

import { SEPHIRA_LABEL_OFFSET, SEPHIRA_RADIUS } from '../data/constants';
import type { Sephira } from '../data/sephiroth';
import type { SephiraKey } from '../data/types';

interface SephiraSphereProps {
  sephira: Sephira;
  sephiraKey: SephiraKey;
  isSelected: boolean;
  isHovered: boolean;
  isDimmed: boolean;
  showLabel: boolean;
  onPointerDown: (sephiraKey: SephiraKey) => void;
  onPointerOver: (sephiraKey: SephiraKey) => void;
  onPointerOut: (sephiraKey: SephiraKey) => void;
}

export function SephiraSphere({
  sephira,
  sephiraKey,
  isSelected,
  isHovered,
  isDimmed,
  showLabel,
  onPointerDown,
  onPointerOver,
  onPointerOut,
}: SephiraSphereProps): React.JSX.Element {
  const meshRef = React.useRef<THREE.Mesh>(null);

  const baseColor = sephira.botaColor;
  const emissiveColor = isHovered || isSelected ? baseColor : '#000000';
  const emissiveIntensity = isSelected ? 0.6 : isHovered ? 0.4 : 0.0;
  const opacity = isDimmed ? 0.35 : 1.0;
  const scale = isHovered || isSelected ? 1.12 : 1.0;

  // Choose a readable text color: dark sephiroth get a light label, others dark.
  const isDark = sephira.botaColor === '#000000';
  const labelColor = isDark ? '#FFFFFF' : '#222222';
  const labelOutline = isDark ? '#000000' : '#FFFFFF';

  const labelY = sephira.pos[1] + SEPHIRA_RADIUS + SEPHIRA_LABEL_OFFSET;

  const handleDown = React.useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      onPointerDown(sephiraKey);
    },
    [onPointerDown, sephiraKey]
  );
  const handleOver = React.useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      onPointerOver(sephiraKey);
    },
    [onPointerOver, sephiraKey]
  );
  const handleOut = React.useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      onPointerOut(sephiraKey);
    },
    [onPointerOut, sephiraKey]
  );

  return (
    <group>
      <mesh
        ref={meshRef}
        position={sephira.pos}
        scale={scale}
        userData={{ sephiraKey }}
        onPointerDown={handleDown}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
      >
        <sphereGeometry args={[SEPHIRA_RADIUS, 32, 32]} />
        <meshStandardMaterial
          color={baseColor}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
          transparent={isDimmed}
          opacity={opacity}
          roughness={0.5}
          metalness={0.1}
        />
      </mesh>

      {showLabel && (
        <Billboard position={[sephira.pos[0], labelY, sephira.pos[2]]}>
          <Text
            fontSize={0.22}
            color={labelColor}
            outlineWidth={0.012}
            outlineColor={labelOutline}
            anchorX="center"
            anchorY="middle"
          >
            {sephira.name}
          </Text>
          <Text
            position={[0, -0.28, 0]}
            fontSize={0.16}
            color={labelColor}
            outlineWidth={0.01}
            outlineColor={labelOutline}
            anchorX="center"
            anchorY="middle"
          >
            {sephira.hebrewName}
          </Text>
        </Billboard>
      )}
    </group>
  );
}
