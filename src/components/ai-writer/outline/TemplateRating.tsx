import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  X,
  ThumbsUp,
  MessageSquare,
  TrendingUp,
  Users,
  Clock,
  Award,
  BarChart3,
  Filter,
  ChevronDown,
  ChevronUp,
  Flag,
  CheckCircle2,
  Share2,
  Bookmark,
  MoreHorizontal,
  Search,
  SortAsc,
  Heart,
  Eye
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  timestamp: number;
  likes: number;
  isLiked?: boolean;
  tags: string[];
}

interface RatingStats {
  average: number;
  total: number;
  distribution: { [key: number]: number };
  wouldRecommend: number;
}

interface TemplateRatingData {
  templateId: string;
  templateName: string;
  category: string;
  stats: RatingStats;
  reviews: Review[];
  userRating?: number;
  isBookmarked?: boolean;
}

interface TemplateRatingProps {
  templateData: TemplateRatingData;
  onSubmitReview: (rating: number, comment: string, tags: string[]) => void;
  onLikeReview: (reviewId: string) => void;
  onBookmark: () => void;
  onClose: () => void;
}

const ratingLabels: { [key: number]: string } = {
  1: '非常不满意',
  2: '不满意',
  3: '一般',
  4: '满意',
  5: '非常满意'
};

const reviewTags = [
  '结构清晰', '内容详实', '易于使用', '节省时间', '专业性强',
  '创意十足', '实用性强', '推荐购买', '性价比高', '更新及时'
];

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
  
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
};

const StarRating: React.FC<{
  rating: number;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRate?: (rating: number) => void;
  showLabel?: boolean;
}> = ({ rating, maxStars = 5, size = 'md', interactive = false, onRate, showLabel = false }) => {
  const [hoverRating, setHoverRating] = useState(0);
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-8 h-8'
  };
  
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxStars }, (_, i) => {
          const starValue = i + 1;
          const isFilled = interactive 
            ? starValue <= (hoverRating || rating)
            : starValue <= rating;
          
          return (
            <button
              key={i}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onRate?.(starValue)}
              onMouseEnter={() => interactive && setHoverRating(starValue)}
              onMouseLeave={() => interactive && setHoverRating(0)}
              className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
            >
              <Star
                className={`${sizeClasses[size]} transition-colors ${
                  isFilled
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700'
                }`}
              />
            </button>
          );
        })}
      </div>
      {showLabel && rating > 0 && (
        <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          {ratingLabels[Math.round(rating)]}
        </span>
      )}
    </div>
  );
};

export const TemplateRating: React.FC<TemplateRatingProps> = ({
  templateData,
  onSubmitReview,
  onLikeReview,
  onBookmark,
  onClose
}) => {
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'lowest' | 'helpful'>('newest');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());
  
  const { stats, reviews } = templateData;
  
  const sortedAndFilteredReviews = useMemo(() => {
    let result = [...reviews];
    
    if (filterRating) {
      result = result.filter(r => r.rating === filterRating);
    }
    
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => b.timestamp - a.timestamp);
        break;
      case 'highest':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'lowest':
        result.sort((a, b) => a.rating - b.rating);
        break;
      case 'helpful':
        result.sort((a, b) => b.likes - a.likes);
        break;
    }
    
    return result;
  }, [reviews, sortBy, filterRating]);
  
  const handleSubmitReview = () => {
    if (userRating > 0) {
      onSubmitReview(userRating, userComment, selectedTags);
      setUserRating(0);
      setUserComment('');
      setSelectedTags([]);
      setShowReviewForm(false);
    }
  };
  
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };
  
  const toggleReviewExpanded = (reviewId: string) => {
    setExpandedReviews(prev => {
      const next = new Set(prev);
      if (next.has(reviewId)) {
        next.delete(reviewId);
      } else {
        next.add(reviewId);
      }
      return next;
    });
  };
  
  const getRatingPercentage = (stars: number): number => {
    return stats.total > 0 ? (stats.distribution[stars] / stats.total) * 100 : 0;
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Star className="w-6 h-6 text-white fill-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {templateData.templateName}
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Badge variant="secondary">{templateData.category}</Badge>
                <span>•</span>
                <span>{stats.total} 条评价</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={onBookmark}
                    className={templateData.isBookmarked ? 'text-amber-500' : ''}
                  >
                    <Bookmark className={`w-5 h-5 ${templateData.isBookmarked ? 'fill-current' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{templateData.isBookmarked ? '取消收藏' : '收藏模板'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left Panel - Stats */}
          <div className="w-80 border-r border-gray-200 dark:border-gray-700 p-6 space-y-6 overflow-y-auto">
            {/* Overall Rating */}
            <div className="text-center">
              <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
                {stats.average.toFixed(1)}
              </div>
              <StarRating rating={stats.average} size="md" />
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                基于 {stats.total} 条评价
              </div>
            </div>
            
            {/* Rating Distribution */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map(stars => (
                <button
                  key={stars}
                  onClick={() => setFilterRating(filterRating === stars ? null : stars)}
                  className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                    filterRating === stars 
                      ? 'bg-amber-50 dark:bg-amber-900/20' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <span className="text-sm font-medium w-8">{stars}星</span>
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${getRatingPercentage(stars)}%` }}
                      className="h-full bg-amber-400 rounded-full"
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-10 text-right">
                    {stats.distribution[stars] || 0}
                  </span>
                </button>
              ))}
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl text-center">
                <ThumbsUp className="w-5 h-5 mx-auto mb-1 text-green-500" />
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {Math.round(stats.wouldRecommend)}%
                </div>
                <div className="text-xs text-gray-500">推荐率</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl text-center">
                <Users className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {stats.total}
                </div>
                <div className="text-xs text-gray-500">评价数</div>
              </div>
            </div>
            
            {/* Write Review Button */}
            <Button
              onClick={() => setShowReviewForm(true)}
              className="w-full gap-2"
              size="lg"
            >
              <MessageSquare className="w-4 h-4" />
              写评价
            </Button>
          </div>
          
          {/* Right Panel - Reviews */}
          <div className="flex-1 flex flex-col">
            {/* Filters */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  排序:
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <SortAsc className="w-4 h-4" />
                      {sortBy === 'newest' && '最新'}
                      {sortBy === 'highest' && '评分高'}
                      {sortBy === 'lowest' && '评分低'}
                      {sortBy === 'helpful' && '最有帮助'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => setSortBy('newest')}>
                      <Clock className="w-4 h-4 mr-2" />
                      最新发布
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('highest')}>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      评分最高
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('lowest')}>
                      <TrendingUp className="w-4 h-4 mr-2 rotate-180" />
                      评分最低
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('helpful')}>
                      <ThumbsUp className="w-4 h-4 mr-2" />
                      最有帮助
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                {filterRating && (
                  <Badge 
                    variant="secondary"
                    className="cursor-pointer hover:bg-gray-200"
                    onClick={() => setFilterRating(null)}
                  >
                    {filterRating} 星评价 ✕
                  </Badge>
                )}
              </div>
              
              <div className="text-sm text-gray-500 dark:text-gray-400">
                共 {sortedAndFilteredReviews.length} 条评价
              </div>
            </div>
            
            {/* Reviews List */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {sortedAndFilteredReviews.map((review) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4"
                  >
                    {/* Review Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={review.userAvatar} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                            {review.userName.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {review.userName}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTime(review.timestamp)}
                          </div>
                        </div>
                      </div>
                      <StarRating rating={review.rating} size="sm" />
                    </div>
                    
                    {/* Review Content */}
                    <div className="mb-3">
                      <p className={`text-gray-700 dark:text-gray-300 text-sm leading-relaxed ${
                        !expandedReviews.has(review.id) && review.comment.length > 200 
                          ? 'line-clamp-3' 
                          : ''
                      }`}>
                        {review.comment}
                      </p>
                      {review.comment.length > 200 && (
                        <button
                          onClick={() => toggleReviewExpanded(review.id)}
                          className="text-sm text-blue-600 hover:text-blue-700 mt-1"
                        >
                          {expandedReviews.has(review.id) ? '收起' : '展开'}
                        </button>
                      )}
                    </div>
                    
                    {/* Review Tags */}
                    {review.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {review.tags.map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {/* Review Actions */}
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => onLikeReview(review.id)}
                        className={`flex items-center gap-1 text-sm transition-colors ${
                          review.isLiked 
                            ? 'text-blue-600' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <ThumbsUp className={`w-4 h-4 ${review.isLiked ? 'fill-current' : ''}`} />
                        <span>有帮助 ({review.likes})</span>
                      </button>
                      <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                        <Flag className="w-4 h-4" />
                        <span>举报</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
                
                {sortedAndFilteredReviews.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
                      暂无评价
                    </p>
                    <p className="text-sm mt-1">成为第一个评价这个模板的用户吧！</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </motion.div>
      
      {/* Review Form Dialog */}
      <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>撰写评价</DialogTitle>
            <DialogDescription>
              分享您使用 {templateData.templateName} 的体验
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Rating Input */}
            <div className="text-center">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">您的评分</div>
              <StarRating
                rating={userRating}
                size="lg"
                interactive
                onRate={setUserRating}
                showLabel
              />
            </div>
            
            {/* Tags */}
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">标签（可选）</div>
              <div className="flex flex-wrap gap-2">
                {reviewTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Comment */}
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">评价内容</div>
              <Textarea
                value={userComment}
                onChange={(e) => setUserComment(e.target.value)}
                placeholder="分享您的使用体验，帮助其他用户做出选择..."
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowReviewForm(false)}>
              取消
            </Button>
            <Button 
              onClick={handleSubmitReview}
              disabled={userRating === 0}
              className="gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              提交评价
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default TemplateRating;
