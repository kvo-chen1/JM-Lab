/**
 * 购物车优化服务 - 提供购物车持久化、同步、批量操作、优惠券和库存校验功能
 */
import { supabase } from '@/lib/supabase';
import { Product, CartItem, ProductSpecification } from './productService';

// 购物车项扩展接口
export interface EnhancedCartItem extends CartItem {
  product?: Product;
  is_valid?: boolean; // 商品是否有效
  stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock'; // 库存状态
  error_message?: string; // 错误信息
}

// 优惠券接口
export interface Coupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed' | 'points';
  discount_value: number;
  min_purchase_amount: number;
  max_discount_amount?: number;
  valid_from: string;
  valid_until: string;
  usage_limit?: number;
  usage_count: number;
  applicable_categories?: string[];
  applicable_products?: string[];
  is_active: boolean;
}

// 购物车统计接口
export interface CartStats {
  totalItems: number;
  selectedItems: number;
  totalPrice: number;
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
  pointsEarned: number;
}

// 优惠券验证结果
export interface CouponValidationResult {
  isValid: boolean;
  discount: number;
  error?: string;
}

// 库存校验结果
export interface StockCheckResult {
  productId: string;
  isAvailable: boolean;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  availableStock: number;
  requestedQuantity: number;
  errorMessage?: string;
}

// 购物车服务类
class CartService {
  private readonly CART_VERSION_KEY = 'cart_version';
  private readonly CART_SYNC_INTERVAL = 30000; // 30 秒同步间隔
  private syncTimers: Map<string, NodeJS.Timeout> = new Map();
  private isInitialized = false;

  constructor() {
    // 延迟初始化，确保在浏览器环境
    if (typeof window !== 'undefined') {
      setTimeout(() => this.initializeCartSync(), 0);
    }
  }

  /**
   * 初始化购物车同步机制
   */
  private initializeCartSync() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // 监听 storage 事件，实现跨标签页同步
    window.addEventListener('storage', (event) => {
      if (event.key === this.CART_VERSION_KEY) {
        this.emitCartUpdateEvent();
      }
    });

    // 监听页面可见性变化
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.emitCartUpdateEvent();
      }
    });
  }

  /**
   * 触发自定义事件，通知其他组件购物车已更新
   */
  private emitCartUpdateEvent() {
    const event = new CustomEvent('cart-updated');
    window.dispatchEvent(event);
  }

  /**
   * 更新购物车版本号，触发同步
   */
  private updateCartVersion(userId: string) {
    const version = Date.now().toString();
    localStorage.setItem(this.CART_VERSION_KEY, version);
    localStorage.setItem(`cart_version_${userId}`, version);
  }

  /**
   * 获取购物车商品
   */
  async getCart(userId: string): Promise<EnhancedCartItem[]> {
    try {
      // 首先获取购物车数据
      const { data: cartItems, error: cartError } = await supabase
        .from('shopping_carts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (cartError) throw cartError;

      if (!cartItems || cartItems.length === 0) {
        return [];
      }

      // 获取所有商品 ID
      const productIds = cartItems.map(item => item.product_id).filter(Boolean);

      // 批量获取商品信息
      const productsMap = new Map();
      if (productIds.length > 0) {
        const { data: products } = await supabase
          .from('products')
          .select('*')
          .in('id', productIds);

        if (products) {
          products.forEach(product => {
            productsMap.set(product.id, product);
          });
        }
      }

      // 合并购物车数据和商品信息，并进行库存校验
      const enhancedCartItems: EnhancedCartItem[] = await Promise.all(
        cartItems.map(async (item) => {
          const product = productsMap.get(item.product_id);
          
          // 库存校验
          const stockCheck = await this.checkProductStock(item.product_id, item.quantity);
          
          return {
            ...item,
            product,
            is_valid: stockCheck.isAvailable,
            stock_status: stockCheck.stockStatus,
            error_message: stockCheck.errorMessage
          };
        })
      );

      return enhancedCartItems;
    } catch (err: any) {
      console.error('[CartService] 获取购物车失败:', err);
      return [];
    }
  }

  /**
   * 添加商品到购物车
   */
  async addToCart(
    userId: string,
    productId: string,
    quantity: number = 1,
    specifications?: ProductSpecification[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 检查库存
      const stockCheck = await this.checkProductStock(productId, quantity);
      if (!stockCheck.isAvailable) {
        return {
          success: false,
          error: stockCheck.errorMessage || '商品库存不足'
        };
      }

      // 检查购物车是否已有该商品
      const { data: existingItem } = await supabase
        .from('shopping_carts')
        .select('*')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .limit(1)
        .maybeSingle();

      if (existingItem) {
        // 更新数量
        const { error } = await supabase
          .from('shopping_carts')
          .update({ 
            quantity: existingItem.quantity + quantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingItem.id);

        if (error) throw error;
      } else {
        // 添加新商品
        const { error } = await supabase
          .from('shopping_carts')
          .insert({
            user_id: userId,
            product_id: productId,
            quantity,
            selected: true,
            specifications: specifications || []
          });

        if (error) throw error;
      }

      // 触发同步
      this.updateCartVersion(userId);
      this.emitCartUpdateEvent();

      return { success: true };
    } catch (err: any) {
      console.error('[CartService] 添加商品到购物车失败:', err);
      return {
        success: false,
        error: err.message || '添加商品到购物车失败'
      };
    }
  }

  /**
   * 更新购物车商品
   */
  async updateCartItem(
    cartItemId: string,
    userId: string,
    updates: Partial<CartItem>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('shopping_carts')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', cartItemId);

      if (error) throw error;

      // 触发同步
      this.updateCartVersion(userId);
      this.emitCartUpdateEvent();

      return { success: true };
    } catch (err: any) {
      console.error('[CartService] 更新购物车商品失败:', err);
      return {
        success: false,
        error: err.message || '更新购物车商品失败'
      };
    }
  }

  /**
   * 删除购物车商品
   */
  async removeFromCart(
    cartItemId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('shopping_carts')
        .delete()
        .eq('id', cartItemId);

      if (error) throw error;

      // 触发同步
      this.updateCartVersion(userId);
      this.emitCartUpdateEvent();

      return { success: true };
    } catch (err: any) {
      console.error('[CartService] 删除购物车商品失败:', err);
      return {
        success: false,
        error: err.message || '删除购物车商品失败'
      };
    }
  }

  /**
   * 批量操作 - 批量选择/取消选择
   */
  async batchSelectItems(
    userId: string,
    cartItemIds: string[],
    selected: boolean
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('shopping_carts')
        .update({ 
          selected,
          updated_at: new Date().toISOString()
        })
        .in('id', cartItemIds)
        .eq('user_id', userId);

      if (error) throw error;

      // 触发同步
      this.updateCartVersion(userId);
      this.emitCartUpdateEvent();

      return { success: true };
    } catch (err: any) {
      console.error('[CartService] 批量选择商品失败:', err);
      return {
        success: false,
        error: err.message || '批量选择商品失败'
      };
    }
  }

  /**
   * 批量操作 - 批量删除
   */
  async batchRemoveItems(
    userId: string,
    cartItemIds: string[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('shopping_carts')
        .delete()
        .in('id', cartItemIds)
        .eq('user_id', userId);

      if (error) throw error;

      // 触发同步
      this.updateCartVersion(userId);
      this.emitCartUpdateEvent();

      return { success: true };
    } catch (err: any) {
      console.error('[CartService] 批量删除商品失败:', err);
      return {
        success: false,
        error: err.message || '批量删除商品失败'
      };
    }
  }

  /**
   * 批量操作 - 全选/取消全选
   */
  async selectAllItems(
    userId: string,
    selectAll: boolean
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('shopping_carts')
        .update({ 
          selected: selectAll,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      // 触发同步
      this.updateCartVersion(userId);
      this.emitCartUpdateEvent();

      return { success: true };
    } catch (err: any) {
      console.error('[CartService] 全选商品失败:', err);
      return {
        success: false,
        error: err.message || '全选商品失败'
      };
    }
  }

  /**
   * 检查商品库存
   */
  async checkProductStock(
    productId: string,
    quantity: number
  ): Promise<StockCheckResult> {
    try {
      const { data: product } = await supabase
        .from('products')
        .select('stock, status')
        .eq('id', productId)
        .single();

      if (!product) {
        return {
          productId,
          isAvailable: false,
          stockStatus: 'out_of_stock',
          availableStock: 0,
          requestedQuantity: quantity,
          errorMessage: '商品不存在'
        };
      }

      if (product.status !== 'on_sale') {
        return {
          productId,
          isAvailable: false,
          stockStatus: 'out_of_stock',
          availableStock: 0,
          requestedQuantity: quantity,
          errorMessage: '商品已下架'
        };
      }

      if (product.stock >= quantity) {
        return {
          productId,
          isAvailable: true,
          stockStatus: product.stock <= 10 ? 'low_stock' : 'in_stock',
          availableStock: product.stock,
          requestedQuantity: quantity
        };
      } else if (product.stock > 0) {
        return {
          productId,
          isAvailable: false,
          stockStatus: 'low_stock',
          availableStock: product.stock,
          requestedQuantity: quantity,
          errorMessage: `库存不足，仅剩${product.stock}件`
        };
      } else {
        return {
          productId,
          isAvailable: false,
          stockStatus: 'out_of_stock',
          availableStock: 0,
          requestedQuantity: quantity,
          errorMessage: '商品已售罄'
        };
      }
    } catch (err: any) {
      console.error('[CartService] 检查库存失败:', err);
      return {
        productId,
        isAvailable: false,
        stockStatus: 'out_of_stock',
        availableStock: 0,
        requestedQuantity: quantity,
        errorMessage: '库存检查失败'
      };
    }
  }

  /**
   * 验证优惠券
   */
  async validateCoupon(
    couponCode: string,
    userId: string,
    cartTotal: number,
    productIds?: string[]
  ): Promise<CouponValidationResult> {
    try {
      const now = new Date().toISOString();

      // 获取优惠券
      const { data: coupon } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode)
        .eq('is_active', true)
        .single();

      if (!coupon) {
        return {
          isValid: false,
          discount: 0,
          error: '优惠券不存在或已失效'
        };
      }

      // 检查有效期
      if (coupon.valid_from > now || coupon.valid_until < now) {
        return {
          isValid: false,
          discount: 0,
          error: '优惠券不在有效期内'
        };
      }

      // 检查使用次数限制
      if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
        return {
          isValid: false,
          discount: 0,
          error: '优惠券已领完'
        };
      }

      // 检查最低消费金额
      if (cartTotal < coupon.min_purchase_amount) {
        return {
          isValid: false,
          discount: 0,
          error: `未达到最低消费金额¥${coupon.min_purchase_amount}`
        };
      }

      // 检查适用商品
      if (coupon.applicable_products && coupon.applicable_products.length > 0 && productIds) {
        const hasApplicableProduct = productIds.some(id => 
          coupon.applicable_products?.includes(id)
        );
        if (!hasApplicableProduct) {
          return {
            isValid: false,
            discount: 0,
            error: '优惠券不适用于所选商品'
          };
        }
      }

      // 计算折扣
      let discount = 0;
      if (coupon.discount_type === 'percentage') {
        discount = cartTotal * (coupon.discount_value / 100);
        if (coupon.max_discount_amount) {
          discount = Math.min(discount, coupon.max_discount_amount);
        }
      } else if (coupon.discount_type === 'fixed') {
        discount = coupon.discount_value;
      }

      return {
        isValid: true,
        discount: Math.floor(discount * 100) / 100 // 保留两位小数
      };
    } catch (err: any) {
      console.error('[CartService] 验证优惠券失败:', err);
      return {
        isValid: false,
        discount: 0,
        error: '优惠券验证失败'
      };
    }
  }

  /**
   * 计算购物车统计
   */
  calculateCartStats(
    cartItems: EnhancedCartItem[],
    couponDiscount: number = 0
  ): CartStats {
    // 只统计选中的商品，不过滤 is_valid（缺货商品也允许选中）
    const selectedItems = cartItems.filter(item => item.selected);
    
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const selectedCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
    
    const originalPrice = selectedItems.reduce((sum, item) => {
      const price = item.product?.original_price || item.product?.price || 0;
      return sum + price * item.quantity;
    }, 0);
    
    const totalPrice = selectedItems.reduce((sum, item) => {
      const price = item.product?.price || 0;
      return sum + price * item.quantity;
    }, 0);
    
    const discountAmount = originalPrice - totalPrice + couponDiscount;
    const finalPrice = Math.max(0, totalPrice - couponDiscount);
    
    // 计算可获得的积分（假设每消费 1 元获得 1 积分）
    const pointsEarned = Math.floor(finalPrice);

    return {
      totalItems,
      selectedItems: selectedCount,
      totalPrice,
      originalPrice,
      discountAmount,
      finalPrice,
      pointsEarned
    };
  }

  /**
   * 清空购物车
   */
  async clearCart(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('shopping_carts')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      // 触发同步
      this.updateCartVersion(userId);
      this.emitCartUpdateEvent();

      return { success: true };
    } catch (err: any) {
      console.error('[CartService] 清空购物车失败:', err);
      return {
        success: false,
        error: err.message || '清空购物车失败'
      };
    }
  }

  /**
   * 移入收藏
   */
  async moveToFavorites(
    cartItemId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 获取购物车商品
      const { data: cartItem } = await supabase
        .from('shopping_carts')
        .select('product_id')
        .eq('id', cartItemId)
        .single();

      if (!cartItem) {
        return {
          success: false,
          error: '购物车商品不存在'
        };
      }

      // 添加到收藏
      const { error: favoriteError } = await supabase
        .from('favorites')
        .insert({
          user_id: userId,
          product_id: cartItem.product_id
        });

      if (favoriteError) throw favoriteError;

      // 从购物车删除
      const { error: cartError } = await supabase
        .from('shopping_carts')
        .delete()
        .eq('id', cartItemId);

      if (cartError) throw cartError;

      // 触发同步
      this.updateCartVersion(userId);
      this.emitCartUpdateEvent();

      return { success: true };
    } catch (err: any) {
      console.error('[CartService] 移入收藏失败:', err);
      return {
        success: false,
        error: err.message || '移入收藏失败'
      };
    }
  }
}

// 导出单例实例
const cartService = new CartService();
export default cartService;
