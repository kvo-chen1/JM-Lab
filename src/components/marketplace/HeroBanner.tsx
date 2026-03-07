/**
 * Hero Banner 组件
 * 大幅轮播图，展示品牌故事和促销活动
 */
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Search, Sparkles } from 'lucide-react';

interface BannerSlide {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  gradient: string;
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
    subtitle: '探索天津独特的文化魅力，发现匠心独运的文创精品',
    ctaText: '立即探索',
    ctaLink: '/marketplace',
    gradient: 'from-[var(--haihe-600)] to-[var(--haihe-800)]',
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1567225591450-06036b3392a6?w=1200',
    title: '泥人张 · 百年匠心',
    subtitle: '传统泥塑工艺，每一件都是艺术品',
    ctaText: '查看详情',
    ctaLink: '/marketplace?brand=nirenzhang',
    gradient: 'from-amber-600 to-amber-800',
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1578922746465-3a80a228f28c?w=1200',
    title: '杨柳青年画 · 国潮新风',
    subtitle: '传统年画与现代设计的完美融合',
    ctaText: '选购年画',
    ctaLink: '/marketplace?category=painting',
    gradient: 'from-green-600 to-green-800',
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

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // 自动播放
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(nextSlide, autoPlayInterval);
    return () => clearInterval(timer);
  }, [isPaused, nextSlide, autoPlayInterval]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch?.(searchQuery.trim());
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative rounded-3xl overflow-hidden mb-8"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 轮播内容 */}
      <div className="relative h-[320px] md:h-[380px] lg:h-[420px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0"
          >
            {/* 背景图 */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${slides[currentSlide].image})` }}
            />
            {/* 渐变遮罩 */}
            <div className={`absolute inset-0 bg-gradient-to-r ${slides[currentSlide].gradient} opacity-90`} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </motion.div>
        </AnimatePresence>

        {/* 内容区域 */}
        <div className="relative z-10 h-full flex flex-col justify-center px-8 md:px-12 lg:px-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              className="max-w-2xl"
            >
              {/* 品牌标识 */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-2 mb-4"
              >
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-white/80 text-sm font-medium">津门文创</span>
              </motion.div>

              {/* 标题 */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight"
              >
                {slides[currentSlide].title}
              </motion.h1>

              {/* 副标题 */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-base md:text-lg text-white/80 mb-6 max-w-xl"
              >
                {slides[currentSlide].subtitle}
              </motion.p>

              {/* CTA 按钮 */}
              <motion.a
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                href={slides[currentSlide].ctaLink}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[var(--haihe-600)] font-semibold rounded-xl hover:bg-white/90 transition-colors shadow-lg"
              >
                {slides[currentSlide].ctaText}
                <ChevronRight className="w-5 h-5" />
              </motion.a>
            </motion.div>
          </AnimatePresence>

          {/* 搜索框 */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            onSubmit={handleSearch}
            className="mt-8 max-w-md"
          >
            <div className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索文创商品..."
                className="w-full h-12 pl-12 pr-4 bg-white/95 backdrop-blur-sm rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg"
              />
              <Search className="absolute left-4 w-5 h-5 text-gray-400" />
              <button
                type="submit"
                className="absolute right-2 h-8 px-4 bg-[var(--haihe-500)] text-white text-sm font-medium rounded-lg hover:bg-[var(--haihe-600)] transition-colors"
              >
                搜索
              </button>
            </div>
          </motion.form>
        </div>

        {/* 导航按钮 */}
        <div className="absolute bottom-6 right-8 flex items-center gap-3 z-20">
          <button
            onClick={prevSlide}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextSlide}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* 指示器 */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'w-8 bg-white'
                  : 'w-1.5 bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default HeroBanner;
