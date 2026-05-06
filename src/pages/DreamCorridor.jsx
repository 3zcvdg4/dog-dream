import { Canvas, useFrame } from '@react-three/fiber';
import { useCallback, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import FramePortal from '../components/FramePortal.jsx';
import PawTrail from '../components/PawTrail.jsx';
import { projects } from '../data/projects.js';

const LOOP_LENGTH = 36;
const GALLERY_MAX_Z = 0;
const GALLERY_SCROLL_FACTOR = 0.012;
const MAX_WHEEL_DELTA = 90;
const CAMERA_SMOOTH_FACTOR = 0.06;
const PAW_PHASE_PER_DELTA = 0.0042;
const MAX_PAW_PHASE_INCREMENT = 0.4;
const WALL_X = 3;
const CORRIDOR_LENGTH = 96;
const FRAME_WIDTH = 1.22;
const FRAME_HEIGHT = 1.68;
const LEFT_FRAME_Y = 1.58;
const RIGHT_FRAME_Y = 1.72;
const VISIBLE_FRAME_CYCLES = 4;

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

function createGalleryFrames(activeCycle) {
  const startCycle = Math.max(0, activeCycle - 1);

  return Array.from({ length: VISIBLE_FRAME_CYCLES }).flatMap((_, visibleCycleIndex) => WORK_LAYOUT.map((layout, index) => {
    const cycleIndex = startCycle + visibleCycleIndex;
    const project = projects[index % projects.length];
    const sideSign = layout.side === 'left' ? -1 : 1;
    const y = layout.side === 'left' ? LEFT_FRAME_Y : RIGHT_FRAME_Y;
    const z = layout.z - cycleIndex * LOOP_LENGTH;
    const frameIndex = cycleIndex * WORK_LAYOUT.length + index;

    return {
      ...project,
      frameKey: `${project.id}-${cycleIndex}-${index}`,
      index: frameIndex,
      side: sideSign,
      frameWidth: FRAME_WIDTH,
      frameHeight: FRAME_HEIGHT,
      position: [sideSign * WALL_X, y, z],
      rotation: [0, layout.side === 'left' ? Math.PI / 2 : -Math.PI / 2, layout.rotZ],
      cameraPosition: new THREE.Vector3(0, y, z),
      lookAt: new THREE.Vector3(sideSign * 10, y, z),
    };
  }));
}

function CorridorGeometry() {
  const groupRef = useRef(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.position.z = state.camera.position.z - CORRIDOR_LENGTH / 2;
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[6, CORRIDOR_LENGTH]} />
        <meshStandardMaterial color="#f0f0f0" roughness={1} side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[0, 3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6, CORRIDOR_LENGTH]} />
        <meshStandardMaterial color="#ffffff" roughness={1} side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[-WALL_X, 1.5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[CORRIDOR_LENGTH, 3]} />
        <meshStandardMaterial color="#f5f5f5" roughness={1} side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[WALL_X, 1.5, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[CORRIDOR_LENGTH, 3]} />
        <meshStandardMaterial color="#f5f5f5" roughness={1} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

const PAW_HOLD_MS = 520;

function CorridorScene({ targetZ, activeCycle, focusedProject, onFocusProject }) {
  const cameraZRef = useRef(targetZ);
  const frames = useMemo(() => createGalleryFrames(activeCycle), [activeCycle]);

  useFrame((state) => {
    const camera = state.camera;

    if (focusedProject) {
      camera.position.lerp(focusedProject.cameraPosition, 0.12);
      camera.lookAt(focusedProject.lookAt);
      return;
    }

    cameraZRef.current += (targetZ - cameraZRef.current) * CAMERA_SMOOTH_FACTOR;
    camera.position.lerp(new THREE.Vector3(0, 1.5, cameraZRef.current), 0.12);
    camera.lookAt(0, 1.5, cameraZRef.current - 8);
  });

  return (
    <>
      <color attach="background" args={['#fafafa']} />
      <fog attach="fog" args={['#fafafa', 16, 72]} />
      <ambientLight intensity={2.3} />
      <directionalLight position={[0, 6, -5]} intensity={1} color="#ffffff" />
      <CorridorGeometry />
      {frames.map((project) => (
        <FramePortal
          key={project.frameKey}
          project={project}
          isFocused={focusedProject?.frameKey === project.frameKey}
          onClick={(event) => {
            event.stopPropagation();
            onFocusProject(project);
          }}
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
  const pawTimerRef = useRef(null);
  const activeCycle = Math.max(0, Math.floor(Math.abs(targetZ) / LOOP_LENGTH));
  const loopProgress = Math.abs(targetZ % LOOP_LENGTH) / LOOP_LENGTH;

  const extendPawVisibility = useCallback(() => {
    setPawActive(true);
    window.clearTimeout(pawTimerRef.current);
    pawTimerRef.current = window.setTimeout(() => setPawActive(false), PAW_HOLD_MS);
  }, []);

  function handleWheel(event) {
    if (focusedProject) return;
    const delta = Math.max(-MAX_WHEEL_DELTA, Math.min(MAX_WHEEL_DELTA, event.deltaY));
    if (delta === 0) return;
    setTargetZ((current) => {
      const next = current - delta * GALLERY_SCROLL_FACTOR;
      return Math.min(next, GALLERY_MAX_Z);
    });
    const forwardDelta = Math.max(delta, 0);
    if (forwardDelta > 0) {
      setPawPhase((current) => {
        const next = current + Math.min(forwardDelta * PAW_PHASE_PER_DELTA, MAX_PAW_PHASE_INCREMENT);
        return next > 1000 ? next % 4 : next;
      });
    }
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
    <main className="corridor page-shell" onWheel={handleWheel}>
      <Canvas camera={{ position: [0, 1.5, 0], fov: 55, near: 0.1, far: 120 }} dpr={[1, 1.75]}>
        <CorridorScene
          targetZ={targetZ}
          activeCycle={activeCycle}
          focusedProject={focusedProject}
          onFocusProject={handleFocusProject}
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
