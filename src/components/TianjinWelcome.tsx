import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Calendar, Compass } from 'lucide-react';

interface WelcomeSlide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  feature: string;
}

const welcomeSlides: WelcomeSlide[] = [
  {
    id: 1,
    title: '欢迎来到天津',
    subtitle: '津门雅韵主题',
    description: '体验融合海河蓝、历史砖红、活力金黄、生态翠绿、现代银白的天津城市特色主题',
    icon: '🏛️',
    color: '#1E5F8E',
    feature: '海河蓝主色调'
  },
  {
    id: 2,
    title: '古今交融',
    subtitle: '历史文化底蕴',
    description: '五大道历史建筑、天津鼓楼、瓷房子等近代历史元素融入现代设计',
    icon: '🏺',
    color: '#A0522D',
    feature: '历史砖红辅助色'
  },
  {
    id: 3,
    title: '老字号传承',
    subtitle: '品牌色彩基因',
    description: '泥人张、杨柳青、风筝魏、桂发祥、狗不理等天津老字号品牌色彩',
    icon: '🎨',
    color: '#C21807',
    feature: '老字号品牌色'
  },
  {
    id: 4,
    title: '三种场景模式',
    subtitle: '随心切换',
    description: '日常模式、节日模式、夜间模式，适应不同时间和氛围需求',
    icon: '🎭',
    color: '#D4A84B',
    feature: '场景自适应'
  },
  {
    id: 5,
    title: '开始探索',
    subtitle: '发现天津之美',
    description: '点击地标建筑了解详情，感受天津独特的城市魅力',
    icon: '🚀',
    color: '#4A9B5E',
    feature: '交互式体验'
  }
];

const tianjinFacts = [
  { icon: '📍', label: '地理位置', value: '华北地区·渤海之滨' },
  { icon: '📅', label: '建城时间', value: '明永乐二年·1404年' },
  { icon: '🌉', label: '别称', value: '津门·津沽·天津卫' },
  { icon: '🏆', label: '城市地位', value: '直辖市·国家中心城市' }
];

export function TianjinWelcome() {
  const [showWelcome, setShowWelcome] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);

  useEffect(() => {
    // 检查是否是第一次使用天津主题
    const hasSeen = localStorage.getItem('tianjinWelcomeSeen');
    if (!hasSeen) {
      setShowWelcome(true);
    } else {
      setHasSeenWelcome(true);
    }
  }, []);

  const handleClose = () => {
    setShowWelcome(false);
    localStorage.setItem('tianjinWelcomeSeen', 'true');
    setHasSeenWelcome(true);
  };

  const handleNext = () => {
    if (currentSlide < welcomeSlides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const handleReset = () => {
    setCurrentSlide(0);
    setShowWelcome(true);
  };

  const currentSlideData = welcomeSlides[currentSlide];

  if (!showWelcome && hasSeenWelcome) {
    return (
      <button
        onClick={handleReset}
        className="fixed bottom-4 right-4 z-40 p-3 rounded-full bg-[#1E5F8E] text-white shadow-lg hover:bg-[#2471A8] transition-all duration-300 hover:scale-110"
        title="重新查看天津主题介绍"
      >
        <span className="text-xl">🏛️</span>
      </button>
    );
  }

  if (!showWelcome) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* 顶部渐变条 */}
          <div 
            className="h-2 w-full"
            style={{ 
              background: `linear-gradient(90deg, #1E5F8E, #A0522D, #D4A84B, #4A9B5E, #C0C5CE)` 
            }}
          />

          <div className="p-6 md:p-8">
            {/* 关闭按钮 */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            {/* 幻灯片内容 */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                {/* 图标 */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring" }}
                  className="text-6xl mb-4"
                >
                  {currentSlideData.icon}
                </motion.div>

                {/* 标题 */}
                <h2 
                  className="text-2xl md:text-3xl font-bold mb-2"
                  style={{ color: currentSlideData.color }}
                >
                  {currentSlideData.title}
                </h2>

                {/* 副标题 */}
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                  {currentSlideData.subtitle}
                </p>

                {/* 描述 */}
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  {currentSlideData.description}
                </p>

                {/* 特色标签 */}
                <div 
                  className="inline-block px-4 py-2 rounded-full text-sm font-medium mb-6"
                  style={{ 
                    backgroundColor: `${currentSlideData.color}20`,
                    color: currentSlideData.color
                  }}
                >
                  ✨ {currentSlideData.feature}
                </div>

                {/* 城市信息卡片 - 只在第一页显示 */}
                {currentSlide === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="grid grid-cols-2 gap-3 mt-6"
                  >
                    {tianjinFacts.map((fact, index) => (
                      <div
                        key={index}
                        className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-left"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span>{fact.icon}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {fact.label}
                          </span>
                        </div>
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {fact.value}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* 进度指示器 */}
            <div className="flex justify-center gap-2 mt-8 mb-6">
              {welcomeSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentSlide 
                      ? 'w-8 bg-[#1E5F8E]' 
                      : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>

            {/* 导航按钮 */}
            <div className="flex justify-between items-center">
              <button
                onClick={handlePrev}
                disabled={currentSlide === 0}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentSlide === 0
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                上一步
              </button>

              <span className="text-sm text-gray-500">
                {currentSlide + 1} / {welcomeSlides.length}
              </span>

              <button
                onClick={handleNext}
                className="px-6 py-2 rounded-lg text-sm font-medium text-white transition-all duration-300 hover:scale-105"
                style={{ 
                  backgroundColor: currentSlideData.color,
                  boxShadow: `0 4px 14px ${currentSlideData.color}40`
                }}
              >
                {currentSlide === welcomeSlides.length - 1 ? '开始体验' : '下一步'}
              </button>
            </div>

            {/* 跳过按钮 */}
            {currentSlide < welcomeSlides.length - 1 && (
              <button
                onClick={handleClose}
                className="w-full mt-4 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                跳过介绍
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default TianjinWelcome;
