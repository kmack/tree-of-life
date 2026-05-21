/**
 * @fileoverview Camera-facing radiant halo for every Sephira. The three
 * luminaries (Kether, Tiphareth, Yesod) glow brighter and cast tinted point
 * light into the scene; the other six wear a smaller tinted halo in their
 * Queen-Scale color; Malkuth wears a procedural rainbow ring. A slow ~6s
 * pulse gently breathes intensity ±10% on the lit/luminary halos so they
 * feel alive without distracting from the rest of the diagram.
 */

import { Billboard } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as React from 'react';
import * as THREE from 'three';

import type { Sephira } from '../data/sephiroth';
import type { SephiraId } from '../data/types';

interface TintConfig {
  kind: 'tint';
  /** Halo tint. */
  color: string;
  /** Peak additive intensity multiplier of the outer halo. */
  intensity: number;
  /** Outer-halo plane half-extent (world units). */
  size: number;
  /**
   * Tinted point light peak intensity. 0 disables the cast light — useful
   * for the minor halos so the scene doesn't end up over-lit.
   */
  lightIntensity: number;
  /** Tinted point light fade distance. Ignored when lightIntensity is 0. */
  lightDistance: number;
  /** Pulse phase offset (radians) so halos don't breathe in lockstep. */
  pulsePhase: number;
}

interface RainbowConfig {
  kind: 'rainbow';
  /** Outer-halo plane half-extent (world units). */
  size: number;
  /** Peak additive intensity. */
  intensity: number;
  /** Pulse phase offset. */
  pulsePhase: number;
}

type RadianceConfig = TintConfig | RainbowConfig;

// Three luminaries glow large and bright, cast tinted light into the scene,
// and pulse on offset phases so they don't breathe in lockstep.
const LUMINARY_KETHER: TintConfig = {
  kind: 'tint',
  color: '#FFFFFF',
  intensity: 1.45,
  size: 3.2,
  lightIntensity: 1.2,
  lightDistance: 6.5,
  pulsePhase: 0,
};
const LUMINARY_TIPHARETH: TintConfig = {
  kind: 'tint',
  color: '#FFD86B',
  intensity: 0.95,
  size: 2.4,
  lightIntensity: 0.7,
  lightDistance: 4.5,
  pulsePhase: Math.PI * 0.66,
};
const LUMINARY_YESOD: TintConfig = {
  kind: 'tint',
  color: '#B061E8',
  intensity: 0.9,
  size: 2.3,
  lightIntensity: 0.65,
  lightDistance: 4.0,
  pulsePhase: Math.PI * 1.33,
};

// Helper: minor halo around a sephira in its own Queen-Scale color. No cast
// point light; size and intensity sit well below the luminaries.
function minor(color: string, pulsePhase: number): TintConfig {
  return {
    kind: 'tint',
    color,
    intensity: 0.55,
    size: 1.25,
    lightIntensity: 0,
    lightDistance: 0,
    pulsePhase,
  };
}

const RADIANCE_BY_ID: Record<SephiraId, RadianceConfig> = {
  1: LUMINARY_KETHER,
  // Chokmah's gray sphere is hard to halo with its own color — lift toward
  // a soft warm white so it reads as luminous instead of flat.
  2: minor('#F2EEDD', Math.PI * 0.2),
  // Binah's sphere is solid black; tint the halo white so it isn't invisible
  // under additive blending.
  3: minor('#FFFFFF', Math.PI * 1.6),
  4: minor('#1F4FFF', Math.PI * 0.45),
  5: minor('#D32F2F', Math.PI * 1.1),
  6: LUMINARY_TIPHARETH,
  7: minor('#2E7D32', Math.PI * 0.85),
  8: minor('#F57C00', Math.PI * 1.45),
  9: LUMINARY_YESOD,
  10: {
    kind: 'rainbow',
    size: 1.4,
    intensity: 0.85,
    pulsePhase: Math.PI * 0.5,
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

// Rainbow halo: hue cycles around the angle, intensity falls off radially
// from a soft inner ring. The ring sits a touch out from the sphere so the
// sphere's own color stays readable in the middle.
const RAINBOW_FRAGMENT = /* glsl */ `
  uniform float uIntensity;
  varying vec2 vUv;

  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  void main() {
    vec2 d = vUv - vec2(0.5);
    float r = length(d) * 2.0;
    float angle = atan(d.y, d.x);
    float hue = angle / (2.0 * 3.14159265) + 0.5;
    vec3 color = hsv2rgb(vec3(hue, 0.85, 1.0));

    // Soft annular falloff peaked around r ≈ 0.55 so the sphere shows
    // through the middle and the halo fades smoothly to the edge.
    float ring = exp(-pow((r - 0.55) * 3.4, 2.0));
    float a = ring * smoothstep(1.0, 0.85, r);
    gl_FragColor = vec4(color * uIntensity, a);
  }
`;

const PULSE_PERIOD_SEC = 6.0;
const PULSE_AMPLITUDE = 0.1;

// Multipliers applied to the halo's peak intensity when its sephira is the
// focused element or adjacent to it. The halo carries the highlight — the
// sphere's emissive stays subtle so we don't shift its true color (and so
// Binah doesn't go from black to glowing white).
const FOCUS_INTENSITY_MULTIPLIER = 2.6;
const ADJACENT_INTENSITY_MULTIPLIER = 1.9;

// Halos are decorative — never let them swallow pointer events from the
// sphere/path underneath, or hover state will flicker as the cursor crosses
// the halo's bounding plane.
const noopRaycast = (): void => undefined;

interface SephiraRadianceProps {
  sephira: Sephira;
  isFocused: boolean;
  isAdjacentHighlight: boolean;
}

export function SephiraRadiance({
  sephira,
  isFocused,
  isAdjacentHighlight,
}: SephiraRadianceProps): React.JSX.Element {
  const cfg = RADIANCE_BY_ID[sephira.id];
  const focusMul = isFocused
    ? FOCUS_INTENSITY_MULTIPLIER
    : isAdjacentHighlight
      ? ADJACENT_INTENSITY_MULTIPLIER
      : 1;
  return cfg.kind === 'rainbow' ? (
    <RainbowHalo position={sephira.pos} cfg={cfg} focusMul={focusMul} />
  ) : (
    <TintHalo position={sephira.pos} cfg={cfg} focusMul={focusMul} />
  );
}

function TintHalo({
  position,
  cfg,
  focusMul,
}: {
  position: Sephira['pos'];
  cfg: TintConfig;
  focusMul: number;
}): React.JSX.Element {
  const outerMatRef = React.useRef<THREE.ShaderMaterial>(null);
  const innerMatRef = React.useRef<THREE.ShaderMaterial>(null);
  const lightRef = React.useRef<THREE.PointLight>(null);

  const colorObj = React.useMemo(() => new THREE.Color(cfg.color), [cfg.color]);

  const outerUniforms = React.useMemo(
    () => ({
      uColor: { value: colorObj },
      uIntensity: { value: cfg.intensity },
      uFalloff: { value: 2.6 },
    }),
    [colorObj, cfg.intensity]
  );
  const innerUniforms = React.useMemo(
    () => ({
      uColor: { value: colorObj },
      uIntensity: { value: cfg.intensity * 0.55 },
      uFalloff: { value: 1.5 },
    }),
    [colorObj, cfg.intensity]
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const k =
      (1 +
        Math.sin((t * Math.PI * 2) / PULSE_PERIOD_SEC + cfg.pulsePhase) *
          PULSE_AMPLITUDE) *
      focusMul;

    if (outerMatRef.current) {
      outerMatRef.current.uniforms.uIntensity.value = cfg.intensity * k;
    }
    if (innerMatRef.current) {
      innerMatRef.current.uniforms.uIntensity.value = cfg.intensity * 0.55 * k;
    }
    if (lightRef.current && cfg.lightIntensity > 0) {
      lightRef.current.intensity = cfg.lightIntensity * k;
    }
  });

  return (
    <group position={position}>
      {cfg.lightIntensity > 0 && (
        <pointLight
          ref={lightRef}
          color={colorObj}
          distance={cfg.lightDistance}
          decay={2}
          intensity={cfg.lightIntensity}
        />
      )}
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

function RainbowHalo({
  position,
  cfg,
  focusMul,
}: {
  position: Sephira['pos'];
  cfg: RainbowConfig;
  focusMul: number;
}): React.JSX.Element {
  const matRef = React.useRef<THREE.ShaderMaterial>(null);

  const uniforms = React.useMemo(
    () => ({ uIntensity: { value: cfg.intensity } }),
    [cfg.intensity]
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const k =
      (1 +
        Math.sin((t * Math.PI * 2) / PULSE_PERIOD_SEC + cfg.pulsePhase) *
          PULSE_AMPLITUDE) *
      focusMul;
    if (matRef.current) {
      matRef.current.uniforms.uIntensity.value = cfg.intensity * k;
    }
  });

  return (
    <group position={position}>
      <Billboard>
        <mesh renderOrder={-2} raycast={noopRaycast}>
          <planeGeometry args={[cfg.size * 2, cfg.size * 2]} />
          <shaderMaterial
            ref={matRef}
            transparent
            depthWrite={false}
            depthTest={false}
            blending={THREE.AdditiveBlending}
            uniforms={uniforms}
            vertexShader={HALO_VERTEX}
            fragmentShader={RAINBOW_FRAGMENT}
          />
        </mesh>
      </Billboard>
    </group>
  );
}
