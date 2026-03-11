import { useContext, ReactNode, memo } from 'react';
import { AuthContext } from '@/contexts/authContext';
import { Navigate, useLocation } from 'react-router-dom';
import PrivateRoute, { savePreLoginPath } from './PrivateRoute';

interface DesignPlatformGuardProps {
  children: ReactNode;
  requiredMembership?: 'free' | 'premium' | 'vip';
  requiredFeature?: string;
  fallback?: ReactNode;
}

/**
 * 设计平台专用守卫组件
 * 
 * 功能：
 * 1. 验证用户是否登录
 * 2. 验证用户会员等级是否满足要求
 * 3. 验证用户是否有特定功能权限
 * 4. 提供友好的未授权提示
 */
const DesignPlatformGuard = memo(({
  children,
  requiredMembership = 'free',
  requiredFeature,
  fallback
}: DesignPlatformGuardProps) => {
  const { isAuthenticated, isLoading, user } = useContext(AuthContext);
  const location = useLocation();

  // 如果正在加载，显示加载状态
  if (isLoading) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="flex flex-col items-center gap-6 p-8 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-xl">
          {/* 品牌Logo加载动画 */}
          <div className="relative">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 animate-pulse"></div>
            <div className="absolute -inset-2 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 rounded-xl opacity-30 animate-spin-slow blur-sm"></div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-lg font-medium text-gray-700 dark:text-gray-200">正在进入创作空间...</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">请稍候，正在验证您的创作权限</p>
          </div>
          {/* 进度条 */}
          <div className="w-48 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 to-pink-600 animate-pulse rounded-full" style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // 检查认证状态
  if (!isAuthenticated) {
    // 保存当前路径，以便登录后重定向回来
    const currentPath = location.pathname + location.search;
    if (currentPath !== '/login') {
      savePreLoginPath(currentPath);
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 检查用户是否为新用户且需要完善信息
  if (user && user.isNewUser && location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />;
  }

  // 检查会员等级要求
  if (requiredMembership && user) {
    const levels = { free: 0, premium: 1, vip: 2 };
    const userLevel = levels[user.membershipLevel as keyof typeof levels] || 0;
    const requiredLevel = levels[requiredMembership];
    
    if (userLevel < requiredLevel) {
      // 会员等级不足，重定向到会员页面
      return (
        <Navigate 
          to="/membership" 
          state={{ 
            from: location,
            message: `此创作功能需要${requiredMembership === 'vip' ? 'VIP' : requiredMembership === 'premium' ? '高级' : ''}会员才能使用`,
            requiredLevel: requiredMembership
          }} 
          replace 
        />
      );
    }
  }

  // 检查特定功能权限（如果有的话）
  if (requiredFeature && user) {
    // 这里可以添加更细粒度的功能权限检查
    // 例如：检查用户是否有特定的功能权限标志
    const hasFeature = user.metadata?.features?.[requiredFeature] ?? false;
    if (!hasFeature && user.membershipLevel === 'free') {
      return (
        <Navigate
          to="/membership"
          state={{
            from: location,
            message: '此功能需要升级会员才能使用',
            feature: requiredFeature
          }}
          replace
        />
      );
    }
  }

  // 所有检查通过，渲染内容
  return <>{children}</>;
});

DesignPlatformGuard.displayName = 'DesignPlatformGuard';

export default DesignPlatformGuard;

/**
 * 设计平台路由配置帮助函数
 * 用于快速创建受保护的设计平台路由
 */
export const createDesignPlatformRoute = (
  element: ReactNode,
  options?: {
    requiredMembership?: 'free' | 'premium' | 'vip';
    requiredFeature?: string;
    fallback?: ReactNode;
  }
) => {
  return (
    <DesignPlatformGuard {...options}>
      {element}
    </DesignPlatformGuard>
  );
};
