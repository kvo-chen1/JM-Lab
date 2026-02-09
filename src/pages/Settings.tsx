import { useState, useEffect, useContext } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Theme } from '@/config/themeConfig';
import { useNavigate } from 'react-router-dom';
import { useGuide } from '@/contexts/GuideContext';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import ModelSelector from '@/components/ModelSelector';
import SettingsLayout from '@/components/settings/SettingsLayout';
import SettingsSidebar, { SettingCategory } from '@/components/settings/SettingsSidebar';
import SettingsContent from '@/components/settings/SettingsContent';
import SettingsPreview from '@/components/settings/SettingsPreview';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { startGuide } = useGuide();
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // 当前选中的设置分类
  const [activeCategory, setActiveCategory] = useState<SettingCategory>('theme');

  // 模型选择器弹窗
  const [showModelSelector, setShowModelSelector] = useState(false);

  // 数据导出状态
  const [isExporting, setIsExporting] = useState(false);

  // 账号注销确认
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // 通知设置
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('notificationsEnabled');
    return saved ? JSON.parse(saved) : true;
  });
  const [notificationSound, setNotificationSound] = useState<boolean>(() => {
    const saved = localStorage.getItem('notificationSound');
    return saved ? JSON.parse(saved) : true;
  });
  const [notificationFrequency, setNotificationFrequency] = useState<string>(() => {
    const saved = localStorage.getItem('notificationFrequency');
    return saved || 'immediate';
  });

  // 隐私设置
  const [dataCollectionEnabled, setDataCollectionEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('dataCollectionEnabled');
    return saved ? JSON.parse(saved) : true;
  });

  // 界面设置
  const [language, setLanguage] = useState<string>(() => {
    const saved = localStorage.getItem('language');
    return saved || 'zh-CN';
  });
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('fontSize');
    return saved ? parseInt(saved) : 16;
  });
  const [layoutCompactness, setLayoutCompactness] = useState<string>(() => {
    const saved = localStorage.getItem('layoutCompactness');
    return saved || 'standard';
  });

  // 高级设置
  const [developerMode, setDeveloperMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('developerMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [apiDebugging, setApiDebugging] = useState<boolean>(() => {
    const saved = localStorage.getItem('apiDebugging');
    return saved ? JSON.parse(saved) : false;
  });
  const [performanceMonitoring, setPerformanceMonitoring] = useState<boolean>(() => {
    const saved = localStorage.getItem('performanceMonitoring');
    return saved ? JSON.parse(saved) : true;
  });

  // 保存设置到localStorage
  useEffect(() => {
    localStorage.setItem('notificationsEnabled', JSON.stringify(notificationsEnabled));
  }, [notificationsEnabled]);

  useEffect(() => {
    localStorage.setItem('notificationSound', JSON.stringify(notificationSound));
  }, [notificationSound]);

  useEffect(() => {
    localStorage.setItem('notificationFrequency', notificationFrequency);
  }, [notificationFrequency]);

  useEffect(() => {
    localStorage.setItem('dataCollectionEnabled', JSON.stringify(dataCollectionEnabled));
  }, [dataCollectionEnabled]);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('fontSize', fontSize.toString());
    document.documentElement.style.fontSize = `${fontSize}px`;
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('layoutCompactness', layoutCompactness);
  }, [layoutCompactness]);

  useEffect(() => {
    localStorage.setItem('developerMode', JSON.stringify(developerMode));
  }, [developerMode]);

  useEffect(() => {
    localStorage.setItem('apiDebugging', JSON.stringify(apiDebugging));
  }, [apiDebugging]);

  useEffect(() => {
    localStorage.setItem('performanceMonitoring', JSON.stringify(performanceMonitoring));
  }, [performanceMonitoring]);

  // 清除缓存功能
  const handleClearCache = () => {
    const currentTheme = theme;
    localStorage.clear();
    localStorage.setItem('theme', currentTheme);
    toast.success('缓存已清除', {
      description: '页面将重新加载以应用更改',
    });
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  // 导出个人数据
  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const res = await fetch(`/api/user/export?userId=${user?.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.code === 0) {
          const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `user-data-${user?.username || 'export'}-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          toast.success('数据导出成功', {
            description: '文件已下载到您的设备',
          });
        } else {
          toast.error(data.message || '导出失败');
        }
      } else {
        toast.error('导出失败，请稍后重试');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('导出失败，请稍后重试');
    } finally {
      setIsExporting(false);
    }
  };

  // 注销账号
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== '注销账号') {
      toast.error('请输入"注销账号"以确认');
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/user/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user?.id }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.code === 0) {
          toast.success('账号已注销');
          logout();
          navigate('/');
        } else {
          toast.error(data.message || '注销失败');
        }
      } else {
        toast.error('注销失败，请稍后重试');
      }
    } catch (error) {
      console.error('Delete account error:', error);
      toast.error('注销失败，请稍后重试');
    } finally {
      setIsDeleting(false);
    }
  };

  // 处理主题变更
  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme as Theme);
  };

  // 处理重置引导
  const handleResetGuide = () => {
    startGuide();
    toast.success('新手引导已重置', {
      description: '引导将在下次访问时显示',
    });
  };

  return (
    <>
      <SettingsLayout
        sidebar={
          <SettingsSidebar
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
        }
        content={
          <SettingsContent
            activeCategory={activeCategory}
            theme={theme}
            onThemeChange={handleThemeChange}
            onOpenModelSelector={() => setShowModelSelector(true)}
            notificationsEnabled={notificationsEnabled}
            onNotificationsChange={setNotificationsEnabled}
            notificationSound={notificationSound}
            onNotificationSoundChange={setNotificationSound}
            notificationFrequency={notificationFrequency}
            onNotificationFrequencyChange={setNotificationFrequency}
            dataCollectionEnabled={dataCollectionEnabled}
            onDataCollectionChange={setDataCollectionEnabled}
            onClearCache={handleClearCache}
            language={language}
            onLanguageChange={setLanguage}
            fontSize={fontSize}
            onFontSizeChange={setFontSize}
            layoutCompactness={layoutCompactness}
            onLayoutCompactnessChange={setLayoutCompactness}
            onResetGuide={handleResetGuide}
            onExportData={handleExportData}
            isExporting={isExporting}
            developerMode={developerMode}
            onDeveloperModeChange={setDeveloperMode}
            apiDebugging={apiDebugging}
            onApiDebuggingChange={setApiDebugging}
            performanceMonitoring={performanceMonitoring}
            onPerformanceMonitoringChange={setPerformanceMonitoring}
            onDeleteAccount={() => setShowDeleteConfirm(true)}
          />
        }
        preview={
          <SettingsPreview
            activeCategory={activeCategory}
            theme={theme}
            onThemeChange={setTheme}
            onOpenModelSelector={() => setShowModelSelector(true)}
          />
        }
      />

      {/* 模型选择器弹窗 */}
      {showModelSelector && (
        <ModelSelector isOpen={showModelSelector} onClose={() => setShowModelSelector(false)} />
      )}

      {/* 注销账号确认对话框 */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="max-w-md w-full rounded-2xl p-6 bg-white dark:bg-[#1a1a1a] shadow-2xl border border-gray-200 dark:border-gray-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-red-600">注销账号</h3>
              </div>

              <p className="mb-4 text-gray-600 dark:text-gray-400">
                此操作将永久删除您的账号和所有相关数据，包括：
              </p>

              <ul className="list-disc list-inside mb-6 space-y-1 text-gray-500 dark:text-gray-500">
                <li>个人资料和设置</li>
                <li>所有作品和草稿</li>
                <li>收藏和点赞记录</li>
                <li>消息和通知</li>
                <li>积分和成就</li>
              </ul>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  请输入 "注销账号" 以确认
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                  placeholder="注销账号"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl transition-colors bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium"
                >
                  取消
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || deleteConfirmText !== '注销账号'}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isDeleting ? (
                    <span className="flex items-center justify-center gap-2">
                      <i className="fas fa-spinner fa-spin"></i>
                      处理中...
                    </span>
                  ) : (
                    '确认注销'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
