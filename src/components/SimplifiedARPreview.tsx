import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// 简化的AR预览配置类型 - 兼容原ARPreviewConfig类型
export interface SimplifiedARPreviewConfig {
  modelUrl?: string;
  imageUrl?: string;
  type: '3d' | '2d';
  scale?: number;
  rotation?: { x: number; y: number; z: number };
  position?: { x: number; y: number; z: number };
  animations?: boolean;
  backgroundColor?: string;
  ambientLightIntensity?: number;
  directionalLightIntensity?: number;
}

// 模型缓存类型
type ModelCacheItem = {
  gltf: any;
  timestamp: number;
  usageCount: number;
};

// 模型缓存（全局单例）
const modelCache = new Map<string, ModelCacheItem>();
const MAX_CACHE_SIZE = 5;
const CACHE_TTL = 3600000; // 1小时

// 简单的错误边界组件
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: (error: Error) => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError: (error: Error) => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    this.props.onError(error);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }

    return this.props.children;
  }
};

// 3D模型加载子组件 - 使用useGLTF钩子
const GLTFModel: React.FC<{
  url: string;
  onLoad?: () => void;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
}> = ({ url, onLoad, position, rotation, scale }) => {
  // 检查缓存
  const cachedItem = modelCache.get(url);
  const now = Date.now();
  
  // 如果缓存存在且未过期，直接使用
  if (cachedItem && (now - cachedItem.timestamp < CACHE_TTL)) {
    // 更新使用次数和时间戳
    modelCache.set(url, {
      ...cachedItem,
      usageCount: cachedItem.usageCount + 1,
      timestamp: now
    });
    
    // 处理模型加载完成事件
    useEffect(() => {
      if (onLoad) {
        onLoad();
      }
    }, [onLoad]);
    
    // 返回缓存的模型
    return (
      <primitive
        object={cachedItem.gltf.scene}
        position={position}
        rotation={rotation}
        scale={scale}
      />
    );
  }
  
  // 缓存不存在或已过期，重新加载
  const gltf = useGLTF(url);
  
  // 处理模型加载完成事件
  useEffect(() => {
    // 将模型添加到缓存
    if (gltf.scene) {
      // 如果缓存已满，移除最旧或使用次数最少的项目
      if (modelCache.size >= MAX_CACHE_SIZE) {
        const entries = Array.from(modelCache.entries());
        entries.sort((a, b) => {
          // 优先移除使用次数少的，其次移除旧的
          if (a[1].usageCount !== b[1].usageCount) {
            return a[1].usageCount - b[1].usageCount;
          }
          return a[1].timestamp - b[1].timestamp;
        });
        modelCache.delete(entries[0][0]);
      }
      
      // 添加新模型到缓存
      modelCache.set(url, {
        gltf,
        timestamp: Date.now(),
        usageCount: 1
      });
      
      if (onLoad) {
        onLoad();
      }
    }
  }, [gltf.scene, onLoad, url]);
  
  // 模型加载成功，返回实际模型
  return (
    <primitive
      object={gltf.scene}
      position={position}
      rotation={rotation}
      scale={scale}
    />
  );
};

// 3D模型加载组件 - 使用错误边界处理加载错误
const ModelViewer: React.FC<{
  url: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
}> = ({ url, onLoad, onError, position, rotation, scale }) => {
  // 使用useState来跟踪加载错误
  const [loadError, setLoadError] = useState<Error | null>(null);
  
  // 处理模型加载完成
  const handleModelLoad = () => {
    onLoad?.();
  };
  
  // 处理模型加载错误
  const handleModelError = (error: Error) => {
    console.error('3D模型加载错误:', error);
    setLoadError(error);
    onError?.(error);
  };
  
  // 如果发生错误，返回错误占位符
  if (loadError) {
    return (
      <mesh position={position} rotation={rotation} scale={scale}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="#ef4444" opacity={0.7} transparent />
      </mesh>
    );
  }
  
  // 使用错误边界包装GLTFModel组件
  return (
    <ErrorBoundary onError={handleModelError}>
      <GLTFModel
        url={url}
        onLoad={handleModelLoad}
        position={position}
        rotation={rotation}
        scale={scale}
      />
    </ErrorBoundary>
  );
};



// 预加载模型的函数
export const preloadModel = async (url: string) => {
  // 检查缓存
  if (modelCache.has(url)) {
    return;
  }
  
  try {
    // 简化预加载实现，只验证URL并添加到缓存
    // 实际模型加载由useGLTF钩子处理
    if (typeof url !== 'string' || !url) {
      throw new Error('Invalid model URL');
    }
    
    // 创建简单的缓存条目，实际gltf对象由useGLTF填充
    modelCache.set(url, {
      gltf: { scene: null },
      timestamp: Date.now(),
      usageCount: 0
    });
    
    console.log(`Model preload scheduled: ${url}`);
  } catch (error) {
    console.error(`Failed to schedule model preload: ${url}`, error);
  }
};

// 简化的AR预览组件
const SimplifiedARPreview: React.FC<{
  config: SimplifiedARPreviewConfig;
  onClose: () => void;
}> = ({ config, onClose }) => {
  
  // 资源加载状态
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  
  // 兼容性状态
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  
  // 交互控制状态
  const [scale, setScale] = useState(config.scale || 5.0);
  const [rotation, setRotation] = useState(config.rotation || { x: 0, y: 0, z: 0 });
  const [position, setPosition] = useState(config.position || { x: 0, y: 0, z: 0 });
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  
  // 引用
  const modalRef = useRef<HTMLDivElement>(null);
  const textureLoaderRef = useRef<THREE.TextureLoader | null>(null);
  const modelRef = useRef<THREE.Mesh | null>(null);

  // 检查AR支持和浏览器兼容性
  useEffect(() => {
    const checkARSupport = async () => {
      try {
        // 检查WebXR AR会话支持
        const xrSupported = await navigator.xr?.isSessionSupported('immersive-ar') || false;
        
        // 检查其他必要条件
        const canvasSupported = typeof HTMLCanvasElement !== 'undefined';
        const webGLSupported = typeof WebGLRenderingContext !== 'undefined';
        
        // 检测浏览器类型和版本
        const userAgent = navigator.userAgent;
        let browserInfo = {
          name: 'Unknown',
          version: 'Unknown'
        };
        
        if (/Chrome/.test(userAgent)) {
          browserInfo = {
            name: 'Chrome',
            version: userAgent.match(/Chrome\/(\d+\.\d+)/)?.[1] || 'Unknown'
          };
        } else if (/Firefox/.test(userAgent)) {
          browserInfo = {
            name: 'Firefox',
            version: userAgent.match(/Firefox\/(\d+\.\d+)/)?.[1] || 'Unknown'
          };
        } else if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) {
          browserInfo = {
            name: 'Safari',
            version: userAgent.match(/Version\/(\d+\.\d+)/)?.[1] || 'Unknown'
          };
        } else if (/Edge/.test(userAgent)) {
          browserInfo = {
            name: 'Edge',
            version: userAgent.match(/Edg\/(\d+\.\d+)/)?.[1] || 'Unknown'
          };
        }
        
        console.log('AR Support Check:', {
          xrSupported,
          canvasSupported,
          webGLSupported,
          browser: browserInfo
        });
        
        // 设置AR支持状态
        setIsSupported(xrSupported && canvasSupported && webGLSupported);
      } catch (err) {
        console.warn('AR support check failed:', err);
        setIsSupported(false);
      }
    };

    checkARSupport();
  }, []);
  
  // 相机权限处理
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  
  const requestCameraPermission = async () => {
    try {
      if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        setCameraPermission(true);
        return true;
      } else {
        setCameraPermission(false);
        return false;
      }
    } catch (error) {
      console.error('Camera permission error:', error);
      setCameraPermission(false);
      return false;
    }
  };
  
  // 检查相机权限
  useEffect(() => {
    const checkCameraPermission = async () => {
      if ('permissions' in navigator && 'query' in navigator.permissions) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
          setCameraPermission(permissionStatus.state === 'granted');
          
          // 监听权限状态变化
          permissionStatus.addEventListener('change', () => {
            setCameraPermission(permissionStatus.state === 'granted');
          });
        } catch (error) {
          console.warn('Camera permission check failed:', error);
          setCameraPermission(null);
        }
      }
    };
    
    checkCameraPermission();
  }, []);

  // 加载资源的函数，包含进度反馈和错误处理
  const loadResource = useCallback(async () => {
    console.log('AR Preview - loadResource called with config:', config);
    
    if (config.type === '3d' && !config.modelUrl) {
      setLoading(false);
      return;
    }
    if (config.type === '2d' && !config.imageUrl) {
      setLoading(false);
      return;
    }

    // 验证imageUrl是否有效
    const isValidImageUrl = (url: string) => {
      try {
        // 支持绝对URL（http:// 和 https://）
        if (url.startsWith('http://') || url.startsWith('https://')) {
          new URL(url);
          return true;
        }
        // 支持相对路径（以 / 开头）
        if (url.startsWith('/')) {
          return true;
        }
        // 支持数据URI
        if (url.startsWith('data:')) {
          return true;
        }
        return false;
      } catch {
        return false;
      }
    };

    try {
      setLoading(true);
      setError(null);
      setLoadingProgress(0);
      setTexture(null);
      setModelLoaded(false);

      if (config.type === '2d' && config.imageUrl) {
        // 验证imageUrl是否有效
        const imageUrlToUse = isValidImageUrl(config.imageUrl) 
          ? config.imageUrl 
          : 'https://images.unsplash.com/photo-1614850526283-3a3560210a5a?w=800&h=600&fit=crop&q=80';
        
        if (imageUrlToUse !== config.imageUrl) {
          console.warn('AR Preview - Invalid image URL, using fallback:', config.imageUrl);
        }

        const loader = new THREE.TextureLoader();
        textureLoaderRef.current = loader;

        await new Promise<void>((resolve, reject) => {
          try {
            loader.load(
              imageUrlToUse,
              (loadedTexture) => {
                console.log('AR Preview - Texture loaded successfully:', loadedTexture);
                setTexture(loadedTexture);
                setLoadingProgress(100);
                setModelLoaded(true);
                handleModelLoad();
                resolve();
              },
              (progressEvent) => {
                // 更新加载进度
                if (progressEvent.lengthComputable) {
                  const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
                  setLoadingProgress(progress);
                } else {
                  // 无法计算进度时，使用模拟进度
                  setLoadingProgress(prev => Math.min(prev + 10, 90));
                }
              },
              (error) => {
                console.error('AR Preview - Error loading texture:', error);
                reject(new Error('图像资源加载失败，请重试'));
              }
            );
          } catch (innerErr) {
            console.error('AR Preview - Unexpected error in texture loader:', innerErr);
            reject(new Error('图像加载过程中发生错误，请重试'));
          }
        });
      } else if (config.type === '3d') {
        // 3D模型加载使用useGLTF，通过状态管理
        setLoadingProgress(50);
        // 模型加载完成由ModelViewer组件的onLoad回调处理
      }

      setLoading(false);
    } catch (err) {
      console.error('AR Preview - Resource loading failed:', err);
      setError(err instanceof Error ? err.message : '资源加载失败，请重试');
      setLoading(false);
    }
  }, [config.imageUrl, config.modelUrl, config.type]);

  // 重试加载资源
  const handleRetry = useCallback(() => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      // 重置状态
      setError(null);
      setLoading(true);
      setLoadingProgress(0);
      setTexture(null);
      setModelLoaded(false);
      // 直接调用loadResource
      loadResource();
    }
  }, [retryCount, maxRetries, loadResource]);

  // 加载资源的useEffect
  useEffect(() => {
    loadResource();

    // 清理函数
    return () => {
      // 清理纹理资源 - 确保dispose方法存在
      if (texture && typeof texture.dispose === 'function') {
        texture.dispose();
      }
      // 注意：THREE.TextureLoader没有cancel方法，所以移除这个调用
      // if (textureLoaderRef.current) {
      //   textureLoaderRef.current.cancel();
      // }
    };
  }, [config.imageUrl, config.modelUrl, config.type]);



  // 3D模型加载完成处理
  const handleModelLoad = useCallback(() => {
    setModelLoaded(true);
    setLoadingProgress(100);
    setLoading(false);
  }, []);

  // 3D模型加载错误处理
  const handleModelError = useCallback((err: Error) => {
    console.error('Model loading error:', err);
    setError('3D模型加载失败，请重试');
    setLoading(false);
  }, []);

  // 处理模态框点击事件，防止事件冒泡影响底层main元素
  const handleModalClick = (e: React.MouseEvent) => {
    if (e.target === modalRef.current) {
      onClose();
    }
  };

  // 阻止背景滚动
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div 
      ref={modalRef}
      onClick={handleModalClick}
      className="fixed inset-0 z-50 flex flex-col bg-black"
      style={{ pointerEvents: 'auto' }}
    >
      {/* 顶部控制栏 */}
      <div className="flex items-center justify-between p-4 bg-gray-900 text-white z-10">
        <h2 className="text-xl font-bold">AR预览</h2>
        <div className="flex gap-2">
          {/* AR模式切换按钮 */}
          <button
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
            onClick={() => {
              // 尝试启动AR会话
              if (navigator.xr) {
                navigator.xr.requestSession('immersive-ar', {
                  requiredFeatures: ['hit-test'],
                  optionalFeatures: ['dom-overlay', 'dom-overlay-for-handheld-ar'],
                  domOverlay: {
                    root: modalRef.current || document.body
                  }
                }).then(session => {
                  console.log('AR session started:', session);
                  // 处理AR会话
                  session.addEventListener('end', () => {
                    console.log('AR session ended');
                  });
                }).catch(error => {
                  console.error('AR session request failed:', error);
                  setError('无法启动AR会话: ' + error.message);
                });
              } else {
                setError('当前浏览器不支持AR功能');
              }
            }}
          >
            <span className="mr-2">📱</span>
            进入AR模式
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            关闭
          </button>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 relative">
        {/* 增强的Canvas - 支持AR模式 */}
        <Canvas
          camera={{ position: [5, 5, 5] }}
          gl={{ antialias: true }}
          style={{ width: '100%', height: '100%' }}
        >
          {/* 光照 */}
          <ambientLight intensity={config.ambientLightIntensity || 1} />
          <directionalLight position={[10, 10, 10]} intensity={config.directionalLightIntensity || 1} />

          {/* 控制器 */}
          <OrbitControls 
            enablePan={true} 
            enableZoom={true} 
            enableRotate={true}
            minDistance={2}
            maxDistance={15}
          />

          {/* 地面网格 */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
            <planeGeometry args={[20, 20]} />
            <meshStandardMaterial color="#e2e8f0" />
          </mesh>

          {/* AR内容渲染器 */}
          <ARContent 
            config={config} 
            texture={texture} 
            modelLoaded={modelLoaded}
            position={position}
            rotation={rotation}
            scale={scale}
            onModelLoad={handleModelLoad}
            onModelError={handleModelError}
          />
        </Canvas>
        
        {/* 控制按钮 */}
        <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-3">
          {/* 控制面板切换按钮 */}
          <button
            onClick={() => setIsControlsOpen(!isControlsOpen)}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isControlsOpen ? '关闭控制' : '调整模型'}
          </button>
        </div>
        
        {/* 控制面板 */}
        {isControlsOpen && (
          <div className="absolute bottom-20 right-4 z-10 bg-gray-800 bg-opacity-90 text-white p-4 rounded-lg shadow-xl max-w-xs w-full">
            <h3 className="text-lg font-bold mb-3 flex items-center justify-between">
              <span>模型控制</span>
              <button 
                onClick={() => setIsControlsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </h3>
            
            {/* 缩放控制 */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium">缩放</label>
                <span className="text-sm opacity-80">{scale.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.1"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0.5x</span>
                <span>10x</span>
              </div>
            </div>
            
            {/* 旋转控制 */}
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">旋转</h4>
              
              {/* X轴旋转 */}
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs text-gray-300">X轴</label>
                <span className="text-xs opacity-80">{(rotation.x * 180 / Math.PI).toFixed(0)}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                step="5"
                value={rotation.x * 180 / Math.PI}
                onChange={(e) => setRotation(prev => ({ ...prev, x: parseFloat(e.target.value) * Math.PI / 180 }))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              
              {/* Y轴旋转 */}
              <div className="flex justify-between items-center mb-1 mt-2">
                <label className="text-xs text-gray-300">Y轴</label>
                <span className="text-xs opacity-80">{(rotation.y * 180 / Math.PI).toFixed(0)}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                step="5"
                value={rotation.y * 180 / Math.PI}
                onChange={(e) => setRotation(prev => ({ ...prev, y: parseFloat(e.target.value) * Math.PI / 180 }))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              
              {/* Z轴旋转 */}
              <div className="flex justify-between items-center mb-1 mt-2">
                <label className="text-xs text-gray-300">Z轴</label>
                <span className="text-xs opacity-80">{(rotation.z * 180 / Math.PI).toFixed(0)}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                step="5"
                value={rotation.z * 180 / Math.PI}
                onChange={(e) => setRotation(prev => ({ ...prev, z: parseFloat(e.target.value) * Math.PI / 180 }))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>
            
            {/* 重置按钮 */}
            <button
              onClick={() => {
                setScale(config.scale || 5.0);
                setRotation(config.rotation || { x: 0, y: 0, z: 0 });
                setPosition(config.position || { x: 0, y: 0, z: 0 });
              }}
              className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-sm rounded-lg transition-colors"
            >
              重置模型
            </button>
          </div>
        )}

        {/* AR功能提示 - 优化设计和内容 */}
        <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-3">
          {isSupported === null ? (
            <div className="flex flex-col gap-2">
              <div className="text-white text-sm bg-gray-800 bg-opacity-90 px-4 py-3 rounded-lg backdrop-blur-md shadow-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-blue-400">⏳</span>
                  <span className="font-medium">正在检测设备AR兼容性</span>
                </div>
                <p className="text-xs opacity-90">请稍候...</p>
              </div>
            </div>
          ) : isSupported ? (
            <div className="flex flex-col gap-2">
              {/* 相机权限提示 */}
              {cameraPermission === false && (
                <div className="text-white text-sm bg-red-900 bg-opacity-90 px-4 py-3 rounded-lg max-w-xs backdrop-blur-md shadow-lg">
                  <div className="font-medium mb-2 flex items-center gap-2">
                    <span className="text-red-400">📷</span>
                    <span>需要相机权限</span>
                  </div>
                  <p className="text-xs opacity-90 mb-2">AR功能需要访问相机权限才能工作</p>
                  <button
                    onClick={requestCameraPermission}
                    className="w-full py-2 bg-red-700 hover:bg-red-600 text-xs rounded-lg transition-colors"
                  >
                    请求相机权限
                  </button>
                </div>
              )}
              
              {/* AR功能说明 */}
              <div className="text-white text-sm bg-blue-900 bg-opacity-90 px-4 py-3 rounded-lg max-w-xs backdrop-blur-md shadow-lg">
                <div className="font-medium mb-2 flex items-center gap-2">
                  <span className="text-blue-400">📱</span>
                  <span>AR功能说明</span>
                </div>
                <div className="space-y-1 text-xs">
                  <p className="flex items-start gap-1">
                    <span className="text-blue-400">📱</span>
                    <span>点击顶部"Enter AR"按钮进入AR模式</span>
                  </p>
                  <p className="flex items-start gap-1">
                    <span className="text-blue-400">🔍</span>
                    <span>将设备对准平面表面，等待检测</span>
                  </p>
                  <p className="flex items-start gap-1">
                    <span className="text-blue-400">🌞</span>
                    <span>在明亮环境中使用效果更佳</span>
                  </p>
                  <p className="flex items-start gap-1">
                    <span className="text-blue-400">📋</span>
                    <span>点击检测到的平面放置虚拟内容</span>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="text-white text-sm bg-gray-900 bg-opacity-90 px-4 py-3 rounded-lg max-w-xs backdrop-blur-md shadow-lg">
                <div className="font-medium mb-2 flex items-center gap-2">
                  <span className="text-yellow-400">ℹ️</span>
                  <span>设备不支持AR功能</span>
                </div>
                <p className="text-xs mb-2 opacity-90">当前设备暂不支持WebXR AR功能</p>
                <div className="text-xs">
                  <p className="font-medium mb-1">建议使用以下设备和浏览器：</p>
                  <ul className="space-y-1">
                    <li className="flex items-start gap-1">
                      <span className="text-green-400">✅</span>
                      <span>Android设备 + Chrome 90+</span>
                    </li>
                    <li className="flex items-start gap-1">
                      <span className="text-green-400">✅</span>
                      <span>Android设备 + Edge 90+</span>
                    </li>
                    <li className="flex items-start gap-1">
                      <span className="text-green-400">✅</span>
                      <span>iOS 15+设备 + Safari 15+</span>
                    </li>
                  </ul>
                  <p className="mt-2 text-xs text-gray-300">
                    您仍可以使用3D预览功能查看和操作模型
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 加载状态 - 显示进度 */}
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 z-10">
            <div className="text-white text-center">
              <div className="animate-spin w-16 h-16 border-4 border-t-transparent border-white rounded-full mx-auto mb-4"></div>
              <p className="text-lg font-medium mb-2">正在加载AR资源...</p>
              <div className="w-64 bg-gray-700 rounded-full h-2.5 mb-2">
                <div 
                  className="bg-white h-2.5 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
              <p className="text-sm opacity-80">{loadingProgress}%</p>
            </div>
          </div>
        )}

        {/* 错误提示 - 更友好的UI和重试逻辑 */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
            <div className="text-white text-center p-8 bg-red-900 bg-opacity-70 rounded-lg max-w-md">
              <div className="text-5xl mb-4">⚠️</div>
              <h3 className="text-2xl font-bold mb-3">加载失败</h3>
              <p className="mb-4">{error}</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={handleRetry}
                  disabled={retryCount >= maxRetries}
                  className={`px-6 py-3 rounded-lg transition-all duration-200 font-medium ${
                    retryCount >= maxRetries 
                      ? 'bg-gray-600 text-gray-300 cursor-not-allowed opacity-60' 
                      : 'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg'
                  }`}
                >
                  {retryCount >= maxRetries ? '已达最大重试次数' : `重试 (${retryCount}/${maxRetries})`}
                </button>
                <button 
                  onClick={onClose} 
                  className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 hover:shadow-lg transition-all duration-200 font-medium"
                >
                  关闭
                </button>
              </div>
              {retryCount >= maxRetries && (
                <p className="text-sm opacity-80 mt-4">
                  请检查网络连接或稍后重试
                </p>
              )}
              <div className="text-xs opacity-70 mt-4">
                <p>常见问题：</p>
                <ul className="mt-2 space-y-1">
                  <li>• 网络连接不稳定</li>
                  <li>• 模型文件过大</li>
                  <li>• 服务器暂时不可用</li>
                  <li>• 浏览器不支持3D渲染</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {/* AR会话错误提示 */}
        {isSupported && (
          <div className="absolute top-4 left-4 z-10">
            <div className="text-white text-xs bg-blue-900 bg-opacity-70 px-3 py-2 rounded-lg backdrop-blur-md shadow-lg max-w-xs">
              <div className="font-medium mb-1 flex items-center gap-1">
                <span className="text-yellow-400">💡</span>
                <span>使用提示</span>
              </div>
              <ul className="space-y-1">
                <li>• 保持设备稳定以获得最佳效果</li>
                <li>• 在光线充足的环境中使用</li>
                <li>• 确保相机镜头干净</li>
                <li>• 尝试不同的平面表面</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// AR内容渲染组件
const ARContent: React.FC<{
  config: SimplifiedARPreviewConfig;
  texture: THREE.Texture | null;
  modelLoaded: boolean;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: number;
  onModelLoad: () => void;
  onModelError: (error: Error) => void;
}> = ({ config, texture, modelLoaded, position, rotation, scale, onModelLoad, onModelError }) => {
  return (
    <>
      {/* 桌面模式内容 */}
      <>
        {/* 2D图像 */}
        {config.type === '2d' && texture && (
          <mesh 
            position={[position.x, position.y, position.z]}
            rotation={[rotation.x, rotation.y, rotation.z]}
            scale={scale}
            castShadow
            receiveShadow
          >
            <planeGeometry args={[3, 3]} />
            <meshPhysicalMaterial 
              map={texture} 
              transparent 
              side={THREE.DoubleSide} 
              roughness={0.5} 
              metalness={0.2}
              transmission={0.1}
            />
          </mesh>
        )}

        {/* 3D模型 */}
        {config.type === '3d' && config.modelUrl && (
          <ModelViewer
            url={config.modelUrl}
            onLoad={onModelLoad}
            onError={onModelError}
            position={[position.x, position.y, position.z]}
            rotation={[rotation.x, rotation.y, rotation.z]}
            scale={scale}
          />
        )}
        
        {/* 3D模型占位符 */}
        {config.type === '3d' && !modelLoaded && (
          <mesh 
            position={[position.x, position.y, position.z]}
            rotation={[rotation.x, rotation.y, rotation.z]}
            scale={scale}
          >
            <boxGeometry args={[2, 2, 2]} />
            <meshStandardMaterial color="#4f46e5" opacity={0.5} transparent />
          </mesh>
        )}
      </>
    </>
  );
};

export default SimplifiedARPreview;