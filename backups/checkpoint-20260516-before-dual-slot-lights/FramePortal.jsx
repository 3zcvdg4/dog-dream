import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

const FLOAT_AMPLITUDE = 0.14;
const FLOAT_SPEED = 0.6;
const FLOAT_PHASE_OFFSET = 1.5;
// 这里改画框颜色
const FRAME_BORDER_COLOR = '#ffffff';
const BORDER_THICKNESS = 0.1;
const FRAME_DEPTH = 0.11;
const IMAGE_RECESS_Z = 0.018;

const frameAssetCache = new Map();

function createFrameShape(frameWidth, frameHeight) {
  const outerHalfWidth = frameWidth / 2;
  const outerHalfHeight = frameHeight / 2;
  const innerHalfWidth = outerHalfWidth - BORDER_THICKNESS;
  const innerHalfHeight = outerHalfHeight - BORDER_THICKNESS;

  const shape = new THREE.Shape();
  shape.moveTo(-outerHalfWidth, -outerHalfHeight);
  shape.lineTo(outerHalfWidth, -outerHalfHeight);
  shape.lineTo(outerHalfWidth, outerHalfHeight);
  shape.lineTo(-outerHalfWidth, outerHalfHeight);
  shape.lineTo(-outerHalfWidth, -outerHalfHeight);

  const hole = new THREE.Path();
  hole.moveTo(-innerHalfWidth, -innerHalfHeight);
  hole.lineTo(-innerHalfWidth, innerHalfHeight);
  hole.lineTo(innerHalfWidth, innerHalfHeight);
  hole.lineTo(innerHalfWidth, -innerHalfHeight);
  hole.lineTo(-innerHalfWidth, -innerHalfHeight);
  shape.holes.push(hole);

  return shape;
}

function getFrameAssets(frameWidth, frameHeight) {
  const cacheKey = `${frameWidth}x${frameHeight}`;

  if (frameAssetCache.has(cacheKey)) {
    return frameAssetCache.get(cacheKey);
  }

  const imageWidth = frameWidth - BORDER_THICKNESS * 2;
  const imageHeight = frameHeight - BORDER_THICKNESS * 2;
  const assets = {
    imageZ: IMAGE_RECESS_Z,
    frameGeometry: new THREE.ExtrudeGeometry(createFrameShape(frameWidth, frameHeight), {
      depth: FRAME_DEPTH,
      bevelEnabled: false,
      curveSegments: 1,
      steps: 1,
    }),
    imageGeometry: new THREE.PlaneGeometry(imageWidth, imageHeight),
  };

  assets.frameGeometry.center();

  frameAssetCache.set(cacheKey, assets);
  return assets;
}

const OPAQUE_IMAGE_FALLBACK = new THREE.MeshBasicMaterial({
  transparent: true,
  opacity: 0,
  depthWrite: false,
});

const configuredTextureCache = new WeakSet();

function areFramePropsEqual(previousProps, nextProps) {
  const previousProject = previousProps.project;
  const nextProject = nextProps.project;

  return previousProps.isFocused === nextProps.isFocused
    && previousProject.frameKey === nextProject.frameKey
    && previousProject.imageUrl === nextProject.imageUrl
    && previousProject.opacity === nextProject.opacity
    && previousProject.frameWidth === nextProject.frameWidth
    && previousProject.frameHeight === nextProject.frameHeight
    && previousProject.position[0] === nextProject.position[0]
    && previousProject.position[1] === nextProject.position[1]
    && previousProject.position[2] === nextProject.position[2]
    && previousProject.rotation[0] === nextProject.rotation[0]
    && previousProject.rotation[1] === nextProject.rotation[1]
    && previousProject.rotation[2] === nextProject.rotation[2];
}

function FramePortal({ project, isFocused, onFocusProject }) {
  const groupRef = useRef(null);
  const texture = project.imageUrl ? useTexture(project.imageUrl) : null;
  const frameWidth = project.frameWidth ?? 1.34;
  const frameHeight = project.frameHeight ?? 2.18;
  const { imageZ, frameGeometry, imageGeometry } = useMemo(
    () => getFrameAssets(frameWidth, frameHeight),
    [frameWidth, frameHeight],
  );
  const borderMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: FRAME_BORDER_COLOR,
    roughness: 0.3,
    metalness: 1,
    emissive: '#ebebeb',
    emissiveIntensity: 0.1,
  }), []);
  const imageMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    toneMapped: false,
    transparent: true,
    side: THREE.DoubleSide,
  }), []);
  const opacity = isFocused ? 1 : (project.opacity ?? 1);
  const isTransparent = opacity < 0.999;

  useEffect(() => {
    if (borderMaterial.transparent !== isTransparent) {
      borderMaterial.transparent = isTransparent;
      borderMaterial.needsUpdate = true;
    }

    borderMaterial.opacity = opacity;

    imageMaterial.map = texture ?? null;
    imageMaterial.opacity = texture ? opacity : 0;
    imageMaterial.needsUpdate = true;

    const nextImageDepthWrite = Boolean(texture) && !isTransparent;
    if (imageMaterial.depthWrite !== nextImageDepthWrite) {
      imageMaterial.depthWrite = nextImageDepthWrite;
      imageMaterial.needsUpdate = true;
    }

    if (texture && !configuredTextureCache.has(texture)) {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      texture.needsUpdate = true;
      configuredTextureCache.add(texture);
    }
  }, [borderMaterial, imageMaterial, isTransparent, opacity, texture]);

  useEffect(() => () => {
    borderMaterial.dispose();
    imageMaterial.dispose();
  }, [borderMaterial, imageMaterial]);

  const handleClick = useCallback((event) => {
    event.stopPropagation();
    onFocusProject(project);
  }, [onFocusProject, project]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const baseY = project.position[1];
    groupRef.current.position.y = baseY + Math.sin(state.clock.elapsedTime * FLOAT_SPEED + project.index * FLOAT_PHASE_OFFSET) * FLOAT_AMPLITUDE;
  });

  return (
    <group ref={groupRef} position={project.position} rotation={project.rotation} onClick={handleClick}>
      <mesh
        geometry={frameGeometry}
        material={borderMaterial}
        castShadow // 让画框边框可以把阴影投出去
        receiveShadow // 让画框边框自己也能接住别的阴影层次
      />
      <mesh
        position={[0, 0, imageZ]}
        geometry={imageGeometry}
        material={texture ? imageMaterial : OPAQUE_IMAGE_FALLBACK}
        receiveShadow // 让海报面接住边框或灯打出来的阴影变化
      >
      </mesh>
    </group>
  );
}

export default memo(FramePortal, areFramePropsEqual);
