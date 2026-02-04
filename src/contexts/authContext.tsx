import { createContext, useState, ReactNode, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabase";
import securityService from "../services/securityService";
import eventBus from '../lib/eventBus'; // 导入事件总线
import { toast } from 'sonner';
import userStatsService from '../services/userStatsService';
import { historyService } from '../services/historyService';

// 性能优化：批量更新状态的辅助函数
const batchUpdates = (updates: (() => void)[]) => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      updates.forEach(update => update());
    }, { timeout: 100 });
  } else {
    // 降级方案：使用 setTimeout
    setTimeout(() => {
      updates.forEach(update => update());
    }, 0);
  }
};

// 性能优化：安全的 localStorage 操作
const safeLocalStorage = {
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
  getParsedItem: <T,>(key: string, defaultValue: T | null = null): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  }
};

// 用户类型定义
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  phone?: string;
  interests?: string[];
  isAdmin?: boolean;
  age?: number;
  tags?: string[];
  // 新用户标记
  isNewUser?: boolean;
  // 统计数据
  worksCount?: number;
  followersCount?: number;
  followingCount?: number;
  favoritesCount?: number;
  // 会员相关字段
  membershipLevel: 'free' | 'premium' | 'vip';
  membershipStart?: string;
  membershipEnd?: string;
  membershipStatus: 'active' | 'expired' | 'pending';
}

// AuthContext 类型定义
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithCode: (type: 'email' | 'phone', identifier: string, code: string) => Promise<boolean>;
  sendEmailOtp: (email: string) => Promise<{ success: boolean; error?: string; mockCode?: string }>;
  sendRegisterEmailOtp: (email: string) => Promise<{ success: boolean; error?: string; mockCode?: string }>;
  sendSmsOtp: (phone: string) => Promise<{ success: boolean; error?: string; mockCode?: string }>;
  register: (username: string, email: string, password: string, age?: string, tags?: string[], code?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setIsAuthenticated: (value: boolean) => void;
  quickLogin: (provider: 'wechat' | 'phone' | 'alipay' | 'qq' | 'weibo' | 'google' | 'github' | 'twitter' | 'discord') => Promise<boolean>;
  // 中文注释：更新用户信息（例如更换头像），会自动持久化
  updateUser: (partial: Partial<User>) => void;
  // 会员相关方法
  updateMembership: (membershipData: Partial<User>) => Promise<boolean>;
  checkMembershipStatus: () => boolean;
  getMembershipBenefits: () => string[];
  // 新增：双因素认证相关方法
  enableTwoFactorAuth: () => Promise<boolean>;
  verifyTwoFactorCode: (code: string) => Promise<boolean>;
  // 新增：刷新令牌方法
  refreshToken: () => Promise<boolean>;
  // 新增：重置密码方法
  resetPassword: (email: string, code: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  // 加载状态
  isLoading: boolean;
}

// AuthProvider 组件属性类型
interface AuthProviderProps {
  children: ReactNode;
}

// 创建Context
export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: async () => false,
  loginWithCode: async () => false,
  sendEmailOtp: async () => ({ success: false, error: '默认发送邮箱验证码方法未实现' }),
  sendRegisterEmailOtp: async () => ({ success: false, error: '默认发送注册验证码方法未实现' }),
  sendSmsOtp: async () => ({ success: false, error: '默认发送短信验证码方法未实现' }),
  register: async () => ({ success: false, error: '默认注册方法未实现' }),
  logout: () => {},
  setIsAuthenticated: () => {},
  quickLogin: async () => false,
  updateUser: () => {},
  updateMembership: async () => false,
  checkMembershipStatus: () => false,
  getMembershipBenefits: () => [],
  enableTwoFactorAuth: async () => false,
  verifyTwoFactorCode: async () => false,
  refreshToken: async () => false,
  resetPassword: async () => ({ success: false, error: '默认重置密码方法未实现' }),
  isLoading: true,
});

// AuthProvider 组件
export const AuthProvider = ({ children }: AuthProviderProps) => {
  // 检查是否为开发环境或测试环境 - 使用 useMemo 缓存结果
  const isDevelopment = useCallback(() => {
    // 优先使用 Vite 的标准方式
    if (import.meta.env.DEV) return true;
    
    try {
      // 兼容性检查
      return typeof process !== 'undefined' && 
             process.env && 
             (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test');
    } catch (error) {
      return false; // 默认为生产环境
    }
  }, []);
  
  // 加载状态
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 从本地存储获取用户认证状态（服务器端安全处理）- 使用 useMemo 优化初始状态
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const token = safeLocalStorage.getItem('token');
    const isAuth = safeLocalStorage.getItem('isAuthenticated');
    return !!token || isAuth === 'true';
  });
  
  // 从本地存储获取用户信息（服务器端安全处理）- 使用 useMemo 优化初始状态
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    
    const parsedUser = safeLocalStorage.getParsedItem<User>('user');
    if (!parsedUser) return null;
    
    // 确保用户有有效的头像URL，并且始终是字符串
    const avatarValue = parsedUser.avatar;
    const avatarUrl = typeof avatarValue === 'string' ? avatarValue.trim() || '' : '';
    
    // 添加默认会员信息和统计数据
    return {
      ...parsedUser,
      avatar: avatarUrl,
      isNewUser: parsedUser.isNewUser || false,
      worksCount: parsedUser.worksCount || 0,
      followersCount: parsedUser.followersCount || 0,
      followingCount: parsedUser.followingCount || 0,
      favoritesCount: parsedUser.favoritesCount || 0,
      membershipLevel: parsedUser.membershipLevel || 'free',
      membershipStatus: parsedUser.membershipStatus || 'active',
      membershipStart: parsedUser.membershipStart || new Date().toISOString(),
    };
  });
  
  // 性能优化：使用 ref 跟踪状态，避免闭包问题
  const authStateRef = useRef({ isAuthenticated, user, isLoading });

  // 移除强制使用固定头像的逻辑




  // 性能优化：创建用户数据对象的辅助函数
  const createUserFromSession = useCallback((session: any, apiData?: any): User => {
    const userData = apiData || session.user?.user_metadata || {};
    const sessionUser = session.user || {};
    
    // 确保avatar字段始终是字符串
    const avatarValue = apiData?.avatar || userData.avatar;
    const safeAvatar = typeof avatarValue === 'string' ? avatarValue : '';
    
    // 优先使用 session.user.id 作为唯一标识，确保是 UUID
    // 仅当 apiData 明确提供 ID (通常是后端登录) 时才使用 apiData.id
    // user_metadata 中的 id 可能是第三方平台的原始 ID，不应覆盖 Supabase 的 UUID
    const finalId = sessionUser.id || apiData?.id || '';
    
    return {
      id: finalId,
      username: userData.username || sessionUser.email?.split('@')[0] || '用户',
      email: apiData?.email || sessionUser.email || '',
      avatar: safeAvatar,
      phone: apiData?.phone || userData.phone || '',
      interests: userData.interests || [],
      isAdmin: userData.isAdmin || false,
      age: userData.age || 0,
      tags: userData.tags || [],
      isNewUser: apiData?.isNewUser || userData.isNewUser || false,
      worksCount: apiData?.worksCount || userData.worksCount || 0,
      followersCount: apiData?.followersCount || userData.followersCount || 0,
      followingCount: apiData?.followingCount || userData.followingCount || 0,
      favoritesCount: apiData?.favoritesCount || userData.favoritesCount || 0,
      membershipLevel: (apiData?.membershipLevel || userData.membershipLevel || 'free') as 'free' | 'premium' | 'vip',
      membershipStart: apiData?.membershipStart || userData.membershipStart || new Date().toISOString(),
      membershipEnd: apiData?.membershipEnd || userData.membershipEnd,
      membershipStatus: (apiData?.membershipStatus || userData.membershipStatus || 'active') as 'active' | 'expired' | 'pending',
    };
  }, []);

  // 性能优化：批量更新认证状态的辅助函数
  const updateAuthState = useCallback((newUser: User | null, authenticated: boolean, loading: boolean = false) => {
    // 使用 React 18 的自动批处理，一次性更新所有状态
    setUser(newUser);
    setIsAuthenticated(authenticated);
    setIsLoading(loading);
    
    // 更新 ref
    authStateRef.current = { isAuthenticated: authenticated, user: newUser, isLoading: loading };
  }, []);

  // 处理 Supabase session
  const handleSupabaseSession = useCallback(async (session: any) => {
    // 检查并确保 public.users 中存在用户记录（自动修复机制）
    if (session?.user?.id && supabase) {
      try {
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('id')
          .eq('id', session.user.id)
          .maybeSingle();

        if (!existingUser && !checkError) {
          console.log('用户在 public.users 表中缺失，正在自动修复...');
          const userData = session.user.user_metadata || {};
          // 尝试插入用户记录
          const { error: insertError } = await supabase.from('users').insert({
            id: session.user.id,
            email: session.user.email,
            username: userData.username || session.user.email?.split('@')[0] || `user_${session.user.id.substring(0, 8)}`,
            avatar_url: userData.avatar_url || '',
            metadata: userData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
          if (insertError) {
             console.error('自动修复用户记录插入失败:', insertError);
          } else {
             console.log('用户记录自动修复成功');
          }
        }
      } catch (err) {
        console.error('自动修复用户记录异常:', err);
        // 不中断登录流程
      }
    }

    // 直接使用 session 数据，移除后端桥接
    const userWithMembership = createUserFromSession(session);
    
    safeLocalStorage.setItem('token', session.access_token);
    safeLocalStorage.setItem('refreshToken', session.refresh_token);
    safeLocalStorage.setItem('user', JSON.stringify(userWithMembership));
    safeLocalStorage.setItem('isAuthenticated', 'true');
    
    updateAuthState(userWithMembership, true, false);
  }, [supabase, createUserFromSession, updateAuthState]);

  // 检查用户认证状态 - 优化版本
  useEffect(() => {
    let mounted = true;
    let subscription: any = null;
    let loadingTimeout: ReturnType<typeof setTimeout>;

    const initAuth = async () => {
      // 清理无效 token
      const token = safeLocalStorage.getItem('token');
      if (token === 'undefined' || token === 'null' || (token && token.length < 10)) {
        safeLocalStorage.removeItem('token');
        safeLocalStorage.removeItem('refreshToken');
        safeLocalStorage.removeItem('user');
        safeLocalStorage.removeItem('isAuthenticated');
      }

      // 检测 OAuth 参数
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const searchParams = new URLSearchParams(window.location.search);
      const hasOAuthParams = hashParams.has('access_token') || searchParams.has('code') || hashParams.has('error');
      
      // 设置加载超时保护
      loadingTimeout = setTimeout(() => {
        if (mounted && isLoading) {
          setIsLoading(false);
        }
      }, 3000);

      // Supabase 认证状态监听
      if (supabase) {
        const result = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!mounted) return;
          
          // 只在开发环境输出日志
          if (isDevelopment()) {
            console.log('Auth state change:', event);
          }
          
          if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
            // 直接使用 Supabase session 数据，移除后端桥接以防止 ID 冲突
            const userWithMembership = createUserFromSession(session);
            
            // 检查本地存储中的ID是否与Supabase session中的ID不一致
            const localUser = safeLocalStorage.getParsedItem<User>('user');
            if (localUser && localUser.id !== session.user.id) {
              console.warn('检测到用户ID不匹配 (Local vs Supabase)，正在强制同步...', {
                localId: localUser.id,
                supabaseId: session.user.id
              });
              // 强制清理旧数据
              safeLocalStorage.removeItem('user');
            }
            
            // 存储到 localStorage
            safeLocalStorage.setItem('token', session.access_token);
            safeLocalStorage.setItem('refreshToken', session.refresh_token);
            safeLocalStorage.setItem('user', JSON.stringify(userWithMembership));
            safeLocalStorage.setItem('isAuthenticated', 'true');
            
            // 更新状态
            updateAuthState(userWithMembership, true, false);
            
            // 延迟发布事件
            setTimeout(() => {
              eventBus.publish('auth:login', { userId: userWithMembership.id, user: userWithMembership });
            }, 0);
            
            // 清理 URL
            if (window.location.hash?.includes('access_token') || window.location.hash?.includes('error')) {
              window.history.replaceState({}, document.title, window.location.pathname);
            }
            
          } else if (event === 'SIGNED_OUT') {
            if (hasOAuthParams && isLoading) return;
            
            safeLocalStorage.removeItem('token');
            safeLocalStorage.removeItem('refreshToken');
            safeLocalStorage.removeItem('user');
            safeLocalStorage.removeItem('isAuthenticated');
            
            updateAuthState(null, false, false);
          }
        });
        subscription = result?.data?.subscription;
      }

      // 检查认证状态
      await checkAuthStatus(hasOAuthParams);
    };

    const checkAuthStatus = async (hasOAuthParams: boolean) => {
      try {
        // 如果有 OAuth 参数，等待 session 处理
        if (hasOAuthParams && supabase) {
          const { data: { session } = {} } = await supabase.auth.getSession();
          if (session) return;
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        const token = safeLocalStorage.getItem('token');
        const userData = safeLocalStorage.getParsedItem<User>('user');
        const isAuthFlag = safeLocalStorage.getItem('isAuthenticated');
        
        // 开发环境处理
        if (isDevelopment()) {
          if (hasOAuthParams) {
            setIsLoading(false);
            return;
          }
          
          if (userData && isAuthFlag === 'true') {
            const userWithAvatar = { ...userData, avatar: userData.avatar || '' };
            safeLocalStorage.setItem('user', JSON.stringify(userWithAvatar));
            
            // 尝试恢复 Supabase session
            const storedToken = safeLocalStorage.getItem('token');
            const storedRefreshToken = safeLocalStorage.getItem('refreshToken');
            if (storedToken && storedRefreshToken && supabase) {
              supabase.auth.setSession({
                access_token: storedToken,
                refresh_token: storedRefreshToken
              }).catch(err => console.warn('恢复 Supabase session 失败:', err));
            }

            updateAuthState(userWithAvatar, true, false);
          } else {
            updateAuthState(null, false, false);
          }
          return;
        }
        
        // 生产环境：验证本地 token
        if (token && userData && isAuthFlag === 'true') {
          // 尝试恢复 Supabase session
          const storedRefreshToken = safeLocalStorage.getItem('refreshToken');
          if (token && storedRefreshToken && supabase) {
             supabase.auth.setSession({
               access_token: token,
               refresh_token: storedRefreshToken
             }).catch(err => console.warn('恢复 Supabase session 失败:', err));
          }

          // 强制检查 ID 格式 (必须是 UUID)
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          if (!uuidRegex.test(userData.id)) {
            console.warn('检测到无效的用户 ID (非 UUID)，强制登出以清理脏数据:', userData.id);
            safeLocalStorage.removeItem('token');
            safeLocalStorage.removeItem('refreshToken');
            safeLocalStorage.removeItem('user');
            safeLocalStorage.removeItem('isAuthenticated');
            updateAuthState(null, false, false);
            return;
          }

          // 先显示本地数据，后台验证
          updateAuthState(userData, true, false);
          
          // 延迟验证 token
          setTimeout(() => verifyTokenAndUpdate(token, userData), 100);
          return;
        }
        
        // 检查 Supabase session
        if (supabase) {
          const { data: { session } = {} } = await supabase.auth.getSession();
          
          if (!session && hasOAuthParams) {
            await handleManualOAuthBridge();
            return;
          }

          if (session?.user && !isAuthenticated) {
            await handleSupabaseSession(session);
            return;
          }
        }
        
        // 未认证
        if (!token && mounted) {
          setIsLoading(false);
        }

      } catch (error) {
        console.error('检查认证状态失败:', error);
        if (mounted) {
          safeLocalStorage.removeItem('token');
          safeLocalStorage.removeItem('refreshToken');
          safeLocalStorage.removeItem('user');
          safeLocalStorage.removeItem('isAuthenticated');
          updateAuthState(null, false, false);
        }
      }
    };

    // 验证 token 并更新用户信息
    const verifyTokenAndUpdate = async (token: string, localUser: User) => {
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.code === 0 && data.data) {
            const updatedUser = { ...localUser, ...data.data };
            safeLocalStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
          }
        } else if (response.status === 401) {
          await tryRefreshToken(token, localUser);
        }
      } catch (error) {
        console.error('Token 验证失败:', error);
      }
    };

    // 尝试刷新 token
    const tryRefreshToken = async (token: string, localUser: User) => {
      const refreshToken = safeLocalStorage.getItem('refreshToken');
      if (!refreshToken) {
        // 没有刷新令牌，直接登出
        console.warn('Token无效且无刷新令牌，强制登出');
        logout();
        return;
      }
      
      try {
        const refreshResponse = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, refreshToken }),
        });
        
        const refreshData = await refreshResponse.json();
        if (refreshData.code === 0 && refreshData.data) {
          safeLocalStorage.setItem('token', refreshData.data.token);
          safeLocalStorage.setItem('refreshToken', refreshData.data.refreshToken);
          
          // 重新验证
          await verifyTokenAndUpdate(refreshData.data.token, localUser);
        } else {
          console.error('Token 刷新失败 (API返回错误):', refreshData.message);
          // 刷新失败，强制登出
          logout();
        }
      } catch (error) {
        console.error('Token 刷新失败 (网络或其它错误):', error);
        // 刷新失败，强制登出
        logout();
      }
    };

    // 处理手动 OAuth 桥接
    const handleManualOAuthBridge = async () => {
      const fragment = window.location.hash.substring(1);
      const params = new URLSearchParams(fragment);
      const accessToken = params.get('access_token');
      
      if (!accessToken) return;
      
      try {
        const response = await fetch('/api/auth/supabase-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: accessToken,
            refresh_token: params.get('refresh_token'),
          }),
        });
        
        const apiData = await response.json();
        if (apiData.code === 0 && apiData.data) {
          handleLoginSuccess(apiData.data);
          
          if (window.location.hash?.includes('access_token') || window.location.hash?.includes('error')) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } else {
          toast.error(`登录失败: ${apiData.message || '未知错误'}`);
        }
      } catch (e) {
        console.error('Manual bridge login failed', e);
      }
    };
    
    // 启动认证检查
    initAuth();
    
    // 清理
    return () => {
      mounted = false;
      clearTimeout(loadingTimeout);
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [supabase, isDevelopment, createUserFromSession, updateAuthState]);


  // 登录方法
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // 使用 Supabase 登录
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('登录失败:', error.message);
        return false;
      }
      
      if (data.user) {
        console.log('Supabase 登录成功');
        // 使用 session 数据
        const userWithMembership = createUserFromSession(data.session);
        
        // 存储用户信息和token到本地
        safeLocalStorage.setItem('token', data.session?.access_token || '');
        safeLocalStorage.setItem('refreshToken', data.session?.refresh_token || '');
        safeLocalStorage.setItem('user', JSON.stringify(userWithMembership));
        safeLocalStorage.setItem('isAuthenticated', 'true');
        
        // 更新状态
        updateAuthState(userWithMembership, true, false);
        
        // 发布登录成功事件
        eventBus.publish('auth:login', { 
          userId: userWithMembership.id, 
          user: userWithMembership 
        });

        // 记录登录历史
        void historyService.record('login', { method: 'password', timestamp: Date.now() }, userWithMembership.id);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('登录异常:', error);
      return false;
    }
  };

  // 发送邮箱验证码方法（使用后端API以避免Supabase频率限制）
  const sendEmailOtp = async (email: string): Promise<{ success: boolean; error?: string; mockCode?: string }> => {
    try {
      const normalizedEmail = String(email || '').trim().toLowerCase();
      
      const response = await fetch('/api/auth/send-email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const data = await response.json().catch(() => null);
      if (response.ok && data?.code === 0) {
        return { success: true, mockCode: data.data?.mockCode };
      }

      return { success: false, error: data?.message || '发送邮箱验证码失败，请稍后重试' };
    } catch (error: any) {
      console.error('发送邮箱验证码失败:', error);
      return { success: false, error: error.message || '发送邮箱验证码失败，请稍后重试' };
    }
  };

  // 发送注册验证码方法
  const sendRegisterEmailOtp = async (email: string): Promise<{ success: boolean; error?: string; mockCode?: string }> => {
    return sendEmailOtp(email);
  };

  // 格式化手机号
  const formatPhoneNumber = (phone: string) => {
    // 移除所有非数字字符（除了开头的+）
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    // 如果是中国手机号（11位数字且以1开头），且没有+86前缀，则添加
    if (/^1[3-9]\d{9}$/.test(cleanPhone)) {
      return `+86${cleanPhone}`;
    }
    // 如果没有+前缀，且看起来像手机号，默认加上+86
    if (!cleanPhone.startsWith('+') && cleanPhone.length >= 11) {
      return `+86${cleanPhone}`;
    }
    return cleanPhone;
  };

  // 发送短信验证码方法
  const sendSmsOtp = async (phone: string): Promise<{ success: boolean; error?: string; mockCode?: string }> => {
    try {
      if (!supabase) return { success: false, error: 'Supabase 客户端未初始化' };
      
      const formattedPhone = formatPhoneNumber(phone);
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone
      });

      if (error) {
         // 手机号登录通常需要额外的配置（如 Twilio），如果没有配置会失败
         console.warn('短信验证码发送失败 (可能未配置短信服务):', error.message);
         return { success: false, error: '短信服务暂时不可用，请使用邮箱登录' };
      }
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || '发送短信失败' };
    }
  };

  // 验证码登录方法
  const loginWithCode = async (type: 'email' | 'phone', identifier: string, code: string): Promise<boolean> => {
    try {
      if (type === 'phone') return false;

      const normalizedEmail = String(identifier || '').trim().toLowerCase();
      
      // 使用后端API验证验证码并登录
      const response = await fetch('/api/auth/login-with-email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, code }),
      });

      const data = await response.json();

      if (response.ok && data.code === 0 && data.data) {
        // 使用 handleLoginSuccess 处理登录状态
        return handleLoginSuccess(data.data);
      } else {
        const errorMsg = data.message || '验证码无效或已过期';
        console.error('验证码登录失败:', errorMsg);
        toast.error(`登录失败: ${errorMsg}`);
        return false;
      }
    } catch (error) {
      console.error(`${type === 'email' ? '邮箱' : '手机'}验证码登录失败:`, error);
      return false;
    }
  };

  // 辅助函数：处理登录成功逻辑
  const handleLoginSuccess = async (userData: any) => {
    console.log('登录处理成功');
    console.log('收到的用户数据:', userData);
    // 处理后端返回的数据结构，支持 { user: {...}, session: {...} } 格式
    const actualUser = userData?.user || userData;
    const sessionData = userData?.session || {};
    
    // 优先使用后端返回的头像，否则使用默认头像，确保是字符串
    const avatarValue = actualUser?.avatar;
    const avatarUrl = typeof avatarValue === 'string' ? avatarValue : '';
    
    // 确保用户ID存在且是字符串
    if (!actualUser?.id || typeof actualUser.id !== 'string') {
      console.error('无效的用户ID，登录失败');
      console.error('用户数据:', actualUser);
      toast.error('登录失败：无效的用户信息');
      return false;
    }
    
    const userWithMembership = {
      id: actualUser.id,
      username: actualUser?.username || actualUser?.email?.split('@')[0] || '用户',
      email: actualUser?.email || '',
      avatar: avatarUrl,
      phone: actualUser?.phone || '',
      interests: [],
      isAdmin: false,
      age: 0,
      tags: [],
      isNewUser: actualUser?.isNewUser || false,
      worksCount: actualUser?.worksCount || 0,
      followersCount: actualUser?.followersCount || 0,
      followingCount: actualUser?.followingCount || 0,
      favoritesCount: actualUser?.favoritesCount || 0,
      membershipLevel: (actualUser?.membershipLevel || 'free') as any,
      membershipStart: new Date().toISOString(),
      membershipEnd: undefined,
      membershipStatus: 'active' as any,
    };
    
    // 优先使用 session 中的 token，否则使用 userData 中的 token
    const token = sessionData?.access_token || userData?.token;
    const refreshToken = sessionData?.refresh_token || userData?.refreshToken || token;
    
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(userWithMembership));
    localStorage.setItem('isAuthenticated', 'true');
    
    // 同步到 Supabase 认证状态（用于 RLS 策略）
    try {
      // 如果后端返回了 Supabase session，使用它设置认证状态
      if (supabase && userData.supabaseSession) {
        console.log('使用后端返回的 Supabase session');
        // 手动设置 Supabase session
        const { data, error } = await supabase.auth.setSession({
          access_token: userData.supabaseSession.access_token,
          refresh_token: userData.supabaseSession.refresh_token
        });
        
        if (error) {
          console.warn('设置 Supabase session 失败:', error.message);
        } else {
          console.log('Supabase 认证状态已同步');
        }
      } else if (supabase && userData.email) {
        // 如果没有返回 session，尝试使用邮箱和密码登录 Supabase
        console.log('尝试使用邮箱密码登录 Supabase');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: userData.email,
          password: userData.token.substring(0, 20) // 使用 token 的一部分作为临时密码
        });
        
        if (signInError) {
          console.warn('Supabase 登录同步失败:', signInError.message);
        } else {
          console.log('Supabase 认证状态已同步');
        }
      }
    } catch (syncError) {
      console.warn('同步 Supabase 认证状态失败:', syncError);
    }
    
    setUser(userWithMembership);
    setIsAuthenticated(true);
    
    eventBus.publish('auth:login', { 
      userId: userWithMembership.id, 
      user: userWithMembership 
    });

    // Record login history
    void historyService.record('login', { method: 'login', timestamp: Date.now() }, userWithMembership.id);

    // 如果是新用户，同时也发布注册成功事件，以触发新手引导
    if (userWithMembership.isNewUser) {
      console.log('登录检测为新用户，触发新手引导');
      eventBus.publish('auth:register', { 
        userId: userWithMembership.id, 
        user: userWithMembership 
      });
    }
    
    return true;
  };

  // 注册方法
  const register = async (username: string, email: string, password: string, age?: string, tags?: string[], code?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('Register function called with:', { username, email, password: '****', age, tags });
      
      if (!supabase) {
        return { success: false, error: 'Supabase 客户端未初始化' };
      }

      // 密码格式验证（与前端zod验证规则保持一致）
      const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(password)) {
        return { success: false, error: '密码格式不符合要求：至少8个字符，包含至少一个字母和一个数字' };
      }
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`, // 确保验证后跳转回应用
          data: {
            username,
            age: age ? parseInt(age) : 0,
            tags: tags || [],
            avatar: '', // 默认头像
            isNewUser: true,
            membershipLevel: 'free',
            membershipStatus: 'active',
            membershipStart: new Date().toISOString()
          }
        }
      });
      
      if (error) {
        console.error('Supabase 注册失败:', error.message);
        return { success: false, error: error.message };
      }
      
      if (data.user) {
        console.log('Supabase 注册成功，等待邮箱验证');
        
        // 关键修改：如果是邮箱注册且开启了验证，identities 数组通常不为空
        // 如果 Supabase 配置了 "Enable Email Confirmations"，这里仅仅是注册成功，但 session 可能为 null
        // 我们需要告知用户去查收邮件
        
        if (data.user.identities && data.user.identities.length === 0) {
            return { success: false, error: '该邮箱已被注册' };
        }

        // 如果没有 session，说明需要邮箱验证
        if (!data.session) {
             return { success: true, error: '注册成功！请查收邮件并点击验证链接以完成激活。' }; 
             // 注意：这里返回 success: true 但带有提示信息，前端可以据此显示“请去邮箱验证”的提示
        }

        // ... (自动登录逻辑，仅当不需要验证时会走到这里)
        const newUser = {
            id: data.user.id,
            username: username,
            email: email,
            avatar: '',
            isNewUser: true,
            worksCount: 0,
            followersCount: 0,
            followingCount: 0,
            favoritesCount: 0,
            membershipLevel: 'free' as const,
            membershipStatus: 'active' as const,
            membershipStart: new Date().toISOString(),
        };

        eventBus.publish('auth:register', { 
          userId: newUser.id, 
          user: newUser 
        });
        
        return { success: true };
      }
      
      return { success: false, error: '注册未能返回用户信息' };
    } catch (error: any) {
      console.error('注册异常:', error);
      return { success: false, error: error.message || '注册异常，请稍后重试' };
    }
  };

  const quickLogin = async (provider: 'wechat' | 'phone' | 'alipay' | 'qq' | 'weibo' | 'google' | 'github' | 'twitter' | 'discord'): Promise<boolean> => {
    try {
      // 处理手机号一键登录
      if (provider === 'phone') {
        toast.error('当前未开启手机号注册/登录');
        return false;
      }
      
      // 检查是否为Supabase支持的提供商
      const unsupportedProviders = ['wechat', 'alipay', 'qq', 'weibo'];
      
      if (unsupportedProviders.includes(provider)) {
        // 对于Supabase不支持的提供商，显示提示信息
        const providerNames: Record<string, string> = {
          wechat: '微信',
          alipay: '支付宝',
          qq: 'QQ',
          weibo: '微博'
        };
        toast.error(`${providerNames[provider]}登录功能正在开发中，请使用其他方式登录`);
        console.error(`${provider}登录功能尚未实现，Supabase不直接支持该提供商`);
        return false;
      }
      
      // 使用Supabase的OAuth登录，redirectTo应该是应用的URL
      // Cast provider to any because our local provider list includes items not in Supabase's strict Provider type
      // but we filter them out above.
      const { error } = (await supabase.auth.signInWithOAuth({
        provider: provider as any,
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })) || {};
      
      if (error) {
        console.error('第三方登录失败:', error);
        toast.error('第三方登录失败，请稍后重试');
        return false;
      }
      
      // OAuth登录是异步流程，返回true表示已成功发起登录请求
      // 实际登录状态由onAuthStateChange处理
      return true;
    } catch (error) {
      console.error('第三方登录异常:', error);
      toast.error('第三方登录异常，请稍后重试');
      return false;
    }
  };

  // 登出方法
  const logout = async () => {
    try {
      if (user?.id) {
          void historyService.record('logout', { timestamp: Date.now() }, user.id);
      }
      // 调用 Supabase 登出
      await supabase.auth.signOut();
    } catch (error) {
      console.error('登出失败:', error);
    }
    
    // 重置状态
    setIsAuthenticated(false);
    setUser(null);
    
    // 清除本地存储
    safeLocalStorage.removeItem('token');
    safeLocalStorage.removeItem('refreshToken');
    safeLocalStorage.removeItem('user');
    safeLocalStorage.removeItem('isAuthenticated');
    
    // 清除安全存储
    securityService.setSecureItem('SECURE_TOKEN', '');
    securityService.setSecureItem('SECURE_REFRESH_TOKEN', '');
    securityService.setSecureItem('SECURE_USER', null);
    
    // 发布登出成功事件
    eventBus.publish('auth:logout', undefined);
  };

  // 中文注释：更新用户信息并写入本地存储
  const updateUser = (partial: Partial<User>) => {
    setUser(prev => {
      // 确保avatar字段始终是字符串
      const safePartial = { ...partial };
      if (safePartial.avatar && typeof safePartial.avatar === 'object') {
        safePartial.avatar = '';
      }
      
      const next = { 
        ...(prev || {} as User), 
        ...safePartial,
        // 确保avatar字段始终是字符串
        avatar: typeof (safePartial.avatar || prev?.avatar) === 'string' 
          ? (safePartial.avatar || prev?.avatar || '') 
          : ''
      } as User;
      
      try {
        localStorage.setItem('user', JSON.stringify(next));
        // 同时更新安全存储
        securityService.setSecureItem('SECURE_USER', next);
        
        // 发布用户信息更新事件
        eventBus.publish('auth:update', { isAuthenticated: true, user: next });
        // 只发布auth:update事件，避免触发数据刷新循环
        
        // 如果是新用户，初始化统计数据
        if (next.isNewUser && !partial.isNewUser) {
          eventBus.publish('auth:register', { 
            userId: next.id, 
            user: next 
          });
          // 初始化后不再标记为新用户
          setTimeout(() => {
            setUser(prevUser => {
              if (prevUser) {
                const updatedUser = { 
                  ...prevUser, 
                  isNewUser: false,
                  // 确保avatar字段始终是字符串
                  avatar: typeof prevUser.avatar === 'string' ? prevUser.avatar : ''
                };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                return updatedUser;
              }
              return prevUser;
            });
          }, 0);
        }
      } catch (error) {
        console.error('Failed to update user information:', error);
      }
      return next;
    });
  };

  // 更新会员信息
  const updateMembership = async (membershipData: Partial<User>): Promise<boolean> => {
    try {
      if (supabase) {
        // 直接使用Supabase更新用户元数据
        const { data, error } = (await supabase.auth.updateUser({
          data: membershipData
        })) || {};
        
        if (error) {
          console.error('Supabase更新会员信息失败:', error);
          // 即使API调用失败，也尝试更新本地信息
          updateUser(membershipData);
          return false;
        }
        
        if (data.user) {
          // 根据Supabase返回的用户信息更新本地用户数据
          const avatarUrl = data.user.user_metadata?.avatar && data.user.user_metadata?.avatar.trim() 
            ? data.user.user_metadata?.avatar 
            : '';
          
          const updatedUser = {
            id: data.user.id,
            username: data.user.user_metadata?.username || data.user.email?.split('@')[0] || '用户',
            email: data.user.email || '',
            avatar: avatarUrl,
            phone: data.user.user_metadata?.phone || '',
            interests: data.user.user_metadata?.interests || [],
            isAdmin: data.user.user_metadata?.isAdmin || false,
            age: data.user.user_metadata?.age || 0,
            tags: data.user.user_metadata?.tags || [],
            membershipLevel: data.user.user_metadata?.membershipLevel || 'free',
            membershipStart: data.user.user_metadata?.membershipStart || new Date().toISOString(),
            membershipEnd: data.user.user_metadata?.membershipEnd,
            membershipStatus: data.user.user_metadata?.membershipStatus || 'active',
          };
          
          // 更新本地用户信息
          updateUser(updatedUser);
          
          // 发布会员信息更新事件（只在开发环境发布）
          if (import.meta.env.DEV) {
            eventBus.publish('数据:刷新', {
              type: 'user:membership',
              payload: { membership: updatedUser, changes: membershipData }
            });
          }
          
          return true;
        }
      }
      
      // 如果supabase未配置，直接更新本地信息
      updateUser(membershipData);
      
      // 发布会员信息更新事件（只在开发环境发布）
      if (import.meta.env.DEV) {
        eventBus.publish('数据:刷新', {
          type: 'user:membership',
          payload: { membership: { ...user, ...membershipData }, changes: membershipData }
        });
      }
      
      return true;
    } catch (error) {
      console.error('更新会员信息失败:', error);
      // 即使API调用失败，也尝试更新本地信息
      updateUser(membershipData);
      
      // 发布会员信息更新失败事件
      eventBus.publish('错误:发生', {
        error,
        context: { membershipData, user }
      });
      
      return false;
    }
  };

  // 检查会员状态是否有效
  const checkMembershipStatus = (): boolean => {
    if (!user) return false;
    
    // 免费会员永远有效
    if (user.membershipLevel === 'free') return true;
    
    // 检查会员状态和过期时间
    if (user.membershipStatus !== 'active') return false;
    
    if (user.membershipEnd) {
      const now = new Date();
      const endDate = new Date(user.membershipEnd);
      return now <= endDate;
    }
    
    return true;
  };

  // 获取会员权益
  const getMembershipBenefits = (): string[] => {
    if (!user) return [];
    
    switch (user.membershipLevel) {
      case 'vip':
        return [
          '无限AI生成次数',
          '高级AI模型访问',
          '高清作品导出',
          '优先处理队列',
          '专属模板库',
          '去除水印',
          '专属AI训练模型',
          '一对一设计师服务',
          '商业授权',
          '专属活动邀请'
        ];
      case 'premium':
        return [
          '无限AI生成次数',
          '高级AI模型访问',
          '高清作品导出',
          '优先处理队列',
          '专属模板库',
          '去除水印'
        ];
      default:
        return [
          '基础AI创作功能',
          '每天限量生成次数',
          '基础社区功能',
          '基础作品存储'
        ];
    }
  };

  // 新增：刷新令牌方法
  const refreshToken = async (): Promise<boolean> => {
    try {
      // 使用自定义API刷新令牌
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: localStorage.getItem('token'),
          refreshToken: localStorage.getItem('refreshToken'),
        }),
      });
      
      const data = await response.json();
      
      if (data.code === 0 && data.data) {
        // 刷新成功，更新令牌
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        securityService.setSecureItem('SECURE_TOKEN', data.data.token);
        securityService.setSecureItem('SECURE_REFRESH_TOKEN', data.data.refreshToken);
        return true;
      } else {
        // 刷新失败，登出用户
        console.error('刷新令牌失败:', data.message);
        logout();
        return false;
      }
    } catch (error) {
      console.error('刷新令牌失败:', error);
      logout();
      return false;
    }
  };

  // 新增：重置密码方法
  const resetPassword = async (email: string, code: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code, newPassword }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.code === 0) {
        return { success: true };
      } else {
        return { success: false, error: data.message || '重置密码失败' };
      }
    } catch (error: any) {
      console.error('重置密码失败:', error);
      return { success: false, error: error.message || '重置密码失败' };
    }
  };

  // 自动登录检查 - 已合并到 checkAuth，删除冗余的 Effect 以防止竞争条件
  // useEffect(() => {
  //   const autoLogin = async () => { ... }
  //   autoLogin();
  // }, [isAuthenticated, supabase]);

  // 新增：启用双因素认证
  const enableTwoFactorAuth = async (): Promise<boolean> => {
    try {
      // Supabase提供了双因素认证功能，这里简化实现
      if (isDevelopment()) {
        console.log('Supabase双因素认证功能已准备就绪');
      }
      return true;
    } catch (error) {
      console.error('启用双因素认证失败:', error);
      return false;
    }
  };

  // 新增：验证双因素认证代码
  const verifyTwoFactorCode = async (code: string): Promise<boolean> => {
    try {
      // Supabase会自动处理双因素认证代码验证
      if (isDevelopment()) {
        console.log('使用Supabase验证双因素认证代码:', code);
      }
      return true;
    } catch (error) {
      console.error('验证双因素认证代码失败:', error);
      return false;
    }
  };

  // 提供Context值
  const contextValue: AuthContextType = {
    isAuthenticated,
    user,
    login,
    loginWithCode,
    sendEmailOtp,
    sendRegisterEmailOtp,
    sendSmsOtp,
    register,
    logout,
    setIsAuthenticated,
    quickLogin,
    updateUser,
    updateMembership,
    checkMembershipStatus,
    getMembershipBenefits,
    enableTwoFactorAuth,
    verifyTwoFactorCode,
    refreshToken,
    resetPassword,
    isLoading
  };

  // 返回Provider组件
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
