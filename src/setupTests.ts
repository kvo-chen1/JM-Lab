import '@testing-library/jest-dom';
import React from 'react';
import { TextEncoder, TextDecoder } from 'util';

// Simple mocks for Three.js related libraries
jest.mock('three', () => ({
  ...jest.requireActual('three'),
  WebGLRenderer: jest.fn(() => ({
    domElement: document.createElement('canvas'),
    setSize: jest.fn(),
    render: jest.fn(),
    dispose: jest.fn(),
  })),
}));

jest.mock('@react-three/fiber', () => ({
  Canvas: jest.fn(({ children }) => {
    // 返回React元素而不是DOM元素
    return React.createElement('div', { 'data-testid': 'canvas-mock' }, children);
  }),
  useFrame: jest.fn((callback) => {
    // 模拟useFrame钩子
    const mockState = { clock: { getElapsedTime: () => 0 } };
    const mockDelta = 0.016;
    if (typeof callback === 'function') {
      callback(mockState, mockDelta);
    }
  }),
  useLoader: jest.fn(() => Promise.resolve(null)),
  useThree: jest.fn(() => ({
    camera: { 
      position: { 
        x: 0, 
        y: 0, 
        z: 5,
        clone: function() {
          return { x: this.x, y: this.y, z: this.z };
        },
        lerpVectors: function(start: { x: number; y: number; z: number }, end: { x: number; y: number; z: number }, alpha: number) {
          this.x = start.x + (end.x - start.x) * alpha;
          this.y = start.y + (end.y - start.y) * alpha;
          this.z = start.z + (end.z - start.z) * alpha;
          return this;
        }
      },
      lookAt: jest.fn(),
      updateProjectionMatrix: jest.fn()
    },
    gl: { 
      domElement: document.createElement('canvas'),
      setSize: jest.fn(),
      setPixelRatio: jest.fn(),
      clear: jest.fn(),
      render: jest.fn(),
      shadowMap: { 
        enabled: false,
        type: 0 // THREE.BasicShadowMap
      }
    },
    scene: { 
      add: jest.fn(),
      remove: jest.fn(),
      children: []
    }
  })),
}));

jest.mock('@react-three/drei', () => ({
  OrbitControls: jest.fn(() => {
    // 返回React元素而不是DOM元素
    return React.createElement('div', { 'data-testid': 'orbit-controls-mock' });
  }),
  PerspectiveCamera: jest.fn(() => {
    // 返回React元素而不是DOM元素
    return React.createElement('div', { 'data-testid': 'perspective-camera-mock' });
  }),
  Environment: jest.fn(() => {
    // 返回React元素而不是DOM元素
    return React.createElement('div', { 'data-testid': 'environment-mock' });
  }),
  useGLTF: jest.fn(() => ({ 
    scene: { 
      type: 'Group',
      children: [],
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 }
    } 
  })),
}));

// Mock for sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Global test setup
global.ResizeObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

global.IntersectionObserver = jest.fn(() => ({
  root: null,
  rootMargin: '0px',
  thresholds: [],
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  takeRecords: jest.fn(),
}));

// Fix the type error by casting to any
type MockObserver = any;
global.IntersectionObserver = jest.fn(() => ({
  root: null,
  rootMargin: '0px',
  thresholds: [],
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  takeRecords: jest.fn(),
})) as MockObserver;

// Mock TextEncoder and TextDecoder for JSDOM environment
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}

// Mock import.meta.env for testing environment
// 使用类型断言来避免TypeScript错误
if (typeof (global as any).import === 'undefined') {
  (global as any).import = {
    meta: {
      env: {
        DEV: true,
        NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-key',
        VITE_SUPABASE_URL: '',
        VITE_SUPABASE_ANON_KEY: '',
        SUPABASE_URL: '',
        SUPABASE_ANON_KEY: ''
      }
    }
  };
}