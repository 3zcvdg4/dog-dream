import { CONFIG } from './config.js';

export class HomeScene {
  constructor() {
    this.dogCanvas = document.getElementById('dog-canvas');
    this.video = document.getElementById('dog-video');
    this.homeScreen = document.getElementById('home-screen');
    this.dreamBubble = document.getElementById('dream-bubble');
    this.loadingHint = document.getElementById('loading-hint');

    // 色度抠图相关
    this.ctx = null;
    this.bgColor = null;       // 自动检测的背景色
    this.bgColorDetected = false;
    this.videoReady = false;

    // 视频宽高比
    this.videoAspectRatio = 1;

    // 梦泡浮动
    this.clock = 0;

    this.init();
  }

  init() {
    this.setupCanvas();
    this.detectBgColor();
    this.animate();
    console.log('🎬 HomeScene initialized (video chroma key mode)');
  }

  setupCanvas() {
    // 设置 canvas 尺寸与视频区域匹配
    this.dogCanvas.width = 420;
    this.dogCanvas.height = 420;
    this.ctx = this.dogCanvas.getContext('2d', { willReadFrequently: true });
  }

  detectBgColor() {
    // 等待视频加载后自动检测背景色
    const tryDetect = () => {
      if (this.video.readyState >= 2 && this.video.videoWidth > 0) {
        // 记录视频原始宽高比
        this.videoAspectRatio = this.video.videoWidth / this.video.videoHeight;

        // 创建一个临时 canvas 采样视频像素
        const vw = this.video.videoWidth;
        const vh = this.video.videoHeight;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = vw;
        tempCanvas.height = vh;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(this.video, 0, 0, vw, vh);

        // 采样多个边缘点，取平均值作为背景色
        const samplePoints = [
          // 四角
          { x: 0, y: 0 },
          { x: vw - 1, y: 0 },
          { x: 0, y: vh - 1 },
          { x: vw - 1, y: vh - 1 },
          // 四边中点
          { x: Math.floor(vw / 2), y: 0 },
          { x: Math.floor(vw / 2), y: vh - 1 },
          { x: 0, y: Math.floor(vh / 2) },
          { x: vw - 1, y: Math.floor(vh / 2) },
        ];

        let r = 0, g = 0, b = 0;
        samplePoints.forEach(p => {
          const pixel = tempCtx.getImageData(p.x, p.y, 1, 1).data;
          r += pixel[0];
          g += pixel[1];
          b += pixel[2];
        });
        r = Math.round(r / samplePoints.length);
        g = Math.round(g / samplePoints.length);
        b = Math.round(b / samplePoints.length);

        this.bgColor = { r, g, b };
        this.bgColorDetected = true;
        this.videoReady = true;
        console.log(`🎨 检测到背景色: RGB(${r}, ${g}, ${b})`);
      } else {
        setTimeout(tryDetect, 200);
      }
    };
    tryDetect();
  }

  /**
   * 判断像素是否在排除区域内
   */
  isInExcludeZone(x, y) {
    const zones = CONFIG.CHROMA_KEY_EXCLUDE_ZONES || [];
    for (const zone of zones) {
      if (x >= zone.x && x < zone.x + zone.w &&
          y >= zone.y && y < zone.y + zone.h) {
        return true;
      }
    }
    return false;
  }

  chromaKeyFrame() {
    if (!this.ctx || !this.videoReady || !this.video.videoWidth) return;

    const cw = this.dogCanvas.width;
    const ch = this.dogCanvas.height;

    // 清空 canvas（透明）
    this.ctx.clearRect(0, 0, cw, ch);

    // 保持视频宽高比绘制（contain 模式：完整显示视频内容，留白区域透明）
    const videoAspect = this.videoAspectRatio;
    const canvasAspect = cw / ch;

    let dx, dy, dw, dh;
    if (videoAspect > canvasAspect) {
      // 视频更宽：按宽度适配，上下留白
      dw = cw;
      dh = cw / videoAspect;
      dx = 0;
      dy = (ch - dh) / 2;
    } else {
      // 视频更高：按高度适配，左右留白
      dh = ch;
      dw = ch * videoAspect;
      dx = (cw - dw) / 2;
      dy = 0;
    }

    // 步骤1: 先将视频帧绘制到 canvas
    this.ctx.drawImage(this.video, 0, 0, this.video.videoWidth, this.video.videoHeight, dx, dy, dw, dh);

    // 步骤2: 获取像素数据，创建 alpha 蒙版
    const imageData = this.ctx.getImageData(0, 0, cw, ch);
    const data = imageData.data;

    const bg = this.bgColor;
    const tolerance = CONFIG.CHROMA_KEY_TOLERANCE;

    // 创建一个 alpha 蒙版：背景像素设为透明，非背景像素保持不透明
    for (let i = 0; i < data.length; i += 4) {
      const px = (i / 4) % cw;
      const py = Math.floor(i / 4 / cw);

      // 如果在排除区域内（如狗狗眼睛），跳过抠图
      if (this.isInExcludeZone(px, py)) {
        continue;
      }

      const dr = data[i] - bg.r;
      const dg = data[i + 1] - bg.g;
      const db = data[i + 2] - bg.b;
      const dist = Math.sqrt(dr * dr + dg * dg + db * db);

      if (dist < tolerance) {
        // 背景像素：完全透明
        data[i + 3] = 0;
      } else if (dist < tolerance + 20) {
        // 边缘过渡：半透明平滑
        const alpha = (dist - tolerance) / 20;
        data[i + 3] = Math.round(alpha * 255);
      }
      // 其他像素保持不透明
    }

    // 步骤3: 将修改后的像素数据放回 canvas
    this.ctx.putImageData(imageData, 0, 0);

    // 调试模式：绘制排除区域边界
    if (CONFIG.CHROMA_KEY_DEBUG) {
      const zones = CONFIG.CHROMA_KEY_EXCLUDE_ZONES || [];
      this.ctx.strokeStyle = 'red';
      this.ctx.lineWidth = 2;
      zones.forEach(zone => {
        this.ctx.strokeRect(zone.x, zone.y, zone.w, zone.h);
      });
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const elapsed = performance.now() / 1000;

    // 如果视频还没准备好，尝试检测背景色
    if (!this.bgColorDetected && this.video.readyState >= 2) {
      this.detectBgColor();
    }

    // 执行色度抠图
    if (this.videoReady && this.video.readyState >= 2 && !this.video.paused) {
      this.chromaKeyFrame();
    }

    // 梦泡浮动
    if (this.dreamBubble) {
      const breathe = Math.sin(elapsed * CONFIG.DOG_BREATHE_SPEED);
      this.dreamBubble.style.transform = `translateY(${breathe * CONFIG.BUBBLE_FLOAT_AMPLITUDE}px)`;
    }
  }

  onResize() {
    // 视频 canvas 尺寸固定，不需要响应缩放
  }
}
