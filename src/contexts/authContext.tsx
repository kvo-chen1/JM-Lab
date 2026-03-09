import { createContext, useState, ReactNode, useEffect, useCallback, useMemo, useRef, useContext } from "react";
import { supabase } from "@/lib/supabase";
import securityService from "../services/securityService";
import eventBus from '../lib/eventBus'; // 导入事件总线
import { toast } from 'sonner';
import userStatsService from '../services/userStatsService';
import { historyService } from '../services/historyService';
import { userService } from '../services/apiService';

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
  /** @deprecated 请使用 avatar_url */
  avatar?: string;
  avatar_url?: string;
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
  // 安全相关字段
  twoFactorEnabled?: boolean;
  // 个人资料字段
  bio?: string;
  location?: string;
  occupation?: string;
  website?: string;
  github?: string;
  twitter?: string;
  coverImage?: string;
  // 其他字段
  is_verified?: boolean;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
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
  resendTwoFactorCode: () => Promise<boolean>;
  disableTwoFactorAuth: () => Promise<boolean>;
  // 新增：刷新令牌方法
  refreshToken: () => Promise<boolean>;
  // 新增：重置密码方法
  resetPassword: (email: string, code: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  // 新增：用户ID一致性验证方法
  verifyUserIdConsistency: (userId: string) => Promise<boolean>;
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
  resendTwoFactorCode: async () => false,
  disableTwoFactorAuth: async () => false,
  refreshToken: async () => false,
  resetPassword: async () => ({ success: false, error: '默认重置密码方法未实现' }),
  verifyUserIdConsistency: async () => false,
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
    
    // 确保用户有有效的头像URL，并且始终是字符串（优先使用avatar_url，兼容avatar）
    const avatarValue = parsedUser.avatar_url || parsedUser.avatar;
    const avatarUrl = typeof avatarValue === 'string' ? avatarValue.trim() || '' : '';
    
    // 添加默认会员信息和统计数据
    return {
      ...parsedUser,
      avatar_url: avatarUrl,
      avatar: avatarUrl, // 保持兼容
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
    
    // 确保avatar字段始终是字符串（优先使用avatar_url，兼容avatar）
    const avatarValue = apiData?.avatar_url || apiData?.avatar || userData.avatar_url || userData.avatar;
    const safeAvatar = typeof avatarValue === 'string' ? avatarValue : '';
    
    // 优先使用 session.user.id 作为唯一标识，确保是 UUID
    // 仅当 apiData 明确提供 ID (通常是后端登录) 时才使用 apiData.id
    // user_metadata 中的 id 可能是第三方平台的原始 ID，不应覆盖 Supabase 的 UUID
    const finalId = sessionUser.id || apiData?.id || '';
    
    // 检测是否为手机号
    const isPhoneNumber = (str: string) => {
      // 中国手机号格式：11位数字，以1开头
      return /^1[3-9]\d{9}$/.test(str) || 
             // 带国际区号的手机号
             /^\+?[0-9]{10,15}$/.test(str);
    };
    
    // 生成用户名
    let username = userData.username;
    if (!username) {
      // 如果没有用户名，尝试从email中提取
      if (sessionUser.email && !isPhoneNumber(sessionUser.email)) {
        username = sessionUser.email.split('@')[0];
      } else {
        // 如果email是手机号或者不存在，使用默认用户名
        username = `用户_${finalId?.substring(0, 8) || 'guest'}`;
      }
    }
    
    return {
      id: finalId,
      username: username || '用户',
      email: apiData?.email || sessionUser.email || '',
      avatar_url: safeAvatar,
      avatar: safeAvatar, // 保持兼容
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
      // 个人资料字段
      bio: apiData?.bio || userData.bio || '',
      location: apiData?.location || userData.location || '',
      occupation: apiData?.occupation || userData.occupation || '',
      website: apiData?.website || userData.website || '',
      github: apiData?.github || userData.github || '',
      twitter: apiData?.twitter || userData.twitter || '',
      coverImage: apiData?.coverImage || userData.coverImage || '',
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
    let dbUserData = null;
    
    // 检查并确保 public.users 中存在用户记录（自动修复机制）
    if (session?.user?.id && supabase) {
      try {
        // 从数据库获取用户完整信息，包括 is_new_user 字段
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('id, username, email, avatar_url, phone, interests, is_new_user, bio, location, occupation, website, github, twitter, cover_image, metadata')
          .eq('id', session.user.id)
          .maybeSingle();

        if (existingUser) {
          // 转换数据库字段为前端格式
          dbUserData = {
            id: existingUser.id,
            username: existingUser.username,
            email: existingUser.email,
            avatar_url: existingUser.avatar_url,
            avatar: existingUser.avatar_url, // 保持兼容
            phone: existingUser.phone,
            interests: existingUser.interests || [],
            isNewUser: existingUser.is_new_user ?? true,
            bio: existingUser.bio,
            location: existingUser.location,
            occupation: existingUser.occupation,
            website: existingUser.website,
            github: existingUser.github,
            twitter: existingUser.twitter,
            coverImage: existingUser.cover_image,
            ...existingUser.metadata
          };
        } else if (!checkError) {
          console.log('用户在 public.users 表中缺失，正在自动修复...');
          const userData = session.user.user_metadata || {};
          // 尝试插入用户记录
          const { error: insertError } = await supabase.from('users').insert({
            id: session.user.id,
            email: session.user.email,
            username: userData.username || session.user.email?.split('@')[0] || `user_${session.user.id.substring(0, 8)}`,
            avatar_url: userData.avatar_url || '',
            metadata: userData,
            is_new_user: true, // 新用户标记
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
          if (insertError) {
             console.error('自动修复用户记录插入失败:', insertError);
          } else {
             console.log('用户记录自动修复成功');
          }
          // 新插入的用户默认为新用户
          dbUserData = { isNewUser: true };
        }
      } catch (err) {
        console.error('获取用户记录异常:', err);
        // 不中断登录流程
      }
    }

    // 合并数据库数据和 session 数据
    const userWithMembership = createUserFromSession(session, dbUserData);
    
    safeLocalStorage.setItem('token', session.access_token);
    safeLocalStorage.setItem('refreshToken', session.refresh_token);
    safeLocalStorage.setItem('user', JSON.stringify(userWithMembership));
    safeLocalStorage.setItem('isAuthenticated', 'true');
    
    updateAuthState(userWithMembership, true, false);
    
    // 检查用户信息是否完整（用户名和头像）
    const avatarValue = userWithMembership.avatar_url || userWithMembership.avatar;
    const isProfileComplete = userWithMembership.username && 
                           userWithMembership.username.trim() !== '' && 
                           avatarValue && 
                           avatarValue.trim() !== '';
    
    // 如果是新用户或信息不完整，标记为需要完善信息
    const needsProfileCompletion = userWithMembership.isNewUser || !isProfileComplete;
    
    // 发布登录成功事件
    eventBus.publish('auth:login', { 
      userId: userWithMembership.id, 
      user: userWithMembership,
      isProfileComplete: !needsProfileCompletion
    });
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
              // 强制清理旧数据，包括个人信息完整性和新手引导完成标记
              safeLocalStorage.removeItem('token');
              safeLocalStorage.removeItem('refreshToken');
              safeLocalStorage.removeItem('user');
              safeLocalStorage.removeItem('isAuthenticated');
              // 清理个人信息完整性和新手引导相关标记
              if (localUser) {
                const guideKey = `guide_completed_${localUser.id}`;
                localStorage.removeItem(guideKey);
              }
              
              // 重新登录以确保数据一致性
              console.warn('用户信息与数据库不匹配，需要重新登录');
              toast.error('用户信息与数据库不匹配，请重新登录');
              
              // 重定向到登录页面
              setTimeout(() => {
                window.location.href = '/login';
              }, 1000);
              
              return;
            }
            
            // 存储到 localStorage
            safeLocalStorage.setItem('token', session.access_token);
            safeLocalStorage.setItem('refreshToken', session.refresh_token);
            safeLocalStorage.setItem('user', JSON.stringify(userWithMembership));
            safeLocalStorage.setItem('isAuthenticated', 'true');
            
            // 更新状态
            updateAuthState(userWithMembership, true, false);
            
            // 检查用户信息是否完整
            const avatarValue = userWithMembership.avatar_url || userWithMembership.avatar;
            const isProfileComplete = !!(userWithMembership.username && userWithMembership.username.trim() !== '' &&
                                   avatarValue && avatarValue.trim() !== '');
            
            // 延迟发布事件
            setTimeout(() => {
              eventBus.publish('auth:login', { 
                userId: userWithMembership.id, 
                user: userWithMembership,
                isProfileComplete
              });
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
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, [supabase, isDevelopment, createUserFromSession, updateAuthState]);


  // 登录方法 - 已移除邮箱密码登录，只支持邮箱验证码登录
  const login = async (email: string, password: string): Promise<boolean> => {
    console.warn('邮箱密码登录已被移除，请使用邮箱验证码登录');
    toast.error('邮箱密码登录已被移除，请使用邮箱验证码登录');
    return false;
  };

  // 发送邮箱验证码方法（使用后端API）
  const sendEmailOtp = async (email: string): Promise<{ success: boolean; error?: string; mockCode?: string }> => {
    try {
      const normalizedEmail = String(email || '').trim().toLowerCase();
      
      console.log('开始发送验证码到邮箱:', normalizedEmail);
      
      // 调用后端API发送验证码
      const response = await fetch('/api/auth/send-email-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: normalizedEmail })
      });
      
      const data = await response.json();
      
      if (response.ok && data.code === 0) {
        console.log('验证码发送成功');
        return { success: true };
      } else {
        console.error('发送验证码失败:', data.message);
        return { success: false, error: data.message || '发送验证码失败，请稍后重试' };
      }
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

  // 验证码登录方法（使用后端API验证）
  const loginWithCode = async (type: 'email' | 'phone', identifier: string, code: string): Promise<boolean> => {
    try {
      if (type === 'phone') {
        // 手机号登录暂时不支持
        toast.error('手机号登录暂时不可用，请使用邮箱登录');
        return false;
      }

      // 邮箱验证码登录
      const normalizedEmail = String(identifier || '').trim().toLowerCase();
      
      // 调用后端API验证验证码
      const response = await fetch('/api/auth/login-with-email-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          email: normalizedEmail,
          code: code
        })
      });

      const data = await response.json();

      if (!response.ok || data.code !== 0) {
        console.error('邮箱验证码验证失败:', data.message);
        toast.error(data.message || '验证码无效或已过期');
        return false;
      }

      // 登录成功，处理用户数据
      console.log('验证码登录成功，用户数据:', data.data);
      
      const userData = data.data?.user || data.data;
      const sessionData = data.data?.session || {};
      
      // 创建用户对象
      // 优先使用后端返回的 isNewUser，如果没有则根据 username 判断
      const isNewUser = userData.isNewUser !== undefined 
        ? userData.isNewUser 
        : (!userData.username || userData.username.trim() === '');
      
      const userWithMembership: User = {
        id: userData.id || userData.user_id || '',
        email: userData.email || normalizedEmail,
        username: userData.username || userData.name || normalizedEmail.split('@')[0],
        avatar: userData.avatar_url || userData.avatar || '',
        bio: userData.bio || '',
        is_verified: userData.is_verified || false,
        metadata: userData.metadata || {},
        created_at: userData.created_at || new Date().toISOString(),
        updated_at: userData.updated_at || new Date().toISOString(),
        isNewUser: isNewUser,
        membershipLevel: userData.membershipLevel || 'free',
        membershipStatus: userData.membershipStatus || 'active'
      };
      
      // 存储用户信息和token到本地
      const token = sessionData.access_token || sessionData.token || data.data?.token || '';
      const refreshToken = sessionData.refresh_token || token || ''; // 如果没有 refresh_token，使用 token 作为备选
      
      if (!refreshToken) {
        console.warn('[loginWithCode] 警告: refreshToken 为空，Supabase session 可能无法恢复');
      }
      
      safeLocalStorage.setItem('token', token);
      safeLocalStorage.setItem('refreshToken', refreshToken);
      safeLocalStorage.setItem('user', JSON.stringify(userWithMembership));
      safeLocalStorage.setItem('isAuthenticated', 'true');
      
      // 同步 Supabase session（如果后端返回了 Supabase session）
      console.log('[Auth] 检查登录响应中的 supabaseSession:', {
        hasSupabaseSession: !!data.data?.supabaseSession,
        hasAccessToken: !!data.data?.supabaseSession?.access_token,
        hasRefreshToken: !!data.data?.supabaseSession?.refresh_token
      });
      
      if (supabase && data.data?.supabaseSession) {
        try {
          console.log('[Auth] 正在同步 Supabase session...');
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: data.data.supabaseSession.access_token,
            refresh_token: data.data.supabaseSession.refresh_token
          });
          if (sessionError) {
            console.error('[Auth] 同步 Supabase session 失败:', sessionError);
          } else {
            console.log('[Auth] Supabase session 已同步，用户ID:', sessionData.session?.user?.id);
          }
        } catch (syncError) {
          console.error('[Auth] 同步 Supabase session 异常:', syncError);
        }
      } else {
        console.warn('[Auth] 后端未返回 supabaseSession，RLS 查询可能无法执行');
      }
      
      // 更新状态
      updateAuthState(userWithMembership, true, false);
      
      // 检查用户信息是否完整
      const avatarValue = userWithMembership.avatar_url || userWithMembership.avatar;
      const isProfileComplete = !!(userWithMembership.username && userWithMembership.username.trim() !== '' &&
                               avatarValue && avatarValue.trim() !== '');
      
      // 发布登录成功事件
      eventBus.publish('auth:login', { 
        userId: userWithMembership.id, 
        user: userWithMembership,
        isProfileComplete
      });
      
      return true;
    } catch (error: any) {
      console.error(`${type === 'email' ? '邮箱' : '手机'}验证码登录失败:`, error);
      toast.error(error.message || '登录失败，请稍后重试');
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
    
    // 优先使用后端返回的头像，否则使用默认头像，确保是字符串（优先使用avatar_url，兼容avatar）
    const avatarValue = actualUser?.avatar_url || actualUser?.avatar;
    const avatarUrl = typeof avatarValue === 'string' ? avatarValue : '';
    
    // 确保用户ID存在且是字符串
    if (!actualUser?.id || typeof actualUser.id !== 'string') {
      console.error('无效的用户ID，登录失败');
      console.error('用户数据:', actualUser);
      toast.error('登录失败：无效的用户信息');
      return false;
    }
    
    // 检查是否是邮箱验证码登录的用户
    if (actualUser.auth_provider && actualUser.auth_provider !== 'local') {
      console.error('非邮箱验证码登录用户，登录失败');
      toast.error('该账号不是通过邮箱验证码登录的，请使用邮箱验证码登录');
      return false;
    }
    
    // 检查本地存储中的ID是否与后端返回的ID不一致
    const localUser = safeLocalStorage.getParsedItem<User>('user');
    if (localUser && localUser.id !== actualUser.id) {
      console.warn('检测到用户ID不匹配 (Local vs Backend)，正在强制同步...', {
        localId: localUser.id,
        backendId: actualUser.id
      });
      // 强制清理旧数据，包括个人信息完整性和新手引导完成标记
      safeLocalStorage.removeItem('token');
      safeLocalStorage.removeItem('refreshToken');
      safeLocalStorage.removeItem('user');
      safeLocalStorage.removeItem('isAuthenticated');
      // 清理个人信息完整性和新手引导相关标记
      if (localUser) {
        const guideKey = `guide_completed_${localUser.id}`;
        localStorage.removeItem(guideKey);
      }
      
      // 重新登录以确保数据一致性
      console.warn('用户信息与数据库不匹配，需要重新登录');
      toast.error('用户信息与数据库不匹配，请重新登录');
      
      // 重定向到登录页面
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
      
      return false;
    }
    
    // 尝试与Supabase用户ID同步
    try {
      const { data: { session } = {} } = await supabase.auth.getSession();
      if (session?.user && session.user.id !== actualUser.id) {
        console.warn('检测到用户ID不匹配 (Backend vs Supabase)，使用Supabase ID:', {
          backendId: actualUser.id,
          supabaseId: session.user.id
        });
        // 清理旧数据，确保使用Supabase ID
        safeLocalStorage.removeItem('token');
        safeLocalStorage.removeItem('refreshToken');
        safeLocalStorage.removeItem('user');
        safeLocalStorage.removeItem('isAuthenticated');
        
        // 使用Supabase用户信息
        const userWithMembership = createUserFromSession(session);
        
        // 存储用户信息和token到本地
        safeLocalStorage.setItem('token', session.access_token);
        safeLocalStorage.setItem('refreshToken', session.refresh_token);
        safeLocalStorage.setItem('user', JSON.stringify(userWithMembership));
        safeLocalStorage.setItem('isAuthenticated', 'true');
        
        // 更新状态
        updateAuthState(userWithMembership, true, false);
        
        // 检查用户信息是否完整
        const profileAvatarValue = userWithMembership.avatar_url || userWithMembership.avatar;
        const isProfileComplete = !!(userWithMembership.username && userWithMembership.username.trim() !== '' &&
                               profileAvatarValue && profileAvatarValue.trim() !== '');
        
        // 发布登录成功事件
        eventBus.publish('auth:login', { 
          userId: userWithMembership.id, 
          user: userWithMembership,
          isProfileComplete
        });
        
        return true;
      }
    } catch (supabaseError) {
      console.warn('Supabase用户ID同步失败:', supabaseError);
      // 继续使用后端返回的用户信息
    }
    
    // 检测是否为手机号
    const isPhoneNumber = (str: string) => {
      // 中国手机号格式：11位数字，以1开头
      return /^1[3-9]\d{9}$/.test(str) || 
             // 带国际区号的手机号
             /^\+?[0-9]{10,15}$/.test(str);
    };
    
    // 生成用户名
    let username = actualUser?.username;
    if (!username) {
      // 如果没有用户名，尝试从email中提取
      if (actualUser?.email && !isPhoneNumber(actualUser.email)) {
        username = actualUser.email.split('@')[0];
      } else {
        // 如果email是手机号或者不存在，使用默认用户名
        username = `用户_${actualUser.id?.substring(0, 8) || 'guest'}`;
      }
    }
    
    const userWithMembership = {
      id: actualUser.id,
      username: username || '用户',
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
    const token = sessionData?.access_token || userData?.token || '';
    const refreshToken = sessionData?.refresh_token || userData?.refreshToken || token || '';
    
    if (!token) {
      console.error('[handleLoginSuccess] 无法获取 token，登录可能失败');
    }
    if (!refreshToken) {
      console.warn('[handleLoginSuccess] 警告: refreshToken 为空，Supabase session 可能无法恢复');
    }
    
    safeLocalStorage.setItem('token', token);
    safeLocalStorage.setItem('refreshToken', refreshToken);
    safeLocalStorage.setItem('user', JSON.stringify(userWithMembership));
    safeLocalStorage.setItem('isAuthenticated', 'true');
    
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
      } else if (supabase && actualUser.email) {
        // 如果没有返回 session，尝试使用邮箱和密码登录 Supabase
        // 使用用户ID前20位作为密码（与登录时逻辑一致）
        const supabasePassword = actualUser.id.substring(0, 20);
        console.log('尝试使用邮箱密码登录 Supabase:', actualUser.email);
        
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: actualUser.email,
          password: supabasePassword
        });
        
        if (signInError) {
          console.warn('Supabase 登录同步失败，尝试注册新用户:', signInError.message);
          
          // 登录失败，可能是新用户，尝试注册
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: actualUser.email,
            password: supabasePassword,
            options: {
              data: {
                username: actualUser.username || actualUser.email.split('@')[0],
                avatar_url: actualUser.avatar_url || actualUser.avatar || '',
                auth_provider: 'local'
              }
            }
          });
          
          if (signUpError) {
            console.warn('Supabase 注册也失败:', signUpError.message);
          } else if (signUpData.user) {
            console.log('Supabase 用户创建成功，ID:', signUpData.user.id);
            
            // 如果 Supabase 创建的ID与后端不同，需要同步
            if (signUpData.user.id !== actualUser.id) {
              console.warn('Supabase ID 与后端 ID 不匹配，需要同步', {
                backendId: actualUser.id,
                supabaseId: signUpData.user.id
              });
              
              // 更新本地存储的用户ID为 Supabase ID
              userWithMembership.id = signUpData.user.id;
              localStorage.setItem('user', JSON.stringify(userWithMembership));
              
              // 通知后端更新用户ID
              try {
                await fetch('/api/auth/update-user-id', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    oldId: actualUser.id, 
                    newId: signUpData.user.id, 
                    email: actualUser.email 
                  }),
                });
              } catch (syncErr) {
                console.warn('同步用户ID到后端失败:', syncErr);
              }
            }
          }
        } else {
          console.log('Supabase 认证状态已同步，用户ID:', signInData.user?.id);
        }
      }
    } catch (syncError) {
      console.warn('同步 Supabase 认证状态失败:', syncError);
    }
    
    setUser(userWithMembership);
    setIsAuthenticated(true);
    
    // 检查用户信息是否完整
    const finalAvatarValue = userWithMembership.avatar_url || userWithMembership.avatar;
    const isProfileComplete = userWithMembership.username && userWithMembership.username.trim() !== '' &&
                           finalAvatarValue && finalAvatarValue.trim() !== '';
    
    eventBus.publish('auth:login', { 
      userId: userWithMembership.id, 
      user: userWithMembership,
      isProfileComplete
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

  // 注册方法 - 已简化，现在通过邮箱验证码登录自动注册
  const register = async (username: string, email: string, password: string, age?: string, tags?: string[], code?: string): Promise<{ success: boolean; error?: string }> => {
    console.warn('注册功能已整合到邮箱验证码登录中，请直接使用邮箱验证码登录');
    toast.error('注册功能已整合到邮箱验证码登录中，请直接使用邮箱验证码登录');
    return { success: false, error: '注册功能已整合到邮箱验证码登录中，请直接使用邮箱验证码登录' };
  };

  // OAuth 第三方登录方法
  const quickLogin = async (provider: 'wechat' | 'phone' | 'alipay' | 'qq' | 'weibo' | 'google' | 'github' | 'twitter' | 'discord'): Promise<boolean> => {
    // 手机号登录暂不支持
    if (provider === 'phone') {
      toast.error('手机号登录暂未开放');
      return false;
    }

    // QQ、微博、Twitter、Discord 暂不支持
    if (['qq', 'weibo', 'twitter', 'discord'].includes(provider)) {
      toast.error(`${provider} 登录暂未开放`);
      return false;
    }

    try {
      // 获取 OAuth 登录 URL
      const response = await fetch(`/api/auth/oauth/${provider}`);
      const data = await response.json();

      if (!data.success) {
        toast.error(data.error || '登录服务暂不可用');
        return false;
      }

      // 在新窗口打开 OAuth 登录页面
      const width = 500;
      const height = 600;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;

      const popup = window.open(
        data.url,
        `${provider}Login`,
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
      );

      if (!popup) {
        toast.error('请允许弹出窗口以完成登录');
        return false;
      }

      // 监听消息
      return new Promise((resolve) => {
        const handleMessage = (event: MessageEvent) => {
          // 验证消息来源
          if (event.origin !== window.location.origin) return;

          if (event.data?.type === 'oauth:success') {
            window.removeEventListener('message', handleMessage);

            // 保存用户数据
            const { user, token, isNewUser } = event.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify({ ...user, isNewUser }));
            localStorage.setItem('isAuthenticated', 'true');

            // 更新状态
            setUser({ ...user, isNewUser });
            setIsAuthenticated(true);

            toast.success(isNewUser ? '欢迎新用户！' : '登录成功！');
            resolve(true);
          } else if (event.data?.type === 'oauth:error') {
            window.removeEventListener('message', handleMessage);
            toast.error(event.data.error || '登录失败');
            resolve(false);
          }
        };

        window.addEventListener('message', handleMessage);

        // 超时处理
        setTimeout(() => {
          window.removeEventListener('message', handleMessage);
          resolve(false);
        }, 5 * 60 * 1000); // 5 分钟超时
      });
    } catch (error) {
      console.error('OAuth 登录错误:', error);
      toast.error('登录服务暂不可用');
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

  // 用户ID一致性验证方法
  const verifyUserIdConsistency = async (userId: string): Promise<boolean> => {
    try {
      // 检查Supabase session中的用户ID
      const { data: { session } = {} } = await supabase.auth.getSession();
      if (session?.user && session.user.id !== userId) {
        console.warn('用户ID一致性验证失败 (Input vs Supabase)，使用Supabase ID:', {
          inputId: userId,
          supabaseId: session.user.id
        });
        return false;
      }
      
      // 检查本地存储中的用户ID
      const localUser = safeLocalStorage.getParsedItem<User>('user');
      if (localUser && localUser.id !== userId) {
        console.warn('用户ID一致性验证失败 (Input vs Local)，需要同步:', {
          inputId: userId,
          localId: localUser.id
        });
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('用户ID一致性验证失败:', error);
      return false;
    }
  };

  // 中文注释：更新用户信息并写入本地存储和数据库
  const updateUser = async (partial: Partial<User>) => {
    // 确保avatar字段始终是字符串（优先使用avatar_url，兼容avatar）
    const safePartial = { ...partial };
    const avatarValue = safePartial.avatar_url || safePartial.avatar;
    if (avatarValue && typeof avatarValue === 'object') {
      safePartial.avatar_url = '';
      safePartial.avatar = '';
    }
    
    // 先更新本地状态
    setUser(prev => {
      const avatarValue = safePartial.avatar_url || safePartial.avatar || prev?.avatar_url || prev?.avatar;
      const safeAvatar = typeof avatarValue === 'string' ? avatarValue : '';
      const next = { 
        ...(prev || {} as User), 
        ...safePartial,
        // 确保avatar字段始终是字符串
        avatar_url: safeAvatar,
        avatar: safeAvatar // 保持兼容
      } as User;
      
      try {
        localStorage.setItem('user', JSON.stringify(next));
        // 同时更新安全存储
        securityService.setSecureItem('SECURE_USER', next);
        
        // 发布用户信息更新事件
        eventBus.publish('auth:update', { isAuthenticated: true, user: next });
      } catch (error) {
        console.error('Failed to update user information:', error);
      }
      return next;
    });
    
    // 同步到后端数据库
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // 过滤掉空字符串的手机号，避免唯一约束冲突
        const dataToSync = { ...safePartial };
        if (dataToSync.phone === '' || dataToSync.phone === null) {
          delete dataToSync.phone;
        }
        
        const updatedUser = await userService.updateUser(dataToSync);
        console.log('User information synced to database:', updatedUser);
        
        // 如果是新用户，初始化统计数据
        if (partial.isNewUser === false) {
          eventBus.publish('auth:register', { 
            userId: updatedUser.id, 
            user: updatedUser 
          });
        }
      }
    } catch (error) {
      console.error('Failed to sync user information to database:', error);
      toast.error('同步用户信息到服务器失败，请稍后重试');
    }
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
          // 根据Supabase返回的用户信息更新本地用户数据（优先使用avatar_url，兼容avatar）
          const metadataAvatar = data.user.user_metadata?.avatar_url || data.user.user_metadata?.avatar;
          const avatarUrl = metadataAvatar && metadataAvatar.trim() 
            ? metadataAvatar 
            : '';
          
          // 从数据库获取用户详细信息
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();
          
          const updatedUser = {
            id: data.user.id,
            username: data.user.user_metadata?.username || data.user.email?.split('@')[0] || '用户',
            email: data.user.email || '',
            avatar: avatarUrl,
            phone: data.user.user_metadata?.phone || '',
            interests: data.user.user_metadata?.interests || [],
            isAdmin: userData?.is_admin || data.user.user_metadata?.isAdmin || false,
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
      if (!user?.email) {
        console.error('用户邮箱不存在');
        return false;
      }
      
      // 发送验证码到用户邮箱
      const { success, error, mockCode } = await sendEmailOtp(user.email);
      
      if (success) {
        if (isDevelopment() && mockCode) {
          console.log('双因素认证验证码已发送，开发环境模拟代码:', mockCode);
        }
        return true;
      } else {
        console.error('发送验证码失败:', error);
        return false;
      }
    } catch (error) {
      console.error('启用双因素认证失败:', error);
      return false;
    }
  };

  // 新增：验证双因素认证代码
  const verifyTwoFactorCode = async (code: string): Promise<boolean> => {
    try {
      if (!user?.email) {
        console.error('用户邮箱不存在');
        return false;
      }
      
      // 验证验证码
      const success = await loginWithCode('email', user.email, code);

      if (success) {
        // 保存双因素认证状态到用户信息
        updateUser({ twoFactorEnabled: true });
        return true;
      } else {
        console.error('验证码验证失败');
        return false;
      }
    } catch (error) {
      console.error('验证双因素认证代码失败:', error);
      return false;
    }
  };

  // 新增：重新发送双因素认证验证码
  const resendTwoFactorCode = async (): Promise<boolean> => {
    try {
      if (!user?.email) {
        console.error('用户邮箱不存在');
        return false;
      }
      
      const { success, error, mockCode } = await sendEmailOtp(user.email);
      
      if (success) {
        if (isDevelopment() && mockCode) {
          console.log('双因素认证验证码已重新发送，开发环境模拟代码:', mockCode);
        }
        return true;
      } else {
        console.error('重新发送验证码失败:', error);
        return false;
      }
    } catch (error) {
      console.error('重新发送验证码失败:', error);
      return false;
    }
  };

  // 新增：禁用双因素认证
  const disableTwoFactorAuth = async (): Promise<boolean> => {
    try {
      // 保存双因素认证状态到用户信息
      updateUser({ twoFactorEnabled: false });
      return true;
    } catch (error) {
      console.error('禁用双因素认证失败:', error);
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
    resendTwoFactorCode,
    disableTwoFactorAuth,
    refreshToken,
    resetPassword,
    verifyUserIdConsistency,
    isLoading
  };

  // 返回Provider组件
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// useAuth hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
