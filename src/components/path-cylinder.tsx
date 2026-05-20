/**
 * @fileoverview Cylinder mesh for a single Tree of Life path. Renders a thin
 * visible cylinder for display plus an invisible larger pick cylinder so the
 * touch target stays comfortable on mobile. Includes a RichLabel showing the
 * path's Tarot key correspondence: the card's "up" stays locked to the path
 * direction while the card spins around the cylinder's axis to face the
 * camera, so the key is readable from any orbit angle.
 */

import { type ThreeEvent, useFrame } from '@react-three/fiber';
import * as React from 'react';
import * as THREE from 'three';

import {
  LABEL_HEIGHT_WITH_IMAGE,
  LABEL_WIDTH_WITH_IMAGE,
  PATH_PICK_RADIUS,
  PATH_VISIBLE_RADIUS,
  TAROT_KEY_Z_OFFSET,
} from '../data/constants';
import { getSpec } from '../data/label-spec';
import type { TreePath } from '../data/paths';
import type { PathKey } from '../data/types';
import type {
  BackgroundStyle,
  CanvasLabelConfig,
} from '../utils/canvas-texture';
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

// Source-image crop for major-arcana PNGs. Matches the same crop used in
// createStructuredHebrewLabel so the card sits in the same spot whether the
// label is in image-only or full-text mode — only the surrounding text and
// background appear/disappear on hover.
const ARCANA_SOURCE_X = 96;
const ARCANA_SOURCE_Y = 0;
const ARCANA_SOURCE_WIDTH = 320; // 416 - 96
const ARCANA_SOURCE_HEIGHT = 512;

function buildImageOnlyConfig(imagePath: string): CanvasLabelConfig {
  const width = LABEL_WIDTH_WITH_IMAGE;
  const height = LABEL_HEIGHT_WITH_IMAGE;
  const aspectRatio = ARCANA_SOURCE_WIDTH / ARCANA_SOURCE_HEIGHT;
  const cardHeight = height - 190;
  const cardWidth = Math.floor(cardHeight * aspectRatio);
  const cardX = (width - cardWidth) / 2;
  const cardY = 80;

  return {
    width,
    height,
    images: [
      {
        src: imagePath,
        x: cardX,
        y: cardY,
        width: cardWidth,
        height: cardHeight,
        sourceX: ARCANA_SOURCE_X,
        sourceY: ARCANA_SOURCE_Y,
        sourceWidth: ARCANA_SOURCE_WIDTH,
        sourceHeight: ARCANA_SOURCE_HEIGHT,
      },
    ],
    // Force full RGBA so white image pixels don't render yellow via the
    // 2-channel alpha-mask path that kicks in for transparent + B&W images.
    useOptimizedFormat: false,
  };
}

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
  const imageOnlyConfig = React.useMemo(
    () =>
      labelData.imagePath ? buildImageOnlyConfig(labelData.imagePath) : null,
    [labelData.imagePath]
  );
  const showFullLabel = isHovered || isSelected;

  const { mid, quat, length, cardUp } = React.useMemo(() => {
    const a = new THREE.Vector3(...fromPos);
    const b = new THREE.Vector3(...toPos);
    const midpoint = a.clone().add(b).multiplyScalar(0.5);
    const dir = b.clone().sub(a);
    const len = dir.length();
    const dirNorm = dir.clone().normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(UP, dirNorm);

    // Choose the orientation along the path that keeps cards upright: for
    // diagonal paths the card top points to the +Y end; for horizontal
    // paths (Daleth, Teth, Peh) the card top points to the +X end so they
    // read left-to-right.
    const up = dirNorm.clone();
    if (Math.abs(up.y) < 1e-6) {
      if (up.x < 0) up.multiplyScalar(-1);
    } else if (up.y < 0) {
      up.multiplyScalar(-1);
    }

    return { mid: midpoint, quat: q, length: len, cardUp: up };
  }, [fromPos, toPos]);

  // Imperatively orient the card group every frame: the card spins around
  // the path's axis like a sign on a pole so its face always points at the
  // camera, while its "up" stays locked to the path direction. This lets
  // the user read the Tarot key from any orbit angle without the card ever
  // intersecting the path cylinder.
  const labelGroupRef = React.useRef<THREE.Group>(null);
  const tmpToCamera = React.useRef(new THREE.Vector3()).current;
  const tmpOutward = React.useRef(new THREE.Vector3()).current;
  const tmpEye = React.useRef(new THREE.Vector3()).current;
  const tmpQuat = React.useRef(new THREE.Quaternion()).current;
  const tmpMatrix = React.useRef(new THREE.Matrix4()).current;
  useFrame(({ camera }) => {
    const group = labelGroupRef.current;
    if (!group) return;

    // Direction from the path midpoint toward the camera, projected onto
    // the plane perpendicular to the path axis. That projection is the
    // direction we want the card's face to point.
    tmpToCamera.copy(camera.position).sub(mid);
    const along = tmpToCamera.dot(cardUp);
    tmpOutward.copy(tmpToCamera).addScaledVector(cardUp, -along);
    if (tmpOutward.lengthSq() < 1e-8) {
      // Camera is directly along the path axis — fall back to world +Z so
      // the card has a defined orientation.
      tmpOutward.set(0, 0, 1).addScaledVector(cardUp, -cardUp.z);
      if (tmpOutward.lengthSq() < 1e-8) tmpOutward.set(1, 0, 0);
    }
    tmpOutward.normalize();

    // Position the card just off the cylinder, on the side facing the camera.
    group.position.copy(mid).addScaledVector(tmpOutward, TAROT_KEY_Z_OFFSET);

    // Build a rotation whose +Y is the path direction and +Z (the visible
    // face of the RichLabel mesh) points toward the camera. Three.js lookAt
    // orients local +Z toward the eye, so eye = position + outward.
    tmpEye.copy(group.position).add(tmpOutward);
    tmpMatrix.lookAt(tmpEye, group.position, cardUp);
    tmpQuat.setFromRotationMatrix(tmpMatrix);
    group.quaternion.copy(tmpQuat);
  });

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
        <group ref={labelGroupRef}>
          {/* Image-only label: visible by default; both textures are
              pre-baked so toggling visibility on hover is instant. */}
          {imageOnlyConfig && (
            <group visible={!showFullLabel}>
              <RichLabel
                title={labelData.title}
                canvasConfig={imageOnlyConfig}
                doubleSided={doubleSidedLabels}
                scale={0.9}
              />
            </group>
          )}
          {/* Full label with translucent background and correspondence text:
              shown when the path is hovered or selected. */}
          <group visible={showFullLabel}>
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
          </group>
        </group>
      )}
    </group>
  );
}
