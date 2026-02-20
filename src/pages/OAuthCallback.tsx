import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useTheme } from '@/hooks/useTheme';

/**
 * OAuth 回调处理页面
 * 处理微信、支付宝、GitHub、Google 等第三方登录回调
 */
export default function OAuthCallback() {
  const { provider } = useParams<{ provider: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('正在处理登录...');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setMessage(`登录失败: ${error}`);
      toast.error('登录失败，请重试');
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    if (!code || !state) {
      setStatus('error');
      setMessage('缺少必要的登录参数');
      toast.error('登录参数错误');
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    // 处理 OAuth 回调
    handleOAuthCallback(code, state);
  }, [searchParams, navigate]);

  const handleOAuthCallback = async (code: string, state: string) => {
    try {
      const response = await fetch(`/api/auth/oauth/callback/${provider}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code, state })
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setMessage('登录成功！');
        toast.success(data.isNewUser ? '欢迎新用户！' : '登录成功！');

        // 检查是否是弹窗登录
        if (window.opener) {
          // 向父窗口发送登录成功消息
          window.opener.postMessage({
            type: 'oauth:success',
            user: data.user,
            token: data.token,
            isNewUser: data.isNewUser
          }, window.location.origin);

          // 关闭弹窗
          setTimeout(() => window.close(), 1500);
        } else {
          // 直接访问，保存用户信息并跳转
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          localStorage.setItem('isAuthenticated', 'true');

          // 跳转到首页或完善信息页面
          if (data.isNewUser) {
            setTimeout(() => navigate('/complete-profile'), 1500);
          } else {
            setTimeout(() => navigate('/'), 1500);
          }
        }
      } else {
        setStatus('error');
        setMessage(data.error || '登录失败');
        toast.error(data.error || '登录失败');

        if (window.opener) {
          // 向父窗口发送登录失败消息
          window.opener.postMessage({
            type: 'oauth:error',
            error: data.error || '登录失败'
          }, window.location.origin);
          setTimeout(() => window.close(), 3000);
        } else {
          setTimeout(() => navigate('/login'), 3000);
        }
      }
    } catch (error) {
      console.error('OAuth 回调处理错误:', error);
      setStatus('error');
      setMessage('登录处理失败，请稍后重试');
      toast.error('登录处理失败');

      if (window.opener) {
        window.opener.postMessage({
          type: 'oauth:error',
          error: '登录处理失败'
        }, window.location.origin);
        setTimeout(() => window.close(), 3000);
      } else {
        setTimeout(() => navigate('/login'), 3000);
      }
    }
  };

  const getProviderName = () => {
    const names: Record<string, string> = {
      wechat: '微信',
      alipay: '支付宝',
      github: 'GitHub',
      google: 'Google'
    };
    return names[provider || ''] || provider;
  };

  const getProviderColor = () => {
    const colors: Record<string, string> = {
      wechat: 'from-green-500 to-teal-400',
      alipay: 'from-blue-500 to-blue-400',
      github: 'from-gray-800 to-gray-600',
      google: 'from-red-500 to-orange-400'
    };
    return colors[provider || ''] || 'from-gray-600 to-gray-400';
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[40rem] h-[40rem] bg-gradient-to-br from-red-600 to-purple-600 opacity-10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-[40rem] h-[40rem] bg-gradient-to-tr from-blue-600 to-teal-400 opacity-10 rounded-full blur-3xl" style={{ animationDelay: '2s' }}></div>
      </div>

      <motion.div
        className={`relative z-10 w-full max-w-md ${isDark ? 'bg-gray-800/90' : 'bg-white/95'} rounded-2xl shadow-2xl p-8 border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center">
          {/* 提供商图标 */}
          <motion.div
            className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${getProviderColor()} flex items-center justify-center shadow-lg`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            {provider === 'wechat' && <i className="fab fa-weixin text-4xl text-white"></i>}
            {provider === 'alipay' && <i className="fab fa-alipay text-4xl text-white"></i>}
            {provider === 'github' && <i className="fab fa-github text-4xl text-white"></i>}
            {provider === 'google' && <i className="fab fa-google text-4xl text-white"></i>}
          </motion.div>

          {/* 状态图标 */}
          <motion.div
            className="mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {status === 'processing' && (
              <div className="inline-flex items-center justify-center w-16 h-16">
                <motion.div
                  className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              </div>
            )}
            {status === 'success' && (
              <motion.div
                className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <i className="fas fa-check text-3xl text-green-500"></i>
              </motion.div>
            )}
            {status === 'error' && (
              <motion.div
                className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <i className="fas fa-times text-3xl text-red-500"></i>
              </motion.div>
            )}
          </motion.div>

          {/* 标题 */}
          <motion.h2
            className="text-2xl font-bold mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {getProviderName()} 登录
          </motion.h2>

          {/* 状态消息 */}
          <motion.p
            className={`text-lg ${status === 'error' ? 'text-red-500' : status === 'success' ? 'text-green-500' : 'text-gray-600 dark:text-gray-300'}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {message}
          </motion.p>

          {/* 返回登录页链接 */}
          {status === 'error' && (
            <motion.button
              className="mt-6 px-6 py-2 bg-gradient-to-r from-red-600 to-purple-600 text-white rounded-lg font-medium hover:from-red-700 hover:to-purple-700 transition-all"
              onClick={() => navigate('/login')}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              返回登录页
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
