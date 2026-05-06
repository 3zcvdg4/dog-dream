import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

const FLOAT_AMPLITUDE = 0.14;
const FLOAT_SPEED = 0.6;
const FLOAT_PHASE_OFFSET = 1.5;

export default function FramePortal({ project, isFocused, onClick }) {
  const groupRef = useRef(null);
  const texture = project.imageUrl ? useTexture(project.imageUrl) : null;
  const frameWidth = project.frameWidth ?? 1.34;
  const frameHeight = project.frameHeight ?? 2.18;
  const borderThickness = 0.1;
  const frameDepth = 0.12;
  const imageWidth = frameWidth - borderThickness * 2;
  const imageHeight = frameHeight - borderThickness * 2;
  const topBottomY = (frameHeight - borderThickness) / 2;
  const sideX = (frameWidth - borderThickness) / 2;

  if (texture) {
    texture.colorSpace = THREE.SRGBColorSpace;
  }

  useFrame((state) => {
    if (!groupRef.current) return;
    const baseY = project.position[1];
    groupRef.current.position.y = baseY + Math.sin(state.clock.elapsedTime * FLOAT_SPEED + project.index * FLOAT_PHASE_OFFSET) * FLOAT_AMPLITUDE;
  });

  return (
    <group ref={groupRef} position={project.position} rotation={project.rotation} onClick={onClick}>
      <mesh position={[0, topBottomY, 0]}>
        <boxGeometry args={[frameWidth, borderThickness, frameDepth]} />
        <meshStandardMaterial color="#ffffff" roughness={0.54} metalness={0.02} />
      </mesh>
      <mesh position={[0, -topBottomY, 0]}>
        <boxGeometry args={[frameWidth, borderThickness, frameDepth]} />
        <meshStandardMaterial color="#ffffff" roughness={0.54} metalness={0.02} />
      </mesh>
      <mesh position={[-sideX, 0, 0]}>
        <boxGeometry args={[borderThickness, frameHeight, frameDepth]} />
        <meshStandardMaterial color="#ffffff" roughness={0.54} metalness={0.02} />
      </mesh>
      <mesh position={[sideX, 0, 0]}>
        <boxGeometry args={[borderThickness, frameHeight, frameDepth]} />
        <meshStandardMaterial color="#ffffff" roughness={0.54} metalness={0.02} />
      </mesh>
      <mesh position={[0, 0, 0.07]}>
        <planeGeometry args={[imageWidth, imageHeight]} />
        {texture ? (
          <meshBasicMaterial map={texture} toneMapped={false} />
        ) : (
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        )}
      </mesh>
    </group>
  );
}
