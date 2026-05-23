import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

const FLOAT_AMPLITUDE = 0.14;
const FLOAT_SPEED = 0.6;
const FLOAT_PHASE_OFFSET = 1.5;

// 画框边框基础颜色：这里先定成比参考图更浅一点的浅蓝琉璃底色。
const FRAME_BORDER_COLOR = '#0010a1';
// 画框边框内发光颜色：只负责轻轻把琉璃边缘托亮，避免发灰。
const FRAME_BORDER_EMISSIVE_COLOR = '#fbff00';
// 画框边框的正面宽度：越大边框越厚，越像实体切割玻璃。
const BORDER_THICKNESS = 0.1;
// 画框整体前后厚度：决定侧面能露出多少“琉璃厚度”。
const FRAME_DEPTH = 0.1;
// 是否给画框边缘加倒角：打开后会更像切面玻璃，而不是生硬直角。
const FRAME_BEVEL_ENABLED = true;
// 倒角向厚度方向吃进去多少：越大切面越明显。
const FRAME_BEVEL_THICKNESS = -0.018;
// 倒角在正面边缘向内缩多少：越大越像被切过的水晶边。
const FRAME_BEVEL_SIZE = 0.018;
// 倒角偏移：通常保持 0，避免切面位置怪异。
const FRAME_BEVEL_OFFSET = 0;
// 倒角细分：越高切面越圆润，但成本也更高。
const FRAME_BEVEL_SEGMENTS = 2;
// 挤出步数：这里只保留 1，避免无意义增加面数。
const FRAME_EXTRUDE_STEPS = 1;

// 琉璃边框透明度：越低越通透；这里保留一点实体感，不做完全透明。
const FRAME_GLASS_OPACITY = 0.15;
// 琉璃边框粗糙度：越低越亮越锐；这里保持清透高光，但不做镜面金属。
const FRAME_GLASS_ROUGHNESS = 0.1;
// 金属度：玻璃通常不靠这个出效果，所以只留极低值稳定高光。
const FRAME_GLASS_METALNESS = 5;
// 透射强度：越大越像玻璃/水晶，越小越像塑料。
const FRAME_GLASS_TRANSMISSION = 0.94;
// 材质厚度感：影响透射后的“实体琉璃”观感，不等于几何厚度。
const FRAME_GLASS_THICKNESS = 0.4;
// 折射率：越高越像玻璃晶体；太高会显得过于硬和花。
const FRAME_GLASS_IOR = 1.22;
// 反射强度：决定高光是否足够“玻璃化”。
const FRAME_GLASS_REFLECTIVITY =0.85;
// 环境反射强度：没有 HDR 环境时，也让边框保留一点晶亮感。
const FRAME_GLASS_ENV_MAP_INTENSITY = 1.15;
// 清漆层强度：把外层高光再提起来，更接近光滑玻璃表皮。
const FRAME_GLASS_CLEARCOAT = 1;
// 清漆层粗糙度：越低高光越干净，太低会过分刺眼。
const FRAME_GLASS_CLEARCOAT_ROUGHNESS = 12;
// 高光强度：补足琉璃切边的亮点感。
const FRAME_GLASS_SPECULAR_INTENSITY = 1;
// 高光颜色：保持接近白色，避免偏色太重。
const FRAME_GLASS_SPECULAR_COLOR = '#f8fddc';
// 透射衰减颜色：让厚边位置透出非常轻的浅蓝层次。
const FRAME_GLASS_ATTENUATION_COLOR = '#e9f7ff';
// 透射衰减距离：越小厚边颜色越明显；这里做很轻的浅蓝晶体感。
const FRAME_GLASS_ATTENUATION_DISTANCE = 1.6;
// 轻微珠光强度：只加一点点，避免过度彩虹化。
const FRAME_GLASS_IRIDESCENCE = 0.08;
// 珠光折射率：维持很弱的琉璃彩边。
const FRAME_GLASS_IRIDESCENCE_IOR = 1.18;
// 珠光厚度范围：控制微弱彩边出现在哪个厚度区间。
const FRAME_GLASS_IRIDESCENCE_THICKNESS_RANGE = [80, 220];
// 边框自发光强度：只是轻轻提亮，不做发光画框。
const FRAME_BORDER_EMISSIVE_INTENSITY = 0.08;
// 内框离外框内缘的退让距离：越小越紧凑，越大越像在里面再独立套了一圈。
const INNER_FRAME_INSET_FROM_OUTER_EDGE = 0.001;
// 内框可见宽度：决定“第二圈框”本身有多厚。
const INNER_FRAME_THICKNESS = 0.001;
// 内框前后厚度：略薄于外框，避免层次太笨重。
const INNER_FRAME_DEPTH = 0.038;
// 内框前表面比外框前表面后退多少：保留明显层级，而不是两圈挤在同一平面。
const INNER_FRAME_FRONT_INSET = 0.018;
// 内框是否启用倒角：保留切割琉璃的利落边感。
const INNER_FRAME_BEVEL_ENABLED = true;
// 内框倒角向厚度方向吃进去多少：太大容易显得内框发胖。
const INNER_FRAME_BEVEL_THICKNESS = 0.02;
// 内框倒角向正面内缩多少：控制小框切面是否足够精致。
const INNER_FRAME_BEVEL_SIZE = 0.0;
// 内框倒角偏移：通常保持 0，让内框切面稳定居中。
const INNER_FRAME_BEVEL_OFFSET = 0;
// 内框倒角细分：小框保留较低段数即可，兼顾形体和性能。
const INNER_FRAME_BEVEL_SEGMENTS = 2;
// 内框颜色：默认沿用外框琉璃主色，方便你后续只改单个值做区分。
const INNER_FRAME_BORDER_COLOR = FRAME_BORDER_COLOR;
// 内框边缘提亮颜色：默认也跟外框一致，整体更像同系列双层琉璃。
const INNER_FRAME_BORDER_EMISSIVE_COLOR = FRAME_BORDER_EMISSIVE_COLOR;
// 内框透明度：比外框略实一点，让第二圈轮廓更明确。
const INNER_FRAME_GLASS_OPACITY = 0.24;
// 内框粗糙度：略低一点，让内圈更容易出现干净亮边。
const INNER_FRAME_GLASS_ROUGHNESS = 0.05;
// 内框清漆层强度：稍高于外框，帮助双层结构被灯光更清楚地切出来。
const INNER_FRAME_GLASS_CLEARCOAT = 0.08;
// 内框清漆粗糙度：保持偏低，保证高光干净。
const INNER_FRAME_GLASS_CLEARCOAT_ROUGHNESS = 0.08;
// 内框自发光强度：轻轻把内圈提起来，不让它陷进暗部里看不见。
const INNER_FRAME_EMISSIVE_INTENSITY = 0.12;

// 海报基础亮度：保持白色，避免贴图整体偏色。
const POSTER_BASE_COLOR = '#ffffff';
// 海报粗糙度：越高越柔和，越低越容易出镜面反光；这里保持纸面/喷绘那种轻微漫反射。
const POSTER_ROUGHNESS = 0.01;
// 海报金属度：基本保持接近 0.1，避免像金属板。
const POSTER_METALNESS = 0.5;
// 海报自发光颜色：这里只是轻轻托底，让海报在受光后仍保留清晰内容。
const POSTER_EMISSIVE_COLOR = '#ffffff';
// 海报自发光强度：这是“别被灯洗黑”的关键值；想更清晰就略微加，想更吃光就略微减。
const POSTER_EMISSIVE_INTENSITY = 0.01;
// 海报环境反射强度：保留一点整体亮面，但不要太强，否则会像覆膜反光。
const POSTER_ENV_MAP_INTENSITY = 0.35;

// 海报内缘阴影颜色：故意做成很轻的冷灰蓝，贴合琉璃框的气质，不用纯黑。
const POSTER_INNER_SHADOW_COLOR = '#94ddff';
// 海报内缘阴影总透明度：这是最主要的阴影强度总阀门；想更有“嵌入感”就加，想更轻就减。
const POSTER_INNER_SHADOW_OPACITY = 0.2;
// 靠光这一侧的边框阴影强度：因为光是斜打进来的，靠光侧框唇会在海报上压出最明显的内缘阴影。
const POSTER_INNER_SHADOW_LIGHT_SIDE_STRENGTH = 0.3;
// 背光这一侧的边框阴影强度：保留一点点即可，主要是维持素描关系，不要形成两边一样黑。
const POSTER_INNER_SHADOW_OPPOSITE_SIDE_STRENGTH = 0.05;
// 上沿阴影强度：通常上沿也会压一点点暗部，帮助海报更像嵌在框里。
const POSTER_INNER_SHADOW_TOP_STRENGTH = 0.3;
// 下沿阴影强度：下沿通常比上沿更轻，避免整个海报像被黑框压住。
const POSTER_INNER_SHADOW_BOTTOM_STRENGTH = 0.01;
// 阴影边缘宽度：占海报宽/高的比例；越大表示边框阴影往海报里吃得越深。
const POSTER_INNER_SHADOW_EDGE_WIDTH = 0.055;
// 阴影软过渡宽度：越大越柔和，越小越像硬阴影；这里建议保持柔一点的“素描关系”。
const POSTER_INNER_SHADOW_EDGE_SOFTNESS = 0.16;
// 阴影层离海报表面的前后偏移：只要极小正值，防止和海报面打架闪烁。
const POSTER_INNER_SHADOW_Z_OFFSET = 0.05;

// 琉璃透光高光颜色：轻微偏蓝白，用来模拟玻璃边缘折进海报表面的柔光。
const POSTER_GLASS_HIGHLIGHT_COLOR = '#94e5f3';
// 琉璃透光高光总透明度：这是玻璃感最主要的可调阀门；太高会假，太低会看不见。
const POSTER_GLASS_HIGHLIGHT_OPACITY = 0.05;
// 高光主带离靠光边缘的距离：越小越贴边，越大越往海报中间滑。
const POSTER_GLASS_HIGHLIGHT_OFFSET = 1;
// 高光主带宽度：越大越像整片雾光，越小越像一道折射亮痕。
const POSTER_GLASS_HIGHLIGHT_WIDTH = 0.001;
// 高光主带软过渡：越大越柔，越小越利。
const POSTER_GLASS_HIGHLIGHT_SOFTNESS = 0.3;
// 顶部高光加权：让高光略微偏上，更像现实里从上方/侧前方擦过去的光。
const POSTER_GLASS_HIGHLIGHT_TOP_WEIGHT = 0.32;
// 高光层离海报表面的前后偏移：略高于阴影层，避免透明面互相抢深度。
const POSTER_GLASS_HIGHLIGHT_Z_OFFSET = 0.004;

// 海报缩进深度：继续保留现在“嵌在框里”的基础关系。
const IMAGE_RECESS_Z = 0.02;

const frameAssetCache = new Map();
let posterInnerShadowTextureCache = null;
let posterGlassHighlightTextureCache = null;

function createOverlayTexture(drawPixel) {
  const size = 384;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext('2d');
  const imageData = context.createImageData(size, size);
  const { data } = imageData;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const offset = (y * size + x) * 4;
      const alpha = THREE.MathUtils.clamp(drawPixel(x / (size - 1), y / (size - 1)), 0, 1);

      data[offset] = 255;
      data[offset + 1] = 255;
      data[offset + 2] = 255;
      data[offset + 3] = Math.round(alpha * 255);
    }
  }

  context.putImageData(imageData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;

  return texture;
}

function getSoftEdgeStrength(distanceFromEdge, edgeWidth, softness) {
  return 1 - THREE.MathUtils.smoothstep(distanceFromEdge, edgeWidth, edgeWidth + softness);
}

function getPosterInnerShadowTexture() {
  if (posterInnerShadowTextureCache) {
    return posterInnerShadowTextureCache;
  }

  posterInnerShadowTextureCache = createOverlayTexture((u, v) => {
    const distanceFromLeft = u;
    const distanceFromRight = 1 - u;
    const distanceFromTop = v;
    const distanceFromBottom = 1 - v;

    const lightSideShadow = getSoftEdgeStrength(
      distanceFromRight,
      POSTER_INNER_SHADOW_EDGE_WIDTH,
      POSTER_INNER_SHADOW_EDGE_SOFTNESS,
    ) * POSTER_INNER_SHADOW_LIGHT_SIDE_STRENGTH;
    const oppositeSideShadow = getSoftEdgeStrength(
      distanceFromLeft,
      POSTER_INNER_SHADOW_EDGE_WIDTH,
      POSTER_INNER_SHADOW_EDGE_SOFTNESS,
    ) * POSTER_INNER_SHADOW_OPPOSITE_SIDE_STRENGTH;
    const topShadow = getSoftEdgeStrength(
      distanceFromTop,
      POSTER_INNER_SHADOW_EDGE_WIDTH,
      POSTER_INNER_SHADOW_EDGE_SOFTNESS,
    ) * POSTER_INNER_SHADOW_TOP_STRENGTH;
    const bottomShadow = getSoftEdgeStrength(
      distanceFromBottom,
      POSTER_INNER_SHADOW_EDGE_WIDTH,
      POSTER_INNER_SHADOW_EDGE_SOFTNESS,
    ) * POSTER_INNER_SHADOW_BOTTOM_STRENGTH;

    return Math.min(1, lightSideShadow + oppositeSideShadow + topShadow + bottomShadow);
  });

  return posterInnerShadowTextureCache;
}

function getPosterGlassHighlightTexture() {
  if (posterGlassHighlightTextureCache) {
    return posterGlassHighlightTextureCache;
  }

  posterGlassHighlightTextureCache = createOverlayTexture((u, v) => {
    const bandCenter = 1 - POSTER_GLASS_HIGHLIGHT_OFFSET;
    const bandDistance = Math.abs(u - bandCenter);
    const bandStrength = 1 - THREE.MathUtils.smoothstep(
      bandDistance,
      POSTER_GLASS_HIGHLIGHT_WIDTH,
      POSTER_GLASS_HIGHLIGHT_WIDTH + POSTER_GLASS_HIGHLIGHT_SOFTNESS,
    );
    const topBias = 1 + (1 - v) * POSTER_GLASS_HIGHLIGHT_TOP_WEIGHT;

    return Math.min(1, bandStrength * topBias);
  });

  return posterGlassHighlightTextureCache;
}

function createFrameShape(frameWidth, frameHeight, borderThickness) {
  const outerHalfWidth = frameWidth / 2;
  const outerHalfHeight = frameHeight / 2;
  const innerHalfWidth = outerHalfWidth - borderThickness;
  const innerHalfHeight = outerHalfHeight - borderThickness;

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

function createExtrudedFrameGeometry(shape, options) {
  const geometry = new THREE.ExtrudeGeometry(shape, options);
  geometry.center();
  geometry.computeVertexNormals();
  return geometry;
}

function getFrameAssets(frameWidth, frameHeight) {
  const cacheKey = `${frameWidth}x${frameHeight}`;

  if (frameAssetCache.has(cacheKey)) {
    return frameAssetCache.get(cacheKey);
  }

  const outerOpeningWidth = frameWidth - BORDER_THICKNESS * 2;
  const outerOpeningHeight = frameHeight - BORDER_THICKNESS * 2;
  const innerFrameOuterWidth = Math.max(0.16, outerOpeningWidth - INNER_FRAME_INSET_FROM_OUTER_EDGE * 2);
  const innerFrameOuterHeight = Math.max(0.16, outerOpeningHeight - INNER_FRAME_INSET_FROM_OUTER_EDGE * 2);
  const imageWidth = Math.max(0.08, innerFrameOuterWidth - INNER_FRAME_THICKNESS * 2);
  const imageHeight = Math.max(0.08, innerFrameOuterHeight - INNER_FRAME_THICKNESS * 2);
  const innerFrameZ = FRAME_DEPTH / 2 - INNER_FRAME_FRONT_INSET - INNER_FRAME_DEPTH / 2;
  const assets = {
    imageZ: IMAGE_RECESS_Z,
    innerFrameZ,
    frameGeometry: createExtrudedFrameGeometry(createFrameShape(frameWidth, frameHeight, BORDER_THICKNESS), {
      depth: FRAME_DEPTH,
      bevelEnabled: FRAME_BEVEL_ENABLED,
      bevelThickness: FRAME_BEVEL_THICKNESS,
      bevelSize: FRAME_BEVEL_SIZE,
      bevelOffset: FRAME_BEVEL_OFFSET,
      bevelSegments: FRAME_BEVEL_SEGMENTS,
      curveSegments: 8,
      steps: FRAME_EXTRUDE_STEPS,
    }),
    innerFrameGeometry: createExtrudedFrameGeometry(createFrameShape(innerFrameOuterWidth, innerFrameOuterHeight, INNER_FRAME_THICKNESS), {
      depth: INNER_FRAME_DEPTH,
      bevelEnabled: INNER_FRAME_BEVEL_ENABLED,
      bevelThickness: INNER_FRAME_BEVEL_THICKNESS,
      bevelSize: INNER_FRAME_BEVEL_SIZE,
      bevelOffset: INNER_FRAME_BEVEL_OFFSET,
      bevelSegments: INNER_FRAME_BEVEL_SEGMENTS,
      curveSegments: 8,
      steps: FRAME_EXTRUDE_STEPS,
    }),
    imageGeometry: new THREE.PlaneGeometry(imageWidth, imageHeight),
  };

  frameAssetCache.set(cacheKey, assets);
  return assets;
}

function createGlassMaterial({
  color,
  roughness,
  clearcoat,
  clearcoatRoughness,
  emissive,
  emissiveIntensity,
}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness,
    metalness: FRAME_GLASS_METALNESS,
    transmission: FRAME_GLASS_TRANSMISSION,
    thickness: FRAME_GLASS_THICKNESS,
    ior: FRAME_GLASS_IOR,
    reflectivity: FRAME_GLASS_REFLECTIVITY,
    envMapIntensity: FRAME_GLASS_ENV_MAP_INTENSITY,
    clearcoat,
    clearcoatRoughness,
    specularIntensity: FRAME_GLASS_SPECULAR_INTENSITY,
    specularColor: FRAME_GLASS_SPECULAR_COLOR,
    attenuationColor: FRAME_GLASS_ATTENUATION_COLOR,
    attenuationDistance: FRAME_GLASS_ATTENUATION_DISTANCE,
    iridescence: FRAME_GLASS_IRIDESCENCE,
    iridescenceIOR: FRAME_GLASS_IRIDESCENCE_IOR,
    iridescenceThicknessRange: FRAME_GLASS_IRIDESCENCE_THICKNESS_RANGE,
    emissive,
    emissiveIntensity,
    transparent: true,
  });
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
  const {
    imageZ,
    innerFrameZ,
    frameGeometry,
    innerFrameGeometry,
    imageGeometry,
  } = useMemo(
    () => getFrameAssets(frameWidth, frameHeight),
    [frameWidth, frameHeight],
  );
  const borderMaterial = useMemo(() => createGlassMaterial({
    color: FRAME_BORDER_COLOR,
    roughness: FRAME_GLASS_ROUGHNESS,
    clearcoat: FRAME_GLASS_CLEARCOAT,
    clearcoatRoughness: FRAME_GLASS_CLEARCOAT_ROUGHNESS,
    emissive: FRAME_BORDER_EMISSIVE_COLOR,
    emissiveIntensity: FRAME_BORDER_EMISSIVE_INTENSITY,
  }), []);
  const innerFrameMaterial = useMemo(() => createGlassMaterial({
    color: INNER_FRAME_BORDER_COLOR,
    roughness: INNER_FRAME_GLASS_ROUGHNESS,
    clearcoat: INNER_FRAME_GLASS_CLEARCOAT,
    clearcoatRoughness: INNER_FRAME_GLASS_CLEARCOAT_ROUGHNESS,
    emissive: INNER_FRAME_BORDER_EMISSIVE_COLOR,
    emissiveIntensity: INNER_FRAME_EMISSIVE_INTENSITY,
  }), []);
  const imageMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: POSTER_BASE_COLOR,
    roughness: POSTER_ROUGHNESS,
    metalness: POSTER_METALNESS,
    emissive: POSTER_EMISSIVE_COLOR,
    emissiveIntensity: POSTER_EMISSIVE_INTENSITY,
    envMapIntensity: POSTER_ENV_MAP_INTENSITY,
    transparent: true,
    side: THREE.DoubleSide,
  }), []);
  const posterInnerShadowTexture = useMemo(() => getPosterInnerShadowTexture(), []);
  const posterGlassHighlightTexture = useMemo(() => getPosterGlassHighlightTexture(), []);
  const posterInnerShadowMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: POSTER_INNER_SHADOW_COLOR,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide,
    map: posterInnerShadowTexture,
  }), [posterInnerShadowTexture]);
  const posterGlassHighlightMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: POSTER_GLASS_HIGHLIGHT_COLOR,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    map: posterGlassHighlightTexture,
  }), [posterGlassHighlightTexture]);
  const opacity = isFocused ? 1 : (project.opacity ?? 1);
  const frameOpacity = opacity * FRAME_GLASS_OPACITY;
  const innerFrameOpacity = opacity * INNER_FRAME_GLASS_OPACITY;
  const isOuterFrameTransparent = frameOpacity < 0.999 || FRAME_GLASS_TRANSMISSION > 0;
  const isInnerFrameTransparent = innerFrameOpacity < 0.999 || FRAME_GLASS_TRANSMISSION > 0;
  const lightFacingScaleX = project.side < 0 ? 1 : -1;

  useEffect(() => {
    if (borderMaterial.transparent !== isOuterFrameTransparent) {
      borderMaterial.transparent = isOuterFrameTransparent;
      borderMaterial.needsUpdate = true;
    }

    borderMaterial.opacity = frameOpacity;
    borderMaterial.depthWrite = !isOuterFrameTransparent;

    if (innerFrameMaterial.transparent !== isInnerFrameTransparent) {
      innerFrameMaterial.transparent = isInnerFrameTransparent;
      innerFrameMaterial.needsUpdate = true;
    }

    innerFrameMaterial.opacity = innerFrameOpacity;
    innerFrameMaterial.depthWrite = !isInnerFrameTransparent;

    imageMaterial.map = texture ?? null;
    imageMaterial.opacity = texture ? opacity : 0;
    imageMaterial.needsUpdate = true;

    posterInnerShadowMaterial.opacity = texture ? opacity * POSTER_INNER_SHADOW_OPACITY : 0;
    posterInnerShadowMaterial.needsUpdate = true;

    posterGlassHighlightMaterial.opacity = texture ? opacity * POSTER_GLASS_HIGHLIGHT_OPACITY : 0;
    posterGlassHighlightMaterial.needsUpdate = true;

    const nextImageDepthWrite = Boolean(texture) && opacity >= 0.999;
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
  }, [
    borderMaterial,
    frameOpacity,
    imageMaterial,
    innerFrameMaterial,
    innerFrameOpacity,
    isInnerFrameTransparent,
    isOuterFrameTransparent,
    opacity,
    posterGlassHighlightMaterial,
    posterInnerShadowMaterial,
    texture,
  ]);

  useEffect(() => () => {
    borderMaterial.dispose();
    innerFrameMaterial.dispose();
    imageMaterial.dispose();
    posterInnerShadowMaterial.dispose();
    posterGlassHighlightMaterial.dispose();
  }, [borderMaterial, imageMaterial, innerFrameMaterial, posterGlassHighlightMaterial, posterInnerShadowMaterial]);

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
        position={[0, 0, innerFrameZ]}
        geometry={innerFrameGeometry}
        material={innerFrameMaterial}
        castShadow // 让第二圈套框也参与投影，层次会更真实
        receiveShadow // 内框自己也要接住光影，避免像贴上去的薄片
      />
      <mesh
        position={[0, 0, imageZ]}
        geometry={imageGeometry}
        material={texture ? imageMaterial : OPAQUE_IMAGE_FALLBACK}
        receiveShadow // 让海报面接住边框或灯打出来的阴影变化
      >
      </mesh>
      {texture ? (
        <>
          <mesh
            position={[0, 0, imageZ + POSTER_INNER_SHADOW_Z_OFFSET]}
            scale={[lightFacingScaleX, 1, 1]}
            geometry={imageGeometry}
            material={posterInnerShadowMaterial}
            renderOrder={1}
          />
          <mesh
            position={[0, 0, imageZ + POSTER_GLASS_HIGHLIGHT_Z_OFFSET]}
            scale={[lightFacingScaleX, 1, 1]}
            geometry={imageGeometry}
            material={posterGlassHighlightMaterial}
            renderOrder={2}
          />
        </>
      ) : null}
    </group>
  );
}

export default memo(FramePortal, areFramePropsEqual);
