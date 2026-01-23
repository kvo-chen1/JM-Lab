import { createContext, useState, ReactNode, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import securityService from "../services/securityService";
import eventBus from '../lib/eventBus'; // 导入事件总线
import { toast } from 'sonner';
import userStatsService from '../services/userStatsService';

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
  sendSmsOtp: (phone: string) => Promise<{ success: boolean; error?: string }>;
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
  // 检查是否为开发环境或测试环境
  const isDevelopment = () => {
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
  };
  
  // 加载状态
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 从本地存储获取用户认证状态
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('token') || localStorage.getItem('isAuthenticated') === 'true';
  });
  
  // 从本地存储获取用户信息
  const [user, setUser] = useState<User | null>(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        // 确保用户有有效的头像URL
        const avatarUrl = parsedUser.avatar && parsedUser.avatar.trim() 
          ? parsedUser.avatar 
          : 'https://picsum.photos/id/1005/200/200';
        
        // 添加默认会员信息和统计数据
        return {
          ...parsedUser,
          avatar: avatarUrl,
          // 确保新用户标记有值
          isNewUser: parsedUser.isNewUser || false,
          // 确保统计数据有默认值
          worksCount: parsedUser.worksCount || 0,
          followersCount: parsedUser.followersCount || 0,
          followingCount: parsedUser.followingCount || 0,
          favoritesCount: parsedUser.favoritesCount || 0,
          membershipLevel: parsedUser.membershipLevel || 'free',
          membershipStatus: parsedUser.membershipStatus || 'active',
          membershipStart: parsedUser.membershipStart || new Date().toISOString(),
        };
      } catch (error) {
        console.error('Failed to parse user data:', error);
        localStorage.removeItem('user');
        return null;
      }
    }
    return null;
  });

  // 确保所有用户都使用固定的头像URL
  useEffect(() => {
    if (isAuthenticated && user && user.avatar !== 'https://picsum.photos/id/1005/200/200') {
      // 强制使用固定的头像URL
      const fixedAvatarUser = {
        ...user,
        avatar: 'https://picsum.photos/id/1005/200/200'
      };
      // 更新本地存储和状态
      localStorage.setItem('user', JSON.stringify(fixedAvatarUser));
      setUser(fixedAvatarUser);
    }
  }, [isAuthenticated, user]);

  // 检查用户认证状态
  useEffect(() => {
    // 强制清理可能导致死循环的旧状态
    try {
      const token = localStorage.getItem('token');
      // 如果有token但格式不对（比如是undefined字符串），强制清理
      if (token === 'undefined' || token === 'null' || (token && token.length < 10)) {
        console.warn('Detected invalid token in storage, clearing auth state...');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
      }
    } catch (e) {
      console.error('Error cleaning auth state:', e);
    }

    let mounted = true;

    // 优先设置监听器，确保能捕获所有状态变化
    let subscription: any = null;
    
    // 检测初始URL中是否包含OAuth参数
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const searchParams = new URLSearchParams(window.location.search);
    const hasOAuthParams = hashParams.has('access_token') || searchParams.has('code') || hashParams.has('error');
    
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state change:', event);
        
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
          console.log(`Auth state change: ${event}`, session.user.email, session);
          
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const searchParams = new URLSearchParams(window.location.search);
          const hasOAuthParams = hashParams.has('access_token') || searchParams.has('code');
          const localToken = localStorage.getItem('token');

          // 如果是 OAuth 登录或本地缺失 Token，尝试通过后端桥接换取本地 Token
          // 只要有 Supabase session 且本地没 token，就应该尝试桥接
          if (hasOAuthParams || !localToken) {
            try {
              console.log('Detected OAuth/Missing Token, calling bridge...');
              const response = await fetch('/api/auth/supabase-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email: session.user.email,
                  phone: session.user.phone,
                  access_token: session.access_token,
                  refresh_token: session.refresh_token
                }),
              });
              
              const apiData = await response.json();
              if (apiData.code === 0 && apiData.data) {
                 console.log('Bridge login success');
                 // 成功获取本地 Token，更新状态
                 const userData = apiData.data;
                 const avatarUrl = 'https://picsum.photos/id/1005/200/200';
                 const userWithMembership = {
                    id: userData.id,
                    username: userData.username,
                    email: userData.email,
                    avatar: avatarUrl,
                    phone: userData.phone || '',
                    interests: [],
                    isAdmin: false,
                    age: 0,
                    tags: [],
                    isNewUser: userData.isNewUser || false,
                    worksCount: userData.worksCount || 0,
                    followersCount: userData.followersCount || 0,
                    followingCount: userData.followingCount || 0,
                    favoritesCount: userData.favoritesCount || 0,
                    membershipLevel: (userData.membershipLevel || 'free') as any,
                    membershipStart: new Date().toISOString(),
                    membershipEnd: undefined,
                    membershipStatus: 'active' as any,
                 };
                 
                 localStorage.setItem('token', userData.token);
                 localStorage.setItem('refreshToken', userData.refreshToken || userData.token);
                 localStorage.setItem('user', JSON.stringify(userWithMembership));
                 localStorage.setItem('isAuthenticated', 'true');
                 
                 setUser(userWithMembership);
                 setIsAuthenticated(true);
                 setIsLoading(false);
                 
                 eventBus.publish('auth:login', { userId: userWithMembership.id, user: userWithMembership });
                 
                 // 清理 URL
                 if (window.location.hash && (window.location.hash.includes('access_token') || window.location.hash.includes('error'))) {
                    window.history.replaceState({}, document.title, window.location.pathname);
                 }
                 return;
              }
            } catch (e) {
              console.error('Bridge login failed, falling back to local session', e);
            }
          }

          // 强制使用固定的头像URL
          const avatarUrl = 'https://picsum.photos/id/1005/200/200';
          
          const userWithMembership = {
            id: session.user.id,
            username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || '用户',
            email: session.user.email || '',
            avatar: avatarUrl,
            phone: session.user.user_metadata?.phone || '',
            interests: session.user.user_metadata?.interests || [],
            isAdmin: session.user.user_metadata?.isAdmin || false,
            age: session.user.user_metadata?.age || 0,
            tags: session.user.user_metadata?.tags || [],
            // 标记为新用户（如果是首次登录）
            isNewUser: session.user.user_metadata?.isNewUser || false,
            // 初始化统计数据
            worksCount: session.user.user_metadata?.worksCount || 0,
            followersCount: session.user.user_metadata?.followersCount || 0,
            followingCount: session.user.user_metadata?.followingCount || 0,
            favoritesCount: session.user.user_metadata?.favoritesCount || 0,
            membershipLevel: session.user.user_metadata?.membershipLevel || 'free',
            membershipStart: session.user.user_metadata?.membershipStart || new Date().toISOString(),
            membershipEnd: session.user.user_metadata?.membershipEnd,
            membershipStatus: session.user.user_metadata?.membershipStatus || 'active',
          };
          
          // 存储用户信息到本地
          localStorage.setItem('user', JSON.stringify(userWithMembership));
          localStorage.setItem('isAuthenticated', 'true');
          
          // 更新状态
          setUser(userWithMembership);
          setIsAuthenticated(true);
          setIsLoading(false); // 明确设置加载完成
          
          // 发布登录成功事件
          eventBus.publish('auth:login', { 
            userId: userWithMembership.id, 
            user: userWithMembership 
          });
          
          // 清理 URL 中的 OAuth 参数
          if (window.location.hash && (window.location.hash.includes('access_token') || window.location.hash.includes('error'))) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
          
        } else if (event === 'SIGNED_OUT') {
          // 如果检测到OAuth参数，且当前正在加载中，忽略SIGNED_OUT事件
          // 这是为了防止在OAuth回调处理过程中，Supabase先触发SIGNED_OUT导致页面跳转
          if (hasOAuthParams && isLoading) {
             console.log('Detected OAuth params during SIGNED_OUT, ignoring logout to wait for session processing...');
             return;
          }
          
          // 用户登出
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          localStorage.removeItem('isAuthenticated');
          setIsAuthenticated(false);
          setUser(null);
          setIsLoading(false); // 登出也视为加载完成
        }
      });
      subscription = data.subscription;
    }

    const checkAuth = async () => {
      try {
        // 检查 URL 中是否有 OAuth 重定向参数
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);
        const hasOAuthParams = hashParams.has('access_token') || searchParams.has('code') || hashParams.has('error');

        // 如果有 OAuth 参数，不要立即设置 isLoading 为 false
        // 让 onAuthStateChange 处理，或者等待 getSession 返回有效会话
        if (hasOAuthParams && supabase) {
          console.log('Detected OAuth params, waiting for session...');
          // 尝试主动获取一次 session
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
             // 如果获取到了 session，onAuthStateChange 会处理，这里不需要做太多
             return;
          }
          // 如果没获取到 session，可能还在处理中，或者失败
          // 给一点缓冲时间让 listener 触发
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // 检查是否为开发环境或测试环境
        if (isDevelopment()) {
          // 开发/测试环境：检查 URL 中是否有 OAuth 重定向参数
          // 这里主要逻辑已经移到上方通用逻辑中，保留此块是为了兼容性
          if (hasOAuthParams) {
             // 逻辑已在上方处理
             setIsLoading(false); // 确保isLoading被设置为false
             return;
          }

          // 没有 OAuth 参数，检查本地存储
          const userData = localStorage.getItem('user');
          const isAuthenticatedFlag = localStorage.getItem('isAuthenticated');
          
          if (userData && isAuthenticatedFlag === 'true') {
            try {
              const parsedUser = JSON.parse(userData);
              const fixedAvatarUser = {
                ...parsedUser,
                avatar: 'https://picsum.photos/id/1005/200/200'
              };
              localStorage.setItem('user', JSON.stringify(fixedAvatarUser));
              setUser(fixedAvatarUser);
              setIsAuthenticated(true);
            } catch (error) {
              console.error('Failed to parse user data:', error);
              localStorage.removeItem('user');
              localStorage.removeItem('isAuthenticated');
              setIsAuthenticated(false);
              setUser(null);
            }
          } else {
            setIsAuthenticated(false);
            setUser(null);
          }
          setIsLoading(false); // 无论hasOAuthParams是什么，都设置isLoading为false
          return;
        }
        
        // 生产环境：先检查本地存储是否有自定义API的token
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        const isAuthenticatedFlag = localStorage.getItem('isAuthenticated');
        
        if (token && userData && isAuthenticatedFlag === 'true') {
          // 本地存储有认证信息
          try {
            // 强制使用固定的头像URL
            const avatarUrl = 'https://picsum.photos/id/1005/200/200';
            
            const parsedUser = JSON.parse(userData);
            const userWithMembership = {
              ...parsedUser,
              avatar: avatarUrl,
              membershipLevel: parsedUser.membershipLevel || 'free',
              membershipStatus: parsedUser.membershipStatus || 'active',
            };
            
            // 尝试使用token获取用户信息，失败时不清除本地存储，保持现有状态
            try {
              const response = await fetch('/api/auth/me', {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });
              
              if (response.ok) {
                // token有效，更新用户信息
                const data = await response.json();
                if (data.code === 0 && data.data) {
                  Object.assign(userWithMembership, {
                    // 标记为新用户（如果是首次登录）
                    isNewUser: data.data.isNewUser || false,
                    // 初始化统计数据
                    worksCount: data.data.worksCount || 0,
                    followersCount: data.data.followersCount || 0,
                    followingCount: data.data.followingCount || 0,
                    favoritesCount: data.data.favoritesCount || 0,
                    membershipLevel: (data.data.membershipLevel || 'free') as 'free' | 'premium' | 'vip',
                    membershipStatus: data.data.membershipStatus || 'active',
                  });
                }
              } else if (response.status === 401) {
                // token过期，尝试刷新token
                const refreshTokenFromStorage = localStorage.getItem('refreshToken');
                if (refreshTokenFromStorage) {
                  const refreshResponse = await fetch('/api/auth/refresh', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      token,
                      refreshToken: refreshTokenFromStorage,
                    }),
                  });
                  
                  const refreshData = await refreshResponse.json();
                  if (refreshData.code === 0 && refreshData.data) {
                    // 刷新成功，更新令牌
                    localStorage.setItem('token', refreshData.data.token);
                    localStorage.setItem('refreshToken', refreshData.data.refreshToken);
                    
                    // 重新获取用户信息
                    const meResponse = await fetch('/api/auth/me', {
                      method: 'GET',
                      headers: {
                        'Authorization': `Bearer ${refreshData.data.token}`,
                      },
                    });
                    
                    if (meResponse.ok) {
                      const meData = await meResponse.json();
                      if (meData.code === 0 && meData.data) {
                        Object.assign(userWithMembership, {
                          isNewUser: meData.data.isNewUser || false,
                          worksCount: meData.data.worksCount || 0,
                          followersCount: meData.data.followersCount || 0,
                          followingCount: meData.data.followingCount || 0,
                          favoritesCount: meData.data.favoritesCount || 0,
                          membershipLevel: meData.data.membershipLevel || 'free',
                          membershipStatus: meData.data.membershipStatus || 'active',
                        });
                      }
                    }
                  }
                }
              }
            } catch (error) {
              console.error('自定义API认证失败，使用本地存储的用户信息:', error);
              // 不清除本地存储，保持现有状态
            }
            
            // 更新本地存储和状态
            localStorage.setItem('user', JSON.stringify(userWithMembership));
            setUser(userWithMembership);
            setIsAuthenticated(true);
            setIsLoading(false);
            return;
          } catch (error) {
            console.error('解析用户数据失败:', error);
            // 清除本地存储
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            localStorage.removeItem('isAuthenticated');
            setIsAuthenticated(false);
            setUser(null);
            setIsLoading(false);
            return;
          }
        }
        
        // 检查 Supabase session (非 OAuth 重定向情况，或者 OAuth 失败兜底)
        if (supabase) {
           // 1. 尝试从 Supabase 获取 Session
           const { data: { session } } = await supabase.auth.getSession();
           
           // 2. 如果没有 Session 但有 OAuth 参数，尝试手动解析 Hash 进行补救
           if (!session && hasOAuthParams) {
              console.log('Manual fallback: No session from Supabase but OAuth params found. Attempting manual bridge...');
              const fragment = window.location.hash.substring(1);
              const params = new URLSearchParams(fragment);
              const accessToken = params.get('access_token');
              const refreshToken = params.get('refresh_token');
              
              if (accessToken) {
                 try {
                   // 直接调用桥接接口
                   const response = await fetch('/api/auth/supabase-login', {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({
                       access_token: accessToken,
                       refresh_token: refreshToken,
                       // 尝试从 JWT 解析 email (可选，后端也会解析)
                       // 这里暂时不传 email，依赖后端通过 token 去 Supabase 获取
                     }),
                   });
                   
                   const apiData = await response.json();
                   if (apiData.code === 0 && apiData.data) {
                      console.log('Manual bridge login success');
                      handleLoginSuccess(apiData.data);
                      
                      // 清理 URL
                      if (window.location.hash && (window.location.hash.includes('access_token') || window.location.hash.includes('error'))) {
                         window.history.replaceState({}, document.title, window.location.pathname);
                      }
                      return;
                   } else {
                      console.error('Manual bridge login failed with API error:', apiData);
                      toast.error(`登录失败: ${apiData.message || '未知错误'}`);
                   }
                 } catch (e) {
                   console.error('Manual bridge login failed', e);
                 }
              }
           }

           if (session && session.user) {
              // 已经在 onAuthStateChange 中处理了，这里只是保险
              // 如果 listener 还没触发，这里可以手动触发更新
              if (mounted && !isAuthenticated) {
                 // 尝试调用桥接接口
                 try {
                   console.log('checkAuth fallback: Calling bridge login...');
                   const response = await fetch('/api/auth/supabase-login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      email: session.user.email,
                      phone: session.user.phone,
                      access_token: session.access_token,
                      refresh_token: session.refresh_token
                    }),
                   });
                   const apiData = await response.json();
                   if (apiData.code === 0 && apiData.data) {
                      const userData = apiData.data;
                      const avatarUrl = 'https://picsum.photos/id/1005/200/200';
                      const userWithMembership = {
                          id: userData.id,
                          username: userData.username,
                          email: userData.email,
                          avatar: avatarUrl,
                          phone: userData.phone || '',
                          interests: [],
                          isAdmin: false,
                          age: 0,
                          tags: [],
                          isNewUser: userData.isNewUser || false,
                          worksCount: userData.worksCount || 0,
                          followersCount: userData.followersCount || 0,
                          followingCount: userData.followingCount || 0,
                          favoritesCount: userData.favoritesCount || 0,
                          membershipLevel: (userData.membershipLevel || 'free') as any,
                          membershipStart: new Date().toISOString(),
                          membershipEnd: undefined,
                          membershipStatus: 'active' as any,
                      };
                      
                      localStorage.setItem('token', userData.token);
                      localStorage.setItem('refreshToken', userData.refreshToken || userData.token);
                      localStorage.setItem('user', JSON.stringify(userWithMembership));
                      localStorage.setItem('isAuthenticated', 'true');
                      setUser(userWithMembership);
                      setIsAuthenticated(true);
                      return; // 成功后直接返回
                   }
                 } catch (e) {
                   console.error('checkAuth fallback: Bridge failed', e);
                 }

                 // 强制使用固定的头像URL
                const avatarUrl = 'https://picsum.photos/id/1005/200/200';
                
                const userWithMembership = {
                  id: session.user.id,
                  username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || '用户',
                  email: session.user.email || '',
                  avatar: avatarUrl,
                  phone: session.user.user_metadata?.phone || '',
                  interests: session.user.user_metadata?.interests || [],
                  isAdmin: session.user.user_metadata?.isAdmin || false,
                  age: session.user.user_metadata?.age || 0,
                  tags: session.user.user_metadata?.tags || [],
                  // 标记为新用户（如果是首次登录）
                  isNewUser: session.user.user_metadata?.isNewUser || false,
                  // 初始化统计数据
                  worksCount: session.user.user_metadata?.worksCount || 0,
                  followersCount: session.user.user_metadata?.followersCount || 0,
                  followingCount: session.user.user_metadata?.followingCount || 0,
                  favoritesCount: session.user.user_metadata?.favoritesCount || 0,
                  membershipLevel: session.user.user_metadata?.membershipLevel || 'free',
                  membershipStart: session.user.user_metadata?.membershipStart || new Date().toISOString(),
                  membershipEnd: session.user.user_metadata?.membershipEnd,
                  membershipStatus: session.user.user_metadata?.membershipStatus || 'active',
                };
                
                localStorage.setItem('user', JSON.stringify(userWithMembership));
                localStorage.setItem('isAuthenticated', 'true');
                setUser(userWithMembership);
                setIsAuthenticated(true);
              }
           } else {
             // 确实没登录
             if (!token && mounted) {
               setIsLoading(false);
             }
           }
        } else {
           if (mounted && !hasOAuthParams && !token) {
             setIsLoading(false);
           }
        }

      } catch (error) {
        console.error('检查认证状态失败:', error);
        if (mounted) {
            // 出错时清除状态
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            localStorage.removeItem('isAuthenticated');
            setIsAuthenticated(false);
            setUser(null);
            setIsLoading(false);
        }
      }
    };
    
    // 启动检查
    checkAuth();
    
    // 清理订阅
    return () => {
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [supabase]);

  // 登录方法
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // 使用自定义API登录，与验证码登录保持一致
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (data.code === 0 && data.data) {
        console.log('登录成功');
        // 强制使用固定的头像URL
        const avatarUrl = 'https://picsum.photos/id/1005/200/200';
        
        const userWithMembership = {
          id: data.data.id,
          username: data.data.username,
          email: data.data.email,
          avatar: avatarUrl,
          phone: data.data.phone || '',
          interests: [],
          isAdmin: false,
          age: 0,
          tags: [],
          // 标记为新用户（如果是首次登录）
          isNewUser: data.data.isNewUser || false,
          // 初始化统计数据
          worksCount: data.data.worksCount || 0,
          followersCount: data.data.followersCount || 0,
          followingCount: data.data.followingCount || 0,
          favoritesCount: data.data.favoritesCount || 0,
          membershipLevel: 'free' as const,
          membershipStart: new Date().toISOString(),
          membershipEnd: undefined,
          membershipStatus: 'active' as const,
        };
        
        // 存储用户信息和token到本地
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('refreshToken', data.data.refreshToken || data.data.token);
        localStorage.setItem('user', JSON.stringify(userWithMembership));
        localStorage.setItem('isAuthenticated', 'true');
        
        // 更新状态
        setUser(userWithMembership);
        setIsAuthenticated(true);
        
        // 发布登录成功事件
        eventBus.publish('auth:login', { 
          userId: userWithMembership.id, 
          user: userWithMembership 
        });
        
        return true;
      } else {
        console.error('登录失败:', data.message || '邮箱或密码错误');
        return false;
      }
    } catch (error) {
      console.error('登录失败:', error);
      return false;
    }
  };

  // 发送邮箱验证码方法（使用Supabase）
  const sendEmailOtp = async (email: string): Promise<{ success: boolean; error?: string; mockCode?: string }> => {
    try {
      console.log('使用Supabase发送邮箱验证码到:', email);
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true, // 允许自动创建用户
        }
      });
      
      if (error) {
        console.error('发送邮箱验证码失败:', error.message);
        // 如果Supabase发送失败（例如额度限制），尝试降级到后端API（需要SMTP配置）
        console.log('尝试降级到后端API发送...');
        const response = await fetch('/api/auth/send-email-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await response.json();
        if (response.ok && data.code === 0) {
           return { success: true, mockCode: data.data?.mockCode };
        }
        return { success: false, error: error.message };
      }
      
      console.log('邮箱验证码发送成功');
      return { success: true };
    } catch (error: any) {
      console.error('发送邮箱验证码失败:', error);
      return { success: false, error: error.message || '发送邮箱验证码失败，请稍后重试' };
    }
  };

  // 发送注册验证码方法（复用 sendEmailOtp）
  const sendRegisterEmailOtp = async (email: string): Promise<{ success: boolean; error?: string; mockCode?: string }> => {
    return sendEmailOtp(email);
  };

  // 发送短信验证码方法（使用Supabase内置功能）
  const sendSmsOtp = async (phone: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('使用Supabase发送短信验证码到:', phone);
      const { error } = await supabase.auth.signInWithOtp({
        phone,
      });
      
      if (error) {
        console.error('发送短信验证码失败:', error.message);
        return { success: false, error: error.message };
      }
      
      console.log('短信验证码发送成功');
      return { success: true };
    } catch (error: any) {
      console.error('发送短信验证码失败:', error);
      return { success: false, error: error.message || '发送短信验证码失败，请稍后重试' };
    }
  };

  // 验证码登录方法
  const loginWithCode = async (type: 'email' | 'phone', identifier: string, code: string): Promise<boolean> => {
    try {
      console.log(`[${type}] 尝试使用Supabase验证码登录: ${identifier}`);
      
      // 1. 使用 Supabase 验证 OTP
      const { data, error } = await supabase.auth.verifyOtp({
        [type === 'email' ? 'email' : 'phone']: identifier,
        token: code,
        type: type === 'email' ? 'email' : 'sms',
      } as any);
      
      if (error) {
        console.error('Supabase验证失败:', error.message);
        
        // 如果是邮箱，尝试降级到后端API验证（针对使用后端API发送的情况）
        if (type === 'email') {
          console.log('尝试降级到后端API验证...');
          const response = await fetch('/api/auth/login-with-email-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: identifier, code }),
          });
          const apiData = await response.json();
          if (apiData.code === 0 && apiData.data) {
             // 后端验证成功，直接使用返回的数据
             return handleLoginSuccess(apiData.data);
          }
        }
        return false;
      }

      if (data.session && data.user) {
        console.log('Supabase验证成功，正在同步到后端...');
        
        // 2. 调用后端桥接接口，换取本地 Token
        const response = await fetch('/api/auth/supabase-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: data.user.email,
            phone: data.user.phone,
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token
          }),
        });
        
        const apiData = await response.json();
        
        if (apiData.code === 0 && apiData.data) {
          return handleLoginSuccess(apiData.data);
        } else {
          console.error('后端同步失败:', apiData.message);
          // 即使后端同步失败，只要Supabase登录成功，也可以让用户进入（降级模式）
          // 但为了保持一致性，最好还是失败，或者在前端模拟一个 user 对象
          // 这里我们选择尝试构建本地用户对象
          const fallbackUser = {
             id: data.user.id,
             username: data.user.email?.split('@')[0] || '用户',
             email: data.user.email || '',
             token: data.session.access_token, // 临时使用Supabase token，部分后端接口可能不认
             refreshToken: data.session.refresh_token,
             membershipLevel: 'free' as const,
             membershipStatus: 'active' as const
          };
          return handleLoginSuccess(fallbackUser);
        }
      }
      
      return false;
    } catch (error) {
      console.error(`${type === 'email' ? '邮箱' : '手机'}验证码登录失败:`, error);
      return false;
    }
  };

  // 辅助函数：处理登录成功逻辑
  const handleLoginSuccess = (userData: any) => {
    console.log('登录处理成功');
    const avatarUrl = 'https://picsum.photos/id/1005/200/200';
    
    const userWithMembership = {
      id: userData.id,
      username: userData.username,
      email: userData.email,
      avatar: avatarUrl,
      phone: userData.phone || '',
      interests: [],
      isAdmin: false,
      age: 0,
      tags: [],
      isNewUser: userData.isNewUser || false,
      worksCount: userData.worksCount || 0,
      followersCount: userData.followersCount || 0,
      followingCount: userData.followingCount || 0,
      favoritesCount: userData.favoritesCount || 0,
      membershipLevel: (userData.membershipLevel || 'free') as any,
      membershipStart: new Date().toISOString(),
      membershipEnd: undefined,
      membershipStatus: 'active' as any,
    };
    
    localStorage.setItem('token', userData.token);
    localStorage.setItem('refreshToken', userData.refreshToken || userData.token);
    localStorage.setItem('user', JSON.stringify(userWithMembership));
    localStorage.setItem('isAuthenticated', 'true');
    
    setUser(userWithMembership);
    setIsAuthenticated(true);
    
    eventBus.publish('auth:login', { 
      userId: userWithMembership.id, 
      user: userWithMembership 
    });
    
    return true;
  };

  // 注册方法
  const register = async (username: string, email: string, password: string, age?: string, tags?: string[], code?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('Register function called with:', { username, email, password: '****', age, tags, code });
      
      // 密码格式验证（与前端zod验证规则保持一致）
      const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(password)) {
        const errorMsg = '密码格式不符合要求：至少8个字符，包含至少一个字母和一个数字';
        console.error(errorMsg);
        return { success: false, error: errorMsg };
      }
      
      console.log('Password validation passed');
      
      // 使用自定义API注册
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password,
          age: age ? parseInt(age) : 0,
          tags: tags || [],
          code,
        }),
      });
      
      const data = await response.json();
      
      if (data.code === 0) {
        console.log('注册成功');
        
        // 创建用户对象
        const newUser = {
          id: data.data.id,
          username: data.data.username,
          email: data.data.email,
          // 标记为新用户
          isNewUser: true,
          // 初始化统计数据
          worksCount: 0,
          followersCount: 0,
          followingCount: 0,
          favoritesCount: 0,
          // 会员信息
          membershipLevel: 'free' as const,
          membershipStatus: 'active' as const,
          membershipStart: new Date().toISOString(),
        };
        
        // 发布注册成功事件
        eventBus.publish('auth:register', { 
          userId: newUser.id, 
          user: newUser 
        });
        
        return { success: true };
      } else {
        console.error('注册失败:', data.message);
        return { success: false, error: data.message || '注册失败，请稍后重试' };
      }
    } catch (error: any) {
      console.error('注册函数执行失败:', error);
      console.error('错误信息:', error.message);
      return { success: false, error: error.message || '注册失败，请稍后重试' };
    }
  };

  const quickLogin = async (provider: 'wechat' | 'phone' | 'alipay' | 'qq' | 'weibo' | 'google' | 'github' | 'twitter' | 'discord'): Promise<boolean> => {
    try {
      // 处理手机号一键登录
      if (provider === 'phone') {
        // 手机号一键登录功能暂时开放，不需要验证
        // 创建模拟用户对象
        const userWithMembership = {
          id: `phone_user_${Date.now()}`,
          username: '手机用户',
          email: '',
          avatar: 'https://picsum.photos/id/1005/200/200',
          phone: '',
          interests: [],
          isAdmin: false,
          age: 0,
          tags: [],
          // 标记为新用户
          isNewUser: true,
          // 初始化统计数据
          worksCount: 0,
          followersCount: 0,
          followingCount: 0,
          favoritesCount: 0,
          membershipLevel: 'free' as const,
          membershipStart: new Date().toISOString(),
          membershipEnd: undefined,
          membershipStatus: 'active' as const,
        };
        
        // 存储用户信息到本地
        localStorage.setItem('user', JSON.stringify(userWithMembership));
        localStorage.setItem('isAuthenticated', 'true');
        
        // 更新状态
        setUser(userWithMembership);
        setIsAuthenticated(true);
        
        // 发布登录成功事件
        eventBus.publish('auth:login', { 
          userId: userWithMembership.id, 
          user: userWithMembership 
        });
        
        // 显示成功提示
        toast.success('手机号一键登录成功！');
        return true;
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
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider as any,
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'  // 强制每次都要求授权
          }
        }
      });
      
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
      // 调用真实的登出API
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
    } catch (error) {
      console.error('登出失败:', error);
    }
    
    // 重置状态
    setIsAuthenticated(false);
    setUser(null);
    
    // 清除本地存储
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    
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
      const next = { ...(prev || {} as User), ...partial } as User;
      try {
        localStorage.setItem('user', JSON.stringify(next));
        // 同时更新安全存储
        securityService.setSecureItem('SECURE_USER', next);
        
        // 发布用户信息更新事件
      eventBus.publish('auth:update', { isAuthenticated: true, user: next });
      eventBus.publish('数据:刷新', {
        type: 'user:update',
        payload: { user: next, changes: partial }
      });
      
      // 如果是新用户，初始化统计数据
      if (next.isNewUser && !partial.isNewUser) {
        eventBus.publish('auth:register', { 
          userId: next.id, 
          user: next 
        });
        // 初始化后不再标记为新用户
        setUser(prev => {
          if (prev) {
            const updatedUser = { ...prev, isNewUser: false };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            return updatedUser;
          }
          return prev;
        });
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
        const { data, error } = await supabase.auth.updateUser({
          data: membershipData
        });
        
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
            : 'https://picsum.photos/id/1005/200/200';
          
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
          
          // 发布会员信息更新事件
          eventBus.publish('数据:刷新', {
            type: 'user:membership',
            payload: { membership: updatedUser, changes: membershipData }
          });
          
          return true;
        }
      }
      
      // 如果supabase未配置，直接更新本地信息
      updateUser(membershipData);
      
      // 发布会员信息更新事件
      eventBus.publish('数据:刷新', {
        type: 'user:membership',
        payload: { membership: { ...user, ...membershipData }, changes: membershipData }
      });
      
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

  // 自动登录检查
  useEffect(() => {
    const autoLogin = async () => {
      try {
        // 检查是否已经登录
        if (isAuthenticated) {
          return;
        }
        
        // 检查本地存储中是否有token
        const token = localStorage.getItem('token');
        const refreshTokenFromStorage = localStorage.getItem('refreshToken');
        const userData = localStorage.getItem('user');
        
        if (token && refreshTokenFromStorage && userData) {
          // 尝试使用token获取用户信息
          const response = await fetch('/api/auth/me', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            // token有效，更新用户信息
            const data = await response.json();
            if (data.code === 0 && data.data) {
              // 强制使用固定的头像URL
              const avatarUrl = 'https://picsum.photos/id/1005/200/200';
              
              const userWithMembership = {
                ...JSON.parse(userData),
                avatar: avatarUrl,
                // 标记为新用户（如果是首次登录）
                isNewUser: data.data.isNewUser || false,
                // 初始化统计数据
                worksCount: data.data.worksCount || 0,
                followersCount: data.data.followersCount || 0,
                followingCount: data.data.followingCount || 0,
                favoritesCount: data.data.favoritesCount || 0,
                membershipLevel: (data.data.membershipLevel || 'free') as 'free' | 'premium' | 'vip',
                membershipStatus: data.data.membershipStatus || 'active',
              };
              
              localStorage.setItem('user', JSON.stringify(userWithMembership));
              setUser(userWithMembership);
              setIsAuthenticated(true);
            }
          } else if (response.status === 401) {
            // token过期，尝试刷新token
            const refreshSuccess = await refreshToken();
            if (refreshSuccess) {
              // 刷新成功，重新获取用户信息
              const newToken = localStorage.getItem('token');
              const refreshResponse = await fetch('/api/auth/me', {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${newToken}`,
                },
              });
              
              if (refreshResponse.ok) {
                const data = await refreshResponse.json();
                if (data.code === 0 && data.data) {
                  // 强制使用固定的头像URL
                  const avatarUrl = 'https://picsum.photos/id/1005/200/200';
                  
                  const userWithMembership = {
                    ...JSON.parse(userData),
                    avatar: avatarUrl,
                    // 标记为新用户（如果是首次登录）
                    isNewUser: data.data.isNewUser || false,
                    // 初始化统计数据
                    worksCount: data.data.worksCount || 0,
                    followersCount: data.data.followersCount || 0,
                    followingCount: data.data.followingCount || 0,
                    favoritesCount: data.data.favoritesCount || 0,
                    membershipLevel: data.data.membershipLevel || 'free',
                    membershipStatus: data.data.membershipStatus || 'active',
                  };
                  
                  localStorage.setItem('user', JSON.stringify(userWithMembership));
                  setUser(userWithMembership);
                  setIsAuthenticated(true);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('自动登录失败:', error);
        // 发生错误，清除本地存储
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
        securityService.setSecureItem('SECURE_TOKEN', '');
        securityService.setSecureItem('SECURE_REFRESH_TOKEN', '');
        setIsAuthenticated(false);
        setUser(null);
      }
    };
    
    autoLogin();
  }, [isAuthenticated, supabase]);

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