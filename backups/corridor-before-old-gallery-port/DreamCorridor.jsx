import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import FramePortal from '../components/FramePortal.jsx';
import PawTrail from '../components/PawTrail.jsx';
import { projects } from '../data/projects.js';

const WALL_ANGLE = Math.PI / 2;
const WALL_X = 5.2;
const CORRIDOR_LENGTH = 78;
const CORRIDOR_CENTER_Z = -20;
const FRAME_SPACING = 5.8;
const FRAME_CYCLE_LENGTH = FRAME_SPACING * 3;

function getLoopProgress(scrollDistance) {
  return ((scrollDistance % 1) + 1) % 1;
}

function getFrameLayout(project, index, loopProgress = 0) {
  const leftSide = index % 2 === 0;
  const side = leftSide ? -1 : 1;
  const row = Math.floor(index / 2);
  let z = 1.1 - row * FRAME_SPACING + loopProgress * FRAME_SPACING;

  while (z > 1.6) z -= FRAME_CYCLE_LENGTH;
  while (z < 1.6 - FRAME_CYCLE_LENGTH) z += FRAME_CYCLE_LENGTH;

  const depthScale = THREE.MathUtils.clamp((z + 15.8) / 17.4, 0, 1);
  const frameWidth = THREE.MathUtils.lerp(1.02, 1.72, depthScale);
  const frameHeight = THREE.MathUtils.lerp(1.9, 2.95, depthScale);
  const x = side * (WALL_X - 0.08);

  return {
    ...project,
    index,
    side,
    frameWidth,
    frameHeight,
    position: [x, 2.08, z],
    rotation: [0, leftSide ? WALL_ANGLE : -WALL_ANGLE, 0],
    cameraPosition: new THREE.Vector3(side * 2.45, 1.86, z + 2.35),
    lookAt: new THREE.Vector3(x, 2.04, z),
  };
}

function CorridorGeometry() {
  return (
    <group>
      <mesh position={[0, 0, CORRIDOR_CENTER_Z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[WALL_X * 2, CORRIDOR_LENGTH]} />
        <meshStandardMaterial color="#f1f1ef" roughness={0.94} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-WALL_X, 2.1, CORRIDOR_CENTER_Z]} rotation={[0, WALL_ANGLE, 0]}>
        <planeGeometry args={[CORRIDOR_LENGTH, 4.2]} />
        <meshStandardMaterial color="#d2d2d0" roughness={0.96} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[WALL_X, 2.1, CORRIDOR_CENTER_Z]} rotation={[0, -WALL_ANGLE, 0]}>
        <planeGeometry args={[CORRIDOR_LENGTH, 4.2]} />
        <meshStandardMaterial color="#d2d2d0" roughness={0.96} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 4.2, CORRIDOR_CENTER_Z]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[WALL_X * 2, CORRIDOR_LENGTH]} />
        <meshStandardMaterial color="#dddddb" roughness={0.96} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 2.1, -48]}>
        <planeGeometry args={[WALL_X * 2, 4.2]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.96} />
      </mesh>
      <pointLight position={[0, 2.1, -42]} intensity={46} distance={22} color="#ffffff" />
      <pointLight position={[0, 3, 4]} intensity={3} distance={18} color="#ffffff" />
    </group>
  );
}

function CorridorScene({ scrollDistance, loopProgress, pawActive, focusedProject, onFocusProject }) {
  const frames = useMemo(
    () => projects.map((project, index) => getFrameLayout(project, index, loopProgress)),
    [loopProgress],
  );

  useFrame((state) => {
    const camera = state.camera;
    const targetPosition = focusedProject ? focusedProject.cameraPosition : new THREE.Vector3(0, 1.9, 8.8);
    const targetLook = focusedProject ? focusedProject.lookAt : new THREE.Vector3(0, 2.08, -18);

    camera.position.lerp(targetPosition, 0.075);
    camera.lookAt(targetLook);
  });

  return (
    <>
      <color attach="background" args={['#f6f6f4']} />
      <fog attach="fog" args={['#f6f6f4', 8, 36]} />
      <ambientLight intensity={1.28} />
      <directionalLight position={[0, 5.6, 6]} intensity={1.2} color="#ffffff" />
      <CorridorGeometry />
      <PawTrail progress={loopProgress} active={pawActive} />
      {frames.map((project) => (
        <FramePortal
          key={project.id}
          project={project}
          isFocused={focusedProject?.id === project.id}
          onClick={() => onFocusProject(project)}
        />
      ))}
    </>
  );
}

export default function DreamCorridor({ activeProjectId, onEnterProject, onWakeUp }) {
  const [scrollDistance, setScrollDistance] = useState(0);
  const [focusedProject, setFocusedProject] = useState(null);
  const [pawActive, setPawActive] = useState(false);
  const pawTimerRef = useRef(null);
  const loopProgress = getLoopProgress(scrollDistance);

  function handleWheel(event) {
    if (focusedProject) return;
    setScrollDistance((current) => current + event.deltaY * 0.0009);
    setPawActive(true);
    window.clearTimeout(pawTimerRef.current);
    pawTimerRef.current = window.setTimeout(() => setPawActive(false), 760);
  }

  function handleFocusProject(project) {
    setFocusedProject(project);
  }

  function handleEnterDeepDream() {
    if (!focusedProject) return;
    onEnterProject(focusedProject.id);
  }

  return (
    <main className="corridor page-shell" onWheel={handleWheel}>
      <Canvas camera={{ position: [0, 1.85, 8.8], fov: 58 }} dpr={[1, 1.75]}>
        <CorridorScene
          scrollDistance={scrollDistance}
          loopProgress={loopProgress}
          pawActive={pawActive}
          focusedProject={focusedProject}
          activeProjectId={activeProjectId}
          onFocusProject={handleFocusProject}
        />
      </Canvas>

      {!focusedProject && (
        <div className="frame-hotspots" aria-label="作品画框入口">
          {projects.map((project, index) => (
            <button
              key={project.id}
              className={`frame-hotspot frame-hotspot--${index + 1}`}
              type="button"
              onClick={() => handleFocusProject({
                ...getFrameLayout(project, index, loopProgress),
              })}
              aria-label={`查看 ${project.title}`}
            />
          ))}
        </div>
      )}

      <div className="corridor-status">
        <span>DREAM CORRIDOR</span>
        <span>LOOP</span>
      </div>

      {focusedProject && (
        <aside className="focus-copy" aria-label="项目简介">
          <p className="eyebrow">项目简介</p>
          <h2>{focusedProject.title}</h2>
          <p>{focusedProject.summary}</p>
          <div className="focus-actions">
            <button className="site-button" type="button" onClick={handleEnterDeepDream}>进入深梦</button>
            <button className="site-button site-button--ghost" type="button" onClick={() => setFocusedProject(null)}>返回走廊</button>
          </div>
        </aside>
      )}

      <button className="site-button wake-button" type="button" onClick={onWakeUp}>wake up</button>
    </main>
  );
}
