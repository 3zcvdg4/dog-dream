import { useTexture } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import FramePortal from '../components/FramePortal.jsx';
import SteamField from '../components/SteamField.jsx';
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
const FOCUSED_LIGHT_DEBUG_DEFAULTS = {
  key: true,
  rim: true,
  topFill: true,
  backRim: true,
};
const PAW_PHASE_PER_DELTA = 0.0042;
const MAX_PAW_PHASE_INCREMENT = 0.4;
const VELOCITY_SMOOTH_FACTOR = 0.12;
const PAW_FADE_BASE_MS = 700;
const FOCUS_COPY_REVEAL_DELAY_MS = 80;
const WALL_X = 3.25;
const FOCUSED_FRAME_WALL_OUTSET = 0.34;
const CORRIDOR_HEIGHT = 3.6;
const CORRIDOR_SEGMENT_LENGTH = LOOP_LENGTH;
const FRAME_WIDTH = 1.22;
const FRAME_HEIGHT = 1.68;
const LEFT_FRAME_Y = 1.76;
const RIGHT_FRAME_Y = 1.9;
const CAMERA_FOV = 50;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getFocusZOffsetMagnitude(viewportWidth) {
  return 0;
}

function getFrameWallX(viewportWidth) {
  return WALL_X;
}

function applyFocusedProjectWallOffset(project, viewportWidth) {
  if (!project) {
    return project;
  }

  const sideSign = project.side < 0 ? -1 : 1;
  const focusedFrameX = sideSign * (getFrameWallX(viewportWidth) - FOCUSED_FRAME_WALL_OUTSET);

  return {
    ...project,
    position: [focusedFrameX, project.position[1], project.position[2]],
    cameraX: focusedFrameX - sideSign * FOCUSED_CAMERA_WALL_DISTANCE,
    lookAtX: focusedFrameX,
  };
}

function getRoamingFrameZShift(viewportWidth) {
  return 0;
}

function getTextureMaxDimension(viewportWidth, isCoarsePointer) {
  if (isCoarsePointer) return 1024;
  if (viewportWidth <= 1023) return 1536;
  return 2048;
}

function getFocusScreenShiftX(viewportWidth) {
  return 0;
}

function getFocusScreenShiftY(viewportWidth) {
  return 0;
}

function getDesktopFocusViewOffsetX(viewportWidth) {
  if (viewportWidth <= 1439) return 170;
  if (viewportWidth <= 1659) return 250;
  return 220;
}

function getMobileFocusViewOffsetY(viewportWidth) {
  return 0;
}

function getFocusCameraFov(viewportWidth) {
  return CAMERA_FOV;
}

function getFocusCameraState(project, viewportWidth) {
  const focusedProject = applyFocusedProjectWallOffset(project, viewportWidth);

  if (!focusedProject) {
    return {
      position: [0, 1.5, 0],
      fov: getRoamingCameraFov(viewportWidth),
    };
  }

  const focusZOffsetMagnitude = getFocusZOffsetMagnitude(viewportWidth);
  const focusZOffset = focusedProject.side < 0 ? focusZOffsetMagnitude : -focusZOffsetMagnitude;
  const focusScreenShiftY = getFocusScreenShiftY(viewportWidth);

  return {
    position: [
      focusedProject.cameraX,
      focusedProject.cameraY + focusScreenShiftY,
      focusedProject.cameraZ + focusZOffset,
    ],
    fov: getFocusCameraFov(viewportWidth),
  };
}

function getRoamingCameraFov(viewportWidth) {
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
const CORRIDOR_TEXTURE_URLS = [
  CEILING_TEXTURE_URL,
  FLOOR_TEXTURE_URL,
  LEFT_WALL_TEXTURE_URL,
  RIGHT_WALL_TEXTURE_URL,
];
const CORRIDOR_POSTER_URLS = projects.map((project) => project.imageUrl).filter(Boolean);
const FOCUS_CARD_BACKGROUND_URL = '/assets/Card Background-2.png';

export function preloadCorridorTextures({ includePosters = false } = {}) {
  useTexture.preload(includePosters ? [...CORRIDOR_TEXTURE_URLS, ...CORRIDOR_POSTER_URLS] : CORRIDOR_TEXTURE_URLS);
}

function preloadFocusCardBackground() {
  if (typeof window === 'undefined') return;
  const img = new window.Image();
  img.decoding = 'async';
  img.src = FOCUS_CARD_BACKGROUND_URL;
}

preloadCorridorTextures();

const CORRIDOR_RENDER_LENGTH = CORRIDOR_SEGMENT_LENGTH * 8;
const FOCUSED_CAMERA_WALL_DISTANCE = 3.4;
const CORRIDOR_DPR_CAP = 1.25;
// 地板烟雾/云层：按 steamParticle 的思路重做，粒子更集中、抬升更明显，也能直接旋转调试。
const GROUND_SMOKE_Y = 0;
const GROUND_SMOKE_COUNT = 12000;
const GROUND_SMOKE_AREA_WIDTH = 6.9;
const GROUND_SMOKE_AREA_LENGTH = 0.2;
const LEGACY_GROUND_SMOKE_CAMERA_OFFSET_Z = 1.4;
const GROUND_SMOKE_CAMERA_OFFSET_Z = -7.39;
const GROUND_SMOKE_MAX_HEIGHT = 24.2;
const GROUND_SMOKE_RISE_SPEED = 1.2;
const GROUND_SMOKE_SPREAD = 0.02;
const GROUND_SMOKE_TURBULENCE = 0;
const GROUND_SMOKE_DENSITY = 0.71;
const GROUND_SMOKE_PARTICLE_SIZE = 6;
const GROUND_SMOKE_COLOR = '#f9f9f9';
const GROUND_SMOKE_TIME_SCALE = -0.01;
const GROUND_SMOKE_ROTATION_X = -89.6;
const GROUND_SMOKE_ROTATION_Y = 0;
const GROUND_SMOKE_ROTATION_Z = 0;
const GROUND_SMOKE_DEFAULTS = {
  count: GROUND_SMOKE_COUNT,
  width: GROUND_SMOKE_AREA_WIDTH,
  length: GROUND_SMOKE_AREA_LENGTH,
  cameraOffsetZ: GROUND_SMOKE_CAMERA_OFFSET_Z,
  height: GROUND_SMOKE_MAX_HEIGHT,
  riseSpeed: GROUND_SMOKE_RISE_SPEED,
  spread: GROUND_SMOKE_SPREAD,
  turbulence: GROUND_SMOKE_TURBULENCE,
  density: GROUND_SMOKE_DENSITY,
  particleSize: GROUND_SMOKE_PARTICLE_SIZE,
  y: GROUND_SMOKE_Y,
  color: GROUND_SMOKE_COLOR,
  timeScale: GROUND_SMOKE_TIME_SCALE,
  rotationX: GROUND_SMOKE_ROTATION_X,
  rotationY: GROUND_SMOKE_ROTATION_Y,
  rotationZ: GROUND_SMOKE_ROTATION_Z,
};
const GROUND_SMOKE_VISIBLE_CYCLES = 3;
const GROUND_SMOKE_STORAGE_KEY = 'dogdream:corridor-smoke-settings:v3';
const GROUND_SMOKE_PANEL_OPEN_STORAGE_KEY = 'dogdream:corridor-smoke-panel-open:v1';
const GROUND_SMOKE_PANEL_ENTRY_ENABLED = false;
const SURFACE_WAVE_DEFAULTS = {
  enabled: true,
  mode: 'gradient',
  singleColor: '#ccf7ff',
  gradientStart: '#ffffff',
  gradientEnd: '#000000',
  speed: -0.25,
  sparse: 0,
  scale: 0.2,
  intensity: 0,
  opacity: 1.17,
  nearBrightness: 2.5,
  farBrightness: 0.56,
  floorBoost: 1.98,
  wallBoost: 1.98,
  ceilingBoost: 2.44,
  rotationX: 44.26,
  rotationY: -84.1,
  rotationZ: -48.69,
};
const SURFACE_WAVE_STORAGE_KEY = 'dogdream:corridor-surface-wave-settings:v4';
const SURFACE_WAVE_PANEL_OPEN_STORAGE_KEY = 'dogdream:corridor-surface-wave-panel-open:v1';
const SURFACE_WAVE_PANEL_ENTRY_ENABLED = false;
const SURFACE_WAVE_PANEL_DEFAULT_OPEN = true;

function loadGroundSmokePanelOpen() {
  if (typeof window === 'undefined') return false;

  try {
    return window.localStorage.getItem(GROUND_SMOKE_PANEL_OPEN_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function saveGroundSmokePanelOpen(isOpen) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(GROUND_SMOKE_PANEL_OPEN_STORAGE_KEY, isOpen ? '1' : '0');
  } catch {
    // ignore
  }
}

function normalizeGroundSmokeSettings(source) {
  const next = { ...GROUND_SMOKE_DEFAULTS };
  let hasExplicitCameraOffsetZ = false;

  if (!source || typeof source !== 'object') {
    return next;
  }

  for (const [key, value] of Object.entries(source)) {
    if (!(key in next)) continue;

    if (key === 'cameraOffsetZ') {
      hasExplicitCameraOffsetZ = true;
    }

    if (key === 'color' && typeof value === 'string') {
      next.color = value;
      continue;
    }

    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) continue;

    next[key] = key === 'count' ? Math.round(numericValue) : numericValue;
  }

  if (hasExplicitCameraOffsetZ && next.cameraOffsetZ === LEGACY_GROUND_SMOKE_CAMERA_OFFSET_Z) {
    next.cameraOffsetZ = GROUND_SMOKE_CAMERA_OFFSET_Z;
  }

  return next;
}

function loadGroundSmokeSettings() {
  if (typeof window === 'undefined') {
    return { ...GROUND_SMOKE_DEFAULTS };
  }

  try {
    const raw = window.localStorage.getItem(GROUND_SMOKE_STORAGE_KEY);
    if (!raw) return { ...GROUND_SMOKE_DEFAULTS };

    return normalizeGroundSmokeSettings(JSON.parse(raw));
  } catch {
    return { ...GROUND_SMOKE_DEFAULTS };
  }
}

function saveGroundSmokeSettings(settings) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(GROUND_SMOKE_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

function normalizeSurfaceWaveSettings(source) {
  const next = { ...SURFACE_WAVE_DEFAULTS };

  if (!source || typeof source !== 'object') {
    return next;
  }

  for (const [key, value] of Object.entries(source)) {
    if (!(key in next)) continue;

    if (key === 'mode' && typeof value === 'string') {
      next.mode = value === 'mono' ? 'mono' : 'gradient';
      continue;
    }

    if (
      typeof value === 'string'
      && (key === 'singleColor' || key === 'gradientStart' || key === 'gradientEnd')
    ) {
      next[key] = value;
      continue;
    }

    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) continue;
    next[key] = numericValue;
  }

  return next;
}

function loadSurfaceWavePanelOpen() {
  if (typeof window === 'undefined') return false;

  try {
    const raw = window.localStorage.getItem(SURFACE_WAVE_PANEL_OPEN_STORAGE_KEY);
    if (raw == null) {
      return SURFACE_WAVE_PANEL_DEFAULT_OPEN;
    }

    return raw === '1';
  } catch {
    return SURFACE_WAVE_PANEL_DEFAULT_OPEN;
  }
}

function saveSurfaceWavePanelOpen(isOpen) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(SURFACE_WAVE_PANEL_OPEN_STORAGE_KEY, isOpen ? '1' : '0');
  } catch {
    // ignore
  }
}

function loadSurfaceWaveSettings() {
  if (typeof window === 'undefined') {
    return { ...SURFACE_WAVE_DEFAULTS };
  }

  try {
    const raw = window.localStorage.getItem(SURFACE_WAVE_STORAGE_KEY);
    if (!raw) return { ...SURFACE_WAVE_DEFAULTS };

    return normalizeSurfaceWaveSettings(JSON.parse(raw));
  } catch {
    return { ...SURFACE_WAVE_DEFAULTS };
  }
}

function saveSurfaceWaveSettings(settings) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(SURFACE_WAVE_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export function applySurfaceWavePreset(settings) {
  const next = normalizeSurfaceWaveSettings(settings);

  if (typeof window === 'undefined') return false;

  try {
    window.localStorage.setItem(SURFACE_WAVE_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('dogdream:corridor-surface-wave-settings-updated', { detail: next }));
    return true;
  } catch {
    return false;
  }
}

export function applyGroundSmokePreset(settings) {
  const next = normalizeGroundSmokeSettings(settings);

  if (typeof window === 'undefined') return false;

  try {
    window.localStorage.setItem(GROUND_SMOKE_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('dogdream:corridor-smoke-settings-updated', { detail: next }));
    return true;
  } catch {
    return false;
  }
}
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
// 画框通透提亮灯：侧前方掠射光，专门擦亮玻璃边缘和台阶边。
const FRAME_TRANSPARENCY_RIM_LIGHT_INTENSITY = 10;
const FRAME_TRANSPARENCY_RIM_LIGHT_ANGLE = 1;
const FRAME_TRANSPARENCY_RIM_LIGHT_DISTANCE = 16;
const FRAME_TRANSPARENCY_RIM_LIGHT_OFFSET_X = 0.85;
const FRAME_TRANSPARENCY_RIM_LIGHT_OFFSET_Y = 0.7;
const FRAME_TRANSPARENCY_RIM_LIGHT_OFFSET_Z = -1.4;
const FRAME_TRANSPARENCY_RIM_LIGHT_TARGET_OFFSET_X = 0.18;
const FRAME_TRANSPARENCY_RIM_LIGHT_TARGET_OFFSET_Y = 0.04;
const FRAME_TRANSPARENCY_RIM_LIGHT_TARGET_OFFSET_Z = 0.2;
// 画框通透冷补光：上方偏冷，负责把暗掉的玻璃面和内收边托起来。
const FRAME_TRANSPARENCY_TOP_FILL_INTENSITY = 10;
const FRAME_TRANSPARENCY_TOP_FILL_ANGLE = 0.75;
const FRAME_TRANSPARENCY_TOP_FILL_DISTANCE = 18;
const FRAME_TRANSPARENCY_TOP_FILL_OFFSET_X = 0;
const FRAME_TRANSPARENCY_TOP_FILL_OFFSET_Y = 2.1;
const FRAME_TRANSPARENCY_TOP_FILL_OFFSET_Z = -1.8;
const FRAME_TRANSPARENCY_TOP_FILL_TARGET_OFFSET_X = 0;
const FRAME_TRANSPARENCY_TOP_FILL_TARGET_OFFSET_Y = 0.12;
const FRAME_TRANSPARENCY_TOP_FILL_TARGET_OFFSET_Z = 0.12;
// 画框通透轮廓光：背后或侧后方很弱，负责把外轮廓从背景里“剥出来”。
const FRAME_TRANSPARENCY_BACK_RIM_INTENSITY = 4;
const FRAME_TRANSPARENCY_BACK_RIM_ANGLE = 0.42;
const FRAME_TRANSPARENCY_BACK_RIM_DISTANCE = 20;
const FRAME_TRANSPARENCY_BACK_RIM_OFFSET_X = -0.9;
const FRAME_TRANSPARENCY_BACK_RIM_OFFSET_Y = 1.1;
const FRAME_TRANSPARENCY_BACK_RIM_OFFSET_Z = 2.4;
const FRAME_TRANSPARENCY_BACK_RIM_TARGET_OFFSET_X = 0.04;
const FRAME_TRANSPARENCY_BACK_RIM_TARGET_OFFSET_Y = 0.02;
const FRAME_TRANSPARENCY_BACK_RIM_TARGET_OFFSET_Z = -0.6;
// ------------------------------
// 聚焦页主灯参数（点击画框进入聚焦页后启用）
// 下面这组是专门给你手调的；这次会做“主灯 + 冷色侧高光 + 顶部补光 + 背轮廓光”。
// 左右两侧共用大部分参数，只有 X 方向偏移与目标落点会镜像。
// ------------------------------

// 聚焦主灯颜色：偏暖白。想更冷一点就往纯白/蓝白调，想更柔和就保留暖白。
const FOCUSED_FRAME_LIGHT_COLOR = '#fff7eb';
// 聚焦主灯亮度：这是最主要的亮度总阀门；越大越亮。
const FOCUSED_FRAME_LIGHT_INTENSITY = 120;
// 聚焦主灯光束宽度：越大铺得越开，越小越像一束很窄的聚光。
const FOCUSED_FRAME_LIGHT_ANGLE = 0.25;
// 聚焦主灯边缘柔和度：越大边缘越软，越像被雾化过的展厅灯。
const FOCUSED_FRAME_LIGHT_PENUMBRA = 0.92;
// 聚焦主灯衰减速度：越大离灯远的地方暗得越快。
const FOCUSED_FRAME_LIGHT_DECAY = 1.08;
// 聚焦主灯射程：越大照得越远，但也更容易把范围打散。
const FOCUSED_FRAME_LIGHT_DISTANCE = 16;

// 左侧聚焦主灯本体左右位置：正值表示从走廊内侧往左墙画框打过去。
const FOCUSED_LEFT_FRAME_LIGHT_OFFSET_X = 1.7;
// 右侧聚焦主灯本体左右位置：负值表示从走廊内侧往右墙画框打过去。
const FOCUSED_RIGHT_FRAME_LIGHT_OFFSET_X = -1.7;
// 聚焦主灯高度：越大越高；高一点更像从上方向下斜打。
const FOCUSED_FRAME_LIGHT_OFFSET_Y = 0.42;
// 聚焦主灯前后位置：越负越靠镜头这一侧；绝对值过大容易打空。
const FOCUSED_FRAME_LIGHT_OFFSET_Z = -3.4;

// 左侧聚焦主灯目标左右落点：控制光最后落在左框更偏中间还是更偏内缘。
const FOCUSED_LEFT_FRAME_LIGHT_TARGET_OFFSET_X = -0.02;
// 右侧聚焦主灯目标左右落点：与左侧镜像。
const FOCUSED_RIGHT_FRAME_LIGHT_TARGET_OFFSET_X = 0.02;
// 聚焦主灯目标高度：往上调更容易扫到画框上沿和海报上半部。
const FOCUSED_FRAME_LIGHT_TARGET_OFFSET_Y = 0.02;
// 聚焦主灯目标前后位置：控制光束扎进画框的深浅；太前会飘，太后会钻墙。
const FOCUSED_FRAME_LIGHT_TARGET_OFFSET_Z = 0.05;

// 阴影贴图宽度：越大阴影越细，但性能开销也越高。
const FOCUSED_FRAME_LIGHT_SHADOW_MAP_WIDTH = 0;
// 阴影贴图高度：通常和宽度一起调。
const FOCUSED_FRAME_LIGHT_SHADOW_MAP_HEIGHT = 1024;
// 阴影偏移：压一下阴影悬空/漏光问题；绝对值太大容易穿帮。
const FOCUSED_FRAME_LIGHT_SHADOW_BIAS = 0.00012;
// 法线偏移：减少阴影痘痘；太大阴影会像飘起来。
const FOCUSED_FRAME_LIGHT_SHADOW_NORMAL_BIAS = 0.02;
// 阴影视锥近裁切：太小可能浪费精度。
const FOCUSED_FRAME_LIGHT_SHADOW_NEAR = 0.5;
// 阴影视锥远裁切：尽量只包住聚焦画框附近，阴影会更稳。
const FOCUSED_FRAME_LIGHT_SHADOW_FAR = 18;

// ------------------------------
// 聚焦页侧高光灯参数（只在聚焦页启用）
// 这盏灯专门负责把相框边缘切出“冷色高光”，让玻璃边不再发平。
// ------------------------------

// 侧高光颜色：偏蓝白；这是你想要的“冷色反光感”主要来源。
const FOCUSED_FRAME_RIM_LIGHT_COLOR = '#ffffff';
// 侧高光亮度：越大边缘亮斑越明显，但太大会像打白漆。
const FOCUSED_FRAME_RIM_LIGHT_INTENSITY = 80;
// 侧高光光束宽度：稍微收一点，让它更像擦着边框过去的亮线。
const FOCUSED_FRAME_RIM_LIGHT_ANGLE = 0.54;
// 侧高光边缘柔和度：高一点更像展厅里柔和扫过去的反光。
const FOCUSED_FRAME_RIM_LIGHT_PENUMBRA = 0.96;
// 侧高光衰减速度：略快一点，避免把整面墙一起照亮。
const FOCUSED_FRAME_RIM_LIGHT_DECAY = 1.5;
// 侧高光射程：只需要包住聚焦画框附近。
const FOCUSED_FRAME_RIM_LIGHT_DISTANCE = 14;
// 左侧侧高光灯本体左右位置：从走廊内侧斜擦左墙画框的玻璃边。
const FOCUSED_LEFT_FRAME_RIM_LIGHT_OFFSET_X = 4;
// 右侧侧高光灯本体左右位置：与左侧镜像。
const FOCUSED_RIGHT_FRAME_RIM_LIGHT_OFFSET_X = -4;
// 侧高光灯高度：略高于画框中心，比较容易扫出上半段亮边。
const FOCUSED_FRAME_RIM_LIGHT_OFFSET_Y = 0.68;
// 侧高光灯前后位置：比主灯更贴近画框，形成擦边高光。
const FOCUSED_FRAME_RIM_LIGHT_OFFSET_Z = -1.48;
// 左侧侧高光目标左右落点：压进框面一点，避免只打到墙。
const FOCUSED_LEFT_FRAME_RIM_LIGHT_TARGET_OFFSET_X = 0.22;
// 右侧侧高光目标左右落点：与左侧镜像。
const FOCUSED_RIGHT_FRAME_RIM_LIGHT_TARGET_OFFSET_X = -0.22;
// 侧高光目标高度：略高一点，更容易切到海报上沿玻璃感。
const FOCUSED_FRAME_RIM_LIGHT_TARGET_OFFSET_Y = 0.08;
// 侧高光目标前后位置：让高光扎进框里，不要飘在前面。
const FOCUSED_FRAME_RIM_LIGHT_TARGET_OFFSET_Z = 0.16;

// ------------------------------
// 聚焦页顶部补光灯参数（只在聚焦页启用）
// 这盏灯负责把上沿和框面托起来，避免只有一侧亮、其余全塌掉。
// ------------------------------

// 顶补光颜色：偏冷白，负责把玻璃面提亮，但不抢主灯暖色关系。
const FOCUSED_FRAME_TOP_FILL_LIGHT_COLOR = '#ff0000';
// 顶补光亮度：只做托亮，不做主照明。
const FOCUSED_FRAME_TOP_FILL_LIGHT_INTENSITY = 200;
// 顶补光光束宽度：稍宽一点，让它能照顾整张框的上沿。
const FOCUSED_FRAME_TOP_FILL_LIGHT_ANGLE = 0.5;
// 顶补光边缘柔和度：保持很柔，避免在海报上留下生硬光圈。
const FOCUSED_FRAME_TOP_FILL_LIGHT_PENUMBRA = 1;
// 顶补光衰减速度：正常即可，主要只包住当前聚焦区域。
const FOCUSED_FRAME_TOP_FILL_LIGHT_DECAY = 1.08;
// 顶补光射程：比主灯略大一点，方便整圈框体都能吃到一点光。
const FOCUSED_FRAME_TOP_FILL_LIGHT_DISTANCE = 18;
// 顶补光左右位置：居中即可，不做左右偏置。
const FOCUSED_FRAME_TOP_FILL_LIGHT_OFFSET_X = 0.0;
// 顶补光高度：明显高于画框，形成从上往下托亮的感觉。
const FOCUSED_FRAME_TOP_FILL_LIGHT_OFFSET_Y = 2.08;
// 顶补光前后位置：稍微在镜头这一侧，避免打空。
const FOCUSED_FRAME_TOP_FILL_LIGHT_OFFSET_Z = -1.54;
// 顶补光目标左右落点：保持居中。
const FOCUSED_FRAME_TOP_FILL_LIGHT_TARGET_OFFSET_X = 0;
// 顶补光目标高度：瞄到框体中上段。
const FOCUSED_FRAME_TOP_FILL_LIGHT_TARGET_OFFSET_Y = 0.16;
// 顶补光目标前后位置：轻轻压进框体。
const FOCUSED_FRAME_TOP_FILL_LIGHT_TARGET_OFFSET_Z = 0.14;

// ------------------------------
// 聚焦页背轮廓灯参数（只在聚焦页启用）
// 这盏灯只负责把相框边缘从背景里“剥出来”，不负责照亮海报主体。
// ------------------------------

// 背轮廓光颜色：接近白色，避免背边出现太明显的偏色。
const FOCUSED_FRAME_BACK_RIM_LIGHT_COLOR = '#ffffff';
// 背轮廓光亮度：保持轻，不然会像背后开了探照灯。
const FOCUSED_FRAME_BACK_RIM_LIGHT_INTENSITY = 4.6;
// 背轮廓光光束宽度：较窄，主要切外轮廓。
const FOCUSED_FRAME_BACK_RIM_LIGHT_ANGLE = 0.4;
// 背轮廓光边缘柔和度：柔一点，轮廓才会自然。
const FOCUSED_FRAME_BACK_RIM_LIGHT_PENUMBRA = 0.98;
// 背轮廓光衰减速度：略快，避免照到大面积背景。
const FOCUSED_FRAME_BACK_RIM_LIGHT_DECAY = 1.1;
// 背轮廓光射程：只要覆盖框体附近即可。
const FOCUSED_FRAME_BACK_RIM_LIGHT_DISTANCE = 18;
// 左侧背轮廓灯左右位置：放到框体背后反侧，切轮廓边。
const FOCUSED_LEFT_FRAME_BACK_RIM_LIGHT_OFFSET_X = -0.94;
// 右侧背轮廓灯左右位置：与左侧镜像。
const FOCUSED_RIGHT_FRAME_BACK_RIM_LIGHT_OFFSET_X = 0.94;
// 背轮廓灯高度：略高于画框中心，更容易剥出上半圈轮廓。
const FOCUSED_FRAME_BACK_RIM_LIGHT_OFFSET_Y = 1.02;
// 背轮廓灯前后位置：放到画框更后方，让它像背轮廓光。
const FOCUSED_FRAME_BACK_RIM_LIGHT_OFFSET_Z = 2.18;
// 左侧背轮廓目标左右落点：轻轻压回框体中心。
const FOCUSED_LEFT_FRAME_BACK_RIM_LIGHT_TARGET_OFFSET_X = 0.04;
// 右侧背轮廓目标左右落点：与左侧镜像。
const FOCUSED_RIGHT_FRAME_BACK_RIM_LIGHT_TARGET_OFFSET_X = -0.04;
// 背轮廓目标高度：保持接近中心略上。
const FOCUSED_FRAME_BACK_RIM_LIGHT_TARGET_OFFSET_Y = 0.04;
// 背轮廓目标前后位置：压向框体背面。
const FOCUSED_FRAME_BACK_RIM_LIGHT_TARGET_OFFSET_Z = -0.48;

const FOCUSED_SURFACE_WAVE_OPACITY_MULTIPLIER = 0.42;
const FOCUSED_SURFACE_WAVE_INTENSITY_MULTIPLIER = 0.55;
const FOCUSED_SURFACE_WAVE_WALL_BOOST_MULTIPLIER = 0.58;
const FOCUSED_SURFACE_WAVE_FLOOR_BOOST_MULTIPLIER = 0.74;
const FOCUSED_SURFACE_WAVE_CEILING_BOOST_MULTIPLIER = 0.82;
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

const SURFACE_WAVE_SURFACE_BOOSTS = {
  floor: 1.08,
  ceiling: 0.72,
  leftWall: 0.94,
  rightWall: 0.94,
};

const SURFACE_WAVE_VERTEX_SHADER = `
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying float vViewDepth;

  void main() {
    vUv = uv;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vViewDepth = max(0.0, -viewPosition.z);
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const SURFACE_WAVE_FRAGMENT_SHADER = `
  precision highp float;
  #define TAU 6.28318530718
  #define MAX_ITER 5

  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying float vViewDepth;

  uniform sampler2D uMap;
  uniform float uTime;
  uniform float uSpeed;
  uniform float uSparse;
  uniform float uScale;
  uniform float uIntensity;
  uniform float uOpacity;
  uniform float uNearBrightness;
  uniform float uFarBrightness;
  uniform float uMode;
  uniform float uSurfaceBoost;
  uniform float uRotationX;
  uniform float uRotationY;
  uniform float uRotationZ;
  uniform vec3 uSingleColor;
  uniform vec3 uGradientStart;
  uniform vec3 uGradientEnd;

  mat2 rotate2D(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
  }

  vec3 rotateX3D(vec3 p, float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return vec3(p.x, p.y * c - p.z * s, p.y * s + p.z * c);
  }

  vec3 rotateY3D(vec3 p, float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return vec3(p.x * c + p.z * s, p.y, -p.x * s + p.z * c);
  }

  vec3 rotateZ3D(vec3 p, float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return vec3(p.x * c - p.y * s, p.x * s + p.y * c, p.z);
  }

  vec2 projectSurfaceUv(vec3 p) {
    vec3 worldDx = dFdx(vWorldPosition);
    vec3 worldDy = dFdy(vWorldPosition);
    vec3 n = normalize(cross(worldDx, worldDy));
    vec3 an = abs(n);

    if (an.y >= an.x && an.y >= an.z) {
      return p.xz;
    }

    if (an.x >= an.z) {
      return p.zy;
    }

    return p.xy;
  }

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 345.45));
    p += dot(p, p + 34.345);
    return fract(p.x * p.y);
  }

  float noise21(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float flowCaustics(vec2 uv, float time, float brightness, float flowSpeed) {
    vec2 p = mod(uv * TAU, TAU) - 250.0;
    vec2 i = p;
    float field = 1.0;
    float intensity = mix(0.0115, 0.0048, brightness);

    for (int iter = 0; iter < MAX_ITER; iter += 1) {
      float stepFactor = 1.0 - (3.5 / float(iter + 1));
      float t = time * flowSpeed * stepFactor;

      i = p + vec2(
        cos(t - i.x) + sin(t + i.y),
        sin(t - i.y) + cos(t + i.x)
      );

      field += 1.0 / length(vec2(
        p.x / (sin(i.x + t) / intensity),
        p.y / (cos(i.y + t) / intensity)
      ));
    }

    field /= float(MAX_ITER);
    return field;
  }

  void main() {
    vec3 p = vWorldPosition;
    p = rotateX3D(p, uRotationX);
    p = rotateY3D(p, uRotationY);
    p = rotateZ3D(p, uRotationZ);

    float sparse = clamp(uSparse, 0.0, 1.0);
    float scaleMix = clamp((uScale - 0.2) / 4.8, 0.0, 1.0);
    float intensity = clamp(uIntensity, 0.0, 3.0);
    float t = uTime * (0.42 + abs(uSpeed) * 0.9);
    float direction = uSpeed < 0.0 ? -1.0 : 1.0;
    vec2 surfaceUv = projectSurfaceUv(p);
    vec2 domain = rotate2D(0.36) * surfaceUv;
    domain *= mix(0.24, 1.65, scaleMix) * mix(1.0, 1.22, 1.0 - sparse);
    domain += vec2(p.z * 0.08, p.x * 0.04 + p.y * 0.03);

    vec2 drift = vec2(t * direction * (0.12 + intensity * 0.05), -t * direction * (0.09 + intensity * 0.04));
    vec2 driftB = vec2(-t * direction * (0.07 + intensity * 0.04), t * direction * (0.12 + intensity * 0.05));
    float breakupNoise = noise21(domain * 0.62 + drift * 0.9);
    float breakupNoiseB = noise21(rotate2D(0.8) * domain * 0.84 + 17.3 + driftB);
    float breakupField = breakupNoise * 0.62 + breakupNoiseB * 0.38;
    float breakup = mix(0.38, 1.0, smoothstep(0.18, 0.92, breakupField));

    vec2 warpNoise = vec2(
      noise21(domain * 0.74 + vec2(4.2, -3.1) + drift),
      noise21(domain * 0.78 + vec2(-8.4, 6.7) - driftB)
    ) - 0.5;
    domain += warpNoise * (0.06 + intensity * 0.24);

    float brightnessA = clamp(0.22 + intensity * 0.18 + (1.0 - sparse) * 0.22, 0.08, 0.96);
    float brightnessB = clamp(0.18 + intensity * 0.16 + sparse * 0.08, 0.08, 0.92);
    float fieldA = flowCaustics(domain + drift, t * (0.82 + intensity * 0.08), brightnessA, 0.88 + intensity * 0.12);
    float fieldB = flowCaustics(rotate2D(0.92) * domain * 1.18 + 14.8 + driftB, t * (0.66 + intensity * 0.08) + 8.4, brightnessB, 0.72 + intensity * 0.12);

    float causticA = max(0.0, 1.17 - pow(fieldA, mix(1.18, 1.72, sparse)));
    float causticB = max(0.0, 1.12 - pow(fieldB, mix(1.08, 1.54, sparse)));
    float thresholdA = mix(0.82, 0.985, sparse);
    float thresholdB = mix(0.84, 0.99, sparse);
    float strandsA = smoothstep(thresholdA, 1.0, causticA);
    float strandsB = smoothstep(thresholdB, 1.0, causticB);
    float shimmer = 0.88 + 0.12 * sin((domain.x + domain.y) * 0.9 + t * 0.6);
    float linePresence = (strandsA * 0.98 + strandsB * 0.7) * breakup * shimmer;

    float edgeFade = smoothstep(0.0, 0.025, vUv.x) * smoothstep(0.0, 0.025, vUv.y) * smoothstep(0.0, 0.025, 1.0 - vUv.x) * smoothstep(0.0, 0.025, 1.0 - vUv.y);
    vec3 baseTex = texture2D(uMap, vUv).rgb;
    float baseLuma = dot(baseTex, vec3(0.299, 0.587, 0.114));
    float lumaGuard = mix(1.0, 0.82, smoothstep(0.62, 1.0, baseLuma));
    float depthMix = smoothstep(2.0, 34.0, vViewDepth);
    float depthBrightness = mix(uNearBrightness, uFarBrightness, depthMix);
    float alpha = clamp(linePresence * (0.1 + uOpacity * 0.34) * (0.28 + intensity * 0.92) * pow(uSurfaceBoost, 1.18) * edgeFade * lumaGuard * depthBrightness, 0.0, 0.72);

    float colorMixSeed = clamp(0.24 + breakupNoise * 0.36 + breakupNoiseB * 0.24 + strandsB * 0.16, 0.0, 1.0);
    vec3 gradientColor = mix(uGradientStart, uGradientEnd, colorMixSeed);
    vec3 waveColor = mix(uSingleColor, gradientColor, step(0.5, uMode));

    float whiteHot = clamp(strandsA * 0.32 + strandsB * 0.22, 0.0, 0.36);
    vec3 glow = waveColor * linePresence * (0.72 + intensity * 0.5) * pow(uSurfaceBoost, 0.82) * depthBrightness;
    glow = mix(glow, vec3(1.0), whiteHot);

    if (alpha < 0.01) discard;

    gl_FragColor = vec4(clamp(glow, 0.0, 1.0), alpha);
  }
`;

function createSurfaceWaveMaterial(texture, surfaceKey, settings, surfaceBoost = 1) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: texture },
      uTime: { value: 0 },
      uSpeed: { value: settings.speed },
      uSparse: { value: settings.sparse },
      uScale: { value: settings.scale },
      uIntensity: { value: settings.intensity },
      uOpacity: { value: settings.opacity },
      uNearBrightness: { value: settings.nearBrightness },
      uFarBrightness: { value: settings.farBrightness },
      uMode: { value: settings.mode === 'gradient' ? 1 : 0 },
      uSurfaceBoost: { value: (SURFACE_WAVE_SURFACE_BOOSTS[surfaceKey] ?? 1) * surfaceBoost },
      uRotationX: { value: THREE.MathUtils.degToRad(settings.rotationX) },
      uRotationY: { value: THREE.MathUtils.degToRad(settings.rotationY) },
      uRotationZ: { value: THREE.MathUtils.degToRad(settings.rotationZ) },
      uSingleColor: { value: new THREE.Color(settings.singleColor) },
      uGradientStart: { value: new THREE.Color(settings.gradientStart) },
      uGradientEnd: { value: new THREE.Color(settings.gradientEnd) },
    },
    vertexShader: SURFACE_WAVE_VERTEX_SHADER,
    fragmentShader: SURFACE_WAVE_FRAGMENT_SHADER,
    side: THREE.FrontSide,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
}

function buildGroundSmokeGeometry(settings) {
  const geometry = new THREE.BufferGeometry();
  const positions = [];
  const sizes = [];
  const phases = [];
  const velocities = [];
  const particleCount = Math.max(64, Math.round(settings.count));

  for (let index = 0; index < particleCount; index += 1) {
    positions.push(
      (Math.random() - 0.5) * settings.width * (0.45 + Math.random() * 0.55),
      Math.random() * 0.05,
      (Math.random() - 0.5) * settings.length,
    );

    sizes.push(settings.particleSize * (0.82 + Math.random() * 0.58));
    phases.push(Math.random());
    velocities.push(
      (Math.random() - 0.5) * settings.spread,
      settings.riseSpeed * (0.9 + Math.random() * 0.6),
      (Math.random() - 0.5) * settings.spread * 0.72,
    );
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
  geometry.setAttribute('phase', new THREE.Float32BufferAttribute(phases, 1));
  geometry.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities, 3));
  geometry.computeBoundingSphere();

  return geometry;
}

function formatSmokeControlValue(key, value) {
  const safeValue = Number.isFinite(Number(value)) ? Number(value) : 0;

  if (key === 'count') {
    return `${Math.round(safeValue)}`;
  }

  if (key.startsWith('rotation')) {
    return `${Math.round(safeValue)}°`;
  }

  return `${safeValue.toFixed(3).replace(/\.0+$/, '').replace(/\.([1-9]*)0+$/, '.$1')}`;
}

const GROUND_SMOKE_FAB_STYLE = {
  position: 'absolute',
  right: 'clamp(18px, 3vw, 42px)',
  bottom: 'clamp(78px, 9vw, 112px)',
  zIndex: 7,
  width: '46px',
  height: '46px',
  border: '1px solid rgba(255,255,255,0.18)',
  borderRadius: '999px',
  background: 'rgba(16, 20, 28, 0.72)',
  color: '#eef7ff',
  boxShadow: '0 10px 30px rgba(0,0,0,0.28)',
  backdropFilter: 'blur(10px)',
  cursor: 'pointer',
  fontSize: '22px',
  lineHeight: 1,
};

const GROUND_SMOKE_PANEL_STYLE = {
  position: 'absolute',
  right: 'clamp(16px, 2.4vw, 32px)',
  top: 'clamp(64px, 8vw, 92px)',
  zIndex: 7,
  width: 'min(360px, calc(100vw - 32px))',
  maxHeight: 'calc(100vh - 120px)',
  overflow: 'auto',
  borderRadius: '18px',
  border: '1px solid rgba(255,255,255,0.14)',
  background: 'rgba(13, 16, 24, 0.82)',
  boxShadow: '0 18px 50px rgba(0,0,0,0.36)',
  backdropFilter: 'blur(14px)',
  color: '#eef7ff',
};

const GROUND_SMOKE_TOGGLE_STYLE = {
  position: 'sticky',
  top: 0,
  zIndex: 1,
  width: '100%',
  padding: '10px 14px',
  border: '0',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.04)',
  color: 'inherit',
  cursor: 'pointer',
};

const GROUND_SMOKE_PANEL_BODY_STYLE = {
  padding: '14px',
};

const GROUND_SMOKE_PANEL_HEADER_STYLE = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  marginBottom: '12px',
};

const GROUND_SMOKE_RESET_STYLE = {
  border: '1px solid rgba(255,255,255,0.16)',
  borderRadius: '999px',
  background: 'transparent',
  color: 'inherit',
  padding: '6px 12px',
  cursor: 'pointer',
};

const GROUND_SMOKE_GRID_STYLE = {
  display: 'grid',
  gap: '10px',
};

const GROUND_SMOKE_CONTROL_STYLE = {
  display: 'grid',
  gap: '8px',
  padding: '10px 12px',
  borderRadius: '12px',
  background: 'rgba(255,255,255,0.04)',
};

const GROUND_SMOKE_CONTROL_HEAD_STYLE = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  fontSize: '13px',
};

const GROUND_SMOKE_ROW_STYLE = {
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  alignItems: 'center',
  gap: '8px',
};

const GROUND_SMOKE_INPUT_STYLE = {
  width: '100%',
};

const GROUND_SMOKE_NUMBER_STYLE = {
  width: '84px',
  padding: '6px 8px',
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(0,0,0,0.22)',
  color: 'inherit',
};

const GROUND_SMOKE_COLOR_STYLE = {
  width: '100%',
  minHeight: '38px',
  border: '0',
  background: 'transparent',
  padding: 0,
};

const GROUND_SMOKE_LAYERS = [
  { key: 'core', sizeBoost: 1.05, opacityBoost: 0.9, timeOffset: 0.0, driftBoost: 0.95 },
  { key: 'mid', sizeBoost: 1.9, opacityBoost: 0.5, timeOffset: 0.23, driftBoost: 1.12 },
  { key: 'haze', sizeBoost: 3.2, opacityBoost: 0.24, timeOffset: 0.47, driftBoost: 1.34 },
];

const GROUND_SMOKE_VERTEX_SHADER = `
  attribute float size;
  attribute float phase;
  attribute vec3 velocity;
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
    vAge = age;
    vLift = smoothstep(0.0, 1.0, age);

    float effectiveHeight = height * 0.18;
    vec3 pos = position;
    pos.x += velocity.x * age * effectiveHeight * driftBoost;
    pos.z += velocity.z * age * effectiveHeight * driftBoost;
    pos.y += velocity.y * age * effectiveHeight;

    pos.x += sin(age * 6.28318 + phase * 18.0) * spread * driftBoost * (0.12 + age * 0.95) * (0.55 + turbulence);
    pos.z += cos(age * 5.214 + phase * 14.0) * spread * 0.68 * driftBoost * (0.1 + age * 0.82) * (0.5 + turbulence * 0.82);
    pos.y += age * effectiveHeight * (0.92 + turbulence * 0.2);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = clamp(size * sizeBoost * (0.85 + age * 1.85) * (250.0 / max(0.85, -mvPosition.z)), 1.0, 48.0);

    float fadeIn = smoothstep(0.0, 0.07, age);
    float fadeOut = 1.0 - smoothstep(0.66, 1.0, age);
    vAlpha = fadeIn * fadeOut;
  }
`;

const GROUND_SMOKE_FRAGMENT_SHADER = `
  uniform vec3 baseColor;
  uniform float density;
  uniform float opacityBoost;
  varying float vAlpha;
  varying float vAge;
  varying float vLift;

  void main() {
    vec2 p = gl_PointCoord - 0.5;
    float dist = length(p) * 2.0;
    if (dist > 1.0) discard;

    float puffA = exp(-dot(p, p) * 9.0);
    float puffB = exp(-dot(p - vec2(0.12, -0.04), p - vec2(0.12, -0.04)) * 26.0);
    float puffC = exp(-dot(p + vec2(0.08, 0.1), p + vec2(0.08, 0.1)) * 22.0);
    float body = max(puffA, max(puffB, puffC * 0.9));
    float shell = 1.0 - smoothstep(0.18, 1.0, dist);

    float alpha = (body * 0.76 + shell * 0.24) * vAlpha * density * opacityBoost;
    vec3 color = mix(baseColor, vec3(0.985, 0.992, 1.0), 0.14 + vLift * 0.14);
    gl_FragColor = vec4(color, alpha);
  }
`;

function createGroundSmokeMaterial(sharedUniforms, layer) {
  return new THREE.ShaderMaterial({
    uniforms: {
      ...sharedUniforms,
      sizeBoost: { value: layer.sizeBoost },
      opacityBoost: { value: layer.opacityBoost },
      timeOffset: { value: layer.timeOffset },
      driftBoost: { value: layer.driftBoost },
    },
    vertexShader: GROUND_SMOKE_VERTEX_SHADER,
    fragmentShader: GROUND_SMOKE_FRAGMENT_SHADER,
    blending: THREE.NormalBlending,
    depthWrite: false,
    transparent: true,
  });
}

function GroundSmokeControls({ settings, onChange, onReset }) {
  const [open, setOpen] = useState(() => loadGroundSmokePanelOpen());

  const controls = [
    ['count', '粒子数量', settings.count, 500, 12000, 50],
    ['particleSize', '粒子大小', settings.particleSize, 0.5, 6, 0.01],
    ['width', '喷口宽度', settings.width, 0.4, 30, 0.1],
    ['length', '喷口深度', settings.length, 0.2, 8, 0.1],
    ['y', '贴地高度', settings.y, 0, 0.18, 0.001],
    ['cameraOffsetZ', '循环前后偏移', settings.cameraOffsetZ, -8, 4.2, 0.01],
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
      saveGroundSmokePanelOpen(value);
      return value;
    });
  }, []);

  useEffect(() => {
    if (!GROUND_SMOKE_PANEL_ENTRY_ENABLED) return undefined;

    function onKeyDown(event) {
      if (event.shiftKey && event.key.toLowerCase() === 's') {
        event.preventDefault();
        toggleOpen();
      }

      if (event.key === 'Escape') {
        setOpen((next) => {
          if (!next) return next;
          saveGroundSmokePanelOpen(false);
          return false;
        });
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggleOpen]);

  useEffect(() => {
    if (!GROUND_SMOKE_PANEL_ENTRY_ENABLED) return;
    saveGroundSmokePanelOpen(open);
  }, [open]);

  if (!GROUND_SMOKE_PANEL_ENTRY_ENABLED) {
    return null;
  }

  if (!open) {
    return (
      <button
        className="smoke-panel__fab"
        type="button"
        onClick={toggleOpen}
        aria-label="打开烟雾调节面板"
        title="打开烟雾调节面板（Shift+S）"
        style={GROUND_SMOKE_FAB_STYLE}
      >
        ⚙
      </button>
    );
  }

  return (
    <section className="smoke-panel" aria-label="烟雾调节面板" style={GROUND_SMOKE_PANEL_STYLE}>
      <button className="smoke-panel__toggle" type="button" onClick={toggleOpen} style={GROUND_SMOKE_TOGGLE_STYLE}>
        收起
      </button>

      {open && (
        <div className="smoke-panel__body" style={GROUND_SMOKE_PANEL_BODY_STYLE}>
          <div className="smoke-panel__header" style={GROUND_SMOKE_PANEL_HEADER_STYLE}>
            <strong>烟雾调节</strong>
            <button className="smoke-panel__reset" type="button" onClick={onReset} style={GROUND_SMOKE_RESET_STYLE}>恢复默认</button>
          </div>

          <div className="smoke-panel__grid" style={GROUND_SMOKE_GRID_STYLE}>
            {controls.map(([key, label, value, min, max, step]) => (
              <label key={key} className="smoke-control" style={GROUND_SMOKE_CONTROL_STYLE}>
                <span style={GROUND_SMOKE_CONTROL_HEAD_STYLE}>
                  {label}
                  <output>{formatSmokeControlValue(key, value)}</output>
                </span>
                <div className="steam-lab-control__row" style={GROUND_SMOKE_ROW_STYLE}>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(event) => update(key, key === 'count' ? Number.parseInt(event.target.value, 10) : Number(event.target.value))}
                    style={GROUND_SMOKE_INPUT_STYLE}
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
                      style={GROUND_SMOKE_NUMBER_STYLE}
                    />
                  )}
                </div>
              </label>
            ))}
            <label className="smoke-control smoke-control--color" style={GROUND_SMOKE_CONTROL_STYLE}>
              <span style={GROUND_SMOKE_CONTROL_HEAD_STYLE}>颜色<output>{settings.color}</output></span>
              <input
                type="color"
                value={settings.color}
                onChange={(event) => update('color', event.target.value)}
                style={GROUND_SMOKE_COLOR_STYLE}
              />
            </label>
          </div>
        </div>
      )}
    </section>
  );
}

function GroundSteam({ settings, activeCycle }) {
  const cycleIndices = useMemo(() => {
    const startCycle = Math.max(0, activeCycle - 1);
    return Array.from({ length: GROUND_SMOKE_VISIBLE_CYCLES }, (_, index) => startCycle + index);
  }, [activeCycle]);

  return cycleIndices.map((cycleIndex) => (
    <SteamField
      key={`ground-smoke-${cycleIndex}`}
      settings={settings}
      baseY={0}
      baseZ={-cycleIndex * LOOP_LENGTH - settings.cameraOffsetZ}
      followCameraOffsetZ={null}
      layers={GROUND_SMOKE_LAYERS}
    />
  ));
}

function CorridorSurface({
  position,
  rotation,
  args,
  texture,
  debugColor,
  waveSettings,
  surfaceBoost,
  surfaceKey,
}) {
  const waveMaterial = useMemo(() => {
    if (!waveSettings?.enabled) return null;
    return createSurfaceWaveMaterial(texture, surfaceKey, waveSettings, surfaceBoost);
  }, [surfaceBoost, surfaceKey, texture, waveSettings]);

  useEffect(() => () => {
    waveMaterial?.dispose();
  }, [waveMaterial]);

  useFrame((state) => {
    if (waveMaterial) {
      waveMaterial.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <planeGeometry args={args} />
        <meshBasicMaterial
          map={debugColor ? null : texture}
          color={debugColor ?? '#ffffff'}
          side={THREE.FrontSide}
          toneMapped={false}
        />
      </mesh>
      {waveMaterial && (
        <mesh renderOrder={2}>
          <planeGeometry args={args} />
          <primitive object={waveMaterial} attach="material" />
        </mesh>
      )}
    </group>
  );
}

function CorridorGeometry({ viewportWidth, isCoarsePointer, waveSettings }) {
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
        waveSettings={waveSettings}
        surfaceBoost={waveSettings.floorBoost}
        surfaceKey="floor"
      />
      <CorridorSurface
        position={[0, CORRIDOR_HEIGHT, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        args={[WALL_X * 2, CORRIDOR_RENDER_LENGTH]}
        texture={textures.ceiling}
        debugColor={WALL_ALIGNMENT_DEBUG.enabled && WALL_ALIGNMENT_DEBUG.useFlatSurfaceColors ? DEBUG_SURFACE_COLORS.ceiling : null}
        waveSettings={waveSettings}
        surfaceBoost={waveSettings.ceilingBoost}
        surfaceKey="ceiling"
      />
      <CorridorSurface
        position={[-WALL_X, CORRIDOR_HEIGHT / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
        args={[CORRIDOR_RENDER_LENGTH, CORRIDOR_HEIGHT]}
        texture={textures.leftWall}
        debugColor={WALL_ALIGNMENT_DEBUG.enabled && WALL_ALIGNMENT_DEBUG.useFlatSurfaceColors ? DEBUG_SURFACE_COLORS.leftWall : null}
        waveSettings={waveSettings}
        surfaceBoost={waveSettings.wallBoost}
        surfaceKey="leftWall"
      />
      <CorridorSurface
        position={[WALL_X, CORRIDOR_HEIGHT / 2, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        args={[CORRIDOR_RENDER_LENGTH, CORRIDOR_HEIGHT]}
        texture={textures.rightWall}
        debugColor={WALL_ALIGNMENT_DEBUG.enabled && WALL_ALIGNMENT_DEBUG.useFlatSurfaceColors ? DEBUG_SURFACE_COLORS.rightWall : null}
        waveSettings={waveSettings}
        surfaceBoost={waveSettings.wallBoost}
        surfaceKey="rightWall"
      />
    </group>
  );
}

function formatWaveControlValue(key, value) {
  if (key === 'enabled') return value ? '开' : '关';
  if (key === 'mode') return value === 'gradient' ? '渐变' : '单色';
  return `${Number(value).toFixed(3).replace(/\.0+$/, '').replace(/\.([1-9]*)0+$/, '.$1')}`;
}

const SURFACE_WAVE_FAB_STYLE = {
  position: 'absolute',
  right: 'clamp(18px, 3vw, 42px)',
  bottom: 'clamp(22px, 4vw, 42px)',
  zIndex: 6,
  width: '46px',
  height: '46px',
  border: '1px solid rgba(255,255,255,0.18)',
  borderRadius: '999px',
  background: 'rgba(16, 20, 28, 0.72)',
  color: '#eef7ff',
  boxShadow: '0 10px 30px rgba(0,0,0,0.28)',
  backdropFilter: 'blur(10px)',
  cursor: 'pointer',
  fontSize: '22px',
  lineHeight: 1,
};

const SURFACE_WAVE_PANEL_STYLE = {
  position: 'absolute',
  right: 'clamp(16px, 2.4vw, 32px)',
  top: 'clamp(64px, 8vw, 92px)',
  zIndex: 6,
  width: 'min(360px, calc(100vw - 32px))',
  maxHeight: 'calc(100vh - 120px)',
  overflow: 'auto',
  borderRadius: '18px',
  border: '1px solid rgba(255,255,255,0.14)',
  background: 'rgba(13, 16, 24, 0.82)',
  boxShadow: '0 18px 50px rgba(0,0,0,0.36)',
  backdropFilter: 'blur(14px)',
  color: '#eef7ff',
};

const SURFACE_WAVE_TOGGLE_STYLE = {
  position: 'sticky',
  top: 0,
  zIndex: 1,
  width: '100%',
  padding: '10px 14px',
  border: '0',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.04)',
  color: 'inherit',
  cursor: 'pointer',
};

const SURFACE_WAVE_PANEL_BODY_STYLE = {
  padding: '14px',
};

const SURFACE_WAVE_PANEL_HEADER_STYLE = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  marginBottom: '12px',
};

const SURFACE_WAVE_RESET_STYLE = {
  border: '1px solid rgba(255,255,255,0.16)',
  borderRadius: '999px',
  background: 'transparent',
  color: 'inherit',
  padding: '6px 12px',
  cursor: 'pointer',
};

const SURFACE_WAVE_GRID_STYLE = {
  display: 'grid',
  gap: '10px',
};

const SURFACE_WAVE_CONTROL_STYLE = {
  display: 'grid',
  gap: '8px',
  padding: '10px 12px',
  borderRadius: '12px',
  background: 'rgba(255,255,255,0.04)',
};

const SURFACE_WAVE_CONTROL_HEAD_STYLE = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  fontSize: '13px',
};

const SURFACE_WAVE_ROW_STYLE = {
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  alignItems: 'center',
  gap: '8px',
};

const SURFACE_WAVE_INPUT_STYLE = {
  width: '100%',
};

const SURFACE_WAVE_NUMBER_STYLE = {
  width: '84px',
  padding: '6px 8px',
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(0,0,0,0.22)',
  color: 'inherit',
};

const SURFACE_WAVE_SELECT_STYLE = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(0,0,0,0.22)',
  color: 'inherit',
};

const SURFACE_WAVE_CHECKBOX_STYLE = {
  justifySelf: 'start',
};

const SURFACE_WAVE_COLOR_STYLE = {
  width: '100%',
  minHeight: '38px',
  border: '0',
  background: 'transparent',
  padding: 0,
};

function SurfaceWaveControls({ settings, onChange, onReset }) {
  const [open, setOpen] = useState(() => loadSurfaceWavePanelOpen());

  const controls = [
    ['enabled', '启用波纹', settings.enabled],
    ['speed', '流动速度', settings.speed, -6, 6, 0.01],
    ['sparse', '波纹稀疏', settings.sparse, 0, 1, 0.01],
    ['scale', '波纹尺度', settings.scale, 0.2, 5, 0.01],
    ['intensity', '扭曲强度', settings.intensity, 0, 3, 0.01],
    ['opacity', '流光浓度', settings.opacity, 0, 3, 0.01],
    ['nearBrightness', '镜头侧亮度', settings.nearBrightness, 0, 2.5, 0.01],
    ['farBrightness', '出口侧亮度', settings.farBrightness, 0, 2.5, 0.01],
    ['floorBoost', '地板强度', settings.floorBoost, 0, 4, 0.01],
    ['wallBoost', '墙面强度', settings.wallBoost, 0, 4, 0.01],
    ['ceilingBoost', '天花板强度', settings.ceilingBoost, 0, 4, 0.01],
    ['rotationX', '旋转 X', settings.rotationX, -180, 180, 0.01],
    ['rotationY', '旋转 Y', settings.rotationY, -180, 180, 0.01],
    ['rotationZ', '旋转 Z', settings.rotationZ, -180, 180, 0.01],
  ];

  const update = useCallback((key, value) => {
    onChange((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, [onChange]);

  const toggleOpen = useCallback(() => {
    setOpen((next) => {
      const value = !next;
      saveSurfaceWavePanelOpen(value);
      return value;
    });
  }, []);

  useEffect(() => {
    if (!SURFACE_WAVE_PANEL_ENTRY_ENABLED) return undefined;

    function onKeyDown(event) {
      if (event.shiftKey && event.key.toLowerCase() === 'w') {
        event.preventDefault();
        toggleOpen();
      }

      if (event.key === 'Escape') {
        setOpen((next) => {
          if (!next) return next;
          saveSurfaceWavePanelOpen(false);
          return false;
        });
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggleOpen]);

  useEffect(() => {
    if (!SURFACE_WAVE_PANEL_ENTRY_ENABLED) return;
    saveSurfaceWavePanelOpen(open);
  }, [open]);

  if (!SURFACE_WAVE_PANEL_ENTRY_ENABLED) {
    return null;
  }

  if (!open) {
    return (
      <button
        className="smoke-panel__fab smoke-panel__fab--surface-wave"
        type="button"
        onClick={toggleOpen}
        aria-label="打开表面波纹调节面板"
        title="打开表面波纹调节面板（Shift+W）"
        style={SURFACE_WAVE_FAB_STYLE}
      >
        ≋
      </button>
    );
  }

  return (
    <section className="smoke-panel surface-wave-panel" aria-label="表面波纹调节面板" style={SURFACE_WAVE_PANEL_STYLE}>
      <button className="smoke-panel__toggle" type="button" onClick={toggleOpen} style={SURFACE_WAVE_TOGGLE_STYLE}>
        收起
      </button>

      <div className="smoke-panel__body" style={SURFACE_WAVE_PANEL_BODY_STYLE}>
        <div className="smoke-panel__header" style={SURFACE_WAVE_PANEL_HEADER_STYLE}>
          <strong>表面波纹调节</strong>
          <button className="smoke-panel__reset" type="button" onClick={onReset} style={SURFACE_WAVE_RESET_STYLE}>恢复默认</button>
        </div>

        <div className="smoke-panel__grid" style={SURFACE_WAVE_GRID_STYLE}>
          <label className="smoke-control smoke-control--checkbox" style={SURFACE_WAVE_CONTROL_STYLE}>
            <span style={SURFACE_WAVE_CONTROL_HEAD_STYLE}>
              启用波纹
              <output>{formatWaveControlValue('enabled', settings.enabled)}</output>
            </span>
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(event) => update('enabled', event.target.checked)}
              style={SURFACE_WAVE_CHECKBOX_STYLE}
            />
          </label>

          <label className="smoke-control" style={SURFACE_WAVE_CONTROL_STYLE}>
            <span style={SURFACE_WAVE_CONTROL_HEAD_STYLE}>
              颜色模式
              <output>{formatWaveControlValue('mode', settings.mode)}</output>
            </span>
            <select value={settings.mode} onChange={(event) => update('mode', event.target.value)} style={SURFACE_WAVE_SELECT_STYLE}>
              <option value="mono">单色</option>
              <option value="gradient">自定义渐变（强）</option>
            </select>
          </label>

          {controls.slice(1).map(([key, label, value, min, max, step]) => (
            <label key={key} className="smoke-control" style={SURFACE_WAVE_CONTROL_STYLE}>
              <span style={SURFACE_WAVE_CONTROL_HEAD_STYLE}>
                {label}
                <output>{formatWaveControlValue(key, value)}</output>
              </span>
              <div className="steam-lab-control__row" style={SURFACE_WAVE_ROW_STYLE}>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={value}
                  onChange={(event) => update(key, Number(event.target.value))}
                  style={SURFACE_WAVE_INPUT_STYLE}
                />
                {key.startsWith('rotation') && (
                  <input
                    className="steam-lab-control__number"
                    type="number"
                    min={min}
                    max={max}
                    step="0.01"
                    value={Number(value).toFixed(2)}
                    onChange={(event) => update(key, Number(event.target.value))}
                    style={SURFACE_WAVE_NUMBER_STYLE}
                  />
                )}
              </div>
            </label>
          ))}

          <label className="smoke-control smoke-control--color" style={SURFACE_WAVE_CONTROL_STYLE}>
            <span style={SURFACE_WAVE_CONTROL_HEAD_STYLE}>波纹颜色<output>{settings.singleColor}</output></span>
            <input
              type="color"
              value={settings.singleColor}
              onChange={(event) => update('singleColor', event.target.value)}
              style={SURFACE_WAVE_COLOR_STYLE}
            />
          </label>

          <label className="smoke-control smoke-control--color" style={SURFACE_WAVE_CONTROL_STYLE}>
            <span style={SURFACE_WAVE_CONTROL_HEAD_STYLE}>渐变起点<output>{settings.gradientStart}</output></span>
            <input
              type="color"
              value={settings.gradientStart}
              onChange={(event) => update('gradientStart', event.target.value)}
              style={SURFACE_WAVE_COLOR_STYLE}
            />
          </label>

          <label className="smoke-control smoke-control--color" style={SURFACE_WAVE_CONTROL_STYLE}>
            <span style={SURFACE_WAVE_CONTROL_HEAD_STYLE}>渐变终点<output>{settings.gradientEnd}</output></span>
            <input
              type="color"
              value={settings.gradientEnd}
              onChange={(event) => update('gradientEnd', event.target.value)}
              style={SURFACE_WAVE_COLOR_STYLE}
            />
          </label>
        </div>
      </div>
    </section>
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

  // 走廊灯设置
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

function FocusedProjectLight({ project, config }) {
  const lightRef = useRef(null);
  const targetRef = useRef(null);

  useEffect(() => {
    if (!lightRef.current || !targetRef.current) return;
    lightRef.current.target = targetRef.current;
    lightRef.current.target.updateMatrixWorld();
  }, []);

  useFrame(() => {
    if (!project || !lightRef.current || !targetRef.current) return;

    const [frameX, frameY, frameZ] = project.position;

    lightRef.current.position.set(
      frameX + config.offsetX,
      frameY + config.offsetY,
      frameZ + config.offsetZ,
    );
    targetRef.current.position.set(
      frameX + config.targetOffsetX,
      frameY + config.targetOffsetY,
      frameZ + config.targetOffsetZ,
    );
    lightRef.current.target.updateMatrixWorld();
  });

  if (!project) {
    return null;
  }

  return (
    <>
      <spotLight
        ref={lightRef}
        castShadow={config.castShadow}
        color={config.color}
        intensity={config.intensity}
        angle={config.angle}
        penumbra={config.penumbra}
        decay={config.decay}
        distance={config.distance}
        shadow-mapSize-width={config.shadowMapWidth ?? 1024}
        shadow-mapSize-height={config.shadowMapHeight ?? 1024}
        shadow-bias={config.shadowBias ?? -0.00012}
        shadow-normalBias={config.shadowNormalBias ?? 0.02}
        shadow-camera-near={config.shadowNear ?? 0.5}
        shadow-camera-far={config.shadowFar ?? 18}
      />
      <object3D ref={targetRef} />
    </>
  );
}

function FocusedFrameLight({ project }) {
  const side = project?.side ?? 1;
  const isLeftSlot = side < 0;
  const keyLightConfig = useMemo(() => {
    if (isLeftSlot) {
      return {
        color: FOCUSED_FRAME_LIGHT_COLOR,
        intensity: FOCUSED_FRAME_LIGHT_INTENSITY,
        angle: FOCUSED_FRAME_LIGHT_ANGLE,
        distance: FOCUSED_FRAME_LIGHT_DISTANCE,
        offsetX: FOCUSED_LEFT_FRAME_LIGHT_OFFSET_X,
        offsetY: FOCUSED_FRAME_LIGHT_OFFSET_Y,
        offsetZ: FOCUSED_FRAME_LIGHT_OFFSET_Z,
        targetOffsetX: FOCUSED_LEFT_FRAME_LIGHT_TARGET_OFFSET_X,
        targetOffsetY: FOCUSED_FRAME_LIGHT_TARGET_OFFSET_Y,
        targetOffsetZ: FOCUSED_FRAME_LIGHT_TARGET_OFFSET_Z,
        penumbra: FOCUSED_FRAME_LIGHT_PENUMBRA,
        decay: FOCUSED_FRAME_LIGHT_DECAY,
        castShadow: true,
        shadowMapWidth: FOCUSED_FRAME_LIGHT_SHADOW_MAP_WIDTH,
        shadowMapHeight: FOCUSED_FRAME_LIGHT_SHADOW_MAP_HEIGHT,
        shadowBias: FOCUSED_FRAME_LIGHT_SHADOW_BIAS,
        shadowNormalBias: FOCUSED_FRAME_LIGHT_SHADOW_NORMAL_BIAS,
        shadowNear: FOCUSED_FRAME_LIGHT_SHADOW_NEAR,
        shadowFar: FOCUSED_FRAME_LIGHT_SHADOW_FAR,
      };
    }

    return {
      color: FOCUSED_FRAME_LIGHT_COLOR,
      intensity: FOCUSED_FRAME_LIGHT_INTENSITY,
      angle: FOCUSED_FRAME_LIGHT_ANGLE,
      distance: FOCUSED_FRAME_LIGHT_DISTANCE,
      offsetX: FOCUSED_RIGHT_FRAME_LIGHT_OFFSET_X,
      offsetY: FOCUSED_FRAME_LIGHT_OFFSET_Y,
      offsetZ: FOCUSED_FRAME_LIGHT_OFFSET_Z,
      targetOffsetX: FOCUSED_RIGHT_FRAME_LIGHT_TARGET_OFFSET_X,
      targetOffsetY: FOCUSED_FRAME_LIGHT_TARGET_OFFSET_Y,
      targetOffsetZ: FOCUSED_FRAME_LIGHT_TARGET_OFFSET_Z,
      penumbra: FOCUSED_FRAME_LIGHT_PENUMBRA,
      decay: FOCUSED_FRAME_LIGHT_DECAY,
      castShadow: true,
      shadowMapWidth: FOCUSED_FRAME_LIGHT_SHADOW_MAP_WIDTH,
      shadowMapHeight: FOCUSED_FRAME_LIGHT_SHADOW_MAP_HEIGHT,
      shadowBias: FOCUSED_FRAME_LIGHT_SHADOW_BIAS,
      shadowNormalBias: FOCUSED_FRAME_LIGHT_SHADOW_NORMAL_BIAS,
      shadowNear: FOCUSED_FRAME_LIGHT_SHADOW_NEAR,
      shadowFar: FOCUSED_FRAME_LIGHT_SHADOW_FAR,
    };
  }, [isLeftSlot]);

  const rimLightConfig = useMemo(() => ({
    color: FOCUSED_FRAME_RIM_LIGHT_COLOR,
    intensity: FOCUSED_FRAME_RIM_LIGHT_INTENSITY,
    angle: FOCUSED_FRAME_RIM_LIGHT_ANGLE,
    distance: FOCUSED_FRAME_RIM_LIGHT_DISTANCE,
    offsetX: isLeftSlot ? FOCUSED_LEFT_FRAME_RIM_LIGHT_OFFSET_X : FOCUSED_RIGHT_FRAME_RIM_LIGHT_OFFSET_X,
    offsetY: FOCUSED_FRAME_RIM_LIGHT_OFFSET_Y,
    offsetZ: FOCUSED_FRAME_RIM_LIGHT_OFFSET_Z,
    targetOffsetX: isLeftSlot ? FOCUSED_LEFT_FRAME_RIM_LIGHT_TARGET_OFFSET_X : FOCUSED_RIGHT_FRAME_RIM_LIGHT_TARGET_OFFSET_X,
    targetOffsetY: FOCUSED_FRAME_RIM_LIGHT_TARGET_OFFSET_Y,
    targetOffsetZ: FOCUSED_FRAME_RIM_LIGHT_TARGET_OFFSET_Z,
    penumbra: FOCUSED_FRAME_RIM_LIGHT_PENUMBRA,
    decay: FOCUSED_FRAME_RIM_LIGHT_DECAY,
    castShadow: false,
  }), [isLeftSlot]);

  const topFillLightConfig = useMemo(() => ({
    color: FOCUSED_FRAME_TOP_FILL_LIGHT_COLOR,
    intensity: FOCUSED_FRAME_TOP_FILL_LIGHT_INTENSITY,
    angle: FOCUSED_FRAME_TOP_FILL_LIGHT_ANGLE,
    distance: FOCUSED_FRAME_TOP_FILL_LIGHT_DISTANCE,
    offsetX: FOCUSED_FRAME_TOP_FILL_LIGHT_OFFSET_X,
    offsetY: FOCUSED_FRAME_TOP_FILL_LIGHT_OFFSET_Y,
    offsetZ: FOCUSED_FRAME_TOP_FILL_LIGHT_OFFSET_Z,
    targetOffsetX: FOCUSED_FRAME_TOP_FILL_LIGHT_TARGET_OFFSET_X,
    targetOffsetY: FOCUSED_FRAME_TOP_FILL_LIGHT_TARGET_OFFSET_Y,
    targetOffsetZ: FOCUSED_FRAME_TOP_FILL_LIGHT_TARGET_OFFSET_Z,
    penumbra: FOCUSED_FRAME_TOP_FILL_LIGHT_PENUMBRA,
    decay: FOCUSED_FRAME_TOP_FILL_LIGHT_DECAY,
    castShadow: false,
  }), []);

  const backRimLightConfig = useMemo(() => ({
    color: FOCUSED_FRAME_BACK_RIM_LIGHT_COLOR,
    intensity: FOCUSED_FRAME_BACK_RIM_LIGHT_INTENSITY,
    angle: FOCUSED_FRAME_BACK_RIM_LIGHT_ANGLE,
    distance: FOCUSED_FRAME_BACK_RIM_LIGHT_DISTANCE,
    offsetX: isLeftSlot ? FOCUSED_LEFT_FRAME_BACK_RIM_LIGHT_OFFSET_X : FOCUSED_RIGHT_FRAME_BACK_RIM_LIGHT_OFFSET_X,
    offsetY: FOCUSED_FRAME_BACK_RIM_LIGHT_OFFSET_Y,
    offsetZ: FOCUSED_FRAME_BACK_RIM_LIGHT_OFFSET_Z,
    targetOffsetX: isLeftSlot ? FOCUSED_LEFT_FRAME_BACK_RIM_LIGHT_TARGET_OFFSET_X : FOCUSED_RIGHT_FRAME_BACK_RIM_LIGHT_TARGET_OFFSET_X,
    targetOffsetY: FOCUSED_FRAME_BACK_RIM_LIGHT_TARGET_OFFSET_Y,
    targetOffsetZ: FOCUSED_FRAME_BACK_RIM_LIGHT_TARGET_OFFSET_Z,
    penumbra: FOCUSED_FRAME_BACK_RIM_LIGHT_PENUMBRA,
    decay: FOCUSED_FRAME_BACK_RIM_LIGHT_DECAY,
    castShadow: false,
  }), [isLeftSlot]);

  if (!project) {
    return null;
  }

  const lightDebug = project.focusedLightDebug ?? FOCUSED_LIGHT_DEBUG_DEFAULTS;

  return (
    <>
      {lightDebug.key ? <FocusedProjectLight project={project} config={keyLightConfig} /> : null}
      {lightDebug.rim ? <FocusedProjectLight project={project} config={rimLightConfig} /> : null}
      {lightDebug.topFill ? <FocusedProjectLight project={project} config={topFillLightConfig} /> : null}
      {lightDebug.backRim ? <FocusedProjectLight project={project} config={backRimLightConfig} /> : null}
    </>
  );
}

function FrameTransparencyRimLight({ viewportWidth }) {
  const anchorLayout = useMemo(
    () => buildFrameLayouts(viewportWidth).find((layout) => layout.index === 0) ?? null,
    [viewportWidth],
  );
  const lightRef = useRef(null);
  const targetRef = useRef(null);

  useEffect(() => {
    if (!lightRef.current || !targetRef.current) return;
    lightRef.current.target = targetRef.current;
    lightRef.current.target.updateMatrixWorld();
  }, []);

  useFrame((state) => {
    if (!anchorLayout || !lightRef.current || !targetRef.current) return;
    const slotZ = state.camera.position.z + anchorLayout.z;
    lightRef.current.position.set(
      anchorLayout.x + FRAME_TRANSPARENCY_RIM_LIGHT_OFFSET_X,
      anchorLayout.y + FRAME_TRANSPARENCY_RIM_LIGHT_OFFSET_Y,
      slotZ + FRAME_TRANSPARENCY_RIM_LIGHT_OFFSET_Z,
    );
    targetRef.current.position.set(
      anchorLayout.x + FRAME_TRANSPARENCY_RIM_LIGHT_TARGET_OFFSET_X,
      anchorLayout.y + FRAME_TRANSPARENCY_RIM_LIGHT_TARGET_OFFSET_Y,
      slotZ + FRAME_TRANSPARENCY_RIM_LIGHT_TARGET_OFFSET_Z,
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
        castShadow={false}
        color="#f7fbff"
        intensity={FRAME_TRANSPARENCY_RIM_LIGHT_INTENSITY}
        angle={FRAME_TRANSPARENCY_RIM_LIGHT_ANGLE}
        penumbra={0.92}
        decay={1.05}
        distance={FRAME_TRANSPARENCY_RIM_LIGHT_DISTANCE}
      />
      <object3D ref={targetRef} />
    </>
  );
}

function FrameTransparencyTopFillLight({ viewportWidth }) {
  const anchorLayout = useMemo(
    () => buildFrameLayouts(viewportWidth).find((layout) => layout.index === 1) ?? null,
    [viewportWidth],
  );
  const lightRef = useRef(null);
  const targetRef = useRef(null);

  useEffect(() => {
    if (!lightRef.current || !targetRef.current) return;
    lightRef.current.target = targetRef.current;
    lightRef.current.target.updateMatrixWorld();
  }, []);

  useFrame((state) => {
    if (!anchorLayout || !lightRef.current || !targetRef.current) return;
    const slotZ = state.camera.position.z + anchorLayout.z;
    lightRef.current.position.set(
      anchorLayout.x + FRAME_TRANSPARENCY_TOP_FILL_OFFSET_X,
      anchorLayout.y + FRAME_TRANSPARENCY_TOP_FILL_OFFSET_Y,
      slotZ + FRAME_TRANSPARENCY_TOP_FILL_OFFSET_Z,
    );
    targetRef.current.position.set(
      anchorLayout.x + FRAME_TRANSPARENCY_TOP_FILL_TARGET_OFFSET_X,
      anchorLayout.y + FRAME_TRANSPARENCY_TOP_FILL_TARGET_OFFSET_Y,
      slotZ + FRAME_TRANSPARENCY_TOP_FILL_TARGET_OFFSET_Z,
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
        castShadow={false}
        color="#edf6ff"
        intensity={FRAME_TRANSPARENCY_TOP_FILL_INTENSITY}
        angle={FRAME_TRANSPARENCY_TOP_FILL_ANGLE}
        penumbra={1}
        decay={1.08}
        distance={FRAME_TRANSPARENCY_TOP_FILL_DISTANCE}
      />
      <object3D ref={targetRef} />
    </>
  );
}

function FrameTransparencyBackRimLight({ viewportWidth }) {
  const anchorLayout = useMemo(
    () => buildFrameLayouts(viewportWidth).find((layout) => layout.index === 0) ?? null,
    [viewportWidth],
  );
  const lightRef = useRef(null);
  const targetRef = useRef(null);

  useEffect(() => {
    if (!lightRef.current || !targetRef.current) return;
    lightRef.current.target = targetRef.current;
    lightRef.current.target.updateMatrixWorld();
  }, []);

  useFrame((state) => {
    if (!anchorLayout || !lightRef.current || !targetRef.current) return;
    const slotZ = state.camera.position.z + anchorLayout.z;
    lightRef.current.position.set(
      anchorLayout.x + FRAME_TRANSPARENCY_BACK_RIM_OFFSET_X,
      anchorLayout.y + FRAME_TRANSPARENCY_BACK_RIM_OFFSET_Y,
      slotZ + FRAME_TRANSPARENCY_BACK_RIM_OFFSET_Z,
    );
    targetRef.current.position.set(
      anchorLayout.x + FRAME_TRANSPARENCY_BACK_RIM_TARGET_OFFSET_X,
      anchorLayout.y + FRAME_TRANSPARENCY_BACK_RIM_TARGET_OFFSET_Y,
      slotZ + FRAME_TRANSPARENCY_BACK_RIM_TARGET_OFFSET_Z,
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
        castShadow={false}
        color="#ffffff"
        intensity={FRAME_TRANSPARENCY_BACK_RIM_INTENSITY}
        angle={FRAME_TRANSPARENCY_BACK_RIM_ANGLE}
        penumbra={0.98}
        decay={1.1}
        distance={FRAME_TRANSPARENCY_BACK_RIM_DISTANCE}
      />
      <object3D ref={targetRef} />
    </>
  );
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

function CorridorScene({
  targetZ,
  targetZRef,
  activeCycle,
  loopProgress,
  focusedProject,
  displayedProject,
  onFocusProject,
  onEnterProject,
  viewportWidth,
  isCoarsePointer,
  smokeSettings,
  waveSettings,
  focusedLightDebug,
  onFocusedProjectScreenPositionChange,
}) {
  const focusCameraVectorRef = useRef(new THREE.Vector3());
  const focusLookAtVectorRef = useRef(new THREE.Vector3());
  const focusedProjectScreenVectorRef = useRef(new THREE.Vector3());
  const focusViewOffsetRef = useRef(null);
  const cameraFovRef = useRef(getRoamingCameraFov(viewportWidth));
  const frames = useMemo(
    () => createGalleryFrames(activeCycle, targetZ, loopProgress, viewportWidth),
    [activeCycle, targetZ, loopProgress, viewportWidth],
  );
  const shiftedFocusedProject = useMemo(() => {
    if (!focusedProject) {
      return null;
    }

    return {
      ...applyFocusedProjectWallOffset(focusedProject, viewportWidth),
      focusedLightDebug,
    };
  }, [focusedLightDebug, focusedProject, viewportWidth]);
  const visibleFrames = shiftedFocusedProject ? [shiftedFocusedProject] : frames;
  const effectiveWaveSettings = useMemo(() => {
    if (!focusedProject) {
      return waveSettings;
    }

    return {
      ...waveSettings,
      opacity: waveSettings.opacity * FOCUSED_SURFACE_WAVE_OPACITY_MULTIPLIER,
      intensity: waveSettings.intensity * FOCUSED_SURFACE_WAVE_INTENSITY_MULTIPLIER,
      wallBoost: waveSettings.wallBoost * FOCUSED_SURFACE_WAVE_WALL_BOOST_MULTIPLIER,
      floorBoost: waveSettings.floorBoost * FOCUSED_SURFACE_WAVE_FLOOR_BOOST_MULTIPLIER,
      ceilingBoost: waveSettings.ceilingBoost * FOCUSED_SURFACE_WAVE_CEILING_BOOST_MULTIPLIER,
    };
  }, [focusedProject, waveSettings]);

  useFrame((state) => {
    const camera = state.camera;

    if (shiftedFocusedProject) {
      const desktopFocusViewOffsetX = getDesktopFocusViewOffsetX(viewportWidth);
      const mobileFocusViewOffsetY = getMobileFocusViewOffsetY(viewportWidth);
      const focusViewOffsetX = desktopFocusViewOffsetX;
      const focusViewOffsetY = mobileFocusViewOffsetY;
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
      const focusZOffset = shiftedFocusedProject.side < 0 ? focusZOffsetMagnitude : -focusZOffsetMagnitude;
      const focusScreenShiftX = getFocusScreenShiftX(viewportWidth);
      const focusScreenShiftY = getFocusScreenShiftY(viewportWidth);
      focusCameraVectorRef.current.set(
        shiftedFocusedProject.cameraX,
        shiftedFocusedProject.cameraY + focusScreenShiftY,
        shiftedFocusedProject.cameraZ + focusZOffset,
      );
      focusLookAtVectorRef.current.set(
        shiftedFocusedProject.lookAtX + shiftedFocusedProject.side * focusScreenShiftX,
        shiftedFocusedProject.lookAtY + focusScreenShiftY,
        shiftedFocusedProject.lookAtZ,
      );
      camera.position.lerp(focusCameraVectorRef.current, 0.12);
      camera.lookAt(focusLookAtVectorRef.current);

      if (onFocusedProjectScreenPositionChange) {
        focusedProjectScreenVectorRef.current
          .set(...shiftedFocusedProject.position)
          .project(camera);

        onFocusedProjectScreenPositionChange({
          x: clamp((focusedProjectScreenVectorRef.current.x * 0.5 + 0.5) * state.size.width, 0, state.size.width),
          y: clamp((-focusedProjectScreenVectorRef.current.y * 0.5 + 0.5) * state.size.height, 0, state.size.height),
        });
      }

      return;
    }

    onFocusedProjectScreenPositionChange?.(null);

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
      <ambientLight intensity={0.88} />
      <directionalLight position={[0, 5.8, -26]} intensity={0.62} color="#fff3e8" />
      <CorridorGeometry viewportWidth={viewportWidth} isCoarsePointer={isCoarsePointer} waveSettings={effectiveWaveSettings} />
      <GroundSteam settings={smokeSettings} activeCycle={activeCycle} />
      <ExitVisualGlow />
      <ExitFrameLight />
      {shiftedFocusedProject ? (
        <FocusedFrameLight project={shiftedFocusedProject} />
      ) : (
        <>
          <LeftPrimaryFrameLight viewportWidth={viewportWidth} />
          <RightPrimaryFrameLight viewportWidth={viewportWidth} />
          <LeftFillSlotLight viewportWidth={viewportWidth} />
          <RightFillSlotLight viewportWidth={viewportWidth} />
          <FrameTransparencyRimLight viewportWidth={viewportWidth} />
          <FrameTransparencyTopFillLight viewportWidth={viewportWidth} />
          <FrameTransparencyBackRimLight viewportWidth={viewportWidth} />
        </>
      )}
      {visibleFrames.map((project) => (
        <FramePortal
          key={project.frameKey}
          project={project}
          isFocused={displayedProject?.frameKey === project.frameKey}
          onFocusProject={onFocusProject}
          onEnterProject={onEnterProject}
        />
      ))}
    </>
  );
}

export default function DreamCorridor({ initialState, smokePreset, onConsumeSmokePreset, onEnterProject, onWakeUp }) {
  const initialTargetZ = initialState?.targetZ ?? 0;
  const [targetZ, setTargetZ] = useState(initialTargetZ);
  const [focusTargetProject, setFocusTargetProject] = useState(initialState?.focusedProject ?? null);
  const [focusedProject, setFocusedProject] = useState(initialState?.focusedProject ?? null);
  const [pawActive, setPawActive] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);
  const [smokeSettings, setSmokeSettings] = useState(() => loadGroundSmokeSettings());
  const [waveSettings, setWaveSettings] = useState(() => loadSurfaceWaveSettings());
  const [focusedLightDebug, setFocusedLightDebug] = useState(FOCUSED_LIGHT_DEBUG_DEFAULTS);
  const pawTimerRef = useRef(null);
  const focusCopyRevealTimerRef = useRef(null);
  const lastScrollTimeRef = useRef(0);
  const smoothedVelocityRef = useRef(0);
  const pawHoldMsRef = useRef(520);
  const corridorRef = useRef(null);
  const wheelFrameRef = useRef(0);
  const returnToRoamFrameRef = useRef(0);
  const focusedProjectScreenOriginRef = useRef(null);
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

  const handleSmokeSettingsChange = useCallback((updater) => {
    setSmokeSettings((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      return next;
    });
  }, []);

  const resetSmokeSettings = useCallback(() => {
    const next = normalizeGroundSmokeSettings(GROUND_SMOKE_DEFAULTS);
    setSmokeSettings(next);

    if (typeof window !== 'undefined') {
      saveGroundSmokeSettings(next);
      window.dispatchEvent(new CustomEvent('dogdream:corridor-smoke-settings-updated', { detail: next }));
    }

    onConsumeSmokePreset?.();
  }, [onConsumeSmokePreset]);

  const handleWaveSettingsChange = useCallback((updater) => {
    setWaveSettings((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      return next;
    });
  }, []);

  const resetWaveSettings = useCallback(() => {
    const next = normalizeSurfaceWaveSettings(SURFACE_WAVE_DEFAULTS);
    setWaveSettings(next);

    if (typeof window !== 'undefined') {
      saveSurfaceWaveSettings(next);
      window.dispatchEvent(new CustomEvent('dogdream:corridor-surface-wave-settings-updated', { detail: next }));
    }
  }, []);

  useEffect(() => {
    saveGroundSmokeSettings(smokeSettings);
  }, [smokeSettings]);

  useEffect(() => {
    saveSurfaceWaveSettings(waveSettings);
  }, [waveSettings]);

  useEffect(() => {
    if (!smokePreset) return;
    const next = normalizeGroundSmokeSettings(smokePreset);
    setSmokeSettings(next);

    if (typeof window !== 'undefined') {
      saveGroundSmokeSettings(next);
      window.dispatchEvent(new CustomEvent('dogdream:corridor-smoke-settings-updated', { detail: next }));
    }

    onConsumeSmokePreset?.();
  }, [onConsumeSmokePreset, smokePreset]);

  useEffect(() => {
    if (smokePreset) return;
    setSmokeSettings(loadGroundSmokeSettings());
  }, [smokePreset]);

  useEffect(() => {
    function syncSmokeSettings(event) {
      if (event?.type === 'storage' && event.key && event.key !== GROUND_SMOKE_STORAGE_KEY) {
        return;
      }

      setSmokeSettings(loadGroundSmokeSettings());
    }

    window.addEventListener('storage', syncSmokeSettings);
    window.addEventListener('dogdream:corridor-smoke-settings-updated', syncSmokeSettings);

    return () => {
      window.removeEventListener('storage', syncSmokeSettings);
      window.removeEventListener('dogdream:corridor-smoke-settings-updated', syncSmokeSettings);
    };
  }, []);

  useEffect(() => {
    function syncWaveSettings(event) {
      if (event?.type === 'storage' && event.key && event.key !== SURFACE_WAVE_STORAGE_KEY) {
        return;
      }

      setWaveSettings(loadSurfaceWaveSettings());
    }

    window.addEventListener('storage', syncWaveSettings);
    window.addEventListener('dogdream:corridor-surface-wave-settings-updated', syncWaveSettings);

    return () => {
      window.removeEventListener('storage', syncWaveSettings);
      window.removeEventListener('dogdream:corridor-surface-wave-settings-updated', syncWaveSettings);
    };
  }, []);

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
    window.clearTimeout(focusCopyRevealTimerRef.current);
    window.cancelAnimationFrame(wheelFrameRef.current);
    window.cancelAnimationFrame(returnToRoamFrameRef.current);
  }, []);

  useEffect(() => {
    preloadFocusCardBackground();
  }, []);

  useEffect(() => {
    window.clearTimeout(focusCopyRevealTimerRef.current);

    if (!focusTargetProject) {
      setFocusedProject(null);
      return undefined;
    }

    // 卡片改为点击后几乎立刻出现，不再等待镜头接近目标点。
    focusCopyRevealTimerRef.current = window.setTimeout(() => {
      setFocusedProject(focusTargetProject);
    }, FOCUS_COPY_REVEAL_DELAY_MS);

    return () => window.clearTimeout(focusCopyRevealTimerRef.current);
  }, [focusTargetProject]);

  useEffect(() => {
    if (!initialState?.resumeFromProject || !initialState?.focusedProject) {
      return undefined;
    }

    returnToRoamFrameRef.current = window.requestAnimationFrame(() => {
      setFocusTargetProject(null);
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

  useEffect(() => {
    function handleFocusedLightDebugKeydown(event) {
      if ((!focusTargetProject && !focusedProject) || event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      const keyMap = {
        '1': 'key',
        '2': 'rim',
        '3': 'topFill',
        '4': 'backRim',
      };
      const targetKey = keyMap[event.key];

      if (!targetKey) {
        return;
      }

      event.preventDefault();
      setFocusedLightDebug((prev) => ({
        ...prev,
        [targetKey]: !prev[targetKey],
      }));
    }

    window.addEventListener('keydown', handleFocusedLightDebugKeydown);
    return () => window.removeEventListener('keydown', handleFocusedLightDebugKeydown);
  }, [focusTargetProject, focusedProject]);

  useEffect(() => {
    if (focusTargetProject || focusedProject) {
      return;
    }

    setFocusedLightDebug(FOCUSED_LIGHT_DEBUG_DEFAULTS);
  }, [focusTargetProject, focusedProject]);

  const extendPawVisibility = useCallback(() => {
    setPawActive(true);
    window.clearTimeout(pawTimerRef.current);
    pawTimerRef.current = window.setTimeout(() => setPawActive(false), pawHoldMsRef.current);
  }, []);

  const applyScrollDelta = useCallback((rawDelta, inputType = 'wheel') => {
    if (focusTargetProject) return;

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
  }, [focusTargetProject, scheduleMotionFlush]);

  function handleWheel(event) {
    applyScrollDelta(event.deltaY, 'wheel');
  }

  function handleTouchStart(event) {
    if (focusTargetProject || event.touches.length !== 1) return;
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
    if (!touchState.active || focusTargetProject || event.touches.length !== 1) return;

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
    if (!project) return;

    setFocusTargetProject(project);
  }

  const handleFocusedProjectScreenPositionChange = useCallback((position) => {
    focusedProjectScreenOriginRef.current = position;
  }, []);

  const handleEnterDeepDream = useCallback(() => {
    if (!focusedProject) return;

    onEnterProject(focusedProject.id, {
      targetZ: targetZRef.current,
      focusedProject,
    }, focusedProjectScreenOriginRef.current);
  }, [focusedProject, onEnterProject]);

  const handleEnterFocusedPosterProject = useCallback((project) => {
    if (!project) return;

    onEnterProject(project.id, {
      targetZ: targetZRef.current,
      focusedProject: project,
    }, focusedProjectScreenOriginRef.current);
  }, [onEnterProject]);

  const handleReturnToCorridor = useCallback(() => {
    setFocusTargetProject(null);
    setFocusedProject(null);
  }, []);

  return (
    <main
      ref={corridorRef}
      className={[
        'corridor',
        'page-shell',
        focusTargetProject ? 'is-focused' : '',
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
        <color attach="background" args={[EXIT_VISUAL.background]} />
        <fog attach="fog" args={[EXIT_VISUAL.fog.color, EXIT_VISUAL.fog.near, EXIT_VISUAL.fog.far]} />
        <Suspense fallback={null}>
          <CorridorScene
            targetZ={targetZ}
            targetZRef={targetZRef}
            activeCycle={activeCycle}
            loopProgress={loopProgress}
            focusedProject={focusTargetProject}
            displayedProject={focusedProject}
            onFocusProject={handleFocusProject}
            onEnterProject={handleEnterFocusedPosterProject}
            viewportWidth={viewportWidth}
            isCoarsePointer={isCoarsePointer}
            smokeSettings={smokeSettings}
            waveSettings={waveSettings}
            focusedLightDebug={focusedLightDebug}
            onFocusedProjectScreenPositionChange={handleFocusedProjectScreenPositionChange}
          />
        </Suspense>
      </Canvas>

      <GroundSmokeControls
        settings={smokeSettings}
        onChange={handleSmokeSettingsChange}
        onReset={resetSmokeSettings}
      />

      <SurfaceWaveControls
        settings={waveSettings}
        onChange={handleWaveSettingsChange}
        onReset={resetWaveSettings}
      />

      <div className="corridor-status">
        <span>DREAM CORRIDOR</span>
        <span>{Math.round(loopProgress * 100)}%</span>
      </div>

      {focusedProject && (
        <aside className="focus-copy" aria-label="项目简介">
          <div className="focus-copy__panel">
            <div className="focus-copy__body">
              <h2>{focusedProject.title}</h2>
              <div className="focus-copy__summary">
                {typeof focusedProject.summary === 'string'
                  ? focusedProject.summary.split('\n').filter(Boolean).map((line) => (
                    <p key={line} className="focus-copy__summary-line">{line}</p>
                  ))
                  : null}
              </div>
            </div>

            <div className="focus-actions">
              <button className="focus-action focus-action--primary" type="button" onClick={handleEnterDeepDream}>
                <span className="focus-action__icon focus-action__icon--enter" aria-hidden="true" />
                <span className="focus-action__label">进入深梦</span>
              </button>

              <button className="focus-action focus-action--secondary" type="button" onClick={handleReturnToCorridor}>
                <span className="focus-action__icon focus-action__icon--return" aria-hidden="true" />
                <span className="focus-action__label">返回走廊</span>
              </button>
            </div>
          </div>
        </aside>
      )}

      <button className="site-button wake-button" type="button" onClick={onWakeUp}>醒来</button>
    </main>
  );
}
