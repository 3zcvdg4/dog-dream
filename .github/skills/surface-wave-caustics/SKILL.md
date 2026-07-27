---
name: surface-wave-caustics
description: '3D 表面焦散波纹 shader：参数化动态纹理叠加、方向旋转、聚焦态衰减。通用：任何需要水底光影效果的 3D 场景。项目：dogdream 走廊表面波纹。Use when: caustics、焦散、水波纹、surface wave、shader 波纹、动态纹理叠加。'
---

# 3D 表面焦散波纹

一种叠加在 3D 场景材质上的动态纹理效果，模拟光线穿过水面投射到墙壁/地板/天花板上的 caustics（焦散）图案。

---

# 🧩 通用方案

## 效果描述

在场景的基础材质之上叠加一层半透明波纹纹理，纹理持续流动（speed 控制方向/速度）、可旋转方向、可按面（墙/地/天花板）独立调节强度，在特定状态下可自动衰减。

## 通用参数体系

```js
{
  enabled: true,              // 总开关
  mode: 'gradient',           // 'gradient'（双色）| 'single'（单色）

  // 颜色
  singleColor: '#ccf7ff',     // 单色模式用
  gradientStart: '#ffffff',   // 渐变起点
  gradientEnd: '#000000',     // 渐变终点

  // 动态
  speed: -0.25,               // 流速（负=反向）
  scale: 0.2,                 // 纹理缩放（越大越细密）
  intensity: 0.5,             // 对比强度
  opacity: 1.0,               // 整体透明度
  sparse: 0,                  // 稀疏度

  // 方向
  rotationX: 0,               // X/Y/Z 轴旋转波纹方向
  rotationY: 0,
  rotationZ: 0,

  // 距离衰减
  nearBrightness: 2.5,        // 近处亮度
  farBrightness: 0.5,         // 远处亮度

  // 分面增强
  wallBoost: 1.0,             // 墙面增强（>1 加强）
  floorBoost: 1.0,            // 地板增强
  ceilingBoost: 1.0,          // 天花板增强
}
```

## 核心实现思路

1. 用 shader 生成动态噪声/条纹纹理
2. 通过旋转矩阵改变波纹流向
3. 叠加到场景材质的 `map` 或独立 overlay
4. 分面乘不同的 boost 值（天花板通常需要更强）
5. 用 near/far brightness 做距离衰减

## 模式对比

| 模式 | 效果 | 适用场景 |
|------|------|----------|
| `gradient` | 两种颜色渐变混合 | 更自然的水底光影 |
| `single` | 单一颜色 | 更克制的氛围效果 |

## 聚焦/特殊状态衰减

当用户聚焦到某个物体时，波纹应减弱（避免干扰注意力）：
- 透明度 × 0.4~0.5
- 强度 × 0.5~0.6
- 分面 boost 也相应降低

## 设计原则

- 目标效果是 caustics 细丝场（像水底的光网），不是规则平行条纹
- 旋转角度不设成 0°/90° 整数倍，避免方向太整齐
- 天花板 boost 通常略高于墙壁
- 聚焦态衰减到 40%~60%

## 依赖

- 自定义 shader 或支持纹理叠加的材质系统
- 如果需要 `localStorage` 持久化，需要序列化/反序列化

## 踩坑记录

| 问题 | 原因 | 修复 |
|------|------|------|
| 像平行条纹不像水波 | `sin + lineBand` 方向太单一 | 加旋转随机性，或多层不同方向叠加 |
| 压暗了底图 | opacity 太高或颜色太深 | 降低 opacity，用亮色系（白/浅蓝） |
| 远处太亮 | `farBrightness` 太高 | 降到 0.5 以下 |
| 天花板看不到波纹 | `ceilingBoost` 太低 | 提高到 2~2.5 |
| 聚焦态波纹还是抢眼 | 衰减乘数不够小 | 透明度降到 0.3~0.4 |

---

# 🐕 Dogdream 适配

| 项目 | 值 |
|------|-----|
| 组件位置 | `src/pages/DreamCorridor.jsx`（`CorridorGeometry` shader 内） |
| localStorage key | `dogdream:corridor-surface-wave-settings:v4` |
| 调节面板入口 | 走廊内按钮（当前 `SURFACE_WAVE_PANEL_ENTRY_ENABLED = false`） |

## 当前默认值

```js
SURFACE_WAVE_DEFAULTS = {
  enabled: true, mode: 'gradient',
  gradientStart: '#ffffff', gradientEnd: '#000000',
  singleColor: '#ccf7ff',
  speed: -0.25, scale: 0.2, intensity: 0, opacity: 1.17,
  sparse: 0, nearBrightness: 2.5, farBrightness: 0.56,
  floorBoost: 1.98, wallBoost: 1.98, ceilingBoost: 2.44,
  rotationX: 44.26, rotationY: -84.1, rotationZ: -48.69,
}
```

## 聚焦态衰减乘数

```js
FOCUSED_SURFACE_WAVE_OPACITY_MULTIPLIER = 0.42
FOCUSED_SURFACE_WAVE_INTENSITY_MULTIPLIER = 0.55
FOCUSED_SURFACE_WAVE_WALL_BOOST_MULTIPLIER = 0.58
FOCUSED_SURFACE_WAVE_FLOOR_BOOST_MULTIPLIER = 0.74
FOCUSED_SURFACE_WAVE_CEILING_BOOST_MULTIPLIER = 0.82
```

## 修改流程

1. 改 `SURFACE_WAVE_DEFAULTS` 常量调整默认值
2. 改 `FOCUSED_SURFACE_WAVE_*_MULTIPLIER` 调整聚焦态衰减
3. 可用 `applySurfaceWavePreset()` 外部注入预设
4. 清除 localStorage 恢复默认

## 项目专属注意

- 调节面板入口当前被禁用
- 默认/回退/重置以 `DEVELOPMENT_PLAN.md` 为准
- 波纹面板按钮在走廊内，不在首页
