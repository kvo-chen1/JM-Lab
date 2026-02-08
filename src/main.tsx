// 优先加载 React 核心模块
import { StrictMode } from "react";
import * as ReactDOMClient from "react-dom/client";

// 加载关键样式文件（首屏必需）
import "./index.css";

// 延迟加载非关键样式，避免阻塞渲染
const loadNonCriticalStyles = () => {
  // 使用 requestIdleCallback 在浏览器空闲时加载非关键CSS
  const loadStyles = () => {
    // 动态导入非关键样式
    import('./styles/tianjin.css').catch(err => console.warn('Failed to load tianjin.css:', err));
    import('./styles/neo.css').catch(err => console.warn('Failed to load neo.css:', err));
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(loadStyles, { timeout: 2000 });
  } else {
    setTimeout(loadStyles, 1000);
  }
};

// 加载路由和核心组件
import { BrowserRouter } from "react-router-dom";
import { Toaster } from 'sonner';
import App from "./App.tsx";

// 加载上下文提供者
import { AuthProvider } from './contexts/authContext.tsx';
import { WorkflowProvider } from './contexts/workflowContext.tsx';
import { FriendProvider } from './contexts/friendContext.tsx';
import { LanguageProvider } from './contexts/LanguageContext.tsx';
import { ChatProvider } from './contexts/chatContext.tsx';
import { ThemeProvider } from './hooks/useTheme';

// 加载错误边界
import ErrorBoundary from './components/ErrorBoundary';

// 动态加载Font Awesome CSS，避免阻塞初始渲染
import('@fortawesome/fontawesome-free/css/all.min.css').catch(err => console.error('Failed to load Font Awesome CSS:', err));

// 加载工具模块
import { setupApi } from './lib/setupApi';
import { initPerformanceMonitor } from './utils/performanceMonitor';

// 导入 supabase 以暴露到 window 对象（用于调试）
import './lib/supabase';

// 简化的全局对象初始化
// 使用类型断言来避免TypeScript错误
if (typeof window !== 'undefined') {
  (window as any).knowledge = (window as any).knowledge || {};
  (window as any).lazilyLoaded = (window as any).lazilyLoaded || {};
}

import { registerSW } from 'virtual:pwa-register';

// 注册 Service Worker - 延迟执行以避免阻塞初始渲染
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  // 使用 requestIdleCallback 或 setTimeout 延迟注册
  const registerServiceWorker = () => {
    const updateSW = registerSW({
      onNeedRefresh() {
        // 当有新内容时提示用户
        if (confirm('新版本可用，是否刷新？')) {
          updateSW(true);
        }
      },
      onOfflineReady() {
        console.log('App ready to work offline');
      },
    });
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(registerServiceWorker, { timeout: 5000 });
  } else {
    setTimeout(registerServiceWorker, 3000);
  }
}

// 延迟初始化非关键模块
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    setupApi();
    initPerformanceMonitor();
    loadNonCriticalStyles(); // 加载非关键样式
  }, { timeout: 3000 });
} else {
  setTimeout(() => {
    setupApi();
    initPerformanceMonitor();
    loadNonCriticalStyles(); // 加载非关键样式
  }, 2000);
}

// 应用渲染
const root = document.getElementById("root");
if (root) {
  try {
    // 使用直接的方式渲染应用
    ReactDOMClient.createRoot(root).render(
      <StrictMode>
        <LanguageProvider>
          <ThemeProvider>
            <AuthProvider>
              <BrowserRouter>
                <FriendProvider>
                  <ChatProvider>
                    <WorkflowProvider>
                      <ErrorBoundary>
                        <App />
                      </ErrorBoundary>
                    </WorkflowProvider>
                  </ChatProvider>
                </FriendProvider>
              </BrowserRouter>
            </AuthProvider>
          </ThemeProvider>
        </LanguageProvider>
      </StrictMode>
    );
  } catch (error) {
    console.error('Error rendering app:', error);
    root.innerHTML = '<div style="padding: 20px; color: red;">System Error: Failed to initialize React. Please refresh.</div>';
  }
} else {
  // 如果找不到root元素，说明当前页面是landing.html或其他静态页面
  // 不进行React渲染，避免控制台错误
  console.log('Root element not found, React app will not render. This is expected on static pages like landing.html.');
}
