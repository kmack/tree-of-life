/**
 * @fileoverview Cylinder mesh for a single Tree of Life path. Renders a thin
 * visible cylinder for display plus an invisible larger pick cylinder so the
 * touch target stays comfortable on mobile. Includes a billboarded RichLabel
 * showing the path's Tarot key correspondence.
 */

import { Billboard } from '@react-three/drei';
import { type ThreeEvent } from '@react-three/fiber';
import * as React from 'react';
import * as THREE from 'three';

import {
  PATH_LABEL_OFFSET,
  PATH_PICK_RADIUS,
  PATH_VISIBLE_RADIUS,
} from '../data/constants';
import { getSpec } from '../data/label-spec';
import type { TreePath } from '../data/paths';
import type { PathKey } from '../data/types';
import type { BackgroundStyle } from '../utils/canvas-texture';
import { createLabelData } from '../utils/label-factory';
import { RichLabel } from './rich-label';

const PATH_LABEL_BACKGROUND: BackgroundStyle = {
  color: 'rgba(96, 96, 96, 0.4)',
  opacity: 0.45,
  padding: 12,
  borderRadius: 8,
  border: {
    width: 1,
    color: 'rgba(255, 255, 255, 0.8)',
  },
};

interface PathCylinderProps {
  path: TreePath;
  pathKey: PathKey;
  fromPos: readonly [number, number, number];
  toPos: readonly [number, number, number];
  isSelected: boolean;
  isHovered: boolean;
  isDimmed: boolean;
  showLabel: boolean;
  doubleSidedLabels: boolean;
  onPointerDown: (pathKey: PathKey) => void;
  onPointerOver: (pathKey: PathKey) => void;
  onPointerOut: (pathKey: PathKey) => void;
}

const UP = new THREE.Vector3(0, 1, 0);

export function PathCylinder({
  path,
  pathKey,
  fromPos,
  toPos,
  isSelected,
  isHovered,
  isDimmed,
  showLabel,
  doubleSidedLabels,
  onPointerDown,
  onPointerOver,
  onPointerOut,
}: PathCylinderProps): React.JSX.Element {
  const spec = getSpec(path.letter);
  const labelData = React.useMemo(
    () => createLabelData(path.letter),
    [path.letter]
  );

  const { mid, quat, length, labelPos } = React.useMemo(() => {
    const a = new THREE.Vector3(...fromPos);
    const b = new THREE.Vector3(...toPos);
    const midpoint = a.clone().add(b).multiplyScalar(0.5);
    const dir = b.clone().sub(a);
    const len = dir.length();
    const dirNorm = dir.clone().normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(UP, dirNorm);

    // Pick a stable perpendicular for label offset. Cross with world Z to get
    // an in-plane offset for the (x,y) tree; if the path is parallel to Z (it
    // never is in v1), fall back to world X.
    const z = new THREE.Vector3(0, 0, 1);
    let perp = new THREE.Vector3().crossVectors(dirNorm, z);
    if (perp.lengthSq() < 1e-6) {
      perp = new THREE.Vector3(1, 0, 0);
    }
    perp.normalize();
    const lp = midpoint.clone().add(perp.multiplyScalar(PATH_LABEL_OFFSET));

    return {
      mid: midpoint,
      quat: q,
      length: len,
      labelPos: lp,
    };
  }, [fromPos, toPos]);

  const baseColor = spec.colorValue;
  const emissiveColor = isHovered || isSelected ? baseColor : '#000000';
  const emissiveIntensity = isSelected ? 0.7 : isHovered ? 0.45 : 0.0;
  const opacity = isDimmed ? 0.3 : 1.0;
  const visibleRadius =
    isHovered || isSelected ? PATH_VISIBLE_RADIUS * 1.5 : PATH_VISIBLE_RADIUS;

  const handleDown = React.useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      onPointerDown(pathKey);
    },
    [onPointerDown, pathKey]
  );
  const handleOver = React.useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      onPointerOver(pathKey);
    },
    [onPointerOver, pathKey]
  );
  const handleOut = React.useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      onPointerOut(pathKey);
    },
    [onPointerOut, pathKey]
  );

  return (
    <group>
      {/* Visible thin cylinder */}
      <mesh position={mid.toArray()} quaternion={quat}>
        <cylinderGeometry args={[visibleRadius, visibleRadius, length, 16]} />
        <meshStandardMaterial
          color={baseColor}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
          transparent={isDimmed}
          opacity={opacity}
          roughness={0.45}
          metalness={0.15}
        />
      </mesh>

      {/* Invisible larger pick cylinder for raycasting / mobile hit area */}
      <mesh
        position={mid.toArray()}
        quaternion={quat}
        userData={{ pathKey }}
        onPointerDown={handleDown}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
      >
        <cylinderGeometry
          args={[PATH_PICK_RADIUS, PATH_PICK_RADIUS, length, 12]}
        />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {showLabel && (
        <Billboard position={labelPos.toArray()}>
          <RichLabel
            title={labelData.title}
            hebrewLetter={labelData.glyph}
            letterName={labelData.letterName}
            assocGlyph={labelData.assocGlyph}
            assocName={labelData.assocName}
            colorName={labelData.color}
            colorValue={labelData.colorValue}
            note={labelData.note}
            significance={labelData.significance}
            gematria={labelData.gematria}
            alchemy={labelData.alchemy}
            intelligence={labelData.intelligence}
            outerPlanet={labelData.outerPlanet}
            outerPlanetGlyph={labelData.outerPlanetGlyph}
            imagePath={labelData.imagePath}
            background={PATH_LABEL_BACKGROUND}
            doubleSided={doubleSidedLabels}
            scale={0.9}
          />
        </Billboard>
      )}
    </group>
  );
}
