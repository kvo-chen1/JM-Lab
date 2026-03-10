import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslation from './locales/en.json';
import zhTranslation from './locales/zh.json';

// 配置i18next
i18n
  // 使用语言检测器
  .use(LanguageDetector)
  // 传递react-i18next实例
  .use(initReactI18next)
  // 初始化配置
  .init({
    resources: {
      en: {
        translation: enTranslation
      },
      zh: {
        translation: zhTranslation
      }
    },
    fallbackLng: 'zh', // 默认语言
    debug: import.meta.env.DEV, // 开发环境下启用调试
    detection: {
      order: ['localStorage', 'navigator'], // 检测顺序：先检查localStorage，再检查浏览器语言
      caches: ['localStorage'], // 缓存语言选择到localStorage
    },
    interpolation: {
      escapeValue: false, // react已经安全转义
    },
    react: {
      useSuspense: false, // 不使用suspense，避免加载状态问题
    }
  });

export default i18n;
