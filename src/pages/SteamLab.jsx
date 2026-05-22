import { OrbitControls } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import SteamField from '../components/SteamField.jsx';

const STEAM_LAB_DEFAULTS = {
  count: 3600,
  particleSize: 1.45,
  width: 1.8,
  length: 1.1,
  height: 14,
  riseSpeed: 0.42,
  spread: 0.72,
  turbulence: 0.52,
  density: 0.72,
  timeScale: 0.34,
  y: 0.02,
  color: '#f5f8ff',
  rotationX: 0,
  rotationY: 0,
  rotationZ: 0,
};

const STEAM_LAB_FLOOR_OFFSET_Y = -2.42;

const STEAM_LAYERS = [
  { key: 'core', sizeBoost: 1.1, opacityBoost: 1, driftBoost: 0.9, timeOffset: 0 },
  { key: 'body', sizeBoost: 2.1, opacityBoost: 0.54, driftBoost: 1.16, timeOffset: 0.18 },
  { key: 'mist', sizeBoost: 3.6, opacityBoost: 0.22, driftBoost: 1.42, timeOffset: 0.37 },
];

const STEAM_LAB_STORAGE_KEY = 'dogdream:steam-lab-settings:v1';
const STEAM_LAB_PANEL_OPEN_STORAGE_KEY = 'dogdream:steam-lab-panel-open:v1';
const CORRIDOR_SMOKE_STORAGE_KEY = 'dogdream:corridor-smoke-settings:v1';
const STEAM_LAB_PANEL_ENTRY_ENABLED = false;

function loadSteamLabPanelOpen() {
  if (typeof window === 'undefined') return false;

  try {
    return window.localStorage.getItem(STEAM_LAB_PANEL_OPEN_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function saveSteamLabPanelOpen(isOpen) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(STEAM_LAB_PANEL_OPEN_STORAGE_KEY, isOpen ? '1' : '0');
  } catch {
    // ignore
  }
}

function mapSteamToCorridorSettings(settings) {
  return {
    count: settings.count,
    particleSize: settings.particleSize,
    width: settings.width,
    length: settings.length,
    cameraOffsetZ: 0,
    height: settings.height,
    riseSpeed: settings.riseSpeed,
    spread: settings.spread,
    turbulence: settings.turbulence,
    density: settings.density,
    y: settings.y,
    color: settings.color,
    timeScale: settings.timeScale,
    rotationX: settings.rotationX,
    rotationY: settings.rotationY,
    rotationZ: settings.rotationZ,
  };
}

function normalizeSteamSettings(source) {
  const next = { ...STEAM_LAB_DEFAULTS };

  if (!source || typeof source !== 'object') {
    return next;
  }

  for (const [key, value] of Object.entries(source)) {
    if (key === 'depth') {
      const numericValue = Number(value);
      if (Number.isFinite(numericValue)) {
        next.length = numericValue;
      }
      continue;
    }

    if (key === 'emitterY') {
      const numericValue = Number(value);
      if (Number.isFinite(numericValue)) {
        next.y = THREE.MathUtils.clamp(numericValue - STEAM_LAB_FLOOR_OFFSET_Y, 0, 0.18);
      }
      continue;
    }

    if (!(key in next)) continue;

    if (key === 'color' && typeof value === 'string') {
      next.color = value;
      continue;
    }

    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) continue;

    next[key] = key === 'count' ? Math.round(numericValue) : numericValue;
  }

  return next;
}

function loadSteamSettings() {
  if (typeof window === 'undefined') {
    return { ...STEAM_LAB_DEFAULTS };
  }

  try {
    const raw = window.localStorage.getItem(STEAM_LAB_STORAGE_KEY);
    if (!raw) return { ...STEAM_LAB_DEFAULTS };

    return normalizeSteamSettings(JSON.parse(raw));
  } catch {
    return { ...STEAM_LAB_DEFAULTS };
  }
}

function saveSteamSettings(settings) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(STEAM_LAB_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

function saveCorridorSmokeSettingsFromSteamLab(settings) {
  if (typeof window === 'undefined') return false;

  const next = mapSteamToCorridorSettings(settings);

  try {
    window.localStorage.setItem(CORRIDOR_SMOKE_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('dogdream:corridor-smoke-settings-updated', { detail: next }));
    return true;
  } catch {
    return false;
  }
}

function buildSteamGeometry(settings) {
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

function createSteamMaterial(sharedUniforms, layer) {
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

function SteamPlume({ settings }) {
  const groupRef = useRef(null);
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
    () => STEAM_LAYERS.map((layer) => createSteamMaterial(sharedUniforms, layer)),
    [sharedUniforms],
  );

  useEffect(() => () => {
    geometry.dispose();
    materials.forEach((material) => material.dispose());
  }, [geometry, materials]);

  useFrame((state) => {
    sharedUniforms.time.value = state.clock.getElapsedTime();
    if (!groupRef.current) return;

    groupRef.current.position.set(0, STEAM_LAB_FLOOR_OFFSET_Y + settings.y, 0);
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
          key={STEAM_LAYERS[index].key}
          geometry={geometry}
          material={material}
          frustumCulled={false}
          renderOrder={index + 1}
        />
      ))}
    </group>
  );
}

function SteamBounds({ settings }) {
  const width = Math.max(0.18, settings.width + settings.spread * 1.7);
  const height = Math.max(0.4, settings.height);
  const depth = Math.max(0.18, settings.length + settings.spread * 1.7);

  return (
    <mesh position={[0, height * 0.5, 0]}>
      <boxGeometry args={[width, height, depth]} />
      <meshBasicMaterial color="#87a7ff" wireframe transparent opacity={0.18} depthWrite={false} />
    </mesh>
  );
}

function SteamScene({ settings }) {
  return (
    <>
      <color attach="background" args={['#08090d']} />
      <fog attach="fog" args={['#08090d', 10, 28]} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 8, 5]} intensity={0.35} color="#ffffff" />
      <mesh position={[0, -2.55, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[7.5, 80]} />
        <meshStandardMaterial color="#101217" roughness={1} metalness={0} />
      </mesh>
      <mesh position={[0, -2.48, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.12, 0.5, 80]} />
        <meshBasicMaterial color="#dfe8ff" transparent opacity={0.14} />
      </mesh>
      <SteamField settings={settings} baseY={-2.42} followCameraOffsetZ={null} />
      <SteamBounds settings={settings} />
      <OrbitControls enablePan={false} minDistance={5} maxDistance={15} maxPolarAngle={Math.PI * 0.48} minPolarAngle={Math.PI * 0.12} />
    </>
  );
}

function formatValue(key, value) {
  if (key === 'count') return `${Math.round(value)}`;
  if (key.startsWith('rotation')) return `${Math.round(value)}°`;
  if (key === 'color') return value;
  return `${Number(value).toFixed(3).replace(/\.0+$/, '').replace(/\.([1-9]*)0+$/, '.$1')}`;
}

function ControlPanel({ settings, onChange, onReset, onBack, onSaveCurrent, saveStatus }) {
  const [open, setOpen] = useState(() => loadSteamLabPanelOpen());

  const controls = [
    ['count', '粒子数量', settings.count, 500, 12000, 50],
    ['particleSize', '粒子大小', settings.particleSize, 0.5, 6, 0.01],
    ['width', '喷口宽度', settings.width, 0.4, 30, 0.1],
    ['length', '喷口深度', settings.length, 0.2, 8, 0.1],
    ['y', '贴地高度', settings.y, 0, 0.18, 0.001],
    ['height', '上升高度', settings.height, 1.5, 30, 0.1],
    ['riseSpeed', '上升速度', settings.riseSpeed, 0.05, 2, 0.01],
    ['spread', '扩散幅度', settings.spread, 0.02, 3, 0.01],
    ['turbulence', '湍流强度', settings.turbulence, 0, 1.2, 0.01],
    ['density', '浓度', settings.density, 0.05, 8, 0.01],
    ['timeScale', '漂移速度', settings.timeScale, -2, 2, 0.01],
    ['rotationX', '旋转 X', settings.rotationX, -180, 180, 1],
    ['rotationY', '旋转 Y', settings.rotationY, -180, 180, 1],
    ['rotationZ', '旋转 Z', settings.rotationZ, -180, 180, 1],
  ];

  const update = useCallback((key, value) => {
    onChange((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, [onChange]);

  const updateNumber = useCallback((key, rawValue) => {
    const nextValue = Number(rawValue);
    if (!Number.isFinite(nextValue)) return;
    update(key, nextValue);
  }, [update]);

  const toggleOpen = useCallback(() => {
    setOpen((next) => {
      const value = !next;
      saveSteamLabPanelOpen(value);
      return value;
    });
  }, []);

  useEffect(() => {
    if (!STEAM_LAB_PANEL_ENTRY_ENABLED) return undefined;

    function onKeyDown(event) {
      if (event.shiftKey && event.key.toLowerCase() === 's') {
        event.preventDefault();
        toggleOpen();
      }

      if (event.key === 'Escape') {
        setOpen((next) => {
          if (!next) return next;
          saveSteamLabPanelOpen(false);
          return false;
        });
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggleOpen]);

  useEffect(() => {
    if (!STEAM_LAB_PANEL_ENTRY_ENABLED) return;
    saveSteamLabPanelOpen(open);
  }, [open]);

  if (!STEAM_LAB_PANEL_ENTRY_ENABLED) {
    return null;
  }

  if (!open) {
    return (
      <button
        className="steam-lab-fab"
        type="button"
        onClick={toggleOpen}
        aria-label="打开蒸汽实验面板"
        title="打开蒸汽实验面板（Shift+S）"
      >
        ⚙
      </button>
    );
  }

  return (
    <aside className="steam-lab-panel" aria-label="蒸汽实验调节面板">
      <div className="steam-lab-panel__header">
        <div>
          <p className="steam-lab-panel__eyebrow">参数面板</p>
          <h1>蒸汽实验</h1>
        </div>
        <div className="steam-lab-panel__actions">
          <button className="site-button site-button--ghost" type="button" onClick={toggleOpen}>
            收起
          </button>
          <button className="site-button" type="button" onClick={onSaveCurrent}>
            保存当前
          </button>
          <button className="site-button site-button--ghost" type="button" onClick={onBack}>返回</button>
          <button className="site-button" type="button" onClick={onReset}>恢复默认</button>
        </div>
      </div>

      <p className="steam-lab-panel__hint">参数会自动保存在本机浏览器；点“保存当前”会同步到走廊。</p>
      {saveStatus && <p className="steam-lab-panel__saved">{saveStatus}</p>}

      <div className="steam-lab-panel__grid">
        {controls.map(([key, label, value, min, max, step]) => (
          <label key={key} className="steam-lab-control">
            <span>
              {label}
              <output>{formatValue(key, value)}</output>
            </span>
            <div className="steam-lab-control__row">
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(event) => update(key, key === 'count' ? Number.parseInt(event.target.value, 10) : Number(event.target.value))}
              />
              {key === 'rotationX' && (
                <input
                  className="steam-lab-control__number"
                  type="number"
                  min={min}
                  max={max}
                  step="0.01"
                  value={Number(value).toFixed(2)}
                  onChange={(event) => updateNumber(key, event.target.value)}
                />
              )}
            </div>
          </label>
        ))}
        <label className="steam-lab-control steam-lab-control--color">
          <span>
            蒸汽颜色
            <output>{settings.color}</output>
          </span>
          <input type="color" value={settings.color} onChange={(event) => update('color', event.target.value)} />
        </label>
      </div>
    </aside>
  );
}

export default function SteamLab({ onBack, onApplyToCorridor }) {
  const [settings, setSettings] = useState(() => loadSteamSettings());
  const [saveStatus, setSaveStatus] = useState('');

  const handleReset = useCallback(() => {
    setSettings({ ...STEAM_LAB_DEFAULTS });
    setSaveStatus('');
  }, []);

  const handleSaveCurrent = useCallback(() => {
    const savedSteam = saveSteamSettings(settings);
    const mappedCorridorSettings = mapSteamToCorridorSettings(settings);
    const savedCorridor = saveCorridorSmokeSettingsFromSteamLab(settings);
    setSaveStatus(savedCorridor ? '已保存，并同步到走廊' : '已保存到本机');
    if (savedCorridor) {
      window.setTimeout(() => {
        setSaveStatus('');
        (onApplyToCorridor ?? onBack)(mappedCorridorSettings);
      }, 500);
    } else {
      window.setTimeout(() => setSaveStatus(''), 1600);
    }
    return savedSteam || savedCorridor;
  }, [onApplyToCorridor, onBack, settings]);

  useEffect(() => {
    saveSteamSettings(settings);
  }, [settings]);

  return (
    <main className="steam-lab page-shell">
      <Canvas camera={{ position: [0, 2.2, 7.5], fov: 42, near: 0.1, far: 80 }} dpr={[1, 1.5]}>
        <SteamScene settings={settings} />
      </Canvas>

      <ControlPanel
        settings={settings}
        onChange={setSettings}
        onReset={handleReset}
        onBack={onBack}
        onSaveCurrent={handleSaveCurrent}
        saveStatus={saveStatus}
      />
    </main>
  );
}
