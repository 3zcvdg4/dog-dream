---
name: frame-portal-glass
description: 'Three.js 琉璃画框渲染：MeshPhysicalMaterial 玻璃参数配方、双层边框层次、Canvas 内阴影/透光纹理、鼠标跟随倾斜。通用：任何需要玻璃/水晶材质的 3D 场景。项目：dogdream 走廊画框。Use when: 琉璃材质、glass material、MeshPhysicalMaterial、画框渲染、玻璃参数、内阴影纹理。'
---

# Three.js 琉璃画框渲染

用 `MeshPhysicalMaterial` 实现的双层琉璃画框——外框通透、内框略实、海报嵌入带内缘阴影、hover 鼠标跟随倾斜。

---

# 🧩 通用方案

## 层次结构

```
外框（ExtrudeGeometry + 倒角）
  └─ 内框（略薄的第二圈，独立材质）
      └─ 海报面（平面贴图）
          ├─ 内缘阴影层（Canvas 程序化纹理）
          └─ 透光高光层（Canvas 程序化纹理）
```

## 琉璃玻璃材质配方

使用 `MeshPhysicalMaterial` (Three.js)：

```js
{
  roughness: 0.1,            // 低粗糙度 → 光滑玻璃
  metalness: 0,              // 低金属度 → 非金属
  transmission: 0.94,        // 高透射 → 水晶透亮感
  thickness: 0.4,            // 材质厚度（非几何厚度）
  ior: 1.22,                 // 折射率（1.2~1.5 模拟玻璃）
  reflectivity: 0.85,        // 反射强度
  envMapIntensity: 1.15,     // 环境反射
  clearcoat: 1,              // 清漆层（外层高光）
  clearcoatRoughness: 0.08,  // 清漆粗糙度
  specularIntensity: 1,
  specularColor: '#f8fddc',  // 暖白高光
  attenuationColor: '#e9f7ff',    // 厚边浅蓝
  attenuationDistance: 1.6,       // 衰减距离
  iridescence: 0.18,              // 珠光强度
  iridescenceIOR: 1.18,           // 珠光折射率
  emissiveIntensity: 0.08,
}
```

## 双层边框技巧

| 层 | 特点 | 效果 |
|----|------|------|
| 外框 | 高透射 + 厚 | 通透的琉璃主体 |
| 内框 | 略实(opacity↑) + 薄 + 后退 | 形成第二圈轮廓，增加层次 |

内框几何体比外框略小，且 z 略后退（不与外框齐平）。

## 海报内缘阴影（Canvas 纹理）

不用图片，用 Canvas 程序化生成 384×384 灰度图：四个边缘向内渐变暗色（模拟框唇阴影），靠光侧重、背光侧轻，中间透明。贴到海报上方的 overlay 平面（`depthWrite: false`）。

## 海报透光高光

同理生成偏暖白的高光纹理，贴在内缘阴影层上方，模拟玻璃边缘折射柔光。

## Hover 鼠标跟随倾斜

```js
// 每帧计算
targetRotation.x = mouseY * aimY
targetRotation.z = -mouseX * tiltZ

// 平滑插值
rotation += (target - rotation) * lerp  // 跟手
rotation += (0 - rotation) * returnLerp // 回正（更慢 → 惯性）
```

| 参数 | 建议值 | 作用 |
|------|--------|------|
| aimX/aimY | 0.3 | 跟手幅度 |
| tiltZ | 1°~2° | Z 轴倾斜角 |
| rotationLerp | 0.1~0.15 | 跟手灵敏度 |
| returnLerp | 0.02~0.04 | 回正速度（越小越有惯性） |

## 依赖

- Three.js `MeshPhysicalMaterial`（需 `transmission` 支持）
- `ExtrudeGeometry` + 倒角参数
- Canvas 2D API 生成纹理

## 踩坑记录

| 问题 | 原因 | 修复 |
|------|------|------|
| 玻璃像塑料 | `transmission` 太低或 `roughness` 太高 | transmission > 0.9, roughness < 0.15 |
| 高光刺眼 | `clearcoat` 太高 + `clearcoatRoughness` 太低 | clearcoat < 0.2 或 clearcoatRoughness > 0.05 |
| 珠光彩虹太假 | `iridescence` 太高 | 0.1~0.2 较自然 |
| 阴影层闪烁 | overlay 平面与海报 z-fighting | overlay z 偏移 > 0.001 |
| hover 抖动 | lerp 值太大 | 跟手 0.1~0.15，回正 0.02~0.04 |
| 框角生硬 | 没开倒角 | ExtrudeGeometry bevel enabled |

---

# 🐕 Dogdream 适配

| 项目 | 值 |
|------|-----|
| 组件文件 | `src/components/FramePortal.jsx` |
| 画框尺寸 | `FRAME_WIDTH = 1.22` / `FRAME_HEIGHT = 1.68`（DreamCorridor.jsx） |
| 边框底色 | `#0010a1`（深蓝琉璃底） |

## 当前参数值（关键）

```js
// 外框玻璃
FRAME_GLASS_TRANSMISSION = 0.94
FRAME_GLASS_IOR = 1.22
FRAME_GLASS_ROUGHNESS = 0.1
FRAME_GLASS_CLEARCOAT = 1
FRAME_GLASS_IRIDESCENCE = 0.18

// 内框（比外框略实）
INNER_FRAME_GLASS_OPACITY = 0.24
INNER_FRAME_GLASS_ROUGHNESS = 0.05

// 海报内影（四方向不均，模拟斜上方来光）
POSTER_INNER_SHADOW_OPACITY = 0.2
POSTER_INNER_SHADOW_EDGE_WIDTH = 0.055
POSTER_INNER_SHADOW_EDGE_SOFTNESS = 0.16
LIGHT_SIDE = 0.3 / OPPOSITE = 0.05 / TOP = 0.3 / BOTTOM = 0.01

// 透光高光
POSTER_GLASS_HIGHLIGHT_OPACITY = 0.05
POSTER_GLASS_HIGHLIGHT_COLOR = 'rgb(253, 240, 255)'

// hover 倾斜
FOCUS_HOVER_AIM_X = 0.31
FOCUS_HOVER_AIM_Y = 0.3
FOCUS_HOVER_TILT_Z = degToRad(1.8)
FOCUS_HOVER_ROTATION_LERP = 0.12
FOCUS_HOVER_ROTATION_RETURN_LERP = 0.038
```

## 修改流程

1. 改 `FRAME_GLASS_*` 系列调整琉璃外观
2. 改 `POSTER_INNER_SHADOW_*` 调整嵌入感
3. 改 `FOCUS_HOVER_*` 调整 hover 跟手/回正
4. 改 `createOverlayTexture(drawPixel)` 调整阴影/高光形状

## 项目专属注意

- 阴影和高光用 Canvas 程序化生成，不是外部图片
- hover 仅在聚焦态下生效，漫游态无
- `FRAME_*` 常量集中在 `FramePortal.jsx` 顶部
