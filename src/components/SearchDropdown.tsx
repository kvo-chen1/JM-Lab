import React, { memo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, TrendingUp, Sparkles } from 'lucide-react';
import { SearchResultType } from './SearchBar';
import './SearchDropdown.css';

// 搜索建议项类型
export interface SearchSuggestion {
  id: string;
  text: string;
  type: SearchResultType;
  icon?: string;
  group?: string;
  image?: string;
  metadata?: {
    count?: number;
    trend?: 'up' | 'down' | 'stable';
    timestamp?: string;
  };
  onRemove?: () => void;
}

interface SearchDropdownProps {
  show: boolean;
  isDark: boolean;
  isLoading: boolean;
  search: string;
  searchHistory: Array<{ id: string; query: string; created_at: string }>;
  hotSearches: Array<{ id: string; query: string; search_count: number; trend_score: number; category?: string }>;
  recommendedSearches: Array<{ id: string; keyword: string; category?: string; image?: string }>;
  error: string | null;
  onSelect: (suggestion: SearchSuggestion) => void;
  onClearHistory: () => void;
  onRemoveHistoryItem: (id: string) => void;
  onRetry: () => void;
}

// 图片库 - 按分类组织 - 使用 picsum.photos 更可靠 (使用 150x150 更大尺寸)
const imageLibrary: Record<string, string[]> = {
  design: [
    'https://picsum.photos/seed/design1/150/150',
    'https://picsum.photos/seed/design2/150/150',
    'https://picsum.photos/seed/design3/150/150',
    'https://picsum.photos/seed/design4/150/150',
    'https://picsum.photos/seed/design5/150/150',
  ],
  culture: [
    'https://picsum.photos/seed/culture1/150/150',
    'https://picsum.photos/seed/culture2/150/150',
    'https://picsum.photos/seed/culture3/150/150',
    'https://picsum.photos/seed/culture4/150/150',
  ],
  product: [
    'https://picsum.photos/seed/product1/150/150',
    'https://picsum.photos/seed/product2/150/150',
    'https://picsum.photos/seed/product3/150/150',
  ],
  tech: [
    'https://picsum.photos/seed/tech1/150/150',
    'https://picsum.photos/seed/tech2/150/150',
    'https://picsum.photos/seed/tech3/150/150',
  ],
  study: [
    'https://picsum.photos/seed/study1/150/150',
    'https://picsum.photos/seed/study2/150/150',
    'https://picsum.photos/seed/study3/150/150',
  ],
  art: [
    'https://picsum.photos/seed/art1/150/150',
    'https://picsum.photos/seed/art2/150/150',
    'https://picsum.photos/seed/art3/150/150',
  ],
  nature: [
    'https://picsum.photos/seed/nature1/150/150',
    'https://picsum.photos/seed/nature2/150/150',
    'https://picsum.photos/seed/nature3/150/150',
  ],
  architecture: [
    'https://picsum.photos/seed/arch1/150/150',
    'https://picsum.photos/seed/arch2/150/150',
  ],
  food: [
    'https://picsum.photos/seed/food1/150/150',
    'https://picsum.photos/seed/food2/150/150',
  ],
  travel: [
    'https://picsum.photos/seed/travel1/150/150',
    'https://picsum.photos/seed/travel2/150/150',
  ],
  fashion: [
    'https://picsum.photos/seed/fashion1/150/150',
    'https://picsum.photos/seed/fashion2/150/150',
  ],
  business: [
    'https://picsum.photos/seed/business1/150/150',
    'https://picsum.photos/seed/business2/150/150',
  ],
  lifestyle: [
    'https://picsum.photos/seed/life1/150/150',
    'https://picsum.photos/seed/life2/150/150',
  ],
};

// 关键词到分类的映射
const keywordToCategory: Record<string, string> = {
  // 设计类
  '设计': 'design', '品牌': 'design', '包装': 'design', '海报': 'design', 'logo': 'design',
  '标志': 'design', 'vi': 'design', 'ui': 'design', '平面': 'design', '视觉': 'design',
  '插画': 'art', '纹样': 'design', '图案': 'design', 'ip': 'design', '形象': 'design',
  
  // 文化类
  '文化': 'culture', '非遗': 'culture', '传承': 'culture', '传统': 'culture',
  '民俗': 'culture', '艺术': 'art', '天津': 'culture', '国潮': 'culture',
  
  // 产品类
  '产品': 'product', '文创': 'product', '商品': 'product', '物品': 'product',
  
  // 科技类
  'ai': 'tech', '人工智能': 'tech', '科技': 'tech', '技术': 'tech', '智能': 'tech',
  '数字': 'tech', '代码': 'tech', '程序': 'tech', '软件': 'tech', '硬件': 'tech',
  
  // 学习类
  '学习': 'study', '教育': 'study', '读书': 'study', '知识': 'study', '课程': 'study',
  '教程': 'study', '培训': 'study', '学校': 'study', '大学': 'study',
  
  // 艺术类
  '绘画': 'art', '美术': 'art', '油画': 'art', '水彩': 'art', '素描': 'art',
  '雕塑': 'art', '摄影': 'art', '照片': 'art', '画廊': 'art', '展览': 'art',
  
  // 自然类
  '自然': 'nature', '风景': 'nature', '山水': 'nature', '植物': 'nature', '动物': 'nature',
  '海河': 'nature', '河流': 'nature', '海洋': 'nature', '山': 'nature', '森林': 'nature',
  
  // 建筑类
  '建筑': 'architecture', '房子': 'architecture', '室内': 'architecture', '装修': 'architecture',
  '空间': 'architecture', '景观': 'architecture', '园林': 'architecture',
  
  // 美食类
  '美食': 'food', '食物': 'food', '餐饮': 'food', '料理': 'food', '烹饪': 'food',
  '餐厅': 'food', '小吃': 'food', '甜点': 'food', '咖啡': 'food', '茶': 'food',
  
  // 旅行类
  '旅行': 'travel', '旅游': 'travel', '景点': 'travel', '度假': 'travel', '酒店': 'travel',
  '民宿': 'travel', '出行': 'travel', '探险': 'travel', '户外': 'travel',
  
  // 时尚类
  '时尚': 'fashion', '服装': 'fashion', '穿搭': 'fashion', '潮流': 'fashion', '服饰': 'fashion',
  '美妆': 'fashion', '护肤': 'fashion', '化妆': 'fashion', '发型': 'fashion',
  
  // 商业类
  '商业': 'business', '营销': 'business', '市场': 'business', '创业': 'business', '投资': 'business',
  '金融': 'business', '经济': 'business', '管理': 'business', '运营': 'business',
  
  // 生活方式
  '生活': 'lifestyle', '家居': 'lifestyle', '家具': 'lifestyle', '装饰': 'lifestyle',
  '健康': 'lifestyle', '运动': 'lifestyle', '健身': 'lifestyle', '瑜伽': 'lifestyle',
  '宠物': 'lifestyle', '亲子': 'lifestyle', '家庭': 'lifestyle',
};

// 图片缓存
const imageCache: Record<string, string> = {};

// 获取默认推荐图片
const getDefaultImage = (keyword: string): string => {
  // 检查缓存
  if (imageCache[keyword]) {
    return imageCache[keyword];
  }
  // 精确匹配 - 使用 picsum.photos 更可靠 (使用 150x150 更大尺寸)
  const exactMatch: Record<string, string> = {
    '国潮设计': 'https://picsum.photos/seed/guochao/150/150',
    '纹样设计': 'https://picsum.photos/seed/pattern/150/150',
    '品牌设计': 'https://picsum.photos/seed/brand/150/150',
    '非遗传承': 'https://picsum.photos/seed/heritage/150/150',
    '插画设计': 'https://picsum.photos/seed/illustration/150/150',
    '文创产品': 'https://picsum.photos/seed/product/150/150',
    '天津文化': 'https://picsum.photos/seed/tianjin/150/150',
    'IP设计': 'https://picsum.photos/seed/ipdesign/150/150',
    '包装设计': 'https://picsum.photos/seed/package/150/150',
    '海报设计': 'https://picsum.photos/seed/poster/150/150',
    'ai': 'https://picsum.photos/seed/ai/150/150',
    '学习': 'https://picsum.photos/seed/study/150/150',
    '海河': 'https://picsum.photos/seed/river/150/150',
  };
  
  if (exactMatch[keyword]) {
    return exactMatch[keyword];
  }
  
  // 根据关键词分类选择图片
  const lowerKeyword = keyword.toLowerCase();
  let category = 'design'; // 默认分类
  
  // 查找关键词匹配的分类
  for (const [key, cat] of Object.entries(keywordToCategory)) {
    if (lowerKeyword.includes(key.toLowerCase())) {
      category = cat;
      break;
    }
  }
  
  // 从对应分类中根据关键词哈希选择图片
  const categoryImages = imageLibrary[category] || imageLibrary.design;
  const hash = keyword.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = hash % categoryImages.length;
  
  const selectedImage = categoryImages[index];
  
  // 保存到缓存
  imageCache[keyword] = selectedImage;
  
  return selectedImage;
};

// 搜索历史项组件
const HistoryItem = memo(({ 
  item, 
  isDark, 
  onSelect, 
  onRemove 
}: { 
  item: { id: string; query: string }; 
  isDark: boolean; 
  onSelect: () => void;
  onRemove: (e: React.MouseEvent) => void;
}) => (
  <motion.div
    className={`search-dropdown-item ${isDark ? 'dark' : ''}`}
    onMouseDown={(e) => {
      e.preventDefault();
      onSelect();
    }}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    <div className="search-dropdown-item-image">
      <img 
        src={getDefaultImage(item.query)} 
        alt={item.query}
        loading="lazy"
        onError={(e) => {
          const img = e.target as HTMLImageElement;
          // 如果主图片加载失败，尝试使用 picsum
          const hash = item.query.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          img.src = `https://picsum.photos/seed/${hash}/150/150`;
          // 如果 picsum 也失败，使用纯色背景
          img.onerror = () => {
            const text = encodeURIComponent(item.query.slice(0, 2));
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#e0e0e0"/><text x="50" y="50" font-family="Arial" font-size="14" fill="#666" text-anchor="middle" dy=".3em">${text}</text></svg>`;
            img.src = 'data:image/svg+xml;base64,' + btoa(svg);
          };
        }}
      />
    </div>
    <span className="search-dropdown-item-text" title={item.query}>{item.query}</span>
    <button 
      className="search-dropdown-item-remove"
      onClick={onRemove}
      aria-label="删除"
    >
      <X size={14} />
    </button>
  </motion.div>
));

// 推荐/热门项组件
const SuggestionItem = memo(({ 
  item, 
  isDark, 
  onSelect,
  showTrend = false,
  trendIndex = 0
}: { 
  item: { id: string; text: string; image?: string }; 
  isDark: boolean; 
  onSelect: () => void;
  showTrend?: boolean;
  trendIndex?: number;
}) => (
  <motion.div
    className={`search-dropdown-item ${isDark ? 'dark' : ''}`}
    onMouseDown={(e) => {
      e.preventDefault();
      onSelect();
    }}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    <div className="search-dropdown-item-image">
      <img
        src={item.image || getDefaultImage(item.text)}
        alt={item.text}
        loading="lazy"
        onError={(e) => {
          const img = e.target as HTMLImageElement;
          // 如果主图片加载失败，尝试使用 picsum
          const hash = item.text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          img.src = `https://picsum.photos/seed/${hash}/150/150`;
          // 如果 picsum 也失败，使用纯色背景显示前两个字符
          img.onerror = () => {
            const text = encodeURIComponent(item.text.slice(0, 2));
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#e0e0e0"/><text x="50" y="50" font-family="Arial" font-size="14" fill="#666" text-anchor="middle" dy=".3em">${text}</text></svg>`;
            img.src = 'data:image/svg+xml;base64,' + btoa(svg);
          };
        }}
      />
    </div>
    <span className="search-dropdown-item-text">{item.text}</span>
    {showTrend && trendIndex < 3 && (
      <div className="search-dropdown-item-trend">
        <TrendingUp size={14} />
      </div>
    )}
  </motion.div>
));

// 分组标题组件
const SectionHeader = memo(({ 
  title, 
  icon: Icon, 
  action,
  isDark 
}: { 
  title: string; 
  icon: React.ElementType;
  action?: React.ReactNode;
  isDark: boolean;
}) => (
  <div className={`search-dropdown-section-header ${isDark ? 'dark' : ''}`}>
    <div className="search-dropdown-section-title">
      <Icon size={18} />
      <span>{title}</span>
    </div>
    {action && <div className="search-dropdown-section-action">{action}</div>}
  </div>
));

const SearchDropdown: React.FC<SearchDropdownProps> = memo(({
  show,
  isDark,
  isLoading,
  search,
  searchHistory,
  hotSearches,
  recommendedSearches,
  error,
  onSelect,
  onClearHistory,
  onRemoveHistoryItem,
  onRetry
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // 处理选择
  const handleSelect = (text: string, type: SearchResultType) => {
    onSelect({
      id: Math.random().toString(36).substr(2, 9),
      text,
      type
    });
  };

  // 如果没有输入，显示完整下拉面板
  if (!search.trim()) {
    return (
      <AnimatePresence>
        {show && (
          <motion.div
            className={`search-dropdown ${isDark ? 'dark' : ''}`}
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            {/* 错误提示 */}
            {error && (
              <div className="search-dropdown-error">
                <span>{error}</span>
                <button onClick={onRetry}>重试</button>
              </div>
            )}

            {/* 最近搜索 */}
            {searchHistory.length > 0 ? (
              <div className="search-dropdown-section">
                <SectionHeader
                  title="最近搜索"
                  icon={Clock}
                  isDark={isDark}
                  action={
                    <button 
                      className="search-dropdown-clear-btn"
                      onClick={onClearHistory}
                    >
                      清空
                    </button>
                  }
                />
                <div className="search-dropdown-grid">
                  {searchHistory.slice(0, 8).map((item) => (
                    <HistoryItem
                      key={item.id}
                      item={item}
                      isDark={isDark}
                      onSelect={() => handleSelect(item.query, SearchResultType.HISTORY)}
                      onRemove={(e) => {
                        e.stopPropagation();
                        onRemoveHistoryItem(item.id);
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              /* 无搜索历史时显示提示 */
              <div className="search-dropdown-section">
                <SectionHeader
                  title="最近搜索"
                  icon={Clock}
                  isDark={isDark}
                />
                <div className="search-dropdown-empty-state">
                  <p>暂无搜索历史</p>
                </div>
              </div>
            )}

            {/* 为你推荐 */}
            {recommendedSearches.length > 0 && (
              <div className="search-dropdown-section">
                <SectionHeader
                  title="为你推荐"
                  icon={Sparkles}
                  isDark={isDark}
                />
                <div className="search-dropdown-grid">
                  {recommendedSearches.slice(0, 8).map((item) => (
                    <SuggestionItem
                      key={item.id}
                      item={{ 
                        id: item.id, 
                        text: item.keyword, 
                        image: item.image 
                      }}
                      isDark={isDark}
                      onSelect={() => handleSelect(item.keyword, SearchResultType.TAG)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 热门搜索 */}
            {hotSearches.length > 0 && (
              <div className="search-dropdown-section">
                <SectionHeader
                  title="热门搜索"
                  icon={TrendingUp}
                  isDark={isDark}
                />
                <div className="search-dropdown-grid">
                  {hotSearches.slice(0, 8).map((item, index) => (
                    <SuggestionItem
                      key={item.id}
                      item={{ 
                        id: item.id, 
                        text: item.query 
                      }}
                      isDark={isDark}
                      onSelect={() => handleSelect(item.query, SearchResultType.TAG)}
                      showTrend={true}
                      trendIndex={index}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 空状态 */}
            {!isLoading && searchHistory.length === 0 && recommendedSearches.length === 0 && hotSearches.length === 0 && (
              <div className="search-dropdown-empty">
                <p>开始搜索，发现精彩内容</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // 有输入时，显示实时建议（简化版）
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={`search-dropdown search-dropdown-simple ${isDark ? 'dark' : ''}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
        >
          {isLoading ? (
            <div className="search-dropdown-loading">
              <div className="search-dropdown-spinner" />
              <span>搜索中...</span>
            </div>
          ) : (
            <>
              <div
                className="search-dropdown-simple-item search-dropdown-enter"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(search, SearchResultType.TAG);
                }}
              >
                <span className="search-dropdown-enter-icon">↵</span>
                <span>搜索 "{search}"</span>
              </div>

              {recommendedSearches
                .filter(item => item.keyword.toLowerCase().includes(search.toLowerCase()))
                .slice(0, 5)
                .map((item) => (
                  <div
                    key={item.id}
                    className="search-dropdown-simple-item"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(item.keyword, SearchResultType.TAG);
                    }}
                  >
                    <span className="search-dropdown-simple-icon">🔍</span>
                    <span>{item.keyword}</span>
                  </div>
                ))}
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default SearchDropdown;
