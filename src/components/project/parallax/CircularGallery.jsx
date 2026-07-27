import { Camera, Mesh, Plane, Program, Renderer, Texture, Transform } from 'ogl';
import { useEffect, useRef } from 'react';

import './CircularGallery.css';

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function lerp(p1, p2, t) {
  return p1 + (p2 - p1) * t;
}

const GEM_ACCENT_BY_COLOR = {
  金黄色: '#f0c45a',
  蓝白色: '#9ec9ef',
  珊瑚橙: '#f08a5c',
  鲜红色: '#e85a55',
  蜜琥珀色: '#e8b84a',
  蓝绿色: '#4ecdc4',
  无色透明: '#c8def0',
  乳白玉色: '#f0ddd0',
  乳白色: '#efe2d4',
  乳白层纹: '#ebd9c8',
  木纹棕绿: '#c4a574',
  淡粉色: '#f2a6c0',
  紫水晶色: '#c9a0e8',
  橘红色: '#f07850',
  翠绿色: '#5dce8a',
  多层条纹: '#e8c9a0',
  茶褐色: '#c9a87a',
  淡绿色: '#9fd4a8',
  嫩芽绿: '#8fd46a',
  深蓝镶金: '#6ba3e8',
  鲜红底色: '#e85a6b',
  深黑色: '#a8b4c8',
  墨黑色: '#9aa6ba'
};

function resolveGemAccent(colorName) {
  return GEM_ACCENT_BY_COLOR[colorName] || '#d8c4a0';
}

class Media {
  constructor({
    geometry,
    gl,
    image,
    index,
    length,
    renderer,
    scene,
    screen,
    text,
    description,
    title,
    english,
    lines,
    rarity,
    color,
    trait,
    no,
    sourceIndex,
    viewport,
    bend,
    borderRadius = 0,
    itemScale = 1,
    itemGap = 1
  }) {
    this.extra = 0;
    this.geometry = geometry;
    this.gl = gl;
    this.image = image;
    this.index = index;
    this.length = length;
    this.renderer = renderer;
    this.scene = scene;
    this.screen = screen;
    this.text = text;
    this.description = description;
    this.title = title;
    this.english = english;
    this.lines = lines;
    this.rarity = rarity;
    this.color = color;
    this.trait = trait;
    this.no = no ?? sourceIndex + 1;
    this.sourceIndex = sourceIndex;
    this.viewport = viewport;
    this.bend = bend;
    this.borderRadius = borderRadius;
    this.itemScale = itemScale;
    this.itemGap = itemGap;
    this.baseScaleX = 1;
    this.baseScaleY = 1;
    this.labelEl = null;
    this.createShader();
    this.createMesh();
    this.onResize();
  }

  createShader() {
    const texture = new Texture(this.gl, {
      generateMipmaps: true,
      premultiplyAlpha: false
    });
    this.program = new Program(this.gl, {
      depthTest: false,
      depthWrite: false,
      vertex: `
        precision highp float;
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragment: `
        precision highp float;
        uniform vec2 uImageSizes;
        uniform vec2 uPlaneSizes;
        uniform sampler2D tMap;
        uniform float uBorderRadius;
        varying vec2 vUv;
        
        float roundedBoxSDF(vec2 p, vec2 b, float r) {
          vec2 d = abs(p) - b;
          return length(max(d, vec2(0.0))) + min(max(d.x, d.y), 0.0) - r;
        }
        
        void main() {
          vec2 ratio = vec2(
            min((uPlaneSizes.x / uPlaneSizes.y) / (uImageSizes.x / uImageSizes.y), 1.0),
            min((uPlaneSizes.y / uPlaneSizes.x) / (uImageSizes.y / uImageSizes.x), 1.0)
          );
          vec2 uv = vec2(
            vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
            vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
          );
          vec4 color = texture2D(tMap, uv);
          
          float d = roundedBoxSDF(vUv - 0.5, vec2(0.5 - uBorderRadius), uBorderRadius);
          float edgeSmooth = 0.002;
          float shapeAlpha = 1.0 - smoothstep(-edgeSmooth, edgeSmooth, d);
          
          gl_FragColor = vec4(color.rgb, color.a * shapeAlpha);
        }
      `,
      uniforms: {
        tMap: { value: texture },
        uPlaneSizes: { value: [0, 0] },
        uImageSizes: { value: [0, 0] },
        uBorderRadius: { value: this.borderRadius }
      },
      transparent: true
    });
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = this.image;
    img.onload = () => {
      texture.image = img;
      this.program.uniforms.uImageSizes.value = [img.naturalWidth, img.naturalHeight];
    };
  }

  createMesh() {
    this.plane = new Mesh(this.gl, {
      geometry: this.geometry,
      program: this.program
    });
    this.plane.setParent(this.scene);
  }

  update(scroll, direction, centerScaleBoost = 0.2) {
    this.plane.position.x = this.x - scroll.current - this.extra;

    const x = this.plane.position.x;
    const H = this.viewport.width / 2;

    if (this.bend === 0) {
      this.plane.position.y = 0;
      this.plane.rotation.z = 0;
    } else {
      const B_abs = Math.abs(this.bend);
      const R = (H * H + B_abs * B_abs) / (2 * B_abs);
      const effectiveX = Math.min(Math.abs(x), H);
      const arc = R - Math.sqrt(R * R - effectiveX * effectiveX);
      if (this.bend > 0) {
        this.plane.position.y = -arc;
        this.plane.rotation.z = -Math.sign(x) * Math.asin(effectiveX / R);
      } else {
        this.plane.position.y = arc;
        this.plane.rotation.z = Math.sign(x) * Math.asin(effectiveX / R);
      }
    }

    const centerFalloff = this.viewport.width * 0.14;
    const boost = 1 + Math.max(0, 1 - Math.abs(x) / centerFalloff) * centerScaleBoost;
    this.plane.scale.x = this.baseScaleX * boost;
    this.plane.scale.y = this.baseScaleY * boost;
    this.plane.program.uniforms.uPlaneSizes.value = [this.plane.scale.x, this.plane.scale.y];

    const planeOffset = this.plane.scale.x / 2;
    const viewportOffset = this.viewport.width / 2;
    this.isBefore = this.plane.position.x + planeOffset < -viewportOffset;
    this.isAfter = this.plane.position.x - planeOffset > viewportOffset;
    if (direction === 'right' && this.isBefore) {
      this.extra -= this.widthTotal;
      this.isBefore = this.isAfter = false;
    }
    if (direction === 'left' && this.isAfter) {
      this.extra += this.widthTotal;
      this.isBefore = this.isAfter = false;
    }
  }

  getLabelAnchor(sceneOffsetY = 0) {
    const halfH = this.plane.scale.y * 0.5;
    const gap = this.plane.scale.y * 0.1;
    const rotZ = this.plane.rotation.z;
    const d = halfH + gap;
    return {
      x: this.plane.position.x + d * Math.sin(rotZ),
      y: this.plane.position.y - d * Math.cos(rotZ) + sceneOffsetY,
      rotZ
    };
  }

  getScreenBounds(sceneOffsetY = 0, projectToScreen) {
    const center = projectToScreen(this.plane.position.x, this.plane.position.y + sceneOffsetY);
    const halfW = ((this.plane.scale.x * 0.5) / this.viewport.width) * this.screen.width;
    const halfH = ((this.plane.scale.y * 0.5) / this.viewport.height) * this.screen.height;
    return {
      centerX: center.x,
      centerY: center.y,
      halfW,
      halfH
    };
  }

  onResize({ screen, viewport } = {}) {
    if (screen) this.screen = screen;
    if (viewport) {
      this.viewport = viewport;
      if (this.plane.program.uniforms.uViewportSizes) {
        this.plane.program.uniforms.uViewportSizes.value = [this.viewport.width, this.viewport.height];
      }
    }
    this.scale = this.screen.height / 1500;
    this.baseScaleY = ((this.viewport.height * (900 * this.scale)) / this.screen.height) * this.itemScale;
    this.baseScaleX = ((this.viewport.width * (700 * this.scale)) / this.screen.width) * this.itemScale;
    this.plane.scale.y = this.baseScaleY;
    this.plane.scale.x = this.baseScaleX;
    this.plane.program.uniforms.uPlaneSizes.value = [this.plane.scale.x, this.plane.scale.y];
    this.padding = 2 * this.itemGap;
    this.width = this.plane.scale.x + this.padding;
    this.widthTotal = this.width * this.length;
    this.x = this.width * this.index;
  }
}

class App {
  constructor(
    container,
    {
      items,
      bend,
      borderRadius = 0,
      itemScale = 1,
      itemGap = 1,
      verticalOffset = 3,
      centerScaleBoost = 0.2,
      scrollSpeed = 2,
      scrollEase = 0.05
    } = {}
  ) {
    this.container = container;
    this.verticalOffset = verticalOffset;
    this.centerScaleBoost = centerScaleBoost;
    this.scrollSpeed = scrollSpeed;
    this.scroll = { ease: scrollEase, current: 0, target: 0, last: 0 };
    this.onCheckDebounce = debounce(this.onCheck, 200);
    this.isDown = false;
    this.dragMoved = false;
    this.activeIntroIndex = -1;
    this.createRenderer();
    this.createCamera();
    this.createScene();
    this.onResize();
    this.createGeometry();
    this.createMedias(items, bend, borderRadius, itemScale, itemGap);
    this.createLabelLayer();
    this.createIntroPanel();
    this.createSwipeHint();
    this.update();
    this.addEventListeners();
  }

  createRenderer() {
    this.renderer = new Renderer({
      alpha: true,
      antialias: true,
      dpr: Math.min(window.devicePixelRatio || 1, 2)
    });
    this.gl = this.renderer.gl;
    this.gl.clearColor(0, 0, 0, 0);
    this.container.appendChild(this.renderer.gl.canvas);
  }

  createCamera() {
    this.camera = new Camera(this.gl);
    this.camera.fov = 45;
    this.camera.position.z = 20;
  }

  createScene() {
    this.scene = new Transform();
    this.scene.position.y = this.verticalOffset;
  }

  createGeometry() {
    this.planeGeometry = new Plane(this.gl, {
      heightSegments: 1,
      widthSegments: 1
    });
  }

  createMedias(items, bend = 1, borderRadius, itemScale, itemGap = 1) {
    const galleryItems = items?.length ? items : [];
    this.uniqueCount = galleryItems.length;
    this.mediasImages = galleryItems.concat(galleryItems);
    this.medias = this.mediasImages.map((data, index) => {
      return new Media({
        geometry: this.planeGeometry,
        gl: this.gl,
        image: data.image,
        index,
        length: this.mediasImages.length,
        renderer: this.renderer,
        scene: this.scene,
        screen: this.screen,
        text: data.text,
        description: data.description ?? '',
        title: data.title ?? data.text ?? '',
        english: data.english ?? '',
        lines: data.lines ?? [],
        rarity: data.rarity ?? 3,
        color: data.color ?? '',
        trait: data.trait ?? '',
        no: data.no ?? (index % galleryItems.length) + 1,
        sourceIndex: index % galleryItems.length,
        viewport: this.viewport,
        bend,
        borderRadius,
        itemScale,
        itemGap
      });
    });
  }

  createLabelLayer() {
    this.labelLayer = document.createElement('div');
    this.labelLayer.className = 'circular-gallery__labels';
    this.container.appendChild(this.labelLayer);

    this.medias.forEach((media) => {
      const label = document.createElement('span');
      label.className = 'circular-gallery__label';
      label.textContent = media.text;
      this.labelLayer.appendChild(label);
      media.labelEl = label;
    });
  }

  createIntroPanel() {
    this.introEl = document.createElement('div');
    this.introEl.className = 'circular-gallery__intro';
    this.introEl.setAttribute('aria-live', 'polite');
    this.container.appendChild(this.introEl);
    this.updateIntroPosition();
    const centered = this.getCenteredMedia();
    if (centered) {
      this.setIntroContent(centered);
      this.activeIntroIndex = centered.sourceIndex;
    }
  }

  createSwipeHint() {
    this.swipeHintEl = document.createElement('div');
    this.swipeHintEl.className = 'circular-gallery__swipe-hint';
    this.swipeHintEl.setAttribute('aria-hidden', 'true');
    this.swipeHintEl.innerHTML = `
      <svg class="circular-gallery__swipe-hint-track" viewBox="0 0 320 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="cg-explore-arc" x1="28" y1="28" x2="292" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#fff" stop-opacity="0"/>
            <stop offset="14%" stop-color="#fff" stop-opacity="0.22"/>
            <stop offset="50%" stop-color="#fff" stop-opacity="0.38"/>
            <stop offset="86%" stop-color="#fff" stop-opacity="0.22"/>
            <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
          </linearGradient>
          <radialGradient id="cg-explore-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#fff" stop-opacity="0.95"/>
            <stop offset="45%" stop-color="#e8d9b8" stop-opacity="0.55"/>
            <stop offset="100%" stop-color="#e8d9b8" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <path
          id="cg-explore-path"
          class="circular-gallery__swipe-hint-arc"
          d="M36 30 C96 12, 224 12, 284 30"
          stroke="url(#cg-explore-arc)"
          stroke-width="0.9"
          stroke-linecap="round"
        />
        <g class="circular-gallery__swipe-hint-mark" transform="translate(36 30)" opacity="0.58">
          <path d="M0 -5.2 L5.2 0 L0 5.2 L-5.2 0 Z" fill="currentColor"/>
          <path d="M0 -8.2 L0.55 -0.55 L0 7.1 L-0.55 -0.55 Z" fill="currentColor" opacity="0.45"/>
          <path d="M-8.2 0 L-0.55 0.55 L7.1 0 L-0.55 -0.55 Z" fill="currentColor" opacity="0.45"/>
        </g>
        <g class="circular-gallery__swipe-hint-mark" transform="translate(284 30)" opacity="0.58">
          <path d="M0 -5.2 L5.2 0 L0 5.2 L-5.2 0 Z" fill="currentColor"/>
          <path d="M0 -8.2 L0.55 -0.55 L0 7.1 L-0.55 -0.55 Z" fill="currentColor" opacity="0.45"/>
          <path d="M-8.2 0 L-0.55 0.55 L7.1 0 L-0.55 -0.55 Z" fill="currentColor" opacity="0.45"/>
        </g>
        <g class="circular-gallery__swipe-hint-orb">
          <circle r="7" fill="url(#cg-explore-glow)" opacity="0.55"/>
          <circle r="1.6" fill="#fff" opacity="0.95"/>
          <animateMotion dur="4.8s" repeatCount="indefinite" rotate="auto">
            <mpath href="#cg-explore-path"/>
          </animateMotion>
        </g>
        <g class="circular-gallery__swipe-hint-orb circular-gallery__swipe-hint-orb--delay">
          <circle r="5" fill="url(#cg-explore-glow)" opacity="0.32"/>
          <circle r="1.1" fill="#fff" opacity="0.72"/>
          <animateMotion dur="4.8s" begin="2.4s" repeatCount="indefinite" rotate="auto">
            <mpath href="#cg-explore-path"/>
          </animateMotion>
        </g>
      </svg>
      <span class="circular-gallery__swipe-hint-word">探索</span>
    `;
    this.container.appendChild(this.swipeHintEl);
    this.updateSwipeHintPosition();
  }

  setIntroContent(media) {
    if (!this.introEl || !media) return;

    const title = media.title || media.text || '';
    const english = media.english || '';
    const lines = Array.isArray(media.lines) ? media.lines : [];
    const rarity = Math.max(0, Math.min(5, Number(media.rarity) || 0));
    const accent = resolveGemAccent(media.color);

    this.introEl.style.setProperty('--intro-accent', accent);
    this.introEl.replaceChildren();

    const noValue = Number(media.no) || media.sourceIndex + 1;
    const noEl = document.createElement('p');
    noEl.className = 'circular-gallery__intro-no';
    noEl.textContent = `NO.${String(noValue).padStart(2, '0')}`;
    this.introEl.appendChild(noEl);

    const titleEl = document.createElement('p');
    titleEl.className = 'circular-gallery__intro-title';
    titleEl.textContent = title;
    this.introEl.appendChild(titleEl);

    if (english) {
      const englishEl = document.createElement('p');
      englishEl.className = 'circular-gallery__intro-english';
      englishEl.textContent = english;
      this.introEl.appendChild(englishEl);
    }

    const ruleEl = document.createElement('div');
    ruleEl.className = 'circular-gallery__intro-rule';
    ruleEl.setAttribute('aria-hidden', 'true');
    this.introEl.appendChild(ruleEl);

    if (lines.length) {
      const bodyEl = document.createElement('div');
      bodyEl.className = 'circular-gallery__intro-body';
      lines.forEach((line) => {
        const lineEl = document.createElement('p');
        lineEl.className = 'circular-gallery__intro-body-line';
        lineEl.textContent = line;
        bodyEl.appendChild(lineEl);
      });
      this.introEl.appendChild(bodyEl);
    }

    const metaEl = document.createElement('div');
    metaEl.className = 'circular-gallery__intro-meta';

    const metaRows = [
      ['稀有度', null, 'rarity'],
      ['色彩', media.color || '—', 'color'],
      ['特征', media.trait || '—', 'trait'],
    ];

    metaRows.forEach(([label, value, kind]) => {
      const row = document.createElement('div');
      row.className = 'circular-gallery__intro-meta-row';

      const mark = document.createElement('span');
      mark.className = 'circular-gallery__intro-meta-mark';
      mark.textContent = '✦';
      mark.setAttribute('aria-hidden', 'true');

      const labelEl = document.createElement('span');
      labelEl.className = 'circular-gallery__intro-meta-label';
      labelEl.textContent = label;

      const valueEl = document.createElement('span');
      valueEl.className = `circular-gallery__intro-meta-value circular-gallery__intro-meta-value--${kind}`;

      if (kind === 'rarity') {
        const filled = document.createElement('span');
        filled.className = 'circular-gallery__intro-stars-filled';
        filled.textContent = '★'.repeat(rarity);
        const empty = document.createElement('span');
        empty.className = 'circular-gallery__intro-stars-empty';
        empty.textContent = '☆'.repeat(5 - rarity);
        valueEl.append(filled, empty);
      } else {
        valueEl.textContent = value;
      }

      row.append(mark, labelEl, valueEl);
      metaEl.appendChild(row);
    });

    this.introEl.appendChild(metaEl);
  }

  getLabelScreenY() {
    if (!this.medias?.[0]) return 0;
    const media = this.medias[0];
    const sceneOffsetY = this.scene.position.y;
    const halfH = media.baseScaleY * 0.5;
    const gap = media.baseScaleY * 0.1;
    const labelY = -halfH - gap + sceneOffsetY;
    return this.projectToScreen(0, labelY).y;
  }

  updateIntroPosition() {
    if (!this.introEl || !this.medias?.[0]) return;

    const viewH = this.screen.height || this.container.clientHeight || 0;
    const viewW = this.screen.width || this.container.clientWidth || 0;
    const landscape = viewW > viewH;
    const tiny = viewH > 0 && (viewH < 560 || (landscape && viewH < 640));
    const compact = viewH > 0 && viewH < 820;

    this.introEl.classList.toggle('is-compact', compact && !tiny);
    this.introEl.classList.toggle('is-tiny', tiny);
    this.container.classList.toggle('is-short', compact);
    this.container.classList.toggle('is-tiny', tiny);

    if (this.swipeHintEl) {
      this.swipeHintEl.style.display = tiny ? 'none' : '';
    }

    // Phone landscape / ultra-short: pin intro to bottom, keep clear of gem arc.
    if (tiny) {
      this.introEl.style.top = 'auto';
      this.introEl.style.bottom = '6px';
      return;
    }

    const labelScreenY = this.getLabelScreenY();
    const gapScale = compact
      ? Math.min(1, Math.max(0.52, (viewH - 400) / 420))
      : 1;
    const hintOffset = Math.round(146 * gapScale);
    const introOffset = Math.round(267 * gapScale);

    if (this.swipeHintEl) {
      this.swipeHintEl.style.top = `${labelScreenY + hintOffset}px`;
    }

    let introTop = labelScreenY + introOffset;
    const bottomPad = compact ? 14 : 28;
    const introH = this.introEl.offsetHeight || 0;
    const maxTop = Math.max(8, viewH - introH - bottomPad);
    if (introTop > maxTop) {
      introTop = maxTop;
    }

    this.introEl.style.top = `${introTop}px`;
    this.introEl.style.bottom = 'auto';
  }

  updateSwipeHintPosition(labelScreenY) {
    if (!this.swipeHintEl || !this.medias?.[0]) return;
    if (this.container.classList.contains('is-tiny')) {
      this.swipeHintEl.style.display = 'none';
      return;
    }
    this.swipeHintEl.style.display = '';
    const viewH = this.screen.height || this.container.clientHeight || 0;
    const compact = viewH > 0 && viewH < 820;
    const gapScale = compact
      ? Math.min(1, Math.max(0.52, (viewH - 400) / 420))
      : 1;
    const y = labelScreenY ?? this.getLabelScreenY();
    this.swipeHintEl.style.top = `${y + Math.round(146 * gapScale)}px`;
  }

  projectToScreen(x, y) {
    const sx = (x / this.viewport.width + 0.5) * this.screen.width;
    const sy = (-y / this.viewport.height + 0.5) * this.screen.height;
    return { x: sx, y: sy };
  }

  getCenteredMedia() {
    if (!this.medias?.length) return null;
    let best = this.medias[0];
    let minDist = Math.abs(best.plane.position.x);
    for (let i = 1; i < this.medias.length; i += 1) {
      const media = this.medias[i];
      const dist = Math.abs(media.plane.position.x);
      if (dist < minDist) {
        minDist = dist;
        best = media;
      }
    }
    return best;
  }

  scrollToMedia(media) {
    if (!media) return;
    this.scroll.target = media.x - media.extra;
  }

  findMediaAt(clientX, clientY) {
    const rect = this.container.getBoundingClientRect();
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    const sceneOffsetY = this.scene.position.y;
    let hit = null;
    let bestArea = Infinity;

    this.medias.forEach((media) => {
      const bounds = media.getScreenBounds(sceneOffsetY, this.projectToScreen.bind(this));
      const inX = Math.abs(localX - bounds.centerX) <= bounds.halfW * 1.05;
      const inY = Math.abs(localY - bounds.centerY) <= bounds.halfH * 1.05;
      if (!inX || !inY) return;
      const area = bounds.halfW * bounds.halfH;
      if (area < bestArea) {
        bestArea = area;
        hit = media;
      }
    });

    return hit;
  }

  updateLabels() {
    const edgePad = 48;
    const sceneOffsetY = this.scene.position.y;
    const hideLabels = this.container.classList.contains('is-tiny');

    this.medias.forEach((media) => {
      const el = media.labelEl;
      if (!el) return;

      if (hideLabels) {
        el.style.opacity = '0';
        return;
      }

      const anchor = media.getLabelAnchor(sceneOffsetY);
      const screen = this.projectToScreen(anchor.x, anchor.y);
      const inView =
        screen.x > -edgePad &&
        screen.x < this.screen.width + edgePad &&
        screen.y > -edgePad &&
        screen.y < this.screen.height + edgePad;

      const centerFalloff = this.viewport.width * 0.14;
      const proximity = Math.max(0, 1 - Math.abs(media.plane.position.x) / centerFalloff);
      const labelScale = 1 + proximity * 0.42;

      el.style.opacity = inView ? '1' : '0';
      el.style.left = `${screen.x}px`;
      el.style.top = `${screen.y}px`;
      el.style.transformOrigin = 'top center';
      el.style.transform = `translateX(-50%) rotate(${-anchor.rotZ}rad) scale(${labelScale})`;
      el.style.fontWeight = proximity > 0.55 ? '700' : '600';
    });
  }

  updateIntro() {
    if (!this.introEl) return;
    const centered = this.getCenteredMedia();
    if (!centered) return;

    if (centered.sourceIndex === this.activeIntroIndex) return;

    this.setIntroContent(centered);
    this.activeIntroIndex = centered.sourceIndex;
    this.introEl.classList.remove('is-fading');
    this.updateIntroPosition();
  }

  onTouchDown(e) {
    if (e.target.closest('.circular-gallery__intro')) return;
    this.isDown = true;
    this.dragMoved = false;
    this.scroll.position = this.scroll.current;
    const point = e.touches ? e.touches[0] : e;
    this.startX = point.clientX;
    this.startY = point.clientY;
  }

  onTouchMove(e) {
    if (!this.isDown) return;
    const point = e.touches ? e.touches[0] : e;
    const dx = point.clientX - this.startX;
    const dy = point.clientY - this.startY;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
      this.dragMoved = true;
    }
    if (!this.dragMoved) return;
    const distance = (this.startX - point.clientX) * (this.scrollSpeed * 0.025);
    this.scroll.target = this.scroll.position + distance;
  }

  onTouchUp(e) {
    if (!this.isDown) return;
    this.isDown = false;

    if (!this.dragMoved) {
      const point = e.changedTouches ? e.changedTouches[0] : e;
      const hit = this.findMediaAt(point.clientX, point.clientY);
      if (hit) {
        this.scrollToMedia(hit);
      }
    }

    this.onCheck();
  }

  onKeyDown(e) {
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        this.scroll.target += this.scrollSpeed * 5;
        this.onCheckDebounce();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        this.scroll.target -= this.scrollSpeed * 5;
        this.onCheckDebounce();
        break;
      case 'Home':
        e.preventDefault();
        this.scroll.target = 0;
        this.onCheckDebounce();
        break;
      default:
        break;
    }
  }

  onCheck() {
    if (!this.medias?.[0]) return;
    const width = this.medias[0].width;
    const itemIndex = Math.round(Math.abs(this.scroll.target) / width);
    const item = width * itemIndex;
    this.scroll.target = this.scroll.target < 0 ? -item : item;
  }

  onResize() {
    this.screen = {
      width: this.container.clientWidth,
      height: this.container.clientHeight
    };
    this.renderer.setSize(this.screen.width, this.screen.height);
    this.camera.perspective({
      aspect: this.screen.width / this.screen.height
    });
    const fov = (this.camera.fov * Math.PI) / 180;
    const height = 2 * Math.tan(fov / 2) * this.camera.position.z;
    const width = height * this.camera.aspect;
    this.viewport = { width, height };

    // Short / tiny viewports: lift the gem arc to leave room for the intro card.
    const short = this.screen.height > 0 && this.screen.height < 820;
    const tiny =
      this.screen.height > 0 &&
      (this.screen.height < 560 ||
        (this.screen.width > this.screen.height && this.screen.height < 640));
    const lift = tiny
      ? Math.min(0.55, ((640 - this.screen.height) / 640) * 0.7)
      : short
        ? Math.min(0.32, ((820 - this.screen.height) / 820) * 0.42)
        : 0;
    this.scene.position.y = this.verticalOffset * (1 + lift);

    if (this.medias) {
      this.medias.forEach((media) => media.onResize({ screen: this.screen, viewport: this.viewport }));
    }
    this.updateIntroPosition();
  }

  update() {
    this.scroll.current = lerp(this.scroll.current, this.scroll.target, this.scroll.ease);
    const direction = this.scroll.current > this.scroll.last ? 'right' : 'left';
    if (this.medias) {
      this.medias.forEach((media) => media.update(this.scroll, direction, this.centerScaleBoost));
    }
    this.renderer.render({ scene: this.scene, camera: this.camera });
    this.updateLabels();
    this.updateIntro();
    this.scroll.last = this.scroll.current;
    this.raf = window.requestAnimationFrame(this.update.bind(this));
  }

  addEventListeners() {
    this.boundOnResize = this.onResize.bind(this);
    this.boundOnTouchDown = this.onTouchDown.bind(this);
    this.boundOnTouchMove = this.onTouchMove.bind(this);
    this.boundOnTouchUp = this.onTouchUp.bind(this);
    this.boundOnKeyDown = this.onKeyDown.bind(this);

    window.addEventListener('resize', this.boundOnResize);
    this.container.addEventListener('mousedown', this.boundOnTouchDown);
    window.addEventListener('mousemove', this.boundOnTouchMove);
    window.addEventListener('mouseup', this.boundOnTouchUp);
    this.container.addEventListener('touchstart', this.boundOnTouchDown, { passive: true });
    window.addEventListener('touchmove', this.boundOnTouchMove, { passive: true });
    this.container.addEventListener('touchend', this.boundOnTouchUp);
    this.container.addEventListener('keydown', this.boundOnKeyDown);
  }

  destroy() {
    window.cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.boundOnResize);
    this.container.removeEventListener('mousedown', this.boundOnTouchDown);
    window.removeEventListener('mousemove', this.boundOnTouchMove);
    window.removeEventListener('mouseup', this.boundOnTouchUp);
    this.container.removeEventListener('touchstart', this.boundOnTouchDown);
    this.container.removeEventListener('touchmove', this.boundOnTouchMove);
    this.container.removeEventListener('touchend', this.boundOnTouchUp);
    this.container.removeEventListener('keydown', this.boundOnKeyDown);
    this.labelLayer?.remove();
    this.introEl?.remove();
    this.swipeHintEl?.remove();
    if (this.renderer?.gl?.canvas?.parentNode) {
      this.renderer.gl.canvas.parentNode.removeChild(this.renderer.gl.canvas);
    }
  }
}

export default function CircularGallery({
  items,
  bend = 3,
  borderRadius = 0,
  itemScale = 1,
  itemGap = 1,
  verticalOffset = 3,
  centerScaleBoost = 0.2,
  scrollSpeed = 2,
  scrollEase = 0.05
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const app = new App(containerRef.current, {
      items,
      bend,
      borderRadius,
      itemScale,
      itemGap,
      verticalOffset,
      centerScaleBoost,
      scrollSpeed,
      scrollEase
    });

    return () => {
      app.destroy();
    };
  }, [items, bend, borderRadius, itemScale, itemGap, verticalOffset, centerScaleBoost, scrollSpeed, scrollEase]);

  return (
    <div
      ref={containerRef}
      className="circular-gallery"
      tabIndex={0}
      role="region"
      aria-label="宝石环形画廊"
    />
  );
}
