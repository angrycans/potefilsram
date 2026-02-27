# Potefilsram

基于 Babylon.js + WebGPU 的跨平台 3D 游戏项目。

## 技术栈

| 层级 | 技术 |
|------|------|
| 3D 引擎 | Babylon.js (WebGPU + WebGL fallback) |
| 语言 | TypeScript |
| 构建 | Vite |
| 桌面端 (Steam) | Tauri v2 |
| 移动端 (iOS/Android) | Capacitor v6 |

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器（浏览器预览）
npm run dev
```

访问 http://localhost:5173 查看 3D 场景。

## 桌面端 (Tauri / Steam)

需要先安装 Rust: https://rustup.rs

```bash
# 开发模式
npm run tauri:dev

# 构建发布包
npm run tauri:build
```

构建产物在 `src-tauri/target/release/bundle/` 中。

## 移动端 (Capacitor)

### iOS

需要 macOS + Xcode。

```bash
# 添加 iOS 平台
npx cap add ios

# 构建 Web → 同步到原生项目
npm run build
npm run cap:sync

# 在 Xcode 中打开
npm run cap:open:ios
```

### Android

需要 Android Studio。

```bash
# 添加 Android 平台
npx cap add android

# 构建 Web → 同步到原生项目
npm run build
npm run cap:sync

# 在 Android Studio 中打开
npm run cap:open:android
```

## 项目结构

```
├── src/                  # Web 应用源码 (TypeScript)
│   ├── main.ts          # 入口：Babylon.js 场景 + WebGPU 引擎
│   └── style.css        # 全局样式
├── src-tauri/           # Tauri 桌面端配置 (Rust)
├── index.html           # HTML 入口
├── capacitor.config.ts  # Capacitor 移动端配置
├── vite.config.ts       # Vite 构建配置
└── package.json
```

## WebGPU 兼容性

- **桌面浏览器 / Tauri**: Chrome 113+, Edge 113+, Firefox Nightly — 完整支持 WebGPU
- **移动端**: 自动 fallback 到 WebGL2，保证兼容性
- 代码中已实现自动检测 + 降级逻辑
