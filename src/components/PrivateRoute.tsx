import { useContext, ReactNode, memo, useEffect } from 'react'
import { AuthContext } from '@/contexts/authContext'
import { Navigate, useLocation } from 'react-router-dom'
import { usePersistentAuth } from '@/hooks/usePersistentAuth'

interface PrivateRouteProps {
  component?: React.ComponentType;
  children?: ReactNode;
  fallback?: ReactNode;
  requiredMembership?: 'free' | 'premium' | 'vip';
}

// 保存登录前访问路径到 sessionStorage
export const savePreLoginPath = (path: string) => {
  try {
    sessionStorage.setItem('preLoginPath', path);
  } catch {
    // 忽略存储错误
  }
};

// 获取登录前访问路径
export const getPreLoginPath = (): string | null => {
  try {
    return sessionStorage.getItem('preLoginPath');
  } catch {
    return null;
  }
};

// 清除登录前访问路径
export const clearPreLoginPath = () => {
  try {
    sessionStorage.removeItem('preLoginPath');
  } catch {
    // 忽略错误
  }
};

// 检查会员等级是否满足要求
const checkMembershipLevel = (
  userLevel: string,
  requiredLevel: 'free' | 'premium' | 'vip'
): boolean => {
  const levels = { free: 0, premium: 1, vip: 2 };
  return levels[userLevel as keyof typeof levels] >= levels[requiredLevel];
};

// 使用memo优化，避免不必要的重新渲染
const PrivateRoute = memo(({ 
  component: Component, 
  children, 
  fallback,
  requiredMembership 
}: PrivateRouteProps) => {
  const { isAuthenticated, isLoading, user } = useContext(AuthContext);
  const location = useLocation();
  const { saveAuthState } = usePersistentAuth({
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
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="flex flex-col items-center gap-6 p-8 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-xl">
          {/* 品牌Logo加载动画 */}
          <div className="relative">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 animate-pulse"></div>
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-xl opacity-30 animate-spin-slow blur-sm"></div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-lg font-medium text-gray-700 dark:text-gray-200">正在验证身份...</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">请稍候，正在检查您的登录状态</p>
          </div>
          {/* 进度条 */}
          <div className="w-48 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse rounded-full" style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // 检查认证状态
  if (isAuthenticated === false || isAuthenticated === undefined) {
    // 保存当前路径，以便登录后重定向回来
    const currentPath = location.pathname + location.search;
    if (currentPath !== '/login') {
      savePreLoginPath(currentPath);
    }
    
    if (isDevelopment) {
      console.log('[PrivateRoute] 未登录，保存路径:', currentPath);
    }
    
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 检查用户是否为新用户且需要完善信息
  if (user && user.isNewUser && location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />;
  }

  // 检查会员等级要求
  if (requiredMembership && user) {
    const hasRequiredLevel = checkMembershipLevel(user.membershipLevel, requiredMembership);
    if (!hasRequiredLevel) {
      // 会员等级不足，重定向到会员页面
      return <Navigate to="/membership" state={{ 
        from: location,
        message: `此功能需要${requiredMembership === 'vip' ? 'VIP' : '高级'}会员才能使用`
      }} replace />;
    }
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
