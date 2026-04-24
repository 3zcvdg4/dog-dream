import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CONFIG } from './config.js';

export class HomeScene {
  constructor() {
    this.dogCanvas = document.getElementById('dog-canvas');
    this.homeScreen = document.getElementById('home-screen');
    this.dreamBubble = document.getElementById('dream-bubble');
    this.loadingHint = document.getElementById('loading-hint');

    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.dogMixer = null;
    this.dogModel = null;
    this.dogBaseY = 0;
    this.clock = new THREE.Clock();

    this.init();
  }

  init() {
    this.setupRenderer();
    this.setupScene();
    this.setupCamera();
    this.setupLights();
    this.loadDogModel();
    this.animate();
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.dogCanvas,
      antialias: true,
      alpha: true
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  setupScene() {
    this.scene = new THREE.Scene();
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      CONFIG.CAMERA_FOV,
      window.innerWidth / window.innerHeight,
      CONFIG.CAMERA_NEAR,
      CONFIG.CAMERA_FAR
    );
    this.camera.position.set(
      CONFIG.CAMERA_POSITION.x,
      CONFIG.CAMERA_POSITION.y,
      CONFIG.CAMERA_POSITION.z
    );
    this.camera.lookAt(0, 0, 0);
  }

  setupLights() {
    this.scene.add(new THREE.AmbientLight(0xffffff, CONFIG.AMBIENT_LIGHT_INTENSITY));

    const dirLight = new THREE.DirectionalLight(0xffffff, CONFIG.DIR_LIGHT_INTENSITY);
    dirLight.position.set(
      CONFIG.DIR_LIGHT_POSITION.x,
      CONFIG.DIR_LIGHT_POSITION.y,
      CONFIG.DIR_LIGHT_POSITION.z
    );
    this.scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, CONFIG.FILL_LIGHT_INTENSITY);
    fillLight.position.set(
      CONFIG.FILL_LIGHT_POSITION.x,
      CONFIG.FILL_LIGHT_POSITION.y,
      CONFIG.FILL_LIGHT_POSITION.z
    );
    this.scene.add(fillLight);
  }

  loadDogModel() {
    const loader = new GLTFLoader();

    loader.load('./assets/puppy.glb', (gltf) => {
      this.dogModel = gltf.scene;

      const box = new THREE.Box3().setFromObject(this.dogModel);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = CONFIG.DOG_SCALE_FACTOR / maxDim;
      const dogScale = scale * 0.7;

      this.dogModel.scale.setScalar(dogScale);
      this.dogModel.position.sub(center.multiplyScalar(scale));
      this.dogModel.position.x = 0;
      this.dogModel.position.y += size.y * scale * 0.5 + CONFIG.DOG_POSITION_Y_OFFSET;
      this.dogBaseY = this.dogModel.position.y;

      this.dogModel.rotation.y = CONFIG.DOG_ROTATION_Y;
      this.dogModel.rotation.z = CONFIG.DOG_ROTATION_Z;

      this.dogModel.traverse(child => {
        if (child.isMesh) {
          if (child.material.map) {
            child.material.color.set(0xffffff);
            child.material.needsUpdate = true;
          } else {
            child.material = new THREE.MeshStandardMaterial({
              color: 0xffffff,
              roughness: 0.9,
              metalness: 0.0,
            });
          }
        }
      });

      this.scene.add(this.dogModel);

      if (gltf.animations && gltf.animations.length > 0) {
        this.dogMixer = new THREE.AnimationMixer(this.dogModel);
        this.dogMixer.clipAction(gltf.animations[0]).play();
      }

      this.loadingHint.classList.add('hidden');
      setTimeout(() => this.dreamBubble.classList.add('visible'), CONFIG.DREAM_BUBBLE_DELAY);

    }, (progress) => {
      if (progress.total > 0) {
        const pct = Math.round(progress.loaded / progress.total * 100);
        this.loadingHint.textContent = 'loading dream... ' + pct + '%';
      }
    }, (err) => {
      console.error('狗狗加载失败:', err);
      this.loadingHint.textContent = 'model load failed';
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    if (this.dogMixer) this.dogMixer.update(delta);
    if (this.dogModel) {
      const breathe = Math.sin(elapsed * CONFIG.DOG_BREATHE_SPEED);
      this.dogModel.position.y = this.dogBaseY + breathe * CONFIG.DOG_BREATHE_AMPLITUDE;
      // 梦泡同步浮动
      this.dreamBubble.style.transform = `translateY(${breathe * CONFIG.BUBBLE_FLOAT_AMPLITUDE}px)`;
    }

    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
}