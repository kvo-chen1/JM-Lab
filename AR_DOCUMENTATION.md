# AR 模块技术文档

## 1. 架构概述

AR 预览模块 (`SimplifiedARPreview`) 基于 `React Three Fiber` (R3F) 和 `WebXR` 标准构建。它提供了一个轻量级的 AR 查看器，支持 3D 模型 (GLTF/GLB) 和 2D 图片在真实环境中的放置和交互。

### 核心依赖
- **@react-three/fiber**: 3D 渲染核心。
- **@react-three/xr**: WebXR 会话管理、平面检测 (Hit Test)。
- **@react-three/drei**: 辅助组件 (Environment, OrbitControls, useGLTF)。
- **@use-gesture/react**: 手势交互 (Drag, Pinch)。

## 2. 组件结构

```mermaid
graph TD
    A[SimplifiedARPreview] --> B[Canvas]
    B --> C[XR Store]
    B --> D[Lighting/Environment]
    B --> E[Content Group]
    E --> F[ModelViewer / ImageViewer]
    E --> G[Reticle (光圈)]
    E --> H[ARGestures (手势逻辑)]
    A --> I[UI Controls (Overlay)]
```

## 3. 关键实现细节

### 3.1 WebXR 初始化
使用 `createXRStore` 创建全局 XR 状态管理器，配置 `hit-test` 和 `dom-overlay` 特性。

```typescript
const store = createXRStore({
  features: ['hit-test', 'dom-overlay'],
});
```

### 3.2 平面检测 (Hit Testing)
通过 `useXRHitTest` Hook 实时获取摄像机射线与真实世界的交点。
- **Reticle 组件**: 仅在未放置模型时显示，跟随检测到的平面移动。
- **坐标转换**: 使用 `getWorldMatrix` 将 Hit Test 结果转换为 Three.js 坐标。

### 3.3 手势交互
实现了双模式交互：
1. **屏幕手势 (Mobile优先)**:
   - 使用 `ARGestures` 组件监听 `gl.domElement` (Canvas) 上的触摸事件。
   - `useDrag`: 映射 x 轴位移到模型 Y 轴旋转。
   - `usePinch`: 映射捏合距离到模型 Scale。
2. **UI 滑块**:
   - 提供精确的数值控制，与手势状态双向绑定。

### 3.4 截图与分享
利用 Canvas 的 `toDataURL` 方法导出图片，并结合 `navigator.share` API 调用原生分享面板。
*注意*: 需在 Canvas 配置中开启 `preserveDrawingBuffer: true` 才能截图。

## 4. 开发指南

### 添加新模型格式支持
修改 `ModelViewer` 组件，引入相应的 Loader (如 `FBXLoader`, `OBJLoader`) 并替换 `useGLTF`。

### 自定义光照环境
修改 `Environment` 组件的 `preset` 属性 (支持: sunset, dawn, night, warehouse, forest 等)。

```tsx
<Environment preset="studio" />
```

## 5. 常见问题排查

- **AR 无法启动**: 检查设备是否支持 WebXR (Chrome Android 需安装 Google Play Services for AR)。
- **构建报错 "react-reconciler"**: 确保 `vite.config.ts` 中配置了正确的别名指向本地 node_modules。
- **手势无反应**: 确保只在 AR 模式且模型已放置后才挂载 `ARGestures` 组件。
