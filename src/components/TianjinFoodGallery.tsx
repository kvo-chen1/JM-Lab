import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Clock, Flame } from 'lucide-react';

interface FoodItem {
  id: number;
  name: string;
  category: '三绝' | '小吃' | '海鲜' | '传统';
  description: string;
  history: string;
  features: string[];
  color: string;
  icon: string;
  rating: number;
  difficulty: '简单' | '中等' | '复杂';
  time: string;
}

const foodItems: FoodItem[] = [
  {
    id: 1,
    name: '狗不理包子',
    category: '三绝',
    description: '天津"三绝"之首，以其选料精细、制作讲究、口感鲜美而闻名',
    history: '创始于清朝咸丰年间（1858年），由高贵友创立，因其乳名"狗子"且生意兴隆不理人，故名"狗不理"',
    features: ['皮薄馅大', '十八个褶', '口感鲜美', '汤汁丰富'],
    color: '#8B4513',
    icon: '🥟',
    rating: 5,
    difficulty: '复杂',
    time: '30分钟'
  },
  {
    id: 2,
    name: '十八街麻花',
    category: '三绝',
    description: '桂发祥十八街麻花，酥脆香甜，久放不绵，是天津传统名点',
    history: '创始于1927年，因店铺位于天津南市十八街而得名，以香、甜、酥、脆著称',
    features: ['酥脆香甜', '久放不绵', '层次分明', '口感丰富'],
    color: '#C68E17',
    icon: '🥨',
    rating: 5,
    difficulty: '复杂',
    time: '40分钟'
  },
  {
    id: 3,
    name: '耳朵眼炸糕',
    category: '三绝',
    description: '天津"三绝"之一，外酥里嫩，香甜可口，是天津传统小吃',
    history: '创始于清朝光绪年间，因店铺靠近耳朵眼胡同而得名，以糯米为皮，红豆为馅',
    features: ['外酥里嫩', '香甜可口', '色泽金黄', '口感软糯'],
    color: '#D4A84B',
    icon: '🍘',
    rating: 5,
    difficulty: '中等',
    time: '20分钟'
  },
  {
    id: 4,
    name: '煎饼果子',
    category: '小吃',
    description: '天津最具代表性的早餐，绿豆面煎饼裹油条，配以各种调料',
    history: '起源于天津，已有百年历史，是天津人最爱的早餐之一，体现了天津人的智慧',
    features: ['绿豆面皮', '香脆油条', '酱料丰富', '营养均衡'],
    color: '#E8C878',
    icon: '🌯',
    rating: 4.5,
    difficulty: '中等',
    time: '5分钟'
  },
  {
    id: 5,
    name: '锅巴菜',
    category: '小吃',
    description: '天津传统早餐，以绿豆面煎饼切成条状，配以卤汁和调料',
    history: '起源于清朝，是天津特有的传统小吃，因使用锅巴（煎饼）制作而得名',
    features: ['口感独特', '卤汁浓郁', '营养丰富', '老少皆宜'],
    color: '#A0522D',
    icon: '🍜',
    rating: 4.5,
    difficulty: '中等',
    time: '15分钟'
  },
  {
    id: 6,
    name: '罾蹦鲤鱼',
    category: '海鲜',
    description: '天津传统名菜，以带鳞活鲤鱼炸制而成，形似罾网中的活鱼',
    history: '起源于清朝光绪年间，是天津传统名菜，体现了天津厨师的高超技艺',
    features: ['鳞骨酥脆', '肉质鲜嫩', '酸甜适口', '造型独特'],
    color: '#FF6B6B',
    icon: '🐟',
    rating: 5,
    difficulty: '复杂',
    time: '45分钟'
  },
  {
    id: 7,
    name: '笃面筋',
    category: '传统',
    description: '天津传统素菜，以面筋为主料，配以多种蔬菜烧制而成',
    history: '天津传统家常菜，"笃"是天津方言，意为小火慢炖，体现了天津人的烹饪智慧',
    features: ['口感筋道', '味道醇厚', '营养丰富', '素食佳品'],
    color: '#4A9B5E',
    icon: '🥗',
    rating: 4,
    difficulty: '中等',
    time: '30分钟'
  },
  {
    id: 8,
    name: '熟梨糕',
    category: '小吃',
    description: '天津传统糕点，以大米磨粉蒸制而成，配以各种果酱',
    history: '起源于清朝，是天津传统糕点，因蒸熟后形似梨而得名，深受儿童喜爱',
    features: ['口感软糯', '香甜可口', '造型可爱', '老少皆宜'],
    color: '#FFB6C1',
    icon: '🍰',
    rating: 4,
    difficulty: '简单',
    time: '25分钟'
  }
];

const categoryColors = {
  '三绝': { bg: '#FFF3E0', text: '#E65100', border: '#FF9800' },
  '小吃': { bg: '#E8F5E9', text: '#2E7D32', border: '#4CAF50' },
  '海鲜': { bg: '#E3F2FD', text: '#1565C0', border: '#2196F3' },
  '传统': { bg: '#F3E5F5', text: '#7B1FA2', border: '#9C27B0' }
};

export function TianjinFoodGallery() {
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('全部');

  const categories = ['全部', '三绝', '小吃', '海鲜', '传统'];

  const filteredFoods = activeCategory === '全部' 
    ? foodItems 
    : foodItems.filter(food => food.category === activeCategory);

  return (
    <div className="space-y-6">
      {/* 分类筛选 */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              activeCategory === category
                ? 'bg-[#1E5F8E] text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* 美食网格 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredFoods.map((food, index) => {
            const catColors = categoryColors[food.category];
            
            return (
              <motion.div
                key={food.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedFood(food)}
                className="group cursor-pointer"
              >
                <div 
                  className="relative p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                  style={{ 
                    backgroundColor: catColors.bg + '40',
                    borderColor: catColors.border + '40'
                  }}
                >
                  {/* 分类标签 */}
                  <div 
                    className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ 
                      backgroundColor: catColors.bg,
                      color: catColors.text
                    }}
                  >
                    {food.category}
                  </div>

                  {/* 评分 */}
                  <div className="absolute top-2 right-2 flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-medium text-gray-600">{food.rating}</span>
                  </div>

                  {/* 图标 */}
                  <div className="text-5xl mb-3 text-center group-hover:scale-110 transition-transform duration-300">
                    {food.icon}
                  </div>

                  {/* 名称 */}
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-center mb-1">
                    {food.name}
                  </h4>

                  {/* 难度和时间 */}
                  <div className="flex items-center justify-center gap-3 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Flame className="w-3 h-3" />
                      {food.difficulty}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {food.time}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* 详情弹窗 */}
      <AnimatePresence>
        {selectedFood && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
            onClick={() => setSelectedFood(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
              style={{ borderTop: `4px solid ${selectedFood.color}` }}
            >
              {/* 头部 */}
              <div className="relative p-6 pb-4">
                <button
                  onClick={() => setSelectedFood(null)}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>

                <div className="flex items-center gap-4">
                  <span className="text-6xl">{selectedFood.icon}</span>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {selectedFood.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span 
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ 
                          backgroundColor: categoryColors[selectedFood.category].bg,
                          color: categoryColors[selectedFood.category].text
                        }}
                      >
                        {selectedFood.category}
                      </span>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-4 h-4 ${i < Math.floor(selectedFood.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 内容 */}
              <div className="px-6 pb-6 space-y-4">
                {/* 描述 */}
                <p className="text-gray-600 dark:text-gray-300">
                  {selectedFood.description}
                </p>

                {/* 历史 */}
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                    <span>📜</span>
                    历史渊源
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedFood.history}
                  </p>
                </div>

                {/* 特色 */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                    <span>✨</span>
                    特色特点
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedFood.features.map((feature, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 rounded-full text-sm"
                        style={{ 
                          backgroundColor: selectedFood.color + '20',
                          color: selectedFood.color
                        }}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 制作信息 */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Flame className="w-4 h-4" style={{ color: selectedFood.color }} />
                      <span>难度: {selectedFood.difficulty}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" style={{ color: selectedFood.color }} />
                      <span>时间: {selectedFood.time}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 提示文字 */}
      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        点击美食卡片查看详细信息
      </p>
    </div>
  );
}

export default TianjinFoodGallery;
