import { useContext, ReactNode, memo, useState, useEffect } from 'react'
import { AuthContext } from '@/contexts/authContext'
import { Navigate, useLocation } from 'react-router-dom'

interface AdminRouteProps {
  component?: React.ComponentType;
  children?: ReactNode;
}

// 使用memo优化，避免不必要的重新渲染
// 注意：实际的权限验证在 Admin.tsx 页面中通过密码进行
const AdminRoute = memo(({ component: Component, children }: AdminRouteProps) => {
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
