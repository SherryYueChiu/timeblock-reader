# 字体文件目录

此目录用于存放项目的自定义字体文件。

## 当前配置的字体

- **字体集 1 (FontSet1)**: 粉圆体 (`jf-openhuninn_v2.1.ttf`) - **默认字体**
- **字体集 2 (FontSet2)**: 全瀨体 (`cjkFonts_allseto_v1.11.ttf`)

## 目录结构

```
fonts/
├── fonts.css                    # 字体定义和配置
├── jf-openhuninn_v2.1.ttf      # 粉圆体（字体集1）
└── cjkFonts_allseto_v1.11.ttf  # 全瀨体（字体集2）
```

## 使用方法

### 切换字体集

项目默认使用**粉圆体**（字体集1）。你可以通过以下方式切换字体：

#### 方法 1: 使用字体管理器（推荐）

```typescript
import { switchFontSet } from '@/utils/fontManager'

// 切换到粉圆体（字体集1）
switchFontSet('font-set-1')

// 切换到全瀨体（字体集2）
switchFontSet('font-set-2')
```

#### 方法 2: 使用 HTML 类名

```html
<!-- 使用粉圆体（字体集1） -->
<div class="font-set-1">...</div>

<!-- 使用全瀨体（字体集2） -->
<div class="font-set-2">...</div>
```

#### 方法 3: 直接操作 DOM

```typescript
// 切换到粉圆体
document.documentElement.classList.add('font-set-1');
document.documentElement.classList.remove('font-set-2');

// 切换到全瀨体
document.documentElement.classList.add('font-set-2');
document.documentElement.classList.remove('font-set-1');
```

## 字体说明

- **粉圆体 (FontSet1)**: 圆润可爱的中文字体，适合日常使用
- **全瀨体 (FontSet2)**: 另一种风格的中文字体，可用于切换风格

## 注意事项

1. 字体选择会自动保存到 localStorage，下次访问时会恢复
2. 使用 `font-display: swap` 确保文字在字体加载前可见
3. 字体文件会被 Vite 打包处理，生产环境会自动优化
4. TTF 格式字体文件体积较大，建议未来考虑转换为 WOFF2 格式以减小体积
