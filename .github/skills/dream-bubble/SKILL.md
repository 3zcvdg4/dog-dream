---
name: dream-bubble
description: 'CSS 梦泡入口按钮：浮现、双圈交替扩散、浮动、hover、破碎退出的多态交互动效。通用：任何需要"呼吸感"入口按钮的项目。项目：dogdream 首页梦泡。Use when: 梦泡、浮动按钮、双圈扩散、呼吸动效、入口按钮动画、bubble animation。'
---

# 梦泡交互动效

一个带"呼吸感"的入口按钮——可见时从透明浮现、idle 态上下浮动 + 双圈交替扩散、hover 有微反馈、点击后破碎退出。

---

# 🧩 通用方案

## 三态模型

| 状态 | 视觉表现 | CSS 触发 |
|------|----------|----------|
| 隐藏 | `opacity: 0`，不可见不可交互 | 默认 |
| 可见+idle | 浮现 + 上下浮动 + 双圈扩散 | `.is-visible` |
| 破碎退出 | 渐隐 + 模糊 + 放大旋转 | `.is-broken` |

## 双圈交替扩散

用两个伪元素 `::before` 和 `::after` 各执行同一个 `@keyframes` 扩散动画，但 `::after` 延迟半个周期：

```css
.element.is-visible::before {
  animation: ringPulse var(--ring-duration) ease-out infinite;
}
.element.is-visible::after {
  animation: ringPulse var(--ring-duration) ease-out infinite;
  animation-delay: calc(var(--ring-duration) * 0.5);
}
```

`@keyframes ringPulse`：0% → scale(1)/opacity(0.6)，100% → scale(2.5)/opacity(0)。环形从中心向外扩散并渐隐。

## 浮动动画

```css
.element.is-visible img {
  animation: float 4.6s ease-in-out infinite;
}
```

`@keyframes float`：上下平移 ±几个像素，营造悬浮感。

## Hover 反馈

```css
.element:hover {
  filter: drop-shadow(0 10px 22px rgba(80,80,74,0.16));
  transform: translateY(-4px) scale(1.03);
}
```

轻微上浮 + 放大 + 柔投影。

## 破碎退出

```css
.element.is-broken {
  opacity: 0;
  filter: blur(9px);
  transform: scale(1.2) rotate(4deg);
}
```

渐隐 + 高斯模糊 + 放大 20% + 微旋转，配合 `transition` 平滑过渡。

## 通用参数

| 参数 | 建议值 | 作用 |
|------|--------|------|
| `--ring-duration` | ~3s | 单圈扩散周期 |
| float-duration | 4~5s | 浮动周期 |
| broken-blur | 8~12px | 破碎模糊量 |
| broken-scale | 1.15~1.25 | 破碎放大比 |
| hover-lift | 3~5px | hover 上浮量 |

## 设计原则

- 双圈错开半周期，避免两圈完全同步（会像一圈）
- 浮动周期不宜太快（会像抖动），4~6s 比较舒服
- 破碎模糊 + 放大旋转比单纯 fadeOut 更有"破碎感"
- 状态间用 `transition` 平滑切换

## 依赖

- 纯 CSS，无 JS 动画库依赖
- 状态切换由 JS 控制 CSS 类名
- 伪元素 `::before`/`::after` 用于扩散光环

## 踩坑记录

| 问题 | 原因 | 修复 |
|------|------|------|
| 双圈看不出交替 | 延迟设错了 | `::after` 延迟 = `--ring-duration * 0.5` |
| 扩散不是从中心向外 | 伪元素未定位到中心 | `top: 50%; left: 50%; transform: translate(-50%, -50%)` |
| 破碎后不消失 | transition 没写或 JS 没移除类 | 确保到默认态有 `transition` |
| 光环盖住了元素内容 | z-index 问题 | 伪元素设 `z-index: -1` 或 `pointer-events: none` |

---

# 🐕 Dogdream 适配

| 项目 | 值 |
|------|-----|
| 组件位置 | `src/pages/Home.jsx`（按钮结构）+ `src/styles/global.css`（动画样式） |
| 图片 | `Dream Bubble-2.png`（宽高比 5254:6102） |
| 状态驱动 | `phase === 'dreamReady'` → 可见；`bubbleBroken` → 破碎 |

## 当前参数值

```css
/* 定位 */
--bubble-top: calc(44% + 130px)
--bubble-left: 39%
--bubble-width: min(30.1%, 350px)

/* 动画 */
bubbleFloat: 4.6s ease-in-out infinite
dreamBubbleRingPulse: CSS @keyframes (scale 1→2.5, opacity 0.6→0)

/* 破碎 */
.is-broken { blur: 9px; scale: 1.2; rotate: 4deg; opacity: 0 }

/* hover */
:hover { translateY: -4px; scale: 1.03; drop-shadow }

/* 锚点（不是中心！） */
anchorX = width * 0.58  // 偏右
anchorY = height * 0.42 // 偏上
```

## 修改流程

1. 改 `@keyframes dreamBubbleRingPulse` 调整扩散效果
2. 改 `--bubble-ring-duration` 控制扩散速度
3. 改 `.is-broken` 样式调整破碎效果
4. 改 `handleEnterDream` 中的锚点比例（0.58/0.42）调整涟漪起点
5. JS 端 `bubbleBroken` 恢复时间（1900ms）需与 CSS transition 匹配

## 项目专属注意

- 梦泡**只在 `phase === 'dreamReady'` 时可点击**
- 破碎态 1900ms 后自动恢复，不要改太短
- 锚点偏移是故意设计，不是 bug
