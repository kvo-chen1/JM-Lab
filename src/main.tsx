// 优先加载 React 核心模块
import { StrictMode } from "react";
import * as ReactDOMClient from "react-dom/client";

// 立即加载所有主题样式，确保主题切换正常工作
import "./index.css";
import "./styles/themes/index.ts";

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
import { fontOptimizer } from './utils/fontOptimizer';

// 导入 supabase 以暴露到 window 对象（用于调试）
import './lib/supabase';

// 应用渲染
const root = document.getElementById("root");
if (root) {
  try {
    // 使用直接的方式渲染应用
    ReactDOMClient.createRoot(root).render(
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
