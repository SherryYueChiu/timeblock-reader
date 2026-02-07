# 维护日志 (Maintenance Log)

## 项目概述

**项目名称**: timeblock-reader  
**技术栈**: Vite + Vue 3 + TypeScript  
**项目类型**: 日历应用，用于读取和显示外部应用导出的 SQLite 数据库文件中的时间区块数据

---

## 2026-02-07

### 初始项目搭建

#### 功能需求
- 建立 Vite + Vue 项目
- 自定义日历 UI（不使用现成组件）
- 支持上传 SQLite `.db` 文件
- 读取 `timeblock` 表中的数据
- 显示日历视图，包含年月标题和搜索图标

#### 数据库表结构
从 `timeblock` 表中读取以下字段：
- `_id`: 记录 ID
- `uid`: 唯一标识符
- `type`: 类型（0: 活动, 2: 任务, 3: 备忘, 4: 区间, 5: 习惯）
- `title`: 事件标题
- `color`: 颜色代码
- `location`: 地址
- `description`: 描述
- `allday`: 是否全天事件
- `dt_start`: 开始时间戳
- `dt_end`: 结束时间戳
- `dt_done`: 完成时间戳
- `dt_delete`: 删除时间戳
- 其他字段：`repeat`, `timezone`, `dt_update`, `dt-until`, `position`, `extended_properties`, `repeat_id`, `dt_repeat_start`, `category_id`, `app_code`, `dt_create`

#### 实现的功能

**1. 文件上传组件 (`FileUpload.vue`)**
- 初始画面提供上传按钮
- 支持 `.db` 文件选择
- 使用 `sql.js` 库读取 SQLite 数据库

**2. 数据库读取工具 (`utils/dbReader.ts`)**
- 集成 `sql.js` 库
- 实现 `readDatabase` 函数读取 `.db` 文件
- 处理列名转换（如 `dt-until` → `dt_until`）
- 定义 `TimeBlock` TypeScript 接口
- 添加详细的统计信息输出（总数、各类型数量、已删除数量、全天事件数量）
- 使用 `console.table` 显示第一条记录详情

**3. 日历组件 (`Calendar.vue`)**
- 显示当前年月标题
- 右上角搜索图标按钮
- 7x6 网格日历布局
- 显示星期标题（日、一、二、三、四、五、六）
- 事件显示逻辑：
  - 过滤已删除事件（`dt_delete` 不为空）
  - 支持全天事件和定时事件
  - 根据事件颜色显示不同背景色
  - 显示事件标题
- 当前日期高亮显示
- 非当前月份的日期半透明显示

**4. 移动端适配**
- 响应式设计，支持手机、平板、桌面端
- 优化触摸目标大小（最小 44px）
- 移动端限制每日显示事件数量（小屏 2 个，中屏 3 个，大屏全部）
- 超出限制显示 "+N" 提示
- 优化字体大小、间距、内边距
- 添加触摸滚动优化

**5. 依赖管理**
- 安装 `sql.js` (^1.13.0) 用于 SQLite 数据库读取
- 安装 `@types/sql.js` (^1.4.9) 提供 TypeScript 类型定义

**6. 样式优化**
- 全局样式优化（`style.css`）
- 防止移动端横向滚动
- 优化触摸反馈
- 添加媒体查询适配不同屏幕尺寸
- 支持浅色/深色主题

#### 修复的问题

**1. 事件日期判断逻辑优化**
- **问题**: 非全天事件的日期匹配逻辑不准确
- **修复**: 改进 `isEventOnDate` 函数，正确判断跨天事件
  - 检查事件开始时间是否在指定日期内
  - 检查事件结束时间是否在指定日期内
  - 检查事件是否跨越整个指定日期
- **影响**: 确保跨天事件正确显示在所有相关日期上

**2. 全天事件判断增强**
- **问题**: `allday` 字段可能返回多种数据类型
- **修复**: 扩展判断条件，支持 `'1'`、`1`、`'true'`、`true` 等多种值
- **影响**: 提高数据兼容性

**3. TypeScript 类型定义**
- **问题**: `allday` 字段类型不一致
- **修复**: 将 `allday` 类型定义为 `string | number`
- **影响**: 提高类型安全性

#### 技术细节

**文件结构**
```
timeblock-reader/
├── src/
│   ├── components/
│   │   ├── Calendar.vue      # 日历主组件
│   │   ├── FileUpload.vue    # 文件上传组件
│   │   └── HelloWorld.vue    # 示例组件（未使用）
│   ├── utils/
│   │   └── dbReader.ts       # 数据库读取工具
│   ├── App.vue               # 根组件
│   ├── main.ts               # 入口文件
│   └── style.css             # 全局样式
├── doc/
│   └── MAINTENANCE_LOG.md    # 维护日志（本文件）
├── index.html                # HTML 入口
└── package.json              # 项目配置
```

**关键代码逻辑**

1. **数据库读取流程**:
   ```
   用户选择文件 → FileUpload.vue → readDatabase() → 
   初始化 sql.js → 读取 ArrayBuffer → 打开数据库 → 
   查询 timeblock 表 → 转换数据格式 → 返回 TimeBlock[]
   ```

2. **事件显示流程**:
   ```
   Calendar.vue 接收 timeBlocks → 计算日历天数 → 
   对每一天过滤事件 → isEventOnDate() 判断 → 
   渲染事件到对应日期
   ```

3. **响应式设计**:
   - 使用 CSS 媒体查询 (`@media`)
   - JavaScript 动态计算显示事件数量 (`getMaxEvents()`)
   - 优化触摸交互和滚动性能

#### 待实现功能

- [ ] 搜索功能（搜索图标按钮已添加，功能待实现）
- [ ] 月份切换（上一月/下一月）
- [ ] 事件详情查看（点击事件显示详情）
- [ ] 事件类型图标/标识
- [ ] 事件颜色自定义映射
- [ ] 重复事件处理（`repeat` 字段）
- [ ] 习惯事件的特殊显示（`type: 5`）

#### 已知问题

- 暂无

#### 性能优化建议

- 考虑对大量事件数据进行虚拟滚动优化
- 可以考虑使用 Web Worker 处理数据库读取（如果文件很大）
- 事件颜色映射可以提取为配置文件

---

## 更新记录格式说明

每次更新请按照以下格式记录：

```markdown
## YYYY-MM-DD

### 更新标题

#### 变更内容
- 具体变更 1
- 具体变更 2

#### 修复的问题
- 问题描述及解决方案

#### 技术细节
- 相关技术说明

#### 影响范围
- 受影响的文件/功能
```

---

## 参考资料

- [Vue 3 文档](https://vuejs.org/)
- [Vite 文档](https://vitejs.dev/)
- [sql.js 文档](https://sql.js.org/)
- [TypeScript 文档](https://www.typescriptlang.org/)
