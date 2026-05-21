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

// Malkuth's Queen-Scale quartering: citrine/olive/russet/black for Air,
// Water, Fire, and Earth. The material below maps these to the four
// quadrants of the sphere as seen from the front (camera at +Z).
const MALKUTH_CITRINE = new THREE.Color('#E5C100'); // Air, top
const MALKUTH_OLIVE = new THREE.Color('#6B7A1E'); // Water, right
const MALKUTH_RUSSET = new THREE.Color('#7A1F1F'); // Fire, left
const MALKUTH_EARTH = new THREE.Color('#1A1A1A'); // Earth, bottom

interface MalkuthQuadMaterialProps {
  emissiveColor: string;
  emissiveIntensity: number;
}

/**
 * MeshStandardMaterial patched via onBeforeCompile to render Malkuth's
 * four-quartered Queen-Scale color block (citrine/olive/russet/black). The
 * quadrant is chosen from the fragment's local-space position so the four
 * regions stay anchored to the sphere as it rotates with the camera.
 */
function MalkuthQuadMaterial({
  emissiveColor,
  emissiveIntensity,
}: MalkuthQuadMaterialProps): React.JSX.Element {
  const onBeforeCompile = React.useCallback(
    (shader: THREE.WebGLProgramParametersWithUniforms) => {
      shader.uniforms.uCitrine = { value: MALKUTH_CITRINE };
      shader.uniforms.uOlive = { value: MALKUTH_OLIVE };
      shader.uniforms.uRusset = { value: MALKUTH_RUSSET };
      shader.uniforms.uEarth = { value: MALKUTH_EARTH };

      // Pass local-space position to the fragment shader so we can decide
      // which quadrant a fragment belongs to.
      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `#include <common>
         varying vec3 vLocalPos;`
      );
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         vLocalPos = position;`
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `#include <common>
         uniform vec3 uCitrine;
         uniform vec3 uOlive;
         uniform vec3 uRusset;
         uniform vec3 uEarth;
         varying vec3 vLocalPos;`
      );
      // Replace the diffuse color sample with a quadrant lookup. The four
      // colors meet on the X and Y axes; X positive is right (olive/water),
      // X negative is left (russet/fire), Y positive is top (citrine/air),
      // Y negative is bottom (black/earth). The diagonals split each pair.
      shader.fragmentShader = shader.fragmentShader.replace(
        'vec4 diffuseColor = vec4( diffuse, opacity );',
        `vec3 quadColor;
         if (vLocalPos.y >= abs(vLocalPos.x)) {
           quadColor = uCitrine;
         } else if (-vLocalPos.y >= abs(vLocalPos.x)) {
           quadColor = uEarth;
         } else if (vLocalPos.x >= 0.0) {
           quadColor = uOlive;
         } else {
           quadColor = uRusset;
         }
         vec4 diffuseColor = vec4( quadColor, opacity );`
      );
    },
    []
  );

  return (
    <meshStandardMaterial
      emissive={emissiveColor}
      emissiveIntensity={emissiveIntensity}
      roughness={0.5}
      metalness={0.1}
      onBeforeCompile={onBeforeCompile}
    />
  );
}

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
  // Emissive on the sphere is intentionally subtle — just enough to confirm
  // the cluster is "lit" without shifting its true color. The halo carries
  // the actual highlight signal. Binah and other base-black sephiroth emit
  // nothing, since black is their identity; the halo handles their highlight.
  const isLit = isHovered || isSelected || isAdjacentHighlight;
  const emissiveColor = isLit ? baseColor : '#000000';
  const emissiveIntensity = isSelected
    ? 0.3
    : isHovered
      ? 0.22
      : isAdjacentHighlight
        ? 0.15
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
        {sephira.id === 10 ? (
          <MalkuthQuadMaterial
            emissiveColor={emissiveColor}
            emissiveIntensity={emissiveIntensity}
          />
        ) : (
          <meshStandardMaterial
            color={baseColor}
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity}
            roughness={0.5}
            metalness={0.1}
          />
        )}
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
