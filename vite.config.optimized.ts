/**
 * Vite构建优化配置
 * 包含代码分割、压缩、缓存等优化策略
 */

import { defineConfig, UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import path from 'path';
import { compression } from 'vite-plugin-compression2';
import { viteStaticCopy } from 'vite-plugin-static-copy';

/**
 * 构建环境配置
 */
const BUILD_ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production'
} as const;

type BuildEnvironment = typeof BUILD_ENVIRONMENTS[keyof typeof BUILD_ENVIRONMENTS];

/**
 * 获取当前构建环境
 */
function getBuildEnvironment(): BuildEnvironment {
  const env = process.env.NODE_ENV || process.env.BUILD_ENV;
  
  switch (env) {
    case 'development':
      return BUILD_ENVIRONMENTS.DEVELOPMENT;
    case 'staging':
      return BUILD_ENVIRONMENTS.STAGING;
    case 'production':
      return BUILD_ENVIRONMENTS.PRODUCTION;
    default:
      return BUILD_ENVIRONMENTS.PRODUCTION;
  }
}

/**
 * 基础插件配置
 */
function getBasePlugins() {
  return [
    react({
      // React插件配置
      babel: {
        plugins: [
          // 开发环境插件
          ...(getBuildEnvironment() === BUILD_ENVIRONMENTS.DEVELOPMENT ? [
            'babel-plugin-styled-components'
          ] : []),
          
          // 生产环境插件
          ...(getBuildEnvironment() === BUILD_ENVIRONMENTS.PRODUCTION ? [
            ['babel-plugin-transform-remove-console', { exclude: ['error', 'warn'] }]
          ] : [])
        ]
      }
    }),
    
    tsconfigPaths(),
    
    // 静态资源复制
    viteStaticCopy({
      targets: [
        {
          src: 'public/robots.txt',
          dest: '.'
        },
        {
          src: 'public/manifest.json',
          dest: '.'
        },
        {
          src: 'public/icons/*',
          dest: 'icons'
        }
      ]
    })
  ];
}

/**
 * 图片优化插件配置
 */
function getImageOptimizationPlugins() {
  return ViteImageOptimizer({
    // 图片格式优化配置
    png: {
      quality: 85,
      compressionLevel: 6,
      adaptiveFiltering: true,
      palette: true,
      progressive: true
    },
    
    jpeg: {
      quality: 85,
      progressive: true,
      arithmetic: false,
      mozjpeg: true
    },
    
    jpg: {
      quality: 85,
      progressive: true,
      arithmetic: false,
      mozjpeg: true
    },
    
    webp: {
      quality: 80,
      effort: 6,
      lossless: false,
      nearLossless: false,
      smartSubsample: true
    },
    
    avif: {
      quality: 75,
      effort: 4,
      lossless: false,
      chromaSubsampling: '4:2:0'
    },
    
    svg: {
      plugins: [
        {
          name: 'preset-default',
          params: {
            overrides: {
              removeViewBox: false,
              removeDimensions: true
            }
          }
        }
      ]
    },
    
    gif: {
      optimizationLevel: 2,
      interlaced: false
    },
    
    // 响应式图片配置
    generateResponsiveImages: true,
    responsive: {
      adapter: {
        name: 'sharp',
        options: {
          sizes: [320, 640, 768, 1024, 1280, 1536, 1920],
          format: ['webp', 'avif', 'original'],
          quality: [80, 75, 85],
          withoutEnlargement: true,
          skipOnEnlargement: true
        }
      }
    },
    
    // 缓存配置
    cache: true,
    cacheLocation: 'node_modules/.vite-image-cache',
    
    // 处理配置
    exclude: [
      /node_modules/,
      /\.git/,
      /dist/,
      /build/
    ],
    
    include: [
      '**/*.{png,jpg,jpeg,gif,webp,avif,svg}'
    ],
    
    // 开发环境配置
    disable: getBuildEnvironment() === BUILD_ENVIRONMENTS.DEVELOPMENT && !process.env.FORCE_IMAGE_OPTIMIZATION
  });
}

/**
 * PWA插件配置
 */
function getPWAPlugins() {
  return VitePWA({
    registerType: 'autoUpdate',
    
    workbox: {
      // 缓存策略
      globPatterns: [
        '**/*.{js,css,html,ico,png,jpg,jpeg,svg,gif,webp,avif,woff,woff2,ttf,otf}'
      ],
      
      // 运行时缓存
      runtimeCaching: [
        // API缓存
        {
          urlPattern: /^https?:\/\/.*\/api\//,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-cache',
            networkTimeoutSeconds: 10,
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24 // 24小时
            },
            cacheableResponse: {
              statuses: [0, 200, 201, 204]
            }
          }
        },
        
        // 图片缓存
        {
          urlPattern: /^https?:\/\/.*\.(png|jpg|jpeg|svg|gif|webp|avif)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'image-cache',
            expiration: {
              maxEntries: 200,
              maxAgeSeconds: 60 * 60 * 24 * 30 // 30天
            },
            rangeRequests: true
          }
        },
        
        // 字体缓存
        {
          urlPattern: /^https?:\/\/.*\.(woff|woff2|ttf|otf)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'font-cache',
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 60 * 24 * 365 // 1年
            }
          }
        },
        
        // CDN资源缓存
        {
          urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\//,
          handler: 'CacheFirst',
          options: {
            cacheName: 'cdn-cache',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24 * 365 // 1年
            }
          }
        }
      ],
      
      // 导航回退
      navigateFallback: '/index.html',
      navigateFallbackDenylist: [/^\/api\//],
      
      // 跳过等待
      skipWaiting: true,
      clientsClaim: true,
      
      // 最大文件大小
      maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB
      
      // 清理旧缓存
      cleanupOutdatedCaches: true,
      
      // 忽略模式
      globIgnores: [
        '**/*.map',
        '**/node_modules/**',
        '**/*.ts',
        '**/*.tsx'
      ]
    },
    
    // 包含的资源
    includeAssets: [
      'favicon.ico',
      'robots.txt',
      'manifest.json',
      'icons/**/*',
      'assets/**/*'
    ],
    
    // 清单配置
    manifest: {
      name: '津脉智坊 - 津门老字号共创平台',
      short_name: '津脉智坊',
      description: '津门老字号共创平台，传承与创新的桥梁',
      theme_color: '#2563eb',
      background_color: '#ffffff',
      display: 'standalone',
      orientation: 'portrait',
      start_url: '/',
      scope: '/',
      
      icons: [
        {
          src: 'icons/icon-192x192.svg',
          sizes: '192x192',
          type: 'image/svg+xml',
          purpose: 'any maskable'
        },
        {
          src: 'icons/icon-512x512.svg',
          sizes: '512x512',
          type: 'image/svg+xml',
          purpose: 'any maskable'
        },
        {
          src: 'icons/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: 'icons/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ],
      
      // 应用类别
      categories: ['productivity', 'utilities'],
      
      // 语言
      lang: 'zh-CN',
      
      // 屏幕方向
      orientation: 'portrait-primary'
    },
    
    // 开发选项
    devOptions: {
      enabled: getBuildEnvironment() === BUILD_ENVIRONMENTS.DEVELOPMENT,
      type: 'module',
      navigateFallbackAllowlist: [/^\/$/]
    }
  });
}

/**
 * 分析插件配置
 */
function getAnalyzerPlugins() {
  const plugins = [];
  
  // 仅在需要分析时启用
  if (process.env.ANALYZE === 'true') {
    plugins.push(
      visualizer({
        filename: 'bundle-analysis.html',
        open: true,
        gzipSize: true,
        brotliSize: true,
        template: 'treemap',
        sourcemap: false
      })
    );
  }
  
  return plugins;
}

/**
 * 压缩插件配置
 */
function getCompressionPlugins() {
  if (getBuildEnvironment() === BUILD_ENVIRONMENTS.DEVELOPMENT) {
    return [];
  }
  
  return [
    compression({
      algorithm: 'gzip',
      include: /\.(js|css|html|svg|json|xml|txt)$/,
      exclude: /node_modules/,
      threshold: 1024,
      compressionOptions: {
        level: 9
      }
    }),
    
    compression({
      algorithm: 'brotliCompress',
      include: /\.(js|css|html|svg|json|xml|txt)$/,
      exclude: /node_modules/,
      threshold: 1024,
      compressionOptions: {
        params: {
          [require('zlib').constants.BROTLI_PARAM_QUALITY]: 11
        }
      },
      filename: '[path][base].br'
    })
  ];
}

/**
 * 获取完整的插件配置
 */
function getPlugins() {
  return [
    ...getBasePlugins(),
    getImageOptimizationPlugins(),
    getPWAPlugins(),
    ...getCompressionPlugins(),
    ...getAnalyzerPlugins()
  ];
}

/**
 * Rollup配置优化
 */
function getRollupOptions() {
  return {
    // 外部依赖
    external: [
      'better-sqlite3',
      'mongodb',
      'pg',
      '@neondatabase/serverless',
      'ws',
      'fs',
      'path',
      'crypto',
      'stream',
      'util',
      'os',
      'url',
      'net',
      'tls',
      'child_process',
      'cluster',
      'readline',
      'querystring',
      'http',
      'https',
      'zlib'
    ],
    
    // 输出配置
    output: {
      // 手动分块策略
      manualChunks(id) {
        // 第三方库分块
        if (id.includes('node_modules')) {
          // React相关
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
            return 'vendor-react';
          }
          
          // UI库
          if (id.includes('@headlessui') || id.includes('@heroicons') || id.includes('framer-motion')) {
            return 'vendor-ui';
          }
          
          // 工具库
          if (id.includes('lodash') || id.includes('dayjs') || id.includes('clsx') || id.includes('tailwind-merge')) {
            return 'vendor-utils';
          }
          
          // 图表库
          if (id.includes('recharts') || id.includes('chart.js')) {
            return 'vendor-charts';
          }
          
          // 地图库
          if (id.includes('@amap') || id.includes('mapbox')) {
            return 'vendor-maps';
          }
          
          // 3D库
          if (id.includes('three') || id.includes('@react-three')) {
            return 'vendor-3d';
          }
          
          // AI库
          if (id.includes('@tensorflow') || id.includes('@mediapipe')) {
            return 'vendor-ai';
          }
          
          // 其他第三方库
          return 'vendor-others';
        }
        
        // 应用代码分块
        if (id.includes('src/pages/')) {
          // 页面分块
          if (id.includes('admin')) return 'pages-admin';
          if (id.includes('create')) return 'pages-create';
          if (id.includes('explore')) return 'pages-explore';
          if (id.includes('community')) return 'pages-community';
          if (id.includes('cultural')) return 'pages-cultural';
          if (id.includes('membership')) return 'pages-membership';
          if (id.includes('dashboard')) return 'pages-dashboard';
          return 'pages-others';
        }
        
        if (id.includes('src/components/')) {
          // 组件分块
          if (id.includes('ui')) return 'components-ui';
          if (id.includes('charts')) return 'components-charts';
          if (id.includes('maps')) return 'components-maps';
          if (id.includes('3d')) return 'components-3d';
          if (id.includes('ai')) return 'components-ai';
          return 'components-others';
        }
        
        if (id.includes('src/utils/')) {
          return 'utils';
        }
        
        if (id.includes('src/hooks/')) {
          return 'hooks';
        }
        
        if (id.includes('src/services/')) {
          return 'services';
        }
      },
      
      // 优化配置
      compact: true,
      generatedCode: 'es2015',
      minifyInternalExports: true,
      
      // 代码分割
      experimentalMinChunkSize: 20000, // 20KB
      
      // 动态导入
      dynamicImportInCjs: true
    },
    
    // 优化插件
    plugins: [
      // 代码压缩优化
      require('rollup-plugin-terser').terser({
        compress: {
          drop_console: getBuildEnvironment() === BUILD_ENVIRONMENTS.PRODUCTION,
          drop_debugger: getBuildEnvironment() === BUILD_ENVIRONMENTS.PRODUCTION,
          pure_funcs: getBuildEnvironment() === BUILD_ENVIRONMENTS.PRODUCTION 
            ? ['console.log', 'console.info', 'console.debug'] 
            : [],
          passes: 2,
          unsafe: true,
          unsafe_comps: true,
          unsafe_math: true,
          unsafe_proto: true,
          hoist_funs: true,
          hoist_vars: true,
          if_return: true,
          join_vars: true,
          cascade: true,
          collapse_vars: true,
          reduce_funcs: true,
          reduce_vars: true,
          sequences: true,
          properties: true,
          dead_code: true,
          conditionals: true,
          comparisons: true,
          evaluate: true,
          booleans: true,
          loops: true,
          unused: true,
          toplevel: true,
          top_retain: ['__vitePreload']
        },
        mangle: {
          toplevel: true,
          properties: {
            regex: /^_/
          }
        },
        format: {
          comments: false,
          beautify: false
        }
      })
    ]
  };
}

/**
 * 构建配置
 */
export default defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production';
  const buildEnvironment = getBuildEnvironment();
  
  return {
    // 基础配置
    base: '/',
    publicDir: 'public',
    
    // 插件配置
    plugins: getPlugins(),
    
    // 解析配置
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        
        // Node.js模块mock（浏览器环境）
        'fs': path.resolve(__dirname, './src/utils/browserMocks/fs.ts'),
        'path': path.resolve(__dirname, './src/utils/browserMocks/path.ts'),
        'crypto': path.resolve(__dirname, './src/utils/browserMocks/crypto.ts'),
        'stream': path.resolve(__dirname, './src/utils/browserMocks/stream.ts'),
        'util': path.resolve(__dirname, './src/utils/browserMocks/util.ts'),
        'os': path.resolve(__dirname, './src/utils/browserMocks/os.ts'),
        'url': path.resolve(__dirname, './src/utils/browserMocks/url.ts'),
        'net': path.resolve(__dirname, './src/utils/browserMocks/net.ts'),
        'tls': path.resolve(__dirname, './src/utils/browserMocks/tls.ts'),
        'child_process': path.resolve(__dirname, './src/utils/browserMocks/child_process.ts'),
        'cluster': path.resolve(__dirname, './src/utils/browserMocks/cluster.ts'),
        'readline': path.resolve(__dirname, './src/utils/browserMocks/readline.ts'),
        'querystring': path.resolve(__dirname, './src/utils/browserMocks/querystring.ts'),
        'http': path.resolve(__dirname, './src/utils/browserMocks/http.ts'),
        'https': path.resolve(__dirname, './src/utils/browserMocks/https.ts'),
        'zlib': path.resolve(__dirname, './src/utils/browserMocks/zlib.ts'),
        
        // 数据库驱动mock
        'better-sqlite3': path.resolve(__dirname, './src/utils/browserMocks/database.ts'),
        'mongodb': path.resolve(__dirname, './src/utils/browserMocks/database.ts'),
        'pg': path.resolve(__dirname, './src/utils/browserMocks/database.ts'),
        '@neondatabase/serverless': path.resolve(__dirname, './src/utils/browserMocks/database.ts'),
        'ws': path.resolve(__dirname, './src/utils/browserMocks/websocket.ts'),
        // react-reconciler别名，解决AR预览功能的导入问题
        'react-reconciler/constants': '@/utils/reactReconcilerStub',
        'react-reconciler': '@/utils/reactReconcilerStub'
      },
      
      // 扩展名解析
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue', '.svelte'],
      
      // 模块解析
      mainFields: ['module', 'jsnext:main', 'jsnext', 'main'],
      
      // 条件导出
      conditions: ['import', 'module', 'browser', 'default', 'require']
    },
    
    // 开发服务器配置
    server: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
      open: true,
      cors: true,
      
      // 代理配置
      proxy: {
        '/api': {
          target: 'http://localhost:3010',
          changeOrigin: true,
          secure: false,
          ws: true,
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.error('Proxy error:', err);
            });
            
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log(`[Proxy] ${req.method} ${req.url} -> ${proxyReq.protocol}//${proxyReq.host}${proxyReq.path}`);
            });
            
            proxy.on('proxyRes', (proxyRes, req, res) => {
              console.log(`[Proxy] ${req.method} ${req.url} <- ${proxyRes.statusCode}`);
            });
          }
        }
      },
      
      // HMR配置
      hmr: {
        overlay: true,
        protocol: 'ws',
        host: 'localhost',
        port: 3000,
        clientPort: 3000
      }
    },
    
    // 预览服务器配置
    preview: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
      open: true,
      cors: true,
      
      // 代理配置（与开发服务器相同）
      proxy: {
        '/api': {
          target: 'http://localhost:3010',
          changeOrigin: true,
          secure: false,
          ws: true
        }
      }
    },
    
    // 构建配置
    build: {
      // 输出目录
      outDir: 'dist',
      
      // 输出选项
      assetsDir: 'assets',
      assetsInlineLimit: 4096, // 4KB以下内联
      cssCodeSplit: true,
      cssTarget: 'es2018',
      sourcemap: isProduction ? false : 'inline',
      minify: isProduction ? 'terser' : 'esbuild',
      
      // Terser配置
      terserOptions: {
        compress: {
          drop_console: isProduction,
          drop_debugger: isProduction,
          pure_funcs: isProduction ? ['console.log', 'console.info', 'console.debug'] : [],
          passes: 2,
          unsafe: isProduction,
          unsafe_comps: isProduction,
          unsafe_math: isProduction,
          unsafe_proto: isProduction,
          hoist_funs: true,
          hoist_vars: true,
          if_return: true,
          join_vars: true,
          cascade: true,
          collapse_vars: true,
          reduce_funcs: true,
          reduce_vars: true,
          sequences: true,
          properties: true,
          dead_code: true,
          conditionals: true,
          comparisons: true,
          evaluate: true,
          booleans: true,
          loops: true,
          unused: true,
          toplevel: true
        },
        mangle: {
          toplevel: true,
          properties: {
            regex: /^_/
          }
        },
        format: {
          comments: false,
          beautify: false
        }
      },
      
      // Rollup选项
      rollupOptions: getRollupOptions(),
      
      // 报告配置
      reportCompressedSize: true,
      chunkSizeWarningLimit: 1000, // 1MB警告阈值
      
      // 写入配置
      write: true,
      emptyOutDir: true,
      
      // 监视配置
      watch: command === 'build' ? null : undefined
    },
    
    // 优化配置
    optimizeDeps: {
      // 强制预构建
      force: false,
      
      // 包含的依赖
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'clsx',
        'tailwind-merge',
        'framer-motion',
        'sonner',
        'recharts',
        'i18next',
        'react-i18next',
        'zustand',
        'zod'
      ],
      
      // 排除的依赖
      exclude: [
        'better-sqlite3',
        'mongodb',
        'pg',
        '@neondatabase/serverless',
        'ws',
        '@tensorflow/tfjs-core',
        '@tensorflow/tfjs-backend-webgl',
        'three',
        '@react-three/fiber',
        '@react-three/drei',
        'three-stdlib'
      ],
      
      // ESBuild配置
      esbuildOptions: {
        target: 'es2022',
        format: 'esm',
        platform: 'browser',
        minify: false,
        minifySyntax: false,
        minifyIdentifiers: false,
        minifyWhitespace: false,
        treeShaking: true,
        pure: isProduction ? ['console.log', 'console.info', 'console.debug'] : [],
        legalComments: 'inline'
      }
    },
    
    // CSS配置
    css: {
      modules: {
        localsConvention: 'camelCaseOnly',
        scopeBehaviour: 'local',
        globalModulePaths: [/global/],
        generateScopedName: isProduction 
          ? '[hash:base64:5]' 
          : '[name]__[local]___[hash:base64:5]'
      },
      
      postcss: {
        plugins: [
          require('tailwindcss'),
          require('autoprefixer'),
          ...(isProduction ? [require('cssnano')] : [])
        ]
      },
      
      devSourcemap: !isProduction
    },
    
    // JSON配置
    json: {
      namedExports: true,
      stringify: false
    },
    
    // Worker配置
    worker: {
      format: 'es',
      plugins: () => [
        react(),
        tsconfigPaths()
      ]
    },
    
    // 环境变量配置
    envPrefix: ['VITE_', 'REACT_APP_'],
    
    // 日志配置
    logLevel: 'info',
    clearScreen: true,
    
    // 自定义Logger
    customLogger: undefined,
    
    // 实验性功能
    experimental: {
      // 禁用预加载polyfill
      modulePreload: {
        polyfill: false
      },
      
      // 启用import.meta.glob
      importMetaGlob: true,
      
      // 启用HMR部分接受
      hmrPartialAccept: true,
      
      // 启用跳过Svelte预编译
      skipSveltePreprocess: false
    }
  };
});