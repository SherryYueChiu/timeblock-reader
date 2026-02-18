/**
 * 事件类型和属性检查工具函数
 */
import type { TimeBlock } from './dbReader';

/**
 * 检查事件是否为全天事件
 */
export const isAllDayEvent = (event: TimeBlock): boolean => {
  return event.allday === '1' || event.allday === 1 || event.allday === 'true';
};

/**
 * 检查事件是否为任务（type: 2）
 */
export const isTask = (event: TimeBlock): boolean => {
  return event.type === 2;
};

/**
 * 检查事件是否为区间（type: 4）
 */
export const isInterval = (event: TimeBlock): boolean => {
  return event.type === 4;
};

/**
 * 检查事件是否为习惯（type: 5）
 */
export const isHabit = (event: TimeBlock): boolean => {
  return event.type === 5;
};

/**
 * 检查事件是否为活动（type: 0）
 */
export const isActivity = (event: TimeBlock): boolean => {
  return event.type === 0;
};

/**
 * 检查事件是否为备忘（type: 3）
 */
export const isMemo = (event: TimeBlock): boolean => {
  return event.type === 3;
};
