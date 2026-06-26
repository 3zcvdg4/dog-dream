/* eslint-disable react/no-unknown-property */
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, useTexture } from '@react-three/drei';
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
} from '@react-three/rapier';
import * as THREE from 'three';

export const ABOUT_LANYARD_INTRO_URL = '/assets/lanyard/about-intro.jpg?v=4';

// ── 卡片尺寸 ──────────────────────────────────────────────
const CARD_HEIGHT = 3.5;
const CARD_DEPTH = 0.06;

// ── 挂点与初始位置 ────────────────────────────────────────
const ANCHOR_Y = 6.8;
const CARD_START_Y = 0;
const CARD_START_X = 2;
const CARD_CLIP_OFFSET_Y = 0;
const CARD_CLIP_SIZE = [0.42, 0.11, 0.09];
const CARD_HOOK_Y = CARD_HEIGHT / 2 + CARD_CLIP_OFFSET_Y + CARD_CLIP_SIZE[1] / 2;

// ── 相机 ────────────────────────────────────────────────────
const CAMERA_POSITION = [-0, 2, 11.8];
const CAMERA_LOOK_AT = [0, 1.3, 0];
const CAMERA_FOV = 26;

// ── 物理 ────────────────────────────────────────────────────
const PHYSICS_GRAVITY = [0, -40, 0];
const CARD_DROP_VELOCITY_Y = -10;
const PHYSICS_ANGULAR_DAMPING = 4;
const PHYSICS_LINEAR_DAMPING = 4;
const CARD_ROTATION_DAMPING = 0.25;

// ── 挂绳（全部用圆柱，不用 meshline） ───────────────────────
const ROPE_SEGMENT_LENGTH = 1;
const ROPE_JOINT_POSITIONS = [
  [0.5, 0, 0],
  [1, 0, 0],
  [1.5, 0, 0],
];
const ROPE_BALL_RADIUS = 0.1;
const ROPE_COLOR = '#c8c8c8';
const ROPE_RADIUS = 0.058;
const PULL_OUT_SPEED = 22;
const PULL_OUT_DISTANCE = 24;
const CLOSE_BUTTON_OFFSET_Y = 0.48;
const CLOSE_BUTTON_LIFT_REF = { width: 2560, height: 1279, px: 17 };
const CLOSE_BUTTON_LIFT_WORLD_AT_REF = 0.085;

function getCloseButtonDistanceFactor(width) {
  if (width <= 560) return 1.85;
  if (width <= 760) return 2.1;
  if (width <= 980) return 2.35;
  return 2.6;
}

function getCloseButtonLayout(width, height) {
  const scale = Math.min(
    width / CLOSE_BUTTON_LIFT_REF.width,
    height / CLOSE_BUTTON_LIFT_REF.height,
  );

  return {
    distanceFactor: getCloseButtonDistanceFactor(width),
    liftWorld: CLOSE_BUTTON_LIFT_WORLD_AT_REF * scale,
  };
}

// ── 卡片材质 ────────────────────────────────────────────────
const CARD_FACE_TONE_MAPPED = false;
const CARD_EDGE_MATERIAL = { color: '#d8d8d4', metalness: 0.55, roughness: 0.38 };
const CARD_CLIP_COLOR = '#7a7a78';

function RopeMaterial() {
  return (
    <meshBasicMaterial color={ROPE_COLOR} depthTest={false} depthWrite={false} />
  );
}

export function preloadAboutLanyardAssets() {
  useTexture.preload(ABOUT_LANYARD_INTRO_URL);
}

function createBackTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1152;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#101010';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#f5f5f2';
  ctx.font = '700 180px Georgia, "Times New Roman", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Gwong', canvas.width / 2, canvas.height / 2 + 24);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;
  texture.needsUpdate = true;
  return texture;
}

function copyTranslation(body, target) {
  const translation = body.translation();
  target.set(translation.x, translation.y, translation.z);
}

function alignCylinderBetween(start, end, mesh) {
  _delta.subVectors(end, start);
  const length = _delta.length();
  if (length < 1e-4 || !mesh) {
    if (mesh) mesh.visible = false;
    return;
  }
  mesh.visible = true;
  _delta.divideScalar(length);
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(_unitY, _delta);
  mesh.scale.set(1, length, 1);
}

const _unitY = new THREE.Vector3(0, 1, 0);
const _delta = new THREE.Vector3();
const _j3World = new THREE.Vector3();
const _j2World = new THREE.Vector3();
const _j1World = new THREE.Vector3();
const _fixedWorld = new THREE.Vector3();

function updateRopeCylinders(j3, j2, j1, fixed, seg0, seg1, seg2) {
  alignCylinderBetween(j3, j2, seg0);
  alignCylinderBetween(j2, j1, seg1);
  alignCylinderBetween(j1, fixed, seg2);
}

function LanyardCloseButton({
  onCloseRequest,
  onContactRequest,
  closing,
  theme,
  distanceFactor = 2.6,
  liftWorld = 0,
}) {
  if (closing) return null;

  return (
    <>
      <Html
        transform
        distanceFactor={distanceFactor}
        position={[0, CARD_HEIGHT / 2 - 0.38 + liftWorld, 0.06]}
        center
        zIndexRange={[100, 0]}
        style={{ pointerEvents: 'auto' }}
      >
        <button
          type="button"
          className={`about-lanyard__contact about-lanyard__contact--${theme}`}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onContactRequest?.();
          }}
        >
          联系我
        </button>
      </Html>

      <Html
        transform
        distanceFactor={distanceFactor}
        position={[0, -CARD_HEIGHT / 2 - CLOSE_BUTTON_OFFSET_Y + liftWorld, 0.06]}
        center
        zIndexRange={[100, 0]}
        style={{ pointerEvents: 'auto' }}
      >
        <button
          type="button"
          className={`about-lanyard__close about-lanyard__close--${theme}`}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onCloseRequest?.();
          }}
          aria-label="收起关于面板"
        >
          <span className="about-lanyard__close-icon" aria-hidden="true">×</span>
        </button>
      </Html>
    </>
  );
}

function LanyardBand({
  cardWidth,
  closing = false,
  onCloseRequest,
  onContactRequest,
  onPullComplete,
  theme,
  closeButtonDistanceFactor = 2.6,
  closeButtonLiftWorld = 0,
}) {
  const groupRef = useRef(null);
  const pullOffsetRef = useRef(0);
  const pullCompleteRef = useRef(false);
  const ropeSeg0 = useRef(null);
  const ropeSeg1 = useRef(null);
  const ropeSeg2 = useRef(null);
  const fixed = useRef(null);
  const j1 = useRef(null);
  const j2 = useRef(null);
  const j3 = useRef(null);
  const card = useRef(null);
  const hookRef = useRef(null);

  const vec = new THREE.Vector3();
  const ang = new THREE.Vector3();
  const rot = new THREE.Vector3();
  const dir = new THREE.Vector3();

  const frontTexture = useTexture(ABOUT_LANYARD_INTRO_URL);
  const backTexture = useMemo(() => createBackTexture(), []);

  const segmentProps = {
    canSleep: true,
    colliders: false,
    angularDamping: PHYSICS_ANGULAR_DAMPING,
    linearDamping: PHYSICS_LINEAR_DAMPING,
  };

  const [dragged, drag] = useState(false);
  const [hovered, hover] = useState(false);

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], ROPE_SEGMENT_LENGTH]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], ROPE_SEGMENT_LENGTH]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], ROPE_SEGMENT_LENGTH]);
  useSphericalJoint(j3, card, [
    [0, 0, 0],
    [0, CARD_HOOK_Y, 0],
  ]);

  useEffect(() => {
    frontTexture.colorSpace = THREE.SRGBColorSpace;
    frontTexture.anisotropy = 16;
  }, [frontTexture]);

  useEffect(() => {
    if (!closing) {
      pullOffsetRef.current = 0;
      pullCompleteRef.current = false;
      if (groupRef.current) groupRef.current.position.y = ANCHOR_Y;
      return undefined;
    }

    pullCompleteRef.current = false;
    [card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp());
    return undefined;
  }, [closing]);

  useEffect(() => {
    let frameId = 0;
    const kickDrop = () => {
      [card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp());
      card.current?.setLinvel({ x: 0, y: CARD_DROP_VELOCITY_Y, z: 0 }, true);
    };
    frameId = window.requestAnimationFrame(kickDrop);
    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    if (!hovered) return undefined;
    document.body.style.cursor = dragged ? 'grabbing' : 'grab';
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hovered, dragged]);

  useFrame((state, delta) => {
    if (closing && groupRef.current) {
      const accel = 1 + pullOffsetRef.current * 0.12;
      pullOffsetRef.current += delta * PULL_OUT_SPEED * accel;
      groupRef.current.position.y = ANCHOR_Y + pullOffsetRef.current;
      [card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp());

      if (pullOffsetRef.current >= PULL_OUT_DISTANCE && !pullCompleteRef.current) {
        pullCompleteRef.current = true;
        onPullComplete?.();
      }
    }

    if (dragged && !closing) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp());
      card.current?.setNextKinematicTranslation({
        x: vec.x - dragged.x,
        y: vec.y - dragged.y,
        z: vec.z - dragged.z,
      });
    }

    if (fixed.current && j1.current && j2.current && j3.current) {
      copyTranslation(j3.current, _j3World);
      copyTranslation(j2.current, _j2World);
      copyTranslation(j1.current, _j1World);
      copyTranslation(fixed.current, _fixedWorld);

      updateRopeCylinders(
        _j3World,
        _j2World,
        _j1World,
        _fixedWorld,
        ropeSeg0.current,
        ropeSeg1.current,
        ropeSeg2.current,
      );
    }

    if (!card.current || closing) return;

    ang.copy(card.current.angvel());
    rot.copy(card.current.rotation());
    card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * CARD_ROTATION_DAMPING, z: ang.z });
  });

  const edgeProps = CARD_EDGE_MATERIAL;

  return (
    <>
      <group ref={groupRef} position={[0, ANCHOR_Y, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody position={ROPE_JOINT_POSITIONS[0]} ref={j1} {...segmentProps} type="dynamic">
          <BallCollider args={[ROPE_BALL_RADIUS]} />
        </RigidBody>
        <RigidBody position={ROPE_JOINT_POSITIONS[1]} ref={j2} {...segmentProps} type="dynamic">
          <BallCollider args={[ROPE_BALL_RADIUS]} />
        </RigidBody>
        <RigidBody position={ROPE_JOINT_POSITIONS[2]} ref={j3} {...segmentProps} type="dynamic">
          <BallCollider args={[ROPE_BALL_RADIUS]} />
        </RigidBody>
        <RigidBody
          position={[CARD_START_X, CARD_START_Y, 0]}
          ref={card}
          {...segmentProps}
          type={dragged ? 'kinematicPosition' : 'dynamic'}
        >
          <CuboidCollider args={[cardWidth / 2, CARD_HEIGHT / 2, CARD_DEPTH / 2]} />
          <group
            onPointerOver={() => !closing && hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={(event) => {
              if (closing) return;
              event.target.releasePointerCapture(event.pointerId);
              drag(false);
            }}
            onPointerDown={(event) => {
              if (closing) return;
              event.target.setPointerCapture(event.pointerId);
              const cardTranslation = card.current.translation();
              vec.set(cardTranslation.x, cardTranslation.y, cardTranslation.z);
              drag(new THREE.Vector3().copy(event.point).sub(vec));
            }}
          >
            <mesh>
              <boxGeometry args={[cardWidth, CARD_HEIGHT, CARD_DEPTH]} />
              <meshStandardMaterial attach="material-0" {...edgeProps} />
              <meshStandardMaterial attach="material-1" {...edgeProps} />
              <meshStandardMaterial attach="material-2" {...edgeProps} />
              <meshStandardMaterial attach="material-3" {...edgeProps} />
              <meshBasicMaterial attach="material-4" map={frontTexture} toneMapped={CARD_FACE_TONE_MAPPED} />
              <meshBasicMaterial attach="material-5" map={backTexture} toneMapped={CARD_FACE_TONE_MAPPED} />
            </mesh>
            <group ref={hookRef} position={[0, CARD_HOOK_Y, 0]}>
              <mesh renderOrder={1000}>
                <sphereGeometry args={[ROPE_RADIUS, 12, 12]} />
                <RopeMaterial />
              </mesh>
            </group>
            <mesh position={[0, CARD_HOOK_Y - CARD_CLIP_SIZE[1] / 2, 0]} renderOrder={0}>
              <boxGeometry args={CARD_CLIP_SIZE} />
              <meshStandardMaterial color={CARD_CLIP_COLOR} metalness={0.92} roughness={0.22} />
            </mesh>
            <LanyardCloseButton
              onCloseRequest={onCloseRequest}
              onContactRequest={onContactRequest}
              closing={closing}
              theme={theme}
              distanceFactor={closeButtonDistanceFactor}
              liftWorld={closeButtonLiftWorld}
            />
          </group>
        </RigidBody>
      </group>

      <mesh ref={ropeSeg0} frustumCulled={false} renderOrder={1000}>
        <cylinderGeometry args={[ROPE_RADIUS, ROPE_RADIUS, 1, 12]} />
        <RopeMaterial />
      </mesh>
      <mesh ref={ropeSeg1} frustumCulled={false} renderOrder={1000}>
        <cylinderGeometry args={[ROPE_RADIUS, ROPE_RADIUS, 1, 12]} />
        <RopeMaterial />
      </mesh>
      <mesh ref={ropeSeg2} frustumCulled={false} renderOrder={1000}>
        <cylinderGeometry args={[ROPE_RADIUS, ROPE_RADIUS, 1, 12]} />
        <RopeMaterial />
      </mesh>
    </>
  );
}

function LanyardScene({
  closing,
  onCloseRequest,
  onContactRequest,
  onPullComplete,
  theme,
  closeButtonDistanceFactor = 2.6,
  closeButtonLiftWorld = 0,
}) {
  const frontTexture = useTexture(ABOUT_LANYARD_INTRO_URL);
  const imageAspect = frontTexture.image?.width && frontTexture.image?.height
    ? frontTexture.image.width / frontTexture.image.height
    : 16 / 9;
  const cardWidth = CARD_HEIGHT * imageAspect;

  return (
    <Physics gravity={PHYSICS_GRAVITY} timeStep={1 / 60} interpolate={false}>
      <LanyardBand
        cardWidth={cardWidth}
        closing={closing}
        onCloseRequest={onCloseRequest}
        onContactRequest={onContactRequest}
        onPullComplete={onPullComplete}
        theme={theme}
        closeButtonDistanceFactor={closeButtonDistanceFactor}
        closeButtonLiftWorld={closeButtonLiftWorld}
      />
    </Physics>
  );
}

export default function AboutLanyard({
  sessionKey = 0,
  closing = false,
  onCloseRequest,
  onContactRequest,
  onPullComplete,
  theme = 'light',
}) {
  const [isMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  const [closeButtonLayout, setCloseButtonLayout] = useState(() => (
    typeof window !== 'undefined'
      ? getCloseButtonLayout(window.innerWidth, window.innerHeight)
      : { distanceFactor: 2.6, liftWorld: 0 }
  ));

  useEffect(() => {
    function handleResize() {
      setCloseButtonLayout(getCloseButtonLayout(window.innerWidth, window.innerHeight));
    }

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="about-lanyard" key={sessionKey}>
      <Canvas
        camera={{
          position: CAMERA_POSITION,
          fov: CAMERA_FOV,
          near: 0.1,
          far: 200,
        }}
        dpr={[1, isMobile ? 1.5 : 2]}
        gl={{ alpha: true, antialias: true }}
        onCreated={({ gl, camera }) => {
          gl.setClearColor(new THREE.Color(0x000000), 0);
          camera.lookAt(...CAMERA_LOOK_AT);
        }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={Math.PI} />
          <directionalLight position={[4, 8, 6]} intensity={2.4} />
          <directionalLight position={[-5, 3, -2]} intensity={0.9} />
          <pointLight position={[0, 8, 4]} intensity={12} />
          <LanyardScene
            closing={closing}
            onCloseRequest={onCloseRequest}
            onContactRequest={onContactRequest}
            onPullComplete={onPullComplete}
            theme={theme}
            closeButtonDistanceFactor={closeButtonLayout.distanceFactor}
            closeButtonLiftWorld={closeButtonLayout.liftWorld}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
