/**
 * 应用常量定义
 */

/**
 * 事件类型常量
 */
export const EVENT_TYPES = {
  ACTIVITY: 0,    // 活动
  TASK: 2,        // 任务
  MEMO: 3,        // 备忘
  INTERVAL: 4,    // 区间
  HABIT: 5        // 习惯
} as const;

/**
 * 默认贴图组
 */
export const DEFAULT_STICKER_GROUP = 'ㄇㄚˊ幾兔－表情貼';

/**
 * APNG 刷新间隔（毫秒）
 */
export const APNG_REFRESH_INTERVAL = 3000;

/**
 * 贴图组配置
 */
export const STICKER_GROUPS = [
  { id: 'ㄇㄚˊ幾兔－表情貼', name: '表情貼' },
  { id: 'ㄇㄚˊ幾兔－表情貼2', name: '表情貼2' },
  { id: 'ㄇㄚˊ幾兔－動態表情貼', name: '動態表情貼' }
] as const;

/**
 * 默认遮罩颜色
 */
export const DEFAULT_OVERLAY_COLOR = '#646cff';

/**
 * 默认遮罩透明度
 */
export const DEFAULT_OVERLAY_OPACITY = 33;
