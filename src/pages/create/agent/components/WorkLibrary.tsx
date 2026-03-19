import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { Search, X, Library, ImageIcon, Check, AtSign } from 'lucide-react';
import { workService, Work } from '@/services/workService';
import { useAgentStore } from '../hooks/useAgentStore';
import { toast } from 'sonner';

interface WorkLibraryProps {
  onClose: () => void;
  selectedWork?: string;
}

// 作品卡片组件 - 提取到外部避免重复创建
interface WorkCardProps {
  work: Work;
  index: number;
  isSelected: boolean;
  isHovered: boolean;
  isDark: boolean;
  onMention: (work: Work) => void;
  onHover: (id: string | null) => void;
}

const WorkCard = React.memo(function WorkCard({
  work,
  index,
  isSelected,
  isHovered,
  isDark,
  onMention,
  onHover
}: WorkCardProps) {
  const handleMentionClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onMention(work);
  }, [onMention, work]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
      className={`group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${
        isSelected
          ? 'ring-2 ring-[#C02C38] ring-offset-2 ring-offset-gray-900'
          : 'hover:ring-2 hover:ring-gray-600'
      }`}
      onMouseEnter={() => onHover(work.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* 图片区域 */}
      <div className="aspect-[4/3] overflow-hidden bg-gray-800 relative">
        {work.thumbnail ? (
          <img
            src={work.thumbnail}
            alt={work.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop';
            }}
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
            <ImageIcon className={`w-12 h-12 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
          </div>
        )}

        {/* 选中标记 */}
        {isSelected && (
          <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-[#C02C38] flex items-center justify-center shadow-lg">
            <Check className="w-4 h-4 text-white" />
          </div>
        )}

        {/* 悬停遮罩和操作按钮 */}
        <motion.div
          initial={false}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none"
        />

        {/* 引用按钮 */}
        <motion.div
          initial={false}
          animate={{ 
            opacity: isHovered ? 1 : 0, 
            y: isHovered ? 0 : -10 
          }}
          transition={{ duration: 0.2 }}
          className="absolute top-3 right-3"
        >
          <button
            onClick={handleMentionClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C02C38] text-white text-xs font-medium shadow-lg hover:bg-[#a82530] transition-colors pointer-events-auto"
            title="引用到输入框"
          >
            <AtSign className="w-3.5 h-3.5" />
            引用
          </button>
        </motion.div>
      </div>

      {/* 信息区域 */}
      <div className={`p-3 ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
        <h4 className={`font-semibold text-sm mb-1 truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {work.title}
        </h4>
        <p className={`text-xs line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {work.description || '暂无描述'}
        </p>
        <div className="flex items-center justify-between mt-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
            {work.category}
          </span>
          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {new Date(work.createdAt).toLocaleDateString('zh-CN')}
          </span>
        </div>
      </div>
    </motion.div>
  );
});

export default function WorkLibrary({ onClose, selectedWork }: WorkLibraryProps) {
  const { isDark } = useTheme();
  const { setPendingMention } = useAgentStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [localSelectedWork, setLocalSelectedWork] = useState<string | undefined>(selectedWork);
  const [works, setWorks] = useState<Work[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredWorkId, setHoveredWorkId] = useState<string | null>(null);

  // 加载用户作品 - 只执行一次
  useEffect(() => {
    let isMounted = true;
    
    const loadWorks = async () => {
      try {
        setIsLoading(true);
        const userWorks = await workService.getUserWorks();
        if (isMounted) {
          setWorks(userWorks);
        }
      } catch (error) {
        console.error('加载作品失败:', error);
        if (isMounted) {
          toast.error('加载作品失败');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadWorks();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // 过滤作品
  const filteredWorks = useMemo(() => {
    if (!searchQuery) return works;
    const query = searchQuery.toLowerCase();
    return works.filter(work =>
      work.title.toLowerCase().includes(query) ||
      work.description.toLowerCase().includes(query) ||
      work.category.toLowerCase().includes(query)
    );
  }, [works, searchQuery]);

  // 处理作品引用
  const handleMentionWork = useCallback((work: Work) => {
    setPendingMention({
      type: 'work',
      name: work.title,
      id: work.id
    });
    setLocalSelectedWork(work.id);
    toast.success(`已引用作品：${work.title}，请在输入框中描述您的需求`);
    onClose();
  }, [setPendingMention, onClose]);

  // 处理悬停
  const handleHover = useCallback((id: string | null) => {
    setHoveredWorkId(id);
  }, []);

  return (
    <div className={`h-full flex flex-col ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      {/* 头部 */}
      <div className={`p-5 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA] flex items-center justify-center">
              <Library className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                我的作品库
              </h3>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {isLoading ? '加载中...' : `${filteredWorks.length} 个作品`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 搜索框 */}
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
            isDark ? 'text-gray-500' : 'text-gray-400'
          }`} />
          <input
            type="text"
            placeholder="搜索作品..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm ${
              isDark
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
            } focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent`}
          />
        </div>
      </div>

      {/* 作品网格 */}
      <div className="flex-1 overflow-y-auto p-5">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
            <p className={`mt-4 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              加载作品中...
            </p>
          </div>
        ) : filteredWorks.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWorks.map((work, index) => (
              <WorkCard
                key={work.id}
                work={work}
                index={index}
                isSelected={localSelectedWork === work.id}
                isHovered={hoveredWorkId === work.id}
                isDark={isDark}
                onMention={handleMentionWork}
                onHover={handleHover}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Library className={`w-12 h-12 mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {searchQuery ? '没有找到相关作品' : '暂无作品，快去创作吧'}
            </p>
          </div>
        )}
      </div>

      {/* 底部 */}
      <div className={`p-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {localSelectedWork
              ? `已选择: ${works.find(w => w.id === localSelectedWork)?.title}`
              : '悬浮作品卡片点击"引用"按钮引用作品'}
          </p>
        </div>
      </div>
    </div>
  );
}
