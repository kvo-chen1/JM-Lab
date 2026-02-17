import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const STORAGE_KEY = 'app_scroll_positions';

interface ScrollPositions {
  [key: string]: number;
}

function getScrollPositions(): ScrollPositions {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveScrollPositions(positions: ScrollPositions) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  } catch {
    // Ignore storage errors
  }
}

export function ScrollRestoration() {
  const location = useLocation();
  const isFirstRender = useRef(true);
  const hasRestored = useRef(false);

  // 恢复滚动位置
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;

      // 页面加载完成后恢复滚动位置
      const restoreScroll = () => {
        if (hasRestored.current) return;

        const positions = getScrollPositions();
        const savedPosition = positions[location.pathname + location.search];

        if (savedPosition && savedPosition > 0) {
          // 使用 requestAnimationFrame 确保在内容渲染完成后恢复滚动
          requestAnimationFrame(() => {
            window.scrollTo({
              top: savedPosition,
              behavior: 'auto'
            });
            hasRestored.current = true;
          });
        }
      };

      // 等待内容加载完成
      if (document.readyState === 'complete') {
        restoreScroll();
      } else {
        window.addEventListener('load', restoreScroll);
        // 备用方案：最多等待2秒后恢复
        setTimeout(restoreScroll, 100);
        setTimeout(restoreScroll, 500);
        setTimeout(restoreScroll, 1000);
      }

      return () => {
        window.removeEventListener('load', restoreScroll);
      };
    }
  }, [location.pathname, location.search]);

  // 保存滚动位置
  useEffect(() => {
    let rafId: number;
    let lastScrollY = 0;

    const handleScroll = () => {
      lastScrollY = window.scrollY;

      // 使用 requestAnimationFrame 节流
      if (rafId) return;

      rafId = requestAnimationFrame(() => {
        rafId = 0;
        const positions = getScrollPositions();
        positions[location.pathname + location.search] = lastScrollY;
        saveScrollPositions(positions);
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [location.pathname, location.search]);

  // 页面卸载前保存滚动位置
  useEffect(() => {
    const handleBeforeUnload = () => {
      const positions = getScrollPositions();
      positions[location.pathname + location.search] = window.scrollY;
      saveScrollPositions(positions);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [location.pathname, location.search]);

  return null;
}
