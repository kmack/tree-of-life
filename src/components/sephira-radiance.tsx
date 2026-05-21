/**
 * @fileoverview Camera-facing radiant halo for sephiroth that traditionally
 * carry their own light: Kether (brilliant white), Tiphareth (golden), and
 * Yesod (lunar purple). Two additively-blended billboard planes layered with
 * a tinted point light. A slow ~6s pulse gently breathes intensity ±10%.
 */

import { Billboard } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as React from 'react';
import * as THREE from 'three';

import type { Sephira } from '../data/sephiroth';
import type { SephiraId } from '../data/types';

interface RadianceConfig {
  /** Halo tint. */
  color: string;
  /** Peak additive intensity multiplier of the outer halo. */
  intensity: number;
  /** Outer-halo plane half-extent (world units). */
  size: number;
  /** Tinted point light peak intensity. */
  lightIntensity: number;
  /** Tinted point light fade distance. */
  lightDistance: number;
  /** Pulse phase offset (radians) so radiant sephiroth don't breathe in lockstep. */
  pulsePhase: number;
}

const RADIANCE_BY_ID: Partial<Record<SephiraId, RadianceConfig>> = {
  1: {
    color: '#FFFFFF',
    intensity: 1.45,
    size: 3.2,
    lightIntensity: 1.2,
    lightDistance: 6.5,
    pulsePhase: 0,
  },
  6: {
    color: '#FFD86B',
    intensity: 0.95,
    size: 2.4,
    lightIntensity: 0.7,
    lightDistance: 4.5,
    pulsePhase: Math.PI * 0.66,
  },
  9: {
    color: '#B061E8',
    intensity: 0.9,
    size: 2.3,
    lightIntensity: 0.65,
    lightDistance: 4.0,
    pulsePhase: Math.PI * 1.33,
  },
};

const HALO_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const HALO_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uFalloff;
  varying vec2 vUv;
  void main() {
    vec2 d = vUv - vec2(0.5);
    float r = length(d) * 2.0;
    float a = pow(max(1.0 - r, 0.0), uFalloff);
    gl_FragColor = vec4(uColor * uIntensity, a);
  }
`;

const PULSE_PERIOD_SEC = 6.0;
const PULSE_AMPLITUDE = 0.1;

// Halos are decorative — never let them swallow pointer events from the
// sphere/path underneath, or hover state will flicker as the cursor crosses
// the halo's bounding plane.
const noopRaycast = (): void => undefined;

interface SephiraRadianceProps {
  sephira: Sephira;
}

export function SephiraRadiance({
  sephira,
}: SephiraRadianceProps): React.JSX.Element | null {
  const cfg = RADIANCE_BY_ID[sephira.id];

  const outerMatRef = React.useRef<THREE.ShaderMaterial>(null);
  const innerMatRef = React.useRef<THREE.ShaderMaterial>(null);
  const lightRef = React.useRef<THREE.PointLight>(null);

  const colorObj = React.useMemo(
    () => (cfg ? new THREE.Color(cfg.color) : new THREE.Color()),
    [cfg]
  );

  const outerUniforms = React.useMemo(
    () => ({
      uColor: { value: colorObj },
      uIntensity: { value: cfg?.intensity ?? 0 },
      uFalloff: { value: 2.6 },
    }),
    [colorObj, cfg]
  );
  const innerUniforms = React.useMemo(
    () => ({
      uColor: { value: colorObj },
      uIntensity: { value: (cfg?.intensity ?? 0) * 0.55 },
      uFalloff: { value: 1.5 },
    }),
    [colorObj, cfg]
  );

  useFrame(({ clock }) => {
    if (!cfg) return;
    const t = clock.getElapsedTime();
    const k =
      1 +
      Math.sin((t * Math.PI * 2) / PULSE_PERIOD_SEC + cfg.pulsePhase) *
        PULSE_AMPLITUDE;

    if (outerMatRef.current) {
      outerMatRef.current.uniforms.uIntensity.value = cfg.intensity * k;
    }
    if (innerMatRef.current) {
      innerMatRef.current.uniforms.uIntensity.value = cfg.intensity * 0.55 * k;
    }
    if (lightRef.current) {
      lightRef.current.intensity = cfg.lightIntensity * k;
    }
  });

  if (!cfg) return null;

  return (
    <group position={sephira.pos}>
      <pointLight
        ref={lightRef}
        color={colorObj}
        distance={cfg.lightDistance}
        decay={2}
        intensity={cfg.lightIntensity}
      />
      <Billboard>
        <mesh renderOrder={-2} raycast={noopRaycast}>
          <planeGeometry args={[cfg.size * 2, cfg.size * 2]} />
          <shaderMaterial
            ref={outerMatRef}
            transparent
            depthWrite={false}
            depthTest={false}
            blending={THREE.AdditiveBlending}
            uniforms={outerUniforms}
            vertexShader={HALO_VERTEX}
            fragmentShader={HALO_FRAGMENT}
          />
        </mesh>
        <mesh renderOrder={-1} raycast={noopRaycast}>
          <planeGeometry args={[cfg.size, cfg.size]} />
          <shaderMaterial
            ref={innerMatRef}
            transparent
            depthWrite={false}
            depthTest={false}
            blending={THREE.AdditiveBlending}
            uniforms={innerUniforms}
            vertexShader={HALO_VERTEX}
            fragmentShader={HALO_FRAGMENT}
          />
        </mesh>
      </Billboard>
    </group>
  );
}
