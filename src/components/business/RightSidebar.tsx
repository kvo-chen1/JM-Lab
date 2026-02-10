import React from 'react';
import { motion } from 'framer-motion';
import { BrandPartnership } from '@/services/brandPartnershipService';
import { 
  Sparkles, 
  TrendingUp, 
  Zap,
  Lightbulb,
  ArrowRight,
  Star,
  Users,
  Award,
  Building2,
  CheckCircle2
} from 'lucide-react';

interface RightSidebarProps {
  isDark: boolean;
  onQuickIdea?: (idea: string) => void;
  selectedBrand?: { name: string };
  approvedBrands?: BrandPartnership[];
  stats?: {
    approvedPartnerships: number;
    totalEvents: number;
  };
}

const RightSidebar: React.FC<RightSidebarProps> = ({
  isDark,
  onQuickIdea,
  selectedBrand,
  approvedBrands = [],
  stats
}) => {
  const quickIdeas = [
    { icon: Zap, label: '赛博朋克风', prompt: '赛博朋克风格联名设计' },
    { icon: Users, label: '校园潮流', prompt: '校园潮流联名系列' },
    { icon: Star, label: '数字文创', prompt: '数字文创表情包设计' },
    { icon: Award, label: '非遗传承', prompt: '非遗文化联名合作' },
  ];

  // 使用已入驻的品牌数据，如果没有则使用默认值
  const hotBrands = approvedBrands.length > 0 
    ? approvedBrands.slice(0, 5) 
    : [];

  const platformStats = [
    { label: '入驻品牌', value: `${stats?.approvedPartnerships || 0}+`, icon: Building2 },
    { label: '活跃创作者', value: '10万+', icon: Users },
    { label: '品牌活动', value: `${stats?.totalEvents || 0}+`, icon: TrendingUp },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* AI助手卡片 - 只在有 selectedBrand 时显示 */}
      {selectedBrand && onQuickIdea && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`
            p-5 rounded-2xl border relative overflow-hidden
            ${isDark 
              ? 'bg-gradient-to-br from-blue-900/40 to-purple-900/40 border-blue-500/30' 
              : 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200'}
          `}
        >
          {/* 装饰背景 */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl -mr-16 -mt-16" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                AI 创意助手
              </h3>
            </div>
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              不知道从何开始？选择下方灵感快速生成方案
            </p>
            
            <div className="space-y-2">
              {quickIdeas.map((idea, index) => (
                <motion.button
                  key={idea.label}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  onClick={() => onQuickIdea?.(`把${selectedBrand.name}做成${idea.prompt}`)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all duration-200 group
                    ${isDark 
                      ? 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 border border-gray-700 hover:border-blue-500/50' 
                      : 'bg-white hover:bg-blue-50 text-gray-700 border border-gray-200 hover:border-blue-300'}
                  `}
                >
                  <idea.icon className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium flex-1">{idea.label}</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* 实时数据 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`
          p-5 rounded-2xl border
          ${isDark 
            ? 'bg-gray-800/50 border-gray-700' 
            : 'bg-white border-gray-200'}
        `}
      >
        <h3 className={`font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <TrendingUp className="w-4 h-4 text-green-500" />
          平台数据
        </h3>
        <div className="space-y-3">
          {platformStats.map((stat, index) => (
            <div key={stat.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center
                  ${isDark ? 'bg-gray-700' : 'bg-gray-100'}
                `}>
                  <stat.icon className="w-4 h-4 text-blue-500" />
                </div>
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {stat.label}
                </span>
              </div>
              <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* 已入驻品牌 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className={`
          p-5 rounded-2xl border
          ${isDark 
            ? 'bg-gray-800/50 border-gray-700' 
            : 'bg-white border-gray-200'}
        `}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            已入驻品牌
          </h3>
          <span className={`
            text-xs px-2 py-1 rounded-full
            ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'}
          `}>
            <CheckCircle2 className="w-3 h-3 inline mr-1" />
            官方认证
          </span>
        </div>
        
        {hotBrands.length > 0 ? (
          <div className="space-y-3">
            {hotBrands.map((brand, index) => (
              <motion.div
                key={brand.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                className={`
                  flex items-center gap-3 p-2 rounded-xl transition-all duration-200
                  ${isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}
                `}
              >
                <img 
                  src={brand.brand_logo || 'https://via.placeholder.com/40?text=Brand'} 
                  alt={brand.brand_name}
                  className="w-10 h-10 rounded-lg object-cover border border-gray-200 dark:border-gray-600"
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    {brand.brand_name}
                  </p>
                  <p className={`text-xs truncate ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    {brand.description?.slice(0, 20)}...
                  </p>
                </div>
                <div className={`
                  w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                  ${index < 3 
                    ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' 
                    : (isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600')
                  }
                `}>
                  {index + 1}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className={`text-center py-6 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            <Building2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">暂无入驻品牌</p>
            <p className="text-xs mt-1">成为第一个入驻的品牌吧！</p>
          </div>
        )}
      </motion.div>

      {/* 创意提示 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className={`
          p-5 rounded-2xl border
          ${isDark 
            ? 'bg-gradient-to-br from-amber-900/30 to-orange-900/30 border-amber-500/30' 
            : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'}
        `}
      >
        <div className="flex items-start gap-3">
          <div className={`
            w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
            ${isDark ? 'bg-amber-500/20' : 'bg-amber-100'}
          `}>
            <Lightbulb className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h4 className={`font-semibold text-sm mb-1 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
              创意小贴士
            </h4>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              结合品牌历史故事与现代设计元素，能创造出更具文化内涵的联名作品
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RightSidebar;
