import { useTexture } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import FramePortal from '../components/FramePortal.jsx';
import { projects } from '../data/projects.js';

const LOOP_LENGTH = 33;
const GALLERY_MAX_Z = 0;
const WHEEL_SCROLL_FACTOR = 0.014;
const MAX_WHEEL_DELTA = 70;
const TOUCH_SCROLL_FACTOR = 0.026;
const MAX_TOUCH_DELTA = 140;
const TOUCH_SCROLL_MULTIPLIER = 2.45;
const TOUCH_AXIS_LOCK_THRESHOLD = 5;
const CAMERA_Z_LERP = 0.22;
const CAMERA_XY_LERP = 0.18;
const PAW_PHASE_PER_DELTA = 0.0042;
const MAX_PAW_PHASE_INCREMENT = 0.4;
const VELOCITY_SMOOTH_FACTOR = 0.12;
const PAW_FADE_BASE_MS = 700;
const WALL_X = 3.25;
const CORRIDOR_HEIGHT = 3.6;
const CORRIDOR_SEGMENT_LENGTH = LOOP_LENGTH;
const FRAME_WIDTH = 1.22;
const FRAME_HEIGHT = 1.68;
const LEFT_FRAME_Y = 1.76;
const RIGHT_FRAME_Y = 1.9;
const CAMERA_FOV = 50;

function getFocusZOffsetMagnitude(viewportWidth) {
  if (viewportWidth <= 599) return 0.24;
  if (viewportWidth <= 767) return 0.18;
  if (viewportWidth <= 1023) return 0.08;
  return 0;
}

function getFrameWallX(viewportWidth) {
  if (viewportWidth <= 599) return WALL_X - 0.42;
  if (viewportWidth <= 767) return WALL_X - 0.3;
  if (viewportWidth <= 1023) return WALL_X - 0.18;
  return WALL_X;
}

function getRoamingFrameZShift(viewportWidth) {
  if (viewportWidth <= 599) return -0.75;
  if (viewportWidth <= 767) return -0.55;
  if (viewportWidth <= 1023) return -0.3;
  return 0;
}

function getTextureMaxDimension(viewportWidth, isCoarsePointer) {
  if (isCoarsePointer) return 1024;
  if (viewportWidth <= 1023) return 1536;
  return 2048;
}

function getFocusScreenShiftX(viewportWidth) {
  if (viewportWidth <= 599) return 0.28;
  if (viewportWidth <= 767) return 0.2;
  if (viewportWidth <= 1023) return 0.08;
  return 0;
}

function getFocusScreenShiftY(viewportWidth) {
  if (viewportWidth <= 599) return -0.1;
  if (viewportWidth <= 767) return -0.08;
  return 0;
}

function getDesktopFocusViewOffsetX(viewportWidth) {
  if (viewportWidth <= 1023) return 0;
  if (viewportWidth <= 1439) return 170;
  if (viewportWidth <= 1659) return 250;
  return 300;
}

function getMobileFocusViewOffsetY(viewportWidth) {
  if (viewportWidth <= 599) return 72;
  if (viewportWidth <= 767) return 56;
  if (viewportWidth <= 1023) return 42;
  return 0;
}

function getFocusCameraFov(viewportWidth) {
  if (viewportWidth <= 599) return 56;
  if (viewportWidth <= 767) return 55;
  if (viewportWidth <= 1023) return 53;
  return CAMERA_FOV;
}

function getFocusCameraState(project, viewportWidth) {
  if (!project) {
    return {
      position: [0, 1.5, 0],
      fov: getRoamingCameraFov(viewportWidth),
    };
  }

  const focusZOffsetMagnitude = getFocusZOffsetMagnitude(viewportWidth);
  const focusZOffset = project.side < 0 ? focusZOffsetMagnitude : -focusZOffsetMagnitude;
  const focusScreenShiftY = getFocusScreenShiftY(viewportWidth);

  return {
    position: [
      project.cameraX,
      project.cameraY + focusScreenShiftY,
      project.cameraZ + focusZOffset,
    ],
    fov: getFocusCameraFov(viewportWidth),
  };
}

function getRoamingCameraFov(viewportWidth) {
  if (viewportWidth <= 599) return 62;
  if (viewportWidth <= 767) return 60;
  if (viewportWidth <= 1023) return 56;
  if (viewportWidth <= 1280) return 52;
  return CAMERA_FOV;
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
// 左侧主槽位灯：这是“主光”，负责把当前视角里的左一槽位真正打亮，并保留阴影层次。
const LEFT_SLOT_LIGHT_INTENSITY = 60; // 亮度：越大越亮；想让左一更抢眼先调这里
const LEFT_SLOT_LIGHT_ANGLE = 1.5; // 光束宽度：越大铺得越开；越小越像聚光筒
const LEFT_SLOT_LIGHT_DISTANCE = 12; // 有效射程：越大越容易照到更远的槽位，但也更容易把范围打散
const LEFT_SLOT_LIGHT_OFFSET_X = 1.7; // 灯本体左右偏移：左灯从走廊内侧往画框打，数值越大越靠走廊中心
const LEFT_SLOT_LIGHT_OFFSET_Y = 0.42; // 灯本体上下偏移：越大越高；高一点会更像上方斜打下来的光
const LEFT_SLOT_LIGHT_OFFSET_Z = -3.4; // 灯本体前后偏移：越负越靠镜头前方；绝对值太大容易打空
const LEFT_SLOT_LIGHT_TARGET_OFFSET_X = -0.02; // 照射目标左右偏移：控制光最终落点更偏框中心还是更偏墙面
const LEFT_SLOT_LIGHT_TARGET_OFFSET_Y = 0.02; // 照射目标上下偏移：往上调会更容易扫到画框上沿
const LEFT_SLOT_LIGHT_TARGET_OFFSET_Z = 0.1; // 照射目标前后偏移：调光束扎进槽位的深浅；太前会飘，太后会钻进墙里

// 左侧补光灯：这盏不是给海报提亮，而是专门把白色画框阴面、内凹边和侧边的死黑区域托起来。
const LEFT_FILL_SLOT_LIGHT_INTENSITY = 20; // 补光亮度：太低看不见，太高会把主灯塑形冲淡；这里只建议小步加减
const LEFT_FILL_SLOT_LIGHT_ANGLE = 40; // 补光宽度：收窄一点，让光更集中扫在画框边框，而不是铺进整张海报
const LEFT_FILL_SLOT_LIGHT_DISTANCE = 20; // 补光射程：只覆盖当前槽位附近，避免把墙面和远处一起洗亮
const LEFT_FILL_SLOT_LIGHT_OFFSET_X = 0.5; // 补光灯左右位置：往框附近贴，目标是扫到画框内侧阴面，不是照墙
const LEFT_FILL_SLOT_LIGHT_OFFSET_Y = -1; // 补光灯高度：略高于框中心，方便擦到框上沿和内凹边
const LEFT_FILL_SLOT_LIGHT_OFFSET_Z = -0; // 补光灯前后位置：比主灯更贴近当前槽位，补暗部的效果会更直接
const LEFT_FILL_SLOT_LIGHT_TARGET_OFFSET_X = -0.62; // 补光目标左右位置：故意往边框内缘偏，让光落在框而不是海报中心
const LEFT_FILL_SLOT_LIGHT_TARGET_OFFSET_Y = 0.12; // 补光目标高度：把亮斑压在框面中上部，优先救上半圈暗边
const LEFT_FILL_SLOT_LIGHT_TARGET_OFFSET_Z = 0.18; // 补光目标前后位置：轻微往槽位里压，让光束擦过框厚度和内凹边
const LEFT_FILL_SLOT_LIGHT_ANCHOR_Z_BIAS = 2; // 槽位基准前后偏移：这是专门拿来找“离镜头最近这一侧框边”的值；越大越往最近那一侧推
// 右侧主槽位灯：逻辑与左侧主灯完全对称；一般先调左边，满意后再决定右边是否要做非对称微调。
const RIGHT_SLOT_LIGHT_INTENSITY = LEFT_SLOT_LIGHT_INTENSITY; // 右主灯亮度：想让右一更亮/更暗，单独改这里
const RIGHT_SLOT_LIGHT_ANGLE = LEFT_SLOT_LIGHT_ANGLE; // 右主灯宽度：越大覆盖越宽
const RIGHT_SLOT_LIGHT_DISTANCE = LEFT_SLOT_LIGHT_DISTANCE; // 右主灯射程：控制能照多深
const RIGHT_SLOT_LIGHT_OFFSET_X = -1.7; // 右主灯左右位置：负值让灯从走廊内侧朝右墙打过去
const RIGHT_SLOT_LIGHT_OFFSET_Y = LEFT_SLOT_LIGHT_OFFSET_Y; // 右主灯高度：越大越高
const RIGHT_SLOT_LIGHT_OFFSET_Z = LEFT_SLOT_LIGHT_OFFSET_Z; // 右主灯前后位置：决定灯离槽位前后有多远
const RIGHT_SLOT_LIGHT_TARGET_OFFSET_X = 0.02; // 右主灯目标左右位置：控制落点更偏框心还是偏边缘
const RIGHT_SLOT_LIGHT_TARGET_OFFSET_Y = LEFT_SLOT_LIGHT_TARGET_OFFSET_Y; // 右主灯目标高度：决定光落在框面偏上还是偏中
const RIGHT_SLOT_LIGHT_TARGET_OFFSET_Z = LEFT_SLOT_LIGHT_TARGET_OFFSET_Z; // 右主灯目标前后位置：决定光束扎得深不深

// 右侧补光灯：和左侧同理，专门提亮右侧画框阴面与内边，不负责把海报洗亮。
const RIGHT_FILL_SLOT_LIGHT_INTENSITY = LEFT_FILL_SLOT_LIGHT_INTENSITY; // 右补光亮度：优先调这个，决定补光存在感
const RIGHT_FILL_SLOT_LIGHT_ANGLE = LEFT_FILL_SLOT_LIGHT_ANGLE; // 右补光宽度：越小越容易只打在框边
const RIGHT_FILL_SLOT_LIGHT_DISTANCE = LEFT_FILL_SLOT_LIGHT_DISTANCE; // 右补光射程：只包住当前槽位即可
const RIGHT_FILL_SLOT_LIGHT_OFFSET_X = -1.02; // 右补光左右位置：贴近右侧画框，方便擦亮内侧暗边
const RIGHT_FILL_SLOT_LIGHT_OFFSET_Y = LEFT_FILL_SLOT_LIGHT_OFFSET_Y; // 右补光高度：决定是补框上沿还是中部阴面
const RIGHT_FILL_SLOT_LIGHT_OFFSET_Z = LEFT_FILL_SLOT_LIGHT_OFFSET_Z; // 右补光前后位置：越靠近槽位，边框补亮越明显
const RIGHT_FILL_SLOT_LIGHT_TARGET_OFFSET_X = 0.62; // 右补光目标左右位置：往框内缘偏，避免打到海报中心
const RIGHT_FILL_SLOT_LIGHT_TARGET_OFFSET_Y = LEFT_FILL_SLOT_LIGHT_TARGET_OFFSET_Y; // 右补光目标高度：优先照顾框面中上部暗边
const RIGHT_FILL_SLOT_LIGHT_TARGET_OFFSET_Z = LEFT_FILL_SLOT_LIGHT_TARGET_OFFSET_Z; // 右补光目标前后位置：让光束更容易擦过框厚度
const RIGHT_FILL_SLOT_LIGHT_ANCHOR_Z_BIAS = LEFT_FILL_SLOT_LIGHT_ANCHOR_Z_BIAS; // 右侧同理：控制补光到底是照框的最近边，还是更偏中段/远侧
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

function buildFrameLayouts(viewportWidth) {
  const frameWallX = getFrameWallX(viewportWidth);
  const roamingFrameZShift = getRoamingFrameZShift(viewportWidth);

  return WORK_LAYOUT.map((layout, index) => {
    const sideSign = layout.side === 'left' ? -1 : 1;
    const y = layout.side === 'left' ? LEFT_FRAME_Y : RIGHT_FRAME_Y;

    return {
      index,
      z: layout.z + roamingFrameZShift,
      rotZ: layout.rotZ,
      sideSign,
      x: sideSign * frameWallX,
      y,
      rotationY: layout.side === 'left' ? Math.PI / 2 : -Math.PI / 2,
      cameraX: sideSign * (frameWallX - FOCUSED_CAMERA_WALL_DISTANCE),
      lookAtX: sideSign * frameWallX,
    };
  });
}

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

function createGalleryFrames(activeCycle, cameraZ, loopProgress, viewportWidth) {
  const frameLayouts = buildFrameLayouts(viewportWidth);

  return Array.from({ length: VISIBLE_FRAME_CYCLES }).flatMap((_, cycleOffset) => {
    const cycleIndex = activeCycle + cycleOffset;

    return frameLayouts.map((layout) => {
      const project = projects[layout.index % projects.length];
      const z = layout.z - cycleIndex * LOOP_LENGTH;
      const frameIndex = cycleIndex * frameLayouts.length + layout.index;
      const cycleDistance = cycleIndex - activeCycle;
      let visibility = 0;

      if (cycleDistance === 0) {
        visibility = 1;
      } else if (cycleDistance === 1) {
        visibility = getNextCycleFrameVisibility(layout.index, loopProgress);
      }

      if (visibility <= 0) {
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

function createScaledTextureImage(sourceImage, maxDimension) {
  if (!sourceImage?.width || !sourceImage?.height) {
    return sourceImage;
  }

  const longestSide = Math.max(sourceImage.width, sourceImage.height);
  if (longestSide <= maxDimension) {
    return sourceImage;
  }

  const scale = maxDimension / longestSide;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(sourceImage.width * scale));
  canvas.height = Math.max(1, Math.round(sourceImage.height * scale));

  const context = canvas.getContext('2d', { alpha: false, desynchronized: true });
  if (!context) {
    return sourceImage;
  }

  context.imageSmoothingEnabled = true;
  context.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function createSurfaceTexture(sourceTexture, maxDimension) {
  const optimizedImage = createScaledTextureImage(sourceTexture.image, maxDimension);
  if (optimizedImage !== sourceTexture.image) {
    sourceTexture.image = optimizedImage;
  }

  sourceTexture.colorSpace = THREE.SRGBColorSpace;
  sourceTexture.wrapS = THREE.ClampToEdgeWrapping;
  sourceTexture.wrapT = THREE.ClampToEdgeWrapping;
  sourceTexture.minFilter = THREE.LinearFilter;
  sourceTexture.magFilter = THREE.LinearFilter;
  sourceTexture.generateMipmaps = false;
  sourceTexture.anisotropy = 1;
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
    <mesh position={position} rotation={rotation}>
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

function CorridorGeometry({ viewportWidth, isCoarsePointer }) {
  const groupRef = useRef(null);
  const textureMaxDimension = useMemo(
    () => getTextureMaxDimension(viewportWidth, isCoarsePointer),
    [viewportWidth, isCoarsePointer],
  );
  const rawTextures = useTexture({
    ceiling: CEILING_TEXTURE_URL,
    floor: FLOOR_TEXTURE_URL,
    leftWall: LEFT_WALL_TEXTURE_URL,
    rightWall: RIGHT_WALL_TEXTURE_URL,
  });
  const textures = useMemo(() => ({
    ceiling: createSurfaceTexture(rawTextures.ceiling, textureMaxDimension),
    floor: createSurfaceTexture(rawTextures.floor, textureMaxDimension),
    leftWall: createSurfaceTexture(rawTextures.leftWall, textureMaxDimension),
    rightWall: createSurfaceTexture(rawTextures.rightWall, textureMaxDimension),
  }), [rawTextures, textureMaxDimension]);

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

function ExitFrameLight() {
  const lightRef = useRef(null);
  const targetRef = useRef(null);

  useEffect(() => {
    if (!lightRef.current || !targetRef.current) return;
    lightRef.current.target = targetRef.current;
  }, []);

  useFrame((state) => {
    if (!lightRef.current || !targetRef.current) return;
    lightRef.current.position.set(
      0, // x：灯的左右位置；负数更靠左，正数更靠右
      EXIT_CENTER_Y + 0.26, // y：灯的高度；数值越大越高
      state.camera.position.z - EXIT_VISUAL.offset + 1.4, // z：灯的前后位置；决定它离出口近还是远
    );
    targetRef.current.position.set(
      0, // x：灯照向的左右方向
      EXIT_CENTER_Y + 0.18, // y：灯照向的高度
      state.camera.position.z + 12, // z：灯照向的远近；越大越往走廊深处照
    );
    lightRef.current.target.updateMatrixWorld();
  });

  return (
    <>
      <spotLight
        ref={lightRef}
        color="#fff2e2" // 光的颜色：偏暖白，改这里就是改灯的色温
        intensity={40} // 光强：越大越亮
        angle={0.5} // 光束张角：越大照射范围越宽
        penumbra={1} // 边缘柔和度：越大边缘越软
        decay={0.5} // 衰减速度：越大离灯越远越快变暗
        distance={84} // 照射距离：越大照得越远
      />
      <object3D ref={targetRef} />
    </>
  );
}

function SlotFrameLight({ viewportWidth, side, variant = 'primary' }) {
  const isLeftSlot = side === 'left';
  const isFillLight = variant === 'fill';
  const anchorLayout = useMemo(
    () => buildFrameLayouts(viewportWidth).find((layout) => (isLeftSlot ? layout.sideSign < 0 : layout.sideSign > 0)) ?? null,
    [isLeftSlot, viewportWidth],
  );
  const lightRef = useRef(null);
  const targetRef = useRef(null);

  const lightConfig = useMemo(() => {
    if (isLeftSlot && !isFillLight) {
      return {
        color: '#fff1dd',
        intensity: LEFT_SLOT_LIGHT_INTENSITY,
        angle: LEFT_SLOT_LIGHT_ANGLE,
        distance: LEFT_SLOT_LIGHT_DISTANCE,
        offsetX: LEFT_SLOT_LIGHT_OFFSET_X,
        offsetY: LEFT_SLOT_LIGHT_OFFSET_Y,
        offsetZ: LEFT_SLOT_LIGHT_OFFSET_Z,
        targetOffsetX: LEFT_SLOT_LIGHT_TARGET_OFFSET_X,
        targetOffsetY: LEFT_SLOT_LIGHT_TARGET_OFFSET_Y,
        targetOffsetZ: LEFT_SLOT_LIGHT_TARGET_OFFSET_Z,
        castShadow: true,
      };
    }

    if (!isLeftSlot && !isFillLight) {
      return {
        color: '#fff1dd',
        intensity: RIGHT_SLOT_LIGHT_INTENSITY,
        angle: RIGHT_SLOT_LIGHT_ANGLE,
        distance: RIGHT_SLOT_LIGHT_DISTANCE,
        offsetX: RIGHT_SLOT_LIGHT_OFFSET_X,
        offsetY: RIGHT_SLOT_LIGHT_OFFSET_Y,
        offsetZ: RIGHT_SLOT_LIGHT_OFFSET_Z,
        targetOffsetX: RIGHT_SLOT_LIGHT_TARGET_OFFSET_X,
        targetOffsetY: RIGHT_SLOT_LIGHT_TARGET_OFFSET_Y,
        targetOffsetZ: RIGHT_SLOT_LIGHT_TARGET_OFFSET_Z,
        castShadow: true,
      };
    }

    if (isLeftSlot && isFillLight) {
      return {
        color: '#fff6ee',
        intensity: LEFT_FILL_SLOT_LIGHT_INTENSITY,
        angle: LEFT_FILL_SLOT_LIGHT_ANGLE,
        distance: LEFT_FILL_SLOT_LIGHT_DISTANCE,
        slotZBias: LEFT_FILL_SLOT_LIGHT_ANCHOR_Z_BIAS,
        offsetX: LEFT_FILL_SLOT_LIGHT_OFFSET_X,
        offsetY: LEFT_FILL_SLOT_LIGHT_OFFSET_Y,
        offsetZ: LEFT_FILL_SLOT_LIGHT_OFFSET_Z,
        targetOffsetX: LEFT_FILL_SLOT_LIGHT_TARGET_OFFSET_X,
        targetOffsetY: LEFT_FILL_SLOT_LIGHT_TARGET_OFFSET_Y,
        targetOffsetZ: LEFT_FILL_SLOT_LIGHT_TARGET_OFFSET_Z,
        castShadow: false,
      };
    }

    return {
      color: '#fff6ee',
      intensity: RIGHT_FILL_SLOT_LIGHT_INTENSITY,
      angle: RIGHT_FILL_SLOT_LIGHT_ANGLE,
      distance: RIGHT_FILL_SLOT_LIGHT_DISTANCE,
      slotZBias: RIGHT_FILL_SLOT_LIGHT_ANCHOR_Z_BIAS,
      offsetX: RIGHT_FILL_SLOT_LIGHT_OFFSET_X,
      offsetY: RIGHT_FILL_SLOT_LIGHT_OFFSET_Y,
      offsetZ: RIGHT_FILL_SLOT_LIGHT_OFFSET_Z,
      targetOffsetX: RIGHT_FILL_SLOT_LIGHT_TARGET_OFFSET_X,
      targetOffsetY: RIGHT_FILL_SLOT_LIGHT_TARGET_OFFSET_Y,
      targetOffsetZ: RIGHT_FILL_SLOT_LIGHT_TARGET_OFFSET_Z,
      castShadow: false,
    };
  }, [isFillLight, isLeftSlot]);

  useEffect(() => {
    if (!lightRef.current || !targetRef.current) return;
    lightRef.current.target = targetRef.current;
    lightRef.current.target.updateMatrixWorld();
  }, []);

  useFrame((state) => {
    if (!anchorLayout || !lightRef.current || !targetRef.current) return;

    // 这里不是固定世界坐标，而是固定在“当前视角里的槽位”。
    // 所以后面的左2、左3 / 右2、右3 走到这个位置时，也会经过同一束光。
    const slotZ = state.camera.position.z + anchorLayout.z + (lightConfig.slotZBias ?? 0);

    lightRef.current.position.set(
      anchorLayout.x + lightConfig.offsetX, // x：灯的左右位置；左灯往右侧偏一点，右灯往左侧偏一点
      anchorLayout.y + lightConfig.offsetY, // y：灯略高于画框中心，形成上方受光
      slotZ + lightConfig.offsetZ, // z：跟着相机推进，始终锁定当前槽位，不是锁死世界坐标
    );
    targetRef.current.position.set(
      anchorLayout.x + lightConfig.targetOffsetX, // x：目标稍微压进画框内侧，让光更集中在框面
      anchorLayout.y + lightConfig.targetOffsetY, // y：目标接近画框中心，避免只扫到边缘
      slotZ + lightConfig.targetOffsetZ, // z：目标同样跟着槽位走，这样后续画框到位时也能吃到光
    );
    lightRef.current.target.updateMatrixWorld();
  });

  if (!anchorLayout) {
    return null;
  }

  return (
    <>
      <spotLight
        ref={lightRef}
        castShadow={lightConfig.castShadow} // 主灯保留阴影；新增补光灯只负责提亮暗部，不再额外制造新阴影
        color={lightConfig.color} // 主灯偏暖白；补光灯更柔一点，用来洗掉死黑阴影
        intensity={lightConfig.intensity} // 主灯/补光灯都在各自常量里单独调亮度
        angle={lightConfig.angle} // 宽度调这里：越大光束越宽，越小越集中
        penumbra={0.9} // 光边缘柔和度：越大边缘越软，越像扫过去的光
        decay={1.1} // 衰减速度：越大离灯远的地方暗得越快
        distance={lightConfig.distance} // 照射距离：控制这盏灯能影响多远；想让后续槽位更容易吃到光，就适当加大
        shadow-mapSize-width={1024} // 阴影贴图宽度：越大越细，但性能开销也越高
        shadow-mapSize-height={1024} // 阴影贴图高度：通常和宽度一起调
        shadow-bias={-0.00012} // 阴影偏移：压一下阴影悬空/漏光问题，过大可能穿帮
        shadow-normalBias={0.02} // 法线偏移：减少表面阴影痘痘，但太大会让阴影飘开
        shadow-camera-near={0.5} // 阴影视锥近裁切：太小可能浪费精度
        shadow-camera-far={14} // 阴影视锥远裁切：尽量只包住当前槽位附近，阴影会更稳
      />
      <object3D ref={targetRef} />
    </>
  );
}

function LeftPrimaryFrameLight({ viewportWidth }) {
  return <SlotFrameLight viewportWidth={viewportWidth} side="left" />;
}

function RightPrimaryFrameLight({ viewportWidth }) {
  return <SlotFrameLight viewportWidth={viewportWidth} side="right" />;
}

function LeftFillSlotLight({ viewportWidth }) {
  return <SlotFrameLight viewportWidth={viewportWidth} side="left" variant="fill" />;
}

function RightFillSlotLight({ viewportWidth }) {
  return <SlotFrameLight viewportWidth={viewportWidth} side="right" variant="fill" />;
}

function getGaitParams(smoothedVelocity) {
  if (smoothedVelocity > 3200) {
    return { holdMs: 80, phaseMult: 3.2, fadeMs: 110 };
  }
  if (smoothedVelocity > 1600) {
    return { holdMs: 180, phaseMult: 2.1, fadeMs: 240 };
  }
  if (smoothedVelocity > 650) {
    return { holdMs: 340, phaseMult: 1.25, fadeMs: 480 };
  }
  return { holdMs: 700, phaseMult: 0.65, fadeMs: 820 };
}

function CorridorScene({ targetZ, targetZRef, activeCycle, loopProgress, focusedProject, onFocusProject, viewportWidth, isCoarsePointer }) {
  const focusCameraVectorRef = useRef(new THREE.Vector3());
  const focusLookAtVectorRef = useRef(new THREE.Vector3());
  const focusViewOffsetRef = useRef(null);
  const cameraFovRef = useRef(getRoamingCameraFov(viewportWidth));
  const frames = useMemo(
    () => createGalleryFrames(activeCycle, targetZ, loopProgress, viewportWidth),
    [activeCycle, targetZ, loopProgress, viewportWidth],
  );
  const visibleFrames = focusedProject ? [focusedProject] : frames;

  useFrame((state) => {
    const camera = state.camera;

    if (focusedProject) {
      const desktopFocusViewOffsetX = getDesktopFocusViewOffsetX(viewportWidth);
      const mobileFocusViewOffsetY = getMobileFocusViewOffsetY(viewportWidth);
      const focusViewOffsetX = viewportWidth > 1023 ? desktopFocusViewOffsetX : 0;
      const focusViewOffsetY = viewportWidth <= 1023 ? mobileFocusViewOffsetY : 0;
      const nextFocusViewOffset = (focusViewOffsetX !== 0 || focusViewOffsetY !== 0)
        ? `${state.size.width}x${state.size.height}:${focusViewOffsetX}:${focusViewOffsetY}`
        : 'none';
      const nextFocusFov = getFocusCameraFov(viewportWidth);
      let shouldUpdateProjectionMatrix = false;

      if (focusViewOffsetRef.current !== nextFocusViewOffset) {
        focusViewOffsetRef.current = nextFocusViewOffset;

        if (focusViewOffsetX !== 0 || focusViewOffsetY !== 0) {
          camera.setViewOffset(
            state.size.width,
            state.size.height,
            focusViewOffsetX,
            focusViewOffsetY,
            state.size.width,
            state.size.height,
          );
        } else {
          camera.clearViewOffset();
        }

        shouldUpdateProjectionMatrix = true;
      }

      if (cameraFovRef.current !== nextFocusFov) {
        cameraFovRef.current = nextFocusFov;
        camera.fov = nextFocusFov;
        shouldUpdateProjectionMatrix = true;
      }

      if (shouldUpdateProjectionMatrix) {
        camera.updateProjectionMatrix();
      }

      const focusZOffsetMagnitude = getFocusZOffsetMagnitude(viewportWidth);
      const focusZOffset = focusedProject.side < 0 ? focusZOffsetMagnitude : -focusZOffsetMagnitude;
      const focusScreenShiftX = getFocusScreenShiftX(viewportWidth);
      const focusScreenShiftY = getFocusScreenShiftY(viewportWidth);
      focusCameraVectorRef.current.set(
        focusedProject.cameraX,
        focusedProject.cameraY + focusScreenShiftY,
        focusedProject.cameraZ + focusZOffset,
      );
      focusLookAtVectorRef.current.set(
        focusedProject.lookAtX + focusedProject.side * focusScreenShiftX,
        focusedProject.lookAtY + focusScreenShiftY,
        focusedProject.lookAtZ,
      );
      camera.position.lerp(focusCameraVectorRef.current, 0.12);
      camera.lookAt(focusLookAtVectorRef.current);
      return;
    }

    let shouldResetProjectionMatrix = false;

    if (focusViewOffsetRef.current !== null) {
      focusViewOffsetRef.current = null;
      camera.clearViewOffset();
      shouldResetProjectionMatrix = true;
    }

    const roamingFov = getRoamingCameraFov(viewportWidth);

    if (cameraFovRef.current !== roamingFov) {
      cameraFovRef.current = roamingFov;
      camera.fov = roamingFov;
      shouldResetProjectionMatrix = true;
    }

    if (shouldResetProjectionMatrix) {
      camera.updateProjectionMatrix();
    }

    const roamingTargetZ = targetZRef?.current ?? targetZ;
    camera.position.x += (0 - camera.position.x) * CAMERA_XY_LERP;
    camera.position.y += (1.5 - camera.position.y) * CAMERA_XY_LERP;
    camera.position.z += (roamingTargetZ - camera.position.z) * CAMERA_Z_LERP;
    camera.lookAt(0, 1.5, camera.position.z - 8);
  });

  return (
    <>
      <color attach="background" args={[EXIT_VISUAL.background]} />
      <fog attach="fog" args={[EXIT_VISUAL.fog.color, EXIT_VISUAL.fog.near, EXIT_VISUAL.fog.far]} />
      <ambientLight intensity={0.88} />
      <directionalLight position={[0, 5.8, -26]} intensity={0.62} color="#fff3e8" />
      <CorridorGeometry viewportWidth={viewportWidth} isCoarsePointer={isCoarsePointer} />
      <ExitVisualGlow />
      <ExitFrameLight />
      <LeftPrimaryFrameLight viewportWidth={viewportWidth} />
      <RightPrimaryFrameLight viewportWidth={viewportWidth} />
      <LeftFillSlotLight viewportWidth={viewportWidth} />
      <RightFillSlotLight viewportWidth={viewportWidth} />
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

export default function DreamCorridor({ initialState, onEnterProject, onWakeUp }) {
  const initialTargetZ = initialState?.targetZ ?? 0;
  const [targetZ, setTargetZ] = useState(initialTargetZ);
  const [focusedProject, setFocusedProject] = useState(initialState?.focusedProject ?? null);
  const [pawActive, setPawActive] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);
  const pawTimerRef = useRef(null);
  const lastScrollTimeRef = useRef(0);
  const smoothedVelocityRef = useRef(0);
  const pawHoldMsRef = useRef(520);
  const corridorRef = useRef(null);
  const wheelFrameRef = useRef(0);
  const returnToRoamFrameRef = useRef(0);
  const touchStateRef = useRef({
    active: false,
    axis: null,
    lastX: 0,
    lastY: 0,
  });
  const targetZRef = useRef(initialTargetZ);
  const motionQueueRef = useRef({
    hasTargetZ: false,
    nextTargetZ: 0,
  });
  const activeCycle = Math.max(0, Math.floor(Math.abs(targetZ) / LOOP_LENGTH));
  const loopProgress = Math.abs(targetZ % LOOP_LENGTH) / LOOP_LENGTH;
  const isCoarsePointer = useMemo(() => window.matchMedia('(pointer: coarse)').matches, []);
  const corridorDpr = useMemo(
    () => [1, Math.min(window.devicePixelRatio || 1, isCoarsePointer ? 1 : CORRIDOR_DPR_CAP)],
    [isCoarsePointer],
  );
  const initialCameraState = useMemo(
    () => getFocusCameraState(initialState?.focusedProject ?? null, viewportWidth),
    [initialState, viewportWidth],
  );

  useEffect(() => {
    targetZRef.current = initialTargetZ;
  }, [initialTargetZ]);

  const flushMotionQueue = useCallback(() => {
    wheelFrameRef.current = 0;
    const queue = motionQueueRef.current;

    if (queue.hasTargetZ) {
      setTargetZ(queue.nextTargetZ);
      queue.hasTargetZ = false;
    }
  }, []);

  const scheduleMotionFlush = useCallback(() => {
    if (wheelFrameRef.current) return;
    wheelFrameRef.current = window.requestAnimationFrame(flushMotionQueue);
  }, [flushMotionQueue]);

  useEffect(() => () => {
    window.clearTimeout(pawTimerRef.current);
    window.cancelAnimationFrame(wheelFrameRef.current);
    window.cancelAnimationFrame(returnToRoamFrameRef.current);
  }, []);

  useEffect(() => {
    if (!initialState?.resumeFromProject || !initialState?.focusedProject) {
      return undefined;
    }

    returnToRoamFrameRef.current = window.requestAnimationFrame(() => {
      setFocusedProject(null);
    });

    return () => window.cancelAnimationFrame(returnToRoamFrameRef.current);
  }, [initialState]);

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
    pawTimerRef.current = window.setTimeout(() => setPawActive(false), pawHoldMsRef.current);
  }, []);

  const applyScrollDelta = useCallback((rawDelta, inputType = 'wheel') => {
    if (focusedProject) return;

    const now = performance.now();
    const dt = now - lastScrollTimeRef.current;
    lastScrollTimeRef.current = now;

    if (dt > 500) {
      smoothedVelocityRef.current *= Math.exp(-dt / 800);
    }

    if (dt > 0 && dt < 2000) {
      const instantVelocity = Math.abs(rawDelta) / (dt / 1000);
      smoothedVelocityRef.current =
        smoothedVelocityRef.current * (1 - VELOCITY_SMOOTH_FACTOR) + instantVelocity * VELOCITY_SMOOTH_FACTOR;
    }

    const gait = getGaitParams(smoothedVelocityRef.current);
    pawHoldMsRef.current = gait.holdMs;

    if (corridorRef.current) {
      corridorRef.current.style.setProperty('--paw-fade-duration', `${gait.fadeMs}ms`);
    }

    const maxDelta = inputType === 'touch' ? MAX_TOUCH_DELTA : MAX_WHEEL_DELTA;
    const scrollFactor = inputType === 'touch' ? TOUCH_SCROLL_FACTOR : WHEEL_SCROLL_FACTOR;
    const delta = Math.max(-maxDelta, Math.min(maxDelta, rawDelta));
    if (delta === 0) return;

    const nextTargetZ = Math.min(targetZRef.current - delta * scrollFactor, GALLERY_MAX_Z);
    targetZRef.current = nextTargetZ;
    motionQueueRef.current.nextTargetZ = nextTargetZ;
    motionQueueRef.current.hasTargetZ = true;

    scheduleMotionFlush();
  }, [focusedProject, scheduleMotionFlush]);

  function handleWheel(event) {
    applyScrollDelta(event.deltaY, 'wheel');
  }

  function handleTouchStart(event) {
    if (focusedProject || event.touches.length !== 1) return;
    if (event.target instanceof Element && event.target.closest('button')) return;

    const touch = event.touches[0];
    touchStateRef.current = {
      active: true,
      axis: null,
      lastX: touch.clientX,
      lastY: touch.clientY,
    };
  }

  function handleTouchMove(event) {
    const touchState = touchStateRef.current;
    if (!touchState.active || focusedProject || event.touches.length !== 1) return;

    const touch = event.touches[0];
    const deltaX = touchState.lastX - touch.clientX;
    const deltaY = touch.clientY - touchState.lastY;

    if (!touchState.axis) {
      if (Math.abs(deltaX) < TOUCH_AXIS_LOCK_THRESHOLD && Math.abs(deltaY) < TOUCH_AXIS_LOCK_THRESHOLD) {
        return;
      }

      touchState.axis = Math.abs(deltaY) >= Math.abs(deltaX) ? 'vertical' : 'horizontal';
    }

    touchState.lastX = touch.clientX;
    touchState.lastY = touch.clientY;

    if (touchState.axis !== 'vertical') return;

    event.preventDefault();
    const scaledDelta = Math.max(-MAX_TOUCH_DELTA, Math.min(MAX_TOUCH_DELTA, deltaY * TOUCH_SCROLL_MULTIPLIER));
    applyScrollDelta(scaledDelta, 'touch');
  }

  function handleTouchEnd() {
    touchStateRef.current = {
      active: false,
      axis: null,
      lastX: 0,
      lastY: 0,
    };
  }

  function handleFocusProject(project) {
    setFocusedProject(project);
  }

  function handleEnterDeepDream() {
    if (!focusedProject) return;
    onEnterProject(focusedProject.id, {
      targetZ: targetZRef.current,
      focusedProject,
    });
  }

  function handleReturnToCorridor() {
    setFocusedProject(null);
  }

  return (
    <main
      ref={corridorRef}
      className={[
        'corridor',
        'page-shell',
        focusedProject ? 'is-focused' : '',
        WALL_ALIGNMENT_DEBUG.enabled && WALL_ALIGNMENT_DEBUG.disableScreenOverlay ? 'corridor--debug-overlay-off' : '',
      ].filter(Boolean).join(' ')}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <Canvas
        shadows // 开启整个 three 渲染器的阴影功能；没有它，上面 castShadow/receiveShadow 都不会生效
        camera={{ position: initialCameraState.position, fov: initialCameraState.fov, near: 0.1, far: 120 }}
        dpr={corridorDpr}
        gl={{ powerPreference: 'high-performance', antialias: true, alpha: false, stencil: false }}
      >
        <CorridorScene
          targetZ={targetZ}
          targetZRef={targetZRef}
          activeCycle={activeCycle}
          loopProgress={loopProgress}
          focusedProject={focusedProject}
          onFocusProject={handleFocusProject}
          viewportWidth={viewportWidth}
          isCoarsePointer={isCoarsePointer}
        />
      </Canvas>

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
