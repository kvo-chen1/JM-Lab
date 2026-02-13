import { useEffect, useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { TianjinWelcome } from './TianjinWelcome';
import { TianjinCultureTips } from './TianjinCultureTips';

export function TianjinThemeWrapper() {
  const { theme } = useTheme();
  const [showTianjinFeatures, setShowTianjinFeatures] = useState(false);

  useEffect(() => {
    // 当切换到天津主题时，显示天津特色功能
    if (theme === 'tianjin') {
      setShowTianjinFeatures(true);
    } else {
      setShowTianjinFeatures(false);
    }
  }, [theme]);

  if (!showTianjinFeatures) return null;

  return (
    <>
      {/* 天津主题欢迎弹窗 */}
      <TianjinWelcome />
      
      {/* 天津文化小贴士 */}
      <TianjinCultureTips />
    </>
  );
}

export default TianjinThemeWrapper;
