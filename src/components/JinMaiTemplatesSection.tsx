import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { TianjinImage } from '@/components/TianjinStyleComponents';
import { toast } from 'sonner';
import { getPicsumUrl } from '@/utils/templateImageGenerator';

// 模板数据接口
interface TemplateItem {
  id: string;
  title: string;
  subtitle: string;
  thumbnail: string;
  category: 'nianhua' | 'niren' | 'fengzheng' | 'landmark' | 'brand' | 'guochao';
  tags: string[];
  likes: number;
  usageCount: number;
  prompt: string;
}

// 津脉模板数据 - 使用与主题匹配的图片
const jinMaiTemplates: TemplateItem[] = [
  {
    id: 'jm-001',
    title: '杨柳青年画·连年有余',
    subtitle: '传统年画风格，寓意吉祥',
    thumbnail: getPicsumUrl('yangliuqing-nianhua-traditional-folk-art', 600, 400),
    category: 'nianhua',
    tags: ['年画', '传统', '吉祥'],
    likes: 2341,
    usageCount: 568,
    prompt: '杨柳青年画风格，胖娃娃抱鲤鱼，莲花盛开，红色喜庆背景，传统中国年画'
  },
  {
    id: 'jm-002',
    title: '泥人张·戏曲人物',
    subtitle: '彩塑艺术，栩栩如生',
    thumbnail: getPicsumUrl('nirenzhang-clay-figurine-colorful-art', 600, 400),
    category: 'niren',
    tags: ['泥塑', '戏曲', '非遗'],
    likes: 1856,
    usageCount: 423,
    prompt: '泥人张彩塑风格，京剧人物，精致细腻，传统服饰，生动表情'
  },
  {
    id: 'jm-003',
    title: '风筝魏·燕子风筝',
    subtitle: '传统工艺，匠心独运',
    thumbnail: getPicsumUrl('fengzhengwei-kite-flying-sky-traditional', 600, 400),
    category: 'fengzheng',
    tags: ['风筝', '工艺', '春天'],
    likes: 1523,
    usageCount: 389,
    prompt: '风筝魏传统工艺，燕子造型风筝，竹骨纸面，彩绘精美，蓝天白云背景'
  },
  {
    id: 'jm-004',
    title: '天津之眼·夜景',
    subtitle: '城市地标，璀璨夜色',
    thumbnail: getPicsumUrl('tianjin-eye-ferris-wheel-night-lights', 600, 400),
    category: 'landmark',
    tags: ['地标', '夜景', '现代'],
    likes: 3421,
    usageCount: 892,
    prompt: '天津之眼摩天轮，海河夜景，灯光璀璨，城市天际线，现代都市风格'
  },
  {
    id: 'jm-005',
    title: '狗不理包子·国潮',
    subtitle: '老字号新演绎',
    thumbnail: getPicsumUrl('goubuli-baozi-steamed-buns-delicious', 600, 400),
    category: 'brand',
    tags: ['美食', '老字号', '国潮'],
    likes: 2156,
    usageCount: 567,
    prompt: '狗不理包子国潮风格插画，传统美食，蒸汽缭绕，红色喜庆，现代设计元素'
  },
  {
    id: 'jm-006',
    title: '五大道·民国风情',
    subtitle: '历史建筑，欧陆风情',
    thumbnail: getPicsumUrl('wudadao-european-architecture-historic', 600, 400),
    category: 'landmark',
    tags: ['历史', '建筑', '风情'],
    likes: 1892,
    usageCount: 445,
    prompt: '天津五大道，民国建筑，欧式风格，梧桐树影，复古色调，历史感'
  },
  {
    id: 'jm-007',
    title: '津门老字号·招牌',
    subtitle: '传统招牌，百年传承',
    thumbnail: getPicsumUrl('tianjin-laozihao-traditional-signboard', 600, 400),
    category: 'brand',
    tags: ['招牌', '老字号', '传统'],
    likes: 1234,
    usageCount: 334,
    prompt: '天津老字号招牌，传统中式牌匾，金色字体，红色背景，古朴典雅'
  },
  {
    id: 'jm-008',
    title: '海河·津门水韵',
    subtitle: '母亲河畔，城市脉络',
    thumbnail: getPicsumUrl('haihe-river-tianjin-waterfront-city', 600, 400),
    category: 'landmark',
    tags: ['海河', '水韵', '城市'],
    likes: 2678,
    usageCount: 678,
    prompt: '天津海河风光，桥梁横跨，河水波光粼粼，两岸建筑，水墨画风格'
  }
];

// 分类配置
const categories = [
  { value: 'all', label: '全部', icon: 'fa-th-large', color: 'from-gray-500 to-slate-500' },
  { value: 'nianhua', label: '年画', icon: 'fa-scroll', color: 'from-red-500 to-pink-500' },
  { value: 'niren', label: '泥塑', icon: 'fa-user-circle', color: 'from-amber-500 to-orange-500' },
  { value: 'fengzheng', label: '风筝', icon: 'fa-paper-plane', color: 'from-sky-500 to-blue-500' },
  { value: 'landmark', label: '地标', icon: 'fa-landmark', color: 'from-violet-500 to-purple-500' },
  { value: 'brand', label: '老字号', icon: 'fa-store', color: 'from-emerald-500 to-teal-500' },
];

// 获取分类名称
const getCategoryName = (category: string): string => {
  const cat = categories.find(c => c.value === category);
  return cat?.label || '其他';
};

// 获取分类颜色
const getCategoryColor = (category: string): string => {
  switch (category) {
    case 'nianhua': return 'bg-gradient-to-r from-red-500 to-pink-500';
    case 'niren': return 'bg-gradient-to-r from-amber-500 to-orange-500';
    case 'fengzheng': return 'bg-gradient-to-r from-sky-500 to-blue-500';
    case 'landmark': return 'bg-gradient-to-r from-violet-500 to-purple-500';
    case 'brand': return 'bg-gradient-to-r from-emerald-500 to-teal-500';
    case 'guochao': return 'bg-gradient-to-r from-rose-500 to-red-500';
    default: return 'bg-gradient-to-r from-gray-500 to-slate-500';
  }
};

interface JinMaiTemplatesSectionProps {
  className?: string;
}

const JinMaiTemplatesSection: React.FC<JinMaiTemplatesSectionProps> = ({ className = '' }) => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 筛选模板
  const filteredTemplates = activeCategory === 'all' 
    ? jinMaiTemplates 
    : jinMaiTemplates.filter(item => item.category === activeCategory);

  // 处理模板点击 - 跳转到创作中心并触发AI生成
  const handleTemplateClick = (template: TemplateItem) => {
    // 构建模板数据，与 TemplateShowcaseGrid 保持一致
    const templateData = {
      templatePrompt: template.prompt,
      templateId: template.id,
      templateName: template.title,
      templateStyle: getTemplateStyle(template.category),
      templateCategory: getCategoryLabel(template.category)
    };

    toast.success(`正在使用「${template.title}」模板创建作品...`);

    // 跳转到创作页面，使用 location state 传递数据
    navigate('/create', {
      state: templateData
    });
  };

  // 根据分类获取模板风格
  const getTemplateStyle = (category: string): string => {
    const styleMap: Record<string, string> = {
      'nianhua': '传统年画',
      'niren': '民间工艺',
      'fengzheng': '传统工艺',
      'landmark': '城市风光',
      'brand': '国潮风格',
      'guochao': '国潮风格'
    };
    return styleMap[category] || '传统国潮';
  };

  // 获取分类中文标签
  const getCategoryLabel = (category: string): string => {
    const labelMap: Record<string, string> = {
      'nianhua': '年画',
      'niren': '泥塑',
      'fengzheng': '风筝',
      'landmark': '地标',
      'brand': '老字号',
      'guochao': '国潮'
    };
    return labelMap[category] || '其他';
  };

  // 刷新模板
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('模板已更新');
    }, 800);
  };

  // 格式化数字
  const formatNumber = (num: number | undefined | null): string => {
    if (num === undefined || num === null) {
      return '0';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  return (
    <div className={`max-w-7xl mx-auto px-4 md:px-6 mb-16 ${className}`}>
      {/* 标题栏 - 津脉特色设计 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          {/* 主图标 - 津门红渐变 */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            whileInView={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C02C38] via-[#D64545] to-[#E85D5D] flex items-center justify-center shadow-xl shadow-red-500/30"
          >
            <i className="fas fa-palette text-white text-lg"></i>
            {/* 装饰光晕 */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#C02C38] via-[#D64545] to-[#E85D5D] blur-xl opacity-50 -z-10"></div>
            {/* 角落装饰 */}
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
              <i className="fas fa-star text-[8px] text-yellow-700"></i>
            </div>
          </motion.div>
          
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#C02C38] via-[#D64545] to-[#E85D5D] bg-clip-text text-transparent`}>
                津脉作品
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r from-yellow-400 to-amber-500 text-white rounded-full">
                HOT
              </span>
            </div>
            <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              精选天津文化特色模板，一键开启创作
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* 分类筛选 - 胶囊式设计 */}
          <div className="flex gap-1.5 p-1.5 rounded-full bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm overflow-x-auto scrollbar-hide max-w-[280px] md:max-w-none">
            {categories.map(cat => (
              <motion.button
                key={cat.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveCategory(cat.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 flex items-center gap-1.5 whitespace-nowrap ${
                  activeCategory === cat.value 
                    ? `bg-gradient-to-r ${cat.color} text-white shadow-md` 
                    : isDark 
                      ? 'text-gray-400 hover:text-gray-200' 
                      : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <i className={`fas ${cat.icon}`}></i>
                {cat.label}
              </motion.button>
            ))}
          </div>

          {/* 刷新按钮 */}
          <motion.button
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
              isDark 
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 shadow-md hover:shadow-lg'
            } ${isRefreshing ? 'animate-spin' : ''}`}
            title="刷新模板"
          >
            <i className="fas fa-sync-alt text-sm"></i>
          </motion.button>
        </div>
      </div>

      {/* 模板网格 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {filteredTemplates.map((template, idx) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: idx * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
            whileHover={{ y: -10, scale: 1.02 }}
            onHoverStart={() => setHoveredCard(template.id)}
            onHoverEnd={() => setHoveredCard(null)}
            onClick={() => handleTemplateClick(template)}
            className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 ${
              isDark ? 'bg-gray-800' : 'bg-white'
            } ${hoveredCard === template.id ? 'shadow-2xl shadow-red-500/20' : 'shadow-lg shadow-gray-200/50 dark:shadow-none'}`}
          >
            {/* 缩略图容器 */}
            <div className="relative aspect-[4/5] overflow-hidden">
              <TianjinImage
                src={template.thumbnail}
                alt={template.title}
                className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                fallbackSrc="/images/placeholder-image.jpg"
                loading="lazy"
              />
              
              {/* 渐变遮罩 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
              
              {/* 分类标签 */}
              <div className="absolute top-3 left-3">
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.08 + 0.2 }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg ${getCategoryColor(template.category)} text-white flex items-center gap-1.5`}
                >
                  <i className="fas fa-layer-group text-[10px]"></i>
                  {getCategoryName(template.category)}
                </motion.span>
              </div>

              {/* 悬停显示的使用按钮和描述 */}
              <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 bg-black/60 backdrop-blur-sm p-4">
                {/* 模板描述 */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-center mb-4"
                >
                  <p className="text-white/90 text-sm leading-relaxed line-clamp-4">
                    {template.prompt}
                  </p>
                </motion.div>
                <motion.button
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-white text-gray-900 rounded-full font-semibold text-sm shadow-xl flex items-center gap-2"
                >
                  <i className="fas fa-wand-magic-sparkles text-[#C02C38]"></i>
                  使用模板
                </motion.button>
              </div>

              {/* 底部信息 */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <motion.h3 
                  className="text-white font-bold text-base mb-1 line-clamp-1 drop-shadow-lg"
                >
                  {template.title}
                </motion.h3>
                <p className="text-white/80 text-xs line-clamp-1 mb-3">
                  {template.subtitle}
                </p>
                
                {/* 标签 */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {template.tags.map((tag, i) => (
                    <span 
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                
                {/* 数据统计 */}
                <div className="flex items-center gap-4 text-xs text-white/70">
                  <span className="flex items-center gap-1">
                    <i className="fas fa-heart text-red-400"></i>
                    {formatNumber(template.likes)}
                  </span>
                  <span className="flex items-center gap-1">
                    <i className="fas fa-bolt text-yellow-400"></i>
                    {formatNumber(template.usageCount)}次使用
                  </span>
                </div>
              </div>
            </div>

            {/* 底部装饰线 - 津门红 */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C02C38] via-[#D64545] to-[#E85D5D] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </motion.div>
        ))}
      </div>

      {/* 查看更多按钮 */}
      <div className="mt-10 text-center">
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/tianjin')}
          className={`px-8 py-3 rounded-full font-semibold text-sm transition-all duration-300 flex items-center gap-2 mx-auto ${
            isDark 
              ? 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700' 
              : 'bg-white text-gray-900 hover:bg-gray-50 shadow-lg border border-gray-200'
          }`}
        >
          <span>查看全部模板</span>
          <i className="fas fa-arrow-right text-[#C02C38]"></i>
        </motion.button>
      </div>
    </div>
  );
};

export default JinMaiTemplatesSection;
