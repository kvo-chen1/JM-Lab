import React from 'react';
import { DewuLoader } from '@/components/ui';

const DewuLoaderDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold text-white mb-12">得物主题加载器 DewuLoader</h1>
      
      <div className="flex flex-col items-center gap-16">
        {/* 小尺寸 */}
        <div className="flex flex-col items-center gap-4">
          <span className="text-gray-400 text-sm">Small (sm)</span>
          <DewuLoader size="sm" />
        </div>

        {/* 中等尺寸 */}
        <div className="flex flex-col items-center gap-4">
          <span className="text-gray-400 text-sm">Medium (md) - 默认</span>
          <DewuLoader size="md" />
        </div>

        {/* 大尺寸 */}
        <div className="flex flex-col items-center gap-4">
          <span className="text-gray-400 text-sm">Large (lg)</span>
          <DewuLoader size="lg" />
        </div>
      </div>

      <div className="mt-16 text-center">
        <p className="text-gray-500 text-sm">悬停在加载器上查看 3D 效果</p>
        <p className="text-gray-600 text-xs mt-2">配色：荧光绿 #39FF14 + 白色 + 黑色</p>
      </div>
    </div>
  );
};

export default DewuLoaderDemo;
