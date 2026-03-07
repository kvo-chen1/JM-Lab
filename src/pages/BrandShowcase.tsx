import { useState, useEffect, useContext } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { brandShowcaseService, BrandShowcase as BrandShowcaseType } from '@/services/brandShowcaseService';
import { brandPartnershipService, BrandPartnership } from '@/services/brandPartnershipService';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Globe,
  MapPin,
  Phone,
  Mail,
  Eye,
  Heart,
  Share2,
  Award,
  History,
  Sparkles,
  Package,
  Building2,
  ChevronRight,
  ExternalLink,
  Play,
  Image as ImageIcon,
} from 'lucide-react';

// 品牌卡片组件
const BrandCard = ({
  brand,
  onClick,
  isDark,
}: {
  brand: BrandShowcaseType;
  onClick: () => void;
  isDark: boolean;
}) => {
  return (
    <motion.div
      layoutId={`brand-${brand.id}`}
      onClick={onClick}
      className={`
        group relative overflow-hidden rounded-2xl cursor-pointer
        ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}
        border hover:shadow-2xl transition-all duration-500
      `}
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* 封面图 */}
      <div className="relative h-48 overflow-hidden">
        <motion.img
          src={brand.brand_cover || brand.brand_logo}
          alt={brand.brand_name}
          className="w-full h-full object-cover"
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.6 }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Logo 悬浮 */}
        <div className="absolute bottom-4 left-4 flex items-end gap-3">
          <motion.div
            className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white shadow-lg"
            whileHover={{ scale: 1.1 }}
          >
            <img
              src={brand.brand_logo}
              alt={brand.brand_name}
              className="w-full h-full object-cover"
            />
          </motion.div>
        </div>

        {/* 浏览量 */}
        <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 rounded-full bg-black/30 backdrop-blur-sm text-white text-xs">
          <Eye className="w-3 h-3" />
          {brand.view_count || 0}
        </div>
      </div>

      {/* 内容 */}
      <div className="p-5">
        <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {brand.brand_name}
        </h3>
        
        {brand.brand_slogan && (
          <p className={`text-sm mb-3 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {brand.brand_slogan}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs">
            {brand.brand_achievements && brand.brand_achievements.length > 0 && (
              <span className={`flex items-center gap-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                <Award className="w-3 h-3" />
                {brand.brand_achievements.length} 项荣誉
              </span>
            )}
            {brand.brand_gallery && brand.brand_gallery.length > 0 && (
              <span className={`flex items-center gap-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                <ImageIcon className="w-3 h-3" />
                {brand.brand_gallery.length} 张图片
              </span>
            )}
          </div>
          <ChevronRight className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
        </div>
      </div>
    </motion.div>
  );
};

// 品牌详情模态框
const BrandDetailModal = ({
  brand,
  isOpen,
  onClose,
  isDark,
}: {
  brand: BrandShowcaseType | null;
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}) => {
  const [activeTab, setActiveTab] = useState<'story' | 'culture' | 'products' | 'gallery'>('story');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && brand) {
      brandShowcaseService.incrementViewCount(brand.brand_id);
    }
  }, [isOpen, brand]);

  if (!brand) return null;

  const tabs = [
    { id: 'story', label: '品牌故事', icon: History },
    { id: 'culture', label: '品牌文化', icon: Sparkles },
    { id: 'products', label: '产品服务', icon: Package },
    { id: 'gallery', label: '品牌图库', icon: ImageIcon },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* 模态框 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`
              fixed inset-4 md:inset-10 lg:inset-20 rounded-3xl overflow-hidden z-[101]
              ${isDark ? 'bg-gray-900' : 'bg-white'}
              shadow-2xl flex flex-col
            `}
          >
            {/* 头部 */}
            <div className="relative h-48 sm:h-56 md:h-64 flex-shrink-0">
              <img
                src={brand.brand_cover || brand.brand_logo}
                alt={brand.brand_name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              
              {/* 关闭按钮 */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors z-10"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* 品牌信息 */}
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8">
                <div className="flex items-end gap-3 sm:gap-4">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl sm:rounded-2xl overflow-hidden border-2 sm:border-4 border-white shadow-xl bg-white flex-shrink-0"
                  >
                    <img
                      src={brand.brand_logo}
                      alt={brand.brand_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-lg sm:text-xl">${brand.brand_name.charAt(0)}</div>`;
                      }}
                    />
                  </motion.div>
                  <div className="flex-1 min-w-0 pb-1 sm:pb-2">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-0.5 sm:mb-1 truncate">
                      {brand.brand_name}
                    </h2>
                    {brand.brand_slogan && (
                      <p className="text-white/80 text-xs sm:text-sm md:text-base line-clamp-1">{brand.brand_slogan}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 pb-1 sm:pb-2 flex-shrink-0">
                    <button className="p-1.5 sm:p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors">
                      <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <button className="p-1.5 sm:p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors">
                      <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 标签栏 */}
            <div className={`flex-shrink-0 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
              <div className="flex px-4 sm:px-6 overflow-x-auto scrollbar-hide">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`
                      flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-colors relative whitespace-nowrap
                      ${activeTab === tab.id
                        ? isDark ? 'text-blue-400' : 'text-blue-600'
                        : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                      }
                    `}
                  >
                    <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    {tab.label}
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeTab"
                        className={`absolute bottom-0 left-0 right-0 h-0.5 ${isDark ? 'bg-blue-400' : 'bg-blue-600'}`}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 内容区 */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* 品牌故事 */}
                  {activeTab === 'story' && (
                    <div className="space-y-6">
                      {brand.brand_value && (
                        <div className={`
                          p-6 rounded-2xl border-l-4
                          ${isDark ? 'bg-gray-800/50 border-blue-500' : 'bg-blue-50 border-blue-500'}
                        `}>
                          <h3 className={`text-lg font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            品牌价值
                          </h3>
                          <p className={`leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {brand.brand_value}
                          </p>
                        </div>
                      )}
                      
                      {brand.brand_story && (
                        <div>
                          <h3 className={`text-lg font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            品牌故事
                          </h3>
                          <p className={`leading-relaxed whitespace-pre-line ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {brand.brand_story}
                          </p>
                        </div>
                      )}

                      {brand.brand_history && (
                        <div>
                          <h3 className={`text-lg font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            发展历程
                          </h3>
                          <p className={`leading-relaxed whitespace-pre-line ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {brand.brand_history}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 品牌文化 */}
                  {activeTab === 'culture' && (
                    <div className="space-y-6">
                      {brand.brand_culture ? (
                        <div className={`
                          p-6 rounded-2xl
                          ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}
                        `}>
                          <p className={`leading-relaxed whitespace-pre-line ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {brand.brand_culture}
                          </p>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Sparkles className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                          <p className={isDark ? 'text-gray-500' : 'text-gray-500'}>暂无品牌文化介绍</p>
                        </div>
                      )}

                      {brand.brand_achievements && brand.brand_achievements.length > 0 && (
                        <div>
                          <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            荣誉成就
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {brand.brand_achievements.map((achievement, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`
                                  flex items-start gap-3 p-4 rounded-xl
                                  ${isDark ? 'bg-gray-800/50' : 'bg-white border border-gray-200'}
                                `}
                              >
                                <Award className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
                                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{achievement}</span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 产品服务 */}
                  {activeTab === 'products' && (
                    <div className="space-y-6">
                      {brand.brand_products ? (
                        <div className={`
                          p-6 rounded-2xl
                          ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}
                        `}>
                          <p className={`leading-relaxed whitespace-pre-line ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {brand.brand_products}
                          </p>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Package className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                          <p className={isDark ? 'text-gray-500' : 'text-gray-500'}>暂无产品服务介绍</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 品牌图库 */}
                  {activeTab === 'gallery' && (
                    <div>
                      {brand.brand_gallery && brand.brand_gallery.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {brand.brand_gallery.map((image, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.05 }}
                              onClick={() => setSelectedImage(image)}
                              className="aspect-square rounded-xl overflow-hidden cursor-pointer group"
                            >
                              <img
                                src={image}
                                alt={`${brand.brand_name} - ${index + 1}`}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                              />
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <ImageIcon className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                          <p className={isDark ? 'text-gray-500' : 'text-gray-500'}>暂无品牌图片</p>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* 底部联系信息 */}
            {(brand.brand_website || brand.brand_social || brand.contact_info) && (
              <div className={`
                flex-shrink-0 p-3 sm:p-4 border-t
                ${isDark ? 'border-gray-800 bg-gray-800/30' : 'border-gray-200 bg-gray-50'}
              `}>
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
                  {brand.brand_website && (
                    <a
                      href={brand.brand_website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`
                        flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm
                        ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'}
                        transition-colors
                      `}
                    >
                      <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">官方网站</span>
                      <span className="sm:hidden">官网</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {brand.contact_info?.phone && (
                    <a
                      href={`tel:${brand.contact_info.phone}`}
                      className={`
                        flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm
                        ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'}
                        transition-colors
                      `}
                    >
                      <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      {brand.contact_info.phone}
                    </a>
                  )}
                  {brand.contact_info?.email && (
                    <a
                      href={`mailto:${brand.contact_info.email}`}
                      className={`
                        flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm
                        ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'}
                        transition-colors
                      `}
                    >
                      <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">{brand.contact_info.email}</span>
                      <span className="sm:hidden">邮件</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </motion.div>

          {/* 图片预览 */}
          <AnimatePresence>
            {selectedImage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedImage(null)}
                className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4"
              >
                <motion.img
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                  src={selectedImage}
                  alt="预览"
                  className="max-w-full max-h-full rounded-lg"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
};

export default function BrandShowcase() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [showcases, setShowcases] = useState<BrandShowcaseType[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<BrandShowcaseType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadShowcases();
  }, []);

  const loadShowcases = async () => {
    setIsLoading(true);
    try {
      const data = await brandShowcaseService.getPublishedShowcases();
      setShowcases(data);
    } catch (error) {
      console.error('加载品牌展示失败:', error);
      toast.error('加载品牌展示失败');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredShowcases = showcases.filter((showcase) =>
    showcase.brand_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (showcase.brand_slogan?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* 头部区域 */}
      <div className={`
        relative overflow-hidden
        ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-blue-50 to-purple-50'}
      `}>
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-medium mb-6">
              <Building2 className="w-4 h-4" />
              品牌展示中心
            </div>
            <h1 className={`text-4xl md:text-5xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              探索入驻品牌的
              <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                独特魅力
              </span>
            </h1>
            <p className={`text-lg max-w-2xl mx-auto mb-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              了解每个品牌背后的故事、价值和文化，发现与您的创意理念相契合的合作伙伴
            </p>

            {/* 搜索框 */}
            <div className="max-w-xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索品牌名称..."
                  className={`
                    w-full px-6 py-4 pl-14 rounded-2xl text-lg
                    ${isDark 
                      ? 'bg-gray-800/80 text-white placeholder-gray-500 border-gray-700 focus:border-blue-500' 
                      : 'bg-white text-gray-900 placeholder-gray-400 border-gray-200 focus:border-blue-500'}
                    border-2 focus:outline-none focus:ring-4 focus:ring-blue-500/20
                    transition-all
                  `}
                />
                <svg
                  className={`absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 品牌列表 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className={`
                  rounded-2xl overflow-hidden animate-pulse
                  ${isDark ? 'bg-gray-800' : 'bg-white'}
                `}
              >
                <div className={`h-48 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
                <div className="p-5 space-y-3">
                  <div className={`h-6 w-1/3 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
                  <div className={`h-4 w-full rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
                  <div className={`h-4 w-2/3 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredShowcases.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredShowcases.map((showcase, index) => (
              <motion.div
                key={showcase.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <BrandCard
                  brand={showcase}
                  onClick={() => setSelectedBrand(showcase)}
                  isDark={isDark}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className={`
              w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center
              ${isDark ? 'bg-gray-800' : 'bg-gray-100'}
            `}>
              <Building2 className={`w-12 h-12 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
            </div>
            <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {searchQuery ? '未找到匹配的品牌' : '暂无品牌展示'}
            </h3>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {searchQuery ? '请尝试其他关键词搜索' : '品牌展示内容正在筹备中，敬请期待'}
            </p>
          </motion.div>
        )}
      </div>

      {/* 品牌详情模态框 */}
      <BrandDetailModal
        brand={selectedBrand}
        isOpen={!!selectedBrand}
        onClose={() => setSelectedBrand(null)}
        isDark={isDark}
      />
    </div>
  );
}
