/**
 * IP 形象设计展示页面
 * 专业的 IP 形象设计展示系统，类似设计作品集展示
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Palette,
  Box,
  Smile,
  Zap,
  Image,
  ShoppingBag,
  FileText,
  Layers,
  Sparkles,
  Share2,
  Heart,
  Eye,
  Download,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  List,
  Filter,
  Search,
} from 'lucide-react';
import type { IPCharacterDesign, IPCharacterListItem } from '@/types/ipCharacter';
import { getIPCharacterById, getAllIPCharacters } from '@/data/ipCharacters';

// 图片查看器组件
const ImageViewer: React.FC<{
  src: string;
  alt: string;
  onClose: () => void;
}> = ({ src, alt, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-white/10 rounded-full backdrop-blur-sm transition-colors"
      >
        <X className="w-6 h-6" />
      </button>
      <motion.img
        src={src}
        alt={alt}
        className="max-w-full max-h-[90vh] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 25 }}
      />
    </motion.div>
  );
};

// 区块标题组件
const SectionTitle: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}> = ({ icon, title, subtitle }) => (
  <div className="flex items-center gap-3 mb-6">
    <div className="p-2 bg-gradient-to-br from-blue-500 to-teal-500 rounded-lg text-white">
      {icon}
    </div>
    <div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
      {subtitle && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
      )}
    </div>
  </div>
);

// 配色卡片组件
const ColorCard: React.FC<{
  scheme: IPCharacterDesign['colorScheme'][0];
  index: number;
}> = ({ scheme, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-shadow"
  >
    <div className="flex gap-2 mb-3">
      <div
        className="w-12 h-12 rounded-lg shadow-inner"
        style={{ backgroundColor: scheme.primary }}
      />
      <div
        className="w-12 h-12 rounded-lg shadow-inner"
        style={{ backgroundColor: scheme.secondary }}
      />
      <div
        className="w-12 h-12 rounded-lg shadow-inner"
        style={{ backgroundColor: scheme.accent }}
      />
    </div>
    <h3 className="font-bold text-gray-900 dark:text-white mb-1">{scheme.name}</h3>
    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{scheme.description}</p>
    <div className="flex gap-1 text-[10px] font-mono">
      <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">{scheme.primary}</span>
      <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">{scheme.secondary}</span>
    </div>
  </motion.div>
);

// 表情包卡片组件
const EmojiCard: React.FC<{
  emoji: IPCharacterDesign['emojis'][0];
  index: number;
}> = ({ emoji, index }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: index * 0.05 }}
    className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
  >
    <span className="text-4xl mb-2">{emoji.image}</span>
    <p className="font-semibold text-gray-900 dark:text-white text-sm">{emoji.name}</p>
    <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">{emoji.description}</p>
  </motion.div>
);

// 动作卡片组件
const ActionCard: React.FC<{
  action: IPCharacterDesign['actionPoses'][0];
  index: number;
  onImageClick: (src: string) => void;
}> = ({ action, index, onImageClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 group"
  >
    <div
      className="aspect-[3/4] bg-gray-100 dark:bg-gray-700 relative overflow-hidden cursor-pointer"
      onClick={() => onImageClick(action.image)}
    >
      <img
        src={action.image}
        alt={action.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
        <Maximize2 className="w-8 h-8 text-white" />
      </div>
    </div>
    <div className="p-3">
      <p className="font-semibold text-gray-900 dark:text-white text-sm">{action.name}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{action.description}</p>
    </div>
  </motion.div>
);

// 海报卡片组件
const PosterCard: React.FC<{
  poster: IPCharacterDesign['posters'][0];
  index: number;
  onImageClick: (src: string) => void;
}> = ({ poster, index, onImageClick }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: index * 0.1 }}
    className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all group"
  >
    <div
      className="aspect-[3/4] relative overflow-hidden cursor-pointer"
      onClick={() => onImageClick(poster.image)}
    >
      <img
        src={poster.image}
        alt={poster.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <div className="absolute top-2 right-2">
        <span className="px-2 py-1 bg-black/50 backdrop-blur-sm text-white text-xs rounded-full">
          {poster.style}
        </span>
      </div>
    </div>
    <div className="p-4">
      <h3 className="font-bold text-gray-900 dark:text-white mb-1">{poster.title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">{poster.description}</p>
    </div>
  </motion.div>
);

// 周边卡片组件
const MerchandiseCard: React.FC<{
  item: IPCharacterDesign['merchandise'][0];
  index: number;
  onImageClick: (src: string) => void;
}> = ({ item, index, onImageClick }) => {
  const categoryLabels: Record<string, string> = {
    stationery: '文具',
    apparel: '服饰',
    accessories: '配饰',
    digital: '数码',
    toy: '玩具',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all group"
    >
      <div
        className="aspect-square relative overflow-hidden cursor-pointer"
        onClick={() => onImageClick(item.image)}
      >
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-2 left-2">
          <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
            {categoryLabels[item.category]}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-900 dark:text-white mb-1">{item.name}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
      </div>
    </motion.div>
  );
};

// 变装卡片组件
const CostumeCard: React.FC<{
  costume: IPCharacterDesign['costumes'][0];
  index: number;
  onImageClick: (src: string) => void;
}> = ({ costume, index, onImageClick }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: index * 0.1 }}
    className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all group"
  >
    <div
      className="aspect-[3/4] relative overflow-hidden cursor-pointer"
      onClick={() => onImageClick(costume.image)}
    >
      <img
        src={costume.image}
        alt={costume.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <div className="absolute top-2 right-2">
        <span className="px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full">
          {costume.theme}
        </span>
      </div>
    </div>
    <div className="p-4">
      <h3 className="font-bold text-gray-900 dark:text-white mb-1">{costume.name}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">{costume.description}</p>
    </div>
  </motion.div>
);

// 主展示组件
const IPCharacterShowcase: React.FC<{ design: IPCharacterDesign }> = ({ design }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: '概览', icon: Sparkles },
    { id: 'design', label: '设计说明', icon: FileText },
    { id: 'colors', label: '配色方案', icon: Palette },
    { id: 'emojis', label: '表情包', icon: Smile },
    { id: 'actions', label: '动作延展', icon: Zap },
    { id: 'posters', label: '衍生海报', icon: Image },
    { id: 'merchandise', label: '周边设计', icon: ShoppingBag },
    { id: 'costumes', label: '变装设计', icon: Layers },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.history.back()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </motion.button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {design.base.name}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {design.base.englishName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Heart className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Share2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Download className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </motion.button>
          </div>
        </div>

        {/* Tab 导航 */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* 主视觉区 */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <div className="aspect-[21/9] relative">
                  <img
                    src={design.mainVisual}
                    alt={design.base.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-8">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <h2 className="text-4xl md:text-6xl font-bold text-white mb-2">
                        {design.base.name}
                      </h2>
                      <p className="text-xl text-white/80 mb-4">{design.base.subtitle}</p>
                      <p className="text-white/60 max-w-2xl">{design.base.description}</p>
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* 三视图 */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl">
                <SectionTitle
                  icon={<Box className="w-5 h-5" />}
                  title="三视图"
                  subtitle="Three Views"
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { label: '正视图', src: design.threeViews.front },
                    { label: '侧视图', src: design.threeViews.side },
                    { label: '背视图', src: design.threeViews.back },
                  ].map((view, index) => (
                    <motion.div
                      key={view.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="text-center"
                    >
                      <div
                        className="aspect-[2/3] bg-gray-100 dark:bg-gray-700 rounded-2xl overflow-hidden cursor-pointer group"
                        onClick={() => setSelectedImage(view.src)}
                      >
                        <img
                          src={view.src}
                          alt={view.label}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <p className="mt-3 font-medium text-gray-700 dark:text-gray-300">
                        {view.label}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* 快速预览 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl"
                >
                  <SectionTitle icon={<Smile className="w-5 h-5" />} title="表情包预览" />
                  <div className="grid grid-cols-4 gap-3">
                    {design.emojis.slice(0, 8).map((emoji, index) => (
                      <div
                        key={emoji.id}
                        className="aspect-square flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-xl text-3xl"
                      >
                        {emoji.image}
                      </div>
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl"
                >
                  <SectionTitle icon={<Palette className="w-5 h-5" />} title="配色方案" />
                  <div className="flex gap-3">
                    {design.colorScheme.slice(0, 3).map((scheme, index) => (
                      <div key={index} className="flex-1">
                        <div
                          className="aspect-square rounded-xl mb-2"
                          style={{ backgroundColor: scheme.primary }}
                        />
                        <p className="text-xs text-center text-gray-600 dark:text-gray-400">
                          {scheme.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {activeTab === 'design' && (
            <motion.div
              key="design"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* 设计理念 */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl">
                <SectionTitle
                  icon={<FileText className="w-5 h-5" />}
                  title="设计说明"
                  subtitle="Design Description"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                      设计灵感
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {design.designDescription.inspiration}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                      设计理念
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {design.designDescription.concept}
                    </p>
                  </div>
                </div>
              </div>

              {/* 形象故事 */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-700 rounded-3xl p-8 shadow-xl">
                <SectionTitle
                  icon={<Sparkles className="w-5 h-5" />}
                  title="形象故事"
                  subtitle="Character Story"
                />
                <div className="prose dark:prose-invert max-w-none">
                  <blockquote className="text-lg italic text-gray-700 dark:text-gray-300 border-l-4 border-amber-500 pl-4 mb-4">
                    {design.base.story.split('\n')[0]}
                  </blockquote>
                  <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                    {design.base.story}
                  </p>
                </div>
              </div>

              {/* 设计特点 */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">设计特点</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {design.designDescription.features.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl"
                    >
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* 文化元素 */}
              {design.designDescription.culturalElements && (
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    文化元素
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {design.designDescription.culturalElements.map((element, index) => (
                      <motion.span
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-full text-sm"
                      >
                        {element}
                      </motion.span>
                    ))}
                  </div>
                </div>
              )}

              {/* 应用场景 */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl">
                <SectionTitle
                  icon={<Layers className="w-5 h-5" />}
                  title="应用场景"
                  subtitle="Application Scenes"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {design.applicationScenes.map((scene, index) => (
                    <motion.div
                      key={scene.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:shadow-lg transition-shadow"
                    >
                      <span className="text-3xl mb-2 block">{scene.icon}</span>
                      <h4 className="font-bold text-gray-900 dark:text-white mb-1">{scene.name}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        {scene.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {scene.examples.map((example, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded"
                          >
                            {example}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'colors' && (
            <motion.div
              key="colors"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl">
                <SectionTitle
                  icon={<Palette className="w-5 h-5" />}
                  title="配色方案"
                  subtitle="Color Scheme"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {design.colorScheme.map((scheme, index) => (
                    <ColorCard key={index} scheme={scheme} index={index} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'emojis' && (
            <motion.div
              key="emojis"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl">
                <SectionTitle
                  icon={<Smile className="w-5 h-5" />}
                  title="表情包"
                  subtitle="Emoji Expressions"
                />
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
                  {design.emojis.map((emoji, index) => (
                    <EmojiCard key={emoji.id} emoji={emoji} index={index} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'actions' && (
            <motion.div
              key="actions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl">
                <SectionTitle
                  icon={<Zap className="w-5 h-5" />}
                  title="动作延展"
                  subtitle="Action Poses"
                />
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                  {design.actionPoses.map((action, index) => (
                    <ActionCard
                      key={action.id}
                      action={action}
                      index={index}
                      onImageClick={setSelectedImage}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'posters' && (
            <motion.div
              key="posters"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl">
                <SectionTitle
                  icon={<Image className="w-5 h-5" />}
                  title="衍生海报"
                  subtitle="Derivative Posters"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {design.posters.map((poster, index) => (
                    <PosterCard
                      key={poster.id}
                      poster={poster}
                      index={index}
                      onImageClick={setSelectedImage}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'merchandise' && (
            <motion.div
              key="merchandise"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl">
                <SectionTitle
                  icon={<ShoppingBag className="w-5 h-5" />}
                  title="周边设计"
                  subtitle="Merchandise Design"
                />
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
                  {design.merchandise.map((item, index) => (
                    <MerchandiseCard
                      key={item.id}
                      item={item}
                      index={index}
                      onImageClick={setSelectedImage}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'costumes' && design.costumes && (
            <motion.div
              key="costumes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl">
                <SectionTitle
                  icon={<Layers className="w-5 h-5" />}
                  title="变装设计"
                  subtitle="Costume Design"
                />
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
                  {design.costumes.map((costume, index) => (
                    <CostumeCard
                      key={costume.id}
                      costume={costume}
                      index={index}
                      onImageClick={setSelectedImage}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 图片查看器 */}
      <AnimatePresence>
        {selectedImage && (
          <ImageViewer
            src={selectedImage}
            alt="查看图片"
            onClose={() => setSelectedImage(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// IP 形象列表页面
const IPCharacterListPage: React.FC = () => {
  const navigate = useNavigate();
  const [characters] = useState<IPCharacterListItem[]>(getAllIPCharacters());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCharacters = characters.filter(
    (char) =>
      char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      char.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      char.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            <span className="bg-gradient-to-r from-blue-600 via-teal-500 to-cyan-600 bg-clip-text text-transparent">
              IP 形象设计
            </span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            探索我们精心设计的 IP 形象系列，每个形象都承载着独特的文化内涵与创意理念
          </p>
        </motion.div>

        {/* 搜索和筛选 */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索 IP 形象..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-3 rounded-xl transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-3 rounded-xl transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* IP 形象列表 */}
        <div
          className={`grid gap-6 ${
            viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
          }`}
        >
          {filteredCharacters.map((character, index) => (
            <motion.div
              key={character.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => navigate(`/ip-design/${character.id}`)}
              className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all cursor-pointer group"
            >
              <div className="aspect-[4/3] relative overflow-hidden">
                <img
                  src={character.thumbnail}
                  alt={character.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {character.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {character.englishName}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-xs rounded-full">
                    {character.category === 'culture'
                      ? '文化'
                      : character.category === 'mascot'
                      ? '吉祥物'
                      : character.category}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {character.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 主页面组件
export default function IPDesignShowcase() {
  const { id } = useParams<{ id: string }>();

  if (id) {
    const design = getIPCharacterById(id);
    if (design) {
      return <IPCharacterShowcase design={design} />;
    }
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            IP 形象未找到
          </h1>
          <p className="text-gray-500 dark:text-gray-400">请检查 URL 是否正确</p>
        </div>
      </div>
    );
  }

  return <IPCharacterListPage />;
}
