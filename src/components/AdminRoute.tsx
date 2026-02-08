import { useContext, ReactNode, memo, useState, useEffect } from 'react'
import { AuthContext } from '@/contexts/authContext'
import { Navigate, useLocation } from 'react-router-dom'

interface AdminRouteProps {
  component?: React.ComponentType;
  children?: ReactNode;
}

// 开发模式：设置为 true 可以绕过管理员检查（仅用于开发测试）
const DEV_MODE = true;

// 使用memo优化，避免不必要的重新渲染
const AdminRoute = memo(({ component: Component, children }: AdminRouteProps) => {
  const { isAuthenticated, isLoading: authLoading, user } = useContext(AuthContext);
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user?.id) {
        setIsChecking(false);
        return;
      }

      // 开发模式：自动设置为管理员
      if (DEV_MODE) {
        console.log('[AdminRoute] 开发模式：自动授予管理员权限');
        setIsAdmin(true);
        setIsChecking(false);
        return;
      }

      try {
        // 优先使用 user 对象中的 isAdmin 字段
        if (user.isAdmin) {
          setIsAdmin(true);
          setIsChecking(false);
          return;
        }

        // 如果 user 对象中没有 isAdmin，则查询数据库
        const response = await fetch('/api/user/admin-status', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data.data?.isAdmin || false);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('检查管理员状态失败:', error);
        setIsAdmin(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  const isLoading = authLoading || isChecking;

  // 如果正在加载认证状态，显示加载指示器
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-lg text-gray-600 dark:text-gray-400">正在检查管理员权限...</p>
        </div>
      </div>
    );
  }

  // 检查认证状态：未认证或认证状态未知时重定向到登录页
  if (isAuthenticated === false || isAuthenticated === undefined) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 检查管理员权限：已认证但不是管理员时重定向到首页
  if (!isAdmin) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

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
AdminRoute.displayName = 'AdminRoute';

export default AdminRoute;
