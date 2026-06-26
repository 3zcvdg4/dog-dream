# 动画时序基线

> 这是当前网站动画逻辑的基线记录。没有确认前，不要随意改时间、顺序或过渡模式。

## 总原则

- 首页梦泡点击后，必须先看到过渡开始，再进入走廊。
- 水涟漪效果只用于桌面版梦境入口；不要把它替换成纯白过渡。
- `white-hold`、`revealing`、`idle` 的顺序不要打乱。
- 任何动画修改，先本地确认，再发布。

## 首页动画

### 首页初始加载

- `view === ROUTE_HOME` 且 `homeReady === false` 时，显示加载页。
- 预加载完成后，至少再等 `HOME_LOADING_MIN_DURATION_MS = 180ms` 才进入首页。
- `homeEntryMode = 'intro'` 时，首页视频使用 intro 流程。
- `playbackBlocked` 为真时，视频暂停，梦泡按钮不放行进入。

### 首页视频阶段

`Home.jsx` 的阶段规则：

- `intro` -> 正常首页播放。
- `waking` -> 醒来流程。
- `sleepingAgain` -> 再次睡觉流程。
- `dreamReady` -> 梦泡可见，可点击进入梦境。
- `awake` -> 睡觉按钮可见。

### 首页回退时长

`PHASE_FALLBACK_DURATIONS_MS`：

- `intro`: `5200ms`
- `waking`: `1500ms`
- `sleepingAgain`: `1350ms`

### 梦泡可点击条件

- 梦泡只在 `phase === 'dreamReady'` 时可点击。
- 点击时调用 `handleEnterDream(event)`，会取泡泡中心偏移作为过渡起点。

## 梦境入口：首页 -> 走廊

入口函数：`startDreamEntryTransition(origin)`。

### 桌面版（保留水涟漪）

- 先 `captureTransitionSnapshot(homeSceneCaptureRef.current)`。
- 进入过渡后立刻渲染 `phase: 'rippling'`，`mode: 'ripple'`。
- 过渡常量：
  - `DREAM_TRANSITION_WHITE_HOLD_DELAY_MS = 2760`
  - `DREAM_TRANSITION_SWITCH_DELAY_MS = 2920`
  - `DREAM_TRANSITION_REVEAL_DELAY_MS = 3040`
  - `DREAM_TRANSITION_FINISH_DELAY_MS = 5050`
- 时序顺序：
  1. `rippling`
  2. `white-hold`
  3. 切到 `view = 'corridor'`
  4. `revealing`
  5. `idle`

### 小屏简化版

- 条件：`viewportWidth < 900 || viewportHeight < 900`
- 使用 `mode: 'white-fade'`
- 常量：
  - `switchDelayMs = 520`
  - `whiteHoldDelayMs = 180`
  - `revealDelayMs = 260`
  - `finishDelayMs = 760`
  - `revealDurationMs = 280`
  - `whiteFillStartMs = 0`
  - `whiteFillDurationMs = 220`

## 走廊 -> 项目页

入口函数：`startProjectEntryTransition(projectId, corridorState, origin)`。

- 使用 `mode: 'radial-white'`
- 不使用截图水涟漪。
- 常量：
  - `PROJECT_ENTRY_WHITE_HOLD_DELAY_MS = 560`
  - `PROJECT_ENTRY_SWITCH_DELAY_MS = 720`
  - `PROJECT_ENTRY_REVEAL_DELAY_MS = 1180`
  - `PROJECT_ENTRY_FINISH_DELAY_MS = 1960`
- 时序顺序：
  1. `rippling`
  2. `white-hold`
  3. 切到 `view = 'project'`
  4. `revealing`
  5. `idle`

## 项目页 -> 走廊

入口函数：`startCorridorReturnTransition()`。

- 使用 `mode: 'white-fade'`
- 常量：
  - `CORRIDOR_RETURN_WHITE_HOLD_DELAY_MS = 320`
  - `CORRIDOR_RETURN_SWITCH_DELAY_MS = 400`
  - `CORRIDOR_RETURN_REVEAL_DELAY_MS = 820`
  - `CORRIDOR_RETURN_FINISH_DELAY_MS = 1820`
  - `CORRIDOR_RETURN_WHITE_FILL_START_MS = 36`
  - `CORRIDOR_RETURN_WHITE_FILL_DURATION_MS = 380`
- 时序顺序：
  1. `rippling`
  2. `white-hold`
  3. 切回 `view = 'corridor'`
  4. `revealing`
  5. `idle`

## 过渡遮罩层

`DreamTransitionOverlay.jsx` 当前三种模式：

- `ripple`：桌面梦境入口使用，依赖截图 canvas 和多层波纹。
- `radial-white`：项目页进入时使用，中心向外扩散白光。
- `white-fade`：纯白过渡，不显示水涟漪 canvas。

### ripple 相关参数

- `RIPPLE_SPREAD_DURATION_MS = 5080`
- ripple layers 延迟：`0 / 760 / 1480 / 2440ms`
- 这组参数决定桌面梦泡的波纹展开速度和层次感。

## 当前本地确认结果

- 本地已确认梦泡点击后会立刻出现过渡。
- 这次修复后，桌面点击到 ripple 开始的可见响应约为几毫秒级。
- 进入走廊的本地实测完成后，才考虑发布。
