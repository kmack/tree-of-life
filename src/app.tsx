/**
 * @fileoverview Root application component for the Tree of Life. Wraps the 3D
 * scene in an error boundary, an animated background, and a Leva controls
 * panel.
 */

import { Leva } from 'leva';
import * as React from 'react';

import { AnimatedGradientBackground } from './components/animated-gradient-background';
import { SceneErrorBoundary } from './components/scene-error-boundary';
import { TreeOfLifeScene } from './components/tree-of-life-scene';

export function App(): React.JSX.Element {
  return (
    <>
      <Leva
        collapsed
        theme={{
          sizes: {
            rootWidth: '320px',
            controlWidth: '130px',
          },
        }}
      />
      <AnimatedGradientBackground />
      <SceneErrorBoundary>
        <TreeOfLifeScene />
      </SceneErrorBoundary>
    </>
  );
}
