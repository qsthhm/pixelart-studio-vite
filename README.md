# Pixelart Studio

纯前端像素画/故障效果 GIF 生成器 —— 用 Vite + React 构建，无后端依赖。

## 本地开发

```bash
npm install
npm run dev
```

打开 http://localhost:5173

## 构建生产版本

```bash
npm run build
```

产物在 `dist/` 目录，是纯静态文件。

## 部署到 Vercel

### 方式 A：Git 集成（推荐）

1. 把项目推到 GitHub
2. 在 Vercel 点 **Add New Project** → 选这个 repo
3. 其他设置全部保持默认（Vercel 会自动识别 Vite），点 Deploy
4. 完事

以后 `git push` 到 main 分支会自动重新部署。

### 方式 B：Vercel CLI

```bash
npm i -g vercel
vercel          # 首次部署
vercel --prod   # 推送正式版
```

### 方式 C：拖拽部署

```bash
npm run build
```

然后把 `dist/` 文件夹拖到 https://vercel.com/new

## 技术栈

- React 18
- Vite 5
- gif.js（GIF 编码，Web Worker）
- 所有依赖本地化，无 CDN

## 文件结构

```
src/
  main.jsx          # React 入口
  App.jsx           # 主应用
  components.jsx    # 所有子组件
  processImage.js   # 像素化 / 抖动 / 故障 / 量化算法
  samples.js        # 示例图程序化绘制
  palettes.js       # 调色板数据
  presets.js        # 预设效果
  bayer.js          # Bayer 抖动矩阵
  tweakDefaults.js  # 主题微调默认值
  styles.css        # 全部样式
```
