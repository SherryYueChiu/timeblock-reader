import pako from 'pako';
import type { TimeBlock } from './dbReader';

export interface MinimalTimeBlock {
  t: string;    // title
  s: number;    // dt_start
  e: number;    // dt_end
  ty: number;   // type
  c: number;    // color
  a: number;    // allday (0/1)
  d?: number;   // dt_done
  loc?: string; // location
  desc?: string; // description (max 200 chars)
  p?: number;   // private (0/1) - 隐私标记
}

export interface MonthData {
  v: number;              // version
  y: number;              // year
  m: number;              // month
  events: MinimalTimeBlock[];
}

export interface MultiMonthData {
  v: number;              // version
  startY: number;         // start year
  startM: number;         // start month
  endY: number;           // end year
  endM: number;           // end month
  events: MinimalTimeBlock[];
}

// 混淆标题：对每个字符做+1/-1偏移，让中英文事件看起来长度差不多
function obfuscateTitle(title: string): string {
  return title.split('').map((char, index) => {
    const code = char.charCodeAt(0);
    // 交替使用+1和-1偏移
    const offset = index % 2 === 0 ? 1 : -1;
    return String.fromCharCode(code + offset);
  }).join('');
}

// 精简事件数据
function minimizeTimeBlock(event: TimeBlock, isBlurred: boolean): MinimalTimeBlock {
  const minimal: MinimalTimeBlock = {
    t: isBlurred ? obfuscateTitle(event.title) : event.title,
    s: event.dt_start,
    e: event.dt_end,
    ty: event.type,
    c: event.color,
    a: event.allday === '1' || event.allday === 1 || event.allday === 'true' ? 1 : 0
  };

  // 如果事件被模糊，清空地点和描述，添加隐私标记
  if (isBlurred) {
    minimal.p = 1;
    // 不设置 loc 和 desc，让它们保持 undefined
  } else {
    // 可选字段（非隐私事件才保留）
    if (event.dt_done && event.dt_done !== 0) {
      minimal.d = event.dt_done;
    }
    if (event.location) {
      minimal.loc = event.location;
    }
    if (event.description) {
      minimal.desc = event.description.substring(0, 200);
    }
  }

  return minimal;
}

// 格式化日期為 YYYY-MM-DD
function formatDateKey(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 创建月份数据
function createMonthData(
  events: TimeBlock[],
  year: number,
  month: number,
  blurredEvents: Set<number>,
  blurredDates: Set<string> = new Set()
): MonthData {
  const monthStart = new Date(year, month - 1, 1).getTime();
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999).getTime();
  
  const filteredEvents = events
    .filter(event => {
      // 过滤已删除事件
      if (event.dt_delete) return false;
      
      // 检查事件是否与目标月份有交集
      return (
        (event.dt_start >= monthStart && event.dt_start <= monthEnd) ||
        (event.dt_end >= monthStart && event.dt_end <= monthEnd) ||
        (event.dt_start <= monthStart && event.dt_end >= monthEnd)
      );
    })
    .map(event => {
      // 检查事件是否被模糊（事件级别或日期级别）
      const isEventBlurred = blurredEvents.has(event._id);
      const eventStartDate = formatDateKey(event.dt_start);
      const eventEndDate = formatDateKey(event.dt_end);
      const isDateBlurred = blurredDates.has(eventStartDate) || blurredDates.has(eventEndDate);
      const isBlurred = isEventBlurred || isDateBlurred;
      
      return minimizeTimeBlock(event, isBlurred);
    });
  
  return {
    v: 1,
    y: year,
    m: month,
    events: filteredEvents
  };
}

// 编码月份数据
export function encodeMonthData(data: MonthData): string {
  try {
    // 1. JSON序列化
    const json = JSON.stringify(data);
    
    // 2. Gzip压缩
    const compressed = pako.deflate(json, { level: 9 });
    
    // 3. Base64编码
    const base64 = btoa(String.fromCharCode(...compressed));
    
    return base64;
  } catch (error) {
    console.error('编码失败:', error);
    throw new Error('Failed to encode month data');
  }
}

// 解码月份数据
export function decodeMonthData(encoded: string): MonthData {
  try {
    // 1. Base64解码
    const binary = atob(encoded);
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    
    // 2. Gzip解压
    const decompressed = pako.inflate(bytes, { to: 'string' });
    
    // 3. JSON解析
    const data = JSON.parse(decompressed) as MonthData;
    
    return data;
  } catch (error) {
    console.error('解码失败:', error);
    throw new Error('Failed to decode month data');
  }
}

// 创建多个月份数据
export function createMultiMonthData(
  events: TimeBlock[],
  startYear: number,
  startMonth: number,
  endYear: number,
  endMonth: number,
  blurredEvents: Set<number>,
  blurredDates: Set<string> = new Set()
): MultiMonthData {
  const startTime = new Date(startYear, startMonth - 1, 1).getTime();
  const endTime = new Date(endYear, endMonth, 0, 23, 59, 59, 999).getTime();
  
  const filteredEvents = events
    .filter(event => {
      // 过滤已删除事件
      if (event.dt_delete) return false;
      
      // 检查事件是否与目标月份范围有交集
      return (
        (event.dt_start >= startTime && event.dt_start <= endTime) ||
        (event.dt_end >= startTime && event.dt_end <= endTime) ||
        (event.dt_start <= startTime && event.dt_end >= endTime)
      );
    })
    .map(event => {
      // 检查事件是否被模糊（事件级别或日期级别）
      const isEventBlurred = blurredEvents.has(event._id);
      const eventStartDate = formatDateKey(event.dt_start);
      const eventEndDate = formatDateKey(event.dt_end);
      const isDateBlurred = blurredDates.has(eventStartDate) || blurredDates.has(eventEndDate);
      const isBlurred = isEventBlurred || isDateBlurred;
      
      return minimizeTimeBlock(event, isBlurred);
    });
  
  return {
    v: 2, // 版本2表示多个月份数据
    startY: startYear,
    startM: startMonth,
    endY: endYear,
    endM: endMonth,
    events: filteredEvents
  };
}

// 编码多个月份数据
export function encodeMultiMonthData(data: MultiMonthData): string {
  try {
    // 1. JSON序列化
    const json = JSON.stringify(data);
    
    // 2. Gzip压缩
    const compressed = pako.deflate(json, { level: 9 });
    
    // 3. Base64编码
    const base64 = btoa(String.fromCharCode(...compressed));
    
    return base64;
  } catch (error) {
    console.error('编码失败:', error);
    throw new Error('Failed to encode multi-month data');
  }
}

// 解码多个月份数据
export function decodeMultiMonthData(encoded: string): MultiMonthData {
  try {
    // 1. Base64解码
    const binary = atob(encoded);
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    
    // 2. Gzip解压
    const decompressed = pako.inflate(bytes, { to: 'string' });
    
    // 3. JSON解析
    const data = JSON.parse(decompressed) as MultiMonthData;
    
    return data;
  } catch (error) {
    console.error('解码失败:', error);
    throw new Error('Failed to decode multi-month data');
  }
}

// 生成分享URL（单个月份，保持向后兼容）
export function generateShareUrl(
  events: TimeBlock[],
  year: number,
  month: number,
  blurredEvents: Set<number> = new Set(),
  blurredDates: Set<string> = new Set()
): string {
  const monthData = createMonthData(events, year, month, blurredEvents, blurredDates);
  const encoded = encodeMonthData(monthData);
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}#share=${encoded}&y=${year}&m=${month}`;
}

// 生成多个月份分享URL
export function generateMultiMonthShareUrl(
  events: TimeBlock[],
  startYear: number,
  startMonth: number,
  endYear: number,
  endMonth: number,
  blurredEvents: Set<number> = new Set(),
  blurredDates: Set<string> = new Set()
): string {
  const multiMonthData = createMultiMonthData(events, startYear, startMonth, endYear, endMonth, blurredEvents, blurredDates);
  const encoded = encodeMultiMonthData(multiMonthData);
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}#share=${encoded}&sy=${startYear}&sm=${startMonth}&ey=${endYear}&em=${endMonth}`;
}

// 从URL读取数据（支持单月和多月）
export function loadFromUrl(): MonthData | MultiMonthData | null {
  const hash = window.location.hash;
  const match = hash.match(/share=([^&]+)/);
  if (!match) return null;
  
  try {
    const encoded = match[1];
    if (!encoded) return null;
    
    // 先尝试解码为多个月份数据（版本2）
    try {
      const multiMonthData = decodeMultiMonthData(encoded);
      if (multiMonthData.v === 2) {
        return multiMonthData;
      }
    } catch {
      // 如果不是多个月份数据，继续尝试单月数据
    }
    
    // 解码为单月数据（版本1，向后兼容）
    return decodeMonthData(encoded);
  } catch (error) {
    console.error('从URL加载数据失败:', error);
    return null;
  }
}

// 将精简数据扩展为完整TimeBlock（用于兼容现有组件）
export function expandToTimeBlocks(monthData: MonthData | MultiMonthData): TimeBlock[] {
  const isMultiMonth = 'startY' in monthData;
  
  return monthData.events.map((minimal, index) => {
    const isPrivate = minimal.p === 1;
    const event: TimeBlock = {
      _id: index + 1,
      uid: isMultiMonth 
        ? `share-${monthData.startY}-${monthData.startM}-${monthData.endY}-${monthData.endM}-${index}`
        : `share-${monthData.y}-${monthData.m}-${index}`,
      type: minimal.ty,
      title: minimal.t, // 标题保持混淆状态
      color: minimal.c,
      location: isPrivate ? '' : (minimal.loc ?? ''), // 隐私事件清空地点
      description: isPrivate ? '' : (minimal.desc ?? ''), // 隐私事件清空描述
      repeat: '',
      timezone: 'Asia/Taipei',
      allday: minimal.a === 1 ? '1' : '0',
      dt_start: minimal.s,
      dt_end: minimal.e,
      dt_delete: 0,
      dt_update: null,
      dt_until: null,
      position: null,
      extended_properties: null,
      repeat_id: null,
      dt_repeat_start: null,
      category_id: null,
      app_code: null,
      dt_create: null,
      dt_done: minimal.d ?? null
    };
    // 添加隐私标记（使用扩展属性存储）
    if (isPrivate) {
      (event as any).isPrivate = true;
    }
    return event;
  });
}

// 获取URL中的年份和月份参数（支持单月和多月）
export function getUrlParams(): { year: number; month: number } | null {
  const hash = window.location.hash;
  
  // 先检查多个月份参数
  const startYearMatch = hash.match(/[?&]sy=(\d+)/);
  const startMonthMatch = hash.match(/[?&]sm=(\d+)/);
  if (startYearMatch && startMonthMatch && startYearMatch[1] && startMonthMatch[1]) {
    return {
      year: parseInt(startYearMatch[1], 10),
      month: parseInt(startMonthMatch[1], 10)
    };
  }
  
  // 检查单月参数（向后兼容）
  const yearMatch = hash.match(/[?&]y=(\d+)/);
  const monthMatch = hash.match(/[?&]m=(\d+)/);
  
  if (yearMatch && monthMatch && yearMatch[1] && monthMatch[1]) {
    return {
      year: parseInt(yearMatch[1], 10),
      month: parseInt(monthMatch[1], 10)
    };
  }
  
  return null;
}
