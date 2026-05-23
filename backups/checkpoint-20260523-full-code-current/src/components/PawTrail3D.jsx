import { useTexture } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

const FLOOR_Y = 0.005;
const LEFT_SCREEN_X = -0.075;
const RIGHT_SCREEN_X = 0.075;
const SPAWN_SCREEN_Y = 0.9125;
const PAW_SIZE_SCREEN_RATIO = 1 / 48;
const PAW_ASPECT = 2.05;
const MAX_PRINTS = 12;
const HIDE_BEHIND_CAMERA_Z = 0.7;

function getFloorPointAtScreen(camera, screenX, screenY) {
  const ndcY = 1 - screenY * 2;
  const point = new THREE.Vector3(screenX, ndcY, 0.5).unproject(camera);
  const direction = point.sub(camera.position).normalize();
  const t = (FLOOR_Y - camera.position.y) / direction.y;

  if (!Number.isFinite(t) || t <= 0) {
    return new THREE.Vector3(screenX * 3, FLOOR_Y, camera.position.z - 3.6);
  }

  return camera.position.clone().add(direction.multiplyScalar(t));
}

function getPawWorldSize(camera, worldZ) {
  const distance = Math.max(0.1, Math.abs(camera.position.z - worldZ));
  const visibleHeight = 2 * distance * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  const height = visibleHeight * PAW_SIZE_SCREEN_RATIO;

  return {
    width: height * PAW_ASPECT,
    height,
  };
}

function createPrint() {
  return {
    active: false,
    side: 'left',
    worldX: 0,
    worldZ: 0,
    width: 0,
    height: 0,
    opacity: 0,
  };
}

export default function PawTrail3D({ targetFrame = 0 }) {
  const leftTex = useTexture('/left-footprint.png');
  const rightTex = useTexture('/right-footprint.png');
  const { camera } = useThree();

  const groupRef = useRef(null);
  const meshesRef = useRef([]);
  const printsRef = useRef(Array.from({ length: MAX_PRINTS }, createPrint));
  const nextSlotRef = useRef(0);
  const currentFrameRef = useRef(0);

  useEffect(() => {
    for (const tex of [leftTex, rightTex]) {
      if (!tex) continue;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
      tex.needsUpdate = true;
    }
  }, [leftTex, rightTex]);

  const materials = useMemo(() => ({
    left: new THREE.MeshBasicMaterial({
      map: leftTex,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: true,
      toneMapped: false,
      side: THREE.DoubleSide,
    }),
    right: new THREE.MeshBasicMaterial({
      map: rightTex,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: true,
      toneMapped: false,
      side: THREE.DoubleSide,
    }),
  }), [leftTex, rightTex]);

  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);

  useEffect(() => {
    if (groupRef.current) {
      meshesRef.current = Array.from(groupRef.current.children);
    }
  }, []);

  useEffect(() => () => {
    geometry.dispose();
    materials.left.dispose();
    materials.right.dispose();
  }, [geometry, materials]);

  useEffect(() => {
    while (currentFrameRef.current < targetFrame) {
      currentFrameRef.current += 1;
      const side = currentFrameRef.current % 2 === 1 ? 'left' : 'right';
      const screenX = side === 'left' ? LEFT_SCREEN_X : RIGHT_SCREEN_X;
      const point = getFloorPointAtScreen(camera, screenX, SPAWN_SCREEN_Y);
      const pawSize = getPawWorldSize(camera, point.z);
      const slotIndex = nextSlotRef.current;
      const print = printsRef.current[slotIndex];

      print.active = true;
      print.side = side;
      print.worldX = point.x;
      print.worldZ = point.z;
      print.width = pawSize.width;
      print.height = pawSize.height;
      print.opacity = 0.82;

      nextSlotRef.current = (slotIndex + 1) % MAX_PRINTS;
    }
  }, [camera, targetFrame]);

  useFrame(() => {
    const meshes = meshesRef.current;
    const prints = printsRef.current;

    for (let i = 0; i < MAX_PRINTS; i += 1) {
      const print = prints[i];
      const mesh = meshes[i];
      if (!mesh) continue;

      if (!print.active) {
        mesh.visible = false;
        mesh.material.opacity = 0;
        continue;
      }

      if (print.worldZ > camera.position.z + HIDE_BEHIND_CAMERA_Z) {
        print.active = false;
        mesh.visible = false;
        mesh.material.opacity = 0;
        continue;
      }

      mesh.material = print.side === 'left' ? materials.left : materials.right;
      mesh.position.set(print.worldX, FLOOR_Y, print.worldZ);
      mesh.scale.set(print.width, print.height, 1);
      mesh.material.opacity = print.opacity;
      mesh.visible = true;
    }
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: MAX_PRINTS }, (_, index) => (
        <mesh
          key={index}
          geometry={geometry}
          material={index % 2 === 0 ? materials.left : materials.right}
          rotation={[-Math.PI / 2, 0, 0]}
          renderOrder={1}
          visible={false}
        />
      ))}
    </group>
  );
}
