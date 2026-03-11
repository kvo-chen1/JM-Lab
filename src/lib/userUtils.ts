/**
 * 用户工具函数
 * 提供获取当前用户信息的辅助函数
 * 优先从 localStorage 获取（与 AuthContext 保持一致）
 */

export interface CurrentUser {
  id: string;
  email?: string;
  username?: string;
  avatar_url?: string;
  avatar?: string;
  [key: string]: any;
}

/**
 * 从 localStorage 获取当前用户
 * 与 AuthContext 保持一致
 */
export const getCurrentUser = (): CurrentUser | null => {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
  } catch {
    // 忽略解析错误
  }
  return null;
};

/**
 * 获取当前用户ID
 */
export const getCurrentUserId = (): string | null => {
  const user = getCurrentUser();
  return user?.id || null;
};

/**
 * 检查用户是否已登录
 */
export const isUserLoggedIn = (): boolean => {
  const user = getCurrentUser();
  return !!user?.id;
};

/**
 * 获取当前用户的认证令牌
 */
export const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
};
