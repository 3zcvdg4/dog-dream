export const CONFIG = {
  // 动画时间
  DREAM_BUBBLE_DELAY: 800,
  FADE_ANIMATION_TIME: 1400,
  SHARD_FLY_DURATION: 900,
  SHARD_REMOVE_DELAY: 800,

  // 走廊滚动
  GALLERY_SCROLL_FACTOR: 0.012,
  GALLERY_MAX_Z: 0,
  GALLERY_MIN_Z: -48,
  CAMERA_SMOOTH_FACTOR: 0.06,

  // 画框
  FRAME_BASE_SCALE: 1.0,
  FRAME_BASE_W: 0.8,
  FRAME_BASE_H: 1.1,
  FRAME_BASE_D: 0.04,

  // 狗狗（视频模式）
  DOG_BREATHE_AMPLITUDE: 4,
  DOG_BREATHE_SPEED: 0.785,

  // 梦泡
  BUBBLE_FLOAT_AMPLITUDE: 4,
  BUBBLE_SHARD_COUNT: 16,
  BUBBLE_SHARD_SIZE_MIN: 20,
  BUBBLE_SHARD_SIZE_MAX: 40,
  BUBBLE_SHARD_FLY_DISTANCE: 100,
  BUBBLE_SHARD_FLY_DISTANCE_RAND: 150,

  // 漂浮动画
  FLOAT_AMPLITUDE: 0.08,
  FLOAT_SPEED: 0.6,
  FLOAT_PHASE_OFFSET: 1.5,

  // 相机（保留用于画廊）
  CAMERA_FOV: 45,
  CAMERA_NEAR: 0.1,
  CAMERA_FAR: 100,
  CAMERA_POSITION: { x: 0, y: 1.5, z: 5 },

  // 走廊相机
  GALLERY_CAMERA_FOV: 55,
  GALLERY_CAMERA_FAR: 60,
  GALLERY_CAMERA_POSITION: { x: 0, y: 1.5, z: 0 },

  // 灯光
  AMBIENT_LIGHT_INTENSITY: 2.0,
  DIR_LIGHT_INTENSITY: 1.6,
  DIR_LIGHT_POSITION: { x: 3, y: 6, z: 4 },
  FILL_LIGHT_INTENSITY: 0.6,
  FILL_LIGHT_POSITION: { x: -3, y: 2, z: -2 },

  // 走廊灯光
  GALLERY_AMBIENT_INTENSITY: 2.3,
  GALLERY_DIR_INTENSITY: 1.0,
  GALLERY_DIR_POSITION: { x: 0, y: 6, z: -5 },

  // 雾
  FOG_COLOR: 0xfafafa,
  FOG_NEAR: 12,
  FOG_FAR: 50,

  // 材质
  FLOOR_COLOR: 0xf0f0f0,
  CEIL_COLOR: 0xffffff,
  WALL_COLOR: 0xf5f5f5,
  FRAME_COLOR: 0xffffff,
  FRAME_ROUGHNESS: 0.1,
  FRAME_EMISSIVE_INTENSITY: 0.15,

  // 视频资源
  VIDEO_INITIAL_SRC: './assets/4.25.mp4',  // 初始走路→趴下视频
  VIDEO_WAKEUP_SRC: './assets/4.25.mp4',   // 醒来动画（暂用同一视频占位）
  VIDEO_SLEEP_SRC: './assets/4.25.mp4',    // 睡觉动画（暂用同一视频占位）
  VIDEO_BEHAVIOR_SRCS: [                   // 行为动画片段数组（暂用占位）
    './assets/4.25.mp4',
    './assets/4.25.mp4',
    './assets/4.25.mp4'
  ],

  // 色度抠图配置
  CHROMA_KEY_TOLERANCE: 45,     // 颜色容差
  CHROMA_KEY_SMOOTHNESS: 0.1,  // 边缘平滑度

  // 色度抠图排除区域（已移除，不再保护狗狗眼睛）
  CHROMA_KEY_EXCLUDE_ZONES: [],

  // 调试模式
  CHROMA_KEY_DEBUG: false,
};
