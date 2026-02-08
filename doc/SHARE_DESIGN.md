# 日历分享功能设计方案

## 目标
将指定月份的日历数据压缩后放入URL参数，实现无需上传db文件即可分享日历视图。

## 一、数据结构设计

### 1.1 精简数据接口（只保留显示必需字段）

```typescript
// 精简版事件数据（用于URL分享）
interface MinimalTimeBlock {
  t: string;    // title - 标题（必需）
  s: number;    // dt_start - 开始时间戳（必需）
  e: number;    // dt_end - 结束时间戳（必需）
  ty: number;   // type - 类型：0活动 2任务 3备忘 4区间 5习惯（必需）
  c: number;    // color - 颜色代码（必需）
  a: number;    // allday - 是否全天：0否 1是（必需）
  d?: number;   // dt_done - 完成时间戳（可选，仅任务类型）
  // 以下字段仅在弹窗详情中需要，但为保持基本功能，可选择性包含
  loc?: string; // location - 地点（可选）
  desc?: string; // description - 描述（可选，如果太长可截断）
}

// 月份数据包
interface MonthData {
  v: number;        // version - 数据格式版本（用于未来兼容性）
  y: number;        // year - 年份
  m: number;        // month - 月份（1-12）
  events: MinimalTimeBlock[];
}
```

### 1.2 字段精简说明

**保留的字段（必需）：**
- `title`: 显示在日历上
- `dt_start`, `dt_end`: 计算事件显示位置
- `type`: 决定显示样式（色块/checkbox/区间线）
- `color`: 显示颜色
- `allday`: 判断全天事件逻辑
- `dt_done`: 任务完成状态

**可选的字段：**
- `location`: 弹窗中显示，但非必需
- `description`: 弹窗中显示，如果太长可以截断或省略

**省略的字段：**
- `_id`, `uid`: 仅用于内部标识，分享不需要
- `dt_delete`: 分享时已过滤，不需要
- `repeat`, `timezone`, `dt_update` 等：不影响显示

## 二、压缩和编码方案

### 2.1 压缩流程

```
原始数据 → JSON序列化 → Gzip压缩 → Base64编码 → URL参数
```

### 2.2 实现步骤

#### 步骤1：数据精简
```typescript
function minimizeTimeBlock(event: TimeBlock): MinimalTimeBlock {
  return {
    t: event.title,
    s: event.dt_start,
    e: event.dt_end,
    ty: event.type,
    c: event.color,
    a: event.allday === '1' || event.allday === 1 || event.allday === 'true' ? 1 : 0,
    d: event.dt_done && event.dt_done !== 0 ? event.dt_done : undefined,
    loc: event.location || undefined,
    desc: event.description ? event.description.substring(0, 200) : undefined // 限制描述长度
  };
}
```

#### 步骤2：筛选月份数据
```typescript
function filterMonthEvents(
  events: TimeBlock[], 
  year: number, 
  month: number
): MinimalTimeBlock[] {
  const monthStart = new Date(year, month - 1, 1).getTime();
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999).getTime();
  
  return events
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
}
```

#### 步骤3：压缩和编码
```typescript
import pako from 'pako';

function encodeMonthData(data: MonthData): string {
  // 1. JSON序列化
  const json = JSON.stringify(data);
  
  // 2. Gzip压缩
  const compressed = pako.deflate(json, { level: 9 }); // level 9 = 最高压缩率
  
  // 3. Base64编码
  const base64 = btoa(String.fromCharCode(...compressed));
  
  return base64;
}
```

#### 步骤4：生成URL
```typescript
function generateShareUrl(
  events: TimeBlock[], 
  year: number, 
  month: number
): string {
  const monthData: MonthData = {
    v: 1, // 版本号
    y: year,
    m: month,
    events: filterMonthEvents(events, year, month)
  };
  
  const encoded = encodeMonthData(monthData);
  
  // 使用hash路由，避免发送到服务器
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}#share=${encoded}&y=${year}&m=${month}`;
}
```

### 2.3 解码流程

```typescript
function decodeMonthData(encoded: string): MonthData {
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
    throw new Error('Failed to decode share data');
  }
}

// 将精简数据转换回完整TimeBlock格式（用于兼容现有组件）
function expandToTimeBlock(minimal: MinimalTimeBlock, id: number): TimeBlock {
  return {
    _id: id,
    uid: `share-${id}`,
    type: minimal.ty,
    title: minimal.t,
    color: minimal.c,
    location: minimal.loc || '',
    description: minimal.desc || '',
    repeat: null,
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
    dt_done: minimal.d || null
  };
}
```

## 三、URL格式设计

### 3.1 URL结构

```
https://your-app.com/#share={encoded_data}&y=2026&m=2
```

**参数说明：**
- `share`: Base64编码的压缩数据（必需）
- `y`: 年份（可选，用于快速验证）
- `m`: 月份（可选，用于快速验证）

### 3.2 使用Hash路由的原因

1. **隐私保护**：Hash部分（`#`之后）不会发送到服务器
2. **无需后端**：完全前端实现
3. **浏览器兼容**：所有现代浏览器都支持

## 四、数据大小估算

### 4.1 单个事件大小

**精简前（完整TimeBlock）：**
```json
{
  "_id": 123,
  "uid": "a051269B8-2EA0-4506-9AD7-1D6629BAB7C7",
  "type": 2,
  "title": "麥克風放電腦包",
  "color": 0,
  "location": null,
  "description": "",
  "repeat": null,
  "timezone": "Asia/Taipei",
  "allday": "1",
  "dt_start": 1771200000000,
  "dt_end": 1771631999999,
  "dt_done": 0,
  "dt_delete": 0,
  ...
}
```
**大小：约 300-500 字节**

**精简后（MinimalTimeBlock）：**
```json
{"t":"麥克風放電腦包","s":1771200000000,"e":1771631999999,"ty":2,"c":0,"a":1}
```
**大小：约 80-120 字节（减少70-80%）**

### 4.2 压缩效果

- **50个事件**：
  - 精简后JSON：约 4-6KB
  - Gzip压缩后：约 1-2KB
  - Base64编码后：约 1.3-2.7KB

- **100个事件**：
  - 精简后JSON：约 8-12KB
  - Gzip压缩后：约 2-4KB
  - Base64编码后：约 2.7-5.3KB

### 4.3 URL长度限制

- **浏览器限制**：通常 2048-8192 字符
- **推荐限制**：保持在 2000 字符以内
- **如果超出**：提示用户使用二维码分享或分月分享

## 五、实现方案

### 5.1 需要安装的依赖

```bash
npm install pako
npm install --save-dev @types/pako
```

### 5.2 文件结构

```
src/
├── utils/
│   ├── dbReader.ts          # 现有文件
│   └── shareEncoder.ts      # 新增：分享编码/解码工具
└── components/
    ├── Calendar.vue         # 修改：添加分享功能
    └── ShareModal.vue        # 新增：分享弹窗（可选）
```

### 5.3 核心功能实现

**src/utils/shareEncoder.ts**
```typescript
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

// 编码函数
export function encodeMonthData(data: MonthData): string {
  const json = JSON.stringify(data);
  const compressed = pako.deflate(json, { level: 9 });
  return btoa(String.fromCharCode(...compressed));
}

// 解码函数
export function decodeMonthData(encoded: string): MonthData {
  const binary = atob(encoded);
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  const decompressed = pako.inflate(bytes, { to: 'string' });
  return JSON.parse(decompressed) as MonthData;
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
    return decodeMonthData(match[1]);
  } catch {
    return null;
  }
}

// 辅助函数
function minimizeTimeBlock(event: TimeBlock): MinimalTimeBlock {
  return {
    t: event.title,
    s: event.dt_start,
    e: event.dt_end,
    ty: event.type,
    c: event.color,
    a: event.allday === '1' || event.allday === 1 || event.allday === 'true' ? 1 : 0,
    d: event.dt_done && event.dt_done !== 0 ? event.dt_done : undefined,
    loc: event.location || undefined,
    desc: event.description ? event.description.substring(0, 200) : undefined
  };
}

function createMonthData(
  events: TimeBlock[],
  year: number,
  month: number
): MonthData {
  const monthStart = new Date(year, month - 1, 1).getTime();
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999).getTime();
  
  const filteredEvents = events
    .filter(event => {
      if (event.dt_delete) return false;
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

// 将精简数据扩展为完整TimeBlock（用于兼容现有组件）
export function expandToTimeBlocks(monthData: MonthData): TimeBlock[] {
  return monthData.events.map((minimal, index) => ({
    _id: index + 1,
    uid: `share-${monthData.y}-${monthData.m}-${index}`,
    type: minimal.ty,
    title: minimal.t,
    color: minimal.c,
    location: minimal.loc || '',
    description: minimal.desc || '',
    repeat: null,
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
    dt_done: minimal.d || null
  }));
}
```

## 六、使用流程

### 6.1 生成分享链接

1. 用户在日历页面点击"分享本月"按钮
2. 系统筛选当前月份的事件
3. 精简、压缩、编码数据
4. 生成URL并显示给用户
5. 用户复制链接或生成二维码

### 6.2 打开分享链接

1. 应用启动时检查URL hash参数
2. 如果存在`share`参数，解码数据
3. 将精简数据扩展为TimeBlock格式
4. 直接显示日历，跳过文件上传步骤

## 七、限制和注意事项

### 7.1 数据限制

- **事件数量**：建议单月不超过100个事件
- **描述长度**：自动截断到200字符
- **URL长度**：如果超过2000字符，提示用户使用二维码

### 7.2 兼容性

- **版本控制**：使用`v`字段标识数据格式版本
- **向后兼容**：未来如果修改格式，需要支持旧版本解码

### 7.3 隐私和安全

- ✅ Hash路由保护：数据不会发送到服务器
- ⚠️ 浏览器历史：URL会保存在浏览器历史中
- ⚠️ 分享风险：链接包含所有数据，一旦分享无法撤销

### 7.4 性能考虑

- 压缩/解压是同步操作，数据量大时可能阻塞UI
- 建议添加加载提示
- 考虑使用Web Worker处理压缩/解压

## 八、扩展功能

### 8.1 二维码生成

```typescript
import QRCode from 'qrcode';

async function generateQRCode(url: string): Promise<string> {
  return await QRCode.toDataURL(url, {
    width: 300,
    margin: 2,
    errorCorrectionLevel: 'M'
  });
}
```

### 8.2 分享弹窗

可以创建一个分享弹窗组件，包含：
- 分享链接显示和复制按钮
- 二维码显示
- 数据大小提示
- 分享说明

## 九、测试建议

1. **数据大小测试**：测试不同数量事件的数据大小
2. **压缩率测试**：验证压缩效果
3. **URL长度测试**：确保不超过浏览器限制
4. **解码测试**：验证各种边界情况
5. **兼容性测试**：不同浏览器和设备的URL处理

## 十、未来优化方向

1. **增量压缩**：如果数据量大，考虑只压缩增量数据
2. **多月份支持**：支持分享多个月份
3. **数据加密**：如果需要隐私保护，可以添加加密层
4. **服务端存储**：如果URL太长，可以存储到服务端，只传递ID
