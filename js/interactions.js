import { CONFIG } from './config.js';

export class Interactions {
  constructor(homeScene, galleryScene) {
    this.homeScene = homeScene;
    this.galleryScene = galleryScene;

    this.dreamBubble = document.getElementById('dream-bubble');
    this.wakeBtn = document.getElementById('wake-btn');
    this.sleepBtn = document.getElementById('sleep-btn');
    this.galleryScreen = document.getElementById('gallery-screen');
    this.bubbleShards = document.getElementById('bubble-shards');

    this.galleryInited = false;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // 梦泡点击进入走廊
    this.dreamBubble.addEventListener('click', () => this.enterDream());

    // 醒来按钮
    this.wakeBtn.addEventListener('click', () => this.wakeUp());

    // 睡觉按钮
    this.sleepBtn.addEventListener('click', () => this.goToSleep());

    // 窗口大小改变
    window.addEventListener('resize', () => this.onResize());
  }

  enterDream() {
    this.homeScene.homeScreen.style.opacity = '0';
    this.homeScene.homeScreen.style.pointerEvents = 'none';

    setTimeout(() => {
      this.galleryScreen.classList.add('visible');
      this.wakeBtn.classList.add('visible');
      this.initGallery();
    }, 100);
  }

  wakeUp() {
    this.galleryScreen.classList.remove('visible');
    this.wakeBtn.classList.remove('visible');

    this.homeScene.homeScreen.style.transition = 'opacity 1.4s ease';
    this.homeScene.homeScreen.style.opacity = '1';
    this.homeScene.homeScreen.style.pointerEvents = 'auto';

    setTimeout(() => this.bubbleShatter(), 500);
    setTimeout(() => {
      this.sleepBtn.classList.add('visible');
    }, 500 + 1000);
  }

  goToSleep() {
    this.sleepBtn.classList.remove('visible');
    this.dreamBubble.style.transition = 'opacity 1.5s ease';
    this.dreamBubble.style.opacity = '1';
    this.dreamBubble.style.pointerEvents = 'auto';
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
    this.galleryScene.onResize();
  }
}