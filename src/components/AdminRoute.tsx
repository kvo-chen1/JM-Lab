import { useContext, ReactNode, memo } from 'react'
import { AuthContext } from '@/contexts/authContext'
import { Navigate, useLocation } from 'react-router-dom'

interface AdminRouteProps {
  component?: React.ComponentType;
  children?: ReactNode;
}

// 使用memo优化，避免不必要的重新渲染
const AdminRoute = memo(({ component: Component, children }: AdminRouteProps) => {
  const { isAuthenticated, isLoading, user } = useContext(AuthContext);
  const location = useLocation();

  // 检查是否为开发环境
  const isDevelopment = import.meta.env.DEV;

  // 如果正在加载认证状态，显示加载指示器
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-lg text-gray-600 dark:text-gray-400">正在检查认证状态...</p>
        </div>
      </div>
    );
  }

  // 检查认证状态 - 未登录则重定向到登录页
  if (isAuthenticated === false || isAuthenticated === undefined) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 开发环境日志记录（仅用于调试，不影响逻辑）
  if (isDevelopment) {
    console.log('[AdminRoute] User authenticated:', user?.username);
  }

  // 认证通过，渲染内容
  if (children) {
    return <>{children}</>;
  }

  if (Component) {
    return <Component />;
  }

  return null;
});

// 添加显示名称，便于调试
AdminRoute.displayName = 'AdminRoute';

export default AdminRoute;
