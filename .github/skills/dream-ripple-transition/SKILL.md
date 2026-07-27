---
name: dream-ripple-transition
description: 'Canvas 涟漪波纹转场：多层波纹扩散 + 白层覆盖的页面过渡效果。通用：任何需要"水波荡漾式"场景切换的项目。项目：dogdream 首页→走廊转场。Use when: 涟漪转场、ripple transition、DreamTransitionOverlay、波纹位移、canvas ripple、转场动画、页面过渡效果。'
---

# Canvas 涟漪波纹转场

一种从 A 页面到 B 页面的过渡效果：对 A 页截图 → 多层同心圆波纹在截图上做像素位移 → 白层从中心向外覆盖 → 切换到 B 页面。

---

# 🧩 通用方案

## 效果描述

点击某个起点后，从该点向外扩散 4 层错开的环形波纹。波纹经过的地方像素被推开/拉回，同时伴随淡白光晕。随后白层从中心蔓延覆盖整个画面，完成场景切换。

## 核心算法

### 1. 波纹扩散进度

```js
progress = clamp((elapsedMs - layer.delayMs) / spreadDuration, 0, 1)
radiusProgress = clamp(progress * speedMultiplier, 0, 1)
radius = maxRadius * easeOutCubic(radiusProgress)
```

每层有一个 `delayMs`（错开启动）和 `speedMultiplier`（控制波速）。

### 2. 像素位移

```js
delta = distance - ripple.radius  // 像素到波纹圆心的距离与波纹半径的差

if (delta < -trailWidth || delta > frontWidth) → 0  // 范围外，不动

if (delta <= 0):  // 尾迹区（波的外侧）
  t = abs(delta) / trailWidth
  displacement = pushStrength * cos²(t * π/2)  // 向外推

if (delta > 0):   // 前缘区（波的内侧）
  t = delta / frontWidth
  displacement = -pullStrength * cos²(t * π/2) // 向内拉
```

尾迹区像素被向外推（push），前缘区像素被向内拉（pull），形成波纹的"隆起-凹陷"感。

### 3. 分块采样（性能优化）

不在全画布逐像素计算，而是分块（tile）：
- 只在波纹覆盖的矩形区域（`minX/maxX/minY/maxY`）内遍历
- 每块 tile × tile 像素，用块中心点的位移量整块平移
- tile 太小 → 性能差，太大 → 像素化，经验值 6px

### 4. 光晕

```
径向渐变：透明 → 淡白(glowAlpha×0.2) → 亮白(glowAlpha) → 透明
```
在波纹位置画一圈径向渐变，增强波纹可见度。

### 5. 白层覆盖

白层从波纹中心以径向渐变向外蔓延：
```js
fillProgress = clamp((elapsedMs - whiteFillStartMs) / whiteFillDuration, 0, 1)
opacity = easeInOutSine(fillProgress)
```

## 通用参数模板

```js
// 单层波纹定义
{
  delayMs: 0,          // 延迟启动（毫秒），不同层错开
  frontWidth: 120,     // 前缘宽度（波内侧影响范围）
  trailWidth: 200,     // 尾迹宽度（波外侧影响范围）
  pushStrength: 20,    // 向外推力（尾迹区）
  pullStrength: 8,     // 向内拉力（前缘区）
  glowAlpha: 0.15,     // 光晕透明度
  speedMultiplier: 0.8,// 波速倍率（<1 慢波，=1 正常）
}

// 全局参数
spreadDuration = 5000   // 单层总扩散时长（毫秒）
tileSize = 6            // 分块采样尺寸（像素）
whiteFillStart = 120    // 白层开始延迟
whiteFillDuration = 2500 // 白层蔓延时长
```

## 设计原则

- 4 层左右，每层 `delayMs` 递增 700~800ms，形成一波接一波
- 前几层用慢波（speedMultiplier < 1）打底，最后一层正常速度收尾
- pushStrength 逐层递减（第一波最强），pullStrength 约为 push 的 40%
- 白层不能太早（会盖住波纹），也不能太晚（转场拖沓）

## 依赖

- 需要源页面的 Canvas 截图（可用 `html2canvas` 或手动 `drawImage`）
- 需要页面切换机制（路由切换或组件卸载/挂载）
- 缓动函数：`easeOutCubic`（波纹扩散）、`easeInOutSine`（白层覆盖）

## 踩坑记录

| 问题 | 原因 | 修复 |
|------|------|------|
| 像素化严重 | tileSize 太大 | 减小到 4~8 |
| 性能卡顿 | tileSize 太小或遍历范围太大 | 增大 tileSize，收紧 minX/maxX 范围 |
| 波纹看不出 | glowAlpha 太低或 pushStrength 太低 | 先调 glowAlpha 到 0.3 确认可见 |
| 白层出现太早 | whiteFillStart 太小 | 增大，至少等第一层波纹扩散过半 |

---

# 🐕 Dogdream 适配

| 项目 | 值 |
|------|-----|
| 组件文件 | `src/components/DreamTransitionOverlay.jsx` |
| 转场背景色 | `#f7f6f2` |
| 快照来源 | `html2canvas` 对首页 DOM（`homeSceneCaptureRef`）截图 |
| 波纹起点 | 梦泡的视觉重心偏移（宽 × 0.58, 高 × 0.42） |
| 关联常量 | App.jsx 中 `DREAM_TRANSITION_*_MS` 系列 |

## 当前参数值

```js
RIPPLE_TILE_SIZE = 6
RIPPLE_SPREAD_DURATION_MS = 5080
DEFAULT_WHITE_FILL_START_MS = 120
DEFAULT_WHITE_FILL_DURATION_MS = 2550
```

| 参数 | L1 | L2 | L3 | L4 |
|------|----|----|----|-----|
| delayMs | 0 | 760 | 1480 | 2440 |
| frontWidth | 128 | 118 | 108 | 102 |
| trailWidth | 224 | 208 | 186 | 174 |
| pushStrength | 24 | 20.5 | 18 | 14 |
| pullStrength | 9.2 | 8.2 | 7.8 | 6.4 |
| glowAlpha | 0.16 | 0.14 | 0.12 | 0.10 |
| speedMultiplier | 0.72 | 0.84 | 0.94 | 1 |

## 修改流程

1. 改 `RIPPLE_LAYERS` 数组中的参数
2. 改全局参数 `DEFAULT_WHITE_FILL_START_MS` / `DEFAULT_WHITE_FILL_DURATION_MS`
3. `npm run dev` 验证从首页点击梦泡进入走廊的完整转场

## 项目专属注意

- 桌面版**必须保留 ripple**，不可换成纯白过渡
- 与 App.jsx 中 `DREAM_TRANSITION_*` 时间常量联动，改一边要同步检查另一边
