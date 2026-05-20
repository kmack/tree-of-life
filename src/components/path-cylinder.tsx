/**
 * @fileoverview Cylinder mesh for a single Tree of Life path. Renders a thin
 * visible cylinder for display plus an invisible larger pick cylinder so the
 * touch target stays comfortable on mobile. Includes a RichLabel showing the
 * path's Tarot key correspondence, aligned to the path direction and floated
 * in front of the tree plane so it never intersects the geometry.
 */

import { type ThreeEvent } from '@react-three/fiber';
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

  const { mid, quat, length, labelPos, labelRotation } = React.useMemo(() => {
    const a = new THREE.Vector3(...fromPos);
    const b = new THREE.Vector3(...toPos);
    const midpoint = a.clone().add(b).multiplyScalar(0.5);
    const dir = b.clone().sub(a);
    const len = dir.length();
    const dirNorm = dir.clone().normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(UP, dirNorm);

    // Float the Tarot card just in front of the tree plane (toward the
    // camera at +Z) so the sephiroth spheres and path cylinders pass behind
    // it instead of intersecting.
    const lp = midpoint.clone().setZ(midpoint.z + TAROT_KEY_Z_OFFSET);

    // Align the card's vertical axis with the path direction so the top of
    // the card points along the path. Pick the orientation that keeps the
    // card upright — i.e. the one whose "up" has a non-negative Y — so cards
    // on diagonal paths read top-to-bottom rather than upside-down. For
    // horizontal paths (Daleth, Teth, Peh) prefer the orientation whose up
    // points in +X, which keeps the cards reading left-to-right.
    let cardUp = new THREE.Vector2(dirNorm.x, dirNorm.y);
    if (Math.abs(cardUp.y) < 1e-6) {
      if (cardUp.x < 0) cardUp = cardUp.multiplyScalar(-1);
    } else if (cardUp.y < 0) {
      cardUp = cardUp.multiplyScalar(-1);
    }
    const angle = Math.atan2(cardUp.y, cardUp.x) - Math.PI / 2;

    return {
      mid: midpoint,
      quat: q,
      length: len,
      labelPos: lp,
      labelRotation: [0, 0, angle] as [number, number, number],
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
        <group position={labelPos.toArray()} rotation={labelRotation}>
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
