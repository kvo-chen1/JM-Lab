import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, ChevronRight, Volume2, X } from 'lucide-react';

interface CultureTip {
  id: number;
  type: 'dialect' | 'custom' | 'history' | 'food';
  title: string;
  content: string;
  explanation?: string;
  pronunciation?: string;
}

const cultureTips: CultureTip[] = [
  {
    id: 1,
    type: 'dialect',
    title: '天津话特色',
    content: '嘛',
    explanation: '天津话中最常用的语气词，相当于普通话的"什么"',
    pronunciation: 'ma'
  },
  {
    id: 2,
    type: 'dialect',
    title: '天津话特色',
    content: '哏儿',
    explanation: '形容有趣、好笑，天津相声文化的核心词汇',
    pronunciation: 'génr'
  },
  {
    id: 3,
    type: 'dialect',
    title: '天津话特色',
    content: '倍儿',
    explanation: '表示"非常"、"特别"的意思，如"倍儿好"',
    pronunciation: 'bèir'
  },
  {
    id: 4,
    type: 'custom',
    title: '天津习俗',
    content: '听相声',
    explanation: '天津是相声的发源地之一，听相声是天津人重要的休闲娱乐方式'
  },
  {
    id: 5,
    type: 'custom',
    title: '天津习俗',
    content: '逛海河',
    explanation: '海河是天津的母亲河，天津人喜欢在河边散步、休闲'
  },
  {
    id: 6,
    type: 'history',
    title: '历史知识',
    content: '九河下梢',
    explanation: '天津地处海河五大支流汇合处，自古就是水运枢纽，有"九河下梢天津卫"之称'
  },
  {
    id: 7,
    type: 'history',
    title: '历史知识',
    content: '天津卫',
    explanation: '明永乐二年（1404年）设天津卫，是中国古代唯一有确切建城时间记录的城市'
  },
  {
    id: 8,
    type: 'food',
    title: '天津美食',
    content: '狗不理包子',
    explanation: '天津"三绝"之首，创始于清朝咸丰年间，以选料精细、制作讲究著称'
  },
  {
    id: 9,
    type: 'food',
    title: '天津美食',
    content: '十八街麻花',
    explanation: '桂发祥十八街麻花，天津"三绝"之一，酥脆香甜，久放不绵'
  },
  {
    id: 10,
    type: 'food',
    title: '天津美食',
    content: '耳朵眼炸糕',
    explanation: '天津"三绝"之一，因店铺靠近耳朵眼胡同而得名，外酥里嫩，香甜可口'
  },
  {
    id: 11,
    type: 'custom',
    title: '天津习俗',
    content: '杨柳青年画',
    explanation: '中国四大木版年画之一，始于明代，以色彩鲜艳、寓意吉祥著称'
  },
  {
    id: 12,
    type: 'history',
    title: '历史知识',
    content: '五大道',
    explanation: '拥有2000多栋小洋楼，包括英式、法式、意式等多种建筑风格，被誉为"万国建筑博览会"'
  }
];

const typeColors = {
  dialect: { bg: '#E3F2FD', text: '#1565C0', icon: '💬' },
  custom: { bg: '#F3E5F5', text: '#7B1FA2', icon: '🎭' },
  history: { bg: '#FFF3E0', text: '#E65100', icon: '📚' },
  food: { bg: '#E8F5E9', text: '#2E7D32', icon: '🍜' }
};

const typeLabels = {
  dialect: '方言',
  custom: '习俗',
  history: '历史',
  food: '美食'
};

export function TianjinCultureTips() {
  const [currentTip, setCurrentTip] = useState<CultureTip>(cultureTips[0]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [showAll, setShowAll] = useState(false);

  // 随机切换提示
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isExpanded && !showAll) {
        const randomIndex = Math.floor(Math.random() * cultureTips.length);
        setCurrentTip(cultureTips[randomIndex]);
      }
    }, 10000); // 每10秒切换一次

    return () => clearInterval(interval);
  }, [isExpanded, showAll]);

  const handleNext = () => {
    const currentIndex = cultureTips.findIndex(tip => tip.id === currentTip.id);
    const nextIndex = (currentIndex + 1) % cultureTips.length;
    setCurrentTip(cultureTips[nextIndex]);
  };

  const handlePrev = () => {
    const currentIndex = cultureTips.findIndex(tip => tip.id === currentTip.id);
    const prevIndex = (currentIndex - 1 + cultureTips.length) % cultureTips.length;
    setCurrentTip(cultureTips[prevIndex]);
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-20 right-4 z-40 p-2 rounded-full bg-[#D4A84B] text-white shadow-lg hover:bg-[#E8C878] transition-all duration-300"
        title="显示天津文化小贴士"
      >
        <Lightbulb className="w-5 h-5" />
      </button>
    );
  }

  const colors = typeColors[currentTip.type];

  return (
    <>
      {/* 悬浮提示卡片 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentTip.id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className="fixed bottom-20 right-4 z-40 w-80"
        >
          <div 
            className="rounded-xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl"
            style={{ backgroundColor: colors.bg }}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {/* 头部 */}
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{colors.icon}</span>
                <span 
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: colors.text + '20', color: colors.text }}
                >
                  {typeLabels[currentTip.type]}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrev();
                  }}
                  className="p-1 rounded hover:bg-black/10 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" style={{ color: colors.text }} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  className="p-1 rounded hover:bg-black/10 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" style={{ color: colors.text }} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsVisible(false);
                  }}
                  className="p-1 rounded hover:bg-black/10 transition-colors ml-1"
                >
                  <X className="w-4 h-4" style={{ color: colors.text }} />
                </button>
              </div>
            </div>

            {/* 内容 */}
            <div className="px-4 pb-3">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                {currentTip.title}
              </h4>
              
              <div className="flex items-center gap-2 mb-2">
                <span 
                  className="text-2xl font-bold"
                  style={{ color: colors.text }}
                >
                  {currentTip.content}
                </span>
                {currentTip.pronunciation && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Volume2 className="w-3 h-3" />
                    [{currentTip.pronunciation}]
                  </span>
                )}
              </div>

              {/* 展开详情 */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 pt-2 border-t border-black/10">
                      {currentTip.explanation}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 提示文字 */}
              {!isExpanded && (
                <p className="text-xs text-gray-500 mt-1">
                  点击查看详情
                </p>
              )}
            </div>

            {/* 进度条 */}
            <div className="h-1 bg-black/10">
              <motion.div
                className="h-full"
                style={{ backgroundColor: colors.text }}
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 10, ease: 'linear' }}
                key={currentTip.id}
              />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* 查看全部按钮 */}
      <button
        onClick={() => setShowAll(true)}
        className="fixed bottom-20 right-4 z-40 mt-36 px-3 py-1.5 rounded-full bg-white dark:bg-gray-800 shadow-md text-xs font-medium text-gray-600 dark:text-gray-400 hover:shadow-lg transition-all duration-300"
        style={{ marginTop: '140px' }}
      >
        查看全部
      </button>

      {/* 全部提示弹窗 */}
      {showAll && (
        <div 
          className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4"
          onClick={() => setShowAll(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* 头部 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <span>💡</span>
                天津文化小贴士
              </h3>
              <button
                onClick={() => setShowAll(false)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* 内容列表 */}
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {cultureTips.map((tip) => {
                  const tipColors = typeColors[tip.type];
                  return (
                    <div
                      key={tip.id}
                      className="p-4 rounded-xl transition-all duration-300 hover:shadow-md"
                      style={{ backgroundColor: tipColors.bg + '60' }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span>{tipColors.icon}</span>
                        <span 
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: tipColors.text + '20', color: tipColors.text }}
                        >
                          {typeLabels[tip.type]}
                        </span>
                      </div>
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                        {tip.content}
                      </h4>
                      {tip.pronunciation && (
                        <p className="text-xs text-gray-500 mb-1">
                          [{tip.pronunciation}]
                        </p>
                      )}
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {tip.explanation}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}

export default TianjinCultureTips;
