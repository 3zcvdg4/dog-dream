# DEVELOPMENT_PLAN.md

## 项目定位

这是一个以“狗狗做梦”为核心叙事的个人作品网站。它既作为平面品牌设计师的个人简历和作品集，也要表达个人审美：不是传统模板式简历页，而是通过首页入梦、梦境走廊、画框作品入口和深梦项目页形成一套完整体验。

当前技术栈：Vite + React + Three.js。

## 当前素材

- `walk-ffmpeg-2.webm`：当前首页狗狗视频。
- `wakeup-ffmpeg-1.webm`：点击 `wake up` 返回首页时播放的狗狗醒来视频。
- `sleep-ffmpeg-1.webm`：点击 `sleep` 按钮后播放的狗狗重新入睡视频。
- `walk-ffmpeg-1.webm`：上一版首页狗狗视频备用素材。
- `4.25.mp4`：旧版首页狗狗视频备用素材。
- `Background.jpg`：背景/走廊参考素材。
- `Cushion.png`：首页坐垫素材。
- `Dream Bubble.png`：首页梦泡素材。
- `word.png`：首页标题文字素材。
- `public/assets/01框.jpg`：左侧第一个画框贴图和第一个项目详情封面。

说明：`01框.jpg` 已从 `dist/assets/01框.jpg` 复制到 `public/assets/01框.jpg`。后续素材请优先放入 `public/assets`，不要只放在 `dist/assets`，因为 `dist` 是构建产物，重新构建时可能被覆盖。

## 体验流程

1. 首页是全屏白色画布，接近参考图一的构图。
2. 首页包含顶部标题 `word.png`、中部水平线、梦泡 `Dream Bubble.png`、坐垫 `Cushion.png` 和狗狗视频 `walk-ffmpeg-2.webm`。
3. 狗狗视频自动播放一次，狗狗走到坐垫位置并躺下后，梦泡出现。
4. 点击梦泡进入二级页面：3D 梦境走廊。
5. 梦境走廊为柔和白灰空间，有远处发光出口和梦幻感。
6. 走廊两侧有贴墙式竖向画框/展板，不加画框发光和粒子；画框有轻微上下漂浮。
7. 鼠标滚轮推动相机沿封闭直走廊真实前进；相机使用连续虚拟 Z 坐标一直向前，不再回卷，画框只渲染相机附近的周期副本，进度显示按周期取模；狗脚印只在滚动时出现，停止滚动后淡出。
8. 点击画框后不弹窗，也不额外生成一个新画框；镜头移动并正对被点击的画框。
9. 画框聚焦后右侧显示项目简介和两个按钮：“进入深梦”和“返回走廊”。
10. 点击“进入深梦”进入三级项目详情页。
11. 三级页面展示单个项目详情，并提供两个按钮：“回到走廊”和“wake up”。
12. 从二级或三级页面点击 “wake up” 返回首页，触发梦泡破碎和醒来视频播放。
13. 醒来视频完成后，坐垫下方出现 `sleep` 按钮。
14. 点击 `sleep` 后播放 `sleep-ffmpeg-1.webm`，随后梦泡再次出现，形成循环。

## 当前已实现内容

- 已搭建 Vite + React + Three.js 项目结构。
- 已恢复并创建核心工程文件：`package.json`、`index.html`、`vite.config.js`、`src/main.jsx`。
- 已实现全局页面状态切换：首页、梦境走廊、项目详情页。
- 已实现首页全屏布局：白色全屏画布、标题、水平线、坐垫、梦泡和狗狗视频。
- 首页当前已切换为 `walk-ffmpeg-2.webm` 直接显示；为避免放大后 canvas 二次采样发糊，当前不再走 `4.25.mp4` 的 canvas 去黑底显示链路。`walk-ffmpeg-1.webm` 与旧版 `4.25.mp4` 仍作为备用素材保留。
- 后续首页视频尺寸与位置调整默认以用户桌面屏幕 `2560 × 1279` 为主基准；如无额外说明，优先调桌面大屏断点，不先改内置浏览器当前约 `971 × 665` 的预览视口。
- 已校准首页首屏构图：标题已改为衬线大写样式，优先使用 `Source Serif Variable` / `Source Serif 4` 回退到系统 serif；在上一轮基础上又上移约 20px、缩小约 15%、减轻字重并收紧字距，使排版更细、更接近杂志感；随后又继续上移 6px，并把字距再收紧一点；最新一轮继续进一步压缩字距。水平线保持位置，梦泡放大 40% 并继续下移 30px，坐垫缩小 10% 后继续上移到响应式 42px 到 60px；当前狗狗画面已继续改为向右、向下微调，桌面端和 1660+ 宽屏断点都同步增加右移并降低落点，最近两轮继续做了小幅下压，其中最新一轮只再额外下移一点点。
- 已补充首页移动端/电脑端自适应：狗狗右移、狗狗上移和坐垫上移改为 CSS 响应式变量；窄屏下会降低狗狗偏移量，并单独缩小狗狗 canvas，避免主要元素明显溢出画面。
- 已按旧版 `GalleryScene` 的核心效果重做二级梦境走廊：封闭的窄白灰 3D 直走廊、真实相机沿 Z 轴滚轮前进、两侧贴墙式竖向画框/展板、3D 画框点击聚焦。
- 已持续补充首页响应式定向规则：当前已对 `430×932`、`560×900`、`760×1000`、`900×1200`、`1024×1366`、`1280×800`、`1440×900`、`1660×1279`、`1834×1279`、`1920×1080` 建立单独断点，用于分别控制标题、梦泡、狗狗视频的大小与偏移。
- 已实现狗脚印：当前为屏幕下方中间区域的 3 个近景脚印叠加层，慢速/快速滚轮都会触发；脚印更小，远处更深、近处更浅，停止滚动后渐隐。
- 已将二级页画框改为四根独立 `boxGeometry` 组成的真实 3D 白色边框；无图项目不再渲染可见白色占位面，只保留边框和不可见点击面。
- 已将画框漂浮幅度增强到 `FLOAT_AMPLITUDE = 0.14`，保留旧版节奏 `FLOAT_SPEED = 0.6` 和 `FLOAT_PHASE_OFFSET = 1.5`。
- 已将二级页画框调整为单轮 12 个固定尺寸画框，左侧 6 个、右侧 6 个；不再堆叠第二轮、第三轮重复画框，也不再逐轮缩小。
- 已将右侧画框整体上移约 30px 的 3D 视觉量级。
- 已优化滚动循环：相机坐标不再回卷，而是连续向走廊深处推进；同一组 12 个画框只渲染相机附近的 4 个周期副本，进度显示按周期取模；不加载、不跳转、不新增无限画框，也不再使用整屏白雾遮罩。
- 已实现左侧第一个画框贴图：使用 `public/assets/01框.jpg`。
- 已将画框点击从透明 HTML 热区改为 3D 画框自身点击，交互更接近旧版画廊。
- 已实现画框聚焦态：镜头正对画框，右侧显示项目简介和按钮。
- 已修复“进入深梦”无法进入三级页面的问题。
- 已实现三级项目详情页：项目封面、简介、年份、角色、服务内容、详情说明。
- 已实现三级页“回到走廊”和“wake up”。
- 已实现 wake up / sleep 循环交互；其中点击 `wake up` 返回首页时会播放 `wakeup-ffmpeg-1.webm`，点击 `sleep` 后会播放 `sleep-ffmpeg-1.webm`；两个视频都沿用首页狗狗视频的同一套尺寸与定位；原先用于提示“惊醒/左右看”的两条黑线和容器摇晃动画已移除。
- 已统一优化按钮样式为轻量胶囊按钮。
- 首页 `sleep` 按钮已下移，并放大约 15%。
- 已给首页狗狗视频增加轻微暖色 CSS 滤镜，用于修正浏览器内偏蓝观感；当前 `walk-ffmpeg-2.webm` 与 `wakeup-ffmpeg-1.webm` 使用同一套暖色参数，`sleep-ffmpeg-1.webm` 再单独加暖一点点；这些调整都只是在前端显示层完成，不额外引入新视频文件。
- 首页标题当前已改为全大写衬线标题，默认优先使用 `Source Serif Variable` / `Source Serif 4`，当前样式为更细字重、较紧字距、偏杂志感排版；当前桌面基准约为：继续下移后的基础上回调到 `--home-word-top: calc(11.8% + 149px)`、`--home-word-font-size: 61px`、`--home-word-letter-spacing: 0.002em`。
- 用户下一轮已确认需求：首页标题需要做 3 组衬线字体快速切换预览，不再手动一轮轮替换；当前尚未开始实现。

## 当前主要文件

- `src/App.jsx`：页面状态和路由切换。
- `src/pages/Home.jsx`：首页、狗狗视频、梦泡、wake up/sleep 循环。
- `src/pages/DreamCorridor.jsx`：二级 3D 梦境走廊、滚轮推进、画框聚焦、进入深梦。
- `src/pages/ProjectDream.jsx`：三级项目详情页。
- `src/components/FramePortal.jsx`：贴墙式竖向画框/展板。
- `src/components/PawTrail.jsx`：旧版 3D 狗脚印组件，目前二级页改用 `src/pages/DreamCorridor.jsx` 内的屏幕层近景脚印。
- `src/data/projects.js`：项目数据和画框贴图配置。
- `src/styles/global.css`：全站视觉样式、首页布局、按钮样式、走廊叠加层。

## 重要技术说明

### 狗狗视频黑底

当前首页视频已切换为 `walk-ffmpeg-2.webm` 直接播放显示。

点击二级页或三级页的 `wake up` 返回首页时，当前会改播 `wakeup-ffmpeg-1.webm`；该视频沿用和 `walk-ffmpeg-2.webm` 完全一致的 CSS 尺寸、缩放与定位参数。

点击首页 `sleep` 按钮后，当前会改播 `sleep-ffmpeg-1.webm`；该视频同样沿用和 `walk-ffmpeg-2.webm` 完全一致的 CSS 尺寸、缩放与定位参数，并在播放完成后再恢复梦泡入口。

旧版 `4.25.mp4` 的黑色背景通过 canvas 帧处理做透明化，不直接显示原始 video。

### 首页标题当前状态（2026-05-13 已确认）

- 当前文案：`EVERYTHING YOU SEE IS PART OF A DREAM`
- 当前目标风格：更细、更紧、更接近时尚/杂志标题，而不是普通书卷感 serif。
- 当前字体栈：`'Source Serif Variable', 'Source Serif 4', 'Times New Roman', Georgia, 'Noto Serif SC', serif`
- 当前标题方向：已改为全大写、细字重、极小字距。
- 用户已明确下一步想法：直接做 3 个衬线字体切换，而不是每次手动换一款字体再看。
- 候选方向建议：`Bodoni Moda`、`Libre Bodoni`、`Cormorant Garamond`（尚未接入）。

### Netlify 发布状态（2026-05-13）

- 已执行 `npm run build`，当前 `dist/` 为最新可发布产物。
- `netlify.toml` 当前配置正常：`command = "npm run build"`，`publish = "dist"`。
- 当前环境未检测到 `NETLIFY_AUTH_TOKEN`。
- 当前仓库内也没有现成 `.netlify` 关联目录信息。
- 因此本轮尚未实际发布到线上目标站点：`https://ornate-unicorn-863c99.netlify.app/`
- 下轮如果继续部署，需要先完成 Netlify 登录/令牌注入，或补充目标站点 `site id`。

### 首页视频调位基准（2026-05-13 已确认）

- 用户实际主参考屏幕：`2560 × 1279`
- VS Code 内置浏览器当前共享视口约：`971 × 665`
- 最近两次“向下/向右”之所以用户侧看起来无变化，是因为修改落在 `@media (max-width: 1024px)` 断点，只影响内置预览小视口，没有命中用户的 2560 宽桌面屏幕。
- 后续首页视频位置与尺寸调整，默认优先修改桌面大屏断点；当前已将 `min-width: 1660px` 作为 2560 宽屏的主要调位基准。
- 2026-05-14 新确认：`2560 × 1279` 仍是首页主基准，后续不得改动这组已对齐桌面默认值；其他尺寸只能向这组基准靠拢，不能反过来改基准。
- 2026-05-14 当前首页已补充一套“相对元素尺寸”的调位变量，主要在 `src/styles/global.css` 中新增：`--dog-shift-x`、`--dog-drop-y`、`--bubble-shift-x`、`--bubble-shift-y`、`--bubble-scale`、`--home-word-shift-y`，以及辅助计算变量 `--bubble-half-width`、`--bubble-quarter-width`、`--cushion-third-height`、`--cushion-half-height`；后续可以继续用“半个梦泡”“半个坐垫”这类口径直接转成样式规则。
- 2026-05-14 当前首页已按用户口头规则分档尝试：`430/560/760`、`900/1024`、`1280/1440`、`1660/1834`；其中 `1660 × 1279` 与 `1834 × 1279` 的梦泡方向已更正为 **向左 30px**，不是向右。
- 2026-05-14 `430 × 932` 目前是重点微调档：本轮已确认“确实有改动，但还不够”；现状是 430 已单独加入标题、梦泡、狗视频规则，但视觉仍未定稿，下一轮需继续只盯 430 做小步微调，避免再次把狗位置改飞。
- 2026-05-14 标题规则已开始从“跟随整体缩放”拆出独立控制：小屏下允许自动分行，目标最多 2 行；但 430 的标题大小/位置仍未最终确认，后续要继续单独调，不与狗和梦泡绑在同一轮联动里。
- 2026-05-14 新增首页标题安全边界规则：设 `X = viewport width / 10`，标题左右安全边距不得小于 `1.5X`，最大可用宽度为 `7X`。在实现上已转成移动端 `--home-word-safe-width`，标题允许自动换行、`text-wrap: balance`，默认尽量保持字号，只有极小屏才通过 `clamp(...)` 缩小。
- 2026-05-14 新确认：很多定向断点不是绝对定位，而是建立在所属区间基线上的“增量偏移”。例如 `1024 × 1366` 继承 `901–1024` 的 `--dog-shift-x: var(--bubble-half-width)` / `--dog-drop-y: var(--cushion-half-height)`；`1660 × 1279`、`1834 × 1279` 继承 `1660–1919` 的 `--bubble-shift-x: -30px` 与 `--dog-shift-x: var(--bubble-quarter-width)`。后续再调这些尺寸时，必须按“基线 + 增量”计算，不能直接把口头像素值写成绝对值。

#### 首页当前定向尺寸覆盖（2026-05-14）

以下规则当前写在 `src/styles/global.css`，用于首页标题、梦泡、狗狗视频的精调；除非用户重新指定方向，否则后续继续以这些值为现状基线微调。

- `430 × 932`
	- 标题：放大并下移，当前 `--home-word-font-size: 36px`，`--home-word-shift-y: 95px`
	- 梦泡：下移，当前 `--bubble-shift-y: 65px`
	- 狗狗视频：放大并右移下移，当前 `--dog-video-scale: 2.6`，`--dog-shift-x: 172px`，`--dog-drop-y: 38px`

- `560 × 900`
	- 标题：按移动端安全边界规则放大，当前 `--home-word-font-size: 34.3px`
	- 梦泡：当前 `--bubble-shift-x: 123px`，`--bubble-shift-y: 43px`
	- 狗狗视频：当前 `--dog-video-scale: 2.73`，`--dog-shift-x: 230.5px`，`--dog-drop-y: 58px`

- `760 × 1000`
	- 标题：当前 `--home-word-font-size: 41.9px`
	- 梦泡：当前 `--bubble-scale: 0.9`，`--bubble-shift-x: 175px`，`--bubble-shift-y: 16px`
	- 狗狗视频：当前 `--dog-video-scale: 2.62`，`--dog-shift-x: 245px`，`--dog-drop-y: 51px`

- `900 × 1200`
	- 标题：当前 `--home-word-font-size: 51.5px`，`--home-word-shift-y: 15px`
	- 梦泡：当前 `--bubble-shift-x: 175px`，`--bubble-shift-y: 96px`
	- 狗狗视频：当前 `--dog-video-scale: 2.38`，`--dog-shift-x: 188px`，`--dog-drop-y: 64.5px`

- `1024 × 1366`
	- 梦泡：当前 `--bubble-shift-x: 152.5px`，`--bubble-shift-y: 60px`
	- 狗狗视频：当前是在 `901–1024` 基线之上继续叠加：`--dog-shift-x: calc(var(--bubble-half-width) + 61px)`，`--dog-drop-y: calc(var(--cushion-half-height) + 20px)`

- `1280 × 800`
	- 梦泡：当前 `--bubble-shift-x: -97px`，`--bubble-shift-y: -22px`
	- 狗狗视频：当前是在 `1025–1280` 基线之上继续叠加：`--dog-shift-x: calc(var(--bubble-half-width) + 200px)`，`--dog-drop-y: calc(var(--cushion-half-height) + 45px)`

- `1440 × 900`
	- 梦泡：当前 `--bubble-shift-x: -55px`
	- 狗狗视频：当前是在 `1281–1440` 基线之上继续叠加：`--dog-shift-x: calc(var(--bubble-half-width) + 146px)`，`--dog-drop-y: calc(var(--cushion-half-height) + 35px)`

- `1660 × 1279`
	- 标题：当前放大 25%，`--home-word-font-size: 76.25px`
	- 梦泡：当前在桌面大屏基线之上为 `--bubble-scale: 0.9`，`--bubble-shift-x: -52.6px`，`--bubble-shift-y: 41.3px`
	- 狗狗视频：当前 `--dog-shift-x: calc(var(--bubble-quarter-width) + 102.3px)`

- `1834 × 1279`
	- 标题：当前放大 25%，`--home-word-font-size: 76.25px`
	- 梦泡：当前 `--bubble-scale: 0.95`，`--bubble-shift-x: -53.6px`，`--bubble-shift-y: 43px`
	- 狗狗视频：当前 `--dog-shift-x: calc(var(--bubble-quarter-width) + 102.3px)`

- `1920 × 1080`
	- 标题：当前放大 25%，`--home-word-font-size: 76.25px`
	- 梦泡：当前 `--bubble-scale: 0.95`
	- 狗狗视频：当前 `--dog-shift-x: 128.7px`，`--dog-drop-y: 13px`

当前方案：

- 原始 `video` 保留播放和 `ended` 事件，用于时序控制。
- 每帧绘制到 `canvas`。
- 当像素 `r/g/b` 都接近黑色时，将 alpha 设为 `0`。
- 当平均亮度较低时，按亮度渐变降低 alpha。

限制：如果原视频边缘复杂、毛发阴影和黑底混在一起，canvas 阈值处理仍可能出现边缘损失或残影。最终最干净的方案仍建议重新导出带透明通道的视频，例如 WebM + alpha。

### 01 框素材

当前第一个项目配置在 `src/data/projects.js`：

- `imageUrl: '/assets/01框.jpg'`

这个素材必须存在于 `public/assets/01框.jpg`，开发环境和生产构建才能稳定访问。

### 画框点击与走廊排版

二级页面已按旧版 `G:\WorkBuddy\20260417090755\js\scene-gallery.js` 的核心方式重做：地面、左右墙面和顶面组成窄而封闭的直走廊，滚轮推动相机沿 Z 轴前进，画框按左右墙面交替错落排布。

画框作为白色竖向展板贴在两侧墙面上，不加画框发光和粒子；当前已恢复轻微上下漂浮。画框点击改为 3D 对象自身点击，点击后相机切换到对应画框深度并正对画框，同时显示右侧项目简介和按钮。

当前二级页保留旧版画廊的漫游感，但仍使用当前 React 页面状态、项目数据、`wake up` 和“进入深梦/返回走廊”流程。

本次重做前已保留上一版二级页相关文件备份：`backups/corridor-before-old-gallery-port/`，包含当时的 `DreamCorridor.jsx`、`FramePortal.jsx` 和 `global.css`。

### 本轮二级页修改结果

图一反馈后的二级页面画框和滚动循环已完成：

1. 已去掉旧的半透明外部平面。
2. 已改为四根独立 `boxGeometry` 做真实 3D 画框边：上边、下边、左边、右边；边框厚度约 `0.1`，深度约 `0.12`，材质为普通白色 `meshStandardMaterial`，没有 `emissive`。
3. 第一个画框继续使用 `public/assets/01框.jpg`；无图项目不再显示一整块白色占位面，只保留真实边框和不可见点击面。
4. 已恢复更明显的上下漂浮效果，不加粒子、不加发光。
5. 已将画框数量调整为单轮 12 个：左侧 6 个、右侧 6 个。
6. 已统一画框尺寸，不再随循环批次缩小。
7. 已将右侧画框整体上移约 30px 的 3D 视觉量级。
8. 已改为连续虚拟走廊循环：相机 Z 坐标不再回到开头，而是持续向前；同一组 12 个画框按当前相机周期动态渲染附近 4 个周期副本，不加载、不跳转、不继续堆无限画框。

### 聚焦页方向基准（2026-05-09 已确认）

本项目后续凡是涉及“点击画框后的聚焦页”中“画框左右”“卡片左右”“上下微调”的需求，默认以本次确认的视觉方向为基准，不再按口头直觉重新猜测。

本次已和用户确认的视觉结果：

- 画框：本次修改后的视觉效果是 **往右**。
- 卡片：本次修改后的视觉效果是 **往左**。

对应参数基准如下。

#### 1. 画框左右：`src/pages/DreamCorridor.jsx`

移动端主要参数：`getFocusScreenShiftX(viewportWidth)`

说明：旧记录里“桌面端调小 `getFocusScreenShiftX` = 画框往左”的规则已失效。当前桌面端不能继续用这个参数做左右基准，因为 `focusedProject.side * focusScreenShiftX` 是按左右墙相对方向偏移，不是屏幕全局左/右。

当前确认有效的移动端方向样例：

- `<= 599`：`0.42`
- `<= 767`：`0.3`

移动端后续如果用户说：

- “画框往右” → 优先 **调大** `getFocusScreenShiftX`
- “画框往左” → 优先 **调小** `getFocusScreenShiftX`

桌面端当前试验参数：`getDesktopFocusViewOffsetX(viewportWidth)`

- 已尝试额外平移聚焦相机 X：对左墙画框会远离墙面，产生“镜头后退/看到更多天花板和地板”视觉，已回退。
- 已尝试额外平移聚焦相机 Z：由于聚焦态每帧执行 `camera.lookAt(focusLookAtVectorRef.current)` 锁定画框目标点，相机平移会带动镜头自动旋转，产生“镜头旋转更多”的视觉，已回退。
- 当前聚焦态相机仍锁定：`camera.position.lerp(focusCameraVectorRef.current, 0.12)` + `camera.lookAt(focusLookAtVectorRef.current)`。
- 当前试用 `camera.setViewOffset(...)` 做视锥/投影偏移：不移动相机位置，不改变 `lookAt` 锁定关系，只改变聚焦页成像构图。方向已确认：桌面端使用正值让聚焦画框按需求左移。
- 这个偏移只用于 `focusedProject` 聚焦页状态；退出聚焦后必须 `camera.clearViewOffset()`，不影响走廊漫游镜头。

桌面端后续如果用户说：

- “画框往左/右” → 优先微调 `getDesktopFocusViewOffsetX` 的数值和正负方向；不要直接平移聚焦相机 X/Z。

#### 2. 画框上下：`src/pages/DreamCorridor.jsx`

主要参数：`getFocusScreenShiftY(viewportWidth)`

- 数值 **调大**：画框在屏幕里 **往下**。
- 数值 **调小**：画框在屏幕里 **往上**。

#### 3. 画框大小：`src/pages/DreamCorridor.jsx`

主要参数：`getFocusZOffsetMagnitude(viewportWidth)`

- 绝对值 **调大**：画框看起来 **更小**。
- 绝对值 **调小**：画框看起来 **更大**。

#### 4. 桌面端卡片左右：`src/styles/global.css`

主要参数：`.corridor` 下的

- `--focus-copy-right`
- `--focus-copy-translate-x`

本次已确认的视觉基准：

- `--focus-copy-right` **调大** → 卡片 **往左**
- `--focus-copy-right` **调小** → 卡片 **往右**
- `--focus-copy-translate-x` 的负值绝对值 **调大** → 卡片 **往左**
- `--focus-copy-translate-x` 的负值绝对值 **调小** → 卡片 **往右**

当前确认有效的桌面端左移样例：

- 基础：`--focus-copy-right: clamp(58px, 6.8vw, 98px)`
- 基础：`--focus-copy-translate-x: calc(-1 * clamp(146px, 12vw, 206px))`
- `1440+`：`--focus-copy-right: clamp(102px, 8.4vw, 168px)`
- `1440+`：`--focus-copy-translate-x: calc(-1 * clamp(232px, 14vw, 320px))`
- `1660+`：`--focus-copy-right: clamp(118px, 7.6vw, 182px)`
- `1660+`：`--focus-copy-translate-x: calc(-1 * clamp(282px, 15vw, 370px))`

后续如果用户说：

- “卡片往左” → 优先 **调大** `--focus-copy-right`，并同时 **增大** `--focus-copy-translate-x` 的负值绝对值
- “卡片往右” → 优先 **调小** `--focus-copy-right`，并同时 **减小** `--focus-copy-translate-x` 的负值绝对值

#### 5. 移动端卡片补充规则：`src/styles/global.css`

- `--focus-copy-left` **调大** → 卡片 **往右**
- `--focus-copy-left` **调小** → 卡片 **往左**
- `--focus-copy-bottom` **调大** → 卡片 **往上**
- `--focus-copy-bottom` **调小** → 卡片 **往下**
- `--focus-copy-width` **调大** → 卡片更宽
- `--focus-copy-width` **调小** → 卡片更窄

说明：后续如无额外说明，聚焦页方向调整一律先按本节基准执行，再做幅度微调。

### 动画占位

以下动画目前是占位效果，等待后续正式素材：

- 梦泡破碎的精细动画。

## 后续待办

1. 根据最终视频素材，继续精调狗狗视频尺寸、位置和落点，让趴下动作更准确地落在坐垫上。
2. 如果可以，导出带 alpha 通道的狗狗视频，替换当前 canvas 去黑底方案。
3. 补充正式狗狗惊醒、左右看、重新睡觉动画。
4. 补充更多画框作品图，建议第一版 6 到 8 个入口。
5. 替换 `src/data/projects.js` 中的占位项目标题、简介、年份、角色、服务内容。
6. 继续优化走廊透视、发光出口、墙面画框间距和镜头推进速度。
7. 如需增加画框边缘颗粒弥散效果，优先使用透明 PNG/WebP 贴图作为画框边缘叠加层；这种喷枪/印刷颗粒质感比代码粒子更容易控制审美和密度。
8. 优化移动端体验，必要时简化 3D 画框数量和粒子数量。
9. 后期做性能优化：将 3D 走廊动态加载，降低首页首屏 JS 体积。
10. 给首页标题接入 3 个衬线字体快速切换预览，优先尝试 `Bodoni Moda`、`Libre Bodoni`、`Cormorant Garamond`。
11. 如需正式上线 Netlify，补齐登录态或 `NETLIFY_AUTH_TOKEN` + `site id` 后执行生产部署。

## 运行命令

安装依赖：

```bash
npm install
```

启动开发服务器：

```bash
npm run dev
```

生产构建：

```bash
npm run build
```

预览生产构建：

```bash
npm run preview
```

Windows PowerShell 如果遇到 `npm.ps1` 执行策略问题，可以使用：

```bash
npm.cmd install
npm.cmd run dev
npm.cmd run build
```

## 当前验证结果

已验证：

- `npm.cmd install` 成功。
- `npm.cmd run build` 成功；本轮二级页修改后再次运行成功。当前仍有 Vite 大 chunk 提示，和后期 3D 走廊动态加载优化方向一致。
- VS Code 错误检查无错误。
- 首页梦泡能进入走廊。
- 滚轮能推进旧版式直走廊进度。
- 3D 画框自身可点击，已验证可进入聚焦态。
- 聚焦态出现“进入深梦”和“返回走廊”。
- “进入深梦”能进入对应项目三级页面。
- 本轮浏览器验证：无图画框不再显示整块白色占位面，只保留真实边框；连续虚拟走廊中进度按周期从 90% 回到 0%，相机没有坐标回卷，未出现 `.loop-veil` 白屏遮罩；循环后点击 3D 画框可出现聚焦面板。
- 本轮脚印验证：慢速滚轮也能触发 `.paw-overlay.is-visible`；屏幕层脚印数量固定为 3 个，位于画面下方中间区域；脚印为远处更深、近处更浅；滚轮停止后保持约 1.2 秒并在约 0.9 秒内渐隐。
- 三级页“回到走廊”可返回二级页面。
- “wake up” 可返回首页。
- `sleep` 后梦泡再次出现，循环成立。

## 当前预览地址

开发服务器运行时访问：

```text
http://localhost:5173/
```
