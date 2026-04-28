import { CONFIG } from './config.js';

export class Interactions {
  constructor(homeScene, galleryScene) {
    this.homeScene = homeScene;
    this.galleryScene = galleryScene;

    this.dogVideo = document.getElementById('dog-video');
    this.dreamBubble = document.getElementById('dream-bubble');
    this.wakeBtn = document.getElementById('wake-btn');
    this.sleepBtn = document.getElementById('sleep-btn');
    this.behaviorButtons = document.getElementById('behavior-buttons');
    this.dreamScreen = document.getElementById('dream-screen');
    this.galleryScreen = document.getElementById('gallery-screen');
    this.bubbleShards = document.getElementById('bubble-shards');

    this.state = 'initial-play'; // initial-play, dream-page, wakeup-play, interactive, sleeping
    this.galleryInited = false;

    this.setupEventListeners();
    this.initVideo();
  }

  setupEventListeners() {
    // 梦泡点击进入梦境
    this.dreamBubble.addEventListener('click', () => this.enterDream());

    // 醒来按钮
    this.wakeBtn.addEventListener('click', () => this.wakeUp());

    // 睡觉按钮
    this.sleepBtn.addEventListener('click', () => this.goToSleep());

    // 行为按钮
    document.getElementById('sit-btn').addEventListener('click', () => this.playBehavior(0));
    document.getElementById('play-btn').addEventListener('click', () => this.playBehavior(1));
    document.getElementById('eat-btn').addEventListener('click', () => this.playBehavior(2));

    // 窗口大小改变
    window.addEventListener('resize', () => this.onResize());
  }

  initVideo() {
    this.dogVideo.src = CONFIG.VIDEO_INITIAL_SRC;
    this.dogVideo.addEventListener('ended', () => this.onInitialVideoEnd());
    // 首次加载时隐藏 loading 提示
    const onFirstLoad = () => {
      if (this.homeScene.loadingHint) {
        this.homeScene.loadingHint.classList.add('hidden');
      }
      this.dogVideo.play();
      this.dogVideo.removeEventListener('loadeddata', onFirstLoad);
    };
    this.dogVideo.addEventListener('loadeddata', onFirstLoad);
  }

  onInitialVideoEnd() {
    if (this.state === 'initial-play') {
      this.dreamBubble.classList.add('visible');
    }
  }

  enterDream() {
    this.state = 'dream-page';
    this.dreamBubble.classList.remove('visible');

    // 确保 galleryScene 已初始化
    if (!this.galleryScene) {
      // 动态导入并初始化 GalleryScene
      import('./scene-gallery.js').then(({ GalleryScene }) => {
        this.galleryScene = new GalleryScene();
        this.showGallery();
      });
    } else {
      this.showGallery();
    }
  }

  showGallery() {
    // 首页淡出并降低 z-index，让画廊显示在上面
    this.homeScreen.classList.add('fade-out');
    this.homeScreen.style.zIndex = '4';
    this.galleryScreen.classList.add('visible');
    this.galleryScreen.style.zIndex = '10';
    this.wakeBtn.classList.add('visible');
  }

  wakeUp() {
    this.state = 'wakeup-play';
    this.dreamScreen.classList.remove('visible');
    this.wakeBtn.classList.remove('visible');

    // 占位：播放醒来动画（目前用同一视频）
    this.dogVideo.src = CONFIG.VIDEO_WAKEUP_SRC;
    this.dogVideo.addEventListener('ended', () => this.onWakeupVideoEnd(), { once: true });
    this.dogVideo.play();
  }

  onWakeupVideoEnd() {
    this.state = 'interactive';
    this.dogVideo.classList.add('interactive');
    this.behaviorButtons.classList.add('visible');
    this.sleepBtn.classList.add('visible');
  }

  playBehavior(index) {
    if (this.state !== 'interactive') return;

    // 占位：播放行为动画（目前用同一视频）
    this.dogVideo.src = CONFIG.VIDEO_BEHAVIOR_SRCS[index];
    this.dogVideo.addEventListener('ended', () => this.onBehaviorVideoEnd(), { once: true });
    this.dogVideo.play();
  }

  onBehaviorVideoEnd() {
    // 行为视频结束后，保持交互状态
  }

  goToSleep() {
    this.state = 'sleeping';
    this.behaviorButtons.classList.remove('visible');
    this.sleepBtn.classList.remove('visible');
    this.dogVideo.classList.remove('interactive');

    // 占位：播放睡觉动画（目前用同一视频）
    this.dogVideo.src = CONFIG.VIDEO_SLEEP_SRC;
    this.dogVideo.addEventListener('ended', () => this.onSleepVideoEnd(), { once: true });
    this.dogVideo.play();
  }

  onSleepVideoEnd() {
    this.state = 'initial-play';
    this.dogVideo.src = CONFIG.VIDEO_INITIAL_SRC;
    this.dogVideo.addEventListener('ended', () => this.onInitialVideoEnd(), { once: true });
    this.dogVideo.play();
  }

  initGallery() {
    if (this.galleryInited) return;
    this.galleryInited = true;
    // Gallery scene is already initialized in constructor
  }

  bubbleShatter() {
    const bubbleRect = this.dreamBubble.getBoundingClientRect();
    const bubbleCenterX = bubbleRect.left + bubbleRect.width / 2;
    const bubbleCenterY = bubbleRect.top + bubbleRect.height / 2;

    for (let i = 0; i < CONFIG.BUBBLE_SHARD_COUNT; i++) {
      const shard = document.createElement('div');
      shard.className = 'shard';
      shard.style.backgroundImage = "url('./assets/梦泡.png')";

      const size = CONFIG.BUBBLE_SHARD_SIZE_MIN + Math.random() * CONFIG.BUBBLE_SHARD_SIZE_MAX;
      shard.style.width = size + 'px';
      shard.style.height = size + 'px';

      const offsetX = (Math.random() - 0.5) * bubbleRect.width;
      const offsetY = (Math.random() - 0.5) * bubbleRect.height;
      shard.style.left = (bubbleCenterX + offsetX - size / 2) + 'px';
      shard.style.top = (bubbleCenterY + offsetY - size / 2) + 'px';

      shard.style.backgroundPosition = `${(Math.random() * 100)}% ${(Math.random() * 100)}%`;

      const angle = Math.random() * Math.PI * 2;
      const tx = Math.cos(angle) * (CONFIG.BUBBLE_SHARD_FLY_DISTANCE + Math.random() * CONFIG.BUBBLE_SHARD_FLY_DISTANCE_RAND);
      const ty = Math.sin(angle) * (CONFIG.BUBBLE_SHARD_FLY_DISTANCE + Math.random() * CONFIG.BUBBLE_SHARD_FLY_DISTANCE_RAND) - 50;
      const rot = (Math.random() - 0.5) * 720;

      shard.style.setProperty('--tx', tx + 'px');
      shard.style.setProperty('--ty', ty + 'px');
      shard.style.setProperty('--rot', rot + 'deg');
      shard.style.opacity = '0';

      this.bubbleShards.appendChild(shard);

      setTimeout(() => {
        shard.style.transition = 'opacity 0.05s';
        shard.style.opacity = '1';
        shard.style.animation = `shardFly ${CONFIG.SHARD_FLY_DURATION}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`;
      }, 30 + i * 20);

      setTimeout(() => {
        shard.style.opacity = '0';
        setTimeout(() => shard.remove(), 200);
      }, CONFIG.SHARD_REMOVE_DELAY + i * 30);
    }

    this.dreamBubble.style.transition = 'none';
    this.dreamBubble.style.opacity = '0';
    this.dreamBubble.style.pointerEvents = 'none';

    setTimeout(() => {
      this.dreamBubble.style.transition = 'opacity 1.5s ease';
    }, 800);
  }

  onResize() {
    this.homeScene.onResize();
    if (this.galleryScene) {
      this.galleryScene.onResize();
    }
  }
}
