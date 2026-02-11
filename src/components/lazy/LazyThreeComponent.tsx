import React, { lazy, Suspense, ComponentType, ReactNode } from 'react';

interface LazyThreeComponentOptions {
  priority?: number | string;
  name?: string;
  fallback?: ReactNode;
}

export function createLazyThreeComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyThreeComponentOptions = {}
): T {
  const {
    priority = 0,
    name = 'lazy-three-component',
    fallback = (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  } = options;

  const LazyComponent = lazy(importFn);

  const WrappedComponent = (props: any) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );

  WrappedComponent.displayName = `LazyThreeComponent(${name})`;
  
  // 添加优先级标记，用于性能优化
  (WrappedComponent as any).priority = priority;
  (WrappedComponent as any).componentName = name;

  return WrappedComponent as unknown as T;
}
