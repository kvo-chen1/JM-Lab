/**
 * 商家工作平台 - 评论管理模块
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Search,
  Star,
  Reply,
  ThumbsUp,
  Flag,
  Eye,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { merchantService, Review } from '@/services/merchantService';
import { toast } from 'sonner';

const ReviewManager: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [merchantId, setMerchantId] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const merchant = await merchantService.getCurrentMerchant();
        if (merchant) {
          setMerchantId(merchant.id);
          const merchantReviews = await merchantService.getReviews(merchant.id);
          setReviews(merchantReviews);
        }
      } catch (error) {
        console.error('获取评价数据失败:', error);
        toast.error('获取评价数据失败');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         review.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         review.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRating = ratingFilter === 'all' || review.rating === parseInt(ratingFilter);
    return matchesSearch && matchesRating;
  });

  const stats = {
    total: reviews.length,
    avgRating: reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : '0.0',
    fiveStar: reviews.filter(r => r.rating === 5).length,
    pendingReply: reviews.filter(r => !r.merchant_reply).length,
  };

  const getRatingStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-amber-400 fill-amber-400' : 'text-[var(--border-secondary)]'
            }`}
          />
        ))}
      </div>
    );
  };

  const getStatusBadge = (review: Review) => {
    if (review.merchant_reply) {
      return <Badge className="bg-emerald-500 border-0">已回复</Badge>;
    }
    return <Badge className="bg-amber-500 border-0">待回复</Badge>;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#5ba3d4]" />
        <span className="ml-2 text-[var(--text-muted)]">加载中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">评论管理</h2>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">查看和回复用户评价</p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-primary)]">
          <p className="text-sm text-[var(--text-muted)]">评价总数</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.total}</p>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-primary)]">
          <p className="text-sm text-[var(--text-muted)]">平均评分</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-amber-400">{stats.avgRating}</p>
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
          </div>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-primary)]">
          <p className="text-sm text-[var(--text-muted)]">五星好评</p>
          <p className="text-2xl font-bold text-emerald-400">{stats.fiveStar}</p>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-primary)]">
          <p className="text-sm text-[var(--text-muted)]">待回复</p>
          <p className="text-2xl font-bold text-amber-400">{stats.pendingReply}</p>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-primary)]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <Input
                placeholder="搜索买家、商品或评价内容..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[var(--bg-tertiary)] border-[var(--border-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
            </div>
          </div>
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="border border-[var(--border-primary)] rounded-lg px-3 py-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-sm"
          >
            <option value="all">全部评分</option>
            <option value="5">5星</option>
            <option value="4">4星</option>
            <option value="3">3星</option>
            <option value="2">2星</option>
            <option value="1">1星</option>
          </select>
        </div>
      </div>

      {/* 评价列表 */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="text-center py-8 text-[var(--text-muted)]">
            暂无评价数据
          </div>
        ) : (
          filteredReviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* 头部信息 */}
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-medium text-[var(--text-primary)]">{review.customer_name}</span>
                    {getRatingStars(review.rating)}
                    <span className="text-sm text-[var(--text-muted)]">{formatDate(review.created_at)}</span>
                    {getStatusBadge(review)}
                  </div>

                  {/* 商品信息 */}
                  <p className="text-sm text-[var(--text-tertiary)] mb-2">购买商品：{review.product_name}</p>

                  {/* 评价内容 */}
                  <p className="text-[var(--text-secondary)] mb-3">{review.content}</p>

                  {/* 评价图片 */}
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 mb-3">
                      {review.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`评价图片 ${idx + 1}`}
                          className="w-16 h-16 object-cover rounded-lg border border-[var(--border-primary)]"
                        />
                      ))}
                    </div>
                  )}

                  {/* 商家回复 */}
                  {review.merchant_reply && (
                    <div className="bg-[var(--bg-tertiary)] rounded-lg p-3 mt-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-[#5ba3d4]">商家回复</span>
                        {review.reply_at && (
                          <span className="text-xs text-[var(--text-muted)]">{formatDate(review.reply_at)}</span>
                        )}
                      </div>
                      <p className="text-sm text-[var(--text-muted)]">{review.merchant_reply}</p>
                    </div>
                  )}

                  {/* 操作栏 */}
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[var(--border-primary)]">
                    <button className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                      <ThumbsUp className="w-4 h-4" />
                      <span>有用</span>
                    </button>
                    <button className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                      <Flag className="w-4 h-4" />
                      <span>举报</span>
                    </button>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center gap-2 ml-4">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                    <Eye className="w-4 h-4" />
                  </Button>
                  {!review.merchant_reply && (
                    <Button size="sm" className="bg-[#5ba3d4] hover:bg-[#4a8ab8] text-white">
                      <Reply className="w-4 h-4 mr-1" />
                      回复
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewManager;
