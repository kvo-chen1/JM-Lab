import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// 品牌数据接口
interface Brand {
  id: string;
  brand_name: string;
  brand_logo: string;
  description: string;
  status: string;
  created_at: string;
}

// 品牌分类映射
const getBrandCategory = (name: string): string => {
  const categoryMap: Record<string, string> = {
    '桂发祥': '传统美食',
    '狗不理': '传统美食',
    '耳朵眼': '传统美食',
    '大福来': '传统美食',
    '果仁张': '传统美食',
    '茶汤李': '传统美食',
    '石头门坎素包': '传统美食',
    '孙记烧卖': '传统美食',
    '老美华': '传统服饰',
    '亨得利表行': '钟表眼镜',
    '利顺德': '酒店文旅',
    '正兴德茶庄': '茶叶文化',
    '天津海河乳品有限公司': '乳制品',
    '海河': '乳制品',
  };
  return categoryMap[name] || '老字号';
};

// 获取品牌渐变色彩
const getBrandGradient = (name: string): string => {
  const gradientMap: Record<string, string> = {
    '桂发祥': 'from-amber-600 to-orange-700',
    '狗不理': 'from-red-600 to-rose-700',
    '耳朵眼': 'from-yellow-600 to-amber-700',
    '大福来': 'from-orange-600 to-red-700',
    '果仁张': 'from-amber-500 to-orange-600',
    '茶汤李': 'from-yellow-500 to-amber-600',
    '老美华': 'from-blue-600 to-indigo-700',
    '利顺德': 'from-purple-600 to-pink-700',
    '亨得利表行': 'from-slate-600 to-gray-700',
    '正兴德茶庄': 'from-green-600 to-emerald-700',
    '石头门坎素包': 'from-teal-600 to-green-700',
    '孙记烧卖': 'from-orange-500 to-amber-600',
    '天津海河乳品有限公司': 'from-blue-500 to-cyan-600',
    '海河': 'from-blue-500 to-cyan-600',
  };
  return gradientMap[name] || 'from-gray-600 to-slate-700';
};

// 获取品牌图标
const getBrandIcon = (name: string): string => {
  const iconMap: Record<string, string> = {
    '桂发祥': '🥨',
    '狗不理': '🥟',
    '耳朵眼': '🍘',
    '大福来': '🍜',
    '果仁张': '🌰',
    '茶汤李': '🍵',
    '老美华': '👞',
    '利顺德': '🏨',
    '亨得利表行': '⌚',
    '正兴德茶庄': '🍃',
    '石头门坎素包': '🥟',
    '孙记烧卖': '🥟',
    '天津海河乳品有限公司': '🥛',
    '海河': '🥛',
  };
  return iconMap[name] || '🏪';
};

interface PartnerBrandsSectionProps {
  className?: string;
}

const PartnerBrandsSection: React.FC<PartnerBrandsSectionProps> = ({ className = '' }) => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [hoveredBrand, setHoveredBrand] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 从 Supabase 获取品牌数据
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 从 brand_partnerships 表获取已审核通过的品牌
        const { data, error: supabaseError } = await supabase
          .from('brand_partnerships')
          .select('*')
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(12);

        if (supabaseError) {
          console.error('获取品牌数据失败:', supabaseError);
          // 如果表不存在或出错，使用静态数据
          if (supabaseError.code === '42P01' || supabaseError.message?.includes('does not exist')) {
            console.warn('brand_partnerships 表不存在，使用静态数据');
            setBrands(getStaticBrands());
          } else {
            setError('获取品牌数据失败');
            toast.error('获取品牌数据失败');
          }
          return;
        }

        if (data && data.length > 0) {
          setBrands(data);
        } else {
          // 如果没有数据，使用静态数据
          console.warn('数据库中没有品牌数据，使用静态数据');
          setBrands(getStaticBrands());
        }
      } catch (err) {
        console.error('获取品牌数据出错:', err);
        setError('获取品牌数据出错');
        toast.error('获取品牌数据出错');
        // 出错时使用静态数据
        setBrands(getStaticBrands());
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrands();
  }, []);

  // 静态品牌数据（备用）
  const getStaticBrands = (): Brand[] => [
    {
      id: '1',
      brand_name: '桂发祥',
      brand_logo: '',
      description: '创建于1927年，以十八街麻花闻名，是天津食品行业的老字号品牌。',
      status: 'approved',
      created_at: '2024-01-01',
    },
    {
      id: '2',
      brand_name: '狗不理',
      brand_logo: '',
      description: '创建于1858年，以特色包子闻名，是天津餐饮行业的代表性老字号。',
      status: 'approved',
      created_at: '2024-01-02',
    },
    {
      id: '3',
      brand_name: '耳朵眼',
      brand_logo: '',
      description: '创建于1900年，以炸糕和酒类产品闻名，是天津的传统老字号。',
      status: 'approved',
      created_at: '2024-01-03',
    },
    {
      id: '4',
      brand_name: '老美华',
      brand_logo: '',
      description: '始于民国时期的传统鞋履品牌，以手工缝制与舒适耐穿著称。',
      status: 'approved',
      created_at: '2024-01-04',
    },
    {
      id: '5',
      brand_name: '果仁张',
      brand_logo: '',
      description: '百年坚果品牌，以糖炒栗子香甜饱满闻名，老天津味道的代表。',
      status: 'approved',
      created_at: '2024-01-05',
    },
    {
      id: '6',
      brand_name: '利顺德',
      brand_logo: '',
      description: '百年酒店品牌，承载天津近代史与文化记忆，适合文旅联名。',
      status: 'approved',
      created_at: '2024-01-06',
    },
  ];

  // 处理品牌点击
  const handleBrandClick = (brand: Brand) => {
    navigate(`/business?brand=${brand.id}`);
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

  // 加载状态
  if (isLoading) {
    return (
      <div className={`max-w-7xl mx-auto px-4 md:px-6 mb-16 ${className}`}>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C02C38]"></div>
        </div>
      </div>
    );
  }

  // 错误状态或无数据
  if (error || brands.length === 0) {
    return (
      <div className={`max-w-7xl mx-auto px-4 md:px-6 mb-16 ${className}`}>
        <div className="text-center py-10">
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {error || '暂无品牌数据'}
          </p>
        </div>
      </div>
    );
  }

  // 复制品牌数据实现无缝滚动
  const displayBrands = [...brands, ...brands];

  return (
    <div className={`max-w-7xl mx-auto px-4 md:px-6 mb-16 ${className}`}>
      {/* 标题区域 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div className="flex items-center gap-4">
          {/* 主图标 */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            whileInView={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C02C38] via-[#D64545] to-[#E85D5D] flex items-center justify-center shadow-xl shadow-red-500/30"
          >
            <i className="fas fa-handshake text-white text-lg"></i>
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
                已入驻的品牌方
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r from-emerald-400 to-teal-500 text-white rounded-full">
                NEW
              </span>
            </div>
            <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              携手天津本土知名品牌，共创文化新价值
            </p>
          </div>
        </div>

        {/* 右侧统计 */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className={`flex items-center gap-6 px-6 py-3 rounded-2xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-[#C02C38]">{brands.length}+</div>
            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>合作品牌</div>
          </div>
          <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#C02C38]">50+</div>
            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>联名作品</div>
          </div>
        </motion.div>
      </div>

      {/* 品牌展示区域 */}
      <div 
        className="relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* 渐变遮罩 - 左侧 */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white dark:from-gray-950 to-transparent z-10 pointer-events-none"></div>
        {/* 渐变遮罩 - 右侧 */}
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white dark:from-gray-950 to-transparent z-10 pointer-events-none"></div>

        {/* 滚动容器 */}
        <div className="overflow-hidden py-4">
          <motion.div 
            className="flex gap-5"
            animate={{
              x: isPaused ? 0 : [0, -1920]
            }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 30,
                ease: "linear",
              }
            }}
          >
            {displayBrands.map((brand, idx) => {
              const gradient = getBrandGradient(brand.brand_name);
              const icon = getBrandIcon(brand.brand_name);
              const category = getBrandCategory(brand.brand_name);
              
              return (
                <motion.div
                  key={`${brand.id}-${idx}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onHoverStart={() => setHoveredBrand(brand.id)}
                  onHoverEnd={() => setHoveredBrand(null)}
                  onClick={() => handleBrandClick(brand)}
                  className={`group relative flex-shrink-0 w-64 cursor-pointer transition-all duration-500 ${
                    hoveredBrand === brand.id ? 'scale-105 z-10' : 'scale-100'
                  }`}
                >
                  {/* 卡片主体 */}
                  <div className={`
                    relative p-5 rounded-2xl transition-all duration-500 overflow-hidden
                    ${isDark 
                      ? 'bg-gray-800/80 border border-gray-700/50 hover:border-gray-600' 
                      : 'bg-white border border-gray-100 hover:border-gray-200'
                    }
                    ${hoveredBrand === brand.id ? 'shadow-2xl' : 'shadow-lg'}
                  `}>
                    {/* 顶部渐变条 */}
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`}></div>
                    
                    {/* 背景装饰 */}
                    <div className={`
                      absolute -right-10 -top-10 w-32 h-32 rounded-full opacity-10 transition-all duration-500
                      bg-gradient-to-br ${gradient}
                      group-hover:scale-150 group-hover:opacity-20
                    `}></div>

                    {/* 品牌图标 */}
                    <div className="relative mb-4">
                      {brand.brand_logo ? (
                        <img 
                          src={brand.brand_logo} 
                          alt={brand.brand_name}
                          className="w-16 h-16 rounded-2xl object-cover shadow-lg"
                        />
                      ) : (
                        <motion.div 
                          className={`
                            w-16 h-16 rounded-2xl flex items-center justify-center text-3xl
                            bg-gradient-to-br ${gradient} shadow-lg
                            transition-transform duration-500
                          `}
                          whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                          transition={{ duration: 0.5 }}
                        >
                          {icon}
                        </motion.div>
                      )}
                      {/* 认证徽章 */}
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">
                        <i className="fas fa-check text-white text-[10px]"></i>
                      </div>
                    </div>

                    {/* 品牌信息 */}
                    <div className="relative">
                      <h3 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {brand.brand_name}
                      </h3>
                      <span className={`
                        inline-block px-2 py-0.5 rounded-full text-[10px] font-medium mb-2
                        ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}
                      `}>
                        {category}
                      </span>
                      <p className={`text-sm line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {brand.description}
                      </p>
                    </div>

                    {/* 悬停显示的按钮 */}
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: hoveredBrand === brand.id ? 1 : 0, y: hoveredBrand === brand.id ? 0 : 10 }}
                      transition={{ duration: 0.2 }}
                      className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
                    >
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBrandClick(brand);
                        }}
                        className={`
                          w-full py-2 rounded-xl text-sm font-medium transition-all duration-300
                          bg-gradient-to-r ${gradient} text-white
                          hover:shadow-lg
                        `}
                      >
                        查看详情
                      </button>
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* 底部合作邀请 */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`
          mt-10 p-6 rounded-2xl text-center
          ${isDark 
            ? 'bg-gradient-to-r from-gray-800/50 to-gray-800/30 border border-gray-700/50' 
            : 'bg-gradient-to-r from-gray-50 to-white border border-gray-100'
          }
        `}
      >
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C02C38] to-[#E85D5D] flex items-center justify-center">
              <i className="fas fa-building text-white"></i>
            </div>
            <div className="text-left">
              <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                您的品牌也想加入？
              </h4>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                与我们合作，共创文化新价值
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/business')}
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#C02C38] to-[#E85D5D] text-white font-medium text-sm shadow-lg shadow-red-500/30 hover:shadow-xl transition-shadow"
          >
            申请入驻
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default PartnerBrandsSection;
