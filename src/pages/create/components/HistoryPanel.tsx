import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCreateStore } from '@/pages/create/hooks/useCreateStore';
import { useTheme } from '@/hooks/useTheme';

export default function HistoryPanel({ onClose }: { onClose: () => void }) {
  const { isDark } = useTheme();
  const generatedResults = useCreateStore((state) => state.generatedResults);
  const setGeneratedResults = useCreateStore((state) => state.setGeneratedResults);
  const setSelectedResult = useCreateStore((state) => state.setSelectedResult);
  const setPrompt = useCreateStore((state) => state.setPrompt);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'session' | 'drafts' | 'history'>('session');

  useEffect(() => {
    console.log('[HistoryPanel] Component mounted');
    // Load drafts from localStorage
    try {
      const savedDrafts = JSON.parse(localStorage.getItem('CREATE_DRAFTS') || '[]');
      console.log('[HistoryPanel] Loaded drafts:', savedDrafts.length);
      setDrafts(savedDrafts);

      // Load history from localStorage
      const savedHistoryRaw = localStorage.getItem('CREATE_HISTORY');
      console.log('[HistoryPanel] Raw history from localStorage:', savedHistoryRaw);

      const savedHistory = JSON.parse(savedHistoryRaw || '[]');
      console.log('[HistoryPanel] Parsed history:', savedHistory.length, 'items');

      // 验证历史记录数据格式
      const validHistory = savedHistory.filter((item: any) => {
        const isValid = item && item.id && item.thumbnail && item.timestamp;
        if (!isValid) {
          console.warn('[HistoryPanel] Invalid history item:', item);
        }
        return isValid;
      });

      if (validHistory.length !== savedHistory.length) {
        console.warn('[HistoryPanel] Filtered out', savedHistory.length - validHistory.length, 'invalid items');
      }

      setHistory(validHistory);
    } catch (e) {
      console.error('[HistoryPanel] Failed to load drafts or history:', e);
      setHistory([]);
      setDrafts([]);
    }
  }, []);

  // Debug: log generated results
  useEffect(() => {
    console.log('Generated results:', generatedResults);
  }, [generatedResults]);

  const handleSelectResult = (id: number) => {
    setSelectedResult(id);
    onClose();
  };

  const handleSelectHistory = (historyItem: any) => {
    // 从历史记录中恢复创作
    const result = {
      id: Date.now(),
      thumbnail: historyItem.thumbnail,
      video: historyItem.video,
      type: historyItem.type || 'image',
      score: 80,
    };
    setGeneratedResults([result]);
    setSelectedResult(result.id);
    if (historyItem.prompt) {
      setPrompt(historyItem.prompt);
    }
    onClose();
  };

  const handleClearHistory = () => {
    if (confirm('确定要清空所有历史记录吗？此操作不可恢复。')) {
      localStorage.removeItem('CREATE_HISTORY');
      setHistory([]);
    }
  };

  // 临时调试：移除 Portal 和 Animation，直接返回最简单的 UI
  return createPortal(
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-end bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`w-full max-w-md h-full shadow-2xl overflow-hidden flex flex-col ${isDark ? 'bg-gray-900' : 'bg-white'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">创作记录</h2>
          <button 
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('session')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'session' ? (isDark ? 'border-blue-500 text-blue-400' : 'border-blue-600 text-blue-600') : (isDark ? 'border-transparent text-gray-400 hover:text-gray-200' : 'border-transparent text-gray-500 hover:text-gray-700')}`}
          >
            本次创作 ({generatedResults.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'history' ? (isDark ? 'border-blue-500 text-blue-400' : 'border-blue-600 text-blue-600') : (isDark ? 'border-transparent text-gray-400 hover:text-gray-200' : 'border-transparent text-gray-500 hover:text-gray-700')}`}
          >
            历史记录 ({history.length})
          </button>
          <button
            onClick={() => setActiveTab('drafts')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'drafts' ? (isDark ? 'border-blue-500 text-blue-400' : 'border-blue-600 text-blue-600') : (isDark ? 'border-transparent text-gray-400 hover:text-gray-200' : 'border-transparent text-gray-500 hover:text-gray-700')}`}
          >
            草稿箱 ({drafts.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'session' ? (
            generatedResults.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {generatedResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleSelectResult(result.id)}
                    className="relative aspect-square rounded-xl overflow-hidden group border border-transparent hover:border-blue-500 transition-all bg-gray-100 dark:bg-gray-800"
                  >
                    {result.type === 'video' || result.video ? (
                      <>
                        <img 
                          src={result.thumbnail || 'https://via.placeholder.com/150?text=Video'} 
                          alt="" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Video';
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <i className="fas fa-play-circle text-white text-2xl"></i>
                        </div>
                        <div className="absolute bottom-1 right-1">
                          <span className="text-[8px] px-1 py-0.5 rounded bg-black/60 text-white">
                            <i className="fas fa-video"></i>
                          </span>
                        </div>
                      </>
                    ) : (
                      <img 
                        src={result.thumbnail || 'https://via.placeholder.com/150?text=No+Image'} 
                        alt="" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=No+Image';
                        }}
                      />
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <i className="fas fa-image text-4xl mb-3 opacity-30"></i>
                <p>暂无本次创作记录</p>
              </div>
            )
          ) : activeTab === 'history' ? (
            history.length > 0 ? (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <button
                    onClick={handleClearHistory}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${isDark ? 'text-red-400 hover:bg-red-900/30' : 'text-red-500 hover:bg-red-50'}`}
                  >
                    <i className="fas fa-trash-alt mr-1"></i>清空历史
                  </button>
                </div>
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectHistory(item)}
                    className={`w-full p-3 rounded-xl border flex gap-3 transition-all text-left ${isDark ? 'bg-gray-800 border-gray-700 hover:border-gray-600' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      {item.type === 'video' || item.video ? (
                        <>
                          {item.thumbnail ? (
                            <img 
                              src={item.thumbnail} 
                              alt="" 
                              className="w-full h-full object-cover absolute inset-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : null}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
                            <i className="fas fa-play-circle text-white text-3xl"></i>
                          </div>
                          <div className="absolute bottom-1 right-1 z-10">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-white">
                              <i className="fas fa-video mr-1"></i>视频
                            </span>
                          </div>
                        </>
                      ) : (
                        <img 
                          src={item.thumbnail || 'https://via.placeholder.com/150?text=No+Image'} 
                          alt="" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=No+Image';
                          }}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs line-clamp-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{item.prompt || '无描述'}</p>
                      {item.stylePreset && (
                        <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                          {item.stylePreset}
                        </span>
                      )}
                      {(item.type === 'video' || item.video) && (
                        <span className={`inline-block mt-1 ml-1 text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>
                          <i className="fas fa-video mr-1"></i>视频
                        </span>
                      )}
                      <div className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {new Date(item.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <i className="fas fa-history text-4xl mb-3 opacity-30"></i>
                <p>暂无历史记录</p>
                <p className="text-xs mt-1 opacity-60">修改纹样属性后会自动保存</p>
              </div>
            )
          ) : (
            drafts.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {drafts.map((draft) => (
                  <button
                    key={draft.id}
                    className="relative aspect-square rounded-xl overflow-hidden group border border-transparent hover:border-blue-500 transition-all bg-gray-100 dark:bg-gray-800"
                  >
                    {draft.generatedResults && draft.generatedResults.length > 0 ? (
                      <img 
                        src={draft.generatedResults[0].thumbnail || 'https://via.placeholder.com/150?text=No+Image'} 
                        alt="" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=No+Image';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                        <i className="fas fa-image text-3xl mb-2"></i>
                        <span className="text-xs">无预览</span>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                      <h3 className="text-white text-xs font-medium truncate">{draft.name || '未命名'}</h3>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <i className="fas fa-archive text-4xl mb-3 opacity-30"></i>
                <p>草稿箱空空如也</p>
              </div>
            )
          )}
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}
