import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
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
    
    // 骨骼动画相关
    this.bones = {};
    this.dogState = 'idle'; // idle, walking, lyingDown, sleeping
    this.animationStartTime = 0;
    this.dogStartX = 4; // 右侧起点
    this.dogTargetX = 0; // 中间目标
    this.dogWalkDuration = 3.5; // 走路耗时（秒）

    this.init();
  }

  init() {
    this.setupRenderer();
    this.setupScene();
    this.setupCamera();
    this.setupLights();
    this.loadDogModel();
    this.animate();
    console.log('🎬 HomeScene initialized');
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
    const loader = new FBXLoader();

    loader.load('./assets/20260424145443_b12751bf.fbx', (fbx) => {
      this.dogModel = fbx;

      const box = new THREE.Box3().setFromObject(this.dogModel);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = CONFIG.DOG_SCALE_FACTOR / maxDim;
      const dogScale = scale * 0.7;

      this.dogModel.scale.setScalar(dogScale);
      this.dogModel.position.sub(center.multiplyScalar(scale));
      this.dogModel.position.x = this.dogStartX; // 从右侧开始
      this.dogModel.position.y += size.y * scale * 0.5 + CONFIG.DOG_POSITION_Y_OFFSET;
      this.dogBaseY = this.dogModel.position.y;

      this.dogModel.rotation.y = CONFIG.DOG_ROTATION_Y;
      this.dogModel.rotation.z = CONFIG.DOG_ROTATION_Z;

      // 遍历模型，收集骨骼和材质
      let boneCount = 0;
      let meshCount = 0;
      this.dogModel.traverse(child => {
        if (child.isBone) {
          // 保存骨骼引用
          const name = child.name.toLowerCase();
          this.bones[name] = child;
          boneCount++;
          console.log('🦴 Found bone:', child.name);
        }
        if (child.isMesh) {
          meshCount++;
          // 处理材质（可能是数组）
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => {
              if (mat && mat.color) {
                mat.color.set(0xffffff);
                mat.needsUpdate = true;
              }
            });
          } else if (child.material) {
            if (child.material.color) {
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
        }
      });
      console.log('✅ Model processed:', boneCount, 'bones,', meshCount, 'meshes');

      this.scene.add(this.dogModel);

      // 动画混合器仍然有用（如果有嵌入的动作）
      if (fbx.animations && fbx.animations.length > 0) {
        console.log('📽️ Found', fbx.animations.length, 'animations');
        this.dogMixer = new THREE.AnimationMixer(this.dogModel);
      }

      // 触发初始动作状态转移
      setTimeout(() => {
        this.dogState = 'walking';
        this.animationStartTime = this.clock.getElapsedTime();
        console.log('🚶 Starting walk animation');
      }, 500);

      this.loadingHint.classList.add('hidden');
      setTimeout(() => this.dreamBubble.classList.add('visible'), CONFIG.DREAM_BUBBLE_DELAY);

    }, (progress) => {
      if (progress.total > 0) {
        const pct = Math.round(progress.loaded / progress.total * 100);
        this.loadingHint.textContent = 'loading dream... ' + pct + '%';
      }
    }, (err) => {
      console.error('❌ 狗狗加载失败:', err);
      this.loadingHint.textContent = 'model load failed';
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    if (this.dogMixer) this.dogMixer.update(delta);
    
    if (this.dogModel) {
      // 处理骨骼动画状态机
      const stateElapsed = elapsed - this.animationStartTime;
      
      if (this.dogState === 'walking') {
        this.updateWalkingAnimation(stateElapsed);
      } else if (this.dogState === 'lyingDown') {
        this.updateLyingDownAnimation(stateElapsed);
      } else if (this.dogState === 'sleeping') {
        this.updateSleepingAnimation(elapsed);
      } else if (this.dogState === 'idle') {
        // 呼吸动画
        const breathe = Math.sin(elapsed * CONFIG.DOG_BREATHE_SPEED);
        this.dogModel.position.y = this.dogBaseY + breathe * CONFIG.DOG_BREATHE_AMPLITUDE;
      }

      // 梦泡同步浮动
      const breathe = Math.sin(elapsed * CONFIG.DOG_BREATHE_SPEED);
      this.dreamBubble.style.transform = `translateY(${breathe * CONFIG.BUBBLE_FLOAT_AMPLITUDE}px)`;
    }

    this.renderer.render(this.scene, this.camera);
  }

  updateWalkingAnimation(elapsed) {
    // 走路阶段
    const walkProgress = Math.min(elapsed / this.dogWalkDuration, 1);
    
    // 沿 X 轴从右侧移到中间
    const newX = this.dogStartX + (this.dogTargetX - this.dogStartX) * walkProgress;
    this.dogModel.position.x = newX;
    
    // 腿部摆动：周期性摆动前后腿
    const legSwing = Math.sin(elapsed * Math.PI * 2 / 0.8) * 0.3; // 0.8秒一个周期
    
    // 脊柱轻微摆动
    const spineSwing = Math.sin(elapsed * Math.PI * 2 / 0.8) * 0.1;
    
    // 尝试更新关键骨骼
    for (const [boneName, bone] of Object.entries(this.bones)) {
      if (boneName.includes('leg') || boneName.includes('hind')) {
        // 后腿摆动
        bone.rotation.x = legSwing;
      } else if (boneName.includes('spine') || boneName.includes('chest')) {
        // 脊柱摆动
        bone.rotation.z = spineSwing;
      }
    }
    
    // 走路结束后进入趴下状态
    if (walkProgress >= 1) {
      this.dogState = 'lyingDown';
      this.animationStartTime = this.clock.getElapsedTime();
    }
  }

  updateLyingDownAnimation(elapsed) {
    // 趴下阶段（2秒内逐渐放低）
    const lyingProgress = Math.min(elapsed / 2.0, 1);
    
    // 垂直位置逐渐下降
    const lyingDownAmount = lyingProgress * 0.8; // 最多下降 0.8 个单位
    this.dogModel.position.y = this.dogBaseY - lyingDownAmount;
    
    // 旋转角度逐渐改变，模拟趴下
    this.dogModel.rotation.x = lyingProgress * 0.3;
    
    // 尝试让骨骼弯曲
    for (const [boneName, bone] of Object.entries(this.bones)) {
      if (boneName.includes('spine') || boneName.includes('chest')) {
        bone.rotation.x = lyingProgress * 0.5;
      } else if (boneName.includes('leg') || boneName.includes('hind')) {
        bone.rotation.x = lyingProgress * 0.8;
      }
    }
    
    // 趴下完成后进入睡眠状态
    if (lyingProgress >= 1) {
      this.dogState = 'sleeping';
    }
  }

  updateSleepingAnimation(elapsed) {
    // 睡眠状态：温和的呼吸+轻微身体摆动
    const breathe = Math.sin(elapsed * CONFIG.DOG_BREATHE_SPEED * 0.5) * 0.01;
    this.dogModel.position.z = breathe;
    
    // 保持趴下姿态
    this.dogModel.rotation.x = 0.3;
  }


  onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
}