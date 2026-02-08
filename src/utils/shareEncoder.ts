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
}

export interface MonthData {
  v: number;              // version
  y: number;              // year
  m: number;              // month
  events: MinimalTimeBlock[];
}

// 精简事件数据
function minimizeTimeBlock(event: TimeBlock): MinimalTimeBlock {
  const minimal: MinimalTimeBlock = {
    t: event.title,
    s: event.dt_start,
    e: event.dt_end,
    ty: event.type,
    c: event.color,
    a: event.allday === '1' || event.allday === 1 || event.allday === 'true' ? 1 : 0
  };

  // 可选字段
  if (event.dt_done && event.dt_done !== 0) {
    minimal.d = event.dt_done;
  }
  if (event.location) {
    minimal.loc = event.location;
  }
  if (event.description) {
    minimal.desc = event.description.substring(0, 200);
  }

  return minimal;
}

// 创建月份数据
function createMonthData(
  events: TimeBlock[],
  year: number,
  month: number
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
    .map(minimizeTimeBlock);
  
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

// 生成分享URL
export function generateShareUrl(
  events: TimeBlock[],
  year: number,
  month: number
): string {
  const monthData = createMonthData(events, year, month);
  const encoded = encodeMonthData(monthData);
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}#share=${encoded}&y=${year}&m=${month}`;
}

// 从URL读取数据
export function loadFromUrl(): MonthData | null {
  const hash = window.location.hash;
  const match = hash.match(/share=([^&]+)/);
  if (!match) return null;
  
  try {
    const encoded = match[1];
    if (!encoded) return null;
    return decodeMonthData(encoded);
  } catch (error) {
    console.error('从URL加载数据失败:', error);
    return null;
  }
}

// 将精简数据扩展为完整TimeBlock（用于兼容现有组件）
export function expandToTimeBlocks(monthData: MonthData): TimeBlock[] {
  return monthData.events.map((minimal, index) => ({
    _id: index + 1,
    uid: `share-${monthData.y}-${monthData.m}-${index}`,
    type: minimal.ty,
    title: minimal.t,
    color: minimal.c,
    location: minimal.loc ?? '',
    description: minimal.desc ?? '',
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
  }));
}

// 获取URL中的年份和月份参数
export function getUrlParams(): { year: number; month: number } | null {
  const hash = window.location.hash;
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
