import { useTheme } from '@/hooks/useTheme';

import GradientHero from '@/components/GradientHero';
import TianjinCreativeActivities from '@/components/TianjinCreativeActivities';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function Tianjin() {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900'}`}>

      {/* 主内容区 */}
      <main className="container mx-auto px-4 py-8">
        {/* 特色专区渐变英雄区 */}
        <GradientHero 
          title="地域模板"
          subtitle="探索天津特色文化模板"
          theme="heritage"
          stats={[
            { label: '特色模板', value: '精选' },
            { label: '文化元素', value: '丰富' },
            { label: '非遗传承', value: '导览' },
            { label: '津味应用', value: '共创' }
          ]}
          pattern={true}
          size="lg"
          backgroundImage="https://images.pexels.com/photos/6688844/pexels-photo-6688844.jpeg?auto=compress&cs=tinysrgb&w=1920"
        />

        {/* 地域模板内容 */}
        <section className="mt-8 mb-12">
          <div className="">
            {/* 活动内容 */}
            <ErrorBoundary>
              <TianjinCreativeActivities />
            </ErrorBoundary>
          </div>
        </section>
      </main>
    </div>
  );
}