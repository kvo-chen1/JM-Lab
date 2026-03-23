/**
 * 商品服务 - 管理文创商城商品
 */
import { supabase, supabaseAdmin as originalSupabaseAdmin } from '@/lib/supabase';

// 浏览器环境中使用普通 supabase 客户端替代 supabaseAdmin
// Service Role Key 不能在浏览器中使用
const supabaseAdmin = typeof window !== 'undefined' ? supabase : originalSupabaseAdmin;

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
  status: 'pending' | 'approved' | 'on_sale' | 'off_shelf' | 'sold_out' | 'active' | 'inactive';
  is_featured: boolean;
  is_hot: boolean;
  is_new: boolean;
  tags: string[];
  weight?: number;
  shipping_fee: number;
  view_count: number;
  created_at: string;
  updated_at: string;
  // 积分商城专用字段（用于积分兑换）
  points?: number;
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

// 兑换记录类型
export interface ExchangeRecord {
  id: string;
  product_id: string;
  user_id: string;
  quantity: number;
  points_used: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  shipping_address?: string;
  tracking_number?: string;
  created_at: string;
  updated_at: string;
  // 关联数据
  product?: Product;
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
    console.log('[getProducts] 开始查询，参数:', options);
    let query = supabase.from('products').select('*', { count: 'exact' });

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
      // 转义特殊字符，防止 SQL 注入或查询错误
      const escapedQuery = options.searchQuery
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_');
      console.log('[getProducts] 搜索查询:', escapedQuery);
      query = query.or(`name.ilike.%${escapedQuery}%,description.ilike.%${escapedQuery}%`);
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
          query = query.order('sales_count', { ascending: false });
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

// 获取商家商品列表（用于文创商城）
export async function getMerchantProducts(
  options: {
    categoryId?: string;
    merchantId?: string;
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
    let query = supabase.from('products').select('*', { count: 'exact' });

    if (options.categoryId) {
      query = query.eq('category_id', options.categoryId);
    }

    if (options.merchantId) {
      query = query.eq('merchant_id', options.merchantId);
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
      // 转义特殊字符，防止 SQL 注入或查询错误
      const escapedQuery = options.searchQuery
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_');
      console.log('[getMerchantProducts] 搜索查询:', escapedQuery);
      query = query.or(`name.ilike.%${escapedQuery}%,description.ilike.%${escapedQuery}%`);
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

    console.log('[getMerchantProducts] 查询结果:', { dataLength: data?.length, error, count });
    
    // 调试输出每个商品的图片信息
    if (data && data.length > 0) {
      data.forEach((p: any, i: number) => {
        console.log(`[getMerchantProducts] 商品 ${i + 1} [${p.name}]:`, {
          cover_image: p.cover_image,
          images: p.images,
          cover_image_type: typeof p.cover_image,
          images_type: typeof p.images
        });
      });
    }

    if (error) throw error;
    return { data: data || [], count: count || 0 };
  } catch (err: any) {
    console.error('[getMerchantProducts] 获取失败:', err);
    return { error: err.message || '获取商家商品列表失败' };
  }
}

// 获取商品详情
export async function getProductById(id: string): Promise<{ data?: Product; error?: string }> {
  try {
    console.log('[getProductById] 开始获取商品详情:', id);
    
    // 首先尝试从 products 表获取
    let { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    // 如果获取成功，再单独获取品牌信息
    if (data && !error) {
      try {
        const { data: brandData } = await supabase
          .from('brands')
          .select('id, name, logo')
          .eq('id', data.brand_id)
          .single();
        if (brandData) {
          data.brand = brandData;
        }
      } catch (brandErr) {
        // 忽略品牌查询错误
      }
    }

    console.log('[getProductById] products 表查询结果:', { data, error });

    // 如果返回的是数组，取第一个元素
    if (Array.isArray(data)) {
      console.warn('[getProductById] 返回的是数组，取第一个元素');
      data = data[0];
    }

    if (error || !data) {
      console.warn('[getProductById] 从 products 表获取失败或数据为空:', error);
      
      // 如果失败，尝试从 product_details 视图获取（如果存在）
      let { data: detailsData, error: detailsError } = await supabase
        .from('product_details')
        .select('*')
        .eq('id', id)
        .single();
      
      console.log('[getProductById] product_details 查询结果:', { detailsData, detailsError });
      
      // 如果返回的是数组，取第一个元素
      if (Array.isArray(detailsData)) {
        console.warn('[getProductById] product_details 返回的是数组，取第一个元素');
        detailsData = detailsData[0];
      }
      
      if (detailsError || !detailsData) {
        console.error('[getProductById] 所有查询都失败:', detailsError);
        return { error: '商品不存在或已下架' };
      }
      
      // 增加浏览量
      try {
        await supabase.rpc('increment_product_view', { product_id: id });
      } catch (viewErr) {
        // 忽略浏览量更新错误
      }
      
      return { data: detailsData };
    }

    // 增加浏览量
    try {
      await supabase.rpc('increment_product_view', { product_id: id });
    } catch (viewErr) {
      // 忽略浏览量更新错误
    }

    return { data };
  } catch (err: any) {
    console.error('[getProductById] 获取商品详情失败:', err);
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
    // 首先获取购物车数据
    const { data: cartItems, error: cartError } = await supabase
      .from('shopping_carts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (cartError) throw cartError;

    if (!cartItems || cartItems.length === 0) {
      return { data: [] };
    }

    // 获取所有商品ID
    const productIds = cartItems.map(item => item.product_id).filter(Boolean);

    // 批量获取商品信息
    const productsMap = new Map();
    if (productIds.length > 0) {
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds);

      if (productsError) {
        console.warn('获取商品信息失败:', productsError);
      } else {
        // 获取所有品牌ID
        const brandIds = [...new Set(products?.map((p: any) => p.brand_id).filter(Boolean) || [])];
        const brandsMap = new Map();
        if (brandIds.length > 0) {
          const { data: brands } = await supabase
            .from('brands')
            .select('id, name, logo')
            .in('id', brandIds);
          brands?.forEach((brand: any) => brandsMap.set(brand.id, brand));
        }
        
        // 组装商品和品牌信息
        products?.forEach((product: any) => {
          if (product.brand_id) {
            product.brand = brandsMap.get(product.brand_id);
          }
          productsMap.set(product.id, product);
        });
      }
    }

    // 组装购物车数据
    const data: CartItem[] = cartItems.map(item => ({
      ...item,
      product: productsMap.get(item.product_id) || undefined
    }));

    return { data };
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
      .limit(1)
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
    // 简化查询，避免外键关联语法错误
    let query = supabase
      .from('product_reviews')
      .select('*', { count: 'exact' })
      .eq('product_id', productId);

    // 如果存在 is_visible 列，添加筛选
    try {
      query = query.eq('is_visible', true);
    } catch (e) {
      // 列不存在，忽略
    }

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

    if (error) {
      console.error('[getProductReviews] 查询失败:', error);
      throw error;
    }
    
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
    // 先获取用户的收藏列表 - 使用 * 获取所有列，避免列名不匹配问题
    const { data: favorites, error: favoritesError } = await supabase
      .from('user_favorites')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (favoritesError) {
      console.error('[getUserFavorites] 查询收藏失败:', favoritesError);
      throw favoritesError;
    }
    
    if (!favorites || favorites.length === 0) {
      return { data: [] };
    }

    // 获取所有收藏的产品ID - 兼容不同的列名
    const productIds = favorites.map((f: any) => f.product_id || f.productId || f.product).filter(Boolean);
    
    if (productIds.length === 0) {
      console.warn('[getUserFavorites] 未找到有效的产品ID:', favorites);
      return { data: [] };
    }

    // 单独查询产品详情
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds);

    if (productsError) throw productsError;

    // 获取所有品牌ID
    const brandIds = [...new Set(products?.map((p: any) => p.brand_id).filter(Boolean) || [])];
    const brandsMap = new Map();
    if (brandIds.length > 0) {
      const { data: brands } = await supabase
        .from('brands')
        .select('id, name, logo')
        .in('id', brandIds);
      brands?.forEach((brand: any) => brandsMap.set(brand.id, brand));
    }

    // 组装商品和品牌信息
    const productsWithBrand = products?.map((product: any) => {
      if (product.brand_id) {
        product.brand = brandsMap.get(product.brand_id);
      }
      return product;
    });

    // 按照收藏顺序排序产品
    const productMap = new Map(productsWithBrand?.map((p: any) => [p.id, p]) || []);
    const sortedProducts = productIds
      .map((id: string) => productMap.get(id))
      .filter((p): p is Product => p !== undefined);

    return { data: sortedProducts };
  } catch (err: any) {
    console.error('获取用户收藏失败:', err);
    return { error: err.message || '获取用户收藏失败' };
  }
}

// 添加收藏
export async function addToFavorites(userId: string, productId: string): Promise<{ error?: string }> {
  try {
    // 尝试使用 product_id 列名插入
    const { error } = await supabase.from('user_favorites').insert({
      user_id: userId,
      product_id: productId,
    });

    if (error) {
      // 如果失败，可能是列名不同，尝试其他常见列名
      console.warn('[addToFavorites] 使用 product_id 失败，尝试其他列名:', error);
      
      // 尝试 productId (camelCase)
      const { error: error2 } = await supabase.from('user_favorites').insert({
        user_id: userId,
        productId: productId,
      });
      
      if (error2) {
        console.error('[addToFavorites] 所有列名尝试失败:', error2);
        throw error2;
      }
    }
    
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
    // 先查询获取实际的记录ID
    const { data: favorites, error: queryError } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', userId);
    
    if (queryError) throw queryError;
    
    // 找到匹配 product_id 的记录
    const favorite = favorites?.find((f: any) => 
      f.product_id === productId || f.productId === productId || f.product === productId
    );
    
    if (!favorite) {
      console.warn('[removeFromFavorites] 未找到收藏记录:', { userId, productId });
      return {}; // 记录不存在，视为成功删除
    }
    
    // 使用ID删除
    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('id', favorite.id);

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
    const { data: favorites, error } = await supabase
      .from('user_favorites')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    
    // 检查是否有匹配的记录
    const isFavorite = favorites?.some((f: any) => 
      f.product_id === productId || f.productId === productId || f.product === productId
    ) || false;
    
    return { isFavorite };
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

// 积分商城商品类型
export interface PointsProduct {
  id: string;
  name: string;
  description?: string;
  points: number;
  stock: number;
  category: 'virtual' | 'physical' | 'service' | 'rights' | 'experience';
  image_url?: string;
  imageUrl?: string; // 前端兼容字段
  tags: string[];
  status: 'active' | 'inactive' | 'sold_out';
  is_featured: boolean;
  isFeatured?: boolean; // 前端兼容字段
  is_limited: boolean;
  limit_per_user: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// 获取所有积分商城商品
export async function getAllProducts(
  category?: string,
  searchQuery?: string
): Promise<PointsProduct[]> {
  try {
    let query = supabase
      .from('points_products')
      .select('*')
      .order('sort_order', { ascending: true });

    // 如果指定了分类，筛选分类
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    // 如果指定了搜索词，搜索商品名称和描述
    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    // 映射字段以兼容前端
    return (data || []).map(product => ({
      ...product,
      imageUrl: product.image_url,
      isFeatured: product.is_featured,
      tags: Array.isArray(product.tags) ? product.tags : [],
      // 状态映射：数据库的 active/inactive/sold_out 映射为前端的 on_sale/off_shelf/sold_out
      status: product.status === 'active' ? 'on_sale' : product.status === 'inactive' ? 'off_shelf' : product.status,
    }));
  } catch (error) {
    console.error('获取积分商城商品失败:', error);
    return [];
  }
}

// 兑换商品
export async function exchangeProduct(productId: string, userId: string, quantity: number = 1): Promise<{ success: boolean; errorMessage?: string; data?: any }> {
  try {
    // 调用数据库 RPC 函数兑换商品
    const { data, error } = await supabase.rpc('exchange_product', {
      p_user_id: userId,
      p_product_id: productId,
      p_quantity: quantity
    });
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error: any) {
    console.error('兑换商品失败:', error);
    return { success: false, errorMessage: error.message || '兑换失败' };
  }
}

// 获取用户兑换记录
export async function getUserExchangeRecords(userId: string): Promise<ExchangeRecord[]> {
  try {
    const { data, error } = await supabase
      .from('exchange_records')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('获取兑换记录失败:', error);
    return [];
  }
}

// 订单统计接口
export interface OrderStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  cancelled: number;
  refunded: number;
  totalPoints: number;
  todayOrders: number;
}

// 获取订单统计
export async function getOrderStats(): Promise<OrderStats> {
  try {
    const today = new Date().toISOString().split('T')[0];

    // 获取各种状态的订单数量
    const { data: allOrders, error } = await supabase
      .from('exchange_records')
      .select('status, points_cost, created_at');

    if (error) throw error;

    const orders = allOrders || [];
    const todayOrders = orders.filter(o => o.created_at?.startsWith(today));

    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      processing: orders.filter(o => o.status === 'processing').length,
      completed: orders.filter(o => o.status === 'completed').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      refunded: orders.filter(o => o.status === 'refunded').length,
      totalPoints: orders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + (o.points_cost || 0), 0),
      todayOrders: todayOrders.length
    };
  } catch (error) {
    console.error('获取订单统计失败:', error);
    return {
      total: 0,
      pending: 0,
      processing: 0,
      completed: 0,
      cancelled: 0,
      refunded: 0,
      totalPoints: 0,
      todayOrders: 0
    };
  }
}

// 获取所有兑换记录（带分页和筛选）
export async function getAllExchangeRecords(options: {
  status?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<{ records: any[]; total: number }> {
  try {
    let query = supabase
      .from('exchange_records')
      .select('*', { count: 'exact' });

    if (options.status) {
      query = query.eq('status', options.status);
    }

    query = query.order('created_at', { ascending: false });

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset !== undefined && options.limit) {
      query = query.range(options.offset, options.offset + options.limit - 1);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    // 转换记录格式以匹配前端期望
    const records = (data || []).map(record => ({
      id: record.id,
      productId: record.product_id,
      productName: record.product_name || '未知商品',
      userId: record.user_id,
      userName: record.user_name || '未知用户',
      points: record.points,
      quantity: record.quantity || 1,
      status: record.status,
      date: record.created_at,
      productImage: record.product_image,
      userEmail: record.user_email,
      contactPhone: record.contact_phone,
      shippingAddress: record.shipping_address,
      adminNotes: record.admin_notes,
      processedAt: record.processed_at,
      processedBy: record.processed_by
    }));

    return {
      records,
      total: count || 0
    };
  } catch (error) {
    console.error('获取所有兑换记录失败:', error);
    return { records: [], total: 0 };
  }
}

// 获取销售趋势
export async function getSalesTrend(days: number = 7): Promise<{ date: string; count: number; points: number }[]> {
  try {
    const result: { date: string; count: number; points: number }[] = [];

    // 生成最近N天的日期
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // 查询该日期的订单
      const { data, error } = await supabase
        .from('exchange_records')
        .select('points_cost, status')
        .gte('created_at', `${dateStr}T00:00:00`)
        .lt('created_at', `${dateStr}T23:59:59`);

      if (error) throw error;

      const orders = data || [];
      result.push({
        date: dateStr,
        count: orders.length,
        points: orders
          .filter(o => o.status === 'completed')
          .reduce((sum, o) => sum + (o.points_cost || 0), 0)
      });
    }

    return result;
  } catch (error) {
    console.error('获取销售趋势失败:', error);
    return [];
  }
}

// 获取热销商品
export async function getTopSellingProducts(limit: number = 5): Promise<{
  productId: string;
  productName: string;
  productImage: string;
  points: number;
  totalSold: number;
}[]> {
  try {
    // 查询兑换记录并按商品分组统计
    const { data, error } = await supabase
      .from('exchange_records')
      .select('product_id, product_name, product_image, points_cost, quantity, status')
      .eq('status', 'completed');

    if (error) throw error;

    // 按商品分组统计
    const productMap = new Map<string, {
      productId: string;
      productName: string;
      productImage: string;
      points: number;
      totalSold: number;
    }>();

    (data || []).forEach(record => {
      const id = record.product_id;
      if (productMap.has(id)) {
        const item = productMap.get(id)!;
        item.totalSold += record.quantity || 1;
      } else {
        productMap.set(id, {
          productId: id,
          productName: record.product_name || '未知商品',
          productImage: record.product_image || '',
          points: record.points_cost || 0,
          totalSold: record.quantity || 1
        });
      }
    });

    // 转换为数组并按销量排序
    return Array.from(productMap.values())
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, limit);
  } catch (error) {
    console.error('获取热销商品失败:', error);
    return [];
  }
}

// 添加积分商城商品
export async function addProduct(productData: Partial<PointsProduct>): Promise<PointsProduct | null> {
  try {
    const dbData = {
      name: productData.name,
      description: productData.description,
      points: productData.points || 0,
      stock: productData.stock || 0,
      category: productData.category || 'physical',
      image_url: productData.imageUrl || productData.image_url,
      tags: productData.tags || [],
      // 状态映射：前端的 on_sale/off_shelf/sold_out 映射为数据库的 active/inactive/sold_out
      status: productData.status === 'on_sale' ? 'active' : productData.status === 'off_shelf' ? 'inactive' : productData.status,
      is_featured: productData.isFeatured || productData.is_featured || false,
      is_limited: productData.is_limited || false,
      limit_per_user: productData.limit_per_user || 0,
      sort_order: productData.sort_order || 0,
    };

    const { data, error } = await supabase
      .from('points_products')
      .insert(dbData)
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      imageUrl: data.image_url,
      isFeatured: data.is_featured,
      tags: Array.isArray(data.tags) ? data.tags : [],
    };
  } catch (error) {
    console.error('添加积分商城商品失败:', error);
    return null;
  }
}

// 更新积分商城商品
export async function updatePointsProduct(
  id: string,
  updates: Partial<PointsProduct>
): Promise<PointsProduct | null> {
  try {
    const dbData: any = {};

    if (updates.name !== undefined) dbData.name = updates.name;
    if (updates.description !== undefined) dbData.description = updates.description;
    if (updates.points !== undefined) dbData.points = updates.points;
    if (updates.stock !== undefined) dbData.stock = updates.stock;
    if (updates.category !== undefined) dbData.category = updates.category;
    if (updates.imageUrl !== undefined || updates.image_url !== undefined) {
      dbData.image_url = updates.imageUrl || updates.image_url;
    }
    if (updates.tags !== undefined) dbData.tags = updates.tags;
    // 状态映射：前端的 on_sale/off_shelf/sold_out 映射为数据库的 active/inactive/sold_out
    if (updates.status !== undefined) {
      dbData.status = updates.status === 'on_sale' ? 'active' : updates.status === 'off_shelf' ? 'inactive' : updates.status;
    }
    if (updates.isFeatured !== undefined || updates.is_featured !== undefined) {
      dbData.is_featured = updates.isFeatured || updates.is_featured;
    }
    if (updates.is_limited !== undefined) dbData.is_limited = updates.is_limited;
    if (updates.limit_per_user !== undefined) dbData.limit_per_user = updates.limit_per_user;
    if (updates.sort_order !== undefined) dbData.sort_order = updates.sort_order;

    const { data, error } = await supabase
      .from('points_products')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      imageUrl: data.image_url,
      isFeatured: data.is_featured,
      tags: Array.isArray(data.tags) ? data.tags : [],
    };
  } catch (error) {
    console.error('更新积分商城商品失败:', error);
    return null;
  }
}

// 更新订单状态
export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
  adminNotes?: string,
  processedBy?: string
): Promise<boolean> {
  try {
    const updates: any = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (adminNotes) {
      updates.admin_notes = adminNotes;
    }

    if (processedBy) {
      updates.processed_by = processedBy;
    }

    if (newStatus === 'completed' || newStatus === 'processing') {
      updates.processed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('exchange_records')
      .update(updates)
      .eq('id', orderId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('更新订单状态失败:', error);
    return false;
  }
}

// 删除积分商城商品
export async function deletePointsProduct(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('points_products')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('删除积分商城商品失败:', error);
    return false;
  }
}

// 平台统计数据接口
export interface PlatformStats {
  totalWorks: number;      // 总作品数
  totalCreators: number;   // 创作者数
  activeUsers: number;     // 今日活跃用户数
  totalViews: number;      // 总浏览量
}

// 获取平台统计数据
export async function getPlatformStats(): Promise<PlatformStats> {
  try {
    // 获取总作品数（从 posts 表，状态为 published）
    const { count: worksCount, error: worksError } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');

    if (worksError) {
      console.error('获取作品数量失败:', worksError);
    }

    // 获取创作者数量（从 users 表，有发布过作品的）
    const { count: creatorsCount, error: creatorsError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (creatorsError) {
      console.error('获取创作者数量失败:', creatorsError);
    }

    // 获取最近7天活跃用户数（从 user_activities 表，7天内有活动的）
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    const { count: activeCount, error: activeError } = await supabase
      .from('user_activities')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString());

    if (activeError) {
      console.error('获取活跃用户数量失败:', activeError);
    }

    // 获取总浏览量（从 posts 表的 views 字段汇总）
    const { data: viewsData, error: viewsError } = await supabase
      .from('posts')
      .select('views');

    if (viewsError) {
      console.error('获取浏览量数据失败:', viewsError);
    }

    const totalViewsCount = viewsData?.reduce((sum, post) => sum + (post.views || 0), 0) || 0;

    // 使用实际获取到的数据或回退方案
    const finalWorksCount = worksCount ?? 0;
    const finalCreatorsCount = creatorsCount ?? 0;
    const finalActiveCount = activeCount ?? 0;

    console.log('平台统计数据:', {
      totalWorks: finalWorksCount,
      totalCreators: finalCreatorsCount,
      activeUsers: finalActiveCount,
      totalViews: totalViewsCount,
    });

    return {
      totalWorks: finalWorksCount,
      totalCreators: finalCreatorsCount,
      activeUsers: finalActiveCount,
      totalViews: totalViewsCount,
    };
  } catch (error) {
    console.error('获取平台统计数据失败:', error);
    // 返回默认值
    return {
      totalWorks: 0,
      totalCreators: 0,
      activeUsers: 0,
      totalViews: 0,
    };
  }
}

export default {
  getProductCategories,
  getProducts,
  getMerchantProducts,
  getAllProducts,
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
  exchangeProduct,
  getUserExchangeRecords,
  getOrderStats,
  getAllExchangeRecords,
  getSalesTrend,
  getTopSellingProducts,
  addProduct,
  updateOrderStatus,
  updatePointsProduct,
  deletePointsProduct,
  getPlatformStats,
};
