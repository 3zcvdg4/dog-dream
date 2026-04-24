import * as THREE from 'three';
import { CONFIG } from './config.js';

export class GalleryScene {
  constructor() {
    this.galCanvas = document.getElementById('gallery-canvas');
    this.infoPanel = document.getElementById('info-panel');
    this.infoTitle = document.getElementById('info-title');
    this.infoDesc = document.getElementById('info-desc');
    this.infoEnterBtn = document.getElementById('info-enter-btn');
    this.infoBackBtn = document.getElementById('info-back-btn');

    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.frames = [];
    this.targetZ = 0;
    this.currentZ = 0;
    this.isFocusMode = false;
    this.focusTarget = null;
    this.originalTargetZ = 0;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.clock = new THREE.Clock();

    this.works = [
      { z: -4.5, side: 'left',  title: 'Work 01', scale: 1.6, yOffset: 0.15,  rotZ: 0.04,  desc: '这是一个创新的Web3D交互项目，结合了Three.js和现代前端技术。' },
      { z: -5.0, side: 'right', title: 'Work 02', scale: 1.4, yOffset: -0.1,  rotZ: -0.03, desc: '移动端响应式设计，优化用户在不同设备上的体验。' },
      { z: -8.3, side: 'left',  title: 'Work 03', scale: 1.3, yOffset: 0.2,   rotZ: 0.05,  desc: '数据可视化项目，使用D3.js创建交互式图表。' },
      { z: -11.0, side: 'right', title: 'Work 04', scale: 1.2, yOffset: -0.15, rotZ: -0.04, desc: 'React组件库开发，提供可复用的UI组件。' },
      { z: -12.1, side: 'left',  title: 'Work 05', scale: 1.1, yOffset: 0.05,  rotZ: 0.02,  desc: 'Node.js后端API开发，实现RESTful服务。' },
      { z: -17.0, side: 'right', title: 'Work 06', scale: 1.0, yOffset: -0.2,  rotZ: -0.06, desc: '机器学习模型部署，使用TensorFlow.js在浏览器中运行。' },
      { z: -15.9, side: 'left',  title: 'Work 07', scale: 1.3, yOffset: 0.15,  rotZ: 0.04,  desc: '区块链DApp开发，集成智能合约功能。' },
      { z: -23.0, side: 'right', title: 'Work 08', scale: 1.2, yOffset: -0.1,  rotZ: -0.03, desc: '游戏开发项目，使用Phaser.js框架。' },
      { z: -19.7, side: 'left',  title: 'Work 09', scale: 1.1, yOffset: 0.2,   rotZ: 0.05,  desc: '物联网项目，连接传感器和云服务。' },
      { z: -29.0, side: 'right', title: 'Work 10', scale: 1.0, yOffset: -0.15, rotZ: -0.04, desc: 'AR/VR体验开发，使用WebXR API。' },
      { z: -23.5, side: 'left',  title: 'Work 11', scale: 1.3, yOffset: 0.15,  rotZ: 0.04,  desc: '电商平台前端开发，集成支付系统。' },
      { z: -35.0, side: 'right', title: 'Work 12', scale: 1.2, yOffset: -0.1,  rotZ: -0.03, desc: 'CMS内容管理系统定制开发。' },
      { z: -27.3, side: 'left',  title: 'Work 13', scale: 1.1, yOffset: 0.2,   rotZ: 0.05,  desc: '移动App开发，使用React Native。' },
      { z: -41.0, side: 'right', title: 'Work 14', scale: 1.0, yOffset: -0.15, rotZ: -0.04, desc: 'DevOps工具开发，自动化部署流程。' },
    ];

    this.init();
  }

  init() {
    this.setupRenderer();
    this.setupScene();
    this.setupCamera();
    this.setupLights();
    this.createGeometry();
    this.setupEventListeners();
    this.animate();
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.galCanvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(CONFIG.FOG_COLOR);
    this.scene.fog = new THREE.Fog(CONFIG.FOG_COLOR, CONFIG.FOG_NEAR, CONFIG.FOG_FAR);
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      CONFIG.GALLERY_CAMERA_FOV,
      window.innerWidth / window.innerHeight,
      CONFIG.CAMERA_NEAR,
      CONFIG.GALLERY_CAMERA_FAR
    );
    this.camera.position.set(
      CONFIG.GALLERY_CAMERA_POSITION.x,
      CONFIG.GALLERY_CAMERA_POSITION.y,
      CONFIG.GALLERY_CAMERA_POSITION.z
    );
  }

  setupLights() {
    this.scene.add(new THREE.AmbientLight(0xffffff, CONFIG.GALLERY_AMBIENT_INTENSITY));

    const galDir = new THREE.DirectionalLight(0xffffff, CONFIG.GALLERY_DIR_INTENSITY);
    galDir.position.set(
      CONFIG.GALLERY_DIR_POSITION.x,
      CONFIG.GALLERY_DIR_POSITION.y,
      CONFIG.GALLERY_DIR_POSITION.z
    );
    this.scene.add(galDir);
  }

  createGeometry() {
    // Floor
    const floorGeo = new THREE.PlaneGeometry(6, 80);
    const floorMat = new THREE.MeshStandardMaterial({
      color: CONFIG.FLOOR_COLOR,
      roughness: 1
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.z = -40;
    this.scene.add(floor);

    // Ceiling
    const ceilGeo = new THREE.PlaneGeometry(6, 80);
    const ceilMat = new THREE.MeshStandardMaterial({
      color: CONFIG.CEIL_COLOR,
      roughness: 1
    });
    const ceil = new THREE.Mesh(ceilGeo, ceilMat);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(0, 3, -40);
    this.scene.add(ceil);

    // Walls
    const wallGeo = new THREE.PlaneGeometry(80, 3);
    const wallMat = new THREE.MeshStandardMaterial({
      color: CONFIG.WALL_COLOR,
      roughness: 1
    });

    const leftWall = new THREE.Mesh(wallGeo, wallMat.clone());
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-3, 1.5, -40);
    this.scene.add(leftWall);

    const rightWall = new THREE.Mesh(wallGeo, wallMat.clone());
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(3, 1.5, -40);
    this.scene.add(rightWall);

    // Load texture and create frames
    const texLoader = new THREE.TextureLoader();
    texLoader.load(
      './assets/01框.jpg',
      (tex01) => {
        tex01.colorSpace = THREE.SRGBColorSpace;
        this.createFrames(tex01);
      },
      undefined,
      (err) => {
        console.warn('图片加载失败:', err);
        this.createFrames(null);
      }
    );
  }

  createFrames(texture) {
    this.works.forEach((w, i) => {
      const fGeo = new THREE.BoxGeometry(
        CONFIG.FRAME_BASE_W * CONFIG.FRAME_BASE_SCALE,
        CONFIG.FRAME_BASE_H * CONFIG.FRAME_BASE_SCALE,
        CONFIG.FRAME_BASE_D
      );

      const mats = [
        new THREE.MeshStandardMaterial({ color: CONFIG.FRAME_COLOR, roughness: CONFIG.FRAME_ROUGHNESS }),
        new THREE.MeshStandardMaterial({ color: CONFIG.FRAME_COLOR, roughness: CONFIG.FRAME_ROUGHNESS }),
        new THREE.MeshStandardMaterial({ color: CONFIG.FRAME_COLOR, roughness: CONFIG.FRAME_ROUGHNESS }),
        new THREE.MeshStandardMaterial({ color: CONFIG.FRAME_COLOR, roughness: CONFIG.FRAME_ROUGHNESS }),
        new THREE.MeshStandardMaterial({
          map: i === 0 ? texture : null,
          roughness: CONFIG.FRAME_ROUGHNESS,
          emissive: CONFIG.FRAME_COLOR,
          emissiveIntensity: CONFIG.FRAME_EMISSIVE_INTENSITY
        }),
        new THREE.MeshStandardMaterial({ color: CONFIG.FRAME_COLOR, roughness: CONFIG.FRAME_ROUGHNESS }),
      ];

      const frame = new THREE.Mesh(fGeo, mats);
      frame.position.set(w.side === 'left' ? -3 : 3, 1.5 + w.yOffset, w.z);
      frame.rotation.z = w.rotZ;
      frame.rotation.y = w.side === 'left' ? Math.PI / 2 : -Math.PI / 2;
      frame.userData = { baseZ: w.z, baseScale: w.scale };
      this.scene.add(frame);
      this.frames.push(frame);
    });
  }

  setupEventListeners() {
    window.addEventListener('wheel', (e) => {
      if (this.isFocusMode) return;
      this.targetZ = Math.max(CONFIG.GALLERY_MIN_Z, Math.min(CONFIG.GALLERY_MAX_Z, this.targetZ - e.deltaY * CONFIG.GALLERY_SCROLL_FACTOR));
    });

    this.galCanvas.addEventListener('click', (e) => {
      if (this.isFocusMode) return;

      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.frames);

      if (intersects.length > 0) {
        const frame = intersects[0].object;
        const workIndex = this.frames.indexOf(frame);
        const work = this.works[workIndex];

        this.enterFocusMode(frame, work, workIndex);
      }
    });

    this.infoBackBtn.addEventListener('click', () => {
      this.exitFocusMode();
    });

    this.infoEnterBtn.addEventListener('click', () => {
      // TODO: 进入深梦页面
      alert('进入作品详情页 - 待实现');
    });
  }

  enterFocusMode(frame, work, workIndex) {
    this.isFocusMode = true;
    this.focusTarget = frame;
    this.originalTargetZ = this.targetZ;

    const camX = 0;
    const camY = 1.5 + work.yOffset;
    const camZ = work.z;
    this.camera.position.set(camX, camY, camZ);
    this.camera.lookAt(work.side === 'left' ? -10 : 10, camY, camZ);

    this.infoTitle.textContent = work.title;
    this.infoDesc.textContent = work.desc;
    this.infoPanel.classList.remove('on-left', 'on-right');
    this.infoPanel.classList.add('on-right');
    this.infoPanel.classList.add('visible');

    this.targetZ = this.camera.position.z;
    this.currentZ = this.camera.position.z;
  }

  exitFocusMode() {
    this.isFocusMode = false;
    this.focusTarget = null;

    this.infoPanel.classList.remove('visible', 'on-left', 'on-right');

    this.targetZ = this.originalTargetZ;
    this.camera.position.set(0, 1.5, this.currentZ);
    this.camera.rotation.set(0, 0, 0);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const t = this.clock.getElapsedTime();

    if (!this.isFocusMode) {
      this.currentZ += (this.targetZ - this.currentZ) * CONFIG.CAMERA_SMOOTH_FACTOR;
    }
    this.camera.position.z = this.currentZ;

    this.frames.forEach((f, i) => {
      f.position.y = 1.5 + Math.sin(t * CONFIG.FLOAT_SPEED + i * CONFIG.FLOAT_PHASE_OFFSET) * CONFIG.FLOAT_AMPLITUDE;
      f.scale.set(f.userData.baseScale, f.userData.baseScale, 1);
    });

    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
}