import { HomeScene } from './scene-home.js';
import { GalleryScene } from './scene-gallery.js';
import { Interactions } from './interactions.js';

// 初始化场景
const homeScene = new HomeScene();
const galleryScene = new GalleryScene();

// 初始化交互
const interactions = new Interactions(homeScene, galleryScene);

// 启动应用
console.log('A Dog\'s Dream - 个人作品集已启动');