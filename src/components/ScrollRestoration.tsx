import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollRestoration() {
  const location = useLocation();

  // 页面切换时滚动到顶部
  useEffect(() => {
    // 使用 requestAnimationFrame 确保在内容渲染完成后滚动
    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        behavior: 'auto'
      });
    };

    // 立即执行一次
    scrollToTop();
    
    // 使用 requestAnimationFrame 确保在内容渲染完成后再次滚动
    requestAnimationFrame(() => {
      scrollToTop();
    });

    // 备用方案：延迟执行以确保内容加载完成
    setTimeout(scrollToTop, 0);
    setTimeout(scrollToTop, 100);
  }, [location.pathname, location.search]);

  return null;
}
