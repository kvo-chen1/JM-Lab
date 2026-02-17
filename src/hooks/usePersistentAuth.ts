import { useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// 安全的 storage 操作
const safeStorage = {
  local: {
    getItem: (key: string): string | null => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem: (key: string, value: string) => {
      try {
        localStorage.setItem(key, value);
      } catch {
        // 忽略错误
      }
    },
    removeItem: (key: string) => {
      try {
        localStorage.removeItem(key);
      } catch {
        // 忽略错误
      }
    },
  },
  session: {
    getItem: (key: string): string | null => {
      try {
        return sessionStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem: (key: string, value: string) => {
      try {
        sessionStorage.setItem(key, value);
      } catch {
        // 忽略错误
      }
    },
    removeItem: (key: string) => {
      try {
        sessionStorage.removeItem(key);
      } catch {
        // 忽略错误
      }
    },
  },
};

interface UsePersistentAuthOptions {
  // 存储键名前缀
  storageKeyPrefix?: string;
  // 是否在页面刷新后恢复认证状态
  persistAuth?: boolean;
  // 认证过期时间（毫秒），默认 7 天
  authExpiry?: number;
  // 未登录时的跳转路径
  loginRedirect?: string;
  // 登录后返回的默认路径
  defaultRedirect?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  userId?: string;
  timestamp: number;
  pathname?: string;
}

/**
 * 增强的认证持久化 Hook
 * 用于在页面刷新后保持认证状态和页面位置
 */
export function usePersistentAuth(options: UsePersistentAuthOptions = {}) {
  const {
    storageKeyPrefix = 'app',
    persistAuth = true,
    authExpiry = 7 * 24 * 60 * 60 * 1000, // 7 天
    loginRedirect = '/login',
    defaultRedirect = '/',
  } = options;

  const navigate = useNavigate();
  const location = useLocation();
  const hasRestoredRef = useRef(false);

  const storageKeys = {
    authState: `${storageKeyPrefix}_auth_state`,
    lastPath: `${storageKeyPrefix}_last_path`,
    userData: `${storageKeyPrefix}_user_data`,
  };

  /**
   * 保存当前认证状态
   */
  const saveAuthState = useCallback((isAuthenticated: boolean, userId?: string) => {
    if (!persistAuth) return;

    const state: AuthState = {
      isAuthenticated,
      userId,
      timestamp: Date.now(),
      pathname: location.pathname,
    };

    safeStorage.session.setItem(storageKeys.authState, JSON.stringify(state));
    safeStorage.session.setItem(storageKeys.lastPath, location.pathname);
  }, [location.pathname, persistAuth, storageKeys.authState, storageKeys.lastPath]);

  /**
   * 保存用户数据
   */
  const saveUserData = useCallback((userData: any) => {
    if (!persistAuth) return;
    safeStorage.local.setItem(storageKeys.userData, JSON.stringify(userData));
  }, [persistAuth, storageKeys.userData]);

  /**
   * 获取保存的用户数据
   */
  const getSavedUserData = useCallback(() => {
    const data = safeStorage.local.getItem(storageKeys.userData);
    if (data) {
      try {
        return JSON.parse(data);
      } catch {
        return null;
      }
    }
    return null;
  }, [storageKeys.userData]);

  /**
   * 获取上次访问的路径
   */
  const getLastPath = useCallback(() => {
    return safeStorage.session.getItem(storageKeys.lastPath) || defaultRedirect;
  }, [storageKeys.lastPath, defaultRedirect]);

  /**
   * 检查认证状态是否过期
   */
  const isAuthExpired = useCallback((timestamp: number) => {
    return Date.now() - timestamp > authExpiry;
  }, [authExpiry]);

  /**
   * 清除保存的认证状态
   */
  const clearAuthState = useCallback(() => {
    safeStorage.session.removeItem(storageKeys.authState);
    safeStorage.session.removeItem(storageKeys.lastPath);
    safeStorage.local.removeItem(storageKeys.userData);
  }, [storageKeys.authState, storageKeys.lastPath, storageKeys.userData]);

  /**
   * 恢复认证状态（在组件挂载时调用）
   */
  const restoreAuthState = useCallback(() => {
    if (hasRestoredRef.current) return null;
    hasRestoredRef.current = true;

    const savedState = safeStorage.session.getItem(storageKeys.authState);
    if (!savedState) return null;

    try {
      const state: AuthState = JSON.parse(savedState);

      // 检查是否过期
      if (isAuthExpired(state.timestamp)) {
        clearAuthState();
        return null;
      }

      return state;
    } catch {
      return null;
    }
  }, [storageKeys.authState, isAuthExpired, clearAuthState]);

  /**
   * 重定向到登录页（保存当前路径）
   */
  const redirectToLogin = useCallback(() => {
    // 保存当前路径，登录后可以返回
    safeStorage.session.setItem(storageKeys.lastPath, location.pathname + location.search);
    navigate(loginRedirect, { state: { from: location } });
  }, [location, loginRedirect, navigate, storageKeys.lastPath]);

  /**
   * 登录成功后跳转到之前保存的路径
   */
  const redirectAfterLogin = useCallback(() => {
    const savedPath = safeStorage.session.getItem(storageKeys.lastPath);
    if (savedPath && savedPath !== loginRedirect) {
      safeStorage.session.removeItem(storageKeys.lastPath);
      navigate(savedPath, { replace: true });
    } else {
      navigate(defaultRedirect, { replace: true });
    }
  }, [defaultRedirect, loginRedirect, navigate, storageKeys.lastPath]);

  return {
    saveAuthState,
    saveUserData,
    getSavedUserData,
    getLastPath,
    restoreAuthState,
    clearAuthState,
    redirectToLogin,
    redirectAfterLogin,
    isAuthExpired,
  };
}

export default usePersistentAuth;
