# TimeBlock Reader

一个基于 Vite + Vue 3 + TypeScript 的日历应用，用于读取和显示外部应用导出的 SQLite 数据库文件中的时间区块数据。

## 功能特性

- 📅 **自定义日历视图**：不使用现成组件，完全自定义的日历 UI
- 📁 **数据库文件上传**：支持上传 SQLite `.db` 文件
- 🎨 **多种事件类型**：
  - 活动（type: 0）- 色块显示
  - 任务（type: 2）- 圆角矩形 checkbox + 文字
  - 备忘（type: 3）- 色块显示
  - 区间（type: 4）- 横跨多个日期的双向箭头线
  - 习惯（type: 5）- 圆形 checkbox + 文字
- 🎨 **颜色支持**：根据数据库中的 color 字段显示对应颜色
- 📱 **响应式设计**：支持桌面、平板、手机等多种屏幕尺寸
- 🌓 **主题支持**：自动适配浅色/深色主题

## 技术栈

- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - 类型安全的 JavaScript
- **Vite** - 下一代前端构建工具
- **sql.js** - 在浏览器中运行 SQLite

## 项目结构

```
timeblock-reader/
├── src/
│   ├── components/
│   │   ├── Calendar.vue      # 日历主组件
│   │   ├── FileUpload.vue   # 文件上传组件
│   │   └── HelloWorld.vue   # 示例组件（未使用）
│   ├── utils/
│   │   └── dbReader.ts      # 数据库读取工具
│   ├── App.vue               # 根组件
│   ├── main.ts               # 入口文件
│   └── style.css             # 全局样式
├── doc/
│   └── MAINTENANCE_LOG.md    # 维护日志
├── index.html                # HTML 入口
└── package.json              # 项目配置
```

## 安装和运行

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 使用方法

1. 启动开发服务器后，在浏览器中打开应用
2. 点击上传按钮，选择要读取的 SQLite `.db` 文件
3. 应用会自动读取 `timeblock` 表中的数据
4. 日历会显示所有事件，不同类型的事件有不同的显示样式

## 数据库表结构

应用读取 `timeblock` 表中的以下字段：

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

## 开发说明

详细的开发历程和功能实现记录请查看 [维护日志](./doc/MAINTENANCE_LOG.md)。

## License

MIT
