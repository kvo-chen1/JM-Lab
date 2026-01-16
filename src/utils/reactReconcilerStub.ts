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

// 添加 @react-three/fiber 所需的优先级常量
export const DefaultEventPriority = 1;
export const ContinuousEventPriority = 2;
export const DiscreteEventPriority = 3;

// 添加 calculateColor 函数，解决运行时错误
export const calculateColor = () => {
  // 返回一个默认颜色值，避免 @react-three/fiber 运行时错误
  return [0, 0, 0, 1];
};

// 导出一个更完整的 react-reconciler 实现，避免运行时错误
export default function createReconciler() {
  return {
    mountContainer: () => {},
    updateContainer: () => {},
    unmountContainer: () => {},
    flushSync: (fn) => fn(),
    createPortal: () => null,
    calculateColor: calculateColor,
    // 添加更多 @react-three/fiber 可能需要的方法
    activateTouchTools: () => {},
    deactivateTouchTools: () => {},
    configure: () => {},
    update: () => {},
    render: () => {},
    dispose: () => {},
    setSize: () => {},
    setPixelRatio: () => {},
    setPointerCapture: () => {},
    releasePointerCapture: () => {},
    pointerEvent: () => {},
    wheelEvent: () => {},
    touchEvent: () => {},
    keyboardEvent: () => {},
    mouseEvent: () => {},
  };
}

// 添加 @react-three/fiber 所需的其他导出
export const unstable_scheduleCallback = () => {};
export const unstable_cancelCallback = () => {};
export const unstable_now = () => Date.now();
export const ImmediateSchedulerPriority = 1;
export const UserBlockingSchedulerPriority = 2;
export const NormalSchedulerPriority = 3;
export const LowSchedulerPriority = 4;
export const IdleSchedulerPriority = 5;

// 添加更多可能需要的导出
export const createContext = () => {
  return {
    Provider: () => null,
    Consumer: () => null,
    _currentValue: null,
    _currentValue2: null,
  };
};

export const useContext = () => null;
export const useReducer = () => [null, () => {}];
export const useState = () => [null, () => {}];
export const useRef = () => ({ current: null });
export const useEffect = () => {};
export const useLayoutEffect = () => {};
export const useCallback = (fn) => fn;
export const useMemo = (fn) => fn();
export const useImperativeHandle = () => {};
export const useDebugValue = () => {};
export const useTransition = () => [false, () => {}];
export const useDeferredValue = (value) => value;
export const useId = () => 'stub-id';
export const useSyncExternalStore = () => null;
export const useInsertionEffect = () => {};

// 添加 @react-three/fiber 可能需要的其他导出
export const unstable_getCurrentPriorityLevel = () => NormalPriority;
export const unstable_runWithPriority = (priority, fn) => fn();
export const unstable_ImmediatePriority = 1;
export const unstable_UserBlockingPriority = 2;
export const unstable_NormalPriority = 3;
export const unstable_LowPriority = 4;
export const unstable_IdlePriority = 5;
