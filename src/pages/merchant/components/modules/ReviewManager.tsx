/**
 * 商家工作平台 - 评论管理模块
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Search,
  Star,
  Reply,
  ThumbsUp,
  Flag,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

// 模拟评价数据
const mockReviews = [
  { id: 1, buyer: '张三', product: '津小脉文创 T 恤', rating: 5, content: '质量很好，面料舒适，非常满意！', reply: null, status: 'published', createTime: '2024-03-08 10:30:00', likes: 12 },
  { id: 2, buyer: '李四', product: '智能保温杯', rating: 4, content: '保温效果不错，外观也好看。', reply: '感谢您的评价，我们会继续努力！', status: 'published', createTime: '2024-03-08 11:15:00', likes: 8 },
  { id: 3, buyer: '王五', product: '津脉智坊定制笔记本', rating: 3, content: '一般般，纸张有点薄。', reply: null, status: 'pending_reply', createTime: '2024-03-08 09:20:00', likes: 3 },
  { id: 4, buyer: '赵六', product: '无线充电宝', rating: 5, content: '充电速度很快，推荐购买！', reply: '谢谢您的支持！', status: 'published', createTime: '2024-03-07 16:45:00', likes: 15 },
];

const ReviewManager: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');

  const filteredReviews = mockReviews.filter(review => {
    const matchesSearch = review.buyer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         review.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         review.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRating = ratingFilter === 'all' || review.rating === parseInt(ratingFilter);
    return matchesSearch && matchesRating;
  });

  const stats = {
    total: mockReviews.length,
    avgRating: (mockReviews.reduce((acc, r) => acc + r.rating, 0) / mockReviews.length).toFixed(1),
    fiveStar: mockReviews.filter(r => r.rating === 5).length,
    pendingReply: mockReviews.filter(r => r.status === 'pending_reply').length,
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-emerald-500 border-0">已回复</Badge>;
      case 'pending_reply':
        return <Badge className="bg-amber-500 border-0">待回复</Badge>;
      default:
        return <Badge className="border-0">{status}</Badge>;
    }
  };

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
        {filteredReviews.map((review, index) => (
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
                  <span className="font-medium text-[var(--text-primary)]">{review.buyer}</span>
                  {getRatingStars(review.rating)}
                  <span className="text-sm text-[var(--text-muted)]">{review.createTime}</span>
                  {getStatusBadge(review.status)}
                </div>

                {/* 商品信息 */}
                <p className="text-sm text-[var(--text-tertiary)] mb-2">购买商品：{review.product}</p>

                {/* 评价内容 */}
                <p className="text-[var(--text-secondary)] mb-3">{review.content}</p>

                {/* 商家回复 */}
                {review.reply && (
                  <div className="bg-[var(--bg-tertiary)] rounded-lg p-3 mt-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-[#5ba3d4]">商家回复</span>
                    </div>
                    <p className="text-sm text-[var(--text-muted)]">{review.reply}</p>
                  </div>
                )}

                {/* 操作栏 */}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[var(--border-primary)]">
                  <button className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                    <ThumbsUp className="w-4 h-4" />
                    <span>有用 ({review.likes})</span>
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
                {!review.reply && (
                  <Button size="sm" className="bg-[#5ba3d4] hover:bg-[#4a8ab8] text-white">
                    <Reply className="w-4 h-4 mr-1" />
                    回复
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ReviewManager;
