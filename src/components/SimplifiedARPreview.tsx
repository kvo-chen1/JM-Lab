import React, { useState, useEffect, useRef, useCallback, Suspense, useMemo } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html, Environment } from '@react-three/drei';
import { createXRStore, XR, useXRHitTest } from '@react-three/xr';
import { useDrag, usePinch } from '@use-gesture/react';
import * as THREE from 'three';

// Create XR store globally
const store = createXRStore({
  features: ['hit-test', 'dom-overlay'],
} as any);

// Types
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

// ------------------------------------------------------------------
// Sub-components
// ------------------------------------------------------------------

// AR Gestures Component
const ARGestures: React.FC<{
  setRotation: (val: number) => void;
  setScale: (val: number) => void;
  scale: number;
  rotation: number;
}> = ({ setRotation, setScale, scale, rotation }) => {
  const { gl } = useThree();

  useDrag(
    ({ offset: [x] }) => {
      setRotation(x);
    },
    { 
      target: gl.domElement,
      from: () => [rotation, 0],
      transform: ([x, y]) => [x * 0.02, y] // Sensitivity
    }
  );

  usePinch(
    ({ offset: [d] }) => {
      setScale(d);
    },
    { 
      target: gl.domElement,
      scaleBounds: { min: 0.1, max: 5 },
      from: () => [scale, 0] 
    }
  );

  return null;
};

// Reticle Component for AR Hit-Testing
const Reticle: React.FC<{ onPlace: (position: THREE.Vector3) => void; visible: boolean }> = ({ onPlace, visible }) => {
  const ref = useRef<THREE.Mesh>(null);
  const [hitDetected, setHitDetected] = useState(false);
  const matrixHelper = useMemo(() => new THREE.Matrix4(), []);

  useXRHitTest((results, getWorldMatrix) => {
    if (ref.current && visible && results.length > 0) {
      getWorldMatrix(matrixHelper, results[0]);
      matrixHelper.decompose(ref.current.position, ref.current.quaternion, ref.current.scale);
      setHitDetected(true);
    } else {
      setHitDetected(false);
    }
  }, 'viewer');

  return (
    <mesh
      ref={ref}
      visible={visible && hitDetected}
      rotation={[-Math.PI / 2, 0, 0]}
      onClick={(e) => {
        e.stopPropagation();
        if (ref.current) {
          onPlace(ref.current.position.clone());
        }
      }}
    >
      <ringGeometry args={[0.1, 0.25, 32]} />
      <meshStandardMaterial color="white" opacity={0.8} transparent />
    </mesh>
  );
};

// Model Viewer Component
const ModelViewer: React.FC<{
  url: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  visible: boolean;
}> = ({ url, onLoad, onError, position, rotation, scale, visible }) => {
  const { scene } = useGLTF(url, true, true, (loader) => {
    // Optional: loader configuration
  });

  useEffect(() => {
    if (scene) onLoad?.();
  }, [scene, onLoad]);

  const sceneClone = React.useMemo(() => scene.clone(), [scene]);

  return (
    <primitive
      object={sceneClone}
      position={position}
      rotation={rotation}
      scale={[scale, scale, scale]}
      visible={visible}
    />
  );
};

// 2D Image Viewer Component
const ImageViewer: React.FC<{
  url: string;
  onLoad?: () => void;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  visible: boolean;
}> = ({ url, onLoad, position, rotation, scale, visible }) => {
  const texture = React.useMemo(() => new THREE.TextureLoader().load(url, onLoad), [url, onLoad]);

  return (
    <mesh position={position} rotation={rotation} scale={[scale, scale, scale]} visible={visible}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={texture} side={THREE.DoubleSide} transparent />
    </mesh>
  );
};

// ------------------------------------------------------------------
// Main Component
// ------------------------------------------------------------------

const SimplifiedARPreview: React.FC<{
  config: SimplifiedARPreviewConfig;
  onClose: () => void;
}> = ({ config, onClose }) => {
  // State
  const [modelPosition, setModelPosition] = useState<[number, number, number]>(
    config.position ? [config.position.x, config.position.y, config.position.z] : [0, 0, 0]
  );
  const [modelRotation, setModelRotation] = useState<[number, number, number]>(
    config.rotation ? [config.rotation.x, config.rotation.y, config.rotation.z] : [0, 0, 0]
  );
  const [modelScale, setModelScale] = useState(config.scale || 1.0);
  
  const [placed, setPlaced] = useState(false);
  const [isAR, setIsAR] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Lighting State
  const [ambientIntensity, setAmbientIntensity] = useState(config.ambientLightIntensity || 1.0);
  const [dirIntensity, setDirIntensity] = useState(config.directionalLightIntensity || 1.0);

  const handleEnterAR = async () => {
    try {
      await store.enterAR();
      setIsAR(true);
      setPlaced(false);
    } catch (e) {
      console.error("Failed to enter AR", e);
      alert("AR启动失败，请检查设备兼容性");
    }
  };

  const handlePlace = (pos: THREE.Vector3) => {
    setModelPosition([pos.x, pos.y, pos.z]);
    setPlaced(true);
  };

  const handleSnapshot = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      try {
        const dataURL = canvas.toDataURL('image/png');
        if (navigator.share) {
          fetch(dataURL)
            .then(res => res.blob())
            .then(blob => {
              const file = new File([blob], "ar-snapshot.png", { type: "image/png" });
              navigator.share({
                title: 'AR 预览截图',
                text: '查看我在津脉智坊的AR创作！',
                files: [file]
              }).catch(console.error);
            });
        } else {
          const link = document.createElement('a');
          link.href = dataURL;
          link.download = 'ar-snapshot.png';
          link.click();
        }
      } catch (e) {
        console.error("Snapshot failed", e);
        alert("截图失败，可能是跨域资源限制");
      }
    }
  };

  useEffect(() => {
    setModelScale(config.scale || 1.0);
  }, [config]);

  // Update rotation from gesture (only Y axis)
  const handleGestureRotation = (yRotation: number) => {
    setModelRotation([modelRotation[0], yRotation, modelRotation[2]]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 bg-gray-900/80 text-white z-20 backdrop-blur-md">
        <h2 className="text-lg font-bold">AR 预览</h2>
        <div className="flex gap-2">
          <button
            onClick={handleEnterAR}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <span>📱</span> 进入 AR
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
          >
            关闭
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 relative bg-gradient-to-b from-gray-800 to-gray-900">
        <Canvas
          gl={{ preserveDrawingBuffer: true }}
          style={{ width: '100%', height: '100%' }}
          shadows
        >
          <XR store={store}>
            {/* Lights & Environment */}
            <ambientLight intensity={ambientIntensity} />
            <directionalLight 
              position={[5, 10, 5]} 
              intensity={dirIntensity} 
              castShadow 
              shadow-mapSize={[1024, 1024]} 
            />
            <Environment preset="sunset" blur={0.5} background={false} />

            {/* Content Group */}
            <group>
              {config.type === '3d' && config.modelUrl ? (
                <Suspense fallback={null}>
                  <ModelViewer
                    url={config.modelUrl}
                    onLoad={() => setLoading(false)}
                    position={modelPosition}
                    rotation={modelRotation}
                    scale={modelScale}
                    visible={!isAR || placed}
                  />
                </Suspense>
              ) : config.type === '2d' && config.imageUrl ? (
                <Suspense fallback={null}>
                  <ImageViewer
                    url={config.imageUrl}
                    onLoad={() => setLoading(false)}
                    position={modelPosition}
                    rotation={modelRotation}
                    scale={modelScale}
                    visible={!isAR || placed}
                  />
                </Suspense>
              ) : null}

              {/* AR Reticle */}
              {isAR && !placed && (
                <Reticle onPlace={handlePlace} visible={!placed} />
              )}
              
              {/* AR Gestures (Only active when placed in AR) */}
              {isAR && placed && (
                <ARGestures 
                  setRotation={handleGestureRotation}
                  setScale={setModelScale}
                  rotation={modelRotation[1]}
                  scale={modelScale}
                />
              )}
            </group>

            {!isAR && <OrbitControls makeDefault />}
            
            {!isAR && (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
                <planeGeometry args={[20, 20]} />
                <shadowMaterial opacity={0.4} />
              </mesh>
            )}
          </XR>
        </Canvas>

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        )}

        {/* AR UI Overlay (Controls) */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 bg-gradient-to-t from-black/90 to-transparent text-white z-20">
          <div className="max-w-md mx-auto space-y-4">
            
            {/* Status Hint */}
            {isAR && !placed && (
              <div className="text-center bg-blue-600/80 py-2 rounded-lg animate-pulse mb-2">
                请移动手机寻找平面，点击光圈放置模型
              </div>
            )}
            
            {/* Gesture Hint */}
            {isAR && placed && (
               <div className="text-center text-xs text-gray-300 mb-2">
                单指拖动旋转 · 双指捏合缩放
              </div>
            )}

            {/* Controls Row 1: Transformations */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-300 flex justify-between">
                  <span>缩放</span>
                  <span>{modelScale.toFixed(1)}x</span>
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={modelScale}
                  onChange={(e) => setModelScale(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-300 flex justify-between">
                  <span>旋转 Y</span>
                  <span>{(modelRotation[1] * 180 / Math.PI).toFixed(0)}°</span>
                </label>
                <input
                  type="range"
                  min="-3.14"
                  max="3.14"
                  step="0.1"
                  value={modelRotation[1]}
                  onChange={(e) => setModelRotation([modelRotation[0], parseFloat(e.target.value), modelRotation[2]])}
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
            </div>

            {/* Controls Row 2: Lighting & Actions */}
            <div className="grid grid-cols-2 gap-4 items-end">
              <div className="space-y-1">
                <label className="text-xs text-gray-300 flex justify-between">
                  <span>环境光</span>
                  <span>{ambientIntensity.toFixed(1)}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.1"
                  value={ambientIntensity}
                  onChange={(e) => setAmbientIntensity(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                />
              </div>
              
              <div className="flex gap-2">
                 <button
                  onClick={handleSnapshot}
                  className="flex-1 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <span>📸</span> 截图
                </button>
                {isAR && placed && (
                  <button
                    onClick={() => setPlaced(false)}
                    className="flex-1 py-2 bg-red-600/80 hover:bg-red-600 rounded-lg text-sm transition-colors"
                  >
                    重置位置
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default SimplifiedARPreview;
