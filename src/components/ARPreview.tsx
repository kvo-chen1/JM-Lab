/**
 * ARPreview 组件 - 增强现实预览功能组件
 * 
 * 提供AR功能的预览界面，支持移动端和桌面端适配，
 * 显示设备AR支持情况，并提供友好的用户体验。
 * 
 * @component
 * @example
 * ```tsx
 * <ARPreview 
 *   config={{ type: '3d', modelUrl: 'https://example.com/model.glb' }}
 *   onARModeChange={(isARMode) => console.log('AR Mode:', isARMode)}
 * />
 * ```
 */
import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

/**
 * AR预览配置类型
 * 
 * @interface
 * @property {string} [modelUrl] - 3D模型URL
 * @property {string} [imageUrl] - 2D图像URL
 * @property {number} [scale] - 缩放比例
 * @property {Object} [rotation] - 旋转角度
 * @property {number} rotation.x - X轴旋转角度
 * @property {number} rotation.y - Y轴旋转角度
 * @property {number} rotation.z - Z轴旋转角度
 * @property {Object} [position] - 位置坐标
 * @property {number} position.x - X轴位置
 * @property {number} position.y - Y轴位置
 * @property {number} position.z - Z轴位置
 * @property {'3d' | '2d'} type - 内容类型
 * @property {boolean} [animations] - 是否启用动画
 * @property {boolean} [shadows] - 是否启用阴影
 * @property {string} [background] - 背景颜色
 * @property {Object} [lighting] - 光照设置
 * @property {number} [lighting.ambientIntensity] - 环境光强度
 * @property {number} [lighting.directionalIntensity] - 方向光强度
 * @property {Object} [lighting.directionalPosition] - 方向光位置
 * @property {number} lighting.directionalPosition.x - 方向光X轴位置
 * @property {number} lighting.directionalPosition.y - 方向光Y轴位置
 * @property {number} lighting.directionalPosition.z - 方向光Z轴位置
 * @property {Object} [scene] - 场景设置
 * @property {string} [scene.backgroundColor] - 场景背景颜色
 * @property {boolean} [scene.gridHelper] - 是否显示网格辅助线
 * @property {boolean} [scene.axesHelper] - 是否显示坐标轴辅助线
 * @property {boolean} [scene.fog] - 是否启用雾化效果
 */
export interface ARPreviewConfig {
  modelUrl?: string;
  imageUrl?: string;
  scale?: number;
  rotation?: { x: number; y: number; z: number };
  position?: { x: number; y: number; z: number };
  type: '3d' | '2d';
  animations?: boolean;
  shadows?: boolean;
  background?: string;
  lighting?: {
    ambientIntensity?: number;
    directionalIntensity?: number;
    directionalPosition?: { x: number; y: number; z: number };
  };
  scene?: {
    backgroundColor?: string;
    gridHelper?: boolean;
    axesHelper?: boolean;
    fog?: boolean;
  };
}

/**
 * 粒子效果配置类型
 * 
 * @interface
 * @property {boolean} enabled - 是否启用粒子效果
 * @property {'fire' | 'smoke' | 'snow' | 'rain' | 'sparkle'} type - 粒子效果类型
 * @property {number} intensity - 粒子强度
 * @property {string} color - 粒子颜色
 * @property {number} size - 粒子大小
 */
export interface ParticleEffectConfig {
  enabled: boolean;
  type: 'fire' | 'smoke' | 'snow' | 'rain' | 'sparkle';
  intensity: number;
  color: string;
  size: number;
}

/**
 * 设备性能类型
 * 
 * @interface
 * @property {number} fps - 帧率
 * @property {number} memory - 内存使用量
 * @property {'mobile' | 'desktop' | 'tablet'} deviceType - 设备类型
 * @property {string} browser - 浏览器名称
 * @property {boolean} isWebXRCompatible - 是否支持WebXR
 */
export interface DevicePerformance {
  fps: number;
  memory: number;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  browser: string;
  isWebXRCompatible: boolean;
}

/**
 * 渲染设置类型
 * 
 * @interface
 * @property {boolean} shadows - 是否启用阴影
 * @property {boolean} antialias - 是否启用抗锯齿
 * @property {number} pixelRatio - 像素比
 * @property {any} toneMapping - 色调映射
 * @property {number} toneMappingExposure - 色调映射曝光度
 */
export interface RenderSettings {
  shadows: boolean;
  antialias: boolean;
  pixelRatio: number;
  toneMapping: any;
  toneMappingExposure: number;
}

/**
 * AR预览组件属性
 * 
 * @interface
 * @property {ARPreviewConfig} config - AR预览配置
 * @property {number} [scale=1] - 缩放比例
 * @property {Object} [rotation={x: 0, y: 0, z: 0}] - 旋转角度
 * @property {number} rotation.x - X轴旋转角度
 * @property {number} rotation.y - Y轴旋转角度
 * @property {number} rotation.z - Z轴旋转角度
 * @property {Object} [position={x: 0, y: 0, z: 0}] - 位置坐标
 * @property {number} position.x - X轴位置
 * @property {number} position.y - Y轴位置
 * @property {number} position.z - Z轴位置
 * @property {ParticleEffectConfig} [particleEffect] - 粒子效果配置
 * @property {RenderSettings} [renderSettings] - 渲染设置
 * @property {DevicePerformance} [devicePerformance] - 设备性能信息
 * @property {(isARMode: boolean) => void} [onARModeChange] - AR模式切换回调
 */
interface ARPreviewProps {
  config: ARPreviewConfig;
  scale?: number;
  rotation?: { x: number; y: number; z: number };
  position?: { x: number; y: number; z: number };
  particleEffect?: ParticleEffectConfig;
  renderSettings?: RenderSettings;
  devicePerformance?: DevicePerformance;
  onARModeChange?: (isARMode: boolean) => void;
}

/**
 * AR预览组件 - 增强型，提供更好的用户体验
 * 
 * @component
 * @param {ARPreviewProps} props - 组件属性
 * @returns {React.ReactElement} AR预览组件
 * 
 * @description
 * 该组件提供AR预览功能，支持移动端和桌面端适配，显示设备AR支持情况，并提供友好的用户体验。
 * 当AR功能不可用时，显示提示信息和动画效果，增强用户体验。
 * 
 * @example
 * ```tsx
 * <ARPreview 
 *   config={{ type: '3d', modelUrl: 'https://example.com/model.glb' }}
 *   onARModeChange={(isARMode) => console.log('AR Mode:', isARMode)}
 * />
 * ```
 */
const ARPreview: React.FC<ARPreviewProps> = ({ 
  config, 
  scale = 1, 
  rotation = { x: 0, y: 0, z: 0 }, 
  position = { x: 0, y: 0, z: 0 }, 
  particleEffect = { enabled: false, type: 'sparkle', intensity: 0.5, color: '#ffffff', size: 1 },
  renderSettings: customRenderSettings,
  devicePerformance = { fps: 60, memory: 0, deviceType: 'desktop', browser: 'unknown', isWebXRCompatible: false },
  onARModeChange
}) => {
  const { isDark } = useTheme();
  const [isARMode, setIsARMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  
  const modalRef = useRef<HTMLCanvasElement>(null);
  
  // 检测设备类型
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // 检查AR支持
  useEffect(() => {
    const checkARSupport = async () => {
      try {
        const xrSupported = await navigator.xr?.isSessionSupported('immersive-ar') || false;
        const canvasSupported = typeof HTMLCanvasElement !== 'undefined';
        const webGLSupported = typeof WebGLRenderingContext !== 'undefined';
        setIsSupported(xrSupported && canvasSupported && webGLSupported);
      } catch (err) {
        console.warn('AR support check failed:', err);
        setIsSupported(false);
      }
    };
    
    checkARSupport();
  }, []);
  
  // 检查相机权限
  useEffect(() => {
    const checkCameraPermission = async () => {
      if ('permissions' in navigator && 'query' in navigator.permissions) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
          setCameraPermission(permissionStatus.state === 'granted');
          
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
  
  // 请求相机权限
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
  
  // 加载资源
  const loadResource = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (config.type === '2d' && config.imageUrl) {
        const loader = new THREE.TextureLoader();
        const loadedTexture = await new Promise<THREE.Texture>((resolve, reject) => {
          loader.load(
            config.imageUrl!,
            resolve,
            undefined,
            () => reject(new Error('Image loading failed'))
          );
        });
        setTexture(loadedTexture);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Resource loading failed:', err);
      setError(err instanceof Error ? err.message : '资源加载失败');
      setLoading(false);
    }
  };
  
  // 确保只在客户端访问window.devicePixelRatio
  const getDefaultRenderSettings = () => {
    if (typeof window === 'undefined') {
      return { shadows: false, antialias: true, pixelRatio: 1, toneMapping: 0, toneMappingExposure: 1.0 };
    }
    return { shadows: false, antialias: true, pixelRatio: window.devicePixelRatio, toneMapping: 0, toneMappingExposure: 1.0 };
  };
  
  // 合并默认渲染设置和自定义渲染设置
  const effectiveRenderSettings = {
    ...getDefaultRenderSettings(),
    ...customRenderSettings
  };
  
  // 处理AR模式切换
  const handleARModeToggle = () => {
    const newARMode = !isARMode;
    setIsARMode(newARMode);
    onARModeChange?.(newARMode);
    
    if (newARMode) {
      loadResource();
    }
  };
  
  // AR内容渲染组件
  const ARContent = () => {
    return (
      <>
        {/* 光照 */}
        <ambientLight intensity={1} />
        <directionalLight position={[10, 10, 10]} intensity={1} />
        
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
        
        {/* 2D图像 */}
        {config.type === '2d' && texture && (
          <mesh 
            position={[position.x, position.y, position.z]}
            rotation={[rotation.x, rotation.y, rotation.z]}
            scale={scale}
          >
            <planeGeometry args={[3, 3]} />
            <meshPhysicalMaterial 
              map={texture} 
              transparent 
              side={THREE.DoubleSide} 
            />
          </mesh>
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
    );
  };
  
  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700">
      {/* 设备信息条 */}
      <div className={`px-4 py-2 text-xs font-medium ${isDark ? 'bg-gray-900 text-gray-300' : 'bg-white text-gray-700'} border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1">
            <i className={`fas fa-mobile-alt ${isMobile ? 'text-green-500' : 'text-gray-500'}`}></i>
            <span>{isMobile ? '移动端' : '桌面端'}设备</span>
          </span>
          <span className="flex items-center gap-1">
            <i className={`fas fa-vr-cardboard ${isSupported ? 'text-blue-500' : 'text-gray-500'}`}></i>
            <span>{isSupported ? '支持AR' : '不支持AR'}</span>
          </span>
        </div>
      </div>
      
      {/* 主内容区 */}
      <div className="h-[calc(100%-40px)] relative">
        {isARMode ? (
          <>
            {/* AR Canvas */}
            <Canvas
              ref={modalRef}
              camera={{ position: [5, 5, 5] }}
              gl={{ antialias: true }}
              style={{ width: '100%', height: '100%' }}
            >
              <ARContent />
            </Canvas>
            
            {/* AR Button */}
            <div className="absolute top-4 right-4 z-10">
              <button
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'} shadow-lg hover:shadow-xl`}
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
                <i className="fas fa-vr-cardboard mr-2"></i>
                进入AR模式
              </button>
            </div>
            
            {/* 相机权限提示 */}
            {cameraPermission === false && (
              <div className="absolute bottom-4 left-4 z-10">
                <div className={`p-3 rounded-lg ${isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-700'} max-w-xs`}>
                  <div className="font-medium mb-2 flex items-center gap-2">
                    <i className="fas fa-camera"></i>
                    <span>需要相机权限</span>
                  </div>
                  <p className="text-xs mb-2">AR功能需要访问相机权限才能工作</p>
                  <button
                    onClick={requestCameraPermission}
                    className={`w-full py-1 text-xs rounded-lg transition-colors ${isDark ? 'bg-red-800 hover:bg-red-700' : 'bg-red-700 hover:bg-red-600 text-white'}`}
                  >
                    请求相机权限
                  </button>
                </div>
              </div>
            )}
            
            {/* 加载状态 */}
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
                <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                  <div className="animate-spin w-8 h-8 border-2 border-t-transparent border-blue-500 rounded-full mx-auto mb-2"></div>
                  <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>加载中...</p>
                </div>
              </div>
            )}
            
            {/* 错误提示 */}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
                <div className={`p-4 rounded-lg ${isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-700'} shadow-lg max-w-xs`}>
                  <div className="text-2xl mb-2">⚠️</div>
                  <p className="text-sm mb-3">{error}</p>
                  <button
                    onClick={() => setError(null)}
                    className={`w-full py-1 text-xs rounded-lg transition-colors ${isDark ? 'bg-red-800 hover:bg-red-700' : 'bg-red-700 hover:bg-red-600 text-white'}`}
                  >
                    关闭
                  </button>
                </div>
              </div>
            )}
            
            {/* 退出按钮 */}
            <div className="absolute bottom-4 right-4 z-10">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleARModeToggle}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${isDark ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'} shadow-lg hover:shadow-xl`}
              >
                <i className="fas fa-times"></i>
                <span>退出AR模式</span>
              </motion.button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            {/* AR图标动画 */}
            <motion.div 
              className="mb-4 text-6xl text-gray-400"
              animate={{
                scale: [1, 1.1, 1],
                rotateY: [0, 360],
                opacity: [0.6, 1, 0.6]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <i className="fas fa-vr-cardboard"></i>
            </motion.div>
            
            {/* 标题和描述 */}
            <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              AR预览功能
            </h3>
            <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'} max-w-sm`}>
              体验增强现实技术，将虚拟内容与现实世界融合，创造沉浸式交互体验
            </p>
            
            {/* 功能卡片 */}
            <div className="grid grid-cols-2 gap-3 mb-6 w-full max-w-xs">
              <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="text-2xl mb-1 text-blue-500">
                  <i className="fas fa-camera"></i>
                </div>
                <p className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>实时预览</p>
              </div>
              <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="text-2xl mb-1 text-purple-500">
                  <i className="fas fa-palette"></i>
                </div>
                <p className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>创意编辑</p>
              </div>
            </div>
            
            {/* 设备兼容性提示 */}
            {isSupported === false && (
              <div className={`p-3 rounded-lg mb-4 text-sm w-full max-w-xs ${isDark ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-50 text-yellow-700'}`}>
                <i className="fas fa-info-circle mr-1"></i>
                当前设备不支持AR功能，但可以使用3D预览
              </div>
            )}
            
            {/* 操作按钮 */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleARModeToggle}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-300 flex items-center gap-2 ${isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'} shadow-lg hover:shadow-xl`}
            >
              <i className="fas fa-play"></i>
              <span>进入AR模式</span>
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ARPreview;