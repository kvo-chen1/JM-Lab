// 移除控制台日志增强代码，减少可能的错误

// 移除全局three.js引入，改为在需要的组件中按需引入

// 尝试注销所有 Service Workers 以解决缓存冲突问题
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      console.log('Unregistering service worker:', registration);
      registration.unregister();
    }
  }).catch(err => console.error('Service Worker cleanup failed:', err));
}

// 导入国际化配置
import './i18n/i18n';
import { setupApi } from './lib/setupApi';

// Initialize API middleware
setupApi();

import { StrictMode } from "react";
import "./styles/tianjin.css";
import "./styles/neo.css";
import * as ReactDOMClient from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from 'sonner';
import App from "./App.tsx";
import { AuthProvider } from './contexts/authContext.tsx';
import { WorkflowProvider } from './contexts/workflowContext.tsx';
import { FriendProvider } from './contexts/friendContext.tsx';
import { LanguageProvider } from './contexts/LanguageContext';
import { ChatProvider } from './contexts/chatContext.tsx';
import "./index.css";
// 恢复全局Font Awesome CSS，解决图标不显示问题
import '@fortawesome/fontawesome-free/css/all.min.css';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './hooks/useTheme';

// 简化的全局对象初始化
// 使用类型断言来避免TypeScript错误
if (typeof window !== 'undefined') {
  (window as any).knowledge = (window as any).knowledge || {};
  (window as any).lazilyLoaded = (window as any).lazilyLoaded || {};
}

// 应用渲染
const root = document.getElementById("root");
if (root) {
  // 安全获取createRoot
  const createRoot = ReactDOMClient.createRoot || (ReactDOMClient as any).default?.createRoot;
  
  if (createRoot) {
    // 使用createRoot直接渲染，不进行hydration
    createRoot(root).render(
      <ErrorBoundary>
        <LanguageProvider>
          <ThemeProvider>
            <BrowserRouter>
                <AuthProvider>
                  <FriendProvider>
                    <ChatProvider>
                      <WorkflowProvider>
                        <App />
                      </WorkflowProvider>
                    </ChatProvider>
                  </FriendProvider>
                </AuthProvider>
              </BrowserRouter>
          </ThemeProvider>
        </LanguageProvider>
      </ErrorBoundary>
    );
  } else {
    console.error('Failed to resolve createRoot from react-dom/client', ReactDOMClient);
    root.innerHTML = '<div style="padding: 20px; color: red;">System Error: Failed to initialize React. Please refresh.</div>';
  }
} else {
  // 如果找不到root元素，说明当前页面是landing.html或其他静态页面
  // 不进行React渲染，避免控制台错误
  console.log('Root element not found, React app will not render. This is expected on static pages like landing.html.');
}
