import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import GradientHero from '@/components/GradientHero';
import CulturalNews from '@/components/CulturalNews';

export default function CulturalNewsPage() {
  const { isDark } = useTheme();

  return (
    <main className="flex-1 container mx-auto px-4 py-8">
      {/* 渐变英雄区 */}
      <GradientHero
        title="文化资讯"
        subtitle="了解最新的文化政策、赛事活动、展览展示和技术应用"
        badgeText="Beta"
        theme="red"
        size="lg"
        pattern
        backgroundImage="https://picsum.photos/seed/culture/1920/1080"
        stats={[
          { label: '政策动态', value: '更新' },
          { label: '赛事活动', value: '推荐' },
          { label: '展览展示', value: '精选' },
          { label: '技术应用', value: '前沿' },
        ]}
      />
      
      {/* 面包屑导航 */}
      <div className="mb-6">
        <div className="flex items-center text-sm">
          <a href="/dashboard" className="hover:text-red-600 transition-colors">首页</a>
          <i className="fas fa-chevron-right text-xs mx-2 opacity-50"></i>
          <span className="opacity-70">文化资讯</span>
        </div>
      </div>
      
      {/* 标题 */}
      <motion.h1 
        className="text-3xl font-bold mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        文化资讯
      </motion.h1>
      
      {/* 文化资讯内容 */}
      <CulturalNews />
    </main>
  );
}
