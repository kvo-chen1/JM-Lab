import { toast } from 'sonner';
import apiClient from './apiClient';

/**
 * Configure global API middleware
 * - Error handling with Toast notifications
 * - Auth token injection (if needed in future)
 */
export function setupApi() {
  // 错误提示防抖机制：记录最近显示的错误和时间
  const recentErrors = new Map<string, number>();
  const ERROR_DEBOUNCE_TIME = 5000; // 5秒内同一错误只显示一次
  
  apiClient.middleware.register({
    name: 'GlobalErrorHandling',
    process: async (context, next) => {
      try {
        const response = await next();
        
        // Handle business logic errors
        if (!response.ok) {
          // 获取错误信息
          const errorMessage = response.error || 'Unknown error occurred';
          
          // 检查是否需要显示toast
          const now = Date.now();
          const lastShown = recentErrors.get(errorMessage) || 0;
          const shouldShowToast = now - lastShown > ERROR_DEBOUNCE_TIME;
          
          if (shouldShowToast) {
            // 更新最近显示时间
            recentErrors.set(errorMessage, now);
            
            // 显示toast提示
            toast.error(errorMessage);
          }
        }
        
        return response;
      } catch (error) {
        // Network errors or unhandled exceptions
        const msg = error instanceof Error ? error.message : 'Network error';
        console.error('Global API Error:', error);
        
        // 检查是否需要显示toast
        const now = Date.now();
        const errorKey = `network:${msg}`;
        const lastShown = recentErrors.get(errorKey) || 0;
        const shouldShowToast = now - lastShown > ERROR_DEBOUNCE_TIME;
        
        if (shouldShowToast) {
          // 更新最近显示时间
          recentErrors.set(errorKey, now);
          
          // 显示toast提示
          toast.error(`Request failed: ${msg}`);
        }
        
        throw error;
      }
    }
  });
  
  console.log('Global API middleware registered');
}
