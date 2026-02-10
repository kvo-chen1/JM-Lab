import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { GenerationResult } from '../types/workheart';
import { 
  useGenerationResults,
  useSelectedResult,
  useWorkHeartStore 
} from '../hooks/useWorkHeartStore';
import AddToVeinModal from './AddToVeinModal';

interface ResultCardProps {
  result: GenerationResult;
  isSelected: boolean;
  onClick: () => void;
  onFavorite: () => void;
  onDelete: () => void;
  onAddToVein: () => void;
}

function ResultCard({ result, isSelected, onClick, onFavorite, onDelete, onAddToVein }: ResultCardProps) {
  const { isDark } = useTheme();

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = result.url;
    link.download = `workheart-${result.id}.png`;
    link.click();
    toast.success('开始下载');
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(result.url);
    toast.success('链接已复制');
  };

  const handleAddToVein = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToVein();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className={`group relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
        isSelected
          ? isDark 
            ? 'border-red-500 shadow-lg shadow-red-500/20' 
            : 'border-red-500 shadow-lg shadow-red-500/20'
          : isDark 
            ? 'border-slate-700 hover:border-slate-600' 
            : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* 图片 */}
      <div className="aspect-square relative">
        <img
          src={result.thumbnail || result.url}
          alt={result.prompt}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        
        {/* 悬停遮罩 */}
        <div className={`absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2`}>
          <button
            onClick={handleDownload}
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
            title="下载"
          >
            <i className="fas fa-download"></i>
          </button>
          <button
            onClick={handleCopy}
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
            title="复制链接"
          >
            <i className="fas fa-link"></i>
          </button>
          <button
            onClick={handleAddToVein}
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-blue-500/50 text-white flex items-center justify-center transition-colors"
            title="添加到灵感脉络"
          >
            <i className="fas fa-project-diagram"></i>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-red-500/50 text-white flex items-center justify-center transition-colors"
            title="删除"
          >
            <i className="fas fa-trash"></i>
          </button>
        </div>

        {/* 收藏标记 */}
        {result.isFavorite && (
          <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg">
            <i className="fas fa-heart text-sm"></i>
          </div>
        )}

        {/* 类型标记 */}
        <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-black/50 text-white text-xs backdrop-blur-sm">
          <i className={`fas fa-${result.type === 'video' ? 'video' : 'image'} mr-1`}></i>
          {result.type === 'video' ? '视频' : '图片'}
        </div>
      </div>

      {/* 信息 */}
      <div className={`p-3 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
        <p className={`text-xs line-clamp-2 mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          {result.prompt}
        </p>
        <div className="flex items-center justify-between">
          <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {new Date(result.createdAt).toLocaleDateString()}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onFavorite(); }}
            className={`text-sm transition-colors ${
              result.isFavorite 
                ? 'text-red-500' 
                : isDark ? 'text-slate-500 hover:text-red-400' : 'text-slate-400 hover:text-red-500'
            }`}
          >
            <i className={`${result.isFavorite ? 'fas' : 'far'} fa-heart`}></i>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function ResultsGrid() {
  const { isDark } = useTheme();
  const results = useGenerationResults();
  const selectedResult = useSelectedResult();
  const { selectResult, toggleFavorite, deleteResult } = useWorkHeartStore();
  
  const [isVeinModalOpen, setIsVeinModalOpen] = useState(false);
  const [selectedForVein, setSelectedForVein] = useState<GenerationResult | null>(null);

  const handleAddToVein = (result: GenerationResult) => {
    setSelectedForVein(result);
    setIsVeinModalOpen(true);
  };

  if (results.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${
        isDark ? 'text-slate-500' : 'text-slate-400'
      }`}>
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
          isDark ? 'bg-slate-800' : 'bg-slate-100'
        }`}>
          <i className="fas fa-images text-3xl"></i>
        </div>
        <p className="text-sm font-medium">暂无生成结果</p>
        <p className="text-xs mt-1">输入提示词开始创作吧</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            生成结果
          </h3>
          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            共 {results.length} 个作品
          </span>
        </div>

        <motion.div 
          layout
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {results.map((result) => (
              <ResultCard
                key={result.id}
                result={result}
                isSelected={selectedResult?.id === result.id}
                onClick={() => selectResult(result.id)}
                onFavorite={() => toggleFavorite(result.id)}
                onDelete={() => {
                  if (confirm('确定要删除这个作品吗？')) {
                    deleteResult(result.id);
                  }
                }}
                onAddToVein={() => handleAddToVein(result)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* 添加到灵感脉络模态框 */}
      <AddToVeinModal
        isOpen={isVeinModalOpen}
        onClose={() => {
          setIsVeinModalOpen(false);
          setSelectedForVein(null);
        }}
        result={selectedForVein}
      />
    </>
  );
}
