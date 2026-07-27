---
name: dogdream-animation
description: 'dogdream 动画时序、过渡效果与首页状态机修改。Use when: 动画时序、过渡、ripple、首页流程、梦泡、loading、intro、waking、sleepingAgain、dreamReady、awake、GSAP、DreamTransitionOverlay。'
---

# Dogdream 动画时序与过渡

> **基线原则：没有确认前，不要随意改时间、顺序或过渡模式。**

## 总原则

- 首页梦泡点击后，必须先看到过渡开始，再进入走廊
- 水涟漪效果只用于桌面版梦境入口；不要替换成纯白过渡
- `white-hold` → `revealing` → `idle` 的顺序不要打乱
- 任何动画修改，先本地确认，再发布

## 首页状态机（Home.jsx）

### 阶段流转

```
intro → dreamReady → (点击梦泡) → 走廊
  ↓
waking → awake → (点击睡觉) → sleepingAgain → dreamReady → ...
```

### 阶段含义

| 阶段 | 含义 | 关键行为 |
|------|------|----------|
| `intro` | 首次进入首页 | 播放 intro 视频，关于卡片自动打开 |
| `waking` | 醒来流程 | 梦泡破碎，播放醒来视频 |
| `sleepingAgain` | 再次入睡 | 播放入睡视频 |
| `dreamReady` | 梦泡可见 | 梦泡可点击进入梦境 |
| `awake` | 醒来后 | 显示"睡觉"按钮 |

### 阶段回退时长（`PHASE_FALLBACK_DURATIONS_MS`）

| 阶段 | 时长 |
|------|------|
| `intro` | 5200ms |
| `waking` | 1500ms |
| `sleepingAgain` | 1350ms |

## 首页加载

- `view === 'home'` 且 `homeReady === false` 时，显示加载页
- 预加载完成后，至少再等 `HOME_LOADING_MIN_DURATION_MS = 180ms` 才进入首页
- `homeEntryMode = 'intro'` 时，首页视频使用 intro 流程
- `playbackBlocked` 为真时，视频暂停，梦泡不放行进入

### 预加载资源

- 首页狗狗视频（walk / wakeup / sleep）
- 坐垫 (`Cushion.png`)
- 梦泡图片 (`Dream Bubble-2.png`)
- 关于挂绳卡片贴图

### 视频源

| 用途 | 视频文件 |
|------|----------|
| intro | `walk-ffmpeg-1.webm`（当前用 `walk-ffmpeg-2.webm`） |
| 醒来 | `wakeup-ffmpeg-1.webm` |
| 入睡 | `sleep-ffmpeg-1.webm` |

> **不要**把 `walk-ffmpeg-2.webm`、`4.25.mp4` 或 `视频2` 下其他素材挂进当前播放/回退链路。

## 梦泡交互

- 梦泡只在 `phase === 'dreamReady'` 时可点击
- 点击时调用 `handleEnterDream(event)`，取泡泡中心偏移作为过渡起点
- idle 状态下梦泡外侧持续出现双圈扩散动画

## 转场系统（App.jsx）

### 关键时间常量

| 常量 | 值 | 用途 |
|------|-----|------|
| `DREAM_TRANSITION_WHITE_HOLD_DELAY_MS` | 2760 | 白层保持 |
| `DREAM_TRANSITION_SWITCH_DELAY_MS` | 2920 | 切换时机 |
| `DREAM_TRANSITION_REVEAL_DELAY_MS` | 3040 | 揭示时机 |
| `DREAM_TRANSITION_FINISH_DELAY_MS` | 5050 | 转场完成 |
| `PROJECT_ENTRY_WHITE_HOLD_DELAY_MS` | 560 | 项目进入白层保持 |
| `PROJECT_ENTRY_FINISH_DELAY_MS` | 1960 | 项目进入完成 |
| `CORRIDOR_RETURN_FINISH_DELAY_MS` | 1820 | 返回走廊完成 |

### 转场结构（首页→走廊，桌面版）

```
首页快照层 → Canvas 波纹位移 → 白层覆盖 → 白层退场 → 走廊显示
```

- 转场背景色：`#f7f6f2`
- 组件：`DreamTransitionOverlay.jsx`

## 关于挂绳卡片

- 首次进入首页时，导航栏自动打开"关于"面板
- 不是普通弹窗，是带物理摆动和拉走关闭动画的 3D 挂绳卡片系统
- 在 intro 阶段，如果关于卡片还没关闭，首页视频播放会先被阻塞
- 关闭后才进入正常首页时序
- "关于"已整合 about / now / resume，不需要再补做

## 注意事项

- `DEVELOPMENT_PLAN.md` 已按当前实现重写，以其中描述的时序为准
- 不要将已失效的英文按钮、脚印流程写回文档
- 修改任何动画参数前必须先阅读 `ANIMATION_TIMELINE.md`

## 使用流程

### 修改动画时间时

1. 先读 `ANIMATION_TIMELINE.md` 了解当前基线
2. 找到对应常量（App.jsx 中的 `*_DELAY_MS` 或 Home.jsx 中的 `PHASE_FALLBACK_DURATIONS_MS`）
3. 只改数值，不要打乱 `white-hold → revealing → idle` 顺序
4. `npm run dev` 本地验证完整流程：加载 → intro → 梦泡 → 点击入梦 → 醒来 → 再入睡
5. 桌面版必须保留 ripple 转场，不可改成纯白过渡

### 修改首页阶段逻辑时

1. 理解 5 阶段状态机：`intro → dreamReady → waking → awake → sleepingAgain`
2. 修改 `src/pages/Home.jsx` 中对应阶段的逻辑
3. 确认 `playbackBlocked` 条件在 intro 阶段仍然生效
4. 验证梦泡只在 `dreamReady` 时可点击
5. 验证关于卡片自动打开 → 阻塞视频 → 关闭后放行的流程

### 修改视频源时

1. 视频文件放 `public/assets/` 下
2. 在 Home.jsx 顶部修改 import 路径
3. 同步更新 `HOME_INTRO_VIDEO_SOURCES` / `HOME_WAKE_VIDEO_SOURCES` / `HOME_SLEEP_VIDEO_SOURCES`
4. **不要**混入 `walk-ffmpeg-2.webm`、`4.25.mp4` 或其他素材到回退链路
5. 验证预加载和视频播放正常
