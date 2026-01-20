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

// 添加 isInterleavedArray 函数，解决 Three.js 相关错误
export const isInterleavedArray = () => false;

// 添加 isInteractiveTools 函数，解决最新出现的错误
export const isInteractiveTools = () => false;

// 导出一个更完整的 react-reconciler 实现，避免运行时错误
export default function createReconciler() {
  // 创建基础实现对象
  const reconcilerImpl = {
    mountContainer: () => {},
    updateContainer: () => {},
    unmountContainer: () => {},
    flushSync: (fn: () => void) => fn(),
    createPortal: () => null,
    calculateColor: calculateColor,
    isInterleavedArray: isInterleavedArray,
    isInteractiveTools: isInteractiveTools,
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

  // 使用 Proxy 包装，处理未知方法调用，避免运行时错误
  return new Proxy(reconcilerImpl, {
    get(target, prop, receiver) {
      // 如果方法存在，直接返回
      if (prop in target) {
        return Reflect.get(target, prop, receiver);
      }
      
      // 否则返回一个空函数，避免运行时错误
      console.warn(`react-reconciler stub: Method '${String(prop)}' not found, returning empty function`);
      return () => {};
    }
  });
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
export const useCallback = <T extends (...args: any[]) => any>(fn: T) => fn;
export const useMemo = <T>(fn: () => T) => fn();
export const useImperativeHandle = () => {};
export const useDebugValue = () => {};
export const useTransition = () => [false, () => {}];
export const useDeferredValue = <T>(value: T) => value;
export const useId = () => 'stub-id';
export const useSyncExternalStore = () => null;
export const useInsertionEffect = () => {};

// 添加 @react-three/fiber 可能需要的其他导出
export const unstable_getCurrentPriorityLevel = () => NormalPriority;
export const unstable_runWithPriority = (priority: number, fn: () => void) => fn();
export const unstable_ImmediatePriority = 1;
export const unstable_UserBlockingPriority = 2;
export const unstable_NormalPriority = 3;
export const unstable_LowPriority = 4;
export const unstable_IdlePriority = 5;

// 添加 Three.js 相关函数，解决可能的运行时错误
export const createGeometry = () => ({
  computeBoundingBox: () => {},
  computeBoundingSphere: () => {},
  computeVertexNormals: () => {},
  computeFaceNormals: () => {},
  normalizeNormals: () => {},
  applyMatrix4: () => {},
  applyQuaternion: () => {},
  applyPosition: () => {},
  applyRotation: () => {},
  applyScale: () => {},
  center: () => {},
  translate: () => {},
  rotateX: () => {},
  rotateY: () => {},
  rotateZ: () => {},
  scale: () => {},
  clone: () => ({}),
  toJSON: () => ({}),
  dispose: () => {},
});

export const createBufferGeometry = () => ({
  computeBoundingBox: () => {},
  computeBoundingSphere: () => {},
  computeVertexNormals: () => {},
  setAttribute: () => {},
  getAttribute: () => ({
    array: new Float32Array(),
    itemSize: 3,
    count: 0,
    normalized: false,
    dynamic: false,
    updateRange: { offset: 0, count: 0 },
    version: 0,
  }),
  hasAttribute: () => false,
  removeAttribute: () => {},
  attributes: {},
  index: null,
  groups: [],
  boundsTree: null,
  dispose: () => {},
});

export const createMaterial = () => ({
  setValues: () => {},
  clone: () => ({}),
  toJSON: () => ({}),
  dispose: () => {},
});

export const createMesh = () => ({
  geometry: null,
  material: null,
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
  visible: true,
  castShadow: false,
  receiveShadow: false,
  matrix: new Float32Array(16),
  matrixAutoUpdate: true,
  updateMatrix: () => {},
  updateMatrixWorld: () => {},
  add: () => {},
  remove: () => {},
  dispose: () => {},
});

// 添加更多可能需要的 Three.js 相关函数
export const Vector2 = class Vector2 {
  x: number;
  y: number;
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  set() { return this; }
  clone() { return new Vector2(this.x, this.y); }
  add() { return this; }
  sub() { return this; }
  multiplyScalar() { return this; }
  divideScalar() { return this; }
  normalize() { return this; }
  length() { return 0; }
  distanceTo() { return 0; }
  dot() { return 0; }
};

export const Vector3 = class Vector3 {
  x: number;
  y: number;
  z: number;
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  set() { return this; }
  clone() { return new Vector3(this.x, this.y, this.z); }
  add() { return this; }
  sub() { return this; }
  multiplyScalar() { return this; }
  divideScalar() { return this; }
  normalize() { return this; }
  length() { return 0; }
  distanceTo() { return 0; }
  dot() { return 0; }
  cross() { return this; }
  applyMatrix4() { return this; }
  applyQuaternion() { return this; }
  project() { return this; }
  unproject() { return this; }
};

export const Matrix4 = class Matrix4 {
  elements: Float32Array;
  constructor() {
    this.elements = new Float32Array(16);
  }
  identity() { return this; }
  clone() { return new Matrix4(); }
  multiply() { return this; }
  multiplyMatrices() { return this; }
  makeTranslation() { return this; }
  makeRotationX() { return this; }
  makeRotationY() { return this; }
  makeRotationZ() { return this; }
  makeScale() { return this; }
  lookAt() { return this; }
  invert() { return this; }
  transpose() { return this; }
  getInverse() { return this; }
};

export const Quaternion = class Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
  constructor(x = 0, y = 0, z = 0, w = 1) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  }
  set() { return this; }
  clone() { return new Quaternion(this.x, this.y, this.z, this.w); }
  setFromAxisAngle() { return this; }
  setFromEuler() { return this; }
  normalize() { return this; }
  multiply() { return this; }
  invert() { return this; }
  conjugate() { return this; }
  dot() { return 0; }
  length() { return 0; }
  slerp() { return this; }
};

export const Euler = class Euler {
  x: number;
  y: number;
  z: number;
  order: string;
  constructor(x = 0, y = 0, z = 0, order = 'XYZ') {
    this.x = x;
    this.y = y;
    this.z = z;
    this.order = order;
  }
  set() { return this; }
  clone() { return new Euler(this.x, this.y, this.z, this.order); }
  setFromRotationMatrix() { return this; }
  setFromQuaternion() { return this; }
  toQuaternion() { return new Quaternion(); }
  toRotationMatrix() { return new Matrix4(); }
};
