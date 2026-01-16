// react-reconciler/constants 的 stub 实现
// 用于解决 @react-three/fiber 和 @react-three/drei 的构建问题

// 只导出实际需要的常量，避免重复导出

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
export const BlockingRoot = 2;
export const LegacyRoot = 0;

export const DiscreteEventPriority = 1;
export const ContinuousEventPriority = 2;
export const DefaultEventPriority = 3;
export const IdleEventPriority = 4;
export const OffscreenPriority = 5;

export default {
  // 空实现，仅用于构建通过
};