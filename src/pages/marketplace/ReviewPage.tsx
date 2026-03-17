/**
 * 商品评价页面 - 支持星级评分、图片上传、评价回复
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import reviewService from '@/services/reviewService';
import orderService from '@/services/orderService';
import { Star, Upload, X, ArrowLeft, Package } from 'lucide-react';
import { toast } from 'sonner';

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  price: number;
  quantity: number;
  reviewed?: boolean;
}

const ReviewPage: React.FC = () => {
  const { orderId, itemId } = useParams<{ orderId: string; itemId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);

  // 获取订单详情
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId || !user) return;

      try {
        const result = await orderService.getOrderById(orderId);
        if (result.error || !result.data) {
          toast.error('订单不存在');
          navigate('/marketplace/orders');
          return;
        }

        const items = result.data.items || [];
        setOrderItems(items);

        // 如果指定了 itemId，选择对应商品；否则选择第一个未评价的商品
        if (itemId) {
          const item = items.find(i => i.id === itemId);
          if (item) {
            setSelectedItem(item);
          }
        } else {
          // 选择第一个未评价的商品
          const firstUnreviewedItem = items[0];
          if (firstUnreviewedItem) {
            setSelectedItem(firstUnreviewedItem);
          }
        }
      } catch (err: any) {
        console.error('[ReviewPage] 获取订单详情失败:', err);
        toast.error('获取订单信息失败');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, itemId, user, navigate]);

  // 处理图片上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  // 移除图片
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // 选择商品
  const handleSelectItem = (item: OrderItem) => {
    setSelectedItem(item);
    setContent('');
    setImages([]);
    setRating(5);
  };

  // 提交评价
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('请先登录');
      navigate('/login');
      return;
    }

    if (!selectedItem) {
      toast.error('请选择要评价的商品');
      return;
    }

    if (!content.trim()) {
      toast.warning('请输入评价内容');
      return;
    }

    setSubmitting(true);
    try {
      const result = await reviewService.createReview(
        user.id,
        {
          order_id: orderId!,
          order_item_id: selectedItem.id,
          product_id: selectedItem.product_id,
          rating,
          content,
          images: images.length > 0 ? images : undefined,
          is_anonymous: isAnonymous
        }
      );

      if (result.success) {
        toast.success('评价成功，获得 10 积分奖励！');
        // 如果还有未评价的商品，留在当前页面；否则跳转到订单列表
        const remainingItems = orderItems.filter(item => item.id !== selectedItem.id);
        if (remainingItems.length > 0) {
          // 选择下一个未评价的商品
          const nextItem = remainingItems[0];
          setSelectedItem(nextItem);
          setContent('');
          setImages([]);
          setRating(5);
        } else {
          navigate('/marketplace/orders');
        }
      } else {
        toast.error(result.error || '评价失败');
      }
    } catch (err: any) {
      console.error('[ReviewPage] 提交评价失败:', err);
      toast.error('评价失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-secondary)] py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-16">
            <div className="w-12 h-12 border-4 border-[var(--haihe-500)] border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 返回按钮 */}
        <button
          onClick={() => navigate('/marketplace/orders')}
          className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回订单列表</span>
        </button>

        {/* 商品选择 */}
        {orderItems.length > 1 && (
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">
              选择要评价的商品
            </h3>
            <div className="flex flex-wrap gap-3">
              {orderItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                    selectedItem?.id === item.id
                      ? 'border-[var(--haihe-500)] bg-[var(--haihe-50)]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {item.product_image ? (
                    <div className="w-10 h-10 rounded overflow-hidden bg-gray-100">
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <Package className="w-10 h-10 text-gray-400" />
                  )}
                  <span className="text-sm text-[var(--text-primary)] truncate max-w-[150px]">
                    {item.product_name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 评价表单 */}
        {selectedItem && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6">
              评价商品
            </h3>

            <form onSubmit={handleSubmit}>
              {/* 商品信息 */}
              <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                {selectedItem.product_image ? (
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={selectedItem.product_image}
                      alt={selectedItem.product_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-medium text-[var(--text-primary)]">{selectedItem.product_name}</h4>
                  <div className="text-sm text-gray-500">
                    ¥{selectedItem.price.toFixed(2)} × {selectedItem.quantity}
                  </div>
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
                <button
                  type="button"
                  onClick={() => navigate('/marketplace/orders')}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewPage;
