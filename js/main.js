import { HomeScene } from './scene-home.js';
import { GalleryScene } from './scene-gallery.js';
import { Interactions } from './interactions.js';

// 初始化首页场景
const homeScene = new HomeScene();

// 延迟初始化画廊场景（避免 WebGL 上下文影响首页显示）
let galleryScene = null;

// 初始化交互
const interactions = new Interactions(homeScene, galleryScene);

// 在页面加载完成后初始化画廊
window.addEventListener('load', () => {
  // 给首页一些时间稳定显示
  setTimeout(() => {
    galleryScene = new GalleryScene();
    interactions.galleryScene = galleryScene;
    console.log('🎨 GalleryScene initialized (delayed)');
  }, 500);
});

// 启动应用
console.log('A Dog\'s Dream - Video State Machine 已启动');
