import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface LanguageContextType {
  currentLanguage: string;
  changeLanguage: (language: string) => void;
  languages: { code: string; name: string }[];
}

// 创建带默认值的上下文，避免undefined检查
const LanguageContext = createContext<LanguageContextType>({
  currentLanguage: 'zh',
  changeLanguage: () => {},
  languages: [
    { code: 'zh', name: '中文' }
  ]
});

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  // 初始值设为默认语言，避免在服务器端访问浏览器API
  const [currentLanguage, setCurrentLanguage] = useState('zh');

  // 可用语言列表
  const languages = [
    { code: 'zh', name: '中文' }
  ];

  // 客户端挂载后初始化i18n
  useEffect(() => {
    // 只在浏览器环境中执行
    if (typeof window === 'undefined') {
      return;
    }

    // 动态导入i18n，避免服务器端渲染时出错
    import('../i18n/i18n').then(({ default: i18n }) => {
      try {
        // 更新当前语言
        setCurrentLanguage(i18n.language || 'zh');

        // 当i18n语言变化时更新状态
        const handleLanguageChange = () => {
          setCurrentLanguage(i18n.language);
        };

        // 监听语言变化
        i18n.on('languageChanged', handleLanguageChange);

        // 清理监听器
        return () => {
          i18n.off('languageChanged', handleLanguageChange);
        };
      } catch (error) {
        console.error('Error initializing i18n:', error);
      }
    }).catch(error => {
      console.error('Error loading i18n:', error);
    });
  }, []);

  // 切换语言
  const changeLanguage = (language: string) => {
    // 先更新本地状态
    setCurrentLanguage(language);

    // 只在浏览器环境中执行
    if (typeof window !== 'undefined') {
      // 动态导入i18n，避免服务器端渲染时出错
      import('../i18n/i18n').then(({ default: i18n }) => {
        try {
          i18n.changeLanguage(language);
        } catch (error) {
          console.error('Error changing language:', error);
        }
      }).catch(error => {
        console.error('Error loading i18n:', error);
      });
    }
  };

  const value = {
    currentLanguage,
    changeLanguage,
    languages
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

// 自定义钩子，方便组件使用
export function useLanguage(): LanguageContextType {
  return useContext(LanguageContext);
}

export default useLanguage;