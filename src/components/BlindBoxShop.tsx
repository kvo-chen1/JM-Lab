import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import blindBoxService, { BlindBox, BlindBoxOpeningResult, BlindBoxContent } from '../services/blindBoxService';
import { TianjinImage } from './TianjinStyleComponents';

// 盲盒卡片组件
const BlindBoxCard: React.FC<{
  blindBox: BlindBox;
  onPurchase: (box: BlindBox) => void;
  isDark: boolean;
}> = ({ blindBox, onPurchase, isDark }) => {
  return (
    <motion.div
      className={`rounded-xl overflow-hidden shadow-lg transition-all hover:shadow-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}
      whileHover={{ y: -5 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative">
        <TianjinImage
          src={blindBox.image}
          alt={blindBox.name}
          className="w-full h-48 object-cover"
          loading="lazy"
        />
        <div className={`absolute top-2 right-2 px-3 py-1 rounded-full text-sm font-medium ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
          {blindBox.rarity === 'common' && '普通'}
          {blindBox.rarity === 'rare' && '稀有'}
          {blindBox.rarity === 'epic' && '史诗'}
          {blindBox.rarity === 'legendary' && '传奇'}
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-bold mb-1">{blindBox.name}</h3>
        <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {blindBox.description}
        </p>
        
        <div className="flex justify-between items-center mb-3">
          <div className="text-red-600 font-bold">{blindBox.price} 积分</div>
          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            剩余: {blindBox.remainingCount}/{blindBox.totalCount}
          </div>
        </div>
        
        <button
          onClick={() => onPurchase(blindBox)}
          disabled={!blindBox.available}
          className={`w-full py-2 rounded-lg font-medium transition-colors ${blindBox.available 
            ? 'bg-red-600 hover:bg-red-700 text-white' 
            : 'bg-gray-500 cursor-not-allowed text-white'}`}
        >
          {blindBox.available ? '立即购买' : '已售罄'}
        </button>
      </div>
    </motion.div>
  );
};

// 盲盒开启动画组件
const BlindBoxOpeningAnimation: React.FC<{
  result: BlindBoxOpeningResult;
  onClose: () => void;
  isDark: boolean;
  onToggleCollection: (contentId: string) => void;
  isCollected: boolean;
}> = ({ result, onClose, isDark, onToggleCollection, isCollected }) => {
  return (
    <motion.div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black bg-opacity-70"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className={`rounded-2xl p-8 max-w-md w-full ${isDark ? 'bg-gray-800' : 'bg-white'}`}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        <h2 className="text-2xl font-bold mb-6 text-center">恭喜你获得！</h2>
        
        <motion.div
          className="flex flex-col items-center mb-6"
          initial={{ rotateY: 180, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {/* 盲盒开启特效 - 闪光动画 */}
          <motion.div
            className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-500 rounded-full opacity-50"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 0, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-yellow-500 mb-4 relative">
            {/* 稀有度动画边框 */}
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-transparent bg-gradient-to-r from-red-500 via-yellow-500 to-purple-500"
              animate={{
                rotate: 360
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            <TianjinImage
              src={result.content.image}
              alt={result.content.name}
              className="w-full h-full object-cover relative z-10"
            />
          </div>
          
          <h3 className="text-xl font-bold mb-2">{result.content.name}</h3>
          <p className={`text-center mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {result.content.description}
          </p>
          
          <div className={`px-4 py-1 rounded-full text-sm font-medium ${isDark ? 'bg-gray-700' : 'bg-gray-100'} mb-4`}>
            {result.content.rarity === 'common' && '普通'}
            {result.content.rarity === 'rare' && '稀有'}
            {result.content.rarity === 'epic' && '史诗'}
            {result.content.rarity === 'legendary' && '传奇'}
          </div>
          
          {/* 收藏按钮 */}
          <motion.button
            onClick={() => onToggleCollection(result.content.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${isCollected 
              ? 'bg-red-600 text-white hover:bg-red-700' 
              : isDark 
                ? 'bg-gray-700 hover:bg-gray-600' 
                : 'bg-gray-100 hover:bg-gray-200'}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <i className={`fas fa-${isCollected ? 'heart' : 'heart'}`} style={{ color: isCollected ? '#ffffff' : '#ff6b6b' }}></i>
            {isCollected ? '已收藏' : '收藏'}
          </motion.button>
        </motion.div>
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            关闭
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
          >
            再开一个
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const BlindBoxShop: React.FC = () => {
  const { isDark } = useTheme();
  const [blindBoxes, setBlindBoxes] = useState(() => blindBoxService.getAllBlindBoxes());
  const [selectedBox, setSelectedBox] = useState<BlindBox | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const [openingResult, setOpeningResult] = useState<BlindBoxOpeningResult | null>(null);
  const [showCollection, setShowCollection] = useState(false);
  const [collectedItems, setCollectedItems] = useState<BlindBoxContent[]>([]);
  // 模拟用户ID
  const userId = 'current-user';

  // 购买并打开盲盒
  const handlePurchase = (box: BlindBox) => {
    // 购买盲盒
    const success = blindBoxService.purchaseBlindBox(box.id, userId);
    if (success) {
      // 打开盲盒
      setSelectedBox(box);
      setIsOpening(true);
      
      // 模拟开启动画延迟 - 增强动画效果
      setTimeout(() => {
        const result = blindBoxService.openBlindBox(box.id, userId);
        if (result) {
          setOpeningResult(result);
          setIsOpening(false);
          // 更新盲盒列表
          setBlindBoxes(blindBoxService.getAllBlindBoxes());
          // 更新收藏列表
          updateCollectedItems();
          toast.success('盲盒开启成功！');
        }
      }, 2000);
    } else {
      toast.error('盲盒购买失败，请稍后重试');
    }
  };

  // 关闭开启结果
  const handleCloseResult = () => {
    setOpeningResult(null);
  };
  
  // 切换收藏状态
  const handleToggleCollection = (contentId: string) => {
    blindBoxService.toggleCollection(userId, contentId);
    updateCollectedItems();
    toast.success(blindBoxService.isContentCollected(userId, contentId) ? '收藏成功！' : '取消收藏成功！');
  };
  
  // 更新收藏列表
  const updateCollectedItems = () => {
    const items = blindBoxService.getUserCollections(userId);
    setCollectedItems(items);
  };
  
  // 初始化收藏列表
  useEffect(() => {
    updateCollectedItems();
  }, []);
  
  // 收藏的盲盒内容卡片组件
  const CollectionCard: React.FC<{ content: BlindBoxContent }> = ({ content }) => (
    <motion.div
      className={`rounded-xl overflow-hidden shadow-lg transition-all hover:shadow-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}
      whileHover={{ y: -5 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative">
        <TianjinImage
          src={content.image}
          alt={content.name}
          className="w-full h-40 object-cover"
          loading="lazy"
        />
        <div className={`absolute top-2 right-2 px-3 py-1 rounded-full text-sm font-medium ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
          {content.rarity === 'common' && '普通'}
          {content.rarity === 'rare' && '稀有'}
          {content.rarity === 'epic' && '史诗'}
          {content.rarity === 'legendary' && '传奇'}
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-bold mb-1">{content.name}</h3>
        <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {content.description}
        </p>
        
        <div className="flex justify-between items-center">
          <div className="text-sm font-medium">{content.type}</div>
          <button
            onClick={() => handleToggleCollection(content.id)}
            className={`text-sm transition-colors ${isDark ? 'hover:text-red-400' : 'hover:text-red-600'}`}
          >
            <i className="fas fa-heart" style={{ color: '#ff6b6b' }}></i> 取消收藏
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">作品盲盒商店</h1>
        <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          开启盲盒，发现惊喜创作资源！每个盲盒都有机会获得稀有作品、模板和素材
        </p>
        
        {/* 切换视图按钮 */}
        <div className="flex justify-center gap-4 mt-4">
          <button
            onClick={() => setShowCollection(false)}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${!showCollection 
              ? 'bg-red-600 text-white hover:bg-red-700' 
              : isDark 
                ? 'bg-gray-700 hover:bg-gray-600' 
                : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            盲盒商店
          </button>
          <button
            onClick={() => setShowCollection(true)}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${showCollection 
              ? 'bg-red-600 text-white hover:bg-red-700' 
              : isDark 
                ? 'bg-gray-700 hover:bg-gray-600' 
                : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            我的收藏 ({blindBoxService.getCollectionCount(userId)})
          </button>
        </div>
      </div>
      
      {/* 盲盒列表或收藏列表 */}
      <div className="mb-8">
        {!showCollection ? (
          /* 盲盒列表 */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {blindBoxes.map(box => (
              <BlindBoxCard
                key={box.id}
                blindBox={box}
                onPurchase={handlePurchase}
                isDark={isDark}
              />
            ))}
          </div>
        ) : (
          /* 收藏列表 */
          <div>
            {collectedItems.length === 0 ? (
              <div className={`rounded-xl p-8 text-center ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                <i className="fas fa-heart-broken text-6xl text-red-600 mb-4"></i>
                <h3 className="text-xl font-bold mb-2">还没有收藏的内容</h3>
                <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  开启盲盒获得内容后，可以收藏喜欢的作品、模板和素材
                </p>
                <button
                  onClick={() => setShowCollection(false)}
                  className="px-6 py-2 rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
                >
                  去开启盲盒
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-4">我的收藏 ({collectedItems.length})</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {collectedItems.map(content => (
                    <CollectionCard key={content.id} content={content} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
      
      {/* 盲盒开启动画 - 增强版 */}
      {isOpening && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black bg-opacity-70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="text-center">
            {/* 旋转的盲盒动画 */}
            <motion.div
              className="relative w-40 h-40 mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 20 }}
            >
              {/* 外层发光效果 */}
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 opacity-70"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 0.3, 0.7]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
              
              {/* 旋转的盲盒 */}
              <motion.div
                className="w-40 h-40 rounded-2xl bg-gradient-to-br from-red-500 to-purple-600 flex items-center justify-center relative z-10"
                animate={{
                  rotate: 360,
                  scale: [1, 1.05, 1]
                }}
                transition={{
                  rotate: { duration: 1, repeat: Infinity, ease: 'linear' },
                  scale: { duration: 1, repeat: Infinity, ease: 'easeInOut' }
                }}
              >
                {/* 盲盒盖子开启动画 */}
                <motion.div
                  className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-purple-600 to-red-500 rounded-t-2xl"
                  animate={{
                    y: [0, -10, 0]
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                />
                
                <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center relative z-20">
                  <span className="text-red-600 text-3xl font-bold">?</span>
                </div>
              </motion.div>
            </motion.div>
            
            {/* 文字动画 */}
            <motion.h3 
              className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'} mb-2`}
              animate={{
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              正在开启 {selectedBox?.name}...
            </motion.h3>
            
            {/* 进度条动画 */}
            <div className="w-64 h-2 bg-gray-600 rounded-full overflow-hidden mx-auto">
              <motion.div
                className="h-full bg-red-600"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 2, ease: 'linear' }}
              />
            </div>
          </div>
        </motion.div>
      )}
      
      {/* 盲盒开启结果 - 增强版 */}
      {openingResult && (
        <BlindBoxOpeningAnimation
          result={openingResult}
          onClose={handleCloseResult}
          isDark={isDark}
          onToggleCollection={handleToggleCollection}
          isCollected={blindBoxService.isContentCollected(userId, openingResult.content.id)}
        />
      )}
      
      {/* 盲盒规则说明 */}
      <div className={`rounded-xl p-6 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <h2 className="text-xl font-bold mb-4">盲盒规则说明</h2>
        <ul className={`space-y-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          <li className="flex items-start">
            <i className="fas fa-star text-yellow-500 mt-1 mr-2"></i>
            <span>盲盒包含作品、模板、素材和成就等多种内容</span>
          </li>
          <li className="flex items-start">
            <i className="fas fa-star text-yellow-500 mt-1 mr-2"></i>
            <span>不同稀有度的盲盒对应不同品质的内容，传奇盲盒有机会获得典藏级作品</span>
          </li>
          <li className="flex items-start">
            <i className="fas fa-star text-yellow-500 mt-1 mr-2"></i>
            <span>每个盲盒数量有限，售完即止</span>
          </li>
          <li className="flex items-start">
            <i className="fas fa-star text-yellow-500 mt-1 mr-2"></i>
            <span>开启的内容将自动添加到您的创作资源库中</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default BlindBoxShop;
