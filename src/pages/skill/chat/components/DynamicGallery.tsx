import React, { useState, useCallback } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Check, Clock, Image as ImageIcon, X, Download, Eye } from 'lucide-react';
import type { Attachment } from '../types';

interface GalleryItem extends Attachment {
  taskName?: string;
  completedAt?: number;
  status?: 'generating' | 'completed' | 'failed';
}

interface DynamicGalleryProps {
  items: GalleryItem[];
  totalTasks: number;
  currentTaskIndex: number;
  className?: string;
}

/**
 * 动态画廊组件
 * 用于批量生成场景，实时展示生成的图片
 */
export const DynamicGallery: React.FC<DynamicGalleryProps> = ({
  items,
  totalTasks,
  currentTaskIndex,
  className = '',
}) => {
  const { isDark } = useTheme();
  const [previewItem, setPreviewItem] = useState<GalleryItem | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const completedCount = items.filter(item => item.status === 'completed').length;
  const progressPercent = Math.round((completedCount / totalTasks) * 100);

  // 格式化时间
  const formatTime = useCallback((timestamp?: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }, []);

  // 下载图片
  const handleDownload = useCallback((item: GalleryItem, index: number) => {
    if (item.type === 'image' && item.url) {
      const link = document.createElement('a');
      link.href = item.url;
      link.download = `${item.taskName || `design_${index + 1}`}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, []);

  // 下载全部
  const handleDownloadAll = useCallback(() => {
    items.forEach((item, index) => {
      if (item.status === 'completed') {
        setTimeout(() => handleDownload(item, index), index * 500);
      }
    });
  }, [items, handleDownload]);

  return (
    <div className={`rounded-2xl overflow-hidden ${className}`}>
      {/* 头部信息 */}
      <div className={`px-4 py-3 flex items-center justify-between ${
        isDark ? 'bg-gray-800 border-b border-gray-700' : 'bg-gray-50 border-b border-gray-200'
      }`}>
        <div className="flex items-center gap-2">
          <ImageIcon className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
          <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
            已生成 {completedCount}/{totalTasks} 个设计
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* 进度条 */}
          <div className={`w-24 h-2 rounded-full overflow-hidden ${
            isDark ? 'bg-gray-700' : 'bg-gray-200'
          }`}>
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {progressPercent}%
          </span>
          {completedCount === totalTasks && (
            <button
              onClick={handleDownloadAll}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isDark 
                  ? 'bg-blue-600 hover:bg-blue-500 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              <Download className="w-4 h-4" />
              下载全部
            </button>
          )}
        </div>
      </div>

      {/* 画廊网格 */}
      <div className={`p-4 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {items.map((item, index) => (
            <div
              key={item.id || index}
              className={`relative group rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${
                item.status === 'generating' 
                  ? 'animate-pulse' 
                  : 'hover:scale-105 hover:shadow-xl'
              } ${
                isDark ? 'bg-gray-800' : 'bg-gray-100'
              }`}
              style={{
                animationDelay: `${index * 100}ms`,
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => item.status === 'completed' && setPreviewItem(item)}
            >
              {/* 图片容器 */}
              <div className="aspect-square relative">
                {item.type === 'image' && item.url ? (
                  <>
                    <img
                      src={item.url}
                      alt={item.taskName || `Design ${index + 1}`}
                      className={`w-full h-full object-cover transition-opacity duration-300 ${
                        item.status === 'completed' ? 'opacity-100' : 'opacity-50'
                      }`}
                      loading="lazy"
                    />
                    {/* 悬停遮罩 */}
                    {item.status === 'completed' && hoveredIndex === index && (
                      <div className={`absolute inset-0 flex items-center justify-center gap-2 ${
                        isDark ? 'bg-black/60' : 'bg-white/60'
                      }`}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewItem(item);
                          }}
                          className={`p-2 rounded-full transition-colors ${
                            isDark 
                              ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                              : 'bg-white hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(item, index);
                          }}
                          className={`p-2 rounded-full transition-colors ${
                            isDark 
                              ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                              : 'bg-white hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          <Download className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className={`w-full h-full flex items-center justify-center ${
                    isDark ? 'bg-gray-800' : 'bg-gray-100'
                  }`}>
                    {item.status === 'generating' ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className={`w-8 h-8 border-2 border-t-transparent rounded-full animate-spin ${
                          isDark ? 'border-blue-400' : 'border-blue-500'
                        }`} />
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          生成中...
                        </span>
                      </div>
                    ) : (
                      <ImageIcon className={`w-8 h-8 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                    )}
                  </div>
                )}

                {/* 状态标记 */}
                <div className="absolute top-2 right-2">
                  {item.status === 'completed' ? (
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      isDark ? 'bg-green-600' : 'bg-green-500'
                    }`}>
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  ) : item.status === 'generating' ? (
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      isDark ? 'bg-blue-600' : 'bg-blue-500'
                    }`}>
                      <Clock className="w-4 h-4 text-white animate-pulse" />
                    </div>
                  ) : item.status === 'failed' ? (
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      isDark ? 'bg-red-600' : 'bg-red-500'
                    }`}>
                      <X className="w-4 h-4 text-white" />
                    </div>
                  ) : null}
                </div>
              </div>

              {/* 底部信息 */}
              <div className={`px-3 py-2 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <p className={`text-sm font-medium truncate ${
                  isDark ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  {item.taskName || `设计 ${index + 1}`}
                </p>
                {item.completedAt && (
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {formatTime(item.completedAt)}
                  </p>
                )}
              </div>
            </div>
          ))}

          {/* 占位符 - 显示未完成的任务 */}
          {Array.from({ length: Math.max(0, totalTasks - items.length) }).map((_, index) => (
            <div
              key={`placeholder-${index}`}
              className={`rounded-xl overflow-hidden ${
                isDark ? 'bg-gray-800/50' : 'bg-gray-100/50'
              }`}
            >
              <div className={`aspect-square flex items-center justify-center ${
                isDark ? 'bg-gray-800/30' : 'bg-gray-100/50'
              }`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isDark ? 'bg-gray-700' : 'bg-gray-200'
                }`}>
                  <span className={`text-lg font-medium ${
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {items.length + index + 1}
                  </span>
                </div>
              </div>
              <div className={`px-3 py-2 ${isDark ? 'bg-gray-800/50' : 'bg-gray-100/50'}`}>
                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  等待中...
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 预览模态框 */}
      {previewItem && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewItem(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] overflow-auto rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {previewItem.type === 'image' && previewItem.url && (
              <img
                src={previewItem.url}
                alt={previewItem.taskName || 'Preview'}
                className="max-w-full max-h-[80vh] object-contain rounded-2xl"
              />
            )}
            <div className={`absolute bottom-4 left-4 right-4 flex items-center justify-between px-4 py-3 rounded-xl ${
              isDark ? 'bg-gray-800/90' : 'bg-white/90'
            }`}>
              <div>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {previewItem.taskName || '设计预览'}
                </p>
                {previewItem.completedAt && (
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    完成于 {formatTime(previewItem.completedAt)}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  const index = items.findIndex(item => item.id === previewItem.id);
                  handleDownload(previewItem, index >= 0 ? index : 0);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDark 
                    ? 'bg-blue-600 hover:bg-blue-500 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                <Download className="w-5 h-5" />
                下载
              </button>
            </div>
            <button
              onClick={() => setPreviewItem(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicGallery;
