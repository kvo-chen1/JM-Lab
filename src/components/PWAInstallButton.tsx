import React, { useEffect, useState } from 'react';

// 为BeforeInstallPromptEvent添加类型声明
declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{
      outcome: 'accepted' | 'dismissed';
      platform: string;
    }>;
  }

  interface WindowEventMap {
    'beforeinstallprompt': BeforeInstallPromptEvent;
    'appinstalled': Event;
  }
}

interface PWAInstallButtonProps {
  asMenuItem?: boolean;
  isDark?: boolean;
  hideFixedButton?: boolean;
  forceShow?: boolean;
  variant?: 'default' | 'menu' | 'dashboard';
}

const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ 
  asMenuItem = false, 
  isDark = false, 
  hideFixedButton = false, 
  forceShow = false,
  variant: propVariant
}) => {
  const variant = propVariant || (asMenuItem ? 'menu' : 'default');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [installStatus, setInstallStatus] = useState<'idle' | 'installing' | 'installed' | 'dismissed'>('idle');

  useEffect(() => {
    // 如果强制显示，直接显示安装引导
    if (forceShow) {
      setShowInstallButton(true);
      setShowGuide(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // 阻止 Chrome 67 及更早版本自动显示安装提示
      e.preventDefault();
      // 保存事件，以便稍后触发安装
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // 显示安装按钮
      setShowInstallButton(true);
      // 显示安装引导
      setShowGuide(true);
      console.log('✅ 捕获到beforeinstallprompt事件，可以安装应用');
    };

    const handleAppInstalled = () => {
      // 应用已安装，隐藏安装按钮
      setDeferredPrompt(null);
      setShowInstallButton(false);
      setShowGuide(false);
      setInstallStatus('installed');
      // 3秒后隐藏安装状态
      setTimeout(() => setInstallStatus('idle'), 3000);
      console.log('✅ 应用已成功安装');
    };

    // 检查Service Worker是否已注册
    const checkServiceWorker = () => {
      // 检查是否为开发环境
      const isDevelopment = import.meta.env.MODE === 'development';
      
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          console.log(`📋 Service Worker注册数量: ${registrations.length}`);
          if (registrations.length > 0) {
            console.log('✅ Service Worker已注册，应用可以安装');
            // Service Worker已注册，但如果deferredPrompt不存在，尝试检查浏览器是否支持安装
            if (!deferredPrompt) {
              console.log('ℹ️ Service Worker已注册，但deferredPrompt不存在，可能需要等待浏览器触发beforeinstallprompt事件');
            }
          } else {
            if (isDevelopment) {
              console.log('ℹ️ 开发环境中Service Worker未注册，这是正常现象，生产环境会自动注册');
            } else {
              console.log('❌ Service Worker未注册，应用无法安装');
            }
          }
        });
      } else {
        console.log('❌ 浏览器不支持Service Worker，应用无法安装');
      }
    };

    // 检查浏览器是否支持PWA安装
    const checkPwaSupport = () => {
      console.log('🔍 检查PWA安装支持:');
      console.log(`   - BeforeInstallPromptEvent支持: ${'BeforeInstallPromptEvent' in window}`);
      console.log(`   - Service Worker支持: ${'serviceWorker' in navigator}`);
      console.log(`   - 当前显示模式: ${window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser'}`);
      console.log(`   - 是否已安装: ${window.matchMedia('(display-mode: standalone)').matches}`);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // 初始化时检查
    checkPwaSupport();
    checkServiceWorker();

    // 每秒检查一次Service Worker状态，持续10秒
    const interval = setInterval(checkServiceWorker, 1000);
    setTimeout(() => clearInterval(interval), 10000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearInterval(interval);
    };
  }, [deferredPrompt, forceShow]);

  const handleInstallClick = async () => {
    console.log('🔄 开始安装流程...');
    
    // 检查是否为开发环境
    const isDevelopment = import.meta.env.MODE === 'development';
    
    if (!deferredPrompt) {
      console.log('❌ deferredPrompt不存在，检查安装条件:');
      
      // 检查是否已经安装过应用
      if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('✅ 应用已经安装，显示安装成功状态');
        setInstallStatus('installed');
        setTimeout(() => {
          setInstallStatus('idle');
        }, 3000);
        return;
      }
      
      // 检查Service Worker注册状态
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        console.log(`   - Service Worker注册数量: ${registrations.length}`);
        if (registrations.length === 0) {
          if (isDevelopment) {
            console.log('   - 开发环境中Service Worker未注册，这是正常现象');
          } else {
            console.log('   - 原因: Service Worker未注册');
          }
        }
      }
      
      // 检查浏览器支持
      console.log(`   - BeforeInstallPromptEvent支持: ${'BeforeInstallPromptEvent' in window}`);
      
      // 检查当前环境是否支持PWA安装
      const isPWASupported = 'BeforeInstallPromptEvent' in window;
      if (!isPWASupported) {
        console.log('❌ 当前浏览器不支持直接安装PWA应用');
        setInstallStatus('dismissed');
        setTimeout(() => {
          setInstallStatus('idle');
          setShowInstallButton(true);
        }, 3000);
        return;
      }
      
      // 检查是否为HTTP环境
      if (window.location.protocol !== 'https:' && !isDevelopment) {
        console.log('❌ PWA安装需要HTTPS环境');
        setInstallStatus('dismissed');
        setTimeout(() => {
          setInstallStatus('idle');
          setShowInstallButton(true);
        }, 3000);
        return;
      }
      
      // 开发环境下，显示手动安装指南
      if (isDevelopment) {
        console.log('ℹ️ 开发环境下，建议使用浏览器开发者工具手动安装PWA应用');
        // 显示安装状态
        setInstallStatus('dismissed');
        setTimeout(() => {
          setInstallStatus('idle');
          setShowInstallButton(true);
        }, 3000);
        return;
      }
      
      // 生产环境下，尝试重新加载页面以获取安装事件
      console.log('🔄 尝试重新加载页面以获取beforeinstallprompt事件...');
      window.location.reload();
      return;
    }

    console.log('✅ 开始显示安装提示...');
    // 显示安装状态
    setInstallStatus('installing');
    setShowGuide(false);

    try {
      // 显示安装提示
      console.log('📱 调用deferredPrompt.prompt()...');
      await deferredPrompt.prompt();
      console.log('✅ 安装提示已显示');

      // 等待用户响应
      console.log('⏳ 等待用户选择...');
      const { outcome, platform } = await deferredPrompt.userChoice;
      console.log(`📋 用户选择: ${outcome} (平台: ${platform})`);
      
      if (outcome === 'accepted') {
        console.log('✅ 安装已接受');
        setInstallStatus('installed');
        // 安装成功后，显示成功提示，并提供打开应用的指引
        setTimeout(() => {
          setInstallStatus('idle');
          // 显示安装成功后的指引
          console.log('📱 应用已成功安装到桌面！');
        }, 3000);
      } else {
        console.log('❌ 安装已拒绝');
        setInstallStatus('dismissed');
        // 如果用户拒绝，3秒后恢复显示安装按钮
        setTimeout(() => {
          setInstallStatus('idle');
          setShowInstallButton(true);
        }, 3000);
      }
    } catch (error) {
      console.error('❌ 安装应用时出错:', error);
      setInstallStatus('dismissed');
      setTimeout(() => {
        setInstallStatus('idle');
        setShowInstallButton(true);
      }, 3000);
    }

    // 无论结果如何，我们都不能再次使用该事件
    console.log('🔚 安装流程结束，清理deferredPrompt');
    setDeferredPrompt(null);
    setShowInstallButton(false);
    
    // 3秒后隐藏安装状态
    setTimeout(() => setInstallStatus('idle'), 3000);
  };

  const handleGuideClose = () => {
    setShowGuide(false);
  };

  // 检查是否支持PWA安装
  const isPWASupported = () => {
    return 'BeforeInstallPromptEvent' in window;
  };

  // 检查是否为开发环境
  const isDevelopment = () => {
    return import.meta.env.MODE === 'development';
  };

  return (
    <>
      {/* 安装引导 */}
      {!asMenuItem && showGuide && isPWASupported() && (
        <div className="fixed bottom-20 right-6 z-40 max-w-xs">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">安装应用到主屏幕</h3>
              <button 
                onClick={handleGuideClose} 
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              点击下方按钮，将应用安装到主屏幕，获得更好的使用体验。
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 mb-4">
              <li className="flex items-start gap-2">
                <i className="fas fa-check-circle text-green-500 mt-1"></i>
                <span>支持离线使用</span>
              </li>
              <li className="flex items-start gap-2">
                <i className="fas fa-check-circle text-green-500 mt-1"></i>
                <span>更快的加载速度</span>
              </li>
              <li className="flex items-start gap-2">
                <i className="fas fa-check-circle text-green-500 mt-1"></i>
                <span>类似原生应用的体验</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* 安装按钮 */}
      {variant === 'menu' ? (
        /* 作为菜单项时，直接返回按钮本身 */
        <button
          onClick={handleInstallClick}
          className={`w-full text-left px-4 py-2 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
        >
          <i className="fas fa-download mr-3"></i>
          <span>安装应用</span>
        </button>
      ) : variant === 'dashboard' ? (
        /* 个人中心按钮样式 */
        showInstallButton && isPWASupported() && (
          <button 
            onClick={handleInstallClick}
            className={`w-full px-4 py-3 rounded-lg min-h-[44px] ${
              isDark 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white transition-colors text-sm flex items-center justify-center`}
            aria-label="安装应用"
          >
            <i className="fas fa-download mr-1.5"></i>
            安装应用
          </button>
        )
      ) : (
        /* 否则，保持原来的固定定位，但可以通过hideFixedButton隐藏 */
        showInstallButton && isPWASupported() && !hideFixedButton && (
          <div className="fixed bottom-6 left-6 z-40">
            <button
              onClick={handleInstallClick}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 px-8 rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center gap-3"
            >
              <i className="fas fa-download text-lg"></i>
              <span>安装应用</span>
            </button>
          </div>
        )
      )}

      {/* 安装状态提示 - 无论是否为菜单项模式，都显示 */}
      {installStatus !== 'idle' && (
        <div className="fixed bottom-6 left-6 z-40">
          <div className={`flex items-center gap-3 px-5 py-3 rounded-full shadow-lg transition-all duration-300 ${installStatus === 'installing' ? 'bg-yellow-100 text-yellow-800' : installStatus === 'installed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {installStatus === 'installing' && (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                <span>正在安装...</span>
              </>
            )}
            {installStatus === 'installed' && (
              <>
                <i className="fas fa-check-circle"></i>
                <span>安装成功！</span>
              </>
            )}
            {installStatus === 'dismissed' && (
              <>
                <i className="fas fa-times-circle"></i>
                <span>当前环境不支持直接安装应用</span>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default PWAInstallButton;