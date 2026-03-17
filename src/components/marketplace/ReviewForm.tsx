/**
 * 商品评价组件 - 支持星级评分、图片上传、评价回复
 */
import React, { useState, useCallback } from 'react';
import { Star, Upload, X, Heart, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface ReviewFormProps {
  productId: string;
  orderId: string;
  orderItemId: string;
  productName: string;
  productImage?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  productId,
  orderId,
  orderItemId,
  productName,
  productImage,
  onSuccess,
  onCancel
}) => {
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 处理图片上传
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImages(prev => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  }, []);

  // 移除图片
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // 提交评价
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.warning('请输入评价内容');
      return;
    }

    setSubmitting(true);
    try {
      const reviewService = (await import('@/services/reviewService')).default;
      const result = await reviewService.createReview(
        'user-id', // TODO: 从 auth 获取
        {
          order_id: orderId,
          order_item_id: orderItemId,
          product_id: productId,
          rating,
          content,
          images: images.length > 0 ? images : undefined,
          is_anonymous: isAnonymous
        }
      );

      if (result.success) {
        toast.success('评价成功，获得 10 积分奖励！');
        onSuccess?.();
      } else {
        toast.error(result.error || '评价失败');
      }
    } catch (err: any) {
      console.error('[ReviewForm] 提交评价失败:', err);
      toast.error('评价失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm p-6"
    >
      <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6">
        评价商品
      </h3>

      <form onSubmit={handleSubmit}>
        {/* 商品信息 */}
        <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          {productImage && (
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
              <img
                src={productImage}
                alt={productName}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1">
            <h4 className="font-medium text-[var(--text-primary)]">{productName}</h4>
          </div>
        </div>

        {/* 星级评分 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            星级评分
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= (hoveredRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'fill-gray-200 text-gray-200'
                  }`}
                />
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-500">
              {rating === 1 && '非常不满意'}
              {rating === 2 && '不满意'}
              {rating === 3 && '一般'}
              {rating === 4 && '满意'}
              {rating === 5 && '非常满意'}
            </span>
          </div>
        </div>

        {/* 评价内容 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            评价内容
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="分享您的使用感受，帮助其他用户做出更好的选择..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--haihe-500)] min-h-[120px]"
            required
          />
          <div className="text-right text-sm text-gray-500 mt-1">
            {content.length}/500
          </div>
        </div>

        {/* 图片上传 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            晒单图片（选填）
          </label>
          <div className="flex flex-wrap gap-3">
            {images.map((img, index) => (
              <div key={index} className="relative group">
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
                  <img src={img} alt={`Upload ${index}`} className="w-full h-full object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {images.length < 9 && (
              <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[var(--haihe-500)] transition-colors">
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="text-xs text-gray-500 mt-1">上传图片</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
          <div className="text-sm text-gray-500 mt-2">
            最多可上传 9 张图片
          </div>
        </div>

        {/* 匿名评价 */}
        <div className="mb-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-4 h-4 text-[var(--haihe-500)] rounded focus:ring-[var(--haihe-500)]"
            />
            <span className="text-sm text-gray-600">匿名评价</span>
          </label>
        </div>

        {/* 提交按钮 */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={submitting}
            className={`px-8 py-3 bg-gradient-to-r from-[var(--haihe-500)] to-[var(--haihe-600)] text-white rounded-lg font-medium hover:shadow-lg transition-all ${
              submitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {submitting ? '提交中...' : '提交评价'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
            >
              取消
            </button>
          )}
        </div>
      </form>
    </motion.div>
  );
};

export default ReviewForm;
