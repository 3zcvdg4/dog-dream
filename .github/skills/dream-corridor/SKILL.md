---
name: dream-corridor
description: '梦境走廊 3D 场景开发与调试：聚焦态、灯光、烟雾、表面波纹、画框定位。Use when: DreamCorridor、走廊、聚焦、画框、FramePortal、灯光调试、烟雾、表面波纹、caustics、走廊白屏、WebGL context。'
---

# 梦境走廊 3D 场景开发与调试

## 核心文件

| 文件 | 职责 |
|------|------|
| `src/pages/DreamCorridor.jsx` | 走廊主场景、漫游、聚焦态、灯光、烟雾、表面波纹 |
| `src/components/FramePortal.jsx` | 走廊画框/海报展示与交互入口 |
| `src/components/SteamField.jsx` | 烟雾/雾气氛围层 |

## 关键常量速查（DreamCorridor.jsx）

### 走廊尺寸
- `LOOP_LENGTH = 33` — 走廊循环长度
- `WALL_X = 3.25` — 墙壁 X 位置
- `CORRIDOR_HEIGHT = 3.6` — 走廊高度
- `FRAME_WIDTH = 1.22` / `FRAME_HEIGHT = 1.68` — 画框尺寸
- `LEFT_FRAME_Y = 1.76` / `RIGHT_FRAME_Y = 1.9` — 左右画框 Y 位置

### 相机与滚动
- `CAMERA_FOV = 50`
- `WHEEL_SCROLL_FACTOR = 0.014`
- `TOUCH_SCROLL_FACTOR = 0.026`
- `CAMERA_Z_LERP = 0.22` / `CAMERA_XY_LERP = 0.18`

### 聚焦态相关
- `FOCUSED_FRAME_WALL_OUTSET = 0.34` — 聚焦画框突出量
- `FOCUS_COPY_REVEAL_DELAY_MS = 80` — 聚焦卡片显示延迟

## 聚焦态调试开关

### 聚焦态灯光调试
```js
const FOCUSED_LIGHT_DEBUG_DEFAULTS = {
  key: true,      // 主光
  rim: true,      // 轮廓光
  topFill: true,  // 顶部补光
  backRim: true,  // 背轮廓光
};
```

### 排查"后层流光穿帮"
修改 `FOCUSED_LIGHT_DEBUG_DEFAULTS`（第 19 行），将 `backRim` 设为 `false`：
```js
const FOCUSED_LIGHT_DEBUG_DEFAULTS = {
  key: true,
  rim: true,
  topFill: true,
  backRim: false,  // 临时关闭背轮廓灯
};
```
实际渲染由 `lightDebug.backRim` 控制（第 2351 行），关闭后背轮廓灯不渲染。

### 排查"水波纹层穿插感"
在 `effectiveWaveSettings`（第 2558 行 `useMemo`）的 `focusedProject` 分支里，将 `opacity` 和 `intensity` 乘数临时改为 `0`：
```js
return {
  ...waveSettings,
  opacity: 0,        // 临时归零
  intensity: 0,       // 临时归零
  // ...
};
```

### 关水波纹后仍有"插进去"感
继续将 `FOCUSED_LIGHT_DEBUG_DEFAULTS.backRim` 设为 `false`，排查背轮廓灯是否参与造成错觉。

### 聚焦态水波纹乘数常量
| 常量 | 值 | 作用 |
|------|-----|------|
| `FOCUSED_SURFACE_WAVE_OPACITY_MULTIPLIER` | 0.42 | 聚焦态水波透明度 |
| `FOCUSED_SURFACE_WAVE_INTENSITY_MULTIPLIER` | 0.55 | 聚焦态水波强度 |
| `FOCUSED_SURFACE_WAVE_WALL_BOOST_MULTIPLIER` | 0.58 | 墙壁水波增强 |
| `FOCUSED_SURFACE_WAVE_FLOOR_BOOST_MULTIPLIER` | 0.74 | 地板水波增强 |
| `FOCUSED_SURFACE_WAVE_CEILING_BOOST_MULTIPLIER` | 0.82 | 天花板水波增强 |

## 表面波纹（Surface Wave）基准

- 已知问题：`sin + lineBand` 规则条纹容易偏成重复平行线
- 正确方向：caustics/焦散细丝场效果，避免压暗底图
- 当前实现仅存在于 `src/pages/DreamCorridor.jsx`，备份中没有完整叠层实现
- 默认/回退/重置参数以 `DEVELOPMENT_PLAN.md` 为准

## 烟雾调试

- 烟雾调节按钮在走廊内，不是首页入口
- 波纹调节面板按钮也在走廊内
- 用户提到这两个按钮时，默认按走廊里的入口理解

## 桌面端聚焦画框横移

- 使用 `getDesktopFocusViewOffsetX(viewportWidth)` + `camera.setViewOffset(...)`
- 只改投影构图，不移动相机位置，不改变 `lookAt`
- 退出聚焦必须 `clearViewOffset()`
- 方向使用正值（负值会反向）

## 走廊白屏排查

- 确认与 `React.StrictMode` 相关
- 已从 `src/main.jsx` 移除 StrictMode 包裹后，WebGL context 不再 lost
- 当前 main.jsx 直接用 `<App />` 渲染，不包裹 StrictMode

## 贴图资源

```js
const DREAM_CORRIDOR_TEXTURES = [
  '/assets/corridor-ceiling.png',
  '/assets/corridor-floor.png',
  '/assets/corridor-left-wall.png',
  '/assets/corridor-right-wall.png',
];
```

## 使用流程

### 调试走廊视觉效果时

1. 先确认问题属于哪个层：灯光、烟雾、水波纹、画框定位
2. 对照上方常量速查表找到相关参数
3. 用调试开关（`FOCUSED_LIGHT_DEBUG_DEFAULTS`、`effectiveWaveSettings` 乘数归零）隔离问题层
4. 每次只改一个变量，本地验证后再改下一个
5. 确认修复后，恢复所有临时调试改动

### 修改走廊参数时

1. 找到 `DreamCorridor.jsx` 中对应的 `const` 声明
2. 修改数值
3. `npm run dev` 验证效果
4. 检查聚焦态和非聚焦态两种模式
5. 检查桌面端和移动端（如果涉及滚动/触摸参数）

### 走廊白屏时

1. 检查浏览器 Console 是否有 WebGL 错误
2. 确认 `src/main.jsx` 没有包裹 `React.StrictMode`
3. 检查贴图资源路径是否正确
4. 检查 `npm run build` 是否通过

## 注意事项

- 走廊没有使用 React Router，路由由 App.jsx 手动管理
- 桌面版梦泡进入走廊必须保留 ripple 转场，不能擅自改成纯白过渡
- "狗脚印"相关代码为历史残留，不是当前功能
- 背轮廓灯没有独立的 `ENABLED` 开关常量，通过 `lightDebug.backRim` 控制
