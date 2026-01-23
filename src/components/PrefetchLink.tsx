import React from 'react';
import { Link, LinkProps } from 'react-router-dom';

interface PrefetchLinkProps extends LinkProps {
  preload?: () => Promise<any>;
  componentName?: string; // 如果提供了 componentName，可以从 ComponentPreloader 中查找
}

/**
 * 支持预加载的链接组件
 * 当鼠标悬停或获得焦点时，预加载目标组件代码
 */
const PrefetchLink: React.FC<PrefetchLinkProps> = ({ 
  children, 
  preload, 
  componentName,
  onMouseEnter,
  onFocus,
  ...props 
}) => {
  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (preload) {
      preload();
    }
    if (onMouseEnter) {
      onMouseEnter(e);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLAnchorElement>) => {
    if (preload) {
      preload();
    }
    if (onFocus) {
      onFocus(e);
    }
  };

  return (
    <Link
      {...props}
      onMouseEnter={handleMouseEnter}
      onFocus={handleFocus}
    >
      {children}
    </Link>
  );
};

export default PrefetchLink;
