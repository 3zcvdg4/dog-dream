import { useTexture } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import FramePortal from '../components/FramePortal.jsx';
import PawTrail from '../components/PawTrail.jsx';
import { projects } from '../data/projects.js';

const LOOP_LENGTH = 33;
const GALLERY_MAX_Z = 0;
const GALLERY_SCROLL_FACTOR = 0.012;
const MAX_WHEEL_DELTA = 90;
const CAMERA_SMOOTH_FACTOR = 0.06;
const PAW_PHASE_PER_DELTA = 0.0042;
const MAX_PAW_PHASE_INCREMENT = 0.4;
const WALL_X = 3.25;
const CORRIDOR_HEIGHT = 3.6;
const CORRIDOR_SEGMENT_LENGTH = LOOP_LENGTH;
const FRAME_WIDTH = 1.22;
const FRAME_HEIGHT = 1.68;
const LEFT_FRAME_Y = 1.76;
const RIGHT_FRAME_Y = 1.9;
const CAMERA_FOV = 50;
function getFocusZOffsetMagnitude(viewportWidth) {
  if (viewportWidth <= 760) return -0.12;
  if (viewportWidth <= 1024) return -0.36;
  if (viewportWidth <= 1280) return -0.58;
  return -0.76;
}

const VISIBLE_FRAME_CYCLES = 2;
const FRAME_RENDER_AHEAD_DISTANCE = LOOP_LENGTH * 1.45;
const FRAME_KEEP_BEHIND_DISTANCE = 0.6;
const NEXT_CYCLE_FADE_FIRST_START_PROGRESS = 0.56;
const NEXT_CYCLE_FADE_DURATION = 0.15;
const NEXT_CYCLE_PAIR_FADE_STAGGER = 0.05;
const EXIT_VISUAL = {
  offset: CORRIDOR_SEGMENT_LENGTH * 1.18,
  background: '#f5f5f1',
  fog: {
    color: '#f6f6f3',
    near: 11,
    far: 38,
  },
  glowTexture: {
    width: 1024,
    height: 512,
    centerOpacity: 0.9,
    innerRadius: 0.06,
    softRadius: 0.3,
    bloomRadius: 0.42,
  },
  glowLayers: [
    { scale: [3.0, 1.34, 1], opacity: 0.48, zOffset: 0 },
    { scale: [3.85, 1.82, 1], opacity: 0.09, zOffset: -1.2 },
  ],
};
const CEILING_TEXTURE_URL = '/assets/corridor-ceiling.png';
const FLOOR_TEXTURE_URL = '/assets/corridor-floor.png';
const LEFT_WALL_TEXTURE_URL = '/assets/corridor-left-wall.png';
const RIGHT_WALL_TEXTURE_URL = '/assets/corridor-right-wall.png';
const CORRIDOR_RENDER_LENGTH = CORRIDOR_SEGMENT_LENGTH * 8;
const FOCUSED_CAMERA_WALL_DISTANCE = 3.4;
const CORRIDOR_DPR_CAP = 1.25;
const EXIT_CENTER_Y = 1.5;
const WALL_ALIGNMENT_DEBUG = {
  enabled: false,
  disableScreenOverlay: true,
  useFlatSurfaceColors: true,
};
const DEBUG_SURFACE_COLORS = {
  ceiling: '#f4cfd2',
  leftWall: '#d7e8ff',
  rightWall: '#dff0d4',
};

const WORK_LAYOUT = [
  { z: -4.5, side: 'left', rotZ: 0.04 },
  { z: -5.2, side: 'right', rotZ: -0.03 },
  { z: -9.8, side: 'left', rotZ: 0.05 },
  { z: -10.5, side: 'right', rotZ: -0.04 },
  { z: -15.1, side: 'left', rotZ: 0.02 },
  { z: -15.8, side: 'right', rotZ: -0.06 },
  { z: -20.4, side: 'left', rotZ: 0.04 },
  { z: -21.1, side: 'right', rotZ: -0.03 },
  { z: -25.7, side: 'left', rotZ: 0.05 },
  { z: -26.4, side: 'right', rotZ: -0.04 },
  { z: -31.0, side: 'left', rotZ: 0.02 },
  { z: -31.7, side: 'right', rotZ: -0.06 },
];

const FRAME_LAYOUTS = WORK_LAYOUT.map((layout, index) => {
  const sideSign = layout.side === 'left' ? -1 : 1;
  const y = layout.side === 'left' ? LEFT_FRAME_Y : RIGHT_FRAME_Y;

  return {
    index,
    z: layout.z,
    rotZ: layout.rotZ,
    sideSign,
    x: sideSign * WALL_X,
    y,
    rotationY: layout.side === 'left' ? Math.PI / 2 : -Math.PI / 2,
    cameraX: sideSign * (WALL_X - FOCUSED_CAMERA_WALL_DISTANCE),
    lookAtX: sideSign * WALL_X,
  };
});

function getNextCycleFrameVisibility(index, loopProgress) {
  const pairIndex = Math.floor(index / 2);
  const fadeStart = NEXT_CYCLE_FADE_FIRST_START_PROGRESS + pairIndex * NEXT_CYCLE_PAIR_FADE_STAGGER;
  const fadeEnd = fadeStart + NEXT_CYCLE_FADE_DURATION;

  return THREE.MathUtils.clamp(
    (loopProgress - fadeStart) / (fadeEnd - fadeStart),
    0,
    1,
  );
}

function createGalleryFrames(activeCycle, cameraZ, loopProgress) {
  const minVisibleZ = cameraZ - FRAME_RENDER_AHEAD_DISTANCE;
  const maxVisibleZ = cameraZ + FRAME_KEEP_BEHIND_DISTANCE;

  return Array.from({ length: VISIBLE_FRAME_CYCLES }).flatMap((_, cycleOffset) => {
    const cycleIndex = activeCycle + cycleOffset;

    return FRAME_LAYOUTS.map((layout) => {
      const project = projects[layout.index % projects.length];
      const z = layout.z - cycleIndex * LOOP_LENGTH;
      const frameIndex = cycleIndex * FRAME_LAYOUTS.length + layout.index;
      const cycleDistance = cycleIndex - activeCycle;
      let visibility = 0;

      if (cycleDistance === 0) {
        visibility = 1;
      } else if (cycleDistance === 1) {
        visibility = getNextCycleFrameVisibility(layout.index, loopProgress);
      }

      if (z < minVisibleZ || z > maxVisibleZ || visibility <= 0) {
        return null;
      }

      return {
        ...project,
        frameKey: `${project.id}-${cycleIndex}-${layout.index}`,
        index: frameIndex,
        side: layout.sideSign,
        frameWidth: FRAME_WIDTH,
        frameHeight: FRAME_HEIGHT,
        position: [layout.x, layout.y, z],
        rotation: [0, layout.rotationY, layout.rotZ],
        cameraX: layout.cameraX,
        cameraY: layout.y,
        cameraZ: z,
        lookAtX: layout.lookAtX,
        lookAtY: layout.y,
        lookAtZ: z,
        opacity: visibility,
      };
    }).filter(Boolean);
  });
}

function createSurfaceTexture(sourceTexture) {
  sourceTexture.colorSpace = THREE.SRGBColorSpace;
  sourceTexture.wrapS = THREE.ClampToEdgeWrapping;
  sourceTexture.wrapT = THREE.ClampToEdgeWrapping;
  sourceTexture.needsUpdate = true;
  return sourceTexture;
}

function CorridorSurface({
  position,
  rotation,
  args,
  texture,
  debugColor,
}) {
  return (
    <mesh position={position} rotation={rotation} receiveShadow>
      <planeGeometry args={args} />
      <meshBasicMaterial
        map={debugColor ? null : texture}
        color={debugColor ?? '#ffffff'}
        side={THREE.FrontSide}
        toneMapped={false}
      />
    </mesh>
  );
}

function CorridorGeometry() {
  const groupRef = useRef(null);
  const rawTextures = useTexture({
    ceiling: CEILING_TEXTURE_URL,
    floor: FLOOR_TEXTURE_URL,
    leftWall: LEFT_WALL_TEXTURE_URL,
    rightWall: RIGHT_WALL_TEXTURE_URL,
  });
  const textures = useMemo(() => ({
    ceiling: createSurfaceTexture(rawTextures.ceiling),
    floor: createSurfaceTexture(rawTextures.floor),
    leftWall: createSurfaceTexture(rawTextures.leftWall),
    rightWall: createSurfaceTexture(rawTextures.rightWall),
  }), [rawTextures]);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.position.z = state.camera.position.z;
  });

  return (
    <group ref={groupRef}>
      <CorridorSurface
        position={[0, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        args={[WALL_X * 2, CORRIDOR_RENDER_LENGTH]}
        texture={textures.floor}
      />
      <CorridorSurface
        position={[0, CORRIDOR_HEIGHT, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        args={[WALL_X * 2, CORRIDOR_RENDER_LENGTH]}
        texture={textures.ceiling}
        debugColor={WALL_ALIGNMENT_DEBUG.enabled && WALL_ALIGNMENT_DEBUG.useFlatSurfaceColors ? DEBUG_SURFACE_COLORS.ceiling : null}
      />
      <CorridorSurface
        position={[-WALL_X, CORRIDOR_HEIGHT / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
        args={[CORRIDOR_RENDER_LENGTH, CORRIDOR_HEIGHT]}
        texture={textures.leftWall}
        debugColor={WALL_ALIGNMENT_DEBUG.enabled && WALL_ALIGNMENT_DEBUG.useFlatSurfaceColors ? DEBUG_SURFACE_COLORS.leftWall : null}
      />
      <CorridorSurface
        position={[WALL_X, CORRIDOR_HEIGHT / 2, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        args={[CORRIDOR_RENDER_LENGTH, CORRIDOR_HEIGHT]}
        texture={textures.rightWall}
        debugColor={WALL_ALIGNMENT_DEBUG.enabled && WALL_ALIGNMENT_DEBUG.useFlatSurfaceColors ? DEBUG_SURFACE_COLORS.rightWall : null}
      />
    </group>
  );
}

function createExitGlowTexture() {
  const {
    width,
    height,
    centerOpacity,
    innerRadius,
    softRadius,
    bloomRadius,
  } = EXIT_VISUAL.glowTexture;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    return null;
  }

  context.clearRect(0, 0, width, height);

  context.save();
  context.translate(width / 2, height / 2);
  context.scale(1, 0.58);

  const coreGlow = context.createRadialGradient(0, 0, 0, 0, 0, width * softRadius);
  coreGlow.addColorStop(0, `rgba(255, 255, 255, ${centerOpacity})`);
  coreGlow.addColorStop(innerRadius, 'rgba(255, 255, 255, 0.84)');
  coreGlow.addColorStop(0.32, 'rgba(255, 255, 255, 0.34)');
  coreGlow.addColorStop(0.62, 'rgba(255, 255, 255, 0.06)');
  coreGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
  context.fillStyle = coreGlow;
  context.fillRect(-width / 2, -height, width, height * 2);

  context.globalCompositeOperation = 'lighter';
  const outerBloom = context.createRadialGradient(0, 0, 0, 0, 0, width * bloomRadius);
  outerBloom.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
  outerBloom.addColorStop(0.46, 'rgba(255, 255, 255, 0.035)');
  outerBloom.addColorStop(1, 'rgba(255, 255, 255, 0)');
  context.fillStyle = outerBloom;
  context.fillRect(-width / 2, -height, width, height * 2);
  context.restore();

  context.globalCompositeOperation = 'destination-in';
  const edgeFade = context.createRadialGradient(width / 2, height / 2, width * 0.07, width / 2, height / 2, width * 0.32);
  edgeFade.addColorStop(0, 'rgba(255, 255, 255, 1)');
  edgeFade.addColorStop(0.48, 'rgba(255, 255, 255, 0.7)');
  edgeFade.addColorStop(0.72, 'rgba(255, 255, 255, 0.14)');
  edgeFade.addColorStop(1, 'rgba(255, 255, 255, 0)');
  context.fillStyle = edgeFade;
  context.fillRect(0, 0, width, height);
  context.globalCompositeOperation = 'source-over';

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

function ExitVisualGlow() {
  const groupRef = useRef(null);
  const glowTexture = useMemo(() => createExitGlowTexture(), []);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.position.set(0, EXIT_CENTER_Y, state.camera.position.z - EXIT_VISUAL.offset);
  });

  if (!glowTexture) {
    return null;
  }

  return (
    <group ref={groupRef}>
      {EXIT_VISUAL.glowLayers.map((layer, index) => (
        <mesh
          key={layer.scale.join('-')}
          position={[0, 0, layer.zOffset]}
          scale={layer.scale}
          renderOrder={10 + index}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={glowTexture}
            color="#ffffff"
            transparent
            opacity={layer.opacity}
            depthWrite={false}
            fog={false}
            toneMapped={false}
            blending={THREE.NormalBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

const PAW_HOLD_MS = 520;

function CorridorScene({ targetZ, activeCycle, loopProgress, focusedProject, onFocusProject, viewportWidth }) {
  const cameraZRef = useRef(targetZ);
  const focusCameraVectorRef = useRef(new THREE.Vector3());
  const focusLookAtVectorRef = useRef(new THREE.Vector3());
  const frames = useMemo(
    () => createGalleryFrames(activeCycle, targetZ, loopProgress),
    [activeCycle, targetZ, loopProgress],
  );
  const visibleFrames = focusedProject ? [focusedProject] : frames;

  useFrame((state) => {
    const camera = state.camera;

    if (focusedProject) {
      const focusZOffsetMagnitude = getFocusZOffsetMagnitude(viewportWidth);
      const focusZOffset = focusedProject.side < 0 ? focusZOffsetMagnitude : -focusZOffsetMagnitude;
      focusCameraVectorRef.current.set(
        focusedProject.cameraX,
        focusedProject.cameraY,
        focusedProject.cameraZ + focusZOffset,
      );
      focusLookAtVectorRef.current.set(
        focusedProject.lookAtX,
        focusedProject.lookAtY,
        focusedProject.lookAtZ + focusZOffset,
      );
      camera.position.lerp(focusCameraVectorRef.current, 0.12);
      camera.lookAt(focusLookAtVectorRef.current);
      return;
    }

    cameraZRef.current += (targetZ - cameraZRef.current) * CAMERA_SMOOTH_FACTOR;
    camera.position.x += (0 - camera.position.x) * 0.12;
    camera.position.y += (1.5 - camera.position.y) * 0.12;
    camera.position.z += (cameraZRef.current - camera.position.z) * 0.12;
    camera.lookAt(0, 1.5, camera.position.z - 8);
  });

  return (
    <>
      <color attach="background" args={[EXIT_VISUAL.background]} />
      <fog attach="fog" args={[EXIT_VISUAL.fog.color, EXIT_VISUAL.fog.near, EXIT_VISUAL.fog.far]} />
      <ambientLight intensity={1.45} />
      <directionalLight position={[0, 6, -5]} intensity={0.52} color="#ffffff" />
      <CorridorGeometry />
      <ExitVisualGlow />
      {visibleFrames.map((project) => (
        <FramePortal
          key={project.frameKey}
          project={project}
          isFocused={focusedProject?.frameKey === project.frameKey}
          onFocusProject={onFocusProject}
        />
      ))}
    </>
  );
}

export default function DreamCorridor({ onEnterProject, onWakeUp }) {
  const [targetZ, setTargetZ] = useState(0);
  const [focusedProject, setFocusedProject] = useState(null);
  const [pawActive, setPawActive] = useState(false);
  const [pawPhase, setPawPhase] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);
  const pawTimerRef = useRef(null);
  const wheelFrameRef = useRef(0);
  const targetZRef = useRef(0);
  const pawPhaseRef = useRef(0);
  const motionQueueRef = useRef({
    hasTargetZ: false,
    nextTargetZ: 0,
    hasPawPhase: false,
    nextPawPhase: 0,
  });
  const activeCycle = Math.max(0, Math.floor(Math.abs(targetZ) / LOOP_LENGTH));
  const loopProgress = Math.abs(targetZ % LOOP_LENGTH) / LOOP_LENGTH;
  const corridorDpr = useMemo(() => [1, Math.min(window.devicePixelRatio || 1, CORRIDOR_DPR_CAP)], []);

  const flushMotionQueue = useCallback(() => {
    wheelFrameRef.current = 0;
    const queue = motionQueueRef.current;

    if (queue.hasTargetZ) {
      setTargetZ(queue.nextTargetZ);
      queue.hasTargetZ = false;
    }

    if (queue.hasPawPhase) {
      setPawPhase(queue.nextPawPhase);
      queue.hasPawPhase = false;
    }
  }, []);

  const scheduleMotionFlush = useCallback(() => {
    if (wheelFrameRef.current) return;
    wheelFrameRef.current = window.requestAnimationFrame(flushMotionQueue);
  }, [flushMotionQueue]);

  useEffect(() => () => {
    window.clearTimeout(pawTimerRef.current);
    window.cancelAnimationFrame(wheelFrameRef.current);
  }, []);

  useEffect(() => {
    function handleResize() {
      setViewportWidth(window.innerWidth);
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const extendPawVisibility = useCallback(() => {
    setPawActive(true);
    window.clearTimeout(pawTimerRef.current);
    pawTimerRef.current = window.setTimeout(() => setPawActive(false), PAW_HOLD_MS);
  }, []);

  function handleWheel(event) {
    if (focusedProject) return;
    const delta = Math.max(-MAX_WHEEL_DELTA, Math.min(MAX_WHEEL_DELTA, event.deltaY));
    if (delta === 0) return;
    const nextTargetZ = Math.min(targetZRef.current - delta * GALLERY_SCROLL_FACTOR, GALLERY_MAX_Z);
    targetZRef.current = nextTargetZ;
    motionQueueRef.current.nextTargetZ = nextTargetZ;
    motionQueueRef.current.hasTargetZ = true;

    const forwardDelta = Math.max(delta, 0);
    if (forwardDelta > 0) {
      const nextPawPhase = (() => {
        const next = pawPhaseRef.current + Math.min(forwardDelta * PAW_PHASE_PER_DELTA, MAX_PAW_PHASE_INCREMENT);
        return next > 1000 ? next % 4 : next;
      })();
      pawPhaseRef.current = nextPawPhase;
      motionQueueRef.current.nextPawPhase = nextPawPhase;
      motionQueueRef.current.hasPawPhase = true;
    }

    scheduleMotionFlush();
    extendPawVisibility();
  }

  function handleFocusProject(project) {
    setFocusedProject(project);
  }

  function handleEnterDeepDream() {
    if (!focusedProject) return;
    onEnterProject(focusedProject.id);
  }

  function handleReturnToCorridor() {
    setFocusedProject(null);
  }

  return (
    <main
      className={[
        'corridor',
        'page-shell',
        focusedProject ? 'is-focused' : '',
        WALL_ALIGNMENT_DEBUG.enabled && WALL_ALIGNMENT_DEBUG.disableScreenOverlay ? 'corridor--debug-overlay-off' : '',
      ].filter(Boolean).join(' ')}
      onWheel={handleWheel}
    >
      <Canvas
        camera={{ position: [0, 1.5, 0], fov: CAMERA_FOV, near: 0.1, far: 120 }}
        dpr={corridorDpr}
        gl={{ powerPreference: 'high-performance' }}
      >
        <CorridorScene
          targetZ={targetZ}
          activeCycle={activeCycle}
          loopProgress={loopProgress}
          focusedProject={focusedProject}
          onFocusProject={handleFocusProject}
          viewportWidth={viewportWidth}
        />
      </Canvas>

      <PawTrail active={pawActive} phase={pawPhase} />

      <div className="corridor-status">
        <span>DREAM CORRIDOR</span>
        <span>{Math.round(loopProgress * 100)}%</span>
      </div>

      {focusedProject && (
        <aside className="focus-copy" aria-label="项目简介">
          <p className="eyebrow">项目简介</p>
          <h2>{focusedProject.title}</h2>
          <p>{focusedProject.summary}</p>
          <div className="focus-actions">
            <button className="site-button" type="button" onClick={handleEnterDeepDream}>进入深梦</button>
            <button className="site-button site-button--ghost" type="button" onClick={handleReturnToCorridor}>返回走廊</button>
          </div>
        </aside>
      )}

      <button className="site-button wake-button" type="button" onClick={onWakeUp}>wake up</button>
    </main>
  );
}
