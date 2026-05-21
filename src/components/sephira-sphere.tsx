/**
 * @fileoverview Sphere mesh for a single Sephira with hover/select interaction
 * and a camera-facing text label that orbits the sphere so the sphere never
 * clips into the text from any view angle.
 */

import { Billboard, Text } from '@react-three/drei';
import { type ThreeEvent, useFrame } from '@react-three/fiber';
import * as React from 'react';
import * as THREE from 'three';

import { SEPHIRA_LABEL_OFFSET, SEPHIRA_RADIUS } from '../data/constants';
import type { Sephira } from '../data/sephiroth';
import type { SephiraKey } from '../data/types';

interface SephiraSphereProps {
  sephira: Sephira;
  sephiraKey: SephiraKey;
  isSelected: boolean;
  isHovered: boolean;
  isAdjacentHighlight: boolean;
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
  isAdjacentHighlight,
  showLabel,
  onPointerDown,
  onPointerOver,
  onPointerOut,
}: SephiraSphereProps): React.JSX.Element {
  const meshRef = React.useRef<THREE.Mesh>(null);

  const baseColor = sephira.botaColor;
  // Emissive: hover/select get the strongest boost; merely-adjacent neighbors
  // get a softer one so the connected cluster reads as a unit.
  const isLit = isHovered || isSelected || isAdjacentHighlight;
  const emissiveColor = isLit ? baseColor : '#000000';
  const emissiveIntensity = isSelected
    ? 0.6
    : isHovered
      ? 0.4
      : isAdjacentHighlight
        ? 0.25
        : 0.0;
  const scale = isHovered || isSelected ? 1.12 : 1.0;

  // Choose a readable text color: dark sephiroth get a light label, others dark.
  const isDark = sephira.botaColor === '#000000';
  const labelColor = isDark ? '#FFFFFF' : '#222222';
  const labelOutline = isDark ? '#000000' : '#FFFFFF';

  // Park the label on the camera-facing side of the sphere each frame, so
  // it always sits in front of the geometry instead of being pinned above
  // (where an orbit could put the sphere on top of it).
  const labelRef = React.useRef<THREE.Group>(null);
  const tmpToCamera = React.useRef(new THREE.Vector3()).current;
  const sphereCenter = React.useMemo(
    () => new THREE.Vector3(...sephira.pos),
    [sephira.pos]
  );
  const labelDistance = SEPHIRA_RADIUS + SEPHIRA_LABEL_OFFSET;
  useFrame(({ camera }) => {
    const group = labelRef.current;
    if (!group) return;
    tmpToCamera.copy(camera.position).sub(sphereCenter);
    if (tmpToCamera.lengthSq() < 1e-8) tmpToCamera.set(0, 0, 1);
    tmpToCamera.normalize();
    group.position
      .copy(sphereCenter)
      .addScaledVector(tmpToCamera, labelDistance);
  });

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
          roughness={0.5}
          metalness={0.1}
        />
      </mesh>

      {showLabel && (
        <Billboard ref={labelRef}>
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
