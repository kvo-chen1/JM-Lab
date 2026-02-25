import React from 'react';
import { motion } from 'framer-motion';
import {
  Wand2,
  Image,
  Video,
  Music,
  FileText,
  Palette,
  Layers,
  Zap,
  Shield,
  Clock,
  Download,
  Cloud,
  CheckCircle2
} from 'lucide-react';
import { User } from '@/contexts/authContext';

// 图标映射
const iconMap: Record<string, React.ElementType> = {
  Wand2,
  Image,
  Video,
  Music,
  FileText,
  Palette,
  Layers,
  Zap,
  Shield,
  Clock,
  Download,
  Cloud
};

interface BenefitItem {
  id: string;
  icon: string;
  name: string;
  value: boolean | string;
}

interface MembershipLevel {
  name: string;
  description: string;
  features: BenefitItem[];
}

interface BenefitsGridProps {
  isDark: boolean;
  user: User | null;
  membershipLevel?: string;
  benefits?: {
    levels: {
      free: MembershipLevel;
      premium: MembershipLevel;
      vip: MembershipLevel;
    };
  } | null;
}

const BenefitsGrid: React.FC<BenefitsGridProps> = ({ isDark, user, membershipLevel, benefits }) => {
  // 优先使用传入的会员等级，否则使用 user 对象中的
  const currentLevel = membershipLevel || user?.membershipLevel || 'free';
  // 使用 API 数据或默认数据
  const getBenefitsData = () => {
    if (benefits?.levels) {
      // 转换 API 数据格式
      const allFeatures = benefits.levels.free.features.map(feature => {
        const freeValue = benefits.levels.free.features.find(f => f.id === feature.id)?.value;
        const premiumValue = benefits.levels.premium.features.find(f => f.id === feature.id)?.value;
        const vipValue = benefits.levels.vip.features.find(f => f.id === feature.id)?.value;
        
        return {
          id: feature.id,
          icon: iconMap[feature.icon] || Zap,
          title: feature.name,
          description: getFeatureDescription(feature.id),
          free: freeValue ?? false,
          premium: premiumValue ?? false,
          vip: vipValue ?? false
        };
      });
      return allFeatures;
    }
    
    // 默认数据
    return [
      {
        id: 'ai-generation',
        icon: Wand2,
        title: 'AI生成次数',
        description: '每月可用的AI创作次数',
        free: '10次/天',
        premium: '无限',
        vip: '无限'
      },
      {
        id: 'ai-model',
        icon: Zap,
        title: 'AI模型访问',
        description: '可用的AI模型等级',
        free: '基础模型',
        premium: '高级模型',
        vip: '专属模型'
      },
      {
        id: 'image-generation',
        icon: Image,
        title: '图像生成',
        description: 'AI图像创作功能',
        free: true,
        premium: true,
        vip: true
      },
      {
        id: 'video-generation',
        icon: Video,
        title: '视频生成',
        description: 'AI视频创作功能',
        free: false,
        premium: true,
        vip: true
      },
      {
        id: 'audio-generation',
        icon: Music,
        title: '音频生成',
        description: 'AI音频创作功能',
        free: false,
        premium: true,
        vip: true
      },
      {
        id: 'text-generation',
        icon: FileText,
        title: '文案生成',
        description: 'AI文案创作功能',
        free: true,
        premium: true,
        vip: true
      },
      {
        id: 'templates',
        icon: Palette,
        title: '模板库',
        description: '可用模板数量',
        free: '基础模板',
        premium: '专属模板库',
        vip: '全部模板'
      },
      {
        id: 'layers',
        icon: Layers,
        title: '图层编辑',
        description: '高级图层编辑功能',
        free: '基础功能',
        premium: '完整功能',
        vip: '完整功能'
      },
      {
        id: 'export',
        icon: Download,
        title: '导出功能',
        description: '作品导出选项',
        free: '带水印',
        premium: '高清无水印',
        vip: '超高清无水印'
      },
      {
        id: 'storage',
        icon: Cloud,
        title: '云存储空间',
        description: '作品存储容量',
        free: '1GB',
        premium: '50GB',
        vip: '无限'
      },
      {
        id: 'priority',
        icon: Clock,
        title: '优先处理',
        description: '任务队列优先级',
        free: false,
        premium: true,
        vip: '最高优先级'
      },
      {
        id: 'commercial',
        icon: Shield,
        title: '商业授权',
        description: '作品商业使用授权',
        free: false,
        premium: false,
        vip: true
      }
    ];
  };

  const getFeatureDescription = (id: string): string => {
    const descriptions: Record<string, string> = {
      'ai_generation': '每月可用的AI创作次数',
      'ai_model': '可用的AI模型等级',
      'image_generation': 'AI图像创作功能',
      'video_generation': 'AI视频创作功能',
      'audio_generation': 'AI音频创作功能',
      'text_generation': 'AI文案创作功能',
      'templates': '可用模板数量',
      'layers': '高级图层编辑功能',
      'export': '作品导出选项',
      'storage': '作品存储容量',
      'priority': '任务队列优先级',
      'commercial': '作品商业使用授权'
    };
    return descriptions[id] || '';
  };

  const benefitsList = getBenefitsData();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const getValueDisplay = (value: boolean | string) => {
    if (value === true) return <CheckCircle2 size={18} className="text-emerald-500" />;
    if (value === false) return <span className={`text-xs ${isDark ? 'text-slate-600' : 'text-gray-300'}`}>—</span>;
    return <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{value}</span>;
  };

  const getCurrentLevelValue = (benefit: typeof benefitsList[0]) => {
    switch (currentLevel) {
      case 'vip':
        return benefit.vip;
      case 'premium':
        return benefit.premium;
      default:
        return benefit.free;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          会员权益对比
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isDark ? 'bg-slate-600' : 'bg-gray-300'}`} />
            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>免费</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>高级</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>VIP</span>
          </div>
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {benefitsList.map((benefit) => {
          const Icon = benefit.icon;
          const currentValue = getCurrentLevelValue(benefit);
          const hasAccess = currentValue !== false;

          return (
            <motion.div
              key={benefit.id}
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -2 }}
              className={`
                relative p-5 rounded-2xl border transition-all duration-200
                ${hasAccess
                  ? isDark
                    ? 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                    : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-lg'
                  : isDark
                    ? 'bg-slate-900/30 border-slate-800 opacity-60'
                    : 'bg-gray-50 border-gray-200 opacity-60'
                }
              `}
            >
              {/* 当前等级指示器 */}
              {hasAccess && (
                <div className={`
                  absolute top-3 right-3 w-2 h-2 rounded-full
                  ${currentLevel === 'vip' ? 'bg-purple-500' :
                    currentLevel === 'premium' ? 'bg-blue-500' : 'bg-gray-400'}
                `} />
              )}

              <div className="flex items-start gap-3">
                <div className={`
                  w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                  ${hasAccess
                    ? isDark
                      ? 'bg-indigo-500/20'
                      : 'bg-indigo-100'
                    : isDark
                      ? 'bg-slate-800'
                      : 'bg-gray-200'
                  }
                `}>
                  <Icon size={20} className={hasAccess ? 'text-indigo-500' : isDark ? 'text-slate-600' : 'text-gray-400'} />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className={`font-medium text-sm mb-1 ${isDark ? 'text-slate-200' : 'text-gray-900'}`}>
                    {benefit.title}
                  </h4>
                  <p className={`text-xs mb-3 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                    {benefit.description}
                  </p>

                  {/* 权益值对比 */}
                  <div className={`
                    grid grid-cols-3 gap-2 p-2 rounded-lg
                    ${isDark ? 'bg-slate-900/50' : 'bg-gray-50'}
                  `}>
                    <div className="text-center">
                      <div className="flex justify-center mb-1">
                        {getValueDisplay(benefit.free)}
                      </div>
                      <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>免费</span>
                    </div>
                    <div className="text-center">
                      <div className="flex justify-center mb-1">
                        {getValueDisplay(benefit.premium)}
                      </div>
                      <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>高级</span>
                    </div>
                    <div className="text-center">
                      <div className="flex justify-center mb-1">
                        {getValueDisplay(benefit.vip)}
                      </div>
                      <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>VIP</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default BenefitsGrid;
