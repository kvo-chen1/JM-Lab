import React from 'react';
import WorkHeartLayout from './WorkHeartLayout';
import WorkHeartMain from './WorkHeartMain';

export default function WorkHeart() {
  return (
    <WorkHeartLayout>
      <WorkHeartMain />
    </WorkHeartLayout>
  );
}

// 导出组件和hooks供外部使用
export { default as WorkHeartLayout } from './WorkHeartLayout';
export { default as WorkHeartMain } from './WorkHeartMain';
export { default as WorkHeartLeftSidebar } from './WorkHeartLeftSidebar';
export { default as WorkHeartRightSidebar } from './WorkHeartRightSidebar';
export { useWorkHeartStore } from './hooks/useWorkHeartStore';
export * from './types/workheart';
