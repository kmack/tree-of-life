/**
 * @fileoverview Composition root for the Tree of Life graph inside the canvas.
 * Maps sephiroth and paths to their 3D representations. World identity is
 * combined with id/pathNumber here so future multi-world rendering can stack
 * worlds via group offsets without selection key collisions.
 */

import * as React from 'react';

import { paths } from '../data/paths';
import { sephiroth } from '../data/sephiroth';
import type {
  PathKey,
  Selection,
  SephiraId,
  SephiraKey,
  World,
} from '../data/types';
import { PathCylinder } from './path-cylinder';
import { SephiraSphere } from './sephira-sphere';

interface TreeOfLifeGraphProps {
  world: World;
  selected: Selection;
  hovered: Selection;
  dimNonAdjacent: boolean;
  showSephiraLabels: boolean;
  showPathLabels: boolean;
  doubleSidedLabels: boolean;
  onSephiraDown: (sephiraKey: SephiraKey) => void;
  onSephiraOver: (sephiraKey: SephiraKey) => void;
  onSephiraOut: (sephiraKey: SephiraKey) => void;
  onPathDown: (pathKey: PathKey) => void;
  onPathOver: (pathKey: PathKey) => void;
  onPathOut: (pathKey: PathKey) => void;
}

function buildSephiraAdjacency(): ReadonlyMap<
  SephiraId,
  ReadonlySet<SephiraId>
> {
  const map = new Map<SephiraId, Set<SephiraId>>();
  for (const s of sephiroth) {
    map.set(s.id, new Set());
  }
  for (const p of paths) {
    map.get(p.from)!.add(p.to);
    map.get(p.to)!.add(p.from);
  }
  return map;
}

const SEPHIRA_ADJACENCY = buildSephiraAdjacency();

const SEPHIRA_BY_ID: ReadonlyMap<SephiraId, (typeof sephiroth)[number]> =
  new Map(sephiroth.map((s) => [s.id, s]));

export function TreeOfLifeGraph({
  world,
  selected,
  hovered,
  dimNonAdjacent,
  showSephiraLabels,
  showPathLabels,
  doubleSidedLabels,
  onSephiraDown,
  onSephiraOver,
  onSephiraOut,
  onPathDown,
  onPathOver,
  onPathOut,
}: TreeOfLifeGraphProps): React.JSX.Element {
  // Determine the highlighted element (selection wins over hover for dim logic).
  const focus = selected ?? hovered;

  const isSephiraDimmed = (id: SephiraId): boolean => {
    if (!dimNonAdjacent || !focus) return false;
    if (focus.kind === 'sephira') {
      if (focus.id === id) return false;
      return !SEPHIRA_ADJACENCY.get(focus.id)!.has(id);
    }
    // Path focus: a sephira is "adjacent" if it's an endpoint of the path.
    const p = paths.find((x) => x.pathNumber === focus.pathNumber);
    if (!p) return false;
    return p.from !== id && p.to !== id;
  };

  const isPathDimmed = (pathNumber: number): boolean => {
    if (!dimNonAdjacent || !focus) return false;
    const p = paths.find((x) => x.pathNumber === pathNumber);
    if (!p) return false;
    if (focus.kind === 'sephira') {
      return p.from !== focus.id && p.to !== focus.id;
    }
    return p.pathNumber !== focus.pathNumber;
  };

  return (
    <group>
      {sephiroth.map((s) => {
        const sephiraKey: SephiraKey = `${world}:${s.id}`;
        const isSelected =
          selected?.kind === 'sephira' && selected.key === sephiraKey;
        const isHovered =
          hovered?.kind === 'sephira' && hovered.key === sephiraKey;
        return (
          <SephiraSphere
            key={sephiraKey}
            sephira={s}
            sephiraKey={sephiraKey}
            isSelected={isSelected}
            isHovered={isHovered}
            isDimmed={isSephiraDimmed(s.id)}
            showLabel={showSephiraLabels}
            onPointerDown={onSephiraDown}
            onPointerOver={onSephiraOver}
            onPointerOut={onSephiraOut}
          />
        );
      })}
      {paths.map((p) => {
        const pathKey: PathKey = `${world}:${p.pathNumber}`;
        const fromPos = SEPHIRA_BY_ID.get(p.from)!.pos;
        const toPos = SEPHIRA_BY_ID.get(p.to)!.pos;
        const isSelected =
          selected?.kind === 'path' && selected.key === pathKey;
        const isHovered = hovered?.kind === 'path' && hovered.key === pathKey;
        return (
          <PathCylinder
            key={pathKey}
            path={p}
            pathKey={pathKey}
            fromPos={fromPos}
            toPos={toPos}
            isSelected={isSelected}
            isHovered={isHovered}
            isDimmed={isPathDimmed(p.pathNumber)}
            showLabel={showPathLabels}
            doubleSidedLabels={doubleSidedLabels}
            onPointerDown={onPathDown}
            onPointerOver={onPathOver}
            onPointerOut={onPathOut}
          />
        );
      })}
    </group>
  );
}
