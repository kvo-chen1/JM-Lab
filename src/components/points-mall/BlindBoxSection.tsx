import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, ChevronRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import blindBoxService, { BlindBox } from '@/services/blindBoxService';
import { TianjinImage } from '@/components/TianjinStyleComponents';

interface BlindBoxSectionProps {
  onExchangeBlindBox: (box: BlindBox) => void;
  currentPoints: number;
}

const BlindBoxSection: React.FC<BlindBoxSectionProps> = ({ 
  onExchangeBlindBox,
  currentPoints 
}) => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [blindBoxes] = useState<BlindBox[]>(blindBoxService.getAllBlindBoxes());
  const [expanded, setExpanded] = useState(false);

  const availableBoxes = blindBoxes.filter(box => box.available);

  if (availableBoxes.length === 0) {
    return null;
  }

  const displayBoxes = expanded ? availableBoxes : availableBoxes.slice(0, 4);

  const handleCardClick = (box: BlindBox) => {
    if (currentPoints < box.price) {
      toast.error('积分不足，快去完成任务获取积分吧！');
      return;
    }
    onExchangeBlindBox(box);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'from-gray-400 to-gray-500';
      case 'rare': return 'from-blue-400 to-blue-500';
      case 'epic': return 'from-purple-400 to-purple-500';
      case 'legendary': return 'from-yellow-400 to-yellow-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getRarityLabel = (rarity: string) => {
    switch (rarity) {
      case 'common': return '普通';
      case 'rare': return '稀有';
      case 'epic': return '史诗';
      case 'legendary': return '传奇';
      default: return '普通';
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mb-8"
    >
      {/* 区块标题 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <Gift className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">作品盲盒商店</h2>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              开启盲盒，发现惊喜创作资源！
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/blind-box')}
          className="flex items-center gap-1 text-sm px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all shadow-md"
        >
          查看全部
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 盲盒卡片网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <AnimatePresence>
          {displayBoxes.map((box, index) => (
            <motion.div
              key={box.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`rounded-xl overflow-hidden shadow-lg transition-all hover:shadow-xl cursor-pointer ${
                isDark ? 'bg-gray-800' : 'bg-white'
              }`}
              whileHover={{ y: -5, scale: 1.02 }}
              onClick={() => handleCardClick(box)}
            >
              {/* 盲盒图片 */}
              <div className="relative h-40 overflow-hidden">
                <TianjinImage
                  src={box.image}
                  alt={box.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {/* 稀有度标签 */}
                <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium bg-white/90 text-gray-800 shadow-sm`}>
                  {getRarityLabel(box.rarity)}
                </div>
                {/* 闪光特效 */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
              </div>

              {/* 商品信息 */}
              <div className="p-3">
                <h3 className="text-base font-bold mb-2 line-clamp-1">{box.name}</h3>
                <p className={`text-xs mb-3 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {box.description}
                </p>

                {/* 价格和库存 */}
                <div className="flex justify-between items-center mb-3">
                  <div className="text-red-600 font-bold text-sm">
                    {box.price} 积分
                  </div>
                  <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    剩余：{box.remainingCount}
                  </div>
                </div>

                {/* 购买按钮 */}
                <button
                  className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPoints >= box.price
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  disabled={currentPoints < box.price}
                >
                  {currentPoints >= box.price ? '立即兑换' : '积分不足'}
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 展开/收起按钮 */}
      {availableBoxes.length > 4 && (
        <div className="flex justify-center mt-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all ${
              isDark
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {expanded ? '收起' : '展开更多'}
            <ChevronRight
              className={`w-4 h-4 transition-transform ${
                expanded ? 'rotate-90' : ''
              }`}
            />
          </button>
        </div>
      )}

      {/* 盲盒规则说明 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className={`mt-6 p-4 rounded-xl ${
          isDark
            ? 'bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-800'
            : 'bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200'
        }`}
      >
        <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-500" />
          盲盒规则说明
        </h3>
        <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
          <li className="flex items-start gap-2">
            <span className="text-purple-500">⭐</span>
            <span>盲盒包含作品、模板、素材和成就等多种内容</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-500">⭐</span>
            <span>不同稀有度的盲盒对应不同品质的内容，传奇盲盒有机会获得典藏级作品</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-500">⭐</span>
            <span>每个盲盒数量有限，售完即止</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-500">⭐</span>
            <span>开启的内容将自动添加到您的创作资源库中</span>
          </li>
        </ul>
      </motion.div>
    </motion.section>
  );
};

export default BlindBoxSection;
