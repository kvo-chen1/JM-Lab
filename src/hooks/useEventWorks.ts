import { useState, useEffect, useCallback, useRef } from 'react';
import { eventWorkService, SubmissionWithStats, SubmissionFilters } from '@/services/eventWorkService';
import { UserInteraction } from '@/types';
import { toast } from 'sonner';

interface UseEventWorksOptions {
  eventId: string;
  userId?: string;
  initialFilters?: SubmissionFilters;
  pageSize?: number;
}

interface UseEventWorksReturn {
  // 数据
  submissions: SubmissionWithStats[];
  selectedSubmission: SubmissionWithStats | null;
  userInteractions: Map<string, UserInteraction>;
  totalCount: number;
  
  // 状态
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  
  // 筛选和分页
  filters: SubmissionFilters;
  currentPage: number;
  
  // 操作
  setFilters: (filters: SubmissionFilters) => void;
  selectSubmission: (submission: SubmissionWithStats | null) => void;
  loadMore: () => void;
  refresh: () => void;
  
  // 互动操作
  handleVote: (submissionId: string) => Promise<void>;
  handleLike: (submissionId: string) => Promise<void>;
  handleRate: (submissionId: string, rating: number, comment?: string) => Promise<void>;
  
  // 辅助
  getUserInteraction: (submissionId: string) => UserInteraction | undefined;
}

export function useEventWorks(options: UseEventWorksOptions): UseEventWorksReturn {
  const { eventId, userId, initialFilters = {}, pageSize = 20 } = options;
  
  // 数据状态
  const [submissions, setSubmissions] = useState<SubmissionWithStats[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithStats | null>(null);
  const [userInteractions, setUserInteractions] = useState<Map<string, UserInteraction>>(new Map());
  const [totalCount, setTotalCount] = useState(0);
  
  // 加载状态
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 分页和筛选
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFiltersState] = useState<SubmissionFilters>({
    mediaType: 'all',
    sortBy: 'newest',
    status: 'submitted',
    ...initialFilters,
  });
  
  // 用于防止重复请求的 ref
  const isLoadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // 计算是否还有更多数据
  const hasMore = submissions.length < totalCount;
  
  // 获取作品列表
  const fetchSubmissions = useCallback(async (page: number, isLoadMore: boolean = false) => {
    if (isLoadingRef.current) return;
    
    isLoadingRef.current = true;
    if (isLoadMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    
    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    try {
      const { submissions: newSubmissions, total } = await eventWorkService.getEventSubmissions(
        eventId,
        filters,
        page,
        pageSize
      );
      
      if (isLoadMore) {
        setSubmissions(prev => [...prev, ...newSubmissions]);
      } else {
        setSubmissions(newSubmissions);
        // 默认选中第一个作品
        if (newSubmissions.length > 0 && !selectedSubmission) {
          setSelectedSubmission(newSubmissions[0]);
        }
      }
      setTotalCount(total);
      
      // 获取用户交互状态
      if (userId && newSubmissions.length > 0) {
        const submissionIds = newSubmissions.map(s => s.id);
        const interactions = await eventWorkService.getUserInteractions(userId, submissionIds);
        
        setUserInteractions(prev => {
          const newMap = new Map(prev);
          interactions.forEach((value, key) => {
            newMap.set(key, value);
          });
          return newMap;
        });
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || '加载作品失败');
        toast.error('加载作品失败: ' + (err.message || '未知错误'));
      }
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [eventId, filters, pageSize, userId, selectedSubmission]);
  
  // 初始加载和筛选变化时重新加载
  useEffect(() => {
    setCurrentPage(1);
    fetchSubmissions(1, false);
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [eventId, filters]);
  
  // 加载更多
  const loadMore = useCallback(() => {
    if (!isLoadingRef.current && hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchSubmissions(nextPage, true);
    }
  }, [currentPage, hasMore, fetchSubmissions]);
  
  // 刷新数据
  const refresh = useCallback(() => {
    setCurrentPage(1);
    fetchSubmissions(1, false);
  }, [fetchSubmissions]);
  
  // 更新筛选条件
  const setFilters = useCallback((newFilters: SubmissionFilters) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
    setSubmissions([]);
    setSelectedSubmission(null);
  }, []);
  
  // 选择作品
  const selectSubmission = useCallback((submission: SubmissionWithStats | null) => {
    setSelectedSubmission(submission);
  }, []);
  
  // 获取用户对特定作品的交互状态
  const getUserInteraction = useCallback((submissionId: string): UserInteraction | undefined => {
    return userInteractions.get(submissionId);
  }, [userInteractions]);
  
  // 处理投票
  const handleVote = useCallback(async (submissionId: string) => {
    if (!userId) {
      toast.error('请先登录后再投票');
      return;
    }
    
    try {
      const result = await eventWorkService.submitVote(submissionId, userId);
      
      // 更新本地状态
      setUserInteractions(prev => {
        const newMap = new Map(prev);
        const current = newMap.get(submissionId) || { hasVoted: false, hasLiked: false };
        newMap.set(submissionId, {
          ...current,
          hasVoted: result.action === 'added',
        });
        return newMap;
      });
      
      // 更新作品投票数
      setSubmissions(prev =>
        prev.map(sub => {
          if (sub.id === submissionId) {
            return {
              ...sub,
              voteCount: result.action === 'added' ? sub.voteCount + 1 : Math.max(0, sub.voteCount - 1),
            };
          }
          return sub;
        })
      );
      
      // 更新选中的作品
      if (selectedSubmission?.id === submissionId) {
        setSelectedSubmission(prev =>
          prev
            ? {
                ...prev,
                voteCount: result.action === 'added' ? prev.voteCount + 1 : Math.max(0, prev.voteCount - 1),
              }
            : null
        );
      }
      
      toast.success(result.message);
    } catch (err: any) {
      toast.error('投票失败: ' + (err.message || '未知错误'));
    }
  }, [userId, selectedSubmission]);
  
  // 处理点赞
  const handleLike = useCallback(async (submissionId: string) => {
    if (!userId) {
      toast.error('请先登录后再点赞');
      return;
    }
    
    try {
      const result = await eventWorkService.submitLike(submissionId, userId);
      
      // 更新本地状态
      setUserInteractions(prev => {
        const newMap = new Map(prev);
        const current = newMap.get(submissionId) || { hasVoted: false, hasLiked: false };
        newMap.set(submissionId, {
          ...current,
          hasLiked: result.action === 'added',
        });
        return newMap;
      });
      
      // 更新作品点赞数
      setSubmissions(prev =>
        prev.map(sub => {
          if (sub.id === submissionId) {
            return {
              ...sub,
              likeCount: result.action === 'added' ? sub.likeCount + 1 : Math.max(0, sub.likeCount - 1),
            };
          }
          return sub;
        })
      );
      
      // 更新选中的作品
      if (selectedSubmission?.id === submissionId) {
        setSelectedSubmission(prev =>
          prev
            ? {
                ...prev,
                likeCount: result.action === 'added' ? prev.likeCount + 1 : Math.max(0, prev.likeCount - 1),
              }
            : null
        );
      }
      
      toast.success(result.message);
    } catch (err: any) {
      toast.error('点赞失败: ' + (err.message || '未知错误'));
    }
  }, [userId, selectedSubmission]);
  
  // 处理评分
  const handleRate = useCallback(async (submissionId: string, rating: number, comment?: string) => {
    if (!userId) {
      toast.error('请先登录后再评分');
      return;
    }
    
    try {
      const result = await eventWorkService.submitRating(submissionId, userId, rating, comment);
      
      // 重新获取该作品的最新评分统计
      const updatedSubmission = await eventWorkService.getSubmissionDetail(submissionId);
      
      if (updatedSubmission) {
        // 更新本地状态
        setUserInteractions(prev => {
          const newMap = new Map(prev);
          const current = newMap.get(submissionId) || { hasVoted: false, hasLiked: false };
          newMap.set(submissionId, {
            ...current,
            userRating: rating,
          });
          return newMap;
        });
        
        // 更新作品列表
        setSubmissions(prev =>
          prev.map(sub => {
            if (sub.id === submissionId) {
              return {
                ...sub,
                avgRating: updatedSubmission.avgRating,
                ratingCount: updatedSubmission.ratingCount,
              };
            }
            return sub;
          })
        );
        
        // 更新选中的作品
        if (selectedSubmission?.id === submissionId) {
          setSelectedSubmission(prev =>
            prev
              ? {
                  ...prev,
                  avgRating: updatedSubmission.avgRating,
                  ratingCount: updatedSubmission.ratingCount,
                }
              : null
          );
        }
      }
      
      toast.success(result.message);
    } catch (err: any) {
      toast.error('评分失败: ' + (err.message || '未知错误'));
    }
  }, [userId, selectedSubmission]);
  
  return {
    submissions,
    selectedSubmission,
    userInteractions,
    totalCount,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    filters,
    currentPage,
    setFilters,
    selectSubmission,
    loadMore,
    refresh,
    handleVote,
    handleLike,
    handleRate,
    getUserInteraction,
  };
}

export default useEventWorks;
