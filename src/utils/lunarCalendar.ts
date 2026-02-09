/**
 * 农历日期转换工具
 * 用于计算台湾农历日期并返回对应的图标类型
 * 使用 lunar-javascript 库进行准确的农历转换
 */

// @ts-ignore - lunar-javascript 没有类型定义
import { Solar } from 'lunar-javascript';

/**
 * 获取农历日期
 * @param date 公历日期
 * @returns 农历日期（1-30）
 */
export function getLunarDay(date: Date): number {
  try {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    // 使用 lunar-javascript 库进行转换
    const solar = Solar.fromYmd(year, month, day);
    const lunar = solar.getLunar();
    
    // 获取农历日期
    return lunar.getDay();
  } catch (error) {
    console.error('农历日期转换失败:', error);
    return 1; // 默认返回初一
  }
}

/**
 * 获取农历图标类型
 * @param date 公历日期
 * @returns 图标类型：'empty-circle' | 'right-half' | 'full-circle' | 'left-half' | null
 */
export function getLunarIconType(date: Date): 'empty-circle' | 'right-half' | 'full-circle' | 'left-half' | null {
  const lunarDay = getLunarDay(date);
  
  if (lunarDay === 1) {
    return 'empty-circle'; // 初一：空心圆
  } else if (lunarDay === 8) {
    return 'right-half'; // 初八：右半圆
  } else if (lunarDay === 15) {
    return 'full-circle'; // 十五：实心圆
  } else if (lunarDay === 22) {
    return 'left-half'; // 二十二：左半圆
  }
  
  return null; // 其他日期不显示图标
}
