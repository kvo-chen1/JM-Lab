import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'
import path from 'path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const LOCAL_API_PORT = process.env.LOCAL_API_PORT || '3021'
// 使用127.0.0.1而不是localhost，避免IPv6连接问题
const LOCAL_API_TARGET = `http://127.0.0.1:${LOCAL_API_PORT}`

export default defineConfig({
  base: '/',
  plugins: [
    react(), 
    tsconfigPaths(),
    ViteImageOptimizer({
      // 启用WebP和AVIF格式转换
      png: {
        quality: 80,
        compressionLevel: 9,
        force: true
      },
      jpeg: {
        quality: 80,
        force: true
      },
      webp: {
        quality: 85,
        force: true
      },
      avif: {
        quality: 75,
        force: true
      },
      // 暂时禁用响应式图片生成以加快构建速度
      generateResponsiveImages: false,
      // 响应式图片尺寸配置
      /*
      responsive: {
        adapter: {
          name: 'sharp',
          options: {
            sizes: [320, 640, 1024, 1600, 2048],
            format: ['webp', 'avif'],
            quality: [85, 75]
          }
        }
      },
      */
      svg: {
        quality: 85,
        force: true
      },
      gif: {
        quality: 85,
        force: true
      },
      // 仅在构建时优化
      disable: process.env.NODE_ENV === 'development',
      // 仅优化src目录下的图片
      include: /\.(png|jpe?g|gif|svg|webp|avif)$/i,
      // 排除node_modules目录和有问题的图片
      exclude: [/node_modules/, /fallback\.jpg$/, /placeholder-image\.jpg$/]
    }),
    VitePWA({
      injectRegister: false,
      selfDestroying: true,
      registerType: 'autoUpdate',
      // Explicitly include static assets from public folder
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.svg', 'images/*.svg'],
      manifest: {
        name: '津脉智坊 - 津门老字号共创平台',
        short_name: '津脉智坊',
        description: '津门老字号共创平台，传承与创新的桥梁',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        categories: ['productivity', 'creativity', 'education'],
        lang: 'zh-CN',
        start_url: '/?source=pwa',
        scope: '/',
        shortcuts: [
          {
            name: '开始创作',
            short_name: '创作',
            description: '开始新的创作项目',
            url: '/create',
            icons: [{ src: 'icons/icon-96x96.svg', sizes: '96x96' }]
          },
          {
            name: '浏览作品',
            short_name: '浏览',
            description: '浏览社区作品',
            url: '/explore',
            icons: [{ src: 'icons/icon-96x96.svg', sizes: '96x96' }]
          },
          {
            name: '个人中心',
            short_name: '我的',
            description: '查看个人资料和作品',
            url: '/profile',
            icons: [{ src: 'icons/icon-96x96.svg', sizes: '96x96' }]
          }
        ],
        icons: [
          {
            src: 'icons/icon-72x72.svg',
            sizes: '72x72',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: 'icons/icon-96x96.svg',
            sizes: '96x96',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: 'icons/icon-128x128.svg',
            sizes: '128x128',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: 'icons/icon-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: 'icons/icon-384x384.svg',
            sizes: '384x384',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: 'icons/icon-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // 增加最大缓存文件大小限制到8MB，解决大型文件无法缓存的问题
        maximumFileSizeToCacheInBytes: 8000000,
        // 预缓存所有生成的资源
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,svg,gif,woff2,ttf}'],
        // 预缓存资源的缓存策略
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        // 添加skipWaiting和clientsClaim选项
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        // Ignore static assets directories in glob to avoid conflict with includeAssets/manifest
        globIgnores: ['**/*.map', '**/node_modules/**', '**/public/**', 'icons/**', 'images/**'],
        runtimeCaching: [
          // API请求缓存 - 使用NetworkFirst策略
          {
            urlPattern: /^https?:\/\/.*\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              // 跳过带有no-store头的请求
              matchOptions: {
                ignoreSearch: true,
                ignoreVary: true
              }
            }
          },
          // 字体资源缓存 - 长期缓存
          {
            urlPattern: /^https?:\/\/.*\.(woff2|woff|ttf|otf|eot)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'font-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          // 图片资源缓存 - 增加缓存条目数量
          {
            urlPattern: /^https?:\/\/.*\.(png|jpg|jpeg|svg|gif|webp|avif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 100, // 增加到100个条目
                maxAgeSeconds: 60 * 60 * 24 * 60 // 60 days
              },
              rangeRequests: true // 支持范围请求，优化大图片加载
            }
          },
          // CSS和JS资源缓存 - 调整缓存策略
          {
            urlPattern: /^https?:\/\/.*\.(js|css)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources',
              expiration: {
                maxEntries: 50, // 增加到50个条目
                maxAgeSeconds: 60 * 60 * 24 * 14 // 14 days
              },
              cacheableResponse: {
                statuses: [0, 200]
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
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          // 视频资源缓存
          {
            urlPattern: /^https?:\/\/.*\.(mp4|webm|ogg)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'video-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              rangeRequests: true // 支持范围请求
            }
          }
        ]
      }
    })
  ],
  resolve: {
    // 为数据库相关的 Node.js 原生模块创建别名，避免在浏览器环境中打包
    alias: {
      '@': path.resolve(__dirname, './src'),
      'better-sqlite3': '@/utils/databaseStub',
      'mongodb': '@/utils/databaseStub',
      'pg': '@/utils/databaseStub',
      '@neondatabase/serverless': '@/utils/databaseStub',
      'ws': '@/utils/databaseStub',
      // Fix: point to actual file in node_modules to avoid export map issues
      'react-reconciler/constants': 'react-reconciler/constants.js', 
      // Fix: ensure scheduler resolves to the correct entry point
      scheduler: require.resolve('scheduler')
    }
  },
  define: {
    // 定义Three.js 0.181+版本中缺失的编码常量
    // 这些常量在新版本中已被移除，但@react-three/drei仍在使用
    'THREE.LinearEncoding': '1',
    'THREE.sRGBEncoding': '3',
    'THREE.GammaEncoding': '2'
  },
  build: {
    // 优化构建输出
    minify: 'esbuild', // 使用esbuild替代terser加快构建速度
    /*
    terserOptions: {
      compress: {
        drop_console: true, // 移除console.log
        drop_debugger: true, // 移除debugger
        pure_funcs: ['console.debug', 'console.info'], // 移除特定console方法
        passes: 2 // 执行多次压缩
      },
      mangle: {
        toplevel: true, // 顶级变量名混淆
        keep_classnames: false,
        keep_fnames: false
      }
    },
    */
    // 禁用brotli大小计算以加快构建
    brotliSize: false, 
    // 优化 CSS 构建
    cssMinify: 'esbuild', // 使用esbuild压缩CSS，确保构建成功
    // 启用CSS代码分割
    cssCodeSplit: true,
    // 生成 sourcemap（生产环境可关闭）
    sourcemap: false,
    // 设置 chunk 大小警告阈值（单位：KB）
    chunkSizeWarningLimit: 800, // 降低警告阈值，确保chunk大小合理
    // 启用资产预加载
    preloadAssets: true, // 启用预加载，优化加载性能
    // 禁用压缩大小报告以加快构建
    reportCompressedSize: false, 
    // 调整资产内联限制，减少内联资源数量
    assetsInlineLimit: 4096, // 内联小于4KB的资源
    // 禁用动态导入 polyfill，减少不必要的代码
    modulePreload: {
      polyfill: false
    },
    // 启用更严格的 tree-shaking
    ssr: false,
    // 优化构建目标，使用更现代的ES版本
    target: 'es2022',
    // 分割代码
    rollupOptions: {
      // 启用更严格的tree-shaking
      treeshake: {
        moduleSideEffects: 'no-external',
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
        correctVarValueBeforeDeclaration: true
      },
      // 外部化 Node.js 原生模块和不兼容的依赖，避免打包到浏览器代码中
      external: ['better-sqlite3', 'mongodb', 'pg', '@neondatabase/serverless', 'ws'],
      // 优化输入选项
      input: {
        main: 'index.html',
      },
      output: {
        // 优化资产输出
        assetFileNames: 'assets/[name]-[hash:8][extname]',
        chunkFileNames: 'chunks/[name]-[hash:8].js',
        entryFileNames: 'entries/[name]-[hash:8].js',
        // 启用动态导入支持
        dynamicImportInCjs: true,
        // 手动分包策略
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom') || id.includes('scheduler')) {
              return 'react-vendor';
            }
            if (id.includes('three') || id.includes('@react-three')) {
              return 'three-vendor';
            }
            if (id.includes('framer-motion')) {
              return 'motion-vendor';
            }
            if (id.includes('lucide-react')) {
              return 'icons-vendor';
            }
            // 将其他大型库单独打包
            if (id.includes('@tensorflow') || id.includes('@mediapipe')) {
              return 'ai-vendor';
            }
            return 'vendor';
          }
        }
      },
      // 优化插件配置
      plugins: [
        // 自定义插件：处理@react-three/fiber和@react-three/drei对stub文件的导入问题
        {
          name: 'resolve-stub-files',
          resolveId(source, importer) {
            if (importer && (importer.includes('@react-three/fiber') || importer.includes('@react-three/drei'))) {
              if (source === '@/utils/reactReconcilerStub') {
                return path.resolve(__dirname, './src/utils/reactReconcilerStub.ts');
              } else if (source === '@/utils/reactReconcilerConstantsStub') {
                return path.resolve(__dirname, './src/utils/reactReconcilerConstantsStub.ts');
              }
            }
            return null;
          }
        },
        // 自定义插件：替换Three.js 0.181+版本中缺失的编码常量
        {
          name: 'replace-three-encoding-constants',
          transform(code, id) {
            // 只处理@react-three/drei和@react-three/fiber的文件
            // Also handle pre-bundled deps if they contain drei code (though unlikely to be caught here if optimized)
            if (id.includes('@react-three/drei') || id.includes('@react-three/fiber') || id.includes('three-stdlib')) {
              // 处理从three导入编码常量的情况
              // 匹配导入语句，如: import { Vector3, LinearEncoding } from 'three';
              // 使用 [\s\S]+? 匹配多行内容
              code = code.replace(/import\s+\{([\s\S]+?)\}\s+from\s+['"]three['"];/g, (match, imports) => {
                // 移除编码常量
                const filteredImports = imports.split(',').map(imp => imp.trim())
                  .filter(imp => !['LinearEncoding', 'sRGBEncoding', 'GammaEncoding'].includes(imp))
                  .join(', ');
                
                // 重新构建导入语句
                return `import { ${filteredImports} } from 'three';`;
              });
              
              // 替换代码中使用的编码常量，但避免替换变量名
              // 只替换作为常量使用的情况，如: texture.encoding = sRGBEncoding;
              code = code
                // 处理THREE.前缀的情况
                .replace(/THREE\.LinearEncoding/g, '3000') // 1 -> 3000 (LinearSRGBColorSpace)
                .replace(/THREE\.sRGBEncoding/g, '3001') // 3 -> 3001 (SRGBColorSpace)
                .replace(/THREE\.GammaEncoding/g, '3007'); // 2 -> 3007 (NoColorSpace/Gamma is deprecated)
                
               // 处理直接使用的情况 (LinearEncoding) -> 3000
              // 使用负向回顾断言避免替换变量声明
              code = code
                .replace(/(?<!(const|let|var|function|class|import|export)\s+)\bLinearEncoding\b/g, '3000')
                .replace(/(?<!(const|let|var|function|class|import|export)\s+)\bsRGBEncoding\b/g, '3001')
                .replace(/(?<!(const|let|var|function|class|import|export)\s+)\bGammaEncoding\b/g, '3007');
            }
            return code;
          }
        },
        // 只在ANALYZE模式下启用构建分析插件
        process.env.ANALYZE === 'true' && visualizer({
          filename: 'bundle-visualizer.html',
          open: true,
          gzipSize: true,
          template: 'sunburst', // 更直观的可视化模板
          sourcemap: false,
        }),
      ].filter(Boolean) as any[]
    },
  },
  // 优化开发体验和构建速度
  optimizeDeps: {
    // 预构建依赖 - 只包含核心依赖，减少预构建时间
    include: [
      'react', 'react-dom', 'react-router-dom', 
      'clsx', 'tailwind-merge', 
      'framer-motion',
      'react-reconciler', 'scheduler'
    ],
    // 禁用预构建的依赖，包括数据库依赖和可能存在兼容性问题的库
    exclude: [
      'better-sqlite3', 'mongodb', 'pg', '@neondatabase/serverless',
      '@mediapipe/hands', '@tensorflow/tfjs-core', '@tensorflow/tfjs-backend-webgl',
      'three', '@react-three/fiber'
      // '@react-three/drei' should be optimized to handle its CJS deps like stats.js
    ],
    // 优化依赖构建，增加并发数
    esbuildOptions: {
      target: 'es2022', // 使用更现代的ES版本
      // 优化大型依赖的构建
      treeShaking: true,
      // 优化 esbuild 配置
      minify: false, // 禁用预构建时的压缩，加快预构建速度
      minifySyntax: false,
      minifyIdentifiers: false,
      minifyWhitespace: false,
      // 启用更严格的 tree-shaking
      pure: process.env.NODE_ENV === 'production' ? ['console.log', 'console.warn', 'console.error'] : [],
      plugins: [
        {
          name: 'three-stdlib-encoding-fix',
          setup(build) {
            build.onLoad({ filter: /three-stdlib/ }, async (args) => {
              const fs = require('fs/promises');
              let code = await fs.readFile(args.path, 'utf8');
              
              // Remove LinearEncoding, sRGBEncoding, GammaEncoding from 'three' imports
              // Match pattern: import { ... } from 'three'; or "three"
              code = code.replace(/import\s+\{([^}]+)\}\s+from\s+['"]three['"]/g, (match, imports) => {
                const filtered = imports.split(',')
                  .map(i => i.trim())
                  .filter(i => !['LinearEncoding', 'sRGBEncoding', 'GammaEncoding'].includes(i))
                  .join(',');
                // If filtered is empty, we might leave "import { } from 'three'" which is valid but useless.
                return `import { ${filtered} } from 'three'`;
              });
              
              // Replace usages with numeric constants, but be careful not to replace const declarations
              // Wrong: const LinearEncoding = 3000; -> const 3000 = 3000; (Syntax Error)
              // We should only replace usage, not definition if it happens to be defined locally.
              // However, three-stdlib usually defines them by importing or just using them.
              // In KTX2Loader.js: const LinearEncoding = 3000; might exist if they are polyfilling.
              
              // Improved regex: Negative lookbehind to avoid replacing variable declarations? 
              // JS doesn't support variable lookbehind well in all envs, but we can match context.
              // Or better: Remove the declaration lines if they exist?
              
              // Strategy: 
              // 1. Remove "const LinearEncoding = ..." lines if they are just re-exports or polyfills matching standard values.
              // 2. Replace other usages.
              
              // Let's try to just replace "LinearEncoding" where it is NOT preceded by "const ", "let ", "var ", "function ", "class ".
              // But esbuild regex is limited? No, we are in node.js here.
              
              code = code.replace(/(?<!(const|let|var|function|class|import)\s+)\bLinearEncoding\b/g, '3000')
                         .replace(/(?<!(const|let|var|function|class|import)\s+)\bsRGBEncoding\b/g, '3001')
                         .replace(/(?<!(const|let|var|function|class|import)\s+)\bGammaEncoding\b/g, '3007');
              
              // Also handle cases where they might be properties of an object but not the key definition?
              // e.g. { LinearEncoding: 3000 } -> { 3000: 3000 } is valid JS object literal but maybe not what we want.
              // But usually it's used as value: encoding: LinearEncoding
              
              // Special case for KTX2Loader which seems to define: const LinearEncoding = 3000;
              // We can just remove those lines if they match known patterns.
              code = code.replace(/const\s+LinearEncoding\s*=\s*3000\s*;/g, '')
                         .replace(/const\s+sRGBEncoding\s*=\s*3001\s*;/g, '')
                         .replace(/const\s+GammaEncoding\s*=\s*3007\s*;/g, '');
                         
              return { contents: code, loader: 'js' };
            });
          }
        }
      ]
    },
  },
  // 开发服务器配置
  server: {
    // 启用 gzip 压缩
    compress: true,
    // 设置端口为3000
    port: 3000,
    // 自动打开浏览器，直接打开landing.html
    open: '/landing.html',
    // 优化热更新
    hmr: {
      timeout: 3000,
      overlay: true,
      // 确保HMR连接正常，允许Trae IDE自动刷新
      clientPort: 3000,
      // 强制使用WebSocket连接，确保IDE能正确接收更新
      protocol: 'ws',
      // 禁用客户端自动重连，让IDE处理连接
      reconnect: true,
      // 启用完整重载作为后备选项
      fullReload: true,
    },
    // 添加开发服务器代理配置
    proxy: {
      '/api/auth': {
        target: LOCAL_API_TARGET,
        changeOrigin: true
      },
      '/api/friends': {
        target: LOCAL_API_TARGET,
        changeOrigin: true
      },
      '/api/messages': {
        target: LOCAL_API_TARGET,
        changeOrigin: true
      },
      '/api/doubao': {
        target: LOCAL_API_TARGET,
        changeOrigin: true,
        configure: (proxy, options) => {
          // 允许所有响应头通过
          options.onProxyRes = (proxyRes, req, res) => {
            // 确保响应头被正确设置，特别是对于图片请求
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
          };
        },
      },
      '/api/health': {
        target: LOCAL_API_TARGET,
        changeOrigin: true
      },
      '/api/chat': {
        target: LOCAL_API_TARGET,
        changeOrigin: true
      },
      '/api/kimi': {
        target: LOCAL_API_TARGET,
        changeOrigin: true
      },
      '/api/deepseek': {
        target: LOCAL_API_TARGET,
        changeOrigin: true
      },
      '/api/qwen': {
        target: LOCAL_API_TARGET,
        changeOrigin: true
      },
      '/api/dashscope': {
        target: LOCAL_API_TARGET,
        changeOrigin: true
      },
      '/api/openai': {
        target: LOCAL_API_TARGET,
        changeOrigin: true
      },
      '/api/gemini': {
        target: LOCAL_API_TARGET,
        changeOrigin: true
      },
      '/api/zhipu': {
        target: LOCAL_API_TARGET,
        changeOrigin: true
      },
      '/api/anthropic': {
        target: LOCAL_API_TARGET,
        changeOrigin: true
      },
      '/api/proxy/trae-api': {
        target: 'https://trae-api-sg.mchost.guru',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/proxy\/trae-api/, ''),
        configure: (proxy, options) => {
          // 允许所有响应头通过
          options.onProxyRes = (proxyRes, req, res) => {
            // 确保响应头被正确设置，特别是对于图片请求
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
          };
        },
      },
      '/api/proxy/unsplash': {
        target: 'https://images.unsplash.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/proxy\/unsplash/, ''),
        configure: (proxy, options) => {
          // 允许所有响应头通过
          options.onProxyRes = (proxyRes, req, res) => {
            // 确保响应头被正确设置，特别是对于图片请求
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
          };
        },
      },
      // WebSocket代理配置
      '/ws': {
        target: LOCAL_API_TARGET.replace('http://', 'ws://'),
        changeOrigin: true,
        ws: true
      },
    },
  },
  // 预览服务器配置
  preview: {
    // 启用 gzip 压缩
    compress: true,
    // 设置端口为3000
    port: 3000,
    // 添加预览服务器代理配置
    proxy: {
      '/api/auth': {
        target: LOCAL_API_TARGET,
        changeOrigin: true
      },
      '/api/friends': {
        target: LOCAL_API_TARGET,
        changeOrigin: true
      },
      '/api/messages': {
        target: LOCAL_API_TARGET,
        changeOrigin: true
      },
      '/api/doubao': {
        target: LOCAL_API_TARGET,
        changeOrigin: true
      },
      '/api/health': {
        target: LOCAL_API_TARGET,
        changeOrigin: true
      },
      '/api/chat': {
        target: LOCAL_API_TARGET,
        changeOrigin: true
      },
      '/api/kimi': {
        target: LOCAL_API_TARGET,
        changeOrigin: true
      },
      '/api/deepseek': {
        target: LOCAL_API_TARGET,
        changeOrigin: true
      },
      '/api/qwen': {
        target: LOCAL_API_TARGET,
        changeOrigin: true
      },
      '/api/dashscope': {
        target: LOCAL_API_TARGET,
        changeOrigin: true
      },
      '/api/openai': {
        target: LOCAL_API_TARGET,
        changeOrigin: true
      },
      '/api/gemini': {
        target: LOCAL_API_TARGET,
        changeOrigin: true
      },
      '/api/zhipu': {
        target: LOCAL_API_TARGET,
        changeOrigin: true
      },
      '/api/anthropic': {
        target: LOCAL_API_TARGET,
        changeOrigin: true
      },
      '/api/proxy/trae-api': {
        target: 'https://trae-api-sg.mchost.guru',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/proxy\/trae-api/, ''),
        configure: (proxy, options) => {
          // 允许所有响应头通过
          options.onProxyRes = (proxyRes, req, res) => {
            // 确保响应头被正确设置，特别是对于图片请求
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
          };
        },
      },
      '/api/proxy/unsplash': {
        target: 'https://images.unsplash.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/proxy\/unsplash/, ''),
        configure: (proxy, options) => {
          // 允许所有响应头通过
          options.onProxyRes = (proxyRes, req, res) => {
            // 确保响应头被正确设置，特别是对于图片请求
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
          };
        },
      },
      // WebSocket代理配置
      '/ws': {
        target: LOCAL_API_TARGET.replace('http://', 'ws://'),
        changeOrigin: true,
        ws: true
      },
    },
    // 确保预览服务器也使用相同的resolve配置
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        'better-sqlite3': '@/utils/databaseStub',
        'mongodb': '@/utils/databaseStub',
        'pg': '@/utils/databaseStub',
        '@neondatabase/serverless': '@/utils/databaseStub',
        'ws': '@/utils/databaseStub',
        'react-reconciler/constants': 'react-reconciler/constants.js',
        scheduler: require.resolve('scheduler')
      }
    }
  },
});
