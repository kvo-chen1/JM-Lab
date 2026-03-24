// 案例网格组件

import React, { useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { AgentCase } from '../types';
import { CaseCard } from './CaseCard';
import { Loader2, ImageOff } from 'lucide-react';

interface CaseGridProps {
  cases: AgentCase[];
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onCaseClick?: (caseData: AgentCase) => void;
  onAuthorClick?: (authorId: string) => void;
  emptyText?: string;
}

export const CaseGrid: React.FC<CaseGridProps> = ({
  cases,
  loading = false,
  hasMore = false,
  onLoadMore,
  onCaseClick,
  onAuthorClick,
  emptyText = '暂无案例',
}) => {
  const { isDark } = useTheme();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 无限滚动加载
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && hasMore && !loading && onLoadMore) {
        onLoadMore();
      }
    },
    [hasMore, loading, onLoadMore]
  );

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '100px',
      threshold: 0,
    });

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver]);

  // 空状态
  if (cases.length === 0 && !loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20"
      >
        <div className={`
          w-24 h-24 rounded-2xl flex items-center justify-center mb-6
          ${isDark ? 'bg-[#1a1f1a]' : 'bg-gray-100'}
        `}>
          <ImageOff className={`w-10 h-10 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
        </div>
        <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          {emptyText}
        </h3>
        <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
          成为第一个分享创作的人吧
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 网格布局 */}
      <div className="
        grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6
        gap-4 md:gap-5
      ">
        {cases.map((caseData, index) => (
          <CaseCard
            key={caseData.id}
            caseData={caseData}
            index={index}
            onClick={() => onCaseClick?.(caseData)}
            onAuthorClick={(e) => {
              e.stopPropagation();
              onAuthorClick?.(caseData.author.id);
            }}
          />
        ))}
      </div>

      {/* 加载更多触发器 */}
      {hasMore && (
        <div
          ref={loadMoreRef}
          className="flex items-center justify-center py-8"
        >
          {loading && (
            <div className="flex items-center gap-2">
              <Loader2 className={`w-5 h-5 animate-spin ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                加载更多...
              </span>
            </div>
          )}
        </div>
      )}

      {/* 加载中状态 */}
      {loading && cases.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-3">
            <Loader2 className={`w-6 h-6 animate-spin ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <span className={`text-base ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              加载中...
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseGrid;
