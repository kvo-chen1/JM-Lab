// 案例详情状态管理Hook

import { useState, useCallback, useEffect } from 'react';
import { CaseDetail } from '../types';
import {
  getCaseDetail,
  toggleLikeCase,
  createSimilarCase,
  checkIsLiked,
} from '../services/agentCaseService';

interface UseCaseDetailReturn {
  caseDetail: CaseDetail | null;
  loading: boolean;
  error: string | null;
  currentImageIndex: number;
  isLiked: boolean;
  isCreatingSimilar: boolean;
  setCurrentImageIndex: (index: number) => void;
  handleLike: () => Promise<void>;
  handleShare: () => Promise<void>;
  handleViewReplay: () => void;
  handleCreateSimilar: () => Promise<{ redirectUrl: string; prefillData: any } | null>;
  refresh: () => Promise<void>;
}

export function useCaseDetail(caseId: string): UseCaseDetailReturn {
  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isCreatingSimilar, setIsCreatingSimilar] = useState(false);

  // 加载案例详情
  const loadCaseDetail = useCallback(async () => {
    if (!caseId) return;

    setLoading(true);
    setError(null);

    try {
      const [detail, liked] = await Promise.all([
        getCaseDetail(caseId),
        checkIsLiked(caseId),
      ]);

      setCaseDetail(detail);
      setIsLiked(liked);
      setCurrentImageIndex(0);
    } catch (err) {
      console.error('加载案例详情失败:', err);
      setError('加载案例详情失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  // 处理点赞
  const handleLike = useCallback(async () => {
    if (!caseDetail) return;

    try {
      await toggleLikeCase(caseId, isLiked);
      setIsLiked(!isLiked);
      setCaseDetail(prev => {
        if (!prev) return null;
        return {
          ...prev,
          likes: isLiked ? prev.likes - 1 : prev.likes + 1,
        };
      });
    } catch (err) {
      console.error('点赞失败:', err);
    }
  }, [caseId, isLiked, caseDetail]);

  // 处理分享
  const handleShare = useCallback(async () => {
    if (!caseDetail) return;

    const shareUrl = `${window.location.origin}/agent-cases/${caseId}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: caseDetail.title,
          text: caseDetail.description || '来看看这个AI创作案例',
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        // 可以在这里显示一个toast提示
      }
    } catch (err) {
      console.error('分享失败:', err);
      // 降级方案：复制到剪贴板
      try {
        await navigator.clipboard.writeText(shareUrl);
      } catch (clipboardErr) {
        console.error('复制到剪贴板失败:', clipboardErr);
      }
    }
  }, [caseId, caseDetail]);

  // 处理查看回放
  const handleViewReplay = useCallback(() => {
    // 可以展开所有消息或滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // 处理创建同款
  const handleCreateSimilar = useCallback(async () => {
    if (!caseDetail) return null;

    setIsCreatingSimilar(true);
    try {
      const result = await createSimilarCase(caseId);
      return result;
    } catch (err) {
      console.error('创建同款失败:', err);
      return null;
    } finally {
      setIsCreatingSimilar(false);
    }
  }, [caseId, caseDetail]);

  // 刷新
  const refresh = useCallback(async () => {
    await loadCaseDetail();
  }, [loadCaseDetail]);

  // 初始加载
  useEffect(() => {
    loadCaseDetail();
  }, [loadCaseDetail]);

  return {
    caseDetail,
    loading,
    error,
    currentImageIndex,
    isLiked,
    isCreatingSimilar,
    setCurrentImageIndex,
    handleLike,
    handleShare,
    handleViewReplay,
    handleCreateSimilar,
    refresh,
  };
}

export default useCaseDetail;
