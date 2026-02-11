# 维护日志 (Maintenance Log)

## 项目概述

**项目名称**: timeblock-reader  
**技术栈**: Vite + Vue 3 + TypeScript  
**项目类型**: 日历应用，用于读取和显示外部应用导出的 SQLite 数据库文件中的时间区块数据

---

## 版本历史

### v0.6.0 - 日期弹窗UX优化 (2026-02-11)

**主要变更**
- ✅ 日期弹窗标题显示具体日期（如"2026年02月09日"）
- ✅ 事件描述保留换行格式（移除line-clamp限制）
- ✅ 隐私事件在事件列表右侧显示隐私图标（替代模糊背景）
- ✅ 优化多层弹窗交互：点击日期后再点击事件，日期弹窗保持打开，事件详情以第二层弹窗显示

**技术细节**
- 新增 `formatDisplayDate()` 函数格式化日期显示
- 事件描述使用 `white-space: pre-wrap` 保留换行
- 移除模糊背景动画相关代码，改用图标标识
- 优化弹窗关闭逻辑，支持多层弹窗独立关闭

**提交记录**
- `9908f54` - feat: improve date modal UX - show date in title, preserve line breaks, add privacy icon
- `167f3e2` - docs: update README with latest UX improvements

---

### v0.5.0 - 农历显示与多月份分享 (2026-02-10)

**主要变更**
- ✅ 添加准确的台湾农历日历显示（使用 `lunar-javascript` 库）
- ✅ 特殊农历日期使用图标显示（初一、初八、十五、二十二）
- ✅ 分享功能支持多月份范围选择（1-3个月）
- ✅ 优化分享UI：月份范围选择器，上下箭头微调
- ✅ 分享模式优化：隐藏编辑/分享按钮，禁用日期标记，隐私事件不可点击

**技术细节**
- 新增 `src/utils/lunarCalendar.ts` 农历转换工具
- 新增 `src/types/lunar-javascript.d.ts` 类型声明
- 扩展 `shareEncoder.ts` 支持 `MultiMonthData` 格式
- URL参数：`sy`, `sm`, `ey`, `em` 表示开始和结束年月

**提交记录**
- `3649cdb` - Add month range selection for sharing
- `a4a9fb8` - feat: add lunar calendar icons to date cells
- `c9323b9` - feat: optimize modal UI and privacy protection for sharing
- `d83c4d1` - Clean up redundant code and styles

---

### v0.4.0 - 字体系统与UI增强 (2026-02-10)

**主要变更**
- ✅ 添加自定义字体系统（粉圆体、全瀨体）
- ✅ 实现字体管理器，支持字体切换和持久化存储
- ✅ 重构上传界面：游戏风格载入提示（打字机效果 + 状态指示器）
- ✅ 添加3D透视网格背景和大标题
- ✅ 优化按钮样式为纯文字显示

**技术细节**
- 新增 `src/utils/fontManager.ts` 字体管理工具
- 新增 `src/assets/fonts/` 字体文件目录
- 字体偏好自动保存到 localStorage
- CSS变量：`--font-family-primary`, `--font-family-fallback`

**提交记录**
- `1301114` - feat: 添加字体系统和游戏风格的上传界面
- `68ecae3` - Update README.md with latest features

---

### v0.3.0 - 分享功能与字段编辑 (2026-02-09)

**主要变更**
- ✅ 实现日历分享功能：数据压缩编码到URL，一键生成分享链接
- ✅ 支持从URL自动加载分享数据（Hash路由保护隐私）
- ✅ 字段编辑功能：标题和描述可编辑，支持快捷键（Enter/Esc/Ctrl+Enter）
- ✅ 任务完成状态显示：已完成任务显示打勾checkbox
- ✅ 时间范围显示优化：同一天只显示一次日期

**技术细节**
- 新增 `src/utils/shareEncoder.ts` 分享编码/解码工具
- 新增 `doc/SHARE_DESIGN.md` 分享功能设计文档
- 数据精简策略：只保留显示必需字段，数据量减少70-80%
- 压缩流程：完整数据 → 精简数据 → JSON → Gzip → Base64 → URL参数
- 新增依赖：`pako` (Gzip压缩库)

**提交记录**
- `3f159e2` - feat: add calendar share feature and field editing optimization
- `6f566a0` - feat: 实现任务完成状态显示和标题编辑功能
- `e36a68b` - fix: 修復期間的箭頭過寬

---

### v0.2.0 - 核心功能实现 (2026-02-07)

**主要变更**
- ✅ 事件详情弹窗：显示标题、内容、地点、时间范围、类型
- ✅ 日期标记功能：半透明遮罩、标记文字、贴图（三组贴图，支持APNG动态贴图）
- ✅ 隐私保护功能：日期级别和事件级别模糊
- ✅ 搜索功能：搜索事件标题、描述、地点，点击结果跳转
- ✅ 月份导航：上一月/下一月切换，点击年月跳转今天
- ✅ 事件显示优化：连续活动连接、区间事件箭头、任务/习惯checkbox样式
- ✅ 颜色支持：根据数据库color字段动态应用颜色

**技术细节**
- 新增 `EventModal.vue` 事件详情和日期标记弹窗组件
- APNG自动重播功能：定时器管理，自动刷新动画
- 莫兰迪配色常用颜色选择器
- 响应式设计优化：移动端适配

**提交记录**
- `bcc86ba` - feat: 添加事件弹窗、日期标记、模糊功能和颜色支持
- `4a524f4` - feat: optimize modal UX, add month navigation, continuous event styling
- `9d5cb62` - feat: 实现搜索功能并修复事件弹窗地址显示
- `d2937ff` - fix: 修复贴图组切换问题并实现APNG自动重播

---

### v0.1.0 - 初始版本 (2026-02-07)

**主要变更**
- ✅ 项目搭建：Vite + Vue 3 + TypeScript
- ✅ 自定义日历UI：7x6网格布局，不使用现成组件
- ✅ 数据库文件上传：支持SQLite `.db` 文件读取
- ✅ 事件显示：根据类型显示不同样式（活动、任务、备忘、区间、习惯）
- ✅ 响应式设计：支持桌面、平板、手机

**技术细节**
- 使用 `sql.js` 在浏览器中读取SQLite数据库
- 读取 `timeblock` 表数据，支持多种事件类型
- 事件日期判断逻辑：支持跨天事件
- 移动端优化：限制每日显示事件数量，超出显示"+N"

**提交记录**
- `07e9199` - Initial commit: TimeBlock Reader calendar application
- `59cb516` - Add GitHub setup guide

---

## 数据库表结构

从 `timeblock` 表中读取以下字段：

- `_id`: 记录 ID
- `uid`: 唯一标识符
- `type`: 类型（0: 活动, 2: 任务, 3: 备忘, 4: 区间, 5: 习惯）
- `title`: 事件标题
- `color`: 颜色代码（数字）
- `location`: 地址
- `description`: 描述
- `allday`: 是否全天事件
- `dt_start`: 开始时间戳
- `dt_end`: 结束时间戳
- `dt_done`: 完成时间戳
- `dt_delete`: 删除时间戳

---

## 项目结构

```
timeblock-reader/
├── src/
│   ├── components/
│   │   ├── Calendar.vue      # 日历主组件
│   │   ├── FileUpload.vue   # 文件上传组件
│   │   └── EventModal.vue    # 事件详情和日期标记弹窗
│   ├── utils/
│   │   ├── dbReader.ts      # 数据库读取工具
│   │   ├── shareEncoder.ts  # 日历分享编码/解码工具
│   │   ├── lunarCalendar.ts # 农历日期转换工具
│   │   └── fontManager.ts   # 字体切换管理工具
│   ├── assets/
│   │   └── fonts/           # 自定义字体文件
│   ├── types/
│   │   └── lunar-javascript.d.ts  # 农历库类型声明
│   ├── App.vue               # 根组件
│   ├── main.ts               # 入口文件
│   └── style.css             # 全局样式
├── doc/
│   ├── MAINTENANCE_LOG.md    # 维护日志（本文件）
│   └── SHARE_DESIGN.md       # 分享功能设计文档
├── index.html                # HTML 入口
└── package.json              # 项目配置
```

---

## 技术栈

- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - 类型安全的 JavaScript
- **Vite** - 下一代前端构建工具
- **sql.js** - 在浏览器中运行 SQLite
- **pako** - Gzip压缩库（用于分享功能）
- **lunar-javascript** - 农历日期转换库（用于显示台湾农历）

---

## 参考资料

- [Vue 3 文档](https://vuejs.org/)
- [Vite 文档](https://vitejs.dev/)
- [sql.js 文档](https://sql.js.org/)
- [TypeScript 文档](https://www.typescriptlang.org/)
