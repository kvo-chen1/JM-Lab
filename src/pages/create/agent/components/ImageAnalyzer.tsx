import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { getImageUnderstandingService, ImageAnalysisResult } from '../services/imageUnderstanding';
import { ImageIcon, X, Loader2, Palette, Tag, Box, Heart, Layout, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface ImageAnalyzerProps {
  imageUrl: string;
  onAnalysisComplete?: (result: ImageAnalysisResult) => void;
  onClose?: () => void;
}

export default function ImageAnalyzer({ imageUrl, onAnalysisComplete, onClose }: ImageAnalyzerProps) {
  const { isDark } = useTheme();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ImageAnalysisResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const imageService = getImageUnderstandingService();

  // 分析图像
  const analyzeImage = async () => {
    if (isAnalyzing) return;
    
    setIsAnalyzing(true);
    try {
      const analysisResult = await imageService.analyzeImage(imageUrl);
      setResult(analysisResult);
      
      if (onAnalysisComplete) {
        onAnalysisComplete(analysisResult);
      }
      
      toast.success('图像分析完成！');
    } catch (error) {
      console.error('[ImageAnalyzer] Analysis failed:', error);
      toast.error('图像分析失败，请重试');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 获取置信度颜色
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-500';
    if (confidence >= 0.6) return 'text-yellow-500';
    return 'text-red-500';
  };

  // 渲染分析结果
  const renderAnalysisResult = () => {
    if (!result) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* 描述 */}
        <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
          <h4 className={`text-sm font-medium mb-2 flex items-center gap-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
            <Sparkles className="w-4 h-4 text-amber-500" />
            图像描述
          </h4>
          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {result.description}
          </p>
        </div>

        {/* 详细信息网格 */}
        <div className="grid grid-cols-2 gap-3">
          {/* 物体 */}
          {result.objects.length > 0 && (
            <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
              <h4 className={`text-sm font-medium mb-2 flex items-center gap-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                <Box className="w-4 h-4 text-blue-500" />
                物体
              </h4>
              <div className="flex flex-wrap gap-1">
                {Array.isArray(result.objects) && result.objects.map((obj, i) => (
                  <span 
                    key={i}
                    className={`text-xs px-2 py-1 rounded-full ${
                      isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {obj}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 颜色 */}
          {result.colors.length > 0 && (
            <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
              <h4 className={`text-sm font-medium mb-2 flex items-center gap-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                <Palette className="w-4 h-4 text-purple-500" />
                主色调
              </h4>
              <div className="flex flex-wrap gap-1">
                {Array.isArray(result.colors) && result.colors.map((color, i) => (
                  <span 
                    key={i}
                    className={`text-xs px-2 py-1 rounded-full ${
                      isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {color}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 风格 */}
          <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
            <h4 className={`text-sm font-medium mb-2 flex items-center gap-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              <Layout className="w-4 h-4 text-green-500" />
              风格
            </h4>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {result.style}
            </p>
          </div>

          {/* 氛围 */}
          <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
            <h4 className={`text-sm font-medium mb-2 flex items-center gap-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              <Heart className="w-4 h-4 text-pink-500" />
              氛围
            </h4>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {result.mood}
            </p>
          </div>
        </div>

        {/* 标签 */}
        {result.tags.length > 0 && (
          <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
            <h4 className={`text-sm font-medium mb-2 flex items-center gap-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              <Tag className="w-4 h-4 text-orange-500" />
              标签
            </h4>
            <div className="flex flex-wrap gap-1">
              {Array.isArray(result.tags) && result.tags.map((tag, i) => (
                <span 
                  key={i}
                  className={`text-xs px-2 py-1 rounded ${
                    isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 置信度 */}
        <div className={`flex items-center justify-between p-3 rounded-lg ${
          isDark ? 'bg-gray-700/50' : 'bg-gray-50'
        }`}>
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            分析置信度
          </span>
          <span className={`text-sm font-medium ${getConfidenceColor(result.confidence)}`}>
            {Math.round(result.confidence * 100)}%
          </span>
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`rounded-xl border overflow-hidden ${
        isDark 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}
    >
      {/* 头部 */}
      <div className={`flex items-center justify-between p-3 border-b ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-blue-500" />
          <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            图像分析
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`p-1 rounded transition-colors ${
              isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 内容 */}
      <div className="p-4 space-y-4">
        {/* 图像预览 */}
        <div className="relative rounded-lg overflow-hidden">
          <img 
            src={imageUrl} 
            alt="待分析图像" 
            className="w-full h-48 object-cover"
          />
          
          {/* 分析按钮 */}
          {!result && !isAnalyzing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={analyzeImage}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium shadow-lg"
              >
                分析图像
              </motion.button>
            </div>
          )}

          {/* 加载状态 */}
          {isAnalyzing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="flex items-center gap-2 text-white">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>分析中...</span>
              </div>
            </div>
          )}
        </div>

        {/* 分析结果 */}
        <AnimatePresence>
          {result && renderAnalysisResult()}
        </AnimatePresence>

        {/* 重新分析按钮 */}
        {result && (
          <button
            onClick={analyzeImage}
            disabled={isAnalyzing}
            className={`w-full py-2 text-sm rounded-lg transition-colors ${
              isDark 
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } disabled:opacity-50`}
          >
            {isAnalyzing ? '分析中...' : '重新分析'}
          </button>
        )}
      </div>
    </motion.div>
  );
}
