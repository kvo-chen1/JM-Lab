import { toast } from 'sonner';
import apiClient from './apiClient';

/**
 * Configure global API middleware
 * - Error handling with Toast notifications
 * - Auth token injection (if needed in future)
 */
export function setupApi() {
  // 全局错误提示防抖：记录最近显示的错误类型和时间
  let lastErrorTime = 0;
  let lastErrorMessage = '';
  const ERROR_DEBOUNCE_TIME = 5000; // 5秒内只显示一次错误
  
  // 更严格的防抖：短时间内只显示一次任何类型的错误
  const shouldShowErrorToast = (message: string): boolean => {
    const now = Date.now();
    
    // 检查是否是相同的错误，并且时间间隔小于防抖时间
    if (message === lastErrorMessage && now - lastErrorTime < ERROR_DEBOUNCE_TIME) {
      return false;
    }
    
    // 检查是否在防抖时间内，无论错误类型
    if (now - lastErrorTime < ERROR_DEBOUNCE_TIME) {
      return false;
    }
    
    // 更新错误信息和时间
    lastErrorMessage = message;
    lastErrorTime = now;
    return true;
  };
  
  apiClient.middleware.register({
    name: 'GlobalErrorHandling',
    process: async (context, next) => {
      try {
        const response = await next();
        
        // Handle business logic errors
        if (!response.ok) {
          // 获取错误信息 - apiClient已经优先处理了message字段，直接使用response.error
          const errorMessage = response.error || 'Unknown error occurred';
          
          // 检查是否需要显示toast
          if (shouldShowErrorToast(errorMessage)) {
            // 显示toast提示
            toast.error(errorMessage);
          }
        }
        
        return response;
      } catch (error) {
        // Network errors or unhandled exceptions
        const msg = error instanceof Error ? error.message : 'Network error';
        const errorMessage = `Request failed: ${msg}`;
        console.error('Global API Error:', error);
        
        // 检查是否需要显示toast
        if (shouldShowErrorToast(errorMessage)) {
          // 显示toast提示
          toast.error(errorMessage);
        }
        
        throw error;
      }
    }
  });
  
  console.log('Global API middleware registered');
}
