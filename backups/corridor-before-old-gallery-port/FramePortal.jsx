import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

export default function FramePortal({ project, isFocused, onClick }) {
  const texture = project.imageUrl ? useTexture(project.imageUrl) : null;
  const frameWidth = project.frameWidth ?? 1.34;
  const frameHeight = project.frameHeight ?? 2.18;
  const imageWidth = frameWidth * 0.82;
  const imageHeight = frameHeight * 0.82;

  if (texture) {
    texture.colorSpace = THREE.SRGBColorSpace;
  }

  return (
    <group position={project.position} rotation={project.rotation} onClick={onClick}>
      <mesh position={[0, 0, -0.018]}>
        <planeGeometry args={[frameWidth + 0.18, frameHeight + 0.18]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={isFocused ? 0.72 : 0.5} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[frameWidth, frameHeight, 0.035]} />
        <meshStandardMaterial color="#ffffff" roughness={0.62} />
      </mesh>
      <mesh position={[0, 0, 0.024]}>
        <planeGeometry args={[imageWidth, imageHeight]} />
        {texture ? (
          <meshBasicMaterial map={texture} toneMapped={false} />
        ) : (
          <meshBasicMaterial color="#ffffff" />
        )}
      </mesh>
    </group>
  );
}
