/**
 * 盲盒专区组件 - 集成到文创商城
 * 展示盲盒商品，支持购买和开启
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Sparkles, Flame, Clock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import blindBoxService, { BlindBox } from '@/services/blindBoxService';
import { TianjinImage } from '@/components/TianjinStyleComponents';

interface BlindBoxSectionProps {
  onRefresh?: () => void;
}

const BlindBoxSection: React.FC<BlindBoxSectionProps> = ({ onRefresh }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [blindBoxes, setBlindBoxes] = useState<BlindBox[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 加载盲盒数据
    const boxes = blindBoxService.getAllBlindBoxes();
    setBlindBoxes(boxes);
    setLoading(false);
  }, []);

  const handlePurchase = (box: BlindBox) => {
    if (!user) {
      toast.error('请先登录');
      navigate('/login');
      return;
    }

    // 跳转到盲盒商店页面进行购买和开启
    navigate(`/blind-box?boxId=${box.id}`);
  };

  if (loading || blindBoxes.length === 0) {
    return null;
  }

  // 只显示可用的盲盒
  const availableBoxes = blindBoxes.filter(box => box.available);

  if (availableBoxes.length === 0) {
    return null;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="mb-10"
    >
      {/* 区块标题 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
            <Gift className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              作品盲盒商店
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              开启盲盒，发现惊喜创作资源！
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/blind-box')}
          className="flex items-center gap-0.5 text-sm text-[var(--text-muted)] hover:text-[var(--haihe-500)] transition-colors"
        >
          查看全部
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 盲盒卡片网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {availableBoxes.slice(0, 4).map((box, index) => (
          <BlindBoxCard
            key={box.id}
            blindBox={box}
            onPurchase={handlePurchase}
            index={index}
          />
        ))}
      </div>

      {/* 盲盒规则说明 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-4 p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800"
      >
        <h3 className="text-sm font-bold text-[var(--text-primary)] mb-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-500" />
          盲盒规则说明
        </h3>
        <ul className="space-y-1 text-xs text-[var(--text-muted)]">
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

// 盲盒卡片组件
interface BlindBoxCardProps {
  blindBox: BlindBox;
  onPurchase: (box: BlindBox) => void;
  index: number;
}

const BlindBoxCard: React.FC<BlindBoxCardProps> = ({ blindBox, onPurchase, index }) => {
  const rarityConfig = {
    common: { label: '普通', color: 'from-gray-400 to-gray-500', bgColor: 'bg-gray-100 dark:bg-gray-800' },
    rare: { label: '稀有', color: 'from-blue-400 to-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
    epic: { label: '史诗', color: 'from-purple-400 to-purple-500', bgColor: 'bg-purple-50 dark:bg-purple-900/20' },
    legendary: { label: '传奇', color: 'from-yellow-400 to-orange-500', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20' },
  };

  const config = rarityConfig[blindBox.rarity];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -5, scale: 1.02 }}
      className={`rounded-xl overflow-hidden shadow-lg transition-all ${config.bgColor} border border-purple-200 dark:border-purple-800 cursor-pointer group`}
      onClick={() => onPurchase(blindBox)}
    >
      {/* 图片区域 */}
      <div className="relative">
        <TianjinImage
          src={blindBox.image}
          alt={blindBox.name}
          className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-300"
          loading="lazy"
        />
        
        {/* 稀有度标签 */}
        <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${config.color} text-white shadow-md`}>
          {config.label}
        </div>

        {/* 闪光特效 */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
      </div>

      {/* 内容区域 */}
      <div className="p-3">
        <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1 truncate">
          {blindBox.name}
        </h3>
        <p className="text-xs text-[var(--text-muted)] mb-2 line-clamp-2">
          {blindBox.description}
        </p>

        {/* 价格和库存 */}
        <div className="flex items-center justify-between mb-2">
          <div className="text-red-600 font-bold text-sm">
            {blindBox.price} 积分
          </div>
          <div className="text-xs text-[var(--text-muted)] flex items-center gap-1">
            <Clock className="w-3 h-3" />
            剩余：{blindBox.remainingCount}/{blindBox.totalCount}
          </div>
        </div>

        {/* 购买按钮 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPurchase(blindBox);
          }}
          disabled={!blindBox.available}
          className={`w-full py-2 rounded-lg font-medium text-sm transition-all ${
            blindBox.available
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-md hover:shadow-lg'
              : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-500'
          }`}
        >
          {blindBox.available ? '立即购买' : '已售罄'}
        </button>
      </div>
    </motion.div>
  );
};

export default BlindBoxSection;
