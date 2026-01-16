// 用于处理 react-reconciler 导入的 stub 文件
// 主要用于构建过程中解决依赖问题

// 导出一些基本的常量和函数，以便 @react-three/fiber 能够正常工作

export const NoEffect = 0;
export const PerformedWork = 1;
export const Placement = 2;
export const Update = 4;
export const PlacementAndUpdate = 6;
export const Deletion = 8;
export const ContentReset = 16;
export const Callback = 32;
export const DidCapture = 64;
export const Ref = 128;
export const Snapshot = 256;
export const Passive = 512;
export const Hydrating = 1024;
export const HydratingAndUpdate = 1028;
export const NoTimeout = -1;
export const Sync = 0;
export const Batched = 1;
export const ConcurrentBatch = 2;
export const InteractiveUpdates = 3;
export const PriorityLevel = 4;
export const ImmediatePriority = 1;
export const UserBlockingPriority = 2;
export const NormalPriority = 3;
export const LowPriority = 4;
export const IdlePriority = 5;
export const ConcurrentRoot = 1;

// 导出一个简单的 react-reconciler 实现
export default {
  // 空实现，仅用于构建通过
};
