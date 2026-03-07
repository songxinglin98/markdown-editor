# Markdown Editor

一款现代化的所见即所得（WYSIWYG）Markdown 编辑器桌面应用，提供类似 Typora 的编辑体验。

![Markdown Editor](https://img.shields.io/badge/version-0.1.0-blue.svg)
![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ 功能特性

### 📝 所见即所得编辑
- **实时渲染**：编辑时即可看到最终效果，无需分屏预览
- **富文本体验**：直接在渲染后的内容上进行编辑

### 🎨 格式化工具栏
- **文本样式**：加粗、斜体
- **标题级别**：H1、H2、H3 快速插入
- **代码支持**：行内代码、代码块
- **引用与分割**：块引用、水平分割线
- **列表功能**：无序列表、有序列表
- **链接插入**：快速添加超链接

### 📑 目录导航
- **自动生成**：根据文档标题自动生成目录结构
- **层级展示**：支持 H1-H6 六级标题，缩进显示层级关系
- **快速跳转**：点击目录项平滑滚动到对应位置
- **智能过滤**：自动忽略代码块中的 `#` 符号
- **可折叠**：通过工具栏按钮显示/隐藏目录侧边栏

### 📁 文件操作
- **新建文件**：快速创建空白文档 (⌘N)
- **打开文件**：支持 .md、.markdown、.txt 格式 (⌘O)
- **保存文件**：保存当前文档 (⌘S)
- **另存为**：将文档保存到新位置

### 🎯 其他特性
- **深色模式**：自动适配系统主题
- **字数统计**：实时显示单词数和字符数
- **修改提示**：未保存时标题栏显示修改标记
- **快捷键支持**：常用操作均支持键盘快捷键

## 🛠️ 技术栈

### 前端
- **[React 19](https://react.dev/)** - 用户界面框架
- **[TypeScript](https://www.typescriptlang.org/)** - 类型安全的 JavaScript
- **[Vite](https://vitejs.dev/)** - 下一代前端构建工具
- **[Tailwind CSS 4](https://tailwindcss.com/)** - 原子化 CSS 框架

### 编辑器
- **[Milkdown](https://milkdown.dev/)** - 插件驱动的 WYSIWYG Markdown 编辑器
- **[ProseMirror](https://prosemirror.net/)** - 底层富文本编辑框架
- **Nord 主题** - 优雅的编辑器配色方案

### 桌面端
- **[Tauri 2.0](https://tauri.app/)** - 轻量级跨平台桌面应用框架
- **Rust** - 高性能后端运行时

## 📦 安装与运行

### 环境要求
- Node.js 18+
- Rust 1.70+
- pnpm / npm / yarn

### 开发模式

```bash
# 克隆项目
git clone https://github.com/songxinglin98/markdown-editor.git
cd markdown-editor

# 安装依赖
npm install

# 启动开发服务器
npm run tauri dev
```

### 构建生产版本

```bash
# 构建桌面应用
npm run tauri build
```

构建产物将在 `src-tauri/target/release/bundle/` 目录下生成。

## ⌨️ 快捷键

| 快捷键 | 功能 |
|--------|------|
| ⌘/Ctrl + N | 新建文件 |
| ⌘/Ctrl + O | 打开文件 |
| ⌘/Ctrl + S | 保存文件 |
| ⌘/Ctrl + B | 加粗 |
| ⌘/Ctrl + I | 斜体 |

## 📁 项目结构

```
markdown-editor/
├── src/                    # 前端源码
│   ├── components/         # React 组件
│   │   ├── MilkdownEditor.tsx  # WYSIWYG 编辑器
│   │   ├── TableOfContents.tsx # 目录导航
│   │   └── Toolbar.tsx         # 工具栏
│   ├── App.tsx             # 主应用组件
│   └── main.tsx            # 入口文件
├── src-tauri/              # Tauri 后端
│   ├── src/                # Rust 源码
│   └── tauri.conf.json     # Tauri 配置
└── package.json
```

## 🔮 未来计划

- [ ] 导出 PDF/HTML
- [ ] 图片拖拽上传
- [ ] 多标签页支持
- [ ] 自定义主题
- [ ] 插件系统
- [ ] 云同步功能

## 📄 开源协议

MIT License © 2024 [songxinglin98](https://github.com/songxinglin98)

---

如果这个项目对你有帮助，欢迎 ⭐ Star 支持！