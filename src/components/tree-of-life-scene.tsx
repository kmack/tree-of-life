/**
 * @fileoverview Top-level R3F scene for the Tree of Life. Hosts the canvas,
 * orbit controls, lighting, Leva controls, and the selection reducer that
 * coordinates the graph and the InfoPanel.
 */

import { Grid, OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useControls } from 'leva';
import * as React from 'react';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

import { APP_CONFIG } from '../config/app-config';
import type {
  PathKey,
  PathNumber,
  Selection,
  SephiraId,
  SephiraKey,
  World,
} from '../data/types';
import { useIsMobile } from '../utils/mobile-detection';
import { CameraReset } from './camera-reset';
import { InfoPanel } from './info-panel';
import { PillarColumns } from './pillar-columns';
import { TreeOfLifeGraph } from './tree-of-life-graph';
import { WebGLContextRecovery } from './webgl-context-recovery';

type SelectionAction =
  | { type: 'select'; selection: Exclude<Selection, null> }
  | { type: 'hover'; selection: Selection }
  | { type: 'clear' };

interface SelectionState {
  selected: Selection;
  hovered: Selection;
}

const INITIAL: SelectionState = { selected: null, hovered: null };

function selectionReducer(
  state: SelectionState,
  action: SelectionAction
): SelectionState {
  switch (action.type) {
    case 'select':
      // Toggle off if already selected.
      if (
        state.selected?.kind === action.selection.kind &&
        state.selected.key === action.selection.key
      ) {
        return { ...state, selected: null };
      }
      return { ...state, selected: action.selection };
    case 'hover':
      return { ...state, hovered: action.selection };
    case 'clear':
      return INITIAL;
  }
}

const WORLD: World = 'assiah';

function parseSephiraKey(key: SephiraKey): SephiraId {
  const id = Number(key.split(':')[1]) as SephiraId;
  return id;
}

function parsePathKey(key: PathKey): PathNumber {
  const n = Number(key.split(':')[1]) as PathNumber;
  return n;
}

export function TreeOfLifeScene(): React.JSX.Element {
  const isMobile = useIsMobile();
  const orbitControlsRef = React.useRef<OrbitControlsImpl>(null);
  const [{ selected, hovered }, dispatch] = React.useReducer(
    selectionReducer,
    INITIAL
  );

  const [
    {
      showSephiraLabels,
      showPathLabels,
      doubleSidedLabels,
      showPillars,
      dimNonAdjacent,
    },
  ] = useControls('Display', () => ({
    showSephiraLabels: { value: true, label: 'Sephira Labels' },
    showPathLabels: { value: true, label: 'Path Labels' },
    doubleSidedLabels: { value: true, label: 'Double-Sided Labels' },
    showPillars: { value: true, label: 'Show Pillars' },
    dimNonAdjacent: { value: true, label: 'Dim Non-Adjacent on Hover' },
  }));

  const { showGrid, showAxesHelper } = useControls(
    'Debug',
    {
      showGrid: { value: false, label: 'Show Ground Grid' },
      showAxesHelper: { value: false, label: 'Show Axes Helper' },
    },
    { collapsed: true }
  );

  // Cursor hint on hover.
  const setCursor = React.useCallback((style: 'pointer' | 'auto') => {
    if (typeof document !== 'undefined') {
      document.body.style.cursor = style;
    }
  }, []);

  const onSephiraDown = React.useCallback((sephiraKey: SephiraKey) => {
    dispatch({
      type: 'select',
      selection: {
        kind: 'sephira',
        key: sephiraKey,
        id: parseSephiraKey(sephiraKey),
      },
    });
  }, []);
  const onSephiraOver = React.useCallback(
    (sephiraKey: SephiraKey) => {
      setCursor('pointer');
      dispatch({
        type: 'hover',
        selection: {
          kind: 'sephira',
          key: sephiraKey,
          id: parseSephiraKey(sephiraKey),
        },
      });
    },
    [setCursor]
  );
  const onSephiraOut = React.useCallback(
    (_sephiraKey: SephiraKey) => {
      setCursor('auto');
      dispatch({ type: 'hover', selection: null });
    },
    [setCursor]
  );

  const onPathDown = React.useCallback((pathKey: PathKey) => {
    dispatch({
      type: 'select',
      selection: {
        kind: 'path',
        key: pathKey,
        pathNumber: parsePathKey(pathKey),
      },
    });
  }, []);
  const onPathOver = React.useCallback(
    (pathKey: PathKey) => {
      setCursor('pointer');
      dispatch({
        type: 'hover',
        selection: {
          kind: 'path',
          key: pathKey,
          pathNumber: parsePathKey(pathKey),
        },
      });
    },
    [setCursor]
  );
  const onPathOut = React.useCallback(
    (_pathKey: PathKey) => {
      setCursor('auto');
      dispatch({ type: 'hover', selection: null });
    },
    [setCursor]
  );

  // Esc clears selection.
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        dispatch({ type: 'clear' });
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleClose = React.useCallback(() => {
    dispatch({ type: 'clear' });
  }, []);

  return (
    <>
      <Canvas
        style={{ background: 'transparent' }}
        dpr={
          (isMobile
            ? APP_CONFIG.rendering.dpr.mobile
            : APP_CONFIG.rendering.dpr.desktop) as [number, number]
        }
        camera={{
          position: APP_CONFIG.camera.defaultPosition as [
            number,
            number,
            number,
          ],
          fov: APP_CONFIG.camera.fov,
        }}
        onCreated={({ gl }) => {
          gl.domElement.style.userSelect = 'none';
          gl.setClearColor(0x000000, 0);
        }}
      >
        <WebGLContextRecovery />
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 8, 5]} intensity={0.9} />
        <directionalLight position={[-5, -2, 5]} intensity={0.4} />

        <OrbitControls
          ref={orbitControlsRef}
          enableDamping
          dampingFactor={APP_CONFIG.controls.orbit.dampingFactor}
          rotateSpeed={APP_CONFIG.controls.orbit.rotateSpeed}
        />
        <CameraReset
          controlsRef={orbitControlsRef}
          defaultPosition={
            APP_CONFIG.camera.defaultPosition as [number, number, number]
          }
          defaultTarget={
            APP_CONFIG.camera.defaultTarget as [number, number, number]
          }
          animationDuration={APP_CONFIG.camera.resetAnimationDuration}
        />

        {showGrid && (
          <Grid
            position={[0, -6, 0]}
            sectionSize={3}
            sectionColor={'#666'}
            sectionThickness={1}
            cellSize={1}
            cellColor={'#6f6f6f'}
            cellThickness={0.6}
            infiniteGrid
            fadeDistance={30}
            fadeStrength={1.5}
          />
        )}
        {showAxesHelper && <axesHelper args={[5]} />}

        <PillarColumns visible={showPillars} />

        <TreeOfLifeGraph
          world={WORLD}
          selected={selected}
          hovered={hovered}
          dimNonAdjacent={dimNonAdjacent}
          showSephiraLabels={showSephiraLabels}
          showPathLabels={showPathLabels}
          doubleSidedLabels={doubleSidedLabels}
          onSephiraDown={onSephiraDown}
          onSephiraOver={onSephiraOver}
          onSephiraOut={onSephiraOut}
          onPathDown={onPathDown}
          onPathOver={onPathOver}
          onPathOut={onPathOut}
        />
      </Canvas>

      <InfoPanel selection={selected} onClose={handleClose} />
    </>
  );
}
