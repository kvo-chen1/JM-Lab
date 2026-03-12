import React from 'react';
import { Link, LinkProps, useNavigate } from 'react-router-dom';

interface PrefetchLinkProps extends LinkProps {
  componentName?: string;
  dataPrefetch?: () => Promise<any>;
  prefetchOnHover?: boolean;
  prefetchDelay?: number;
}

const prefetchedRoutes = new Set<string>();

const PrefetchLink: React.FC<PrefetchLinkProps> = ({ 
  children, 
  to,
  componentName,
  dataPrefetch,
  prefetchOnHover = true,
  prefetchDelay = 300,
  onMouseEnter,
  onFocus,
  onClick,
  ...props 
}) => {
  const navigate = useNavigate();
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  const performPrefetch = React.useCallback(() => {
    if (!to || typeof to !== 'string') return;
    
    if (prefetchedRoutes.has(to)) {
      return;
    }
    prefetchedRoutes.add(to);

    if (componentName) {
      import('@/utils/performanceOptimization').then(({ componentPreloader }) => {
        componentPreloader.preloadComponents([componentName]).catch(() => {});
      });
    }

    if (dataPrefetch) {
      dataPrefetch().catch(() => {});
    }
  }, [to, componentName, dataPrefetch]);

  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (prefetchOnHover && to) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        performPrefetch();
      }, prefetchDelay);
    }
    
    if (onMouseEnter) {
      onMouseEnter(e);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLAnchorElement>) => {
    if (prefetchOnHover && to) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        performPrefetch();
      }, prefetchDelay);
    }
    
    if (onFocus) {
      onFocus(e);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (onClick) {
      onClick(e);
    }
  };

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <Link
      {...props}
      to={to}
      onMouseEnter={handleMouseEnter}
      onFocus={handleFocus}
      onClick={handleClick}
      prefetch="intent"
    >
      {children}
    </Link>
  );
};

export default PrefetchLink;

export const clearPrefetchCache = () => {
  prefetchedRoutes.clear();
};
