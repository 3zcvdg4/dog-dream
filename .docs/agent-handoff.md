# Agent Handoff — Loading & About 卡片（2026-06-24）

> 给下一个 Agent：先读本文 + `DEVELOPMENT_PLAN.md` 末尾「Loading 与关于卡片」小节，即可接续。

## 已实现功能

### 1. Loading 界面
- 文件：`src/App.jsx`、`src/components/CountUp.jsx`、`src/components/LoadingPercent.jsx`、`src/styles/global.css`（`.home-loading__*`）
- 进度条上方显示 **0–100%** 数字（React Bits CountUp 思路 + `motion` spring）
- 样式：Arial、`font-weight: 700`、深灰 `#8f8c87`、`clamp(94px, 8.5vw, 122px)`、上移 `margin-top: -50px`
- Loading 期间预加载：坐垫、梦泡图、**walk 视频**、关于卡片贴图（`preloadAboutLanyardAssets`）

### 2. 首次进入首页 → 关于卡片
- 每次 **loading 完成进入首页** 都会自动弹出关于卡片（物理掉落动画）
- 首页背景（标题、坐垫）已渲染，卡片叠在上面；**狗狗视频不显示、不播放**
- 关闭卡片（或导航跳走）后 → walk 视频播放 → 播完 → 梦泡按原规则出现
- **仅首次 loading 后的这一次**会阻塞视频/梦泡；之后手动点「关于」不影响播放
- 导航栏 **完全可用**（可跳过卡片）

### 3. 关于卡片（About Lanyard）
- 文件：`src/components/AboutLanyard.jsx`、`src/components/SiteNav.jsx`
- 正面贴图：`public/assets/lanyard/about-intro.jpg`（源文件：项目根目录 `简介.jpg`）
- 当前 URL 常量：`ABOUT_LANYARD_INTRO_URL = '/assets/lanyard/about-intro.jpg?v=4'`（换图后 **递增 `v=`** 破缓存）
- 背面文字：**Gwong**，180px Georgia
- 关闭按钮：恢复 `transform` + `distanceFactor` 自适应；2560×1279 基准上移约 17px（`CLOSE_BUTTON_LIFT_WORLD_AT_REF = 0.085`）；无 box-shadow / 无 backdrop-filter

## 关键状态（App.jsx）
- `homeEntryMode`: `'loading'` → loading 完后 `'intro'`；wake 返回 `'wake'`；浏览器后退 `'resume'`
- `introAboutDismissed`: 首次关于卡片是否已关闭/跳过
- `playbackBlocked={homeEntryMode === 'intro' && !introAboutDismissed}` 传给 `Home`

## 更新简介图片流程
1. 用户替换项目根目录 `简介.jpg`
2. 复制到 `public/assets/lanyard/about-intro.jpg`
3. 在 `AboutLanyard.jsx` 把 `?v=4` 改为 `?v=5`（递增）

```powershell
Copy-Item -LiteralPath "简介.jpg" -Destination "public/assets/lanyard/about-intro.jpg" -Force
```

## 用户已确认的偏好
- Loading 百分比字体与 Loading 标签同族（Arial），但更大更粗；颜色浅灰非纯黑
- 每次 loading 完都弹关于卡片（非 localStorage 一次性）
- 卡片期间狗狗不出现
- 关闭按钮清晰与自适应折中：3D transform + distanceFactor + 实色背景

## 可选后续微调
- Loading 数字字号/位置
- 关闭按钮在 2560×1279 的精确像素（调 `CLOSE_BUTTON_LIFT_WORLD_AT_REF`）
- 简介图换版时记得 bump `?v=`

## 相关依赖
- `motion`（CountUp spring）
- `@react-three/fiber` / `@react-three/drei` / `@react-three/rapier`（About 卡片物理）
