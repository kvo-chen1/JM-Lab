/**
 * Hero Banner 组件 V2 - 全新设计
 * 大幅轮播图，展示品牌故事和促销活动
 * 优化设计：现代感更强的UI、更流畅的动画、更好的交互体验
 */
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Search, Sparkles, Play, Pause } from 'lucide-react';

interface BannerSlide {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  gradient: string;
  accentColor?: string;
}

interface HeroBannerProps {
  slides?: BannerSlide[];
  onSearch?: (query: string) => void;
  autoPlayInterval?: number;
}

const defaultSlides: BannerSlide[] = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1582562124811-c8ed1b31bc3b?w=1200',
    title: '津门文创 · 传承非遗文化',
    subtitle: '探索天津独特的文化魅力，发现匠心独运的文创精品，让传统艺术融入现代生活',
    ctaText: '立即探索',
    ctaLink: '/marketplace',
    gradient: 'from-sky-500 via-blue-600 to-indigo-700',
    accentColor: '#0ea5e9',
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1567225591450-06036b3392a6?w=1200',
    title: '泥人张 · 百年匠心传承',
    subtitle: '传统泥塑工艺，每一件都是独一无二的艺术品，感受指尖上的非遗魅力',
    ctaText: '查看详情',
    ctaLink: '/marketplace?brand=nirenzhang',
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    accentColor: '#f59e0b',
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1578922746465-3a80a228f28c?w=1200',
    title: '杨柳青年画 · 国潮新风尚',
    subtitle: '传统年画与现代设计的完美融合，让经典艺术焕发新的生命力',
    ctaText: '选购年画',
    ctaLink: '/marketplace?category=painting',
    gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
    accentColor: '#10b981',
  },
];

const HeroBanner: React.FC<HeroBannerProps> = ({
  slides = defaultSlides,
  onSearch,
  autoPlayInterval = 5000,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setProgress(0);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setProgress(0);
  }, [slides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setProgress(0);
  };

  // 自动播放和进度条
  useEffect(() => {
    if (isPaused) return;
    
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 0;
        }
        return prev + (100 / (autoPlayInterval / 50));
      });
    }, 50);

    const slideInterval = setInterval(() => {
      nextSlide();
    }, autoPlayInterval);

    return () => {
      clearInterval(progressInterval);
      clearInterval(slideInterval);
    };
  }, [isPaused, nextSlide, autoPlayInterval]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[HeroBanner] 搜索:', searchQuery);
    if (searchQuery.trim()) {
      onSearch?.(searchQuery.trim());
    }
  };

  const handleSlideClick = (link: string) => {
    console.log('[HeroBanner] 点击轮播图链接:', link);
    window.location.href = link;
  };

  const handlePrevSlide = () => {
    console.log('[HeroBanner] 上一张');
    prevSlide();
  };

  const handleNextSlide = () => {
    console.log('[HeroBanner] 下一张');
    nextSlide();
  };

  const handleGoToSlide = (index: number) => {
    console.log('[HeroBanner] 跳转到幻灯片:', index);
    goToSlide(index);
  };

  const handleTogglePause = () => {
    console.log('[HeroBanner] 切换播放状态:', !isPaused);
    setIsPaused(!isPaused);
  };

  const currentSlideData = slides[currentSlide];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      className="relative rounded-3xl overflow-hidden mb-8 group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' }}
    >
      {/* 进度条 */}
      <div className="absolute top-0 left-0 right-0 h-1 z-30 bg-white/10">
        <motion.div
          className="h-full bg-white/80"
          style={{ width: `${progress}%` }}
          transition={{ duration: 0.05 }}
        />
      </div>

      {/* 轮播内容 */}
      <div className="relative h-[360px] md:h-[400px] lg:h-[440px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0"
          >
            {/* 背景图 */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${currentSlideData.image})` }}
            />
            {/* 渐变遮罩 */}
            <div className={`absolute inset-0 bg-gradient-to-r ${currentSlideData.gradient} opacity-85`} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            {/* 装饰性光效 */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          </motion.div>
        </AnimatePresence>

        {/* 内容区域 */}
        <div className="relative z-10 h-full flex flex-col justify-center px-8 md:px-12 lg:px-16 pb-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl"
            >
              {/* 品牌标识 */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="flex items-center gap-2 mb-5"
              >
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}
                >
                  <Sparkles className="w-5 h-5 text-white flex-shrink-0" strokeWidth={2} />
                </div>
                <span className="text-white/90 text-sm font-medium tracking-wide">津门文创</span>
                <span className="text-white/50">|</span>
                <span className="text-white/70 text-sm">传承非遗文化</span>
              </motion.div>

              {/* 标题 */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight"
                style={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
              >
                {currentSlideData.title}
              </motion.h1>

              {/* 副标题 */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-base md:text-lg text-white/85 mb-6 max-w-xl leading-relaxed"
              >
                {currentSlideData.subtitle}
              </motion.p>

              {/* CTA 按钮 */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                onClick={() => handleSlideClick(currentSlideData.ctaLink)}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-white font-semibold rounded-xl hover:bg-white/95 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                style={{ color: currentSlideData.accentColor }}
                type="button"
              >
                {currentSlideData.ctaText}
                <ChevronRight className="w-5 h-5 flex-shrink-0" strokeWidth={2.5} />
              </motion.button>
            </motion.div>
          </AnimatePresence>

          {/* 搜索框 */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            onSubmit={handleSearch}
            className="mt-8 max-w-md"
          >
            <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-2 border border-white/20">
              <div className="flex items-center flex-1 min-w-0 px-3">
                <Search className="w-5 h-5 text-gray-400 flex-shrink-0 mr-3" strokeWidth={2} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索文创商品..."
                  className="flex-1 h-11 bg-transparent text-gray-800 placeholder-gray-400 focus:outline-none text-sm"
                />
              </div>
              <button
                type="submit"
                className="h-11 px-6 bg-gradient-to-r from-sky-500 to-blue-600 text-white text-sm font-medium rounded-xl hover:from-sky-400 hover:to-blue-500 transition-all whitespace-nowrap flex-shrink-0 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                aria-label="搜索"
              >
                搜索
              </button>
            </div>
          </motion.form>
        </div>

        {/* 底部控制区域 - 导航按钮和指示器 */}
        <div className="absolute bottom-6 left-0 right-0 px-8 flex items-center justify-between z-20">
          {/* 指示器 - 左侧 */}
          <div className="flex items-center gap-2">
            {slides.map((slide, index) => (
              <button
                key={index}
                onClick={() => handleGoToSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? 'w-8 bg-white shadow-lg' 
                    : 'w-2 bg-white/40 hover:bg-white/60'
                }`}
                aria-label={`切换到第 ${index + 1} 张幻灯片`}
                type="button"
              />
            ))}
          </div>

          {/* 导航按钮 - 右侧 */}
          <div className="flex items-center gap-2">
            {/* 暂停/播放按钮 */}
            <button
              onClick={handleTogglePause}
              className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-gray-700 hover:bg-white transition-all flex-shrink-0 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
              aria-label={isPaused ? '播放' : '暂停'}
              type="button"
            >
              {isPaused ? (
                <Play className="w-4 h-4 flex-shrink-0 ml-0.5" strokeWidth={2.5} />
              ) : (
                <Pause className="w-4 h-4 flex-shrink-0" strokeWidth={2.5} />
              )}
            </button>
            <button
              onClick={handlePrevSlide}
              className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-gray-700 hover:bg-white transition-all flex-shrink-0 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
              aria-label="上一张"
              type="button"
            >
              <ChevronLeft className="w-5 h-5 flex-shrink-0" strokeWidth={2.5} />
            </button>
            <button
              onClick={handleNextSlide}
              className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-gray-700 hover:bg-white transition-all flex-shrink-0 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
              aria-label="下一张"
              type="button"
            >
              <ChevronRight className="w-5 h-5 flex-shrink-0" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default HeroBanner;
