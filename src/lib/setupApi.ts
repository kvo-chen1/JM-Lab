import { toast } from 'sonner';
import apiClient from './apiClient';

/**
 * Configure global API middleware
 * - Error handling with Toast notifications
 * - Auth token injection (if needed in future)
 */
export function setupApi() {
  apiClient.middleware.register({
    name: 'GlobalErrorHandling',
    process: async (context, next) => {
      try {
        const response = await next();
        
        // Handle business logic errors (200 OK but data.error exists)
        if (!response.ok && response.status !== 401) {
           // 401 is usually handled by AuthContext redirecting to login, so we might skip toast or show a "Session Expired"
           // For now, let's show toast for everything except maybe 404 if it's not critical
           const errorMessage = response.error || 'Unknown error occurred';
           toast.error(errorMessage);
        }
        
        return response;
      } catch (error) {
        // Network errors or unhandled exceptions
        const msg = error instanceof Error ? error.message : 'Network error';
        console.error('Global API Error:', error);
        toast.error(`Request failed: ${msg}`);
        throw error;
      }
    }
  });
  
  console.log('Global API middleware registered');
}
