---
name: about-lanyard-physics
description: '3D 物理挂绳卡片：Rapier 驱动的悬挂摆动 + 拖拽拉走关闭。通用：任何需要物理挂件的 3D 场景。项目：dogdream 关于卡片。Use when: 悬挂卡片、挂绳、Rapier 物理、rope joint、spherical joint、3D 卡片、拖拽关闭。'
---

# 3D 物理挂绳卡片

用 `@react-three/rapier` 驱动的一个 3D 挂件：卡片被多段绳子悬挂在空中，受重力自然摆动，可以拖拽拉走关闭。

---

# 🧩 通用方案

## 效果描述

一张卡片被绳子挂在固定锚点上。绳子由多段圆柱体 + 关节连接组成，卡片本身是一个 RigidBody。整个系统受重力影响会自然摆动。用户拖拽卡片到一定距离后触发关闭。

## 核心结构

```
        锚点 (固定)
         |
    ┌────┴────┐  ← 绳子：多段圆柱体
    |  RopeJoint  |     段间用 SphericalJoint 连接
    |  SphericalJoint |  允许旋转/摆动
    └────┬────┘
    ┌────┴────┐  ← 卡片：RigidBody（受重力）
    │  内容   │
    └─────────┘
```

- 每段绳子是圆柱体 mesh，段间用 `SphericalJoint` 连接
- 卡片是 `RigidBody`，通过关节与最后一节绳子相连
- 绳子本身不需要 RigidBody，只做视觉跟随

## 通用参数模板

```js
// 物理
gravity = [0, -40, 0]       // 重力向量（y 负方向）
angularDamping = 4           // 角阻尼（越高摆动越快停止）
linearDamping = 4            // 线阻尼
rotationDamping = 0.25       // 额外旋转阻尼

// 绳子
ropeSegments = 3             // 绳子段数
ropeSegmentLength = 1        // 每段长度
ropeRadius = 0.06            // 绳圆柱半径
ropeColor = '#c8c8c8'       // 绳颜色
jointBallRadius = 0.1        // 关节球半径

// 卡片
cardHeight = 3.5             // 卡片高
cardDepth = 0.06             // 卡片厚
anchorY = 6.8                // 锚点高度（世界坐标）

// 拖拽关闭
pullOutSpeed = 22            // 拖拽灵敏度
pullOutDistance = 24         // 超过此距离触发关闭
```

## 设计原则

- 重力设得比真实重力（-9.8）强一些（-40），让摆动更快更有重量感
- 阻尼不宜太小（停不下来），也不宜太大（像粘住）
- 绳子 3~4 段比较自然，太少像棍子，太多增加计算量
- 每个 SphericalJoint 位置应略偏向下一段方向，帮助绳子自然下垂

## 依赖

- `@react-three/rapier`：`Physics`, `RigidBody`, `RopeJoint`, `SphericalJoint`, `BallCollider`, `CuboidCollider`
- `@react-three/fiber`：`Canvas`, `useFrame`
- `@react-three/drei`：`Html`, `useTexture`

## 踩坑记录

| 问题 | 原因 | 修复 |
|------|------|------|
| 绳子不跟随卡片 | 关节约束链断了 | 确保每段绳子通过 `copyTranslation` 从对应 RigidBody 读取位置 |
| 卡片疯狂旋转 | 角阻尼太小 | 增大 `angularDamping` 到 4+ |
| 拖拽感应太迟钝 | `pullOutDistance` 太大 | 减小到 15~25 |
| 绳子穿透卡片 | 关节球半径太小或段间距不对 | 检查 `ropeSegmentLength` 和 `jointBallRadius` |

---

# 🐕 Dogdream 适配

| 项目 | 值 |
|------|-----|
| 组件文件 | `src/components/AboutLanyard.jsx` |
| 绳子材质 | `meshBasicMaterial`（纯圆柱体，不用 meshline） |
| 卡片正面 | `简介.jpg`（通过 `?url` import） |
| 卡片背面 | Canvas 黑底白字 "Gwong" |
| 预加载 | `preloadAboutLanyardAssets()` 在 App.jsx 中调用 |

## 当前参数值

```js
PHYSICS_GRAVITY = [0, -40, 0]
PHYSICS_ANGULAR_DAMPING = 4
PHYSICS_LINEAR_DAMPING = 4
CARD_ROTATION_DAMPING = 0.25
CARD_DROP_VELOCITY_Y = -10

ROPE_SEGMENT_LENGTH = 1
ROPE_JOINT_POSITIONS = [[0.5,0,0], [1,0,0], [1.5,0,0]]
ROPE_BALL_RADIUS = 0.1
ROPE_RADIUS = 0.058
ROPE_COLOR = '#c8c8c8'

CARD_HEIGHT = 3.5
CARD_DEPTH = 0.06
CARD_START_X = 2
ANCHOR_Y = 6.8

PULL_OUT_SPEED = 22
PULL_OUT_DISTANCE = 24

CAMERA_POSITION = [-0, 2, 11.8]
CAMERA_LOOK_AT = [0, 1.3, 0]
CAMERA_FOV = 26

// 关闭按钮自适应间距
// ≤560→1.85, ≤760→2.1, ≤980→2.35, >980→2.6
```

## 修改流程

1. 改 `createBackTexture()` 修改卡片背面文字/样式
2. 改物理参数调整摆动手感
3. 改 `PULL_OUT_SPEED`/`PULL_OUT_DISTANCE` 调整拖拽灵敏度
4. 替换 `简介.jpg` 更新卡片正面内容

## 项目专属注意

- 卡片在 intro 阶段自动打开，关闭后才放行视频播放
- about / now / resume 已整合，不需要额外页面
- `preloadAboutLanyardAssets()` 需在预加载阶段调用
