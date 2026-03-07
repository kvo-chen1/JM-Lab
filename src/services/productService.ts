/**
 * 商品服务 - 管理文创商城商品
 */
import { supabase, supabaseAdmin } from '@/lib/supabase';

// 商品分类类型
export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  sort_order: number;
  is_active: boolean;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

// 商品类型定义
export interface Product {
  id: string;
  seller_id: string;
  brand_id?: string;
  ip_asset_id?: string;
  category_id?: string;
  name: string;
  description?: string;
  short_description?: string;
  category?: string;
  price: number;
  original_price?: number;
  stock: number;
  sold_count: number;
  images: string[];
  cover_image?: string;
  specifications?: ProductSpecification[];
  status: 'pending' | 'approved' | 'on_sale' | 'off_shelf' | 'sold_out';
  is_featured: boolean;
  is_hot: boolean;
  is_new: boolean;
  tags: string[];
  weight?: number;
  shipping_fee: number;
  view_count: number;
  created_at: string;
  updated_at: string;
  // 关联数据
  brand?: {
    id: string;
    name: string;
    logo?: string;
  };
  category_info?: ProductCategory;
  average_rating?: number;
  review_count?: number;
}

// 商品规格类型
export interface ProductSpecification {
  name: string;
  value: string;
}

// 购物车项类型
export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  selected: boolean;
  specifications?: ProductSpecification[];
  created_at: string;
  updated_at: string;
  // 关联数据
  product?: Product;
}

// 商品评价类型
export interface ProductReview {
  id: string;
  product_id: string;
  order_id: string;
  user_id: string;
  rating: number;
  content?: string;
  images?: string[];
  is_anonymous: boolean;
  is_recommended: boolean;
  reply_content?: string;
  reply_at?: string;
  is_visible: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
  // 关联数据
  user?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

// 获取商品分类列表
export async function getProductCategories(
  parentId?: string
): Promise<{ data?: ProductCategory[]; error?: string }> {
  try {
    let query = supabase
      .from('product_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (parentId) {
      query = query.eq('parent_id', parentId);
    } else {
      query = query.is('parent_id', null);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { data: data || [] };
  } catch (err: any) {
    console.error('获取商品分类失败:', err);
    return { error: err.message || '获取商品分类失败' };
  }
}

// 获取商品列表
export async function getProducts(
  options: {
    categoryId?: string;
    brandId?: string;
    status?: string;
    isFeatured?: boolean;
    isHot?: boolean;
    isNew?: boolean;
    minPrice?: number;
    maxPrice?: number;
    searchQuery?: string;
    sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'popular' | 'sales';
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ data?: Product[]; count?: number; error?: string }> {
  try {
    let query = supabase.from('product_details').select('*', { count: 'exact' });

    if (options.categoryId) {
      query = query.eq('category_id', options.categoryId);
    }

    if (options.brandId) {
      query = query.eq('brand_id', options.brandId);
    }

    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.isFeatured) {
      query = query.eq('is_featured', true);
    }

    if (options.isHot) {
      query = query.eq('is_hot', true);
    }

    if (options.isNew) {
      query = query.eq('is_new', true);
    }

    if (options.minPrice !== undefined) {
      query = query.gte('price', options.minPrice);
    }

    if (options.maxPrice !== undefined) {
      query = query.lte('price', options.maxPrice);
    }

    if (options.searchQuery) {
      query = query.or(`name.ilike.%${options.searchQuery}%,description.ilike.%${options.searchQuery}%`);
    }

    // 排序
    if (options.sortBy) {
      switch (options.sortBy) {
        case 'price_asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('price', { ascending: false });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'popular':
          query = query.order('view_count', { ascending: false });
          break;
        case 'sales':
          query = query.order('sold_count', { ascending: false });
          break;
      }
    } else {
      query = query.order('created_at', { ascending: false });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) throw error;
    return { data: data || [], count: count || 0 };
  } catch (err: any) {
    console.error('获取商品列表失败:', err);
    return { error: err.message || '获取商品列表失败' };
  }
}

// 获取商品详情
export async function getProductById(id: string): Promise<{ data?: Product; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('product_details')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    // 增加浏览量
    await supabase.rpc('increment_product_view', { product_id: id });

    return { data };
  } catch (err: any) {
    console.error('获取商品详情失败:', err);
    return { error: err.message || '获取商品详情失败' };
  }
}

// 创建商品
export async function createProduct(
  productData: Omit<Product, 'id' | 'sold_count' | 'view_count' | 'created_at' | 'updated_at'>
): Promise<{ data?: Product; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert({
        ...productData,
        sold_count: 0,
        view_count: 0,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return { data };
  } catch (err: any) {
    console.error('创建商品失败:', err);
    return { error: err.message || '创建商品失败' };
  }
}

// 更新商品
export async function updateProduct(
  id: string,
  updates: Partial<Product>
): Promise<{ data?: Product; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data };
  } catch (err: any) {
    console.error('更新商品失败:', err);
    return { error: err.message || '更新商品失败' };
  }
}

// 删除商品
export async function deleteProduct(id: string): Promise<{ error?: string }> {
  try {
    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) throw error;
    return {};
  } catch (err: any) {
    console.error('删除商品失败:', err);
    return { error: err.message || '删除商品失败' };
  }
}

// 获取购物车
export async function getCart(userId: string): Promise<{ data?: CartItem[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('shopping_carts')
      .select(
        `
        *,
        product:products(*, brand:brands(id, name, logo))
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [] };
  } catch (err: any) {
    console.error('获取购物车失败:', err);
    return { error: err.message || '获取购物车失败' };
  }
}

// 添加商品到购物车
export async function addToCart(
  userId: string,
  productId: string,
  quantity: number = 1,
  specifications?: ProductSpecification[]
): Promise<{ data?: CartItem; error?: string }> {
  try {
    // 检查购物车是否已有该商品
    const { data: existingItem } = await supabase
      .from('shopping_carts')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .maybeSingle();

    if (existingItem) {
      // 更新数量
      const { data, error } = await supabase
        .from('shopping_carts')
        .update({ quantity: existingItem.quantity + quantity })
        .eq('id', existingItem.id)
        .select()
        .single();

      if (error) throw error;
      return { data };
    } else {
      // 创建新购物车项
      const { data, error } = await supabase
        .from('shopping_carts')
        .insert({
          user_id: userId,
          product_id: productId,
          quantity,
          specifications,
          selected: true,
        })
        .select()
        .single();

      if (error) throw error;
      return { data };
    }
  } catch (err: any) {
    console.error('添加商品到购物车失败:', err);
    return { error: err.message || '添加商品到购物车失败' };
  }
}

// 更新购物车商品
export async function updateCartItem(
  cartItemId: string,
  updates: Partial<CartItem>
): Promise<{ data?: CartItem; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('shopping_carts')
      .update(updates)
      .eq('id', cartItemId)
      .select()
      .single();

    if (error) throw error;
    return { data };
  } catch (err: any) {
    console.error('更新购物车商品失败:', err);
    return { error: err.message || '更新购物车商品失败' };
  }
}

// 删除购物车商品
export async function removeFromCart(cartItemId: string): Promise<{ error?: string }> {
  try {
    const { error } = await supabase.from('shopping_carts').delete().eq('id', cartItemId);

    if (error) throw error;
    return {};
  } catch (err: any) {
    console.error('删除购物车商品失败:', err);
    return { error: err.message || '删除购物车商品失败' };
  }
}

// 清空购物车
export async function clearCart(userId: string): Promise<{ error?: string }> {
  try {
    const { error } = await supabase.from('shopping_carts').delete().eq('user_id', userId);

    if (error) throw error;
    return {};
  } catch (err: any) {
    console.error('清空购物车失败:', err);
    return { error: err.message || '清空购物车失败' };
  }
}

// 获取商品评价
export async function getProductReviews(
  productId: string,
  options: {
    limit?: number;
    offset?: number;
    rating?: number;
  } = {}
): Promise<{ data?: ProductReview[]; count?: number; error?: string }> {
  try {
    let query = supabase
      .from('product_reviews')
      .select(
        `
        *,
        user:user_id(id, username, avatar_url)
      `,
        { count: 'exact' }
      )
      .eq('product_id', productId)
      .eq('is_visible', true);

    if (options.rating) {
      query = query.eq('rating', options.rating);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error, count } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], count: count || 0 };
  } catch (err: any) {
    console.error('获取商品评价失败:', err);
    return { error: err.message || '获取商品评价失败' };
  }
}

// 创建商品评价
export async function createProductReview(
  reviewData: Omit<ProductReview, 'id' | 'is_visible' | 'helpful_count' | 'created_at' | 'updated_at'>
): Promise<{ data?: ProductReview; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('product_reviews')
      .insert({
        ...reviewData,
        is_visible: true,
        helpful_count: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return { data };
  } catch (err: any) {
    console.error('创建商品评价失败:', err);
    return { error: err.message || '创建商品评价失败' };
  }
}

// 获取用户收藏
export async function getUserFavorites(userId: string): Promise<{ data?: Product[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('user_favorites')
      .select(
        `
        product:products(*, brand:brands(id, name, logo))
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data?.map((item: any) => item.product) || [] };
  } catch (err: any) {
    console.error('获取用户收藏失败:', err);
    return { error: err.message || '获取用户收藏失败' };
  }
}

// 添加收藏
export async function addToFavorites(userId: string, productId: string): Promise<{ error?: string }> {
  try {
    const { error } = await supabase.from('user_favorites').insert({
      user_id: userId,
      product_id: productId,
    });

    if (error) throw error;
    return {};
  } catch (err: any) {
    console.error('添加收藏失败:', err);
    return { error: err.message || '添加收藏失败' };
  }
}

// 取消收藏
export async function removeFromFavorites(
  userId: string,
  productId: string
): Promise<{ error?: string }> {
  try {
    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);

    if (error) throw error;
    return {};
  } catch (err: any) {
    console.error('取消收藏失败:', err);
    return { error: err.message || '取消收藏失败' };
  }
}

// 检查是否已收藏
export async function checkIsFavorite(
  userId: string,
  productId: string
): Promise<{ isFavorite: boolean }> {
  try {
    const { data, error } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .maybeSingle();

    if (error) throw error;
    return { isFavorite: !!data };
  } catch (err) {
    console.error('检查收藏状态失败:', err);
    return { isFavorite: false };
  }
}

// 管理员：审核商品
export async function adminReviewProduct(
  productId: string,
  status: 'approved' | 'rejected'
): Promise<{ data?: Product; error?: string }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .update({
        status: status === 'approved' ? 'on_sale' : 'rejected',
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId)
      .select()
      .single();

    if (error) throw error;
    return { data };
  } catch (err: any) {
    console.error('审核商品失败:', err);
    return { error: err.message || '审核商品失败' };
  }
}

// 管理员：获取所有商品
export async function adminGetAllProducts(
  options: {
    status?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ data?: Product[]; count?: number; error?: string }> {
  try {
    let query = supabaseAdmin
      .from('products')
      .select('*, brand:brands(id, name, logo)', { count: 'exact' });

    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error, count } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], count: count || 0 };
  } catch (err: any) {
    console.error('获取所有商品失败:', err);
    return { error: err.message || '获取所有商品失败' };
  }
}

export default {
  getProductCategories,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getProductReviews,
  createProductReview,
  getUserFavorites,
  addToFavorites,
  removeFromFavorites,
  checkIsFavorite,
  adminReviewProduct,
  adminGetAllProducts,
};
