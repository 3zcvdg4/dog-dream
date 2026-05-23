import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

export const STEAM_LAYERS = [
  { key: 'core', sizeBoost: 1.1, opacityBoost: 1, driftBoost: 0.9, timeOffset: 0 },
  { key: 'body', sizeBoost: 2.1, opacityBoost: 0.54, driftBoost: 1.16, timeOffset: 0.18 },
  { key: 'mist', sizeBoost: 3.6, opacityBoost: 0.22, driftBoost: 1.42, timeOffset: 0.37 },
];

const STEAM_VERTEX_SHADER = `
  attribute float size;
  attribute float phase;
  attribute vec3 velocity;
  attribute float seed;
  uniform float time;
  uniform float timeScale;
  uniform float height;
  uniform float turbulence;
  uniform float spread;
  uniform float sizeBoost;
  uniform float timeOffset;
  uniform float driftBoost;
  varying float vAlpha;
  varying float vAge;
  varying float vLift;

  void main() {
    float age = mod(time * timeScale + phase + timeOffset, 1.0);
    float riseCurve = pow(age, 0.82);
    float spreadCurve = pow(age, 1.18);
    vAge = age;
    vLift = riseCurve;

    vec3 pos = position;
    float radiusNoise = 0.45 + seed * 0.9;
    pos.x += velocity.x * spreadCurve * height * 0.16 * driftBoost;
    pos.z += velocity.z * spreadCurve * height * 0.12 * driftBoost;
    pos.y += velocity.y * riseCurve * height;

    pos.x += sin(age * 7.2 + phase * 23.0 + seed * 9.0) * spread * driftBoost * radiusNoise * (0.05 + spreadCurve * 0.9) * (0.6 + turbulence);
    pos.z += cos(age * 6.4 + phase * 19.0 + seed * 7.0) * spread * driftBoost * radiusNoise * (0.04 + spreadCurve * 0.72) * (0.5 + turbulence * 0.9);
    pos.y += sin(age * 5.5 + seed * 16.0) * turbulence * 0.22 * riseCurve;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = clamp(size * sizeBoost * (1.05 + age * 2.4) * (320.0 / max(0.8, -mvPosition.z)), 1.0, 72.0);

    float fadeIn = smoothstep(0.0, 0.06, age);
    float fadeOut = 1.0 - smoothstep(0.62, 1.0, age);
    vAlpha = fadeIn * fadeOut;
  }
`;

const STEAM_FRAGMENT_SHADER = `
  uniform vec3 baseColor;
  uniform float density;
  uniform float opacityBoost;
  varying float vAlpha;
  varying float vAge;
  varying float vLift;

  float blob(vec2 p, vec2 offset, float power, float scale) {
    vec2 d = (p - offset) * scale;
    return exp(-dot(d, d) * power);
  }

  void main() {
    vec2 p = gl_PointCoord - 0.5;
    float dist = length(p) * 2.0;
    if (dist > 1.0) discard;

    float body = 0.0;
    body += blob(p, vec2(0.0, 0.0), 5.6, 1.0);
    body += blob(p, vec2(0.16, -0.04), 8.5, 1.35) * 0.82;
    body += blob(p, vec2(-0.14, 0.08), 7.8, 1.28) * 0.76;
    body += blob(p, vec2(0.02, 0.18), 10.5, 1.55) * 0.55;
    body *= 0.34;

    float halo = 1.0 - smoothstep(0.08, 1.0, dist);
    float ageFade = mix(1.0, 0.72, vAge);
    float alpha = (body * 0.88 + halo * 0.12) * density * opacityBoost * vAlpha * ageFade;
    if (alpha < 0.02) discard;

    vec3 color = mix(baseColor, vec3(1.0), 0.18 + vLift * 0.16);
    gl_FragColor = vec4(color, alpha);
  }
`;

export function buildSteamGeometry(settings) {
  const geometry = new THREE.BufferGeometry();
  const particleCount = Math.max(400, Math.round(settings.count));
  const positions = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  const phases = new Float32Array(particleCount);
  const velocity = new Float32Array(particleCount * 3);
  const seeds = new Float32Array(particleCount);

  for (let index = 0; index < particleCount; index += 1) {
    const i3 = index * 3;
    const radial = Math.pow(Math.random(), 1.7);
    const angle = Math.random() * Math.PI * 2;
    const ellipseX = Math.cos(angle) * settings.width * 0.5 * radial;
    const ellipseZ = Math.sin(angle) * settings.length * 0.5 * radial;

    positions[i3] = ellipseX;
    positions[i3 + 1] = Math.random() * 0.08;
    positions[i3 + 2] = ellipseZ;

    sizes[index] = settings.particleSize * (0.85 + Math.random() * 0.65);
    phases[index] = Math.random();
    seeds[index] = Math.random();

    velocity[i3] = (Math.random() - 0.5) * settings.spread;
    velocity[i3 + 1] = settings.riseSpeed * (0.9 + Math.random() * 0.55);
    velocity[i3 + 2] = (Math.random() - 0.5) * settings.spread * 0.72;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));
  geometry.setAttribute('velocity', new THREE.BufferAttribute(velocity, 3));
  geometry.setAttribute('seed', new THREE.BufferAttribute(seeds, 1));
  geometry.computeBoundingSphere();
  return geometry;
}

export function createSteamMaterial(sharedUniforms, layer) {
  return new THREE.ShaderMaterial({
    uniforms: {
      ...sharedUniforms,
      sizeBoost: { value: layer.sizeBoost },
      opacityBoost: { value: layer.opacityBoost },
      timeOffset: { value: layer.timeOffset },
      driftBoost: { value: layer.driftBoost },
    },
    vertexShader: STEAM_VERTEX_SHADER,
    fragmentShader: STEAM_FRAGMENT_SHADER,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
  });
}

export default function SteamField({ settings, baseY = 0, baseZ = 0, followCameraOffsetZ = null, layers = STEAM_LAYERS }) {
  const groupRef = useRef(null);
  const followZRef = useRef(null);
  const geometry = useMemo(() => buildSteamGeometry(settings), [settings]);
  const sharedUniforms = useMemo(() => ({
    time: { value: 0 },
    timeScale: { value: settings.timeScale },
    height: { value: settings.height },
    turbulence: { value: settings.turbulence },
    spread: { value: settings.spread },
    density: { value: settings.density },
    baseColor: { value: new THREE.Color(settings.color) },
  }), [settings.color, settings.density, settings.height, settings.spread, settings.timeScale, settings.turbulence]);
  const materials = useMemo(
    () => layers.map((layer) => createSteamMaterial(sharedUniforms, layer)),
    [layers, sharedUniforms],
  );

  useEffect(() => () => {
    geometry.dispose();
    materials.forEach((material) => material.dispose());
  }, [geometry, materials]);

  useEffect(() => {
    followZRef.current = null;
  }, [followCameraOffsetZ]);

  useFrame((state, delta) => {
    sharedUniforms.time.value = state.clock.getElapsedTime();
    if (!groupRef.current) return;

    const targetZ = followCameraOffsetZ === null ? baseZ : state.camera.position.z - followCameraOffsetZ + baseZ;

    if (followCameraOffsetZ === null) {
      followZRef.current = null;
    } else {
      if (followZRef.current === null) {
        followZRef.current = targetZ;
      }

      followZRef.current = THREE.MathUtils.damp(followZRef.current, targetZ, 14, delta);
    }

    groupRef.current.position.set(
      0,
      baseY + settings.y,
      followCameraOffsetZ === null ? baseZ : followZRef.current,
    );
    groupRef.current.rotation.set(
      THREE.MathUtils.degToRad(settings.rotationX),
      THREE.MathUtils.degToRad(settings.rotationY),
      THREE.MathUtils.degToRad(settings.rotationZ),
    );
  });

  return (
    <group ref={groupRef}>
      {materials.map((material, index) => (
        <points
          key={layers[index].key}
          geometry={geometry}
          material={material}
          frustumCulled={false}
          renderOrder={index + 1}
        />
      ))}
    </group>
  );
}