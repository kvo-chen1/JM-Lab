import { useContext, ReactNode, memo } from 'react'
import { AuthContext } from '@/contexts/authContext'
import { Navigate, useLocation } from 'react-router-dom'

interface PrivateRouteProps {
  component?: React.ComponentType;
  children?: ReactNode;
}

// 使用memo优化，避免不必要的重新渲染
const PrivateRoute = memo(({ component: Component, children }: PrivateRouteProps) => {
  const { isAuthenticated, isLoading } = useContext(AuthContext);
  const location = useLocation();
  
  // 如果正在加载认证状态，显示加载指示器
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  // 优化重定向逻辑，使用更明确的状态检查
  if (isAuthenticated === false) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // 如果isAuthenticated为undefined（理论上不会发生，因为isLoading处理了初始状态），返回null
  if (isAuthenticated === undefined) {
    return null;
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
PrivateRoute.displayName = 'PrivateRoute';

export default PrivateRoute;
