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
  const ERROR_DEBOUNCE_TIME = 2000; // 2秒内只显示一次错误
  
  // 针对特定错误的特殊防抖时间（例如未授权访问）
  const SPECIAL_ERRORS: Record<string, number> = {
    '未授权访问': 60 * 60 * 1000, // 1小时内只显示一次
    'UNAUTHORIZED': 60 * 60 * 1000,
    'Unauthorized': 60 * 60 * 1000
  };
  
  // 记录特殊错误的最后显示时间
  const specialErrorLastTimes: Record<string, number> = {};
  
  // 更严格的防抖：短时间内只显示一次任何类型的错误
  const shouldShowErrorToast = (message: string): boolean => {
    const now = Date.now();
    
    // 检查是否是特殊错误，并检查其特定的冷却时间
    for (const [key, time] of Object.entries(SPECIAL_ERRORS)) {
      if (message.includes(key)) {
        const lastTime = specialErrorLastTimes[key] || 0;
        if (now - lastTime < time) {
          return false;
        }
        // 如果通过了检查，更新该特殊错误的最后显示时间
        specialErrorLastTimes[key] = now;
        // 同时也更新全局最后错误时间，避免与其他错误重叠
        lastErrorTime = now;
        lastErrorMessage = message;
        return true;
      }
    }
    
    // 检查是否是相同的错误，并且时间间隔小于防抖时间
    if (message === lastErrorMessage && now - lastErrorTime < ERROR_DEBOUNCE_TIME) {
      return false;
    }
    
    // 检查是否在普通防抖时间内，无论错误类型（避免瞬间多个弹窗堆叠）
    if (now - lastErrorTime < 500) {
      return false;
    }
    
    // 更新错误信息和时间
    lastErrorMessage = message;
    lastErrorTime = now;
    return true;
  };
  
  apiClient.middleware.register({
    name: 'DataConsistencyCheck',
    process: async (context, next) => {
      // Add user identity token to request if available
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) {
        context.headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await next();
      
      // Consistency Check: Verify response metadata if available
      // Note: This relies on backend sending these headers.
      // If backend is not set up to send them, this is a client-side preparation.
      
      // const responseUserId = response.headers?.get('x-user-id');
      // const currentUserId = ... get from store ...
      // if (responseUserId && responseUserId !== currentUserId) {
      //   console.error('Data consistency violation: User ID mismatch');
      //   // Handle violation (e.g. logout, alert)
      // }
      
      return response;
    }
  });

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
