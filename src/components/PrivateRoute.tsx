import { useContext, ReactNode, memo, useEffect } from 'react'
import { AuthContext } from '@/contexts/authContext'
import { Navigate, useLocation } from 'react-router-dom'
import { usePersistentAuth } from '@/hooks/usePersistentAuth'

interface PrivateRouteProps {
  component?: React.ComponentType;
  children?: ReactNode;
}

// 使用memo优化，避免不必要的重新渲染
const PrivateRoute = memo(({ component: Component, children }: PrivateRouteProps) => {
  const { isAuthenticated, isLoading, user } = useContext(AuthContext);
  const location = useLocation();
  const { saveAuthState, getLastPath } = usePersistentAuth({
    storageKeyPrefix: 'app',
    persistAuth: true,
  });

  // 检查是否为开发环境
  const isDevelopment = import.meta.env.DEV;

  // 保存认证状态到 sessionStorage（用于页面刷新后恢复）
  useEffect(() => {
    if (isAuthenticated && user) {
      saveAuthState(true, user.id);
    }
  }, [isAuthenticated, user, saveAuthState]);

  // 如果正在加载认证状态，显示加载指示器
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-lg text-gray-600 dark:text-gray-400">正在检查认证状态...</p>
        </div>
      </div>
    );
  }

  // 开发环境和生产环境统一处理认证逻辑，确保安全
  // 检查认证状态
  if (isAuthenticated === false || isAuthenticated === undefined) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 检查用户是否为新用户且需要完善信息
  if (user && user.isNewUser && location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />;
  }

  // 开发环境日志记录（仅用于调试，不影响逻辑）
  if (isDevelopment) {
    console.log('[PrivateRoute] User authenticated:', user?.username);
  }

  // 认证通过，渲染内容
  // 如果有children，直接返回children，用于支持懒加载组件
  if (children) {
    return <>{children}</>;
  }

  // 如果提供了component，则渲染该组件
  if (Component) {
    return <Component />;
  }

  return null;
});

// 添加显示名称，便于调试
PrivateRoute.displayName = 'PrivateRoute';

export default PrivateRoute;
