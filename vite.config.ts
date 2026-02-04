import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'
import viteCompression from 'vite-plugin-compression'
import path from 'path'
// import { createRequire } from 'node:module'
// const require = createRequire(import.meta.url)
const LOCAL_API_PORT = process.env.LOCAL_API_PORT || '3022'
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
        quality: 75,
        compressionLevel: 9,
        force: true
      },
      jpeg: {
        quality: 75,
        force: true
      },
      webp: {
        quality: 80,
        force: true
      },
      avif: {
        quality: 70,
        force: true
      },
      // 启用响应式图片生成以提升不同设备上的加载性能
      generateResponsiveImages: true,
      // 响应式图片尺寸配置
      responsive: {
        adapter: {
          name: 'sharp',
          options: {
            sizes: [320, 640, 1024, 1600],
            format: ['webp', 'avif'],
            quality: [80, 70]
          }
        }
      },
      svg: {
        quality: 80,
        force: true
      },
      gif: {
        quality: 80,
        force: true
      },
      // 仅在构建时优化
      disable: process.env.NODE_ENV === 'development',
      // 优化所有目录下的图片
      include: /\.(png|jpe?g|gif|svg|webp|avif)$/i,
      // 排除node_modules目录和有问题的图片
      exclude: [/node_modules/, /placeholder-image\.jpg$/]
    }),
    VitePWA({
      injectRegister: false,
      selfDestroying: true,
      registerType: 'autoUpdate',
      // Explicitly include static assets from public folder
      includeAssets: ['robots.txt'],
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
        scope: '/'
      },
      workbox: {
        // 简化workbox配置
        maximumFileSizeToCacheInBytes: 8000000,
        globPatterns: ['**/*.{js,css,html}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        globIgnores: ['**/*.map', '**/node_modules/**']
      }
    }),
    // 启用 Gzip 压缩
    viteCompression({
      verbose: true,
      disable: process.env.NODE_ENV === 'development',
      threshold: 10240,
      algorithm: 'gzip',
      ext: '.gz',
    }),
    // 启用 Brotli 压缩
    viteCompression({
      verbose: true,
      disable: process.env.NODE_ENV === 'development',
      threshold: 10240,
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
  ],
  resolve: {
    // 为数据库相关的 Node.js 原生模块创建别名，避免在浏览器环境中打包
    alias: {
      '@': path.resolve(__dirname, './src'),
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      'better-sqlite3': '@/utils/databaseStub',
      'mongodb': '@/utils/databaseStub',
      'pg': '@/utils/databaseStub',
      '@neondatabase/serverless': '@/utils/databaseStub',
      'ws': '@/utils/databaseStub',
    }
  },

  build: {
    // 优化构建输出
    minify: 'esbuild', // 使用esbuild替代terser加快构建速度
    // 启用更高级的esbuild压缩选项
    esbuild: {
      minify: true,
      minifyIdentifiers: true,
      minifySyntax: true,
      minifyWhitespace: true,
      // 移除console.log和debugger
      drop: ['console', 'debugger'],
    },
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
    // 启用模块预加载
    modulePreload: {
      polyfill: false,
      resolveDependencies: (filename, deps, context) => {
        // 优化模块预加载策略
        return deps.filter(dep => {
          // 只预加载关键依赖
          return !dep.includes('node_modules') || dep.includes('react') || dep.includes('react-dom')
        })
      }
    },
    // 启用动态导入支持
    dynamicImportVars: true,
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
        main: path.resolve(__dirname, 'index.html'),
        landing: path.resolve(__dirname, 'landing.html'),
      },
      output: {
        // 优化资产输出
        assetFileNames: 'assets/[name]-[hash:8][extname]',
        chunkFileNames: 'chunks/[name]-[hash:8].js',
        entryFileNames: 'entries/[name]-[hash:8].js',
        // 启用动态导入支持
        dynamicImportInCjs: true,
        // 优化chunk分割策略 - 启用代码分割以提升加载性能
        manualChunks: {
          // 将核心React库分离到单独的chunk中
          'react-core': ['react', 'react-dom', 'react-router-dom'],
          // 将状态管理库分离到单独的chunk中
          'state-management': ['zustand'],
          // 将UI库分离到单独的chunk中
          'ui-libraries': ['@headlessui/react', 'lucide-react'],
          // 将动画库分离到单独的chunk中
          'animation': ['framer-motion'],
          // 将图表库分离到单独的chunk中
          'charts': ['recharts'],
          // 将国际化库分离到单独的chunk中
          'i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
          // 将工具库分离到单独的chunk中
          'utils': ['clsx', 'zod', 'date-fns', 'dayjs'],
          // 将样式库分离到单独的chunk中
          'style': ['tailwind-merge'],
          // 将Supabase相关库分离到单独的chunk中
          'supabase': ['@supabase/supabase-js'],
        },
      },
      // 优化插件配置
      plugins: [

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
  define: {
    'process.env': {}
  },
  // 优化开发体验和构建速度
  optimizeDeps: {
    // 预构建依赖 - 包含所有可能需要转换的依赖
    include: [
      'react', 'react-dom', 'react-router-dom',
      'clsx', 'tailwind-merge',
      'framer-motion',
      'zustand',
      'i18next', 'react-i18next',
      '@headlessui/react',
      'zod',
      'date-fns', 'dayjs',
      'lucide-react',
      'react-virtuoso', 'react-window',
      '@supabase/supabase-js',
      '@fortawesome/fontawesome-free',
      '@tinymce/tinymce-react',
      '@amap/amap-jsapi-loader',
      'recharts',
      'react-markdown',
      'workbox-window'
    ],
    // 禁用预构建的依赖，包括数据库依赖和服务器端依赖
    exclude: [
      'better-sqlite3', 'mongodb', 'pg', '@neondatabase/serverless',
      '@alicloud/dysmsapi20170525', '@alicloud/tea-typescript', '@alicloud/tea-util',
      'tencentcloud-sdk-nodejs-sms', 'twilio',
      'node-fetch', 'nodemailer', 'jsonwebtoken', 'bcryptjs', 'ws'
    ],
    // 优化依赖构建
    esbuildOptions: {
      target: 'es2022',
      format: 'esm', // 强制使用ES模块格式
      treeShaking: true,
      pure: process.env.NODE_ENV === 'production' ? ['console.log', 'console.warn', 'console.error'] : [],
      minify: process.env.NODE_ENV === 'production',
      minifySyntax: process.env.NODE_ENV === 'production',
      minifyIdentifiers: process.env.NODE_ENV === 'production',
      minifyWhitespace: process.env.NODE_ENV === 'production',
    },
  },
  // 开发服务器配置
  server: {
    // 启用 gzip 压缩
    compress: true,
    // 设置端口为3005，避开常用端口缓存
    port: 3005,
    // 自动打开浏览器，直接打开landing.html
    open: '/landing.html',
    // 优化热更新
    hmr: {
      timeout: 3000,
      overlay: true,
      // 强制使用WebSocket连接，确保IDE能正确接收更新
      protocol: 'ws',
      // 启用客户端自动重连
      reconnect: true,
      // 启用完整重载作为后备选项
      fullReload: true,
    },
    // 安全头部配置
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      // Content-Security-Policy 防止XSS和数据注入攻击
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' data: blob: https:",
        "connect-src 'self' ws: wss: http: https:",
        "media-src 'self' blob:",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'"
      ].join('; '),
      // Strict-Transport-Security 强制HTTPS
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    },
    // 开发服务器代理配置 - 统一的API代理设置
    proxy: {
      // 统一API代理 - 所有 /api/* 请求转发到本地API服务器
      '/api': {
        target: LOCAL_API_TARGET,
        changeOrigin: true,
        timeout: 30000, // 30秒超时
        proxyTimeout: 30000,
        configure: (proxy, options) => {
          // 代理请求错误处理
          proxy.on('error', (err, req, res) => {
            console.error('[Proxy Error]', err.message, req.url);
            if (!res.headersSent) {
              res.writeHead(502, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: 'Proxy Error',
                message: '无法连接到API服务器',
                timestamp: new Date().toISOString()
              }));
            }
          });
          // 代理请求日志
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(`[Proxy] ${req.method} ${req.url} -> ${LOCAL_API_TARGET}${req.url}`);
          });
        },
      },
      // 外部API代理配置
      '/api/proxy/trae-api': {
        target: 'https://trae-api-sg.mchost.guru',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/proxy\/trae-api/, ''),
        configure: (proxy, options) => {
          options.onProxyRes = (proxyRes, req, res) => {
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
          };
        },
      },
      '/api/proxy/unsplash': {
        target: 'https://images.unsplash.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/proxy\/unsplash/, ''),
        configure: (proxy, options) => {
          options.onProxyRes = (proxyRes, req, res) => {
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
          };
        },
      },
      // WebSocket代理配置 - 暂时禁用，避免连接失败错误
      // '/ws': {
      //   target: LOCAL_API_TARGET.replace('http://', 'ws://'),
      //   changeOrigin: true,
      //   ws: true
      // },
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
      '/api/users': {
        target: LOCAL_API_TARGET,
        changeOrigin: true
      },
      '/api/auth': {
        target: LOCAL_API_TARGET,
        changeOrigin: true
      },
      '/api/works': {
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
      '/api/communities': {
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
      // WebSocket代理配置 - 暂时禁用，避免连接失败错误
      // '/ws': {
      //   target: LOCAL_API_TARGET.replace('http://', 'ws://'),
      //   changeOrigin: true,
      //   ws: true
      // },
    },
    // 确保预览服务器也使用相同的resolve配置
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        'react': path.resolve(__dirname, 'node_modules/react'),
        'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
        'better-sqlite3': '@/utils/databaseStub',
        'mongodb': '@/utils/databaseStub',
        'pg': '@/utils/databaseStub',
        '@neondatabase/serverless': '@/utils/databaseStub',
        'ws': '@/utils/databaseStub',
      }
    }
  },
});
