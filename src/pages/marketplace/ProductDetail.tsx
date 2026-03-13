/**
 * 商品详情页
 */
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProduct, useProductReviews, useAddToCart, useIsFavorite, useAddToFavorites, useRemoveFromFavorites, useCreateProductReview } from '@/hooks/useProducts';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Separator } from '@/components/ui/Separator';
import { Textarea } from '@/components/ui/Textarea';
import { Heart, ShoppingCart, Share2, Store, Star, Truck, Shield, ArrowLeft, Minus, Plus, Send } from 'lucide-react';
import { toast } from 'sonner';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [mainImageError, setMainImageError] = useState(false);
  const [thumbnailErrors, setThumbnailErrors] = useState<Record<number, boolean>>({});
  
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const { product, loading: productLoading, error } = useProduct(id || null);
  const { reviews, count: reviewCount, refetch: refetchReviews } = useProductReviews(id || null, { limit: 5 });
  const { isFavorite } = useIsFavorite(user?.id || null, id || null);
  const { addToCart } = useAddToCart();
  const { addToFavorites } = useAddToFavorites();
  const { removeFromFavorites } = useRemoveFromFavorites();
  const { createReview, loading: createReviewLoading } = useCreateProductReview();

  // 调试日志
  console.log('[ProductDetail] 商品ID:', id);
  console.log('[ProductDetail] 加载状态:', productLoading);
  console.log('[ProductDetail] 错误信息:', error);
  console.log('[ProductDetail] 商品数据:', product);

  // 只有在加载完成且没有错误时，才渲染商品内容
  const isReady = !productLoading && (product !== null || error !== null);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C02C38] mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-2">加载失败</p>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <Button onClick={() => navigate('/marketplace')} className="mt-4">
            返回商城
          </Button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">商品不存在或已下架</p>
          <Button onClick={() => navigate('/marketplace')} className="mt-4">
            返回商城
          </Button>
        </div>
      </div>
    );
  }

  // 优先使用 images 数组，如果没有则使用 cover_image
  const images = product.images?.length > 0
    ? product.images
    : (product.cover_image ? [product.cover_image] : []);
  const discount = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('请先登录');
      return;
    }
    const success = await addToCart(user.id, product.id, quantity);
    if (success) {
      toast.success('已添加到购物车');
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      toast.error('请先登录');
      return;
    }
    // 直接跳转到订单确认页
    navigate(`/marketplace/order/confirm?productId=${product.id}&quantity=${quantity}`);
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      toast.error('请先登录');
      return;
    }
    if (isFavorite) {
      await removeFromFavorites(user.id, product.id);
      toast.success('已取消收藏');
    } else {
      await addToFavorites(user.id, product.id);
      toast.success('已添加到收藏');
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast.error('请先登录');
      return;
    }
    if (!reviewContent.trim()) {
      toast.error('请输入评价内容');
      return;
    }
    
    try {
      const result = await createReview({
        product_id: product.id,
        order_id: '',
        user_id: user.id,
        rating: reviewRating,
        content: reviewContent,
        is_anonymous: isAnonymous,
        is_recommended: reviewRating >= 4,
      });
      
      if (result) {
        toast.success('评价提交成功！');
        setReviewContent('');
        setReviewRating(5);
        setIsAnonymous(false);
        refetchReviews();
      }
    } catch (err: any) {
      toast.error(err.message || '评价提交失败');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            返回
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左侧：商品图片 */}
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100">
              {images[selectedImage] && !mainImageError ? (
                <img
                  src={images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={() => setMainImageError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <span className="text-gray-400">暂无图片</span>
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 ${
                      selectedImage === index ? 'border-[#C02C38]' : 'border-transparent'
                    }`}
                  >
                    {!thumbnailErrors[index] ? (
                      <img
                        src={image}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={() => setThumbnailErrors(prev => ({ ...prev, [index]: true }))}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <span className="text-xs text-gray-400">无图</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 右侧：商品信息 */}
          <div className="space-y-6">
            {/* 品牌和标题 */}
            <div>
              {product.brand && (
                <div className="flex items-center gap-2 mb-2">
                  <Store className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{product.brand.name}</span>
                </div>
              )}
              <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
              {(product.average_rating ?? 0) > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(product.average_rating || 0)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">{product.average_rating}</span>
                  <span className="text-sm text-gray-400">({reviewCount}条评价)</span>
                </div>
              )}
            </div>

            {/* 价格 */}
            <div className="bg-red-50 rounded-xl p-4">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-[#C02C38]">
                  ¥{(product.price ?? 0).toLocaleString()}
                </span>
                {product.original_price && (
                  <span className="text-lg text-gray-400 line-through">
                    ¥{(product.original_price ?? 0).toLocaleString()}
                  </span>
                )}
                {discount > 0 && (
                  <Badge className="bg-[#C02C38]">-{discount}%</Badge>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-2">{(product.sold_count ?? 0)}人已付款</p>
            </div>

            {/* 规格选择 */}
            {product.specifications && product.specifications.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-3">商品规格</h3>
                <div className="space-y-3">
                  {product.specifications.map((spec, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-gray-600">{spec.name}:</span>
                      <span className="font-medium">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 数量选择 */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">数量</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                  type="button"
                >
                  <Minus className="w-4 h-4 text-gray-600" />
                </button>
                <span className="w-12 h-10 flex items-center justify-center font-medium text-gray-900 border border-gray-200 rounded-lg">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                  type="button"
                >
                  <Plus className="w-4 h-4 text-gray-600" />
                </button>
                <span className="text-sm text-gray-500 ml-2">库存 {(product.stock ?? 0)} 件</span>
              </div>
            </div>

            {/* 服务承诺 */}
            <div className="flex gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Truck className="w-4 h-4 text-green-500" />
                <span>包邮</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="w-4 h-4 text-blue-500" />
                <span>正品保证</span>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-12 text-base"
                onClick={handleToggleFavorite}
              >
                <Heart className={`w-5 h-5 mr-2 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                {isFavorite ? '已收藏' : '收藏'}
              </Button>
              <Button
                variant="outline"
                className="h-12 text-base"
                onClick={() => toast.info('分享功能开发中')}
              >
                <Share2 className="w-5 h-5 mr-2" />
                分享
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button
                className="h-12 text-base bg-[#C02C38] hover:bg-[#991b1b]"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                加入购物车
              </Button>
              <Button
                className="h-12 text-base bg-[#D4AF37] hover:bg-[#B8962F] text-gray-900"
                onClick={handleBuyNow}
              >
                立即购买
              </Button>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* 商品详情标签页 */}
        <Tabs defaultValue="detail" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="detail">商品详情</TabsTrigger>
            <TabsTrigger value="reviews">评价({reviewCount})</TabsTrigger>
            <TabsTrigger value="authorization">授权信息</TabsTrigger>
          </TabsList>
          
          <TabsContent value="detail" className="mt-6">
            <div className="bg-white rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-4">商品介绍</h3>
              <div className="prose max-w-none">
                {product.description ? (
                  <div dangerouslySetInnerHTML={{ __html: product.description }} />
                ) : (
                  <p className="text-gray-500">暂无商品介绍</p>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <div className="bg-white rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-4">商品评价</h3>
              
              {user ? (
                <div className="border border-gray-200 rounded-lg p-4 mb-6">
                  <h4 className="font-medium mb-3">发表评价</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">评分</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            type="button"
                            onClick={() => setReviewRating(rating)}
                            className="focus:outline-none"
                          >
                            <Star
                              className={`w-6 h-6 cursor-pointer ${
                                rating <= reviewRating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">评价内容</label>
                      <Textarea
                        value={reviewContent}
                        onChange={(e: any) => setReviewContent(e.target.value)}
                        placeholder="分享您的购物体验..."
                        rows={4}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isAnonymous}
                          onChange={(e) => setIsAnonymous(e.target.checked)}
                          className="rounded border-gray-300 text-[#C02C38] focus:ring-[#C02C38]"
                        />
                        <span className="text-sm text-gray-600">匿名评价</span>
                      </label>
                      
                      <Button
                        onClick={handleSubmitReview}
                        disabled={createReviewLoading || !reviewContent.trim()}
                        className="bg-[#C02C38] hover:bg-[#991b1b]"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {createReviewLoading ? '提交中...' : '提交评价'}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-center">
                  <p className="text-gray-600 mb-2">登录后才能发表评价</p>
                  <Button
                    onClick={() => navigate('/login')}
                    className="bg-[#C02C38] hover:bg-[#991b1b]"
                  >
                    立即登录
                  </Button>
                </div>
              )}
              
              {reviews.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无评价</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b pb-4 last:border-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.created_at).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                      <p className="text-gray-700">{review.content}</p>
                      {review.images && review.images.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {review.images.map((image, index) => (
                            <img
                              key={index}
                              src={image}
                              alt=""
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="authorization" className="mt-6">
            <div className="bg-white rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-4">授权信息</h3>
              {product.ip_asset_id ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">授权状态:</span>
                    <Badge className="bg-green-500">已获授权</Badge>
                  </div>
                  <p className="text-gray-600">
                    此商品已获得品牌方正版授权，请放心购买。
                  </p>
                </div>
              ) : (
                <p className="text-gray-500">此商品为品牌方直营产品</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProductDetailPage;
